import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Layout.css";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const navItems = [
    { path: "/", label: "Dashboard", emoji: "📊" },
    ...(user?.role === "admin" ? [
      { path: "/customers", label: "Customers", emoji: "👥" },
      { path: "/products", label: "Products", emoji: "📦" }
    ] : []),
    { path: "/invoice", label: "New Invoice", emoji: "📄" },
    { path: "/invoice-history", label: "Invoice History", emoji: "🧾" },
    { path: "/reports", label: "Reports", emoji: "📈" },
    ...(user?.role === "admin" || user?.role === "accountant" ? [{ path: "/employees", label: "Employees", emoji: "👥" }] : []),
    { path: "/settings", label: "Settings", emoji: "⚙️" },
  ];

  return (
    <div className={`layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/Sikko.jpeg" alt="Sikko Industries" className="sidebar-logo-img" />
          {!collapsed && <span className="sidebar-brand">Sikko Industries</span>}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === "/"} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`} title={item.label}>
              <span className="sidebar-icon">{item.emoji}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name}</span>
                <span className="sidebar-user-email">{user?.email}</span>
                <span className="sidebar-user-role" style={{ fontSize: '0.7rem', color: '#2e86c1', fontWeight: 600 }}>ID: {user?.employee_id || '—'}</span>
              </div>
            )}
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">🚪</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
