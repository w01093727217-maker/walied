import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Users, 
  Scale, 
  Package, 
  Wallet, 
  BarChart3, 
  Settings as SettingsIcon,
  Calculator,
  Store,
  AlertTriangle,
  UserCheck,
  Coins
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { formatMoney } from '../utils/helpers';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    lowStockProducts, 
    totalCustomerDebts, 
    totalSupplierDebts,
    totalEmployeeLoans,
    settings,
    cashInDrawer,
    setShowQuickCalc,
    setShowSettingsModal 
  } = useApp();

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pos', label: 'نقطة البيع (POS)', icon: PlusCircle },
    { id: 'invoices', label: 'الفواتير والمبيعات', icon: FileText },
    { id: 'customers', label: 'العملاء والحسابات', icon: Users, badge: totalCustomerDebts > 0 ? 'ديون' : undefined },
    { 
      id: 'debts', 
      label: 'المديونية', 
      icon: Scale, 
      badge: (totalCustomerDebts > 0 || totalSupplierDebts > 0) ? 'نشطة' : undefined 
    },
    { 
      id: 'loans', 
      label: 'السلف والعهد', 
      icon: Coins, 
      badge: totalEmployeeLoans > 0 ? formatMoney(totalEmployeeLoans, settings.currencySymbol) : undefined 
    },
    { id: 'inventory', label: 'المخزون والمنتجات', icon: Package, badge: lowStockProducts.length > 0 ? lowStockProducts.length : undefined },
    { id: 'expenses', label: 'المصروفات والنفقات', icon: Wallet },
    { id: 'reports', label: 'التقارير المالية', icon: BarChart3 },
  ];

  return (
    <aside className="hidden lg:flex w-64 bg-slate-900 h-screen sticky top-0 flex-col text-slate-300 border-l border-slate-800 shrink-0 select-none z-30 no-print">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800">
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-900/50 group-hover:bg-blue-500 transition-colors">
            {settings.storeName ? settings.storeName.charAt(0) : 'ف'}
          </div>
          <div className="overflow-hidden">
            <span className="text-white font-black text-base truncate block">
              {settings.storeName || 'المحاسب الذكي'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              الدرج: <strong className="text-blue-400">{formatMoney(cashInDrawer, settings.currencySymbol)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          القائمة الرئيسية
        </div>

        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition-all text-right ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border-r-4 border-blue-600 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400 stroke-[2.4]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          أدوات سريعة
        </div>

        <button
          onClick={() => setShowQuickCalc(true)}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors text-right"
        >
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>آلة حاسبة سريعة</span>
        </button>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors text-right"
        >
          <SettingsIcon className="w-4 h-4 text-slate-400" />
          <span>إعدادات المؤسسة</span>
        </button>
      </nav>

      {/* User / Store Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-xs overflow-hidden flex-1">
            <p className="text-white font-bold truncate">{settings.storeName}</p>
            <p className="text-[10px] text-slate-400 truncate">{settings.phone || 'نظام الفواتير المعتمد'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
