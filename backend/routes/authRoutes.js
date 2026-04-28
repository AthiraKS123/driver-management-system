const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { loginLimiter } = require("../middleware/rateLimiter");

router.post("/logout", authMiddleware, authController.logout);

// register
router.post("/register", authController.register);

// login (we’ll add next)
router.post("/login", loginLimiter, authController.login);

router.get("/me", authMiddleware, authController.getProfile);
router.post("/refresh", authController.refreshToken);

module.exports = router;