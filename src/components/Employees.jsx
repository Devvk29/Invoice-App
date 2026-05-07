import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../Pages.css";

const Employees = () => {
  const { api, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const showToast = (msg, isErr = false) => {
    setToast({ msg, isError: isErr });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setEmployees(res.data.users);
    } catch (err) {
      setError("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/users/${id}/role`, { role: newRole });
      setEmployees(employees.map(emp => emp.id === id ? { ...emp, role: newRole } : emp));
      showToast("Role updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.error || err.message, true);
    }
  };

  if (loading) return <div className="page-loading">Loading employees...</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className="page" style={{ padding: "30px", background: "#f8fafc", minHeight: "100vh" }}>
      <div className="page-header" style={{ marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>👥 Team <span style={{ color: "#3b82f6" }}>Directory</span></h1>
          <p style={{ color: "#64748b", marginTop: "4px" }}>Manage company employees and assign sophisticated roles.</p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "24px"
      }}>
        {employees.map(emp => (
          <div key={emp.id} style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            position: "relative",
            overflow: "hidden",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          className="emp-card-hover"
          >
            {/* Top decorative bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "4px",
              background: emp.role === "admin" ? "linear-gradient(90deg, #ef4444, #f43f5e)" :
                          emp.role === "accountant" ? "linear-gradient(90deg, #3b82f6, #60a5fa)" :
                          "linear-gradient(90deg, #10b981, #34d399)"
            }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "50px", height: "50px", borderRadius: "12px",
                  background: emp.role === "admin" ? "#fef2f2" : emp.role === "accountant" ? "#eff6ff" : "#ecfdf5",
                  color: emp.role === "admin" ? "#dc2626" : emp.role === "accountant" ? "#2563eb" : "#059669",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem", fontWeight: 800
                }}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>{emp.name}</h3>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    ID: {emp.employee_id}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px", paddingBottom: "16px", borderBottom: "1px dashed #cbd5e1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>
                <span>📧</span> {emp.email}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>
                <span>📞</span> {emp.phone || "No phone added"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Current Role</span>
              
              {user?.role === "admin" && emp.id !== user.id ? (
                <div style={{ position: "relative" }}>
                  <select
                    value={emp.role}
                    onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                    className={`advanced-role-badge role-${emp.role}`}
                  >
                    <option value="admin">Administrator</option>
                    <option value="accountant">Accountant</option>
                    <option value="sales">Sales Exec</option>
                  </select>
                  <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.6rem" }}>
                    ▼
                  </div>
                </div>
              ) : (
                <span className={`static-role-badge role-${emp.role}`}>
                  {emp.role === "admin" ? "Administrator" : emp.role === "accountant" ? "Accountant" : "Sales Exec"}
                </span>
              )}
            </div>

          </div>
        ))}
        {employees.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            No employees found.
          </div>
        )}
      </div>
      {toast && <div className={`toast ${toast.isError ? "error" : ""}`}>{toast.msg}</div>}
    </div>
  );
};

export default Employees;
