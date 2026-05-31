import { CacheRepository } from "./cache";
import config from "../config";

// cache
export const cacheRepository = new CacheRepository({
  username: config.redisCloud.username,
  password: config.redisCloud.password,
  host: config.redisCloud.host,
  port: parseInt(config.redisCloud.port),
})
