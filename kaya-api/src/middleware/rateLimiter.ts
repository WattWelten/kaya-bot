/**
 * Rate Limiting Middleware
 * Enhanced rate limiting with Redis support
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from './errorHandler';
import container from '../config/container';
import { ICacheRepository } from '../types/services';
import logger from './logger';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate limiter middleware factory
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    keyGenerator = (req) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`;
      const cacheRepo = container.resolve<ICacheRepository>('cacheRepository');

      // Get current count
      const count = await cacheRepo.get<number>(key, 'rateLimit') || 0;

      if (count >= maxRequests) {
        logger.warn('Rate limit exceeded', {
          key,
          count,
          maxRequests,
          ip: req.ip,
          path: req.path,
        });

        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

        return next(new RateLimitError(`Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds`));
      }

      // Increment count
      await cacheRepo.set(key, count + 1, 'rateLimit', windowMs);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - count - 1).toString());
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

      // Track response status
      const originalSend = res.send;
      res.send = function (body: any) {
        const statusCode = res.statusCode;
        const shouldSkip = 
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400);

        if (!shouldSkip) {
          // Count will be decremented on next request window
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Rate limiter error', { error: error instanceof Error ? error.message : String(error) });
      // Fail open - allow request if rate limiter fails
      next();
    }
  };
};

// Predefined rate limiters
export const chatRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30,
});

export const audioRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10,
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
});

