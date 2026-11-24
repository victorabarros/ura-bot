locals {
  domain      = "uraniumstockbot.com"
  bucket_name = "ura-bot-uraniumstockbot"
  site_dir    = "${path.module}/../../web"
  site_files = {
    "index.html" = "text/html; charset=utf-8"
    "styles.css" = "text/css; charset=utf-8"
    "main.js"    = "text/javascript; charset=utf-8"
  }
  # Managed-CachingOptimized.
  cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
}
