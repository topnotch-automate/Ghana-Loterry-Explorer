# Quick Migration Guide - Fix "number3 does not exist" Error

## The Problem

You're getting this error:
```
error: column "number3" of relation "number_cooccurrence" does not exist
```

This means your database still has the old table structure (pairs) but the code expects the new structure (triplets).

## Quick Fix - Choose One Method

### Method 1: Run SQL Script Directly (Easiest)

1. Open your PostgreSQL client (pgAdmin, DBeaver, psql, etc.)
2. Connect to your database
3. Open and run this file: `backend/src/database/run-migration-manually.sql`
4. Done!

### Method 2: Using psql Command Line

```bash
psql -d your_database_name -f backend/src/database/run-migration-manually.sql
```

Replace `your_database_name` with your actual database name.

### Method 3: Using npm (if PowerShell allows)

If you can enable PowerShell scripts, run:
```powershell
cd backend
npm run migrate
```

### Method 4: Copy-Paste SQL

If you prefer, copy this SQL and run it in your database client:

```sql
DROP TABLE IF EXISTS number_cooccurrence;

CREATE TABLE IF NOT EXISTS number_cooccurrence (
  number1 INTEGER NOT NULL,
  number2 INTEGER NOT NULL,
  number3 INTEGER NOT NULL,
  count INTEGER DEFAULT 0,
  winning_count INTEGER DEFAULT 0,
  machine_count INTEGER DEFAULT 0,
  last_seen DATE,
  PRIMARY KEY (number1, number2, number3),
  CHECK (number1 < number2 AND number2 < number3)
);

CREATE INDEX IF NOT EXISTS idx_cooccurrence_number1 ON number_cooccurrence(number1);
CREATE INDEX IF NOT EXISTS idx_cooccurrence_number2 ON number_cooccurrence(number2);
CREATE INDEX IF NOT EXISTS idx_cooccurrence_number3 ON number_cooccurrence(number3);
CREATE INDEX IF NOT EXISTS idx_cooccurrence_count ON number_cooccurrence(count DESC);
CREATE INDEX IF NOT EXISTS idx_cooccurrence_last_seen ON number_cooccurrence(last_seen DESC);
```

## After Migration

Once the migration is complete:

1. The error should be resolved
2. Co-occurrence data will be recalculated automatically when you:
   - Visit the Analytics page
   - Or call the co-occurrence update endpoint

## Verify Migration

To check if the migration worked, run this query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'number_cooccurrence' 
ORDER BY ordinal_position;
```

You should see: `number1`, `number2`, `number3` (not just `number1`, `number2`).

## Important Note

⚠️ **This migration will delete existing co-occurrence data** because it drops and recreates the table. The data will be recalculated automatically when needed.

