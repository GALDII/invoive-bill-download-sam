import React, { useState, useEffect, useMemo } from 'react';

/**
* Generates a unique invoice number based on the current timestamp.
* Format: INV-YYYYMMDD-HHMMSS
*/
const generateInvoiceNumber = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const hh = String(today.getHours()).padStart(2, '0');
  const min = String(today.getMinutes()).padStart(2, '0');
  const ss = String(today.getSeconds()).padStart(2, '0');
  
  return `INV-${yyyy}${mm}${dd}-${hh}${min}${ss}`;
};

/**
* Converts a number to words (helper function for parts less than 1000)
*/
const convertBelowThousand = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return '';
  
  let words = '';
  
  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  } else if (num >= 10) {
    words += teens[num - 10] + ' ';
    return words.trim();
  }
  
  if (num > 0) {
    words += ones[num] + ' ';
  }
  
  return words.trim();
};

/**
* Converts a number to Indian words format with proper handling of decimals
* Example: 18427.50 -> "Eighteen Thousand Four Hundred Twenty Seven Rupees and Fifty Paise Only"
*/
const convertAmountToWords = (amount) => {
  if (amount === 0) return 'Zero Rupees Only';
  
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let words = '';
  
  // Handle Crores (10,000,000)
  if (rupees >= 10000000) {
    words += convertBelowThousand(Math.floor(rupees / 10000000)) + ' Crore ';
    const remainder = rupees % 10000000;
    if (remainder > 0) {
      words += convertAmountToWordsHelper(remainder);
    }
  } else {
    words = convertAmountToWordsHelper(rupees);
  }
  
  words = words.trim() + ' Rupees';
  
  // Add paise if present
  if (paise > 0) {
    words += ' and ' + convertBelowThousand(paise) + ' Paise';
  }
  
  words += ' Only';
  
  return words;
};

/**
* Helper function for converting rupees part (without "Rupees Only" suffix)
*/
const convertAmountToWordsHelper = (num) => {
  if (num === 0) return '';
  
  let words = '';
  
  // Handle Lakhs (100,000)
  if (num >= 100000) {
    words += convertBelowThousand(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  // Handle Thousands (1,000)
  if (num >= 1000) {
    words += convertBelowThousand(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  // Handle remaining (0-999)
  if (num > 0) {
    words += convertBelowThousand(num);
  }
  
  return words.trim();
};

// --- Main App Component ---
function App() {
  // --- State Definitions ---
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // Placeholders for empty fields
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
    number: 'INV-20251104-123000',
  };

  // Form States
  const [sellerDetails, setSellerDetails] = useState({
    name: '', address: '', gstin: '', state: '', stateCode: ''
  });

  const [buyerDetails, setBuyerDetails] = useState({
    name: '', address: '', gstin: '', state: '', stateCode: ''
  });
  
  const [invoiceDetails, setInvoiceDetails] = useState({
    number: generateInvoiceNumber(),
    date: new Date().toISOString().split('T')[0],
    reverseCharge: 'NO',
  });

  const [items, setItems] = useState([
    { description: '2/60polyester yarn', hsn: '55092200', quantity: 60, rate: 230.0, gstRate: 5 },
  ]);

  // Customer Management States (in-memory only)
  const [savedCustomers, setSavedCustomers] = useState(() => {
    const localData = localStorage.getItem('invoiceAppCustomers');
    return localData ? JSON.parse(localData) : [];
  });

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isBuyerEditable, setIsBuyerEditable] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- Effects ---

  // Effect to load external PDF scripts
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

  // Effect to save customers to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem('invoiceAppCustomers', JSON.stringify(savedCustomers));
  }, [savedCustomers]);

  // --- Item Handlers ---
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const numericFields = ['quantity', 'rate', 'gstRate'];
    if (numericFields.includes(field)) {
      // allow empty string while typing, otherwise coerce to number
      if (value === '' || value === null) {
        newItems[index][field] = '';
      } else {
        const n = Number(value);
        newItems[index][field] = Number.isNaN(n) ? 0 : n;
      }
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', hsn: '', quantity: 1, rate: 0, gstRate: 5 }]);
  };
  
  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };
  
  // --- Calculation Logic (memoized for performance) ---
  const totals = useMemo(() => {
    let subtotal = 0, totalCgst = 0, totalSgst = 0;
    items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const gstRate = Number(item.gstRate) || 0;
      const taxableValue = qty * rate;
      subtotal += taxableValue;
      const gstAmount = (taxableValue * gstRate) / 100;
      totalCgst += gstAmount / 2;
      totalSgst += gstAmount / 2;
    });
    const grandTotalBeforeRounding = subtotal + totalCgst + totalSgst;
    const roundedGrandTotal = Math.round(grandTotalBeforeRounding);
    const roundOffAmount = roundedGrandTotal - grandTotalBeforeRounding;
    return {
      subtotal,
      totalCgst,
      totalSgst,
      grandTotal: grandTotalBeforeRounding,
      roundedGrandTotal,
      roundOffAmount,
      totalTax: totalCgst + totalSgst
    };
  }, [items]);

  // --- Customer Management Handlers ---

  const clearBuyerFields = () => {
    setBuyerDetails({ name: '', address: '', gstin: '', state: '', stateCode: '' });
    setIsBuyerEditable(true);
  };

  const handleCustomerSelect = (e) => {
    const customerName = e.target.value;
    setSelectedCustomer(customerName);

    if (customerName === "") {
      clearBuyerFields();
    } else {
      const customer = savedCustomers.find(c => c.name === customerName);
      if (customer) {
        setBuyerDetails(customer);
        setIsBuyerEditable(false);
      }
    }
  };

  const handleAddNewCustomer = () => {
    setSelectedCustomer('');
    clearBuyerFields();
  };

  const handleSaveCustomer = () => {
    const { name, address, gstin, state, stateCode } = buyerDetails;

    if (name.trim() === '') {
      alert('Customer Name cannot be empty.');
      return;
    }
    if (savedCustomers.find(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      alert('A customer with this name already exists.');
      return;
    }

    const newCustomer = { 
      name: name.trim(), 
      address: address.trim(), 
      gstin: gstin.trim(),
      state: state.trim(),
      stateCode: stateCode.trim()
    };
    const updatedCustomers = [...savedCustomers, newCustomer].sort((a, b) => a.name.localeCompare(b.name));

    setSavedCustomers(updatedCustomers);
    
    setSelectedCustomer(newCustomer.name);
    setIsBuyerEditable(false);
    alert('Customer saved successfully!');
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) {
      alert("Please select a customer to delete.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedCustomer}?`)) {
      const updatedCustomers = savedCustomers.filter(c => c.name !== selectedCustomer);
      
      setSavedCustomers(updatedCustomers);

      handleAddNewCustomer();
      alert('Customer deleted.');
    }
  };

  // compute dynamic styles based on theme
  const styles = getStyles(isDarkMode);

  // --- PDF Generation ---
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

    // --- Page Border ---
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    const pdfSeller = {
      name: sellerDetails.name || sellerPlaceholders.name,
      address: sellerDetails.address || sellerPlaceholders.address,
      gstin: sellerDetails.gstin || sellerPlaceholders.gstin,
      state: sellerDetails.state || sellerPlaceholders.state,
      stateCode: sellerDetails.stateCode || sellerPlaceholders.stateCode
    };

    const pdfBuyer = {
      name: buyerDetails.name || buyerPlaceholders.name,
      address: buyerDetails.address || buyerPlaceholders.address,
      gstin: buyerDetails.gstin || buyerPlaceholders.gstin,
      state: buyerDetails.state || buyerPlaceholders.state,
      stateCode: buyerDetails.stateCode || buyerPlaceholders.stateCode
    };

    const pdfInvoice = {
      number: invoiceDetails.number || invoicePlaceholders.number,
      date: invoiceDetails.date,
      reverseCharge: invoiceDetails.reverseCharge
    };
    
    // Company Information (Seller) - Starting at top
    let currentY = 10;
    doc.setTextColor(0, 0, 0); 
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(pdfSeller.name, center, currentY, { align: 'center' });
    
    currentY += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfSeller.address, center, currentY, { align: 'center' });
    
    currentY += 5;
    const gstinText = `GSTIN : ${pdfSeller.gstin}`;
    const gstinTextWidth = doc.getTextWidth(gstinText);
    const stateCodeText = `State Code : ${pdfSeller.stateCode}`;
    const stateCodeTextWidth = doc.getTextWidth(stateCodeText);
    const totalWidth = gstinTextWidth + stateCodeTextWidth + 10; 
    const gstinX = center - (totalWidth / 2);
    
    doc.text(gstinText, gstinX, currentY);
    
    const stateCodeX = gstinX + gstinTextWidth + 5;
    doc.text(stateCodeText, stateCodeX, currentY);
    
    currentY += 4;
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    
    // Main Title ("TAX INVOICE")
    currentY += 3;
    doc.setFillColor(232, 241, 252); 
    doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TAX INVOICE', center, currentY + 6.5, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Original For Recipient', pageWidth - margin - 2, currentY + 6.5, { align: 'right' });
    
    currentY += 17;
    
    // Invoice & Billing Details
    doc.setFontSize(9);
    const col1 = margin;
    const col2 = pageWidth / 2 + 5;
    const keyX = col2;
    const valueX = col2 + 35;
    
    // Left Column (Receiver / Billed To)
    doc.setFont('helvetica', 'bold');
    doc.text('Details of Receiver | Billed to', col1, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfBuyer.name, col1, currentY + 5);
    const buyerAddress = doc.splitTextToSize(pdfBuyer.address, (pageWidth / 2) - 30);
    doc.text(buyerAddress, col1, currentY + 10);
    let leftY = currentY + 10 + (buyerAddress.length * 4);
    doc.text(`GSTIN: ${pdfBuyer.gstin}`, col1, leftY + 5);
    doc.text(`State: ${pdfBuyer.state}`, col1, leftY + 10);
    doc.text(`State Code : ${pdfBuyer.stateCode}`, col1, leftY + 15);

    // Top Right (Invoice Info)
    doc.setFont('helvetica', 'bold'); 
    doc.text('Invoice Number', keyX, currentY); 
    doc.setFont('helvetica', 'normal'); 
    doc.text(pdfInvoice.number, valueX, currentY);
    
    doc.setFont('helvetica', 'bold'); 
    doc.text('Invoice Date', keyX, currentY + 5); 
    doc.setFont('helvetica', 'normal'); 
    doc.text(pdfInvoice.date, valueX, currentY + 5);
    
    doc.setFont('helvetica', 'bold'); 
    doc.text('State', keyX, currentY + 10); 
    doc.setFont('helvetica', 'normal'); 
    doc.text(pdfSeller.state, valueX, currentY + 10);
    
    doc.setFont('helvetica', 'bold'); 
    doc.text('Reverse Charge', keyX, currentY + 15); 
    doc.setFont('helvetica', 'normal'); 
    doc.text(pdfInvoice.reverseCharge, valueX, currentY + 15);
    
    // Right Column (Consignee / Shipped To)
    let y2 = currentY + 25; 
    doc.setFont('helvetica', 'bold');
    doc.text('Details of Consignee | Shipped to', keyX, y2);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfBuyer.name, keyX, y2 + 5);
    const consigneeAddress = doc.splitTextToSize(pdfBuyer.address, (pageWidth / 2) - 30);
    doc.text(consigneeAddress, keyX, y2 + 10);
    let rightY = y2 + 10 + (consigneeAddress.length * 4);
    doc.text(`GSTIN: ${pdfBuyer.gstin}`, keyX, rightY + 5);
    doc.text(`State: ${pdfBuyer.state}`, keyX, rightY + 10);
    doc.text(`State Code : ${pdfBuyer.stateCode}`, keyX, rightY + 15);

    // Product Details Table
    const tableStartY = Math.max(leftY, rightY) + 20;
    const tableHead = [
        [
            { content: 'Sr. No.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Name of Product', rowSpan: 2, styles: { valign: 'middle' } },
            { content: 'HSN/SAC', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'QTY', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Rate', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
            { content: 'Taxable Value', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
            { content: 'CGST', colSpan: 2, styles: { halign: 'center' } },
            { content: 'SGST', colSpan: 2, styles: { halign: 'center' } },
            { content: 'Total', rowSpan: 2, styles: { halign: 'right', valign: 'middle' } },
        ],
        [
            { content: 'Rate', styles: { halign: 'right' } }, 
            { content: 'Amount', styles: { halign: 'right' } },
            { content: 'Rate', styles: { halign: 'right' } }, 
            { content: 'Amount', styles: { halign: 'right' } },
        ]
    ];
    
    const tableBody = [];
    items.forEach((item, index) => {
        const taxableValue = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
        const cgstRate = (parseFloat(item.gstRate) || 0) / 2;
        const sgstRate = (parseFloat(item.gstRate) || 0) / 2;
        const cgstAmount = (taxableValue * cgstRate) / 100;
        const sgstAmount = (taxableValue * sgstRate) / 100;
        const itemTotal = taxableValue + cgstAmount + sgstAmount;
        
        tableBody.push([
            index + 1, item.description, item.hsn, item.quantity,
            `Rs. ${item.rate.toFixed(2)}`, `Rs. ${taxableValue.toFixed(2)}`,
            `${cgstRate.toFixed(2)}%`, `Rs. ${cgstAmount.toFixed(2)}`,
            `${sgstRate.toFixed(2)}%`, `Rs. ${sgstAmount.toFixed(2)}`,
            `Rs. ${itemTotal.toFixed(2)}`,
        ]);
    });
    
    const totalQty = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    
    tableBody.push([
        { content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: totalQty, styles: { fontStyle: 'bold', halign: 'center' } },
        { content: '', styles: { fontStyle: 'bold', halign: 'right' } },
        { content: `Rs. ${totals.subtotal.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } },
        '',
        { content: `Rs. ${totals.totalCgst.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } },
        '',
        { content: `Rs. ${totals.totalSgst.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: `Rs. ${totals.grandTotal.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } }
    ]);
    
    doc.autoTable({
        head: tableHead, 
        body: tableBody, 
        startY: tableStartY, 
        theme: 'grid',
        headStyles: { 
          fillColor: [232, 241, 252], 
          textColor: 0, 
          fontSize: 8, 
          lineWidth: 0.1, 
          lineColor: [150, 150, 150] 
        },
        styles: { 
          fontSize: 8, 
          lineWidth: 0.1, 
          lineColor: [150, 150, 150], 
          cellPadding: 1.5 
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 35 },
            2: { halign: 'center' },
            3: { halign: 'center', cellWidth: 10 },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right', cellWidth: 12 },
            7: { halign: 'right' },
            8: { halign: 'right', cellWidth: 12 },
            9: { halign: 'right' },
            10: { halign: 'right' },
        },
        didDrawCell: (data) => {
            if (data.row.index === tableBody.length - 1) {
                data.cell.styles.fillColor = '#f8f9fa';
                data.cell.styles.lineWidth = 0.1;
            }
        }
    });
    
    // Final Amounts & Footer Section
    let finalY = doc.autoTable.previous.finalY;
    let footerStartY = finalY + 5;

    const leftColWidth = (pageWidth - (margin * 2)) / 2;
    const rightColWidth = (pageWidth - (margin * 2)) / 2;

    // Convert grand total to words
    const amountInWords = convertAmountToWords(totals.roundedGrandTotal);

    // Draw container and left side manually
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.1);

    const containerHeight = 55;

    // Draw the main container
    doc.rect(margin, footerStartY, pageWidth - (margin * 2), containerHeight);
    doc.line(center, footerStartY, center, footerStartY + containerHeight);

    // LEFT SIDE - Amount in words with manual text rendering
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Invoice Amount in words', margin + 2, footerStartY + 5);

    doc.setFont('helvetica', 'normal');
    const wrappedAmount = doc.splitTextToSize(amountInWords, leftColWidth - 4);
    doc.text(wrappedAmount, margin + 2, footerStartY + 11);

    // RIGHT SIDE - Summary Table
    const summaryStartY = footerStartY + 1;
    doc.autoTable({
        body: [
            ['Total Amount Before Tax', `Rs. ${totals.subtotal.toFixed(2)}`],
            ['Add : CGST', `Rs. ${totals.totalCgst.toFixed(2)}`],
            ['Add : SGST', `Rs. ${totals.totalSgst.toFixed(2)}`],
            [
              { content: 'Total Tax Amount', styles: { fontStyle: 'bold', fillColor: [248, 249, 250] } }, 
              { content: `Rs. ${totals.totalTax.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [248, 249, 250] } }
            ],
            ['Round Off', `Rs. ${totals.roundOffAmount >= 0 ? '+' : ''}${totals.roundOffAmount.toFixed(2)}`],
            [
              { content: 'Final Invoice Amount', styles: { fontStyle: 'bold', fillColor: [248, 249, 250] } }, 
              { content: `Rs. ${totals.roundedGrandTotal.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [248, 249, 250] } }
            ],
            ['Balance Due', `Rs. ${totals.roundedGrandTotal.toFixed(2)}`]
        ],
        startY: summaryStartY,
        margin: { left: center + 2, right: margin + 1 },
        tableWidth: rightColWidth - 3,
        theme: 'grid',
        styles: { 
          fontSize: 9, 
          cellPadding: 2, 
          lineWidth: 0.1, 
          lineColor: [150, 150, 150] 
        },
        columnStyles: { 
            0: { halign: 'left', cellWidth: (rightColWidth - 3) * 0.6 }, 
            1: { halign: 'right', cellWidth: (rightColWidth - 3) * 0.4 } 
        }
    });

    // Terms & Signature
    let bottomY = footerStartY + containerHeight + 15;

    if (bottomY > pageHeight - 35) {
        doc.addPage();
        doc.setDrawColor(0, 0, 0); 
        doc.setLineWidth(0.5);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
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

    // Save PDF
    doc.save(`Invoice-${pdfInvoice.number}.pdf`);
  };

  // Small reusable components use dynamic styles from closure
  const InputGroup = ({ label, value, placeholder, onChange, theme, isMonospace = false, readOnly = false }) => {
    const id = label ? String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;
    return (
      <div>
        <label htmlFor={id} style={styles.formLabel(theme)}>{label}</label>
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          readOnly={readOnly}
          aria-label={label}
          style={{
            ...styles.formInput(theme),
            fontFamily: isMonospace ? 'monospace' : 'inherit',
            background: readOnly ? (isDarkMode ? '#0f172a' : '#f8fafc') : styles.formInput(theme).background,
            cursor: readOnly ? 'not-allowed' : 'auto'
          }}
        />
      </div>
    );
  };

  const TextareaGroup = ({ label, value, placeholder, onChange, theme, readOnly = false }) => {
    const id = label ? String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;
    return (
      <div>
        <label htmlFor={id} style={styles.formLabel(theme)}>{label}</label>
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          readOnly={readOnly}
          rows="2"
          aria-label={label}
          style={{
            ...styles.formInput(theme),
            resize: 'vertical',
            background: readOnly ? (isDarkMode ? '#0f172a' : '#f8fafc') : styles.formInput(theme).background,
            cursor: readOnly ? 'not-allowed' : 'auto'
          }}
        />
      </div>
    );
  };

  const TotalsRow = ({ label, value }) => (
    <div style={styles.totalsRow}>
      <span style={{ color: isDarkMode ? '#e6eef6' : '#166534', fontWeight: '600', fontSize: '0.95rem' }}>{label}</span>
      <span style={{ color: isDarkMode ? '#e6eef6' : '#166534', fontWeight: '600', fontSize: '1rem' }}>{value}</span>
    </div>
  );

  // --- JSX (HTML Structure) ---
  return (
    <div style={styles.page} className="app-root">
      <div style={styles.container}>
        <style>{`
          .app-root input:focus, .app-root textarea:focus, .app-root select:focus {
            box-shadow: 0 0 0 4px rgba(249,115,22,0.12) !important;
            border-color: #F97316 !important;
            outline: none;
            transition: box-shadow 0.15s ease;
          }
          .app-root select { appearance: none; -webkit-appearance: none; -moz-appearance: none }
        `}</style>
        
        {/* Top Bar */}
        <div style={styles.topbar}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:36,height:36,borderRadius:8,background:'#EA580C',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:800}}>I</div>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:isDarkMode ? '#e6eef6' : '#111827'}}>Invoices</div>
              <div style={{fontSize:12,color:isDarkMode ? '#94a3b8' : '#6b7280'}}>Create and manage invoices</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {/* Seller name label */}
            <div style={styles.sellerName}>VR Traders</div>

            {/* Pill-shaped toggle: sun / moon */}
            <div style={styles.toggleContainer} role="tablist" aria-label="Color mode">
              <button
                onClick={() => setIsDarkMode(false)}
                aria-pressed={!isDarkMode}
                aria-label="Switch to light mode"
                style={{
                  ...styles.toggleOption,
                  ...(isDarkMode ? {} : styles.toggleActive)
                }}
              >
                <span style={styles.toggleIcon}>☀️</span>
              </button>

              <button
                onClick={() => setIsDarkMode(true)}
                aria-pressed={isDarkMode}
                aria-label="Switch to dark mode"
                style={{
                  ...styles.toggleOption,
                  ...(isDarkMode ? styles.toggleActive : {})
                }}
              >
                <span style={styles.toggleIcon}>🌙</span>
              </button>
            </div>

            <div style={styles.profileCircle}></div>
          </div>
        </div>

        <div style={styles.content}>
          {/* Invoice Details Section */}
          <div style={styles.card}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={styles.label}>Invoice Number</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={invoiceDetails.number}
                    onChange={(e) => setInvoiceDetails({...invoiceDetails, number: e.target.value})}
                    style={{...styles.input, flex: 1}}
                    placeholder="Enter invoice number"
                  />
                  <button
                    onClick={() => setInvoiceDetails({...invoiceDetails, number: generateInvoiceNumber()})}
                    style={{...styles.button, ...styles.secondary, padding: '0.75rem 1rem', whiteSpace: 'nowrap'}}
                    title="Generate new invoice number"
                  >
                    🔄 Auto
                  </button>
                </div>
              </div>
              <div>
                <label style={styles.label}>Invoice Date</label>
                <input 
                  type="date" 
                  value={invoiceDetails.date} 
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, date: e.target.value})}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Customer Management Section */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Customer Management</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
              <select 
                value={selectedCustomer}
                onChange={handleCustomerSelect}
                style={{...styles.input, flex: '1 1 300px', minWidth: '250px', appearance: 'none', paddingRight: '36px'}}
              >
                <option value="">--- Select Existing Customer ---</option>
                {savedCustomers.map((cust, index) => (
                  <option key={index} value={cust.name}>{cust.name}</option>
                ))}
              </select>
              <button 
                onClick={handleAddNewCustomer}
                style={{...styles.button, ...styles.secondary, flex: '1 1 auto'}}
              >
                + Add New Customer
              </button>
              <button 
                onClick={handleDeleteCustomer}
                disabled={!selectedCustomer}
                style={{...styles.button, ...styles.danger, flex: '1 1 auto', opacity: !selectedCustomer ? 0.6 : 1}}
              >
                Delete Selected
              </button>
            </div>
          </div>

          {/* Seller and Buyer Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* Seller Details */}
            <div style={styles.sellerCard}>
              <h2 style={{...styles.cardTitle, color: '#ea580c'}}><span>🏢</span> Seller Details</h2>
              <div style={styles.formGrid}>
                <InputGroup 
                  label="Business Name" 
                  value={sellerDetails.name} 
                  placeholder={sellerPlaceholders.name}
                  onChange={(e) => setSellerDetails({...sellerDetails, name: e.target.value})} 
                  theme="orange"
                />
                <TextareaGroup 
                  label="Address" 
                  value={sellerDetails.address}
                  placeholder={sellerPlaceholders.address}
                  onChange={(e) => setSellerDetails({...sellerDetails, address: e.target.value})} 
                  theme="orange"
                />
                <InputGroup 
                  label="GSTIN" 
                  value={sellerDetails.gstin} 
                  placeholder={sellerPlaceholders.gstin}
                  onChange={(e) => setSellerDetails({...sellerDetails, gstin: e.target.value})} 
                  theme="orange"
                  isMonospace={true}
                />
                <InputGroup 
                  label="State" 
                  value={sellerDetails.state} 
                  placeholder={sellerPlaceholders.state}
                  onChange={(e) => setSellerDetails({...sellerDetails, state: e.target.value})} 
                  theme="orange"
                />
                <InputGroup 
                  label="State Code" 
                  value={sellerDetails.stateCode} 
                  placeholder={sellerPlaceholders.stateCode}
                  onChange={(e) => setSellerDetails({...sellerDetails, stateCode: e.target.value})} 
                  theme="orange"
                />
              </div>
            </div>

            {/* Buyer Details */}
            <div style={styles.buyerCard}>
              <h2 style={{...styles.cardTitle, color: '#0284c7'}}><span>👤</span> Buyer Details</h2>
              <div style={styles.formGrid}>
                <InputGroup 
                  label="Business Name" 
                  value={buyerDetails.name} 
                  placeholder={buyerPlaceholders.name}
                  onChange={(e) => setBuyerDetails({...buyerDetails, name: e.target.value})} 
                  theme="blue"
                  readOnly={!isBuyerEditable}
                />
                <TextareaGroup 
                  label="Address"
                  value={buyerDetails.address}
                  placeholder={buyerPlaceholders.address}
                  onChange={(e) => setBuyerDetails({...buyerDetails, address: e.target.value})} 
                  theme="blue"
                  readOnly={!isBuyerEditable}
                />
                <InputGroup 
                  label="GSTIN" 
                  value={buyerDetails.gstin} 
                  placeholder={buyerPlaceholders.gstin}
                  onChange={(e) => setBuyerDetails({...buyerDetails, gstin: e.target.value})}
                  theme="blue"
                  isMonospace={true}
                  readOnly={!isBuyerEditable}
                />
                <InputGroup 
                  label="State" 
                  value={buyerDetails.state} 
                  placeholder={buyerPlaceholders.state}
                  onChange={(e) => setBuyerDetails({...buyerDetails, state: e.target.value})} 
                  theme="blue"
                  readOnly={!isBuyerEditable}
                />
                <InputGroup 
                  label="State Code" 
                  value={buyerDetails.stateCode} 
                  placeholder={buyerPlaceholders.stateCode}
                  onChange={(e) => setBuyerDetails({...buyerDetails, stateCode: e.target.value})} 
                  theme="blue"
                  readOnly={!isBuyerEditable}
                />
                {isBuyerEditable && (
                  <button 
                    onClick={handleSaveCustomer}
                    disabled={!buyerDetails.name.trim()}
                    aria-disabled={!buyerDetails.name.trim()}
                    style={{...styles.button, ...styles.success, marginTop: '0.5rem', opacity: !buyerDetails.name.trim() ? 0.6 : 1}}
                  >
                    Save New Customer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{...styles.cardTitle, color: '#1f2937'}}>Invoice Items</h2>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableHeader}>Item Description</th>
                    <th style={styles.tableHeader}>HSN/SAC</th>
                    <th style={styles.tableHeader}>Qty</th>
                    <th style={styles.tableHeader}>Rate (₹)</th>
                    <th style={styles.tableHeader}>GST %</th>
                    <th style={styles.tableHeader}>Total (₹)</th>
                    <th style={styles.tableHeader}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={styles.tableBodyRow(index)}>
                      <td style={styles.tableCell}>
                        <input 
                          type="text" 
                          value={item.description} 
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                          placeholder="Item name" 
                          style={{...styles.tableInput, minWidth: '150px'}}
                        />
                      </td>
                      <td style={styles.tableCell}>
                        <input 
                          type="text" 
                          value={item.hsn} 
                          onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} 
                          placeholder="HSN" 
                          aria-label={`HSN for item ${index + 1}`}
                          style={{...styles.tableInput, width: '110px', fontFamily: 'monospace'}}
                        />
                      </td>
                      <td style={styles.tableCell}>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                          min="0"
                          step="any"
                          aria-label={`Quantity for item ${index + 1}`}
                          style={{...styles.tableInput, width: '80px', textAlign: 'center'}}
                        />
                      </td>
                      <td style={styles.tableCell}>
                        <input 
                          type="number" 
                          value={item.rate} 
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)} 
                          min="0"
                          step="0.01"
                          aria-label={`Rate for item ${index + 1}`}
                          style={{...styles.tableInput, width: '100px', textAlign: 'right'}}
                        />
                      </td>
                      <td style={styles.tableCell}>
                        <input 
                          type="number" 
                          value={item.gstRate} 
                          onChange={(e) => handleItemChange(index, 'gstRate', e.target.value)} 
                          min="0"
                          max="100"
                          step="0.01"
                          aria-label={`GST percent for item ${index + 1}`}
                          style={{...styles.tableInput, width: '70px', textAlign: 'center'}}
                        />
                      </td>
                      <td style={{...styles.tableCell, textAlign: 'right', fontWeight: '600', color: '#059669', fontSize: '0.95rem'}}>
                        ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0) * (1 + (parseFloat(item.gstRate) || 0) / 100)).toFixed(2)}
                      </td>
                      <td style={{...styles.tableCell, textAlign: 'center'}}>
                        <button onClick={() => removeItem(index)} style={styles.deleteItemButton}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              onClick={addItem} 
              style={{...styles.button, ...styles.primary, marginTop: '1rem'}}
              aria-label="Add a new invoice item"
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
                aria-label="Generate PDF Invoice"
                style={{...styles.button, ...styles.generateButton, opacity: scriptsLoaded ? 1 : 0.6, cursor: scriptsLoaded ? 'pointer' : 'not-allowed'}}
              >
                {scriptsLoaded ? '📥 Generate PDF Invoice' : '⏳ Loading...'}
              </button>
              
              {/* Display Amount in Words */}
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #bae6fd' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#075985', marginBottom: '0.5rem' }}>
                  Amount in Words:
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#0c4a6e' }}>
                  {convertAmountToWords(totals.roundedGrandTotal)}
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div style={styles.totalsCard}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <TotalsRow label="Subtotal:" value={`₹${totals.subtotal.toFixed(2)}`} />
                <TotalsRow label="CGST:" value={`₹${totals.totalCgst.toFixed(2)}`} />
                <TotalsRow label="SGST:" value={`₹${totals.totalSgst.toFixed(2)}`} />
                <TotalsRow 
                  label="Round Off:" 
                  value={`₹${totals.roundOffAmount >= 0 ? '+' : ''}${totals.roundOffAmount.toFixed(2)}`} 
                />
                <div style={{...styles.totalsRow, paddingTop: '0.75rem', marginTop: '0.5rem', borderTop: 'none'}}>
                  <span style={{ color: '#14532d', fontWeight: '700', fontSize: '1.2rem' }}>Grand Total:</span>
                  <span style={{ color: '#15803d', fontWeight: '700', fontSize: '1.5rem' }}>₹{totals.roundedGrandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Reusable Components ---

// --- Styles Object ---
const getStyles = (isDarkMode) => ({
  page: {
    minHeight: '100vh',
    background: isDarkMode ? '#0f172a' : '#F9FAFB',
    padding: '24px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: isDarkMode ? '#e6eef6' : '#0f172a'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    background: isDarkMode ? '#1e293b' : '#FFFFFF',
    borderRadius: '12px',
    boxShadow: isDarkMode ? '0 2px 10px rgba(2,6,23,0.6)' : '0 2px 10px rgba(2,6,23,0.05)',
    overflow: 'hidden',
    border: `1px solid ${isDarkMode ? '#334155' : '#E5E7EB'}`
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: `1px solid ${isDarkMode ? '#273449' : '#EEF2F7'}`,
    background: 'transparent'
  },
  tab: {
    background: 'transparent',
    border: 'none',
    color: isDarkMode ? '#cbd5e1' : '#6B7280',
    padding: '8px 10px',
    borderRadius: 8,
    cursor: 'pointer'
  },
  tabActive: {
    background: isDarkMode ? '#18304a' : '#FFF7ED',
    border: `1px solid ${isDarkMode ? '#2b495f' : '#FDE0C2'}`,
    color: '#F97316',
    padding: '8px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 700
  },
  content: { padding: '24px' },
  card: {
    marginBottom: '16px',
    padding: '16px',
    background: isDarkMode ? '#0f172a' : '#FFFFFF',
    borderRadius: '10px',
    border: `1px solid ${isDarkMode ? '#334155' : '#E5E7EB'}`
  },
  cardTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 700,
    color: isDarkMode ? '#e6eef6' : '#111827'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: isDarkMode ? '#cbd5e1' : '#6B7280',
    marginBottom: '6px',
    letterSpacing: '0.6px',
    textTransform: 'uppercase'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid',
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
    borderRadius: 8,
    fontSize: '14px',
    background: isDarkMode ? '#1e293b' : '#ffffff',
    color: isDarkMode ? '#e6eef6' : '#0f172a',
    boxSizing: 'border-box'
  },
  sellerCard: {
    background: isDarkMode ? '#12202b' : '#fff',
    padding: '16px',
    borderRadius: '10px',
    border: `1px solid ${isDarkMode ? '#334155' : '#FEE7D6'}`
  },
  buyerCard: {
    background: isDarkMode ? '#12202b' : '#fff',
    padding: '16px',
    borderRadius: '10px',
    border: `1px solid ${isDarkMode ? '#334155' : '#DBEAFE'}`
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  formLabel: (theme) => ({
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: '6px',
    color: isDarkMode ? '#cbd5e1' : '#6B7280'
  }),
  formInput: (theme) => ({
    width: '100%',
    padding: '12px',
    borderRadius: 8,
    border: '1px solid',
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
    fontSize: '14px',
    background: isDarkMode ? '#1e293b' : '#ffffff',
    color: isDarkMode ? '#e6eef6' : '#0f172a',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'box-shadow 0.15s ease'
  }),
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: `1px solid ${isDarkMode ? '#334155' : '#EEF2F7'}`
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: isDarkMode ? '#0f172a' : 'white'
  },
  tableHeaderRow: {
    background: 'transparent'
  },
  tableHeader: {
    padding: '12px',
    textAlign: 'left',
    color: isDarkMode ? '#cbd5e1' : '#6B7280',
    fontSize: '13px',
    fontWeight: 700
  },
  tableBodyRow: (index) => ({
    borderBottom: `1px solid ${isDarkMode ? '#273449' : '#F1F5F9'}`,
    background: isDarkMode ? '#0f172a' : '#ffffff'
  }),
  tableCell: { padding: '10px' },
  tableInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid',
    borderColor: isDarkMode ? '#334155' : '#F1F5F9',
    borderRadius: 8,
    fontSize: '14px',
    background: isDarkMode ? '#1e293b' : '#ffffff',
    color: isDarkMode ? '#e6eef6' : '#0f172a'
  },
  deleteItemButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
  },
  totalsCard: {
    background: isDarkMode ? '#12202b' : '#fff',
    padding: '12px',
    borderRadius: '10px',
    border: `1px solid ${isDarkMode ? '#334155' : '#EEF2F7'}`
  },
  totalsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0'
  },
  sellerName: {
    fontSize: '14px',
    fontWeight: 700,
    color: isDarkMode ? '#cbd5e1' : '#374151',
    marginRight: '8px'
  },
  toggleContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    background: isDarkMode ? '#0b1220' : '#f3f4f6',
    padding: '4px',
    borderRadius: 999,
    gap: 4,
    border: `1px solid ${isDarkMode ? '#273449' : '#e6e6e6'}`
  },
  toggleOption: {
    width: 36,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: isDarkMode ? '#94a3b8' : '#6b7280',
    fontSize: '14px',
    padding: 0
  },
  toggleActive: {
    background: '#F97316',
    color: 'white',
    boxShadow: '0 4px 12px rgba(249,115,22,0.12)'
  },
  toggleIcon: {
    lineHeight: 1,
    fontSize: '16px'
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: isDarkMode ? '#0b1220' : '#f3f4f6'
  },
  button: {
    border: 'none',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  primary: { background: '#F97316', color: isDarkMode ? '#0b1220' : 'white' },
  secondary: { background: 'transparent', color: '#F97316', border: `1px solid ${isDarkMode ? '#2b495f' : '#FDE0C2'}` },
  danger: { background: '#ef4444', color: 'white' },
  success: { background: '#10b981', color: 'white' },
  generateButton: {
    width: '100%',
    background: '#F97316',
    color: isDarkMode ? '#0b1220' : 'white',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 800,
    boxShadow: isDarkMode ? '0 6px 18px rgba(249,115,22,0.08)' : '0 6px 18px rgba(249,115,22,0.12)'
  }
});

export default App;