/**
 * Base configuration structure shared across entities
 */
type BaseConfiguration = {
	/** Human-readable name for the entity */
	name: string;
	/** Current operational status of the entity */
	status: "ACTIVE" | "INACTIVE";
};

/**
 * Tenant entity representing a multi-tenant organization
 * Tenants are the top-level organizational unit in the ledger system
 */
export type Tenant = {
	/** Unique identifier for the tenant */
	id: string;
	/** Configuration settings for the tenant */
	configuration: BaseConfiguration;
	/** ISO timestamp when the tenant was created */
	created_at: string;
	/** ISO timestamp when the tenant was last updated */
	updated_at: string;
};

/**
 * Account entity representing a ledger account within a tenant
 * Accounts support hierarchical structures via parent-child relationships
 */
export type Account = {
	/** Unique identifier for the account */
	id: string;
	/** Reference to the tenant that owns this account */
	tenant_id: string;
	/** Configuration settings for the account */
	configuration: BaseConfiguration;
	/** Reference to parent account for hierarchical structures, null for top-level accounts */
	parent_account_id: string | null;
	/** ISO timestamp when the account was created */
	created_at: string;
	/** ISO timestamp when the account was last updated */
	updated_at: string;
};

/**
 * Supported currencies in the ledger system
 * Currently limited to USD
 */
export type Currency = "USD";

/**
 * Direction of a transaction entry
 * CREDIT increases account balance, DEBIT decreases account balance
 */
export type TransactionDirection = "CREDIT" | "DEBIT";

/**
 * Lifecycle status of a transaction
 * PENDING: Transaction created but not yet processed
 * POSTED: Transaction successfully processed and affects account balance
 * CANCELLED: Transaction has been cancelled and does not affect balance
 */
export type TransactionStatus = "PENDING" | "POSTED" | "CANCELLED";

/**
 * Individual entry within a transaction
 * Multiple entries allow for complex multi-leg transactions
 */
export type TransactionEntry = {
	/** Whether this entry credits or debits the account */
	direction: TransactionDirection;
	/** Monetary amount for this entry, always positive */
	amount: number;
	/** ISO timestamp when the transaction was created */
	created_at: string;
	/** ISO timestamp when the transaction was last updated */
	updated_at: string;
};

/**
 * Complete transaction entity representing a financial transaction
 * Each transaction affects exactly one account and contains one or more entries
 */
export type Transaction = {
	/** Unique identifier for the transaction */
	id: string;
	/** Reference to the account this transaction affects */
	account_id: string;
	/** Human-readable description or note for the transaction */
	memo: string;
	/** Collection of transaction entries that make up this transaction */
	entries: TransactionEntry[];
	/** Currency denomination for all amounts in this transaction */
	currency: Currency;
	/** External system identifier for tracking and reconciliation */
	external_id: string;
	/** ISO timestamp when the transaction was created */
	created_at: string;
	/** ISO timestamp when the transaction was last updated */
	updated_at: string;
};
