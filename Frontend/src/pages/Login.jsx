import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaRobot, FaSignInAlt, FaBolt } from "react-icons/fa";
import API from "../services/api";

const Login = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const sessionExpired = new URLSearchParams(window.location.search).get("expired");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError("");
    };

    const handleLoginSubmit = async (emailToUse, passwordToUse) => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await API.post("/users/login", {
                email: emailToUse || formData.email,
                password: passwordToUse || formData.password
            });

            localStorage.setItem("token", res.data.token);
            if (res.data.user) {
                localStorage.setItem("user", JSON.stringify(res.data.user));
            }

            setSuccess("Welcome back! Loading your dashboard...");
            setTimeout(() => {
                navigate("/dashboard");
            }, 600);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleLoginSubmit();
    };

    const handleDemoLogin = () => {
        setFormData({
            email: "test@example.com",
            password: "password123"
        });
        handleLoginSubmit("test@example.com", "password123");
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-blob-1"></div>
            <div className="auth-blob-2"></div>

            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <FaRobot />
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Access your AI-powered expense dashboard</p>
                </div>

                {error && (
                    <div className="auth-alert error">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                {success && (
                    <div className="auth-alert success">
                        <span>✓ {success}</span>
                    </div>
                )}
                {sessionExpired && !error && <div className="auth-alert error"><span>Your session expired. Please sign in again.</span></div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login-email">Email Address</label>
                        <div className="input-with-icon">
                            <FaEnvelope className="input-icon" />
                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <div className="input-with-icon">
                            <FaLock className="input-icon" />
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        id="login-submit-btn"
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        <FaSignInAlt />
                        <span>{loading ? "Signing in..." : "Sign In"}</span>
                    </button>

                    <button
                        id="demo-login-btn"
                        type="button"
                        className="demo-btn"
                        onClick={handleDemoLogin}
                        disabled={loading}
                    >
                        <FaBolt />
                        <span>Quick Demo Login (1-Click)</span>
                    </button>

                    <div className="auth-footer">
                        <Link to="/reset-password" className="auth-link">Forgot password?</Link>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>Your expenses are private to your account. AI suggestions are optional and grounded in your own records.</p>
                    <div className="auth-footer">
                        Don't have an account?
                        <Link to="/register" className="auth-link">
                            Create Account
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
