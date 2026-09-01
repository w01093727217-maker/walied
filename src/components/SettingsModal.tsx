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
  Building,
  Users,
  Boxes,
  Package,
  Phone,
  Plus,
  Trash2,
  Edit2,
  MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CurrencyCode, StoreSettings, SellerTarget } from '../types';
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
    sellerTargets,
    addSellerTarget,
    updateSellerTarget,
    deleteSellerTarget,
    updateSettings,
    resetToDemoData,
    clearAllData,
    restoreBackup,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'tax_currency' | 'employees' | 'backup'>('general');
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Employee Target State within Settings
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<SellerTarget | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState<{
    sellerName: string;
    role: string;
    phone: string;
    targetSmallCartons: number;
    achievedSmallCartons: number;
    targetJumboCartons: number;
    achievedJumboCartons: number;
    period: 'monthly' | 'weekly' | 'daily';
    notes: string;
  }>({
    sellerName: '',
    role: 'مندوب مبيعات',
    phone: '',
    targetSmallCartons: 100,
    achievedSmallCartons: 0,
    targetJumboCartons: 50,
    achievedJumboCartons: 0,
    period: 'monthly',
    notes: '',
  });

  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setEmployeeFormData({
      sellerName: '',
      role: 'مندوب مبيعات',
      phone: '',
      targetSmallCartons: 100,
      achievedSmallCartons: 0,
      targetJumboCartons: 50,
      achievedJumboCartons: 0,
      period: 'monthly',
      notes: '',
    });
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp: SellerTarget) => {
    setEditingEmployee(emp);
    setEmployeeFormData({
      sellerName: emp.sellerName,
      role: emp.role || 'مندوب مبيعات',
      phone: emp.phone || '',
      targetSmallCartons: emp.targetSmallCartons || 0,
      achievedSmallCartons: emp.achievedSmallCartons || 0,
      targetJumboCartons: emp.targetJumboCartons || 0,
      achievedJumboCartons: emp.achievedJumboCartons || 0,
      period: emp.period,
      notes: emp.notes || '',
    });
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeFormData.sellerName.trim()) {
      alert('يرجى إدخال اسم الموظف / البائع');
      return;
    }
    if ((employeeFormData.targetSmallCartons || 0) <= 0 && (employeeFormData.targetJumboCartons || 0) <= 0) {
      alert('يرجى تحديد هدف كراتين (صغير أو جامبو على الأقل أكبر من صفر)');
      return;
    }

    if (editingEmployee) {
      updateSellerTarget({
        ...editingEmployee,
        ...employeeFormData,
      });
    } else {
      addSellerTarget(employeeFormData);
    }
    setIsEmployeeModalOpen(false);
  };

  const handleShareEmployeeWhatsApp = (st: SellerTarget) => {
    const targetSmall = st.targetSmallCartons || 0;
    const achievedSmall = st.achievedSmallCartons || 0;
    const percentSmall = targetSmall > 0 ? Math.round((achievedSmall / targetSmall) * 100) : 0;

    const targetJumbo = st.targetJumboCartons || 0;
    const achievedJumbo = st.achievedJumboCartons || 0;
    const percentJumbo = targetJumbo > 0 ? Math.round((achievedJumbo / targetJumbo) * 100) : 0;

    const totalTarget = targetSmall + targetJumbo;
    const totalAchieved = achievedSmall + achievedJumbo;
    const totalPercent = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

    const message = `📊 *تقرير أداء الموظف / التارجت*
👤 *الاسم:* ${st.sellerName} (${st.role || 'مندوب مبيعات'})
📅 *الفترة:* ${st.period === 'monthly' ? 'شهري' : st.period === 'weekly' ? 'أسبوعي' : 'يومي'}

📦 *كرتون صغير:*
- الهدف: ${targetSmall} كرتون
- المحقق: ${achievedSmall} كرتون (${percentSmall}%)

📦 *كرتون جامبو:*
- الهدف: ${targetJumbo} كرتون
- المحقق: ${achievedJumbo} كرتون (${percentJumbo}%)

🎯 *الإجمالي العام:*
- المحقق: ${totalAchieved} من ${totalTarget} كرتون
- نسبة الإنجاز: *${totalPercent}%*
${st.notes ? `\n📝 ملاحظات: ${st.notes}` : ''}
🏢 ${settings.storeName}`;

    const cleanPhone = (st.phone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone.startsWith('0') ? '966' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

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
      sellerTargets,
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
            onClick={() => setActiveTab('employees')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'employees' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            الموظفين والأهداف
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'backup' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            النسخ والتهيئة
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

          {activeTab === 'employees' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl border border-purple-200">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-700" />
                  <div>
                    <h4 className="font-bold text-purple-950 text-xs">إدارة الموظفين وأهداف المبيعات</h4>
                    <p className="text-[10px] text-purple-700">متابعة مستهدفات الكراتين (صغير وجامبو) لكل موظف</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddEmployee}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة موظف</span>
                </button>
              </div>

              {sellerTargets.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-400 text-xs">
                  لا يوجد موظفين مسجلين حالياً. اضغط على زر "إضافة موظف" لإضافة أول موظف ومستهدفاته.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {sellerTargets.map(emp => {
                    const targetSmall = emp.targetSmallCartons || 0;
                    const achievedSmall = emp.achievedSmallCartons || 0;
                    const percentSmall = targetSmall > 0 ? Math.round((achievedSmall / targetSmall) * 100) : 0;

                    const targetJumbo = emp.targetJumboCartons || 0;
                    const achievedJumbo = emp.achievedJumboCartons || 0;
                    const percentJumbo = targetJumbo > 0 ? Math.round((achievedJumbo / targetJumbo) * 100) : 0;

                    const totalTarget = targetSmall + targetJumbo;
                    const totalAchieved = achievedSmall + achievedJumbo;
                    const totalPercent = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

                    return (
                      <div
                        key={emp.id}
                        className="p-3 bg-white border border-gray-200 rounded-2xl hover:border-purple-300 transition-all space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                              {emp.sellerName.slice(0, 1)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-900">{emp.sellerName}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                                  {emp.role || 'مندوب مبيعات'}
                                </span>
                              </div>
                              {emp.phone && (
                                <span className="text-[10px] text-gray-500 flex items-center gap-0.5" dir="ltr">
                                  <Phone className="w-2.5 h-2.5 text-gray-400" />
                                  {emp.phone}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleShareEmployeeWhatsApp(emp)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="إرسال التقرير عبر واتساب"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditEmployee(emp)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                              title="تعديل الهدف"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف الموظف "${emp.sellerName}"؟`)) {
                                  deleteSellerTarget(emp.id);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="حذف الموظف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Cartons summary */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-blue-50/60 border border-blue-100 rounded-xl">
                            <div className="flex justify-between font-bold text-blue-950">
                              <span>صغير:</span>
                              <span>{percentSmall}%</span>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              {achievedSmall} / {targetSmall} كرتون
                            </div>
                          </div>

                          <div className="p-2 bg-purple-50/60 border border-purple-100 rounded-xl">
                            <div className="flex justify-between font-bold text-purple-950">
                              <span>جامبو:</span>
                              <span>{percentJumbo}%</span>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              {achievedJumbo} / {targetJumbo} كرتون
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] font-bold text-gray-600 flex justify-between px-1">
                          <span>الإجمالي: {totalAchieved} من {totalTarget} كرتون</span>
                          <span className="text-purple-700 font-black">{totalPercent}% محقق</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2.5">
                <h4 className="font-bold text-rose-800 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>إعادة التعيين وتصفير جميع البيانات</span>
                </h4>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  تصفير وحذف جميع الفواتير والمخزون والعملاء والمصروفات بالكامل للبدء من الصفر بقاعدة بيانات فارغة ونظيفة.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('تحذير: هل أنت متأكد من تصفير ومسح جميع البيانات بالكامل؟ سيتم مسح الفواتير والمنتجات والعملاء والمصروفات نهائياً.')) {
                        clearAllData();
                        alert('تم تصفير جميع البيانات بنجاح وبدء قاعدة بيانات فارغة.');
                        onClose();
                      }
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-xs text-xs"
                  >
                    تصفير ومسح كافة البيانات (0)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل تريد استعادة البيانات التجريبية الافتراضية؟')) {
                        resetToDemoData();
                        alert('تمت استعادة البيانات التجريبية بنجاح.');
                        onClose();
                      }
                    }}
                    className="py-2.5 px-3 bg-white hover:bg-rose-100/70 text-rose-700 border border-rose-300 font-bold rounded-xl transition-all text-xs"
                  >
                    استعادة تجريبي
                  </button>
                </div>
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
            {activeTab !== 'backup' && activeTab !== 'employees' && (
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

      {/* Employee & Target Modal within Settings */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-gray-900">
                  {editingEmployee ? 'تعديل بيانات الموظف والمستهدف' : 'إضافة موظف ومستهدف جديد'}
                </h3>
              </div>
              <button 
                onClick={() => setIsEmployeeModalOpen(false)} 
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">اسم الموظف / البائع *:</label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.sellerName}
                    onChange={e => setEmployeeFormData({ ...employeeFormData, sellerName: e.target.value })}
                    placeholder="مثال: خالد علي"
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">المسمى الوظيفي:</label>
                  <select
                    value={employeeFormData.role}
                    onChange={e => setEmployeeFormData({ ...employeeFormData, role: e.target.value })}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-medium"
                  >
                    <option value="مندوب مبيعات">مندوب مبيعات</option>
                    <option value="كاشير">كاشير</option>
                    <option value="مسؤول توزيع وتوصيل">مسؤول توزيع وتوصيل</option>
                    <option value="مدير مبيعات">مدير مبيعات</option>
                    <option value="مشرف فرع">مشرف فرع</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">رقم الهاتف / الواتساب:</label>
                  <input
                    type="tel"
                    value={employeeFormData.phone}
                    onChange={e => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                    placeholder="05XXXXXXXX"
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">فترة التارجت:</label>
                  <select
                    value={employeeFormData.period}
                    onChange={e => setEmployeeFormData({ ...employeeFormData, period: e.target.value as any })}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-medium"
                  >
                    <option value="monthly">شهري</option>
                    <option value="weekly">أسبوعي</option>
                    <option value="daily">يومي</option>
                  </select>
                </div>
              </div>

              {/* Small Cartons Target */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>مستهدف كرتون صغير</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-600 text-[11px] font-bold block mb-1">الهدف المطلوب:</label>
                    <input
                      type="number"
                      min="0"
                      value={employeeFormData.targetSmallCartons || ''}
                      onChange={e => setEmployeeFormData({ ...employeeFormData, targetSmallCartons: Number(e.target.value) || 0 })}
                      placeholder="100"
                      className="w-full p-2 bg-white border border-blue-300 rounded-xl text-blue-900 font-black"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-[11px] font-bold block mb-1">المحقق الفعلي:</label>
                    <input
                      type="number"
                      min="0"
                      value={employeeFormData.achievedSmallCartons || ''}
                      onChange={e => setEmployeeFormData({ ...employeeFormData, achievedSmallCartons: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full p-2 bg-white border border-blue-300 rounded-xl text-gray-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Jumbo Cartons Target */}
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                  <Boxes className="w-3.5 h-3.5 text-purple-600" />
                  <span>مستهدف كرتون جامبو</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-600 text-[11px] font-bold block mb-1">الهدف المطلوب:</label>
                    <input
                      type="number"
                      min="0"
                      value={employeeFormData.targetJumboCartons || ''}
                      onChange={e => setEmployeeFormData({ ...employeeFormData, targetJumboCartons: Number(e.target.value) || 0 })}
                      placeholder="50"
                      className="w-full p-2 bg-white border border-purple-300 rounded-xl text-purple-900 font-black"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-[11px] font-bold block mb-1">المحقق الفعلي:</label>
                    <input
                      type="number"
                      min="0"
                      value={employeeFormData.achievedJumboCartons || ''}
                      onChange={e => setEmployeeFormData({ ...employeeFormData, achievedJumboCartons: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full p-2 bg-white border border-purple-300 rounded-xl text-gray-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">ملاحظات إضافية أو خط السير والتوزيع:</label>
                <input
                  type="text"
                  value={employeeFormData.notes}
                  onChange={e => setEmployeeFormData({ ...employeeFormData, notes: e.target.value })}
                  placeholder="اختياري..."
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-200 transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ بيانات الموظف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
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
