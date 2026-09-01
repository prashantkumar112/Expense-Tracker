import * as XLSX from 'xlsx';
import { Transaction, Category } from '../types';
import { CurrencyConfig, formatCurrency } from './storage';

export interface GoogleSheetsSyncConfig {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  clientId?: string;
  autoSyncMonthly: boolean;
  syncDayOfMonth: number;
  lastSyncTimestamp?: number;
  lastSyncMonth?: string;
  connectedEmail?: string;
}

const STORAGE_KEY_GSHEETS_CONFIG = 'expense_tracker_gsheets_config';
const STORAGE_KEY_AUTH_TOKEN = 'expense_tracker_google_access_token';
const STORAGE_KEY_TOKEN_EXPIRY = 'expense_tracker_google_token_expiry';

export function getStoredGSheetsConfig(): GoogleSheetsSyncConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GSHEETS_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    autoSyncMonthly: true,
    syncDayOfMonth: 1,
  };
}

export function saveGSheetsConfig(config: GoogleSheetsSyncConfig): void {
  localStorage.setItem(STORAGE_KEY_GSHEETS_CONFIG, JSON.stringify(config));
}

export function getStoredAccessToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
  const expiryStr = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
  if (!token || !expiryStr) return null;
  const expiry = parseInt(expiryStr, 10);
  if (Date.now() > expiry) {
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
    return null;
  }
  return token;
}

export function saveAccessToken(token: string, expiresInSeconds: number): void {
  localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, (Date.now() + (expiresInSeconds - 60) * 1000).toString());
}

export function clearGoogleAuth(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
  const config = getStoredGSheetsConfig();
  delete config.connectedEmail;
  saveGSheetsConfig(config);
}

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Dynamically loads and verifies Google Identity Services script
 */
export async function ensureGoogleIdentityScriptLoaded(): Promise<void> {
  if (window.google?.accounts?.oauth2) {
    return;
  }

  return new Promise((resolve, reject) => {
    let script = document.getElementById('google-gsi-client') as HTMLScriptElement | null;
    
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let elapsed = 0;
    const interval = 100;
    const timeout = 6000;

    const checker = setInterval(() => {
      elapsed += interval;
      if (window.google?.accounts?.oauth2) {
        clearInterval(checker);
        resolve();
      } else if (elapsed >= timeout) {
        clearInterval(checker);
        reject(
          new Error(
            'Google Identity Services script could not be initialized. If you are on an Android APK or have an ad-blocker enabled, Google OAuth popups may be restricted. You can use the "Export Google Sheets Workbook" button below for 100% offline & instant backup.'
          )
        );
      }
    }, interval);
  });
}

/**
 * Request OAuth token using Google Identity Services Token Client
 */
export async function requestGoogleAccessToken(): Promise<string> {
  const existing = getStoredAccessToken();
  if (existing) return existing;

  await ensureGoogleIdentityScriptLoaded();

  const config = getStoredGSheetsConfig();
  const clientId = config.clientId || '1051286839972-client-app.apps.googleusercontent.com';

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services script not loaded.'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
        callback: (resp: any) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error || 'Failed to authenticate with Google.'));
            return;
          }
          if (resp.access_token) {
            const expiresIn = resp.expires_in ? parseInt(resp.expires_in, 10) : 3500;
            saveAccessToken(resp.access_token, expiresIn);
            resolve(resp.access_token);
          } else {
            reject(new Error('No access token received from Google.'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * Fetch connected Google profile / email
 */
export async function fetchGoogleUserEmail(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.email || null;
    }
  } catch {}
  return null;
}

/**
 * Generates an offline Multi-Tab Excel Workbook ready for Google Sheets import
 */
export function generateGoogleSheetsWorkbook(
  transactions: Transaction[],
  categories: Category[],
  currency: CurrencyConfig
): void {
  const sortedTxs = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 1. Sheet 1: All Transactions
  const txData = sortedTxs.map((t) => {
    const parts = t.date.split('-');
    const ddmmyy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}` : t.date;
    return {
      'Description': t.description || '',
      [`Amount (${currency.symbol})`]: t.amount,
      'Created on': ddmmyy,
      'Category': t.categoryName || 'General',
      'Type': t.type.toUpperCase(),
      'Payment Method': t.paymentMethod || 'UPI',
      'Notes': t.notes || '',
      'Date (ISO)': t.date,
    };
  });

  // 2. Sheet 2: Monthly Summary
  const monthlyMap: Record<string, { income: number; expense: number; count: number }> = {};
  sortedTxs.forEach((t) => {
    const m = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap[m]) {
      monthlyMap[m] = { income: 0, expense: 0, count: 0 };
    }
    if (t.type === 'expense') {
      monthlyMap[m].expense += t.amount;
    } else {
      monthlyMap[m].income += t.amount;
    }
    monthlyMap[m].count += 1;
  });

  const summaryData = Object.keys(monthlyMap)
    .sort((a, b) => b.localeCompare(a))
    .map((m) => {
      const d = monthlyMap[m];
      const net = d.income - d.expense;
      const rate = d.income > 0 ? ((net / d.income) * 100).toFixed(1) + '%' : '0%';
      return {
        'Month (YYYY-MM)': m,
        [`Total Inflow (${currency.symbol})`]: d.income,
        [`Total Outflow (${currency.symbol})`]: d.expense,
        [`Net Savings (${currency.symbol})`]: net,
        'Savings Rate': rate,
        'Transaction Count': d.count,
      };
    });

  // 3. Sheet 3: Yearly Comparison
  const yearsInTxs = Array.from(
    new Set(sortedTxs.map((t) => parseInt(t.date.substring(0, 4), 10)))
  )
    .filter((y) => !isNaN(y))
    .sort((a, b) => b - a);

  const currentYear = yearsInTxs[0] || new Date().getFullYear();
  const prevYear = currentYear - 1;

  const currYearTxs = sortedTxs.filter((t) => t.date.startsWith(`${currentYear}-`));
  const prevYearTxs = sortedTxs.filter((t) => t.date.startsWith(`${prevYear}-`));

  const currIncome = currYearTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevIncome = prevYearTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const currExpense = currYearTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevYearTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currNet = currIncome - currExpense;
  const prevNet = prevIncome - prevExpense;

  const yoyTotals = [
    {
      'Metric': 'Total Income (Inflow)',
      [`${prevYear} Total`]: prevIncome,
      [`${currentYear} Total`]: currIncome,
      [`YoY Diff (${currency.symbol})`]: currIncome - prevIncome,
      'YoY Growth (%)': prevIncome > 0 ? (((currIncome - prevIncome) / prevIncome) * 100).toFixed(1) + '%' : '0%',
    },
    {
      'Metric': 'Total Expenses (Outflow)',
      [`${prevYear} Total`]: prevExpense,
      [`${currentYear} Total`]: currExpense,
      [`YoY Diff (${currency.symbol})`]: currExpense - prevExpense,
      'YoY Growth (%)': prevExpense > 0 ? (((currExpense - prevExpense) / prevExpense) * 100).toFixed(1) + '%' : '0%',
    },
    {
      'Metric': 'Net Savings (Surplus)',
      [`${prevYear} Total`]: prevNet,
      [`${currentYear} Total`]: currNet,
      [`YoY Diff (${currency.symbol})`]: currNet - prevNet,
      'YoY Growth (%)': prevNet !== 0 ? (((currNet - prevNet) / Math.abs(prevNet)) * 100).toFixed(1) + '%' : '0%',
    },
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();

  const wsTx = XLSX.utils.json_to_sheet(txData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsYoY = XLSX.utils.json_to_sheet(yoyTotals);

  XLSX.utils.book_append_sheet(wb, wsTx, 'All Transactions');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');
  XLSX.utils.book_append_sheet(wb, wsYoY, 'Yearly Comparison');

  const today = new Date().toISOString().substring(0, 10);
  XLSX.writeFile(wb, `Expense_Tracker_GoogleSheets_Sync_${today}.xlsx`);
}

/**
 * Creates or updates the Master Monthly Expenses Google Spreadsheet
 */
export async function syncExpensesToGoogleSheets(
  transactions: Transaction[],
  categories: Category[],
  currency: CurrencyConfig,
  customSheetTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; rowCount: number }> {
  const token = await requestGoogleAccessToken();
  const config = getStoredGSheetsConfig();

  const title = customSheetTitle || `Personal Expenses Tracker & Monthly Sync`;

  let spreadsheetId = config.spreadsheetId;
  let spreadsheetUrl = config.spreadsheetUrl;

  // 1. Create spreadsheet if none exists or invalid
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'All Transactions',
              gridProperties: { rowCount: 1000, columnCount: 10, frozenRowCount: 1 },
            },
          },
          {
            properties: {
              title: 'Monthly Summary',
              gridProperties: { rowCount: 100, columnCount: 8, frozenRowCount: 1 },
            },
          },
          {
            properties: {
              title: 'Yearly Comparison',
              gridProperties: { rowCount: 300, columnCount: 10, frozenRowCount: 1 },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err?.error?.message || 'Failed to create Google Spreadsheet.');
    }

    const created = await createRes.json();
    spreadsheetId = created.spreadsheetId;
    spreadsheetUrl = created.spreadsheetUrl;
  } else {
    // If spreadsheet already exists, ensure the 'Yearly Comparison' sheet tab is present
    try {
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const sheetTitles = (meta.sheets || []).map((s: any) => s.properties?.title);
        if (!sheetTitles.includes('Yearly Comparison')) {
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: 'Yearly Comparison',
                      gridProperties: { rowCount: 300, columnCount: 10 },
                    },
                  },
                },
              ],
            }),
          });
        }
      }
    } catch {}
  }

  // 2. Prepare Transactions Table Rows
  const sortedTxs = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const txRows = [
    ['Description', 'Amount', 'Created on (DD/MM/YY)', 'Category', 'Type', 'Payment Method', 'Notes', 'ISO Date'],
    ...sortedTxs.map((t) => {
      const parts = t.date.split('-');
      const ddmmyy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}` : t.date;
      return [
        t.description || '',
        t.amount,
        ddmmyy,
        t.categoryName,
        t.type.toUpperCase(),
        t.paymentMethod || 'UPI',
        t.notes || '',
        t.date,
      ];
    }),
  ];

  // 3. Prepare Monthly Aggregated Summary Rows
  const monthlyMap: Record<string, { income: number; expense: number; count: number }> = {};
  sortedTxs.forEach((t) => {
    const m = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap[m]) {
      monthlyMap[m] = { income: 0, expense: 0, count: 0 };
    }
    if (t.type === 'expense') {
      monthlyMap[m].expense += t.amount;
    } else {
      monthlyMap[m].income += t.amount;
    }
    monthlyMap[m].count += 1;
  });

  const summaryRows = [
    ['Month (YYYY-MM)', 'Total Inflow', 'Total Outflow', 'Net Savings', 'Savings Rate (%)', 'Tx Count'],
    ...Object.keys(monthlyMap)
      .sort((a, b) => b.localeCompare(a))
      .map((m) => {
        const d = monthlyMap[m];
        const net = d.income - d.expense;
        const rate = d.income > 0 ? ((net / d.income) * 100).toFixed(1) + '%' : '0%';
        return [m, d.income, d.expense, net, rate, d.count];
      }),
  ];

  // 4. Update 'All Transactions' Sheet
  const updateTxRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'All Transactions'!A1:H${txRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'All Transactions'!A1:H${txRows.length}`,
        majorDimension: 'ROWS',
        values: txRows,
      }),
    }
  );

  if (!updateTxRes.ok) {
    const err = await updateTxRes.json();
    throw new Error(err?.error?.message || 'Failed to update transactions table in Google Sheet.');
  }

  // 5. Update 'Monthly Summary' Sheet
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Monthly Summary'!A1:F${summaryRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'Monthly Summary'!A1:F${summaryRows.length}`,
        majorDimension: 'ROWS',
        values: summaryRows,
      }),
    }
  );

  // 6. Prepare and Update 'Yearly Comparison' Sheet (YoY Category & Total level)
  const yearsInTxs = Array.from(
    new Set(sortedTxs.map((t) => parseInt(t.date.substring(0, 4), 10)))
  )
    .filter((y) => !isNaN(y))
    .sort((a, b) => b - a);

  const currentYear = yearsInTxs[0] || new Date().getFullYear();
  const prevYear = currentYear - 1;

  const currYearTxs = sortedTxs.filter((t) => t.date.startsWith(`${currentYear}-`));
  const prevYearTxs = sortedTxs.filter((t) => t.date.startsWith(`${prevYear}-`));

  const currIncome = currYearTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevIncome = prevYearTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const currExpense = currYearTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevYearTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currNet = currIncome - currExpense;
  const prevNet = prevIncome - prevExpense;
  const currSavingsRate = currIncome > 0 ? ((currNet / currIncome) * 100).toFixed(1) + '%' : '0.0%';
  const prevSavingsRate = prevIncome > 0 ? ((prevNet / prevIncome) * 100).toFixed(1) + '%' : '0.0%';

  const calcGrowthStr = (prev: number, curr: number) => {
    if (prev === 0 && curr === 0) return '0.0%';
    if (prev === 0) return curr > 0 ? '+100.0%' : '-100.0%';
    const pct = ((curr - prev) / Math.abs(prev)) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  // Category breakdown for Expenses
  const expenseCategoriesMap: Record<string, { prev: number; curr: number }> = {};
  categories
    .filter((c) => c.type === 'expense')
    .forEach((c) => {
      expenseCategoriesMap[c.name] = { prev: 0, curr: 0 };
    });

  sortedTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cName = t.categoryName || 'Others';
      if (!expenseCategoriesMap[cName]) {
        expenseCategoriesMap[cName] = { prev: 0, curr: 0 };
      }
      if (t.date.startsWith(`${prevYear}-`)) {
        expenseCategoriesMap[cName].prev += t.amount;
      } else if (t.date.startsWith(`${currentYear}-`)) {
        expenseCategoriesMap[cName].curr += t.amount;
      }
    });

  const categoryExpenseRows = Object.keys(expenseCategoriesMap)
    .filter((cName) => expenseCategoriesMap[cName].prev > 0 || expenseCategoriesMap[cName].curr > 0)
    .sort((a, b) => expenseCategoriesMap[b].curr - expenseCategoriesMap[a].curr)
    .map((cName) => {
      const p = expenseCategoriesMap[cName].prev;
      const c = expenseCategoriesMap[cName].curr;
      const diff = c - p;
      const pShare = prevExpense > 0 ? ((p / prevExpense) * 100).toFixed(1) + '%' : '0.0%';
      const cShare = currExpense > 0 ? ((c / currExpense) * 100).toFixed(1) + '%' : '0.0%';
      return [cName, p, c, diff, calcGrowthStr(p, c), pShare, cShare];
    });

  // Category breakdown for Income
  const incomeCategoriesMap: Record<string, { prev: number; curr: number }> = {};
  sortedTxs
    .filter((t) => t.type === 'income')
    .forEach((t) => {
      const cName = t.categoryName || 'Income';
      if (!incomeCategoriesMap[cName]) {
        incomeCategoriesMap[cName] = { prev: 0, curr: 0 };
      }
      if (t.date.startsWith(`${prevYear}-`)) {
        incomeCategoriesMap[cName].prev += t.amount;
      } else if (t.date.startsWith(`${currentYear}-`)) {
        incomeCategoriesMap[cName].curr += t.amount;
      }
    });

  const categoryIncomeRows = Object.keys(incomeCategoriesMap)
    .filter((cName) => incomeCategoriesMap[cName].prev > 0 || incomeCategoriesMap[cName].curr > 0)
    .sort((a, b) => incomeCategoriesMap[b].curr - incomeCategoriesMap[a].curr)
    .map((cName) => {
      const p = incomeCategoriesMap[cName].prev;
      const c = incomeCategoriesMap[cName].curr;
      const diff = c - p;
      return [cName, p, c, diff, calcGrowthStr(p, c)];
    });

  // Month-by-Month comparison (Jan to Dec)
  const monthNames = [
    '01 - January',
    '02 - February',
    '03 - March',
    '04 - April',
    '05 - May',
    '06 - June',
    '07 - July',
    '08 - August',
    '09 - September',
    '10 - October',
    '11 - November',
    '12 - December',
  ];

  const monthlyYoYRows = monthNames.map((mName, idx) => {
    const mNum = String(idx + 1).padStart(2, '0');
    const prevPrefix = `${prevYear}-${mNum}`;
    const currPrefix = `${currentYear}-${mNum}`;

    const pExp = sortedTxs
      .filter((t) => t.date.startsWith(prevPrefix) && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const cExp = sortedTxs
      .filter((t) => t.date.startsWith(currPrefix) && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const pInc = sortedTxs
      .filter((t) => t.date.startsWith(prevPrefix) && t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const cInc = sortedTxs
      .filter((t) => t.date.startsWith(currPrefix) && t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);

    return [
      mName,
      pExp,
      cExp,
      cExp - pExp,
      calcGrowthStr(pExp, cExp),
      pInc,
      cInc,
      cInc - pInc,
    ];
  });

  const yearlyRows: any[][] = [
    [`YEAR-OVER-YEAR (YoY) FINANCIAL COMPARISON: ${prevYear} vs ${currentYear}`],
    [`Currency: ${currency.code} (${currency.symbol})`, `Last Updated: ${new Date().toLocaleDateString()}`],
    [],
    ['1. OVERALL TOTALS COMPARISON'],
    ['Metric', `${prevYear} Total`, `${currentYear} Total`, `YoY Diff (${currency.symbol})`, 'YoY Growth (%)'],
    ['Total Income (Inflow)', prevIncome, currIncome, currIncome - prevIncome, calcGrowthStr(prevIncome, currIncome)],
    ['Total Expenses (Outflow)', prevExpense, currExpense, currExpense - prevExpense, calcGrowthStr(prevExpense, currExpense)],
    ['Net Savings (Surplus)', prevNet, currNet, currNet - prevNet, calcGrowthStr(prevNet, currNet)],
    ['Savings Rate', prevSavingsRate, currSavingsRate, '-', '-'],
    ['Total Transactions Count', prevYearTxs.length, currYearTxs.length, currYearTxs.length - prevYearTxs.length, calcGrowthStr(prevYearTxs.length, currYearTxs.length)],
    ['Avg Monthly Expense', Number((prevExpense / 12).toFixed(2)), Number((currExpense / 12).toFixed(2)), Number(((currExpense - prevExpense) / 12).toFixed(2)), calcGrowthStr(prevExpense, currExpense)],
    [],
    ['2. CATEGORY-LEVEL EXPENSE COMPARISON'],
    ['Expense Category', `${prevYear} Expenses`, `${currentYear} Expenses`, `YoY Diff (${currency.symbol})`, 'YoY Change (%)', `${prevYear} % Share`, `${currentYear} % Share`],
    ...categoryExpenseRows,
    ['TOTAL EXPENSES', prevExpense, currExpense, currExpense - prevExpense, calcGrowthStr(prevExpense, currExpense), '100.0%', '100.0%'],
    [],
    ['3. CATEGORY-LEVEL INCOME COMPARISON'],
    ['Income Category', `${prevYear} Income`, `${currentYear} Income`, `YoY Diff (${currency.symbol})`, 'YoY Change (%)'],
    ...(categoryIncomeRows.length > 0 ? categoryIncomeRows : [['General Income', prevIncome, currIncome, currIncome - prevIncome, calcGrowthStr(prevIncome, currIncome)]]),
    ['TOTAL INCOME', prevIncome, currIncome, currIncome - prevIncome, calcGrowthStr(prevIncome, currIncome)],
    [],
    ['4. MONTH-BY-MONTH TREND COMPARISON (JAN - DEC)'],
    ['Month', `${prevYear} Expenses`, `${currentYear} Expenses`, `Expense Diff`, `Expense YoY %`, `${prevYear} Income`, `${currentYear} Income`, `Income Diff`],
    ...monthlyYoYRows,
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Yearly Comparison'!A1:H${yearlyRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'Yearly Comparison'!A1:H${yearlyRows.length}`,
        majorDimension: 'ROWS',
        values: yearlyRows,
      }),
    }
  );

  // 7. Update user email and config state
  const email = await fetchGoogleUserEmail(token);
  const currentMonthKey = new Date().toISOString().substring(0, 7);

  const updatedConfig: GoogleSheetsSyncConfig = {
    ...config,
    spreadsheetId,
    spreadsheetUrl: spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    lastSyncTimestamp: Date.now(),
    lastSyncMonth: currentMonthKey,
    connectedEmail: email || config.connectedEmail,
  };
  saveGSheetsConfig(updatedConfig);

  return {
    spreadsheetId,
    spreadsheetUrl: updatedConfig.spreadsheetUrl!,
    rowCount: sortedTxs.length,
  };
}

/**
 * Check if automated monthly sync is due (e.g. on or after 1st of month)
 */
export function isMonthlySyncDue(): boolean {
  const config = getStoredGSheetsConfig();
  if (!config.autoSyncMonthly || !config.spreadsheetId) return false;

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonthKey = now.toISOString().substring(0, 7);

  if (currentDay >= config.syncDayOfMonth && config.lastSyncMonth !== currentMonthKey) {
    return true;
  }
  return false;
}
