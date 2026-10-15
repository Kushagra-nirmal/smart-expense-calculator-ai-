import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { FaChartPie } from "react-icons/fa";

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ expenses = [] }) => {
    const income = expenses
        .filter((item) => item.type === "Income")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const expense = expenses
        .filter((item) => item.type === "Expense")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const hasData = income > 0 || expense > 0;

    const data = {
        labels: ["Total Income", "Total Expenses"],
        datasets: [
            {
                data: hasData ? [income, expense] : [1, 0],
                backgroundColor: hasData
                    ? ["#10b981", "#f43f5e"]
                    : ["#334155", "#1e293b"],
                borderColor: ["#0b0f19", "#0b0f19"],
                borderWidth: 3,
                hoverOffset: 6
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: "#94a3b8",
                    font: { family: "Plus Jakarta Sans", size: 12, weight: 600 },
                    padding: 18,
                    usePointStyle: true,
                    pointStyle: "circle"
                }
            },
            tooltip: {
                backgroundColor: "#1e293b",
                titleColor: "#f8fafc",
                bodyColor: "#cbd5e1",
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        if (!hasData) return " No transactions yet";
                        const val = context.raw || 0;
                        const total = income + expense;
                        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                        return ` ${context.label}: ₹${val.toLocaleString("en-IN")} (${pct}%)`;
                    }
                }
            }
        },
        cutout: "68%"
    };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <h2>
                    <FaChartPie style={{ color: "var(--accent-purple)" }} />
                    <span>Income vs Expense</span>
                </h2>
                <span className="chart-badge">Cash Flow Ratio</span>
            </div>

            <div className="chart-body">
                {hasData ? (
                    <Doughnut data={data} options={options} />
                ) : (
                    <div className="empty-state" style={{ padding: "20px 0" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                            Log transactions to generate cash flow ratio
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PieChart;