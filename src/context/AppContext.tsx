import React, { createContext, useContext, useEffect, useState } from 'react';
import { Customer, EmployeeLoan, Expense, Invoice, PaymentRecord, Product, SellerTarget, StoreSettings, TabType } from '../types';
import { initialCustomers, initialEmployeeLoans, initialExpenses, initialInvoices, initialPayments, initialProducts, initialSellerTargets, initialSettings } from '../data/initialData';
import { getCurrentTimeString, getTodayDateString, playSuccessSound } from '../utils/helpers';

interface AppContextType {
  settings: StoreSettings;
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  expenses: Expense[];
  payments: PaymentRecord[];
  sellerTargets: SellerTarget[];
  employeeLoans: EmployeeLoan[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedInvoiceForPrint: Invoice | null;
  setSelectedInvoiceForPrint: (invoice: Invoice | null) => void;
  showPrintModal: boolean;
  setShowPrintModal: (show: boolean) => void;
  showQuickCalc: boolean;
  setShowQuickCalc: (show: boolean) => void;
  showCashCounter: boolean;
  setShowCashCounter: (show: boolean) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  
  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
  addPurchaseInvoice: (purchaseData: {
    invoiceNumber: string;
    supplierId?: string;
    supplierName: string;
    supplierPhone?: string;
    supplierAddress?: string;
    date: string;
    time: string;
    items: {
      productId: string;
      productName: string;
      barcode?: string;
      unit: any;
      quantity: number;
      unitPrice: number; // cost price
      costPrice: number;
      sellingPrice?: number;
      discount: number;
      total: number;
    }[];
    subtotal: number;
    taxRate: number;
    taxTotal: number;
    grandTotal: number;
    paidAmount: number;
    remainingDebt: number;
    paymentMethod: any;
    notes?: string;
  }) => Invoice;
  updateInvoice: (invoice: Invoice) => void;
  returnInvoice: (invoiceId: string) => void;
  deleteInvoice: (invoiceId: string) => void;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, deltaQuantity: number) => void;
  
  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: 'cash' | 'card' | 'bank_transfer', notes?: string) => void;
  
  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Seller Targets actions
  addSellerTarget: (target: Omit<SellerTarget, 'id'>) => void;
  updateSellerTarget: (target: SellerTarget) => void;
  deleteSellerTarget: (id: string) => void;

  // Employee Loans / Advances actions (سلف ومستحقات الموظفين)
  addEmployeeLoan: (loan: {
    employeeName: string;
    employeeId?: string;
    amount: number;
    paidAmount?: number;
    date: string;
    dueDate?: string;
    type: 'loan' | 'advance';
    notes?: string;
  }) => { success: boolean; error?: string };
  repayEmployeeLoan: (loanId: string, amount: number, paymentMethod?: 'cash' | 'card' | 'bank_transfer', notes?: string) => void;
  deleteEmployeeLoan: (id: string) => void;
  
  // Settings & System
  updateSettings: (settings: StoreSettings) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  restoreBackup: (data: any) => boolean;

  // Computed summary metrics
  currentMonth: string;
  todaySales: number;
  todayProfit: number;
  todayInvoicesCount: number;
  monthSales: number;
  monthInvoicePaid: number;
  monthDebtCollections: number;
  monthTotalCollections: number;
  monthRemainingDebt: number;
  monthExpenses: number;
  monthProfit: number;
  monthInvoicesCount: number;
  totalPaidFromInvoices: number;
  totalCustomerDebts: number;
  totalSupplierDebts: number;
  totalEmployeeLoans: number;
  totalReceivables: number;
  totalPayables: number;
  netDebtBalance: number;
  totalCollections: number;
  totalDisbursedLoans: number;
  availableCollectionsForLoans: number;
  lowStockProducts: Product[];
  cashInDrawer: number;
  totalInventoryCost: number;
  totalInventoryRetail: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SETTINGS: 'fatoura_settings_v1',
  PRODUCTS: 'fatoura_products_v1',
  CUSTOMERS: 'fatoura_customers_v1',
  INVOICES: 'fatoura_invoices_v1',
  EXPENSES: 'fatoura_expenses_v1',
  PAYMENTS: 'fatoura_payments_v1',
  SELLER_TARGETS: 'fatoura_seller_targets_v1',
  EMPLOYEE_LOANS: 'fatoura_employee_loans_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [sellerTargets, setSellerTargets] = useState<SellerTarget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELLER_TARGETS);
    return saved ? JSON.parse(saved) : initialSellerTargets;
  });

  const [employeeLoans, setEmployeeLoans] = useState<EmployeeLoan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_LOANS);
    return saved ? JSON.parse(saved) : initialEmployeeLoans;
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showQuickCalc, setShowQuickCalc] = useState<boolean>(false);
  const [showCashCounter, setShowCashCounter] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Sync to LocalStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELLER_TARGETS, JSON.stringify(sellerTargets));
  }, [sellerTargets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_LOANS, JSON.stringify(employeeLoans));
  }, [employeeLoans]);

  // Actions
  const addInvoice = (invoiceData: Omit<Invoice, 'id'>): Invoice => {
    const newId = `inv-${Date.now()}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: newId,
    };

    // 1. Add to invoices
    setInvoices(prev => [newInvoice, ...prev]);

    // 2. Deduct product inventory stock if enabled
    if (settings.autoDeductStock) {
      setProducts(prevProducts =>
        prevProducts.map(prod => {
          const item = newInvoice.items.find(i => i.productId === prod.id);
          if (item) {
            const updatedStock = prod.stock - item.quantity;
            return {
              ...prod,
              stock: settings.allowNegativeStock ? updatedStock : Math.max(0, updatedStock),
            };
          }
          return prod;
        })
      );
    }

    // 3. Update customer balance if debt exists
    if (newInvoice.customerId && newInvoice.remainingDebt > 0) {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === newInvoice.customerId) {
            return { ...c, balance: c.balance + newInvoice.remainingDebt };
          }
          return c;
        })
      );
    }

    // 4. Record payment if paid amount is present
    if (newInvoice.paidAmount > 0) {
      const newPayRecord: PaymentRecord = {
        id: `pay-${Date.now()}`,
        customerId: newInvoice.customerId || 'walk-in',
        customerName: newInvoice.customerName,
        invoiceId: newInvoice.id,
        amount: newInvoice.paidAmount,
        date: newInvoice.date,
        paymentMethod: newInvoice.paymentMethod === 'multiple' ? 'cash' : (newInvoice.paymentMethod as any),
        type: 'collection',
        notes: `دفعة فاتورة مبيعات ${newInvoice.invoiceNumber}`,
      };
      setPayments(prev => [newPayRecord, ...prev]);
    }

    // 5. Automatic Target Crediting for Carton Sales (ربط مبيعات الكرتونة الصغيرة والجامبو بمستهدف البائع)
    if (newInvoice.type === 'sale') {
      let smallCartonsSold = 0;
      let jumboCartonsSold = 0;

      newInvoice.items.forEach(item => {
        const u = (item.unit || '').trim();
        const pName = (item.productName || '').toLowerCase();
        
        if (u === 'كرتونة صغيرة' || u.includes('صغيرة') || pName.includes('كرتونة صغيرة') || pName.includes('كرتون صغير')) {
          smallCartonsSold += Number(item.quantity) || 0;
        } else if (u === 'كرتونة جامبو' || u.includes('جامبو') || pName.includes('كرتونة جامبو') || pName.includes('كرتون جامبو')) {
          jumboCartonsSold += Number(item.quantity) || 0;
        }
      });

      if (smallCartonsSold > 0 || jumboCartonsSold > 0) {
        setSellerTargets(prevTargets => {
          if (prevTargets.length === 0) return prevTargets;

          // Match by cashierName/sellerName or default to first target
          const targetIndex = prevTargets.findIndex(t => 
            newInvoice.cashierName && (t.sellerName.trim() === newInvoice.cashierName.trim() || t.id === newInvoice.cashierName)
          );

          const indexToUpdate = targetIndex > -1 ? targetIndex : 0;

          return prevTargets.map((target, idx) => {
            if (idx === indexToUpdate) {
              return {
                ...target,
                achievedSmallCartons: (target.achievedSmallCartons || 0) + smallCartonsSold,
                achievedJumboCartons: (target.achievedJumboCartons || 0) + jumboCartonsSold,
              };
            }
            return target;
          });
        });
      }
    }

    playSuccessSound();
    return newInvoice;
  };

  // Add Purchase Invoice (فاتورة شراء وتوريد بضاعة للمخزن)
  const addPurchaseInvoice = (purchaseData: {
    invoiceNumber: string;
    supplierId?: string;
    supplierName: string;
    supplierPhone?: string;
    supplierAddress?: string;
    date: string;
    time: string;
    items: {
      productId: string;
      productName: string;
      barcode?: string;
      unit: any;
      quantity: number;
      unitPrice: number;
      costPrice: number;
      sellingPrice?: number;
      discount: number;
      total: number;
    }[];
    subtotal: number;
    taxRate: number;
    taxTotal: number;
    grandTotal: number;
    paidAmount: number;
    remainingDebt: number;
    paymentMethod: any;
    notes?: string;
  }): Invoice => {
    const newId = `purch-${Date.now()}`;
    const newPurchaseInvoice: Invoice = {
      id: newId,
      invoiceNumber: purchaseData.invoiceNumber,
      type: 'purchase',
      customerId: purchaseData.supplierId,
      customerName: purchaseData.supplierName || 'مورد بضاعة',
      customerPhone: purchaseData.supplierPhone,
      customerAddress: purchaseData.supplierAddress,
      date: purchaseData.date,
      time: purchaseData.time,
      items: purchaseData.items,
      subtotal: purchaseData.subtotal,
      discountTotal: 0,
      taxRate: purchaseData.taxRate || 0,
      taxTotal: purchaseData.taxTotal || 0,
      grandTotal: purchaseData.grandTotal,
      paidAmount: purchaseData.paidAmount,
      remainingDebt: purchaseData.remainingDebt,
      paymentMethod: purchaseData.paymentMethod,
      status: purchaseData.remainingDebt === 0 ? 'paid' : (purchaseData.paidAmount > 0 ? 'partial' : 'unpaid'),
      notes: purchaseData.notes,
    };

    // 1. Add to invoices list
    setInvoices(prev => [newPurchaseInvoice, ...prev]);

    // 2. Increase stock of supplied products and update cost price
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const item = purchaseData.items.find(i => i.productId === prod.id);
        if (item) {
          return {
            ...prod,
            stock: prod.stock + item.quantity,
            costPrice: item.costPrice > 0 ? item.costPrice : prod.costPrice,
            sellingPrice: item.sellingPrice && item.sellingPrice > 0 ? item.sellingPrice : prod.sellingPrice,
          };
        }
        return prod;
      })
    );

    // 3. Update supplier balance if there is remaining debt (we owe supplier)
    if (purchaseData.supplierId && purchaseData.remainingDebt > 0) {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === purchaseData.supplierId) {
            // Negative balance means we owe the supplier
            return { ...c, balance: c.balance - purchaseData.remainingDebt };
          }
          return c;
        })
      );
    }

    // 4. Record expense / payment record for paid amount to supplier
    if (purchaseData.paidAmount > 0) {
      const payRecord: PaymentRecord = {
        id: `pay-purch-${Date.now()}`,
        customerId: purchaseData.supplierId || 'supplier',
        customerName: purchaseData.supplierName,
        invoiceId: newPurchaseInvoice.id,
        amount: purchaseData.paidAmount,
        date: purchaseData.date,
        paymentMethod: purchaseData.paymentMethod === 'multiple' ? 'cash' : purchaseData.paymentMethod,
        type: 'payment',
        notes: `سداد فاتورة شراء وتوريد ${purchaseData.invoiceNumber}`,
      };
      setPayments(prev => [payRecord, ...prev]);
    }

    playSuccessSound();
    return newPurchaseInvoice;
  };

  const updateInvoice = (updatedInvoice: Invoice) => {
    setInvoices(prev => {
      const oldInvoice = prev.find(i => i.id === updatedInvoice.id);
      if (oldInvoice) {
        // Adjust customer / supplier debt if balance changed
        const debtDiff = updatedInvoice.remainingDebt - oldInvoice.remainingDebt;
        if (debtDiff !== 0 && updatedInvoice.customerId) {
          setCustomers(custs =>
            custs.map(c => {
              if (c.id === updatedInvoice.customerId) {
                if (updatedInvoice.type === 'purchase') {
                  // For supplier: positive debtDiff means we owe more (reduce balance)
                  return { ...c, balance: c.balance - debtDiff };
                } else {
                  // For customer: positive debtDiff means customer owes more (increase balance)
                  return { ...c, balance: c.balance + debtDiff };
                }
              }
              return c;
            })
          );
        }
      }
      return prev.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv));
    });
    playSuccessSound();
  };

  const returnInvoice = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv || inv.status === 'returned') return;

    // 1. Restore stock
    if (settings.autoDeductStock) {
      setProducts(prevProducts =>
        prevProducts.map(prod => {
          const item = inv.items.find(i => i.productId === prod.id);
          if (item) {
            return { ...prod, stock: prod.stock + item.quantity };
          }
          return prod;
        })
      );
    }

    // 2. Adjust customer balance
    if (inv.customerId && inv.remainingDebt > 0) {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === inv.customerId) {
            return { ...c, balance: Math.max(0, c.balance - inv.remainingDebt) };
          }
          return c;
        })
      );
    }

    // 3. Revert seller target achieved cartons if applicable
    if (inv.type === 'sale') {
      let returnSmall = 0;
      let returnJumbo = 0;

      inv.items.forEach(item => {
        const u = (item.unit || '').trim();
        const pName = (item.productName || '').toLowerCase();
        if (u === 'كرتونة صغيرة' || u.includes('صغيرة') || pName.includes('كرتونة صغيرة') || pName.includes('كرتون صغير')) {
          returnSmall += Number(item.quantity) || 0;
        } else if (u === 'كرتونة جامبو' || u.includes('جامبو') || pName.includes('كرتونة جامبو') || pName.includes('كرتون جامبو')) {
          returnJumbo += Number(item.quantity) || 0;
        }
      });

      if (returnSmall > 0 || returnJumbo > 0) {
        setSellerTargets(prevTargets => {
          const targetIndex = prevTargets.findIndex(t => 
            inv.cashierName && (t.sellerName.trim() === inv.cashierName.trim() || t.id === inv.cashierName)
          );
          const indexToUpdate = targetIndex > -1 ? targetIndex : 0;

          return prevTargets.map((target, idx) => {
            if (idx === indexToUpdate) {
              return {
                ...target,
                achievedSmallCartons: Math.max(0, (target.achievedSmallCartons || 0) - returnSmall),
                achievedJumboCartons: Math.max(0, (target.achievedJumboCartons || 0) - returnJumbo),
              };
            }
            return target;
          });
        });
      }
    }

    // 4. Mark invoice as returned
    setInvoices(prev =>
      prev.map(i => (i.id === invoiceId ? { ...i, status: 'returned' } : i))
    );
  };

  const deleteInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.filter(i => i.id !== invoiceId));
  };

  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      createdAt: getTodayDateString(),
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const adjustStock = (id: string, deltaQuantity: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextStock = p.stock + deltaQuantity;
          return { ...p, stock: settings.allowNegativeStock ? nextStock : Math.max(0, nextStock) };
        }
        return p;
      })
    );
  };

  const addCustomer = (custData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      createdAt: getTodayDateString(),
    };
    setCustomers(prev => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (updated: Customer) => {
    setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const recordCustomerPayment = (
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'card' | 'bank_transfer',
    notes?: string
  ) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || amount <= 0) return;

    // Update customer balance
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          return { ...c, balance: c.balance - amount };
        }
        return c;
      })
    );

    // Record payment receipt
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      customerId,
      customerName: customer.name,
      amount,
      date: getTodayDateString(),
      paymentMethod,
      type: customer.type === 'supplier' ? 'payment' : 'collection',
      notes: notes || `سداد لحساب ${customer.name}`,
    };
    setPayments(prev => [newPayment, ...prev]);
    playSuccessSound();
  };

  const addExpense = (expData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
  };

  const addSellerTarget = (targetData: Omit<SellerTarget, 'id'>) => {
    const newTarget: SellerTarget = {
      ...targetData,
      id: `seller-${Date.now()}`,
    };
    setSellerTargets(prev => [...prev, newTarget]);
  };

  const updateSellerTarget = (updated: SellerTarget) => {
    setSellerTargets(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const deleteSellerTarget = (id: string) => {
    setSellerTargets(prev => prev.filter(s => s.id !== id));
  };

  const addEmployeeLoan = (loanData: {
    employeeName: string;
    employeeId?: string;
    amount: number;
    paidAmount?: number;
    date: string;
    dueDate?: string;
    type: 'loan' | 'advance';
    notes?: string;
  }): { success: boolean; error?: string } => {
    // Validate that there are available collections
    const currentTotalCollections = payments
      .filter(p => p.type === 'collection')
      .reduce((sum, p) => sum + p.amount, 0);

    const currentOutstandingLoans = employeeLoans
      .filter(l => l.status === 'active' || l.remainingAmount > 0)
      .reduce((sum, l) => sum + l.remainingAmount, 0);

    const currentAvailable = Math.max(0, currentTotalCollections - currentOutstandingLoans);

    if (currentAvailable <= 0) {
      return {
        success: false,
        error: `عذراً! لا يمكن صرف أي سلفة لعدم توفر رصيد تحصيلات متاح حالياً (التحصيلات المتاحة: 0 ${settings.currencySymbol}). يجب تسجيل وتحصيل دفعات أولاً.`,
      };
    }

    if (loanData.amount > currentAvailable) {
      return {
        success: false,
        error: `قيمة السلفة المطلوبة (${loanData.amount} ${settings.currencySymbol}) تتجاوز رصيد التحصيلات المتاح للصرف حالياً (${currentAvailable} ${settings.currencySymbol}).`,
      };
    }

    const paid = loanData.paidAmount || 0;
    const remaining = Math.max(0, loanData.amount - paid);
    const newLoan: EmployeeLoan = {
      id: `loan-${Date.now()}`,
      employeeName: loanData.employeeName.trim(),
      employeeId: loanData.employeeId,
      amount: loanData.amount,
      paidAmount: paid,
      remainingAmount: remaining,
      date: loanData.date || getTodayDateString(),
      dueDate: loanData.dueDate,
      type: loanData.type || 'loan',
      status: remaining <= 0 ? 'settled' : 'active',
      notes: loanData.notes,
      createdAt: getTodayDateString(),
    };
    setEmployeeLoans(prev => [newLoan, ...prev]);
    playSuccessSound();
    return { success: true };
  };

  const repayEmployeeLoan = (
    loanId: string,
    amount: number,
    paymentMethod: 'cash' | 'card' | 'bank_transfer' = 'cash',
    notes?: string
  ) => {
    if (amount <= 0) return;
    const targetLoan = employeeLoans.find(l => l.id === loanId);

    setEmployeeLoans(prev =>
      prev.map(loan => {
        if (loan.id === loanId) {
          const newPaid = (loan.paidAmount || 0) + amount;
          const newRemaining = Math.max(0, loan.amount - newPaid);
          return {
            ...loan,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newRemaining <= 0 ? 'settled' : 'active',
            notes: notes ? `${loan.notes ? loan.notes + ' | ' : ''}سداد: ${amount} (${notes})` : loan.notes,
          };
        }
        return loan;
      })
    );

    if (targetLoan) {
      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        customerId: loanId,
        customerName: `سداد سلفة: ${targetLoan.employeeName}`,
        amount,
        date: getTodayDateString(),
        paymentMethod,
        type: 'collection',
        notes: notes || `تحصيل قسط سلفة للموظف ${targetLoan.employeeName}`,
      };
      setPayments(prev => [newPayment, ...prev]);
    }

    playSuccessSound();
  };

  const deleteEmployeeLoan = (id: string) => {
    setEmployeeLoans(prev => prev.filter(l => l.id !== id));
  };

  const resetToDemoData = () => {
    setSettings(initialSettings);
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setInvoices(initialInvoices);
    setExpenses(initialExpenses);
    setPayments(initialPayments);
    setSellerTargets(initialSellerTargets);
    setEmployeeLoans(initialEmployeeLoans);
  };

  const clearAllData = () => {
    setProducts([]);
    setCustomers([]);
    setInvoices([]);
    setExpenses([]);
    setPayments([]);
    setSellerTargets([]);
    setEmployeeLoans([]);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.SELLER_TARGETS);
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEE_LOANS);
  };

  const restoreBackup = (data: any): boolean => {
    try {
      if (data.settings) setSettings(data.settings);
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.customers)) setCustomers(data.customers);
      if (Array.isArray(data.invoices)) setInvoices(data.invoices);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.payments)) setPayments(data.payments);
      if (Array.isArray(data.sellerTargets)) setSellerTargets(data.sellerTargets);
      if (Array.isArray(data.employeeLoans)) setEmployeeLoans(data.employeeLoans);
      return true;
    } catch {
      return false;
    }
  };

  // Computed metrics
  const todayStr = getTodayDateString();
  const currentMonth = todayStr.slice(0, 7);
  
  // Today's metrics
  const todayInvoices = invoices.filter(inv => inv.date === todayStr && inv.status !== 'returned' && inv.type === 'sale');
  const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const todayInvoicesCount = todayInvoices.length;

  const todayCostOfGoods = todayInvoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
  }, 0);

  const todayExpensesSum = expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const todayProfit = todaySales - todayCostOfGoods - todayExpensesSum;

  // Monthly Metrics (إجمالي الشهر الحالي - ربط المبالغ المحصلة مع المدفوع من الفواتير)
  const monthInvoices = invoices.filter(
    inv => inv.date.startsWith(currentMonth) && inv.status !== 'returned' && inv.type === 'sale'
  );
  const monthInvoicesCount = monthInvoices.length;
  const monthSales = monthInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  // إجمالي المدفوع مباشرة من ثمن الفواتير خلال الشهر
  const monthInvoicePaid = monthInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

  // المتبقي كديون على فواتير الشهر
  const monthRemainingDebt = monthInvoices.reduce((sum, inv) => sum + (inv.remainingDebt || 0), 0);

  // تحصيلات الديون وسداد السلفيات المستقلة خلال الشهر
  const monthDebtCollections = payments
    .filter(p => p.date.startsWith(currentMonth) && p.type === 'collection' && !p.invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);

  // إجمالي المبالغ المحصلة خلال الشهر (المدفوع من ثمن الفواتير + تحصيلات الديون وسندات القبض)
  const monthTotalCollections = monthInvoicePaid + monthDebtCollections;

  const monthCostOfGoods = monthInvoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
  }, 0);

  const monthExpenses = expenses
    .filter(e => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthProfit = monthSales - monthCostOfGoods - monthExpenses;

  // All-time Metrics (التحصيلات التراكمية)
  const totalPaidFromInvoices = invoices
    .filter(inv => inv.status !== 'returned' && inv.type === 'sale')
    .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

  const totalOtherCollections = payments
    .filter(p => p.type === 'collection' && !p.invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);

  // إجمالي المبالغ المحصلة الكلية
  const totalCollections = totalPaidFromInvoices + totalOtherCollections;

  const totalCustomerDebts = customers
    .filter(c => c.type === 'customer' && c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  const totalSupplierDebts = customers
    .filter(c => c.type === 'supplier' && c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const totalEmployeeLoans = employeeLoans
    .filter(l => l.status === 'active' || l.remainingAmount > 0)
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  const totalReceivables = totalCustomerDebts + totalEmployeeLoans;
  const totalPayables = totalSupplierDebts;
  const netDebtBalance = totalReceivables - totalPayables;

  const totalDisbursedLoans = employeeLoans.reduce((sum, l) => sum + l.amount, 0);

  const availableCollectionsForLoans = Math.max(0, totalCollections - totalEmployeeLoans);

  const lowStockProducts = products.filter(
    p => p.unit !== 'خدمة' && p.stock <= p.minStockAlert
  );

  // Cash in drawer = Cash sales today + Cash payments collected today - Cash expenses today
  const todayCashSales = todayInvoices
    .filter(inv => inv.paymentMethod === 'cash')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  const todayCashCollections = payments
    .filter(p => p.date === todayStr && p.paymentMethod === 'cash' && p.type === 'collection')
    .reduce((sum, p) => sum + p.amount, 0);

  const todayCashExpenses = expenses
    .filter(e => e.date === todayStr && e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const cashInDrawer = todayCashSales + todayCashCollections - todayCashExpenses;

  const totalInventoryCost = products
    .filter(p => p.unit !== 'خدمة')
    .reduce((sum, p) => sum + (p.costPrice * p.stock), 0);

  const totalInventoryRetail = products
    .filter(p => p.unit !== 'خدمة')
    .reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);

  return (
    <AppContext.Provider
      value={{
        settings,
        products,
        customers,
        invoices,
        expenses,
        payments,
        sellerTargets,
        employeeLoans,
        activeTab,
        setActiveTab,
        selectedInvoiceForPrint,
        setSelectedInvoiceForPrint,
        showPrintModal,
        setShowPrintModal,
        showQuickCalc,
        setShowQuickCalc,
        showCashCounter,
        setShowCashCounter,
        showSettingsModal,
        setShowSettingsModal,
        addInvoice,
        addPurchaseInvoice,
        updateInvoice,
        returnInvoice,
        deleteInvoice,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recordCustomerPayment,
        addExpense,
        deleteExpense,
        addSellerTarget,
        updateSellerTarget,
        deleteSellerTarget,
        addEmployeeLoan,
        repayEmployeeLoan,
        deleteEmployeeLoan,
        updateSettings,
        resetToDemoData,
        clearAllData,
        restoreBackup,
        currentMonth,
        todaySales,
        todayProfit,
        todayInvoicesCount,
        monthSales,
        monthInvoicePaid,
        monthDebtCollections,
        monthTotalCollections,
        monthRemainingDebt,
        monthExpenses,
        monthProfit,
        monthInvoicesCount,
        totalPaidFromInvoices,
        totalCustomerDebts,
        totalSupplierDebts,
        totalEmployeeLoans,
        totalReceivables,
        totalPayables,
        netDebtBalance,
        totalCollections,
        totalDisbursedLoans,
        availableCollectionsForLoans,
        lowStockProducts,
        cashInDrawer,
        totalInventoryCost,
        totalInventoryRetail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
