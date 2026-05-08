import React from "react";
import "./ProformaInvoiceTemplate.css";

function fmtINR(n) {
  return parseFloat(n || 0).toFixed(2);
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, '.');
}

export default function ProformaInvoiceTemplate({
  invoiceNo,
  invoiceDate,
  client,
  items,
  rates,
  totals,
  totalInWords,
  org,
  bank,
  preparedBy,
  terms,
  transporter = "",
  deliveryLocation = "",
}) {
  const cgstRate = parseFloat(rates?.cgst_rate || 0) || 0;
  const sgstRate = parseFloat(rates?.sgst_rate || 0) || 0;
  const igstRate = 0;

  const subtotal = parseFloat(totals?.subtotal || 0) || 0;
  const cgstTotal = parseFloat(totals?.cgst || 0) || 0;
  const sgstTotal = parseFloat(totals?.sgst || 0) || 0;
  const discountTotal = parseFloat(totals?.discount || 0) || 0;
  const grandTotal = parseFloat(totals?.grand_total || 0) || 0;

  const safeSubtotal = subtotal > 0 ? subtotal : 1;
  const qtyInWords = (totalInWords || "—").toUpperCase();

  return (
    <div className="pi-paper">
      <div className="pi-watermark">
        <img src="/Sikko.jpeg" alt="" crossOrigin="anonymous" />
      </div>

      <div className="pi-content">
        <div className="pi-header-main">PROFORMA INVOICE</div>
        
        <div className="pi-top-row">
          <div className="pi-logo-col">
            <img src="/Sikko.jpeg" alt="Logo" crossOrigin="anonymous" />
          </div>
          <div className="pi-title-col">
            <h1 className="pi-company-name">{org?.company_name || "Sikko Industries Ltd"}</h1>
            <p className="pi-blue-text">Reg. Office:</p>
            <p>{(org?.company_address_line1 || org?.company_address || "Bargarh").split(',')[0]}</p>
          </div>
          <div className="pi-info-col">
            <table className="pi-info-table">
              <tbody>
                <tr>
                  <td className="pi-blue-text">PI Number:</td>
                  <td className="bold">{invoiceNo}</td>
                </tr>
                <tr>
                  <td className="pi-blue-text">PI Date:</td>
                  <td className="bold">{fmtDate(invoiceDate)}</td>
                </tr>
                <tr>
                  <td className="pi-blue-text">Consignor's<br/>GST No:</td>
                  <td className="bold">GSTIN: {org?.company_gst || "24AAVFS1234Q1Z2"}</td>
                </tr>
                <tr>
                  <td className="pi-blue-text">Consignor's<br/>Concerned<br/>Person:</td>
                  <td className="bold">{preparedBy?.name || "—"}</td>
                </tr>
                <tr>
                  <td className="pi-blue-text" style={{ borderBottom: 'none' }}>Contact No:</td>
                  <td className="bold" style={{ borderBottom: 'none' }}>{org?.company_phone || "+91 9337027856"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="pi-middle-header">
          <div className="pi-half-col">Bill To & Ship To Address</div>
          <div className="pi-half-col" style={{ borderRight: 'none' }}>Bank Details</div>
        </div>

        <div className="pi-middle-row">
          <div className="pi-bill-col">
            <table className="pi-bill-table">
              <tbody>
                <tr><td colSpan="2">Consignee: {client?.name || "—"}</td></tr>
                <tr><td colSpan="2">Address: {client?.address || "—"}</td></tr>
                <tr><td colSpan="2">GST No. {client?.gst || "—"}</td></tr>
                <tr>
                  <td style={{ width: '50%', borderRight: '1px solid #000' }}>Concerned Person: {preparedBy?.name || "—"}</td>
                  <td style={{ width: '50%' }}>Transporter Name: {transporter || ""}</td>
                </tr>
                <tr><td colSpan="2">Contact No: {preparedBy?.phone || "—"}</td></tr>
                <tr><td colSpan="2" style={{ borderBottom: 'none' }}>Delivery Location: {deliveryLocation || client?.city || "—"}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="pi-bank-col">
            <div className="pi-bank-details">
              <div className="text-center" style={{ marginBottom: 4 }}>A/C Details</div>
              <div>Bank Name: <span className="pi-red-text">{bank?.bank_name || "—"}</span></div>
              <div>A/C Name: <span className="pi-red-text">{bank?.bank_account_name || "—"}</span></div>
              <div>A/C. No. <span className="pi-red-text">{bank?.bank_account_no || "—"}</span></div>
              <div>IFSC Code - <span className="pi-red-text">{bank?.bank_ifsc || "—"}</span></div>
              <div>Branch - <span className="pi-red-text">{bank?.bank_branch || "—"}</span></div>
            </div>
            <div className="pi-qr-box">
              <span style={{ display: 'block', lineHeight: 1.2 }}>Scan QR Code for UPI Transaction</span>
              <img src="/upi-qr.png" alt="UPI QR" crossOrigin="anonymous" style={{ marginTop: '2px' }} />
            </div>
          </div>
        </div>

        <table className="pi-items-table">
          <thead>
            <tr>
              <th style={{ width: '4%' }}>Sl.<br/>No.</th>
              <th style={{ width: '20%' }}>Product Name</th>
              <th style={{ width: '7%' }}>HSN<br/>Code</th>
              <th style={{ width: '7%' }}>Packing<br/>Size</th>
              <th style={{ width: '6%' }}>Qt. C/S</th>
              <th style={{ width: '8%' }}>Quantity in<br/>Unit</th>
              <th style={{ width: '8%' }}>Price Per<br/>Unit</th>
              <th style={{ width: '10%' }}>Taxable<br/>Value</th>
              <th style={{ width: '6%' }}>CGST<br/>%</th>
              <th style={{ width: '6%' }}>SGST<br/>%</th>
              <th style={{ width: '5%' }}>IGST<br/>%</th>
              <th style={{ width: '7%' }}>GST Amt.</th>
              <th style={{ width: '10%', borderRight: 'none' }}>Total amt. with<br/>GST</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((it, idx) => {
              const taxable = parseFloat(it.total || 0) || 0;
              const share = taxable / safeSubtotal;
              const cgstItem = cgstTotal * share;
              const sgstItem = sgstTotal * share;
              const discountItem = discountTotal * share;
              const gstAmt = cgstItem + sgstItem;
              const totalWithGst = taxable + gstAmt - discountItem;
              return (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td><b>{it.product_name || "—"}</b></td>
                  <td>{it.hsn_code || "—"}</td>
                  <td>{it.unit || "—"}</td>
                  <td></td>
                  <td>{it.qty || 0}</td>
                  <td>{fmtINR(it.unit_price || 0)}</td>
                  <td>{fmtINR(taxable)}</td>
                  <td>{cgstRate.toFixed(2)}%</td>
                  <td>{sgstRate.toFixed(2)}%</td>
                  <td>{igstRate.toFixed(2)}%</td>
                  <td>{fmtINR(gstAmt)}</td>
                  <td style={{ borderRight: 'none' }}>{fmtINR(totalWithGst)}</td>
                </tr>
              );
            })}
            <tr className="pi-total-row">
              <td colSpan="7">Total</td>
              <td>{fmtINR(subtotal)}</td>
              <td></td>
              <td></td>
              <td></td>
              <td>{fmtINR(cgstTotal + sgstTotal)}</td>
              <td style={{ borderRight: 'none' }}></td>
            </tr>
          </tbody>
        </table>

        <div className="pi-bottom-section">
          <div className="pi-bottom-left">
            <div className="pi-word-row">
              <div className="pi-word-label">Amt. in<br/>Word</div>
              <div className="pi-word-value">{qtyInWords}</div>
            </div>
            <div className="pi-terms">
              <div className="pi-terms-title">TERMS & CONDITIONS:</div>
              {terms ? (
                terms.split('\n').map((term, i) => (
                  <div key={i}>{term}</div>
                ))
              ) : org?.terms_conditions ? (
                org.terms_conditions.split('\n').map((term, i) => (
                  <div key={i}>{term}</div>
                ))
              ) : (
                <>
                  1. Once this proforma invoice is confirmed by the consignee, it cannot be changed or cancelled.<br/>
                  2. Payment Terms: 100% Advanced.<br/>
                  3. All goods sent outstation are at buyer's risk.<br/>
                  4. All disputes will be settled at court of law - Ahmedabad (Gujarat) jurisdiction.<br/>
                  5. Above quoted prices are all exfactory (Ahmedabad-Gujarat).<br/>
                  6. Goods sold once will not be taken back under any circumstances.<br/>
                  7. Material will be dispatched within 15 days after payment procedure.
                </>
              )}
            </div>
          </div>
          <div className="pi-bottom-right">
            <table className="pi-totals-table">
              <tbody>
                <tr>
                  <td className="pi-total-label" style={{ color: '#000' }}>Total Amt.</td>
                  <td className="pi-total-val">{fmtINR(grandTotal)}</td>
                </tr>
                <tr>
                  <td className="pi-total-label">Freight Charges</td>
                  <td className="pi-total-val">0.00</td>
                </tr>
                <tr>
                  <td className="pi-total-label">Round Off.</td>
                  <td className="pi-total-val">0.00</td>
                </tr>
                <tr>
                  <td className="pi-total-label">Previous Cr. Amt. (If Any)</td>
                  <td className="pi-total-val"></td>
                </tr>
                <tr className="pi-final-amt-row">
                  <td className="pi-total-label" style={{ borderBottom: 'none' }}>Final Amt.</td>
                  <td className="pi-total-val" style={{ borderBottom: 'none' }}>{fmtINR(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
            
            <div className="pi-signatures">
              <div style={{ marginTop: '8px' }}>For Sikko Industries Ltd</div>
              <div style={{ marginTop: '35px' }}>
                Trade Executive<br/>
                ({preparedBy?.name || "—"})<br/>
                <span style={{ fontSize: '9px', fontWeight: 'bold' }}>
                  {preparedBy?.employee_id ? `ID: ${preparedBy.employee_id}` : ""}<br/>
                  {preparedBy?.email ? `${preparedBy.email}` : ""}
                </span>
              </div>
            </div>
            
            <div className="pi-consignee-sign">
              Proforma Confirmed & Accepted by Consignee<br/>
              (Sign & Stamp)<br/><br/>
              {client?.name || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
