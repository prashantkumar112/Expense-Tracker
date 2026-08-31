import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  ArrowUpDown,
  Calendar,
  ChevronDown,
  Info,
  Percent,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Category, Transaction } from '../types';
import { CurrencyConfig, formatCurrency } from '../utils/storage';
import { CategoryIcon } from './CategoryIcon';
import {
  getAvailableYears,
  getCategorySpendBreakdown,
  getMonthlySpendTrends,
  getQuarterComparison,
  parseTxDateComponents,
} from '../utils/financialAnalytics';

interface AnalyticsViewProps {
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyConfig;
  onSelectCategory?: (catId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  categories,
  currency,
  onSelectCategory,
}) => {
  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);
  const currentYear = new Date().getFullYear();

  const [analyticsTab, setAnalyticsTab] = useState<'trends' | 'categories' | 'yoy_quarter' | 'cashflow'>('yoy_quarter');
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || currentYear);

  // YoY Comparison Year Selectors (Year 1 vs Year 2)
  const [yoyYear1, setYoyYear1] = useState<number>(availableYears[1] || availableYears[0] - 1 || 2025);
  const [yoyYear2, setYoyYear2] = useState<number>(availableYears[0] || 2026);
  const [selectedQuarterDetail, setSelectedQuarterDetail] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');

  // Category view filters
  const [categoryTimeframe, setCategoryTimeframe] = useState<'thisYear' | 'all' | 'custom'>('thisYear');
  const [selectedCategoryType, setSelectedCategoryType] = useState<'expense' | 'income'>('expense');

  // Compute YoY Quarter Data
  const quarterComparisonData = useMemo(() => {
    return getQuarterComparison(transactions, yoyYear1, yoyYear2);
  }, [transactions, yoyYear1, yoyYear2]);

  // Compute Category Spend
  const categorySpend = useMemo(() => {
    let txList = transactions;
    if (categoryTimeframe === 'thisYear') {
      txList = transactions.filter((t) => {
        const { year: ty } = parseTxDateComponents(t.date);
        return ty === selectedYear;
      });
    }
    return getCategorySpendBreakdown(txList, categories, selectedCategoryType);
  }, [transactions, categories, selectedYear, categoryTimeframe, selectedCategoryType]);

  // Compute Monthly Spend Trends
  const monthlyTrends = useMemo(() => {
    return getMonthlySpendTrends(transactions, selectedYear);
  }, [transactions, selectedYear]);

  // Active Quarter Detail data for YoY
  const activeQuarterData = useMemo(() => {
    return quarterComparisonData.find((q) => q.quarter === selectedQuarterDetail);
  }, [quarterComparisonData, selectedQuarterDetail]);

  // Category comparison in active quarter
  const quarterCategoryRows = useMemo(() => {
    if (!activeQuarterData) return [];
    const allCatNames = Array.from(
      new Set([
        ...Object.keys(activeQuarterData.categoryBreakdownYear1),
        ...Object.keys(activeQuarterData.categoryBreakdownYear2),
      ])
    );

    return allCatNames
      .map((name) => {
        const v1 = activeQuarterData.categoryBreakdownYear1[name] || 0;
        const v2 = activeQuarterData.categoryBreakdownYear2[name] || 0;
        const diff = v2 - v1;
        const pct = v1 > 0 ? (diff / v1) * 100 : 0;
        const cat = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());

        return {
          name,
          catId: cat?.id,
          icon: cat?.icon || 'Tag',
          color: cat?.color || '#94A3B8',
          v1,
          v2,
          diff,
          pct,
        };
      })
      .sort((a, b) => b.v2 - a.v2);
  }, [activeQuarterData, categories]);

  return (
    <div className="space-y-4 pb-20">
      {/* Sub Navigation Bar */}
      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold text-slate-500 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setAnalyticsTab('yoy_quarter')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            analyticsTab === 'yoy_quarter'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Layers size={14} />
          <span>YoY Quarter By Quarter</span>
        </button>

        <button
          onClick={() => setAnalyticsTab('trends')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            analyticsTab === 'trends'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <TrendingUp size={14} />
          <span>Spend Trends</span>
        </button>

        <button
          onClick={() => setAnalyticsTab('categories')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            analyticsTab === 'categories'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <PieIcon size={14} />
          <span>Category Outflows</span>
        </button>

        <button
          onClick={() => setAnalyticsTab('cashflow')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            analyticsTab === 'cashflow'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Percent size={14} />
          <span>Cashflow & Savings</span>
        </button>
      </div>

      {/* TAB 1: YoY QUARTER BY QUARTER COMPARISON */}
      {analyticsTab === 'yoy_quarter' && (
        <div className="space-y-4">
          {/* Year Selector Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers size={16} className="text-indigo-600" />
                Year-over-Year (YoY) Quarter Comparison
              </h2>
              <p className="text-[11px] text-slate-500">
                Compare quarter performance and expenditure trends between two fiscal years
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs shadow-xs">
                <span className="text-slate-500 text-[11px]">Base:</span>
                <select
                  value={yoyYear1}
                  onChange={(e) => setYoyYear1(parseInt(e.target.value, 10))}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="bg-white text-slate-800">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-400 font-bold text-xs">vs</span>

              <div className="flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 text-xs shadow-xs">
                <span className="text-indigo-600 text-[11px] font-semibold">Compare:</span>
                <select
                  value={yoyYear2}
                  onChange={(e) => setYoyYear2(parseInt(e.target.value, 10))}
                  className="bg-transparent text-indigo-700 font-bold focus:outline-none cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="bg-white text-slate-800">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grouped Bar Chart: Quarter by Quarter Expense */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-slate-900">Quarterly Expense Shift</span>
                <p className="text-[11px] text-slate-500">
                  {yoyYear1} vs {yoyYear2} across Q1, Q2, Q3 & Q4
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-slate-400" />
                  <span className="text-slate-500 font-medium">{yoyYear1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-indigo-600" />
                  <span className="text-indigo-700 font-bold">{yoyYear2}</span>
                </div>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={quarterComparisonData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" opacity={1} vertical={false} />
                  <XAxis dataKey="quarter" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as any;
                        return (
                          <div className="bg-slate-900 text-white border border-slate-700 p-3 rounded-xl text-xs shadow-2xl">
                            <div className="font-bold text-slate-100 text-sm mb-1">{d.quarter} Comparison</div>
                            <div className="text-slate-300">
                              {yoyYear1}: <span className="font-semibold text-white">{formatCurrency(d.expenseYear1, currency)}</span>
                            </div>
                            <div className="text-indigo-300">
                              {yoyYear2}: <span className="font-bold">{formatCurrency(d.expenseYear2, currency)}</span>
                            </div>
                            <div className="mt-1 pt-1 border-t border-slate-700 flex items-center gap-1 font-semibold">
                              <span>YoY Delta:</span>
                              <span className={d.expenseDiff >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                {d.expenseDiff >= 0 ? '+' : ''}
                                {formatCurrency(d.expenseDiff, currency)} ({d.expenseDiffPct >= 0 ? '+' : ''}
                                {d.expenseDiffPct.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="expenseYear1" name={`${yoyYear1}`} fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenseYear2" name={`${yoyYear2}`} fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quarter Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {quarterComparisonData.map((q) => {
              const isSelected = selectedQuarterDetail === q.quarter;
              const isIncrease = q.expenseDiff > 0;

              return (
                <div
                  key={q.quarter}
                  onClick={() => setSelectedQuarterDetail(q.quarter as any)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800">{q.quarter}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isIncrease
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isIncrease ? '+' : ''}
                      {q.expenseDiffPct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    {yoyYear2}: <span className="font-bold text-slate-900">{formatCurrency(q.expenseYear2, currency)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {yoyYear1}: {formatCurrency(q.expenseYear1, currency)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drilldown Category Shift Table for Selected Quarter */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{selectedQuarterDetail} Category Level Breakdown</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Itemized spend comparison between {yoyYear1} and {yoyYear2} for {selectedQuarterDetail}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-semibold">Category</th>
                    <th className="pb-2 font-semibold text-right">{yoyYear1}</th>
                    <th className="pb-2 font-semibold text-right">{yoyYear2}</th>
                    <th className="pb-2 font-semibold text-right">Difference</th>
                    <th className="pb-2 font-semibold text-right">YoY %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quarterCategoryRows.map((row) => {
                    const isUp = row.diff > 0;
                    return (
                      <tr
                        key={row.name}
                        onClick={() => row.catId && onSelectCategory && onSelectCategory(row.catId)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 flex items-center gap-2">
                          <CategoryIcon iconName={row.icon} color={row.color} size={14} />
                          <span className="font-semibold text-slate-800">{row.name}</span>
                        </td>
                        <td className="py-2.5 text-right text-slate-500">
                          {formatCurrency(row.v1, currency)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">
                          {formatCurrency(row.v2, currency)}
                        </td>
                        <td
                          className={`py-2.5 text-right font-medium ${
                            isUp ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {formatCurrency(row.diff, currency)}
                        </td>
                        <td
                          className={`py-2.5 text-right font-bold ${
                            isUp ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {row.pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPEND TRENDS (Monthly, 12-Month Cashflow) */}
      {analyticsTab === 'trends' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-indigo-600" />
                Monthly Spend & Income Velocity
              </h2>
              <p className="text-[11px] text-slate-500">12-Month Financial Flow for {selectedYear}</p>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs focus:outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          {/* Area Chart with Income vs Expense */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrends}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="trendIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="trendExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" opacity={1} vertical={false} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white border border-slate-700 p-3 rounded-xl text-xs shadow-xl">
                            <div className="font-bold text-slate-100 mb-1">{data.fullName} {selectedYear}</div>
                            <div className="text-emerald-400">Income: {formatCurrency(data.income, currency)}</div>
                            <div className="text-rose-400">Expense: {formatCurrency(data.expense, currency)}</div>
                            <div className="text-indigo-300 font-semibold mt-1">
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
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#trendIncome)"
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#trendExpense)"
                    name="Expense"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Savings Trajectory Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-2">Monthly Net Savings Progression</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" opacity={1} vertical={false} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white border border-slate-700 p-2.5 rounded-xl text-xs">
                            <div className="font-bold text-slate-200">{d.fullName}</div>
                            <div className={d.savings >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              Net: {formatCurrency(d.savings, currency)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="savings"
                    name="Savings"
                    fill="#6366F1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORY OUTFLOWS (Donut Chart & Ranking) */}
      {analyticsTab === 'categories' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PieIcon size={16} className="text-indigo-600" />
                Category Level Distribution
              </h2>
              <p className="text-[11px] text-slate-500">
                Detailed breakdown for all 15 categories ({formatCurrency(categorySpend.total, currency)} total)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryTimeframe}
                onChange={(e) => setCategoryTimeframe(e.target.value as any)}
                className="bg-white text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs focus:outline-none cursor-pointer"
              >
                <option value="thisYear">Year {selectedYear}</option>
                <option value="all">All Time</option>
              </select>

              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setSelectedCategoryType('expense')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    selectedCategoryType === 'expense'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setSelectedCategoryType('income')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    selectedCategoryType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySpend.items}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {categorySpend.items.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white border border-slate-700 p-2.5 rounded-xl text-xs shadow-xl">
                            <div className="font-bold text-slate-100">{data.name}</div>
                            <div className="text-slate-300">{formatCurrency(data.amount, currency)}</div>
                            <div className="text-indigo-300 font-semibold">{data.percentage.toFixed(1)}% of total</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category List Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categorySpend.items.map((cat) => (
              <div
                key={cat.categoryId}
                onClick={() => onSelectCategory && onSelectCategory(cat.categoryId)}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon iconName={cat.icon} color={cat.color} size={18} />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition-colors">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{cat.count} transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      {formatCurrency(cat.amount, currency)}
                    </div>
                    <div className="text-[10px] text-indigo-600 font-semibold">
                      {cat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Micro progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CASHFLOW & SAVINGS RATE */}
      {analyticsTab === 'cashflow' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <Percent size={16} className="text-indigo-600" />
              Savings Rate & Cashflow Retention
            </h2>
            <p className="text-[11px] text-slate-500">
              Target a healthy 30%+ savings rate for financial freedom and wealth building.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3">Savings Rate % by Month</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" opacity={1} vertical={false} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white border border-slate-700 p-2.5 rounded-xl text-xs">
                            <div className="font-bold text-slate-200">{d.fullName}</div>
                            <div className="text-indigo-300 font-bold">
                              Savings Rate: {d.savingsRate.toFixed(1)}%
                            </div>
                            <div className="text-slate-300">
                              Net Saved: {formatCurrency(d.savings, currency)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="savingsRate"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    dot={{ fill: '#4F46E5', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
