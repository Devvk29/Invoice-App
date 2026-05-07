import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../Pages.css";

const COMPANY = {
  name: "SIKKO INDUSTRIES LTD",
  tagline: "Quality Products for Agriculture & Home",
  reg_office: "45, Navrangpura, Nr. Swastik Cross Road, C.G. Road, Ahmedabad - 380009",
  factory: "Plot No. 78, GIDC Estate, Vatva, Ahmedabad, Gujarat - 382445",
  gst: "24AAVFS1234Q1Z2",
  pan: "AAVFS1234Q",
  cin: "U24100GJ2005PLC045678",
  phone: "+91 9737782959",
  email: "info@sikkoindustries.in",
  website: "www.sikkoindia.com",
  founded: "2005",
  state: "Gujarat",
  country: "India",
};

const BANK = {
  name: "ICICI BANK LTD.",
  account_name: "Sikko Industries Ltd.",
  account_no: "423551000001",
  ifsc: "ICIC0004235",
  branch: "Navrangpura, Ahmedabad",
  swift: "ICICINBB",
};

const CATEGORIES = [
  { name: "Organic Certified Agro Chemicals", icon: "🌿", desc: "Certified organic solutions for crop protection" },
  { name: "Organic Agro Chemicals", icon: "🧪", desc: "Natural agro-chemical formulations" },
  { name: "Agro Chemicals", icon: "⚗️", desc: "Pesticides, fungicides & herbicides" },
  { name: "Fertilizers", icon: "🌱", desc: "NPK, micronutrients & soil conditioners" },
  { name: "Seeds", icon: "🌾", desc: "Hybrid & premium quality seeds" },
  { name: "Sprayers", icon: "💧", desc: "Manual, battery & power sprayers" },
  { name: "FMCG Products", icon: "🛒", desc: "Cleaning & hygiene products" },
  { name: "Household Products", icon: "🏠", desc: "Pest control & home solutions" },
];

const Settings = () => {
  const { user, api } = useAuth();
  const isAdmin = (user?.role || "sales") === "admin";

  const [orgSettings, setOrgSettings] = useState({
    company_name: COMPANY.name,
    company_address_line1: COMPANY.reg_office,
    company_address_line2: COMPANY.factory,
    company_gst: COMPANY.gst,
    company_phone: COMPANY.phone,
    company_email: COMPANY.email,
    bank_name: BANK.name,
    bank_account_name: BANK.account_name,
    bank_account_no: BANK.account_no,
    bank_ifsc: BANK.ifsc,
    bank_branch: BANK.branch,
    terms_conditions: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changePwd, setChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", newPwd: "", confirm: "" });

  const [activeTab, setActiveTab] = useState("Account");

  const showToast = (msg, isError = false) => { setToast({ msg, isError }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    // Admin editable only, but everyone can view
    api
      .get("/org-settings")
      .then((r) => {
        const s = r.data?.settings;
        if (!s) return;
        setOrgSettings({
          company_name: s.company_name,
          company_address_line1: s.company_address_line1,
          company_address_line2: s.company_address_line2,
          company_gst: s.company_gst,
          company_phone: s.company_phone,
          company_email: s.company_email,
          bank_name: s.bank_name,
          bank_account_name: s.bank_account_name,
          bank_account_no: s.bank_account_no,
          bank_ifsc: s.bank_ifsc,
          bank_branch: s.bank_branch,
          terms_conditions: s.terms_conditions || "1. Once this proforma invoice is confirmed by the consignee, it cannot be changed or cancelled.\n2. Payment Terms: 100% Advanced.\n3. All goods sent outstation are at buyer's risk.\n4. All disputes will be settled at court of law - Ahmedabad (Gujarat) jurisdiction.\n5. Above quoted prices are all exfactory (Ahmedabad-Gujarat).\n6. Goods sold once will not be taken back under any circumstances.\n7. Material will be dispatched within 15 days after payment procedure.",
        });
      })
      .catch(() => {});
  }, []);

  const saveOrgSettings = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await api.put("/org-settings", { ...orgSettings });
      showToast("Company & Bank details updated");
    } catch (err) {
      showToast(err.response?.data?.error || "Update failed", true);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async () => {
    if (!profileForm.name || !profileForm.email) { showToast("Name and email required", true); return; }
    setSaving(true);
    try {
      await api.put("/auth/profile", profileForm);
      showToast("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      showToast(err.response?.data?.error || "Update failed", true);
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (!pwdForm.current || !pwdForm.newPwd) { showToast("Fill all password fields", true); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { showToast("New passwords don't match", true); return; }
    if (pwdForm.newPwd.length < 6) { showToast("Password must be at least 6 characters", true); return; }
    setSaving(true);
    try {
      await api.put("/auth/password", { currentPassword: pwdForm.current, newPassword: pwdForm.newPwd });
      showToast("Password changed successfully!");
      setChangePwd(false);
      setPwdForm({ current: "", newPwd: "", confirm: "" });
    } catch (err) {
      showToast(err.response?.data?.error || "Password change failed", true);
    } finally { setSaving(false); }
  };

  const fieldStyle = { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", alignItems: "center" };
  const labelStyle = { fontSize: "0.82rem", fontWeight: 600, color: "#6b7280", minWidth: 130 };
  const valStyle = { fontSize: "0.88rem", fontWeight: 600, color: "#111827", textAlign: "right" };

  return (
    <div className="page" style={{ padding: "30px" }}>
      <div className="page-header" style={{ marginBottom: 30 }}>
        <h1>⚙️ <span>Settings</span></h1>
        <p className="page-subtitle">Manage your account and system configuration.</p>
      </div>

      <div style={{ display: "flex", gap: "30px", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Sidebar */}
        <div className="settings-sidebar" style={{ width: "250px", flexShrink: 0, background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          {["Account", "Company", "Bank", "Invoice Defaults"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                width: "100%", textAlign: "left", padding: "12px 16px", marginBottom: "8px", borderRadius: "8px", border: "none", cursor: "pointer",
                fontSize: "0.95rem", fontWeight: 600, transition: "all 0.2s",
                background: activeTab === tab ? "#f0fdf4" : "transparent",
                color: activeTab === tab ? "#166534" : "#4b5563"
              }}
            >
              {tab === "Account" && "👤 "}
              {tab === "Company" && "🏢 "}
              {tab === "Bank" && "🏦 "}
              {tab === "Invoice Defaults" && "📄 "}
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="settings-content" style={{ flex: 1, minWidth: "300px" }}>
          
          {activeTab === "Account" && (
            <div className="card">
              <div className="card-header">
                <h3>👤 Profile</h3>
                {!editMode && <button className="btn-sm" onClick={() => setEditMode(true)}>✏️ Edit Profile</button>}
              </div>
              <div className="card-body">
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginBottom: "30px" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "16px", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, color: "#fff" }}>
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#111827", margin: "0 0 4px 0" }}>{user?.name}</h2>
                    <p style={{ color: "#6b7280", margin: "0 0 10px 0" }}>{user?.email}</p>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontSize: "0.75rem", background: "#ecfdf5", color: "#059669", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>ID: {user?.employee_id || "—"}</span>
                      <span style={{ fontSize: "0.75rem", background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>Role: {(user?.role || "sales").toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {editMode ? (
                  <div className="form-grid" style={{ marginBottom: "30px" }}>
                    <div className="form-group"><label>Full Name</label><input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
                    <div className="form-group"><label>Email</label><input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} /></div>
                    <div className="form-group"><label>Phone</label><input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
                    <div className="form-group" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <button className="btn-primary" onClick={handleProfileSave} disabled={saving}>{saving ? "Saving..." : "💾 Save"}</button>
                      <button className="btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "4px" }}>Full Name</span>
                      <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>{user?.name || "—"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "4px" }}>Employee ID</span>
                      <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>{user?.employee_id || "—"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "4px" }}>Email Address</span>
                      <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>{user?.email || "—"}</span>
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: "4px" }}>Phone Number</span>
                      <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>{user?.phone || "—"}</span>
                    </div>
                  </div>
                )}

                <div style={{ padding: "16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <span style={{ color: "#d97706", fontSize: "1.2rem" }}>ℹ️</span>
                  <span style={{ color: "#92400e", fontSize: "0.85rem", fontWeight: 500 }}>Your account details are managed by your organization. Contact your system administrator for role changes.</span>
                </div>

                <div style={{ paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
                  {!changePwd ? (
                    <button className="btn-sm" onClick={() => setChangePwd(true)} style={{ background: "#f3f4f6", color: "#374151" }}>🔒 Change Password</button>
                  ) : (
                    <div style={{ maxWidth: 400 }}>
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827", marginBottom: 12 }}>🔒 Change Password</h4>
                      <div className="form-grid">
                        <div className="form-group full"><label>Current Password</label><input type="password" value={pwdForm.current} onChange={e => setPwdForm({ ...pwdForm, current: e.target.value })} placeholder="Enter current password" /></div>
                        <div className="form-group"><label>New Password</label><input type="password" value={pwdForm.newPwd} onChange={e => setPwdForm({ ...pwdForm, newPwd: e.target.value })} placeholder="Min 6 characters" /></div>
                        <div className="form-group"><label>Confirm New Password</label><input type="password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} placeholder="Re-enter new password" /></div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button className="btn-primary" onClick={handlePasswordChange} disabled={saving}>{saving ? "Updating..." : "Update Password"}</button>
                        <button className="btn-sm" onClick={() => { setChangePwd(false); setPwdForm({ current: "", newPwd: "", confirm: "" }); }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Company" && (
            <div className="card">
              <div className="card-header"><h3>🏢 Company Details</h3></div>
              <div className="card-body">
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap" }}>
                  <img src="/Sikko.jpeg" alt="Sikko Industries" style={{ width: 90, height: 90, objectFit: "contain", borderRadius: 12, border: "1px solid #e5e7eb", padding: 8, background: "#fff" }} />
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1a5276", marginBottom: 4 }}>
                      {isAdmin ? (
                        <input
                          value={orgSettings.company_name}
                          onChange={(e) => setOrgSettings({ ...orgSettings, company_name: e.target.value })}
                          style={{ ...valStyle, fontSize: "1.2rem", width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px" }}
                          disabled={!isAdmin}
                        />
                      ) : (
                        orgSettings.company_name
                      )}
                    </h2>
                    <p style={{ fontSize: "0.82rem", color: "#6b7280", fontStyle: "italic" }}>{COMPANY.tagline}</p>
                    <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.7rem", background: "#d1fae5", color: "#065f46", padding: "3px 10px", borderRadius: 6, fontWeight: 600 }}>Est. {COMPANY.founded}</span>
                      <span style={{ fontSize: "0.7rem", background: "#eef2ff", color: "#4338ca", padding: "3px 10px", borderRadius: 6, fontWeight: 600 }}>GSTIN Registered</span>
                    </div>
                  </div>
                </div>

                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, marginBottom: 16 }}>
                  <div style={fieldStyle}>
                    <span style={labelStyle}>GST Number</span>
                    {isAdmin ? (
                      <input
                        value={orgSettings.company_gst}
                        onChange={(e) => setOrgSettings({ ...orgSettings, company_gst: e.target.value })}
                        style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", width: "60%" }}
                      />
                    ) : (
                      <span style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>{orgSettings.company_gst}</span>
                    )}
                  </div>
                  <div style={fieldStyle}><span style={labelStyle}>PAN</span><span style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>{COMPANY.pan}</span></div>
                  <div style={fieldStyle}><span style={labelStyle}>CIN</span><span style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>{COMPANY.cin}</span></div>
                  <div style={fieldStyle}>
                    <span style={labelStyle}>Phone</span>
                    {isAdmin ? (
                      <input
                        value={orgSettings.company_phone}
                        onChange={(e) => setOrgSettings({ ...orgSettings, company_phone: e.target.value })}
                        style={{ ...valStyle, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", width: "60%" }}
                      />
                    ) : (
                      <span style={valStyle}>{orgSettings.company_phone}</span>
                    )}
                  </div>
                  <div style={{ ...fieldStyle, borderBottom: "none" }}>
                    <span style={labelStyle}>Email</span>
                    {isAdmin ? (
                      <input
                        value={orgSettings.company_email}
                        onChange={(e) => setOrgSettings({ ...orgSettings, company_email: e.target.value })}
                        style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", width: "60%" }}
                      />
                    ) : (
                      <span style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>{orgSettings.company_email}</span>
                    )}
                  </div>
                </div>

                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
                  <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2e86c1", textTransform: "uppercase", marginBottom: 8 }}>🏢 Registered Office</h4>
                  {isAdmin ? (
                    <textarea
                      value={orgSettings.company_address_line1}
                      onChange={(e) => setOrgSettings({ ...orgSettings, company_address_line1: e.target.value })}
                      style={{ width: "100%", fontSize: "0.85rem", color: "#111827", lineHeight: 1.7, marginBottom: 16, border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, resize: "vertical" }}
                    />
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "#333", lineHeight: 1.7, marginBottom: 16 }}>{orgSettings.company_address_line1}</p>
                  )}
                  
                  <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2e86c1", textTransform: "uppercase", marginBottom: 8 }}>🏭 Factory Address</h4>
                  {isAdmin ? (
                    <textarea
                      value={orgSettings.company_address_line2}
                      onChange={(e) => setOrgSettings({ ...orgSettings, company_address_line2: e.target.value })}
                      style={{ width: "100%", fontSize: "0.85rem", color: "#111827", lineHeight: 1.7, border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, resize: "vertical" }}
                    />
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "#333", lineHeight: 1.7 }}>{orgSettings.company_address_line2}</p>
                  )}
                </div>

                {isAdmin && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <button className="btn-primary" onClick={saveOrgSettings} disabled={saving}>
                      {saving ? "Saving..." : "Save Company Details"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Bank" && (
            <div className="card">
              <div className="card-header"><h3>🏦 Bank Details & UPI</h3></div>
              <div className="card-body">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                  <div style={{ flex: 1, minWidth: 300, border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827", marginBottom: 12 }}>Bank Transfer Details</h4>
                    <div style={fieldStyle}>
                      <span style={labelStyle}>Bank Name</span>
                      {isAdmin ? (
                        <input value={orgSettings.bank_name} onChange={(e) => setOrgSettings({ ...orgSettings, bank_name: e.target.value })} style={{ ...valStyle, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", width: "60%" }} />
                      ) : (
                        <span style={valStyle}>{orgSettings.bank_name}</span>
                      )}
                    </div>
                    <div style={fieldStyle}>
                      <span style={labelStyle}>Account Name</span>
                      {isAdmin ? (
                        <input value={orgSettings.bank_account_name} onChange={(e) => setOrgSettings({ ...orgSettings, bank_account_name: e.target.value })} style={{ ...valStyle, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", width: "60%" }} />
                      ) : (
                        <span style={valStyle}>{orgSettings.bank_account_name}</span>
                      )}
                    </div>
                    <div style={fieldStyle}>
                      <span style={labelStyle}>Account No.</span>
                      {isAdmin ? (
                        <input value={orgSettings.bank_account_no} onChange={(e) => setOrgSettings({ ...orgSettings, bank_account_no: e.target.value })} style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", width: "60%" }} />
                      ) : (
                        <span style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px" }}>{orgSettings.bank_account_no}</span>
                      )}
                    </div>
                    <div style={fieldStyle}>
                      <span style={labelStyle}>IFSC Code</span>
                      {isAdmin ? (
                        <input value={orgSettings.bank_ifsc} onChange={(e) => setOrgSettings({ ...orgSettings, bank_ifsc: e.target.value })} style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", width: "60%" }} />
                      ) : (
                        <span style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace" }}>{orgSettings.bank_ifsc}</span>
                      )}
                    </div>
                    <div style={fieldStyle}><span style={labelStyle}>SWIFT Code</span><span style={{ ...valStyle, fontFamily: "'JetBrains Mono', monospace" }}>{BANK.swift}</span></div>
                    <div style={{ ...fieldStyle, borderBottom: "none" }}>
                      <span style={labelStyle}>Branch</span>
                      {isAdmin ? (
                        <input value={orgSettings.bank_branch} onChange={(e) => setOrgSettings({ ...orgSettings, bank_branch: e.target.value })} style={{ ...valStyle, border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", width: "60%" }} />
                      ) : (
                        <span style={valStyle}>{orgSettings.bank_branch}</span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ width: 250, border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827", marginBottom: 12 }}>UPI Payment QR</h4>
                    <img src="/upi-qr.png" alt="UPI QR Code" style={{ width: 180, height: 180, objectFit: "contain", borderRadius: 8, border: "1px solid #cbd5e1", padding: 4, background: "#fff" }} />
                    <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 12 }}>Scan to pay directly via UPI</p>
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <button className="btn-primary" onClick={saveOrgSettings} disabled={saving}>
                      {saving ? "Saving..." : "Save Bank Details"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Invoice Defaults" && (
            <div className="card">
              <div className="card-header"><h3>📄 Invoice Defaults</h3></div>
              <div className="card-body">
                <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "16px" }}>These are the default terms applied to new invoices.</p>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
                  <div style={{ ...fieldStyle, borderBottom: "none", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ ...labelStyle, marginBottom: "4px" }}>Invoice Terms & Conditions</span>
                    {isAdmin ? (
                      <textarea
                        value={orgSettings.terms_conditions || ""}
                        onChange={(e) => setOrgSettings({ ...orgSettings, terms_conditions: e.target.value })}
                        style={{ width: "100%", fontSize: "0.85rem", color: "#111827", lineHeight: 1.7, border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, minHeight: "150px", resize: "vertical" }}
                      />
                    ) : (
                      <pre style={{ margin: 0, fontFamily: "inherit", whiteSpace: "pre-wrap", fontSize: "0.85rem", color: "#333", lineHeight: 1.7 }}>
                        {orgSettings.terms_conditions || "—"}
                      </pre>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <button className="btn-primary" onClick={saveOrgSettings} disabled={saving}>
                      {saving ? "Saving..." : "Save Invoice Defaults"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}



        </div>
      </div>

      {toast && <div className={`toast ${toast.isError ? "error" : ""}`}>{toast.msg}</div>}
    </div>
  );
};

export default Settings;
