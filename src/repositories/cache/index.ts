export type RedisCloudConfig = {
  username: string
  password: string
  host: string
  port: number
}

export class CacheRepository {
  constructor(private readonly config: RedisCloudConfig) {
  }

  async get(key: string): Promise<string | null> {
    return null
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    return
  }
}
