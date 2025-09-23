// Simple in-memory rate limiter for mutation endpoints
// TODO: Replace with Redis-based solution for production scaling

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 20) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    // Use Array.from() to convert iterator for compatibility
    Array.from(this.store.entries()).forEach(([key, entry]) => {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    });
  }

  public isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window has reset
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  public getRemainingRequests(identifier: string): number {
    const entry = this.store.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  public getResetTime(identifier: string): number {
    const entry = this.store.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }
}

// Create rate limiters for different endpoint types
export const mutationRateLimiter = new RateLimiter(60000, 20); // 20 requests per minute
export const referralRateLimiter = new RateLimiter(300000, 5); // 5 requests per 5 minutes
export const socketConnectionLimiter = new RateLimiter(60000, 10); // 10 connections per minute per IP

// Middleware factory
export function createRateLimitMiddleware(rateLimiter: RateLimiter, action: string) {
  return (req: any, res: any, next: any) => {
    const identifier = req.user?.claims?.sub || req.ip;
    
    if (!rateLimiter.isAllowed(identifier)) {
      const resetTime = rateLimiter.getResetTime(identifier);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      return res.status(429).json({
        message: `Too many ${action} attempts. Please try again later.`,
        retryAfter,
        rateLimited: true
      });
    }

    next();
  };
}