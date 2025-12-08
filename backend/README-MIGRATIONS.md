# Database Migrations Guide

This guide explains how to run database migrations for the Ghana Lottery Explorer application.

## Overview

Migrations are SQL scripts that modify your database schema. They are stored in `backend/src/database/migrations/` and are executed in order based on their numeric prefix.

## Quick Start

### Run All Pending Migrations

```bash
cd backend
npm run migrate
```

### Preview Migrations (Dry Run)

To see what migrations would run without actually executing them:

```bash
npm run migrate:dry-run
```

## Migration Files

Migration files are named with the pattern: `NNN_description.sql`

- `NNN` - Sequential number (001, 002, 003, etc.)
- `description` - Descriptive name (underscores allowed)

Example: `001_update_cooccurrence_to_triplets.sql`

## Current Migrations

### 001_update_cooccurrence_to_triplets.sql

Updates the `number_cooccurrence` table from pairs (2 numbers) to triplets (3 numbers).

**Important:** This migration will:
- Drop the existing `number_cooccurrence` table
- Create a new table structure for triplets
- **All existing co-occurrence data will be lost**

If you have important co-occurrence data, you may want to export it first.

## How It Works

1. The migration runner checks for a `schema_migrations` table (creates it if needed)
2. It loads all `.sql` files from the migrations directory
3. It checks which migrations have already been executed
4. It runs pending migrations in order
5. It records each executed migration in the `schema_migrations` table

## Manual Migration

If you prefer to run migrations manually using a database client:

### Using psql

```bash
psql -d your_database_name -f backend/src/database/migrations/001_update_cooccurrence_to_triplets.sql
```

### Using pgAdmin or DBeaver

1. Open the migration file in your SQL editor
2. Connect to your database
3. Execute the SQL script

## Checking Migration Status

You can check which migrations have been executed by querying the database:

```sql
SELECT * FROM schema_migrations ORDER BY migration_id;
```

## Creating New Migrations

1. Create a new file in `backend/src/database/migrations/`
2. Name it with the next sequential number: `002_your_migration_name.sql`
3. Write your SQL migration script
4. Run `npm run migrate` to execute it

### Migration Best Practices

- **Always test migrations** on a development database first
- **Backup your database** before running migrations in production
- **Make migrations idempotent** when possible (use `IF NOT EXISTS`, `IF EXISTS`, etc.)
- **Never modify existing migration files** - create new ones instead
- **Document breaking changes** in migration comments

## Troubleshooting

### Migration Fails

If a migration fails:

1. Check the error message in the console
2. The migration runner uses transactions, so failed migrations are rolled back
3. Fix the issue in the migration file
4. Re-run the migration

### Migration Already Executed

If you need to re-run a migration:

1. Remove it from `schema_migrations`:
   ```sql
   DELETE FROM schema_migrations WHERE migration_id = '001';
   ```
2. Re-run the migration script

**Warning:** Only do this if you understand the consequences. Re-running migrations that modify data can cause issues.

### Database Connection Issues

Ensure your database connection is configured correctly in `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```

## Example Migration File

```sql
-- Migration: 002_add_user_table
-- Description: Adds a users table for future authentication

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## Rollback

The current migration system doesn't include automatic rollback. To rollback a migration:

1. Create a new migration that reverses the changes
2. Or manually reverse the changes using SQL

Example rollback migration:

```sql
-- Migration: 003_rollback_002_add_user_table
-- Description: Removes the users table

DROP TABLE IF EXISTS users;
```

## Production Deployment

When deploying to production:

1. **Backup your database** first
2. Test migrations on a staging environment
3. Run migrations during a maintenance window if possible
4. Monitor the application after migration
5. Keep migration logs for audit purposes

```bash
# Production migration
npm run migrate 2>&1 | tee migration-$(date +%Y%m%d-%H%M%S).log
```

