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
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [excludeFromCashflow, setExcludeFromCashflow] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Populate when editing or switching
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.categoryId);
      setDescription(editingTransaction.description || '');
      setDate(editingTransaction.date);
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
      setDate(new Date().toISOString().substring(0, 10));
      setPaymentMethod('UPI');
      setExcludeFromCashflow(false);
      setNotes('');
      setIsRecurring(false);
      // Select first category matching type
      const firstCat = categories.find((c) => c.type === initialType);
      if (firstCat) setCategoryId(firstCat.id);
    }
    setError('');
  }, [isOpen, editingTransaction, initialType, categories]);

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
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

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
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Category ({filteredCategories.length})
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-2 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                      isSelected
                        ? 'bg-white border-indigo-600 ring-1 ring-indigo-500 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CategoryIcon iconName={cat.icon} color={cat.color} size={16} />
                    <span className="text-[10px] font-semibold text-slate-700 truncate w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Transaction Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
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
