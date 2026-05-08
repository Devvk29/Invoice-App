import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAuth } from "../context/AuthContext";
import "../Pages.css";
import "../Invoice.css";
import ProformaInvoiceTemplate from "./ProformaInvoiceTemplate";

const InvoiceHistory = () => {
  const { user, api } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // default to pending
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editTerms, setEditTerms] = useState("");
  const [updatingTerms, setUpdatingTerms] = useState(false);
  const pdfRef = useRef();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/invoices");
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  const openPreview = async (inv) => {
    try {
      const res = await api.get(`/invoices/${inv.id}`);
      setPreviewInvoice(res.data.invoice);
      setPreviewItems(res.data.items || []);
      setEditTerms(res.data.invoice.terms || "");
      setShowPreviewModal(true);
    } catch {
      alert("Failed to load invoice details");
    }
  };

  const downloadPDF = async () => {
    if (!pdfRef.current) {
      alert("PDF preview not ready — please try again");
      return;
    }
    try {
      const rect = pdfRef.current.getBoundingClientRect();
      const contentHeight = Math.ceil(rect.height);
      const waitForImages = async (root) => {
        const imgs = Array.from(root.querySelectorAll("img"));
        await Promise.all(
          imgs.map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            });
          })
        );
      };
      await waitForImages(pdfRef.current);
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff",
        logging: false,
        allowTaint: true,
        width: 794,
        height: contentHeight,
        windowWidth: 794,
        windowHeight: contentHeight,
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const pW = pdf.internal.pageSize.getWidth();
      const pH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;

      // Force 1-page output by scaling captured invoice to fit inside A4.
      const scaleToFit = Math.min(pW / imgW, pH / imgH);
      let finalW = imgW * scaleToFit;
      let finalH = imgH * scaleToFit;
      if (finalH > pH) {
        finalH = pH;
        finalW = imgW * (finalH / imgH);
      }
      const x = (pW - finalW) / 2;
      const y = 0;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.98), "JPEG", x, y, finalW, finalH);
      pdf.save(`Sikko_Industries_${previewInvoice?.invoice_no || "invoice"}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("PDF generation failed: " + err.message);
    }
  };

  const deleteInvoice = async (id) => {
    const inv = invoices.find(i => i.id === id);
    
    // Check if sales person is trying to delete someone else's invoice
    if (user.role === "sales" && inv.user_id !== user.id) {
      alert("You can only delete your own invoices.");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    setDeleting(id);
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices(invoices.filter(inv => inv.id !== id));
      alert("Invoice deleted successfully");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete invoice");
    } finally {
      setDeleting(null);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/invoices/${id}/status`, { status });
      fetchInvoices();
    } catch {
      alert("Failed to update status");
    }
  };

  const saveUpdatedTerms = async () => {
    if (!previewInvoice) return;
    setUpdatingTerms(true);
    try {
      await api.patch(`/invoices/${previewInvoice.id}/terms`, { terms: editTerms, notes: previewInvoice.notes });
      setPreviewInvoice({ ...previewInvoice, terms: editTerms });
      // Update local list too
      setInvoices(invoices.map(i => i.id === previewInvoice.id ? { ...i, terms: editTerms } : i));
      alert("Terms updated successfully");
    } catch {
      alert("Failed to update terms");
    } finally {
      setUpdatingTerms(false);
    }
  };

  // Filter invoices (paid or pending only)
  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "pending"
      ? (inv.status === "draft" || inv.status === "confirmed")
      : inv.status === "paid";
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered.reduce((s, i) => s + parseFloat(i.grand_total || 0), 0);
  const inv = previewInvoice;

  if (loading) return <div className="page" style={{ textAlign: "center", paddingTop: 80 }}><p style={{ color: "#9ca3af" }}>Loading invoice history...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>🧾 <span>Invoice History</span></h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.82rem", color: "#6b7280", fontWeight: 600 }}>{filtered.length} invoices</span>
          <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#059669" }}>{fmt(totalRevenue)}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", padding: "12px 16px" }}>
          <div style={{ flex: 1, minWidth: 180, maxWidth: "100%" }}>
            <input
              type="text"
              placeholder="🔍 Search by invoice no. or client name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: "0.88rem", fontFamily: "Inter", outline: "none", background: "#fff", color: "#1f2937", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 3, flexShrink: 0 }}>
            {["pending", "paid"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "8px 20px", border: "none", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter",
                  background: statusFilter === s ? (s === "paid" ? "#d1fae5" : "#fef3c7") : "transparent",
                  color: statusFilter === s ? (s === "paid" ? "#065f46" : "#92400e") : "#6b7280",
                  whiteSpace: "nowrap",
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h3>{search || statusFilter !== "all" ? "No invoices match your filter" : "No invoices generated yet"}</h3>
            <p>{search || statusFilter !== "all" ? "Try adjusting your search or filter" : "Generate your first invoice from the New Invoice page"}</p>
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
                  <th>Status</th>
                  <th>Created By</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td className="cell-mono" style={{ fontWeight: 700 }}>{inv.invoice_no}</td>
                    <td>{fmtDate(inv.invoice_date)}</td>
                    <td className="cell-bold">{inv.client_name || "—"}</td>
                    <td className="cell-mono">{fmt(inv.grand_total)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 3, background: "#f3f4f6", padding: 2, borderRadius: 8, width: "fit-content" }}>
                        <button
                          onClick={() => updateStatus(inv.id, "confirmed")}
                          style={{ padding: "4px 8px", border: "none", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", background: inv.status !== "paid" ? "#fff" : "transparent", color: inv.status !== "paid" ? "#d97706" : "#6b7280", boxShadow: inv.status !== "paid" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
                        >Pending</button>
                        <button
                          onClick={() => updateStatus(inv.id, "paid")}
                          style={{ padding: "4px 8px", border: "none", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", background: inv.status === "paid" ? "#fff" : "transparent", color: inv.status === "paid" ? "#059669" : "#6b7280", boxShadow: inv.status === "paid" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
                        >Paid</button>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "#6b7280" }}>{inv.prepared_by_name || "—"}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn-sm" onClick={() => openPreview(inv)} style={{ marginRight: 6 }}>👁️ Preview</button>
                      <button
                        className="btn-danger"
                        onClick={() => deleteInvoice(inv.id)}
                        disabled={deleting === inv.id || (user.role === "sales" && inv.user_id !== user.id)}
                        title={user.role === "sales" && inv.user_id !== user.id ? "You can only delete your own invoices" : "Delete invoice"}
                        style={{ padding: "4px 10px", fontSize: "0.75rem", opacity: user.role === "sales" && inv.user_id !== user.id ? 0.5 : 1 }}
                      >
                        {deleting === inv.id ? "..." : "🗑️"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Preview Modal ─── */}
      {showPreviewModal && inv && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div style={{ background: "#fff", borderRadius: 16, maxWidth: 860, width: "100%", maxHeight: "90vh", overflow: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
            {/* Modal Top Bar */}
            <div style={{ position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "16px 16px 0 0", zIndex: 10 }}>
              <span style={{ color: "#111827", fontWeight: 700, fontSize: "0.95rem" }}>📄 Invoice — {inv.invoice_no}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary" onClick={downloadPDF} style={{ padding: "8px 18px", fontSize: "0.82rem" }}>📥 Download PDF</button>
                <button className="btn-sm" onClick={() => setShowPreviewModal(false)}>✕ Close</button>
              </div>
            </div>

            {/* PDF Content */}
            <div ref={pdfRef} style={{ width: 794, overflow: "visible" }}>
              <ProformaInvoiceTemplate
                invoiceNo={inv.invoice_no}
                invoiceDate={inv.invoice_date}
                statusLabel={inv.status || "DRAFT"}
                client={{ name: inv.client_name, address: inv.client_address, gst: inv.client_gst }}
                items={previewItems || []}
                rates={{ cgst_rate: inv.cgst_rate, sgst_rate: inv.sgst_rate }}
                totals={{ subtotal: inv.subtotal, cgst: inv.cgst, sgst: inv.sgst, discount: inv.discount, grand_total: inv.grand_total }}
                totalInWords={inv.total_in_words}
                preparedBy={{
                  name: inv.prepared_by_name || user?.name,
                  phone: inv.prepared_by_phone || user?.phone,
                  email: inv.prepared_by_email || user?.email,
                  employee_id: inv.prepared_by_employee_id || user?.employee_id,
                }}
                org={{
                  company_name: inv.company_name,
                  company_address_line1: (inv.company_address || "").split("\n")[0],
                  company_address_line2: (inv.company_address || "").split("\n")[1],
                }}
                bank={{
                  bank_name: inv.bank_name,
                  bank_account_name: inv.bank_account_name,
                  bank_account_no: inv.bank_account_no,
                  bank_ifsc: inv.bank_ifsc,
                  bank_branch: inv.bank_branch,
                }}
                terms={editTerms}
                transporter=""
                deliveryLocation=""
              />
            </div>

            {/* Editable Terms Section */}
            <div style={{ padding: "20px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-header"><h3>📄 Edit Invoice Terms</h3></div>
                <div className="card-body">
                  <div className="form-group full">
                    <label>Terms & Conditions (Updates immediately in preview above)</label>
                    <textarea
                      value={editTerms}
                      onChange={(e) => setEditTerms(e.target.value)}
                      placeholder="Invoice terms..."
                      style={{ minHeight: 180, background: "#fff" }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                    <button className="btn-primary" onClick={saveUpdatedTerms} disabled={updatingTerms}>
                      {updatingTerms ? "Saving..." : "💾 Save Changes to Invoice"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
