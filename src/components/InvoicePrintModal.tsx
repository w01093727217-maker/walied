import React, { useState } from 'react';
import { X, Printer, Share2, MessageCircle, FileText, CheckCircle2, Copy, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createWhatsAppInvoiceLink, formatMoney } from '../utils/helpers';
import { Invoice } from '../types';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, isOpen, onClose }) => {
  const { settings } = useApp();
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const link = createWhatsAppInvoiceLink(invoice, settings);
    window.open(link, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `فاتورة ${invoice.invoiceNumber}`,
          text: `فاتورة رقم ${invoice.invoiceNumber} بقيمة ${invoice.grandTotal} ${settings.currencySymbol} من ${settings.storeName}`,
          url: window.location.href,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleWhatsApp();
    }
  };

  const handleCopyText = () => {
    const text = `فاتورة رقم: ${invoice.invoiceNumber}\nالمتجر: ${settings.storeName}\nالعميل: ${invoice.customerName}\nالإجمالي: ${invoice.grandTotal} ${settings.currencySymbol}\nالمدفوع: ${invoice.paidAmount} ${settings.currencySymbol}\nالمتبقي: ${invoice.remainingDebt} ${settings.currencySymbol}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">معاينة وطباعة الفاتورة</h3>
              <p className="text-xs text-gray-500 font-mono">{invoice.invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle: Thermal vs A4 */}
            <div className="bg-gray-100 p-0.5 rounded-xl flex text-xs font-semibold text-gray-700">
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  printFormat === 'thermal' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'hover:text-gray-900'
                }`}
              >
                حراري (80mm)
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  printFormat === 'a4' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'hover:text-gray-900'
                }`}
              >
                ضريبي A4
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable View Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex justify-center items-start">
          {printFormat === 'thermal' ? (
            /* =================== THERMAL RECEIPT 80mm =================== */
            <div className="print-container w-full max-w-[340px] bg-white text-gray-900 p-4 rounded-xl shadow-xs font-mono text-xs select-text border border-gray-200">
              {/* Store Header */}
              <div className="text-center pb-3 border-b border-dashed border-gray-300">
                <h2 className="text-base font-extrabold text-gray-950">{settings.storeName}</h2>
                <p className="text-[11px] text-gray-600 font-medium">{settings.activityType}</p>
                {settings.taxNumber && (
                  <p className="text-[10px] text-gray-500 mt-0.5">الرقم الضريبي: {settings.taxNumber}</p>
                )}
                {settings.commercialRegister && (
                  <p className="text-[10px] text-gray-500">س.ت: {settings.commercialRegister}</p>
                )}
                <p className="text-[10px] text-gray-500">{settings.address} - هاتف: {settings.phone}</p>
              </div>

              {/* Receipt Metadata */}
              <div className="py-2 border-b border-dashed border-gray-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">رقم الفاتورة:</span>
                  <span className="font-bold text-gray-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">التاريخ والوقت:</span>
                  <span>{invoice.date} {invoice.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">العميل:</span>
                  <span className="font-bold">{invoice.customerName}</span>
                </div>
                {invoice.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">الهاتف:</span>
                    <span>{invoice.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">طريقة الدفع:</span>
                  <span className="font-bold">
                    {invoice.paymentMethod === 'cash' ? 'نقدي (كاش)' :
                     invoice.paymentMethod === 'card' ? 'شبكة / مدى' :
                     invoice.paymentMethod === 'credit' ? 'آجل (على الحساب)' : 'تحويل بنكي'}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-2 border-b border-dashed border-gray-300">
                <table className="w-full text-right text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600">
                      <th className="pb-1 font-bold">الصنف</th>
                      <th className="pb-1 text-center font-bold">الكمية</th>
                      <th className="pb-1 text-left font-bold">المجموع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1.5 font-medium leading-tight">
                          <div>{item.productName}</div>
                          <div className="text-[10px] text-gray-500">
                            {item.unitPrice} × {item.quantity} {item.unit}
                            {item.discount > 0 && <span className="text-red-500 mr-1"> (خصم: {item.discount})</span>}
                          </div>
                        </td>
                        <td className="py-1.5 text-center font-bold text-gray-800">{item.quantity}</td>
                        <td className="py-1.5 text-left font-bold text-gray-900">{formatMoney(item.total, settings.currencySymbol)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي:</span>
                  <span>{formatMoney(invoice.subtotal, settings.currencySymbol)}</span>
                </div>
                {invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>إجمالي الخصم:</span>
                    <span>-{formatMoney(invoice.discountTotal, settings.currencySymbol)}</span>
                  </div>
                )}
                {invoice.taxTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>ضريبة القيمة المضافة ({invoice.taxRate}%):</span>
                    <span>{formatMoney(invoice.taxTotal, settings.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-gray-950 pt-1 border-t border-gray-200">
                  <span>الإجمالي النهائي:</span>
                  <span>{formatMoney(invoice.grandTotal, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-0.5">
                  <span>المدفوع:</span>
                  <span>{formatMoney(invoice.paidAmount, settings.currencySymbol)}</span>
                </div>
                {invoice.remainingDebt > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                    <span>المتبقي (آجل):</span>
                    <span>{formatMoney(invoice.remainingDebt, settings.currencySymbol)}</span>
                  </div>
                )}
              </div>

              {/* Simple QR Code & Barcode Placeholder */}
              <div className="pt-3 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="w-24 h-24 border border-gray-300 p-1 bg-white flex flex-col items-center justify-center rounded-lg">
                    {/* Visual QR representation */}
                    <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-gray-100 rounded">
                      <div className="bg-gray-900 col-span-2 row-span-2"></div>
                      <div className="bg-gray-900 col-span-1"></div>
                      <div className="bg-gray-900 col-span-1"></div>
                      <div className="bg-gray-900 col-span-2 row-span-2"></div>
                      <div className="bg-gray-900 col-span-2"></div>
                      <div className="bg-gray-900 col-span-2"></div>
                      <div className="bg-gray-900 col-span-2 row-span-2"></div>
                      <div className="bg-gray-900 col-span-1"></div>
                      <div className="bg-gray-900 col-span-3"></div>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 font-bold">فاتورة إلكترونية مبسطة (ZATCA Compliant)</p>
                <p className="text-[10px] text-gray-700 font-sans leading-tight mt-1">
                  {settings.receiptFooter || 'شكراً لتعاملكم معنا ونسعد بزيارتكم دائماً!'}
                </p>
              </div>
            </div>
          ) : (
            /* =================== A4 TAX INVOICE FORMAT =================== */
            <div className="print-container w-full bg-white text-gray-900 p-6 rounded-2xl shadow-xs text-xs font-sans select-text border border-gray-200">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
                <div>
                  <h1 className="text-xl font-black text-gray-950">{settings.storeName}</h1>
                  <p className="text-xs text-gray-600 font-medium">{settings.activityType}</p>
                  <p className="text-xs text-gray-600">{settings.address}</p>
                  <p className="text-xs text-gray-600">هاتف: {settings.phone}</p>
                </div>
                <div className="text-left">
                  <div className="inline-block bg-blue-600 text-white font-bold text-xs px-3 py-1 rounded-lg shadow-xs">
                    فاتورة ضريبية
                  </div>
                  <div className="mt-2 text-xs space-y-0.5">
                    <p><strong className="text-gray-900">رقم الفاتورة:</strong> <span className="font-mono font-bold text-blue-600">{invoice.invoiceNumber}</span></p>
                    <p><strong className="text-gray-900">التاريخ:</strong> {invoice.date} {invoice.time}</p>
                    {settings.taxNumber && (
                      <p><strong className="text-gray-900">الرقم الضريبي للمنشأة:</strong> {settings.taxNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Info Box */}
              <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div>
                  <span className="text-[11px] text-gray-500 font-bold block">بيانات العميل:</span>
                  <p className="font-bold text-gray-900 text-sm">{invoice.customerName}</p>
                  {invoice.customerPhone && <p className="text-gray-600 text-xs">الهاتف: {invoice.customerPhone}</p>}
                  {invoice.customerAddress && <p className="text-gray-600 text-xs">العنوان: {invoice.customerAddress}</p>}
                </div>
                <div className="text-left">
                  <span className="text-[11px] text-gray-500 font-bold block">حالة الدفع:</span>
                  <span className={`inline-block font-bold px-2.5 py-0.5 rounded-md text-xs mt-1 ${
                    invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    invoice.status === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {invoice.status === 'paid' ? 'مدفوعة بالكامل' :
                     invoice.status === 'partial' ? 'مدفوعة جزئياً' :
                     invoice.status === 'returned' ? 'مرتجع' : 'غير مدفوعة (آجل)'}
                  </span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-right border-collapse border border-gray-300 my-4 text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 font-bold">
                    <th className="border border-gray-300 p-2 text-center w-8">#</th>
                    <th className="border border-gray-300 p-2">اسم الصنف والبيان</th>
                    <th className="border border-gray-300 p-2 text-center">الكمية</th>
                    <th className="border border-gray-300 p-2 text-center">سعر الوحدة</th>
                    <th className="border border-gray-300 p-2 text-center">الخصم</th>
                    <th className="border border-gray-300 p-2 text-left">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="even:bg-gray-50">
                      <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                      <td className="border border-gray-300 p-2 font-medium text-gray-900">{item.productName}</td>
                      <td className="border border-gray-300 p-2 text-center font-bold text-gray-800">{item.quantity} {item.unit}</td>
                      <td className="border border-gray-300 p-2 text-center text-gray-700">{formatMoney(item.unitPrice, settings.currencySymbol)}</td>
                      <td className="border border-gray-300 p-2 text-center text-red-600">{item.discount > 0 ? formatMoney(item.discount, settings.currencySymbol) : '-'}</td>
                      <td className="border border-gray-300 p-2 text-left font-bold text-gray-900">{formatMoney(item.total, settings.currencySymbol)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 border border-gray-300 rounded-xl p-3.5 bg-gray-50 text-xs">
                  <div className="flex justify-between text-gray-700">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold">{formatMoney(invoice.subtotal, settings.currencySymbol)}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>الخصم:</span>
                      <span className="font-bold">-{formatMoney(invoice.discountTotal, settings.currencySymbol)}</span>
                    </div>
                  )}
                  {invoice.taxTotal > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>ضريبة القيمة المضافة ({invoice.taxRate}%):</span>
                      <span className="font-bold">{formatMoney(invoice.taxTotal, settings.currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-gray-900 border-t border-gray-300 pt-1.5">
                    <span>الإجمالي الكلي:</span>
                    <span className="text-blue-600">{formatMoney(invoice.grandTotal, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>المدفوع:</span>
                    <span>{formatMoney(invoice.paidAmount, settings.currencySymbol)}</span>
                  </div>
                  {invoice.remainingDebt > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold border-t border-amber-200 pt-1 bg-amber-50/60 p-1 rounded">
                      <span>المتبقي (آجل):</span>
                      <span>{formatMoney(invoice.remainingDebt, settings.currencySymbol)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-6 pt-3 border-t border-gray-200 text-center text-gray-500 text-[11px]">
                {settings.receiptFooter}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="p-3.5 bg-white border-t border-gray-100 flex items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال واتساب</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200 active:scale-95 transition-all"
              title="مشاركة"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyText}
              className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200 active:scale-95 transition-all"
              title="نسخ البيانات"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs font-bold transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-200 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة فورية</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
