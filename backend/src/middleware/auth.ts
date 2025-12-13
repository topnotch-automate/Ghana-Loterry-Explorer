import { Request, Response, NextFunction } from 'express';
import pool from '../database/db.js';
import { logger } from '../utils/logger.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        subscriptionTier: 'free' | 'pro';
        isPro: boolean;
      };
    }
  }
}

/**
 * Middleware to check if user is authenticated
 * For now, we'll use a simple API key or session-based approach
 * TODO: Implement proper JWT authentication
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get user ID from header, query, or session
    // For MVP, we'll use a simple user_id header
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    // Fetch user from database
    const result = await pool.query(
      `SELECT id, email, subscription_tier, subscription_expires_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const user = result.rows[0];
    const isPro = user.subscription_tier === 'pro' &&
      (user.subscription_expires_at === null || new Date(user.subscription_expires_at) > new Date());

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscription_tier,
      isPro,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check if user has Pro subscription
 */
export function requirePro(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (!req.user.isPro) {
    return next(
      new ForbiddenError(
        'Pro subscription required. Please upgrade to access advanced predictions.'
      )
    );
  }

  next();
}

/**
 * Optional auth - doesn't fail if no user, but attaches user if present
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (userId) {
      const result = await pool.query(
        `SELECT id, email, subscription_tier, subscription_expires_at
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const isPro = user.subscription_tier === 'pro' &&
          (user.subscription_expires_at === null || new Date(user.subscription_expires_at) > new Date());

        req.user = {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscription_tier,
          isPro,
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors, just log
    logger.warn('Optional auth check failed', error);
    next();
  }
}

