import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  FolderPlus,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Database,
  Sliders,
  FileText,
  FileCheck,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';
import { Category, CsvMappingConfig, Transaction, TransactionType, UploadedExpenseFile } from '../types';
import { CurrencyConfig, formatCurrency } from '../utils/storage';
import { CategoryIcon } from './CategoryIcon';
import {
  autoDetectColumnMapping,
  generateSampleCsvTemplate,
  generateSampleExcelTemplate,
  mapAndImportTransactions,
  parseFlexibleDate,
  parseMultipleExpenseFiles,
} from '../utils/csvHelper';
import { GoogleSheetsSyncPanel } from './GoogleSheetsSyncPanel';

interface CategoriesAndImportViewProps {
  categories: Category[];
  transactions: Transaction[];
  currency: CurrencyConfig;
  onAddCategory: (cat: Category) => void;
  onUpdateCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onImportTransactions: (txs: Transaction[], newCategories?: Category[]) => void;
  onClearAllData: () => void;
}

const AVAILABLE_ICONS = [
  'CreditCard', 'Home', 'HeartHandshake', 'Building2', 'ShieldCheck',
  'ShoppingCart', 'TrendingUp', 'Landmark', 'Film', 'Activity',
  'Utensils', 'MapPin', 'Car', 'Wifi', 'User',
  'Briefcase', 'Laptop', 'CircleDollarSign', 'Building', 'Gift',
  'Tag', 'Coffee', 'Plane', 'Book', 'Smartphone', 'Zap'
];

const COLOR_PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#14B8A6',
  '#06B6D4', '#0284C7', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#EC4899', '#F43F5E', '#64748B', '#D97706'
];

export const CategoriesAndImportView: React.FC<CategoriesAndImportViewProps> = ({
  categories,
  transactions,
  currency,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onImportTransactions,
  onClearAllData,
}) => {
  const [subTab, setSubTab] = useState<'categories' | 'import_files' | 'cloud_sync' | 'data_tools'>('categories');

  // Category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('expense');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [newCatBudget, setNewCatBudget] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catFormError, setCatFormError] = useState('');

  // Category editing state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editBudgetValue, setEditBudgetValue] = useState<string>('');

  // Multi-File Import State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedExpenseFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [mappingConfig, setMappingConfig] = useState<CsvMappingConfig>({
    dateCol: '',
    amountCol: '',
    descCol: '',
    categoryCol: '',
    typeCol: '',
    paymentMethodCol: '',
    defaultType: 'expense',
    defaultCategory: categories.find((c) => c.name.toLowerCase() === 'others')?.id || 'cat-others',
    dateFormat: 'DD/MM/YY',
  });
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessInfo, setImportSuccessInfo] = useState<string | null>(null);

  // Handle new category submission
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCatFormError('Category name is required.');
      return;
    }

    const budgetNum = parseFloat(newCatBudget);
    const newCategory: Category = {
      id: `cat-custom-${Date.now()}`,
      name: newCatName.trim(),
      type: newCatType,
      icon: newCatIcon,
      color: newCatColor,
      monthlyBudget: !isNaN(budgetNum) && budgetNum > 0 ? budgetNum : undefined,
      description: newCatDesc.trim() || undefined,
    };

    onAddCategory(newCategory);
    setNewCatName('');
    setNewCatBudget('');
    setNewCatDesc('');
    setIsAddingCategory(false);
    setCatFormError('');

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}
  };

  // Handle budget edit save
  const handleSaveBudget = (cat: Category) => {
    const val = parseFloat(editBudgetValue);
    onUpdateCategory({
      ...cat,
      monthlyBudget: !isNaN(val) && val >= 0 ? val : undefined,
    });
    setEditingCatId(null);
  };

  // Multi-File Process Handler
  const handleFilesSelected = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    const filesArray = Array.from(filesList);
    setIsProcessingFiles(true);
    setImportErrors([]);
    setImportSuccessInfo(null);

    try {
      const parsedResults = await parseMultipleExpenseFiles(filesArray);
      
      setUploadedFiles((prev) => {
        const combined = [...prev, ...parsedResults];
        // Deduplicate by name if user re-uploaded
        const map = new Map<string, UploadedExpenseFile>();
        combined.forEach((item) => map.set(item.name, item));
        return Array.from(map.values());
      });

      // Find first valid file's headers to initialize/refresh auto column mapping
      const firstValid = parsedResults.find((r) => r.status === 'ready' && r.headers.length > 0);
      if (firstValid) {
        const detected = autoDetectColumnMapping(firstValid.headers);
        setMappingConfig((prev) => ({
          ...prev,
          dateCol: detected.dateCol || prev.dateCol,
          amountCol: detected.amountCol || prev.amountCol,
          debitCol: detected.debitCol || prev.debitCol,
          creditCol: detected.creditCol || prev.creditCol,
          descCol: detected.descCol || prev.descCol,
          categoryCol: detected.categoryCol || prev.categoryCol,
          typeCol: detected.typeCol || prev.typeCol,
          paymentMethodCol: detected.paymentMethodCol || prev.paymentMethodCol,
          dateFormat: 'DD/MM/YY',
        }));
      }
    } catch (err: any) {
      setImportErrors([`Failed to process files: ${err?.message || 'Unknown error'}`]);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleClearAllFiles = () => {
    setUploadedFiles([]);
    setImportErrors([]);
    setImportSuccessInfo(null);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Perform Multi-File Import Execution
  const handleExecuteImport = () => {
    const readyFiles = uploadedFiles.filter((f) => f.status === 'ready');
    if (readyFiles.length === 0) {
      setImportErrors(['No valid files selected to import.']);
      return;
    }

    if (!mappingConfig.dateCol || !mappingConfig.amountCol) {
      setImportErrors(['Please map at least the "Created on" (Date) and "Amount" columns.']);
      return;
    }

    const allNewTransactions: Transaction[] = [];
    const allErrors: string[] = [];
    const allCreatedCategories: Category[] = [];

    readyFiles.forEach((file) => {
      const { transactions: txs, errors, createdCategories } = mapAndImportTransactions(
        file.rows,
        mappingConfig,
        [...categories, ...allCreatedCategories],
        file.name
      );

      allNewTransactions.push(...txs);
      createdCategories.forEach((nc) => {
        if (!allCreatedCategories.some((c) => c.id === nc.id)) {
          allCreatedCategories.push(nc);
        }
      });

      if (errors.length > 0) {
        allErrors.push(`[${file.name}]: ${errors.slice(0, 3).join('; ')}`);
      }
    });

    if (allErrors.length > 0) {
      setImportErrors(allErrors.slice(0, 8));
    }

    if (allNewTransactions.length > 0) {
      onImportTransactions(allNewTransactions, allCreatedCategories);
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch {}
      
      setImportSuccessInfo(
        `Successfully imported ${allNewTransactions.length} transactions across ${readyFiles.length} file(s).`
      );

      // Mark files as imported
      setUploadedFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'imported' as const }))
      );
    }
  };

  // Aggregated row count across valid files
  const totalValidRows = uploadedFiles
    .filter((f) => f.status === 'ready')
    .reduce((sum, f) => sum + f.totalCount, 0);

  // All combined headers across ready files
  const combinedHeaders = Array.from(
    new Set(uploadedFiles.filter((f) => f.status === 'ready').flatMap((f) => f.headers))
  );

  // Sample preview rows from the first ready file
  const firstReadyFile = uploadedFiles.find((f) => f.status === 'ready');
  const previewRows = firstReadyFile ? firstReadyFile.rows.slice(0, 4) : [];

  return (
    <div className="space-y-4 pb-20">
      {/* Sub Navigation */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-500 shadow-xs">
        <button
          onClick={() => setSubTab('categories')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'categories'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <FolderPlus size={14} />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setSubTab('import_files')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'import_files'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <UploadCloud size={14} />
          <span>Historical Import (Excel / CSV)</span>
          {uploadedFiles.length > 0 && (
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {uploadedFiles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('cloud_sync')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'cloud_sync'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet size={14} />
          <span>Google Sheets Sync</span>
        </button>

        <button
          onClick={() => setSubTab('data_tools')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'data_tools'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          <Database size={14} />
          <span>Data Tools</span>
        </button>
      </div>

      {/* 1. CATEGORIES MANAGEMENT TAB */}
      {subTab === 'categories' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FolderPlus size={16} className="text-indigo-600" />
                Category Architecture & Budget Limits
              </h2>
              <p className="text-[11px] text-slate-500">
                15 Core System Categories + Custom user-defined streams
              </p>
            </div>

            <button
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Add Category</span>
            </button>
          </div>

          {/* Add Category Collapsible Form */}
          {isAddingCategory && (
            <form
              onSubmit={handleCreateCategory}
              className="p-4 rounded-2xl bg-white border-2 border-indigo-500/30 shadow-md space-y-3"
            >
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Create New Category
              </h3>

              {catFormError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {catFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Vacation, Pet Care, Solar Loan"
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Type
                  </label>
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setNewCatType('expense')}
                      className={`flex-1 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                        newCatType === 'expense'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCatType('income')}
                      className={`flex-1 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                        newCatType === 'income'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Income
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Budget Target */}
              {newCatType === 'expense' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Monthly Budget Target ({currency.symbol}) (Optional)
                  </label>
                  <input
                    type="number"
                    value={newCatBudget}
                    onChange={(e) => setNewCatBudget(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Icon Picker */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Select Icon
                </label>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-200">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewCatIcon(ic)}
                      className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                        newCatIcon === ic
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <CategoryIcon iconName={ic} color={newCatIcon === ic ? '#FFFFFF' : newCatColor} size={14} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        newCatColor === color ? 'scale-125 border-slate-900 ring-2 ring-indigo-500' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categories.map((cat) => {
              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/80 shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon iconName={cat.icon} color={cat.color} size={18} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                        {cat.isDefault && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                            Core
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            cat.type === 'expense' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {cat.type}
                        </span>
                      </div>

                      {/* Monthly Budget Info / Edit */}
                      {cat.type === 'expense' && (
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          {isEditing ? (
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="number"
                                value={editBudgetValue}
                                onChange={(e) => setEditBudgetValue(e.target.value)}
                                placeholder="Budget"
                                className="w-20 bg-slate-50 text-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveBudget(cat)}
                                className="p-1 rounded-lg bg-indigo-600 text-white cursor-pointer"
                              >
                                <Check size={11} />
                              </button>
                            </div>
                          ) : (
                            <span>
                              Budget:{' '}
                              <span className="text-slate-800 font-semibold">
                                {cat.monthlyBudget ? formatCurrency(cat.monthlyBudget, currency) : 'None'}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {cat.type === 'expense' && !isEditing && (
                      <button
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditBudgetValue(cat.monthlyBudget?.toString() || '');
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Set Monthly Budget Limit"
                      >
                        <Sliders size={13} />
                      </button>
                    )}

                    {!cat.isDefault && (
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Custom Category"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. HISTORICAL EXPENSE MULTI-FILE IMPORT TAB (EXCEL & CSV) */}
      {subTab === 'import_files' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            {/* Header & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <UploadCloud size={16} className="text-indigo-600" />
                  Multiple Historical Expense File Upload
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload multiple historical expense files in <strong>Excel (.xlsx, .xls)</strong> or <strong>CSV (.csv)</strong> format.
                </p>
              </div>

              {/* Template Download Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={generateSampleExcelTemplate}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
                  title="Download Excel template (.xlsx) with Description, Amount, Created on (DD/MM/YY), Category"
                >
                  <FileSpreadsheet size={13} className="text-emerald-600" />
                  <span>Excel Template (.xlsx)</span>
                </button>

                <button
                  onClick={generateSampleCsvTemplate}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
                  title="Download CSV template (.csv)"
                >
                  <FileText size={13} className="text-indigo-600" />
                  <span>CSV Template (.csv)</span>
                </button>
              </div>
            </div>

            {/* Supported Columns Guide Banner */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Info size={14} className="text-indigo-600" />
                <span>Supported Columns in Historical Files:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Column 1</div>
                  <div className="font-bold text-slate-800 mt-0.5">Description</div>
                  <div className="text-[10px] text-slate-500">e.g. "Flat Rent Payment", "Groceries"</div>
                </div>

                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Column 2</div>
                  <div className="font-bold text-slate-800 mt-0.5">Amount</div>
                  <div className="text-[10px] text-slate-500">e.g. 22000, 13500, 4200</div>
                </div>

                <div className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-200 shadow-2xs">
                  <div className="text-[10px] text-indigo-500 font-bold uppercase">Column 3</div>
                  <div className="font-bold text-indigo-900 mt-0.5 flex items-center gap-1">
                    <Calendar size={12} className="text-indigo-600" />
                    <span>Created on</span>
                  </div>
                  <div className="text-[10px] text-indigo-700 font-semibold">Format: DD/MM/YY (e.g. 01/08/24)</div>
                </div>

                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Column 4</div>
                  <div className="font-bold text-slate-800 mt-0.5">Category</div>
                  <div className="text-[10px] text-slate-500">e.g. Rent, EMIs, Groceries, Kajal</div>
                </div>
              </div>
            </div>

            {/* Drag & Drop Multi-File Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01]'
                  : 'border-slate-200 hover:border-indigo-500 bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={(e) => handleFilesSelected(e.target.files)}
                id="multi-file-upload-input"
                className="hidden"
              />
              <label htmlFor="multi-file-upload-input" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                  <UploadCloud size={24} />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Click to select multiple files or drag & drop here
                </div>
                <p className="text-[11px] text-slate-400">
                  Select one or multiple <span className="font-semibold text-emerald-600">.xlsx / .xls</span> Excel sheets and <span className="font-semibold text-indigo-600">.csv</span> files
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs hover:bg-slate-50">
                    <Plus size={12} strokeWidth={2.5} />
                    <span>Browse Multiple Files</span>
                  </span>
                </div>
              </label>
            </div>

            {/* Processing Spinner */}
            {isProcessingFiles && (
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-medium flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Reading & parsing Excel/CSV files...</span>
              </div>
            )}

            {/* Success Message Banner */}
            {importSuccessInfo && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileCheck size={16} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold">{importSuccessInfo}</span>
                </div>
                <button
                  onClick={() => setImportSuccessInfo(null)}
                  className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Import Warnings / Error Box */}
            {importErrors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={15} /> Parsing Warnings & Notices:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Uploaded Files Queue List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Selected Files ({uploadedFiles.length})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                      {totalValidRows} Total Records
                    </span>
                  </div>

                  <button
                    onClick={handleClearAllFiles}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-medium cursor-pointer transition-colors"
                  >
                    Remove All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {uploadedFiles.map((file) => {
                    const isExcel = file.type === 'xlsx' || file.type === 'xls';

                    return (
                      <div
                        key={file.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                          file.status === 'imported'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : file.status === 'error'
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isExcel ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {isExcel ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`uppercase font-bold px-1.5 py-0.2 rounded text-[9px] ${
                                  isExcel ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {file.type}
                              </span>
                              <span>•</span>
                              <span>{(file.size / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">{file.totalCount} rows</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {file.status === 'imported' && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check size={10} strokeWidth={3} /> Imported
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Column Mapping Section (When at least 1 valid file is loaded) */}
            {uploadedFiles.some((f) => f.status === 'ready') && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Column Mapping Configuration
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Auto-configured for "Created on" (DD/MM/YY)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {/* 1. Description */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      1. Description Column
                    </label>
                    <select
                      value={mappingConfig.descCol}
                      onChange={(e) => setMappingConfig({ ...mappingConfig, descCol: e.target.value })}
                      className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 text-xs focus:outline-none"
                    >
                      <option value="">Auto / None</option>
                      {combinedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Amount */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      2. Amount Column *
                    </label>
                    <select
                      value={mappingConfig.amountCol}
                      onChange={(e) => setMappingConfig({ ...mappingConfig, amountCol: e.target.value })}
                      className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 text-xs focus:outline-none font-semibold text-indigo-700"
                    >
                      <option value="">Select Column</option>
                      {combinedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Created on (Date) */}
                  <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-200">
                    <label className="block text-[10px] font-bold text-indigo-900 mb-1">
                      3. Created on (Date Column) *
                    </label>
                    <select
                      value={mappingConfig.dateCol}
                      onChange={(e) => setMappingConfig({ ...mappingConfig, dateCol: e.target.value })}
                      className="w-full bg-white text-indigo-900 p-2 rounded-lg border border-indigo-300 text-xs focus:outline-none font-semibold"
                    >
                      <option value="">Select Column</option>
                      {combinedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Category */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      4. Category Column
                    </label>
                    <select
                      value={mappingConfig.categoryCol}
                      onChange={(e) => setMappingConfig({ ...mappingConfig, categoryCol: e.target.value })}
                      className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 text-xs focus:outline-none"
                    >
                      <option value="">Auto / Default</option>
                      {combinedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Secondary Date Format & Default Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      "Created on" Date Format
                    </label>
                    <select
                      value={mappingConfig.dateFormat}
                      onChange={(e) =>
                        setMappingConfig({ ...mappingConfig, dateFormat: e.target.value as any })
                      }
                      className="w-full bg-white text-slate-800 p-2 rounded-xl border border-slate-200 text-xs"
                    >
                      <option value="DD/MM/YY">DD/MM/YY (e.g. 25/08/24) [Default]</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/08/2024)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Default Flow Type
                    </label>
                    <select
                      value={mappingConfig.defaultType}
                      onChange={(e) =>
                        setMappingConfig({ ...mappingConfig, defaultType: e.target.value as any })
                      }
                      className="w-full bg-white text-slate-800 p-2 rounded-xl border border-slate-200 text-xs"
                    >
                      <option value="expense">Expense (Outflow)</option>
                      <option value="income">Income (Inflow)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Fallback Category
                    </label>
                    <select
                      value={mappingConfig.defaultCategory}
                      onChange={(e) =>
                        setMappingConfig({ ...mappingConfig, defaultCategory: e.target.value })
                      }
                      className="w-full bg-white text-slate-800 p-2 rounded-xl border border-slate-200 text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sample Parsed Rows Preview */}
                {previewRows.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Data Preview (Sample rows from {firstReadyFile?.name})</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2">Description</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Created on (Parsed)</th>
                            <th className="p-2">Category</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {previewRows.map((row, idx) => {
                            const desc = mappingConfig.descCol ? row[mappingConfig.descCol] : '—';
                            const amt = mappingConfig.amountCol ? row[mappingConfig.amountCol] : '—';
                            const rawDate = mappingConfig.dateCol ? row[mappingConfig.dateCol] : '';
                            const parsedDate = parseFlexibleDate(rawDate, mappingConfig.dateFormat);
                            const cat = mappingConfig.categoryCol ? row[mappingConfig.categoryCol] : 'Auto';

                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2 font-medium text-slate-800">{String(desc || '—')}</td>
                                <td className="p-2 font-bold text-indigo-600">{String(amt || '—')}</td>
                                <td className="p-2 text-slate-600 font-mono">
                                  {parsedDate ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                                      {parsedDate} ({String(rawDate)})
                                    </span>
                                  ) : (
                                    <span className="text-rose-600">{String(rawDate || 'Missing')}</span>
                                  )}
                                </td>
                                <td className="p-2 text-slate-600">{String(cat || '—')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Import Action CTA */}
                <div className="pt-2">
                  <button
                    onClick={handleExecuteImport}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.99]"
                  >
                    <Check size={16} strokeWidth={2.5} />
                    <span>
                      Import {totalValidRows} Historical Transactions ({uploadedFiles.filter((f) => f.status === 'ready').length} File{uploadedFiles.filter((f) => f.status === 'ready').length > 1 ? 's' : ''})
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. GOOGLE SHEETS & DRIVE CLOUD SYNC TAB */}
      {subTab === 'cloud_sync' && (
        <GoogleSheetsSyncPanel
          transactions={transactions}
          categories={categories}
          currency={currency}
        />
      )}

      {/* 4. DATA TOOLS & BACKUP TAB */}
      {subTab === 'data_tools' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Database size={16} className="text-indigo-600" />
              Data & Storage Utilities
            </h2>

            {/* Clear All Data */}
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-rose-700">Clear All Transactions</div>
                <div className="text-[10px] text-slate-500">
                  Wipes stored transaction records from local storage.
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all transaction records?')) {
                    onClearAllData();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
