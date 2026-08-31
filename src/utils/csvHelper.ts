import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Category, CsvMappingConfig, PaymentMethod, Transaction, TransactionType, UploadedExpenseFile } from '../types';

export function exportTransactionsToCsv(transactions: Transaction[], filename: string = 'transactions_export.csv'): void {
  const rows = transactions.map((t) => ({
    Description: t.description || '',
    Amount: t.amount,
    'Created on': formatDateToDDMMYY(t.date),
    Category: t.categoryName,
    Type: t.type.toUpperCase(),
    'Payment Method': t.paymentMethod,
    Notes: t.notes || '',
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export function exportTransactionsToExcel(transactions: Transaction[], filename: string = 'transactions_export.xlsx'): void {
  const rows = transactions.map((t) => ({
    Description: t.description || '',
    Amount: t.amount,
    'Created on': formatDateToDDMMYY(t.date),
    Category: t.categoryName,
    Type: t.type.toUpperCase(),
    'Payment Method': t.paymentMethod,
    Notes: t.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDateToDDMMYY(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const year2 = parts[0].slice(-2);
    return `${parts[2]}/${parts[1]}/${year2}`;
  }
  return isoDate;
}

export const SAMPLE_HISTORICAL_EXPENSE_ROWS = [
  {
    Description: 'Flat Rent Payment',
    Amount: 22000,
    'Created on': '01/08/24',
    Category: 'Rent',
  },
  {
    Description: 'Monthly support allowance',
    Amount: 12000,
    'Created on': '03/08/24',
    Category: 'Kajal',
  },
  {
    Description: 'HDFC Home Loan EMI',
    Amount: 24500,
    'Created on': '05/08/24',
    Category: 'EMIs',
  },
  {
    Description: 'Agra household upkeep & groceries',
    Amount: 15000,
    'Created on': '07/08/24',
    Category: 'Agra Home',
  },
  {
    Description: 'Mutual Fund SIP & Equities',
    Amount: 35000,
    'Created on': '08/08/24',
    Category: 'Investment',
  },
  {
    Description: 'Bank Recurring Deposit',
    Amount: 10000,
    'Created on': '10/08/24',
    Category: 'RDs',
  },
  {
    Description: 'Supermarket monthly bulk order',
    Amount: 13500,
    'Created on': '12/08/24',
    Category: 'Groceries',
  },
  {
    Description: 'Apollo Pharmacy & health checkup',
    Amount: 4200,
    'Created on': '14/08/24',
    Category: 'Health',
  },
  {
    Description: 'AirFiber Gigabit broadband',
    Amount: 1899,
    'Created on': '15/08/24',
    Category: 'Internet',
  },
  {
    Description: 'HPCL Fuel & Metro pass',
    Amount: 6200,
    'Created on': '20/08/24',
    Category: 'Transport',
  },
  {
    Description: 'Weekend dinner with colleagues',
    Amount: 7800,
    'Created on': '22/08/24',
    Category: 'Outside Food',
  },
  {
    Description: 'Shopping, apparel & grooming',
    Amount: 6800,
    'Created on': '25/08/24',
    Category: 'Personal',
  },
];

export function generateSampleCsvTemplate(): void {
  const csv = Papa.unparse(SAMPLE_HISTORICAL_EXPENSE_ROWS);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, 'historical_expense_template.csv');
}

export function generateSampleExcelTemplate(): void {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_HISTORICAL_EXPENSE_ROWS);
  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 36 }, // Description
    { wch: 14 }, // Amount
    { wch: 16 }, // Created on (DD/MM/YY)
    { wch: 18 }, // Category
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historical Expenses');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, 'historical_expense_template.xlsx');
}

export interface ParsedFileResult {
  headers: string[];
  rows: Record<string, any>[];
  totalCount: number;
}

export function parseCsvFile(file: File): Promise<ParsedFileResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = (results.data as Record<string, any>[]).filter((r) => {
          return Object.values(r).some((v) => v !== undefined && v !== null && String(v).trim() !== '');
        });
        resolve({
          headers,
          rows,
          totalCount: rows.length,
        });
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}

export async function parseExcelFile(file: File): Promise<ParsedFileResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  // Choose the best sheet (one with rows, or matching "expense"/"transaction"/"july"/etc.)
  let bestSheetName = workbook.SheetNames[0];
  if (!bestSheetName) {
    throw new Error('Excel workbook has no sheets.');
  }

  for (const name of workbook.SheetNames) {
    const s = workbook.Sheets[name];
    if (s && s['!ref']) {
      const lower = name.toLowerCase();
      if (lower.includes('expense') || lower.includes('transaction') || lower.includes('data') || lower.includes('2026') || lower.includes('jul')) {
        bestSheetName = name;
        break;
      }
    }
  }

  const sheet = workbook.Sheets[bestSheetName];
  if (!sheet) {
    return { headers: [], rows: [], totalCount: 0 };
  }

  // Parse as 2D array matrix first to find the true header row
  const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
    dateNF: 'dd/mm/yy',
  });

  if (!rawMatrix || rawMatrix.length === 0) {
    return { headers: [], rows: [], totalCount: 0 };
  }

  // Find header row index: scan top rows for recognizable keywords
  let headerRowIdx = 0;
  const headerKeywords = [
    'date', 'created', 'created on', 'amount', 'amt', 'desc', 'description',
    'particular', 'particulars', 'category', 'type', 'debit', 'credit', 'cost',
    'spend', 'narration', 'flow', 'payment'
  ];

  for (let i = 0; i < Math.min(rawMatrix.length, 10); i++) {
    const row = rawMatrix[i];
    if (Array.isArray(row)) {
      const matchCount = row.filter((cell) => {
        const str = String(cell || '').toLowerCase().trim();
        return str !== '' && headerKeywords.some((kw) => str === kw || str.includes(kw));
      }).length;
      if (matchCount >= 2) {
        headerRowIdx = i;
        break;
      }
    }
  }

  const headerRow = (rawMatrix[headerRowIdx] || []).map((h: any, colIdx: number) => {
    const str = String(h || '').trim();
    return str || `Column_${colIdx + 1}`;
  });

  const rows: Record<string, any>[] = [];
  for (let r = headerRowIdx + 1; r < rawMatrix.length; r++) {
    const rawRow = rawMatrix[r];
    if (!Array.isArray(rawRow)) continue;

    // Check if row has any non-empty cell
    const hasData = rawRow.some((c) => c !== undefined && c !== null && String(c).trim() !== '');
    if (!hasData) continue;

    const rowObj: Record<string, any> = {};
    headerRow.forEach((colName, colIdx) => {
      rowObj[colName] = rawRow[colIdx] !== undefined ? rawRow[colIdx] : '';
    });
    rows.push(rowObj);
  }

  return {
    headers: headerRow,
    rows,
    totalCount: rows.length,
  };
}

export async function parseExpenseFile(file: File): Promise<ParsedFileResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel')) {
    return await parseExcelFile(file);
  }
  return await parseCsvFile(file);
}

export async function parseMultipleExpenseFiles(files: File[]): Promise<UploadedExpenseFile[]> {
  const results: UploadedExpenseFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const nameLower = file.name.toLowerCase();
    const type: 'csv' | 'xlsx' | 'xls' = nameLower.endsWith('.xlsx')
      ? 'xlsx'
      : nameLower.endsWith('.xls')
      ? 'xls'
      : 'csv';

    try {
      const parsed = await parseExpenseFile(file);
      results.push({
        id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: file.size,
        type,
        headers: parsed.headers,
        rows: parsed.rows,
        totalCount: parsed.totalCount,
        status: parsed.totalCount > 0 ? 'ready' : 'error',
        errorMessage: parsed.totalCount === 0 ? 'File is empty or contains no readable rows.' : undefined,
      });
    } catch (err: any) {
      results.push({
        id: `file-err-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type,
        headers: [],
        rows: [],
        totalCount: 0,
        status: 'error',
        errorMessage: err?.message || 'Failed to parse file.',
      });
    }
  }

  return results;
}

export function autoDetectColumnMapping(headers: string[]): CsvMappingConfig {
  const findExactOrIncludes = (keywords: string[]) => {
    // 1. Try exact match first
    for (const k of keywords) {
      const found = headers.find((h) => h.toLowerCase().trim() === k.toLowerCase());
      if (found) return found;
    }
    // 2. Try prefix / includes match
    for (const k of keywords) {
      const found = headers.find((h) => h.toLowerCase().trim().includes(k.toLowerCase()));
      if (found) return found;
    }
    return '';
  };

  const dateCol =
    findExactOrIncludes(['created on', 'created_on', 'created date', 'date', 'txn date', 'transaction date', 'txn_date']) ||
    headers[0] ||
    '';

  const debitCol = findExactOrIncludes(['debit', 'dr', 'withdrawal', 'outflow', 'expense amount', 'paid out']);
  const creditCol = findExactOrIncludes(['credit', 'cr', 'deposit', 'inflow', 'received', 'income amount']);

  const amountCol =
    findExactOrIncludes(['amount', 'amt', 'expense', 'cost', 'spend', 'price', 'value', 'transaction amount']) ||
    debitCol ||
    headers[1] ||
    '';

  const descCol =
    findExactOrIncludes(['description', 'desc', 'narration', 'particulars', 'particular', 'memo', 'note', 'details', 'item', 'title']) ||
    headers[2] ||
    '';

  const categoryCol =
    findExactOrIncludes(['category', 'categories', 'cat', 'head', 'classification', 'group', 'tag']) ||
    headers[3] ||
    '';

  const typeCol = findExactOrIncludes(['type', 'transaction type', 'flow', 'credit/debit', 'cr/dr', 'in/out']);
  const paymentMethodCol = findExactOrIncludes(['payment method', 'payment mode', 'mode', 'method', 'channel', 'account', 'bank', 'wallet']);

  return {
    dateCol,
    amountCol,
    debitCol,
    creditCol,
    descCol,
    categoryCol,
    typeCol,
    paymentMethodCol,
    defaultType: 'expense',
    defaultCategory: 'cat-others',
    dateFormat: 'DD/MM/YY',
  };
}

/**
 * Robust date parser supporting DD/MM/YY (e.g. 25/08/24), DD/MM/YYYY, Excel Date instances, serials, and ISO dates.
 */
export function parseFlexibleDate(raw: any, preferredFormat: string = 'DD/MM/YY'): string | null {
  if (raw === undefined || raw === null) return null;

  // 1. JavaScript Date instance (e.g. from SheetJS cellDates)
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Numeric Excel serial number (e.g. 45529 -> 2024-08-25)
  if (typeof raw === 'number' && raw > 1000 && raw < 100000) {
    try {
      const utc_days = Math.floor(raw - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      const y = date_info.getUTCFullYear();
      const m = String(date_info.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date_info.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {}
  }

  const str = String(raw).trim();
  if (!str) return null;

  // 3. ISO format YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 4. DD/MM/YY or DD/MM/YYYY (or with '-' or '.' separators)
  const dmyMatch = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const yearRaw = dmyMatch[3];

    let fullYear = parseInt(yearRaw, 10);
    if (yearRaw.length === 2) {
      // 2-digit year (e.g. 26 -> 2026, 24 -> 2024, 99 -> 1999)
      fullYear = fullYear < 70 ? 2000 + fullYear : 1900 + fullYear;
    }

    let day = p1;
    let month = p2;

    if (preferredFormat === 'MM/DD/YYYY') {
      month = p1;
      day = p2;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const yStr = String(fullYear);
      const mStr = String(month).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      return `${yStr}-${mStr}-${dStr}`;
    }
  }

  // 5. Fallback via Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

const INCOME_KEYWORDS = [
  'salary', 'income', 'inflow', 'credit', 'freelance', 'dividend', 'dividends',
  'interest', 'bonus', 'stipend', 'rental income', 'rent received', 'refund',
  'cashback', 'reimbursement', 'deposit', 'pension', 'consulting', 'wages',
  'sales revenue', 'honorarium', 'royalty'
];

function isSummaryOrTotalRow(desc: string, cat: string, type: string, notes: string): boolean {
  const cleanDesc = (desc || '').toLowerCase().trim();
  const cleanCat = (cat || '').toLowerCase().trim();
  const cleanType = (type || '').toLowerCase().trim();
  const combined = `${cleanDesc} ${cleanCat} ${cleanType} ${notes || ''}`.toLowerCase();

  const exactSummaryTerms = [
    'total', 'totals', 'grand total', 'sub total', 'subtotal', 'sub-total',
    'total expense', 'total expenses', 'total outflow', 'total spend',
    'total income', 'total inflow', 'net total', 'monthly total', 'sum',
    'summary', 'balance', 'closing balance', 'opening balance', 'net savings',
    'average', 'monthly average'
  ];

  if (exactSummaryTerms.includes(cleanDesc) || exactSummaryTerms.includes(cleanCat)) {
    return true;
  }

  if (
    combined.startsWith('total ') ||
    combined.startsWith('grand total') ||
    combined.startsWith('subtotal') ||
    combined.startsWith('sub total') ||
    combined.startsWith('net total')
  ) {
    return true;
  }

  return false;
}

export function mapAndImportTransactions(
  rows: Record<string, any>[],
  config: CsvMappingConfig,
  categories: Category[],
  sourceFileName?: string
): { transactions: Transaction[]; errors: string[]; createdCategories: Category[] } {
  const transactions: Transaction[] = [];
  const errors: string[] = [];
  const createdCategories: Category[] = [];
  const localCategories = [...categories];

  rows.forEach((row, idx) => {
    try {
      const dateRaw = config.dateCol ? row[config.dateCol] : undefined;
      const amountRaw = config.amountCol ? row[config.amountCol] : undefined;
      const debitRaw = config.debitCol ? row[config.debitCol] : undefined;
      const creditRaw = config.creditCol ? row[config.creditCol] : undefined;
      const typeRaw = config.typeCol ? String(row[config.typeCol] || '').trim().toLowerCase() : '';
      const categoryRaw = config.categoryCol ? String(row[config.categoryCol] || '').trim() : '';
      const descRaw = config.descCol ? String(row[config.descCol] || '').trim() : '';
      const paymentMethodRaw = config.paymentMethodCol ? String(row[config.paymentMethodCol] || '').trim() : '';

      // Skip summary / subtotal rows often present at the bottom of expense spreadsheets
      if (isSummaryOrTotalRow(descRaw, categoryRaw, typeRaw, '')) {
        errors.push(`Row #${idx + 1}: Skipped summary/total row "${descRaw || categoryRaw}".`);
        return;
      }

      if (dateRaw === undefined || dateRaw === null || String(dateRaw).trim() === '') {
        errors.push(`Row #${idx + 1}: Missing "Created on" / Date.`);
        return;
      }

      // Parse Amount & Debit/Credit
      let amount = 0;
      let inferredType: TransactionType = config.defaultType || 'expense';

      const parseNum = (val: any): number => {
        if (val === undefined || val === null || String(val).trim() === '') return 0;
        let str = String(val).replace(/₹|\$|€|£|INR|USD|EUR|GBP|,/gi, '').trim();
        if (str.startsWith('(') && str.endsWith(')')) {
          str = '-' + str.slice(1, -1);
        }
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
      };

      const debitVal = debitRaw !== undefined ? parseNum(debitRaw) : 0;
      const creditVal = creditRaw !== undefined ? parseNum(creditRaw) : 0;

      if (debitVal > 0 && creditVal === 0) {
        amount = Math.abs(debitVal);
        inferredType = 'expense';
      } else if (creditVal > 0 && debitVal === 0) {
        amount = Math.abs(creditVal);
        inferredType = 'income';
      } else {
        const rawNum = parseNum(amountRaw);
        amount = Math.abs(rawNum);
        if (rawNum < 0) {
          inferredType = 'expense';
        }
      }

      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row #${idx + 1}: Invalid or zero amount (${String(amountRaw || debitRaw || creditRaw)}).`);
        return;
      }

      // Parse Date (DD/MM/YY prioritized)
      const standardDate = parseFlexibleDate(dateRaw, config.dateFormat);
      if (!standardDate) {
        errors.push(`Row #${idx + 1}: Could not parse date format: "${String(dateRaw)}". Expected DD/MM/YY.`);
        return;
      }

      // Determine Transaction Type (Income vs Expense)
      let type: TransactionType = inferredType;

      if (typeRaw) {
        if (typeRaw.includes('inc') || typeRaw.includes('credit') || typeRaw.includes('cr') || typeRaw === '+') {
          type = 'income';
        } else if (typeRaw.includes('exp') || typeRaw.includes('debit') || typeRaw.includes('dr') || typeRaw === '-') {
          type = 'expense';
        }
      }

      // Category matching & Auto-discovery
      let categoryId = '';
      let categoryName = '';

      if (categoryRaw) {
        const matched = localCategories.find(
          (c) => c.name.toLowerCase() === categoryRaw.toLowerCase()
        );
        if (matched) {
          categoryId = matched.id;
          categoryName = matched.name;
          // CRITICAL: Respect matched category type (e.g. Salary is Income)
          if (!typeRaw && debitVal === 0 && creditVal === 0) {
            type = matched.type;
          }
        } else {
          // Check if category name suggests income
          const catLower = categoryRaw.toLowerCase();
          const descLower = descRaw.toLowerCase();
          const isIncomeName = INCOME_KEYWORDS.some((kw) => catLower.includes(kw) || descLower.includes(kw));
          
          if (!typeRaw && isIncomeName && debitVal === 0) {
            type = 'income';
          }

          // Dynamic category creation
          const newCatId = `cat-${categoryRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          categoryId = newCatId;
          categoryName = categoryRaw;

          const newCat: Category = {
            id: newCatId,
            name: categoryRaw,
            type,
            icon: type === 'income' ? 'Wallet' : 'Tag',
            color: type === 'income' ? '#059669' : '#6366F1',
            description: 'Auto-created from historical file import',
          };
          localCategories.push(newCat);
          createdCategories.push(newCat);
        }
      } else {
        // If no category specified, check description for income keywords
        const descLower = descRaw.toLowerCase();
        if (!typeRaw && INCOME_KEYWORDS.some((kw) => descLower.includes(kw))) {
          type = 'income';
        }

        const defaultCat = localCategories.find((c) => c.id === config.defaultCategory) || localCategories[0];
        categoryId = defaultCat.id;
        categoryName = defaultCat.name;
      }

      // Payment method inference
      let paymentMethod: PaymentMethod = 'UPI';
      if (paymentMethodRaw) {
        const pmLower = paymentMethodRaw.toLowerCase();
        if (pmLower.includes('net') || pmLower.includes('bank') || pmLower.includes('neft') || pmLower.includes('rtgs') || pmLower.includes('imps')) {
          paymentMethod = 'Net Banking';
        } else if (pmLower.includes('credit')) {
          paymentMethod = 'Credit Card';
        } else if (pmLower.includes('debit')) {
          paymentMethod = 'Debit Card';
        } else if (pmLower.includes('cash')) {
          paymentMethod = 'Cash';
        } else if (pmLower.includes('auto') || pmLower.includes('mandate') || pmLower.includes('ach') || pmLower.includes('sip')) {
          paymentMethod = 'Auto-Debit';
        } else if (pmLower.includes('upi') || pmLower.includes('gpay') || pmLower.includes('phonepe') || pmLower.includes('paytm')) {
          paymentMethod = 'UPI';
        }
      }

      const description = descRaw || `${categoryName} ${type}`;

      transactions.push({
        id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        date: standardDate,
        amount,
        type,
        categoryId,
        categoryName,
        description,
        paymentMethod,
        notes: sourceFileName ? `Imported from ${sourceFileName}` : `Imported historical record on ${new Date().toLocaleDateString()}`,
        createdAt: Date.now(),
      });
    } catch (e: any) {
      errors.push(`Row #${idx + 1}: ${e?.message || 'Parsing error'}`);
    }
  });

  return { transactions, errors, createdCategories };
}
