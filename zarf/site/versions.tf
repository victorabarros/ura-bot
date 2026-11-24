terraform {
  # Exact pin. The laptop Docker image and the CI scripts both use 1.17.2.
  required_version = "1.17.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.74.0"
    }
  }

  # Own state object. The cron-job stack uses cron-jobs/terraform.tfstate in
  # this same private R2 bucket. Credentials are the r2 profile, not the site
  # AWS keys. See zarf/site/README.md.
  backend "s3" {
    bucket       = "ura-bot-tfstate"
    key          = "site/terraform.tfstate"
    region       = "auto"
    profile      = "r2"
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
