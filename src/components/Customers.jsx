import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../Pages.css";

const Customers = () => {
  const { api, user } = useAuth();
  const [customers, setCustomers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", gst_no: "" });

  useEffect(() => { fetchCustomers(); }, []);

  if (user?.role !== "admin") {
    return (
      <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🚫</div>
        <h1>Access Denied</h1>
        <p style={{ color: "#6b7280", maxWidth: "400px" }}>You do not have permission to view or manage customers. Please contact your administrator if you believe this is an error.</p>
      </div>
    );
  }

  const fetchCustomers = async () => {
    try { const res = await api.get("/customers"); setCustomers(res.data.customers); }
    catch (err) { console.error(err); }
  };

  const openAdd = () => { setEditing(null); setForm({ name: "", company: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", gst_no: "" }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, company: c.company || "", phone: c.phone || "", email: c.email || "", address: c.address || "", city: c.city || "", state: c.state || "", pincode: c.pincode || "", gst_no: c.gst_no || "" }); setShowModal(true); };

  const showToast = (msg, isError = false) => { setToast({ msg, isError }); setTimeout(() => setToast(null), 3000); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/customers/${editing.id}`, form); showToast("Customer updated!"); }
      else { await api.post("/customers", form); showToast("Customer added!"); }
      setShowModal(false); fetchCustomers();
    } catch (err) { showToast(err.response?.data?.error || "Failed", true); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try { await api.delete(`/customers/${id}`); showToast("Customer deleted"); fetchCustomers(); }
    catch { showToast("Delete failed", true); }
  };

  const onChange = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="page">
      <div className="page-header">
        <h1>👥 <span>Customers</span></h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Customer</button>
      </div>

      <div className="card">
        {customers.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">👥</div><h3>No customers yet</h3><p>Add your first customer to get started</p><button className="btn-primary" onClick={openAdd}>+ Add Customer</button></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Email</th><th>GST No.</th><th>City</th><th>Actions</th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="cell-bold">{c.name}</td>
                  <td>{c.company || "—"}</td>
                  <td>{c.phone || "—"}</td>
                  <td className="cell-mono">{c.email || "—"}</td>
                  <td className="cell-mono">{c.gst_no || "—"}</td>
                  <td>{c.city || "—"}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="btn-sm" onClick={() => openEdit(c)}>✏️ Edit</button>
                    <button className="btn-danger" onClick={() => handleDelete(c.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Edit Customer" : "Add New Customer"}</h2>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Customer Name" required /></div>
                <div className="form-group"><label>Company</label><input value={form.company} onChange={(e) => onChange("company", e.target.value)} placeholder="Company Name" /></div>
                <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="Phone Number" /></div>
                <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="Email Address" /></div>
                <div className="form-group full"><label>Address</label><textarea value={form.address} onChange={(e) => onChange("address", e.target.value)} placeholder="Full Address" /></div>
                <div className="form-group"><label>City</label><input value={form.city} onChange={(e) => onChange("city", e.target.value)} placeholder="City" /></div>
                <div className="form-group"><label>State</label><input value={form.state} onChange={(e) => onChange("state", e.target.value)} placeholder="State" /></div>
                <div className="form-group"><label>Pincode</label><input value={form.pincode} onChange={(e) => onChange("pincode", e.target.value)} placeholder="Pincode" /></div>
                <div className="form-group"><label>GST Number</label><input value={form.gst_no} onChange={(e) => onChange("gst_no", e.target.value)} placeholder="GST Number" /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? "Update" : "Add"} Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.isError ? "error" : ""}`}>{toast.msg}</div>}
    </div>
  );
};

export default Customers;
