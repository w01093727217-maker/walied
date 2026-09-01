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
  Boxes,
  UserCheck,
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
    sellerTargets,
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

  // Seller / Employee assignment for sales target
  const [selectedSellerName, setSelectedSellerName] = useState<string>(
    sellerTargets.length > 0 ? sellerTargets[0].sellerName : 'الكاشير 1'
  );

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

  // Carton counts in cart for live target linkage
  const cartSmallCartons = useMemo(() => {
    return cart.reduce((sum, item) => {
      const u = (item.unit || '').trim();
      const pName = (item.productName || '').toLowerCase();
      if (u === 'كرتونة صغيرة' || u.includes('صغيرة') || pName.includes('كرتونة صغيرة') || pName.includes('كرتون صغير')) {
        return sum + item.quantity;
      }
      return sum;
    }, 0);
  }, [cart]);

  const cartJumboCartons = useMemo(() => {
    return cart.reduce((sum, item) => {
      const u = (item.unit || '').trim();
      const pName = (item.productName || '').toLowerCase();
      if (u === 'كرتونة جامبو' || u.includes('جامبو') || pName.includes('كرتونة جامبو') || pName.includes('كرتون جامبو')) {
        return sum + item.quantity;
      }
      return sum;
    }, 0);
  }, [cart]);

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
    
    // Check stock availability
    if (product.unit !== 'خدمة' && !settings.allowNegativeStock) {
      const existing = cart.find(i => i.productId === product.id);
      const currentCartQty = existing ? existing.quantity : 0;
      if (currentCartQty + 1 > product.stock) {
        alert(`عذراً، رصيد المخزون غير كافٍ للصنف "${product.name}"!\nالمتوفر في المخزن حالياً: (${product.stock} ${product.unit}) فقط.\nيرجى تسجيل فاتورة شراء وتوريد بضاعة للمخزن أولاً.`);
        return;
      }
    }

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
          imageUrl: product.imageUrl,
        };
        return [...prev, newItem];
      }
    });
  };

  // Update item in cart (increment/decrement)
  const handleUpdateQuantity = (productId: string, delta: number) => {
    playHapticFeedback();
    const prod = products.find(p => p.id === productId);

    setCart(prev =>
      prev
        .map(i => {
          if (i.productId === productId) {
            const nextQty = i.quantity + delta;
            if (nextQty <= 0) return null;

            if (delta > 0 && prod && prod.unit !== 'خدمة' && !settings.allowNegativeStock) {
              if (nextQty > prod.stock) {
                alert(`عذراً، الكمية المطلوبة (${nextQty}) تتجاوز الرصيد المتوفر بالمخزن (${prod.stock} ${prod.unit})!`);
                return i;
              }
            }

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

  // Directly set exact quantity by typing
  const handleSetExactQuantity = (productId: string, qty: number) => {
    if (isNaN(qty) || qty <= 0) return;
    playHapticFeedback();
    const prod = products.find(p => p.id === productId);

    let finalQty = qty;
    if (prod && prod.unit !== 'خدمة' && !settings.allowNegativeStock) {
      if (finalQty > prod.stock) {
        alert(`عذراً، الكمية المطلوبة (${finalQty}) تتجاوز الرصيد المتوفر بالمخزن (${prod.stock} ${prod.unit})!`);
        finalQty = Math.max(1, prod.stock);
      }
    }

    setCart(prev =>
      prev.map(i => {
        if (i.productId === productId) {
          return {
            ...i,
            quantity: finalQty,
            total: finalQty * i.unitPrice - i.discount,
          };
        }
        return i;
      })
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

    // Check stock for all items
    if (!settings.allowNegativeStock) {
      const outOfStockItems: { name: string; required: number; available: number; unit: string }[] = [];
      cart.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod && prod.unit !== 'خدمة' && item.quantity > prod.stock) {
          outOfStockItems.push({
            name: prod.name,
            required: item.quantity,
            available: prod.stock,
            unit: prod.unit,
          });
        }
      });

      if (outOfStockItems.length > 0) {
        alert(
          `عذراً، لا يمكن إتمام الفاتورة لعدم وجود رصيد كافٍ في المخزن للأصناف التالية:\n` +
          outOfStockItems.map(i => `• ${i.name}: المطلوب (${i.required} ${i.unit}) ولكن المتوفر بالمخزن (${i.available} ${i.unit})`).join('\n') +
          `\n\nيرجى توريد البضاعة للمخزن أولاً عبر (فاتورة شراء وتوريد) أو تعديل الكميات المطلوبة.`
        );
        return;
      }
    }

    const selectedCust = customers.find(c => c.id === selectedCustomerId);
    const finalCustomerName = (selectedCust ? selectedCust.name : customCustomerName).trim();
    const finalCustomerPhone = selectedCust ? selectedCust.phone : customCustomerPhone;

    // Strict validation: Customer name is mandatory
    if (!finalCustomerName) {
      alert('⚠️ اسم العميل إجباري!\nيرجى كتابة أو اختيار اسم العميل قبل إتمام الفاتورة.');
      return;
    }

    if (paidAmount === '' || isNaN(Number(paidAmount)) || Number(paidAmount) < 0) {
      alert('⚠️ يرجى تحديد المبلغ المدفوع بشكل صحيح (أو 0 في حالة الآجل).');
      return;
    }

    const actualPaid = Number(paidAmount);
    const finalRemaining = Math.max(0, grandTotal - actualPaid);

    let status: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (finalRemaining === 0) {
      status = 'paid';
    } else if (actualPaid > 0 && finalRemaining > 0) {
      status = 'partial';
    } else {
      status = 'unpaid';
    }

    const invoiceNumber = generateInvoiceNumber(settings.invoicePrefix, 100);

    const newInvoice = addInvoice({
      invoiceNumber,
      type: 'sale',
      customerId: selectedCustomerId || undefined,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      customerAddress: selectedCust?.address,
      cashierName: selectedSellerName || (sellerTargets[0]?.sellerName || 'كاشير الفرع'),
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
              onClick={() => {
                if (!inCartItem) {
                  handleAddToCart(product);
                }
              }}
              className={`relative flex flex-col justify-between p-3 rounded-2xl bg-white border transition-all select-none shadow-xs group ${
                inCartItem
                  ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer active:scale-[0.98]'
              }`}
            >
              {/* In-Cart Quantity Badge */}
              {inCartItem && (
                <div 
                  onClick={e => e.stopPropagation()}
                  className="absolute -top-2.5 -left-2 z-10 flex items-center gap-1 bg-blue-600 text-white rounded-full shadow-md px-2 py-0.5 animate-in zoom-in-50 duration-150"
                  title="الكمية بالسلة - اضغط لكتابة الرقم مباشرة"
                >
                  <span className="text-[10px] font-bold">بالسلة:</span>
                  <input
                    type="number"
                    min="1"
                    value={inCartItem.quantity}
                    onFocus={e => e.target.select()}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) {
                        handleSetExactQuantity(product.id, val);
                      }
                    }}
                    className="w-9 text-center font-black text-xs text-blue-900 bg-white rounded focus:outline-none focus:ring-1 focus:ring-blue-400 py-0.5"
                  />
                </div>
              )}

              <div>
                {/* Product Image Container */}
                <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-gray-100 mb-2 border border-gray-100 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/40 to-indigo-50/40 text-blue-400">
                      <Package className="w-6 h-6 stroke-[1.5]" />
                      <span className="text-[9px] font-bold text-gray-400 mt-0.5">{product.category}</span>
                    </div>
                  )}

                  {/* Category Pill Over Image */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    <span className="text-[9px] text-gray-700 font-bold px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs shadow-xs border border-gray-200">
                      {product.category || 'عام'}
                    </span>
                  </div>

                  {/* Stock Status Badge Over Image */}
                  <div className="absolute bottom-1.5 left-1.5">
                    {product.unit === 'خدمة' ? (
                      <span className="text-[9px] font-bold text-blue-700 bg-white/95 px-1.5 py-0.5 rounded-md border border-blue-200 shadow-xs">
                        خدمة
                      </span>
                    ) : isOutOfStock ? (
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-50/95 border border-rose-200 px-1.5 py-0.5 rounded-md shadow-xs">
                        نفذت (0)
                      </span>
                    ) : (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs ${
                        product.stock <= product.minStockAlert 
                          ? 'text-amber-800 bg-amber-50/95 border border-amber-200' 
                          : 'text-gray-800 bg-white/90 border border-gray-200'
                      }`}>
                        {product.stock} {product.unit}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 leading-snug">
                  {product.name}
                </h3>
              </div>

              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs sm:text-sm font-black text-blue-600">
                  {formatMoney(product.sellingPrice, settings.currencySymbol)}
                </span>
                {isOutOfStock && !settings.allowNegativeStock ? (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                    غير متوفر
                  </span>
                ) : inCartItem ? (
                  <div 
                    onClick={e => e.stopPropagation()} 
                    className="flex items-center bg-white rounded-xl border border-blue-300 p-0.5 shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(product.id, -1)}
                      className="w-6 h-6 rounded-lg text-blue-700 hover:bg-blue-100 flex items-center justify-center active:scale-95 transition-colors"
                      title="إنقاص"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={inCartItem.quantity}
                      onFocus={e => e.target.select()}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1) {
                          handleSetExactQuantity(product.id, val);
                        }
                      }}
                      className="w-9 text-center font-black text-xs text-blue-900 bg-blue-50/50 border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 py-0.5 mx-0.5 font-mono"
                      title="اضغط لكتابة الكمية مباشرة"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(product.id, 1)}
                      className="w-6 h-6 rounded-lg text-blue-700 hover:bg-blue-100 flex items-center justify-center active:scale-95 transition-colors"
                      title="زيادة"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold hover:bg-blue-600 hover:text-white transition-colors cursor-pointer active:scale-95"
                    title="إضافة للسلة"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
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
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 gap-2"
                >
                  {/* Item Image Thumbnail */}
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pl-1">
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">{item.productName}</h4>
                    <span className="text-xs text-blue-600 font-bold">
                      {formatMoney(item.unitPrice, settings.currencySymbol)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white rounded-xl border border-gray-300 p-1 shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.productId, -1)}
                        className="w-7 h-7 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center active:scale-95 transition-colors"
                        title="إنقاص"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onFocus={e => e.target.select()}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) {
                            handleSetExactQuantity(item.productId, val);
                          }
                        }}
                        className="w-12 text-center font-black text-sm text-blue-900 bg-blue-50/70 border border-blue-200 rounded-lg py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white mx-1 font-mono"
                        title="اضغط لكتابة الكمية مباشرة"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.productId, 1)}
                        className="w-7 h-7 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center active:scale-95 transition-colors"
                        title="زيادة"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.productId)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف من السلة"
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
              {(cartSmallCartons > 0 || cartJumboCartons > 0) && (
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg text-xs font-bold text-purple-900 border border-purple-200">
                  <span className="flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-purple-600" />
                    <span>كراتين مربوطة بالتارجت:</span>
                  </span>
                  <span>
                    {cartSmallCartons > 0 ? `${cartSmallCartons} صغير ` : ''}
                    {cartSmallCartons > 0 && cartJumboCartons > 0 ? '+ ' : ''}
                    {cartJumboCartons > 0 ? `${cartJumboCartons} جامبو` : ''}
                  </span>
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
              {/* Customer Selection - Mandatory */}
              <div className="p-3.5 bg-blue-50/40 rounded-2xl border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                  <span className="flex items-center gap-1.5 text-blue-900">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    <span>اسم العميل / المستفيد <span className="text-rose-600 font-black">* (إجباري)</span>:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors"
                  >
                    {isAddingNewCustomer ? '← اختيار من القائمة' : '+ تسجيل عميل جديد'}
                  </button>
                </div>

                {isAddingNewCustomer ? (
                  <div className="p-3 bg-white rounded-xl border border-blue-300 space-y-2">
                    <input
                      type="text"
                      placeholder="اكتب اسم العميل الجديد هنا * (إجباري)"
                      value={newCustomerName}
                      onChange={e => {
                        setNewCustomerName(e.target.value);
                        setCustomCustomerName(e.target.value);
                      }}
                      className="w-full p-2.5 bg-gray-50 border border-blue-300 rounded-lg text-xs font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <input
                      type="tel"
                      placeholder="رقم الهاتف أو الجوال (اختياري / للواتساب)"
                      value={newCustomerPhone}
                      onChange={e => {
                        setNewCustomerPhone(e.target.value);
                        setCustomCustomerPhone(e.target.value);
                      }}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white text-left font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveQuickCustomer}
                      disabled={!newCustomerName.trim()}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      حفظ وتثبيت العميل بالفاتورة
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-gray-500 font-bold block mb-1">اختيار من العملاء المسجلين:</label>
                        <select
                          value={selectedCustomerId}
                          onChange={e => {
                            setSelectedCustomerId(e.target.value);
                            const cust = customers.find(c => c.id === e.target.value);
                            if (cust) {
                              setCustomCustomerName(cust.name);
                              setCustomCustomerPhone(cust.phone);
                            } else {
                              setCustomCustomerName('');
                              setCustomCustomerPhone('');
                            }
                          }}
                          className="w-full p-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                        >
                          <option value="">-- أو اختر عميل مسجل مسبقاً --</option>
                          {customers.filter(c => c.type === 'customer').map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.balance > 0 ? `(عليه دين: ${c.balance} ${settings.currencySymbol})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-700 font-bold block mb-1">
                          اسم العميل المطبوع بالفاتورة <span className="text-rose-600">*</span>:
                        </label>
                        <input
                          type="text"
                          value={customCustomerName}
                          onChange={e => {
                            setCustomCustomerName(e.target.value);
                            if (selectedCustomerId) setSelectedCustomerId('');
                          }}
                          placeholder="مثال: عميل نقدي / أحمد محمد..."
                          className={`w-full p-2 bg-white border rounded-xl text-xs font-bold text-gray-900 focus:outline-none ${
                            !customCustomerName.trim() ? 'border-rose-400 bg-rose-50/30' : 'border-gray-300 focus:border-blue-600'
                          }`}
                        />
                      </div>
                    </div>

                    {!customCustomerName.trim() && (
                      <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                        ⚠️ اسم العميل إجباري لإتمام الفاتورة
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Employee / Seller Target Selection */}
              <div className="space-y-2 p-3 bg-purple-50/60 rounded-2xl border border-purple-200/80">
                <div className="flex items-center justify-between text-xs text-purple-950 font-bold">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>الموظف / البائع المسؤول (المستحق للتارجت والعمولة):</span>
                  </span>
                  <span className="text-[11px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-md">
                    مربوط بالتارجت 🎯
                  </span>
                </div>

                <select
                  value={selectedSellerName}
                  onChange={e => setSelectedSellerName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-purple-600 shadow-2xs"
                >
                  {sellerTargets.length > 0 ? (
                    sellerTargets.map(st => (
                      <option key={st.id} value={st.sellerName}>
                        👤 {st.sellerName} ({st.role || 'مندوب'}) — هدف: {st.targetSmallCartons || 0} صغير / {st.targetJumboCartons || 0} جامبو
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="الكاشير 1">👤 الكاشير الرئيسي 1</option>
                      <option value="مندوب المبيعات">👤 مندوب المبيعات</option>
                    </>
                  )}
                </select>

                {/* Live Carton Target Notice */}
                {(cartSmallCartons > 0 || cartJumboCartons > 0) ? (
                  <div className="flex items-start gap-2 p-2.5 bg-purple-600 text-white rounded-xl text-[11px] font-bold shadow-xs">
                    <Boxes className="w-4 h-4 shrink-0 mt-0.5 text-purple-200" />
                    <div className="leading-relaxed">
                      <span>تتضمن الفاتورة: </span>
                      {cartSmallCartons > 0 && <strong className="bg-white/20 px-1.5 py-0.5 rounded mx-0.5">{cartSmallCartons} كرتونة صغيرة</strong>}
                      {cartSmallCartons > 0 && cartJumboCartons > 0 && <span> و </span>}
                      {cartJumboCartons > 0 && <strong className="bg-white/20 px-1.5 py-0.5 rounded mx-0.5">{cartJumboCartons} كرتونة جامبو</strong>}
                      <span> — سيتم إضافتها تلقائياً إلى إنجاز الموظف ({selectedSellerName})!</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-purple-700/80 font-medium">
                    💡 يمكنك بيع منتجات بوحدة (كرتونة صغيرة أو كرتونة جامبو) ليتم احتسابها تلقائياً للموظف.
                  </p>
                )}
              </div>

              {/* Payment Method Selector - Cash vs Credit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-800 font-bold block">
                    نوع وطريقة الدفع <span className="text-rose-600">* (كاش أم آجل)</span>:
                  </span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                    paymentMethod === 'credit'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {paymentMethod === 'credit' ? 'معاملة آجلة (دين)' : 'معاملة نقدية (كاش)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash');
                      setPaidAmount(grandTotal);
                    }}
                    className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span>نقدي (كاش كامل)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('card');
                      setPaidAmount(grandTotal);
                    }}
                    className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span>شبكة / بطاقة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('credit');
                      setPaidAmount(0); // On account
                    }}
                    className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                      paymentMethod === 'credit'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <span>آجل (دين / حساب)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('bank_transfer');
                      setPaidAmount(grandTotal);
                    }}
                    className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Receipt className="w-5 h-5 text-indigo-600" />
                    <span>تحويل بنكي</span>
                  </button>
                </div>
              </div>

              {/* Paid Amount & Remaining Debt Calculation Card */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>توزيع المبالغ (المدفوع والمتبقي):</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(grandTotal)}
                      className="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-[11px] font-bold"
                    >
                      كامل المبلغ ({formatMoney(grandTotal, settings.currencySymbol)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(Math.round(grandTotal / 2))}
                      className="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-[11px] font-bold"
                    >
                      النصف (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(0)}
                      className="px-2 py-1 bg-amber-100 border border-amber-300 hover:bg-amber-200 text-amber-900 rounded-lg text-[11px] font-bold"
                    >
                      صفر (آجل كامل)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">
                      كم المدفوع حالياً <span className="text-rose-600">*</span>:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-base font-black text-gray-900 focus:outline-none focus:border-blue-600 text-left font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        {settings.currencySymbol}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-700 font-bold block mb-1">
                      كم المتبقي (يسجل كدين):
                    </label>
                    <div className={`p-2.5 rounded-xl text-base font-black border flex items-center justify-between ${
                      remainingDebt > 0
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    }`}>
                      <span>{formatMoney(remainingDebt, settings.currencySymbol)}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/70">
                        {remainingDebt === 0 ? 'خالص بالكامل ✅' : 'متبقي دين ⚠️'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary banner */}
                <div className="text-[11px] p-2.5 rounded-xl bg-white border border-gray-200 flex items-center justify-between text-gray-600 font-medium">
                  <span>إجمالي الفاتورة: <strong className="text-gray-900 font-bold">{formatMoney(grandTotal, settings.currencySymbol)}</strong></span>
                  <span>المدفوع: <strong className="text-emerald-700 font-bold">{formatMoney(Number(paidAmount) || 0, settings.currencySymbol)}</strong></span>
                  <span>المتبقي: <strong className={remainingDebt > 0 ? 'text-amber-700 font-bold' : 'text-gray-500'}>{formatMoney(remainingDebt, settings.currencySymbol)}</strong></span>
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
