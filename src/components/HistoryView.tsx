import React, { useMemo, useState } from 'react';
import { Check, Eye, Search, XCircle } from 'lucide-react';
import { Invoice } from '../types/pos';

interface HistoryViewProps {
  invoices: Invoice[];
  canVoid: boolean;
  onViewInvoice: (invoice: Invoice) => void;
  onToggleReconcile: (invoiceId: string) => void;
  onVoidInvoice: (invoiceId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  invoices,
  canVoid,
  onViewInvoice,
  onToggleReconcile,
  onVoidInvoice,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'reconciled'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchQuery =
        !q ||
        inv.number.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.payments.some((p) =>
          (p.reference || '').toLowerCase().includes(q)
        );
      if (!matchQuery) return false;
      if (filter === 'pending') return !inv.reconciled && inv.status === 'Emitida';
      if (filter === 'reconciled') return inv.reconciled;
      return true;
    });
  }, [invoices, search, filter]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar factura, cliente o nro. referencia..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Por Conciliar
          </button>
          <button
            type="button"
            onClick={() => setFilter('reconciled')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'reconciled'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Conciliadas
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                <th className="py-2.5 px-4">Factura</th>
                <th className="py-2.5 px-4">Fecha / Emisor</th>
                <th className="py-2.5 px-4">Cliente</th>
                <th className="py-2.5 px-4">Pagos Mixtos y Referencias</th>
                <th className="py-2.5 px-4 text-right">Total USD</th>
                <th className="py-2.5 px-4 text-right">Total Local</th>
                <th className="py-2.5 px-4">Conciliación</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  className={inv.status === 'Anulada' ? 'opacity-55' : 'hover:bg-slate-50/80'}
                >
                  <td className="py-3 px-4 font-mono-tabular font-semibold text-slate-900 whitespace-nowrap">
                    {inv.number}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    <p className="font-mono-tabular">{inv.createdAt}</p>
                    <p className="text-[11px] text-slate-400">{inv.cashierRole}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{inv.clientName}</p>
                    <p className="font-mono-tabular text-[11px] text-slate-500">
                      {inv.clientDoc}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {inv.payments.map((p) => (
                      <div key={p.id} className="text-[11px]">
                        {p.method}
                        {p.reference ? ` (${p.reference})` : ''}
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-tabular font-semibold text-slate-900 whitespace-nowrap">
                    ${inv.totalUsd.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-tabular text-[#0F2744] whitespace-nowrap">
                    {inv.localCurrencySymbol} {inv.totalLocal.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {inv.status === 'Anulada' ? (
                      <span className="font-medium text-red-700">Anulada</span>
                    ) : inv.reconciled ? (
                      <span className="font-medium text-emerald-700">
                        Conciliado
                      </span>
                    ) : (
                      <span className="font-medium text-amber-700">
                        Pendiente ref.
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewInvoice(inv)}
                        title="Ver e imprimir factura"
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {inv.status === 'Emitida' && (
                        <button
                          type="button"
                          onClick={() => onToggleReconcile(inv.id)}
                          title={
                            inv.reconciled
                              ? 'Marcar como pendiente'
                              : 'Conciliar pago mixto'
                          }
                          className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded cursor-pointer ${
                            inv.reconciled
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          {inv.reconciled ? 'Verificado' : 'Conciliar'}
                        </button>
                      )}

                      {canVoid && inv.status === 'Emitida' && (
                        <button
                          type="button"
                          onClick={() => onVoidInvoice(inv.id)}
                          title="Anular factura y devolver stock"
                          className="p-1.5 text-slate-400 hover:text-red-700 rounded cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
