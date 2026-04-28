const express = require("express");
const router = express.Router();

const driverController = require("../controllers/driverController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/stats", authMiddleware, driverController.getDriverStats);

router.get("/", authMiddleware, driverController.getDrivers);

router.post(
  "/",
  authMiddleware,
  upload.single("profileImage"),
  driverController.addDriver,
);

router.put(
  "/:id",
  authMiddleware,
  upload.single("profileImage"),
  driverController.updateDriver,
);

router.delete("/:id", authMiddleware, driverController.deleteDriver);
router.get("/:id", authMiddleware, driverController.getDriverById);

router.get("/trash", authMiddleware, driverController.getDeletedDrivers);

router.put("/restore/:id", authMiddleware, driverController.restoreDriver);

router.delete(
  "/permanent/:id",
  authMiddleware,
  driverController.permanentDeleteDriver,
);

module.exports = router;
