/**
 * Rate limiting middleware
 * Different limits for different endpoints to prevent abuse
 */

const requestCounts = new Map();

/**
 * Generic rate limiter
 * @param {number} maxRequests - Max requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @param {string} message - Custom error message
 */
export const rateLimit = (
  maxRequests = 100,
  windowMs = 15 * 60 * 1000,
  message = 'Too many requests'
) => {
  return (req, res, next) => {
    const key = `${req.ip}:${req.originalUrl}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }

    const requests = requestCounts.get(key);
    const recentRequests = requests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      const resetTime = new Date(recentRequests[0] + windowMs);
      return res.status(429).json({
        message: message,
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
        resetTime: resetTime.toISOString(),
      });
    }

    recentRequests.push(now);
    requestCounts.set(key, recentRequests);

    // Clean up old entries periodically
    if (requestCounts.size > 10000) {
      for (const [k, v] of requestCounts.entries()) {
        const filtered = v.filter(time => time > windowStart);
        if (filtered.length === 0) {
          requestCounts.delete(k);
        } else {
          requestCounts.set(k, filtered);
        }
      }
    }

    res.set('X-RateLimit-Limit', maxRequests);
    res.set('X-RateLimit-Remaining', maxRequests - recentRequests.length);
    res.set('X-RateLimit-Reset', new Date(recentRequests[0] + windowMs).toISOString());

    next();
  };
};

/**
 * Strict rate limiter for authentication endpoints
 * 5 login attempts per 15 minutes per IP
 */
export const strictRateLimit = rateLimit(
  5,
  15 * 60 * 1000,
  'Too many login attempts. Please try again later.'
);

/**
 * Moderate rate limiter for API endpoints
 * 100 requests per 15 minutes per IP
 */
export const moderateRateLimit = rateLimit(100, 15 * 60 * 1000, 'Rate limit exceeded');

/**
 * Relaxed rate limiter for read endpoints
 * 1000 requests per 15 minutes per IP
 */
export const relaxedRateLimit = rateLimit(1000, 15 * 60 * 1000, 'Rate limit exceeded');

/**
 * Test-specific rate limiter
 * 10 test generations per day per user
 */
export const testGenerationLimit = (maxRequests = 10, windowMs = 24 * 60 * 60 * 1000) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const key = `test:${req.user.userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }

    const requests = requestCounts.get(key);
    const recentRequests = requests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      const resetTime = new Date(recentRequests[0] + windowMs);
      return res.status(429).json({
        message: `Daily test generation limit reached. You can generate ${maxRequests} tests per day.`,
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
        resetTime: resetTime.toISOString(),
        usedToday: recentRequests.length,
        totalAllowed: maxRequests,
      });
    }

    recentRequests.push(now);
    requestCounts.set(key, recentRequests);

    res.set('X-Tests-Limit', maxRequests);
    res.set('X-Tests-Used-Today', recentRequests.length);
    res.set('X-Tests-Reset', new Date(recentRequests[0] + windowMs).toISOString());

    next();
  };
};

/**
 * User-based evaluation limit
 * 5 evaluations per hour per user
 */
export const evaluationLimit = (maxRequests = 5, windowMs = 60 * 60 * 1000) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const key = `eval:${req.user.userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }

    const requests = requestCounts.get(key);
    const recentRequests = requests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      const resetTime = new Date(recentRequests[0] + windowMs);
      return res.status(429).json({
        message: `Evaluation limit reached. You can perform ${maxRequests} evaluations per hour.`,
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
        resetTime: resetTime.toISOString(),
        usedThisHour: recentRequests.length,
        totalAllowed: maxRequests,
      });
    }

    recentRequests.push(now);
    requestCounts.set(key, recentRequests);

    res.set('X-Evaluations-Limit', maxRequests);
    res.set('X-Evaluations-Used-Hour', recentRequests.length);
    res.set('X-Evaluations-Reset', new Date(recentRequests[0] + windowMs).toISOString());

    next();
  };
};

/**
 * Clear rate limit data for a specific key (useful for testing)
 */
export const clearRateLimit = key => {
  requestCounts.delete(key);
};

/**
 * Clear all rate limit data
 */
export const clearAllRateLimits = () => {
  requestCounts.clear();
};

export default {
  rateLimit,
  strictRateLimit,
  moderateRateLimit,
  relaxedRateLimit,
  testGenerationLimit,
  evaluationLimit,
  clearRateLimit,
  clearAllRateLimits,
};
