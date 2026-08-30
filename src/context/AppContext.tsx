import React, { createContext, useContext, useEffect, useState } from 'react';
import { Customer, Expense, Invoice, PaymentRecord, Product, StoreSettings, TabType } from '../types';
import { initialCustomers, initialExpenses, initialInvoices, initialPayments, initialProducts, initialSettings } from '../data/initialData';
import { getCurrentTimeString, getTodayDateString, playSuccessSound } from '../utils/helpers';

interface AppContextType {
  settings: StoreSettings;
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  expenses: Expense[];
  payments: PaymentRecord[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedInvoiceForPrint: Invoice | null;
  setSelectedInvoiceForPrint: (invoice: Invoice | null) => void;
  showPrintModal: boolean;
  setShowPrintModal: (show: boolean) => void;
  showQuickCalc: boolean;
  setShowQuickCalc: (show: boolean) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  
  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
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
  
  // Settings & System
  updateSettings: (settings: StoreSettings) => void;
  resetToDemoData: () => void;
  restoreBackup: (data: any) => boolean;

  // Computed summary metrics
  todaySales: number;
  todayProfit: number;
  todayInvoicesCount: number;
  totalCustomerDebts: number;
  totalSupplierDebts: number;
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

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showQuickCalc, setShowQuickCalc] = useState<boolean>(false);
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

    playSuccessSound();
    return newInvoice;
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

    // 3. Mark invoice as returned
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

  const resetToDemoData = () => {
    setSettings(initialSettings);
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setInvoices(initialInvoices);
    setExpenses(initialExpenses);
    setPayments(initialPayments);
  };

  const restoreBackup = (data: any): boolean => {
    try {
      if (data.settings) setSettings(data.settings);
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.customers)) setCustomers(data.customers);
      if (Array.isArray(data.invoices)) setInvoices(data.invoices);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.payments)) setPayments(data.payments);
      return true;
    } catch {
      return false;
    }
  };

  // Computed metrics
  const todayStr = getTodayDateString();
  const todayInvoices = invoices.filter(inv => inv.date === todayStr && inv.status !== 'returned');
  
  const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const todayInvoicesCount = todayInvoices.length;

  // Calculate today's cost of goods sold
  const todayCostOfGoods = todayInvoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
  }, 0);

  const todayExpensesSum = expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const todayProfit = todaySales - todayCostOfGoods - todayExpensesSum;

  const totalCustomerDebts = customers
    .filter(c => c.type === 'customer' && c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  const totalSupplierDebts = customers
    .filter(c => c.type === 'supplier' && c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

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
        activeTab,
        setActiveTab,
        selectedInvoiceForPrint,
        setSelectedInvoiceForPrint,
        showPrintModal,
        setShowPrintModal,
        showQuickCalc,
        setShowQuickCalc,
        showSettingsModal,
        setShowSettingsModal,
        addInvoice,
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
        updateSettings,
        resetToDemoData,
        restoreBackup,
        todaySales,
        todayProfit,
        todayInvoicesCount,
        totalCustomerDebts,
        totalSupplierDebts,
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
