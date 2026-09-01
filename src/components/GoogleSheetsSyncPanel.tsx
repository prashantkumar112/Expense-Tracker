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
  Download,
  Key,
  ChevronDown,
  ChevronUp,
  Smartphone,
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
  generateGoogleSheetsWorkbook,
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
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [customClientId, setCustomClientId] = useState<string>(config.clientId || '');

  useEffect(() => {
    const current = getStoredGSheetsConfig();
    setConfig(current);
    setIsConnected(!!getStoredAccessToken());
    setCustomClientId(current.clientId || '');
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

  const handleSaveClientId = () => {
    const updated = { ...config, clientId: customClientId.trim() || undefined };
    setConfig(updated);
    saveGSheetsConfig(updated);
    setSyncSuccessMessage('Google OAuth Client ID updated!');
  };

  const handleDownloadWorkbook = () => {
    try {
      generateGoogleSheetsWorkbook(transactions, categories, currency);
      setSyncSuccessMessage('Multi-tab Google Sheets & Excel workbook generated and downloaded!');
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (e: any) {
      setSyncErrorMessage(e?.message || 'Failed to generate workbook.');
    }
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
      setSyncErrorMessage(
        err?.message || 'Failed to sync with Google Sheets. Please ensure popup is allowed or use direct download.'
      );
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
              <span>Google Sheets & Drive Sync</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Cloud Sync
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Sync transactions, monthly summary, and YoY analysis to Google Sheets.
            </p>
          </div>
        </div>

        {/* Action Buttons: Live Cloud Sync & Direct 1-Click Download */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleDownloadWorkbook}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold shadow-2xs cursor-pointer transition-all active:scale-95 whitespace-nowrap"
            title="Download full multi-tab file (All Transactions, Monthly Summary, Yearly Comparison)"
          >
            <Download size={14} />
            <span>Download Workbook (.xlsx)</span>
          </button>

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 whitespace-nowrap"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Connecting...' : 'Live Google Sync'}</span>
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

      {/* Error Notification with Help Tips */}
      {syncErrorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{syncErrorMessage}</p>
              <p className="text-[11px] text-rose-700">
                <strong>Why this happens:</strong> Google blocks OAuth popups in embedded Android WebViews or when third-party cookies/scripts are restricted.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/80 border border-rose-200/80 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-700">
              💡 You can use <strong>"Download Workbook (.xlsx)"</strong> to export all 3 sheets and open or upload them directly to Google Drive / Sheets anytime without needing sign-in!
            </span>
            <button
              onClick={handleDownloadWorkbook}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shrink-0"
            >
              Download .xlsx
            </button>
          </div>
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
        </ul>
      </div>

      {/* Advanced OAuth Settings Toggle */}
      <div className="border-t border-slate-100 pt-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Key size={12} />
          <span>Custom Google OAuth Client ID (Optional)</span>
          {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showAdvanced && (
          <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <p className="text-[11px] text-slate-500">
              If you have created your own Google Cloud Console OAuth 2.0 Web Client ID, you can paste it below to authenticate directly against your Google Cloud project.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                placeholder="e.g. 123456789-xxxx.apps.googleusercontent.com"
                className="flex-1 bg-white p-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSaveClientId}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

