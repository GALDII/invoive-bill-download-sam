/**
 * Calculate invoice statistics
 */
export const calculateInvoiceStatistics = (invoices) => {
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => {
    return sum + (inv.totals?.roundedGrandTotal || 0);
  }, 0);
  
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const monthlyInvoices = invoices.filter(inv => {
    if (!inv.invoiceDetails?.date) return false;
    const invDate = new Date(inv.invoiceDetails.date);
    return invDate.getMonth() === thisMonth && invDate.getFullYear() === thisYear;
  });
  
  const monthlyTotal = monthlyInvoices.reduce((sum, inv) => {
    return sum + (inv.totals?.roundedGrandTotal || 0);
  }, 0);

  const totalTax = invoices.reduce((sum, inv) => {
    return sum + (inv.totals?.totalTax || 0);
  }, 0);

  const totalCgst = invoices.reduce((sum, inv) => {
    return sum + (inv.totals?.totalCgst || 0);
  }, 0);

  const totalSgst = invoices.reduce((sum, inv) => {
    return sum + (inv.totals?.totalSgst || 0);
  }, 0);

  // Status breakdown
  const statusCounts = invoices.reduce((acc, inv) => {
    const status = inv.status || 'Draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Monthly breakdown (last 12 months)
  const monthlyBreakdown = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(thisYear, thisMonth - i, 1);
    const monthInvoices = invoices.filter(inv => {
      if (!inv.invoiceDetails?.date) return false;
      const invDate = new Date(inv.invoiceDetails.date);
      return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear();
    });
    const monthTotal = monthInvoices.reduce((sum, inv) => 
      sum + (inv.totals?.roundedGrandTotal || 0), 0
    );
    monthlyBreakdown.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count: monthInvoices.length,
      total: monthTotal,
    });
  }

  return {
    totalInvoices,
    totalAmount,
    monthlyInvoices: monthlyInvoices.length,
    monthlyTotal,
    totalTax,
    totalCgst,
    totalSgst,
    averageInvoice: totalInvoices > 0 ? totalAmount / totalInvoices : 0,
    statusCounts,
    monthlyBreakdown,
  };
};

/**
 * Calculate customer statistics
 */
export const calculateCustomerStatistics = (customers, invoices) => {
  return customers.map(customer => {
    const customerInvoices = invoices.filter(inv => 
      inv.buyerDetails?.name === customer.name
    );
    const totalAmount = customerInvoices.reduce((sum, inv) => 
      sum + (inv.totals?.roundedGrandTotal || 0), 0
    );
    
    return {
      ...customer,
      invoiceCount: customerInvoices.length,
      totalAmount,
      averageAmount: customerInvoices.length > 0 ? totalAmount / customerInvoices.length : 0,
      lastInvoiceDate: customerInvoices.length > 0 
        ? customerInvoices.sort((a, b) => 
            new Date(b.invoiceDetails?.date || 0) - new Date(a.invoiceDetails?.date || 0)
          )[0].invoiceDetails?.date
        : null,
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);
};

