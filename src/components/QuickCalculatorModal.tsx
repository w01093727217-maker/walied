import React, { useState } from 'react';
import { Calculator, Banknote, X, Delete, RotateCcw } from 'lucide-react';
import { playHapticFeedback } from '../utils/helpers';
import { useApp } from '../context/AppContext';

interface QuickCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCalculatorModal: React.FC<QuickCalculatorModalProps> = ({ isOpen, onClose }) => {
  const { setShowCashCounter } = useApp();
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [clearOnNext, setClearOnNext] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    playHapticFeedback();
    if (display === '0' || clearOnNext) {
      setDisplay(digit);
      setClearOnNext(false);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleDecimal = () => {
    playHapticFeedback();
    if (clearOnNext) {
      setDisplay('0.');
      setClearOnNext(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOp = (op: string) => {
    playHapticFeedback();
    const current = parseFloat(display);
    if (prevValue === null) {
      setPrevValue(current);
    } else if (operation) {
      const result = calculate(prevValue, current, operation);
      setPrevValue(result);
      setDisplay(String(result));
    }
    setOperation(op);
    setClearOnNext(true);
  };

  const handleEquals = () => {
    playHapticFeedback();
    if (prevValue !== null && operation) {
      const current = parseFloat(display);
      const result = calculate(prevValue, current, operation);
      setDisplay(String(result));
      setPrevValue(null);
      setOperation(null);
      setClearOnNext(true);
    }
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleClear = () => {
    playHapticFeedback();
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setClearOnNext(false);
  };

  const handleBackspace = () => {
    playHapticFeedback();
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xs bg-white border border-gray-200 rounded-3xl p-4 shadow-2xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs text-gray-900">آلة حاسبة سريعة</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                setShowCashCounter(true);
              }}
              title="فتح عداد النقدية وجرد الفئات"
              className="p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg flex items-center gap-1 text-[11px] font-bold border border-teal-200"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>عد نقدية</span>
            </button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Display */}
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-left">
          <div className="text-[11px] text-gray-500 font-mono h-4">
            {prevValue !== null && operation ? `${prevValue} ${operation}` : ''}
          </div>
          <div className="text-2xl font-black font-mono text-blue-600 overflow-x-auto whitespace-nowrap">
            {display}
          </div>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-2 font-mono text-sm font-bold">
          <button onClick={handleClear} className="p-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all border border-rose-150">
            C
          </button>
          <button onClick={handleBackspace} className="p-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center border border-gray-200">
            <Delete className="w-4 h-4" />
          </button>
          <button onClick={() => handleOp('÷')} className={`p-3 rounded-xl border active:scale-95 transition-all ${operation === '÷' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}>
            ÷
          </button>
          <button onClick={() => handleOp('×')} className={`p-3 rounded-xl border active:scale-95 transition-all ${operation === '×' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}>
            ×
          </button>

          <button onClick={() => handleDigit('7')} className="p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">7</button>
          <button onClick={() => handleDigit('8')} className="p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">8</button>
          <button onClick={() => handleDigit('9')} className="p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">9</button>
          <button onClick={() => handleOp('-')} className={`p-3 rounded-xl border active:scale-95 transition-all ${operation === '-' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}>
            -
          </button>

          <button onClick={() => handleDigit('4')} className="p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">4</button>
          <button onClick={() => handleDigit('5')} className="p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">5</button>
          <button onClick={() => handleDigit('6')} className="p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">6</button>
          <button onClick={() => handleOp('+')} className={`p-3 rounded-xl border active:scale-95 transition-all ${operation === '+' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}>
            +
          </button>

          <button onClick={() => handleDigit('1')} className="p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">1</button>
          <button onClick={() => handleDigit('2')} className="p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">2</button>
          <button onClick={() => handleDigit('3')} className="p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">3</button>
          <button onClick={handleEquals} className="row-span-2 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-md shadow-blue-200 active:scale-95 transition-all flex items-center justify-center">
            =
          </button>

          <button onClick={() => handleDigit('0')} className="col-span-2 p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">0</button>
          <button onClick={handleDecimal} className="p-3 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs">.</button>
        </div>
      </div>
    </div>
  );
};
