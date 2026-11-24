import React from 'react';
import { CurrencyRate, Invoice, PaymentMethod, Product } from '../types/pos';

interface ReportsViewProps {
  invoices: Invoice[];
  products: Product[];
  activeCurrency: CurrencyRate;
}

const METHODS: PaymentMethod[] = [
  'Efectivo USD',
  'Efectivo Local',
  'Biopago / Punto',
  'Transferencia / Ref.',
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  products,
  activeCurrency,
}) => {
  const validInvoices = invoices.filter((i) => i.status === 'Emitida');
  const totalSalesUsd = validInvoices.reduce((s, i) => s + i.totalUsd, 0);
  const totalCostUsd = validInvoices.reduce(
    (s, i) =>
      s +
      i.items.reduce((is, item) => is + item.unitCostUsd * item.quantity, 0),
    0
  );
  const netProfitUsd = Math.max(0, totalSalesUsd - totalCostUsd);
  const avgTicketUsd =
    validInvoices.length > 0 ? totalSalesUsd / validInvoices.length : 0;

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  const methodTotals = METHODS.map((method) => {
    let usd = 0;
    let origLocal = 0;
    let count = 0;
    validInvoices.forEach((inv) => {
      inv.payments.forEach((p) => {
        if (p.method === method) {
          usd += p.amountUsd;
          if (p.currency === 'LOCAL') origLocal += p.amountOriginal;
          count += 1;
        }
      });
    });
    return { method, usd, origLocal, count };
  });

  const productSalesMap = new Map<
    string,
    { name: string; sku: string; qty: number; revenueUsd: number }
  >();
  validInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const prev = productSalesMap.get(item.productId);
      if (prev) {
        prev.qty += item.quantity;
        prev.revenueUsd += item.unitPriceUsd * item.quantity;
      } else {
        productSalesMap.set(item.productId, {
          name: item.name,
          sku: item.sku,
          qty: item.quantity,
          revenueUsd: item.unitPriceUsd * item.quantity,
        });
      }
    });
  });

  const topProducts = Array.from(productSalesMap.values()).sort(
    (a, b) => b.revenueUsd - a.revenueUsd
  );

  return (
    <div className="space-y-6">
      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 mb-1">Ventas Brutas Emitidas</p>
          <p className="text-2xl font-bold font-mono-tabular text-slate-900">
            ${totalSalesUsd.toFixed(2)}
          </p>
          <p className="text-xs font-mono-tabular text-[#0F2744] mt-1">
            {activeCurrency.symbol}{' '}
            {(totalSalesUsd * activeCurrency.rateToUsd).toFixed(2)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 mb-1">Ganancia Neta Estimada</p>
          <p className="text-2xl font-bold font-mono-tabular text-emerald-700">
            ${netProfitUsd.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Margen sobre ventas emitidas
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 mb-1">Ticket Promedio</p>
          <p className="text-2xl font-bold font-mono-tabular text-slate-900">
            ${avgTicketUsd.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {validInvoices.length} facturas emitidas
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 mb-1">Reposición Necesaria</p>
          <p
            className={`text-2xl font-bold font-mono-tabular ${
              lowStockProducts.length > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {lowStockProducts.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Productos en mínimo o agotados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cierre de Caja por Método */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">
              Cierre de Caja por Método de Pago
            </h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-medium text-slate-500">
                <th className="py-2.5 px-5">Método</th>
                <th className="py-2.5 px-4 text-right">Operaciones</th>
                <th className="py-2.5 px-5 text-right">Equivalente USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {methodTotals.map((row) => (
                <tr key={row.method}>
                  <td className="py-3 px-5 font-medium text-slate-900">
                    {row.method}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-tabular text-slate-600">
                    {row.count}
                  </td>
                  <td className="py-3 px-5 text-right font-mono-tabular font-semibold text-slate-900">
                    ${row.usd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">
              Productos Más Vendidos
            </h3>
          </div>
          {topProducts.length === 0 ? (
            <p className="p-6 text-xs text-slate-500">
              Aún no hay ventas registradas.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-5">Producto</th>
                  <th className="py-2.5 px-4 text-right">Unidades</th>
                  <th className="py-2.5 px-5 text-right">Ingresos USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {topProducts.slice(0, 6).map((row) => (
                  <tr key={row.sku}>
                    <td className="py-3 px-5">
                      <span className="font-medium text-slate-900">
                        {row.name}
                      </span>
                      <span className="ml-2 font-mono-tabular text-[11px] text-slate-400">
                        {row.sku}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular text-slate-600">
                      {row.qty}
                    </td>
                    <td className="py-3 px-5 text-right font-mono-tabular font-semibold text-slate-900">
                      ${row.revenueUsd.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Low Stock Restock Table */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">
              Alertas de Reposición de Inventario
            </h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-medium text-slate-500">
                <th className="py-2.5 px-5">SKU</th>
                <th className="py-2.5 px-4">Producto</th>
                <th className="py-2.5 px-4 text-right">Stock Actual</th>
                <th className="py-2.5 px-5 text-right">Stock Mínimo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {lowStockProducts.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 px-5 font-mono-tabular text-slate-500">
                    {p.sku}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {p.name}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-mono-tabular font-semibold ${
                      p.stock <= 0 ? 'text-red-700' : 'text-amber-700'
                    }`}
                  >
                    {p.stock}
                  </td>
                  <td className="py-2.5 px-5 text-right font-mono-tabular text-slate-600">
                    {p.minStock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
