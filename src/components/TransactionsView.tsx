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
  Table as TableIcon,
  LayoutList,
  CalendarDays,
  Clock,
  Layers,
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
  const [dateFilterMode, setDateFilterMode] = useState<'cashflow' | 'transaction'>('cashflow');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilters, setShowFilters] = useState(false);

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    return filterTransactionsByDate(transactions, {
      year: selectedYear,
      month: selectedMonth,
      categoryId: selectedCategory,
      type: selectedType,
      searchTerm,
      useCashflowMonth: dateFilterMode === 'cashflow',
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
    dateFilterMode,
  ]);

  // Aggregate stats for filtered data
  const filteredSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTxs.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, net: income - expense, count: filteredTxs.length };
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
          <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

              {/* Payment Method Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Payment Method</label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 p-2 rounded-xl border border-slate-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all">All Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Auto-Debit">Auto-Debit</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Date Filtering Mode: Transaction Month (Cash Flow) vs Transaction Date */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Month Filter Basis:</span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('cashflow')}
                    className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                      dateFilterMode === 'cashflow'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Filters using Transaction Month (for Cash Flow calculation)"
                  >
                    Transaction Month (Cash Flow)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('transaction')}
                    className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                      dateFilterMode === 'transaction'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Filters using Actual Transaction Date"
                  >
                    Transaction Date (Actual)
                  </button>
                </div>
              </div>

              <button
                onClick={handleResetFilters}
                className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ml-auto"
              >
                <RefreshCw size={12} />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Overview Mini Cards & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-3 gap-2.5 flex-1">
          <div className="p-3 rounded-2xl bg-white border border-emerald-100 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Inflow</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-600">
                +{formatCurrency(filteredSummary.income, currency)}
              </div>
            </div>
            <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <ArrowUpRight size={14} />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Outflow</div>
              <div className="text-xs sm:text-sm font-bold text-rose-600">
                -{formatCurrency(filteredSummary.expense, currency)}
              </div>
            </div>
            <div className="p-1 rounded-lg bg-rose-50 text-rose-600 shrink-0">
              <ArrowDownRight size={14} />
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl bg-white border shadow-xs flex items-center justify-between ${
              filteredSummary.net >= 0 ? 'border-emerald-200' : 'border-rose-200'
            }`}
          >
            <div>
              <div
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  filteredSummary.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                Net
              </div>
              <div
                className={`text-xs sm:text-sm font-bold ${
                  filteredSummary.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {filteredSummary.net >= 0 ? '+' : ''}
                {formatCurrency(filteredSummary.net, currency)}
              </div>
            </div>
            <div
              className={`p-1 rounded-lg shrink-0 ${
                filteredSummary.net >= 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {filteredSummary.net >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            </div>
          </div>
        </div>

        {/* View Mode Toggle: Table (with columns) vs Card View */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table view with detailed date columns"
            >
              <TableIcon size={14} />
              <span className="text-[11px]">Table View</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Compact card view"
            >
              <LayoutList size={14} />
              <span className="text-[11px]">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction List / Table */}
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
      ) : viewMode === 'table' ? (
        /* Detailed Table with explicit columns for Created Date, Transaction Date, Transaction Month */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200/80 tracking-wider">
                  <th className="py-3 px-3.5">Category & Description</th>
                  <th className="py-3 px-3 font-semibold text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      <span>Created Date</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-indigo-600" />
                      <span>Transaction Date</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 font-semibold text-indigo-700">
                    <div className="flex items-center gap-1">
                      <CalendarDays size={12} className="text-indigo-600" />
                      <span>Transaction Month</span>
                    </div>
                  </th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxs.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId || c.name === tx.categoryName);
                  const isExpense = tx.type === 'expense';
                  const effectiveCreated = tx.createdDate || (tx.createdAt ? new Date(tx.createdAt).toISOString().substring(0, 10) : tx.date);
                  const effectiveMonth = tx.transactionMonth || tx.date.substring(0, 7);
                  const isHistorical = effectiveCreated !== tx.date;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Description & Category */}
                      <td className="py-3 px-3.5 max-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          <CategoryIcon
                            iconName={cat?.icon || 'Tag'}
                            color={cat?.color || '#64748B'}
                            size={16}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate" title={tx.description || tx.categoryName}>
                              {tx.description || tx.categoryName}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <span className="font-semibold text-slate-600">{tx.categoryName}</span>
                              {tx.notes && (
                                <>
                                  <span>·</span>
                                  <span className="italic truncate text-slate-400" title={tx.notes}>
                                    {tx.notes}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 1. Created Date: Date when transaction was logged in app */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-600 font-medium text-[11px]">
                          {effectiveCreated}
                        </div>
                        {isHistorical && (
                          <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            Logged later
                          </span>
                        )}
                      </td>

                      {/* 2. Transaction Date: Actual transaction date for bank statement matching */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <span>{tx.date}</span>
                          {tx.date > new Date().toISOString().substring(0, 10) && (
                            <span className="bg-sky-50 text-sky-700 border border-sky-200 px-1 py-0.2 rounded text-[9px] font-semibold">
                              Scheduled
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400">Statement date</span>
                      </td>

                      {/* 3. Transaction Month: Month used to calculate cash flow */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">
                          {effectiveMonth}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">Cash flow</span>
                      </td>

                      {/* Payment Method & CC status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          tx.paymentMethod === 'Credit Card'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 font-semibold'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tx.paymentMethod}
                        </span>
                        {tx.excludeFromCashflow && (
                          <span className="ml-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            Unbilled
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-bold text-xs sm:text-sm ${
                            isExpense ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatCurrency(tx.amount, currency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Edit Transaction"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 rounded-md bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View with all 3 date fields highlighted */
        <div className="space-y-2">
          {filteredTxs.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId || c.name === tx.categoryName);
            const isExpense = tx.type === 'expense';
            const effectiveCreated = tx.createdDate || (tx.createdAt ? new Date(tx.createdAt).toISOString().substring(0, 10) : tx.date);
            const effectiveMonth = tx.transactionMonth || tx.date.substring(0, 7);

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/80 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <CategoryIcon
                    iconName={cat?.icon || 'Tag'}
                    color={cat?.color || '#64748B'}
                    size={18}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {tx.description || tx.categoryName}
                    </div>
                    
                    {/* Date Badges Grid */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] mt-1.5">
                      {/* 1. Created Date */}
                      <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded" title="Created date (when logged)">
                        <Clock size={10} className="text-slate-400" />
                        <span>Created: {effectiveCreated}</span>
                      </span>

                      {/* 2. Transaction Date */}
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded" title="Actual transaction date (statement match)">
                        <Calendar size={10} className="text-indigo-600" />
                        <span>Tx Date: {tx.date}</span>
                      </span>

                      {/* 3. Transaction Month */}
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded" title="Transaction month for cash flow">
                        <CalendarDays size={10} />
                        <span>Cash Flow: {effectiveMonth}</span>
                      </span>

                      {/* Payment Method */}
                      <span className={`px-1.5 py-0.5 rounded font-medium ${
                        tx.paymentMethod === 'Credit Card'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200 font-semibold'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tx.paymentMethod}
                      </span>
                    </div>

                    {tx.notes && (
                      <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-1">{tx.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div
                      className={`text-sm sm:text-base font-bold ${
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
          })}
        </div>
      )}

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
