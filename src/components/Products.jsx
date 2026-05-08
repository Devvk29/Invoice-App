import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../Pages.css";

const CATEGORIES = [
  "All",
  "Organic Certified Agro Chemicals",
  "Organic Agro Chemicals",
  "Agro Chemicals",
  "Fertilizers",
  "Seeds",
  "Sprayers",
  "FMCG Products",
  "Household Products",
];

const CATEGORY_ICONS = {
  "Organic Certified Agro Chemicals": "🌿",
  "Organic Agro Chemicals": "🧪",
  "Agro Chemicals": "⚗️",
  "Fertilizers": "🌱",
  "Seeds": "🌾",
  "Sprayers": "💧",
  "FMCG Products": "🛒",
  "Household Products": "🏠",
};

const Products = () => {
  const { api, user } = useAuth();
  const [products, setProducts] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [form, setForm] = useState({ name: "", hsn_code: "", unit_price: "", unit: "Per Unit", description: "", category: "", stock: "" });

  useEffect(() => { fetchProducts(); }, []);

  if (user?.role !== "admin") {
    return (
      <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🚫</div>
        <h1>Access Denied</h1>
        <p style={{ color: "#6b7280", maxWidth: "400px" }}>You do not have permission to view or manage products. Please contact your administrator if you believe this is an error.</p>
      </div>
    );
  }

  const fetchProducts = async () => {
    try { const res = await api.get("/products"); setProducts(res.data.products); }
    catch (err) { console.error(err); }
  };

  const openAdd = () => { setEditing(null); setForm({ name: "", hsn_code: "", unit_price: "", unit: "Per Unit", description: "", category: "", stock: "" }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, hsn_code: p.hsn_code || "", unit_price: p.unit_price || "", unit: p.unit || "Per Unit", description: p.description || "", category: p.category || "", stock: p.stock || "" }); setShowModal(true); };

  const showToast = (msg, isError = false) => { setToast({ msg, isError }); setTimeout(() => setToast(null), 3000); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/products/${editing.id}`, form); showToast("Product updated!"); }
      else { await api.post("/products", form); showToast("Product added!"); }
      setShowModal(false); fetchProducts();
    } catch (err) { showToast(err.response?.data?.error || "Failed", true); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); showToast("Product deleted"); fetchProducts(); }
    catch { showToast("Delete failed", true); }
  };

  const onChange = (k, v) => setForm({ ...form, [k]: v });
  const fmt = (n) => n ? `₹${parseFloat(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";

  // Filter products
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  // Category stats
  const catCounts = {};
  products.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });

  return (
    <div className="page">
      <div className="page-header">
        <h1>📦 <span>Products</span></h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", color: "#6b7280", fontWeight: 600 }}>{filtered.length} products</span>
          <button className="btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      {/* Category Stats Cards */}
      {products.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
          {CATEGORIES.filter(c => c !== "All").map(cat => (
            <div
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? "All" : cat)}
              style={{
                padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                background: catFilter === cat ? "#eef2ff" : "#fff",
                border: catFilter === cat ? "2px solid #4338ca" : "1px solid #e5e7eb",
                transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.3rem" }}>{CATEGORY_ICONS[cat] || "📦"}</span>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: catFilter === cat ? "#4338ca" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.3px" }}>{cat.replace("Organic Certified ", "Org. Cert. ").replace("Organic Agro", "Org. Agro")}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: catFilter === cat ? "#4338ca" : "#111827" }}>{catCounts[cat] || 0}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search & View Toggle */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "12px 16px", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 180, maxWidth: "100%" }}>
            <input
              type="text" placeholder="🔍 Search products..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: "0.88rem", fontFamily: "Inter", outline: "none", background: "#fff", color: "#1f2937", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {catFilter !== "All" && (
              <button className="btn-sm" onClick={() => setCatFilter("All")} style={{ background: "#eef2ff", color: "#4338ca", borderColor: "#c7d2fe", whiteSpace: "nowrap" }}>
                ✕ {catFilter.length > 15 ? catFilter.substring(0, 15) + '...' : catFilter}
              </button>
            )}
            <div style={{ display: "flex", gap: 2, background: "#f3f4f6", borderRadius: 8, padding: 2, flexShrink: 0 }}>
              <button onClick={() => setViewMode("table")} style={{ padding: "8px 16px", border: "none", borderRadius: 6, background: viewMode === "table" ? "#fff" : "transparent", color: viewMode === "table" ? "#4338ca" : "#6b7280", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter", boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", whiteSpace: "nowrap" }}>📋 Table</button>
              <button onClick={() => setViewMode("cards")} style={{ padding: "8px 16px", border: "none", borderRadius: 6, background: viewMode === "cards" ? "#fff" : "transparent", color: viewMode === "cards" ? "#4338ca" : "#6b7280", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter", boxShadow: viewMode === "cards" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", whiteSpace: "nowrap" }}>🃏 Cards</button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state"><div className="empty-icon">📦</div><h3>{search || catFilter !== "All" ? "No products match your filter" : "No products yet"}</h3><p>{search || catFilter !== "All" ? "Try adjusting your search or category" : "Add your products to use them in invoices"}</p><button className="btn-primary" onClick={openAdd}>+ Add Product</button></div>
        </div>
      ) : viewMode === "cards" ? (
        /* Card View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", transition: "all 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
            >
              <div style={{ padding: "4px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.5px", background: "#eef2ff", padding: "3px 8px", borderRadius: 6 }}>{p.category || "Uncategorized"}</span>
                <span style={{ fontSize: "1.2rem" }}>{CATEGORY_ICONS[p.category] || "📦"}</span>
              </div>
              <div style={{ padding: "12px 16px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", marginBottom: 4 }}>{p.name}</h3>
                {p.description && <p style={{ fontSize: "0.76rem", color: "#9ca3af", marginBottom: 10, lineHeight: 1.5 }}>{p.description}</p>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669" }}>{fmt(p.unit_price)}</span>
                    <span style={{ fontSize: "0.72rem", color: "#9ca3af", marginLeft: 4 }}>{p.unit}</span>
                  </div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: 6 }}>HSN: {p.hsn_code || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: "0.75rem", color: parseInt(p.stock) > 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>{parseInt(p.stock) > 0 ? `${p.stock} in stock` : "Out of stock"}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-sm" onClick={() => openEdit(p)} style={{ padding: "4px 10px", fontSize: "0.72rem" }}>✏️</button>
                    <button className="btn-danger" onClick={() => handleDelete(p.id)} style={{ padding: "4px 10px", fontSize: "0.72rem" }}>🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card">
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Product</th><th>HSN</th><th>Price</th><th>Unit</th><th>Category</th><th>Stock</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "1.2rem" }}>{CATEGORY_ICONS[p.category] || "📦"}</span>
                        <div>
                          <div className="cell-bold">{p.name}</div>
                          {p.description && <div style={{ fontSize: "0.7rem", color: "#9ca3af", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="cell-mono">{p.hsn_code || "—"}</td>
                    <td className="cell-mono" style={{ fontWeight: 700, color: "#059669" }}>{fmt(p.unit_price)}</td>
                    <td><span style={{ fontSize: "0.75rem", background: "#f3f4f6", padding: "3px 8px", borderRadius: 6, fontWeight: 600, color: "#4b5563" }}>{p.unit}</span></td>
                    <td><span style={{ fontSize: "0.68rem", background: "#eef2ff", color: "#4338ca", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>{p.category || "—"}</span></td>
                    <td><span style={{ fontWeight: 600, color: parseInt(p.stock) > 0 ? "#059669" : "#dc2626", fontSize: "0.82rem" }}>{p.stock ?? "—"}</span></td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                        <button className="btn-danger" onClick={() => handleDelete(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "✏️ Edit Product" : "📦 Add New Product"}</h2>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group full"><label>Product Name *</label><input value={form.name} onChange={(e) => onChange("name", e.target.value)} placeholder="e.g. Sikko Organic Neem Oil" required /></div>
                <div className="form-group"><label>HSN Code</label><input value={form.hsn_code} onChange={(e) => onChange("hsn_code", e.target.value)} placeholder="e.g. 3808" /></div>
                <div className="form-group"><label>Unit Price (₹)</label><input type="number" step="0.01" value={form.unit_price} onChange={(e) => onChange("unit_price", e.target.value)} placeholder="0.00" /></div>
                <div className="form-group"><label>Unit</label>
                  <select value={form.unit} onChange={(e) => onChange("unit", e.target.value)}>
                    <option>Per Unit</option><option>Per Kg</option><option>Per Litre</option><option>Per Piece</option><option>Per Box</option><option>Per Ton</option><option>Per Meter</option><option>Per Bag</option><option>Per Roll</option><option>Per Set</option><option>Per Dozen</option>
                  </select>
                </div>
                <div className="form-group"><label>Category</label>
                  <select value={form.category} onChange={(e) => onChange("category", e.target.value)}>
                    <option value="">Select Category</option>
                    {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Stock</label><input type="number" value={form.stock} onChange={(e) => onChange("stock", e.target.value)} placeholder="0" /></div>
                <div className="form-group full"><label>Description</label><textarea value={form.description} onChange={(e) => onChange("description", e.target.value)} placeholder="Product description..." /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? "Update" : "Add"} Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.isError ? "error" : ""}`}>{toast.msg}</div>}
    </div>
  );
};

export default Products;
