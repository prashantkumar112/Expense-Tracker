import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieIcon,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { Category, Transaction } from '../types';
import { CurrencyConfig, formatCurrency } from '../utils/storage';
import { CategoryIcon } from './CategoryIcon';
import {
  generateMonthlyReport,
  generateYearlyReport,
  getAvailableYears,
  parseTxDateComponents,
} from '../utils/financialAnalytics';
import {
  generateMonthlyReportPdf,
  generateYearlyReportPdf,
} from '../utils/pdfGenerator';
import { exportTransactionsToCsv } from '../utils/csvHelper';
import { syncExpensesToGoogleSheets, getStoredGSheetsConfig } from '../utils/googleSheetsSync';
import confetti from 'canvas-confetti';
import { GoogleSheetsSyncPanel } from './GoogleSheetsSyncPanel';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface BudgetReportsViewProps {
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyConfig;
}

export const BudgetReportsView: React.FC<BudgetReportsViewProps> = ({
  transactions,
  categories,
  currency,
}) => {
  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Generate Reports
  const monthlyReport = useMemo(() => {
    return generateMonthlyReport(transactions, categories, selectedYear, selectedMonth);
  }, [transactions, categories, selectedYear, selectedMonth]);

  const yearlyReport = useMemo(() => {
    return generateYearlyReport(transactions, categories, selectedYear);
  }, [transactions, categories, selectedYear]);

  // Google Sheets sync state
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsSyncMsg, setSheetsSyncMsg] = useState<string | null>(null);

  const handleSyncToGoogleSheets = async () => {
    setIsSyncingSheets(true);
    setSheetsSyncMsg(null);
    try {
      const res = await syncExpensesToGoogleSheets(transactions, categories, currency);
      setSheetsSyncMsg(`Synced ${res.rowCount} records to Google Sheets!`);
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      setSheetsSyncMsg(err?.message || 'Sync failed.');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Export handlers
  const handleDownloadMonthlyPdf = () => {
    generateMonthlyReportPdf(monthlyReport, currency);
  };

  const handleDownloadYearlyPdf = () => {
    generateYearlyReportPdf(yearlyReport, currency);
  };

  const handleExportMonthlyCsv = () => {
    const monthTxs = transactions.filter((t) => {
      const { year: ty, month: tm } = parseTxDateComponents(t.date);
      return ty === selectedYear && tm === selectedMonth;
    });
    exportTransactionsToCsv(
      monthTxs,
      `Monthly_Statement_${selectedYear}_${monthlyReport.monthName}.csv`
    );
  };

  const handleExportYearlyCsv = () => {
    const yearTxs = transactions.filter((t) => {
      const { year: ty } = parseTxDateComponents(t.date);
      return ty === selectedYear;
    });
    exportTransactionsToCsv(yearTxs, `Annual_Statement_${selectedYear}.csv`);
  };

  const months = [
    { num: 1, name: 'January' },
    { num: 2, name: 'February' },
    { num: 3, name: 'March' },
    { num: 4, name: 'April' },
    { num: 5, name: 'May' },
    { num: 6, name: 'June' },
    { num: 7, name: 'July' },
    { num: 8, name: 'August' },
    { num: 9, name: 'September' },
    { num: 10, name: 'October' },
    { num: 11, name: 'November' },
    { num: 12, name: 'December' },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Report Type Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              reportType === 'monthly'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Monthly Budget Report
          </button>
          <button
            onClick={() => setReportType('yearly')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              reportType === 'yearly'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Annual Statement
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          {reportType === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
          )}

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
      </div>

      {/* MONTHLY REPORT VIEW */}
      {reportType === 'monthly' && (
        <div className="space-y-4">
          {/* Executive Summary Card with PDF Export */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border border-slate-800/80 shadow-md shadow-indigo-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-950/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {monthlyReport.monthName} {monthlyReport.year} Financial Summary
                  </h2>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      monthlyReport.isOverBudget
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {monthlyReport.isOverBudget ? 'Over Budget' : 'Within Budget'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Automated monthly performance analysis and category variance metrics
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSyncToGoogleSheets}
                  disabled={isSyncingSheets}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                  title="Sync month and all transactions to Google Sheets"
                >
                  <FileSpreadsheet size={14} className={isSyncingSheets ? 'animate-spin' : ''} />
                  <span>{isSyncingSheets ? 'Syncing...' : 'Sync to Sheets'}</span>
                </button>

                <button
                  onClick={handleDownloadMonthlyPdf}
                  className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Download size={14} strokeWidth={2.5} />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleExportMonthlyCsv}
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-xs"
                  title="Export to CSV"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>

            {sheetsSyncMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-300 shrink-0" />
                <span>{sheetsSyncMsg}</span>
              </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div>
                <div className="text-[10px] text-indigo-200 font-semibold uppercase">Total Inflow</div>
                <div className="text-base sm:text-lg font-bold text-emerald-400">
                  {formatCurrency(monthlyReport.totalIncome, currency)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-indigo-200 font-semibold uppercase">Total Outflow</div>
                <div className="text-base sm:text-lg font-bold text-rose-400">
                  {formatCurrency(monthlyReport.totalExpense, currency)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-indigo-200 font-semibold uppercase">Net Savings</div>
                <div className="text-base sm:text-lg font-bold text-indigo-300">
                  {formatCurrency(monthlyReport.netSavings, currency)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-indigo-200 font-semibold uppercase">Savings Rate</div>
                <div className="text-base sm:text-lg font-bold text-emerald-400">
                  {monthlyReport.savingsRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Smart Insights & Highlights */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Automated Insights & Budget Health
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Budget Adherence: </span>
                  <span className="text-slate-600">
                    {monthlyReport.isOverBudget
                      ? `Exceeded planned budget by ${formatCurrency(monthlyReport.budgetVariance, currency)}.`
                      : `Successfully operated ${formatCurrency(Math.abs(monthlyReport.budgetVariance), currency)} below ceiling.`}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <PieIcon size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Top Spend Driver: </span>
                  <span className="text-slate-600">
                    {monthlyReport.topSpendingCategories[0]
                      ? `${monthlyReport.topSpendingCategories[0].categoryName} (${formatCurrency(
                          monthlyReport.topSpendingCategories[0].amount,
                          currency
                        )} or ${monthlyReport.topSpendingCategories[0].percentage.toFixed(1)}%)`
                      : 'No expenses recorded.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Budget vs Actual Breakdown */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3">Category Budget Performance</h3>

            <div className="space-y-2.5">
              {monthlyReport.categoryReports.map((cat) => {
                const isOver = cat.status === 'exceeded';
                const isWarning = cat.status === 'warning';

                return (
                  <div
                    key={cat.categoryId}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CategoryIcon iconName={cat.icon} color={cat.color} size={14} />
                        <span className="font-bold text-slate-800">{cat.categoryName}</span>
                        {isOver && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                            Over by {formatCurrency(cat.variance, currency)}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(cat.actual, currency)}
                        </span>
                        {cat.budget > 0 && (
                          <span className="text-[10px] text-slate-400 ml-1">
                            / {formatCurrency(cat.budget, currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress meter */}
                    {cat.budget > 0 && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver
                              ? 'bg-rose-500'
                              : isWarning
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (cat.actual / cat.budget) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ANNUAL REPORT VIEW */}
      {reportType === 'yearly' && (
        <div className="space-y-4">
          {/* Annual Executive Summary */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border border-slate-800/80 shadow-md shadow-indigo-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-950/80">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Fiscal Year {yearlyReport.year} Statement
                </h2>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  12-Month cumulative financial performance, burn rate & quarterly breakdown
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadYearlyPdf}
                  className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Download size={14} strokeWidth={2.5} />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handleExportYearlyCsv}
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-xs"
                  title="Export to CSV"
                >
                  <FileSpreadsheet size={16} />
                </button>
              </div>
            </div>

            {/* Annual KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div>
                <div className="text-[10px] text-indigo-200 font-semibold uppercase">Annual Inflow</div>
                <div className="text-base sm:text-lg font-bold text-emerald-400">
                  {formatCurrency(yearlyReport.totalIncome, currency)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-indigo-200 font-semibold uppercase">Annual Outflow</div>
                <div className="text-base sm:text-lg font-bold text-rose-400">
                  {formatCurrency(yearlyReport.totalExpense, currency)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-indigo-200 font-semibold uppercase">Annual Savings</div>
                <div className="text-base sm:text-lg font-bold text-indigo-300">
                  {formatCurrency(yearlyReport.netSavings, currency)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-indigo-200 font-semibold uppercase">Avg Monthly Burn</div>
                <div className="text-base sm:text-lg font-bold text-amber-300">
                  {formatCurrency(yearlyReport.averageMonthlyExpense, currency)}
                </div>
              </div>
            </div>
          </div>

          {/* Quarterly Summary Table */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3">Quarterly Cashflow Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-semibold">Quarter</th>
                    <th className="pb-2 font-semibold text-right">Income</th>
                    <th className="pb-2 font-semibold text-right">Expenses</th>
                    <th className="pb-2 font-semibold text-right">Net Savings</th>
                    <th className="pb-2 font-semibold text-right">Savings Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {yearlyReport.quarterlyData.map((q) => (
                    <tr key={q.quarter} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-bold text-slate-800">{q.quarter}</td>
                      <td className="py-2.5 text-right text-emerald-600 font-semibold">
                        {formatCurrency(q.income, currency)}
                      </td>
                      <td className="py-2.5 text-right text-rose-600 font-semibold">
                        {formatCurrency(q.expense, currency)}
                      </td>
                      <td className="py-2.5 text-right text-indigo-600 font-bold">
                        {formatCurrency(q.savings, currency)}
                      </td>
                      <td className="py-2.5 text-right text-slate-600 font-medium">
                        {q.income > 0 ? `${((q.savings / q.income) * 100).toFixed(1)}%` : '0%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Annual Totals */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3">Annual Category Spend Leaderboard</h3>
            <div className="space-y-2">
              {yearlyReport.categoryTotals.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon iconName={cat.icon} color={cat.color} size={16} />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{cat.categoryName}</div>
                      <div className="text-[10px] text-slate-400">
                        Monthly Avg: {formatCurrency(cat.monthlyAverage, currency)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      {formatCurrency(cat.totalAmount, currency)}
                    </div>
                    <div className="text-[10px] text-indigo-600 font-semibold">
                      {cat.percentage.toFixed(1)}% of annual
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cloud Sync to Google Sheets & Drive */}
      <GoogleSheetsSyncPanel
        transactions={transactions}
        categories={categories}
        currency={currency}
      />
    </div>
  );
};
