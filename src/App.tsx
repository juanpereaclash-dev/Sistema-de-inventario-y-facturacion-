import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Coins,
  History,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  INITIAL_CLIENTS,
  INITIAL_CURRENCIES,
  INITIAL_INVOICES,
  INITIAL_PRODUCTS,
  INITIAL_RATE_HISTORY,
  INITIAL_SUPPLIERS,
} from './data/initialPosData';
import {
  AppSection,
  CartItem,
  Client,
  CurrencyRate,
  Invoice,
  PaymentEntry,
  Product,
  RateHistoryEntry,
  Supplier,
  UserRole,
} from './types/pos';
import { PosView } from './components/PosView';
import { InventoryView } from './components/InventoryView';
import { CurrencyView } from './components/CurrencyView';
import { ContactsView } from './components/ContactsView';
import { ReportsView } from './components/ReportsView';
import { HistoryView } from './components/HistoryView';
import { InvoiceModal } from './components/InvoiceModal';

const STORAGE_KEY = 'comercio_pos_state_v1';

interface StoredState {
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  currencies: CurrencyRate[];
  activeCurrencyCode: string;
  rateHistory: RateHistoryEntry[];
  invoices: Invoice[];
}

function getFormattedTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export default function App() {
  const [role, setRole] = useState<UserRole>('admin');
  const [section, setSection] = useState<AppSection>('pos');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [state, setState] = useState<StoredState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial data
    }
    return {
      products: INITIAL_PRODUCTS,
      clients: INITIAL_CLIENTS,
      suppliers: INITIAL_SUPPLIERS,
      currencies: INITIAL_CURRENCIES,
      activeCurrencyCode: INITIAL_CURRENCIES[0].code,
      rateHistory: INITIAL_RATE_HISTORY,
      invoices: INITIAL_INVOICES,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [state]);

  const activeCurrency =
    state.currencies.find((c) => c.code === state.activeCurrencyCode) ??
    state.currencies[0];

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    if (
      nextRole === 'cashier' &&
      section !== 'pos' &&
      section !== 'history' &&
      section !== 'contacts'
    ) {
      setSection('pos');
    }
  };

  const handleResetDemo = () => {
    const fresh: StoredState = {
      products: INITIAL_PRODUCTS,
      clients: INITIAL_CLIENTS,
      suppliers: INITIAL_SUPPLIERS,
      currencies: INITIAL_CURRENCIES,
      activeCurrencyCode: INITIAL_CURRENCIES[0].code,
      rateHistory: INITIAL_RATE_HISTORY,
      invoices: INITIAL_INVOICES,
    };
    setState(fresh);
    setSection('pos');
  };

  const handleAddQuickClient = (clientData: Omit<Client, 'id'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      clients: [...prev.clients, newClient],
    }));
    return newClient;
  };

  const handleAddSupplier = (supData: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = {
      ...supData,
      id: `sup-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      suppliers: [...prev.suppliers, newSup],
    }));
  };

  const handleSaveProduct = (
    productData: Omit<Product, 'id'>,
    existingId?: string
  ) => {
    setState((prev) => {
      if (existingId) {
        return {
          ...prev,
          products: prev.products.map((p) =>
            p.id === existingId ? { ...productData, id: existingId } : p
          ),
        };
      }
      return {
        ...prev,
        products: [
          ...prev.products,
          { ...productData, id: `prod-${Date.now()}` },
        ],
      };
    });
  };

  const handleAdjustStock = (productId: string, delta: number) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId
          ? { ...p, stock: Math.max(0, p.stock + delta) }
          : p
      ),
    }));
  };

  const handleUpdateRate = (
    code: string,
    newRate: number,
    mode: CurrencyRate['mode']
  ) => {
    const ts = getFormattedTimestamp();
    setState((prev) => {
      const target = prev.currencies.find((c) => c.code === code);
      if (!target) return prev;
      const historyEntry: RateHistoryEntry = {
        id: `rh-${Date.now()}`,
        currencyCode: code,
        previousRate: target.rateToUsd,
        newRate,
        mode,
        updatedBy: role === 'admin' ? 'Administrador' : 'Cajero',
        timestamp: ts,
      };
      return {
        ...prev,
        currencies: prev.currencies.map((c) =>
          c.code === code
            ? { ...c, rateToUsd: newRate, mode, updatedAt: ts }
            : c
        ),
        rateHistory: [historyEntry, ...prev.rateHistory],
      };
    });
  };

  const handleAddCurrency = (currencyData: Omit<CurrencyRate, 'updatedAt'>) => {
    const ts = getFormattedTimestamp();
    setState((prev) => {
      if (prev.currencies.some((c) => c.code === currencyData.code)) {
        return prev;
      }
      return {
        ...prev,
        currencies: [
          ...prev.currencies,
          { ...currencyData, updatedAt: ts },
        ],
      };
    });
  };

  const handleEmitInvoice = ({
    client,
    items,
    taxRate,
    payments,
    currency,
  }: {
    client: Client;
    items: CartItem[];
    taxRate: number;
    payments: PaymentEntry[];
    currency: CurrencyRate;
  }) => {
    const subtotalUsd = Number(
      items.reduce((s, i) => s + i.unitPriceUsd * i.quantity, 0).toFixed(2)
    );
    const taxUsd = Number((subtotalUsd * taxRate).toFixed(2));
    const totalUsd = Number((subtotalUsd + taxUsd).toFixed(2));
    const totalLocal = Number((totalUsd * currency.rateToUsd).toFixed(2));
    const nextNum = 101 + state.invoices.length;
    const hasPendingRef = payments.some(
      (p) =>
        p.method === 'Transferencia / Ref.' || p.method === 'Biopago / Punto'
    );

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: `FAC-${String(nextNum).padStart(5, '0')}`,
      createdAt: getFormattedTimestamp(),
      cashierRole: role === 'admin' ? 'Administrador' : 'Cajero',
      clientId: client.id,
      clientName: client.name,
      clientDoc: client.docId,
      items,
      subtotalUsd,
      taxRate,
      taxUsd,
      totalUsd,
      exchangeRateUsed: currency.rateToUsd,
      localCurrencyCode: currency.code,
      localCurrencySymbol: currency.symbol,
      totalLocal,
      payments,
      reconciled: !hasPendingRef,
      status: 'Emitida',
    };

    setState((prev) => ({
      ...prev,
      products: prev.products.map((prod) => {
        const sold = items.find((i) => i.productId === prod.id);
        if (!sold) return prod;
        return {
          ...prod,
          stock: Math.max(0, prod.stock - sold.quantity),
        };
      }),
      invoices: [newInvoice, ...prev.invoices],
    }));

    setSelectedInvoice(newInvoice);
  };

  const handleToggleReconcile = (invoiceId: string) => {
    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, reconciled: !inv.reconciled } : inv
      ),
    }));
  };

  const handleVoidInvoice = (invoiceId: string) => {
    setState((prev) => {
      const target = prev.invoices.find((i) => i.id === invoiceId);
      if (!target || target.status === 'Anulada') return prev;
      return {
        ...prev,
        products: prev.products.map((prod) => {
          const item = target.items.find((i) => i.productId === prod.id);
          if (!item) return prod;
          return { ...prod, stock: prod.stock + item.quantity };
        }),
        invoices: prev.invoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: 'Anulada' } : inv
        ),
      };
    });
  };

  const navItems: {
    id: AppSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
  }[] = [
    { id: 'pos', label: 'Punto de Venta (POS)', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventario y Stock', icon: Package, adminOnly: true },
    { id: 'currencies', label: 'Tasas y Divisas', icon: Coins, adminOnly: true },
    { id: 'contacts', label: 'Clientes y Proveedores', icon: Users },
    { id: 'reports', label: 'Reportes y Ganancias', icon: BarChart3, adminOnly: true },
    { id: 'history', label: 'Historial y Conciliación', icon: History },
  ];

  const visibleNav = navItems.filter((n) => role === 'admin' || !n.adminOnly);
  const activeSectionLabel =
    navItems.find((n) => n.id === section)?.label ?? 'Punto de Venta';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F6F8FA] text-[#0F172A]">
      {/* Left Sidebar Navigation (260px) */}
      <aside className="lg:w-[260px] shrink-0 bg-[#0F2744] text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#0F2744]">
        <div className="p-5 space-y-6">
          <div>
            <p className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              ComercioPOS
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              Inventario y Facturación
            </p>
          </div>

          {/* Actor / Role Switcher */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-slate-300">
              Perfil de Actor Activo
            </p>
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/10 rounded-lg">
              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white text-[#0F2744]'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('cashier')}
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  role === 'cashier'
                    ? 'bg-white text-[#0F2744]'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Cajero
              </button>
            </div>
            <p className="text-[11px] text-slate-300/90 leading-snug pt-0.5">
              {role === 'admin'
                ? 'Acceso total a stock, tasas, proveedores y reportes.'
                : 'Acceso restringido a caja (POS), clientes e historial.'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#B48327] text-white'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-5 border-t border-white/10 space-y-3 text-xs">
          <div>
            <p className="text-slate-300">Tasa de Cambio Activa</p>
            <p className="font-mono-tabular font-semibold text-white mt-0.5">
              1 USD = {activeCurrency.symbol} {activeCurrency.rateToUsd.toFixed(2)}{' '}
              ({activeCurrency.code})
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetDemo}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar datos iniciales
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
            <span className="font-medium text-slate-900 whitespace-nowrap">
              Sistema Comercial
            </span>
            <span aria-hidden="true">/</span>
            <span className="truncate">{activeSectionLabel}</span>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <span className="font-mono-tabular text-slate-600 hidden sm:inline">
              1 USD = {activeCurrency.symbol} {activeCurrency.rateToUsd.toFixed(2)} ·{' '}
              {activeCurrency.mode}
            </span>
            {section !== 'pos' && (
              <button
                type="button"
                onClick={() => setSection('pos')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#173963] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ir a Caja (POS)
              </button>
            )}
          </div>
        </header>

        {/* Active Module Viewport */}
        <main className="flex-1 p-5 sm:p-6 max-w-[1360px] w-full mx-auto">
          {section === 'pos' && (
            <PosView
              products={state.products}
              clients={state.clients}
              currencies={state.currencies}
              activeCurrencyCode={state.activeCurrencyCode}
              onSelectCurrencyCode={(code) =>
                setState((prev) => ({ ...prev, activeCurrencyCode: code }))
              }
              onAddQuickClient={handleAddQuickClient}
              onEmitInvoice={handleEmitInvoice}
            />
          )}

          {section === 'inventory' && role === 'admin' && (
            <InventoryView
              products={state.products}
              suppliers={state.suppliers}
              activeCurrency={activeCurrency}
              onSaveProduct={handleSaveProduct}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {section === 'currencies' && role === 'admin' && (
            <CurrencyView
              currencies={state.currencies}
              activeCurrencyCode={state.activeCurrencyCode}
              history={state.rateHistory}
              onSelectActiveCurrency={(code) =>
                setState((prev) => ({ ...prev, activeCurrencyCode: code }))
              }
              onUpdateRate={handleUpdateRate}
              onAddCurrency={handleAddCurrency}
            />
          )}

          {section === 'contacts' && (
            <ContactsView
              clients={state.clients}
              suppliers={state.suppliers}
              canManageSuppliers={role === 'admin'}
              onAddClient={handleAddQuickClient}
              onAddSupplier={handleAddSupplier}
            />
          )}

          {section === 'reports' && role === 'admin' && (
            <ReportsView
              invoices={state.invoices}
              products={state.products}
              activeCurrency={activeCurrency}
            />
          )}

          {section === 'history' && (
            <HistoryView
              invoices={state.invoices}
              canVoid={role === 'admin'}
              onViewInvoice={(inv) => setSelectedInvoice(inv)}
              onToggleReconcile={handleToggleReconcile}
              onVoidInvoice={handleVoidInvoice}
            />
          )}
        </main>
      </div>

      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
