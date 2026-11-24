provider "aws" {
  region  = "us-east-1"
  profile = "site"

  default_tags {
    tags = {
      project = "ura-bot"
      stack   = "site"
    }
  }
}

# Key and secret come from GODADDY_API_KEY and GODADDY_API_SECRET.
# Do not set them here.
provider "godaddy" {}
