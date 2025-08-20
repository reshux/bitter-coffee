import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface TenantsTable {
	id: Generated<string>;
	name: string;
	status: "ACTIVE" | "INACTIVE";
	created_at: Generated<string>;
	updated_at: Generated<string>;
}

export interface AccountsTable {
	id: Generated<string>;
	tenant_id: string;
	name: string;
	status: "ACTIVE" | "INACTIVE";
	parent_account_id: string | null;
	created_at: Generated<string>;
	updated_at: Generated<string>;
}

export interface TransactionsTable {
	id: Generated<string>;
	account_id: string;
	memo: string;
	currency: "USD";
	external_id: string;
	status: "PENDING" | "POSTED" | "CANCELLED";
	created_at: Generated<string>;
	updated_at: Generated<string>;
}

export interface TransactionEntriesTable {
	id: Generated<string>;
	transaction_id: string;
	direction: "CREDIT" | "DEBIT";
	amount: number;
	created_at: Generated<string>;
	updated_at: Generated<string>;
}

export interface DatabaseSchema {
	tenants: TenantsTable;
	accounts: AccountsTable;
	transactions: TransactionsTable;
	transaction_entries: TransactionEntriesTable;
}

export type DbTenant = Selectable<TenantsTable>;
export type NewDbTenant = Insertable<TenantsTable>;
export type DbTenantUpdate = Updateable<TenantsTable>;

export type DbAccount = Selectable<AccountsTable>;
export type NewDbAccount = Insertable<AccountsTable>;
export type DbAccountUpdate = Updateable<AccountsTable>;

export type DbTransaction = Selectable<TransactionsTable>;
export type NewDbTransaction = Insertable<TransactionsTable>;
export type DbTransactionUpdate = Updateable<TransactionsTable>;

export type DbTransactionEntry = Selectable<TransactionEntriesTable>;
export type NewDbTransactionEntry = Insertable<TransactionEntriesTable>;