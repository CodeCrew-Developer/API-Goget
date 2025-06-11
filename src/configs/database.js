const mongoose = require("mongoose");

module.exports = () => {
  mongoose
    .connect("mongodb://0.0.0.0:27017/gogetData")
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      process.exit(1);
    });
};
;
