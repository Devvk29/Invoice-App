import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAuth } from "../context/AuthContext";
import "../Pages.css";
import "../Invoice.css";
import ProformaInvoiceTemplate from "./ProformaInvoiceTemplate";
import "./Dashboard.css";

const StatCard = ({ label, value, icon, color, to }) => (
  <Link to={to} style={{ textDecoration: "none" }}>
    <div className="db-stat-card" style={{ "--accent": color }}>
      <div className="db-stat-icon">{icon}</div>
      <div className="db-stat-body">
        <div className="db-stat-value">{value}</div>
        <div className="db-stat-label">{label}</div>
      </div>
    </div>
  </Link>
);

const statusStyle = (status) => {
  const s = (status || "draft").toLowerCase();
  if (s === "paid") return { background: "#d1fae5", color: "#065f46" };
  if (s === "confirmed") return { background: "#dbeafe", color: "#1e40af" };
  return { background: "#fef3c7", color: "#92400e" };
};

const Dashboard = () => {
  const { user, api } = useAuth();
  const [data, setData] = useState({
    stats: { customers: 0, products: 0, invoices: 0, revenue: 0 },
    recentInvoices: [], recentCustomers: [], soldProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const pdfRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/dashboard").then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const openPreview = async (inv) => {
    try {
      const res = await api.get(`/invoices/${inv.id}`);
      setPreviewInvoice(res.data.invoice);
      setPreviewItems(res.data.items || []);
      setShowModal(true);
    } catch { alert("Failed to load invoice"); }
  };

  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    try {
      const rect = pdfRef.current.getBoundingClientRect();
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2, useCORS: true, backgroundColor: "#fff",
        width: 794, height: Math.ceil(rect.height), windowWidth: 794
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const pW = pdf.internal.pageSize.getWidth();
      const pH = pdf.internal.pageSize.getHeight();
      const scale = Math.min(pW / canvas.width, pH / canvas.height);
      const w = canvas.width * scale;
      const h = Math.min(canvas.height * scale, pH);
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pW - w) / 2, 0, w, h);
      pdf.save(`Sikko_${previewInvoice?.invoice_no || "invoice"}.pdf`);
    } catch (err) { alert("PDF error: " + err.message); }
  };

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="auth-spinner" style={{ borderColor: "#e2e8f0", borderTopColor: "#2563eb", width: 36, height: 36 }} />
    </div>
  );

  const inv = previewInvoice;

  return (
    <div className="db-root">
      {/* ── Top Bar ── */}
      <div className="db-topbar">
        <div>
          <div className="db-topbar-title">Dashboard</div>
          <div className="db-topbar-sub">Welcome back, <strong>{user?.name}</strong> · {user?.employee_id}</div>
        </div>
        <div className="db-topbar-actions">
          {data.recentInvoices.length > 0 && (
            <button className="db-btn-outline" onClick={() => openPreview(data.recentInvoices[0])}>Preview Latest</button>
          )}
          <Link to="/invoice" className="db-btn-primary">+ New Invoice</Link>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="db-kpi-grid">
        <StatCard to="/invoice-history" label="Total Revenue" value={fmt(data.stats.revenue)} icon="₹" color="#2563eb" />
        <StatCard to="/invoice-history" label="Invoices" value={data.stats.invoices} icon="📄" color="#7c3aed" />
        <StatCard to="/customers" label="Customers" value={data.stats.customers} icon="👥" color="#059669" />
        <StatCard to="/products" label="Products" value={data.stats.products} icon="📦" color="#d97706" />
      </div>

      {/* ── Quick Actions ── */}
      <div className="db-actions-row">
        {[
          { to: "/invoice", label: "Create Invoice", icon: "📄" },
          { to: "/customers", label: "Add Customer", icon: "👤" },
          { to: "/reports", label: "View Reports", icon: "📊" },
          { to: "/settings", label: "Settings", icon: "⚙️" },
        ].map(a => (
          <Link key={a.to} to={a.to} className="db-action-pill">
            <span>{a.icon}</span> {a.label}
          </Link>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="db-content-grid">

        {/* Recent Invoices */}
        <div className="db-panel">
          <div className="db-panel-header">
            <span className="db-panel-title">Recent Invoices</span>
            <Link to="/invoice-history" className="db-panel-link">See all →</Link>
          </div>
          {data.recentInvoices.length === 0 ? (
            <div className="db-empty">No invoices yet. <Link to="/invoice">Create one →</Link></div>
          ) : (
            <div className="db-scroll-x">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th className="db-th-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="db-mono">{inv.invoice_no}</td>
                      <td className="db-muted">{fmtDate(inv.invoice_date)}</td>
                      <td className="db-bold">{inv.client_name || "—"}</td>
                      <td>
                        <span className="db-badge" style={statusStyle(inv.status)}>
                          {(inv.status || "DRAFT").toUpperCase()}
                        </span>
                      </td>
                      <td className="db-bold db-th-right">{fmt(inv.grand_total)}</td>
                      <td>
                        <button className="db-view-btn" onClick={() => openPreview(inv)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="db-side-col">
          
          {/* Recent Customers */}
          <div className="db-panel">
            <div className="db-panel-header">
              <span className="db-panel-title">Recent Clients</span>
              <Link to="/customers" className="db-panel-link">All →</Link>
            </div>
            {data.recentCustomers.length === 0 ? (
              <div className="db-empty">No customers yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
                {data.recentCustomers.slice(0, 5).map((c, i) => (
                  <div key={i} className="db-customer-row">
                    <div className="db-avatar">{c.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="db-bold db-truncate">{c.name}</div>
                      <div className="db-muted db-truncate" style={{ fontSize: "12px" }}>{c.gst_no || c.city || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="db-panel">
            <div className="db-panel-header">
              <span className="db-panel-title">Top Products</span>
              <Link to="/products" className="db-panel-link">All →</Link>
            </div>
            {data.soldProducts.length === 0 ? (
              <div className="db-empty">No sales data yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {data.soldProducts.slice(0, 5).map((p, i) => (
                  <div key={i} className="db-product-row">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      <div className="db-rank">#{i + 1}</div>
                      <div className="db-truncate" style={{ fontSize: "13px", fontWeight: 500 }}>{p.product_name}</div>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>{p.total_qty} units</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Invoice Preview Modal ── */}
      {showModal && inv && (
        <div className="db-modal-bg" onClick={() => setShowModal(false)}>
          <div className="db-modal-box" onClick={e => e.stopPropagation()}>
            <div className="db-modal-header">
              <span style={{ fontWeight: 700, fontSize: "15px" }}>Invoice — {inv.invoice_no}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="db-btn-primary" onClick={downloadPDF} style={{ fontSize: "13px" }}>Download PDF</button>
                <button className="db-btn-outline" onClick={() => setShowModal(false)} style={{ fontSize: "13px" }}>✕ Close</button>
              </div>
            </div>
            <div className="db-modal-body">
              <div ref={pdfRef} style={{ width: 794, margin: "0 auto" }}>
                <ProformaInvoiceTemplate
                  invoiceNo={inv.invoice_no}
                  invoiceDate={inv.invoice_date}
                  client={{ name: inv.client_name, address: inv.client_address, gst: inv.client_gst }}
                  items={previewItems || []}
                  rates={{ cgst_rate: inv.cgst_rate, sgst_rate: inv.sgst_rate }}
                  totals={{ subtotal: inv.subtotal, cgst: inv.cgst, sgst: inv.sgst, discount: inv.discount, grand_total: inv.grand_total }}
                  totalInWords={inv.total_in_words}
                  preparedBy={{ name: inv.prepared_by_name || user?.name, phone: inv.prepared_by_phone || user?.phone, email: inv.prepared_by_email || user?.email, employee_id: inv.prepared_by_employee_id || user?.employee_id }}
                  org={{ company_name: inv.company_name, company_address_line1: (inv.company_address || "").split("\n")[0], company_address_line2: (inv.company_address || "").split("\n")[1], terms_conditions: inv.terms, company_gst: inv.company_gst, company_phone: inv.company_phone }}
                  bank={{ bank_name: inv.bank_name, bank_account_name: inv.bank_account_name, bank_account_no: inv.bank_account_no, bank_ifsc: inv.bank_ifsc, bank_branch: inv.bank_branch }}
                  transporter="" deliveryLocation=""
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
