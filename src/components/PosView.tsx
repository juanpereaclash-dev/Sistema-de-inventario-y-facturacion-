import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Minus,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  CartItem,
  Client,
  CurrencyRate,
  PaymentEntry,
  PaymentMethod,
  Product,
} from '../types/pos';

interface PosViewProps {
  products: Product[];
  clients: Client[];
  currencies: CurrencyRate[];
  activeCurrencyCode: string;
  onSelectCurrencyCode: (code: string) => void;
  onAddQuickClient: (client: Omit<Client, 'id'>) => Client;
  onEmitInvoice: (payload: {
    client: Client;
    items: CartItem[];
    taxRate: number;
    payments: PaymentEntry[];
    currency: CurrencyRate;
  }) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Efectivo USD',
  'Efectivo Local',
  'Biopago / Punto',
  'Transferencia / Ref.',
];

export const PosView: React.FC<PosViewProps> = ({
  products,
  clients,
  currencies,
  activeCurrencyCode,
  onSelectCurrencyCode,
  onAddQuickClient,
  onEmitInvoice,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients[0]?.id || 'cli-final'
  );
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientDoc, setQuickClientDoc] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [includeTax, setIncludeTax] = useState(true);

  const [payMethod, setPayMethod] = useState<PaymentMethod>('Efectivo USD');
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [posError, setPosError] = useState<string | null>(null);

  const activeCurrency =
    currencies.find((c) => c.code === activeCurrencyCode) ?? currencies[0];
  const rate = activeCurrency?.rateToUsd || 1;

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['Todos', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat =
        categoryFilter === 'Todos' || p.category === categoryFilter;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, search, categoryFilter]);

  const addToCart = (product: Product) => {
    setPosError(null);
    if (product.stock <= 0) {
      setPosError(`"${product.name}" está agotado en inventario.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setPosError(
            `Stock máximo disponible para "${product.name}": ${product.stock} unidades.`
          );
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          unitPriceUsd: product.priceUsd,
          unitCostUsd: product.costUsd,
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setPosError(null);
    const product = products.find((p) => p.id === productId);
    const maxStock = product?.stock ?? 999;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty > maxStock) {
            setPosError(`Stock disponible limitado a ${maxStock} unidades.`);
            return item;
          }
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotalUsd = cart.reduce(
    (sum, item) => sum + item.unitPriceUsd * item.quantity,
    0
  );
  const taxRate = includeTax ? 0.16 : 0;
  const taxUsd = Number((subtotalUsd * taxRate).toFixed(2));
  const totalUsd = Number((subtotalUsd + taxUsd).toFixed(2));
  const totalLocal = Number((totalUsd * rate).toFixed(2));

  const paidUsd = Number(
    payments.reduce((sum, p) => sum + p.amountUsd, 0).toFixed(2)
  );
  const remainingUsd = Number(Math.max(0, totalUsd - paidUsd).toFixed(2));
  const remainingLocal = Number((remainingUsd * rate).toFixed(2));
  const changeUsd = Number(Math.max(0, paidUsd - totalUsd).toFixed(2));

  const isLocalMethod = payMethod !== 'Efectivo USD';
  const needsReference =
    payMethod === 'Biopago / Punto' || payMethod === 'Transferencia / Ref.';

  const handleFillRemaining = () => {
    if (remainingUsd <= 0) return;
    setPayAmount(
      isLocalMethod ? remainingLocal.toFixed(2) : remainingUsd.toFixed(2)
    );
  };

  const handleAddPayment = () => {
    setPosError(null);
    if (cart.length === 0) {
      setPosError('Agrega al menos un producto al carrito antes de cobrar.');
      return;
    }
    const parsed = Number(payAmount);
    if (!parsed || parsed <= 0) {
      setPosError('Ingresa un monto de pago válido.');
      return;
    }
    if (needsReference && !payRef.trim()) {
      setPosError(`Ingresa el número de referencia para ${payMethod}.`);
      return;
    }
    const amountUsd = isLocalMethod
      ? Number((parsed / rate).toFixed(2))
      : Number(parsed.toFixed(2));

    setPayments((prev) => [
      ...prev,
      {
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        method: payMethod,
        currency: isLocalMethod ? 'LOCAL' : 'USD',
        amountOriginal: Number(parsed.toFixed(2)),
        amountUsd,
        reference: needsReference ? payRef.trim() : undefined,
      },
    ]);
    setPayAmount('');
    setPayRef('');
  };

  const handleQuickClientSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientName.trim() || !quickClientDoc.trim()) return;
    const created = onAddQuickClient({
      name: quickClientName.trim(),
      docId: quickClientDoc.trim(),
      phone: quickClientPhone.trim() || 'Sin teléfono',
      email: '',
      address: 'Registro rápido en caja',
    });
    setSelectedClientId(created.id);
    setQuickClientName('');
    setQuickClientDoc('');
    setQuickClientPhone('');
    setShowQuickClient(false);
  };

  const handleFinalizeSale = () => {
    setPosError(null);
    if (cart.length === 0) {
      setPosError('El carrito está vacío.');
      return;
    }
    if (paidUsd + 0.01 < totalUsd) {
      setPosError(
        `Faltan $${remainingUsd.toFixed(2)} (${activeCurrency.symbol} ${remainingLocal.toFixed(2)}) para cubrir el total.`
      );
      return;
    }
    const client =
      clients.find((c) => c.id === selectedClientId) ?? clients[0];

    onEmitInvoice({
      client,
      items: cart,
      taxRate,
      payments,
      currency: activeCurrency,
    });

    setCart([]);
    setPayments([]);
    setPayAmount('');
    setPayRef('');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left Column: Customer Selection + Product Catalog */}
      <div className="xl:col-span-7 space-y-5">
        {/* Step 1: Solicitud de Cliente */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                1. Solicitud de Cliente
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona el cliente para la factura o registra uno nuevo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickClient((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F2744] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {showQuickClient ? 'Cancelar' : 'Nuevo Cliente'}
            </button>
          </div>

          {showQuickClient ? (
            <form
              onSubmit={handleQuickClientSave}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100"
            >
              <input
                type="text"
                required
                placeholder="Nombre / Razón social"
                value={quickClientName}
                onChange={(e) => setQuickClientName(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
              />
              <input
                type="text"
                required
                placeholder="Cédula o RIF"
                value={quickClientDoc}
                onChange={(e) => setQuickClientDoc(e.target.value)}
                className="px-3 py-2 text-xs font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={quickClientPhone}
                  onChange={(e) => setQuickClientPhone(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#173963] rounded-lg cursor-pointer whitespace-nowrap"
                >
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.docId})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 2: Selección de Productos */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              2. Selección de Productos
            </h2>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const outOfStock = product.stock <= 0;
              const lowStock =
                product.stock > 0 && product.stock <= product.minStock;
              const priceLocal = (product.priceUsd * rate).toFixed(2);
              const inCartQty =
                cart.find((c) => c.productId === product.id)?.quantity || 0;

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => addToCart(product)}
                  className={`text-left p-3.5 rounded-lg border transition-colors flex flex-col justify-between gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    inCartQty > 0
                      ? 'border-[#0F2744] bg-[#0F2744]/[0.03]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-1">
                      <span className="font-mono-tabular">{product.sku}</span>
                      <span>{product.category}</span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-900 leading-snug">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-end justify-between gap-2">
                    <div className="font-mono-tabular">
                      <p className="text-sm font-bold text-slate-900">
                        ${product.priceUsd.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {activeCurrency.symbol} {priceLocal}
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-medium font-mono-tabular ${
                        outOfStock
                          ? 'text-red-700'
                          : lowStock
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {outOfStock
                        ? 'Agotado'
                        : `Stock: ${product.stock}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Carrito Dinámico + Tasa + Cobro Mixto */}
      <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5 sticky top-20">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              3. Carrito Dinámico y Cobro Asistido
            </h2>
            <p className="text-xs text-slate-500">
              Tasa ({activeCurrency.mode}):{' '}
              <span className="font-mono-tabular font-medium text-slate-900">
                1 USD = {activeCurrency.symbol} {rate.toFixed(2)}
              </span>
            </p>
          </div>

          <select
            aria-label="Moneda de conversión"
            value={activeCurrency.code}
            onChange={(e) => onSelectCurrencyCode(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        {cart.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
            <p className="text-xs text-slate-500">
              Haz clic en los productos de la izquierda para iniciar la venta.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">
                    {item.name}
                  </p>
                  <p className="font-mono-tabular text-[11px] text-slate-500">
                    ${item.unitPriceUsd.toFixed(2)} c/u · {activeCurrency.symbol}{' '}
                    {(item.unitPriceUsd * rate).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.productId, -1)}
                    aria-label="Reducir cantidad"
                    className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono-tabular font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.productId, 1)}
                    aria-label="Aumentar cantidad"
                    className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.productId, -item.quantity)}
                    aria-label="Eliminar del carrito"
                    className="p-1 text-slate-400 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTax}
                onChange={(e) => setIncludeTax(e.target.checked)}
                className="rounded border-slate-300"
              />
              Incluir IVA (16%)
            </label>
            <span className="font-mono-tabular text-slate-700">
              Subtotal: ${subtotalUsd.toFixed(2)}
            </span>
          </div>

          {includeTax && (
            <div className="flex justify-between text-slate-600 font-mono-tabular">
              <span>IVA (16%)</span>
              <span>${taxUsd.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
            <span className="text-sm font-semibold text-slate-900">
              Total a Cobrar
            </span>
            <div className="text-right font-mono-tabular">
              <p className="text-lg font-bold text-slate-900">
                ${totalUsd.toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-[#0F2744]">
                {activeCurrency.symbol} {totalLocal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Mixed Payments Builder */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900">
              4. Pago Mixto (Referencia / Biopago / Efectivo)
            </h3>
            {remainingUsd > 0 && (
              <button
                type="button"
                onClick={handleFillRemaining}
                className="text-[11px] font-medium text-[#0F2744] hover:underline cursor-pointer"
              >
                Completar restante
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={payMethod}
              onChange={(e) => {
                setPayMethod(e.target.value as PaymentMethod);
                setPayAmount('');
              }}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              min="0"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={
                isLocalMethod
                  ? `Monto (${activeCurrency.symbol})`
                  : 'Monto ($ USD)'
              }
              className="px-2.5 py-2 text-xs font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
            />
          </div>

          {needsReference && (
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="Nro. de referencia o lote Biopago (obligatorio)"
              className="w-full px-2.5 py-2 text-xs font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
            />
          )}

          <button
            type="button"
            onClick={handleAddPayment}
            className="w-full py-2 text-xs font-medium text-[#0F2744] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            + Agregar Abono al Pago
          </button>

          {payments.length > 0 && (
            <div className="space-y-1.5">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-50 rounded-md border border-slate-100"
                >
                  <span className="truncate pr-2">
                    {p.method}
                    {p.reference ? ` · ${p.reference}` : ''}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 font-mono-tabular">
                    <span>
                      {p.currency === 'USD'
                        ? `$${p.amountOriginal.toFixed(2)}`
                        : `${activeCurrency.symbol} ${p.amountOriginal.toFixed(2)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPayments((prev) => prev.filter((x) => x.id !== p.id))
                      }
                      className="text-slate-400 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-mono-tabular pt-1">
            <span className="text-slate-600">
              {changeUsd > 0 ? 'Vuelto / Cambio:' : 'Pendiente:'}
            </span>
            <span
              className={`font-semibold ${
                remainingUsd === 0 && cart.length > 0
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {changeUsd > 0
                ? `$${changeUsd.toFixed(2)} (${activeCurrency.symbol} ${(changeUsd * rate).toFixed(2)})`
                : `$${remainingUsd.toFixed(2)} (${activeCurrency.symbol} ${remainingLocal.toFixed(2)})`}
            </span>
          </div>
        </div>

        {posError && (
          <div
            role="alert"
            className="px-3 py-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg"
          >
            {posError}
          </div>
        )}

        <button
          type="button"
          onClick={handleFinalizeSale}
          disabled={cart.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#173963] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          Validar Pago, Emitir Factura y Descontar Stock
        </button>
      </div>
    </div>
  );
};
