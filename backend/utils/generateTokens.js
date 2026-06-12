const jwt = require("jsonwebtoken");

// 🔵 Access Token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // short life
  );
};

// 🟢 Refresh Token (long-lived)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" } // long life
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};