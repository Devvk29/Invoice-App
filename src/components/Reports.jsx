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
      <div className="page-header">
        <div>
          <h1>📈 <span>Executive Reports</span></h1>
          <p className="page-subtitle">Detailed business performance and invoice analytics.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Last Updated</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Report Stats - Professional Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 30 }}>
        <div className="card" style={{ padding: "20px", borderLeft: "4px solid #4338ca", background: "linear-gradient(to right, #f5f3ff, #fff)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", marginBottom: 8 }}>Total Revenue</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e1b4b" }}>{fmt(totalRevenue)}</div>
            </div>
            <div style={{ background: "#eef2ff", padding: 10, borderRadius: 12, fontSize: "1.2rem" }}>💰</div>
          </div>
        </div>
        <div className="card" onClick={() => navigate("/invoice-history")} style={{ cursor: "pointer", padding: "20px", borderLeft: "4px solid #0891b2", background: "linear-gradient(to right, #ecfeff, #fff)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0891b2", textTransform: "uppercase", marginBottom: 8 }}>Total Volume</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#164e63" }}>{invoices.length} <span style={{ fontSize: "0.9rem", color: "#6b7280", fontWeight: 400 }}>Inv.</span></div>
            </div>
            <div style={{ background: "#ecfeff", padding: 10, borderRadius: 12, fontSize: "1.2rem" }}>📄</div>
          </div>
        </div>
        <div className="card" onClick={() => setStatusFilter("paid")} style={{ cursor: "pointer", padding: "20px", borderLeft: "4px solid #059669", background: statusFilter === "paid" ? "#d1fae5" : "linear-gradient(to right, #f0fdf4, #fff)", transition: "all 0.2s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", marginBottom: 8 }}>Paid Invoices</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#064e3b" }}>{paidCount}</div>
            </div>
            <div style={{ background: "#d1fae5", padding: 10, borderRadius: 12, fontSize: "1.2rem" }}>✅</div>
          </div>
        </div>
        <div className="card" onClick={() => setStatusFilter("pending")} style={{ cursor: "pointer", padding: "20px", borderLeft: "4px solid #d97706", background: statusFilter === "pending" ? "#fef3c7" : "linear-gradient(to right, #fffbeb, #fff)", transition: "all 0.2s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#d97706", textTransform: "uppercase", marginBottom: 8 }}>Pending Dues</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#78350f" }}>{pendingCount}</div>
            </div>
            <div style={{ background: "#fef3c7", padding: 10, borderRadius: 12, fontSize: "1.2rem" }}>⏳</div>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="card" style={{ marginBottom: 25 }}>
        <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px" }}>
          <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 3 }}>
            {["invoices", "purchases"].map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)} 
                style={{ 
                  padding: "8px 18px", border: "none", borderRadius: 8, 
                  background: tab === t ? "#fff" : "transparent", 
                  color: tab === t ? "#4338ca" : "#6b7280", 
                  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter",
                  boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                {t === "invoices" ? "📄 Invoices" : "🛒 Purchases"}
              </button>
            ))}
          </div>
          
          {tab === "invoices" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Filter Status:</span>
              <div style={{ display: "flex", gap: 3, background: "#f3f4f6", padding: 2, borderRadius: 8 }}>
                <button
                  onClick={() => setStatusFilter("pending")}
                  style={{ padding: "6px 14px", border: "none", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", background: statusFilter === "pending" ? "#fff" : "transparent", color: statusFilter === "pending" ? "#d97706" : "#6b7280", boxShadow: statusFilter === "pending" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
                >Pending</button>
                <button
                  onClick={() => setStatusFilter("paid")}
                  style={{ padding: "6px 14px", border: "none", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", background: statusFilter === "paid" ? "#fff" : "transparent", color: statusFilter === "paid" ? "#059669" : "#6b7280", boxShadow: statusFilter === "paid" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
                >Paid</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {tab === "invoices" ? (
        <div className="card">
          {filteredInvoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>{`No ${statusFilter} invoices found`}</h3>
              <p>Try switching the filter or check your history.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Current Status</th>
                    <th style={{ textAlign: "right" }}>Update Payment</th>
                  </tr>
                </thead>
                <tbody>{filteredInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="cell-mono" style={{ fontWeight: 700 }}>{inv.invoice_no}</td>
                    <td>{fmtDate(inv.invoice_date)}</td>
                    <td className="cell-bold">{inv.client_name || "—"}</td>
                    <td className="cell-mono" style={{ color: "#4338ca", fontWeight: 700 }}>{fmt(inv.grand_total)}</td>
                    <td>
                      <span className={`badge badge-${inv.status === "paid" ? "paid" : "pending"}`} style={{ textTransform: "uppercase", fontSize: "0.65rem", padding: "3px 8px" }}>
                        {inv.status === "paid" ? "paid" : "pending"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 3, background: "#f3f4f6", padding: 2, borderRadius: 8, width: "fit-content", marginLeft: "auto" }}>
                        <button
                          onClick={() => updateStatus(inv.id, "confirmed")}
                          style={{ padding: "4px 10px", border: "none", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", background: inv.status !== "paid" ? "#fff" : "transparent", color: inv.status !== "paid" ? "#d97706" : "#6b7280", boxShadow: inv.status !== "paid" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
                        >Pending</button>
                        <button
                          onClick={() => updateStatus(inv.id, "paid")}
                          style={{ padding: "4px 10px", border: "none", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", background: inv.status === "paid" ? "#fff" : "transparent", color: inv.status === "paid" ? "#059669" : "#6b7280", boxShadow: inv.status === "paid" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
                        >Paid</button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          {purchases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <h3>No purchases recorded yet</h3>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead><tr><th>Invoice</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>{purchases.map(p => (
                  <tr key={p.id}>
                    <td className="cell-mono" style={{ fontWeight: 700 }}>{p.invoice_no}</td>
                    <td className="cell-mono" style={{ color: "#059669", fontWeight: 700 }}>{fmt(p.amount)}</td>
                    <td><span style={{ fontSize: "0.75rem", background: "#f3f4f6", padding: "4px 10px", borderRadius: 8 }}>{(p.payment_method || "").replace("_", " ")}</span></td>
                    <td>
                      <span className={`badge badge-${p.payment_status === "completed" ? "paid" : "pending"}`} style={{ textTransform: "uppercase", fontSize: "0.65rem" }}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "#6b7280" }}>{fmtDate(p.purchased_at)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
