const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const usersFile = path.join(dataDir, "users.json");
const expensesFile = path.join(dataDir, "expenses.json");

const readJson = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf8");
            return [];
        }
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data || "[]");
    } catch (err) {
        console.error("Error reading " + filePath, err);
        return [];
    }
};

const writeJson = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        console.error("Error writing " + filePath, err);
    }
};

// State tracker: whether MongoDB is successfully connected
let isMongoConnected = false;

const setMongoConnected = (connected) => {
    isMongoConnected = connected;
};

const getMongoConnected = () => isMongoConnected;

// File-based User model fallback
const LocalUser = {
    findOne: async (query) => {
        const users = readJson(usersFile);
        if (query.email) {
            const found = users.find(u => u.email.toLowerCase() === query.email.toLowerCase());
            return found || null;
        }
        if (query._id) {
            const found = users.find(u => u._id === query._id.toString());
            return found || null;
        }
        if (query.resetTokenHash) return users.find((u) => u.resetTokenHash === query.resetTokenHash) || null;
        return null;
    },

    findById: async (id) => {
        const users = readJson(usersFile);
        const found = users.find(u => u._id === id.toString());
        return found || null;
    },

    updateById: async (id, updateData) => {
        const users = readJson(usersFile);
        const index = users.findIndex((user) => user._id === id.toString());
        if (index === -1) return null;
        users[index] = { ...users[index], ...updateData, updatedAt: new Date().toISOString() };
        writeJson(usersFile, users);
        return users[index];
    },

    create: async (userData) => {
        const users = readJson(usersFile);
        const newUser = {
            _id: crypto.randomUUID(),
            name: userData.name.trim(),
            email: userData.email.toLowerCase().trim(),
            password: userData.password,
            monthlyBudget: userData.monthlyBudget ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        users.push(newUser);
        writeJson(usersFile, users);
        return newUser;
    }
};

// File-based Expense model fallback
const LocalExpense = {
    findOne: async (query = {}) => {
        const expenses = readJson(expensesFile);
        return expenses.find((expense) => (!query.user || expense.user.toString() === query.user.toString()) && (!query.clientRequestId || expense.clientRequestId === query.clientRequestId)) || null;
    },
    create: async (expenseData) => {
        const expenses = readJson(expensesFile);
        const newExpense = {
            _id: crypto.randomUUID(),
            user: expenseData.user.toString(),
            title: expenseData.title.trim(),
            amount: Number(expenseData.amount),
            category: expenseData.category.trim(),
            type: expenseData.type,
            date: expenseData.date ? new Date(expenseData.date).toISOString() : new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            clientRequestId: expenseData.clientRequestId || null
        };
        expenses.push(newExpense);
        writeJson(expensesFile, expenses);
        return newExpense;
    },

    find: (query = {}) => {
        const expenses = readJson(expensesFile);
        let results = expenses;
        if (query.user) {
            const userId = query.user.toString();
            results = results.filter(e => e.user.toString() === userId);
        }

        const queryObj = {
            sort: (sortOptions = {}) => {
                const sorted = [...results];
                if (sortOptions.createdAt === -1) {
                    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                } else if (sortOptions.createdAt === 1) {
                    sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                }
                return Promise.resolve(sorted);
            },
            then: (resolve, reject) => {
                resolve(results);
            }
        };

        return queryObj;
    },

    findById: async (id) => {
        const expenses = readJson(expensesFile);
        const item = expenses.find(e => e._id === id.toString());
        if (!item) return null;

        return {
            ...item,
            user: {
                toString: () => item.user.toString()
            },
            deleteOne: async () => {
                const all = readJson(expensesFile);
                const filtered = all.filter(e => e._id !== id.toString());
                writeJson(expensesFile, filtered);
                return { acknowledged: true, deletedCount: 1 };
            }
        };
    },

    findByIdAndUpdate: async (id, updateData, options = {}) => {
        const expenses = readJson(expensesFile);
        const index = expenses.findIndex(e => e._id === id.toString());
        if (index === -1) return null;

        const current = expenses[index];
        const updated = {
            ...current,
            ...updateData,
            _id: current._id,
            user: current.user,
            updatedAt: new Date().toISOString()
        };
        if (updateData.amount !== undefined) {
            updated.amount = Number(updateData.amount);
        }
        if (updateData.date) {
            updated.date = new Date(updateData.date).toISOString();
        }

        expenses[index] = updated;
        writeJson(expensesFile, expenses);
        return updated;
    }
};

module.exports = {
    setMongoConnected,
    getMongoConnected,
    LocalUser,
    LocalExpense
};
