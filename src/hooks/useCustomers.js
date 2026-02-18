import { useState, useEffect } from 'react';

export const useCustomers = () => {
    const [savedCustomers, setSavedCustomers] = useState(() => {
        try {
            const localData = localStorage.getItem('invoiceAppCustomers');
            return localData ? JSON.parse(localData) : [];
        } catch (e) {
            console.error("Failed to load customers", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('invoiceAppCustomers', JSON.stringify(savedCustomers));
    }, [savedCustomers]);

    const addCustomer = (customer) => {
        if (savedCustomers.find(c => c.name.toLowerCase() === customer.name.trim().toLowerCase())) {
            throw new Error('Customer with this name already exists.');
        }
        const newCustomer = { 
            ...customer, 
            name: customer.name.trim(),
            id: customer.id || Date.now(),
            tags: customer.tags || [],
            createdAt: customer.createdAt || new Date().toISOString(),
        };
        const updated = [...savedCustomers, newCustomer].sort((a, b) => a.name.localeCompare(b.name));
        setSavedCustomers(updated);
        return newCustomer;
    };

    const updateCustomer = (customerName, updates) => {
        const updated = savedCustomers.map(c => 
            c.name === customerName 
                ? { ...c, ...updates, updatedAt: new Date().toISOString() }
                : c
        );
        setSavedCustomers(updated);
    };

    const removeCustomer = (customerName) => {
        const updated = savedCustomers.filter(c => c.name !== customerName);
        setSavedCustomers(updated);
    };

    const searchCustomers = (query) => {
        if (!query) return savedCustomers;
        const lowerQuery = query.toLowerCase();
        return savedCustomers.filter(c => 
            c.name.toLowerCase().includes(lowerQuery) ||
            c.gstin?.toLowerCase().includes(lowerQuery) ||
            c.address?.toLowerCase().includes(lowerQuery) ||
            c.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    };

    const filterCustomersByTag = (tag) => {
        if (!tag) return savedCustomers;
        return savedCustomers.filter(c => c.tags?.includes(tag));
    };

    const getAllTags = () => {
        const tags = new Set();
        savedCustomers.forEach(c => {
            c.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    };

    const getCustomerStatistics = (invoices) => {
        const stats = {};
        savedCustomers.forEach(customer => {
            const customerInvoices = invoices.filter(inv => 
                inv.buyerDetails?.name === customer.name
            );
            const totalAmount = customerInvoices.reduce((sum, inv) => 
                sum + (inv.totals?.roundedGrandTotal || 0), 0
            );
            
            stats[customer.name] = {
                invoiceCount: customerInvoices.length,
                totalAmount,
                averageAmount: customerInvoices.length > 0 ? totalAmount / customerInvoices.length : 0,
            };
        });
        return stats;
    };

    const exportCustomers = () => {
        const dataStr = JSON.stringify(savedCustomers, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `customers-backup-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const importCustomers = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (Array.isArray(imported)) {
                        setSavedCustomers([...imported, ...savedCustomers]);
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

    return { 
        savedCustomers, 
        addCustomer, 
        updateCustomer,
        removeCustomer,
        searchCustomers,
        filterCustomersByTag,
        getAllTags,
        getCustomerStatistics,
        exportCustomers,
        importCustomers,
    };
};
