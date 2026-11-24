export type UserRole = 'admin' | 'cashier';

export type AppSection =
  | 'pos'
  | 'inventory'
  | 'currencies'
  | 'contacts'
  | 'reports'
  | 'history';

export type PaymentMethod =
  | 'Efectivo USD'
  | 'Efectivo Local'
  | 'Biopago / Punto'
  | 'Transferencia / Ref.';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costUsd: number;
  priceUsd: number;
  stock: number;
  minStock: number;
  supplierId?: string;
}

export interface Client {
  id: string;
  docId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Supplier {
  id: string;
  rif: string;
  name: string;
  contactName: string;
  phone: string;
  category: string;
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToUsd: number;
  mode: 'Tiempo Real (Oficial)' | 'Manual Referencia';
  updatedAt: string;
}

export interface RateHistoryEntry {
  id: string;
  currencyCode: string;
  previousRate: number;
  newRate: number;
  mode: string;
  updatedBy: string;
  timestamp: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  unitPriceUsd: number;
  unitCostUsd: number;
  quantity: number;
}

export interface PaymentEntry {
  id: string;
  method: PaymentMethod;
  currency: 'USD' | 'LOCAL';
  amountOriginal: number;
  amountUsd: number;
  reference?: string;
}

export interface Invoice {
  id: string;
  number: string;
  createdAt: string;
  cashierRole: string;
  clientId: string;
  clientName: string;
  clientDoc: string;
  items: CartItem[];
  subtotalUsd: number;
  taxRate: number;
  taxUsd: number;
  totalUsd: number;
  exchangeRateUsed: number;
  localCurrencyCode: string;
  localCurrencySymbol: string;
  totalLocal: number;
  payments: PaymentEntry[];
  reconciled: boolean;
  status: 'Emitida' | 'Anulada';
}
