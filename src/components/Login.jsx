import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Auth.css";

const Login = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!employeeId && !email) {
      setError("Please enter your Employee ID or Email.");
      return;
    }

    setIsLoading(true);

    // Use employee_id if provided, otherwise use email
    const loginId = employeeId ? `SIKKO_${employeeId}` : email;

    try {
      await login(loginId, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="video-bg">
        <video autoPlay muted loop playsInline>
          <source src="/Sikko-Video.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="auth-content">
        <div className="clean-card">
          <div className="auth-logo-header">
            <div className="auth-logo">
              <img src="/Sikko.jpeg" alt="Sikko Industries" />
            </div>
            <h1 className="auth-title">Sikko Industries Ltd</h1>
            <p className="auth-subtitle">INVOICE MANAGEMENT SYSTEM</p>
          </div>
          <h2 className="card-title">Welcome back</h2>
          <p className="card-subtitle">Sign in to continue.</p>

          {error && (
            <div className="auth-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Employee ID Field */}
            <div className="auth-input-group">
              <label>Employee ID</label>
              <input
                type="text"
                placeholder="Enter your Employee ID (e.g. 01, 02)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                autoFocus
              />
            </div>

            {/* Email Field */}
            <div className="auth-input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-input-group">
              <label>Password</label>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`auth-submit ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="auth-footer-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
