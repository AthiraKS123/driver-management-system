
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db"); // ✅ FIXED
const { connectRedis } = require("./config/redis");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();
const cors = require("cors");
app.use(cors());

// ✅ Middleware
app.use(express.json());
app.use("/api", apiLimiter);

// ✅ CONNECT DATABASE
connectDB();
connectRedis();

// ✅ Routes
const driverRoutes = require("./routes/drivers"); // ✅ FIXED
app.use("/api/drivers", driverRoutes);

// ✅ Auth Routes
const authRoutes = require("./routes/authRoutes"); // ✅ FIXED
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));

// ✅ Server start
const PORT = process.env.PORT || 5000;

app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

