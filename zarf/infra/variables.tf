variable "bot_api_key" {
  type        = string
  sensitive   = true
  description = "Raw Authorization header sent to the bot. Same value as API_KEY. Do not prefix it with Bearer."
}
