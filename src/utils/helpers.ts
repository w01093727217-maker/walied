import { Customer, Expense, Invoice, PaymentRecord, Product, StoreSettings } from '../types';

export function formatMoney(amount: number, symbol: string = 'ر.س'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `0.00 ${symbol}`;
  return `${amount.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${symbol}`;
}

export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return num.toLocaleString('ar-EG');
}

export function playHapticFeedback() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(25);
    } catch {
      // Ignore if not supported
    }
  }
}

export function playSuccessSound() {
  playHapticFeedback();
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch {
    // Silent fail if AudioContext is blocked
  }
}

export function generateInvoiceNumber(prefix: string = 'INV-', count: number = 1000): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}${dateStr}-${randomSuffix}`;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Generate simple SVG QR Code for invoices and receipts
export function generateInvoiceQrData(invoice: Invoice, settings: StoreSettings): string {
  // In Saudi Arabia / Egypt standard e-invoice representation or generic info
  return `المتجر: ${settings.storeName}\nالرقم الضريبي: ${settings.taxNumber || 'غير مسجل'}\nرقم الفاتورة: ${invoice.invoiceNumber}\nالتاريخ: ${invoice.date} ${invoice.time}\nالإجمالي: ${invoice.grandTotal} ${settings.currencySymbol}\nالضريبة: ${invoice.taxTotal} ${settings.currencySymbol}`;
}

export function createWhatsAppInvoiceLink(invoice: Invoice, settings: StoreSettings, phone?: string): string {
  const targetPhone = phone || invoice.customerPhone || '';
  const cleanPhone = targetPhone.replace(/[^\d]/g, '');
  
  let text = `🧾 *فاتورة مبيعات - ${settings.storeName}*\n`;
  text += `رقم الفاتورة: *${invoice.invoiceNumber}*\n`;
  text += `التاريخ: ${invoice.date} ${invoice.time}\n`;
  text += `العميل: ${invoice.customerName}\n`;
  text += `------------------------\n`;
  
  invoice.items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.productName} × ${item.quantity} ${item.unit} = ${item.total} ${settings.currencySymbol}\n`;
  });
  
  text += `------------------------\n`;
  text += `المجموع الفرعي: ${invoice.subtotal} ${settings.currencySymbol}\n`;
  if (invoice.discountTotal > 0) {
    text += `الخصم: -${invoice.discountTotal} ${settings.currencySymbol}\n`;
  }
  if (invoice.taxTotal > 0) {
    text += `ضريبة القيمة المضافة (${invoice.taxRate}%): ${invoice.taxTotal} ${settings.currencySymbol}\n`;
  }
  text += `*الإجمالي النهائي:* *${invoice.grandTotal} ${settings.currencySymbol}*\n`;
  text += `المدفوع: ${invoice.paidAmount} ${settings.currencySymbol}\n`;
  if (invoice.remainingDebt > 0) {
    text += `*المتبقي (آجل):* *${invoice.remainingDebt} ${settings.currencySymbol}*\n`;
  }
  text += `\n${settings.receiptFooter || 'شكراً لتعاملكم معنا!'}\n`;
  text += `هاتف: ${settings.phone}`;

  const encoded = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone.startsWith('0') ? '966' + cleanPhone.slice(1) : cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function createWhatsAppDebtReminderLink(customer: Customer, settings: StoreSettings): string {
  const cleanPhone = customer.phone.replace(/[^\d]/g, '');
  
  let text = `مرحباً أستاذ *${customer.name}* 👋\n`;
  text += `نود تذكيركم بوجود رصيد متبقي لحسابكم لدى *${settings.storeName}* بقيمة: *${customer.balance} ${settings.currencySymbol}*.\n`;
  text += `يسعدنا تواصلكم لتأكيد موعد السداد، شاكرين ومقدرين حسن تعاملكم معنا 🌹\n`;
  text += `للاستفسار: ${settings.phone}`;

  const encoded = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone.startsWith('0') ? '966' + cleanPhone.slice(1) : cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function exportDataAsJson(data: {
  settings: StoreSettings;
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  expenses: Expense[];
  payments?: PaymentRecord[];
}) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `فاتورة-كاش-نسخة-احتياطية-${getTodayDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportInvoicesAsCsv(invoices: Invoice[], currencySymbol: string) {
  const headers = ['رقم الفاتورة', 'التاريخ', 'الوقت', 'العميل', 'الهاتف', 'الإجمالي', 'المدفوع', 'المتبقي', 'طريقة الدفع', 'الحالة'];
  const rows = invoices.map(inv => [
    inv.invoiceNumber,
    inv.date,
    inv.time,
    `"${inv.customerName.replace(/"/g, '""')}"`,
    inv.customerPhone || '',
    inv.grandTotal,
    inv.paidAmount,
    inv.remainingDebt,
    inv.paymentMethod,
    inv.status,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `سجل-الفواتير-${getTodayDateString()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
