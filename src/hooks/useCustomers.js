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
        const newCustomer = { ...customer, name: customer.name.trim() };
        const updated = [...savedCustomers, newCustomer].sort((a, b) => a.name.localeCompare(b.name));
        setSavedCustomers(updated);
        return newCustomer;
    };

    const removeCustomer = (customerName) => {
        const updated = savedCustomers.filter(c => c.name !== customerName);
        setSavedCustomers(updated);
    };

    return { savedCustomers, addCustomer, removeCustomer };
};
