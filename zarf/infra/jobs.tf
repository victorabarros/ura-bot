locals {
  base_url = "https://api.uraniumstockbot.com"

  # cron-job.org requestMethod: 0=GET, 1=POST.
  http_post = 1
}

# One map entry is one cron-job.org job.
# Greeting windows in src/domain/marketTime.ts are UTC: 14:00–14:04 and 21:00–21:04.
# Stock jobs use minute 0 so both windows hit.
# Compare this file with the console before the first apply. Apply creates new
# enabled jobs; disable the old console jobs by hand afterwards.
locals {
  jobs = {
    urabot_stocks = {
      title             = "UraBot stocks"
      url               = "${local.base_url}/urabot/stocks"
      enabled           = true
      request_method    = local.http_post
      request_timeout   = 120
      save_responses    = false
      redirect_success  = false
      folder_id         = 0
      timezone          = "UTC"
      hours             = [14, 15, 16, 17, 18, 19, 20, 21]
      minutes           = [0]
      wdays             = [1, 2, 3, 4, 5]
      mdays             = [-1]
      months            = [-1]
      notify_on_failure = true
      notify_on_disable = true
    }

    urabot_news = {
      title             = "UraBot news"
      url               = "${local.base_url}/urabot/news"
      enabled           = true
      request_method    = local.http_post
      request_timeout   = 120
      save_responses    = false
      redirect_success  = false
      folder_id         = 0
      timezone          = "UTC"
      hours             = [15, 18, 20]
      minutes           = [30]
      wdays             = [1, 2, 3, 4, 5]
      mdays             = [-1]
      months            = [-1]
      notify_on_failure = true
      notify_on_disable = true
    }

    urabot_reply_mentions = {
      title             = "UraBot reply mentions"
      url               = "${local.base_url}/urabot/reply-mentions"
      enabled           = true
      request_method    = local.http_post
      request_timeout   = 120
      save_responses    = false
      redirect_success  = false
      folder_id         = 0
      timezone          = "UTC"
      hours             = [-1]
      minutes           = [10]
      wdays             = [-1]
      mdays             = [-1]
      months            = [-1]
      notify_on_failure = true
      notify_on_disable = true
    }

    bitcoinmetrx_price = {
      title             = "BitcoinMetrx price"
      url               = "${local.base_url}/bitcoinmetrx/price"
      enabled           = true
      request_method    = local.http_post
      request_timeout   = 120
      save_responses    = false
      redirect_success  = false
      folder_id         = 0
      timezone          = "UTC"
      hours             = [13, 21]
      minutes           = [5]
      wdays             = [-1]
      mdays             = [-1]
      months            = [-1]
      notify_on_failure = true
      notify_on_disable = true
    }
  }
}

resource "cronjoborg_job" "bot" {
  for_each = local.jobs

  title            = each.value.title
  url              = each.value.url
  enabled          = each.value.enabled
  request_method   = each.value.request_method
  request_timeout  = each.value.request_timeout
  save_responses   = each.value.save_responses
  redirect_success = each.value.redirect_success
  folder_id        = each.value.folder_id

  schedule {
    timezone   = each.value.timezone
    expires_at = 0
    hours      = each.value.hours
    minutes    = each.value.minutes
    wdays      = each.value.wdays
    mdays      = each.value.mdays
    months     = each.value.months
  }

  notification {
    on_failure = each.value.notify_on_failure
    on_success = false
    on_disable = each.value.notify_on_disable
  }

  extended_data {
    headers = {
      Authorization = var.bot_api_key
    }
    body = ""
  }

  lifecycle {
    prevent_destroy = true
  }
}
