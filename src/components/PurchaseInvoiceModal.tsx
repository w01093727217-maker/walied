import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Truck, 
  ShoppingBag, 
  UserPlus, 
  Check, 
  Calculator,
  Search,
  Building2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentMethod, Product } from '../types';
import { formatMoney, generateInvoiceNumber, getCurrentTimeString, getTodayDateString } from '../utils/helpers';

interface PurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string;
}

interface PurchaseItemRow {
  productId: string;
  productName: string;
  barcode?: string;
  unit: any;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  total: number;
}

export const PurchaseInvoiceModal: React.FC<PurchaseInvoiceModalProps> = ({
  isOpen,
  onClose,
  initialProductId,
}) => {
  const {
    products,
    customers,
    settings,
    addPurchaseInvoice,
    addCustomer,
    setSelectedInvoiceForPrint,
    setShowPrintModal,
  } = useApp();

  const suppliers = customers.filter(c => c.type === 'supplier');

  // Supplier info
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [customSupplierName, setCustomSupplierName] = useState<string>('');
  const [customSupplierPhone, setCustomSupplierPhone] = useState<string>('');
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');

  // Invoice metadata
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => generateInvoiceNumber('PUR-', 500));
  const [invoiceDate, setInvoiceDate] = useState<string>(() => getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');

  // Items in purchase invoice
  const [items, setItems] = useState<PurchaseItemRow[]>(() => {
    if (initialProductId) {
      const p = products.find(prod => prod.id === initialProductId);
      if (p) {
        return [{
          productId: p.id,
          productName: p.name,
          barcode: p.barcode,
          unit: p.unit,
          quantity: 10,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          total: 10 * p.costPrice,
        }];
      }
    }
    return [];
  });

  const [productSearch, setProductSearch] = useState('');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [inputQty, setInputQty] = useState<number>(10);
  const [inputCost, setInputCost] = useState<number>(0);
  const [inputSelling, setInputSelling] = useState<number>(0);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = settings.enableTax ? settings.taxRate : 0;
  const taxTotal = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxTotal;

  const actualPaid = paidAmount === '' ? (paymentMethod === 'credit' ? 0 : grandTotal) : Number(paidAmount);
  const remainingDebt = Math.max(0, grandTotal - actualPaid);

  const handleSelectProduct = (prodId: string) => {
    setSelectedProdId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setInputCost(prod.costPrice);
      setInputSelling(prod.sellingPrice);
    }
  };

  const handleAddItem = () => {
    if (!selectedProdId) return;
    const prod = products.find(p => p.id === selectedProdId);
    if (!prod || inputQty <= 0) return;

    const existingIndex = items.findIndex(i => i.productId === prod.id);
    if (existingIndex > -1) {
      setItems(prev => prev.map((item, idx) => {
        if (idx === existingIndex) {
          const newQty = item.quantity + inputQty;
          return {
            ...item,
            quantity: newQty,
            costPrice: inputCost > 0 ? inputCost : item.costPrice,
            sellingPrice: inputSelling > 0 ? inputSelling : item.sellingPrice,
            total: newQty * (inputCost > 0 ? inputCost : item.costPrice),
          };
        }
        return item;
      }));
    } else {
      const newItem: PurchaseItemRow = {
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        unit: prod.unit,
        quantity: inputQty,
        costPrice: inputCost,
        sellingPrice: inputSelling,
        total: inputQty * inputCost,
      };
      setItems(prev => [...prev, newItem]);
    }

    // Reset picker
    setSelectedProdId('');
    setProductSearch('');
    setInputQty(10);
    setInputCost(0);
    setInputSelling(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          quantity: newQty,
          total: newQty * item.costPrice,
        };
      }
      return item;
    }));
  };

  const handleQuickAddSupplier = () => {
    if (!newSupplierName.trim()) return;
    const newSupp = addCustomer({
      name: newSupplierName.trim(),
      phone: newSupplierPhone.trim(),
      type: 'supplier',
      balance: 0,
    });
    setSelectedSupplierId(newSupp.id);
    setCustomSupplierName(newSupp.name);
    setCustomSupplierPhone(newSupp.phone);
    setIsAddingSupplier(false);
    setNewSupplierName('');
    setNewSupplierPhone('');
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل لفاتورة الشراء والتوريد');
      return;
    }

    const supplierObj = suppliers.find(s => s.id === selectedSupplierId);
    const finalSupplierName = (supplierObj ? supplierObj.name : customSupplierName).trim();
    const finalSupplierPhone = supplierObj ? supplierObj.phone : customSupplierPhone;

    if (!finalSupplierName) {
      alert('⚠️ اسم المورد / جهة التوريد إجباري!\nيرجى كتابة أو اختيار اسم المورد قبل حفظ فاتورة الشراء.');
      return;
    }

    if (paidAmount === '' || isNaN(Number(paidAmount)) || Number(paidAmount) < 0) {
      alert('⚠️ يرجى تحديد المبلغ المدفوع للمورد بشكل صحيح (أو 0 في حالة الآجل).');
      return;
    }

    const actualPaid = Number(paidAmount);
    const remainingDebt = Math.max(0, grandTotal - actualPaid);

    const purchaseInvoice = addPurchaseInvoice({
      invoiceNumber: invoiceNumber || generateInvoiceNumber('PUR-', 500),
      supplierId: selectedSupplierId || undefined,
      supplierName: finalSupplierName,
      supplierPhone: finalSupplierPhone,
      supplierAddress: supplierObj?.address,
      date: invoiceDate,
      time: getCurrentTimeString(),
      items: items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        barcode: i.barcode,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: i.costPrice,
        costPrice: i.costPrice,
        sellingPrice: i.sellingPrice,
        discount: 0,
        total: i.total,
      })),
      subtotal,
      taxRate,
      taxTotal,
      grandTotal,
      paidAmount: actualPaid,
      remainingDebt,
      paymentMethod,
      notes,
    });

    onClose();

    if (window.confirm('تم حفظ وتوريد بضاعة الفاتورة بنجاح وزيادة كميات المخزن! هل ترغب في طباعة سند وفاتورة الشراء؟')) {
      setSelectedInvoiceForPrint(purchaseInvoice);
      setShowPrintModal(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                فاتورة شراء وتوريد بضاعة للمخزن
              </h2>
              <p className="text-xs text-gray-500">
                إضافة وتوريد كميات الأصناف رسمياً مع تحديث سعر التكلفة وحساب المورد
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitPurchase} className="space-y-4 text-xs sm:text-sm">
          {/* Supplier Section */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-gray-800 font-bold flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>بيانات المورد / جهة التوريد:</span>
              </label>
              {!isAddingSupplier && (
                <button
                  type="button"
                  onClick={() => setIsAddingSupplier(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ مورد جديد</span>
                </button>
              )}
            </div>

            {isAddingSupplier ? (
              <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-blue-700 block">إضافة مورد جديد للقائمة:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="اسم المورد أو الشركة..."
                    value={newSupplierName}
                    onChange={e => setNewSupplierName(e.target.value)}
                    className="p-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="رقم الهاتف أو الجوال..."
                    value={newSupplierPhone}
                    onChange={e => setNewSupplierPhone(e.target.value)}
                    className="p-2 bg-gray-50 border border-gray-300 rounded-lg text-xs text-left font-mono"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleQuickAddSupplier}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                  >
                    حفظ المورد
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingSupplier(false)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">المورد المسجل مسبقاً:</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => {
                      setSelectedSupplierId(e.target.value);
                      const s = suppliers.find(sup => sup.id === e.target.value);
                      if (s) {
                        setCustomSupplierName(s.name);
                        setCustomSupplierPhone(s.phone);
                      } else {
                        setCustomSupplierName('');
                        setCustomSupplierPhone('');
                      }
                    }}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- أو اختر من الموردين المسجلين --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.balance > 0 ? `(له مستحقات: ${formatMoney(s.balance, settings.currencySymbol)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">
                    اسم المورد بالفاتورة <span className="text-rose-600 font-black">* (إجباري)</span>:
                  </label>
                  <input
                    type="text"
                    value={customSupplierName}
                    onChange={e => {
                      setCustomSupplierName(e.target.value);
                      if (selectedSupplierId) setSelectedSupplierId('');
                    }}
                    placeholder="اكتب اسم المورد / الشركة..."
                    className={`w-full p-2 bg-white border rounded-xl text-xs font-bold text-gray-900 focus:outline-none ${
                      !customSupplierName.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300 focus:border-blue-600'
                    }`}
                  />
                  {!customSupplierName.trim() && (
                    <span className="text-[10px] text-rose-600 font-bold block mt-0.5">⚠️ اسم المورد إجباري</span>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">رقم الفاتورة والتاريخ:</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Add Item Row Picker */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-2.5">
            <span className="font-bold text-gray-900 block text-xs flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>اختيار الصنف لتوريد كميات إضافية:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5">
                <label className="text-xs text-gray-600 font-bold block mb-1">اختر الصنف:</label>
                <select
                  value={selectedProdId}
                  onChange={e => handleSelectProduct(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold text-xs"
                >
                  <option value="">-- اضغط لاختيار الصنف --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (المخزون الحالي: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-gray-600 font-bold block mb-1">الكمية الموردة:</label>
                <input
                  type="number"
                  min="1"
                  value={inputQty}
                  onChange={e => setInputQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full p-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold text-xs text-center"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-gray-600 font-bold block mb-1">سعر الشراء:</label>
                <input
                  type="number"
                  step="any"
                  value={inputCost || ''}
                  onChange={e => setInputCost(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full p-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold text-xs text-center"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProdId}
                  className="w-full p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة للفاتورة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-2.5 bg-gray-100 border-b border-gray-200 text-xs font-black text-gray-700 flex justify-between">
              <span>الأصناف الموردة في هذه الفاتورة ({items.length})</span>
              <span>الإجمالي الفرعي</span>
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs font-semibold">
                لم يتم إضافة أصناف حتى الآن. اختر صنفاً من الأعلى وأضفه للفاتورة.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-2 text-xs bg-white hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{item.productName}</div>
                      <div className="text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>سعر الشراء: {formatMoney(item.costPrice, settings.currencySymbol)}</span>
                        <span>•</span>
                        <span className="font-bold text-blue-600">+{item.quantity} {item.unit} للمخزن</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-white font-bold flex items-center justify-center hover:bg-gray-200 active:scale-95"
                          title="إنقاص"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onFocus={e => e.target.select()}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1) {
                              handleUpdateItemQty(idx, val);
                            }
                          }}
                          className="w-11 text-center font-black text-xs text-gray-900 bg-white border border-gray-300 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          title="اضغط لكتابة الكمية مباشرة"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-white font-bold flex items-center justify-center hover:bg-gray-200 active:scale-95"
                          title="زيادة"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-black text-gray-900 min-w-[70px] text-left">
                        {formatMoney(item.total, settings.currencySymbol)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-800 font-bold block">
                    طريقة السداد <span className="text-rose-600 font-black">* (كاش أم آجل)</span>:
                  </label>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    paymentMethod === 'credit'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {paymentMethod === 'credit' ? 'شراء آجل (على الحساب)' : 'شراء نقدي مسدد (كاش)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('cash'); setPaidAmount(grandTotal); }}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    💵 نقدي (كاش)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('credit'); setPaidAmount(0); }}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                      paymentMethod === 'credit'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    📅 آجل (دين/حساب)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('card'); setPaidAmount(grandTotal); }}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    💳 تحويل / شبكة
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-700 font-bold block">
                    المبلغ المسدد للمورد حالياً <span className="text-rose-600">*</span>:
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(grandTotal)}
                      className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-bold hover:bg-gray-100"
                    >
                      كامل المبلغ
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(0)}
                      className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 rounded font-bold text-amber-900 hover:bg-amber-200"
                    >
                      صفر (آجل كامل)
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={paidAmount === '' ? (paymentMethod === 'credit' ? 0 : grandTotal) : paidAmount}
                  onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-black text-sm text-left font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs justify-between flex flex-col">
              <div className="flex justify-between text-gray-600">
                <span>إجمالي الأصناف:</span>
                <span className="font-bold text-gray-900">{formatMoney(subtotal, settings.currencySymbol)}</span>
              </div>
              {settings.enableTax && (
                <div className="flex justify-between text-gray-600">
                  <span>ضريبة القيمة المضافة ({taxRate}%):</span>
                  <span className="font-bold text-gray-900">{formatMoney(taxTotal, settings.currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                <span>إجمالي فاتورة الشراء والتوريد:</span>
                <span className="text-blue-700">{formatMoney(grandTotal, settings.currencySymbol)}</span>
              </div>
              <div className={`flex justify-between text-xs font-black p-2.5 rounded-xl border ${
                remainingDebt > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <span>المتبقي للمورد (الآجل):</span>
                <span>{formatMoney(remainingDebt, settings.currencySymbol)} {remainingDebt === 0 ? '(مسدد بالكامل ✅)' : '(يسجل كدين للمورد ⚠️)'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={items.length === 0}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-5 h-5" />
              <span>حفظ وتوريد البضاعة للمخزن</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
