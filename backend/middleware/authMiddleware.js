const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        message: "No token, access denied",
      });
    }

    // Check if it starts with Bearer
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token expired or invalid",
    });
  }
};


module.exports = authMiddleware;

// req.header("Authorization")	Get token
// jwt.verify()	Validate token
// req.user = verified	Store user info
// next()	Continue request
