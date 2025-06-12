const mongoose = require("mongoose");
const databaseUrl = process.env.MONGODB_URL || "mongodb://0.0.0.0:27017"
module.exports = () => {
  mongoose
    .connect(databaseUrl)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      process.exit(1);
    });
};
;
