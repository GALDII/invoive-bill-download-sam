import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Sun, Moon, RefreshCw, FileText, UserPlus, Users, Trash2, ChevronDown, Save, History, Settings, Printer, Undo, Redo } from 'lucide-react';
import SellerDetails from './components/SellerDetails';
import BuyerDetails from './components/BuyerDetails';
import ItemsTable from './components/ItemsTable';
import InvoiceHistory from './components/InvoiceHistory';
import ItemLibrary from './components/ItemLibrary';
import TemplateManager from './components/TemplateManager';
import DataManagement from './components/DataManagement';
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import InputGroup from './components/ui/InputGroup';
import Modal from './components/ui/Modal';
import { ToastProvider, useToast } from './components/ui/Toast';
import { generateInvoiceNumber, calculateTotals } from './utils/invoice';
import { convertAmountToWords, formatCurrency } from './utils/format';
import { generatePDF, printInvoice } from './utils/pdfGenerator';
import { useCustomers } from './hooks/useCustomers';
import { useInvoiceHistory } from './hooks/useInvoiceHistory';
import { useTemplates } from './hooks/useTemplates';
import { useItemLibrary } from './hooks/useItemLibrary';
import { useAutoSave } from './hooks/useAutoSave';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { validateInvoice } from './utils/validation';
import { exportInvoicesToCSV, exportToExcel } from './utils/export';
import { saveLogo, getLogo } from './utils/imageUtils';
import { defaultSeller, defaultBuyer } from './utils/constants';

function AppContent() {
  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentInvoiceId, setCurrentInvoiceId] = useState(null);

  // --- Form States ---
  const initialInvoiceState = {
    sellerDetails: defaultSeller,
    buyerDetails: { name: '', address: '', gstin: '', state: '', stateCode: '' },
    invoiceDetails: {
      number: generateInvoiceNumber(),
      date: new Date().toISOString().split('T')[0],
      reverseCharge: 'NO',
    },
    items: [{ description: '2/60polyester yarn', hsn: '55092200', quantity: 60, rate: 230.0, gstRate: 5 }],
    status: 'Draft',
  };

  const { state: invoiceState, setState: setInvoiceState, undo, redo, canUndo, canRedo } = useUndoRedo(initialInvoiceState);

  const { sellerDetails, buyerDetails, invoiceDetails, items } = invoiceState;

  // --- Hooks ---
  const { 
    savedCustomers, 
    addCustomer, 
    removeCustomer,
  } = useCustomers();
  
  const {
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
  } = useInvoiceHistory();

  const { templates, saveTemplate, loadTemplate, deleteTemplate } = useTemplates();
  const { items: libraryItems, addItem, removeItem, updateItem, getCategories, bulkDelete } = useItemLibrary();

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isBuyerEditable, setIsBuyerEditable] = useState(true);
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);
  const [pdfSettings, setPdfSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pdfSettings') || '{}');
    } catch {
      return {};
    }
  });

  // Auto-save draft
  useAutoSave(invoiceState, (data) => {
    if (currentInvoiceId) {
      saveInvoice({
        ...data,
        id: currentInvoiceId,
        totals: calculateTotals(data.items),
      });
    }
  }, 3000);

  // --- Effects ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setFilteredInvoices(searchQuery ? searchInvoices(searchQuery) : invoices);
  }, [searchQuery, invoices, searchInvoices]);

  useEffect(() => {
    localStorage.setItem('pdfSettings', JSON.stringify(pdfSettings));
  }, [pdfSettings]);

  // --- Keyboard Shortcuts ---
  useKeyboardShortcuts([
    { key: 's', ctrl: true, action: () => handleSaveInvoice() },
    { key: 'p', ctrl: true, action: () => handleGeneratePDF() },
    { key: 'n', ctrl: true, action: () => handleNewInvoice() },
    { key: 'h', ctrl: true, action: () => setShowHistory(!showHistory) },
    { key: 'z', ctrl: true, shift: false, action: () => undo() },
    { key: 'z', ctrl: true, shift: true, action: () => redo() },
  ]);

  // --- Handlers ---
  const handleItemUpdate = useCallback((newItems) => {
    setInvoiceState({ ...invoiceState, items: newItems });
  }, [invoiceState, setInvoiceState]);

  const handleAddItem = useCallback(() => {
    setInvoiceState({
      ...invoiceState,
      items: [...invoiceState.items, { description: '', hsn: '', quantity: 1, rate: 0, gstRate: 5 }]
    });
  }, [invoiceState, setInvoiceState]);

  const handleRemoveItem = useCallback((index) => {
    setInvoiceState({
      ...invoiceState,
      items: invoiceState.items.filter((_, i) => i !== index)
    });
  }, [invoiceState, setInvoiceState]);

  const handleAddItemFromLibrary = useCallback((item) => {
    setInvoiceState({
      ...invoiceState,
      items: [...invoiceState.items, { ...item, id: undefined }]
    });
    showToast('Item added from library', 'success');
  }, [invoiceState, setInvoiceState, showToast]);

  // --- Customer Handlers ---
  const handleCustomerSelect = (e) => {
    const customerName = e.target.value;
    setSelectedCustomer(customerName);

    if (customerName === "") {
      setInvoiceState({ ...invoiceState, buyerDetails: { name: '', address: '', gstin: '', state: '', stateCode: '' } });
      setIsBuyerEditable(true);
    } else {
      const customer = savedCustomers.find(c => c.name === customerName);
      if (customer) {
        setInvoiceState({ ...invoiceState, buyerDetails: customer });
        setIsBuyerEditable(true);
      }
    }
  };

  const handleAddNewCustomer = () => {
    setSelectedCustomer('');
    setInvoiceState({ ...invoiceState, buyerDetails: { name: '', address: '', gstin: '', state: '', stateCode: '' } });
    setIsBuyerEditable(true);
  };

  const handleSaveCustomer = () => {
    if (!buyerDetails.name.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }
    try {
      const newCustomer = addCustomer(buyerDetails);
      setSelectedCustomer(newCustomer.name);
      setIsBuyerEditable(false);
      showToast('Customer saved successfully!', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    if (window.confirm(`Are you sure you want to delete ${selectedCustomer}?`)) {
      removeCustomer(selectedCustomer);
      handleAddNewCustomer();
      showToast('Customer deleted', 'success');
    }
  };

  // --- Invoice Handlers ---
  const handleNewInvoice = () => {
    setInvoiceState(initialInvoiceState);
    setCurrentInvoiceId(null);
    setSelectedCustomer('');
    showToast('New invoice created', 'success');
  };

  const handleSaveInvoice = () => {
    const validation = validateInvoice(invoiceState);
    if (!validation.valid) {
      showToast('Please fix validation errors', 'error');
      return;
    }

    const invoiceData = {
      ...invoiceState,
      totals: calculateTotals(items),
    };

    const id = saveInvoice(invoiceData);
    setCurrentInvoiceId(id);
    showToast('Invoice saved successfully!', 'success');
  };

  const handleLoadInvoice = (id) => {
    const invoice = loadInvoice(id);
    if (invoice) {
      setInvoiceState({
        sellerDetails: invoice.sellerDetails || defaultSeller,
        buyerDetails: invoice.buyerDetails || { name: '', address: '', gstin: '', state: '', stateCode: '' },
        invoiceDetails: invoice.invoiceDetails || invoiceDetails,
        items: invoice.items || [],
        status: invoice.status || 'Draft',
      });
      setCurrentInvoiceId(id);
      setShowHistory(false);
      showToast('Invoice loaded', 'success');
    }
  };

  const handleDuplicateInvoice = (id) => {
    const duplicated = duplicateInvoice(id);
    if (duplicated) {
      handleLoadInvoice(duplicated.id);
      showToast('Invoice duplicated', 'success');
    }
  };

  // --- Computed ---
  const totals = useMemo(() => calculateTotals(items), [items]);

  const handleGeneratePDF = async () => {
    const validation = validateInvoice(invoiceState);
    if (!validation.valid) {
      showToast('Please fix validation errors before generating PDF', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await generatePDF(invoiceDetails, sellerDetails, buyerDetails, items, totals, {
        showLogo: pdfSettings.showLogo !== false,
      });
      showToast('PDF generated successfully!', 'success');
    } catch (error) {
      showToast('Error generating PDF: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    const validation = validateInvoice(invoiceState);
    if (!validation.valid) {
      showToast('Please fix validation errors before printing', 'error');
      return;
    }
    printInvoice(invoiceDetails, sellerDetails, buyerDetails, items, totals);
  };

  const handleSaveTemplate = (name) => {
    saveTemplate(invoiceState, name);
    showToast('Template saved', 'success');
  };

  const handleLoadTemplate = (id) => {
    const template = loadTemplate(id);
    if (template) {
      setInvoiceState(template.data);
      showToast('Template applied', 'success');
    }
  };

  const handleExportCSV = () => {
    try {
      exportInvoicesToCSV(invoices);
      showToast('Invoices exported to CSV', 'success');
    } catch (error) {
      showToast('Export failed: ' + error.message, 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      const csvData = invoices.map(inv => ({
        'Invoice Number': inv.invoiceDetails?.number || '',
        'Date': inv.invoiceDetails?.date || '',
        'Buyer Name': inv.buyerDetails?.name || '',
        'Buyer GSTIN': inv.buyerDetails?.gstin || '',
        'Subtotal': inv.totals?.subtotal || 0,
        'CGST': inv.totals?.totalCgst || 0,
        'SGST': inv.totals?.totalSgst || 0,
        'Grand Total': inv.totals?.roundedGrandTotal || 0,
        'Status': inv.status || 'Draft',
      }));
      await exportToExcel(csvData, 'invoices', 'Invoices');
      showToast('Invoices exported to Excel', 'success');
    } catch (error) {
      showToast('Export failed: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await saveLogo(file);
        showToast('Logo uploaded successfully', 'success');
      } catch (error) {
        showToast('Logo upload failed: ' + error.message, 'error');
      }
    }
  };

  const handleClearAllData = () => {
    clearAllInvoices();
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'} font-sans pb-20`}>

      {/* Top Bar */}
      <div className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-extrabold text-lg md:text-xl shadow-lg shadow-orange-500/20">
              I
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight">Invoices</h1>
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">Create & Manage</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowHistory(!showHistory)} title="Invoice History (Ctrl+H)">
              <History size={18} />
            </Button>
            <Button variant="ghost" onClick={() => setShowSettings(!showSettings)} title="Settings">
              <Settings size={18} />
            </Button>
            <span className="hidden md:block text-sm font-semibold text-gray-700 dark:text-gray-200">
              {sellerDetails.name}
            </span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
              VR
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 bg-gray-200 dark:bg-slate-700"
              role="switch"
              aria-checked={isDarkMode}
            >
              <span className="sr-only">Use setting</span>
              <span
                aria-hidden="true"
                className={`${isDarkMode ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center`}
              >
                {isDarkMode ? <Moon size={12} className="text-slate-900" /> : <Sun size={12} className="text-orange-500" />}
              </span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* History Sidebar */}
        {showHistory && (
          <div className="mb-8">
            <InvoiceHistory
              invoices={filteredInvoices}
              onLoadInvoice={handleLoadInvoice}
              onDeleteInvoice={(id) => {
                deleteInvoice(id);
                if (currentInvoiceId === id) {
                  handleNewInvoice();
                }
                showToast('Invoice deleted', 'success');
              }}
              onDuplicateInvoice={handleDuplicateInvoice}
              onExport={exportInvoices}
              onImport={importInvoices}
              onSearch={setSearchQuery}
              onFilter={(filters) => setFilteredInvoices(filterInvoices(filters))}
            />
          </div>
        )}

        {/* Settings Modal */}
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings" size="lg">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">PDF Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pdfSettings.showLogo !== false}
                    onChange={(e) => setPdfSettings({ ...pdfSettings, showLogo: e.target.checked })}
                    className="rounded"
                  />
                  <span>Show Logo in PDF</span>
                </label>
                <div>
                  <label className="block text-sm font-medium mb-1">Margin (mm)</label>
                  <input
                    type="number"
                    value={pdfSettings.margin || 14}
                    onChange={(e) => setPdfSettings({ ...pdfSettings, margin: parseInt(e.target.value) || 14 })}
                    className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg"
                    min="5"
                    max="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Font Size</label>
                  <input
                    type="number"
                    value={pdfSettings.fontSize || 9}
                    onChange={(e) => setPdfSettings({ ...pdfSettings, fontSize: parseInt(e.target.value) || 9 })}
                    className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg"
                    min="6"
                    max="12"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Company Logo</h3>
              {getLogo() && (
                <div className="mb-3">
                  <img src={getLogo()} alt="Logo" className="max-w-32 max-h-16 mb-2" />
                  <Button variant="danger" onClick={() => {
                    localStorage.removeItem('companyLogo');
                    showToast('Logo removed', 'success');
                  }}>
                    Remove Logo
                  </Button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>
        </Modal>

        {/* Quick Actions */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button onClick={handleNewInvoice} variant="secondary" title="New Invoice (Ctrl+N)">
            New Invoice
          </Button>
          <Button onClick={handleSaveInvoice} variant="secondary" title="Save (Ctrl+S)">
            <Save size={16} /> Save
          </Button>
          <Button onClick={undo} variant="secondary" disabled={!canUndo} title="Undo (Ctrl+Z)">
            <Undo size={16} />
          </Button>
          <Button onClick={redo} variant="secondary" disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
            <Redo size={16} />
          </Button>
          <Button onClick={handlePrintInvoice} variant="secondary" title="Print">
            <Printer size={16} /> Print
          </Button>
          <Button onClick={handleGeneratePDF} disabled={isLoading} title="Generate PDF (Ctrl+P)">
            {isLoading ? <div className="spinner" /> : <FileText size={16} />} Generate PDF
          </Button>
        </div>

        {/* Invoice Header Card */}
        <Card className="mb-8 border-l-4 border-l-purple-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Invoice Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invoiceDetails.number}
                  onChange={(e) => setInvoiceState({ ...invoiceState, invoiceDetails: { ...invoiceDetails, number: e.target.value } })}
                  className="flex-1 p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-lg font-mono font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder="INV-001"
                />
                <Button
                  onClick={() => setInvoiceState({ ...invoiceState, invoiceDetails: { ...invoiceDetails, number: generateInvoiceNumber() } })}
                  variant="secondary"
                  title="Generate New Number"
                >
                  <RefreshCw size={18} />
                </Button>
              </div>
            </div>
            <div>
              <InputGroup
                label="Invoice Date"
                type="date"
                value={invoiceDetails.date}
                onChange={(e) => setInvoiceState({ ...invoiceState, invoiceDetails: { ...invoiceDetails, date: e.target.value } })}
              />
            </div>
          </div>
        </Card>

        {/* Template Manager */}
        <div className="mb-8">
          <TemplateManager
            templates={templates}
            onSaveTemplate={handleSaveTemplate}
            onLoadTemplate={handleLoadTemplate}
            onDeleteTemplate={(id) => {
              deleteTemplate(id);
              showToast('Template deleted', 'success');
            }}
          />
        </div>

        {/* Customer Selection */}
        <Card className="mb-8 overflow-visible" title="Customer Management" icon={<Users className="text-blue-500" />}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <div className="relative">
                <select
                  value={selectedCustomer}
                  onChange={handleCustomerSelect}
                  className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-shadow duration-200 cursor-pointer"
                >
                  <option value="" className="text-gray-500">--- Select Existing Customer ---</option>
                  {savedCustomers.map((cust, index) => (
                    <option key={index} value={cust.name} className="py-2">{cust.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500 dark:text-gray-400">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button onClick={handleAddNewCustomer} variant="secondary" className="flex-1 whitespace-nowrap">
                <UserPlus size={16} /> New Customer
              </Button>
              <Button
                onClick={handleDeleteCustomer}
                variant="danger"
                disabled={!selectedCustomer}
                className="flex-1 whitespace-nowrap"
              >
                <Trash2 size={16} /> Delete
              </Button>
            </div>
          </div>
        </Card>

        {/* Two Columns for Seller/Buyer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SellerDetails
            details={sellerDetails}
            onChange={(details) => setInvoiceState({ ...invoiceState, sellerDetails: details })}
            placeholder={defaultSeller}
          />
          <BuyerDetails
            details={buyerDetails}
            onChange={(details) => setInvoiceState({ ...invoiceState, buyerDetails: details })}
            placeholder={defaultBuyer}
            readOnly={!isBuyerEditable}
            onSaveCustomer={handleSaveCustomer}
            canSave={isBuyerEditable}
          />
        </div>

        {/* Item Library */}
        <div className="mb-8">
          <ItemLibrary
            items={libraryItems}
            categories={getCategories()}
            onAdd={addItem}
            onUpdate={updateItem}
            onDelete={removeItem}
            onBulkDelete={bulkDelete}
            onAddToInvoice={handleAddItemFromLibrary}
          />
        </div>

        {/* Items Table */}
        <ItemsTable
          items={items}
          onUpdate={handleItemUpdate}
          onAdd={handleAddItem}
          onRemove={handleRemoveItem}
        />

        {/* Footer Actions & Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleGeneratePDF}
                disabled={isLoading}
                className="w-full sm:w-auto py-3 px-6 text-base"
              >
                {isLoading ? <div className="spinner" /> : <FileText size={20} />} Generate PDF Invoice
              </Button>
              <Button onClick={handlePrintInvoice} variant="secondary" className="w-full sm:w-auto py-3 px-6 text-base">
                <Printer size={20} /> Print Invoice
              </Button>
              <Button onClick={handleExportCSV} variant="secondary" className="w-full sm:w-auto py-3 px-6 text-base">
                Export CSV
              </Button>
              <Button onClick={handleExportExcel} variant="secondary" disabled={isLoading} className="w-full sm:w-auto py-3 px-6 text-base">
                {isLoading ? <div className="spinner" /> : 'Export Excel'}
              </Button>
            </div>

            {/* Amount in Words */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-6 rounded-xl">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Total In Words</h4>
              <p className="text-lg font-medium text-blue-900 dark:text-blue-100">
                {convertAmountToWords(totals.roundedGrandTotal)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm h-fit">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>CGST</span>
                <span>{formatCurrency(totals.totalCgst)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>SGST</span>
                <span>{formatCurrency(totals.totalSgst)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 pb-3 border-b border-dashed border-gray-200 dark:border-slate-700">
                <span>Round Off</span>
                <span>{totals.roundOffAmount >= 0 ? '+' : ''}{formatCurrency(totals.roundOffAmount)}</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="font-bold text-lg text-gray-800 dark:text-white">Grand Total</span>
                <span className="font-extrabold text-2xl text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-lg">
                  {formatCurrency(totals.roundedGrandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="mt-8">
          <DataManagement
            invoices={invoices}
            onClearAll={handleClearAllData}
            onImport={() => window.location.reload()}
          />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
