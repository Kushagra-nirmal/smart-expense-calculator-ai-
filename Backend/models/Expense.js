const mongoose = require("mongoose");
const { getMongoConnected, LocalExpense } = require("./dbAdapter");

const expenseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        amount: {
            type: Number,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: ["Income", "Expense"],
            required: true
        },

        date: {
            type: Date,
            default: Date.now
        },
        clientRequestId: { type: String, index: true }
    },
    {
        timestamps: true
    }
);

const MongooseExpense = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

const Expense = new Proxy(MongooseExpense, {
    get(target, prop) {
        if (!getMongoConnected() && prop in LocalExpense) {
            return LocalExpense[prop];
        }
        return target[prop];
    }
});

module.exports = Expense;
