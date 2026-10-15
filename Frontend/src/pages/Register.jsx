import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserPlus } from "react-icons/fa";
import API from "../services/api";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await API.post("/users/register", formData);

            // If token returned, auto login
            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
                if (res.data.user) {
                    localStorage.setItem("user", JSON.stringify(res.data.user));
                }
                setSuccess("Account created successfully! Taking you to your dashboard...");
                setTimeout(() => {
                    navigate("/dashboard");
                }, 700);
            } else {
                setSuccess(res.data.message || "Registration successful! Redirecting to login...");
                setTimeout(() => {
                    navigate("/login");
                }, 1000);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please check your information.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-blob-1"></div>
            <div className="auth-blob-2"></div>

            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <FaUserPlus />
                    </div>
                    <h2>Create Account</h2>
                    <p>Start tracking and optimizing your expenses with AI</p>
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

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="register-name">Full Name</label>
                        <div className="input-with-icon">
                            <FaUser className="input-icon" />
                            <input
                                id="register-name"
                                type="text"
                                name="name"
                                placeholder="Your full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="register-email">Email Address</label>
                        <div className="input-with-icon">
                            <FaEnvelope className="input-icon" />
                            <input
                                id="register-email"
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
                        <label htmlFor="register-password">Password</label>
                        <div className="input-with-icon">
                            <FaLock className="input-icon" />
                            <input
                                id="register-password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="At least 8 characters"
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
                        id="register-submit-btn"
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        <FaUserPlus />
                        <span>{loading ? "Creating Account..." : "Create Account"}</span>
                    </button>

                    <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>We use your account only to protect and sync your expense data. AI is optional.</p>

                    <div className="auth-footer">
                        Already have an account?
                        <Link to="/login" className="auth-link">
                            Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
