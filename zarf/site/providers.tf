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
