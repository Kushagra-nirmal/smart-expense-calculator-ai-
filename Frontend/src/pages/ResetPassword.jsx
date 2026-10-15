import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const [email, setEmail] = useState("");
    const [token, setToken] = useState(params.get("token") || "");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const request = async (event) => { event.preventDefault(); setError(""); setMessage(""); try { const result = await API.post("/users/request-password-reset", { email }); setMessage(result.data.message); } catch (err) { setError(err.response?.data?.message || "Unable to request a reset link."); } };
    const reset = async (event) => { event.preventDefault(); setError(""); setMessage(""); try { const result = await API.post("/users/reset-password", { token, password }); setMessage(result.data.message); } catch (err) { setError(err.response?.data?.message || "Unable to reset password."); } };
    return <div className="auth-wrapper"><div className="auth-card"><div className="auth-header"><h2>Reset password</h2><p>Reset links expire after 30 minutes.</p></div>{error && <div className="auth-alert error">{error}</div>}{message && <div className="auth-alert success">{message}</div>}<form className="auth-form" onSubmit={token ? reset : request}>{!token && <div className="form-group"><label htmlFor="reset-email">Account email</label><input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>}{token && <><div className="form-group"><label htmlFor="reset-token">Reset token</label><input id="reset-token" value={token} onChange={(event) => setToken(event.target.value)} required /></div><div className="form-group"><label htmlFor="reset-password">New password</label><input id="reset-password" type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required /></div></>}<button className="submit-btn" type="submit">{token ? "Set new password" : "Email reset link"}</button><div className="auth-footer"><Link to="/login" className="auth-link">Back to sign in</Link></div></form></div></div>;
}
