import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  logger.info('✅ Database connected');
});

pool.on('error', (err) => {
  logger.error('❌ Database connection error', err);
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => {
    logger.info('✅ Database connection test successful');
  })
  .catch((err) => {
    logger.error('❌ Database connection test failed', err);
  });

export default pool;

