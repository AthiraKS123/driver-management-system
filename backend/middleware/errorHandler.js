const errorHandler = (err, req, res, next) => {
  console.error(err);

  // 🔴 Duplicate key (MongoDB)
  if (err.code === 11000) {
    return res.status(400).json({
      message: "Duplicate field value",
    });
  }

  // 🔴 Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(", "),
    });
  }

  // 🔴 Default error
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
  });
};

module.exports = errorHandler;