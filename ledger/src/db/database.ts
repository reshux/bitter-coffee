import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import type { DatabaseSchema } from "./schema";
import { env } from "../env";

let db: Kysely<DatabaseSchema> | null = null;

export function getDatabase(): Kysely<DatabaseSchema> {
	if (!db) {
		// Use in-memory database for tests, persistent file for development/production
		const databasePath =
			env.NODE_ENV === "test" ? ":memory:" : env.DATABASE_PATH;

		// Check if file-based database exists and log accordingly
		if (databasePath !== ":memory:") {
			const databaseExists = existsSync(databasePath);
			console.log(
				databaseExists
					? `Using existing database at ${databasePath}`
					: `Creating new database at ${databasePath}`,
			);

			// Ensure directory exists for file-based databases
			mkdirSync(dirname(databasePath), { recursive: true });
		} else {
			console.log("Using in-memory database");
		}

		const sqlite = new Database(databasePath);
		sqlite.pragma("journal_mode = WAL");
		sqlite.pragma("synchronous = NORMAL");

		// Register UUID function with SQLite
		sqlite.function("uuid", () => crypto.randomUUID());

		db = new Kysely<DatabaseSchema>({
			dialect: new SqliteDialect({
				database: sqlite,
			}),
		});
	}

	return db;
}

export function closeDatabase(): void {
	if (db) {
		db.destroy();
		db = null;
	}
}
