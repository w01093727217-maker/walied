import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  X, 
  Store, 
  DollarSign, 
  Percent, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Sparkles,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CurrencyCode, StoreSettings } from '../types';
import { exportDataAsJson } from '../utils/helpers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    products,
    customers,
    invoices,
    expenses,
    payments,
    updateSettings,
    resetToDemoData,
    restoreBackup,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'tax_currency' | 'backup'>('general');
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currencies: { code: CurrencyCode; name: string; symbol: string }[] = [
    { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س' },
    { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م' },
    { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ' },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$' },
    { code: 'KWD', name: 'دينار كويتي', symbol: 'د.ك' },
    { code: 'QAR', name: 'ريال قطري', symbol: 'ر.ق' },
    { code: 'BHD', name: 'دينار بحريني', symbol: 'د.ب' },
    { code: 'OMR', name: 'ريال عماني', symbol: 'ر.ع' },
    { code: 'JOD', name: 'دينار أردني', symbol: 'د.أ' },
    { code: 'IQD', name: 'دينار عراقي', symbol: 'د.ع' },
    { code: 'MAD', name: 'درهم مغربي', symbol: 'د.م' },
    { code: 'DZD', name: 'دينار جزائري', symbol: 'د.ج' },
    { code: 'TRY', name: 'ليرة تركية', symbol: '₺' },
  ];

  const handleCurrencyChange = (code: CurrencyCode) => {
    const found = currencies.find(c => c.code === code);
    if (found) {
      setFormData({
        ...formData,
        currency: code,
        currencySymbol: found.symbol,
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportBackup = () => {
    exportDataAsJson({
      settings: formData,
      products,
      customers,
      invoices,
      expenses,
      payments,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const ok = restoreBackup(json);
        if (ok) {
          alert('تم استعادة النسخة الاحتياطية بنجاح!');
          onClose();
        } else {
          alert('الملف غير صالح أو تالف.');
        }
      } catch {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">إعدادات المحل والبرنامج</h3>
              <p className="text-[11px] text-gray-500">تخصيص الفواتير، العملة، الضريبة، والنسخ الاحتياطي</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'general' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            بيانات المنشأة
          </button>
          <button
            onClick={() => setActiveTab('tax_currency')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'tax_currency' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            العملة والضريبة
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'backup' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            النسخ الاحتياطي
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-3.5 py-1 text-xs">
          {activeTab === 'general' && (
            <form id="settings-form" onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-gray-700 font-bold block mb-1">اسم المتجر / المؤسسة *:</label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="مؤسسة النجم للتجارة"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">نوع النشاط التجاري:</label>
                  <input
                    type="text"
                    value={formData.activityType}
                    onChange={e => setFormData({ ...formData, activityType: e.target.value })}
                    placeholder="إلكترونيات وموبايل"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">رقم الهاتف / الواتساب:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">الرقم الضريبي (إن وجد):</label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="3000xxxxxxxx003"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">السجل التجاري (س.ت):</label>
                  <input
                    type="text"
                    value={formData.commercialRegister}
                    onChange={e => setFormData({ ...formData, commercialRegister: e.target.value })}
                    placeholder="1010xxxxxx"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">العنوان والفرع:</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="الرياض - حي الملك فهد"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">تذييل وملاحظات أسفل الفاتورة:</label>
                <textarea
                  rows={2}
                  value={formData.receiptFooter}
                  onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                  placeholder="شكراً لتعاملكم معنا، البضاعة المباعة ترد وتستبدل..."
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>
            </form>
          )}

          {activeTab === 'tax_currency' && (
            <form id="settings-form" onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-gray-700 font-bold block mb-1">العملة الافتراضية للبرنامج:</label>
                <select
                  value={formData.currency}
                  onChange={e => handleCurrencyChange(e.target.value as CurrencyCode)}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.symbol}) - {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 block">تفعيل ضريبة القيمة المضافة (VAT):</span>
                    <span className="text-[11px] text-gray-500">إضافة نسبة الضريبة تلقائياً على الفواتير</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableTax}
                    onChange={e => setFormData({ ...formData, enableTax: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </div>

                {formData.enableTax && (
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-2">
                    <span className="text-gray-700 font-bold">نسبة الضريبة (%):</span>
                    <div className="flex items-center gap-1.5 w-28">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.taxRate}
                        onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) || 0 })}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl text-center text-gray-900 font-bold focus:outline-none focus:border-blue-600"
                      />
                      <span className="text-gray-500 font-bold">%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block">خصم المخزون التلقائي:</span>
                  <span className="text-[11px] text-gray-500">إنقاص كمية المنتجات في المخزن تلقائياً عند البيع</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoDeductStock}
                  onChange={e => setFormData({ ...formData, autoDeductStock: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>
            </form>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>تصدير وحفظ نسخة احتياطية (JSON)</span>
                </h4>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  حفظ كافة الفواتير، الأصناف، العملاء، والمصروفات في ملف على هاتفك لاستعادتها في أي وقت.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-200"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل النسخة الاحتياطية الآن</span>
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>استعادة نسخة احتياطية</span>
                </h4>
                <p className="text-[11px] text-gray-600">
                  حدد ملف النسخة الاحتياطية بصيغة (.json) لاسترجاع البيانات السابقة.
                </p>
                <label className="w-full py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-2xs">
                  <Upload className="w-4 h-4" />
                  <span>اختيار ملف النسخة الاحتياطية</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                <h4 className="font-bold text-rose-700 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة تعيين البيانات التجريبية</span>
                </h4>
                <p className="text-[11px] text-rose-600">
                  إعادة ضبط المصنع واسترجاع البيانات الأولية مع أمثلة واقعية.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من إعادة تعيين البيانات؟ سيتم استبدال البيانات الحالية بالبيانات التجريبية.')) {
                      resetToDemoData();
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 bg-white hover:bg-rose-100/60 text-rose-700 border border-rose-300 font-bold rounded-xl transition-all shadow-2xs"
                >
                  استعادة البيانات التجريبية
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          {savedSuccess && (
            <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Check className="w-4 h-4" />
              <span>تم حفظ التعديلات بنجاح!</span>
            </span>
          )}
          {!savedSuccess && <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 text-xs font-bold transition-colors"
            >
              إغلاق
            </button>
            {activeTab !== 'backup' && (
              <button
                type="submit"
                form="settings-form"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-200 active:scale-95 transition-all"
              >
                حفظ الإعدادات
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
