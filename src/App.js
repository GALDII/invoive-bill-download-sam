import React, { useState, useEffect } from 'react';

// Main App Component for the Billing Application
function App() {
  // A state to ensure scripts are loaded before we use them
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // --- Placeholders ---
  const sellerPlaceholders = {
    name: 'VR Traders',
    address: '3/15A Chinnya Gounden Pudhur Road Andipalayam Tiruppur, Tiruppur, Tamil Nadu, 641687',
    gstin: '33CDOPV9001M1ZZ',
    state: 'Tamil Nadu',
    stateCode: '33',
  };

  const buyerPlaceholders = {
    name: 'SHRI MATHESHWARA TEX',
    address: 'SF NO 966 DO NO 1/105M/12 Unnamed Road Pongupalayam, Tiruppur, Tamil Nadu, 641666',
    gstin: '33LVSPS3598F1ZL',
    state: 'Tamil Nadu',
    stateCode: '33',
  };
  
  const invoicePlaceholders = {
    number: 'INV185',
  };

  // --- Main State ---
  const [sellerDetails, setSellerDetails] = useState({
    name: '', address: '', gstin: '',
    state: sellerPlaceholders.state,
    stateCode: sellerPlaceholders.stateCode,
  });

  const [buyerDetails, setBuyerDetails] = useState({
    name: '', address: '', gstin: '',
    state: buyerPlaceholders.state,
    stateCode: buyerPlaceholders.stateCode,
  });
  
  const [invoiceDetails, setInvoiceDetails] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0], // Auto-detects today's date
    reverseCharge: 'NO',
  });

  const [items, setItems] = useState([
    { description: '2/60polyester yarn', hsn: '55092200', quantity: 60, unit: '1', rate: 230.0, gstRate: 5 },
  ]);

  // --- NEW Customer Management State ---
  const [savedCustomers, setSavedCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isBuyerEditable, setIsBuyerEditable] = useState(true);


  // --- Effects ---

  // Effect to load scripts
  useEffect(() => {
    const jspdfScript = document.createElement('script');
    jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    jspdfScript.async = true;

    const autoTableScript = document.createElement('script');
    autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js';
    autoTableScript.async = true;

    autoTableScript.onload = () => setScriptsLoaded(true);
    jspdfScript.onload = () => document.body.appendChild(autoTableScript);
    document.body.appendChild(jspdfScript);

    return () => {
      if (document.body.contains(jspdfScript)) document.body.removeChild(jspdfScript);
      if (document.body.contains(autoTableScript)) document.body.removeChild(autoTableScript);
    };
  }, []);

  // NEW Effect to load customers from local storage on mount
  useEffect(() => {
    const customersFromStorage = localStorage.getItem('savedCustomers');
    if (customersFromStorage) {
      setSavedCustomers(JSON.parse(customersFromStorage));
    }
  }, []);


  // --- Item Handlers (Unchanged) ---
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const numericFields = ['quantity', 'rate', 'gstRate'];
    if (numericFields.includes(field)) {
      newItems[index][field] = parseFloat(value) || 0;
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', hsn: '', quantity: 1, unit: '1', rate: 0, gstRate: 5 }]);
  };
  
  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };
  
  // --- Calculation Logic (Unchanged) ---
  const calculateTotals = () => {
    let subtotal = 0, totalCgst = 0, totalSgst = 0;
    items.forEach(item => {
        const taxableValue = item.quantity * item.rate;
        subtotal += taxableValue;
        const gstAmount = (taxableValue * item.gstRate) / 100;
        totalCgst += gstAmount / 2;
        totalSgst += gstAmount / 2;
    });
    const grandTotal = subtotal + totalCgst + totalSgst;
    return { subtotal, totalCgst, totalSgst, grandTotal, totalTax: totalCgst + totalSgst };
  };
  
  const totals = calculateTotals();

  // --- NEW Customer Management Handlers ---

  /** Resets the buyer form to be empty and editable */
  const clearBuyerFields = () => {
    setBuyerDetails({
      name: '', address: '', gstin: '',
      state: buyerPlaceholders.state,
      stateCode: buyerPlaceholders.stateCode,
    });
    setIsBuyerEditable(true);
  };

  /** Handles selecting a customer from the dropdown */
  const handleCustomerSelect = (e) => {
    const customerName = e.target.value;
    setSelectedCustomer(customerName);

    if (customerName === "") {
      // "Select Existing Customer" was chosen
      clearBuyerFields();
    } else {
      // Find the customer and fill details
      const customer = savedCustomers.find(c => c.name === customerName);
      if (customer) {
        setBuyerDetails({
          ...customer,
          state: buyerPlaceholders.state, // Ensure these are not lost
          stateCode: buyerPlaceholders.stateCode,
        });
        setIsBuyerEditable(false); // Make fields read-only
      }
    }
  };

  /** Handles clicking the "Add New Customer" button */
  const handleAddNewCustomer = () => {
    setSelectedCustomer(''); // Reset dropdown
    clearBuyerFields(); // Clear fields and make editable
  };

  /** Handles saving the current buyer details to local storage */
  const handleSaveCustomer = () => {
    const { name, address, gstin } = buyerDetails;

    // Validation
    if (name.trim() === '') {
      alert('Customer Name cannot be empty.');
      return;
    }

    if (savedCustomers.find(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      alert('A customer with this name already exists.');
      return;
    }

    // Create new customer object (without state/stateCode)
    const newCustomer = { name: name.trim(), address: address.trim(), gstin: gstin.trim() };
    const updatedCustomers = [...savedCustomers, newCustomer];

    // Update state and local storage
    setSavedCustomers(updatedCustomers);
    localStorage.setItem('savedCustomers', JSON.stringify(updatedCustomers));

    // Post-save actions
    setSelectedCustomer(newCustomer.name); // Auto-select new customer
    setIsBuyerEditable(false); // Make fields read-only
    alert('Customer saved successfully!');
  };


  // --- PDF Generation (Unchanged) ---
  const generatePDF = () => {
    if (!scriptsLoaded) {
      console.error("PDF generation scripts are not loaded yet.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4'); 
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const center = pageWidth / 2;

    const pdfSeller = {
      name: sellerDetails.name || sellerPlaceholders.name,
      address: sellerDetails.address || sellerPlaceholders.address,
      gstin: sellerDetails.gstin || sellerPlaceholders.gstin,
      state: sellerDetails.state,
      stateCode: sellerDetails.stateCode
    };

    const pdfBuyer = {
      name: buyerDetails.name || buyerPlaceholders.name,
      address: buyerDetails.address || buyerPlaceholders.address,
      gstin: buyerDetails.gstin || buyerPlaceholders.gstin,
      state: buyerDetails.state,
      stateCode: buyerDetails.stateCode
    };

    const pdfInvoice = {
      number: invoiceDetails.number || invoicePlaceholders.number,
      date: invoiceDetails.date,
      reverseCharge: invoiceDetails.reverseCharge
    };
    
    // 1. Top Header Bar
    doc.setFillColor(248, 249, 250); 
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(108, 117, 125);
    doc.text('A Thank-you for doing business with us', center, 5, { align: 'center' });

    // 2. Company Information (Seller)
    doc.setTextColor(0, 0, 0); 
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(pdfSeller.name, center, margin + 4, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfSeller.address, center, margin + 9, { align: 'center' });
    
    const gstinText = `GSTIN : ${pdfSeller.gstin}`;
    const gstinTextWidth = doc.getTextWidth(gstinText);
    const stateCodeText = `State Code : ${pdfSeller.stateCode}`;
    const stateCodeTextWidth = doc.getTextWidth(stateCodeText);
    const totalWidth = gstinTextWidth + stateCodeTextWidth + 10; 
    const gstinX = center - (totalWidth / 2);
    
    doc.text(gstinText, gstinX, margin + 14);
    
    const stateCodeX = gstinX + gstinTextWidth + 5;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);
    doc.rect(stateCodeX, margin + 11, stateCodeTextWidth + 4, 5);
    doc.text(stateCodeText, stateCodeX + 2, margin + 14);
    
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 18, pageWidth - margin, margin + 18);
    
    // 3. Main Title ("TAX INVOICE")
    doc.setFillColor(232, 241, 252); 
    doc.rect(margin, margin + 21, pageWidth - (margin * 2), 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TAX INVOICE', center, margin + 27.5, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Original For Recipient', pageWidth - margin - 2, margin + 27.5, { align: 'right' });
    
    let y = margin + 38; 
    
    // 4. Invoice & Billing Details
    doc.setFontSize(9);
    const col1 = margin;
    const col2 = pageWidth / 2 + 5;
    const keyX = col2;
    const valueX = col2 + 35;
    
    // 4a. Left Column (Receiver / Billed To)
    doc.setFont('helvetica', 'bold');
    doc.text('Details of Receiver | Billed to', col1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfBuyer.name, col1, y + 5);
    const buyerAddress = doc.splitTextToSize(pdfBuyer.address, (pageWidth / 2) - 30);
    doc.text(buyerAddress, col1, y + 10);
    let leftY = y + 10 + (buyerAddress.length * 4);
    doc.text(`GSTIN: ${pdfBuyer.gstin}`, col1, leftY + 5);
    doc.text(`State: ${pdfBuyer.state}`, col1, leftY + 10);
    const buyerStateText = `State Code : ${pdfBuyer.stateCode}`;
    const buyerStateX = col1 + doc.getTextWidth(`State: ${pdfBuyer.state}  `);
    doc.rect(buyerStateX, leftY + 7, doc.getTextWidth(buyerStateText) + 4, 5);
    doc.text(buyerStateText, buyerStateX + 2, leftY + 10);

    // 4b. Top Right (Invoice Info)
    doc.setFont('helvetica', 'bold'); doc.text('Invoice Number', keyX, y); 
    doc.setFont('helvetica', 'normal'); doc.text(pdfInvoice.number, valueX, y);
    
    doc.setFont('helvetica', 'bold'); doc.text('Invoice Date', keyX, y + 5); 
    doc.setFont('helvetica', 'normal'); doc.text(pdfInvoice.date, valueX, y + 5);
    
    doc.setFont('helvetica', 'bold'); doc.text('State', keyX, y + 10); 
    doc.setFont('helvetica', 'normal'); doc.text(pdfSeller.state, valueX, y + 10);
    
    doc.setFont('helvetica', 'bold'); doc.text('Reverse Charge', keyX, y + 15); 
    doc.setFont('helvetica', 'normal'); doc.text(pdfInvoice.reverseCharge, valueX, y + 15);
    
    // 4c. Right Column (Consignee / Shipped To)
    let y2 = y + 25; 
    doc.setFont('helvetica', 'bold');
    doc.text('Details of Consignee | Shipped to', keyX, y2);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfBuyer.name, keyX, y2 + 5);
    const consigneeAddress = doc.splitTextToSize(pdfBuyer.address, (pageWidth / 2) - 30);
    doc.text(consigneeAddress, keyX, y2 + 10);
    let rightY = y2 + 10 + (consigneeAddress.length * 4);
    doc.text(`GSTIN: ${pdfBuyer.gstin}`, keyX, rightY + 5);
    doc.text(`State: ${pdfBuyer.state}`, keyX, rightY + 10);
    const conStateText = `State Code : ${pdfBuyer.stateCode}`;
    const conStateX = keyX + doc.getTextWidth(`State: ${pdfBuyer.state}  `);
    doc.rect(conStateX, rightY + 7, doc.getTextWidth(conStateText) + 4, 5);
    doc.text(conStateText, conStateX + 2, rightY + 10);

    // 5. Product Details Table
    const tableStartY = Math.max(leftY, rightY) + 15;
    const tableHead = [
        [
            { content: 'Sr. No.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Name of Product', rowSpan: 2, styles: { valign: 'middle' } },
            { content: 'HSN/SAC', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'QTY', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Unit', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Rate', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
            { content: 'Taxable Value', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
            { content: 'CGST', colSpan: 2, styles: { halign: 'center' } },
            { content: 'SGST', colSpan: 2, styles: { halign: 'center' } },
            { content: 'Total', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
        ],
        [
            { content: 'Rate', styles: { halign: 'right' } }, { content: 'Amount', styles: { halign: 'right' } },
            { content: 'Rate', styles: { halign: 'right' } }, { content: 'Amount', styles: { halign: 'right' } },
        ]
    ];
    
    const tableBody = [];
    items.forEach((item, index) => {
        const taxableValue = item.quantity * item.rate;
        const cgstRate = item.gstRate / 2;
        const sgstRate = item.gstRate / 2;
        const cgstAmount = (taxableValue * cgstRate) / 100;
        const sgstAmount = (taxableValue * sgstRate) / 100;
        const itemTotal = taxableValue + cgstAmount + sgstAmount;
        
        tableBody.push([
            index + 1, item.description, item.hsn, item.quantity, item.unit,
            `₹ ${item.rate.toFixed(2)}`, `₹ ${taxableValue.toFixed(2)}`,
            `${cgstRate.toFixed(2)}%`, `₹ ${cgstAmount.toFixed(2)}`,
            `${sgstRate.toFixed(2)}%`, `₹ ${sgstAmount.toFixed(2)}`,
            `₹ ${itemTotal.toFixed(2)}`,
        ]);
    });
    
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    tableBody.push([
        { content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: totalQty, styles: { fontStyle: 'bold', halign: 'center' } }, '', '', 
        { content: `₹ ${totals.subtotal.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } }, '', 
        { content: `₹ ${totals.totalCgst.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } }, '', 
        { content: `₹ ${totals.totalSgst.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: `₹ ${totals.grandTotal.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } }
    ]);
    
    doc.autoTable({
        head: tableHead, body: tableBody, startY: tableStartY, theme: 'grid',
        headStyles: { fillColor: [232, 241, 252], textColor: 0, fontSize: 8, lineWidth: 0.1, lineColor: [150, 150, 150] },
        styles: { fontSize: 8, lineWidth: 0.1, lineColor: [150, 150, 150], cellPadding: 1.5 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 }, 1: { cellWidth: 35 }, 2: { halign: 'center' },
            3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'right' },
            6: { halign: 'right' }, 7: { halign: 'right', cellWidth: 12 }, 8: { halign: 'right' },
            9: { halign: 'right', cellWidth: 12 }, 10: { halign: 'right' }, 11: { halign: 'right' },
        },
        didDrawCell: (data) => {
            if (data.row.index === tableBody.length - 1) {
                data.cell.styles.fillColor = '#f8f9fa';
                data.cell.styles.lineWidth = 0.1;
            }
        }
    });
    
    // 6. Final Amounts & Footer
    let finalY = doc.autoTable.previous.finalY;
    let newY = finalY + 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Invoice Amount in words', margin, newY);
    doc.setFont('helvetica', 'normal');
    doc.text('Fourteen Thousand Four Hundred Ninety Rupees Only /-', margin, newY + 5);
    
    const summaryTableWidth = (pageWidth / 2) - margin - 10;
    doc.autoTable({
        body: [
            ['Total Amount Before Tax', `₹ ${totals.subtotal.toFixed(2)}`],
            ['Add : CGST', `₹ ${totals.totalCgst.toFixed(2)}`],
            ['Add : SGST', `₹ ${totals.totalSgst.toFixed(2)}`],
            [{ content: 'Total Tax Amount', styles: { fontStyle: 'bold', fillColor: [248, 249, 250] } }, { content: `₹ ${totals.totalTax.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [248, 249, 250] } }],
            [{ content: 'Final Invoice Amount', styles: { fontStyle: 'bold', fillColor: [248, 249, 250] } }, { content: `₹ ${totals.grandTotal.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [248, 249, 250] } }],
            ['Balance Due', `₹ ${totals.grandTotal.toFixed(2)}`]
        ],
        startY: newY - 2, tableWidth: summaryTableWidth, startX: pageWidth / 2 + 10, theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, lineWidth: 0.1, lineColor: [150, 150, 150] },
        columnStyles: { 0: { halign: 'left', cellWidth: summaryTableWidth * 0.6 }, 1: { halign: 'right', cellWidth: summaryTableWidth * 0.4 } },
        didDrawCell: (data) => {
            data.cell.styles.lineWidth = 0;
            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.1);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
    });
    
    // 7. Terms & Signature
    let summaryTableY = doc.autoTable.previous.finalY;
    let bottomY = Math.max(newY + 15, summaryTableY) + 10;
    
    if (bottomY > pageHeight - 30) {
        doc.addPage();
        bottomY = margin;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms And Conditions', margin, bottomY);
    doc.setFont('helvetica', 'normal');
    doc.text('1. This is an electronically generated document.', margin, bottomY + 4);
    doc.text('2. All disputes are subject to Tiruppur jurisdiction.', margin, bottomY + 8);

    doc.setFont('helvetica', 'normal');
    doc.text('Certified that the particular given above are true and correct for,', pageWidth - margin, bottomY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`For, ${pdfSeller.name}`, pageWidth - margin, bottomY + 6, { align: 'right' });
    doc.text('Authorised Signatory', pageWidth - margin, bottomY + 20, { align: 'right' });

    // 8. Bottom Footer Bar
    doc.setFillColor(248, 249, 250); 
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(108, 117, 125);
    doc.text('Thankyou for your business.', center, pageHeight - 4, { align: 'center' });

    // 9. Save PDF
    doc.save(`Invoice-${pdfInvoice.number}.pdf`);
  };

  // --- JSX (HTML Structure) ---
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
                  placeholder={invoicePlaceholders.number} 
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

          {/* --- NEW CUSTOMER MANAGEMENT SECTION --- */}
          <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f8f9fa', borderRadius: '12px', border: '2px solid #e9ecef' }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700', color: '#1f2937' }}>Customer Management</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <select 
                value={selectedCustomer}
                onChange={handleCustomerSelect}
                style={{ flexGrow: 1, padding: '0.75rem', border: '2px solid #dee2e6', borderRadius: '8px', fontSize: '0.95rem' }}
              >
                <option value="">--- Select Existing Customer ---</option>
                {savedCustomers.map((cust, index) => (
                  <option key={index} value={cust.name}>{cust.name}</option>
                ))}
              </select>
              <button 
                onClick={handleAddNewCustomer}
                style={{ background: '#5a67d8', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}
              >
                + Add New Customer
              </button>
            </div>
          </div>
          {/* --- END OF NEW SECTION --- */}


          {/* Seller and Buyer Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* Seller Details (VR Traders) */}
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
                    placeholder={sellerPlaceholders.name}
                    onChange={(e) => setSellerDetails({...sellerDetails, name: e.target.value})} 
                    style={{ width: '100%', padding: '0.7rem', border: '2px solid #fed7aa', borderRadius: '8px', fontSize: '0.9rem', background: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#7c2d12', marginBottom: '0.4rem' }}>Address</label>
                  <textarea 
                    value={sellerDetails.address}
                    placeholder={sellerPlaceholders.address}
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
                    placeholder={sellerPlaceholders.gstin}
                    onChange={(e) => setSellerDetails({...sellerDetails, gstin: e.target.value})} 
                    style={{ width: '100%', padding: '0.7rem', border: '2px solid #fed7aa', borderRadius: '8px', fontSize: '0.9rem', background: 'white', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>

            {/* Buyer Details (Updated with readOnly and Save Button) */}
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
                    placeholder={buyerPlaceholders.name} 
                    readOnly={!isBuyerEditable}
                    onChange={(e) => setBuyerDetails({...buyerDetails, name: e.target.value})} 
                    style={{ 
                      width: '100%', padding: '0.7rem', border: '2px solid #7dd3fc', borderRadius: '8px', fontSize: '0.9rem', 
                      background: isBuyerEditable ? 'white' : '#e9ecef', 
                      cursor: isBuyerEditable ? 'auto' : 'not-allowed' 
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#075985', marginBottom: '0.4rem' }}>Address</label>
                  <textarea 
                    value={buyerDetails.address}
                    placeholder={buyerPlaceholders.address}
                    readOnly={!isBuyerEditable}
                    onChange={(e) => setBuyerDetails({...buyerDetails, address: e.target.value})} 
                    rows="2"
                    style={{ 
                      width: '100%', padding: '0.7rem', border: '2px solid #7dd3fc', borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical',
                      background: isBuyerEditable ? 'white' : '#e9ecef', 
                      cursor: isBuyerEditable ? 'auto' : 'not-allowed' 
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#075985', marginBottom: '0.4rem' }}>GSTIN</label>
                  <input 
                    type="text" 
                    value={buyerDetails.gstin}
                    placeholder={buyerPlaceholders.gstin}
                    readOnly={!isBuyerEditable}
                    onChange={(e) => setBuyerDetails({...buyerDetails, gstin: e.target.value})} 
                    style={{ 
                      width: '100%', padding: '0.7rem', border: '2px solid #7dd3fc', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'monospace',
                      background: isBuyerEditable ? 'white' : '#e9ecef', 
                      cursor: isBuyerEditable ? 'auto' : 'not-allowed' 
                    }}
                  />
                </div>

                {/* Conditional Save Button */}
                {isBuyerEditable && (
                  <button 
                    onClick={handleSaveCustomer}
                    style={{ marginTop: '0.5rem', background: '#22c55e', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Save New Customer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Items Table (Unchanged) */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700', color: '#1f2937' }}>Invoice Items</h2>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'left', color: 'white', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>Item Description</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'left', color: 'white', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>HSN/SAC</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'white', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>Qty</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'white', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>Unit</th>
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
                          style={{ width: '100%', minWidth: '150px', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
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
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} 
                          style={{ width: '80px', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <input 
                          type="text" 
                          value={item.unit} 
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)} 
                          style={{ width: '70px', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <input 
                          type="number" 
                          value={item.rate} 
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))} 
                          style={{ width: '100px', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <input 
                          type="number" 
                          value={item.gstRate} 
                          onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value))} 
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

          {/* Totals and Action Section (Unchanged) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            {/* PDF Generation Button */}
            <div>
              <button 
                onClick={generatePDF} 
                disabled={!scriptsLoaded}
                style={{ 
                  width: '100%',
                  background: scriptsLoaded ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#9ca3af', 
                  color: 'white', border: 'none', padding: '1.25rem', borderRadius: '12px', 
                  fontSize: '1.1rem', fontWeight: '700', 
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
                  <span style={{ color: '#15803d', fontWeight: '7G00', fontSize: '1.5rem' }}>₹{totals.grandTotal.toFixed(2)}</span>
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