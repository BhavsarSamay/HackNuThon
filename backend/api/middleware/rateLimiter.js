const rateLimit = require("express-rate-limit");

// Function to create rate limiter
const createRateLimiter = (minutes, maxRequests) => {
  return rateLimit({
    windowMs: minutes * 60 * 1000, // Convert minutes to milliseconds
    max: maxRequests, // Limit each IP to the specified number of requests
    message: `Too many requests from this IP, please try again later.`,
    keyGenerator: (req) => {
      // Use a combination of IP and the route path to create a unique key
      return `${req.ip}:${req.originalUrl}`;
    },
    handler: (req, res) => {
      res.status(429).json({
        message: `Too many requests, please try again later.`,
      });
    },
  });
};

// Middleware function to apply rate limiting
const rateLimiterMiddleware = (minutes, maxRequests) => {
  const limiter = createRateLimiter(minutes, maxRequests);

  return (req, res, next) => {
    limiter(req, res, () => {
      const requestCount = req.rateLimit.current; // Get current request count
      next();
    });
  };
};

module.exports = rateLimiterMiddleware;
