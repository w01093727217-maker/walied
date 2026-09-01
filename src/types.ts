export type CurrencyCode = 'EGP' | 'SAR' | 'AED' | 'USD' | 'KWD' | 'QAR' | 'BHD' | 'OMR' | 'JOD' | 'IQD' | 'DZD' | 'MAD' | 'TRY';

export interface StoreSettings {
  storeName: string;
  activityType: string;
  phone: string;
  taxNumber: string;
  commercialRegister: string;
  address: string;
  currency: CurrencyCode;
  currencySymbol: string;
  taxRate: number; // e.g. 15 for 15% VAT, 14 for 14%, 0 for none
  enableTax: boolean;
  receiptFooter: string;
  invoicePrefix: string;
  logoUrl?: string;
  autoDeductStock: boolean;
  allowNegativeStock: boolean;
}

export type ProductUnit = 'قطعة' | 'علبة' | 'كرتونة' | 'كرتونة صغيرة' | 'كرتونة جامبو' | 'كجم' | 'جرام' | 'متر' | 'ساعة' | 'خدمة' | 'طقم' | 'لتر';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  unit: ProductUnit;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
}

export type ContactType = 'customer' | 'supplier';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  type: ContactType;
  balance: number; // positive = owes us (debt), negative = we owe them / credit
  creditLimit?: number;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  barcode?: string;
  unit: ProductUnit;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number; // in percentage or fixed amount
  total: number;
  imageUrl?: string;
}

export type InvoiceType = 'sale' | 'purchase' | 'return';
export type PaymentMethod = 'cash' | 'credit' | 'card' | 'bank_transfer' | 'multiple';
export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'returned';

export interface SellerTarget {
  id: string;
  sellerName: string;
  role?: string;               // المسمى الوظيفي: مندوب مبيعات، كاشير، مسؤول توزيع
  phone?: string;              // هاتف / واتساب الموظف
  email?: string;
  totalTargetCartons?: number;  // إجمالي الهدف الكلي بالكرتون (مثال: 1500 كرتونة)
  targetSmallCartons: number;   // هدف كراتين صغير (باقي الهدف: 1250 كرتونة)
  achievedSmallCartons: number; // محقق كراتين صغير
  targetJumboCartons: number;   // هدف كراتين جامبو (منهم: 250 كرتونة)
  achievedJumboCartons: number; // محقق كراتين جامبو
  targetAmount?: number;
  achievedAmount?: number;
  period: 'monthly' | 'weekly' | 'daily';
  notes?: string;
  createdAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  date: string;
  time: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxRate: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  remainingDebt: number;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  notes?: string;
  cashierName?: string;
}

export type ExpenseCategory = 'rent' | 'salary' | 'utilities' | 'inventory' | 'maintenance' | 'marketing' | 'hospitality' | 'tax' | 'other';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  type: 'collection' | 'payment'; // collection = تحصيل من عميل, payment = سداد لمورد
  notes?: string;
}

export interface EmployeeLoan {
  id: string;
  employeeId?: string;
  employeeName: string;
  amount: number;         // قيمة السلفة المنصرفة
  paidAmount: number;     // المبلغ المسدد
  remainingAmount: number;// المتبقي
  date: string;           // تاريخ السلفة
  dueDate?: string;       // تاريخ الاستحقاق المتوقع
  type: 'loan' | 'advance'; // سلفة راتب / عهدة مؤقتة
  status: 'active' | 'settled'; // نشطة / مسددة بالكامل
  notes?: string;
  createdAt: string;
}

export type TabType = 'dashboard' | 'pos' | 'invoices' | 'customers' | 'debts' | 'loans' | 'inventory' | 'expenses' | 'reports';
