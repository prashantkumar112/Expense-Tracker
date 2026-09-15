import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Check,
  Calendar,
  CreditCard,
  Tag,
  AlignLeft,
  Repeat,
} from 'lucide-react';
import { Category, PaymentMethod, Transaction, TransactionType } from '../types';
import { CurrencyConfig } from '../utils/storage';
import { CategoryIcon } from './CategoryIcon';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currency: CurrencyConfig;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  onSave: (tx: Partial<Transaction>) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  currency,
  initialType = 'expense',
  editingTransaction,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10)); // Actual transaction date
  const [createdDate, setCreatedDate] = useState<string>(new Date().toISOString().substring(0, 10)); // Date transaction was created
  const [transactionMonth, setTransactionMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // Cash flow month
  const [autoSyncMonth, setAutoSyncMonth] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [excludeFromCashflow, setExcludeFromCashflow] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Populate when editing or switching
  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.categoryId);
      setDescription(editingTransaction.description || '');
      const txDate = editingTransaction.date || today;
      setDate(txDate);
      const cDate = editingTransaction.createdDate || (editingTransaction.createdAt ? new Date(editingTransaction.createdAt).toISOString().substring(0, 10) : today);
      setCreatedDate(cDate);
      const txMonth = editingTransaction.transactionMonth || txDate.substring(0, 7);
      setTransactionMonth(txMonth);
      setAutoSyncMonth(txMonth === txDate.substring(0, 7));
      setPaymentMethod(editingTransaction.paymentMethod || 'UPI');
      setExcludeFromCashflow(
        editingTransaction.excludeFromCashflow !== undefined
          ? !!editingTransaction.excludeFromCashflow
          : editingTransaction.paymentMethod === 'Credit Card'
      );
      setNotes(editingTransaction.notes || '');
      setIsRecurring(!!editingTransaction.isRecurring);
    } else {
      setType(initialType);
      setAmount('');
      setDescription('');
      setDate(today);
      setCreatedDate(today);
      setTransactionMonth(today.substring(0, 7));
      setAutoSyncMonth(true);
      setPaymentMethod('UPI');
      setExcludeFromCashflow(false);
      setNotes('');
      setIsRecurring(false);
      // Select first category matching type or first category
      const matched = categories.filter((c) => c.type === initialType);
      if (matched.length > 0) {
        setCategoryId(matched[0].id);
      } else if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
    setCategorySearch('');
    setError('');
  }, [isOpen, editingTransaction, initialType, categories]);

  // When actual transaction date changes, auto-update transaction month if autoSyncMonth is true
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (autoSyncMonth && newDate) {
      setTransactionMonth(newDate.substring(0, 7));
    }
  };

  // When payment method changes to Credit Card, suggest excluding from immediate cashflow
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'Credit Card' && type === 'expense') {
      setExcludeFromCashflow(true);
    } else if (method !== 'Credit Card') {
      setExcludeFromCashflow(false);
    }
  };

  // When type changes, ensure valid category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const matched = categories.filter((c) => c.type === newType);
    if (matched.length > 0 && !matched.some((c) => c.id === categoryId)) {
      setCategoryId(matched[0].id);
    } else if (categories.length > 0 && !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id);
    }
  };

  const hasTypedCategories = categories.some((c) => c.type === type);
  const baseCategories = hasTypedCategories ? categories.filter((c) => c.type === type) : categories;
  const filteredCategories = categorySearch.trim()
    ? baseCategories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase().trim()))
    : baseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId) || filteredCategories[0];
    if (!selectedCat) {
      setError('Please select a valid category.');
      return;
    }

    onSave({
      id: editingTransaction ? editingTransaction.id : undefined,
      type,
      amount: numAmount,
      categoryId: selectedCat.id,
      categoryName: selectedCat.name,
      description: description.trim() || selectedCat.name,
      date,
      createdDate: createdDate || new Date().toISOString().substring(0, 10),
      transactionMonth: transactionMonth || date.substring(0, 7),
      paymentMethod,
      excludeFromCashflow: type === 'expense' && paymentMethod === 'Credit Card' ? excludeFromCashflow : false,
      notes: notes.trim(),
      isRecurring,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              {editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Type Toggle Tabs */}
        <div className="p-4 pb-2">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Income (+)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Amount Field (Hero style) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Amount ({currency.symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                {currency.symbol}
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 text-2xl font-bold text-slate-900 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                autoFocus
              />
            </div>
          </div>

          {/* Category Chips Grid */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select Category ({filteredCategories.length})
              </label>
              {baseCategories.length > 8 && (
                <div className="relative w-36">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search category..."
                    className="w-full bg-slate-50 text-[11px] pl-2 pr-5 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  {categorySearch && (
                    <button
                      type="button"
                      onClick={() => setCategorySearch('')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-indigo-600 ring-1 ring-indigo-500 shadow-xs'
                        : 'bg-white/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CategoryIcon iconName={cat.icon} color={cat.color} size={15} />
                    <span className="text-[11px] font-semibold text-slate-700 truncate flex-1">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
              {filteredCategories.length === 0 && (
                <div className="col-span-full py-4 text-center text-xs text-slate-400">
                  No category matches &quot;{categorySearch}&quot;
                </div>
              )}
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  Transaction Date <span className="text-slate-400 font-normal">(Actual)</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleDateChange(new Date().toISOString().substring(0, 10))}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold px-1 py-0.5 rounded hover:bg-indigo-50 transition-colors"
                  >
                    Today
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                      const ym = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
                      handleDateChange(ym);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold px-1 py-0.5 rounded hover:bg-indigo-50 transition-colors"
                  >
                    Next Month
                  </button>
                </div>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
                  title="Actual date of transaction (matches bank statement)"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Used to match with your bank statement.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Payment Method
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <select
                  value={paymentMethod}
                  onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Net Banking">Net Banking (NEFT/IMPS)</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Auto-Debit">Auto-Debit / Mandate</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Created Date & Transaction Month for Cash Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  Created Date
                </label>
                <span className="text-[9px] text-slate-400">Logged on</span>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="date"
                  value={createdDate}
                  onChange={(e) => setCreatedDate(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                  title="Date when transaction was created in app"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">
                {date === createdDate ? 'Same as transaction date' : 'Logged historical record'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  Transaction Month <span className="text-indigo-600 font-semibold">(Cash Flow)</span>
                </label>
                {date.substring(0, 7) !== transactionMonth && (
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionMonth(date.substring(0, 7));
                      setAutoSyncMonth(true);
                    }}
                    className="text-[9px] text-indigo-600 hover:underline font-semibold"
                  >
                    Sync to date
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="month"
                  value={transactionMonth}
                  onChange={(e) => {
                    setTransactionMonth(e.target.value);
                    setAutoSyncMonth(false);
                  }}
                  className="w-full bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                  title="Month used to calculate monthly cash flow"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Used to calculate monthly cash flow.</p>
            </div>
          </div>

          {/* Credit Card Cashflow Mode Toggle */}
          {type === 'expense' && paymentMethod === 'Credit Card' && (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
              <input
                id="excludeFromCashflow"
                type="checkbox"
                checked={excludeFromCashflow}
                onChange={(e) => setExcludeFromCashflow(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-amber-300 cursor-pointer"
              />
              <label htmlFor="excludeFromCashflow" className="text-xs cursor-pointer">
                <span className="font-bold text-amber-900 block">Defer Cashflow until Bill Payment</span>
                <span className="text-[11px] text-amber-700 block mt-0.5 leading-relaxed">
                  Track in category budget & analytics now, but don&apos;t deduct from bank cashflow until the credit card bill is settled next month.
                </span>
              </label>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Description / Payee
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. HDFC Home Loan, Swiggy Dinner, Groceries"
                className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Recurring & Notes */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Repeat size={15} className="text-indigo-600" />
              <div>
                <div className="text-xs font-semibold text-slate-800">Recurring Payment</div>
                <div className="text-[10px] text-slate-500">Regular monthly commitment</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300 cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{editingTransaction ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
