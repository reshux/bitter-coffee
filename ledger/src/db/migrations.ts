import { sql } from "kysely";
import type { Kysely } from "kysely";
import type { DatabaseSchema } from "./schema";

export async function migrateToLatest(
	db: Kysely<DatabaseSchema>,
): Promise<void> {
	console.log("Starting database migrations...");

	try {
		await createTenantsTable(db);
		await createAccountsTable(db);
		await createTransactionsTable(db);
		await createTransactionEntriesTable(db);

		console.log("Database migrations completed successfully.");
	} catch (error) {
		console.error("Migration failed:", error);
		throw error;
	}
}

async function tableExists(
	db: Kysely<DatabaseSchema>,
	tableName: string,
): Promise<boolean> {
	try {
		const result = await sql`
			SELECT name FROM sqlite_master 
			WHERE type = 'table' AND name = ${tableName}
		`.execute(db);

		return result.rows.length > 0;
	} catch (error) {
		console.error(`Failed to check if table ${tableName} exists:`, error);
		return false;
	}
}

async function verifyTableSchema(
	db: Kysely<DatabaseSchema>,
	tableName: string,
	expectedColumns: string[],
): Promise<boolean> {
	try {
		const result = await sql`PRAGMA table_info(${sql.ref(tableName)})`.execute(
			db,
		);
		const existingColumns = result.rows.map((row: any) => row.name);

		const missingColumns = expectedColumns.filter(
			(col) => !existingColumns.includes(col),
		);

		if (missingColumns.length > 0) {
			console.warn(
				`Table ${tableName} is missing columns: ${missingColumns.join(", ")}`,
			);
			return false;
		}

		return true;
	} catch (error) {
		console.error(`Failed to verify schema for table ${tableName}:`, error);
		return false;
	}
}

async function createTenantsTable(db: Kysely<DatabaseSchema>): Promise<void> {
	const tableName = "tenants";
	const expectedColumns = ["id", "name", "status", "created_at", "updated_at"];

	if (await tableExists(db, tableName)) {
		console.log(`Table ${tableName} already exists, verifying schema...`);
		const isValid = await verifyTableSchema(db, tableName, expectedColumns);
		if (isValid) {
			console.log(`Table ${tableName} schema is valid.`);
			return;
		} else {
			throw new Error(
				`Table ${tableName} exists but schema is invalid. Manual intervention required.`,
			);
		}
	}

	console.log(`Creating table ${tableName}...`);
	await db.schema
		.createTable(tableName)
		.addColumn("id", "text", (col) => col.primaryKey().defaultTo(sql`(uuid())`))
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("status", "text", (col) => col.notNull().defaultTo("ACTIVE"))
		.addColumn("created_at", "text", (col) =>
			col.notNull().defaultTo(sql`(datetime('now'))`),
		)
		.addColumn("updated_at", "text", (col) =>
			col.notNull().defaultTo(sql`(datetime('now'))`),
		)
		.execute();
	console.log(`Table ${tableName} created successfully.`);
}

async function createAccountsTable(db: Kysely<DatabaseSchema>): Promise<void> {
	const tableName = "accounts";
	const expectedColumns = [
		"id",
		"tenant_id",
		"name",
		"status",
		"parent_account_id",
		"created_at",
		"updated_at",
	];

	if (await tableExists(db, tableName)) {
		console.log(`Table ${tableName} already exists, verifying schema...`);
		const isValid = await verifyTableSchema(db, tableName, expectedColumns);
		if (isValid) {
			console.log(`Table ${tableName} schema is valid.`);
			return;
		} else {
			throw new Error(
				`Table ${tableName} exists but schema is invalid. Manual intervention required.`,
			);
		}
	}

	console.log(`Creating table ${tableName}...`);
	await db.schema
		.createTable(tableName)
		.addColumn("id", "text", (col) => col.primaryKey().defaultTo(sql`(uuid())`))
		.addColumn("tenant_id", "text", (col) =>
			col.notNull().references("tenants.id"),
		)
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("status", "text", (col) => col.notNull().defaultTo("ACTIVE"))
		.addColumn("parent_account_id", "text", (col) =>
			col.references("accounts.id"),
		)
		.addColumn("created_at", "text", (col) =>
			col.notNull().defaultTo(sql`(datetime('now'))`),
		)
		.addColumn("updated_at", "text", (col) =>
			col.notNull().defaultTo(sql`(datetime('now'))`),
		)
		.execute();
	console.log(`Table ${tableName} created successfully.`);
}

async function createTransactionsTable(
	db: Kysely<DatabaseSchema>,
): Promise<void> {
	const tableName = "transactions";
	const expectedColumns = [
		"id",
		"account_id",
		"memo",
		"currency",
		"external_id",
		"status",
		"created_at",
		"updated_at",
	];

	if (await tableExists(db, tableName)) {
		console.log(`Table ${tableName} already exists, verifying schema...`);
		const isValid = await verifyTableSchema(db, tableName, expectedColumns);
		if (isValid) {
			console.log(`Table ${tableName} schema is valid.`);
			return;
		} else {
			throw new Error(
				`Table ${tableName} exists but schema is invalid. Manual intervention required.`,
			);
		}
	}

	console.log(`Creating table ${tableName}...`);
	await db.schema
		.createTable(tableName)
		.addColumn("id", "text", (col) => col.primaryKey().defaultTo(sql`(uuid())`))
		.addColumn("account_id", "text", (col) =>
			col.notNull().references("accounts.id"),
		)
		.addColumn("memo", "text", (col) => col.notNull())
		.addColumn("currency", "text", (col) => col.notNull().defaultTo("USD"))
		.addColumn("external_id", "text", (col) => col.notNull())
		.addColumn("status", "text", (col) => col.notNull().defaultTo("PENDING"))
		.addColumn("created_at", "text", (col) =>
			col.notNull().defaultTo(sql`(datetime('now'))`),
		)
		.addColumn("updated_at", "text", (col) =>
			col.notNull().defaultTo(sql`(datetime('now'))`),
		)
		.execute();
	console.log(`Table ${tableName} created successfully.`);
}

async function createTransactionEntriesTable(
	db: Kysely<DatabaseSchema>,
): Promise<void> {
	const tableName = "transaction_entries";
	const expectedColumns = [
		"id",
		"transaction_id",
		"direction",
		"amount",
		"created_at",
		"updated_at",
	];

	if (await tableExists(db, tableName)) {
		console.log(`Table ${tableName} already exists, verifying schema...`);
		const isValid = await verifyTableSchema(db, tableName, expectedColumns);
		if (isValid) {
			console.log(`Table ${tableName} schema is valid.`);
			return;
		} else {
			throw new Error(
				`Table ${tableName} exists but schema is invalid. Manual intervention required.`,
			);
		}
	}

	console.log(`Creating table ${tableName}...`);
	await db.schema
		.createTable(tableName)
		.addColumn("id", "text", (col) => col.primaryKey().defaultTo(sql`(uuid())`))
		.addColumn("transaction_id", "text", (col) =>
			col.notNull().references("transactions.id"),
		)
		.addColumn("direction", "text", (col) => col.notNull())
		.addColumn("amount", "real", (col) => col.notNull())
		.addColumn("created_at", "text", (col) =>
			col.notNull().defaultTo(sql`(datetime('now'))`),
		)
		.addColumn("updated_at", "text", (col) =>
			col.notNull().defaultTo(sql`(datetime('now'))`),
		)
		.execute();
	console.log(`Table ${tableName} created successfully.`);
}
