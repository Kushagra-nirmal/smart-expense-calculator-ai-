const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    registerUser,
    loginUser,
    getMe,
    requestPasswordReset,
    resetPassword
    ,getBudget
    ,setBudget
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/budget", authMiddleware, getBudget);
router.put("/budget", authMiddleware, setBudget);

module.exports = router;
