#!/usr/bin/env tsx
/**
 * Database Migration Runner
 * 
 * This script runs pending database migrations in order.
 * 
 * Usage:
 *   npm run migrate
 *   or
 *   tsx src/scripts/migrate.ts [--dry-run]
 */

import pool from '../database/db.js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  id: string;
  name: string;
  filename: string;
  sql: string;
}

// Create migrations table if it doesn't exist
async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// Get list of executed migrations
async function getExecutedMigrations(): Promise<string[]> {
  const result = await pool.query('SELECT migration_id FROM schema_migrations ORDER BY migration_id');
  return result.rows.map((row) => row.migration_id);
}

// Load all migration files
function loadMigrations(): Migration[] {
  const migrationsDir = join(__dirname, '../database/migrations');
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort(); // Sort to ensure order

  return files.map((file) => {
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) {
      throw new Error(`Invalid migration filename format: ${file}. Expected: NNN_name.sql`);
    }

    const [, id, name] = match;
    const filePath = join(migrationsDir, file);
    const sql = readFileSync(filePath, 'utf-8');

    return {
      id,
      name: name.replace(/_/g, ' '),
      filename: file,
      sql,
    };
  });
}

// Execute a single migration
async function executeMigration(migration: Migration, dryRun: boolean = false): Promise<void> {
  if (dryRun) {
    logger.info(`[DRY RUN] Would execute migration: ${migration.filename}`);
    logger.info(`[DRY RUN] SQL:\n${migration.sql}`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Execute the migration SQL
    await client.query(migration.sql);

    // Record the migration
    await client.query(
      'INSERT INTO schema_migrations (migration_id, name) VALUES ($1, $2)',
      [migration.id, migration.name]
    );

    await client.query('COMMIT');
    logger.info(`✅ Migration executed: ${migration.filename} (${migration.name})`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`❌ Migration failed: ${migration.filename}`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Main migration function
async function runMigrations(dryRun: boolean = false) {
  try {
    logger.info('Starting database migrations...');

    // Ensure migrations table exists
    await ensureMigrationsTable();

    // Load all migrations
    const allMigrations = loadMigrations();
    logger.info(`Found ${allMigrations.length} migration file(s)`);

    if (allMigrations.length === 0) {
      logger.info('No migrations to run');
      return;
    }

    // Get executed migrations
    const executed = await getExecutedMigrations();
    logger.info(`Already executed: ${executed.length} migration(s)`);

    // Find pending migrations
    const pending = allMigrations.filter((m) => !executed.includes(m.id));

    if (pending.length === 0) {
      logger.info('✅ All migrations are up to date');
      return;
    }

    logger.info(`Pending migrations: ${pending.length}`);

    // Execute pending migrations in order
    for (const migration of pending) {
      logger.info(`Running migration: ${migration.filename} (${migration.name})`);
      await executeMigration(migration, dryRun);
    }

    logger.info('✅ All migrations completed successfully');
  } catch (error) {
    logger.error('❌ Migration process failed', error);
    throw error;
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  runMigrations(dryRun)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error in migration', error);
      process.exit(1);
    });
}

export { runMigrations };

