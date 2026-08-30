import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  DollarSign, 
  Calendar, 
  Building, 
  UserCheck, 
  Zap, 
  ShoppingBag, 
  Wrench, 
  Megaphone, 
  Coffee, 
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory } from '../types';
import { formatMoney, getTodayDateString } from '../utils/helpers';

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    settings,
    addExpense,
    deleteExpense,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
    paymentMethod: 'cash' | 'card' | 'bank_transfer';
    notes: string;
  }>({
    title: '',
    category: 'utilities',
    amount: 0,
    date: getTodayDateString(),
    paymentMethod: 'cash',
    notes: '',
  });

  const categories: { id: ExpenseCategory; label: string; icon: any }[] = [
    { id: 'utilities', label: 'كهرباء ومرافق', icon: Zap },
    { id: 'rent', label: 'إيجار المحل', icon: Building },
    { id: 'salary', label: 'رواتب وعمالة', icon: UserCheck },
    { id: 'inventory', label: 'بضاعة وتوريدات', icon: ShoppingBag },
    { id: 'maintenance', label: 'صيانة وتشغيل', icon: Wrench },
    { id: 'marketing', label: 'تسويق وإعلانات', icon: Megaphone },
    { id: 'hospitality', label: 'ضيافة ونثريات', icon: Coffee },
    { id: 'tax', label: 'رسوم وضرائب', icon: FileText },
    { id: 'other', label: 'أخرى', icon: DollarSign },
  ];

  const todayStr = getTodayDateString();

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = selectedCategory === 'all' || e.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [expenses, searchTerm, selectedCategory]);

  const totalMonthExpenses = useMemo(() => {
    const currentMonth = todayStr.slice(0, 7);
    return expenses
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  const totalTodayExpenses = useMemo(() => {
    return expenses
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.amount <= 0) return;

    addExpense(formData);
    setIsFormOpen(false);
    setFormData({
      title: '',
      category: 'utilities',
      amount: 0,
      date: getTodayDateString(),
      paymentMethod: 'cash',
      notes: '',
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من حذف مصروف "${title}"؟`)) {
      deleteExpense(id);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-rose-600" />
            <span>سجل المصروفات والنفقات التشغيلية</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            تتبع النفقات والمصاريف الإدارية لحساب صافي الأرباح بدقة
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-200 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ تسجيل مصروف جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">مصروفات اليوم</span>
            <span className="text-lg sm:text-xl font-black text-rose-600 mt-1 block">
              {formatMoney(totalTodayExpenses, settings.currencySymbol)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block">مصروفات هذا الشهر</span>
            <span className="text-lg sm:text-xl font-black text-gray-900 mt-1 block">
              {formatMoney(totalMonthExpenses, settings.currencySymbol)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
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
            placeholder="بحث في المصروفات أو الملاحظات..."
            className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-rose-600 focus:bg-white transition-all"
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

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            الكل
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">لا توجد مصروفات مسجلة.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map(exp => {
            const cat = categories.find(c => c.id === exp.category) || categories[categories.length - 1];
            const Icon = cat.icon;

            return (
              <div
                key={exp.id}
                className="p-4 bg-white border border-gray-200 hover:border-rose-300 rounded-2xl shadow-xs flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{exp.title}</h3>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{exp.date}</span>
                      <span>• {cat.label}</span>
                      <span>• {exp.paymentMethod === 'cash' ? 'نقدي' : exp.paymentMethod === 'card' ? 'شبكة / مدى' : 'تحويل بنكي'}</span>
                      {exp.notes && <span className="text-gray-400">• {exp.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-rose-600">
                    -{formatMoney(exp.amount, settings.currencySymbol)}
                  </span>
                  <button
                    onClick={() => handleDelete(exp.id, exp.title)}
                    className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Expense Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">تسجيل مصروف جديد</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="text-gray-700 font-bold block mb-1">بيان / عنوان المصروف *:</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: فاتورة كهرباء، صيانة أجهزة، ضيافة..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">المبلغ *:</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.amount || ''}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-base font-bold text-rose-600 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">التصنيف:</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-rose-600 focus:bg-white font-medium"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">طريقة الدفع:</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-rose-600 focus:bg-white font-medium"
                  >
                    <option value="cash">نقدي (من الصندوق)</option>
                    <option value="card">بطاقة / مدى</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">التاريخ:</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-rose-600 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-200 active:scale-95 transition-all"
                >
                  حفظ المصروف
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
