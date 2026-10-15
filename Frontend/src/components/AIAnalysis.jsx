import { useState, useEffect } from "react";
import { FaRobot, FaMagic, FaSync, FaLightbulb, FaShieldAlt, FaComments } from "react-icons/fa";
import API from "../services/api";

const AIAnalysis = ({ expenses = [], monthlyBudget = 0 }) => {
    const [loading, setLoading] = useState(false);
    const [aiData, setAiData] = useState(null);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [assistantOffline, setAssistantOffline] = useState(false);

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const { data } = await API.get("/expenses/ai-analysis");
            setAiData(data);
        } catch {
            // Local fallback calculation if endpoint is unavailable
            computeLocalAI(expenses);
        } finally {
            setLoading(false);
        }
    };

    const askAssistant = async (event) => {
        event.preventDefault();
        if (!question.trim()) return;
        try {
            const { data } = await API.post("/expenses/assistant", { question });
            setAnswer(`${data.answer} ${data.suggestions?.map((item) => item.text).join(" ") || ""}`);
            setAssistantOffline(false);
        } catch {
            setAssistantOffline(true);
            setAnswer("The assistant needs an internet connection. Your totals and transaction history remain available offline.");
        }
    };

    const computeLocalAI = (dataList) => {
        const income = dataList
            .filter((item) => item.type === "Income")
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const expense = dataList
            .filter((item) => item.type === "Expense")
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const categoryData = {};
        dataList.filter((item) => item.type === "Expense").forEach((item) => {
            categoryData[item.category] = (categoryData[item.category] || 0) + Number(item.amount || 0);
        });

        const sortedCats = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
        const highestCategory = sortedCats.length > 0 ? sortedCats[0][0] : "None";
        const highestCategoryAmount = sortedCats.length > 0 ? sortedCats[0][1] : 0;

        const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

        let healthScore = 50;
        const recommendations = [];

        if (dataList.length === 0) {
            healthScore = 50;
            recommendations.push("Log your first income and expenses to unlock tailored AI spending intelligence.");
        } else if (income === 0 && expense === 0) {
            healthScore = 50;
            recommendations.push("No active cash flows recorded yet. Add an income source or expense to begin.");
        } else {
            if (income > 0) {
                if (savingsRate >= 30) {
                    healthScore = 92;
                    recommendations.push("Outstanding discipline! Your savings rate of " + savingsRate + "% beats the typical 20% target.");
                } else if (savingsRate >= 15) {
                    healthScore = 78;
                    recommendations.push("Balanced finances! You are saving " + savingsRate + "% of monthly earnings.");
                } else if (savingsRate >= 0) {
                    healthScore = 58;
                    recommendations.push("Break-even zone. Try adopting the 50/30/20 budget framework to build an emergency fund.");
                } else {
                    healthScore = 32;
                    recommendations.push("Budget alert: Outflow exceeds current income by ₹" + Math.abs(income - expense).toLocaleString("en-IN") + ".");
                }
            } else if (expense > 0) {
                healthScore = 35;
                recommendations.push("You have recorded expenses without logging income. Add your salary or income to see balanced metrics.");
            }

            if (highestCategoryAmount > 0 && expense > 0) {
                const ratio = Math.round((highestCategoryAmount / expense) * 100);
                if (ratio >= 40) {
                    recommendations.push(`High concentration: "${highestCategory}" makes up ${ratio}% of all expenses.`);
                }
            }
        }

        setAiData({
            totalIncome: income,
            totalExpense: expense,
            netBalance: income - expense,
            savingsRate,
            healthScore,
            highestCategory,
            highestCategoryAmount,
            recommendations
        });
    };

    useEffect(() => {
        const timer = setTimeout(runAnalysis, 0);
        return () => clearTimeout(timer);
        // runAnalysis intentionally reads the current expense snapshot.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expenses]);

    const info = aiData || {
        healthScore: 50,
        highestCategory: "None",
        savingsRate: 0,
        recommendations: ["Log your first transaction to unlock AI financial intelligence."]
    };

    const getScoreBadge = (score) => {
        if (score >= 80) return { label: "Excellent Financial Health", cls: "good" };
        if (score >= 60) return { label: "Good / Stable Condition", cls: "medium" };
        return { label: "Attention Needed", cls: "poor" };
    };

    const badge = getScoreBadge(info.healthScore || 50);

    return (
        <div className="ai-card">
            <div className="ai-header">
                <div className="ai-title">
                    <div className="ai-icon-pulse">
                        <FaRobot />
                    </div>
                    <div>
                        <h2>AI Spending Advisor</h2>
                        <p>Grounded in your signed-in transactions · calculations stay available offline</p>
                    </div>
                </div>

                <button
                    id="ai-refresh-btn"
                    className="ai-refresh-btn"
                    onClick={runAnalysis}
                    disabled={loading}
                    title="Refresh AI Analysis"
                >
                    <FaSync className={loading ? "spin-icon" : ""} />
                    <span>{loading ? "Analyzing..." : "Re-Analyze"}</span>
                </button>
            </div>

            <div className="ai-metrics-row">
                <div className="ai-metric-box">
                    <div className="metric-label">Financial Health Score</div>
                    <div className="metric-value">{info.healthScore || 50} / 100</div>
                    <div className={`health-badge ${badge.cls}`}>
                        <FaShieldAlt style={{ fontSize: "11px" }} />
                        <span>{badge.label}</span>
                    </div>
                </div>

                <div className="ai-metric-box"><div className="metric-label">Monthly Budget</div><div className="metric-value">{monthlyBudget ? `₹${Number(monthlyBudget).toLocaleString("en-IN")}` : "Not set"}</div><div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Set a budget to compare current spending.</div></div>

                <div className="ai-metric-box">
                    <div className="metric-label">Top Expense Category</div>
                    <div className="metric-value">{info.highestCategory || "None"}</div>
                    {info.highestCategoryAmount > 0 && (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                            ₹ {Number(info.highestCategoryAmount).toLocaleString("en-IN")} spent
                        </div>
                    )}
                </div>

                <div className="ai-metric-box">
                    <div className="metric-label">Savings Quotient</div>
                    <div className="metric-value">{info.savingsRate || 0}%</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                        {info.savingsRate >= 20 ? "Exceeds Recommended 20%" : "Recommended: ≥20%"}
                    </div>
                </div>
            </div>

            <div className="ai-recommendations">
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>AI is optional: recommendations are generated from the displayed totals and categories only. Last calculated {new Date().toLocaleString()}.</p>
                <h3>
                    <FaLightbulb style={{ color: "#fbbf24" }} />
                    <span>Actionable AI Recommendations</span>
                </h3>
                <div className="recs-list">
                    {(info.recommendations || []).map((rec, index) => (
                        <div key={index} className="rec-item">
                            <FaMagic className="rec-bullet" />
                            <span>{rec}</span>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={askAssistant} style={{ marginTop: "18px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <FaComments style={{ color: "var(--primary)", marginTop: "10px" }} />
                <input aria-label="Ask expense assistant" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your spending…" style={{ flex: "1 1 240px" }} />
                <button type="submit" className="ai-refresh-btn">Ask</button>
                {answer && <div style={{ flexBasis: "100%", fontSize: "13px" }}>{answer}{assistantOffline ? " (offline)" : ""}</div>}
            </form>
        </div>
    );
};

export default AIAnalysis;
