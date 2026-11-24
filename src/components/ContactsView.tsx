import React, { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Client, Supplier } from '../types/pos';

interface ContactsViewProps {
  clients: Client[];
  suppliers: Supplier[];
  canManageSuppliers: boolean;
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  clients,
  suppliers,
  canManageSuppliers,
  onAddClient,
  onAddSupplier,
}) => {
  const [tab, setTab] = useState<'clients' | 'suppliers'>('clients');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [docId, setDocId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailOrContact, setEmailOrContact] = useState('');
  const [addressOrCat, setAddressOrCat] = useState('');

  const activeTab = !canManageSuppliers ? 'clients' : tab;

  const filteredClients = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.docId.toLowerCase().includes(q)
    );
  });

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.rif.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docId.trim() || !name.trim()) return;
    if (activeTab === 'clients') {
      onAddClient({
        docId: docId.trim().toUpperCase(),
        name: name.trim(),
        phone: phone.trim() || 'N/A',
        email: emailOrContact.trim(),
        address: addressOrCat.trim() || 'Registrado en tienda',
      });
    } else {
      onAddSupplier({
        rif: docId.trim().toUpperCase(),
        name: name.trim(),
        contactName: emailOrContact.trim() || 'Contacto principal',
        phone: phone.trim() || 'N/A',
        category: addressOrCat.trim() || 'General',
      });
    }
    setDocId('');
    setName('');
    setPhone('');
    setEmailOrContact('');
    setAddressOrCat('');
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setTab('clients')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clientes ({clients.length})
            </button>
            {canManageSuppliers && (
              <button
                type="button"
                onClick={() => setTab('suppliers')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'suppliers'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Proveedores ({suppliers.length})
              </button>
            )}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o documento..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F2744]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F2744] hover:bg-[#173963] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {activeTab === 'clients' ? 'Nuevo Cliente' : 'Nuevo Proveedor'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {activeTab === 'clients'
                ? 'Registrar Cliente'
                : 'Registrar Proveedor'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              required
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              placeholder={activeTab === 'clients' ? 'Cédula / RIF' : 'RIF'}
              className="px-3 py-2 font-mono-tabular bg-slate-50 border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre o Razón Social"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg sm:col-span-2"
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Teléfono"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              value={emailOrContact}
              onChange={(e) => setEmailOrContact(e.target.value)}
              placeholder={
                activeTab === 'clients' ? 'Correo electrónico' : 'Persona contacto'
              }
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={addressOrCat}
              onChange={(e) => setAddressOrCat(e.target.value)}
              placeholder={
                activeTab === 'clients'
                  ? 'Dirección fiscal o de entrega'
                  : 'Categoría que suministra (ej. Víveres)'
              }
              className="flex-1 min-w-[220px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-[#0F2744] hover:bg-[#173963] rounded-lg cursor-pointer"
            >
              Guardar Registro
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'clients' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-4">Documento</th>
                  <th className="py-2.5 px-4">Cliente</th>
                  <th className="py-2.5 px-4">Teléfono</th>
                  <th className="py-2.5 px-4">Correo</th>
                  <th className="py-2.5 px-4">Dirección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono-tabular text-slate-600 whitespace-nowrap">
                      {c.docId}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-4 font-mono-tabular text-slate-600">
                      {c.phone}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {c.email || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{c.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-4">RIF</th>
                  <th className="py-2.5 px-4">Proveedor</th>
                  <th className="py-2.5 px-4">Contacto</th>
                  <th className="py-2.5 px-4">Teléfono</th>
                  <th className="py-2.5 px-4">Rubro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono-tabular text-slate-600 whitespace-nowrap">
                      {s.rif}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {s.contactName}
                    </td>
                    <td className="py-2.5 px-4 font-mono-tabular text-slate-600">
                      {s.phone}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{s.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
