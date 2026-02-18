/**
 * Export data to CSV format
 */
export const exportToCSV = (data, filename = 'export') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Export invoices to CSV
 */
export const exportInvoicesToCSV = (invoices) => {
  const csvData = invoices.map(inv => ({
    'Invoice Number': inv.invoiceDetails?.number || '',
    'Date': inv.invoiceDetails?.date || '',
    'Buyer Name': inv.buyerDetails?.name || '',
    'Buyer GSTIN': inv.buyerDetails?.gstin || '',
    'Seller Name': inv.sellerDetails?.name || '',
    'Subtotal': inv.totals?.subtotal || 0,
    'CGST': inv.totals?.totalCgst || 0,
    'SGST': inv.totals?.totalSgst || 0,
    'Grand Total': inv.totals?.roundedGrandTotal || 0,
    'Status': inv.status || 'Draft',
  }));
  
  exportToCSV(csvData, 'invoices');
};

/**
 * Export to Excel using SheetJS (xlsx library)
 * Note: You'll need to install xlsx: npm install xlsx
 */
export const exportToExcel = async (data, filename = 'export', sheetName = 'Sheet1') => {
  try {
    // Dynamic import to avoid requiring xlsx if not installed
    const XLSX = await import('xlsx');
    
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}-${Date.now()}.xlsx`);
  } catch (error) {
    if (error.message.includes('Cannot find module')) {
      throw new Error('xlsx library not installed. Run: npm install xlsx');
    }
    throw error;
  }
};

/**
 * Export all app data to JSON
 */
export const exportAllData = () => {
  const data = {
    invoices: JSON.parse(localStorage.getItem('invoiceHistory') || '[]'),
    customers: JSON.parse(localStorage.getItem('invoiceAppCustomers') || '[]'),
    templates: JSON.parse(localStorage.getItem('invoiceTemplates') || '[]'),
    items: JSON.parse(localStorage.getItem('itemLibrary') || '[]'),
    sellerProfiles: JSON.parse(localStorage.getItem('sellerProfiles') || '[]'),
    settings: {
      logo: localStorage.getItem('companyLogo'),
      pdfSettings: JSON.parse(localStorage.getItem('pdfSettings') || '{}'),
    },
    exportedAt: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-app-backup-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Import all app data from JSON
 */
export const importAllData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.invoices) {
          localStorage.setItem('invoiceHistory', JSON.stringify(data.invoices));
        }
        if (data.customers) {
          localStorage.setItem('invoiceAppCustomers', JSON.stringify(data.customers));
        }
        if (data.templates) {
          localStorage.setItem('invoiceTemplates', JSON.stringify(data.templates));
        }
        if (data.items) {
          localStorage.setItem('itemLibrary', JSON.stringify(data.items));
        }
        if (data.sellerProfiles) {
          localStorage.setItem('sellerProfiles', JSON.stringify(data.sellerProfiles));
        }
        if (data.settings) {
          if (data.settings.logo) {
            localStorage.setItem('companyLogo', data.settings.logo);
          }
          if (data.settings.pdfSettings) {
            localStorage.setItem('pdfSettings', JSON.stringify(data.settings.pdfSettings));
          }
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

