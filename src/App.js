import React, { useState, useMemo, useEffect } from 'react';
import { Sun, Moon, RefreshCw, FileText, UserPlus, Users, Trash2, ChevronDown } from 'lucide-react';
import SellerDetails from './components/SellerDetails';
import BuyerDetails from './components/BuyerDetails';
import ItemsTable from './components/ItemsTable';
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import InputGroup from './components/ui/InputGroup';
import { generateInvoiceNumber, calculateTotals } from './utils/invoice';
import { convertAmountToWords, formatCurrency } from './utils/format';
import { generatePDF } from './utils/pdfGenerator';
import { useCustomers } from './hooks/useCustomers';
import { defaultSeller, defaultBuyer } from './utils/constants';

function App() {
  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- Form States ---
  const [sellerDetails, setSellerDetails] = useState(defaultSeller);
  const [buyerDetails, setBuyerDetails] = useState({
    name: '', address: '', gstin: '', state: '', stateCode: ''
  });

  const [invoiceDetails, setInvoiceDetails] = useState({
    number: generateInvoiceNumber(),
    date: new Date().toISOString().split('T')[0],
    reverseCharge: 'NO',
  });

  const [items, setItems] = useState([
    { description: '2/60polyester yarn', hsn: '55092200', quantity: 60, rate: 230.0, gstRate: 5 },
  ]);

  // --- Hooks ---
  const { savedCustomers, addCustomer, removeCustomer } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isBuyerEditable, setIsBuyerEditable] = useState(true);

  // --- Effects ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Handlers ---
  const handleItemUpdate = (newItems) => {
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', hsn: '', quantity: 1, rate: 0, gstRate: 5 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // --- Customer Handlers ---
  const handleCustomerSelect = (e) => {
    const customerName = e.target.value;
    setSelectedCustomer(customerName);

    if (customerName === "") {
      setBuyerDetails({ name: '', address: '', gstin: '', state: '', stateCode: '' });
      setIsBuyerEditable(true);
    } else {
      const customer = savedCustomers.find(c => c.name === customerName);
      if (customer) {
        setBuyerDetails(customer);
        setIsBuyerEditable(false);
      }
    }
  };

  const handleAddNewCustomer = () => {
    setSelectedCustomer('');
    setBuyerDetails({ name: '', address: '', gstin: '', state: '', stateCode: '' });
    setIsBuyerEditable(true);
  };

  const handleSaveCustomer = () => {
    if (!buyerDetails.name.trim()) return;
    try {
      const newCustomer = addCustomer(buyerDetails);
      setSelectedCustomer(newCustomer.name);
      setIsBuyerEditable(false);
      alert('Customer saved successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    if (window.confirm(`Are you sure you want to delete ${selectedCustomer}?`)) {
      removeCustomer(selectedCustomer);
      handleAddNewCustomer();
    }
  };

  // --- Computed ---
  const totals = useMemo(() => calculateTotals(items), [items]);

  const handleGeneratePDF = () => {
    // Validation: Check if buyer details are filled
    if (!buyerDetails.name || !buyerDetails.address || !buyerDetails.gstin || !buyerDetails.state) {
      alert("Please fill in all Buyer Details (Name, Address, GSTIN, State) before generating the PDF.");
      return;
    }
    generatePDF(invoiceDetails, sellerDetails, buyerDetails, items, totals);
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

          <div className="flex items-center gap-6">
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
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, number: e.target.value })}
                  className="flex-1 p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-lg font-mono font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder="INV-001"
                />
                <Button
                  onClick={() => setInvoiceDetails({ ...invoiceDetails, number: generateInvoiceNumber() })}
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
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, date: e.target.value })}
              />
            </div>
          </div>
        </Card>

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
            onChange={setSellerDetails}
            placeholder={defaultSeller}
          />
          <BuyerDetails
            details={buyerDetails}
            onChange={setBuyerDetails}
            placeholder={defaultBuyer}
            readOnly={!isBuyerEditable}
            onSaveCustomer={handleSaveCustomer}
            canSave={isBuyerEditable}
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
                className="w-full sm:w-auto py-3 px-6 text-base"
              >
                <FileText size={20} /> Generate PDF Invoice
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
      </main>
    </div>
  );
}

export default App;