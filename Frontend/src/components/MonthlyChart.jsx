import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { FaCalendarAlt } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MonthlyChart = ({ expenses = [] }) => {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlyExpense = new Array(12).fill(0);
    const monthlyIncome = new Array(12).fill(0);

    expenses.forEach((item) => {
        if (!item.date) return;
        const d = new Date(item.date);
        if (isNaN(d.getTime())) return;
        const month = d.getMonth();

        if (item.type === "Expense") {
            monthlyExpense[month] += Number(item.amount || 0);
        } else if (item.type === "Income") {
            monthlyIncome[month] += Number(item.amount || 0);
        }
    });

    const hasData = expenses.length > 0;

    const data = {
        labels: months,
        datasets: [
            {
                label: "Income",
                data: monthlyIncome,
                backgroundColor: "rgba(16, 185, 129, 0.8)",
                borderRadius: 6,
                borderSkipped: false
            },
            {
                label: "Expenses",
                data: monthlyExpense,
                backgroundColor: "rgba(99, 102, 241, 0.8)",
                borderRadius: 6,
                borderSkipped: false
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
                        const val = context.raw || 0;
                        return ` ${context.dataset.label}: ₹${val.toLocaleString("en-IN")}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: "rgba(255, 255, 255, 0.04)"
                },
                ticks: {
                    color: "#64748b",
                    font: { family: "Plus Jakarta Sans", size: 11 }
                }
            },
            y: {
                grid: {
                    color: "rgba(255, 255, 255, 0.04)"
                },
                ticks: {
                    color: "#64748b",
                    font: { family: "Plus Jakarta Sans", size: 11 },
                    callback: function (value) {
                        if (value >= 1000) {
                            return "₹" + (value / 1000) + "k";
                        }
                        return "₹" + value;
                    }
                }
            }
        }
    };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <h2>
                    <FaCalendarAlt style={{ color: "var(--primary)" }} />
                    <span>Monthly Financial Flow</span>
                </h2>
                <span className="chart-badge">Annual Overview</span>
            </div>

            <div className="chart-body">
                {hasData ? (
                    <Bar data={data} options={options} />
                ) : (
                    <div className="empty-state" style={{ padding: "20px 0" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                            Add income and expenses across dates to track monthly trends
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MonthlyChart;