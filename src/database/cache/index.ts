class CacheService {
  constructor() {
  }

  async get(key: string): Promise<string | null> {
    return null
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    return
  }
}

export default CacheService
