/**
 * Generate QR code data URL using a simple approach
 * For production, consider using a library like 'qrcode' or 'qrcode.react'
 */
export const generateQRCode = async (text) => {
  try {
    // Try to use qrcode library if available
    const QRCode = await import('qrcode').catch(() => null);
    
    if (QRCode && QRCode.default) {
      return await QRCode.default.toDataURL(text, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } else if (QRCode && QRCode.toDataURL) {
      return await QRCode.toDataURL(text, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } else {
      // Fallback: Return null if library not available
      console.warn('QRCode library not installed. Install with: npm install qrcode');
      return null;
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

/**
 * Generate QR code for invoice
 */
export const generateInvoiceQRCode = async (invoiceData) => {
  const qrData = {
    invoiceNumber: invoiceData.invoiceDetails?.number,
    date: invoiceData.invoiceDetails?.date,
    total: invoiceData.totals?.roundedGrandTotal,
    sellerGSTIN: invoiceData.sellerDetails?.gstin,
    buyerGSTIN: invoiceData.buyerDetails?.gstin,
  };
  
  const qrText = JSON.stringify(qrData);
  return await generateQRCode(qrText);
};

