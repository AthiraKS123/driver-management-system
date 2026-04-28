const rateLimit = require("express-rate-limit");

// 🔐 Login limiter (strict)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 5,
  message: "Too many login attempts. Try again later.",
});

// 🌐 General API limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: "Too many requests. Slow down.",
});

module.exports = {
  loginLimiter,
  apiLimiter,
};