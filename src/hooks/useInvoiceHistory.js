import { useState, useEffect } from 'react';
import { generateInvoiceNumber } from '../utils/invoice';

export const useInvoiceHistory = () => {
  const [invoices, setInvoices] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('invoiceHistory') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('invoiceHistory', JSON.stringify(invoices));
  }, [invoices]);

  const saveInvoice = (invoiceData) => {
    const newInvoice = {
      ...invoiceData,
      id: invoiceData.id || Date.now(),
      savedAt: invoiceData.savedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const existingIndex = invoices.findIndex(inv => inv.id === newInvoice.id);
    
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...invoices];
      updated[existingIndex] = newInvoice;
      setInvoices(updated);
    } else {
      // Add new
      setInvoices([newInvoice, ...invoices]);
    }
    
    return newInvoice.id;
  };

  const loadInvoice = (id) => {
    return invoices.find(inv => inv.id === id);
  };

  const deleteInvoice = (id) => {
    setInvoices(invoices.filter(inv => inv.id !== id));
  };

  const duplicateInvoice = (id) => {
    const invoice = loadInvoice(id);
    if (invoice) {
      const duplicated = {
        ...invoice,
        id: Date.now(),
        invoiceDetails: {
          ...invoice.invoiceDetails,
          number: generateInvoiceNumber(),
          date: new Date().toISOString().split('T')[0],
        },
        savedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setInvoices([duplicated, ...invoices]);
      return duplicated;
    }
    return null;
  };

  const searchInvoices = (query) => {
    if (!query) return invoices;
    const lowerQuery = query.toLowerCase();
    return invoices.filter(inv => 
      inv.invoiceDetails?.number?.toLowerCase().includes(lowerQuery) ||
      inv.buyerDetails?.name?.toLowerCase().includes(lowerQuery) ||
      inv.sellerDetails?.name?.toLowerCase().includes(lowerQuery)
    );
  };

  const filterInvoices = (filters) => {
    let filtered = invoices;
    
    if (filters.status) {
      filtered = filtered.filter(inv => inv.status === filters.status);
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(inv => inv.invoiceDetails?.date >= filters.dateFrom);
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(inv => inv.invoiceDetails?.date <= filters.dateTo);
    }
    
    if (filters.customer) {
      filtered = filtered.filter(inv => inv.buyerDetails?.name === filters.customer);
    }
    
    return filtered;
  };

  const exportInvoices = () => {
    const dataStr = JSON.stringify(invoices, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importInvoices = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (Array.isArray(imported)) {
            setInvoices([...imported, ...invoices]);
            resolve(imported.length);
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const clearAllInvoices = () => {
    setInvoices([]);
  };

  return {
    invoices,
    saveInvoice,
    loadInvoice,
    deleteInvoice,
    duplicateInvoice,
    searchInvoices,
    filterInvoices,
    exportInvoices,
    importInvoices,
    clearAllInvoices,
  };
};

