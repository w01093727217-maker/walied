import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  MessageCircle, 
  Wallet, 
  Receipt, 
  FileText, 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  ArrowDownLeft, 
  ArrowUpRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ContactType, Customer } from '../types';
import { createWhatsAppDebtReminderLink, formatMoney } from '../utils/helpers';

export const CustomersView: React.FC = () => {
  const {
    customers,
    invoices,
    payments,
    settings,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerPayment,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'customers' | 'suppliers' | 'debtors'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add/Edit Customer Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
    type: ContactType;
    balance: number;
    creditLimit: number;
    notes: string;
  }>({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'customer',
    balance: 0,
    creditLimit: 1000,
    notes: '',
  });

  // Payment/Collection Modal
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Statement of Account (كشف حساب) Modal
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);

      if (!matchSearch) return false;

      if (activeFilter === 'customers') return c.type === 'customer';
      if (activeFilter === 'suppliers') return c.type === 'supplier';
      if (activeFilter === 'debtors') return c.type === 'customer' && c.balance > 0;

      return true;
    });
  }, [customers, searchTerm, activeFilter]);

  const totalCustomerDebts = useMemo(() => {
    return customers
      .filter(c => c.type === 'customer' && c.balance > 0)
      .reduce((sum, c) => sum + c.balance, 0);
  }, [customers]);

  const totalSupplierPayables = useMemo(() => {
    return customers
      .filter(c => c.type === 'supplier' && c.balance < 0)
      .reduce((sum, c) => sum + Math.abs(c.balance), 0);
  }, [customers]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      type: 'customer',
      balance: 0,
      creditLimit: 1000,
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      type: customer.type,
      balance: customer.balance,
      creditLimit: customer.creditLimit || 0,
      notes: customer.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        ...formData,
      });
    } else {
      addCustomer(formData);
    }
    setIsFormOpen(false);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (window.confirm(`هل أنت متأكد من حذف ${customer.name}؟`)) {
      deleteCustomer(customer.id);
    }
  };

  const handleOpenPayment = (customer: Customer) => {
    setPaymentCustomer(customer);
    setPaymentAmount(Math.abs(customer.balance) > 0 ? Math.abs(customer.balance) : '');
    setPaymentMethod('cash');
    setPaymentNotes('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer || !paymentAmount || Number(paymentAmount) <= 0) return;

    recordCustomerPayment(
      paymentCustomer.id,
      Number(paymentAmount),
      paymentMethod,
      paymentNotes || undefined
    );

    setPaymentCustomer(null);
  };

  // Get Statement History for a Customer
  const customerInvoices = useMemo(() => {
    if (!statementCustomer) return [];
    return invoices.filter(i => i.customerId === statementCustomer.id);
  }, [statementCustomer, invoices]);

  const customerPayments = useMemo(() => {
    if (!statementCustomer) return [];
    return payments.filter(p => p.customerId === statementCustomer.id);
  }, [statementCustomer, payments]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>دليل العملاء والموردين وكشوف الحساب</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            إدارة الأرصدة والذمم المالية، التحصيلات، وتذكير الديون
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-200 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ إضافة حساب جديد</span>
        </button>
      </div>

      {/* KPI Balances */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">إجمالي ديون العملاء (لنا)</span>
            <span className="text-lg sm:text-xl font-black text-amber-600 mt-1 block">
              {formatMoney(totalCustomerDebts, settings.currencySymbol)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">مستحقات الموردين (علينا)</span>
            <span className="text-lg sm:text-xl font-black text-rose-600 mt-1 block">
              {formatMoney(totalSupplierPayables, settings.currencySymbol)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو رقم الجوال..."
            className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'debtors', label: 'عليهم ديون فقط ⚠️' },
            { id: 'customers', label: 'العملاء' },
            { id: 'suppliers', label: 'الموردين' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">لا توجد حسابات مسجلة مطابقة للبحث.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map(cust => {
            const hasDebt = cust.balance > 0;
            const isSupplierCredit = cust.balance < 0;

            return (
              <div
                key={cust.id}
                className="p-4 bg-white border border-gray-200 hover:border-blue-300 rounded-2xl shadow-xs transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-gray-900">{cust.name}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        cust.type === 'customer'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {cust.type === 'customer' ? 'عميل' : 'مورد'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      {cust.phone && (
                        <a
                          href={`tel:${cust.phone}`}
                          className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-mono">{cust.phone}</span>
                        </a>
                      )}
                      {cust.address && <span className="truncate max-w-[200px] text-gray-500">• {cust.address}</span>}
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="text-left flex sm:flex-col items-center sm:items-end justify-between">
                    <span className="text-xs text-gray-400 font-medium">الرصيد الحسابي:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-base font-black ${
                        hasDebt ? 'text-amber-600' :
                        isSupplierCredit ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {formatMoney(Math.abs(cust.balance), settings.currencySymbol)}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {hasDebt ? '(مستحق عليه)' : isSupplierCredit ? '(مستحق له)' : '(خالص)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Record Payment Button */}
                    <button
                      onClick={() => handleOpenPayment(cust)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 active:scale-95 transition-all"
                    >
                      <Wallet className="w-3.5 h-3.5 text-blue-600" />
                      <span>{cust.type === 'customer' ? 'تحصيل دفعة' : 'سداد للمورد'}</span>
                    </button>

                    {/* WhatsApp Debt Reminder (if customer has debt) */}
                    {hasDebt && cust.phone && (
                      <a
                        href={createWhatsAppDebtReminderLink(cust, settings)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 active:scale-95 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تذكير واتساب</span>
                      </a>
                    )}

                    {/* Statement of Account button */}
                    <button
                      onClick={() => setStatementCustomer(cust)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 active:scale-95 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                      <span>كشف حساب</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cust)}
                      title="تعديل الحساب"
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteCustomer(cust)}
                      title="حذف"
                      className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingCustomer ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="text-gray-700 font-bold block mb-1">نوع الحساب:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'customer' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      formData.type === 'customer'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    عميل (زبون)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'supplier' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      formData.type === 'supplier'
                        ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    مورد بضاعة
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">الاسم الكامل *:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: شركة الأمل / أحمد محمد"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">رقم الجوال:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">حد الائتمان (سقف الدين):</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) || 0 })}
                    placeholder="1000"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">العنوان / المدينة:</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="الرياض - حي الملز"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات الحساب..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-colors"
                >
                  حفظ الحساب
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal (تحصيل دفعة / سداد) */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  {paymentCustomer.type === 'customer' ? 'تسجيل سند قبض / تحصيل دفعة' : 'تسجيل سند صرف / سداد مورد'}
                </h3>
                <p className="text-xs text-blue-600 font-bold mt-0.5">{paymentCustomer.name}</p>
              </div>
              <button onClick={() => setPaymentCustomer(null)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">الرصيد الحالي:</span>
                <span className="text-base font-black text-amber-600">
                  {formatMoney(Math.abs(paymentCustomer.balance), settings.currencySymbol)}
                </span>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">المبلغ المسدد *:</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-base font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">طريقة الدفع:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    نقدي (كاش)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    شبكة / مدى
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    تحويل بنكي
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">ملاحظات السند / رقم الحوالة:</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="مثال: سداد دفعة عن الفاتورة رقم..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 active:scale-95 transition-all"
                >
                  تأكيد وحفظ السند
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentCustomer(null)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement of Account (كشف حساب) Modal */}
      {statementCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-gray-900">كشف حساب تفصيلي</h3>
                <p className="text-xs text-blue-600 font-bold">{statementCustomer.name}</p>
              </div>
              <button onClick={() => setStatementCustomer(null)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-gray-500 block font-medium">الرصيد المتبقي:</span>
                <span className="text-lg font-black text-amber-600">
                  {formatMoney(statementCustomer.balance, settings.currencySymbol)}
                </span>
              </div>
              <div className="text-left text-gray-500 space-y-0.5 font-medium">
                <p>عدد الفواتير: {customerInvoices.length}</p>
                <p>عدد السدادات: {customerPayments.length}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              <h4 className="text-xs font-bold text-gray-700">سجل المعاملات والفواتير:</h4>
              {customerInvoices.length === 0 && customerPayments.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-xs font-semibold">لا توجد حركات مسجلة لهذا الحساب.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {customerInvoices.map(inv => (
                    <div key={inv.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900">فاتورة مبيعات</span>
                          <span className="font-mono text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">{inv.invoiceNumber}</span>
                        </div>
                        <span className="text-[11px] text-gray-400">{inv.date} {inv.time}</span>
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-gray-900 block">{formatMoney(inv.grandTotal, settings.currencySymbol)}</span>
                        <span className="text-[11px] text-amber-600 font-semibold">متبقي: {formatMoney(inv.remainingDebt, settings.currencySymbol)}</span>
                      </div>
                    </div>
                  ))}

                  {customerPayments.map(p => (
                    <div key={p.id} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1 text-emerald-700 font-bold">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>سند تحصيل / دفعة</span>
                        </div>
                        <span className="text-[11px] text-gray-500">{p.date} • {p.notes || ''}</span>
                      </div>
                      <span className="font-bold text-emerald-700">{formatMoney(p.amount, settings.currencySymbol)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setStatementCustomer(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
