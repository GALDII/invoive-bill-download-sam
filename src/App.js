import React, { useState, useEffect } from 'react';

// Main App Component for the Billing Application
function App() {
  // A state to ensure scripts are loaded before we use them
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // Effect to load external scripts for PDF generation in the correct order
  useEffect(() => {
    const jspdfScript = document.createElement('script');
    jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    jspdfScript.async = true;

    const autoTableScript = document.createElement('script');
    autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js';
    autoTableScript.async = true;

    // Set the state to true only after the autotable plugin has loaded
    autoTableScript.onload = () => {
        setScriptsLoaded(true);
    };

    // Load the autotable script only after the main jspdf script has finished loading
    jspdfScript.onload = () => {
        document.body.appendChild(autoTableScript);
    };

    // Start by appending the main jspdf script to the document
    document.body.appendChild(jspdfScript);

    return () => {
      // Cleanup scripts on component unmount
      if (document.body.contains(jspdfScript)) {
        document.body.removeChild(jspdfScript);
      }
      if (document.body.contains(autoTableScript)) {
        document.body.removeChild(autoTableScript);
      }
    };
  }, []);

  // State for seller and buyer details
  const [sellerDetails, setSellerDetails] = useState({
    name: 'SHRI MATHESHWARA TEX',
    address: 'SF NO 966, Pongupalayam, Tiruppur, Tamil Nadu, 641666',
    gstin: '33LVSPS3598F1ZL',
  });

  const [buyerDetails, setBuyerDetails] = useState({
    name: 'VR Traders',
    address: '3/15A Chinnya Gounden Pudhur Road, Andipalayam, Tiruppur, 641687',
    gstin: '33CDOPV9001M1ZZ',
    state: 'Tamil Nadu',
  });
  
  const [invoiceDetails, setInvoiceDetails] = useState({
    number: `INV${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
  });

  // State for the list of items in the invoice
  const [items, setItems] = useState([
    { description: '2/60 polyester yarn', hsn: '55092200', quantity: 60, rate: 230.0, gstRate: 5 },
  ]);

  // Handle changes in input fields for items
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Add a new item to the list
  const addItem = () => {
    setItems([...items, { description: '', hsn: '', quantity: 1, rate: 0, gstRate: 12 }]);
  };
  
  // Remove an item from the list
  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };
  
  // --- Calculation Logic ---
  const calculateTotals = () => {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    items.forEach(item => {
        const taxableValue = item.quantity * item.rate;
        subtotal += taxableValue;
        const gstAmount = (taxableValue * item.gstRate) / 100;
        totalCgst += gstAmount / 2;
        totalSgst += gstAmount / 2;
    });
    
    const grandTotal = subtotal + totalCgst + totalSgst;

    return {
        subtotal,
        totalCgst,
        totalSgst,
        grandTotal,
        totalTax: totalCgst + totalSgst,
    };
  };
  
  const totals = calculateTotals();

  // --- PDF Generation ---
  const generatePDF = () => {
    if (!scriptsLoaded) {
        console.error("PDF generation scripts are not loaded yet.");
        return;
    }
    // Access jsPDF from the window object
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Tax Invoice', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Seller: ${sellerDetails.name}`, 14, 30);
    doc.text(sellerDetails.address, 14, 35);
    doc.text(`GSTIN: ${sellerDetails.gstin}`, 14, 40);

    doc.text(`Buyer: ${buyerDetails.name}`, 105, 30);
    doc.text(buyerDetails.address, 105, 35);
    doc.text(`GSTIN: ${buyerDetails.gstin}`, 105, 40);
    
    doc.text(`Invoice No: ${invoiceDetails.number}`, 14, 50);
    doc.text(`Invoice Date: ${invoiceDetails.date}`, 105, 50);
    
    const tableColumn = ["#", "Item", "HSN/SAC", "Qty", "Rate", "Taxable Value", "CGST", "SGST", "Total"];
    const tableRows = [];

    items.forEach((item, index) => {
        const taxableValue = item.quantity * item.rate;
        const cgst = (taxableValue * (item.gstRate / 2)) / 100;
        const sgst = (taxableValue * (item.gstRate / 2)) / 100;
        const itemTotal = taxableValue + cgst + sgst;
        
        tableRows.push([
            index + 1,
            item.description,
            item.hsn,
            item.quantity,
            `₹${item.rate.toFixed(2)}`,
            `₹${taxableValue.toFixed(2)}`,
            `₹${cgst.toFixed(2)}`,
            `₹${sgst.toFixed(2)}`,
            `₹${itemTotal.toFixed(2)}`,
        ]);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 8 },
    });
    
    const finalY = doc.autoTable.previous.finalY;
    doc.setFontSize(10);
    doc.text(`Subtotal: ₹${totals.subtotal.toFixed(2)}`, 14, finalY + 10);
    doc.text(`CGST: ₹${totals.totalCgst.toFixed(2)}`, 14, finalY + 15);
    doc.text(`SGST: ₹${totals.totalSgst.toFixed(2)}`, 14, finalY + 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: ₹${totals.grandTotal.toFixed(2)}`, 14, finalY + 28);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms and Conditions:', 14, finalY + 40);
    doc.text('1. This is an electronically generated document.', 14, finalY + 45);
    doc.text('2. All disputes are subject to Tiruppur jurisdiction.', 14, finalY + 50);

    doc.text(`For ${sellerDetails.name}`, 150, finalY + 60, { align: 'center' });
    doc.text('Authorised Signatory', 150, finalY + 70, { align: 'center' });

    doc.save(`Invoice-${invoiceDetails.number}.pdf`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem 1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        
        {/* Header Section */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: 'white', letterSpacing: '0.5px' }}>
            📄 Tax Invoice Generator
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
             basic billing 
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Invoice Details Section */}
          <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f8f9fa', borderRadius: '12px', border: '2px solid #e9ecef' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#495057', marginBottom: '0.5rem' }}>Invoice Number</label>
                <input 
                  type="text" 
                  value={invoiceDetails.number} 
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, number: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #dee2e6', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', color: '#667eea' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#495057', marginBottom: '0.5rem' }}>Invoice Date</label>
                <input 
                  type="date" 
                  value={invoiceDetails.date} 
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, date: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #dee2e6', borderRadius: '8px', fontSize: '0.95rem' }}
                />
              </div>
            </div>
          </div>

          {/* Seller and Buyer Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* Seller Details */}
            <div style={{ background: '#fff8f0', padding: '1.5rem', borderRadius: '12px', border: '2px solid #ffedd5' }}>
              <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🏢</span> Seller Details
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#7c2d12', marginBottom: '0.4rem' }}>Business Name</label>
                  <input 
                    type="text" 
                    value={sellerDetails.name} 
                    onChange={(e) => setSellerDetails({...sellerDetails, name: e.target.value})} 
                    style={{ width: '100%', padding: '0.7rem', border: '2px solid #fed7aa', borderRadius: '8px', fontSize: '0.9rem', background: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#7c2d12', marginBottom: '0.4rem' }}>Address</label>
                  <textarea 
                    value={sellerDetails.address} 
                    onChange={(e) => setSellerDetails({...sellerDetails, address: e.target.value})} 
                    rows="2"
                    style={{ width: '100%', padding: '0.7rem', border: '2px solid #fed7aa', borderRadius: '8px', fontSize: '0.9rem', background: 'white', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#7c2d12', marginBottom: '0.4rem' }}>GSTIN</label>
                  <input 
                    type="text" 
                    value={sellerDetails.gstin} 
                    onChange={(e) => setSellerDetails({...sellerDetails, gstin: e.target.value})} 
                    style={{ width: '100%', padding: '0.7rem', border: '2px solid #fed7aa', borderRadius: '8px', fontSize: '0.9rem', background: 'white', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>

            {/* Buyer Details */}
            <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '12px', border: '2px solid #bae6fd' }}>
              <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👤</span> Buyer Details
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#075985', marginBottom: '0.4rem' }}>Business Name</label>
                  <input 
                    type="text" 
                    value={buyerDetails.name} 
                    onChange={(e) => setBuyerDetails({...buyerDetails, name: e.target.value})} 
                    style={{ width: '100%', padding: '0.7rem', border: '2px solid #7dd3fc', borderRadius: '8px', fontSize: '0.9rem', background: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#075985', marginBottom: '0.4rem' }}>Address</label>
                  <textarea 
                    value={buyerDetails.address} 
                    onChange={(e) => setBuyerDetails({...buyerDetails, address: e.target.value})} 
                    rows="2"
                    style={{ width: '100%', padding: '0.7rem', border: '2px solid #7dd3fc', borderRadius: '8px', fontSize: '0.9rem', background: 'white', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#075985', marginBottom: '0.4rem' }}>GSTIN</label>
                  <input 
                    type="text" 
                    value={buyerDetails.gstin} 
                    onChange={(e) => setBuyerDetails({...buyerDetails, gstin: e.target.value})} 
                    style={{ width: '100%', padding: '0.7rem', border: '2px solid #7dd3fc', borderRadius: '8px', fontSize: '0.9rem', background: 'white', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700', color: '#1f2937' }}>Invoice Items</h2>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'left', color: 'white', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>Item Description</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'left', color: 'white', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>HSN/SAC</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'white', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>Qty</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'right', color: 'white', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>Rate (₹)</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'white', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>GST %</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'right', color: 'white', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>Total (₹)</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'white', fontSize: '0.85rem', fontWeight: '600', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? '#fafafa' : 'white' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <input 
                          type="text" 
                          value={item.description} 
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                          placeholder="Item name"
                          style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <input 
                          type="text" 
                          value={item.hsn} 
                          onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} 
                          placeholder="HSN"
                          style={{ width: '110px', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'monospace' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} 
                          style={{ width: '80px', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <input 
                          type="number" 
                          value={item.rate} 
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)} 
                          style={{ width: '100px', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <input 
                          type="number" 
                          value={item.gstRate} 
                          onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)} 
                          style={{ width: '70px', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#059669', fontSize: '0.95rem' }}>
                        ₹{(item.quantity * item.rate * (1 + item.gstRate / 100)).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => removeItem(index)} 
                          style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              onClick={addItem} 
              style={{ marginTop: '1rem', background: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.target.style.background = '#2563eb'}
              onMouseOut={(e) => e.target.style.background = '#3b82f6'}
            >
              + Add Item
            </button>
          </div>

          {/* Totals and Action Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            {/* PDF Generation Button */}
            <div>
              <button 
                onClick={generatePDF} 
                disabled={!scriptsLoaded}
                style={{ 
                  width: '100%',
                  background: scriptsLoaded ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#9ca3af', 
                  color: 'white', 
                  border: 'none', 
                  padding: '1.25rem', 
                  borderRadius: '12px', 
                  fontSize: '1.1rem', 
                  fontWeight: '700', 
                  cursor: scriptsLoaded ? 'pointer' : 'not-allowed', 
                  boxShadow: scriptsLoaded ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {if(scriptsLoaded) e.target.style.transform = 'translateY(-2px)'}}
                onMouseOut={(e) => {if(scriptsLoaded) e.target.style.transform = 'translateY(0)'}}
              >
                {scriptsLoaded ? '📥 Generate PDF Invoice' : '⏳ Loading...'}
              </button>
            </div>

            {/* Totals Summary */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '1.5rem', borderRadius: '12px', border: '2px solid #86efac' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #bbf7d0' }}>
                  <span style={{ color: '#166534', fontWeight: '600', fontSize: '0.95rem' }}>Subtotal:</span>
                  <span style={{ color: '#166534', fontWeight: '600', fontSize: '1rem' }}>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #bbf7d0' }}>
                  <span style={{ color: '#166534', fontWeight: '600', fontSize: '0.95rem' }}>CGST:</span>
                  <span style={{ color: '#166534', fontWeight: '600', fontSize: '1rem' }}>₹{totals.totalCgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #bbf7d0' }}>
                  <span style={{ color: '#166534', fontWeight: '600', fontSize: '0.95rem' }}>SGST:</span>
                  <span style={{ color: '#166534', fontWeight: '600', fontSize: '1rem' }}>₹{totals.totalSgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', marginTop: '0.5rem' }}>
                  <span style={{ color: '#14532d', fontWeight: '700', fontSize: '1.2rem' }}>Grand Total:</span>
                  <span style={{ color: '#15803d', fontWeight: '700', fontSize: '1.5rem' }}>₹{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;