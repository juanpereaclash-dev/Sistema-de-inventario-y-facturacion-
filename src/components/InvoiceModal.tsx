import React from 'react';
import { Printer, X } from 'lucide-react';
import { Invoice } from '../types/pos';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  onClose,
}) => {
  if (!invoice) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F172A]/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden shadow-lg">
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <h3 id="invoice-modal-title" className="text-sm font-semibold text-slate-900">
            Comprobante de Factura · {invoice.number}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0F2744] hover:bg-[#173963] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar factura"
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-700">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <p className="text-base font-bold text-[#0F2744]">ComercioPOS</p>
              <p className="text-slate-500 mt-0.5">
                Sistema de Inventario y Facturación
              </p>
              <p className="text-slate-500">Emisor: {invoice.cashierRole}</p>
            </div>
            <div className="text-right font-mono-tabular">
              <p className="text-sm font-semibold text-slate-900">
                {invoice.number}
              </p>
              <p className="text-slate-500 mt-0.5">{invoice.createdAt}</p>
              <p className="text-slate-500">
                Estado: {invoice.status}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Cliente</p>
              <p className="text-sm font-semibold text-slate-900">
                {invoice.clientName}
              </p>
              <p className="font-mono-tabular text-slate-500">
                Doc / RIF: {invoice.clientDoc}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium text-slate-500">
                Tasa Aplicada
              </p>
              <p className="font-mono-tabular font-medium text-slate-900">
                1 USD = {invoice.localCurrencySymbol} {invoice.exchangeRateUsed.toFixed(2)}
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                <th className="py-2">Producto</th>
                <th className="py-2 text-right">Cant.</th>
                <th className="py-2 text-right">P. Unit</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.productId}>
                  <td className="py-2 pr-2">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="font-mono-tabular text-[11px] text-slate-400">
                      {item.sku}
                    </p>
                  </td>
                  <td className="py-2 text-right font-mono-tabular">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right font-mono-tabular">
                    ${item.unitPriceUsd.toFixed(2)}
                  </td>
                  <td className="py-2 text-right font-mono-tabular font-medium text-slate-900">
                    ${(item.unitPriceUsd * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-3 border-t border-slate-200 space-y-1.5 font-mono-tabular">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal USD</span>
              <span>${invoice.subtotalUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA ({Math.round(invoice.taxRate * 100)}%)</span>
              <span>${invoice.taxUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total USD</span>
              <span>${invoice.totalUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-[#0F2744]">
              <span>Total {invoice.localCurrencyCode}</span>
              <span>
                {invoice.localCurrencySymbol} {invoice.totalLocal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <p className="text-[11px] font-medium text-slate-500 mb-2">
              Desglose de Cobro ({invoice.reconciled ? 'Conciliado' : 'Pendiente por conciliar ref.'})
            </p>
            <div className="space-y-1">
              {invoice.payments.map((pay) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-md"
                >
                  <span>
                    {pay.method}
                    {pay.reference ? ` · Ref: ${pay.reference}` : ''}
                  </span>
                  <span className="font-mono-tabular font-medium text-slate-900">
                    {pay.currency === 'USD'
                      ? `$${pay.amountOriginal.toFixed(2)}`
                      : `${invoice.localCurrencySymbol} ${pay.amountOriginal.toFixed(2)} ($${pay.amountUsd.toFixed(2)})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
