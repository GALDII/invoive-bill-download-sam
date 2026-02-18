import { useState, useEffect } from 'react';

export const useItemLibrary = () => {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('itemLibrary') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('itemLibrary', JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    const newItem = {
      ...item,
      id: item.id || Date.now(),
      createdAt: new Date().toISOString(),
    };
    setItems([...items, newItem]);
    return newItem.id;
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, updatedItem) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, ...updatedItem, updatedAt: new Date().toISOString() }
        : item
    ));
  };

  const getItemsByCategory = (category) => {
    if (!category) return items;
    return items.filter(item => item.category === category);
  };

  const getCategories = () => {
    const categories = new Set(items.map(item => item.category).filter(Boolean));
    return Array.from(categories);
  };

  const bulkDelete = (ids) => {
    setItems(items.filter(item => !ids.includes(item.id)));
  };

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    getItemsByCategory,
    getCategories,
    bulkDelete,
  };
};

