terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

# Cross-account IAM Role for Cirra Cost Telemetry
resource "aws_iam_role" "cirra_cost_delegation" {
  name = "CirraCostDelegationRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::123456789012:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "cirra"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cost_explorer_readonly" {
  role       = aws_iam_role.cirra_cost_delegation.name
  policy_arn = "arn:aws:iam::aws:policy/AWSOrganizationsReadOnlyAccess"
}
