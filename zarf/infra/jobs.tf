locals {
  base_url = "https://api.uraniumstockbot.com"

  # cron-job.org requestMethod: 0=GET, 1=POST.
  http_post = 1
}

# One map entry is one cron-job.org job. Times are America/Sao_Paulo, copied from
# the console. An empty list means every hour or every day. The provider stores
# the API sentinel [-1] as an empty list, so writing [-1] here plans a no-op update.
# Disabled console job BrlBot (4634680) is not managed.
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
      timezone          = "America/Sao_Paulo"
      hours             = [11, 14, 18]
      minutes           = [0]
      wdays             = [1, 2, 3, 4, 5]
      mdays             = []
      months            = []
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
      timezone          = "America/Sao_Paulo"
      hours             = [7, 10, 13, 15, 17, 21]
      minutes           = [0]
      wdays             = [1, 2, 3, 4, 5]
      mdays             = []
      months            = []
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
      timezone          = "America/Sao_Paulo"
      hours             = []
      minutes           = [0]
      wdays             = []
      mdays             = []
      months            = []
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
      timezone          = "America/Sao_Paulo"
      hours             = [0, 4, 8, 12, 16, 20]
      minutes           = [0]
      wdays             = []
      mdays             = []
      months            = []
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
