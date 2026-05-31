import Redis from "ioredis"
import config from "../config"

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  username: config.redis.username,
  password: config.redis.password,
  lazyConnect: true,
})

redis.on("error", (err) => {
  console.error("[cache] Redis error:", err.message)
})

export async function cacheGet(key: string): Promise<string | null> {
  return redis.get(key)
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  await redis.set(key, value, "EX", ttlSeconds)
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key)
}

export { redis }
