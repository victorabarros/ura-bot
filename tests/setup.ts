// Set all required env vars before any module is imported.
// This prevents config.ts from throwing on missing variables during tests.
process.env.API_KEY = "test-api-key"
process.env.FINNHUB_API_KEY = "test-finnhub-key"
process.env.URA_BOT_X_CONSUMER_KEY = "test-x-consumer-key"
process.env.URA_BOT_X_CONSUMER_KEY_SECRET = "test-x-consumer-key-secret"
process.env.URA_BOT_X_ACCESS_TOKEN = "test-x-access-token"
process.env.URA_BOT_X_ACCESS_TOKEN_SECRET = "test-x-access-token-secret"
process.env.REPLICATE_API_TOKEN = "test-replicate-token"
