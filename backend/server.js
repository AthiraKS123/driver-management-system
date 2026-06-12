require("dotenv").config();

const cron = require("node-cron");
const autoDeleteDrivers = require("./jobs/autoDeleteDrivers");
const Driver = require("./models/Driver");

const express = require("express");
const http = require("http"); // ✅ required for socket
const { Server } = require("socket.io"); // ✅ socket.io

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const cors = require("cors");

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Connect DB + Redis
connectDB();
// connectRedis();

// ✅ Routes
const driverRoutes = require("./routes/drivers");
app.use("/api/drivers", driverRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// ✅ Static uploads
app.use("/uploads", express.static("uploads"));

/* =====================================================
   🚀 SOCKET.IO SETUP
===================================================== */

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Initialize socket
const io = new Server(server, {
  cors: {
    origin: "*", // ⚠️ change to frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ✅ Make io accessible everywhere (controllers)
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  /* =========================================
     🟢 DRIVER ONLINE
  ========================================= */

  socket.on("driver-online", async (driverId) => {
    try {
      console.log("🟢 Driver online:", driverId);

      // update driver
      await Driver.findByIdAndUpdate(driverId, {
        status: "online",
        socketId: socket.id,
        lastSeen: new Date(),
      });

      // save driverId inside socket
      socket.driverId = driverId;

      // emit live update
      io.emit("driver-status-changed", {
        driverId,
        status: "online",
      });
      
      io.emit("notification", {
        type: "status",
        message: `Driver ${driverId} is online`,
        time: new Date(),
      });
    } catch (err) {
      console.error("Online status error:", err.message);
    }
  });

  /* =========================================
   🟡 DRIVER IDLE
========================================= */

socket.on("driver-idle", async (driverId) => {
  try {
    console.log("🟡 Driver idle:", driverId);

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      {
        status: "idle",
        lastSeen: new Date(),
      },
      { new: true }
    );

    io.emit("driver-status-changed", {
      driverId,
      status: "idle",
    });

    io.emit("notification", {
      message: `${driver.name} is now idle`,
    });

  } catch (err) {
    console.error("Idle status error:", err.message);
  }
});

  /* =========================================
     🔴 DRIVER OFFLINE
  ========================================= */

socket.on("disconnect", async () => {
  try {
    console.log("❌ Client disconnected:", socket.id);

    if (!socket.driverId) return;

    // check if another socket still exists
    const sockets = await io.fetchSockets();

    const stillOnline = sockets.some(
      (s) =>
        s.driverId === socket.driverId &&
        s.id !== socket.id
    );

    // if another tab exists → don't go offline
    if (stillOnline) {
      console.log("🟢 Another tab still active");
      return;
    }

    // truly offline
    await Driver.findByIdAndUpdate(socket.driverId, {
      status: "offline",
      socketId: null,
      lastSeen: new Date(),
    });

    io.emit("driver-status-changed", {
      driverId: socket.driverId,
      status: "offline",
    });

    io.emit("notification", {
      message: `Driver ${socket.driverId} is offline`,
    });

    console.log("🔴 Driver offline:", socket.driverId);

  } catch (err) {
    console.error("Disconnect error:", err.message);
  }
});
});

/* =====================================================
   🧪 TEST ROUTE (optional, for debugging socket)
===================================================== */

app.get("/test-socket", (req, res) => {
  const io = req.app.get("io");

  io.emit("test-event", {
    message: "Hello from backend 🚀",
    time: new Date(),
  });

  res.send("Socket event emitted!");
});

/* =====================================================
   ❗ ERROR HANDLER (keep last)
===================================================== */

app.use(errorHandler);

/* =====================================================
   🚀 START SERVER
===================================================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* =====================================================
   ⏳ CRON JOB (unchanged)
===================================================== */

cron.schedule("0 * * * *", async () => {
  try {
    console.log("⏳ Running auto-delete job...");
    await autoDeleteDrivers();
  } catch (err) {
    console.error("Cron error:", err.message);
  }
});
