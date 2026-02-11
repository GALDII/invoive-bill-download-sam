import React from 'react';
import Button from './ui/Button';
import { Trash2, Plus } from 'lucide-react';

const ItemsTable = ({ items, onUpdate, onAdd, onRemove }) => {

    const handleChange = (index, field, value) => {
        const newItems = [...items];
        const numericFields = ['quantity', 'rate', 'gstRate'];

        if (numericFields.includes(field)) {
            if (value === '' || value === null) {
                newItems[index][field] = '';
            } else {
                const n = Number(value);
                newItems[index][field] = Number.isNaN(n) ? 0 : n;
            }
        } else {
            newItems[index][field] = value;
        }
        onUpdate(newItems);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <span>📦</span> Invoice Items
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-slate-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <th className="p-4 min-w-[200px]">Item Description</th>
                            <th className="p-4 w-32">HSN/SAC</th>
                            <th className="p-4 w-24 text-center">Qty</th>
                            <th className="p-4 w-32 text-right">Rate (₹)</th>
                            <th className="p-4 w-24 text-center">GST %</th>
                            <th className="p-4 w-40 text-right">Total (₹)</th>
                            <th className="p-4 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {items.map((item, index) => {
                            const taxableValue = ((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0));
                            const gstAmount = taxableValue * ((parseFloat(item.gstRate) || 0) / 100);
                            const total = taxableValue + gstAmount;

                            return (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => handleChange(index, 'description', e.target.value)}
                                            placeholder="Item name"
                                            className="w-full p-2 bg-transparent text-gray-900 dark:text-gray-100 rounded border border-transparent hover:border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            value={item.hsn}
                                            onChange={(e) => handleChange(index, 'hsn', e.target.value)}
                                            placeholder="HSN"
                                            className="w-full p-2 font-mono text-sm bg-transparent text-gray-900 dark:text-gray-100 rounded border border-transparent hover:border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                                            min="0"
                                            className="w-full p-2 text-center bg-transparent text-gray-900 dark:text-gray-100 rounded border border-transparent hover:border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={item.rate}
                                            onChange={(e) => handleChange(index, 'rate', e.target.value)}
                                            min="0"
                                            step="0.01"
                                            className="w-full p-2 text-right bg-transparent text-gray-900 dark:text-gray-100 rounded border border-transparent hover:border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            value={item.gstRate}
                                            onChange={(e) => handleChange(index, 'gstRate', e.target.value)}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="w-full p-2 text-center bg-transparent text-gray-900 dark:text-gray-100 rounded border border-transparent hover:border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                                        />
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-700 dark:text-emerald-400">
                                        ₹{total.toFixed(2)}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => onRemove(index)}
                                            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                            title="Remove Item"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30">
                <Button onClick={onAdd} variant="secondary" className="w-full sm:w-auto">
                    <Plus size={18} /> Add Item
                </Button>
            </div>
        </div>
    );
};

export default ItemsTable;
