import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.redis.get(key);
      return value === null ? undefined : (JSON.parse(value) as T);
    } catch (error) {
      this.logger.warn(
        `Cache read failed for "${key}": ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `Cache write failed for "${key}": ${(error as Error).message}`,
      );
    }
  }

  async del(...keys: string[]): Promise<void> {
    try {
      await this.redis.del(...keys);
    } catch (error) {
      this.logger.warn(`Cache delete failed: ${(error as Error).message}`);
    }
  }
}
