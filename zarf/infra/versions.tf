terraform {
  # CI fmt/validate/plan use whatever Terraform GitHub Actions installs.
  # Production apply is pinned to 1.17.2 in scripts/deploy-prod.sh.
  required_version = ">= 1.17.2"

  required_providers {
    cronjoborg = {
      source  = "plain-insure/cronjoborg"
      version = "1.1.2"
    }
  }

  # State holds job URLs and the Authorization header. It stays in a private
  # R2 bucket. Credentials come from AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.
  backend "s3" {
    bucket       = "ura-bot-tfstate"
    key          = "cron-jobs/terraform.tfstate"
    region       = "auto"
    use_lockfile = true

    endpoints = {
      s3 = "https://801ef708ebc26ededdebd09597b9afff.r2.cloudflarestorage.com"
    }

    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}
