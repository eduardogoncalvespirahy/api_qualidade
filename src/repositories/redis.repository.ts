import { RedisConnection } from "../config/redis";

export class RedisRepository {
  private get client() {
    return RedisConnection.getClient();
  }

  async set<T>(
    key: string,
    value: T,
    ttlInSeconds?: number,
  ): Promise<void> {
    const serialized = JSON.stringify(value);

    if (ttlInSeconds) {
      await this.client.set(key, serialized, {
        EX: ttlInSeconds,
      });

      return;
    }

    await this.client.set(key, serialized);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async delete(key: string): Promise<number> {
    return this.client.del(key);
  }

  async deleteByPattern(
    pattern: string
  ): Promise<void> {

    const client =
      RedisConnection.getClient();

    const keys =
      await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(keys);
    }
  }  

  async exists(key: string): Promise<boolean> {
    const exists = await this.client.exists(key);

    return exists === 1;
  }

  async expire(
    key: string,
    ttlInSeconds: number,
  ): Promise<boolean> {
    const result = await this.client.expire(key, ttlInSeconds);
    return result === 1;
  }

  async increment(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decrement(key: string): Promise<number> {
    return this.client.decr(key);
  }
}