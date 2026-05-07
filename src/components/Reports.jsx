import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Pages.css";

const Reports = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("invoices");
  const [statusFilter, setStatusFilter] = useState("pending"); // pending or paid

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [invR, purR] = await Promise.all([api.get("/invoices"), api.get("/purchases")]);
      setInvoices(invR.data.invoices || []);
      setPurchases(purR.data.purchases || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.grand_total || 0), 0);
  const paidCount = invoices.filter(i => i.status === "paid").length;
  const pendingCount = invoices.filter(i => i.status !== "paid").length;

  // Filter invoices by status (paid or pending only)
  const filteredInvoices = statusFilter === "pending"
    ? invoices.filter(i => i.status !== "paid")
    : invoices.filter(i => i.status === "paid");

  const updateStatus = async (id, status) => {
    try { await api.patch(`/invoices/${id}/status`, { status }); fetchData(); }
    catch { alert("Failed to update"); }
  };

  if (loading) return <div className="page" style={{ textAlign: "center", paddingTop: 80 }}><p style={{ color: "#9ca3af" }}>Loading reports...</p></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>📈 <span>Reports</span></h1></div>

      {/* Report Stats - Clickable */}
      <div className="stats-row">
        <div className="stat-card" style={{ cursor: "default" }}>
          <div className="stat-icon">💰</div><div className="stat-number">{fmt(totalRevenue)}</div><div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card" onClick={() => navigate("/invoice-history")} style={{ cursor: "pointer", border: "1px solid #e5e7eb" }}>
          <div className="stat-icon">📄</div><div className="stat-number">{invoices.length}</div><div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter("paid")} style={{ cursor: "pointer", border: statusFilter === "paid" ? "2px solid #059669" : "1px solid #e5e7eb" }}>
          <div className="stat-icon">✅</div><div className="stat-number">{paidCount}</div><div className="stat-label">Paid</div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter("pending")} style={{ cursor: "pointer", border: statusFilter === "pending" ? "2px solid #92400e" : "1px solid #e5e7eb" }}>
          <div className="stat-icon">⏳</div><div className="stat-number">{pendingCount}</div><div className="stat-label">Pending</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f3f4f6", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {["invoices", "purchases"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 20px", border: "none", borderRadius: 10, background: tab === t ? "#eef2ff" : "transparent", color: tab === t ? "#4338ca" : "#6b7280", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>{t === "invoices" ? "📄 All Invoices" : "🛒 All Purchases"}</button>
        ))}
      </div>

      {tab === "invoices" ? (
        <div className="card">
          {filteredInvoices.length === 0 ? <div className="empty-state"><h3>{`No ${statusFilter} invoices`}</h3></div> : (
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Date</th><th>Client</th><th>Amount</th><th>Status</th><th>Change Status</th></tr></thead>
              <tbody>{filteredInvoices.map(inv => (
                <tr key={inv.id}>
                  <td className="cell-mono">{inv.invoice_no}</td>
                  <td>{fmtDate(inv.invoice_date)}</td>
                  <td className="cell-bold">{inv.client_name || "—"}</td>
                  <td className="cell-mono">{fmt(inv.grand_total)}</td>
                  <td><span className={`badge badge-${inv.status === "paid" ? "paid" : "pending"}`}>{inv.status === "paid" ? "paid" : "pending"}</span></td>
                  <td>
                    <select 
                      value={inv.status === "paid" ? "paid" : "pending"}
                      onChange={e => {
                        const newStatus = e.target.value === "paid" ? "paid" : "confirmed";
                        updateStatus(inv.id, newStatus);
                      }}
                      style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 12px", color: "#1f2937", fontSize: "0.78rem", fontFamily: "Inter", cursor: "pointer" }}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card">
          {purchases.length === 0 ? <div className="empty-state"><h3>No purchases</h3></div> : (
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>{purchases.map(p => (
                <tr key={p.id}>
                  <td className="cell-mono">{p.invoice_no}</td>
                  <td className="cell-mono">{fmt(p.amount)}</td>
                  <td>{(p.payment_method || "").replace("_", " ")}</td>
                  <td><span className={`badge badge-${p.payment_status}`}>{p.payment_status}</span></td>
                  <td>{fmtDate(p.purchased_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
