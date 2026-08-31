import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlyBudgetReport, YearlyBudgetReport } from '../types';
import { CurrencyConfig, formatCurrency } from './storage';

export function generateMonthlyReportPdf(
  report: MonthlyBudgetReport,
  currency: CurrencyConfig
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('MONTHLY BUDGET REPORT', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Statement Period: ${report.monthName} ${report.year}`, 14, 26);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

  // Status Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (report.isOverBudget) {
    doc.setFillColor(239, 68, 68); // red
    doc.roundedRect(pageWidth - 55, 14, 42, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('OVER BUDGET', pageWidth - 50, 22);
  } else {
    doc.setFillColor(16, 185, 129); // emerald
    doc.roundedRect(pageWidth - 55, 14, 42, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('WITHIN BUDGET', pageWidth - 52, 22);
  }

  // KPI Summary Boxes
  const kpiTop = 46;
  const kpiWidth = (pageWidth - 28 - 9) / 4;
  const kpis = [
    { title: 'Total Income', val: formatCurrency(report.totalIncome, currency), color: [16, 185, 129] },
    { title: 'Total Expense', val: formatCurrency(report.totalExpense, currency), color: [239, 68, 68] },
    { title: 'Net Savings', val: formatCurrency(report.netSavings, currency), color: [59, 130, 246] },
    { title: 'Savings Rate', val: `${report.savingsRate.toFixed(1)}%`, color: [139, 92, 246] },
  ];

  kpis.forEach((kpi, index) => {
    const x = 14 + index * (kpiWidth + 3);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(x, kpiTop, kpiWidth, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 4, kpiTop + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 4, kpiTop + 16);
  });

  // Section: Category Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('Category Level Budget vs. Actual Breakdown', 14, 78);

  const tableData = report.categoryReports.map((cat) => [
    cat.categoryName,
    cat.budget > 0 ? formatCurrency(cat.budget, currency) : 'No limit',
    formatCurrency(cat.actual, currency),
    cat.budget > 0 ? formatCurrency(cat.variance, currency) : '-',
    `${cat.percentageOfTotal.toFixed(1)}%`,
    cat.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 83,
    head: [['Category', 'Monthly Budget', 'Actual Spend', 'Variance', '% of Total', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'center' },
    },
  });

  // Save the PDF
  doc.save(`Monthly_Budget_Report_${report.year}_${report.monthName}.pdf`);
}

export function generateYearlyReportPdf(
  report: YearlyBudgetReport,
  currency: CurrencyConfig
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(`ANNUAL BUDGET STATEMENT`, 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Fiscal Year: ${report.year} | Full Year Financial Summary`, 14, 26);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);

  // Top KPIs
  const kpiTop = 48;
  const kpiWidth = (pageWidth - 28 - 9) / 4;
  const kpis = [
    { title: 'Annual Income', val: formatCurrency(report.totalIncome, currency), color: [16, 185, 129] },
    { title: 'Annual Expenses', val: formatCurrency(report.totalExpense, currency), color: [239, 68, 68] },
    { title: 'Annual Savings', val: formatCurrency(report.netSavings, currency), color: [59, 130, 246] },
    { title: 'Avg Monthly Burn', val: formatCurrency(report.averageMonthlyExpense, currency), color: [245, 158, 11] },
  ];

  kpis.forEach((kpi, index) => {
    const x = 14 + index * (kpiWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, kpiTop, kpiWidth, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 4, kpiTop + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 4, kpiTop + 16);
  });

  // Table 1: Quarterly Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Quarterly Cashflow Breakdown', 14, 80);

  const quarterRows = report.quarterlyData.map((q) => [
    q.quarter,
    formatCurrency(q.income, currency),
    formatCurrency(q.expense, currency),
    formatCurrency(q.savings, currency),
    q.income > 0 ? `${((q.savings / q.income) * 100).toFixed(1)}%` : '0%',
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Quarter', 'Income', 'Expenses', 'Net Savings', 'Savings Rate']],
    body: quarterRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'center' },
    },
  });

  // Table 2: Category Totals
  const lastTable = (doc as any).lastAutoTable;
  const nextY = lastTable ? lastTable.finalY + 12 : 140;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Annual Category Spend Summary', 14, nextY);

  const categoryRows = report.categoryTotals.map((cat) => [
    cat.categoryName,
    formatCurrency(cat.totalAmount, currency),
    formatCurrency(cat.monthlyAverage, currency),
    `${cat.percentage.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: nextY + 5,
    head: [['Category', 'Total Spent', 'Monthly Average', '% of Total Expense']],
    body: categoryRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' },
      2: { halign: 'right' },
      3: { halign: 'center' },
    },
  });

  doc.save(`Annual_Budget_Statement_${report.year}.pdf`);
}
