const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Driver = require("../models/Driver");
const authMiddleware = require("../middleware/authMiddleware");

// Get chat history for a specific driver
router.get("/:driverId", authMiddleware, async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // Ensure the driver exists and belongs to the current user (admin)
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    
    // Note: the mobile app doesn't send auth token that belongs to admin for the driver-mode exactly,
    // wait, driver-mode uses a shared admin token right now (since it's a demo app), so this will work.
    if (driver.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this chat" });
    }

    const messages = await Message.find({ driver: driverId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
