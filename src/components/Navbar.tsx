import React from 'react';
import { Calculator, Banknote, Bell, Settings as SettingsIcon, Store, AlertTriangle, PlusCircle, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/helpers';

export const Navbar: React.FC = () => {
  const {
    settings,
    lowStockProducts,
    totalCustomerDebts,
    setShowQuickCalc,
    setShowCashCounter,
    setShowSettingsModal,
    setActiveTab,
    cashInDrawer,
  } = useApp();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 shadow-xs no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Title */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          {/* Mobile Logo Icon */}
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex lg:hidden items-center justify-center text-white font-bold shadow-md shadow-blue-200 group-active:scale-95 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight">
                {settings.storeName || 'المحاسب الذكي'}
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                إصدار الأعمال
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              نظام إدارة المبيعات والفواتير والمخزون
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Invoice Hero Button */}
          <button
            onClick={() => setActiveTab('pos')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-200 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span className="whitespace-nowrap">فاتورة جديدة</span>
          </button>

          {/* Low Stock Badge */}
          {lowStockProducts.length > 0 && (
            <button
              onClick={() => setActiveTab('inventory')}
              title="تنبيه نقص المخزون"
              className="relative p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="hidden md:inline">{lowStockProducts.length} ناقص</span>
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping absolute -top-0.5 -right-0.5" />
            </button>
          )}

          {/* Quick Cash Counter (عد النقدية) */}
          <button
            onClick={() => setShowCashCounter(true)}
            title="عد النقدية وجرد الفئات"
            className="p-2 sm:p-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-300 active:scale-95 transition-all flex items-center gap-1.5 font-bold text-xs"
          >
            <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
            <span className="hidden md:inline text-teal-900">عد النقدية</span>
          </button>

          {/* Quick Calculator */}
          <button
            onClick={() => setShowQuickCalc(true)}
            title="آلة حاسبة سريعة"
            className="p-2 sm:p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all"
          >
            <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="إعدادات المحل والنسخ الاحتياطي"
            className="p-2 sm:p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all"
          >
            <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
