const io = require("socket.io-client");

// Connect to your local backend
const socket = io("http://localhost:5000", { transports: ["websocket"] });

// We'll use one of the driver IDs from your database
const DRIVER_ID = "6a0739f2384bc8ab089cfedb"; 

socket.on("connect", () => {
  console.log("🔌 Simulator connected to backend!");
  
  console.log(`🟢 Setting driver ${DRIVER_ID} to ONLINE...`);
  socket.emit("driver-online", DRIVER_ID);
  
  setTimeout(() => {
    console.log(`🟡 Setting driver ${DRIVER_ID} to IDLE...`);
    socket.emit("driver-idle", DRIVER_ID);
  }, 5000);

  setTimeout(() => {
    console.log("🔴 Disconnecting simulator (driver goes OFFLINE)...");
    socket.disconnect();
    process.exit(0);
  }, 10000);
});

socket.on("connect_error", (err) => {
  console.log("Connection Error:", err.message);
});
