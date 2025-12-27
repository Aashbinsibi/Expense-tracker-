import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
    [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
    keyGenerator?: (req: Request) => string;
}

export const rateLimit = (options: RateLimitOptions) => {
    const { windowMs, maxRequests, keyGenerator } = options;
    const defaultKeyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown';

    return (req: Request, res: Response, next: NextFunction): void => {
        const key = keyGenerator ? keyGenerator(req) : defaultKeyGenerator(req);
        const now = Date.now();

        if (!store[key]) {
            store[key] = { count: 0, resetTime: now + windowMs };
        }

        const entry = store[key];

        // Reset if window has passed
        if (now > entry.resetTime) {
            entry.count = 0;
            entry.resetTime = now + windowMs;
        }

        entry.count++;

        // Set rate limit headers
        res.set('X-RateLimit-Limit', maxRequests.toString());
        res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
        res.set('X-RateLimit-Reset', entry.resetTime.toString());

        if (entry.count > maxRequests) {
            res.status(429).json({ error: 'Too many requests, please try again later' });
            return;
        }

        next();
    };
};
