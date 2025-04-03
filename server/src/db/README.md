# Database Directory

This directory contains the database configuration, connection setup, and migration files for the Solana Social Starter backend.

## Overview

The application uses PostgreSQL as its primary database, with Knex.js as the query builder and migration tool. This enables:

- Structured SQL queries with TypeScript support
- Database schema versioning through migrations
- Cross-platform compatibility
- Connection pooling

## Files

### `knex.ts`

The main database connection instance that is used throughout the application. It:

- Imports configuration from `knexfile.ts`
- Creates and exports a configured Knex instance
- Sets up logging and connection pooling

### `knexfile.ts`

Contains environment-specific database configuration:

- Connection parameters (pulled from environment variables)
- Migration settings
- Pool configuration
- SSL settings

## Migrations

The `migrations` directory contains all database schema migrations, which:

- Are executed in sequential order based on timestamp prefixes
- Use the Knex.js migration API to create, alter, and drop tables
- Support both "up" (apply) and "down" (rollback) operations

## Database Schema

The database schema includes tables for:

1. **Users**: Profile information and authentication data
2. **Threads**: Social media post content
3. **Thread Interactions**: Likes, reposts, and replies
4. **User Wallets**: Connected Solana wallets
5. **Images**: Metadata for uploaded images

## Connection

The database connection is established using the `DATABASE_URL` environment variable, which should be in the format:

```
postgresql://username:password@hostname:port/database_name
```

## Usage

The Knex instance is imported where database access is needed:

```typescript
import knex from '../db/knex';

async function getUser(userId: string) {
  return await knex('users').where({id: userId}).first();
}
```

## Migrations

To create a new migration:

```bash
npx knex migrate:make migration_name
```

This will create a new file in the `migrations` directory with the structure:

```typescript
import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create or modify tables
  return knex.schema.createTable('table_name', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Undo the changes
  return knex.schema.dropTable('table_name');
}
```

## Running Migrations

Migrations are automatically run when the server starts through the `runMigrationsAndStartServer` function in `index.ts`. They can also be run manually:

```bash
# Run all pending migrations
npx knex migrate:latest

# Roll back the last batch of migrations
npx knex migrate:rollback

# Roll back all migrations
npx knex migrate:rollback --all
```

## Best Practices

1. Always create migrations for schema changes, never modify the database directly
2. Include both "up" and "down" functions in migrations
3. Keep migrations small and focused on specific changes
4. Use transactions for complex migrations
5. Add comments to explain complex or non-obvious schema decisions
