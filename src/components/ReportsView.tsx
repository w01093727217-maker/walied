import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Printer, 
  Calendar, 
  FileText, 
  PieChart, 
  ArrowDownRight, 
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatMoney, getTodayDateString } from '../utils/helpers';

export const ReportsView: React.FC = () => {
  const {
    invoices,
    expenses,
    payments,
    settings,
    products,
    customers,
  } = useApp();

  const [period, setPeriod] = useState<'today' | 'month' | 'all'>('month');
  const todayStr = getTodayDateString();
  const currentMonth = todayStr.slice(0, 7);

  // Filtered dataset according to period
  const periodInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (inv.status === 'returned') return false;
      if (period === 'today') return inv.date === todayStr;
      if (period === 'month') return inv.date.startsWith(currentMonth);
      return true;
    });
  }, [invoices, period, todayStr, currentMonth]);

  const periodExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (period === 'today') return e.date === todayStr;
      if (period === 'month') return e.date.startsWith(currentMonth);
      return true;
    });
  }, [expenses, period, todayStr, currentMonth]);

  const periodPayments = useMemo(() => {
    return payments.filter(p => {
      if (period === 'today') return p.date === todayStr;
      if (period === 'month') return p.date.startsWith(currentMonth);
      return true;
    });
  }, [payments, period, todayStr, currentMonth]);

  // Financial calculations
  const totalSales = periodInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  
  const costOfGoodsSold = periodInvoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
  }, 0);

  const grossProfit = totalSales - costOfGoodsSold;
  const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  const totalVatCollected = periodInvoices.reduce((sum, inv) => sum + inv.taxTotal, 0);

  // Cash vs Card breakdown
  const cashSales = periodInvoices.filter(i => i.paymentMethod === 'cash').reduce((sum, i) => sum + i.paidAmount, 0);
  const cardSales = periodInvoices.filter(i => i.paymentMethod === 'card').reduce((sum, i) => sum + i.paidAmount, 0);
  const creditSales = periodInvoices.reduce((sum, i) => sum + i.remainingDebt, 0);

  // Cash in Drawer Reconciliation for Today
  const todayCashSales = invoices
    .filter(i => i.date === todayStr && i.status !== 'returned' && i.paymentMethod === 'cash')
    .reduce((sum, i) => sum + i.paidAmount, 0);

  const todayCashCollections = payments
    .filter(p => p.date === todayStr && p.paymentMethod === 'cash' && p.type === 'collection')
    .reduce((sum, p) => sum + p.amount, 0);

  const todayCashExpenses = expenses
    .filter(e => e.date === todayStr && e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashInDrawer = todayCashSales + todayCashCollections - todayCashExpenses;

  // Top Selling Products Calculation
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
    periodInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        map[item.productId].quantity += item.quantity;
        map[item.productId].revenue += item.total;
      });
    });
    return Object.values(map).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [periodInvoices]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>التقارير المحاسبية والأرباح والوردية</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">تحليل الأداء المالي، قائمة الدخل، وتقفيل الصندوق</p>
        </div>

        <button
          onClick={handlePrintReport}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-bold border border-gray-200 active:scale-95 transition-all shadow-xs"
        >
          <Printer className="w-4 h-4 text-blue-600" />
          <span>طباعة التقرير</span>
        </button>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200 text-xs sm:text-sm font-bold no-print">
        <button
          onClick={() => setPeriod('today')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            period === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          اليوم
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            period === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          هذا الشهر
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            period === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          كافة الفترات
        </button>
      </div>

      {/* Printable Report Wrapper */}
      <div className="space-y-4">
        {/* Income Statement Card (قائمة الدخل والأرباح) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  قائمة الأرباح والخسائر ({period === 'today' ? 'اليوم' : period === 'month' ? 'هذا الشهر' : 'شامل'})
                </h2>
                <p className="text-xs text-gray-500">ملخص الإيرادات والتكاليف وصافي الربح</p>
              </div>
            </div>
            <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              هامش صافي الربح: {profitMargin}%
            </span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-gray-700 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-semibold">إجمالي المبيعات (الإيرادات):</span>
              <span className="font-black text-gray-900 text-sm sm:text-base">{formatMoney(totalSales, settings.currencySymbol)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-semibold">تكلفة البضاعة المباعة (سعر الشراء):</span>
              <span className="font-bold text-gray-700">-{formatMoney(costOfGoodsSold, settings.currencySymbol)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-900 p-3 bg-blue-50/70 border border-blue-100 rounded-xl font-bold">
              <span>إجمالي الربح التجاري (Gross Profit):</span>
              <span className="text-blue-700 font-black text-sm sm:text-base">{formatMoney(grossProfit, settings.currencySymbol)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-semibold">المصروفات التشغيلية والنفقات:</span>
              <span className="font-bold text-rose-600">-{formatMoney(totalExpenses, settings.currencySymbol)}</span>
            </div>

            <div className="flex justify-between items-center text-sm sm:text-base font-black p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-emerald-900">صافي الأرباح النهائية (Net Profit):</span>
              <span className={netProfit >= 0 ? 'text-emerald-700 text-lg sm:text-xl font-black' : 'text-rose-700 text-lg sm:text-xl font-black'}>
                {formatMoney(netProfit, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Cash Drawer Reconciliation (Z-Report تقفيل درج الكاشير لليوم) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">تقرير تقفيل الدرج والوردية اليومية</h2>
                <p className="text-xs text-gray-500">{todayStr}</p>
              </div>
            </div>
            <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full font-bold">
              Z-Report وردية اليوم
            </span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between text-gray-700 p-2.5 bg-gray-50 rounded-xl">
              <span>+ مبيعات الكاشير النقدية (كاش):</span>
              <span className="font-bold text-emerald-600">{formatMoney(todayCashSales, settings.currencySymbol)}</span>
            </div>

            <div className="flex justify-between text-gray-700 p-2.5 bg-gray-50 rounded-xl">
              <span>+ تحصيلات ديون وسندات قبض (كاش):</span>
              <span className="font-bold text-emerald-600">{formatMoney(todayCashCollections, settings.currencySymbol)}</span>
            </div>

            <div className="flex justify-between text-gray-700 p-2.5 bg-gray-50 rounded-xl">
              <span>- مصروفات ونثريات مسددة نقداً من الصندوق:</span>
              <span className="font-bold text-rose-600">-{formatMoney(todayCashExpenses, settings.currencySymbol)}</span>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm sm:text-base font-black bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl">
              <span className="text-indigo-950">النقدية الواجب توفرها بالدرج الآن:</span>
              <span className="text-indigo-700 text-lg font-black">{formatMoney(netCashInDrawer, settings.currencySymbol)}</span>
            </div>
          </div>
        </div>

        {/* Payment Channels & Tax Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">قنوات الدفع المحصلة:</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>نقدي (كاش):</span>
                <span className="font-bold text-gray-900">{formatMoney(cashSales, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>شبكة / مدى / بطاقات:</span>
                <span className="font-bold text-gray-900">{formatMoney(cardSales, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>مبيعات آجلة غير مسددة (ديون):</span>
                <span className="font-bold text-amber-600">{formatMoney(creditSales, settings.currencySymbol)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">إقرار ضريبة القيمة المضافة (VAT):</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>نسبة الضريبة المطبقة:</span>
                <span className="font-bold text-gray-900">{settings.taxRate}%</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ضريبة المبيعات المحصلة:</span>
                <span className="font-bold text-blue-600">{formatMoney(totalVatCollected, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>الرقم الضريبي للمنشأة:</span>
                <span className="font-mono font-bold text-gray-900">{settings.taxNumber || 'غير محدد'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Selling Products */}
        {topProducts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>الأصناف والمنتجات الأكثر مبيعاً في هذه الفترة</span>
            </h3>

            <div className="space-y-2 text-xs">
              {topProducts.map((tp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-gray-900">{tp.name}</span>
                  </div>
                  <div className="text-left text-gray-500 text-xs">
                    <span className="font-black text-blue-600">{tp.quantity} مباع</span>
                    <span className="mr-2">({formatMoney(tp.revenue, settings.currencySymbol)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
