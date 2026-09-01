import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  Calendar,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  ShieldAlert,
  CreditCard,
  Coins,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Category, Transaction } from '../types';
import { CurrencyConfig, formatCurrency } from '../utils/storage';
import { CategoryIcon } from './CategoryIcon';
import { getCategorySpendBreakdown, getMonthlySpendTrends, parseTxDateComponents } from '../utils/financialAnalytics';

interface DashboardViewProps {
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyConfig;
  onNavigateTab: (tab: any) => void;
  onOpenAddModal: (type?: 'expense' | 'income') => void;
  onSelectCategoryFilter?: (catId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  categories,
  currency,
  onNavigateTab,
  onOpenAddModal,
  onSelectCategoryFilter,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedPeriod, setSelectedPeriod] = useState<'thisMonth' | 'last3Months' | 'thisYear' | 'all'>('thisMonth');
  const [cashflowMode, setCashflowMode] = useState<'cashflow' | 'accrual'>('cashflow');

  // Filter transactions based on selected period
  const filteredTxs = useMemo(() => {
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;

    return transactions.filter((t) => {
      const { year: ty, month: tm } = parseTxDateComponents(t.date);

      if (selectedPeriod === 'thisMonth') {
        return ty === curY && tm === curM;
      }
      if (selectedPeriod === 'last3Months') {
        // Last 3 months
        const monthDiff = (curY - ty) * 12 + (curM - tm);
        return monthDiff >= 0 && monthDiff < 3;
      }
      if (selectedPeriod === 'thisYear') {
        return ty === curY;
      }
      return true;
    });
  }, [transactions, selectedPeriod]);

  // Aggregate stats: Accrual vs Cashflow separation
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let deferredCcExpense = 0;

    filteredTxs.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        const isDeferredCC = t.paymentMethod === 'Credit Card' && t.excludeFromCashflow;
        if (isDeferredCC) {
          deferredCcExpense += t.amount;
        }

        if (cashflowMode === 'cashflow') {
          // Cashflow view: only count immediate outflows & settlements
          if (!isDeferredCC) {
            expense += t.amount;
          }
        } else {
          // Accrual view: count all expenses incurred across categories
          if (!t.isCreditCardSettlement) {
            expense += t.amount;
          }
        }
      }
    });

    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    return { income, expense, net, savingsRate, deferredCcExpense };
  }, [filteredTxs, cashflowMode]);

  // Credit Card Liability & Unbilled Summary
  const creditCardLiability = useMemo(() => {
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;

    let thisMonthCcExpense = 0;
    let thisMonthCcCount = 0;

    transactions.forEach((t) => {
      if (t.type === 'expense' && t.paymentMethod === 'Credit Card') {
        const { year: ty, month: tm } = parseTxDateComponents(t.date);
        if (ty === curY && tm === curM) {
          thisMonthCcExpense += t.amount;
          thisMonthCcCount += 1;
        }
      }
    });

    return {
      thisMonthCcExpense,
      thisMonthCcCount,
    };
  }, [transactions]);

  // Monthly Budget Target calculation (always accrual to track real budget)
  const budgetSummary = useMemo(() => {
    const totalMonthlyBudget = categories
      .filter((c) => c.type === 'expense')
      .reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);

    // Current month actual expense
    const currentMonthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() + 1 === currentMonth &&
        t.type === 'expense' &&
        !t.isCreditCardSettlement
      );
    });
    const currentMonthExpense = currentMonthTxs.reduce((sum, t) => sum + t.amount, 0);

    const percentUsed = totalMonthlyBudget > 0 ? (currentMonthExpense / totalMonthlyBudget) * 100 : 0;
    const remaining = totalMonthlyBudget - currentMonthExpense;

    return {
      totalMonthlyBudget,
      currentMonthExpense,
      percentUsed,
      remaining,
      isOver: remaining < 0,
    };
  }, [categories, transactions, currentYear, currentMonth]);

  // Top spending categories in selected period
  const topCategories = useMemo(() => {
    const { items } = getCategorySpendBreakdown(filteredTxs, categories, 'expense');
    return items.slice(0, 6);
  }, [filteredTxs, categories]);

  // Spend trends for charts (Current year)
  const chartData = useMemo(() => {
    return getMonthlySpendTrends(transactions, currentYear);
  }, [transactions, currentYear]);

  // Recent transactions (last 6)
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  return (
    <div className="space-y-4 pb-20">
      {/* Time Horizon & Dual Cashflow Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold text-slate-500 overflow-x-auto scrollbar-none">
          {[
            { id: 'thisMonth', label: 'This Month' },
            { id: 'last3Months', label: '3 Months' },
            { id: 'thisYear', label: `${currentYear}` },
            { id: 'all', label: 'All Time' },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedPeriod === period.id
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'hover:text-slate-800'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Dual Mode Switch: Cashflow vs Accrual */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
          <button
            onClick={() => setCashflowMode('cashflow')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              cashflowMode === 'cashflow'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Real Bank Liquidity: Credit card expenses don't deduct cash until paid"
          >
            <Coins size={13} />
            <span>Bank Cashflow</span>
          </button>
          <button
            onClick={() => setCashflowMode('accrual')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              cashflowMode === 'accrual'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Total Incurred Expense: Includes card swipes immediately"
          >
            <Layers size={13} />
            <span>Total Incurred</span>
          </button>
        </div>
      </div>

      {/* Credit Card Unbilled Liability Card */}
      {creditCardLiability.thisMonthCcExpense > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/70 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <CreditCard size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Credit Card Spending</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  {creditCardLiability.thisMonthCcCount} Swipes
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                <strong className="text-amber-900 font-bold">{formatCurrency(creditCardLiability.thisMonthCcExpense, currency)}</strong> spent on card this month. Cashflow is protected until bill date.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('transactions')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
          >
            View Card Swipes
          </button>
        </div>
      )}

      {/* Hero Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Net Balance */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border border-slate-800/80 shadow-md shadow-indigo-950/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
            <span className="font-medium">
              {cashflowMode === 'cashflow' ? 'Net Cashflow' : 'Net Savings'}
            </span>
            <Wallet size={16} className="text-indigo-300" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold tracking-tight ${stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(stats.net, currency)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-300">
            <span>Savings Rate:</span>
            <span className="font-bold text-emerald-400">{stats.savingsRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Total Income */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Total Income</span>
            <div className="p-1 rounded-md bg-emerald-50 text-emerald-600">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="text-lg font-bold text-emerald-600 tracking-tight">
            {formatCurrency(stats.income, currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Earnings & Returns</div>
        </div>

        {/* Total Expenses / Cash Outflow */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">
              {cashflowMode === 'cashflow' ? 'Cash Outflow' : 'Total Spent'}
            </span>
            <div className="p-1 rounded-md bg-rose-50 text-rose-600">
              <ArrowDownRight size={14} />
            </div>
          </div>
          <div className="text-lg font-bold text-rose-600 tracking-tight">
            {formatCurrency(stats.expense, currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {cashflowMode === 'cashflow' ? 'Actual bank deductions' : 'All categories combined'}
          </div>
        </div>

        {/* Savings Metric */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Bank Balance Impact</span>
            <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <PiggyBank size={14} />
            </div>
          </div>
          <div className="text-lg font-bold text-indigo-600 tracking-tight">
            {formatCurrency(Math.max(0, stats.net), currency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Retained liquidity</div>
        </div>
      </div>

      {/* Monthly Budget Gauge Card */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-bold text-slate-900">Monthly Budget Usage</span>
            <p className="text-[11px] text-slate-500">
              {formatCurrency(budgetSummary.currentMonthExpense, currency)} of{' '}
              {formatCurrency(budgetSummary.totalMonthlyBudget, currency)} target
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                budgetSummary.isOver
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : budgetSummary.percentUsed > 80
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {budgetSummary.percentUsed.toFixed(0)}% Used
            </span>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {budgetSummary.isOver
                ? `${formatCurrency(Math.abs(budgetSummary.remaining), currency)} over`
                : `${formatCurrency(budgetSummary.remaining, currency)} left`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetSummary.isOver
                ? 'bg-rose-500'
                : budgetSummary.percentUsed > 80
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
            }`}
            style={{ width: `${Math.min(100, budgetSummary.percentUsed)}%` }}
          />
        </div>
      </div>

      {/* Spend Trends Preview Chart */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp size={15} className="text-indigo-600" />
              Annual Spend Trends ({currentYear})
            </h2>
            <p className="text-[11px] text-slate-500">Monthly Cashflow Evolution</p>
          </div>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            Full Analytics <ChevronRight size={13} />
          </button>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" opacity={1} vertical={false} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={9}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white border border-slate-700 p-2.5 rounded-xl text-xs shadow-xl">
                        <div className="font-bold text-slate-100 mb-1">{data.fullName}</div>
                        <div className="text-emerald-400">Income: {formatCurrency(data.income, currency)}</div>
                        <div className="text-rose-400">Expense: {formatCurrency(data.expense, currency)}</div>
                        <div className="text-indigo-300 mt-0.5 font-semibold">
                          Savings: {formatCurrency(data.savings, currency)} ({data.savingsRate.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#incomeGrad)"
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#EF4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#expenseGrad)"
                name="Expense"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Categories Breakdown */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <PieIcon size={15} className="text-indigo-600" />
              Category Outflows
            </h2>
            <p className="text-[11px] text-slate-500">Top Spend Drivers for selected period</p>
          </div>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            View All <ChevronRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {topCategories.map((cat) => (
            <div
              key={cat.categoryId}
              onClick={() => onSelectCategoryFilter && onSelectCategoryFilter(cat.categoryId)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <CategoryIcon iconName={cat.icon} color={cat.color} size={16} />
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-950 transition-colors">
                    {cat.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{cat.count} transactions</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">
                  {formatCurrency(cat.amount, currency)}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {cat.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-[11px] text-slate-500">Latest recorded income & expenses</p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            All Activity ({transactions.length}) <ChevronRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTransactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId || c.name === tx.categoryName);
            const isExpense = tx.type === 'expense';

            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CategoryIcon
                    iconName={cat?.icon || 'Tag'}
                    color={cat?.color || '#64748B'}
                    size={16}
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 leading-tight">
                      {tx.description || tx.categoryName}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-medium">
                        {tx.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-xs font-bold ${
                      isExpense ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {isExpense ? '-' : '+'}
                    {formatCurrency(tx.amount, currency)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {tx.categoryName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button (FAB) for rapid Android entry */}
      <div className="fixed bottom-20 right-4 sm:right-8 z-20 flex flex-col gap-2">
        <button
          onClick={() => onOpenAddModal('expense')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl shadow-xl shadow-indigo-300 font-bold text-xs tracking-tight transition-transform active:scale-95 cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Quick Log</span>
        </button>
      </div>
    </div>
  );
};
