import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaWallet, FaRobot, FaServer, FaCheckCircle, FaTimesCircle, FaTimes, FaAndroid } from "react-icons/fa";
import { getApiBaseUrl, setApiBaseUrl } from "../services/api";

const Navbar = () => {
    const navigate = useNavigate();
    const [showServerModal, setShowServerModal] = useState(false);
    const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
    const [testStatus, setTestStatus] = useState(null); // { ok: boolean, message: string }
    const [testing, setTesting] = useState(false);

    // Retrieve saved user info if available
    let user = null;
    try {
        const stored = localStorage.getItem("user");
        if (stored) user = JSON.parse(stored);
    } catch {
        // ignore parse error
    }

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestStatus(null);
        try {
            // Temporarily test the target URL
            let target = serverUrl.trim();
            if (!target.endsWith("/api") && !target.endsWith("/api/")) {
                target = target.replace(/\/+$/, "") + "/api";
            }
            const res = await fetch(`${target}/health`, { method: "GET", headers: { "Content-Type": "application/json" } });
            if (res.ok) {
                const data = await res.json();
                setTestStatus({
                    ok: true,
                    message: `Online! Database: ${data.database || "Active"}`
                });
            } else {
                setTestStatus({
                    ok: false,
                    message: `Server returned status ${res.status}`
                });
            }
        } catch (err) {
            setTestStatus({
                ok: false,
                message: `Connection failed: ${err.message || "Network unreachable"}`
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSaveServerUrl = () => {
        setApiBaseUrl(serverUrl);
        setShowServerModal(false);
        window.location.reload();
    };

    return (
        <>
            <header className="navbar">
                <div className="nav-brand">
                    <div className="nav-logo-icon">
                        <FaWallet />
                    </div>
                    <div className="nav-brand-text">
                        <h1>
                            ExpenseSense <span className="ai-badge">AI 2.0</span>
                        </h1>
                        <div className="nav-subtitle">Smart Financial Intelligence</div>
                    </div>
                </div>

                <div className="nav-right">
                    <div className="system-pill" title="AI Analytics Engine is Connected">
                        <span className="status-dot"></span>
                        <FaRobot style={{ fontSize: "14px" }} />
                        <span className="pill-text-desktop">AI Engine Active</span>
                    </div>

                    <a
                        id="download-apk-btn"
                        href="/Smart-Expense-Tracker-AI.apk"
                        download="Smart-Expense-Tracker-AI.apk"
                        className="apk-download-pill"
                        title="Download Signed Android APK directly (4.7 MB)"
                    >
                        <FaAndroid style={{ color: "#34d399", fontSize: "14px" }} />
                        <span className="pill-text-desktop">Get APK</span>
                    </a>

                    <button
                        id="server-settings-btn"
                        className="server-status-pill"
                        onClick={() => setShowServerModal(true)}
                        title="Configure API Server URL for APK / Remote access"
                    >
                        <FaServer />
                        <span className="pill-text-desktop">Server</span>
                    </button>

                    {user && (
                        <div className="user-profile-badge" title={user.email || user.name}>
                            <div className="user-avatar">{getInitials(user.name)}</div>
                            <span className="user-name">{user.name}</span>
                        </div>
                    )}

                    <button
                        id="logout-button"
                        className="logout-btn"
                        onClick={logout}
                        title="Sign Out"
                    >
                        <FaSignOutAlt />
                        <span className="btn-text-desktop">Logout</span>
                    </button>
                </div>
            </header>

            {/* Server Connection Modal for APK, Cross-Device, and Deployment Configuration */}
            {showServerModal && (
                <div className="modal-backdrop" onClick={() => setShowServerModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-box">
                                <FaServer style={{ color: "var(--primary)" }} />
                                <h3>Backend Server Settings</h3>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowServerModal(false)}
                                title="Close"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-description">
                                Configure the backend API host. For mobile APKs or access from other phones/tablets on your Wi-Fi, enter your computer's IP address or deployed cloud URL.
                            </p>

                            <div className="preset-badges">
                                <button
                                    type="button"
                                    className="preset-btn"
                                    onClick={() => setServerUrl("/api")}
                                >
                                    Default (/api)
                                </button>
                                {import.meta.env.VITE_API_URL && <button
                                    type="button"
                                    className="preset-btn"
                                    onClick={() => setServerUrl(import.meta.env.VITE_API_URL)}
                                >
                                    Production API
                                </button>}
                                <button
                                    type="button"
                                    className="preset-btn"
                                    onClick={() => setServerUrl("http://192.168.1.20:5000/api")}
                                >
                                    Local Wi-Fi (192.168.1.20:5000)
                                </button>
                            </div>

                            <div className="server-input-wrapper">
                                <label htmlFor="server-url-input">API Base URL:</label>
                                <input
                                    id="server-url-input"
                                    type="text"
                                    value={serverUrl}
                                    placeholder="https://your-app.onrender.com/api or /api"
                                    onChange={(e) => {
                                        setServerUrl(e.target.value);
                                        setTestStatus(null);
                                    }}
                                />
                            </div>

                            {testStatus && (
                                <div className={`test-result-box ${testStatus.ok ? "success" : "error"}`}>
                                    {testStatus.ok ? <FaCheckCircle /> : <FaTimesCircle />}
                                    <span>{testStatus.message}</span>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleTestConnection}
                                disabled={testing}
                            >
                                {testing ? "Testing..." : "Test Connection"}
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleSaveServerUrl}
                            >
                                Save & Connect
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
