import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  ReceiptText,
  FileBarChart2,
  FolderPlus,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface AndroidNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  transactionCount?: number;
}

export const AndroidNavigation: React.FC<AndroidNavigationProps> = ({
  activeTab,
  onTabChange,
  transactionCount = 0,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText, badge: transactionCount > 0 ? (transactionCount > 99 ? '99+' : transactionCount) : undefined },
    { id: 'reports', label: 'Reports', icon: FileBarChart2 },
    { id: 'categories', label: 'Manage & Import', icon: FolderPlus },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg pb-safe">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 cursor-pointer relative group ${
                isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {/* Material 3 Active Pill Indicator */}
              <div
                className={`relative px-4 py-1 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/80 shadow-xs' : 'bg-transparent'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />

                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white font-extrabold text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-medium tracking-tight mt-0.5 transition-all ${
                  isActive ? 'font-bold text-indigo-600' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Android Home Navigation Bar indicator (for phone feel) */}
      <div className="w-28 h-1 bg-slate-300 rounded-full mx-auto my-1" />
    </nav>
  );
};
