const Expense = require("../models/Expense");
const User = require("../models/User");

const addExpense = async (req, res) => {
    try {
        const { title, amount, category, type, date, clientRequestId } = req.body;

        if (!title || amount === undefined || !category || !type) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const parsedAmount = Number(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be a positive number"
            });
        }

        if (!["Income", "Expense"].includes(type)) {
            return res.status(400).json({
                message: "Type must be either Income or Expense"
            });
        }

        if (clientRequestId) {
            const existing = await Expense.findOne({ user: req.user.id, clientRequestId });
            if (existing) return res.status(200).json({ message: "Transaction already recorded", expense: existing, duplicate: true });
        }
        const expense = await Expense.create({
            user: req.user.id,
            title: title.trim(),
            amount: parsedAmount,
            category: category.trim(),
            type,
            date: date || new Date(),
            clientRequestId
        });

        res.status(201).json({
            message: "Transaction added successfully",
            expense
        });
    } catch (err) {
        console.error("addExpense error:", err);
        res.status(500).json({
            message: err.message || "Failed to add expense"
        });
    }
};

const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json(expenses);
    } catch (err) {
        console.error("getExpenses error:", err);
        res.status(500).json({
            message: err.message || "Failed to fetch expenses"
        });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        // Security check: verify expense belongs to authenticated user
        if (expense.user.toString() !== req.user.id) {
            return res.status(401).json({
                message: "Unauthorized to delete this record"
            });
        }

        await expense.deleteOne();

        res.status(200).json({
            message: "Expense deleted successfully"
        });
    } catch (err) {
        console.error("deleteExpense error:", err);
        res.status(500).json({
            message: err.message || "Failed to delete expense"
        });
    }
};

const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        if (expense.user.toString() !== req.user.id) {
            return res.status(401).json({
                message: "Unauthorized to update this record"
            });
        }

        // Prevent tampering with user ownership
        const updateData = { ...req.body };
        delete updateData.user;
        delete updateData._id;

        if (updateData.amount !== undefined) {
            const parsed = Number(updateData.amount);
            if (isNaN(parsed) || parsed <= 0) {
                return res.status(400).json({ message: "Amount must be a positive number" });
            }
            updateData.amount = parsed;
        }

        const updatedExpense = await Expense.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json(updatedExpense);
    } catch (err) {
        console.error("updateExpense error:", err);
        res.status(500).json({
            message: err.message || "Failed to update expense"
        });
    }
};

const getAIAnalysis = async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id });
        const totalIncome = expenses
            .filter(e => e.type === "Income")
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const totalExpense = expenses
            .filter(e => e.type === "Expense")
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const netBalance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

        const categoryBreakdown = {};
        expenses.filter(e => e.type === "Expense").forEach(e => {
            categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + Number(e.amount);
        });

        const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
        const highestCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : "None";
        const highestCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

        // Health Score calculation (0 to 100)
        let healthScore = 50;
        const recommendations = [];

        if (expenses.length === 0) {
            healthScore = 50;
            recommendations.push("Start by adding your monthly income and first expenses to see personalized AI insights.");
        } else {
            if (totalIncome > 0) {
                if (savingsRate >= 30) {
                    healthScore = 90;
                    recommendations.push("Excellent financial discipline! Your savings rate exceeds the recommended 20-30% benchmark.");
                } else if (savingsRate >= 15) {
                    healthScore = 75;
                    recommendations.push("Healthy financial flow. Consider putting 10% more into savings or investments.");
                } else if (savingsRate >= 0) {
                    healthScore = 55;
                    recommendations.push("You are spending most of your income. Look for non-essential expenses you can optimize.");
                } else {
                    healthScore = 30;
                    recommendations.push("Warning: Expenses exceed current income. Prioritize eliminating non-essential recurring costs.");
                }
            } else if (totalExpense > 0) {
                healthScore = 35;
                recommendations.push("You have recorded expenses without logging income. Add your salary or income sources for balanced analysis.");
            }

            if (highestCategoryAmount > 0 && totalExpense > 0) {
                const highestRatio = Math.round((highestCategoryAmount / totalExpense) * 100);
                if (highestRatio > 40) {
                    recommendations.push(`Notice: "${highestCategory}" consumes ${highestRatio}% of your total expenses. Review options to reduce this category.`);
                }
            }
        }

        res.status(200).json({
            totalIncome,
            totalExpense,
            netBalance,
            savingsRate,
            healthScore,
            highestCategory,
            highestCategoryAmount,
            categoryBreakdown,
            recommendations
        });
    } catch (err) {
        console.error("getAIAnalysis error:", err);
        res.status(500).json({
            message: err.message || "Failed to generate AI analysis"
        });
    }
};

const assistant = async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id });
        const user = await User.findById(req.user.id);
        const question = String(req.body?.question || "").trim();
        const income = expenses.filter((item) => item.type === "Income").reduce((sum, item) => sum + Number(item.amount), 0);
        const spending = expenses.filter((item) => item.type === "Expense");
        const total = spending.reduce((sum, item) => sum + Number(item.amount), 0);
        const byCategory = spending.reduce((map, item) => { map[item.category] = (map[item.category] || 0) + Number(item.amount); return map; }, {});
        const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
        const months = new Set(spending.map((item) => new Date(item.date).toISOString().slice(0, 7))).size || 1;
        const monthlyAverage = Math.round(total / months);
        const titleCounts = spending.reduce((map, item) => { const key = item.title.trim().toLowerCase(); map[key] = (map[key] || 0) + 1; return map; }, {});
        const recurringTitles = Object.entries(titleCounts).filter(([, count]) => count >= 2).map(([title]) => title);
        const monthTotals = spending.reduce((map, item) => { const month = new Date(item.date).toISOString().slice(0, 7); map[month] = (map[month] || 0) + Number(item.amount); return map; }, {});
        const monthKeys = Object.keys(monthTotals).sort();
        const latestMonth = monthKeys.at(-1);
        const previousMonth = monthKeys.at(-2);
        const budget = user?.monthlyBudget || 0;
        const budgetProgress = budget ? Math.round((total / budget) * 100) : null;
        const deterministicAnswer = question.toLowerCase().includes("budget") && budget
            ? `You have used approximately ${budgetProgress}% of your ₹${budget.toLocaleString("en-IN")} monthly budget based on ₹${total.toLocaleString("en-IN")} recorded spending.`
            : question.toLowerCase().includes("income")
            ? `Recorded income is ₹${income.toLocaleString("en-IN")} across ${expenses.length} transactions.`
            : `Recorded spending is ₹${total.toLocaleString("en-IN")} across ${spending.length} expenses, averaging ₹${monthlyAverage.toLocaleString("en-IN")} per active month.`;
        const suggestions = [];
        if (top) suggestions.push({ text: `${top[0]} is your largest category at ₹${Math.round(top[1]).toLocaleString("en-IN")}. Review the supporting transactions before reducing it.`, supportingTransactions: spending.filter((item) => item.category === top[0]).map((item) => item._id) });
        if (income > 0 && total > income) suggestions.push({ text: `Recorded spending is ₹${Math.round(total - income).toLocaleString("en-IN")} above recorded income. Consider reviewing non-essential expenses.`, supportingTransactions: spending.map((item) => item._id) });
        if (recurringTitles.length) suggestions.push({ text: `Repeated transaction patterns include ${recurringTitles.slice(0, 3).join(", ")}. Confirm whether these are recurring commitments.`, supportingTransactions: spending.filter((item) => recurringTitles.includes(item.title.trim().toLowerCase())).map((item) => item._id) });
        if (latestMonth && previousMonth && monthTotals[latestMonth] > monthTotals[previousMonth] * 1.2) suggestions.push({ text: `Spending in ${latestMonth} is ${Math.round(((monthTotals[latestMonth] / monthTotals[previousMonth]) - 1) * 100)}% above ${previousMonth}. Review the listed transactions for unusual changes.`, supportingTransactions: spending.filter((item) => new Date(item.date).toISOString().startsWith(latestMonth)).map((item) => item._id) });
        let answer = deterministicAnswer;
        let provider = "deterministic";
        if (process.env.OPENAI_API_KEY && question) {
            try {
                const context = JSON.stringify({ question, income, totalSpending: total, monthlyAverage, budget, budgetProgress, categoryTotals: byCategory, suggestions: suggestions.map((item) => item.text) });
                const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5-mini", instructions: "Explain only the supplied calculated finance facts. Never invent transactions, balances, budgets, dates, or advice presented as guaranteed. If the context lacks a fact, say so. Keep the answer practical and concise.", input: context, max_output_tokens: 300 }) });
                if (response.ok) {
                    const data = await response.json();
                    const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join(" ").trim();
                    if (text) { answer = text; provider = "openai"; }
                }
            } catch (providerError) {
                console.warn("Optional AI provider unavailable; using deterministic assistant:", providerError.message);
            }
        }
        res.json({ answer, suggestions, calculatedAt: new Date().toISOString(), source: "signed-in-user-expenses", transactionCount: expenses.length, provider, metrics: { income, totalSpending: total, monthlyAverage, budget, budgetProgress, recurringTitles, monthTotals } });
    } catch (err) {
        res.status(500).json({ message: err.message || "Assistant unavailable" });
    }
};

module.exports = {
    addExpense,
    getExpenses,
    deleteExpense,
    updateExpense,
    getAIAnalysis,
    assistant
};
