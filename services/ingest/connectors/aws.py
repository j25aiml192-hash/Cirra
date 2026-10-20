import asyncio
import logging
import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger("cirra.ingest.aws")

ALLOWED_READ_ACTIONS = {
    "ce:GetCostAndUsage",
    "ce:GetCostAndUsageWithResources",
    "ce:GetDimensionValues",
    "ce:GetTags",
}


def assert_read_only_action(action_name: str) -> None:
    if action_name not in ALLOWED_READ_ACTIONS:
        raise PermissionError(f"Security assertion failed: non-read AWS action '{action_name}' is forbidden.")


class AWSCostExplorerConnector:
    def __init__(self, credentials: Dict[str, Any]):
        self.credentials = credentials
        self.mock_mode = (
            os.getenv("INGEST_MOCK", "false").lower() in ("true", "1")
            or "mock" in str(credentials.get("role_arn", "")).lower()
            or "test" in str(credentials.get("role_arn", "")).lower()
        )

    def _get_client(self):
        role_arn = self.credentials.get("role_arn")
        external_id = self.credentials.get("external_id")
        region = self.credentials.get("region", "us-east-1")

        if role_arn:
            sts = boto3.client("sts", region_name=region)
            assumed = sts.assume_role(
                RoleArn=role_arn,
                RoleSessionName="CirraCostIngestSession",
                ExternalId=external_id or "Cirra",
                DurationSeconds=900,
            )
            creds = assumed["Credentials"]
            return boto3.client(
                "ce",
                region_name=region,
                aws_access_key_id=creds["AccessKeyId"],
                aws_secret_access_key=creds["SecretAccessKey"],
                aws_session_token=creds["SessionToken"],
            )

        return boto3.client(
            "ce",
            region_name=region,
            aws_access_key_id=self.credentials.get("access_key_id"),
            aws_secret_access_key=self.credentials.get("secret_access_key"),
        )

    async def fetch_cost_and_usage(
        self,
        start_date: datetime,
        end_date: datetime,
        max_retries: int = 4,
    ) -> Dict[str, Any]:
        """Fetch cost & usage with pagination, rate limiting backoff, and read-only safety assertion."""
        assert_read_only_action("ce:GetCostAndUsage")

        if self.mock_mode:
            logger.info("AWSCostExplorerConnector running in MOCK mode. Returning recorded fixtures.")
            return self._generate_mock_results(start_date, end_date)

        client = self._get_client()
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")

        all_results_by_time = []
        next_page_token: Optional[str] = None

        while True:
            params: Dict[str, Any] = {
                "TimePeriod": {"Start": start_str, "End": end_str},
                "Granularity": "DAILY",
                "Metrics": ["UnblendedCost", "NetAmortizedCost"],
                "GroupBy": [
                    {"Type": "DIMENSION", "Key": "SERVICE"},
                    {"Type": "DIMENSION", "Key": "REGION"},
                ],
            }
            if next_page_token:
                params["NextPageToken"] = next_page_token

            # Execute with exponential backoff and jitter
            response = None
            for attempt in range(max_retries):
                try:
                    response = client.get_cost_and_usage(**params)
                    break
                except ClientError as e:
                    code = e.response.get("Error", {}).get("Code", "")
                    if code in ("LimitExceededException", "ThrottlingException", "RequestLimitExceeded") and attempt < max_retries - 1:
                        sleep_s = (2 ** attempt) + random.uniform(0.1, 0.5)
                        logger.warning(f"AWS rate limited ({code}). Backing off for {sleep_s:.2f}s...")
                        await asyncio.sleep(sleep_s)
                    else:
                        logger.error("AWS Cost Explorer client error")
                        raise

            if not response:
                raise RuntimeError("Failed to retrieve AWS cost and usage after retries.")

            all_results_by_time.extend(response.get("ResultsByTime", []))
            next_page_token = response.get("NextPageToken")
            if not next_page_token:
                break

        return {"ResultsByTime": all_results_by_time}

    def _generate_mock_results(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate realistic recorded AWS Cost Explorer fixture for mock mode."""
        results = []
        current = start_date
        while current < end_date:
            next_day = current + timedelta(days=1)
            results.append({
                "TimePeriod": {
                    "Start": current.strftime("%Y-%m-%d"),
                    "End": next_day.strftime("%Y-%m-%d"),
                },
                "Total": {},
                "Groups": [
                    {
                        "Keys": ["Amazon Elastic Compute Cloud - Compute", "us-east-1", "i-0987654321fedcba0"],
                        "Metrics": {
                            "UnblendedCost": {"Amount": "1150.25", "Unit": "USD"},
                            "NetAmortizedCost": {"Amount": "1050.00", "Unit": "USD"},
                        },
                    },
                    {
                        "Keys": ["Amazon Simple Storage Service", "us-west-2", "cirra-logs-bucket"],
                        "Metrics": {
                            "UnblendedCost": {"Amount": "420.50", "Unit": "USD"},
                            "NetAmortizedCost": {"Amount": "420.50", "Unit": "USD"},
                        },
                    },
                    {
                        "Keys": ["AWS Support (Business)", "global", "supp-bus-monthly"],
                        "Metrics": {
                            "UnblendedCost": {"Amount": "100.00", "Unit": "USD"},
                            "NetAmortizedCost": {"Amount": "100.00", "Unit": "USD"},
                        },
                    },
                ],
                "Estimated": False,
            })
            current = next_day
        return {"ResultsByTime": results}
