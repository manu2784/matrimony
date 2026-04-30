"use strict";

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 60;
  const keyGenerator =
    options.keyGenerator ||
    ((req) => req.user?._id || req.ip || req.headers["x-forwarded-for"]);
  const requests = new Map();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = String(keyGenerator(req) || "anonymous");
    const current = requests.get(key);

    if (!current || current.resetAt <= now) {
      requests.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    current.count += 1;

    if (current.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfterSeconds,
      });
    }

    requests.set(key, current);
    return next();
  };
}

module.exports = createRateLimiter;
