import React, { useState } from 'react';
import { Search, FileText, Trash2, Copy, Edit, Download, Filter, X } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Modal from './ui/Modal';
import ConfirmDialog from './ui/ConfirmDialog';
import { formatCurrency } from '../utils/format';

const InvoiceHistory = ({ 
  invoices, 
  onLoadInvoice, 
  onDeleteInvoice, 
  onDuplicateInvoice,
  onExport,
  onImport,
  onSearch,
  onFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    customer: '',
  });

  const filteredInvoices = onSearch ? onSearch(searchQuery) : invoices;

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      // Search is handled by parent
    }
  };

  const handleFilter = () => {
    if (onFilter) {
      onFilter(filters);
    }
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setFilters({ status: '', dateFrom: '', dateTo: '', customer: '' });
    if (onFilter) {
      onFilter({});
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file && onImport) {
      onImport(file)
        .then(() => {
          setShowImportModal(false);
        })
        .catch((error) => {
          alert('Import failed: ' + error.message);
        });
    }
  };

  return (
    <>
      <Card title="Invoice History" icon={<FileText className="text-purple-500" />}>
        <div className="space-y-4">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowFilterModal(true)}>
                <Filter size={16} /> Filter
              </Button>
              <Button variant="secondary" onClick={() => setShowImportModal(true)}>
                <Download size={16} /> Import
              </Button>
              <Button variant="secondary" onClick={onExport}>
                <Download size={16} /> Export
              </Button>
            </div>
          </div>

          {/* Invoice List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No invoices found
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-purple-500 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {invoice.invoiceDetails?.number || 'N/A'}
                      </h4>
                      {invoice.status && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          invoice.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          invoice.status === 'Sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          invoice.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {invoice.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {invoice.buyerDetails?.name || 'Unknown Buyer'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{invoice.invoiceDetails?.date || 'N/A'}</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {formatCurrency(invoice.totals?.roundedGrandTotal || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => onLoadInvoice(invoice.id)}
                      title="Load Invoice"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => onDuplicateInvoice(invoice.id)}
                      title="Duplicate"
                    >
                      <Copy size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(invoice.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => {
          onDeleteInvoice(showDeleteConfirm);
          setShowDeleteConfirm(null);
        }}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Invoices"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Select a JSON file to import invoices.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg"
          />
        </div>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Invoices"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
            >
              <option value="">All</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={clearFilters} className="flex-1">
              <X size={16} /> Clear
            </Button>
            <Button onClick={handleFilter} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default InvoiceHistory;

