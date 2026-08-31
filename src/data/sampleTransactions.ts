import { Transaction } from '../types';

// Generate authentic, multi-year sample transactions from 2024 up to August 2026
export function generateSampleTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  let idCounter = 1;

  // Base monthly expenses config with realistic variations
  const monthlyExpensesConfig = [
    { catId: 'cat-emis', name: 'EMIs', amount: 24500, day: 5, method: 'Auto-Debit' as const, desc: 'HDFC Home & Vehicle EMI' },
    { catId: 'cat-rent', name: 'Rent', amount: 22000, day: 1, method: 'Net Banking' as const, desc: 'Apartment Monthly Rent' },
    { catId: 'cat-kajal', name: 'Kajal', amount: 12000, day: 3, method: 'UPI' as const, desc: 'Monthly Support Allowance' },
    { catId: 'cat-agra-home', name: 'Agra Home', amount: 15000, day: 7, method: 'UPI' as const, desc: 'Agra Household & Maintenance' },
    { catId: 'cat-insurance', name: 'Insurance', amount: 7500, day: 10, method: 'Net Banking' as const, desc: 'Life & Health Policy Premium' },
    { catId: 'cat-groceries', name: 'Groceries', amount: 13500, day: 12, method: 'UPI' as const, desc: 'Monthly Supermarket & Provisions' },
    { catId: 'cat-investment', name: 'Investment', amount: 35000, day: 8, method: 'Auto-Debit' as const, desc: 'Mutual Fund SIP & Equity' },
    { catId: 'cat-rds', name: 'RDs', amount: 10000, day: 10, method: 'Auto-Debit' as const, desc: 'Post Office & Bank RD' },
    { catId: 'cat-entertainment', name: 'Entertainment', amount: 5500, day: 18, method: 'Credit Card' as const, desc: 'Movies, Netflix & Weekend Outing' },
    { catId: 'cat-health', name: 'Health', amount: 4200, day: 14, method: 'UPI' as const, desc: 'Pharmacy, Supplements & Health Check' },
    { catId: 'cat-outside-food', name: 'Outside Food', amount: 7800, day: 22, method: 'UPI' as const, desc: 'Swiggy/Zomato & Dining Out' },
    { catId: 'cat-hyd-home', name: 'Hyd Home', amount: 11500, day: 6, method: 'Net Banking' as const, desc: 'Hyderabad Utilities & Maintenance' },
    { catId: 'cat-transport', name: 'Transport', amount: 6200, day: 20, method: 'Credit Card' as const, desc: 'Fuel & Metro Recharge' },
    { catId: 'cat-internet', name: 'Internet', amount: 1899, day: 15, method: 'UPI' as const, desc: 'Fiber Broadband & Mobile 5G' },
    { catId: 'cat-personal', name: 'Personal', amount: 6800, day: 25, method: 'Credit Card' as const, desc: 'Shopping, Grooming & Self-care' },
  ];

  // Helper to format date YYYY-MM-DD
  const formatDate = (year: number, month: number, day: number) => {
    const mm = month < 10 ? `0${month}` : `${month}`;
    const dd = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${mm}-${dd}`;
  };

  // Generate 2024 (all 12 months)
  // Generate 2025 (all 12 months)
  // Generate 2026 (Jan to Aug)
  const years = [
    { year: 2024, maxMonth: 12, salaryBase: 195000, inflationMod: 0.92 },
    { year: 2025, maxMonth: 12, salaryBase: 215000, inflationMod: 1.0 },
    { year: 2026, maxMonth: 8, salaryBase: 235000, inflationMod: 1.08 },
  ];

  for (const yr of years) {
    for (let m = 1; m <= yr.maxMonth; m++) {
      // 1. Primary Salary Income on 1st
      transactions.push({
        id: `tx-${idCounter++}`,
        date: formatDate(yr.year, m, 1),
        amount: yr.salaryBase,
        type: 'income',
        categoryId: 'cat-salary',
        categoryName: 'Salary',
        description: 'Tech Corp Monthly Salary',
        paymentMethod: 'Net Banking',
        isRecurring: true,
        createdAt: new Date(yr.year, m - 1, 1).getTime(),
      });

      // 2. Occasional Freelance / Consulting Income
      if (m % 2 === 0) {
        transactions.push({
          id: `tx-${idCounter++}`,
          date: formatDate(yr.year, m, 16),
          amount: Math.round(25000 * yr.inflationMod),
          type: 'income',
          categoryId: 'cat-freelance',
          categoryName: 'Freelance & Consulting',
          description: 'Consulting Retainer & Architecture Review',
          paymentMethod: 'Net Banking',
          createdAt: new Date(yr.year, m - 1, 16).getTime(),
        });
      }

      // 3. Investment Dividend / Quarterly Interest in Mar, Jun, Sep, Dec
      if (m % 3 === 0) {
        transactions.push({
          id: `tx-${idCounter++}`,
          date: formatDate(yr.year, m, 28),
          amount: Math.round((12000 + m * 600) * yr.inflationMod),
          type: 'income',
          categoryId: 'cat-investment-return',
          categoryName: 'Investment Returns',
          description: 'Quarterly Mutual Fund Dividend & Interest',
          paymentMethod: 'Net Banking',
          createdAt: new Date(yr.year, m - 1, 28).getTime(),
        });
      }

      // 4. Annual Bonus in March (Q1 appraisal)
      if (m === 3) {
        transactions.push({
          id: `tx-${idCounter++}`,
          date: formatDate(yr.year, m, 25),
          amount: Math.round(150000 * yr.inflationMod),
          type: 'income',
          categoryId: 'cat-bonus-other',
          categoryName: 'Bonus & Others',
          description: 'Annual Performance Appraisal Bonus',
          paymentMethod: 'Net Banking',
          createdAt: new Date(yr.year, m - 1, 25).getTime(),
        });
      }

      // 5. Monthly Expenses for all 15 categories
      for (const item of monthlyExpensesConfig) {
        // slight monthly pseudo-random variance (+- 8%) except for fixed EMIs and Rent
        let amt = item.amount * yr.inflationMod;
        if (item.catId !== 'cat-emis' && item.catId !== 'cat-rent' && item.catId !== 'cat-rds') {
          const varianceMultiplier = 0.94 + ((m * 7 + idCounter) % 15) / 100;
          amt = Math.round(amt * varianceMultiplier);
        } else {
          amt = Math.round(amt);
        }

        // Slight adjustment for day to avoid invalid leap year dates
        const day = Math.min(item.day, 28);

        transactions.push({
          id: `tx-${idCounter++}`,
          date: formatDate(yr.year, m, day),
          amount: amt,
          type: 'expense',
          categoryId: item.catId,
          categoryName: item.name,
          description: item.desc,
          paymentMethod: item.method,
          isRecurring: ['cat-emis', 'cat-rent', 'cat-rds', 'cat-investment'].includes(item.catId),
          createdAt: new Date(yr.year, m - 1, day).getTime(),
        });
      }

      // 6. Occasional mid-month extra expense (e.g. festive shopping or travel)
      if (m === 10 || m === 11) {
        // Diwali/Festival period
        transactions.push({
          id: `tx-${idCounter++}`,
          date: formatDate(yr.year, m, 23),
          amount: Math.round(18000 * yr.inflationMod),
          type: 'expense',
          categoryId: 'cat-personal',
          categoryName: 'Personal',
          description: 'Festive Shopping, Gifts & Celebrations',
          paymentMethod: 'Credit Card',
          createdAt: new Date(yr.year, m - 1, 23).getTime(),
        });
      }
    }
  }

  // Sort descending by date
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
