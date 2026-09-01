import React, { useState, useMemo, useRef } from 'react';
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
  ArrowUpDown,
  Truck,
  Lock,
  FileSpreadsheet,
  Image as ImageIcon,
  Upload,
  Camera,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, ProductUnit } from '../types';
import { formatMoney, playHapticFeedback } from '../utils/helpers';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';

const PRODUCT_IMAGE_PRESETS = [
  { label: 'شاحن Type-C', url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80' },
  { label: 'سماعات Pro', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80' },
  { label: 'كيبل ووصلة', url: 'https://images.unsplash.com/photo-1608248597359-009ba66dcfef?w=300&auto=format&fit=crop&q=80' },
  { label: 'باور بانك', url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&auto=format&fit=crop&q=80' },
  { label: 'ساعة ذكية', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80' },
  { label: 'هواتف وحماية', url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=300&auto=format&fit=crop&q=80' },
  { label: 'مشروبات ومياه', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80' },
  { label: 'خدمة وصيانة', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80' },
  { label: 'أطعمة وسوبرماركت', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80' },
  { label: 'عطور ومستحضرات', url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=80' },
  { label: 'أدوات ومعدات', url: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=300&auto=format&fit=crop&q=80' },
];

export const InventoryView: React.FC = () => {
  const {
    products,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    totalInventoryCost,
    totalInventoryRetail,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Purchase Modal State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseTargetProductId, setPurchaseTargetProductId] = useState<string | undefined>(undefined);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    name: string;
    barcode: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    minStockAlert: number;
    unit: ProductUnit;
    imageUrl: string;
    notes: string;
  }>({
    name: '',
    barcode: '',
    category: 'إلكترونيات',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStockAlert: 3,
    unit: 'قطعة',
    imageUrl: '',
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
    setShowUrlInput(false);
    setShowPresets(false);
    setFormData({
      name: '',
      barcode: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: 'عام',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStockAlert: 3,
      unit: 'قطعة',
      imageUrl: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setShowUrlInput(false);
    setShowPresets(false);
    setFormData({
      name: p.name,
      barcode: p.barcode,
      category: p.category,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      stock: p.stock,
      minStockAlert: p.minStockAlert,
      unit: p.unit,
      imageUrl: p.imageUrl || '',
      notes: p.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleOpenPurchase = (productId?: string) => {
    setPurchaseTargetProductId(productId);
    setIsPurchaseModalOpen(true);
  };

  // Helper for processing and compressing uploaded image
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, GIF)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 500;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormData(prev => ({ ...prev, imageUrl: compressedDataUrl }));
        } else {
          setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...formData,
        stock: editingProduct.stock, // Preserve stock when editing product details
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
            إدارة الأصناف والصور والباركود وتوريد الكميات عبر فواتير الشراء الرسمية
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenPurchase()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 active:scale-95 transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>+ فاتورة شراء وتوريد بضاعة</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-200 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة صنف جديد مع صورة</span>
          </button>
        </div>
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
            placeholder="بحث باسم الصنف أو الباركود أو التصنيف..."
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
                className="p-4 bg-white border border-gray-200 hover:border-blue-300 rounded-2xl shadow-xs transition-all flex flex-col sm:flex-row gap-4 sm:items-center"
              >
                {/* Product Image Thumbnail */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center group shadow-xs">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        // Fallback on broken image link
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50/50 text-blue-500">
                      <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                      <span className="text-[9px] font-bold text-blue-600/70 mt-0.5">بدون صورة</span>
                    </div>
                  )}

                  {/* Quick Image Edit Overlay */}
                  <button
                    onClick={() => handleOpenEdit(p)}
                    title="تغيير أو إضافة صورة للصنف"
                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                {/* Product Info & Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-gray-900">{p.name}</span>
                        <span className="text-xs font-semibold text-gray-600 px-2 py-0.5 bg-gray-100 rounded-md border border-gray-200">
                          {p.category}
                        </span>
                        {p.barcode && (
                          <span className="text-[11px] font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                            #{p.barcode}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                        <span>سعر البيع: <strong className="text-blue-600 font-black">{formatMoney(p.sellingPrice, settings.currencySymbol)}</strong></span>
                        <span>•</span>
                        <span>التكلفة: <strong className="text-gray-700">{formatMoney(p.costPrice, settings.currencySymbol)}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">(ربح: +{profitMargin}%)</span>
                      </div>
                    </div>

                    <div className="text-left flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="text-xs text-gray-400 font-medium">المخزون المتوفر:</span>
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
                  <div className="pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-gray-100">
                    {p.unit !== 'خدمة' ? (
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => handleOpenPurchase(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>توريد وشراء كميات إضافية</span>
                        </button>
                        <span className="text-xs text-gray-400 hidden sm:inline">(تضاف عبر فواتير الشراء)</span>
                      </div>
                    ) : <div />}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        title="تعديل بيانات وصورة الصنف"
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل الصنف</span>
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(p)}
                        title="حذف الصنف"
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900">
                  {editingProduct ? 'تعديل بيانات وصورة الصنف' : 'إضافة صنف جديد مع صورة'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs sm:text-sm">
              
              {/* Product Image Section (إدارة صورة الصنف) */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-gray-800 font-black flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>صورة الصنف والمنتج:</span>
                  </label>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إزالة الصورة</span>
                    </button>
                  )}
                </div>

                {/* Image Preview & Upload Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Current Image Box */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDropImage}
                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 bg-white cursor-pointer overflow-hidden flex flex-col items-center justify-center group transition-all shrink-0 shadow-xs"
                    title="اضغط لرفع صورة من جهازك"
                  >
                    {formData.imageUrl ? (
                      <>
                        <img
                          src={formData.imageUrl}
                          alt="معاينة الصنف"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-bold">تغيير الصورة</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2 text-gray-400 group-hover:text-blue-600 transition-colors">
                        <Upload className="w-7 h-7 mx-auto mb-1 stroke-[1.5]" />
                        <span className="text-[11px] font-bold block text-gray-600">اختر صورة</span>
                        <span className="text-[9px] text-gray-400 block mt-0.5">أو اسحبها هنا</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Upload Action Buttons */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>رفع من الجهاز</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="p-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                        <span>رابط صورة ويب</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPresets(!showPresets)}
                      className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{showPresets ? 'إخفاء الصور الجاهزة' : 'اختيار صورة من النماذج الجاهزة'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Image URL input */}
                {showUrlInput && (
                  <div className="pt-2 border-t border-gray-200 animate-in fade-in-50">
                    <label className="text-gray-600 text-xs font-bold block mb-1">رابط الصورة المباشر (URL):</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 p-2 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs font-mono focus:outline-none focus:border-blue-600"
                      />
                      {formData.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(false)}
                          className="px-3 bg-blue-600 text-white rounded-xl text-xs font-bold"
                        >
                          تم
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Preset Images Gallery */}
                {showPresets && (
                  <div className="pt-2 border-t border-gray-200 space-y-2 animate-in fade-in-50">
                    <span className="text-[11px] text-gray-500 font-bold block">اختر صورة بنقرة واحدة:</span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-gray-200">
                      {PRODUCT_IMAGE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, imageUrl: preset.url });
                            setShowPresets(false);
                          }}
                          className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                            formData.imageUrl === preset.url
                              ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-md"
                          />
                          <span className="text-[9px] font-bold text-gray-700 truncate w-full">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Basic Info */}
              <div>
                <label className="text-gray-700 font-bold block mb-1">اسم الصنف والمنتج *:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: شاحن سريع 65 واط Type-C"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
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
                    <option value="كرتونة صغيرة">كرتونة صغيرة (ترتبط بالتارجت)</option>
                    <option value="كرتونة جامبو">كرتونة جامبو (ترتبط بالتارجت)</option>
                    <option value="كرتونة">كرتونة عادية</option>
                    <option value="علبة">علبة / باكت</option>
                    <option value="كجم">كيلوجرام (كجم)</option>
                    <option value="جرام">جرام</option>
                    <option value="متر">متر</option>
                    <option value="لتر">لتر</option>
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
                  <label className="text-gray-700 font-bold flex items-center gap-1 mb-1">
                    {editingProduct && <Lock className="w-3 h-3 text-amber-600" />}
                    <span>{editingProduct ? 'الرصيد الحالي بالمخزن:' : 'الرصيد الافتتاحي الأولي:'}</span>
                  </label>
                  {editingProduct ? (
                    <div className="p-2.5 bg-gray-100 border border-gray-300 rounded-xl text-gray-700 font-black flex items-center justify-between">
                      <span>{editingProduct.stock} {editingProduct.unit}</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                        مقفل (عبر فواتير الشراء)
                      </span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: Number(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  )}
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

              {editingProduct && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                  <span>لزيادة كميات المخزن لهذا الصنف:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      handleOpenPurchase(editingProduct.id);
                    }}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>فاتورة شراء وتوريد</span>
                  </button>
                </div>
              )}

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
                  حفظ الصنف والصورة
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

      {/* Purchase Invoice Modal */}
      <PurchaseInvoiceModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        initialProductId={purchaseTargetProductId}
      />
    </div>
  );
};
