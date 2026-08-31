import { Category, MonthlyBudgetReport, QuarterComparison, Transaction, YearlyBudgetReport } from '../types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Timezone-safe date extraction helper for YYYY-MM-DD strings
 */
export function parseTxDateComponents(dateStr: string): { year: number; month: number; day: number } {
  if (!dateStr) return { year: 0, month: 0, day: 0 };
  const parts = String(dateStr).trim().split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10) || 0;
    const month = parseInt(parts[1], 10) || 0; // 1-12
    const day = parseInt(parts[2], 10) || 0;
    return { year, month, day };
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }
  return { year: 0, month: 0, day: 0 };
}

export function getAvailableYears(transactions: Transaction[]): number[] {
  const years = new Set<number>();
  const currentYear = new Date().getFullYear();
  years.add(currentYear);
  years.add(currentYear - 1);
  years.add(currentYear - 2);

  transactions.forEach((tx) => {
    if (tx.date) {
      const { year: y } = parseTxDateComponents(tx.date);
      if (y > 1900) years.add(y);
    }
  });

  return Array.from(years).sort((a, b) => b - a);
}

export function filterTransactionsByDate(
  transactions: Transaction[],
  filters: {
    year?: number | 'all';
    month?: number | 'all'; // 1-12
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'all';
    categoryId?: string | 'all';
    type?: 'expense' | 'income' | 'all';
    searchTerm?: string;
  }
): Transaction[] {
  return transactions.filter((tx) => {
    const { year: txYear, month: txMonth } = parseTxDateComponents(tx.date);
    const txQuarter = `Q${Math.ceil(txMonth / 3)}` as 'Q1' | 'Q2' | 'Q3' | 'Q4';

    if (filters.year && filters.year !== 'all' && txYear !== filters.year) return false;
    if (filters.month && filters.month !== 'all' && txMonth !== filters.month) return false;
    if (filters.quarter && filters.quarter !== 'all' && txQuarter !== filters.quarter) return false;
    if (filters.categoryId && filters.categoryId !== 'all' && txCategoryIdMatch(tx, filters.categoryId) === false) return false;
    if (filters.type && filters.type !== 'all' && tx.type !== filters.type) return false;

    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const q = filters.searchTerm.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(q);
      const matchCat = tx.categoryName?.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q);
      const matchMethod = tx.paymentMethod?.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchNotes && !matchMethod) return false;
    }

    return true;
  });
}

function txCategoryIdMatch(tx: Transaction, catId: string): boolean {
  if (tx.categoryId === catId) return true;
  return false;
}

export function getOverallSummary(transactions: Transaction[]) {
  let totalIncome = 0;
  let totalExpense = 0;
  let recurringExpense = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      if (tx.isRecurring) {
        recurringExpense += tx.amount;
      }
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    recurringExpense,
    transactionCount: transactions.length,
  };
}

export function getCategorySpendBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: 'expense' | 'income' = 'expense'
) {
  const relevantTxs = transactions.filter((t) => t.type === type);
  const total = relevantTxs.reduce((sum, t) => sum + t.amount, 0);

  const map = new Map<string, { categoryId: string; name: string; amount: number; count: number; color: string; icon: string }>();

  // Map defaults
  categories
    .filter((c) => c.type === type)
    .forEach((c) => {
      map.set(c.id, {
        categoryId: c.id,
        name: c.name,
        amount: 0,
        count: 0,
        color: c.color,
        icon: c.icon,
      });
    });

  relevantTxs.forEach((tx) => {
    let entry = map.get(tx.categoryId);
    if (!entry) {
      // Find category by name
      const matchedCat = categories.find((c) => c.name.toLowerCase() === tx.categoryName.toLowerCase());
      if (matchedCat) {
        entry = map.get(matchedCat.id);
      }
    }

    if (entry) {
      entry.amount += tx.amount;
      entry.count += 1;
    } else {
      // Create ad-hoc entry for unknown or imported category
      const customId = tx.categoryId || `custom-${tx.categoryName}`;
      map.set(customId, {
        categoryId: customId,
        name: tx.categoryName || 'Other',
        amount: tx.amount,
        count: 1,
        color: '#6366F1',
        icon: 'Tag',
      });
    }
  });

  const result = Array.from(map.values())
    .filter((item) => item.amount > 0)
    .map((item) => ({
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    total,
    items: result,
  };
}

export function getMonthlySpendTrends(transactions: Transaction[], year: number) {
  const monthsData = Array.from({ length: 12 }, (_, i) => ({
    monthNum: i + 1,
    month: MONTH_NAMES[i].substring(0, 3),
    fullName: MONTH_NAMES[i],
    income: 0,
    expense: 0,
    savings: 0,
    savingsRate: 0,
  }));

  transactions.forEach((tx) => {
    const { year: ty, month: tm } = parseTxDateComponents(tx.date);
    if (ty === year && tm >= 1 && tm <= 12) {
      const mIdx = tm - 1;
      if (tx.type === 'income') {
        monthsData[mIdx].income += tx.amount;
      } else {
        monthsData[mIdx].expense += tx.amount;
      }
    }
  });

  monthsData.forEach((m) => {
    m.savings = m.income - m.expense;
    m.savingsRate = m.income > 0 ? (m.savings / m.income) * 100 : 0;
  });

  return monthsData;
}

export function getQuarterComparison(
  transactions: Transaction[],
  year1: number,
  year2: number
): QuarterComparison[] {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  return quarters.map((q, idx) => {
    const startMonth = idx * 3 + 1; // 1, 4, 7, 10
    const endMonth = startMonth + 2; // 3, 6, 9, 12

    let expenseYear1 = 0;
    let expenseYear2 = 0;
    let incomeYear1 = 0;
    let incomeYear2 = 0;

    const catBreakdownYear1: Record<string, number> = {};
    const catBreakdownYear2: Record<string, number> = {};

    transactions.forEach((tx) => {
      const { year: y, month: m } = parseTxDateComponents(tx.date);

      if (m >= startMonth && m <= endMonth) {
        if (y === year1) {
          if (tx.type === 'expense') {
            expenseYear1 += tx.amount;
            catBreakdownYear1[tx.categoryName] = (catBreakdownYear1[tx.categoryName] || 0) + tx.amount;
          } else {
            incomeYear1 += tx.amount;
          }
        } else if (y === year2) {
          if (tx.type === 'expense') {
            expenseYear2 += tx.amount;
            catBreakdownYear2[tx.categoryName] = (catBreakdownYear2[tx.categoryName] || 0) + tx.amount;
          } else {
            incomeYear2 += tx.amount;
          }
        }
      }
    });

    const expenseDiff = expenseYear2 - expenseYear1;
    const expenseDiffPct = expenseYear1 > 0 ? (expenseDiff / expenseYear1) * 100 : 0;

    const incomeDiff = incomeYear2 - incomeYear1;
    const incomeDiffPct = incomeYear1 > 0 ? (incomeDiff / incomeYear1) * 100 : 0;

    return {
      quarter: q,
      year1,
      year2,
      expenseYear1,
      expenseYear2,
      incomeYear1,
      incomeYear2,
      expenseDiff,
      expenseDiffPct,
      incomeDiff,
      incomeDiffPct,
      categoryBreakdownYear1: catBreakdownYear1,
      categoryBreakdownYear2: catBreakdownYear2,
    };
  });
}

export function generateMonthlyReport(
  transactions: Transaction[],
  categories: Category[],
  year: number,
  month: number
): MonthlyBudgetReport {
  const monthName = MONTH_NAMES[month - 1] || `Month ${month}`;
  const daysInMonth = new Date(year, month, 0).getDate();

  const monthTxs = transactions.filter((tx) => {
    const { year: ty, month: tm } = parseTxDateComponents(tx.date);
    return ty === year && tm === month;
  });

  let totalIncome = 0;
  let totalExpense = 0;

  const categorySpendMap = new Map<string, number>();

  monthTxs.forEach((tx) => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      const keyById = tx.categoryId;
      const keyByName = tx.categoryName?.toLowerCase();
      if (keyById) categorySpendMap.set(keyById, (categorySpendMap.get(keyById) || 0) + tx.amount);
      if (keyByName && keyByName !== keyById) categorySpendMap.set(keyByName, (categorySpendMap.get(keyByName) || 0) + tx.amount);
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Build category reports with budget comparisons
  const expenseCategories = [...categories.filter((c) => c.type === 'expense')];

  // Add any transaction categories not in default list
  monthTxs.forEach((tx) => {
    if (tx.type === 'expense') {
      const exists = expenseCategories.some(
        (c) => c.id === tx.categoryId || c.name.toLowerCase() === (tx.categoryName || '').toLowerCase()
      );
      if (!exists) {
        expenseCategories.push({
          id: tx.categoryId || `cat-${tx.categoryName}`,
          name: tx.categoryName || 'Other',
          type: 'expense',
          icon: 'Tag',
          color: '#6366F1',
          monthlyBudget: 0,
        });
      }
    }
  });

  let totalBudget = 0;

  const categoryReports = expenseCategories.map((cat) => {
    const budget = cat.monthlyBudget || 0;
    totalBudget += budget;
    const actual = categorySpendMap.get(cat.id) || categorySpendMap.get(cat.name.toLowerCase()) || 0;
    const variance = actual - budget;
    const variancePct = budget > 0 ? (variance / budget) * 100 : 0;
    const percentageOfTotal = totalExpense > 0 ? (actual / totalExpense) * 100 : 0;

    let status: 'within' | 'warning' | 'exceeded' = 'within';
    if (budget > 0) {
      if (actual > budget) status = 'exceeded';
      else if (actual >= budget * 0.85) status = 'warning';
    }

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      color: cat.color,
      icon: cat.icon,
      budget,
      actual,
      variance,
      variancePct,
      percentageOfTotal,
      status,
    };
  }).sort((a, b) => b.actual - a.actual);

  const budgetVariance = totalExpense - totalBudget;
  const isOverBudget = totalBudget > 0 && totalExpense > totalBudget;

  const topSpendingCategories = categoryReports
    .filter((c) => c.actual > 0)
    .slice(0, 5)
    .map((c) => ({
      categoryName: c.categoryName,
      amount: c.actual,
      percentage: c.percentageOfTotal,
      color: c.color,
    }));

  // Daily trend
  const dailyMap = new Map<number, { expense: number; income: number }>();
  for (let day = 1; day <= daysInMonth; day++) {
    dailyMap.set(day, { expense: 0, income: 0 });
  }

  monthTxs.forEach((tx) => {
    const { day } = parseTxDateComponents(tx.date);
    if (day >= 1 && day <= daysInMonth) {
      const entry = dailyMap.get(day);
      if (entry) {
        if (tx.type === 'income') entry.income += tx.amount;
        else entry.expense += tx.amount;
      }
    }
  });

  const dailyTrend = Array.from(dailyMap.entries()).map(([day, val]) => {
    const mm = month < 10 ? `0${month}` : `${month}`;
    const dd = day < 10 ? `0${day}` : `${day}`;
    return {
      day,
      date: `${year}-${mm}-${dd}`,
      expense: val.expense,
      income: val.income,
    };
  });

  return {
    year,
    month,
    monthName,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    totalBudget,
    budgetVariance,
    isOverBudget,
    categoryReports,
    topSpendingCategories,
    dailyTrend,
  };
}

export function generateYearlyReport(
  transactions: Transaction[],
  categories: Category[],
  year: number
): YearlyBudgetReport {
  const yearTxs = transactions.filter((tx) => {
    const { year: ty } = parseTxDateComponents(tx.date);
    return ty === year;
  });

  let totalIncome = 0;
  let totalExpense = 0;

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: MONTH_NAMES[i],
    income: 0,
    expense: 0,
    savings: 0,
    savingsRate: 0,
  }));

  const categoryTotalsMap = new Map<string, number>();

  yearTxs.forEach((tx) => {
    const { month: tm } = parseTxDateComponents(tx.date);
    const m = tm - 1;

    if (tx.type === 'income') {
      totalIncome += tx.amount;
      if (m >= 0 && m < 12) monthlyData[m].income += tx.amount;
    } else {
      totalExpense += tx.amount;
      if (m >= 0 && m < 12) monthlyData[m].expense += tx.amount;
      const cur = categoryTotalsMap.get(tx.categoryId) || categoryTotalsMap.get(tx.categoryName.toLowerCase()) || 0;
      categoryTotalsMap.set(tx.categoryId, cur + tx.amount);
    }
  });

  monthlyData.forEach((m) => {
    m.savings = m.income - m.expense;
    m.savingsRate = m.income > 0 ? (m.savings / m.income) * 100 : 0;
  });

  const quarterlyData = [
    {
      quarter: 'Q1 (Jan - Mar)',
      income: monthlyData.slice(0, 3).reduce((s, m) => s + m.income, 0),
      expense: monthlyData.slice(0, 3).reduce((s, m) => s + m.expense, 0),
      savings: 0,
    },
    {
      quarter: 'Q2 (Apr - Jun)',
      income: monthlyData.slice(3, 6).reduce((s, m) => s + m.income, 0),
      expense: monthlyData.slice(3, 6).reduce((s, m) => s + m.expense, 0),
      savings: 0,
    },
    {
      quarter: 'Q3 (Jul - Sep)',
      income: monthlyData.slice(6, 9).reduce((s, m) => s + m.income, 0),
      expense: monthlyData.slice(6, 9).reduce((s, m) => s + m.expense, 0),
      savings: 0,
    },
    {
      quarter: 'Q4 (Oct - Dec)',
      income: monthlyData.slice(9, 12).reduce((s, m) => s + m.income, 0),
      expense: monthlyData.slice(9, 12).reduce((s, m) => s + m.expense, 0),
      savings: 0,
    },
  ].map((q) => ({
    ...q,
    savings: q.income - q.expense,
  }));

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Active months with recorded expenses
  const activeMonths = monthlyData.filter((m) => m.expense > 0 || m.income > 0).length || 1;
  const averageMonthlyExpense = totalExpense / activeMonths;
  const averageMonthlyIncome = totalIncome / activeMonths;

  const expenseCats = [...categories.filter((c) => c.type === 'expense')];
  yearTxs.forEach((tx) => {
    if (tx.type === 'expense') {
      const exists = expenseCats.some(
        (c) => c.id === tx.categoryId || c.name.toLowerCase() === (tx.categoryName || '').toLowerCase()
      );
      if (!exists) {
        expenseCats.push({
          id: tx.categoryId || `cat-${tx.categoryName}`,
          name: tx.categoryName || 'Other',
          type: 'expense',
          icon: 'Tag',
          color: '#6366F1',
          monthlyBudget: 0,
        });
      }
    }
  });

  const categoryTotals = expenseCats.map((cat) => {
    const totalAmount = categoryTotalsMap.get(cat.id) || categoryTotalsMap.get(cat.name.toLowerCase()) || 0;
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      totalAmount,
      percentage: totalExpense > 0 ? (totalAmount / totalExpense) * 100 : 0,
      monthlyAverage: totalAmount / activeMonths,
      color: cat.color,
      icon: cat.icon,
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    year,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    averageMonthlyExpense,
    averageMonthlyIncome,
    monthlyData,
    quarterlyData,
    categoryTotals,
  };
}
