const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "development-only-secret" : "");
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
}

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access Denied: Missing or invalid token"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, JWT_SECRET || "development-only-secret");

        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({
            message: "Session expired or invalid token. Please log in again."
        });
    }
};

module.exports = authMiddleware;
