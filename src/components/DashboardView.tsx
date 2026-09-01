import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Wallet, 
  PlusCircle, 
  Receipt, 
  PackagePlus, 
  ArrowUpRight, 
  AlertTriangle, 
  ChevronLeft, 
  Printer, 
  MessageCircle,
  FileText,
  Clock,
  Sparkles,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createWhatsAppDebtReminderLink, formatMoney, getTodayDateString } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    settings,
    todaySales,
    todayProfit,
    todayInvoicesCount,
    monthSales,
    monthInvoicePaid,
    monthDebtCollections,
    monthTotalCollections,
    monthRemainingDebt,
    monthProfit,
    monthInvoicesCount,
    currentMonth,
    totalCustomerDebts,
    cashInDrawer,
    lowStockProducts,
    invoices,
    customers,
    setActiveTab,
    setSelectedInvoiceForPrint,
    setShowPrintModal,
    adjustStock,
  } = useApp();

  const recentInvoices = invoices.slice(0, 6);
  const customersWithDebt = customers.filter(c => c.type === 'customer' && c.balance > 0).slice(0, 4);

  const monthCollectionRate = monthSales > 0 ? Math.round((monthInvoicePaid / monthSales) * 100) : 0;

  // Generate last 7 days sales data for chart
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString('ar-SA', { weekday: 'short' });
    
    const dayTotal = invoices
      .filter(inv => inv.date === dateStr && inv.status !== 'returned')
      .reduce((sum, inv) => sum + inv.grandTotal, 0);

    return {
      day: dayName,
      sales: dayTotal,
    };
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>لوحة المؤشرات والعمليات</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-200 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>فاتورة بيع جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">مبيعات اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-gray-900">
              {formatMoney(todaySales, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {todayInvoicesCount} فواتير مسجلة اليوم
            </div>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">الأرباح التقديرية</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-xl sm:text-2xl font-black ${todayProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              {formatMoney(todayProfit, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-gray-500 font-medium mt-1">
              صافي بعد الخصم والتكاليف
            </div>
          </div>
        </div>

        {/* Customer Debts / Debts & Balances */}
        <div 
          onClick={() => setActiveTab('debts')} 
          className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">المديونية (ما لنا)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-600">
              {formatMoney(totalCustomerDebts, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
              <span>إدارة المديونية والمركز المالي</span>
              <ChevronLeft className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Cash in Drawer */}
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">نقدية الدرج (كاش)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-gray-900">
              {formatMoney(cashInDrawer, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-gray-500 font-medium mt-1">
              إجمالي السيولة المتاحة
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Financial Reconciliation (إجمالي الشهر: المبيعات والمبالغ المحصلة والمدفوع من الفواتير) */}
      <div className="bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                ملخص إجمالي الشهر الحالي ({currentMonth})
              </h2>
              <p className="text-[11px] text-gray-500">
                ربط إجمالي المبالغ المحصلة مع المدفوع من ثمن الفواتير وسندات القبض
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('reports')}
            className="text-xs text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 self-end sm:self-auto"
          >
            <span>تقرير الأرباح والتحصيلات المفصل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Month Total Sales */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
            <span className="text-[11px] font-bold text-gray-500 block">مبيعات الشهر الإجمالية:</span>
            <div className="text-base sm:text-lg font-black text-gray-900 mt-1">
              {formatMoney(monthSales, settings.currencySymbol)}
            </div>
            <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
              {monthInvoicesCount} فواتير مسجلة بالشهر
            </span>
          </div>

          {/* Paid from Invoices */}
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 block">المدفوع من ثمن الفواتير:</span>
            <div className="text-base sm:text-lg font-black text-emerald-700 mt-1">
              {formatMoney(monthInvoicePaid, settings.currencySymbol)}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              نسبة السداد: {monthCollectionRate}% من المبيعات
            </span>
          </div>

          {/* Total Collections in Month */}
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
            <span className="text-[11px] font-bold text-teal-900 block">إجمالي المحصل بالشهر:</span>
            <div className="text-base sm:text-lg font-black text-teal-700 mt-1">
              {formatMoney(monthTotalCollections, settings.currencySymbol)}
            </div>
            <span className="text-[10px] text-teal-700 font-bold block mt-0.5">
              (فواتير + {formatMoney(monthDebtCollections, settings.currencySymbol)} ديون)
            </span>
          </div>

          {/* Remaining Debt from Month */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-900 block">المتبقي آجل على فواتير الشهر:</span>
            <div className="text-base sm:text-lg font-black text-amber-600 mt-1">
              {formatMoney(monthRemainingDebt, settings.currencySymbol)}
            </div>
            <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
              ديون مستحقة التحصيل
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs">
        <h2 className="text-xs font-bold text-gray-700 mb-3">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/60 hover:bg-blue-50 text-blue-700 border border-blue-100 active:scale-98 transition-all text-right"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Receipt className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-bold block text-gray-900">فاتورة بيع</span>
              <span className="text-[10px] text-gray-500">نقطة بيع سريعة</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 hover:bg-amber-50 text-amber-700 border border-amber-100 active:scale-98 transition-all text-right"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-bold block text-gray-900">سداد دين</span>
              <span className="text-[10px] text-gray-500">تحصيل من عميل</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-50 text-emerald-700 border border-emerald-100 active:scale-98 transition-all text-right"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <PackagePlus className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-bold block text-gray-900">إضافة صنف</span>
              <span className="text-[10px] text-gray-500">إدخال بضاعة للمخزن</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/60 hover:bg-rose-50 text-rose-700 border border-rose-100 active:scale-98 transition-all text-right"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <DollarSign className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-bold block text-gray-900">تسجيل مصروف</span>
              <span className="text-[10px] text-gray-500">فواتير ونثريات</span>
            </div>
          </button>
        </div>
      </div>

      {/* Low Stock Alert (if any) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>تنبيه: أصناف قاربت على النفاد ({lowStockProducts.length})</span>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-amber-800 hover:text-amber-900 font-bold underline"
            >
              عرض المخزون
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {lowStockProducts.slice(0, 3).map(prod => (
              <div
                key={prod.id}
                className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl text-xs border border-amber-200 shadow-xs"
              >
                <div>
                  <span className="font-bold text-gray-900 block">{prod.name}</span>
                  <span className="text-[11px] text-amber-700 font-medium">
                    المتبقي: {prod.stock} {prod.unit}
                  </span>
                </div>
                <button
                  onClick={() => adjustStock(prod.id, 10)}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[11px] active:scale-95 transition-all"
                >
                  +10
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts & Debts 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 7-Days Sales Chart */}
        <div className="bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>حركة المبيعات (آخر 7 أيام)</span>
            </h2>
            <span className="text-xs font-semibold text-gray-500">{settings.currencySymbol}</span>
          </div>

          <div className="h-48 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} ${settings.currencySymbol}`, 'المبيعات']}
                />
                <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue Customer Debts */}
        <div className="bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>مستحقات واجبة التحصيل</span>
            </h2>
            <button
              onClick={() => setActiveTab('customers')}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              كافة العملاء
            </button>
          </div>

          {customersWithDebt.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              ممتاز! لا توجد أي مديونيات متأخرة على العملاء حالياً.
            </div>
          ) : (
            <div className="space-y-2.5">
              {customersWithDebt.map(cust => (
                <div
                  key={cust.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{cust.name}</h4>
                    <p className="text-[11px] text-amber-700 font-bold mt-0.5">
                      مستحق: {formatMoney(cust.balance, settings.currencySymbol)}
                    </p>
                  </div>

                  <a
                    href={createWhatsAppDebtReminderLink(cust, settings)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>تذكير واتساب</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices List */}
      <div className="bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>أحدث الفواتير والمعاملات</span>
          </h2>
          <button
            onClick={() => setActiveTab('invoices')}
            className="text-xs text-blue-600 hover:underline font-bold"
          >
            عرض سجل الفواتير
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs">
            لا توجد فواتير مسجلة بعد. اضغط على "فاتورة بيع جديدة" للبدء.
          </div>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map(inv => (
              <div
                key={inv.id}
                onClick={() => {
                  setSelectedInvoiceForPrint(inv);
                  setShowPrintModal(true);
                }}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50/50 rounded-xl border border-gray-200 cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                    inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    inv.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                    inv.status === 'returned' ? 'bg-gray-200 text-gray-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{inv.customerName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">#{inv.invoiceNumber.slice(-4)}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {inv.date} - {inv.time}
                      </span>
                      <span>• {inv.items.length} أصناف</span>
                    </div>
                  </div>
                </div>

                <div className="text-left flex flex-col items-end">
                  <div className="text-xs font-black text-gray-900">
                    {formatMoney(inv.grandTotal, settings.currencySymbol)}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                    inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                    inv.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                    inv.status === 'returned' ? 'bg-gray-200 text-gray-700' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {inv.status === 'paid' ? 'مدفوع' :
                     inv.status === 'partial' ? `متبقي ${inv.remainingDebt}` :
                     inv.status === 'returned' ? 'مرتجع' : 'آجل'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
