import React, { useState } from 'react';
import { Download, Upload, Trash2, BarChart3, Database } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Modal from './ui/Modal';
import ConfirmDialog from './ui/ConfirmDialog';
import { exportAllData, importAllData } from '../utils/export';
import { calculateInvoiceStatistics } from '../utils/statistics';
import { formatCurrency } from '../utils/format';

const DataManagement = ({ invoices, onClearAll, onImport }) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const stats = calculateInvoiceStatistics(invoices);

  const handleExport = () => {
    exportAllData();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      importAllData(file)
        .then(() => {
          setShowImportModal(false);
          if (onImport) {
            onImport();
          }
          alert('Data imported successfully! Please refresh the page.');
        })
        .catch((error) => {
          alert('Import failed: ' + error.message);
        });
    }
  };

  return (
    <>
      <Card title="Data Management" icon={<Database className="text-cyan-500" />}>
        <div className="space-y-3">
          <Button onClick={() => setShowStats(true)} variant="secondary" className="w-full">
            <BarChart3 size={16} /> View Statistics
          </Button>
          <Button onClick={handleExport} variant="secondary" className="w-full">
            <Download size={16} /> Export All Data
          </Button>
          <Button onClick={() => setShowImportModal(true)} variant="secondary" className="w-full">
            <Upload size={16} /> Import Data
          </Button>
          <Button onClick={() => setShowClearConfirm(true)} variant="danger" className="w-full">
            <Trash2 size={16} /> Clear All Data
          </Button>
        </div>
      </Card>

      {/* Statistics Modal */}
      <Modal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        title="Invoice Statistics"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Invoices</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.totalInvoices}
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400">Total Amount</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(stats.totalAmount)}
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400">This Month</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.monthlyInvoices} invoices
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                {formatCurrency(stats.monthlyTotal)}
              </div>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-sm text-orange-600 dark:text-orange-400">Average Invoice</div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatCurrency(stats.averageInvoice)}
              </div>
            </div>
          </div>

          {Object.keys(stats.statusCounts).length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Status Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(stats.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Data"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Select a JSON backup file to import. This will merge with existing data.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Note: After importing, please refresh the page to see the changes.
          </p>
        </div>
      </Modal>

      {/* Clear All Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          if (onClearAll) {
            onClearAll();
          }
          setShowClearConfirm(false);
        }}
        title="Clear All Data"
        message="Are you sure you want to clear all data? This will delete all invoices, customers, templates, and items. This action cannot be undone!"
        confirmText="Clear All"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

export default DataManagement;

