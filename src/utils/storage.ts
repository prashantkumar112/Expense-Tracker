import { Category, Transaction } from '../types';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { generateSampleTransactions } from '../data/sampleTransactions';

const STORAGE_KEYS = {
  TRANSACTIONS: 'tracker_transactions_v1',
  CATEGORIES: 'tracker_categories_v1',
  CURRENCY: 'tracker_currency_v1',
  INITIALIZED: 'tracker_initialized_v1',
};

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', locale: 'en-GB' },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham (AED)', locale: 'en-AE' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)', locale: 'en-SG' },
];

export function getStoredCurrency(): CurrencyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const matched = SUPPORTED_CURRENCIES.find((c) => c.code === parsed.code);
      if (matched) return matched;
    }
  } catch (e) {
    console.error('Failed to load currency', e);
  }
  return SUPPORTED_CURRENCIES[0]; // Default INR ₹
}

export function setStoredCurrency(curr: CurrencyConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, JSON.stringify(curr));
  } catch (e) {
    console.error('Failed to save currency', e);
  }
}

export function formatCurrency(amount: number, curr?: CurrencyConfig): string {
  const currentCurrency = curr || getStoredCurrency();
  try {
    return new Intl.NumberFormat(currentCurrency.locale, {
      style: 'currency',
      currency: currentCurrency.code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currentCurrency.symbol}${Math.round(amount).toLocaleString()}`;
  }
}

export function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure core default categories like "Others" exist even if loaded from older localStorage
        const existingIds = new Set(parsed.map((c: Category) => c.id));
        const missingDefaults = DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id));
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          setStoredCategories(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load categories', e);
  }
  // Initialize with default
  setStoredCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export function setStoredCategories(cats: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.error('Failed to save categories', e);
  }
}

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    // If first visit, initialize with an empty clean ledger
    if (!initialized) {
      setStoredTransactions([]);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return [];
    }
  } catch (e) {
    console.error('Failed to load transactions', e);
  }
  return [];
}

export function setStoredTransactions(txs: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch (e) {
    console.error('Failed to save transactions', e);
  }
}

export function resetToSampleData(): { transactions: Transaction[]; categories: Category[] } {
  const cats = DEFAULT_CATEGORIES;
  const txs = generateSampleTransactions();
  setStoredCategories(cats);
  setStoredTransactions(txs);
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  return { transactions: txs, categories: cats };
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}
