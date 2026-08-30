import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  User, 
  UserPlus, 
  CreditCard, 
  Banknote, 
  Calendar, 
  Receipt, 
  Tag, 
  Check, 
  X, 
  Percent, 
  ArrowRight,
  Sparkles,
  Package,
  MessageCircle,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { Customer, InvoiceItem, PaymentMethod, Product } from '../types';
import { formatMoney, generateInvoiceNumber, getCurrentTimeString, getTodayDateString, playHapticFeedback } from '../utils/helpers';

export const PosInvoiceView: React.FC = () => {
  const {
    products,
    customers,
    settings,
    addInvoice,
    addCustomer,
    setSelectedInvoiceForPrint,
    setShowPrintModal,
    setActiveTab,
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  // Cart state: map of productId -> quantity & custom price/discount
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('عميل نقدي');
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>('');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['الكل', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      const matchSearch =
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.barcode.includes(searchTerm);
      const matchCat = selectedCategory === 'الكل' || prod.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const taxTotal = useMemo(() => {
    if (!settings.enableTax || settings.taxRate <= 0) return 0;
    const taxableAmount = Math.max(0, cartSubtotal - invoiceDiscount);
    return (taxableAmount * settings.taxRate) / 100;
  }, [cartSubtotal, invoiceDiscount, settings]);

  const grandTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - invoiceDiscount + taxTotal);
  }, [cartSubtotal, invoiceDiscount, taxTotal]);

  const remainingDebt = useMemo(() => {
    const actualPaid = paidAmount === '' ? grandTotal : Number(paidAmount);
    return Math.max(0, grandTotal - actualPaid);
  }, [grandTotal, paidAmount]);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    playHapticFeedback();
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                total: (i.quantity + 1) * i.unitPrice - i.discount,
              }
            : i
        );
      } else {
        const newItem: InvoiceItem = {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          unit: product.unit,
          quantity: 1,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
          discount: 0,
          total: product.sellingPrice,
        };
        return [...prev, newItem];
      }
    });
  };

  // Update item in cart
  const handleUpdateQuantity = (productId: string, delta: number) => {
    playHapticFeedback();
    setCart(prev =>
      prev
        .map(i => {
          if (i.productId === productId) {
            const nextQty = i.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...i,
              quantity: nextQty,
              total: nextQty * i.unitPrice - i.discount,
            };
          }
          return i;
        })
        .filter(Boolean) as InvoiceItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setIsCartDrawerOpen(false);
    setIsCheckoutOpen(false);
  };

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setPaidAmount(grandTotal);
    setIsCheckoutOpen(true);
  };

  // Save quick customer
  const handleSaveQuickCustomer = () => {
    if (!newCustomerName.trim()) return;
    const created = addCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      type: 'customer',
      balance: 0,
    });
    setSelectedCustomerId(created.id);
    setCustomCustomerName(created.name);
    setCustomCustomerPhone(created.phone);
    setIsAddingNewCustomer(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
  };

  // Complete & Save Invoice
  const handleCompleteSale = (openPrint: boolean = false) => {
    if (cart.length === 0) return;

    const actualPaid = paidAmount === '' ? (paymentMethod === 'credit' ? 0 : grandTotal) : Number(paidAmount);
    const finalRemaining = Math.max(0, grandTotal - actualPaid);

    let status: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (finalRemaining === 0) {
      status = 'paid';
    } else if (actualPaid > 0 && finalRemaining > 0) {
      status = 'partial';
    } else {
      status = 'unpaid';
    }

    const selectedCust = customers.find(c => c.id === selectedCustomerId);
    const finalCustomerName = selectedCust ? selectedCust.name : (customCustomerName || 'عميل نقدي');
    const finalCustomerPhone = selectedCust ? selectedCust.phone : customCustomerPhone;

    const invoiceNumber = generateInvoiceNumber(settings.invoicePrefix, 100);

    const newInvoice = addInvoice({
      invoiceNumber,
      type: 'sale',
      customerId: selectedCustomerId || undefined,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      customerAddress: selectedCust?.address,
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      items: cart,
      subtotal: cartSubtotal,
      discountTotal: invoiceDiscount,
      taxRate: settings.enableTax ? settings.taxRate : 0,
      taxTotal,
      grandTotal,
      paidAmount: actualPaid,
      remainingDebt: finalRemaining,
      paymentMethod,
      status,
      notes: invoiceNotes,
    });

    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    // Reset Form
    handleClearCart();

    if (openPrint) {
      setSelectedInvoiceForPrint(newInvoice);
      setShowPrintModal(true);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-32 lg:pb-16">
      {/* Header & Title Banner */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>نقطة البيع وتحرير الفواتير</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">انقر على أي صنف لإضافته مباشرة لسلة المبيعات</p>
        </div>

        {cart.length > 0 && (
          <button
            onClick={handleClearCart}
            className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
          >
            إفراغ السلة
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو قراءة الباركود..."
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
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {filteredProducts.map(product => {
          const inCartItem = cart.find(i => i.productId === product.id);
          const isOutOfStock = product.unit !== 'خدمة' && product.stock <= 0;

          return (
            <div
              key={product.id}
              onClick={() => handleAddToCart(product)}
              className={`relative flex flex-col justify-between p-3.5 rounded-2xl bg-white border transition-all cursor-pointer select-none active:scale-[0.98] shadow-xs ${
                inCartItem
                  ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {/* In-Cart Quantity Badge */}
              {inCartItem && (
                <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md animate-in zoom-in-50 duration-150">
                  {inCartItem.quantity}
                </span>
              )}

              <div>
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-[10px] text-gray-500 font-bold px-2 py-0.5 rounded-md bg-gray-100">
                    {product.category || 'عام'}
                  </span>
                  <span className={`text-[11px] font-bold ${
                    product.unit === 'خدمة' ? 'text-blue-600' :
                    product.stock <= product.minStockAlert ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {product.unit === 'خدمة' ? 'خدمة' : `${product.stock} ${product.unit}`}
                  </span>
                </div>

                <h3 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 leading-snug">
                  {product.name}
                </h3>
              </div>

              <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-gray-100">
                <span className="text-xs sm:text-sm font-black text-blue-600">
                  {formatMoney(product.sellingPrice, settings.currencySymbol)}
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold hover:bg-blue-600 hover:text-white transition-colors">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Sticky Cart Bottom Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 z-30 p-3 no-print">
          <div className="max-w-xl mx-auto bg-white border border-blue-300 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 ring-4 ring-blue-600/10">
            <div 
              onClick={() => setIsCartDrawerOpen(true)}
              className="flex items-center gap-3 cursor-pointer flex-1"
            >
              <div className="relative w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block font-medium">إجمالي الفاتورة:</span>
                <span className="text-base sm:text-lg font-black text-gray-900">
                  {formatMoney(grandTotal, settings.currencySymbol)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold transition-colors"
              >
                تعديل
              </button>

              <button
                onClick={handleOpenCheckout}
                className="px-4 sm:px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-200 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>دفع وإصدار</span>
                <ArrowRight className="w-4 h-4 rotate-180 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Items Drawer Modal */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-gray-900">محتويات السلة ({cart.length} أصناف)</h3>
              </div>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {cart.map(item => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex-1 pl-2">
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900">{item.productName}</h4>
                    <span className="text-xs text-blue-600 font-bold">
                      {formatMoney(item.unitPrice, settings.currencySymbol)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white rounded-lg border border-gray-300 p-0.5 shadow-xs">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, -1)}
                        className="p-1 text-gray-500 hover:text-gray-900 active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, 1)}
                        className="p-1 text-gray-500 hover:text-gray-900 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(item.productId)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-gray-900">{formatMoney(cartSubtotal, settings.currencySymbol)}</span>
              </div>
              {settings.enableTax && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>ضريبة القيمة المضافة ({settings.taxRate}%):</span>
                  <span>{formatMoney(taxTotal, settings.currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>الإجمالي الكلي:</span>
                <span className="text-blue-600">{formatMoney(grandTotal, settings.currencySymbol)}</span>
              </div>

              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  handleOpenCheckout();
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-200 active:scale-95 transition-all mt-2"
              >
                متابعة وإتمام الدفع ({formatMoney(grandTotal, settings.currencySymbol)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Drawer / Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">إتمام الفاتورة وتحديد العميل</h3>
                  <span className="text-xs text-blue-600 font-bold">
                    المطلوب سداده: {formatMoney(grandTotal, settings.currencySymbol)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3.5 space-y-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-700 font-bold">
                  <span>العميل:</span>
                  <button
                    onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                    className="text-blue-600 hover:underline flex items-center gap-1 text-xs font-bold"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isAddingNewCustomer ? 'اختيار عميل مسجل' : '+ إضافة عميل جديد'}</span>
                  </button>
                </div>

                {isAddingNewCustomer ? (
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                    <input
                      type="text"
                      placeholder="اسم العميل الجديد *"
                      value={newCustomerName}
                      onChange={e => setNewCustomerName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                    />
                    <input
                      type="tel"
                      placeholder="رقم الهاتف (لإرسال الفاتورة عبر واتساب)"
                      value={newCustomerPhone}
                      onChange={e => setNewCustomerPhone(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      onClick={handleSaveQuickCustomer}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      حفظ وتعيين العميل
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={e => {
                      setSelectedCustomerId(e.target.value);
                      const cust = customers.find(c => c.id === e.target.value);
                      if (cust) {
                        setCustomCustomerName(cust.name);
                        setCustomCustomerPhone(cust.phone);
                      } else {
                        setCustomCustomerName('عميل نقدي');
                        setCustomCustomerPhone('');
                      }
                    }}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">عميل نقدي مباشر (كاشير سريع)</option>
                    {customers.filter(c => c.type === 'customer').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.balance > 0 ? `(عليه دين: ${c.balance} ${settings.currencySymbol})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <span className="text-xs text-gray-700 font-bold block">طريقة الدفع:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      setPaymentMethod('cash');
                      setPaidAmount(grandTotal);
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>نقدي (كاش)</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('card');
                      setPaidAmount(grandTotal);
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>شبكة / بطاقة</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('credit');
                      setPaidAmount(0); // On account
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                      paymentMethod === 'credit'
                        ? 'bg-amber-50 border-amber-600 text-amber-800 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>آجل (دين)</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('bank_transfer');
                      setPaidAmount(grandTotal);
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Receipt className="w-5 h-5" />
                    <span>تحويل بنكي</span>
                  </button>
                </div>
              </div>

              {/* Paid Amount & Remaining Debt Calculation */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div>
                  <label className="text-xs text-gray-600 font-bold block mb-1">
                    المبلغ المدفوع حالياً:
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`${grandTotal}`}
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-bold block mb-1">
                    المتبقي (يسجل كدين):
                  </label>
                  <div className={`p-2.5 rounded-xl text-sm font-black border ${
                    remainingDebt > 0
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}>
                    {formatMoney(remainingDebt, settings.currencySymbol)}
                  </div>
                </div>
              </div>

              {/* Additional Discount & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-bold block mb-1">
                    خصم إضافي على الفاتورة:
                  </label>
                  <input
                    type="number"
                    value={invoiceDiscount || ''}
                    onChange={e => setInvoiceDiscount(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-bold block mb-1">
                    ملاحظات الفاتورة:
                  </label>
                  <input
                    type="text"
                    value={invoiceNotes}
                    onChange={e => setInvoiceNotes(e.target.value)}
                    placeholder="اختياري..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCompleteSale(true)}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-200 active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>حفظ وطباعة فورية</span>
                </button>

                <button
                  onClick={() => handleCompleteSale(false)}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm border border-gray-200 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>حفظ الفاتورة فقط</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
