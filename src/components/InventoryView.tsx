import React, { useMemo, useState } from 'react';
import { PackagePlus, Pencil, Plus, Search, X } from 'lucide-react';
import { CurrencyRate, Product, Supplier } from '../types/pos';

interface InventoryViewProps {
  products: Product[];
  suppliers: Supplier[];
  activeCurrency: CurrencyRate;
  onSaveProduct: (product: Omit<Product, 'id'>, existingId?: string) => void;
  onAdjustStock: (productId: string, delta: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  suppliers,
  activeCurrency,
  onSaveProduct,
  onAdjustStock,
}) => {
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Víveres');
  const [costUsd, setCostUsd] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('10');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');

  const rate = activeCurrency?.rateToUsd || 1;

  const openCreate = () => {
    setEditingProduct(null);
    setSku('');
    setName('');
    setCategory('Víveres');
    setCostUsd('');
    setPriceUsd('');
    setStock('20');
    setMinStock('8');
    setSupplierId(suppliers[0]?.id || '');
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setCostUsd(String(p.costUsd));
    setPriceUsd(String(p.priceUsd));
    setStock(String(p.stock));
    setMinStock(String(p.minStock));
    setSupplierId(p.supplierId || suppliers[0]?.id || '');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;
    onSaveProduct(
      {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category: category.trim() || 'General',
        costUsd: Math.max(0, Number(costUsd) || 0),
        priceUsd: Math.max(0.01, Number(priceUsd) || 0),
        stock: Math.max(0, Math.round(Number(stock) || 0)),
        minStock: Math.max(0, Math.round(Number(minStock) || 0)),
        supplierId: supplierId || undefined,
      },
      editingProduct?.id
    );
    setShowForm(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      if (!matchQuery) return false;
      if (stockFilter === 'low') return p.stock > 0 && p.stock <= p.minStock;
      if (stockFilter === 'out') return p.stock <= 0;
      return true;
    });
  }, [products, search, stockFilter]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar SKU, producto o categoría..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stockFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stockFilter === 'low'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stock Bajo
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('out')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stockFilter === 'out'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agotados
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#173963] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <PackagePlus className="w-3.5 h-3.5" />
          Nuevo Producto
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {editingProduct ? `Editar: ${editingProduct.name}` : 'Registrar Producto en Inventario'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <label className="block">
              <span className="block text-slate-600 mb-1">Código SKU</span>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. VIV-010"
                className="w-full px-3 py-2 font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-slate-600 mb-1">Nombre del Producto</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Descripción comercial"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
              />
            </label>
            <label className="block">
              <span className="block text-slate-600 mb-1">Categoría</span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
              />
            </label>
            <label className="block">
              <span className="block text-slate-600 mb-1">Costo ($ USD)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={costUsd}
                onChange={(e) => setCostUsd(e.target.value)}
                className="w-full px-3 py-2 font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
              />
            </label>
            <label className="block">
              <span className="block text-slate-600 mb-1">Precio Venta ($ USD)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                className="w-full px-3 py-2 font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
              />
            </label>
            <label className="block">
              <span className="block text-slate-600 mb-1">Stock Actual</span>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
              />
            </label>
            <label className="block">
              <span className="block text-slate-600 mb-1">Stock Mínimo</span>
              <input
                type="number"
                min="0"
                required
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span>Proveedor:</span>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#173963] rounded-lg cursor-pointer"
            >
              {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
            </button>
          </div>
        </form>
      )}

      {/* High-Density Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Producto</th>
                <th className="py-2.5 px-4">Categoría</th>
                <th className="py-2.5 px-4 text-right">Stock</th>
                <th className="py-2.5 px-4 text-right">Costo ($)</th>
                <th className="py-2.5 px-4 text-right">Venta ($)</th>
                <th className="py-2.5 px-4 text-right">
                  Venta ({activeCurrency.code})
                </th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((p) => {
                const isOut = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= p.minStock;
                const statusText = isOut
                  ? 'Agotado'
                  : isLow
                  ? 'Stock bajo'
                  : 'Disponible';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono-tabular text-slate-500 whitespace-nowrap">
                      {p.sku}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {p.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{p.category}</td>
                    <td className="py-2.5 px-4 text-right font-mono-tabular font-semibold text-slate-900">
                      {p.stock}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-600">
                      ${p.costUsd.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-tabular font-medium text-slate-900">
                      ${p.priceUsd.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-tabular text-[#0F2744]">
                      {activeCurrency.symbol} {(p.priceUsd * rate).toFixed(2)}
                    </td>
                    <td
                      className={`py-2.5 px-4 font-medium whitespace-nowrap ${
                        isOut
                          ? 'text-red-700'
                          : isLow
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {statusText}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAdjustStock(p.id, 10)}
                          title="Ingresar +10 unidades"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          10
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          title="Editar producto"
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
