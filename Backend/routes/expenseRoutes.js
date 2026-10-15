const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    addExpense,
    getExpenses,
    deleteExpense,
    updateExpense,
    getAIAnalysis,
    assistant
} = require("../controllers/expenseController");

router.post("/", authMiddleware, addExpense);
router.get("/", authMiddleware, getExpenses);
router.get("/ai-analysis", authMiddleware, getAIAnalysis);
router.post("/assistant", authMiddleware, assistant);
router.delete("/:id", authMiddleware, deleteExpense);
router.put("/:id", authMiddleware, updateExpense);

module.exports = router;
