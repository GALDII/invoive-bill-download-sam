import { useState, useEffect } from 'react';

export const useTemplates = () => {
  const [templates, setTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('invoiceTemplates') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('invoiceTemplates', JSON.stringify(templates));
  }, [templates]);

  const saveTemplate = (templateData, name) => {
    const newTemplate = {
      id: Date.now(),
      name: name || `Template ${templates.length + 1}`,
      data: templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplates([...templates, newTemplate]);
    return newTemplate.id;
  };

  const loadTemplate = (id) => {
    return templates.find(t => t.id === id);
  };

  const deleteTemplate = (id) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const updateTemplate = (id, updates) => {
    setTemplates(templates.map(t => 
      t.id === id 
        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
        : t
    ));
  };

  return {
    templates,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    updateTemplate,
  };
};

