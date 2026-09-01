import React, { useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Users, 
  Scale, 
  Package, 
  Wallet, 
  BarChart3, 
  Coins, 
  ChevronLeft, 
  ChevronRight,
  Calculator,
  Settings as SettingsIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';

export const BottomNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    lowStockProducts, 
    totalCustomerDebts, 
    totalSupplierDebts, 
    totalEmployeeLoans,
    setShowQuickCalc,
    setShowSettingsModal
  } = useApp();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tabs: { 
    id: TabType; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    badge?: number | boolean;
    isPrimary?: boolean;
  }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'pos', label: 'كاشير سريع', icon: PlusCircle, isPrimary: true },
    { id: 'invoices', label: 'الفواتير', icon: FileText },
    { id: 'customers', label: 'العملاء', icon: Users, badge: totalCustomerDebts > 0 },
    { id: 'debts', label: 'المديونية', icon: Scale, badge: totalCustomerDebts > 0 || totalSupplierDebts > 0 },
    { id: 'loans', label: 'السلف والعهد', icon: Coins, badge: totalEmployeeLoans > 0 },
    { id: 'inventory', label: 'المخزون', icon: Package, badge: lowStockProducts.length > 0 },
    { id: 'expenses', label: 'المصروفات', icon: Wallet },
    { id: 'reports', label: 'التقارير والأهداف', icon: BarChart3 },
  ];

  // Auto scroll active tab into view smoothly
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 160;
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 text-gray-500 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] no-print select-none">
      
      {/* Scrollable Container with horizontal swipe */}
      <div className="relative w-full flex items-center px-1 py-1.5">
        
        {/* Scroll Left hint button */}
        <button
          onClick={() => handleScroll('left')}
          className="shrink-0 w-6 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 active:scale-90 transition-all z-10"
          aria-label="تحريك لليسار"
          title="تحريك القائمة"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Scrollable items list */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-1 py-1"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            if (tab.isPrimary) {
              return (
                <button
                  key={tab.id}
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => setActiveTab('pos')}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 active:bg-blue-700 text-white font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all text-xs"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.4]" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex flex-col items-center justify-center min-w-[62px] px-2.5 py-1 rounded-xl transition-all active:scale-95 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 font-bold ring-1 ring-blue-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4.5 h-4.5 transition-transform ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Quick Calculator Shortcut in bottom bar */}
          <button
            onClick={() => setShowQuickCalc(true)}
            className="shrink-0 flex flex-col items-center justify-center min-w-[56px] px-2 py-1 rounded-xl text-gray-500 hover:text-purple-700 hover:bg-purple-50 transition-all active:scale-95"
            title="آلة حاسبة سريعة"
          >
            <Calculator className="w-4.5 h-4.5 stroke-[1.8]" />
            <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">حاسبة</span>
          </button>

          {/* Settings Shortcut in bottom bar */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="shrink-0 flex flex-col items-center justify-center min-w-[56px] px-2 py-1 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-95"
            title="إعدادات المتجر"
          >
            <SettingsIcon className="w-4.5 h-4.5 stroke-[1.8]" />
            <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">الإعدادات</span>
          </button>
        </div>

        {/* Scroll Right hint button */}
        <button
          onClick={() => handleScroll('right')}
          className="shrink-0 w-6 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 active:scale-90 transition-all z-10"
          aria-label="تحريك لليمين"
          title="تحريك القائمة"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

      </div>
    </nav>
  );
};

