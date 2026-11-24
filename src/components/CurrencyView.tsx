import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { CurrencyRate, RateHistoryEntry } from '../types/pos';

interface CurrencyViewProps {
  currencies: CurrencyRate[];
  activeCurrencyCode: string;
  history: RateHistoryEntry[];
  onSelectActiveCurrency: (code: string) => void;
  onUpdateRate: (
    code: string,
    newRate: number,
    mode: CurrencyRate['mode']
  ) => void;
  onAddCurrency: (currency: Omit<CurrencyRate, 'updatedAt'>) => void;
}

export const CurrencyView: React.FC<CurrencyViewProps> = ({
  currencies,
  activeCurrencyCode,
  history,
  onSelectActiveCurrency,
  onUpdateRate,
  onAddCurrency,
}) => {
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [editingModes, setEditingModes] = useState<
    Record<string, CurrencyRate['mode']>
  >({});

  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newRate, setNewRate] = useState('');
  const [calcUsd, setCalcUsd] = useState('10');

  const activeCurrency =
    currencies.find((c) => c.code === activeCurrencyCode) ?? currencies[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = Number(newRate);
    if (!newCode.trim() || !newName.trim() || !parsedRate || parsedRate <= 0) {
      return;
    }
    onAddCurrency({
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      symbol: newSymbol.trim() || newCode.trim().toUpperCase(),
      rateToUsd: parsedRate,
      mode: 'Manual Referencia',
    });
    setNewCode('');
    setNewName('');
    setNewSymbol('');
    setNewRate('');
  };

  return (
    <div className="space-y-6">
      {/* Currency Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {currencies.map((cur) => {
          const isActive = cur.code === activeCurrencyCode;
          const draftRate =
            editingRates[cur.code] ?? cur.rateToUsd.toFixed(2);
          const draftMode = editingModes[cur.code] ?? cur.mode;

          return (
            <div
              key={cur.code}
              className={`bg-white rounded-xl p-5 border space-y-4 ${
                isActive ? 'border-[#0F2744]' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono-tabular text-slate-500">
                    {cur.code} · {cur.mode}
                  </p>
                  <h3 className="text-base font-semibold text-slate-900">
                    {cur.name} ({cur.symbol})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Última actualización: {cur.updatedAt}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectActiveCurrency(cur.code)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0F2744] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isActive ? 'Divisa Activa en POS' : 'Usar en POS'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <label className="block">
                  <span className="block text-slate-500 mb-1">
                    Tasa (1 USD =)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={draftRate}
                    onChange={(e) =>
                      setEditingRates((prev) => ({
                        ...prev,
                        [cur.code]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
                  />
                </label>

                <label className="block">
                  <span className="block text-slate-500 mb-1">Modo de Tasa</span>
                  <select
                    value={draftMode}
                    onChange={(e) =>
                      setEditingModes((prev) => ({
                        ...prev,
                        [cur.code]: e.target.value as CurrencyRate['mode'],
                      }))
                    }
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
                  >
                    <option value="Tiempo Real (Oficial)">
                      Tiempo Real (Oficial)
                    </option>
                    <option value="Manual Referencia">Manual Referencia</option>
                  </select>
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      const val = Number(draftRate);
                      if (val > 0) {
                        onUpdateRate(cur.code, val, draftMode);
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#173963] rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Actualizar Tasa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Converter + Add Currency */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Calculadora Rápida de Conversión
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="block">
                <span className="block text-slate-500 mb-1">Monto en USD ($)</span>
                <input
                  type="number"
                  step="0.01"
                  value={calcUsd}
                  onChange={(e) => setCalcUsd(e.target.value)}
                  className="w-full px-3 py-2 font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg"
                />
              </label>
              <div>
                <span className="block text-slate-500 mb-1">
                  Equivalente ({activeCurrency.code})
                </span>
                <div className="px-3 py-2 font-mono-tabular font-semibold bg-slate-50 border border-slate-200 rounded-lg text-[#0F2744]">
                  {activeCurrency.symbol}{' '}
                  {((Number(calcUsd) || 0) * activeCurrency.rateToUsd).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleCreate}
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              Registrar Nueva Divisa
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <input
                type="text"
                required
                placeholder="Código (ej. COP)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="px-3 py-2 font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                required
                placeholder="Símbolo (ej. $)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                required
                placeholder="Nombre de moneda"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Tasa por 1 USD"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="px-3 py-2 font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#173963] rounded-lg cursor-pointer"
            >
              Agregar Divisa
            </button>
          </form>
        </div>

        {/* Rate Change Log */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">
              Historial de Cambios de Tasa
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-4">Fecha / Hora</th>
                  <th className="py-2.5 px-4">Divisa</th>
                  <th className="py-2.5 px-4 text-right">Anterior</th>
                  <th className="py-2.5 px-4 text-right">Nueva</th>
                  <th className="py-2.5 px-4">Modo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5 px-4 font-mono-tabular text-slate-500 whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    <td className="py-2.5 px-4 font-mono-tabular font-semibold text-slate-900">
                      {entry.currencyCode}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-tabular text-slate-500">
                      {entry.previousRate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-tabular font-semibold text-[#0F2744]">
                      {entry.newRate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{entry.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
