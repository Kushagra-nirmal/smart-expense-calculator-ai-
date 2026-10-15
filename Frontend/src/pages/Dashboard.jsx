import { useState, useEffect } from "react";
import { FaSearch, FaFileDownload } from "react-icons/fa";
import api, { cacheExpenses, getCachedExpenses, getSyncStatus, onSyncStatus, queueMutation, removeQueuedMutation, replaceQueuedMutation, syncQueuedMutations } from "../services/api";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCard";
import ExpenseForm from "../components/ExpenseForm";
import PieChart from "../components/PieChart";
import MonthlyChart from "../components/MonthlyChart";
import AIAnalysis from "../components/AIAnalysis";
import ExpenseList from "../components/ExpenseList";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const Dashboard = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All"); // All, Expense, Income
    const [editingExpense, setEditingExpense] = useState(null);
    const [syncStatus, setSyncStatus] = useState(getSyncStatus());
    const [monthlyBudget, setMonthlyBudget] = useState(() => Number(localStorage.getItem("monthly_budget") || 0));
    const [budgetInput, setBudgetInput] = useState(() => localStorage.getItem("monthly_budget") || "");

    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        category: "",
        type: "Expense",
        date: getTodayDateString()
    });

    useEffect(() => {
        const unsubscribe = onSyncStatus(setSyncStatus);
        setTimeout(async () => { setExpenses(getCachedExpenses()); fetchExpenses(); syncQueuedMutations(); try { const result = await api.get("/users/budget"); setMonthlyBudget(result.data.monthlyBudget || 0); setBudgetInput(result.data.monthlyBudget || ""); localStorage.setItem("monthly_budget", result.data.monthlyBudget || ""); } catch { /* cached budget remains useful offline */ } }, 0);
        return unsubscribe;
    }, []);

    async function fetchExpenses() {
        try {
            const { data } = await api.get("/expenses");
            if (Array.isArray(data)) {
                setExpenses(data);
                cacheExpenses(data);
            } else {
                setExpenses([]);
            }
        } catch (err) {
            console.error("fetchExpenses error:", err);
            setExpenses(getCachedExpenses());
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setEditingExpense(null);
        setFormData({
            title: "",
            amount: "",
            category: "",
            type: "Expense",
            date: getTodayDateString()
        });
    };

    const saveBudget = async (event) => {
        event.preventDefault();
        const value = budgetInput === "" ? null : Number(budgetInput);
        if (value !== null && (!Number.isFinite(value) || value < 0)) return;
        setMonthlyBudget(value || 0);
        localStorage.setItem("monthly_budget", value ?? "");
        try { await api.put("/users/budget", { monthlyBudget: value }); }
        catch (error) { if (!error.response || !navigator.onLine) queueMutation({ id: "budget-update", method: "put", url: "/users/budget", data: { monthlyBudget: value } }); }
    };

    const submitExpense = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        try {
            if (editingExpense) {
                await api.put(`/expenses/${editingExpense._id}`, formData);
                await fetchExpenses();
            } else {
                const clientRequestId = crypto.randomUUID();
                const optimistic = { ...formData, _id: `offline-${clientRequestId}`, clientRequestId, createdAt: new Date().toISOString() };
                await api.post("/expenses", { ...formData, clientRequestId }, { headers: { "X-Idempotency-Key": clientRequestId } });
                setExpenses((current) => { const next = [optimistic, ...current]; cacheExpenses(next); return next; });
            }

            resetForm();
            if (!editingExpense) await fetchExpenses();
        } catch (err) {
            console.error("submitExpense error:", err);
            if (!err.response || !navigator.onLine) {
                if (editingExpense) {
                    if (String(editingExpense._id).startsWith("offline-") && editingExpense.clientRequestId) replaceQueuedMutation(editingExpense.clientRequestId, { data: { ...formData, clientRequestId: editingExpense.clientRequestId } });
                    else queueMutation({ id: crypto.randomUUID(), method: "put", url: `/expenses/${editingExpense._id}`, data: formData });
                    setExpenses((current) => { const next = current.map((item) => item._id === editingExpense._id ? { ...item, ...formData } : item); cacheExpenses(next); return next; });
                } else {
                    const clientRequestId = crypto.randomUUID();
                    const optimistic = { ...formData, _id: `offline-${clientRequestId}`, clientRequestId, createdAt: new Date().toISOString() };
                    queueMutation({ id: clientRequestId, method: "post", url: "/expenses", data: { ...formData, clientRequestId }, headers: { "X-Idempotency-Key": clientRequestId } });
                    setExpenses((current) => { const next = [optimistic, ...current]; cacheExpenses(next); return next; });
                }
                resetForm();
            } else alert(err.response?.data?.message || "Error saving transaction");
        }
    };

    const deleteExpense = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this transaction?");
        if (!confirmDelete) return;

        try {
            await api.delete(`/expenses/${id}`);
            await fetchExpenses();
        } catch (err) {
            console.error("deleteExpense error:", err);
            if (!err.response || !navigator.onLine) {
                if (String(id).startsWith("offline-")) removeQueuedMutation(String(id).replace("offline-", ""));
                else queueMutation({ id: crypto.randomUUID(), method: "delete", url: `/expenses/${id}` });
                setExpenses((current) => { const next = current.filter((item) => item._id !== id); cacheExpenses(next); return next; });
            } else alert(err.response?.data?.message || "Error deleting transaction");
        }
    };

    const editExpense = (expense) => {
        setEditingExpense(expense);
        setFormData({
            title: expense.title || "",
            amount: expense.amount || "",
            category: expense.category || "",
            type: expense.type || "Expense",
            date: expense.date ? expense.date.substring(0, 10) : getTodayDateString()
        });

        window.scrollTo({
            top: 180,
            behavior: "smooth"
        });
    };

    // Filter & Sort
    const filteredExpenses = (Array.isArray(expenses) ? expenses : [])
        .filter((item) => {
            const titleMatch = (item.title || "")
                .toLowerCase()
                .includes(search.toLowerCase());

            const categoryMatch =
                category === "All" || item.category === category;

            const typeMatch =
                typeFilter === "All" || item.type === typeFilter;

            return titleMatch && categoryMatch && typeMatch;
        })
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Export to CSV
    const exportToCSV = () => {
        if (filteredExpenses.length === 0) {
            alert("No data available to export.");
            return;
        }

        const headers = ["Title", "Category", "Type", "Amount", "Date"];
        const rows = filteredExpenses.map((e) => [
            `"${(e.title || "").replace(/"/g, '""')}"`,
            `"${(e.category || "").replace(/"/g, '""')}"`,
            e.type,
            e.amount,
            e.date ? e.date.substring(0, 10) : ""
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const uniqueCategories = [
        ...new Set((Array.isArray(expenses) ? expenses : []).map((item) => item.category).filter(Boolean))
    ];

    if (loading) {
        return (
            <div className="auth-wrapper">
                <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "36px", marginBottom: "16px" }}>💎</div>
                    <h2>Loading ExpenseSense AI...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Navbar />

            <div className={`sync-banner ${syncStatus.online ? "online" : "offline"}`} role="status">
                {syncStatus.online ? "Online" : "Offline — local changes are safe on this device"}
                {syncStatus.pending > 0 ? ` · ${syncStatus.pending} change${syncStatus.pending === 1 ? "" : "s"} waiting to sync` : " · Synced"}
                {syncStatus.lastSynced && ` · Last sync ${new Date(syncStatus.lastSynced).toLocaleString()}`}
            </div>

            <main className="dashboard-wrapper">
                {/* 1. KPI Summary Cards */}
                <SummaryCard expenses={expenses} />

                <form onSubmit={saveBudget} className="expense-form-card" style={{ display: "flex", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
                    <div className="form-group" style={{ flex: "1 1 220px" }}><label htmlFor="monthly-budget">Monthly expense budget (₹)</label><input id="monthly-budget" type="number" min="0" step="1" value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} placeholder="Optional" /></div>
                    <button type="submit" className="action-btn-primary">Save budget</button>
                </form>

                {/* 2. Interactive Expense Form */}
                <ExpenseForm
                    formData={formData}
                    handleChange={handleChange}
                    submitExpense={submitExpense}
                    editingExpense={editingExpense}
                    resetForm={resetForm}
                    setFormData={setFormData}
                />

                {/* 3. AI Financial Advisor */}
                <AIAnalysis expenses={expenses} monthlyBudget={monthlyBudget} />

                {/* 4. Visual Charts Grid */}
                <div className="analytics-grid">
                    <PieChart expenses={expenses} />
                    <MonthlyChart expenses={expenses} />
                </div>

                {/* 5. Filter & Search Controls */}
                <div className="filter-bar">
                    <div className="search-input-wrapper">
                        <FaSearch />
                        <input
                            id="search-input"
                            type="text"
                            placeholder="Search by description or title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <select
                        id="category-filter"
                        className="filter-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="All">All Categories ({uniqueCategories.length})</option>
                        {uniqueCategories.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <div className="type-filter-group">
                        <button
                            type="button"
                            className={`type-filter-btn ${typeFilter === "All" ? "active" : ""}`}
                            onClick={() => setTypeFilter("All")}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            className={`type-filter-btn ${typeFilter === "Expense" ? "active" : ""}`}
                            onClick={() => setTypeFilter("Expense")}
                        >
                            Expenses
                        </button>
                        <button
                            type="button"
                            className={`type-filter-btn ${typeFilter === "Income" ? "active" : ""}`}
                            onClick={() => setTypeFilter("Income")}
                        >
                            Income
                        </button>
                    </div>

                    <button
                        id="export-csv-btn"
                        type="button"
                        className="export-btn"
                        onClick={exportToCSV}
                        title="Export filtered records to CSV"
                    >
                        <FaFileDownload />
                        <span>Export CSV</span>
                    </button>
                </div>

                {/* 6. Transactions Table */}
                <ExpenseList
                    expenses={filteredExpenses}
                    deleteExpense={deleteExpense}
                    editExpense={editExpense}
                />
            </main>
        </div>
    );
};

export default Dashboard;
