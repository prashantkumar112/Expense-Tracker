import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Signal,
  Coins,
  Smartphone,
  Maximize2,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { CurrencyConfig, SUPPORTED_CURRENCIES } from '../utils/storage';

interface AndroidHeaderProps {
  currentCurrency: CurrencyConfig;
  onCurrencyChange: (c: CurrencyConfig) => void;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  onQuickAdd: () => void;
  onResetSampleData: () => void;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  currentCurrency,
  onCurrencyChange,
  isPhoneFrame,
  onTogglePhoneFrame,
  onQuickAdd,
  onResetSampleData,
}) => {
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Android Status Bar (Material 3) */}
      <div className="px-5 pt-2 pb-1.5 flex items-center justify-between text-xs text-slate-500 font-medium select-none border-b border-slate-100/60">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{currentTime}</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:block" />
        </div>

        {/* Camera Punchhole illusion for Phone Frame */}
        <div className="w-3.5 h-3.5 rounded-full bg-slate-900 ring-2 ring-slate-200 shadow-inner hidden md:block" />

        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold tracking-tight border border-slate-200">5G</span>
          <Signal size={13} className="text-slate-500" />
          <Wifi size={13} className="text-slate-500" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-slate-600">98%</span>
            <Battery size={14} className="text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Main App Top Bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                FinancePulse
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                Tracker
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Income & Expense Analytics
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Currency Selector */}
          <div className="relative">
            <select
              value={currentCurrency.code}
              onChange={(e) => {
                const found = SUPPORTED_CURRENCIES.find((c) => c.code === e.target.value);
                if (found) onCurrencyChange(found);
              }}
              className="appearance-none bg-white text-slate-700 text-xs font-semibold px-2.5 py-1.5 pr-6 rounded-lg border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
              title="Change Currency"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] text-slate-400">
              ▼
            </span>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={onQuickAdd}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-200 transition-all cursor-pointer"
            title="Add Income or Expense"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add</span>
          </button>

          {/* Phone Frame Toggle (for desktop screen testing) */}
          <button
            onClick={onTogglePhoneFrame}
            className="p-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 text-xs shadow-xs transition-colors hidden sm:flex items-center gap-1 cursor-pointer"
            title={isPhoneFrame ? 'Expand to Fullscreen' : 'View as Android Phone'}
          >
            {isPhoneFrame ? <Maximize2 size={14} /> : <Smartphone size={14} />}
            <span className="text-[11px] font-medium hidden md:inline">{isPhoneFrame ? 'Full' : 'Android'}</span>
          </button>

          {/* Reset Sample Data */}
          <button
            onClick={onResetSampleData}
            className="p-1.5 rounded-lg bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Reset / Reload Historical Sample Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
