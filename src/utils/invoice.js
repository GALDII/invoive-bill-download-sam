/**
 * Generates a unique invoice number based on the current timestamp.
 * Format: INV-YYYYMMDD-HHMMSS
 */
export const generateInvoiceNumber = () => {
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
 * Calculates totals for the invoice items
 */
export const calculateTotals = (items) => {
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
};
