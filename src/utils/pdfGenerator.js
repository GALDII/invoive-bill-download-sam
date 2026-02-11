import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { convertAmountToWords } from './format';

export const generatePDF = (invoiceDetails, sellerDetails, buyerDetails, items, totals) => {
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const center = pageWidth / 2;

    // --- Page Border ---
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    // Company Information (Seller) - Starting at top
    let currentY = 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(sellerDetails.name, center, currentY, { align: 'center' });

    currentY += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(sellerDetails.address, center, currentY, { align: 'center' });

    currentY += 5;
    const gstinText = `GSTIN : ${sellerDetails.gstin}`;
    const gstinTextWidth = doc.getTextWidth(gstinText);
    const stateCodeText = `State Code : ${sellerDetails.stateCode}`;
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
    doc.text(buyerDetails.name, col1, currentY + 5);
    const buyerAddress = doc.splitTextToSize(buyerDetails.address, (pageWidth / 2) - 30);
    doc.text(buyerAddress, col1, currentY + 10);
    let leftY = currentY + 10 + (buyerAddress.length * 4);
    doc.text(`GSTIN: ${buyerDetails.gstin}`, col1, leftY + 5);
    doc.text(`State: ${buyerDetails.state}`, col1, leftY + 10);
    doc.text(`State Code : ${buyerDetails.stateCode}`, col1, leftY + 15);

    // Top Right (Invoice Info)
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number', keyX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceDetails.number, valueX, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date', keyX, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceDetails.date, valueX, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('State', keyX, currentY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(sellerDetails.state, valueX, currentY + 10);

    doc.setFont('helvetica', 'bold');
    doc.text('Reverse Charge', keyX, currentY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceDetails.reverseCharge, valueX, currentY + 15);

    // Right Column (Consignee / Shipped To)
    let y2 = currentY + 25;
    doc.setFont('helvetica', 'bold');
    doc.text('Details of Consignee | Shipped to', keyX, y2);
    doc.setFont('helvetica', 'normal');
    doc.text(buyerDetails.name, keyX, y2 + 5);
    const consigneeAddress = doc.splitTextToSize(buyerDetails.address, (pageWidth / 2) - 30);
    doc.text(consigneeAddress, keyX, y2 + 10);
    let rightY = y2 + 10 + (consigneeAddress.length * 4);
    doc.text(`GSTIN: ${buyerDetails.gstin}`, keyX, rightY + 5);
    doc.text(`State: ${buyerDetails.state}`, keyX, rightY + 10);
    doc.text(`State Code : ${buyerDetails.stateCode}`, keyX, rightY + 15);

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
            `Rs. ${Number(item.rate).toFixed(2)}`, `Rs. ${taxableValue.toFixed(2)}`,
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

    autoTable(doc, {
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
    let finalY = doc.lastAutoTable.finalY;
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
    autoTable(doc, {
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
    doc.text(`For, ${sellerDetails.name}`, pageWidth - margin, bottomY + 6, { align: 'right' });
    doc.text('Authorised Signatory', pageWidth - margin, bottomY + 20, { align: 'right' });

    // Save PDF
    doc.save(`Invoice-${invoiceDetails.number}.pdf`);
};
