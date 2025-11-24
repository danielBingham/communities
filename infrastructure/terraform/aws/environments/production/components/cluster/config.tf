terraform {
  backend "s3" {
    bucket = "communities-social-terraform-state"
    key = "production/components/cluster"
    region = "us-east-1"
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  shared_config_files = var.aws_config
  shared_credentials_files = var.aws_credentials
  profile = var.aws_profile
}
