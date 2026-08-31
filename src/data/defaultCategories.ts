import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // The 15 user-requested expense categories
  {
    id: 'cat-emis',
    name: 'EMIs',
    type: 'expense',
    icon: 'CreditCard',
    color: '#EF4444', // Red
    isDefault: true,
    monthlyBudget: 25000,
    description: 'Loan EMIs, car/home finance & installments',
  },
  {
    id: 'cat-rent',
    name: 'Rent',
    type: 'expense',
    icon: 'Home',
    color: '#F97316', // Orange
    isDefault: true,
    monthlyBudget: 22000,
    description: 'Apartment and flat rental payments',
  },
  {
    id: 'cat-kajal',
    name: 'Kajal',
    type: 'expense',
    icon: 'HeartHandshake',
    color: '#EC4899', // Pink
    isDefault: true,
    monthlyBudget: 12000,
    description: 'Dedicated support & family allowance',
  },
  {
    id: 'cat-agra-home',
    name: 'Agra Home',
    type: 'expense',
    icon: 'Building2',
    color: '#8B5CF6', // Purple
    isDefault: true,
    monthlyBudget: 15000,
    description: 'Agra family house expenses, maintenance & bills',
  },
  {
    id: 'cat-insurance',
    name: 'Insurance',
    type: 'expense',
    icon: 'ShieldCheck',
    color: '#06B6D4', // Cyan
    isDefault: true,
    monthlyBudget: 8000,
    description: 'Term life, health & vehicle insurance premiums',
  },
  {
    id: 'cat-groceries',
    name: 'Groceries',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#10B981', // Emerald
    isDefault: true,
    monthlyBudget: 14000,
    description: 'Supermarket, vegetables, daily essentials',
  },
  {
    id: 'cat-investment',
    name: 'Investment',
    type: 'expense',
    icon: 'TrendingUp',
    color: '#3B82F6', // Blue
    isDefault: true,
    monthlyBudget: 35000,
    description: 'Mutual funds SIP, stocks & gold investments',
  },
  {
    id: 'cat-rds',
    name: 'RDs',
    type: 'expense',
    icon: 'Landmark',
    color: '#6366F1', // Indigo
    isDefault: true,
    monthlyBudget: 10000,
    description: 'Recurring deposits & post office savings',
  },
  {
    id: 'cat-entertainment',
    name: 'Entertainment',
    type: 'expense',
    icon: 'Film',
    color: '#F43F5E', // Rose
    isDefault: true,
    monthlyBudget: 6000,
    description: 'Movies, streaming OTT, events & outings',
  },
  {
    id: 'cat-health',
    name: 'Health',
    type: 'expense',
    icon: 'Activity',
    color: '#14B8A6', // Teal
    isDefault: true,
    monthlyBudget: 5000,
    description: 'Pharmacy, doctor consultations & gym',
  },
  {
    id: 'cat-outside-food',
    name: 'Outside Food',
    type: 'expense',
    icon: 'Utensils',
    color: '#EAB308', // Amber
    isDefault: true,
    monthlyBudget: 8000,
    description: 'Dining out, cafes, Swiggy, Zomato',
  },
  {
    id: 'cat-hyd-home',
    name: 'Hyd Home',
    type: 'expense',
    icon: 'MapPin',
    color: '#A855F7', // Violet
    isDefault: true,
    monthlyBudget: 12000,
    description: 'Hyderabad accommodation & utility upkeep',
  },
  {
    id: 'cat-transport',
    name: 'Transport',
    type: 'expense',
    icon: 'Car',
    color: '#64748B', // Slate
    isDefault: true,
    monthlyBudget: 6500,
    description: 'Fuel, cabs (Ola/Uber), metro & travel',
  },
  {
    id: 'cat-internet',
    name: 'Internet',
    type: 'expense',
    icon: 'Wifi',
    color: '#0284C7', // Sky
    isDefault: true,
    monthlyBudget: 2000,
    description: 'Broadband, mobile data recharges & cloud subs',
  },
  {
    id: 'cat-personal',
    name: 'Personal',
    type: 'expense',
    icon: 'User',
    color: '#D97706', // Warm Amber
    isDefault: true,
    monthlyBudget: 7000,
    description: 'Shopping, apparel, grooming & miscellaneous',
  },
  {
    id: 'cat-others',
    name: 'Others',
    type: 'expense',
    icon: 'Tag',
    color: '#64748B', // Slate / Neutral Gray
    isDefault: true,
    monthlyBudget: 5000,
    description: 'Fallback category for miscellaneous & unclassified expenses',
  },

  // Standard Income categories
  {
    id: 'cat-salary',
    name: 'Salary',
    type: 'income',
    icon: 'Briefcase',
    color: '#10B981', // Green
    isDefault: true,
    description: 'Primary employment monthly salary',
  },
  {
    id: 'cat-freelance',
    name: 'Freelance & Consulting',
    type: 'income',
    icon: 'Laptop',
    color: '#3B82F6', // Blue
    isDefault: true,
    description: 'Secondary consulting, gig work & projects',
  },
  {
    id: 'cat-investment-return',
    name: 'Investment Returns',
    type: 'income',
    icon: 'CircleDollarSign',
    color: '#8B5CF6', // Purple
    isDefault: true,
    description: 'Dividends, capital gains & interest payouts',
  },
  {
    id: 'cat-rental-income',
    name: 'Rental Income',
    type: 'income',
    icon: 'Building',
    color: '#06B6D4', // Cyan
    isDefault: true,
    description: 'Property rentals & sub-leasing receipts',
  },
  {
    id: 'cat-bonus-other',
    name: 'Bonus & Others',
    type: 'income',
    icon: 'Gift',
    color: '#F59E0B', // Amber
    isDefault: true,
    description: 'Annual performance bonus, cash gifts, refunds',
  },
];
