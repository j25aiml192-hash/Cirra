from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
import boto3
from botocore.exceptions import ClientError


class AWSConnector:
    """
    AWS Connector using IAM Role Delegation to query Cost Explorer (ce) and CUR.
    """

    def __init__(self, role_arn: str, external_id: str = "cirra"):
        self.role_arn = role_arn
        self.external_id = external_id

    def _get_client(self):
        sts = boto3.client("sts")
        assumed = sts.assume_role(
            RoleArn=self.role_arn,
            RoleSessionName="CirraCostExplorerSession",
            ExternalId=self.external_id,
        )
        creds = assumed["Credentials"]
        return boto3.client(
            "ce",
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"],
            region_name="us-east-1",
        )

    def test(self) -> Dict[str, Any]:
        """Test STS assume role credentials."""
        try:
            sts = boto3.client("sts")
            sts.assume_role(
                RoleArn=self.role_arn,
                RoleSessionName="CirraTestConnection",
                ExternalId=self.external_id,
            )
            return {"success": True, "message": "AWS IAM Role delegation verified"}
        except ClientError as e:
            return {"success": False, "message": str(e)}

    def fetch_cost_explorer(self, connection_id: str, months: int = 3) -> List[Dict[str, Any]]:
        """Fetch daily cost and usage breakdown from AWS Cost Explorer."""
        client = self._get_client()
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=30 * months)

        response = client.get_cost_and_usage(
            TimePeriod={
                "Start": start_date.strftime("%Y-%m-%d"),
                "End": end_date.strftime("%Y-%m-%d"),
            },
            Granularity="DAILY",
            Metrics=["UnblendedCost", "NetAmortizedCost", "UsageQuantity"],
            GroupBy=[
                {"Type": "DIMENSION", "Key": "SERVICE"},
                {"Type": "DIMENSION", "Key": "USAGE_TYPE"},
            ],
        )

        return response.get("ResultsByTime", [])
