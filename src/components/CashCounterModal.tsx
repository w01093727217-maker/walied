import React, { useState } from 'react';
import { Banknote, X, RotateCcw, Plus, Minus } from 'lucide-react';

interface CashCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DenominationItem {
  id: string;
  value: number;
  label: string;
}

const DENOMINATIONS: DenominationItem[] = [
  { id: '200', value: 200, label: '200' },
  { id: '100', value: 100, label: '100' },
  { id: '50', value: 50, label: '50' },
  { id: '20', value: 20, label: '20' },
  { id: '10', value: 10, label: '10' },
  { id: '5', value: 5, label: '5' },
  { id: '1', value: 1, label: '1' },
  { id: '0.5', value: 0.5, label: '0.50' },
  { id: '0.25', value: 0.25, label: '0.25' },
];

export const CashCounterModal: React.FC<CashCounterModalProps> = ({ isOpen, onClose }) => {
  // Store counts in simple object state: { '200': 0, '100': 0, ... }
  const [counts, setCounts] = useState<{ [key: string]: number }>({});

  if (!isOpen) return null;

  const getCount = (id: string): number => {
    return counts[id] || 0;
  };

  const handleCountChange = (id: string, valueStr: string) => {
    const num = parseInt(valueStr, 10);
    const valid = isNaN(num) || num < 0 ? 0 : num;
    setCounts(prev => ({ ...prev, [id]: valid }));
  };

  const handleIncrement = (id: string, delta: number) => {
    setCounts(prev => {
      const current = prev[id] || 0;
      const nextVal = Math.max(0, current + delta);
      return { ...prev, [id]: nextVal };
    });
  };

  const handleReset = () => {
    setCounts({});
  };

  // Calculate total
  const totalSum = DENOMINATIONS.reduce((sum, item) => {
    const count = counts[item.id] || 0;
    return sum + item.value * count;
  }, 0);

  const totalPieces = DENOMINATIONS.reduce((sum, item) => {
    return sum + (counts[item.id] || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white border border-gray-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
              <Banknote className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">عد النقدية</h3>
              <p className="text-[11px] text-teal-100 font-medium">
                حساب وتجميع فئات النقود
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table - Exact layout like the image */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="border-2 border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="font-black text-base border-b-2 border-gray-800">
                  {/* Column 1: فئة (Blue) */}
                  <th className="py-2.5 px-3 bg-[#cfe2f3] text-gray-900 border-l-2 border-gray-800 w-1/3">
                    فئة
                  </th>
                  {/* Column 2: عدد (Yellow) */}
                  <th className="py-2.5 px-3 bg-[#ffe599] text-gray-900 border-l-2 border-gray-800 w-1/3">
                    عدد
                  </th>
                  {/* Column 3: اجمالى (Green) */}
                  <th className="py-2.5 px-3 bg-[#d9ead3] text-gray-900 w-1/3">
                    اجمالى
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-800 font-bold text-base">
                {DENOMINATIONS.map((item) => {
                  const count = getCount(item.id);
                  const subtotal = item.value * count;
                  return (
                    <tr key={item.id} className="border-b-2 border-gray-800">
                      {/* فئة */}
                      <td className="py-2 px-2 bg-[#cfe2f3] text-gray-950 font-black text-lg border-l-2 border-gray-800">
                        {item.label}
                      </td>

                      {/* عدد */}
                      <td className="py-2 px-2 bg-[#ffe599] border-l-2 border-gray-800">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleIncrement(item.id, -1)}
                            disabled={count <= 0}
                            className="w-6 h-6 rounded bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center font-bold disabled:opacity-30"
                          >
                            <Minus className="w-3 h-3 stroke-[3]" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={count === 0 ? '' : count}
                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                            placeholder="0"
                            className="w-14 py-1 text-center font-black text-lg text-gray-950 bg-white border border-gray-400 rounded outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleIncrement(item.id, 1)}
                            className="w-6 h-6 rounded bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>
                      </td>

                      {/* اجمالى */}
                      <td className="py-2 px-2 bg-[#d9ead3] text-gray-950 font-black text-lg">
                        {subtotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}

                {/* Footer Row matching the image */}
                <tr className="border-t-2 border-gray-800 bg-white">
                  <td className="py-3 px-3 text-center text-gray-950 font-black text-lg border-l-2 border-gray-800">
                    اجمالى
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-emerald-800 font-black text-2xl bg-white">
                    {totalSum.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-center text-xs font-bold text-gray-500">
            عدد الأوراق / القطع: <span className="text-gray-900 font-black">{totalPieces}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>تصفير العداد</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all shadow-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
