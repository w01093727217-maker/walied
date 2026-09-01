import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Printer, 
  X, 
  FileText, 
  MessageCircle, 
  Trash2, 
  Lock, 
  Scale, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Building,
  CreditCard,
  Banknote,
  Check,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatMoney, getTodayDateString, playSuccessSound, playHapticFeedback } from '../utils/helpers';
import { EmployeeLoan } from '../types';

export const LoansView: React.FC = () => {
  const { 
    employeeLoans, 
    sellerTargets, 
    settings, 
    totalCollections, 
    totalPaidFromInvoices,
    monthTotalCollections,
    monthInvoicePaid,
    monthDebtCollections,
    currentMonth,
    totalDisbursedLoans, 
    totalEmployeeLoans, 
    availableCollectionsForLoans,
    addEmployeeLoan, 
    repayEmployeeLoan, 
    deleteEmployeeLoan,
    setActiveTab
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'settled'>('all');
  
  // Modals
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<EmployeeLoan | null>(null);

  // New Loan Form State
  const [employeeName, setEmployeeName] = useState('');
  const [employeePhone, setEmployeePhone] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState<'loan' | 'advance'>('loan');
  const [loanDate, setLoanDate] = useState(getTodayDateString());
  const [loanDueDate, setLoanDueDate] = useState('');
  const [loanNotes, setLoanNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Repay Form State
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [repayNotes, setRepayNotes] = useState('');

  const currency = settings?.currencySymbol || 'ر.س';

  // Can issue loans only if available collections > 0
  const canIssueLoan = availableCollectionsForLoans > 0;

  // Filtered loans list
  const filteredLoans = useMemo(() => {
    return employeeLoans.filter(loan => {
      const matchSearch = loan.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loan.notes && loan.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'active' ? (loan.status === 'active' || loan.remainingAmount > 0) :
        (loan.status === 'settled' || loan.remainingAmount <= 0);

      return matchSearch && matchStatus;
    });
  }, [employeeLoans, searchTerm, filterStatus]);

  // Handle New Loan Submit
  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = parseFloat(loanAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('يرجى إدخال مبلغ صحيح للسلفة.');
      return;
    }

    if (!employeeName.trim()) {
      setFormError('يرجى تحديد أو كتابة اسم الموظف / المستفيد.');
      return;
    }

    if (!canIssueLoan) {
      setFormError(`عذراً! لا يمكن صرف أي سلفة لعدم توفر رصيد تحصيلات متاح حالياً (رصيد التحصيلات: 0 ${currency}). يجب تسجيل تحصيلات أولاً.`);
      return;
    }

    if (amountNum > availableCollectionsForLoans) {
      setFormError(`المبلغ المطلوب (${amountNum} ${currency}) يتجاوز رصيد التحصيلات المتاح للصرف (${availableCollectionsForLoans} ${currency}).`);
      return;
    }

    const result = addEmployeeLoan({
      employeeName: employeeName.trim(),
      amount: amountNum,
      date: loanDate,
      dueDate: loanDueDate || undefined,
      type: loanType,
      notes: employeePhone ? `هاتف: ${employeePhone} | ${loanNotes}` : loanNotes,
    });

    if (result.success) {
      setIsNewLoanOpen(false);
      setEmployeeName('');
      setEmployeePhone('');
      setLoanAmount('');
      setLoanNotes('');
      setLoanDueDate('');
      setFormError(null);
    } else if (result.error) {
      setFormError(result.error);
    }
  };

  // Handle Repayment Submit
  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForRepay) return;

    const amountNum = parseFloat(repayAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    repayEmployeeLoan(selectedLoanForRepay.id, amountNum, repayMethod, repayNotes);
    setIsRepayOpen(false);
    setSelectedLoanForRepay(null);
    setRepayAmount('');
    setRepayNotes('');
  };

  // Quick WhatsApp link
  const openWhatsApp = (loan: EmployeeLoan) => {
    // try to extract phone
    const phoneMatch = loan.notes?.match(/هاتف:\s*([0-9+]+)/);
    const phone = phoneMatch ? phoneMatch[1] : '';
    if (!phone) {
      alert('لم يتم تسجيل رقم هاتف لهذا الموظف.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `السلام عليكم ورحمة الله،\nنود تذكيركم بمتبقي السلفة المسجلة باسم (${loan.employeeName}) وقيمتها المتبقية (${formatMoney(loan.remainingAmount, currency)}).\nشكراً لكم - ${settings.storeName}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Print Loan Receipt
  const handlePrintReceipt = (loan: EmployeeLoan) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>سند صرف سلفة - ${loan.employeeName}</title>
          <style>
            body { font-family: 'Cairo', system-ui, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; color: #111; font-size: 13px; }
            .header { text-align: center; border-bottom: 2px dashed #444; padding-bottom: 10px; margin-bottom: 15px; }
            .header h2 { margin: 0 0 5px 0; font-size: 18px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dotted #ccc; padding-bottom: 4px; }
            .bold { font-weight: bold; }
            .box { background: #f4f6f9; border: 1px solid #ddd; padding: 12px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 25px; font-size: 11px; color: #666; }
            .sign { display: flex; justify-content: space-between; margin-top: 35px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings.storeName || 'المحل'}</h2>
            <p>سند صرف سلفة / عهدة مالية</p>
            <p>التاريخ: ${loan.date}</p>
          </div>
          <div class="box">
            <div class="row"><span>المستفيد:</span><span class="bold">${loan.employeeName}</span></div>
            <div class="row"><span>نوع البند:</span><span class="bold">${loan.type === 'advance' ? 'عهدة مؤقتة' : 'سلفة راتب'}</span></div>
            <div class="row"><span>قيمة السلفة الأصلية:</span><span class="bold">${formatMoney(loan.amount, currency)}</span></div>
            <div class="row"><span>المبلغ المسدد:</span><span class="bold" style="color:#059669">${formatMoney(loan.paidAmount, currency)}</span></div>
            <div class="row" style="font-size: 15px;"><span>المتبقي المستحق:</span><span class="bold" style="color:#dc2626">${formatMoney(loan.remainingAmount, currency)}</span></div>
            ${loan.dueDate ? `<div class="row"><span>تاريخ الاستحقاق:</span><span>${loan.dueDate}</span></div>` : ''}
            ${loan.notes ? `<div class="row"><span>ملاحظات:</span><span>${loan.notes}</span></div>` : ''}
          </div>
          <div class="sign">
            <div>توقيع المستلم: ....................</div>
            <div>توقيع المسؤول: ....................</div>
          </div>
          <div class="footer">
            <p>تم استخراج السند آلياً - ${settings.storeName}</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                إدارة السلف والعهد
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                بند مستقل مرتبط حصرياً بإجمالي المبالغ المحصلة (ممنوع صرف أي سلفة بدون رصيد تحصيل)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playHapticFeedback();
              setFormError(null);
              setIsNewLoanOpen(true);
            }}
            disabled={!canIssueLoan}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all ${
              canIssueLoan 
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {canIssueLoan ? <Plus className="w-4 h-4 stroke-[3]" /> : <Lock className="w-4 h-4" />}
            <span>صرف سلفة جديدة</span>
          </button>
        </div>
      </div>

      {/* STRICT COLLECTIONS CEILING STATUS BANNER */}
      {!canIssueLoan ? (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-sm text-rose-950 flex items-center gap-2">
              <span>⛔ تم إيقاف صرف السلف مؤقتاً لعدم توفر تحصيلات</span>
              <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md font-bold">
                تحصيل إلزامي
              </span>
            </h3>
            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              بناءً على سياسة العمل المعتمدة، السلف مرتبطة حصرياً بمتحصلات الخزينة. بما أن إجمالي التحصيلات المتاحة حالياً هو 
              <strong className="font-black mx-1 underline text-rose-950">0.00 {currency}</strong>،
              فلن تتمكن من تسجيل أو صرف أي سلفة حتى يتم تحصيل مبالغ من العملاء أو تسجيل دفعات نقدية واردة.
            </p>
            <div className="pt-1.5 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('customers')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs"
              >
                الذهاب للتحصيل من العملاء
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 font-bold text-xs rounded-lg transition-all"
              >
                مراجعة الفواتير
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block">
                الصرف متاح: رصيد التحصيلات المسموح بصرف سلف منه هو <strong className="text-emerald-950 font-black">{formatMoney(availableCollectionsForLoans, currency)}</strong>
              </span>
              <span className="text-[11px] text-emerald-700">
                مربوط مباشرة بإجمالي التحصيلات النقدية ({formatMoney(totalCollections, currency)})
              </span>
            </div>
          </div>

          <span className="text-xs font-black px-2.5 py-1 bg-emerald-600 text-white rounded-lg shadow-xs">
            تحصيل مفعل ✓
          </span>
        </div>
      )}

      {/* KPI Metrics Linked to Collections */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* 1. Total Collections (Ceiling) */}
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">إجمالي المبالغ المحصلة</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-blue-900">
              {formatMoney(totalCollections, currency)}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 inline-block">
              محصل الشهر: {formatMoney(monthTotalCollections, currency)} (فواتير: {formatMoney(monthInvoicePaid, currency)})
            </div>
          </div>
        </div>

        {/* 2. Available for Loans */}
        <div className={`border p-4 rounded-2xl shadow-xs flex flex-col justify-between ${
          availableCollectionsForLoans > 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">المتاح للصرف حالياً</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              availableCollectionsForLoans > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-xl sm:text-2xl font-black ${
              availableCollectionsForLoans > 0 ? 'text-emerald-950' : 'text-rose-900'
            }`}>
              {formatMoney(availableCollectionsForLoans, currency)}
            </div>
            <div className="text-[11px] font-semibold mt-1">
              {availableCollectionsForLoans > 0 ? '🟢 رصيد تحصيل متاح' : '🔴 غير متاح للصرف'}
            </div>
          </div>
        </div>

        {/* 3. Disbursed Loans */}
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">إجمالي السلف المنصرفة</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-900">
              {formatMoney(totalDisbursedLoans, currency)}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold mt-1">
              إجمالي مبالغ العقود
            </div>
          </div>
        </div>

        {/* 4. Outstanding Remaining */}
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">السلف المستحقة (المتبقية)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-purple-900">
              {formatMoney(totalEmployeeLoans, currency)}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1">
              مطلوب تحصيلها وردها
            </div>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الموظف أو المستفيد..."
            className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-amber-500 outline-none transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            جميع السلف ({employeeLoans.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'active' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            نشطة ومستحقة ({employeeLoans.filter(l => l.status === 'active' || l.remainingAmount > 0).length})
          </button>
          <button
            onClick={() => setFilterStatus('settled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'settled' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            مسددة بالكامل ({employeeLoans.filter(l => l.status === 'settled' || l.remainingAmount <= 0).length})
          </button>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-black text-gray-900">سجل سلف الموظفين والعهد</h2>
          </div>
          <span className="text-xs text-gray-500 font-bold">
            عدد السجلات: {filteredLoans.length}
          </span>
        </div>

        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <Coins className="w-7 h-7 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">لا توجد سلف مطابقة</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {canIssueLoan 
                ? 'يمكنك الضغط على زر "صرف سلفة جديدة" لتسجيل سلفة وخصمها من رصيد التحصيلات المتاح.'
                : 'لا يمكن صرف سلف جديدة حتى يتوفر رصيد تحصيلات بالخزينة.'
              }
            </p>
            {canIssueLoan && (
              <button
                onClick={() => setIsNewLoanOpen(true)}
                className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                صرف سلفة الآن
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">الموظف / المستفيد</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">تاريخ الصرف</th>
                  <th className="py-3 px-4">قيمة السلفة</th>
                  <th className="py-3 px-4">المسدد</th>
                  <th className="py-3 px-4">المتبقي المستحق</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredLoans.map(loan => {
                  const isSettled = loan.remainingAmount <= 0;
                  return (
                    <tr key={loan.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-700">
                            {loan.employeeName.charAt(0)}
                          </div>
                          <div>
                            <span className="block">{loan.employeeName}</span>
                            {loan.notes && (
                              <span className="text-[10px] text-gray-500 font-normal truncate max-w-[180px] block">
                                {loan.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          loan.type === 'advance' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {loan.type === 'advance' ? 'عهدة مؤقتة' : 'سلفة راتب'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-600 font-mono">
                        {loan.date}
                        {loan.dueDate && (
                          <div className="text-[10px] text-amber-700">استحقاق: {loan.dueDate}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-black text-gray-900">
                        {formatMoney(loan.amount, currency)}
                      </td>

                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {formatMoney(loan.paidAmount, currency)}
                      </td>

                      <td className="py-3 px-4 font-black text-rose-700 text-sm">
                        {formatMoney(loan.remainingAmount, currency)}
                      </td>

                      <td className="py-3 px-4">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>مسددة بالكامل</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>مستحقة</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isSettled && (
                            <button
                              onClick={() => {
                                setSelectedLoanForRepay(loan);
                                setRepayAmount(loan.remainingAmount.toString());
                                setIsRepayOpen(true);
                              }}
                              title="تسجيل سداد قسط"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-all"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handlePrintReceipt(loan)}
                            title="طباعة سند السلفة"
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openWhatsApp(loan)}
                            title="تذكير واتساب"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف سلفة (${loan.employeeName})؟`)) {
                                deleteEmployeeLoan(loan.id);
                              }
                            }}
                            title="حذف"
                            className="p-1.5 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: NEW LOAN (STRICT VALIDATION WITH COLLECTIONS) ================= */}
      {isNewLoanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" dir="rtl">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base">صرف سلفة أو عهدة جديدة</h3>
                  <p className="text-[11px] text-amber-100">
                    مربوطة برصيد التحصيلات المتاح ({formatMoney(availableCollectionsForLoans, currency)})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNewLoanOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateLoan} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Collection Ceiling Alert Box */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs font-bold text-amber-900">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>الحد الأقصى المتاح للصرف من التحصيلات:</span>
                </div>
                <span className="text-sm font-black text-amber-950 font-mono bg-white px-2 py-0.5 rounded-lg border border-amber-200">
                  {formatMoney(availableCollectionsForLoans, currency)}
                </span>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Employee Selection / Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  الموظف / المستفيد <span className="text-rose-600">*</span>
                </label>
                
                {/* Fast Pick from SellerTargets */}
                {sellerTargets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {sellerTargets.map(seller => (
                      <button
                        key={seller.id}
                        type="button"
                        onClick={() => {
                          setEmployeeName(seller.sellerName);
                          if (seller.phone) setEmployeePhone(seller.phone);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                          employeeName === seller.sellerName
                            ? 'bg-amber-100 border-amber-400 text-amber-900'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {seller.sellerName}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  required
                  value={employeeName}
                  onChange={e => setEmployeeName(e.target.value)}
                  placeholder="اكتب اسم الموظف أو اختر من القائمة أعلاه"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Phone (Optional for reminders) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  رقم الهاتف / الواتساب (للتذكير)
                </label>
                <input
                  type="text"
                  value={employeePhone}
                  onChange={e => setEmployeePhone(e.target.value)}
                  placeholder="مثال: 0501234567"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Amount & Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    مبلغ السلفة المطلوب <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={availableCollectionsForLoans}
                      required
                      value={loanAmount}
                      onChange={e => {
                        setLoanAmount(e.target.value);
                        setFormError(null);
                      }}
                      placeholder="0.00"
                      className={`w-full p-2.5 pl-12 bg-gray-50 border rounded-xl text-sm font-black focus:bg-white outline-none ${
                        parseFloat(loanAmount) > availableCollectionsForLoans
                          ? 'border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-600'
                          : 'border-gray-300 focus:border-amber-500 text-gray-900'
                      }`}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                      {currency}
                    </span>
                  </div>
                  {parseFloat(loanAmount) > availableCollectionsForLoans && (
                    <p className="text-[10px] font-bold text-rose-600">
                      المبلغ يتجاوز رصيد التحصيلات المتاح!
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    نوع البند
                  </label>
                  <select
                    value={loanType}
                    onChange={e => setLoanType(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:border-amber-500 outline-none"
                  >
                    <option value="loan">سلفة على الراتب</option>
                    <option value="advance">عهدة عمل مؤقتة</option>
                  </select>
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    تاريخ الصرف
                  </label>
                  <input
                    type="date"
                    required
                    value={loanDate}
                    onChange={e => setLoanDate(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    تاريخ الاستحقاق المتوقع (اختياري)
                  </label>
                  <input
                    type="date"
                    value={loanDueDate}
                    onChange={e => setLoanDueDate(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  ملاحظات أو سبب السلفة
                </label>
                <textarea
                  rows={2}
                  value={loanNotes}
                  onChange={e => setLoanNotes(e.target.value)}
                  placeholder="اكتب أي تفاصيل إضافية..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewLoanOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={
                    !canIssueLoan || 
                    !loanAmount || 
                    parseFloat(loanAmount) <= 0 || 
                    parseFloat(loanAmount) > availableCollectionsForLoans
                  }
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تأكيد وصرف السلفة</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: REPAY / SETTLE ADVANCE ================= */}
      {isRepayOpen && selectedLoanForRepay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col" dir="rtl">
            
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base">تحصيل سداد سلفة</h3>
                  <p className="text-[11px] text-emerald-100">
                    الموظف: {selectedLoanForRepay.employeeName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRepayOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRepaySubmit} className="p-4 sm:p-5 space-y-4">
              
              {/* Summary box */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>إجمالي السلفة:</span>
                  <span className="font-bold text-gray-900">{formatMoney(selectedLoanForRepay.amount, currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>المسدد سابقاً:</span>
                  <span className="font-bold text-emerald-600">{formatMoney(selectedLoanForRepay.paidAmount, currency)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold border-t border-gray-200 pt-1.5">
                  <span>المتبقي المستحق:</span>
                  <span className="font-black text-sm">{formatMoney(selectedLoanForRepay.remainingAmount, currency)}</span>
                </div>
              </div>

              {/* Repay Amount */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  المبلغ المسدد الآن <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedLoanForRepay.remainingAmount}
                    required
                    value={repayAmount}
                    onChange={e => setRepayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 pl-12 bg-gray-50 border border-gray-300 rounded-xl text-sm font-black focus:bg-white focus:border-emerald-500 outline-none"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  طريقة السداد / التحصيل
                </label>
                <select
                  value={repayMethod}
                  onChange={e => setRepayMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                >
                  <option value="cash">نقداً (بالخزينة)</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="card">شبكة / بطاقة</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  ملاحظات السداد
                </label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={e => setRepayNotes(e.target.value)}
                  placeholder="مثال: خصم من راتب شهر، أو سداد نقدي"
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRepayOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  تسجيل التحصيل
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
