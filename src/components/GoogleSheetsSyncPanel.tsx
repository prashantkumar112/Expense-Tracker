import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  ShieldCheck,
  Zap,
  Calendar,
  LogOut,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Transaction, Category } from '../types';
import { CurrencyConfig } from '../utils/storage';
import {
  GoogleSheetsSyncConfig,
  getStoredGSheetsConfig,
  saveGSheetsConfig,
  syncExpensesToGoogleSheets,
  clearGoogleAuth,
  getStoredAccessToken,
} from '../utils/googleSheetsSync';

interface GoogleSheetsSyncPanelProps {
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyConfig;
}

export const GoogleSheetsSyncPanel: React.FC<GoogleSheetsSyncPanelProps> = ({
  transactions,
  categories,
  currency,
}) => {
  const [config, setConfig] = useState<GoogleSheetsSyncConfig>(getStoredGSheetsConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(!!getStoredAccessToken());

  useEffect(() => {
    setConfig(getStoredGSheetsConfig());
    setIsConnected(!!getStoredAccessToken());
  }, []);

  const handleToggleAutoSync = (enabled: boolean) => {
    const updated = { ...config, autoSyncMonthly: enabled };
    setConfig(updated);
    saveGSheetsConfig(updated);
  };

  const handleChangeSyncDay = (day: number) => {
    const updated = { ...config, syncDayOfMonth: day };
    setConfig(updated);
    saveGSheetsConfig(updated);
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMessage(null);
    setSyncErrorMessage(null);

    try {
      const result = await syncExpensesToGoogleSheets(transactions, categories, currency);
      const updated = getStoredGSheetsConfig();
      setConfig(updated);
      setIsConnected(true);
      setSyncSuccessMessage(
        `Successfully synced ${result.rowCount} records & generated monthly summary in Google Sheets!`
      );
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      setSyncErrorMessage(err?.message || 'Failed to sync with Google Sheets. Please ensure popup is allowed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    clearGoogleAuth();
    setConfig(getStoredGSheetsConfig());
    setIsConnected(false);
    setSyncSuccessMessage('Disconnected from Google Drive & Sheets.');
  };

  const lastSyncDateFormatted = config.lastSyncTimestamp
    ? new Date(config.lastSyncTimestamp).toLocaleString()
    : 'Never synced';

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Google Sheets & Drive Monthly Sync</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Cloud Sync
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Auto-syncs transactions table and aggregated monthly savings reports to your live Google Sheet.
            </p>
          </div>
        </div>

        {/* Sync Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now to Google Sheets'}</span>
          </button>
        </div>
      </div>

      {/* Connected Account & Sheet Link */}
      {config.spreadsheetUrl && (
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Connected Spreadsheet:</span>
            </div>
            <div className="text-[11px] text-emerald-800 flex items-center gap-2 flex-wrap">
              {config.connectedEmail && (
                <span className="font-semibold flex items-center gap-1">
                  <Mail size={12} /> {config.connectedEmail}
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Clock size={12} /> Last synced: {lastSyncDateFormatted}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={config.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <span>Open in Google Sheets</span>
              <ExternalLink size={13} />
            </a>

            <button
              onClick={handleDisconnect}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Disconnect Google Account"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {syncSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>{syncSuccessMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {syncErrorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-600 shrink-0" />
          <span>{syncErrorMessage}</span>
        </div>
      )}

      {/* Auto-Sync Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Zap size={14} className="text-indigo-600" />
              <span>Automated Monthly Export</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Pushes previous month's statement automatically
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoSyncMonthly}
              onChange={(e) => handleToggleAutoSync(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-600" />
              <span>Sync Day of Month</span>
            </div>
            <div className="text-[10px] text-slate-500">
              When monthly sync occurs
            </div>
          </div>

          <select
            value={config.syncDayOfMonth}
            onChange={(e) => handleChangeSyncDay(parseInt(e.target.value, 10))}
            className="bg-white text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs focus:outline-none"
          >
            <option value={1}>1st of Month</option>
            <option value={5}>5th of Month</option>
            <option value={10}>10th of Month</option>
            <option value={25}>25th (Salary day)</option>
            <option value={28}>28th of Month</option>
          </select>
        </div>
      </div>

      {/* Sheets Structure Info */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
        <div className="font-bold text-slate-800 flex items-center gap-1">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>What gets synced to your Google Sheet:</span>
        </div>
        <ul className="list-disc pl-5 space-y-0.5 text-[10px] text-slate-500">
          <li><strong>Sheet 1 ("All Transactions"):</strong> Complete itemized list with Description, Amount, Created on (DD/MM/YY), Category, Payment Method, and Type.</li>
          <li><strong>Sheet 2 ("Monthly Summary"):</strong> Monthly breakdown with Total Inflow, Total Outflow, Net Savings, and Savings Rate (%).</li>
          <li><strong>Sheet 3 ("Yearly Comparison"):</strong> Year-over-Year (YoY) analysis comparing Current vs Previous Year at Category Level, Total Level, and Month-by-Month trend table.</li>
          <li><strong>Google Drive access:</strong> Only files created by this tracker are accessed (secure <code>drive.file</code> scope).</li>
        </ul>
      </div>
    </div>
  );
};
