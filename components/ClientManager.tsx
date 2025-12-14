
import React, { useState } from 'react';
import { Client } from '../types';

interface ClientManagerProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onSelectClient: (clientId: string) => void;
  onDeleteClient: (clientId: string) => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients, onAddClient, onSelectClient, onDeleteClient }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '', notes: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.phone) return;

    onAddClient({
      id: `c${Date.now()}`,
      ...newClient
    });
    setNewClient({ name: '', company: '', email: '', phone: '', notes: '' });
    setIsAdding(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative transition-colors duration-200">
      <div className="p-4 md:p-8 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Baza Klientów</h2>
          <p className="text-gray-500 text-sm mt-1">Zarządzaj profilami klientów.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors shadow-blue-600/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span className="hidden md:inline">Dodaj Klienta</span>
          <span className="md:hidden">Dodaj</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto px-4 md:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {clients.map(client => (
            <div 
              key={client.id} 
              onClick={() => onSelectClient(client.id)}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  {client.name.charAt(0)}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClient(client.id);
                  }}
                  className="relative z-10 text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                  title="Usuń klienta"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
              <h3 className="font-bold text-gray-800">{client.name}</h3>
              <p className="text-sm text-blue-600 font-medium mb-3">{client.company || <span className="text-gray-400 italic font-normal">Brak firmy</span>}</p>
              <div className="text-sm text-gray-500 space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <span className="truncate">{client.email || 'Brak email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  <span>{client.phone || 'Brak telefonu'}</span>
                </div>
              </div>
              {client.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 italic">
                  "{client.notes}"
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                <span>Kliknij, aby zobaczyć historię rozmów</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 scale-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Nowy Klient</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko <span className="text-red-500">*</span></label>
                <input 
                  type="text" required
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  placeholder="np. Jan Kowalski"
                  value={newClient.name}
                  onChange={e => setNewClient({...newClient, name: e.target.value})}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Telefon <span className="text-red-500">*</span></label>
                   <input 
                    type="tel" required
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    placeholder="+48 123 456 789"
                    value={newClient.phone}
                    onChange={e => setNewClient({...newClient, phone: e.target.value})}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Firma <span className="text-gray-400 font-normal text-xs">(opcjonalne)</span></label>
                   <input 
                    type="text" 
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    placeholder="np. Tech Sp. z o.o."
                    value={newClient.company}
                    onChange={e => setNewClient({...newClient, company: e.target.value})}
                  />
                </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal text-xs">(opcjonalne)</span></label>
                  <input 
                    type="email" 
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    placeholder="jan@przyklad.pl"
                    value={newClient.email}
                    onChange={e => setNewClient({...newClient, email: e.target.value})}
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notatki</label>
                <textarea 
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-shadow"
                  placeholder="Dodatkowe informacje..."
                  value={newClient.notes}
                  onChange={e => setNewClient({...newClient, notes: e.target.value})}
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Anuluj
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors"
                >
                  Zapisz Klienta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
