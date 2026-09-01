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
  CheckCircle2,
  Target,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Boxes,
  Package,
  Phone,
  MessageCircle,
  Users,
  Award,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SellerTarget } from '../types';
import { formatMoney, getTodayDateString } from '../utils/helpers';

export const ReportsView: React.FC = () => {
  const {
    invoices,
    expenses,
    payments,
    sellerTargets,
    addSellerTarget,
    updateSellerTarget,
    deleteSellerTarget,
    settings,
    products,
    customers,
  } = useApp();

  const [period, setPeriod] = useState<'today' | 'month' | 'all'>('month');
  const todayStr = getTodayDateString();
  const currentMonth = todayStr.slice(0, 7);

  // Seller target modal/form state (Total Target, Jumbo portion, and Small portion as remainder)
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SellerTarget | null>(null);
  const [targetFormData, setTargetFormData] = useState<{
    sellerName: string;
    role: string;
    phone: string;
    totalTargetCartons: number;  // إجمالي الهدف (مثال: 1500 كرتونة)
    targetJumboCartons: number;  // منهم كرتون جامبو (مثال: 250 كرتونة)
    targetSmallCartons: number;  // باقي الهدف كرتون صغير (مثال: 1250 كرتونة)
    achievedSmallCartons: number;
    achievedJumboCartons: number;
    period: 'monthly' | 'weekly' | 'daily';
    notes: string;
  }>({
    sellerName: '',
    role: 'مندوب مبيعات',
    phone: '',
    totalTargetCartons: 1500,
    targetJumboCartons: 250,
    targetSmallCartons: 1250,
    achievedSmallCartons: 0,
    achievedJumboCartons: 0,
    period: 'monthly',
    notes: '',
  });

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

  // المدفوع من ثمن الفواتير وإجمالي المبالغ المحصلة خلال الفترة (ربط التحصيلات مع مدفوعات الفواتير)
  const periodInvoicePaid = periodInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const periodRemainingDebt = periodInvoices.reduce((sum, inv) => sum + (inv.remainingDebt || 0), 0);

  // تحصيلات الديون وسداد الحسابات المستقلة خلال الفترة
  const periodDebtCollections = periodPayments
    .filter(p => p.type === 'collection' && !p.invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);

  // إجمالي المبالغ المحصلة الكلية خلال الفترة
  const periodTotalCollections = periodInvoicePaid + periodDebtCollections;
  const periodCollectionRate = totalSales > 0 ? Math.round((periodInvoicePaid / totalSales) * 100) : 0;

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

  const handleOpenAddTarget = () => {
    setEditingTarget(null);
    setTargetFormData({
      sellerName: '',
      role: 'مندوب مبيعات',
      phone: '',
      totalTargetCartons: 1500,
      targetJumboCartons: 250,
      targetSmallCartons: 1250,
      achievedSmallCartons: 0,
      achievedJumboCartons: 0,
      period: 'monthly',
      notes: '',
    });
    setIsTargetModalOpen(true);
  };

  const handleOpenEditTarget = (target: SellerTarget) => {
    setEditingTarget(target);
    const targetJumbo = target.targetJumboCartons || 0;
    const targetSmall = target.targetSmallCartons || 0;
    const totalTarget = target.totalTargetCartons || (targetSmall + targetJumbo);

    setTargetFormData({
      sellerName: target.sellerName,
      role: target.role || 'مندوب مبيعات',
      phone: target.phone || '',
      totalTargetCartons: totalTarget,
      targetJumboCartons: targetJumbo,
      targetSmallCartons: targetSmall > 0 ? targetSmall : Math.max(0, totalTarget - targetJumbo),
      achievedSmallCartons: target.achievedSmallCartons || 0,
      achievedJumboCartons: target.achievedJumboCartons || 0,
      period: target.period,
      notes: target.notes || '',
    });
    setIsTargetModalOpen(true);
  };

  const handleQuickAdjustCartons = (targetId: string, type: 'small' | 'jumbo', delta: number) => {
    const target = sellerTargets.find(t => t.id === targetId);
    if (!target) return;
    if (type === 'small') {
      const updated = Math.max(0, (target.achievedSmallCartons || 0) + delta);
      updateSellerTarget({ ...target, achievedSmallCartons: updated });
    } else {
      const updated = Math.max(0, (target.achievedJumboCartons || 0) + delta);
      updateSellerTarget({ ...target, achievedJumboCartons: updated });
    }
  };

  const handleShareTargetWhatsApp = (st: SellerTarget) => {
    const targetJumbo = st.targetJumboCartons || 0;
    const targetSmall = st.targetSmallCartons || 0;
    const totalTarget = st.totalTargetCartons || (targetSmall + targetJumbo);

    const achievedSmall = st.achievedSmallCartons || 0;
    const achievedJumbo = st.achievedJumboCartons || 0;
    const totalAchieved = achievedSmall + achievedJumbo;

    const percentSmall = targetSmall > 0 ? Math.round((achievedSmall / targetSmall) * 100) : 0;
    const percentJumbo = targetJumbo > 0 ? Math.round((achievedJumbo / targetJumbo) * 100) : 0;
    const totalPercent = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

    const message = `📊 *تقرير أداء الموظف ومستهدف المبيعات*
👤 *الموظف:* ${st.sellerName} (${st.role || 'مندوب مبيعات'})
📅 *الفترة:* ${st.period === 'monthly' ? 'شهري' : st.period === 'weekly' ? 'أسبوعي' : 'يومي'}

🎯 *إجمالي الهدف المطلوب:* ${totalTarget} كرتونة
🏆 *إجمالي المحقق الفعلي:* ${totalAchieved} كرتونة (*${totalPercent}%*)

📦 *تفصيل أقسام الهدف:*
🔹 *كرتون جامبو:* ${targetJumbo} كرتونة (محقق: ${achievedJumbo} | ${percentJumbo}%)
🔹 *باقي الهدف (كرتون صغير):* ${targetSmall} كرتونة (محقق: ${achievedSmall} | ${percentSmall}%)
${st.notes ? `\n📝 *ملاحظات:* ${st.notes}` : ''}
🏢 ${settings.storeName || 'المحل'}`;

    const cleanPhone = (st.phone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone.startsWith('0') ? '966' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFormData.sellerName.trim()) {
      alert('يرجى كتابة اسم البائع أو موظف المبيعات');
      return;
    }
    
    const totalTarget = targetFormData.totalTargetCartons > 0 
      ? targetFormData.totalTargetCartons 
      : ((targetFormData.targetSmallCartons || 0) + (targetFormData.targetJumboCartons || 0));

    if (totalTarget <= 0) {
      alert('يرجى تحديد إجمالي الهدف بالكرتون (يجب أن يكون أكبر من صفر)');
      return;
    }

    const payload = {
      ...targetFormData,
      totalTargetCartons: totalTarget,
      targetSmallCartons: targetFormData.targetSmallCartons,
      targetJumboCartons: targetFormData.targetJumboCartons,
    };

    if (editingTarget) {
      updateSellerTarget({
        ...editingTarget,
        ...payload,
      });
    } else {
      addSellerTarget(payload);
    }
    setIsTargetModalOpen(false);
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

        {/* Collections vs Invoice Payments Reconciliation Card (حركة التحصيلات والمدفوع من ثمن الفواتير) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  حركة التحصيلات والمدفوع من ثمن الفواتير ({period === 'today' ? 'اليوم' : period === 'month' ? 'إجمالي هذا الشهر' : 'كافة الفترات'})
                </h2>
                <p className="text-xs text-gray-500">ربط مبالغ الفواتير المحصلة مع مدفوعات العملاء وسندات القبض</p>
              </div>
            </div>
            <span className="text-xs font-black text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              نسبة التحصيل الفوري: {periodCollectionRate}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Direct Invoice Payments */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-800 block">المدفوع من ثمن الفواتير:</span>
              <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
                {formatMoney(periodInvoicePaid, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                مبالغ مسددة مباشرة عند إصدار الفاتورة
              </span>
            </div>

            {/* Other Collections / Debt Repayments */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
              <span className="text-[11px] font-bold text-blue-800 block">تحصيلات ديون وسندات قبض:</span>
              <div className="text-lg sm:text-xl font-black text-blue-700 mt-1">
                {formatMoney(periodDebtCollections, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                سداد ديون سابقة ودفعات مستقلة
              </span>
            </div>

            {/* Total Collections */}
            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl">
              <span className="text-[11px] font-bold text-teal-900 block">إجمالي المبالغ المحصلة:</span>
              <div className="text-lg sm:text-xl font-black text-teal-700 mt-1">
                {formatMoney(periodTotalCollections, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-teal-700 font-bold mt-0.5 block">
                (فواتير + سندات قبض)
              </span>
            </div>

            {/* Remaining Debt */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
              <span className="text-[11px] font-bold text-amber-900 block">المتبقي آجل على الفواتير:</span>
              <div className="text-lg sm:text-xl font-black text-amber-600 mt-1">
                {formatMoney(periodRemainingDebt, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
                ديون مستحقة للتحصيل لاحقاً
              </span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              إجمالي قيمة مبيعات الفترة: <strong className="text-gray-900">{formatMoney(totalSales, settings.currencySymbol)}</strong>
            </span>
            <span>
              تم تحصيل <strong className="text-emerald-700">{formatMoney(periodInvoicePaid, settings.currencySymbol)}</strong> نقداً/بطاقة، ومتبقي <strong className="text-amber-700">{formatMoney(periodRemainingDebt, settings.currencySymbol)}</strong> كديون.
            </span>
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

        {/* NEW: Employee Management & Seller Targets (إدارة الموظفين وأهداف المبيعات بالكراتين - إجمالي الهدف + الجامبو + باقي الهدف صغير) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  إدارة الموظفين وأهداف المبيعات (إجمالي الهدف، كرتون جامبو، وباقي الهدف كرتون صغير)
                </h2>
                <p className="text-xs text-gray-500">
                  تحديد إجمالي الهدف (مثال: 1500 كرتونة)، منها عدد الجامبو (مثال: 250)، والباقي يشمل الصغير تلقائياً
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddTarget}
              className="no-print self-start sm:self-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-purple-200 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة موظف وتحديد الهدف</span>
            </button>
          </div>

          {sellerTargets.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 text-xs font-medium space-y-2">
              <p>لم يتم تسجيل موظفين أو تحديد أهداف مبيعات بعد.</p>
              <button
                onClick={handleOpenAddTarget}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول موظف ومستهدف كراتين</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sellerTargets.map(st => {
                const targetJumbo = st.targetJumboCartons || 0;
                const targetSmall = st.targetSmallCartons || 0;
                const totalTarget = st.totalTargetCartons || (targetSmall + targetJumbo);

                const achievedSmall = st.achievedSmallCartons || 0;
                const achievedJumbo = st.achievedJumboCartons || 0;
                const totalAchieved = achievedSmall + achievedJumbo;

                const percentSmall = targetSmall > 0 ? Math.round((achievedSmall / targetSmall) * 100) : 0;
                const percentJumbo = targetJumbo > 0 ? Math.round((achievedJumbo / targetJumbo) * 100) : 0;
                const totalPercent = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

                const getStatusBadge = (percent: number) => {
                  if (percent >= 100) return { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500', text: 'محقق 🎯' };
                  if (percent >= 70) return { color: 'text-blue-700 bg-blue-50 border-blue-200', bar: 'bg-blue-600', text: 'ممتاز 📈' };
                  if (percent >= 40) return { color: 'text-amber-700 bg-amber-50 border-amber-200', bar: 'bg-amber-500', text: 'متوسط ⏳' };
                  return { color: 'text-rose-700 bg-rose-50 border-rose-200', bar: 'bg-rose-500', text: 'منخفض ⚠️' };
                };

                const smallStatus = getStatusBadge(percentSmall);
                const jumboStatus = getStatusBadge(percentJumbo);
                const overallStatus = getStatusBadge(totalPercent);

                return (
                  <div 
                    key={st.id} 
                    className="p-4 bg-gray-50/70 border border-gray-200 hover:border-purple-300 rounded-2xl space-y-3.5 transition-all shadow-2xs"
                  >
                    {/* Employee Card Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-gray-200/80 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                          {st.sellerName.slice(0, 1) || 'م'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs sm:text-sm text-gray-900">{st.sellerName}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                              {st.role || 'مندوب مبيعات'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                            <span>{st.period === 'monthly' ? 'مستهدف شهري' : st.period === 'weekly' ? 'مستهدف أسبوعي' : 'مستهدف يومي'}</span>
                            {st.phone && (
                              <span className="flex items-center gap-0.5 text-gray-600 font-medium">
                                <Phone className="w-2.5 h-2.5 text-gray-400" />
                                {st.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className={`text-xs font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${overallStatus.color}`}>
                          <span>الإجمالي: {totalPercent}%</span>
                        </div>

                        <div className="no-print flex items-center gap-0.5">
                          <button
                            onClick={() => handleShareTargetWhatsApp(st)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="إرسال تقرير الأداء والتارجت عبر واتساب"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditTarget(st)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل بيانات الموظف والهدف"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف الموظف "${st.sellerName}"؟`)) {
                                deleteSellerTarget(st.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف الموظف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Total Target Overview Card */}
                    <div className="p-3 bg-white border border-purple-200 rounded-xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-black text-purple-950">
                            إجمالي الهدف: <strong className="text-purple-700 font-black text-sm">{totalTarget}</strong> كرتونة
                          </span>
                        </div>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${overallStatus.color}`}>
                          {overallStatus.text} ({totalPercent}%)
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-600 font-medium bg-purple-50/50 p-1.5 rounded-lg flex items-center justify-between">
                        <span>منها جامبو: <strong className="text-purple-900 font-bold">{targetJumbo}</strong> كرتون</span>
                        <span className="text-gray-300">|</span>
                        <span>باقي الهدف (صغير): <strong className="text-blue-900 font-bold">{targetSmall}</strong> كرتون</span>
                      </div>

                      {/* Total Target Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${overallStatus.bar} transition-all duration-500 rounded-full`}
                            style={{ width: `${Math.min(100, Math.max(0, totalPercent))}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-gray-600">
                          <span>المحقق الكلي: <strong className="text-purple-800 font-black">{totalAchieved}</strong> كرتون</span>
                          <span>المتبقي للهدف: <strong className="text-gray-900">{Math.max(0, totalTarget - totalAchieved)}</strong> كرتون</span>
                        </div>
                      </div>
                    </div>

                    {/* Carton Metrics Grid (Jumbo & Small Breakdown) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Jumbo Cartons (من إجمالي الهدف) */}
                      <div className="p-3 bg-white border border-purple-100 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                            <Boxes className="w-3.5 h-3.5 text-purple-600" />
                            <span>كرتون جامبو:</span>
                          </span>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${jumboStatus.color}`}>
                            {percentJumbo}%
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${jumboStatus.bar} transition-all duration-500 rounded-full`}
                              style={{ width: `${Math.min(100, Math.max(0, percentJumbo))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-gray-600">
                            <span>المحقق: <strong className="text-purple-700 font-black">{achievedJumbo}</strong></span>
                            <span>الهدف (منهم): <strong className="text-gray-900">{targetJumbo}</strong></span>
                          </div>
                        </div>

                        {/* Quick Carton Controls */}
                        <div className="no-print pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1">
                          <span className="text-[10px] text-gray-400 font-bold">تسجيل سريع:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleQuickAdjustCartons(st.id, 'jumbo', 1)}
                              className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md font-black text-[11px] active:scale-95 transition-all"
                              title="إضافة 1 كرتون جامبو للمحقق"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleQuickAdjustCartons(st.id, 'jumbo', 5)}
                              className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-md font-black text-[11px] active:scale-95 transition-all"
                              title="إضافة 5 كراتين جامبو للمحقق"
                            >
                              +5
                            </button>
                            {achievedJumbo > 0 && (
                              <button
                                onClick={() => handleQuickAdjustCartons(st.id, 'jumbo', -1)}
                                className="px-1.5 py-0.5 bg-gray-100 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-md font-bold text-[10px]"
                                title="خصم 1 كرتون جامبو"
                              >
                                -1
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Small Cartons (باقي الهدف يشمل الصغير) */}
                      <div className="p-3 bg-white border border-blue-100 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                            <span>باقي الهدف (صغير):</span>
                          </span>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${smallStatus.color}`}>
                            {percentSmall}%
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${smallStatus.bar} transition-all duration-500 rounded-full`}
                              style={{ width: `${Math.min(100, Math.max(0, percentSmall))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-gray-600">
                            <span>المحقق: <strong className="text-blue-700 font-black">{achievedSmall}</strong></span>
                            <span>الهدف (الباقي): <strong className="text-gray-900">{targetSmall}</strong></span>
                          </div>
                        </div>

                        {/* Quick Carton Controls */}
                        <div className="no-print pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1">
                          <span className="text-[10px] text-gray-400 font-bold">تسجيل سريع:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleQuickAdjustCartons(st.id, 'small', 1)}
                              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-black text-[11px] active:scale-95 transition-all"
                              title="إضافة 1 كرتون صغير للمحقق"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleQuickAdjustCartons(st.id, 'small', 5)}
                              className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md font-black text-[11px] active:scale-95 transition-all"
                              title="إضافة 5 كراتين صغير للمحقق"
                            >
                              +5
                            </button>
                            {achievedSmall > 0 && (
                              <button
                                onClick={() => handleQuickAdjustCartons(st.id, 'small', -1)}
                                className="px-1.5 py-0.5 bg-gray-100 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-md font-bold text-[10px]"
                                title="خصم 1 كرتون صغير"
                              >
                                -1
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {st.notes && (
                      <p className="text-[11px] text-gray-500 italic bg-white p-2 rounded-lg border border-gray-100">
                        {st.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Target Modal (Total Target, Jumbo portion, and Small portion as remainder) */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    {editingTarget ? 'تعديل بيانات الموظف والهدف' : 'إضافة موظف جديد وتحديد المستهدف'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    إجمالي الهدف (مثال: 1500) منهم جامبو (250) وباقي الهدف صغير (1250)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsTargetModalOpen(false)} 
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">اسم الموظف / البائع *:</label>
                  <input
                    type="text"
                    required
                    value={targetFormData.sellerName}
                    onChange={e => setTargetFormData({ ...targetFormData, sellerName: e.target.value })}
                    placeholder="مثال: أحمد محمد"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">المسمى الوظيفي / الدور:</label>
                  <select
                    value={targetFormData.role}
                    onChange={e => setTargetFormData({ ...targetFormData, role: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-medium"
                  >
                    <option value="مندوب مبيعات">مندوب مبيعات</option>
                    <option value="كاشير">كاشير</option>
                    <option value="مسؤول توزيع وتوصيل">مسؤول توزيع وتوصيل</option>
                    <option value="مدير مبيعات">مدير مبيعات</option>
                    <option value="مشرف فرع">مشرف فرع</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">رقم الهاتف / الواتساب:</label>
                  <input
                    type="tel"
                    value={targetFormData.phone}
                    onChange={e => setTargetFormData({ ...targetFormData, phone: e.target.value })}
                    placeholder="05XXXXXXXX"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">فترة الهدف:</label>
                  <select
                    value={targetFormData.period}
                    onChange={e => setTargetFormData({ ...targetFormData, period: e.target.value as any })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-medium"
                  >
                    <option value="monthly">شهري (Monthly)</option>
                    <option value="weekly">أسبوعي (Weekly)</option>
                    <option value="daily">يومي (Daily)</option>
                  </select>
                </div>
              </div>

              {/* Target Calculation Box (Smart total + jumbo + remainder small) */}
              <div className="p-3.5 bg-purple-50/70 border-2 border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-purple-950 flex items-center gap-1.5 text-xs">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span>تحديد المستهدف بالكرتون (إجمالي + جامبو + باقي الهدف صغير)</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 1. Total Target */}
                  <div className="bg-white p-2.5 rounded-xl border border-purple-200">
                    <label className="text-purple-950 text-xs font-black block mb-1">
                      1. إجمالي الهدف المطلوب:
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={targetFormData.totalTargetCartons || ''}
                      onChange={e => {
                        const newTotal = Number(e.target.value) || 0;
                        const newSmall = Math.max(0, newTotal - (targetFormData.targetJumboCartons || 0));
                        setTargetFormData({
                          ...targetFormData,
                          totalTargetCartons: newTotal,
                          targetSmallCartons: newSmall,
                        });
                      }}
                      placeholder="1500"
                      className="w-full p-2 bg-purple-50/50 border border-purple-300 rounded-lg text-purple-900 font-black text-sm focus:outline-none focus:border-purple-600 focus:bg-white"
                    />
                    <span className="text-[10px] text-purple-600 font-medium mt-0.5 block">مثال: 1500 كرتونة</span>
                  </div>

                  {/* 2. Jumbo Portions */}
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <label className="text-purple-900 text-xs font-bold block mb-1">
                      2. منهم كرتون جامبو:
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={targetFormData.targetJumboCartons || ''}
                      onChange={e => {
                        const newJumbo = Number(e.target.value) || 0;
                        const total = targetFormData.totalTargetCartons || 0;
                        const newSmall = Math.max(0, total - newJumbo);
                        setTargetFormData({
                          ...targetFormData,
                          targetJumboCartons: newJumbo,
                          targetSmallCartons: newSmall,
                        });
                      }}
                      placeholder="250"
                      className="w-full p-2 bg-white border border-purple-200 rounded-lg text-purple-800 font-bold text-sm focus:outline-none focus:border-purple-600"
                    />
                    <span className="text-[10px] text-gray-500 font-medium mt-0.5 block">مثال: 250 جامبو</span>
                  </div>

                  {/* 3. Small (Remainder) */}
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <label className="text-blue-900 text-xs font-bold block mb-1">
                      3. باقي الهدف (صغير):
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={targetFormData.targetSmallCartons || ''}
                      onChange={e => {
                        const newSmall = Number(e.target.value) || 0;
                        const newTotal = newSmall + (targetFormData.targetJumboCartons || 0);
                        setTargetFormData({
                          ...targetFormData,
                          targetSmallCartons: newSmall,
                          totalTargetCartons: newTotal,
                        });
                      }}
                      placeholder="1250"
                      className="w-full p-2 bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 font-bold text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <span className="text-[10px] text-blue-600 font-medium mt-0.5 block">محسوب تلقائياً (1250)</span>
                  </div>
                </div>

                {/* Formula Explanatory Pill */}
                <div className="bg-white/90 border border-purple-200/80 p-2 rounded-xl text-[11px] text-purple-900 font-medium flex items-center justify-between">
                  <span>
                    💡 <strong>معادلة الهدف:</strong> إجمالي ({targetFormData.totalTargetCartons || 0}) = جامبو ({targetFormData.targetJumboCartons || 0}) + صغير ({targetFormData.targetSmallCartons || 0})
                  </span>
                  <span className="font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                    المجموع: {(targetFormData.targetJumboCartons || 0) + (targetFormData.targetSmallCartons || 0)} كرتون
                  </span>
                </div>
              </div>

              {/* Achieved actuals section */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2.5">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>المحقق الفعلي الحالي (كرتون):</span>
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <label className="text-purple-900 text-xs font-bold block mb-1">المحقق الفعلي (جامبو):</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={targetFormData.achievedJumboCartons || ''}
                      onChange={e => setTargetFormData({ ...targetFormData, achievedJumboCartons: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full p-2 bg-purple-50/30 border border-purple-200 rounded-lg text-purple-900 font-bold focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                    <label className="text-blue-900 text-xs font-bold block mb-1">المحقق الفعلي (صغير):</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={targetFormData.achievedSmallCartons || ''}
                      onChange={e => setTargetFormData({ ...targetFormData, achievedSmallCartons: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full p-2 bg-blue-50/30 border border-blue-200 rounded-lg text-blue-900 font-bold focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
                  <span>إجمالي المحقق الحالي: <strong className="text-emerald-700 font-black">{(targetFormData.achievedSmallCartons || 0) + (targetFormData.achievedJumboCartons || 0)}</strong> كرتون</span>
                  {targetFormData.totalTargetCartons > 0 && (
                    <span className="text-purple-700 font-black">
                      نسبة الإنجاز: {Math.round((((targetFormData.achievedSmallCartons || 0) + (targetFormData.achievedJumboCartons || 0)) / targetFormData.totalTargetCartons) * 100)}%
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">ملاحظات إضافية أو خط السير والتوزيع:</label>
                <input
                  type="text"
                  value={targetFormData.notes}
                  onChange={e => setTargetFormData({ ...targetFormData, notes: e.target.value })}
                  placeholder="مثال: مسؤول خط توزيع الشمال وسيارة رقم 12"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-200 transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ بيانات الموظف والهدف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTargetModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
