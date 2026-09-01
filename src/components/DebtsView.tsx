import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  Building2, 
  UserCheck, 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Calendar, 
  Coins, 
  ArrowLeftRight, 
  Printer, 
  X, 
  FileText,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatMoney, getTodayDateString } from '../utils/helpers';
import { Customer, EmployeeLoan, PaymentRecord } from '../types';

export const DebtsView: React.FC = () => {
  const { 
    customers, 
    employeeLoans, 
    payments, 
    settings, 
    sellerTargets,
    cashInDrawer,
    totalCustomerDebts, 
    totalSupplierDebts, 
    totalEmployeeLoans,
    totalReceivables,
    totalPayables,
    netDebtBalance,
    totalCollections,
    totalPaidFromInvoices,
    monthTotalCollections,
    monthInvoicePaid,
    monthDebtCollections,
    currentMonth,
    totalDisbursedLoans,
    availableCollectionsForLoans,
    recordCustomerPayment,
    addEmployeeLoan,
    repayEmployeeLoan,
    deleteEmployeeLoan
  } = useApp();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'all' | 'receivables' | 'payables' | 'employee_loans' | 'ledger'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debt_only' | 'active_only'>('all');

  // Modals state
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [isRepayLoanOpen, setIsRepayLoanOpen] = useState(false);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<EmployeeLoan | null>(null);
  
  const [isCustomerPayOpen, setIsCustomerPayOpen] = useState(false);
  const [selectedCustomerForPay, setSelectedCustomerForPay] = useState<Customer | null>(null);

  // New loan form
  const [loanEmployeeName, setLoanEmployeeName] = useState('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [loanType, setLoanType] = useState<'loan' | 'advance'>('loan');
  const [loanDate, setLoanDate] = useState(getTodayDateString());
  const [loanDueDate, setLoanDueDate] = useState('');
  const [loanNotes, setLoanNotes] = useState('');
  const [loanError, setLoanError] = useState<string | null>(null);

  // Repay loan form
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayMethod, setRepayMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [repayNotes, setRepayNotes] = useState('');

  // Customer / Supplier pay form
  const [custPayAmount, setCustPayAmount] = useState<string>('');
  const [custPayMethod, setCustPayMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [custPayNotes, setCustPayNotes] = useState('');

  // Customers with debts (ما لنا)
  const debtorCustomers = useMemo(() => {
    return customers.filter(c => c.type === 'customer' && c.balance > 0);
  }, [customers]);

  // Suppliers with debts (ما علينا)
  const creditorSuppliers = useMemo(() => {
    return customers.filter(c => c.type === 'supplier' && c.balance < 0);
  }, [customers]);

  // Active employee loans (ما لنا سلفيات)
  const activeLoans = useMemo(() => {
    return employeeLoans.filter(l => l.status === 'active' || l.remainingAmount > 0);
  }, [employeeLoans]);

  // Total settled employee loans
  const totalSettledEmployeeLoans = useMemo(() => {
    return employeeLoans.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
  }, [employeeLoans]);

  // Filtered customers for receivables tab
  const filteredDebtors = useMemo(() => {
    return customers
      .filter(c => c.type === 'customer')
      .filter(c => filterType === 'debt_only' ? c.balance > 0 : true)
      .filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      );
  }, [customers, filterType, searchTerm]);

  // Filtered suppliers for payables tab
  const filteredSuppliers = useMemo(() => {
    return customers
      .filter(c => c.type === 'supplier')
      .filter(c => filterType === 'debt_only' ? c.balance < 0 : true)
      .filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      );
  }, [customers, filterType, searchTerm]);

  // Filtered employee loans
  const filteredLoans = useMemo(() => {
    return employeeLoans
      .filter(l => filterType === 'active_only' ? (l.status === 'active' || l.remainingAmount > 0) : true)
      .filter(l => 
        l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.notes && l.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [employeeLoans, filterType, searchTerm]);

  // Filtered ledger
  const filteredPayments = useMemo(() => {
    return payments.filter(p => 
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [payments, searchTerm]);

  // Open Add Loan modal
  const handleOpenAddLoan = () => {
    setLoanEmployeeName(sellerTargets[0]?.sellerName || '');
    setLoanAmount('');
    setLoanType('loan');
    setLoanDate(getTodayDateString());
    setLoanDueDate('');
    setLoanNotes('');
    setLoanError(null);
    setIsNewLoanOpen(true);
  };

  // Submit New Loan
  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    setLoanError(null);
    const numAmount = parseFloat(loanAmount);
    if (!loanEmployeeName.trim()) {
      setLoanError('يرجى تحديد أو إدخال اسم الموظف');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setLoanError('يرجى إدخال مبلغ صحيح للسلفة');
      return;
    }

    if (availableCollectionsForLoans <= 0) {
      setLoanError(`عذراً! لا يمكن صرف السلفة لعدم توفر رصيد تحصيلات متاح (الرصيد: 0 ${settings.currencySymbol}). يجب تحصيل دفعات من العملاء أولاً.`);
      return;
    }

    if (numAmount > availableCollectionsForLoans) {
      setLoanError(`المبلغ المطلوب (${numAmount} ${settings.currencySymbol}) أكبر من رصيد التحصيلات المتاح للصرف حالياً (${availableCollectionsForLoans} ${settings.currencySymbol}).`);
      return;
    }

    const result = addEmployeeLoan({
      employeeName: loanEmployeeName.trim(),
      amount: numAmount,
      date: loanDate,
      dueDate: loanDueDate || undefined,
      type: loanType,
      notes: loanNotes.trim() || undefined,
    });

    if (result && !result.success) {
      setLoanError(result.error || 'تعذر صرف السلفة');
      return;
    }

    setIsNewLoanOpen(false);
  };

  // Open Repay Loan modal
  const handleOpenRepayLoan = (loan: EmployeeLoan) => {
    setSelectedLoanForRepay(loan);
    setRepayAmount(loan.remainingAmount.toString());
    setRepayMethod('cash');
    setRepayNotes(`سداد سلفة للموظف ${loan.employeeName}`);
    setIsRepayLoanOpen(true);
  };

  // Submit Repay Loan
  const handleSaveRepayLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForRepay) return;
    const numAmount = parseFloat(repayAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    repayEmployeeLoan(selectedLoanForRepay.id, numAmount, repayMethod, repayNotes);
    setIsRepayLoanOpen(false);
    setSelectedLoanForRepay(null);
  };

  // Open Customer / Supplier Pay modal
  const handleOpenCustomerPay = (cust: Customer) => {
    setSelectedCustomerForPay(cust);
    setCustPayAmount(Math.abs(cust.balance).toString());
    setCustPayMethod('cash');
    setCustPayNotes(cust.type === 'supplier' ? `سداد دفعة للمورد ${cust.name}` : `تحصيل دفعة من العميل ${cust.name}`);
    setIsCustomerPayOpen(true);
  };

  // Submit Customer / Supplier Pay
  const handleSaveCustomerPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPay) return;
    const numAmount = parseFloat(custPayAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    recordCustomerPayment(
      selectedCustomerForPay.id,
      selectedCustomerForPay.type === 'supplier' ? -numAmount : numAmount,
      custPayMethod,
      custPayNotes
    );

    setIsCustomerPayOpen(false);
    setSelectedCustomerForPay(null);
  };

  // WhatsApp reminder generator for customer debt
  const sendCustomerDebtWhatsApp = (cust: Customer) => {
    const cleanPhone = cust.phone.replace(/[^\d]/g, '');
    const msg = `مرحباً أستاذ/ة *${cust.name}* 🌸\nنود تذكيركم بأن الرصيد المستحق لحسابكم لدى *${settings.storeName}* هو *${cust.balance} ${settings.currencySymbol}*.\nشاكرين ومقدرين حسن تعاونكم معنا.\nللاستفسار: ${settings.phone}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // WhatsApp reminder for employee loan
  const sendEmployeeLoanWhatsApp = (loan: EmployeeLoan) => {
    const matchedEmployee = sellerTargets.find(s => s.sellerName.trim() === loan.employeeName.trim());
    const phone = matchedEmployee?.phone || '';
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const msg = `مرحباً زميلنا العزيز *${loan.employeeName}* 💼\nبيان رصيد السلفة المسجلة بتاريخ (${loan.date}):\n- قيمة السلفة الأصلية: *${loan.amount} ${settings.currencySymbol}*\n- المسدد: *${loan.paidAmount} ${settings.currencySymbol}*\n- *المتبقي المستحق:* *${loan.remainingAmount} ${settings.currencySymbol}* ${loan.dueDate ? `(تاريخ الاستحقاق: ${loan.dueDate})` : ''}\nإدارة الحسابات - ${settings.storeName}`;
    
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      navigator.clipboard.writeText(msg);
      alert('تم نسخ نص كشف حساب السلفة للحافظة!');
    }
  };

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Scale className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                المديونية والمركز المالي
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                ما لنا وما علينا
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              متابعة دقيقة لمستحقات العملاء، التزامات الموردين، سلف الموظفين، وحساب صافي الرصيد المتبقي
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleOpenAddLoan}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>صرف سلفة موظف</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition-all"
            title="طباعة التقرير الشامل"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* 5 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. ما لنا (مستحقاتنا لدى الغير) */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                ما لنا (مستحقات)
              </span>
            </div>

            <div className="mt-3">
              <span className="text-xs text-emerald-950 font-bold block">إجمالي ما لنا لدى الغير:</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                {formatMoney(totalReceivables, settings.currencySymbol)}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-900">
            <span>ديون عملاء: <strong>{formatMoney(totalCustomerDebts, settings.currencySymbol)}</strong></span>
            <span>سلف: <strong>{formatMoney(totalEmployeeLoans, settings.currencySymbol)}</strong></span>
          </div>
        </div>

        {/* 2. ما تم تحصيله (التحصيلات النقدية) */}
        <div className="bg-gradient-to-br from-cyan-50 to-teal-50/60 p-4 sm:p-5 rounded-2xl border border-cyan-200/90 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                ما تم تحصيله
              </span>
            </div>

            <div className="mt-3">
              <span className="text-xs text-cyan-950 font-bold block">إجمالي المبالغ المحصلة:</span>
              <div className="text-xl sm:text-2xl font-black text-cyan-700 mt-1">
                {formatMoney(totalCollections, settings.currencySymbol)}
              </div>
              <div className="text-[10px] text-cyan-800 font-bold mt-1 bg-cyan-100/70 px-2 py-0.5 rounded-md inline-block">
                هذا الشهر: {formatMoney(monthTotalCollections, settings.currencySymbol)} (فواتير: {formatMoney(monthInvoicePaid, settings.currencySymbol)})
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-cyan-200/60 flex items-center justify-between text-[11px] font-semibold text-cyan-900">
            <span>المتاح للسلف: <strong className="text-emerald-700 font-bold">{formatMoney(availableCollectionsForLoans, settings.currencySymbol)}</strong></span>
            <span className="text-[10px] text-cyan-700 font-bold">مصدر السلفيات</span>
          </div>
        </div>

        {/* 3. سلف الموظفين (المصروفة من التحصيل) */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50/40 p-4 sm:p-5 rounded-2xl border border-purple-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <UserCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                سلف الموظفين
              </span>
            </div>

            <div className="mt-3">
              <span className="text-xs text-purple-950 font-bold block">المتبقي من السلفيات:</span>
              <div className="text-xl sm:text-2xl font-black text-purple-700 mt-1">
                {formatMoney(totalEmployeeLoans, settings.currencySymbol)}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-purple-200/60 flex items-center justify-between text-[11px] font-semibold text-purple-900">
            <span>منصرف: <strong>{formatMoney(totalDisbursedLoans, settings.currencySymbol)}</strong></span>
            <span>مسدد: <strong className="text-emerald-700">{formatMoney(totalSettledEmployeeLoans, settings.currencySymbol)}</strong></span>
          </div>
        </div>

        {/* 4. ما علينا (التزامات الموردين) */}
        <div className="bg-gradient-to-br from-rose-50 to-red-50/40 p-4 sm:p-5 rounded-2xl border border-rose-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                ما علينا (التزامات)
              </span>
            </div>

            <div className="mt-3">
              <span className="text-xs text-rose-950 font-bold block">إجمالي ديون الموردين علينا:</span>
              <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
                {formatMoney(totalPayables, settings.currencySymbol)}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-rose-200/60 flex items-center justify-between text-[11px] font-semibold text-rose-900">
            <span>موردين دائنين: <strong>{creditorSuppliers.length} مورد</strong></span>
            <span className="text-rose-700 font-bold">شراء آجل</span>
          </div>
        </div>

        {/* 5. الباقي / صافي المركز المالي */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs relative overflow-hidden flex flex-col justify-between ${
          netDebtBalance >= 0 
            ? 'bg-gradient-to-br from-blue-50 to-sky-50/50 border-blue-200/80 text-blue-950' 
            : 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200/80 text-amber-950'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-xs ${
                netDebtBalance >= 0 ? 'bg-blue-600' : 'bg-amber-600'
              }`}>
                <Coins className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                netDebtBalance >= 0 
                  ? 'bg-blue-100 text-blue-800 border-blue-200' 
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}>
                {netDebtBalance >= 0 ? 'فائض مستحقات (لنا)' : 'عجز التزامات (علينا)'}
              </span>
            </div>

            <div className="mt-3">
              <span className="text-xs font-bold block">
                الصافي المتبقي (ما لنا - ما علينا):
              </span>
              <div className={`text-xl sm:text-2xl font-black mt-1 ${
                netDebtBalance >= 0 ? 'text-blue-700' : 'text-amber-700'
              }`}>
                {formatMoney(Math.abs(netDebtBalance), settings.currencySymbol)}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-center justify-between text-[11px] font-semibold">
            <span>الدرج: <strong>{formatMoney(cashInDrawer, settings.currencySymbol)}</strong></span>
            <span className="font-bold text-gray-700">
              الصافي: {formatMoney(cashInDrawer + netDebtBalance, settings.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          {/* Sub Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>نظرة شاملة ومقارنة</span>
            </button>

            <button
              onClick={() => setActiveTab('receivables')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'receivables'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>ما لنا (ديون العملاء)</span>
              {debtorCustomers.length > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {debtorCustomers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('payables')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'payables'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>ما علينا (ديون الموردين)</span>
              {creditorSuppliers.length > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {creditorSuppliers.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('employee_loans')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'employee_loans'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>سلف الموظفين</span>
              {activeLoans.length > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {activeLoans.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'ledger'
                  ? 'bg-gray-800 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>سجل السدادات والتحصيل</span>
            </button>
          </div>
        </div>

        {/* Search & Quick Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم، الهاتف، أو الملاحظات..."
              className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-blue-600"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-gray-500 font-bold hidden sm:inline">التصفية:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterType === 'all'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterType(activeTab === 'employee_loans' ? 'active_only' : 'debt_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterType === 'debt_only' || filterType === 'active_only'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {activeTab === 'employee_loans' ? 'السلف النشطة فقط' : 'أصحاب الديون فقط'}
            </button>
          </div>
        </div>
      </div>

      {/* VIEW CONTENT BASED ON TAB */}

      {/* TAB 1: ALL OVERVIEW & COMPARISON */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {/* Balance Breakdown Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Debtors (ما لنا - عملاء) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Users className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-gray-900">أبرز ديون العملاء (ما لنا)</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('receivables')} 
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    عرض الكل ({debtorCustomers.length})
                  </button>
                </div>

                <div className="divide-y divide-gray-50 mt-2">
                  {debtorCustomers.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      🎉 لا توجد ديون مستحقة على أي عميل حالياً
                    </div>
                  ) : (
                    debtorCustomers.slice(0, 4).map(cust => (
                      <div key={cust.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{cust.name}</p>
                          <p className="text-[11px] text-gray-500">{cust.phone}</p>
                        </div>
                        <div className="text-left">
                          <span className="font-black text-emerald-600 block">
                            {formatMoney(cust.balance, settings.currencySymbol)}
                          </span>
                          <button
                            onClick={() => handleOpenCustomerPay(cust)}
                            className="text-[10px] text-blue-600 font-bold hover:underline"
                          >
                            تحصيل دفعة
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-700">
                <span>إجمالي ديون العملاء:</span>
                <span className="text-emerald-600 font-black">{formatMoney(totalCustomerDebts, settings.currencySymbol)}</span>
              </div>
            </div>

            {/* Top Creditors (ما علينا - موردين) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <Building className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-gray-900">ديون الموردين (ما علينا)</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('payables')} 
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    عرض الكل ({creditorSuppliers.length})
                  </button>
                </div>

                <div className="divide-y divide-gray-50 mt-2">
                  {creditorSuppliers.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      ✅ ممتاز! لا توجد مستحقات أو ديون للموردين
                    </div>
                  ) : (
                    creditorSuppliers.slice(0, 4).map(supp => (
                      <div key={supp.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{supp.name}</p>
                          <p className="text-[11px] text-gray-500">{supp.phone}</p>
                        </div>
                        <div className="text-left">
                          <span className="font-black text-rose-600 block">
                            {formatMoney(Math.abs(supp.balance), settings.currencySymbol)}
                          </span>
                          <button
                            onClick={() => handleOpenCustomerPay(supp)}
                            className="text-[10px] text-rose-600 font-bold hover:underline"
                          >
                            سداد دفعة
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-700">
                <span>إجمالي ديون الموردين:</span>
                <span className="text-rose-600 font-black">{formatMoney(totalSupplierDebts, settings.currencySymbol)}</span>
              </div>
            </div>

            {/* Top Active Employee Loans */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-gray-900">سلف وعهد الموظفين</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('employee_loans')} 
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    عرض الكل ({activeLoans.length})
                  </button>
                </div>

                <div className="divide-y divide-gray-50 mt-2">
                  {activeLoans.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      ✨ لا توجد سلفيات نشطة غير مسددة حالياً
                    </div>
                  ) : (
                    activeLoans.slice(0, 4).map(loan => (
                      <div key={loan.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{loan.employeeName}</p>
                          <p className="text-[11px] text-gray-500">
                            {loan.type === 'advance' ? 'عهدة عمل' : 'سلفة راتب'} • {loan.date}
                          </p>
                        </div>
                        <div className="text-left">
                          <span className="font-black text-purple-700 block">
                            {formatMoney(loan.remainingAmount, settings.currencySymbol)}
                          </span>
                          <button
                            onClick={() => handleOpenRepayLoan(loan)}
                            className="text-[10px] text-purple-700 font-bold hover:underline"
                          >
                            تسجيل سداد
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-700">
                <span>المتبقي من السلف:</span>
                <span className="text-purple-700 font-black">{formatMoney(totalEmployeeLoans, settings.currencySymbol)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEIVABLES (ما لنا - ديون العملاء) */}
      {activeTab === 'receivables' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-emerald-950">قائمة مستحقات وديون العملاء (ما لنا)</h3>
            </div>
            <div className="text-xs font-black text-emerald-800">
              المجموع: {formatMoney(totalCustomerDebts, settings.currencySymbol)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-3.5">العميل</th>
                  <th className="p-3.5">الهاتف</th>
                  <th className="p-3.5">الرصيد المستحق (الدين)</th>
                  <th className="p-3.5">الحد الائتماني</th>
                  <th className="p-3.5">الملاحظات</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDebtors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">
                      لا توجد بيانات مطابقة للبحث أو التصفية
                    </td>
                  </tr>
                ) : (
                  filteredDebtors.map(cust => (
                    <tr key={cust.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-gray-900">
                        {cust.name}
                        {cust.balance > (cust.creditLimit || 999999) && (
                          <span className="mr-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                            تجاوز الحد
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-medium text-gray-600" dir="ltr">
                        {cust.phone}
                      </td>
                      <td className="p-3.5">
                        <span className={`font-black text-sm ${cust.balance > 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {formatMoney(cust.balance, settings.currencySymbol)}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 font-medium">
                        {cust.creditLimit ? formatMoney(cust.creditLimit, settings.currencySymbol) : 'غير محدد'}
                      </td>
                      <td className="p-3.5 text-gray-500 truncate max-w-xs">
                        {cust.notes || '-'}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {cust.balance > 0 && (
                            <>
                              <button
                                onClick={() => handleOpenCustomerPay(cust)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 active:scale-95 shadow-2xs"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>تحصيل</span>
                              </button>
                              <button
                                onClick={() => sendCustomerDebtWhatsApp(cust)}
                                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg active:scale-95 transition-all"
                                title="إرسال تذكير عبر واتساب"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYABLES (ما علينا - ديون الموردين) */}
      {activeTab === 'payables' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-black text-rose-950">قائمة التزامات وديون الموردين (ما علينا)</h3>
            </div>
            <div className="text-xs font-black text-rose-800">
              المجموع: {formatMoney(totalSupplierDebts, settings.currencySymbol)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-3.5">المورد</th>
                  <th className="p-3.5">الهاتف</th>
                  <th className="p-3.5">المبلغ المستحق له (ما علينا)</th>
                  <th className="p-3.5">العنوان / المستودع</th>
                  <th className="p-3.5">الملاحظات</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">
                      لا توجد بيانات مطابقة للبحث أو التصفية
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(supp => (
                    <tr key={supp.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-gray-900">
                        {supp.name}
                      </td>
                      <td className="p-3.5 font-medium text-gray-600" dir="ltr">
                        {supp.phone}
                      </td>
                      <td className="p-3.5">
                        <span className={`font-black text-sm ${supp.balance < 0 ? 'text-rose-600' : 'text-gray-700'}`}>
                          {formatMoney(Math.abs(supp.balance), settings.currencySymbol)}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 font-medium">
                        {supp.address || '-'}
                      </td>
                      <td className="p-3.5 text-gray-500 truncate max-w-xs">
                        {supp.notes || '-'}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {supp.balance < 0 && (
                            <button
                              onClick={() => handleOpenCustomerPay(supp)}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 active:scale-95 shadow-2xs"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>سداد دفعة</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EMPLOYEE LOANS & ADVANCES (سلف الموظفين) */}
      {activeTab === 'employee_loans' && (
        <div className="space-y-4">
          {/* Collection Status Banner for Loans */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            availableCollectionsForLoans > 0
              ? 'bg-gradient-to-r from-cyan-50 to-teal-50 border-cyan-200 text-cyan-950'
              : 'bg-gradient-to-r from-amber-50 to-rose-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                availableCollectionsForLoans > 0 ? 'bg-cyan-600' : 'bg-amber-600'
              }`}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black">
                    رصيد التحصيلات المتاح لصرف السلف: <span className="text-base text-cyan-800">{formatMoney(availableCollectionsForLoans, settings.currencySymbol)}</span>
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    availableCollectionsForLoans > 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}>
                    {availableCollectionsForLoans > 0 ? 'جاهز للصرف' : 'لا يوجد رصيد تحصيل'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                  السلف تصرف حصراً من المبالغ المحصلة (إجمالي المحصل: {formatMoney(totalCollections, settings.currencySymbol)} - المنصرف النشط: {formatMoney(totalEmployeeLoans, settings.currencySymbol)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {availableCollectionsForLoans <= 0 && (
                <button
                  onClick={() => setActiveTab('receivables')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  تحصيل ديون عملاء الآن
                </button>
              )}
              <button
                onClick={handleOpenAddLoan}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>صرف سلفة جديدة</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-purple-50/60 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-black text-purple-950">سجل سلف وعهد الموظفين</h3>
                  <p className="text-[11px] text-purple-800 font-medium">
                    المتبقي الحالي: <strong>{formatMoney(totalEmployeeLoans, settings.currencySymbol)}</strong> (من إجمالي منصرف {formatMoney(totalDisbursedLoans, settings.currencySymbol)})
                  </p>
                </div>
              </div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-3.5">الموظف</th>
                  <th className="p-3.5">نوع العملية</th>
                  <th className="p-3.5">تاريخ الصرف</th>
                  <th className="p-3.5">المبلغ الأصلي</th>
                  <th className="p-3.5">المسدد</th>
                  <th className="p-3.5">المتبقي (ما لنا)</th>
                  <th className="p-3.5">الاستحقاق</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400 font-medium">
                      لا توجد سلفيات مسجلة مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map(loan => {
                    const isSettled = loan.remainingAmount <= 0 || loan.status === 'settled';
                    return (
                      <tr key={loan.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-gray-900">
                          {loan.employeeName}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            loan.type === 'advance' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {loan.type === 'advance' ? 'عهدة عمل' : 'سلفة راتب'}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-600 font-medium">
                          {loan.date}
                        </td>
                        <td className="p-3.5 font-bold text-gray-900">
                          {formatMoney(loan.amount, settings.currencySymbol)}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-700">
                          {formatMoney(loan.paidAmount || 0, settings.currencySymbol)}
                        </td>
                        <td className="p-3.5">
                          <span className={`font-black text-sm ${isSettled ? 'text-gray-400 line-through' : 'text-purple-700'}`}>
                            {formatMoney(loan.remainingAmount, settings.currencySymbol)}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-500 font-medium">
                          {loan.dueDate || '-'}
                        </td>
                        <td className="p-3.5">
                          {isSettled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>مسددة بالكامل</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                              <Clock className="w-3 h-3" />
                              <span>نشطة (متبقي)</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isSettled && (
                              <button
                                onClick={() => handleOpenRepayLoan(loan)}
                                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 active:scale-95 shadow-2xs"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>سداد</span>
                              </button>
                            )}

                            <button
                              onClick={() => sendEmployeeLoanWhatsApp(loan)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg active:scale-95 transition-all"
                              title="مشاركة كشف السلفة"
                            >
                              <MessageCircle className="w-4 h-4 text-emerald-600" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف سجل سلفة ${loan.employeeName}؟`)) {
                                  deleteEmployeeLoan(loan.id);
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg active:scale-95 transition-all"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* TAB 5: PAYMENTS & COLLECTIONS LEDGER (سجل السدادات) */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-700" />
              <h3 className="text-sm font-black text-gray-900">سجل حركات السداد والتحصيل المسجلة</h3>
            </div>
            <span className="text-xs text-gray-500 font-bold">
              إجمالي الحركات: {payments.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-3.5">الطرف (عميل / مورد)</th>
                  <th className="p-3.5">نوع الحركة</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">المبلغ</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">البيان والملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">
                      لا توجد حركات سداد مسجلة
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-gray-900">
                        {pay.customerName}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          pay.type === 'collection'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {pay.type === 'collection' ? 'تحصيل من عميل (وارد)' : 'سداد لمورد (صادر)'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-600 font-medium">
                        {pay.date}
                      </td>
                      <td className="p-3.5 font-black text-sm">
                        <span className={pay.type === 'collection' ? 'text-emerald-700' : 'text-rose-700'}>
                          {formatMoney(pay.amount, settings.currencySymbol)}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-600 font-medium">
                        {pay.paymentMethod === 'cash' ? 'نقداً (كاش)' : pay.paymentMethod === 'card' ? 'شبكة / بطاقة' : 'تحويل بنكي'}
                      </td>
                      <td className="p-3.5 text-gray-500">
                        {pay.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD EMPLOYEE LOAN ================= */}
      {isNewLoanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">صرف سلفة / عهدة لموظف</h3>
                  <p className="text-[11px] text-gray-500">تُصرف حصراً ومباشرة من مبالغ التحصيلات</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewLoanOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Collections Balance Status Box */}
            <div className={`mt-4 p-3.5 rounded-2xl border ${
              availableCollectionsForLoans > 0
                ? 'bg-cyan-50/80 border-cyan-200 text-cyan-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-start gap-2.5">
                <div className={`p-1.5 rounded-lg text-white mt-0.5 ${
                  availableCollectionsForLoans > 0 ? 'bg-cyan-600' : 'bg-rose-600'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">رصيد التحصيلات المتاح للصرف:</span>
                    <span className={`text-sm font-black ${availableCollectionsForLoans > 0 ? 'text-cyan-800' : 'text-rose-700'}`}>
                      {formatMoney(availableCollectionsForLoans, settings.currencySymbol)}
                    </span>
                  </div>
                  {availableCollectionsForLoans <= 0 ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-[11px] text-rose-700 font-semibold leading-relaxed">
                        ⛔ لا يمكن صرف سلفة حالياً: لا يوجد رصيد تحصيلات متاح. السلفيات تخرج فقط من المبالغ المحصلة من العملاء.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewLoanOpen(false);
                          setActiveTab('receivables');
                        }}
                        className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>تحصيل مبالغ من ديون العملاء أولاً</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-cyan-800 font-medium mt-1">
                      ✓ السلفة ستُخصم من رصيد التحصيل المتاح (الحد الأقصى المسموح به: {formatMoney(availableCollectionsForLoans, settings.currencySymbol)}).
                    </p>
                  )}
                </div>
              </div>
            </div>

            {loanError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loanError}</span>
              </div>
            )}

            <form onSubmit={handleSaveLoan} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">اسم الموظف / المستلف *</label>
                {sellerTargets.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={loanEmployeeName}
                      onChange={e => setLoanEmployeeName(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-purple-600"
                    >
                      {sellerTargets.map(s => (
                        <option key={s.id} value={s.sellerName}>
                          👤 {s.sellerName} ({s.role || 'موظف'})
                        </option>
                      ))}
                      <option value="custom">✍️ إدخال اسم موظف آخر يدوي...</option>
                    </select>
                    {loanEmployeeName === 'custom' && (
                      <input
                        type="text"
                        placeholder="اكتب اسم الموظف..."
                        onChange={e => setLoanEmployeeName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-purple-600"
                        autoFocus
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={loanEmployeeName}
                    onChange={e => setLoanEmployeeName(e.target.value)}
                    placeholder="مثال: خالد علي"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-purple-600"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">قيمة السلفة ({settings.currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={availableCollectionsForLoans > 0 ? availableCollectionsForLoans : undefined}
                    disabled={availableCollectionsForLoans <= 0}
                    required
                    value={loanAmount}
                    onChange={e => {
                      setLoanAmount(e.target.value);
                      setLoanError(null);
                    }}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-purple-700 focus:bg-white focus:border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">نوع العملية</label>
                  <select
                    value={loanType}
                    onChange={e => setLoanType(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-purple-600"
                  >
                    <option value="loan">سلفة على الراتب</option>
                    <option value="advance">عهدة عمل مؤقتة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">تاريخ الصرف</label>
                  <input
                    type="date"
                    value={loanDate}
                    onChange={e => setLoanDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">موعد السداد المتوقع</label>
                  <input
                    type="date"
                    value={loanDueDate}
                    onChange={e => setLoanDueDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">ملاحظات / سبب السلفة</label>
                <textarea
                  rows={2}
                  value={loanNotes}
                  onChange={e => setLoanNotes(e.target.value)}
                  placeholder="مثال: سلفة طارئة تخصم مع راتب الشهر القادم..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewLoanOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={availableCollectionsForLoans <= 0}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  حفظ وصرف السلفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPAY EMPLOYEE LOAN ================= */}
      {isRepayLoanOpen && selectedLoanForRepay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  تسجيل سداد سلفة: {selectedLoanForRepay.employeeName}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  المتبقي الحالي: <strong className="text-purple-700">{formatMoney(selectedLoanForRepay.remainingAmount, settings.currencySymbol)}</strong>
                </p>
              </div>
              <button 
                onClick={() => setIsRepayLoanOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRepayLoan} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">المبلغ المسدد ({settings.currencySymbol}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={selectedLoanForRepay.remainingAmount}
                  required
                  value={repayAmount}
                  onChange={e => setRepayAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-purple-700 focus:bg-white focus:border-purple-600 text-base"
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setRepayAmount(selectedLoanForRepay.remainingAmount.toString())}
                    className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold hover:bg-purple-200"
                  >
                    سداد كامل المتبقي ({selectedLoanForRepay.remainingAmount})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">طريقة السداد</label>
                <select
                  value={repayMethod}
                  onChange={e => setRepayMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-purple-600"
                >
                  <option value="cash">نقداً في الدرج</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="card">خصم من الراتب / شبكة</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">ملاحظات السداد</label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={e => setRepayNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRepayLoanOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-xl shadow-sm"
                >
                  تأكيد سداد السلفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CUSTOMER / SUPPLIER PAYMENT ================= */}
      {isCustomerPayOpen && selectedCustomerForPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  {selectedCustomerForPay.type === 'supplier' ? 'سداد دفعة للمورد' : 'تحصيل دفعة من العميل'}: {selectedCustomerForPay.name}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  الرصيد الحالي: <strong className={selectedCustomerForPay.type === 'supplier' ? 'text-rose-600' : 'text-emerald-600'}>
                    {formatMoney(Math.abs(selectedCustomerForPay.balance), settings.currencySymbol)}
                  </strong>
                </p>
              </div>
              <button 
                onClick={() => setIsCustomerPayOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerPay} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">المبلغ ({settings.currencySymbol}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={custPayAmount}
                  onChange={e => setCustPayAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-900 focus:bg-white focus:border-blue-600 text-base"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">طريقة الدفع</label>
                <select
                  value={custPayMethod}
                  onChange={e => setCustPayMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-blue-600"
                >
                  <option value="cash">نقداً (كاش للدرج)</option>
                  <option value="card">شبكة / بطاقة مدى</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">البيان والملاحظات</label>
                <input
                  type="text"
                  value={custPayNotes}
                  onChange={e => setCustPayNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerPayOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 active:scale-95 text-white font-bold rounded-xl shadow-sm ${
                    selectedCustomerForPay.type === 'supplier'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {selectedCustomerForPay.type === 'supplier' ? 'تأكيد سداد المورد' : 'تأكيد التحصيل وإصدار السند'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
