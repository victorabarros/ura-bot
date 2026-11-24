locals {
  base_url = "https://api.uraniumstockbot.com"

  # cron-job.org requestMethod: 0=GET, 1=POST.
  http_post = 1

  # One map entry is one cron-job.org job. Times are America/Sao_Paulo, copied from
  # the console. An empty list means every hour or every day. The provider stores
  # the API sentinel [-1] as an empty list, so writing [-1] here plans a no-op update.
  # Disabled console job BrlBot (4634680) is not managed.
  # Shared request settings live on the resource below.
  jobs = {
    urabot_stocks = {
      title   = "UraBot stocks"
      url     = "${local.base_url}/urabot/stocks"
      hours   = [11, 14, 18]
      minutes = [0]
      wdays   = [1, 2, 3, 4, 5]
      mdays   = []
      months  = []
    }

    urabot_news = {
      title   = "UraBot news"
      url     = "${local.base_url}/urabot/news"
      hours   = [7, 10, 13, 15, 17, 21]
      minutes = [0]
      wdays   = [1, 2, 3, 4, 5]
      mdays   = []
      months  = []
    }

    urabot_reply_mentions = {
      title   = "UraBot reply mentions"
      url     = "${local.base_url}/urabot/reply-mentions"
      hours   = []
      minutes = [0]
      wdays   = []
      mdays   = []
      months  = []
    }

    bitcoinmetrx_price = {
      title   = "BitcoinMetrx price"
      url     = "${local.base_url}/bitcoinmetrx/price"
      hours   = [0, 4, 8, 12, 16, 20]
      minutes = [0]
      wdays   = []
      mdays   = []
      months  = []
    }
  }
}

resource "cronjoborg_job" "bot" {
  for_each = local.jobs

  title            = each.value.title
  url              = each.value.url
  enabled          = true
  request_method   = local.http_post
  request_timeout  = 120
  save_responses   = false
  redirect_success = false
  folder_id        = 0

  schedule {
    timezone   = "America/Sao_Paulo"
    expires_at = 0
    hours      = each.value.hours
    minutes    = each.value.minutes
    wdays      = each.value.wdays
    mdays      = each.value.mdays
    months     = each.value.months
  }

  notification {
    on_failure = true
    on_success = false
    on_disable = true
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
