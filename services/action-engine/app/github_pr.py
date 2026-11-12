import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
from github import Github, GithubException

from app.config import settings
from app.kill_switch import KillSwitchResult

logger = logging.getLogger("cirra.action_engine.github_pr")


@dataclass
class PRResult:
    pr_url: str
    pr_number: int
    branch_name: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    mocked: bool = False
    error: Optional[str] = None
    file_path: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "pr_url": self.pr_url,
            "pr_number": self.pr_number,
            "branch_name": self.branch_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "mocked": self.mocked,
            "error": self.error,
            "file_path": self.file_path,
        }


class GitHubPREngine:
    def __init__(self):
        self.token = settings.GITHUB_TOKEN
        self.repo_owner = settings.GITHUB_DEMO_REPO_OWNER
        self.repo_name = settings.GITHUB_DEMO_REPO_NAME
        self.g = Github(self.token) if self.token else None

    async def create_anomaly_pr(
        self,
        anomaly: dict,
        action: dict,
        kill_switch_result: Optional[KillSwitchResult] = None,
    ) -> PRResult:
        """
        If no GITHUB_TOKEN or dry-run/mock:
          Return simulated PRResult(
            pr_url="https://github.com/...",
            pr_number=1,
            branch_name="...",
            created_at=datetime.utcnow()
          )
        Otherwise create branch, write markdown file terraform/anomaly-reports/{anomaly_id}.md,
        and open PR with specified labels.
        """
        anomaly_id = str(anomaly.get("id") or "anomaly-demo")
        short_id = anomaly_id[:8]
        branch_name = f"cirra/anomaly-remediation-{short_id}-{int(time.time())}"
        file_path = f"terraform/anomaly-reports/{anomaly_id}.md"

        is_mock = settings.INGEST_MOCK or not self.token or not self.g
        if is_mock:
            logger.info(
                "MOCK: creating simulated GitHub PR for anomaly %s on %s/%s",
                anomaly_id,
                self.repo_owner,
                self.repo_name,
            )
            mock_url = f"https://github.com/{self.repo_owner}/{self.repo_name}/pull/1"
            return PRResult(
                pr_url=mock_url,
                pr_number=1,
                branch_name=branch_name,
                created_at=datetime.now(timezone.utc),
                mocked=True,
                file_path=file_path,
            )

        logger.info(
            "Creating real GitHub PR on %s/%s for anomaly %s",
            self.repo_owner,
            self.repo_name,
            anomaly_id,
        )
        try:
            repo = self.g.get_repo(f"{self.repo_owner}/{self.repo_name}")
            default_branch_name = repo.default_branch or "main"
            default_branch = repo.get_branch(default_branch_name)

            # Create branch from default branch head sha
            repo.create_git_ref(
                ref=f"refs/heads/{branch_name}",
                sha=default_branch.commit.sha,
            )

            # Prepare recommendation markdown file
            provider = anomaly.get("provider", "AI/Cloud")
            severity = str(anomaly.get("severity", "medium")).upper()
            baseline = anomaly.get("baseline_value", "0.00")
            actual = anomaly.get("actual_value", "0.00")
            deviation = anomaly.get("deviation_pct", "0.0")
            explanation = anomaly.get("explanation", "Cost anomaly detected by Cirra Sentinel.")
            key_id = anomaly.get("api_key_id") or action.get("target_key_id") or "N/A"
            action_type = action.get("type", "kill_switch")

            ks_line = ""
            if kill_switch_result:
                status_str = "SUCCESS" if kill_switch_result.success else ("MANUAL REQUIRED" if kill_switch_result.requires_manual else "FAILED")
                ks_line = f"- **Kill Switch Status:** `{status_str}` — {kill_switch_result.message}\n"

            md_content = f"""# Cirra Cost Anomaly Remediation Report

**Anomaly ID:** `{anomaly_id}`  
**Detected At:** `{anomaly.get('detected_at') or datetime.now(timezone.utc).isoformat()}`  
**Severity:** `{severity}`  
**Provider:** `{provider}`  
**Target Resource / Key:** `{key_id}`  

## Spend Summary
- **Baseline Run-Rate:** `${baseline}`
- **Actual / Spike Spend:** `${actual}`
- **Deviation:** `{deviation}%`

## Detection Details & Explanation
{explanation}

## Action Details
- **Action Type:** `{action_type}`
{ks_line}
## Engineering Recommendations
> [!IMPORTANT]
> **Recommendations Only:** This pull request contains recommendations and security documentation. No infrastructure changes have been modified in this branch.

1. **Rotate Credentials:** Immediately rotate `{key_id}` in your production secrets management system.
2. **Review Calling Services:** Inspect recent deployments, services, or cron jobs that utilize this key.
3. **Configure Provider Spend Limits:** Set hard limits in the `{provider}` management console.
4. **Resolution:** Review and merge this PR once internal audit and credential rotation are confirmed.
"""
            commit_msg = f"docs(cirra): cost anomaly report for {short_id}"
            repo.create_file(
                path=file_path,
                message=commit_msg,
                content=md_content,
                branch=branch_name,
            )

            # Open PR
            pr_title = f"[Cirra] Cost Remediation: {provider} Anomaly ({short_id})"
            pr_body = (
                f"### Cirra Autonomous Remediation Notice\n\n"
                f"Cirra Sentinel detected a **{severity}** anomaly on `{provider}`.\n\n"
                f"- **Baseline:** ${baseline}\n"
                f"- **Actual / Peak:** ${actual}\n"
                f"- **Deviation:** {deviation}%\n\n"
                f"Remediation guidance has been added to `{file_path}`.\n\n"
                f"_Generated by Cirra Action Engine._"
            )
            pr = repo.create_pull(
                title=pr_title,
                body=pr_body,
                head=branch_name,
                base=default_branch_name,
            )

            # Add labels if available
            try:
                pr.add_to_labels("cirra-remediation", "cost-anomaly", f"severity:{severity.lower()}")
            except Exception as label_err:
                logger.warning("Could not set PR labels: %s", label_err)

            logger.info("Created GitHub PR #%s at %s", pr.number, pr.html_url)
            return PRResult(
                pr_url=pr.html_url,
                pr_number=pr.number,
                branch_name=branch_name,
                created_at=datetime.now(timezone.utc),
                mocked=False,
                file_path=file_path,
            )
        except Exception as e:
            logger.error("Error creating GitHub PR: %s", str(e), exc_info=True)
            mock_url = f"https://github.com/{self.repo_owner}/{self.repo_name}/pull/1"
            return PRResult(
                pr_url=mock_url,
                pr_number=1,
                branch_name=branch_name,
                created_at=datetime.now(timezone.utc),
                mocked=True,
                error=str(e),
                file_path=file_path,
            )
