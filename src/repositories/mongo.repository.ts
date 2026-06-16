import {
  AnyBulkWriteOperation,
  Collection,
  Document,
  Filter,
  FindOptions,
  OptionalUnlessRequiredId,
} from "mongodb";

import { MongoConnection } from "../config/mongo";

export class MongoRepository {
  private getCollection<T extends Document>(
    database: string,
    collection: string,
  ): Collection<T> {
    return MongoConnection
      .getDatabase(database)
      .collection<T>(collection);
  }

  async insertOne<T extends Document>(
    database: string,
    collection: string,
    document: OptionalUnlessRequiredId<T>,
  ) {
    return this
      .getCollection<T>(database, collection)
      .insertOne(document);
  }

  async findOne<T extends Document>(
    database: string,
    collection: string,
    filter: Filter<T>,
    options?: FindOptions,
  ) {
    return this
      .getCollection<T>(database, collection)
      .findOne(filter, options);
  }

  async findMany<T extends Document>(
    database: string,
    collection: string,
    filter: Filter<T> = {},
    options?: FindOptions,
  ) {
    return this
      .getCollection<T>(database, collection)
      .find(filter, options)
      .toArray();
  }

  async findManyProjection<T extends Document, TResult = Partial<T>>(
    database: string,
    collection: string,
    filter: Filter<T>,
    projection: Record<string, 0 | 1>,
  ): Promise<TResult[]> {
    return this
      .getCollection<T>(database, collection)
      .find(filter, {
        projection,
      })
      .toArray() as Promise<TResult[]>;
  }

  async count<T extends Document>(
    database: string,
    collection: string,
    filter: Filter<T> = {},
  ) {
    return this
      .getCollection<T>(database, collection)
      .countDocuments(filter);
  }

  async updateOne<T extends Document>(
    database: string,
    collection: string,
    filter: Filter<T>,
    update: Partial<T>,
  ) {
    return this
      .getCollection<T>(database, collection)
      .updateOne(filter, {
        $set: update,
      });
  }

  async deleteOne<T extends Document>(
    database: string,
    collection: string,
    filter: Filter<T>,
  ) {
    return this
      .getCollection<T>(database, collection)
      .deleteOne(filter);
  }

  async deleteMany<T extends Document>(
    database: string,
    collection: string,
    filter: Filter<T>,
  ) {
    return this
      .getCollection<T>(database, collection)
      .deleteMany(filter);
  }

  async bulkWrite<T extends Document>(
    database: string,
    collection: string,
    operations: AnyBulkWriteOperation<T>[],
  ) {
    if (!operations.length) {
      return;
    }

    return this
      .getCollection<T>(database, collection)
      .bulkWrite(operations, {
        ordered: false,
      });
  }
}