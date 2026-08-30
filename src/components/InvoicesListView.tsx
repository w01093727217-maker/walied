import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Printer, 
  MessageCircle, 
  RotateCcw, 
  Trash2, 
  Download, 
  ChevronRight, 
  Clock, 
  Calendar,
  X,
  CreditCard,
  Banknote,
  PlusCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Invoice, InvoiceStatus } from '../types';
import { createWhatsAppInvoiceLink, exportInvoicesAsCsv, formatMoney, getTodayDateString } from '../utils/helpers';

export const InvoicesListView: React.FC = () => {
  const {
    invoices,
    settings,
    setSelectedInvoiceForPrint,
    setShowPrintModal,
    returnInvoice,
    deleteInvoice,
    setActiveTab,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  const todayStr = getTodayDateString();

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Search
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customerPhone && inv.customerPhone.includes(searchTerm));

      // Status
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;

      // Date
      let matchDate = true;
      if (dateFilter === 'today') {
        matchDate = inv.date === todayStr;
      } else if (dateFilter === 'month') {
        const currentMonth = todayStr.slice(0, 7);
        matchDate = inv.date.startsWith(currentMonth);
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [invoices, searchTerm, statusFilter, dateFilter, todayStr]);

  const totalFilteredSales = useMemo(() => {
    return filteredInvoices
      .filter(i => i.status !== 'returned')
      .reduce((sum, i) => sum + i.grandTotal, 0);
  }, [filteredInvoices]);

  const totalFilteredDebts = useMemo(() => {
    return filteredInvoices
      .filter(i => i.status !== 'returned')
      .reduce((sum, i) => sum + i.remainingDebt, 0);
  }, [filteredInvoices]);

  const handleReturn = (inv: Invoice) => {
    if (window.confirm(`هل أنت متأكد من تسجيل مرتجع للفاتورة رقم ${inv.invoiceNumber}؟ سيتم استرجاع البضاعة للمخزون وتسوية الحساب.`)) {
      returnInvoice(inv.id);
    }
  };

  const handleDelete = (inv: Invoice) => {
    if (window.confirm(`هل أنت متأكد من حذف الفاتورة ${inv.invoiceNumber} نهائياً؟`)) {
      deleteInvoice(inv.id);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>سجل الفواتير والمعاملات</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            إجمالي المعاملات المسجلة: {filteredInvoices.length} فاتورة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInvoicesAsCsv(filteredInvoices, settings.currencySymbol)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 active:scale-95 transition-all"
            title="تصدير كملف Excel CSV"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>تصدير CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-200 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>فاتورة جديدة</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">إجمالي المبيعات المفلترة</span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 mt-1 block">
              {formatMoney(totalFilteredSales, settings.currencySymbol)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">إجمالي المتبقي (الديون)</span>
            <span className="text-lg sm:text-xl font-black text-amber-600 mt-1 block">
              {formatMoney(totalFilteredDebts, settings.currencySymbol)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الفاتورة، اسم العميل، أو رقم الهاتف..."
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

        {/* Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-gray-400 font-semibold ml-1 shrink-0">الحالة:</span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'paid', label: 'مدفوعة' },
              { id: 'partial', label: 'جزئي' },
              { id: 'unpaid', label: 'آجل' },
              { id: 'returned', label: 'مرتجع' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-gray-400 font-semibold ml-1 shrink-0">الفترة:</span>
            {[
              { id: 'all', label: 'كل الفترات' },
              { id: 'today', label: 'اليوم' },
              { id: 'month', label: 'هذا الشهر' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  dateFilter === tab.id
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">لا توجد فواتير مطابقة للبحث أو الفلتر المختار.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map(inv => (
            <div
              key={inv.id}
              className={`p-4 bg-white border rounded-2xl shadow-xs transition-all ${
                inv.status === 'returned'
                  ? 'border-gray-200 opacity-75'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Card Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-gray-900">{inv.customerName}</span>
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-semibold">
                      {inv.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {inv.date} {inv.time}
                    </span>
                    <span>• {inv.items.length} أصناف</span>
                    {inv.paymentMethod && (
                      <span className="text-gray-500">
                        • {inv.paymentMethod === 'cash' ? 'نقدي (كاش)' :
                           inv.paymentMethod === 'card' ? 'بطاقة بنكية' :
                           inv.paymentMethod === 'credit' ? 'آجل' : 'تحويل'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left flex sm:flex-col items-center sm:items-end justify-between">
                  <div className="text-base font-black text-gray-900">
                    {formatMoney(inv.grandTotal, settings.currencySymbol)}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                    inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                    inv.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                    inv.status === 'returned' ? 'bg-gray-100 text-gray-700' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {inv.status === 'paid' ? 'مدفوعة بالكامل' :
                     inv.status === 'partial' ? `متبقي ${formatMoney(inv.remainingDebt, settings.currencySymbol)}` :
                     inv.status === 'returned' ? 'فاتورة مرتجعة' : 'غير مدفوعة (آجل)'}
                  </span>
                </div>
              </div>

              {/* Items preview snippet */}
              <div className="py-2.5 text-xs text-gray-600 space-y-1">
                {inv.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 px-2.5 py-1.5 rounded-lg">
                    <span className="truncate max-w-[280px] font-medium text-gray-800">
                      {item.productName} × {item.quantity} {item.unit}
                    </span>
                    <span className="font-mono font-bold text-gray-700">
                      {formatMoney(item.total, settings.currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedInvoiceForPrint(inv);
                      setShowPrintModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-100 active:scale-95 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    <span>طباعة / معاينة</span>
                  </button>

                  <a
                    href={createWhatsAppInvoiceLink(inv, settings)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>واتساب</span>
                  </a>
                </div>

                <div className="flex items-center gap-1">
                  {inv.status !== 'returned' && (
                    <button
                      onClick={() => handleReturn(inv)}
                      title="تسجيل مرتجع"
                      className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(inv)}
                    title="حذف الفاتورة"
                    className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
