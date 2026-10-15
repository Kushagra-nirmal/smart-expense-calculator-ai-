import { useState } from "react";
import { FaTrash, FaEdit, FaInbox, FaTag, FaList, FaThLarge } from "react-icons/fa";

const ExpenseList = ({
    expenses = [],
    deleteExpense,
    editExpense
}) => {
    // Allows manual override between table & card view, defaults automatically by screen width
    const [viewMode, setViewMode] = useState("auto"); // "auto", "table", "cards"

    return (
        <div className="expense-list-card">
            <div className="list-header">
                <h2>
                    <FaTag style={{ color: "var(--primary)" }} />
                    <span>Transaction History</span>
                </h2>
                
                <div className="list-header-right">
                    <span className="count-badge">
                        {expenses.length} {expenses.length === 1 ? "record" : "records"}
                    </span>

                    {/* View Switcher for user preference */}
                    <div className="view-toggle-pill" title="Toggle Table / Card layout">
                        <button
                            type="button"
                            className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                            onClick={() => setViewMode(viewMode === "table" ? "auto" : "table")}
                            title="Table View"
                        >
                            <FaList />
                        </button>
                        <button
                            type="button"
                            className={`view-btn ${viewMode === "cards" ? "active" : ""}`}
                            onClick={() => setViewMode(viewMode === "cards" ? "auto" : "cards")}
                            title="Cards View"
                        >
                            <FaThLarge />
                        </button>
                    </div>
                </div>
            </div>

            {expenses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <FaInbox />
                    </div>
                    <h3>No Transactions Found</h3>
                    <p>Try clearing your search filter or add a new transaction above.</p>
                </div>
            ) : (
                <>
                    {/* Desktop & Tablet Table Presentation */}
                    <div className={`table-responsive ${viewMode === "cards" ? "force-hide" : viewMode === "table" ? "force-show" : "desktop-view"}`}>
                        <table className="expense-table">
                            <thead>
                                <tr>
                                    <th>Transaction</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {expenses.map((expense) => {
                                    const isIncome = expense.type === "Income";
                                    const dateStr = expense.date
                                        ? new Date(expense.date).toLocaleDateString("en-IN", {
                                              day: "2-digit",
                                              month: "short",
                                              year: "numeric"
                                          })
                                        : "Recent";

                                    return (
                                        <tr key={expense._id}>
                                            <td>
                                                <div className="item-title-box">
                                                    <span className="item-title">{expense.title}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="category-tag">
                                                    {expense.category}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`type-tag ${isIncome ? "income" : "expense"}`}>
                                                    {expense.type}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`amount-text ${isIncome ? "income" : "expense"}`}>
                                                    {isIncome ? "+" : "-"} ₹ {Number(expense.amount).toLocaleString("en-IN")}
                                                </span>
                                            </td>

                                            <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                                                {dateStr}
                                            </td>

                                            <td className="actions-cell">
                                                <button
                                                    id={`edit-btn-${expense._id}`}
                                                    className="action-icon-btn edit"
                                                    onClick={() => editExpense(expense)}
                                                    title="Edit Transaction"
                                                >
                                                    <FaEdit />
                                                </button>

                                                <button
                                                    id={`delete-btn-${expense._id}`}
                                                    className="action-icon-btn delete"
                                                    onClick={() => deleteExpense(expense._id)}
                                                    title="Delete Transaction"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile & Small Screen Card Presentation */}
                    <div className={`mobile-cards-container ${viewMode === "table" ? "force-hide" : viewMode === "cards" ? "force-show" : "mobile-view"}`}>
                        {expenses.map((expense) => {
                            const isIncome = expense.type === "Income";
                            const dateStr = expense.date
                                ? new Date(expense.date).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric"
                                  })
                                : "Recent";

                            return (
                                <div key={expense._id} className="mobile-expense-card">
                                    <div className="mobile-card-row-top">
                                        <div className="mobile-card-info">
                                            <span className="mobile-item-title">{expense.title}</span>
                                            <span className="mobile-item-date">{dateStr}</span>
                                        </div>
                                        <div className="mobile-card-amount-col">
                                            <span className={`amount-text ${isIncome ? "income" : "expense"}`}>
                                                {isIncome ? "+" : "-"} ₹{Number(expense.amount).toLocaleString("en-IN")}
                                            </span>
                                            <span className={`type-tag ${isIncome ? "income" : "expense"}`}>
                                                {expense.type}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mobile-card-row-bottom">
                                        <span className="category-tag">
                                            {expense.category}
                                        </span>

                                        <div className="mobile-card-actions">
                                            <button
                                                className="action-icon-btn edit"
                                                onClick={() => editExpense(expense)}
                                                title="Edit Transaction"
                                            >
                                                <FaEdit />
                                                <span className="btn-touch-label">Edit</span>
                                            </button>
                                            <button
                                                className="action-icon-btn delete"
                                                onClick={() => deleteExpense(expense._id)}
                                                title="Delete Transaction"
                                            >
                                                <FaTrash />
                                                <span className="btn-touch-label">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default ExpenseList;