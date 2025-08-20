# Velix Ledger - Claude Development Guide

## Project Overview

Velix Ledger is a multi-tenant financial ledger system built with TypeScript and Express.js. The system manages financial transactions across multiple tenants with hierarchical account structures.

### Core Entities

- **Tenants**: Top-level organizational units in the multi-tenant system
- **Accounts**: Ledger accounts within a tenant, supporting parent-child hierarchies
- **Transactions**: Financial transactions that affect specific accounts
- **Transaction Entries**: Individual credit/debit entries within transactions

### Technology Stack

- **Runtime**: Node.js 22.18.0 (managed by Volta)
- **Language**: TypeScript with strict mode
- **Framework**: Express.js 5.x
- **Database**: SQLite with better-sqlite3
- **ORM**: Kysely for type-safe SQL queries
- **Testing**: Vitest
- **Formatting**: Biome (tab indentation, double quotes)
- **Package Manager**: Yarn 1.22.22

## Development Workflow

### Essential Commands

```bash
# Development
yarn dev              # Start development server with watch mode
yarn build            # Compile TypeScript to dist/
yarn start            # Run production build

# Quality Assurance
yarn lint             # Format code with Biome
yarn test:tsc         # TypeScript type checking
yarn test             # Run test suite with Vitest
```

### Pre-commit Checklist

Before committing any changes, always run:
1. `yarn lint` - Format code
2. `yarn test:tsc` - Verify types
3. `yarn test` - Run tests
4. `yarn build` - Ensure compilation succeeds

## Architecture Guidelines

### Database-First Approach

The system follows a database-first architecture:
1. Define database schema in `src/db/schema.ts`
2. Create migrations in `src/db/migrations.ts`
3. Update API types in `src/types/ledger.ts`

### Multi-Tenant Design

- All data is scoped by `tenant_id`
- Accounts are always associated with a specific tenant
- Accounts support hierarchical structures via `parent_account_id`
- Transactions are always associated with a specific account
- A transaction can have multiple transaction entries and debit and credit total amounts should match
- Transaction entry amounts are always represented as integers. `100` in database equals to `$1`.

### Security & Middleware Stack

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Morgan**: HTTP request logging
- **Express.json()**: JSON body parsing
- **Error Handling**: Centralized error middleware

## Feature Development Workflow

### 1. Schema Changes (CRITICAL)

**Always update these files together - they must stay synchronized:**
- `src/db/schema.ts` - Database table definitions
- `src/types/ledger.ts` - API type definitions

### 2. Development Steps

1. **Database Schema**
   - Update table definitions in `src/db/schema.ts`
   - Add migration logic in `src/db/migrations.ts`
   - Update corresponding API types in `src/types/ledger.ts`

2. **API Implementation** (Follow Service-Repository-Controller Pattern)
   - **Controllers** (`src/api/controllers/`): Handle HTTP requests/responses, validation
   - **Services** (`src/api/services/`): Business logic and orchestration
   - **Repositories** (`src/api/repositories/`): Data access layer with Kysely
   - **Validation** (`src/api/validation/`): Zod validation schemas (separate files)
   - Use Zod for request validation in controllers
   - Follow RESTful conventions (see REST API Guidelines below)
   - Implement proper error handling

3. **Testing**
   - Write unit tests in `test/` directory  
   - Use Vitest and Supertest for API testing
   - **IMPORTANT**: Tests automatically use in-memory databases (`:memory:`) - never modify file-based databases
   - Test both success and error scenarios
   - Create test data in setup hooks - don't rely on existing database state

4. **Code Quality**
   - Run `yarn lint` to format code
   - Ensure `yarn test:tsc` passes
   - Verify all tests pass with `yarn test`

### 3. File Structure Patterns

```
src/
├── api/
│   ├── controllers/   # HTTP request/response handling
│   ├── services/      # Business logic layer
│   ├── repositories/  # Data access layer
│   ├── validation/    # Zod validation schemas
│   └── routes/        # Route definitions
├── db/
│   ├── schema.ts      # Database table definitions
│   ├── migrations.ts  # Database migrations
│   ├── database.ts    # Database connection setup
│   └── utils.ts       # Database utilities
├── types/
│   ├── ledger.ts      # API type definitions
│   └── response.ts    # Response type definitions
├── middlewares/       # Express middleware
└── utils/            # General utilities
```

## Zod Validation Schema Guidelines

### Schema Organization

**Request Schemas**: Base validation on database schema types from `src/db/schema.ts`
**Response Schemas**: Base validation on API types from `src/types/ledger.ts`

### Writing Validation Schemas

#### Request Validation Schemas
Base request schemas on database types for consistency with what gets stored:

```typescript
// src/api/validation/tenantValidation.ts
import { z } from "zod";
import type { NewDbTenant } from "../../db/schema";

// For create requests - mirror database insert types
export const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  status: z.enum(["ACTIVE", "INACTIVE"])
}) satisfies z.ZodType<Omit<NewDbTenant, "id" | "created_at" | "updated_at">>;

// For update requests - make fields optional
export const updateTenantSchema = createTenantSchema.partial();
```

#### Response Validation Schemas
Base response schemas on API types to ensure consistent client contracts:

```typescript
// src/api/validation/tenantValidation.ts
import { z } from "zod";
import type { Tenant } from "../../types/ledger";

// Response schema based on API types
export const tenantResponseSchema = z.object({
  id: z.string(),
  configuration: z.object({
    name: z.string(),
    status: z.enum(["ACTIVE", "INACTIVE"])
  }),
  created_at: z.string(),
  updated_at: z.string()
}) satisfies z.ZodType<Tenant>;
```

#### Query Parameter Schemas
For URL parameters and query strings:

```typescript
export const tenantParamsSchema = z.object({
  id: z.string().uuid()
});

export const tenantQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});
```

### Schema Naming Conventions

- **Create requests**: `create{Entity}Schema`
- **Update requests**: `update{Entity}Schema`
- **Response objects**: `{entity}ResponseSchema`
- **Query parameters**: `{entity}QuerySchema`
- **URL parameters**: `{entity}ParamsSchema`

## REST API Guidelines

### HTTP Method Usage

**Always prefer PATCH over PUT for partial updates:**

- **GET**: Retrieve resources (single or collection)
- **POST**: Create new resources
- **PATCH**: Partial updates (preferred for mutations)
- **DELETE**: Remove resources
- **PUT**: Full resource replacement (avoid - use PATCH instead)

### Why PATCH over PUT?

1. **Partial Updates**: PATCH allows updating only specific fields without requiring the complete object
2. **Better UX**: Clients only send fields they want to change
3. **Simpler Validation**: Use `.partial()` on create schemas for update validation
4. **Industry Standard**: Most modern REST APIs prefer PATCH for updates

### PATCH Implementation Pattern

```typescript
// Validation schema - automatically makes all fields optional
export const updateTenantSchema = createTenantSchema.partial();

// Example PATCH request
PATCH /tenants/123
{
  "status": "INACTIVE"  // Only update status, leave name unchanged
}
```

### POST Request Body
If the POST request is for a resource which has a status property, do not require the status property. All newly created resources should start with status = 'ACTIVE'

### RESTful Route Conventions

```
GET    /entities          # List all (with optional query filters)
GET    /entities/:id      # Get single by ID
POST   /entities          # Create new
PATCH  /entities/:id      # Partial update (preferred)
DELETE /entities/:id      # Delete by ID
```

## Code Standards

### TypeScript Configuration

- **Strict Mode**: Enabled for type safety
- **Compilation Target**: Modern ES modules
- **Source Maps**: Enabled for debugging

### Code Style (Biome Configuration)

- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for strings
- **Import Organization**: Automatic sorting enabled
- **Formatting**: Applied on save

### Error Handling

- Use centralized error middleware
- Return consistent error response format
- Log errors with appropriate severity levels
- Never expose internal system details in API responses

### Database Patterns

- Use Kysely for type-safe queries
- Always use transactions for multi-step operations
- Implement proper foreign key relationships
- Use generated IDs for primary keys
- **CRITICAL**: Never delete or modify the file-based database (`./data/ledger.db`) - tests use in-memory databases automatically

## Common Tasks

### Adding a New Entity

1. Define table schema in `src/db/schema.ts`
2. Add corresponding API types in `src/types/ledger.ts`
3. Create migration in `src/db/migrations.ts`
4. Implement CRUD API routes
5. Add comprehensive tests
6. Update this documentation if needed

### Modifying Existing Entity

1. **CRITICAL**: Update both `src/db/schema.ts` AND `src/types/ledger.ts`
2. Create migration for schema changes
3. Update affected API endpoints
4. Update tests to reflect changes
5. Verify backward compatibility

### Database Migrations

- Always create reversible migrations
- Test migrations on sample data
- Update schema types after migration
- Document breaking changes

## Testing Guidelines

### Database Testing Guidelines

**CRITICAL: Database Safety Rules for Claude**

- **NEVER delete or modify the file-based database** (`./data/ledger.db` or any file specified in `DATABASE_PATH`)
- **ALWAYS use in-memory databases for tests** - The system automatically uses `:memory:` when `NODE_ENV=test`
- **Test isolation is automatic** - Each test run gets a fresh in-memory database
- **File-based databases are PROTECTED** - Only development and production use persistent files

**How Database Testing Works:**

1. **Automatic Test Database**: When `NODE_ENV=test`, the system uses SQLite's `:memory:` database
2. **Environment Detection**: The `getDatabase()` function in `src/db/database.ts` handles this automatically
3. **Test Isolation**: Each test run starts with a clean in-memory database
4. **No Cleanup Needed**: In-memory databases are automatically destroyed when tests complete

**Testing Commands:**

```bash
# These commands automatically use in-memory databases:
yarn test              # Run test suite with Vitest (NODE_ENV=test set automatically)
yarn test:tsc          # TypeScript type checking (no database interaction)
```

**Database Testing Best Practices:**

- Write tests that create their own test data in setup/beforeEach hooks
- Don't rely on existing database state - tests should be self-contained  
- Use database transactions in tests for additional isolation if needed
- Test database migrations with in-memory databases

### Test Structure

- Use `describe` blocks to group related tests
- Test both success and failure scenarios
- Use meaningful test descriptions
- Mock external dependencies

### API Testing

- Test all HTTP methods and status codes
- Verify response body structure
- Test input validation
- Test authentication/authorization

## Security Considerations

- Never expose sensitive data in API responses
- Use proper HTTP status codes
- Implement rate limiting for production
- Validate all input data with Zod
- Use parameterized queries (Kysely handles this)

## Performance Guidelines

- Use database indexes for frequently queried fields
- Implement pagination for large result sets
- Use connection pooling for database connections
- Monitor query performance and optimize slow queries

---

## Quick Reference

**Start Development**: `yarn dev`
**Run Tests**: `yarn test`
**Type Check**: `yarn test:tsc`
**Format Code**: `yarn lint`
**Build**: `yarn build`

**Key Files to Keep in Sync**:
- `src/db/schema.ts` ↔ `src/types/ledger.ts`

**Database Safety Reminders**:
- Tests use in-memory databases automatically (`:memory:`)
- NEVER delete the file-based database (`./data/ledger.db`)
- File-based databases are for development/production only
Remember: Always update database schema and API types together!