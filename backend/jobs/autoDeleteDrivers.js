const Driver = require("../models/Driver");
const cloudinary = require("../config/cloudinary");

const autoDeleteDrivers = async () => {
  try {
    // ⏳ Find drivers in trash older than 7 days
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const drivers = await Driver.find({
      isDeleted: true,
      deletedAt: { $lte: sevenDaysAgo },
    });

    if (drivers.length === 0) {
      console.log("🟢 No drivers to auto-delete");
      return;
    }

    // 🧹 Delete each driver permanently
    for (const driver of drivers) {
      // 1. remove image from Cloudinary
      if (driver.imagePublicId) {
        await cloudinary.uploader.destroy(driver.imagePublicId);
      }

      // 2. remove from MongoDB
      await Driver.findByIdAndDelete(driver._id);
    }

    console.log(`🗑 Auto-deleted ${drivers.length} drivers`);
  } catch (error) {
    console.error("Auto delete error:", error.message);
  }
};

module.exports = autoDeleteDrivers;