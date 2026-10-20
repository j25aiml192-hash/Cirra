# AWS Cost Explorer Connector IAM Policy

Cirra connects to AWS Cost Explorer using read-only least-privilege credentials via cross-account IAM Role assumption.

## Minimal IAM Policy

Attach the following policy to the IAM Role assumed by Cirra (`ce:Get*` and `sts:AssumeRole` only):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CirraReadOnlyCostExplorerAccess",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostAndUsageWithResources",
        "ce:GetDimensionValues",
        "ce:GetTags",
        "ce:GetCostForecast",
        "ce:GetReservationUtilization",
        "ce:GetSavingsPlansUtilization"
      ],
      "Resource": "*"
    }
  ]
}
```

## Trust Relationship (Cross-Account Role)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::CIRRA_ACCOUNT_ID:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "TENANT_EXTERNAL_ID"
        }
      }
    }
  ]
}
```

Cirra strictly asserts read-only calls. Destructive write operations are forbidden at both IAM and client layers.
