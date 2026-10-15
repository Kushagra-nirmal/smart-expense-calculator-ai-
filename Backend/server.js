const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const connectDB = require("./config/db");
const { getMongoConnected } = require("./models/dbAdapter");

const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

// Initialize database connection
connectDB().catch((error) => {
    console.error("Database startup failed:", error.message);
    process.exit(1);
});

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
    throw new Error("CORS_ORIGINS must be configured in production.");
}
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key"]
}));

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Cache-Control", req.path.startsWith("/api") ? "no-store" : "public, max-age=31536000, immutable");
    next();
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "Smart Expense Tracker AI Backend",
        database: getMongoConnected() ? "MongoDB" : "Local Persistent JSON Storage",
        timestamp: new Date().toISOString()
    });
});

// Serve Frontend in Production / Unified Deployment
const frontendDistPath = path.join(__dirname, "../Frontend/dist");

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));

    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
} else {
    app.get("/", (req, res) => {
        res.json({
            message: "Smart Expense Tracker AI Backend is active and running",
            endpoints: {
                users: "/api/users",
                expenses: "/api/expenses",
                health: "/api/health"
            }
        });
    });
}

// Global 404 handler for API routes
app.use("/api/*", (req, res) => {
    res.status(404).json({ message: `API route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Smart Expense Tracker Server running on port ${PORT}`);
    console.log(`🔗 Web App: http://localhost:${PORT}/`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});
