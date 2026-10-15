const mongoose = require("mongoose");
const { setMongoConnected } = require("../models/dbAdapter");

const connectDB = async () => {
    const rawUri = process.env.MONGO_URI;
    if (!rawUri && process.env.NODE_ENV === "production") {
        throw new Error("MONGO_URI must be configured in production; refusing to use local fallback storage.");
    }
    if (!rawUri) {
        console.warn("No MONGO_URI configured; using local JSON storage for development only.");
        setMongoConnected(false);
        return;
    }
    const mongoUri = rawUri.trim();

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 2500
        });
        setMongoConnected(true);
        console.log("✓ MongoDB Connected Successfully to:", mongoUri);
    } catch (err) {
        setMongoConnected(false);
        if (process.env.NODE_ENV === "production") {
            throw new Error(`MongoDB connection failed in production: ${err.message}`);
        }
        console.log("ℹ Notice: Local MongoDB not detected (reason: " + (err.code || err.message) + ")");
        console.log("✓ Running with built-in persistent storage (data/*.json). All features fully operational!");
    }
};

module.exports = connectDB;
