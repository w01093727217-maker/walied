import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Tag, 
  X, 
  Check,
  ChevronDown,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, ProductUnit } from '../types';
import { formatMoney, playHapticFeedback } from '../utils/helpers';

export const InventoryView: React.FC = () => {
  const {
    products,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    totalInventoryCost,
    totalInventoryRetail,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    barcode: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    minStockAlert: number;
    unit: ProductUnit;
    notes: string;
  }>({
    name: '',
    barcode: '',
    category: 'إلكترونيات',
    costPrice: 0,
    sellingPrice: 0,
    stock: 10,
    minStockAlert: 3,
    unit: 'قطعة',
    notes: '',
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['الكل', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm);
      const matchCat = selectedCategory === 'الكل' || p.category === selectedCategory;
      const matchLow = !onlyLowStock || (p.unit !== 'خدمة' && p.stock <= p.minStockAlert);
      return matchSearch && matchCat && matchLow;
    });
  }, [products, searchTerm, selectedCategory, onlyLowStock]);

  const expectedProfit = totalInventoryRetail - totalInventoryCost;

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: 'عام',
      costPrice: 0,
      sellingPrice: 0,
      stock: 10,
      minStockAlert: 3,
      unit: 'قطعة',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      barcode: p.barcode,
      category: p.category,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      stock: p.stock,
      minStockAlert: p.minStockAlert,
      unit: p.unit,
      notes: p.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...formData,
      });
    } else {
      addProduct(formData);
    }
    setIsFormOpen(false);
  };

  const handleDeleteProduct = (p: Product) => {
    if (window.confirm(`هل أنت متأكد من حذف الصنف "${p.name}"؟`)) {
      deleteProduct(p.id);
    }
  };

  const profitMarginPercent = formData.costPrice > 0
    ? Math.round(((formData.sellingPrice - formData.costPrice) / formData.costPrice) * 100)
    : 0;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <span>المخزون وقائمة المنتجات والخدمات</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            إدارة الكميات، الأسعار، تنبيهات النقص، وهوامش الربح
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-200 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة صنف جديد</span>
        </button>
      </div>

      {/* Inventory Valuation KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">قيمة المخزون (بالتكلفة)</span>
          <span className="text-lg sm:text-xl font-black text-gray-900 mt-1 block">
            {formatMoney(totalInventoryCost, settings.currencySymbol)}
          </span>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">القيمة البيعية الإجمالية</span>
          <span className="text-lg sm:text-xl font-black text-blue-600 mt-1 block">
            {formatMoney(totalInventoryRetail, settings.currencySymbol)}
          </span>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 block">الأرباح المتوقعة من المخزون</span>
          <span className="text-lg sm:text-xl font-black text-emerald-600 mt-1 block">
            {formatMoney(expectedProfit, settings.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الصنف أو الباركود..."
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

        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <div className="flex items-center gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
              onlyLowStock
                ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ناقص بالمخزن فقط</span>
          </button>
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">لا توجد أصناف مطابقة للبحث.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(p => {
            const isLow = p.unit !== 'خدمة' && p.stock <= p.minStockAlert;
            const profit = p.sellingPrice - p.costPrice;
            const profitMargin = p.costPrice > 0 ? Math.round((profit / p.costPrice) * 100) : 0;

            return (
              <div
                key={p.id}
                className="p-4 bg-white border border-gray-200 hover:border-blue-300 rounded-2xl shadow-xs transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-gray-900">{p.name}</span>
                      <span className="text-xs font-semibold text-gray-600 px-2 py-0.5 bg-gray-100 rounded-md border border-gray-200">
                        {p.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1.5">
                      <span>سعر البيع: <strong className="text-blue-600 font-black">{formatMoney(p.sellingPrice, settings.currencySymbol)}</strong></span>
                      <span>•</span>
                      <span>التكلفة: <strong className="text-gray-700">{formatMoney(p.costPrice, settings.currencySymbol)}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold">(ربح: +{profitMargin}%)</span>
                    </div>
                  </div>

                  <div className="text-left flex sm:flex-col items-center sm:items-end justify-between">
                    <span className="text-xs text-gray-400 font-medium">المخزون الحالي:</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black ${isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                        {p.unit === 'خدمة' ? 'خدمة متكررة' : `${p.stock} ${p.unit}`}
                      </span>
                      {isLow && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          أقل من الحد ({p.minStockAlert})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Controls & Actions */}
                <div className="pt-3 flex items-center justify-between gap-2 flex-wrap">
                  {p.unit !== 'خدمة' ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-xs text-gray-500 font-bold">تعديل المخزون:</span>
                      <button
                        onClick={() => adjustStock(p.id, -1)}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold active:scale-95 transition-all"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => adjustStock(p.id, 1)}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold active:scale-95 transition-all"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => adjustStock(p.id, 10)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 active:scale-95 transition-all"
                      >
                        +10
                      </button>
                    </div>
                  ) : <div />}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      title="تعديل الصنف"
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(p)}
                      title="حذف الصنف"
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

      {/* Add / Edit Product Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="text-gray-700 font-bold block mb-1">اسم الصنف والمنتج *:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: شاحن سريع Type-C"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">التصنيف:</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="إكسسوارات"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">وحدة القياس:</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="علبة">علبة</option>
                    <option value="كرتونة">كرتونة</option>
                    <option value="كجم">كيلوجرام (كجم)</option>
                    <option value="متر">متر</option>
                    <option value="خدمة">خدمة / صيانة</option>
                    <option value="طقم">طقم</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">سعر التكلفة (الشراء) *:</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.costPrice || ''}
                    onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">سعر البيع النهائي *:</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.sellingPrice || ''}
                    onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-blue-600 font-black focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="col-span-2 flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <span>هامش الربح المتوقع:</span>
                  <span className="font-bold text-emerald-600">
                    +{formatMoney(formData.sellingPrice - formData.costPrice, settings.currencySymbol)} ({profitMarginPercent}%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">الكمية المتوفرة بالمخزن:</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">حد تنبيه النقص:</label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={e => setFormData({ ...formData, minStockAlert: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">الباركود أو كود الصنف:</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="628xxxxxxxx"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-colors"
                >
                  حفظ الصنف
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
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
