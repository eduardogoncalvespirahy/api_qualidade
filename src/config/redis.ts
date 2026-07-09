import { RedisClientType, createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

export class RedisConnection {
  private static client: RedisClientType;
  private static connected = false;

  public static async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.client = createClient({
      url: process.env.REDIS_URI,
    });

    this.client.on("error", (err) => {
      console.error("Redis Error:", err);
    });

    await this.client.connect();

    this.connected = true;

    console.log("Redis conectado");
  }

  public static getClient(): RedisClientType {
    if (!this.connected) {
      throw new Error("Redis não conectado");
    }

    return this.client;
  }

  public static async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    await this.client.quit();

    this.connected = false;
  }
}