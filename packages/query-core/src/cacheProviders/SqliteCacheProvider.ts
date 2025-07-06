import sqlite3 from 'sqlite3';
import { CacheProvider, CachedItem } from './CacheProvider';

const DB_TABLE_NAME = 'cache';

export class SqliteCacheProvider implements CacheProvider {
  private db: sqlite3.Database;
  private readyPromise: Promise<void>;

  constructor(filePath: string = ':memory:') {
    this.db = new sqlite3.Database(filePath, (err) => {
      if (err) {
        console.error('QueryCore: Failed to open SQLite database.', err.message);
        // If the database fails to open, subsequent operations will also fail.
        // We can mark the provider as not ready or throw.
        // For now, errors will be logged by operations.
        this.readyPromise = Promise.reject(err);
        return;
      }
      // console.log('QueryCore: SQLite database opened successfully.');
    });

    this.readyPromise = new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(
          `CREATE TABLE IF NOT EXISTS ${DB_TABLE_NAME} (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          )`,
          (err) => {
            if (err) {
              console.error('QueryCore: Failed to create cache table in SQLite.', err.message);
              reject(err);
            } else {
              // console.log('QueryCore: SQLite cache table ensured.');
              resolve();
            }
          },
        );
      });
    });
  }

  private async ensureReady(): Promise<void> {
    try {
      await this.readyPromise;
    } catch (error) {
      // console.error('QueryCore: SQLite provider is not ready.', error);
      throw new Error(`SqliteCacheProvider is not ready: ${(error as Error).message}`);
    }
  }

  async get<TData>(key: string): Promise<CachedItem<TData> | undefined> {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT value FROM ${DB_TABLE_NAME} WHERE key = ?`, [key], (err, row: { value: string } | undefined) => {
        if (err) {
          console.error(`QueryCore: SQLite get error for key "${key}":`, err.message);
          reject(err);
          return;
        }
        if (row) {
          try {
            const item = JSON.parse(row.value) as CachedItem<TData>;
            resolve(item);
          } catch (parseError) {
            console.error(`QueryCore: Error parsing SQLite item for key "${key}":`, (parseError as Error).message);
            // Consider removing the corrupted item
            this.remove(key).catch(removeErr => console.error(`QueryCore: Failed to remove corrupted SQLite item for key "${key}":`, (removeErr as Error).message));
            resolve(undefined);
          }
        } else {
          resolve(undefined);
        }
      });
    });
  }

  async set<TData>(key: string, item: CachedItem<TData>): Promise<void> {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      try {
        const value = JSON.stringify(item);
        this.db.run(
          `INSERT OR REPLACE INTO ${DB_TABLE_NAME} (key, value) VALUES (?, ?)`,
          [key, value],
          (err) => {
            if (err) {
              console.error(`QueryCore: SQLite set error for key "${key}":`, err.message);
              reject(err);
            } else {
              resolve();
            }
          },
        );
      } catch (stringifyError) {
        console.error(`QueryCore: Error stringifying item for SQLite key "${key}":`, (stringifyError as Error).message);
        reject(stringifyError);
      }
    });
  }

  async remove(key: string): Promise<void> {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM ${DB_TABLE_NAME} WHERE key = ?`, [key], (err) => {
        if (err) {
          console.error(`QueryCore: SQLite delete error for key "${key}":`, err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async clearAll(): Promise<void> {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM ${DB_TABLE_NAME}`, (err) => {
        if (err) {
          console.error('QueryCore: SQLite clearAll error:', err.message);
          reject(err);
        } else {
          // console.log('QueryCore: All entries cleared from SQLite cache table.');
          resolve();
        }
      });
    });
  }

  // Optional: Method to close the database connection if needed for cleanup.
  // async close(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     this.db.close((err) => {
  //       if (err) {
  //         console.error('QueryCore: Failed to close SQLite database.', err.message);
  //         reject(err);
  //       } else {
  //         // console.log('QueryCore: SQLite database closed.');
  //         resolve();
  //       }
  //     });
  //   });
  // }
}
