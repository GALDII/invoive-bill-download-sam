import React, { useState } from 'react';
import { Plus, Trash2, Edit, Tag } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Modal from './ui/Modal';
import InputGroup from './ui/InputGroup';

const ItemLibrary = ({ items, categories, onAdd, onUpdate, onDelete, onBulkDelete, onAddToInvoice }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    hsn: '',
    quantity: 1,
    rate: 0,
    gstRate: 5,
    category: '',
  });

  const filteredItems = selectedCategory 
    ? items.filter(item => item.category === selectedCategory)
    : items;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      onUpdate(editingItem.id, formData);
    } else {
      onAdd(formData);
    }
    setShowModal(false);
    setEditingItem(null);
    setFormData({ description: '', hsn: '', quantity: 1, rate: 0, gstRate: 5, category: '' });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      description: item.description || '',
      hsn: item.hsn || '',
      quantity: item.quantity || 1,
      rate: item.rate || 0,
      gstRate: item.gstRate || 5,
      category: item.category || '',
    });
    setShowModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      onBulkDelete(selectedItems);
      setSelectedItems([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  return (
    <>
      <Card title="Item Library" icon={<Tag className="text-green-500" />}>
        <div className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              {selectedItems.length > 0 && (
                <Button variant="danger" onClick={handleBulkDelete}>
                  <Trash2 size={16} /> Delete ({selectedItems.length})
                </Button>
              )}
              <Button onClick={() => {
                setEditingItem(null);
                setFormData({ description: '', hsn: '', quantity: 1, rate: 0, gstRate: 5, category: '' });
                setShowModal(true);
              }}>
                <Plus size={16} /> Add Item
              </Button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No items in library
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.description}
                        </h4>
                        {item.category && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        HSN: {item.hsn} | Rate: ₹{item.rate} | GST: {item.gstRate}%
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => onAddToInvoice(item)}
                      title="Add to Invoice"
                    >
                      <Plus size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleEdit(item)}
                      title="Edit"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => onDelete(item.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Item' : 'Add Item to Library'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputGroup
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <InputGroup
              label="HSN/SAC"
              value={formData.hsn}
              onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
            />
            <InputGroup
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Yarn, Fabric"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputGroup
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
            />
            <InputGroup
              label="Rate"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
            />
            <InputGroup
              label="GST %"
              type="number"
              step="0.01"
              value={formData.gstRate}
              onChange={(e) => setFormData({ ...formData, gstRate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ItemLibrary;

