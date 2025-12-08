-- Manual Migration Script
-- Run this directly in your PostgreSQL client (psql, pgAdmin, DBeaver, etc.)
-- This will update the number_cooccurrence table from pairs to triplets

-- Step 1: Drop the old table (this will delete existing co-occurrence data)
DROP TABLE IF EXISTS number_cooccurrence;

-- Step 2: Create new table for triplets
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

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cooccurrence_number1 ON number_cooccurrence(number1);
CREATE INDEX IF NOT EXISTS idx_cooccurrence_number2 ON number_cooccurrence(number2);
CREATE INDEX IF NOT EXISTS idx_cooccurrence_number3 ON number_cooccurrence(number3);
CREATE INDEX IF NOT EXISTS idx_cooccurrence_count ON number_cooccurrence(count DESC);
CREATE INDEX IF NOT EXISTS idx_cooccurrence_last_seen ON number_cooccurrence(last_seen DESC);

-- Step 4: Record the migration (optional, for tracking)
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (migration_id, name) 
VALUES ('001', 'update cooccurrence to triplets')
ON CONFLICT (migration_id) DO NOTHING;

-- Done! The table structure is now updated.
SELECT 'Migration completed successfully!' AS status;

