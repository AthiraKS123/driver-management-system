const Driver = require("../models/Driver");
const asyncHandler = require("../utils/asyncHandler");
const { getDriversService } = require("../services/driverService");
// const { getCache, setCache } = require("../utils/cache");
const {
  getCache,
  setCache,
  deleteDriverCache,
} = require("../utils/redisCache");

const cloudinary = require("../config/cloudinary");

exports.getDrivers = asyncHandler(async (req, res) => {
  console.log(">>> [GET /api/drivers] request from user:", req.user.id, "query:", req.query);
  try {
    const result = await getDriversService(
      req.query,
      req.query.page,
      req.query.sort,
      req.user.id,
    );
    console.log(">>> [GET /api/drivers] SUCCESS! Returning:", result.drivers.length, "drivers");
    res.json({
      ...result,
      fromCache: false,
    });
  } catch (error) {
    console.error(">>> [GET /api/drivers] ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ ADD driver
exports.addDriver = async (req, res) => {
  try {
    const { name, city, phone } = req.body;
    console.log("FILE DATA:", req.file); // 👈 ADD THIS

    // validation
    if (!name || !city || !phone) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }
  const lastDriver = await Driver.findOne({
  driverId: { $exists: true }
}).sort({ driverId: -1 });

const newDriverId =
  lastDriver?.driverId
    ? lastDriver.driverId + 1
    : 1;

   const driver = new Driver({
  driverId: newDriverId,
  name,
  city: city.trim().toLowerCase(),
  phone,
  user: req.user.id,
  profileImage: req.file?.path || null,
  imagePublicId: req.file?.filename || req.file?.public_id || null,
});
    console.log(req.file);
    await driver.save();
    await deleteDriverCache(req.user.id);
    const io = req.app.get("io");
    io.emit("driver-added", driver);

    res.status(201).json({
      message: "Driver created successfully",
      driver,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (driver.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// ✅ UPDATE driver (only owner can update)

exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (driver.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (driver.isDeleted) {
      return res.status(400).json({ message: "Driver is deleted" });
    }

    if (req.file) {
      // delete old image
      if (driver.imagePublicId) {
        await cloudinary.uploader.destroy(driver.imagePublicId);
      }

      driver.profileImage = req.file.path;
      driver.imagePublicId = req.file.filename;
    }

    // update other fields
    driver.name = req.body.name || driver.name;
    driver.city = req.body.city
      ? req.body.city.trim().toLowerCase()
      : driver.city;
    driver.phone = req.body.phone || driver.phone;

    await driver.save();
    await deleteDriverCache(req.user.id);
    const io = req.app.get("io");
    io.emit("driver-updated", driver);

    res.json({
      message: "Driver updated",
      driver,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ DELETE driver (only owner can delete)
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (driver.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    driver.isDeleted = true;
    driver.deletedAt = new Date();

    await driver.save();

    await deleteDriverCache(req.user.id);
    const io = req.app.get("io");
    io.emit("driver-deleted", driver);

    res.json({
      message: "Driver moved to trash",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDeletedDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({
      user: req.user.id,
      isDeleted: true,
    });

    res.json({ drivers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.restoreDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (driver.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    driver.isDeleted = false;
    driver.deletedAt = null;

    await driver.save();

    await deleteDriverCache(req.user.id);
    const io = req.app.get("io");
    io.emit("driver-restored", driver);

    res.json({ message: "Driver restored" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.permanentDeleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (driver.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🔥 delete image from cloud
    if (driver.imagePublicId) {
      await cloudinary.uploader.destroy(driver.imagePublicId);
    }

    await Driver.findByIdAndDelete(req.params.id);

    await deleteDriverCache(req.user.id);
    const io = req.app.get("io");
    io.emit("driver-permanently-deleted", { id: req.params.id });

    res.json({ message: "Driver permanently deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDriverStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const mongoose = require("mongoose");

    const totalDrivers = await Driver.countDocuments({
      user: userId,
      isDeleted: false,
    });

    const cityStats = await Driver.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { $toLower: "$city" }, // ✅ THIS MUST BE HERE
          count: { $sum: 1 },
        },
      },
    ]);

    const cities = {};
    cityStats.forEach((item) => {
      cities[item._id] = item.count;
    });

    res.json({
      totalDrivers,
      cities,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//  Controllers contain logic for API operations.
