const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
     driverId: {
      type: Number,
      unique: true
   },
    name: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    profileImage: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["online", "offline", "idle"],
      default: "offline",
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    socketId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Driver", driverSchema);

//This file defines the structure of driver data in MongoDB.
