const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "development-only-secret" : "");
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
}

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are all required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        if (name.trim().length < 2 || password.length < 8 || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            return res.status(400).json({ message: "Use a valid email, a name of at least 2 characters, and a password of at least 8 characters." });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashPassword
        });

        const token = jwt.sign(
            { id: newUser._id },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Account created successfully!",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (err) {
        console.error("registerUser error:", err);
        res.status(500).json({
            message: err.message || "Registration failed"
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                message: "No account found with this email"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid password. Please try again."
            });
        }

        const token = jwt.sign(
            { id: user._id },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error("loginUser error:", err);
        res.status(500).json({
            message: err.message || "Login failed"
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const requestPasswordReset = async (req, res) => {
    const normalizedEmail = String(req.body?.email || "").toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expires = new Date(Date.now() + 30 * 60 * 1000);
        if (User.updateById) await User.updateById(user._id, { resetTokenHash: hash, resetTokenExpires: expires.toISOString() });
        else await User.findByIdAndUpdate(user._id, { resetTokenHash: hash, resetTokenExpires: expires });
        if (process.env.RESEND_API_KEY && process.env.RESET_FROM_EMAIL && process.env.PUBLIC_APP_URL) {
            await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESET_FROM_EMAIL, to: [user.email], subject: "Reset your ExpenseSense password", html: `<p>Reset your password within 30 minutes:</p><p><a href="${process.env.PUBLIC_APP_URL}/reset-password?token=${rawToken}">Reset password</a></p>` }) });
        }
        if (process.env.NODE_ENV !== "production") res.setHeader("X-Development-Reset-Token", rawToken);
    }
    res.json({ message: "If an account exists for that email, a reset link has been sent." });
};

const resetPassword = async (req, res) => {
    const rawToken = String(req.body?.token || "");
    const password = String(req.body?.password || "");
    if (password.length < 8 || !rawToken) return res.status(400).json({ message: "A reset token and password of at least 8 characters are required." });
    const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const user = await User.findOne({ resetTokenHash: hash });
    if (!user || !user.resetTokenExpires || new Date(user.resetTokenExpires) < new Date()) return res.status(400).json({ message: "This reset link is invalid or expired. Request a new one." });
    const update = { password: await bcrypt.hash(password, 12), resetTokenHash: null, resetTokenExpires: null };
    if (User.updateById) await User.updateById(user._id, update); else await User.findByIdAndUpdate(user._id, update);
    res.json({ message: "Password updated. You can now sign in." });
};

const getBudget = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ monthlyBudget: user.monthlyBudget ?? null });
};

const setBudget = async (req, res) => {
    const value = req.body?.monthlyBudget;
    if (value !== null && (value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0)) return res.status(400).json({ message: "Monthly budget must be zero or a positive number." });
    const monthlyBudget = value === null || value === "" ? null : Number(value);
    const update = { monthlyBudget };
    const user = User.updateById ? await User.updateById(req.user.id, update) : await User.findByIdAndUpdate(req.user.id, update, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ monthlyBudget });
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    requestPasswordReset,
    resetPassword
    ,getBudget
    ,setBudget
};
