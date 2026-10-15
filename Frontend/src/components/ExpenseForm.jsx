import { useEffect, useState } from "react";
import { FaPlus, FaCheck, FaTimes, FaTags } from "react-icons/fa";

const EXPENSE_CATEGORIES = [
    { label: "Food & Dining", icon: "🍔" },
    { label: "Rent & Housing", icon: "🏠" },
    { label: "Shopping", icon: "🛍️" },
    { label: "Transportation", icon: "✈️" },
    { label: "Entertainment", icon: "🎬" },
    { label: "Utilities & Bills", icon: "⚡" },
    { label: "Healthcare", icon: "💊" },
    { label: "Education", icon: "📚" }
];

const INCOME_CATEGORIES = [
    { label: "Salary", icon: "💼" },
    { label: "Freelance", icon: "💻" },
    { label: "Investments", icon: "📈" },
    { label: "Business", icon: "🏢" },
    { label: "Rental Income", icon: "🔑" },
    { label: "Gift / Bonus", icon: "🎁" }
];

const ExpenseForm = ({
    formData,
    handleChange,
    submitExpense,
    editingExpense,
    resetForm,
    setFormData
}) => {
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const timer = setTimeout(() => setErrors({}), 0);
        return () => clearTimeout(timer);
    }, [editingExpense]);

    const activeCategories = formData.type === "Income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const handleTypeSelect = (newType) => {
        if (setFormData) {
            setFormData({
                ...formData,
                type: newType
            });
        }
    };

    const handleCategoryClick = (catLabel) => {
        if (setFormData) {
            setFormData({
                ...formData,
                category: catLabel
            });
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.title?.trim()) {
            newErrors.title = "Title is required";
        }

        if (!formData.amount || Number(formData.amount) <= 0) {
            newErrors.amount = "Enter a valid amount greater than 0";
        }

        if (!formData.category?.trim()) {
            newErrors.category = "Category is required";
        }

        if (!formData.date) {
            newErrors.date = "Date is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        submitExpense(e);
    };

    return (
        <div id="new-transaction" className="expense-form-card">
            <div className="form-header">
                <h2>
                    <FaTags style={{ color: "var(--primary)" }} />
                    <span>{editingExpense ? "Update Transaction" : "New Transaction"}</span>
                </h2>

                <div className="type-toggle-pill">
                    <button
                        type="button"
                        className={`toggle-option ${formData.type === "Expense" ? "active expense" : ""}`}
                        onClick={() => handleTypeSelect("Expense")}
                    >
                        Expense
                    </button>
                    <button
                        type="button"
                        className={`toggle-option ${formData.type === "Income" ? "active income" : ""}`}
                        onClick={() => handleTypeSelect("Income")}
                    >
                        Income
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group">
                    <label htmlFor="tx-title">Title / Description</label>
                    <input
                        id="tx-title"
                        type="text"
                        name="title"
                        placeholder="e.g. Grocery Store, Client Invoice"
                        value={formData.title}
                        onChange={handleChange}
                    />
                    {errors.title && <span className="field-error">{errors.title}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="tx-amount">Amount (₹)</label>
                    <input
                        id="tx-amount"
                        type="number"
                        name="amount"
                        placeholder="e.g. 1500"
                        min="1"
                        step="any"
                        value={formData.amount}
                        onChange={handleChange}
                    />
                    {errors.amount && <span className="field-error">{errors.amount}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="tx-category">Category</label>
                    <input
                        id="tx-category"
                        type="text"
                        name="category"
                        placeholder="Select or enter category"
                        value={formData.category}
                        onChange={handleChange}
                    />
                    {errors.category && <span className="field-error">{errors.category}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="tx-date">Date</label>
                    <input
                        id="tx-date"
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                    />
                    {errors.date && <span className="field-error">{errors.date}</span>}
                </div>

                <div className="quick-category-pills">
                    {activeCategories.map((cat) => (
                        <button
                            type="button"
                            key={cat.label}
                            className={`quick-pill ${formData.category === cat.label ? "selected" : ""}`}
                            onClick={() => handleCategoryClick(cat.label)}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                <div className="form-actions">
                    <button
                        id="tx-submit-btn"
                        type="submit"
                        className="action-btn-primary"
                    >
                        {editingExpense ? <FaCheck /> : <FaPlus />}
                        <span>{editingExpense ? "Save Changes" : `Add ${formData.type}`}</span>
                    </button>

                    {editingExpense && (
                        <button
                            id="tx-cancel-btn"
                            type="button"
                            className="action-btn-cancel"
                            onClick={resetForm}
                        >
                            <FaTimes />
                            <span>Cancel</span>
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ExpenseForm;
