import React from 'react';
import { LayoutDashboard, FileText, PlusCircle, Users, Package, Wallet, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, lowStockProducts, totalCustomerDebts } = useApp();

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number | boolean }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'invoices', label: 'الفواتير', icon: FileText },
    { id: 'pos', label: 'بيع سريع', icon: PlusCircle }, // Center hero
    { id: 'customers', label: 'العملاء', icon: Users, badge: totalCustomerDebts > 0 },
    { id: 'inventory', label: 'المخزون', icon: Package, badge: lowStockProducts.length > 0 },
    { id: 'expenses', label: 'المصروفات', icon: Wallet },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 text-gray-500 pb-safe shadow-lg no-print">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5 sm:max-w-xl">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const isPos = tab.id === 'pos';
          const Icon = tab.icon;

          if (isPos) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab('pos')}
                className="relative -top-4 flex flex-col items-center group focus:outline-none"
              >
                <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform active:scale-90 ${
                  isActive
                    ? 'bg-blue-700 shadow-blue-500/40 ring-4 ring-white'
                    : 'bg-blue-600 shadow-blue-500/30 ring-4 ring-white hover:bg-blue-700'
                }`}>
                  <PlusCircle className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className={`text-[11px] font-bold mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 ${
                isActive ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
