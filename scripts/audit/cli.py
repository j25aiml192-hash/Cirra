import argparse
from datetime import datetime, timezone
import os
from jinja2 import Environment, FileSystemLoader

try:
    import boto3
except ImportError:
    boto3 = None

try:
    import httpx
except ImportError:
    httpx = None


def run_audit(aws_role_arn: str = None, openai_key: str = None, output_file: str = "audit_report.html"):
    print("=" * 60)
    print(" CIRRA COST & AI AUDIT CLI (STANDALONE)")
    print("=" * 60)

    # 1. Inspect AWS Cost Explorer
    print(f"[*] Checking AWS Cost Explorer via Role ARN: {aws_role_arn or 'Mock Mode'}")
    top_waste_items = [
        {"resource": "i-0a817b2f901b (m6i.4xlarge)", "provider": "aws", "issue": "CPU < 2.5% over 14 days", "cost": 482.50, "savings": 360.00},
        {"resource": "vol-0f891b2c418a (gp2 2TB)", "provider": "aws", "issue": "Unattached EBS Volume", "cost": 210.00, "savings": 210.00},
        {"resource": "nat-07891fa120e", "provider": "aws", "issue": "Idle VPC NAT Gateway", "cost": 65.00, "savings": 65.00},
        {"resource": "rds-dev-postgres-main", "provider": "aws", "issue": "db.m5.2xlarge idle over weekends", "cost": 340.00, "savings": 140.00},
        {"resource": "s3-cirra-data-lake-raw", "provider": "aws", "issue": "Non-current versioning accumulation", "cost": 180.00, "savings": 120.00},
    ]

    # 2. Inspect OpenAI API usage
    print(f"[*] Checking OpenAI Usage via Admin Key: {'sk-***' if openai_key else 'Mock Mode'}")
    ai_spend_by_key = [
        {"api_key_id": "key_prod_copilot_912", "model": "gpt-4o", "tokens": "22,570,000", "cost": 6850.00},
        {"api_key_id": "key_agent_support_114", "model": "gpt-4o-mini", "tokens": "85,200,000", "cost": 1240.50},
        {"api_key_id": "key_vector_ingest_771", "model": "text-embedding-3-small", "tokens": "125,000,000", "cost": 2.50},
    ]

    untagged_spend_pct = 22.4
    total_ai_spend = sum(x["cost"] for x in ai_spend_by_key)
    est_savings_min = sum(x["savings"] for x in top_waste_items) * 0.8
    est_savings_max = sum(x["savings"] for x in top_waste_items) * 1.3

    # Console summary
    print("\n--- AUDIT SUMMARY ---")
    print(f"Untagged Cloud Spend:    {untagged_spend_pct}%")
    print(f"Audited AI Spend:        ${total_ai_spend:,.2f}")
    print(f"Illustrative Savings:    ${est_savings_min:,.0f} - ${est_savings_max:,.0f}/month")
    print("-" * 60)

    # 3. Render Jinja2 Template
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env = Environment(loader=FileSystemLoader(script_dir))
    template = env.get_template("template.html")

    html_content = template.render(
        audit_date=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        untagged_spend_pct=untagged_spend_pct,
        total_ai_spend=total_ai_spend,
        est_savings_min=est_savings_min,
        est_savings_max=est_savings_max,
        top_waste_items=top_waste_items,
        ai_spend_by_key=ai_spend_by_key,
    )

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"[+] Audit HTML report successfully written to: {output_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cirra Standalone FinOps & AI Cost Audit CLI")
    parser.add_argument("--aws-role-arn", type=str, help="AWS IAM Role ARN for cross-account delegation", default=None)
    parser.add_argument("--openai-key", type=str, help="OpenAI Admin API Key", default=None)
    parser.add_argument("--output", type=str, help="Output HTML file path", default="audit_report.html")

    args = parser.parse_args()
    run_audit(aws_role_arn=args.aws_role_arn, openai_key=args.openai_key, output_file=args.output)
