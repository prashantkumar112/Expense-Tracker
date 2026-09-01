import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Plus,
  RefreshCw,
  X,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { Category, Transaction } from '../types';
import { CurrencyConfig, formatCurrency } from '../utils/storage';
import { CategoryIcon } from './CategoryIcon';
import { exportTransactionsToCsv, exportTransactionsToExcel } from '../utils/csvHelper';
import { filterTransactionsByDate, getAvailableYears } from '../utils/financialAnalytics';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyConfig;
  initialCategoryId?: string;
  onOpenAddModal: (type?: 'expense' | 'income') => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onClearAllTransactions?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  currency,
  initialCategoryId,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onClearAllTransactions,
}) => {
  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);
  const currentYear = new Date().getFullYear();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryId || 'all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(availableYears[0] || currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    return filterTransactionsByDate(transactions, {
      year: selectedYear,
      month: selectedMonth,
      categoryId: selectedCategory,
      type: selectedType,
      searchTerm,
    }).filter((t) => {
      if (selectedPaymentMethod !== 'all' && t.paymentMethod !== selectedPaymentMethod) {
        return false;
      }
      return true;
    });
  }, [
    transactions,
    selectedYear,
    selectedMonth,
    selectedCategory,
    selectedType,
    searchTerm,
    selectedPaymentMethod,
  ]);

  // Aggregate stats for filtered data
  const filteredSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTxs.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, count: filteredTxs.length };
  }, [filteredTxs]);

  const handleExportCsv = () => {
    const filename = `Transactions_Export_${new Date().toISOString().substring(0, 10)}.csv`;
    exportTransactionsToCsv(filteredTxs, filename);
  };

  const handleExportExcel = () => {
    const filename = `Transactions_Export_${new Date().toISOString().substring(0, 10)}.xlsx`;
    exportTransactionsToExcel(filteredTxs, filename);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedPaymentMethod('all');
  };

  const months = [
    { num: 1, name: 'Jan' },
    { num: 2, name: 'Feb' },
    { num: 3, name: 'Mar' },
    { num: 4, name: 'Apr' },
    { num: 5, name: 'May' },
    { num: 6, name: 'Jun' },
    { num: 7, name: 'Jul' },
    { num: 8, name: 'Aug' },
    { num: 9, name: 'Sep' },
    { num: 10, name: 'Oct' },
    { num: 11, name: 'Nov' },
    { num: 12, name: 'Dec' },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Search & Filter Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search expenses, categories, notes..."
              className="w-full bg-slate-50 text-slate-900 text-xs pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs ${
              showFilters || selectedCategory !== 'all' || selectedMonth !== 'all' || selectedYear !== 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Filter Panel"
          >
            <Filter size={15} />
            <span className="hidden sm:inline">Filters</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            title="Export filtered records to Excel (.xlsx)"
          >
            <Download size={15} className="text-emerald-700" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            title="Export filtered records to CSV"
          >
            <Download size={15} />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pt-1">
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedType === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedType === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Income
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
              {filteredSummary.count} entries
            </div>

            {onClearAllTransactions && transactions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all transactions?')) {
                    onClearAllTransactions();
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Clear all transactions"
              >
                <Trash2 size={12} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Collapsible */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 p-2 rounded-xl border border-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
                }
                className="w-full bg-slate-50 text-slate-800 p-2 rounded-xl border border-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Years</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
                }
                className="w-full bg-slate-50 text-slate-800 p-2 rounded-xl border border-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Months</option>
                {months.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Overview Mini Card */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Filtered Inflow</div>
            <div className="text-sm sm:text-base font-bold text-emerald-600">
              +{formatCurrency(filteredSummary.income, currency)}
            </div>
          </div>
          <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Filtered Outflow</div>
            <div className="text-sm sm:text-base font-bold text-rose-600">
              -{formatCurrency(filteredSummary.expense, currency)}
            </div>
          </div>
          <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
            <ArrowDownRight size={18} />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredTxs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <p className="text-xs text-slate-500 font-medium">No transactions match your current filters.</p>
            <button
              onClick={handleResetFilters}
              className="mt-3 text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredTxs.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId || c.name === tx.categoryName);
            const isExpense = tx.type === 'expense';

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/80 shadow-xs transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon
                    iconName={cat?.icon || 'Tag'}
                    color={cat?.color || '#64748B'}
                    size={18}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {tx.description || tx.categoryName}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                      <span className="font-semibold text-slate-700">{tx.categoryName}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.2 rounded font-medium ${
                        tx.paymentMethod === 'Credit Card'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200 font-semibold'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tx.paymentMethod}
                      </span>
                      {tx.excludeFromCashflow && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                          Unbilled CC
                        </span>
                      )}
                      {tx.isCreditCardSettlement && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                          CC Bill Paid
                        </span>
                      )}
                      {tx.isRecurring && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                          Recurring
                        </span>
                      )}
                    </div>
                    {tx.notes && (
                      <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">{tx.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div
                      className={`text-xs sm:text-sm font-bold ${
                        isExpense ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatCurrency(tx.amount, currency)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Edit Transaction"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Transaction"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-20 right-4 sm:right-8 z-20">
        <button
          onClick={() => onOpenAddModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl shadow-xl shadow-indigo-300 font-bold text-xs tracking-tight transition-transform active:scale-95 cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Record</span>
        </button>
      </div>
    </div>
  );
};
