import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAuth } from "../context/AuthContext";
import "../Pages.css";
import "../Invoice.css";
import ProformaInvoiceTemplate from "./ProformaInvoiceTemplate";

// Sikko Industries default details (not editable)
const COMPANY = {
  name: "SIKKO INDUSTRIES LTD",
  address: "Reg. Office: 45, Navrangpura, Nr. Swastik Cross Road, C.G. Road, Ahmedabad - 380009\nFactory: Plot No. 78, GIDC Estate, Vatva, Ahmedabad, Gujarat - 382445",
  gst: "24AAVFS1234Q1Z2",
  phone: "+91 9737782959",
  email: "info@sikkoindustries.in",
};
const BANK = {
  name: "ICICI BANK LTD.",
  account_name: "Sikko Industries Ltd.",
  account_no: "423551000001",
  ifsc: "ICIC0004235",
  branch: "Navrangpura, Ahmedabad",
};
const DEFAULT_TERMS = `1. Once this proforma invoice is confirmed by the consignee, it cannot be changed or cancelled.
2. Payment Terms: 100% Advanced.
3. All goods sent outstation are at buyer's risk.
4. All disputes will be settled at court of law - Ahmedabad (Gujarat) jurisdiction.
5. Above quoted prices are all exfactory (Ahmedabad-Gujarat).
6. Goods sold once will not be taken back under any circumstances.
7. Material will be dispatched within 15 days after payment procedure.`;

const numToWords = (n) => {
  if (n === 0) return "Zero";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const convert = (num) => {
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num/10)] + (num%10 ? " " + a[num%10] : "");
    if (num < 1000) return a[Math.floor(num/100)] + " Hundred" + (num%100 ? " " + convert(num%100) : "");
    if (num < 100000) return convert(Math.floor(num/1000)) + " Thousand" + (num%1000 ? " " + convert(num%1000) : "");
    if (num < 10000000) return convert(Math.floor(num/100000)) + " Lakh" + (num%100000 ? " " + convert(num%100000) : "");
    return convert(Math.floor(num/10000000)) + " Crore" + (num%10000000 ? " " + convert(num%10000000) : "");
  };
  return convert(Math.round(n)) + " Rupees Only";
};

const Invoice = () => {
  const invoiceRef = useRef();
  const { user, api } = useAuth();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const [orgSettings, setOrgSettings] = useState({
    company_name: COMPANY.name,
    company_address_line1: COMPANY.address.split("\n")[0],
    company_address_line2: COMPANY.address.split("\n")[1] || "",
    company_gst: COMPANY.gst,
    company_phone: COMPANY.phone,
    company_email: COMPANY.email,
    bank_name: BANK.name,
    bank_account_name: BANK.account_name,
    bank_account_no: BANK.account_no,
    bank_ifsc: BANK.ifsc,
    bank_branch: BANK.branch,
  });

  // Load saved draft from sessionStorage
  const saved = sessionStorage.getItem("invoice_draft");
  const draft = saved ? JSON.parse(saved) : null;

  const [invInfo, setInvInfo] = useState(draft?.invInfo || { invoice_no: "", invoice_date: new Date().toISOString().split("T")[0] });
  const [client, setClient] = useState(draft?.client || { customer_id: "", name: "", address: "", gst: "" });
  const [items, setItems] = useState(draft?.items || [{ product_id: "", product_name: "", hsn_code: "", unit_price: "", unit: "Per Kg", qty: "", total: 0 }]);
  const [tax, setTax] = useState(draft?.tax || { cgst_rate: 2.5, sgst_rate: 2.5, discount_rate: 0 });

  // Auto-save draft to sessionStorage on every change
  useEffect(() => {
    sessionStorage.setItem("invoice_draft", JSON.stringify({ invInfo, client, items, tax }));
  }, [invInfo, client, items, tax]);

  useEffect(() => {
    api.get("/customers").then(r => setCustomers(r.data.customers)).catch(() => {});
    api.get("/products").then(r => setProducts(r.data.products)).catch(() => {});
  }, []);

  useEffect(() => {
    // Admin editable only: used for invoice preview + PDF.
    api
      .get("/org-settings")
      .then((r) => {
        const s = r.data?.settings;
        if (!s) return;
        setOrgSettings({
          company_name: s.company_name,
          company_address_line1: s.company_address_line1,
          company_address_line2: s.company_address_line2 || "",
          company_gst: s.company_gst,
          company_phone: s.company_phone,
          company_email: s.company_email,
          bank_name: s.bank_name,
          bank_account_name: s.bank_account_name,
          bank_account_no: s.bank_account_no,
          bank_ifsc: s.bank_ifsc,
          bank_branch: s.bank_branch,
        });
      })
      .catch(() => {});
  }, []);

  const selectCustomer = (id) => {
    if (!id) { setClient({ customer_id: "", name: "", address: "", gst: "" }); return; }
    const c = customers.find(x => x.id === parseInt(id));
    if (c) setClient({ customer_id: c.id, name: c.name, address: [c.address, c.city, c.state, c.pincode].filter(Boolean).join(", "), gst: c.gst_no || "" });
  };

  const addItem = () => setItems([...items, { product_id: "", product_name: "", hsn_code: "", unit_price: "", unit: "Per Kg", qty: "", total: 0 }]);
  const removeItem = (i) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (i, field, val) => {
    const n = [...items]; n[i] = { ...n[i], [field]: val };
    if (field === "unit_price" || field === "qty") n[i].total = parseFloat(n[i].unit_price || 0) * parseInt(n[i].qty || 0);
    setItems(n);
  };

  const selectProduct = (i, id) => {
    const n = [...items];
    if (!id) { n[i] = { ...n[i], product_id: "", product_name: "", hsn_code: "", unit_price: "", unit: "Per Kg", qty: "", total: 0 }; setItems(n); return; }
    const p = products.find(x => x.id === parseInt(id));
    if (p) {
      const qty = n[i].qty || 1;
      n[i] = { ...n[i], product_id: p.id, product_name: p.name, hsn_code: p.hsn_code || "", unit_price: parseFloat(p.unit_price), unit: p.unit, qty, total: parseFloat(p.unit_price) * qty };
      setItems(n);
    }
  };

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.total) || 0), 0);
  const cgst = subtotal * ((parseFloat(tax.cgst_rate) || 0) / 100);
  const sgst = subtotal * ((parseFloat(tax.sgst_rate) || 0) / 100);
  const discountAmt = (subtotal + cgst + sgst) * ((parseFloat(tax.discount_rate) || 0) / 100);
  const grandTotal = subtotal + cgst + sgst - discountAmt;
  // Show empty instead of 0 so user can type directly
  const displayVal = (v) => (v === "" || v === 0 || v === "0") ? "" : v;
  const fmtCur = (n) => `₹${parseFloat(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const showMsg = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };

  // Save invoice to database
  const saveInvoice = async () => {
    if (!invInfo.invoice_no) { showMsg("Invoice number required", true); return null; }
    if (!client.name) { showMsg("Client name required", true); return null; }
    if (!items[0].product_name) { showMsg("Add at least one item", true); return null; }
    setSaving(true);
    try {
      const res = await api.post("/invoices", {
        ...invInfo, customer_id: client.customer_id || null, status: "draft",
        company_name: COMPANY.name, company_address: COMPANY.address, company_gst: COMPANY.gst, company_phone: COMPANY.phone, company_email: COMPANY.email,
        bank_name: BANK.name, bank_account_name: BANK.account_name, bank_account_no: BANK.account_no, bank_ifsc: BANK.ifsc, bank_branch: BANK.branch,
        client_name: client.name, client_address: client.address, client_gst: client.gst,
        subtotal, cgst_rate: tax.cgst_rate, sgst_rate: tax.sgst_rate, cgst, sgst, discount: discountAmt, grand_total: grandTotal,
        total_in_words: numToWords(grandTotal), terms: DEFAULT_TERMS,
        items: items.map(it => ({ product_id: it.product_id || null, product_name: it.product_name, hsn_code: it.hsn_code, unit_price: it.unit_price, unit: it.unit, qty: it.qty, total: it.total })),
      });
      showMsg("Invoice saved successfully!");
      sessionStorage.removeItem("invoice_draft");
      return res.data;
    } catch (err) { showMsg(err.response?.data?.error || "Save failed", true); return null; }
    finally { setSaving(false); }
  };

  const downloadPDF = async () => {
    if (!invInfo.invoice_no || !client.name) { showMsg("Fill invoice number & client name first", true); return; }
    if (!items[0].product_name) { showMsg("Add at least one item", true); return; }

    // Auto-save to database first
    setSaving(true);
    try {
      await api.post("/invoices", {
        ...invInfo, customer_id: client.customer_id || null, status: "draft",
        company_name: COMPANY.name, company_address: COMPANY.address, company_gst: COMPANY.gst, company_phone: COMPANY.phone, company_email: COMPANY.email,
        bank_name: BANK.name, bank_account_name: BANK.account_name, bank_account_no: BANK.account_no, bank_ifsc: BANK.ifsc, bank_branch: BANK.branch,
        client_name: client.name, client_address: client.address, client_gst: client.gst,
        subtotal, cgst_rate: tax.cgst_rate, sgst_rate: tax.sgst_rate, cgst, sgst, discount: discountAmt, grand_total: grandTotal,
        total_in_words: numToWords(grandTotal), terms: DEFAULT_TERMS,
        items: items.map(it => ({ product_id: it.product_id || null, product_name: it.product_name, hsn_code: it.hsn_code, unit_price: it.unit_price, unit: it.unit, qty: it.qty, total: it.total })),
      });
      showMsg("Invoice saved to database & generating PDF...");
    } catch (err) {
      console.warn("Auto-save failed, continuing with PDF:", err);
    }
    setSaving(false);

    setShowPreview(true);
    // Wait for React to render the invoice for capture
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      if (!invoiceRef.current) {
        showMsg("PDF preview element not found — try again", true);
        setShowPreview(false);
        return;
      }

      // Ensure element is visible and has dimensions
      const rect = invoiceRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        showMsg("PDF preview not rendered properly — try again", true);
        setShowPreview(false);
        return;
      }

      let canvas;
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
      await waitForImages(invoiceRef.current);
      try {
        canvas = await html2canvas(invoiceRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#fff",
          logging: false,
          allowTaint: true,
          foreignObjectRendering: false,
          imageTimeout: 5000,
          onclone: (clonedDoc) => {
            // Fix input values not showing in PDF if they are inputs instead of text
            const inputs = clonedDoc.querySelectorAll('input');
            inputs.forEach(input => { input.setAttribute('value', input.value); });
          },
          width: 794,
          height: contentHeight,
          windowWidth: 794,
          windowHeight: contentHeight,
        });
      } catch (firstErr) {
        // If first attempt fails, retry the capture (keep watermark visible)
        console.warn("First capture attempt failed, retrying capture:", firstErr);
        showMsg("Retrying PDF...");

        await new Promise(resolve => setTimeout(resolve, 500));

        canvas = await html2canvas(invoiceRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#fff",
          logging: false,
          allowTaint: true,
          foreignObjectRendering: false,
          width: 794,
          height: contentHeight,
          windowWidth: 794,
          windowHeight: contentHeight,
        });
      }

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        showMsg("PDF capture failed — please refresh and try again", true);
        setShowPreview(false);
        return;
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const pW = pdf.internal.pageSize.getWidth();
      const pH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;

      // Force 1-page output by scaling captured invoice to fit inside A4.
      // This keeps watermark/table layout intact but may slightly reduce size.
      const scaleToFit = Math.min(pW / imgW, pH / imgH);
      let finalW = imgW * scaleToFit;
      let finalH = imgH * scaleToFit;
      // Extra guard against floating-point rounding (avoids accidental 2nd page).
      if (finalH > pH) {
        finalH = pH;
        finalW = imgW * (finalH / imgH);
      }
      const x = (pW - finalW) / 2;
      const y = 0;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.98), "JPEG", x, y, finalW, finalH);
      pdf.save(`Sikko_Industries_${invInfo.invoice_no}.pdf`);
      showMsg("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);
      showMsg("PDF failed: " + (err.message || "Unknown error"), true);
    }
    setShowPreview(false);
  };

  const inputStyle = { background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 8px", color: "#1f2937", fontSize: "0.82rem", width: "100%", fontFamily: "Inter", outline: "none" };
  const selStyle = { ...inputStyle, cursor: "pointer" };

  return (
    <div className="page">
      <div className="page-header">
        <h1>📄 <span>Create Invoice</span></h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-success" onClick={saveInvoice} disabled={saving}>{saving ? "Saving..." : "💾 Save to DB"}</button>
          <button className="btn-primary" onClick={downloadPDF}>📥 Download PDF</button>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="card"><div className="card-header"><h3>📋 Invoice Info</h3></div><div className="card-body">
        <div className="form-grid">
          <div className="form-group"><label>Invoice Number *</label><input value={invInfo.invoice_no} onChange={e => setInvInfo({...invInfo, invoice_no: e.target.value})} placeholder="e.g. PI-2026-0001" /></div>
          <div className="form-group"><label>Date</label><input type="date" value={invInfo.invoice_date} onChange={e => setInvInfo({...invInfo, invoice_date: e.target.value})} /></div>
        </div>
      </div></div>

      {/* Client / Buyer */}
      <div className="card"><div className="card-header"><h3>👤 Client / Buyer</h3>
        <select onChange={e => selectCustomer(e.target.value)} style={selStyle}>
          <option value="">-- Select Saved Customer --</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</option>)}
        </select>
      </div><div className="card-body">
        <div className="form-grid">
          <div className="form-group"><label>Client Name *</label><input value={client.name} onChange={e => setClient({...client, name: e.target.value})} placeholder="Client Name" /></div>
          <div className="form-group"><label>GST Number</label><input value={client.gst} onChange={e => setClient({...client, gst: e.target.value})} placeholder="Client GST" /></div>
          <div className="form-group full"><label>Address</label><textarea value={client.address} onChange={e => setClient({...client, address: e.target.value})} placeholder="Client Address" /></div>
        </div>
      </div></div>

      {/* Items */}
      <div className="card"><div className="card-header"><h3>📦 Items</h3><button className="btn-primary" onClick={addItem} style={{ padding: "6px 14px", fontSize: "0.8rem" }}>+ Add Item</button></div><div className="card-body" style={{ overflowX: "auto" }}>
        <table className="data-table" style={{ minWidth: 700 }}>
          <thead><tr><th>Product</th><th>HSN</th><th>Price (₹)</th><th>Unit</th><th>Qty</th><th>Total</th><th></th></tr></thead>
          <tbody>{items.map((item, i) => (
            <tr key={i}>
              <td>
                <select
                  onChange={e => selectProduct(i, e.target.value)}
                  value={item.product_id || ""}
                  style={{ ...selStyle, width: "100%", marginBottom: 4 }}
                >
                  <option value="">— Select Product —</option>
                  {["Organic Certified Agro Chemicals","Organic Agro Chemicals","Agro Chemicals","Fertilizers","Seeds","Sprayers","FMCG Products","Household Products"].map(cat => {
                    const catProducts = products.filter(p => p.category === cat);
                    return catProducts.length > 0 ? (
                      <optgroup key={cat} label={cat}>
                        {catProducts.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.unit_price}/{p.unit?.replace("Per ","")}</option>)}
                      </optgroup>
                    ) : null;
                  })}
                  {products.filter(p => !p.category).length > 0 && (
                    <optgroup label="Other">
                      {products.filter(p => !p.category).map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.unit_price}</option>)}
                    </optgroup>
                  )}
                </select>
                <input value={item.product_name} onChange={e => updateItem(i, "product_name", e.target.value)} placeholder="Product name" style={inputStyle} />
              </td>
              <td><input value={item.hsn_code} onChange={e => updateItem(i, "hsn_code", e.target.value)} style={{...inputStyle, width: 70}} /></td>
              <td><input type="number" value={displayVal(item.unit_price)} placeholder="0" onChange={e => updateItem(i, "unit_price", e.target.value === "" ? "" : parseFloat(e.target.value))} style={{...inputStyle, width: 100}} /></td>
              <td><select value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} style={{...selStyle, width: 100}}>
                <option value="Per Kg">Per Kg</option><option value="Per Unit">Per Unit</option><option value="Per Piece">Per Piece</option><option value="Per Litre">Per Litre</option><option value="Per Box">Per Box</option><option value="Per Ton">Per Ton</option><option value="Per Meter">Per Meter</option><option value="Per Bag">Per Bag</option><option value="Per Roll">Per Roll</option><option value="Per Set">Per Set</option><option value="Per Dozen">Per Dozen</option>
              </select></td>
              <td><input type="number" value={displayVal(item.qty)} placeholder="0" onChange={e => updateItem(i, "qty", e.target.value === "" ? "" : parseInt(e.target.value))} style={{...inputStyle, width: 60}} /></td>
              <td className="cell-mono">{fmtCur(item.total)}</td>
              <td><button className="btn-danger" onClick={() => removeItem(i)} style={{ padding: "4px 8px" }}>✕</button></td>
            </tr>
          ))}</tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 4px" }}>
          <button className="btn-primary" onClick={addItem} style={{ padding: "10px 28px", fontSize: "0.85rem", borderRadius: 10 }}>+ Add Item</button>
        </div>
      </div></div>

      {/* Tax & Totals */}
      <div className="card"><div className="card-header"><h3>💰 Tax & Totals</h3></div><div className="card-body">
        <div className="form-grid">
          <div className="form-group"><label>CGST Rate (%)</label><input type="number" step="0.01" value={displayVal(tax.cgst_rate)} placeholder="0" onChange={e => setTax({...tax, cgst_rate: e.target.value === "" ? "" : parseFloat(e.target.value)})} /></div>
          <div className="form-group"><label>SGST Rate (%)</label><input type="number" step="0.01" value={displayVal(tax.sgst_rate)} placeholder="0" onChange={e => setTax({...tax, sgst_rate: e.target.value === "" ? "" : parseFloat(e.target.value)})} /></div>
          <div className="form-group full"><label>Discount (%)</label><input type="number" step="0.01" value={displayVal(tax.discount_rate)} placeholder="e.g. 5" onChange={e => setTax({...tax, discount_rate: e.target.value === "" ? "" : parseFloat(e.target.value)})} /></div>
        </div>
        <div style={{ marginTop: 16, padding: 16, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#6b7280", fontSize: "0.85rem" }}><span>Subtotal</span><span className="cell-mono">{fmtCur(subtotal)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#6b7280", fontSize: "0.85rem" }}><span>CGST ({tax.cgst_rate}%)</span><span className="cell-mono">{fmtCur(cgst)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#6b7280", fontSize: "0.85rem" }}><span>SGST ({tax.sgst_rate}%)</span><span className="cell-mono">{fmtCur(sgst)}</span></div>
          {discountAmt > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#dc2626", fontSize: "0.85rem" }}><span>Discount ({tax.discount_rate}%)</span><span>-{fmtCur(discountAmt)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #e5e7eb", fontSize: "1.1rem", fontWeight: 800 }}><span>Grand Total</span><span style={{ color: "#059669" }}>{fmtCur(grandTotal)}</span></div>
          <p style={{ marginTop: 8, fontSize: "0.78rem", color: "#4338ca", fontStyle: "italic" }}>{numToWords(grandTotal)}</p>
        </div>
      </div></div>

      {/* PDF Preview - rendered on-screen but hidden by opacity for proper html2canvas capture */}
      {showPreview && <div className="pdf-capture-overlay" style={{ position: "absolute", top: 0, left: 0, opacity: 0.01, pointerEvents: "none", zIndex: -999 }}>
        <div ref={invoiceRef} style={{ width: 794, overflow: "visible" }}>
          <ProformaInvoiceTemplate
            invoiceNo={invInfo.invoice_no}
            invoiceDate={invInfo.invoice_date}
            statusLabel="DRAFT"
            client={{ name: client.name, address: client.address, gst: client.gst }}
            items={items.filter((it) => it.product_name)}
            rates={{ cgst_rate: tax.cgst_rate, sgst_rate: tax.sgst_rate }}
            totals={{ subtotal, cgst, sgst, discount: discountAmt, grand_total: grandTotal }}
            totalInWords={numToWords(grandTotal)}
            preparedBy={{ name: user?.name, phone: user?.phone, email: user?.email, employee_id: user?.employee_id }}
            org={{
              company_name: orgSettings.company_name,
              company_address_line1: orgSettings.company_address_line1,
              company_address_line2: orgSettings.company_address_line2,
            }}
            bank={{
              bank_name: orgSettings.bank_name,
              bank_account_name: orgSettings.bank_account_name,
              bank_account_no: orgSettings.bank_account_no,
              bank_ifsc: orgSettings.bank_ifsc,
              bank_branch: orgSettings.bank_branch,
            }}
            transporter=""
            deliveryLocation=""
          />
        </div>
      </div>}

      {toast && <div className={`toast ${toast.err ? "error" : ""}`}>{toast.msg}</div>}
    </div>
  );
};

export default Invoice;