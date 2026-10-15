import { FaArrowUp, FaArrowDown, FaWallet, FaPiggyBank } from "react-icons/fa";

const SummaryCard = ({ expenses = [] }) => {
    const totalIncome = expenses
        .filter((item) => item.type === "Income")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const totalExpense = expenses
        .filter((item) => item.type === "Expense")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const balance = totalIncome - totalExpense;

    const savingsRate = totalIncome > 0
        ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
        : 0;

    const expenseCount = expenses.filter(i => i.type === "Expense").length;
    const incomeCount = expenses.filter(i => i.type === "Income").length;

    return (
        <div className="summary-container">
            <div className="summary-card income">
                <div className="card-top">
                    <span className="card-title">Total Income</span>
                    <div className="card-icon">
                        <FaArrowUp />
                    </div>
                </div>
                <div className="card-amount">
                    ₹ {totalIncome.toLocaleString("en-IN")}
                </div>
                <div className="card-meta">
                    <span>{incomeCount} income {incomeCount === 1 ? 'entry' : 'entries'}</span>
                </div>
            </div>

            <div className="summary-card expense">
                <div className="card-top">
                    <span className="card-title">Total Expenses</span>
                    <div className="card-icon">
                        <FaArrowDown />
                    </div>
                </div>
                <div className="card-amount">
                    ₹ {totalExpense.toLocaleString("en-IN")}
                </div>
                <div className="card-meta">
                    <span>{expenseCount} expense {expenseCount === 1 ? 'entry' : 'entries'}</span>
                </div>
            </div>

            <div className="summary-card balance">
                <div className="card-top">
                    <span className="card-title">Net Balance</span>
                    <div className="card-icon">
                        <FaWallet />
                    </div>
                </div>
                <div className="card-amount" style={{ color: balance >= 0 ? "#60a5fa" : "#fb7185" }}>
                    ₹ {balance.toLocaleString("en-IN")}
                </div>
                <div className="card-meta">
                    <span>{balance >= 0 ? "Surplus Cash Flow" : "Deficit (Caution)"}</span>
                </div>
            </div>

            <div className="summary-card savings">
                <div className="card-top">
                    <span className="card-title">Savings Rate</span>
                    <div className="card-icon">
                        <FaPiggyBank />
                    </div>
                </div>
                <div className="card-amount">
                    {savingsRate}%
                </div>
                <div className="card-meta">
                    <span>{savingsRate >= 20 ? "Target Met (≥20%)" : "Below Target (<20%)"}</span>
                </div>
            </div>
        </div>
    );
};

export default SummaryCard;