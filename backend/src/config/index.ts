import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  pythonService: {
    url: process.env.PYTHON_SERVICE_URL || 'http://localhost:5001',
  },
} as const;

// Validate required environment variables
if (!config.database.url) {
  throw new Error('DATABASE_URL environment variable is required');
}

