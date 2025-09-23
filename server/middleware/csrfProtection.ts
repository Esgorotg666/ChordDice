import type { Request, Response, NextFunction } from 'express';

/**
 * Modern CSRF protection using Origin/Referer header validation
 * This is more secure and maintainable than token-based CSRF for SPA applications
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Only apply CSRF protection to state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Skip CSRF protection for API routes that don't modify session state
  // (like login/logout which have their own OIDC protection)
  if (req.path.startsWith('/api/login') || req.path.startsWith('/api/callback') || req.path.startsWith('/api/logout')) {
    return next();
  }

  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const host = req.get('Host');

  // In development, allow localhost origins
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const allowedOrigins = isDevelopment 
    ? [`http://localhost:5000`, `https://localhost:5000`, `http://${host}`, `https://${host}`]
    : [`https://${host}`];

  let isValidOrigin = false;

  // Check Origin header first (more reliable)
  if (origin) {
    isValidOrigin = allowedOrigins.includes(origin);
  }
  // Fallback to Referer header if Origin is not present
  else if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      isValidOrigin = allowedOrigins.includes(refererOrigin);
    } catch {
      isValidOrigin = false;
    }
  }

  if (!isValidOrigin) {
    return res.status(403).json({ 
      message: 'CSRF protection: Invalid origin',
      code: 'INVALID_ORIGIN'
    });
  }

  next();
}