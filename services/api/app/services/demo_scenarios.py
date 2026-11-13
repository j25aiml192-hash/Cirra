from dataclasses import dataclass, asdict
from decimal import Decimal
from typing import Any, Dict, List, Optional


@dataclass
class DemoScenario:
    id: str
    name: str
    tier: int
    badge_color: str
    badge_label: str
    description: str
    provider: str
    model: Optional[str]
    api_key_id: str
    baseline_value: Decimal
    actual_value: Decimal
    deviation_pct: Decimal
    severity: str
    detection_type: str
    explanation: str
    channels_to_fire: List[str]
    expected_outcome: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "tier": self.tier,
            "badge_color": self.badge_color,
            "badge_label": self.badge_label,
            "description": self.description,
            "provider": self.provider,
            "model": self.model,
            "api_key_id": self.api_key_id,
            "baseline_value": float(self.baseline_value),
            "actual_value": float(self.actual_value),
            "deviation_pct": float(self.deviation_pct),
            "severity": self.severity,
            "detection_type": self.detection_type,
            "explanation": self.explanation,
            "channels_to_fire": self.channels_to_fire,
            "expected_outcome": self.expected_outcome,
        }


SCENARIO_1 = DemoScenario(
    id="tier1_groq_nudge",
    name="Groq Cost Nudge",
    tier=1,
    badge_color="blue",
    badge_label="LOW",
    description="Groq spend slightly above baseline. Informational only.",
    provider="groq",
    model="llama-3.1-8b-instant",
    api_key_id="demo_groq_key_001",
    baseline_value=Decimal("10.80"),
    actual_value=Decimal("14.90"),
    deviation_pct=Decimal("37.96"),
    severity="low",
    detection_type="spend_spike",
    explanation="Groq usage is 38% above its 7-day baseline. Normal variance — no action required.",
    channels_to_fire=["ntfy"],
    expected_outcome="ntfy push notification only",
)

SCENARIO_2 = DemoScenario(
    id="tier2_vercel_spike",
    name="Vercel Deployment Surge",
    tier=2,
    badge_color="yellow",
    badge_label="MEDIUM",
    description="Vercel bandwidth doubled after a large deploy. Team notified.",
    provider="vercel",
    model=None,
    api_key_id="demo_vercel_key_001",
    baseline_value=Decimal("14.20"),
    actual_value=Decimal("28.90"),
    deviation_pct=Decimal("103.52"),
    severity="medium",
    detection_type="spend_spike",
    explanation="Vercel bandwidth costs doubled following a major frontend deployment at 3PM.",
    channels_to_fire=["ntfy", "slack"],
    expected_outcome="ntfy + Slack notification",
)

SCENARIO_3 = DemoScenario(
    id="tier3_anthropic_batch",
    name="Anthropic Batch Job Overrun",
    tier=3,
    badge_color="orange",
    badge_label="HIGH",
    description="Claude batch processing job ran over the weekend unattended. PR raised with investigation.",
    provider="anthropic",
    model="claude-3-5-sonnet",
    api_key_id="demo_anthropic_key_001",
    baseline_value=Decimal("27.50"),
    actual_value=Decimal("96.25"),
    deviation_pct=Decimal("250.00"),
    severity="high",
    detection_type="spend_spike",
    explanation="Claude-3.5-Sonnet usage spiked 250% over baseline. Consistent with an unattended batch job running through the weekend.",
    channels_to_fire=["slack", "ntfy", "github_pr"],
    expected_outcome="Slack + ntfy + GitHub PR with investigation",
)

SCENARIO_4 = DemoScenario(
    id="tier4_openai_runaway",
    name="OpenAI Runaway Process",
    tier=4,
    badge_color="red",
    badge_label="CRITICAL",
    description="GPT-4o spend 341% above baseline at 2AM. Likely runaway process. Voice call + PR triggered.",
    provider="openai",
    model="gpt-4o",
    api_key_id="demo_key_sk_prod_001",
    baseline_value=Decimal("56.20"),
    actual_value=Decimal("247.80"),
    deviation_pct=Decimal("340.71"),
    severity="critical",
    detection_type="spend_spike",
    explanation="OpenAI GPT-4o spend spiked 341% above baseline between 1AM-3AM. This pattern is inconsistent with normal traffic. Possible runaway loop or infrastructure misconfiguration.",
    channels_to_fire=["slack", "github_pr", "vapi"],
    expected_outcome="Slack @channel + GitHub PR + AI voice call",
)

SCENARIO_5 = DemoScenario(
    id="tier5_leaked_key",
    name="Leaked API Key — $30K Weekend",
    tier=5,
    badge_color="purple",
    badge_label="CATASTROPHIC",
    description="Dormant key suddenly active. 1,247 requests in 2 hours. All channels fire. This is the '$30K weekend' scenario.",
    provider="openai",
    model="gpt-4o",
    api_key_id="demo_leaked_key_exposed_001",
    baseline_value=Decimal("4.20"),
    actual_value=Decimal("847.60"),
    deviation_pct=Decimal("20085.71"),
    severity="critical",
    detection_type="leaked_key",
    explanation="API key demo_leaked_key_exposed_001 was dormant for 9 days and suddenly made 1,247 requests in 2 hours — 8.4x its historical hourly rate. This pattern is consistent with unauthorized access or key exposure.",
    channels_to_fire=["slack", "ntfy", "github_pr", "vapi", "kill_switch"],
    expected_outcome="ALL channels + kill switch proposed",
)

ALL_SCENARIOS = [
    SCENARIO_1,
    SCENARIO_2,
    SCENARIO_3,
    SCENARIO_4,
    SCENARIO_5,
]
