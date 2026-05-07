import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Auth.css";

const Signup = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("sales");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Signup submitted");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (!employeeId || employeeId.length < 1) {
      setError("Please enter an employee number");
      return;
    }

    const formattedEmployeeId = `SIKKO_${employeeId}`;
    console.log("Formatted Employee ID:", formattedEmployeeId);
    setIsLoading(true);

    try {
      const result = await signup(name, phone, email, formattedEmployeeId, password, role);
      console.log("Signup success:", result);
      navigate("/");
    } catch (err) {
      console.error("Signup error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Signup failed. Please try again.";
      setError(errorMsg);
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

      <div className="auth-content signup-content">
        <div className="clean-card signup-card-pro">
          <div className="auth-logo-header">
            <div className="auth-logo">
              <img src="/Sikko.jpeg" alt="Sikko Industries" />
            </div>
            <h1 className="auth-title">Sikko Industries Ltd</h1>
            <p className="auth-subtitle">INVOICE MANAGEMENT SYSTEM</p>
          </div>
          <h2 className="card-title">Create Account</h2>
          <p className="card-subtitle">Join Sikko Industries today.</p>

          {error && (
            <div className="auth-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Two column row: Name + Phone */}
            <div className="signup-row">
              <div className="auth-input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="auth-input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                />
              </div>
            </div>

            {/* Two column row: Email + Employee ID */}
            <div className="signup-row">
              <div className="auth-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. 01, 02, 123"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="auth-input-group" style={{ marginBottom: 20 }}>
              <label>Select Role</label>
              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                {[
                  { id: "sales", icon: "💼", title: "Sales" },
                  { id: "accountant", icon: "📊", title: "Accountant" },
                  { id: "admin", icon: "⚙️", title: "Admin" }
                ].map(r => (
                  <div
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    style={{
                      flex: 1, padding: "10px", textAlign: "center", borderRadius: "10px",
                      cursor: "pointer", border: `2px solid ${role === r.id ? "#10b981" : "#e5e7eb"}`,
                      background: role === r.id ? "#ecfdf5" : "#fff",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>{r.icon}</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: role === r.id ? "#065f46" : "#4b5563" }}>{r.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Two column row: Password + Confirm Password */}
            <div className="signup-row">
              <div className="auth-input-group">
                <label>Password</label>
                <div className="auth-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
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
              <div className="auth-input-group">
                <label>Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={`auth-submit ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="auth-footer-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
