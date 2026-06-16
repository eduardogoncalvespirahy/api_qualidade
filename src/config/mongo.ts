import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

export class MongoConnection {
  private static client: MongoClient;
  private static connected = false;

  public static async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.client = new MongoClient(process.env.MONGO_URI!);

    await this.client.connect();

    this.connected = true;

    console.log("MongoDB conectado");
  }

  public static getDatabase(databaseName: string): Db {
    if (!this.connected) {
      throw new Error("MongoDB não conectado");
    }

    return this.client.db(databaseName);
  }

  public static async close(): Promise<void> {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
    }
  }
}