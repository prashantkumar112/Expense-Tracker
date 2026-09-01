import React, { useState, useEffect } from 'react';
import { ActiveTab, Category, Transaction } from './types';
import {
  CurrencyConfig,
  getStoredCategories,
  getStoredCurrency,
  getStoredTransactions,
  setStoredCategories,
  setStoredCurrency,
  setStoredTransactions,
  clearAllData,
} from './utils/storage';
import { AndroidHeader } from './components/AndroidHeader';
import { AndroidNavigation } from './components/AndroidNavigation';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetReportsView } from './components/BudgetReportsView';
import { CategoriesAndImportView } from './components/CategoriesAndImportView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { isMonthlySyncDue, syncExpensesToGoogleSheets } from './utils/googleSheetsSync';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState<CurrencyConfig>(getStoredCurrency());
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addModalType, setAddModalType] = useState<'expense' | 'income'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Drilldown category filter
  const [drilldownCategory, setDrilldownCategory] = useState<string | undefined>(undefined);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  // Initial Load from Storage
  useEffect(() => {
    const storedCats = getStoredCategories();
    const storedTxs = getStoredTransactions();
    const storedCurr = getStoredCurrency();

    // Set initial storage states
    setCategories(storedCats);
    setTransactions(storedTxs);
    setCurrency(storedCurr);

    // Check if automated monthly sync is due
    if (isMonthlySyncDue() && storedTxs.length > 0) {
      syncExpensesToGoogleSheets(storedTxs, storedCats, storedCurr)
        .then((res) => {
          showToast(`Automated Monthly Sync: ${res.rowCount} records pushed to Google Sheets!`);
        })
        .catch(() => {
          // Silent fallback or user will trigger when online
        });
    }
  }, []);

  // Update Currency
  const handleCurrencyChange = (newCurrency: CurrencyConfig) => {
    setCurrency(newCurrency);
    setStoredCurrency(newCurrency);
    showToast(`Currency changed to ${newCurrency.symbol} (${newCurrency.code})`);
  };

  // Transaction Handlers
  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    if (txData.id) {
      // Edit
      const updated = transactions.map((t) =>
        t.id === txData.id ? ({ ...t, ...txData } as Transaction) : t
      );
      setTransactions(updated);
      setStoredTransactions(updated);
      showToast('Transaction updated successfully.');
    } else {
      // Add new
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: txData.date || new Date().toISOString().substring(0, 10),
        amount: txData.amount || 0,
        type: txData.type || 'expense',
        categoryId: txData.categoryId || 'cat-personal',
        categoryName: txData.categoryName || 'Personal',
        description: txData.description || txData.categoryName || 'Expense',
        paymentMethod: txData.paymentMethod || 'UPI',
        notes: txData.notes,
        isRecurring: txData.isRecurring,
        createdAt: Date.now(),
      };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      setStoredTransactions(updated);
      showToast(`${newTx.type === 'income' ? 'Income' : 'Expense'} recorded.`);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    setStoredTransactions(updated);
    showToast('Transaction deleted.');
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setAddModalType(tx.type);
    setIsAddModalOpen(true);
  };

  const handleOpenAddModal = (type: 'expense' | 'income' = 'expense') => {
    setEditingTransaction(null);
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  // Category Handlers
  const handleAddCategory = (newCat: Category) => {
    const updated = [...categories, newCat];
    setCategories(updated);
    setStoredCategories(updated);
    showToast(`Category "${newCat.name}" created.`);
  };

  const handleUpdateCategory = (cat: Category) => {
    const updated = categories.map((c) => (c.id === cat.id ? cat : c));
    setCategories(updated);
    setStoredCategories(updated);
    showToast(`Budget limit updated for "${cat.name}".`);
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    setStoredCategories(updated);
    showToast(`Category "${cat?.name || 'Custom'}" removed.`);
  };

  // Excel / CSV Historical Import
  const handleImportTransactions = (imported: Transaction[], newCategories?: Category[]) => {
    const updated = [...imported, ...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setTransactions(updated);
    setStoredTransactions(updated);

    if (newCategories && newCategories.length > 0) {
      const existingNames = new Set(categories.map((c) => c.name.toLowerCase()));
      const filteredNew = newCategories.filter((c) => !existingNames.has(c.name.toLowerCase()));
      if (filteredNew.length > 0) {
        const mergedCategories = [...categories, ...filteredNew];
        setCategories(mergedCategories);
        setStoredCategories(mergedCategories);
      }
    }

    showToast(`Successfully imported ${imported.length} historical records.`);
    setActiveTab('transactions');
  };

  // Clear all
  const handleClearAll = () => {
    clearAllData();
    setTransactions([]);
    showToast('All transaction records cleared.');
  };

  // Drilldown to transactions from analytics
  const handleCategoryDrilldown = (catId: string) => {
    setDrilldownCategory(catId);
    setActiveTab('transactions');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-start antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 z-50 animate-bounce bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl shadow-indigo-200 ring-2 ring-indigo-300">
          {toastMessage}
        </div>
      )}

      {/* Main Container: Android Phone Frame or Responsive Fluid */}
      <div
        className={`w-full transition-all duration-300 flex flex-col min-h-screen ${
          isPhoneFrame
            ? 'max-w-md my-0 sm:my-6 rounded-none sm:rounded-[40px] border-0 sm:border-[8px] sm:border-slate-800 shadow-2xl overflow-hidden bg-[#F8FAFC] ring-1 ring-slate-300'
            : 'max-w-4xl'
        }`}
      >
        {/* Android Top App Header */}
        <AndroidHeader
          currentCurrency={currency}
          onCurrencyChange={handleCurrencyChange}
          isPhoneFrame={isPhoneFrame}
          onTogglePhoneFrame={() => setIsPhoneFrame(!isPhoneFrame)}
          onQuickAdd={() => handleOpenAddModal('expense')}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              categories={categories}
              currency={currency}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAddModal={handleOpenAddModal}
              onSelectCategoryFilter={handleCategoryDrilldown}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              transactions={transactions}
              categories={categories}
              currency={currency}
              onSelectCategory={handleCategoryDrilldown}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              categories={categories}
              currency={currency}
              initialCategoryId={drilldownCategory}
              onOpenAddModal={handleOpenAddModal}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onClearAllTransactions={handleClearAll}
            />
          )}

          {activeTab === 'reports' && (
            <BudgetReportsView
              transactions={transactions}
              categories={categories}
              currency={currency}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesAndImportView
              categories={categories}
              transactions={transactions}
              currency={currency}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onImportTransactions={handleImportTransactions}
              onClearAllData={handleClearAll}
            />
          )}
        </main>

        {/* Android Bottom Navigation */}
        <AndroidNavigation
          activeTab={activeTab}
          onTabChange={(t) => {
            if (t !== 'transactions') setDrilldownCategory(undefined);
            setActiveTab(t);
          }}
          transactionCount={transactions.length}
        />
      </div>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        currency={currency}
        initialType={addModalType}
        editingTransaction={editingTransaction}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}
