export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'UPI' | 'Net Banking' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Auto-Debit' | 'Other';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string; // Tailwind color class or hex
  isDefault?: boolean;
  monthlyBudget?: number; // Optional budget target
  description?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  description: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  isRecurring?: boolean;
  tags?: string[];
  excludeFromCashflow?: boolean; // If true (e.g. unpaid credit card expense), does not deduct immediate cashflow
  isCreditCardSettlement?: boolean; // If true (e.g. credit card bill payment from bank), impacts cashflow without double-counting expense categories
  createdAt: number;
}

export interface QuarterComparison {
  quarter: string; // "Q1", "Q2", "Q3", "Q4"
  year1: number;
  year2: number;
  expenseYear1: number;
  expenseYear2: number;
  incomeYear1: number;
  incomeYear2: number;
  expenseDiff: number;
  expenseDiffPct: number;
  incomeDiff: number;
  incomeDiffPct: number;
  categoryBreakdownYear1: Record<string, number>;
  categoryBreakdownYear2: Record<string, number>;
}

export interface MonthlyBudgetReport {
  year: number;
  month: number; // 1 - 12
  monthName: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  totalBudget: number;
  budgetVariance: number;
  isOverBudget: boolean;
  categoryReports: {
    categoryId: string;
    categoryName: string;
    color: string;
    icon: string;
    budget: number;
    actual: number;
    variance: number;
    variancePct: number;
    percentageOfTotal: number;
    status: 'within' | 'warning' | 'exceeded';
  }[];
  topSpendingCategories: {
    categoryName: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  dailyTrend: {
    day: number;
    date: string;
    expense: number;
    income: number;
  }[];
}

export interface YearlyBudgetReport {
  year: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  averageMonthlyExpense: number;
  averageMonthlyIncome: number;
  monthlyData: {
    month: number;
    monthName: string;
    income: number;
    expense: number;
    savings: number;
    savingsRate: number;
  }[];
  quarterlyData: {
    quarter: string;
    income: number;
    expense: number;
    savings: number;
  }[];
  categoryTotals: {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    percentage: number;
    monthlyAverage: number;
    color: string;
    icon: string;
  }[];
}

export interface UploadedExpenseFile {
  id: string;
  name: string;
  size: number;
  type: 'csv' | 'xlsx' | 'xls';
  headers: string[];
  rows: Record<string, any>[];
  totalCount: number;
  status: 'ready' | 'imported' | 'error';
  errorMessage?: string;
}

export interface CsvMappingConfig {
  dateCol: string;
  amountCol: string;
  debitCol?: string;
  creditCol?: string;
  typeCol?: string;
  categoryCol?: string;
  descCol?: string;
  paymentMethodCol?: string;
  defaultType: TransactionType;
  defaultCategory: string;
  dateFormat: 'DD/MM/YY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM/DD/YYYY';
}

export type ActiveTab = 'dashboard' | 'analytics' | 'transactions' | 'reports' | 'categories';
