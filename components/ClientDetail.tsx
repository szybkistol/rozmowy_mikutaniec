
import React, { useState } from 'react';
import { Client, Conversation, Sentiment } from '../types';

interface ClientDetailProps {
  client: Client;
  conversations: Conversation[];
  onBack: () => void;
  onSelectConversation: (id: string) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: () => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, conversations, onBack, onSelectConversation, onUpdateClient, onDeleteClient }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Client>(client);

  const getSentimentBadge = (sentiment: Sentiment) => {
    switch (sentiment) {
      case Sentiment.POSITIVE:
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200">Dobrze</span>;
      case Sentiment.NEGATIVE:
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-red-200">Źle</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-gray-200">Neutralnie</span>;
    }
  };

  const handleEditClick = () => {
    setEditForm(client);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.phone) return;
    onUpdateClient(editForm);
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative transition-colors duration-200">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6">
        <div className="flex justify-between items-start mb-4">
          <button 
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Powrót do listy klientów
          </button>

          <div className="flex gap-2">
            <button 
              onClick={handleEditClick}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edytuj
            </button>
            <button 
              onClick={onDeleteClient}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Usuń
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-3xl shrink-0">
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
              <p className="text-blue-600 font-medium">{client.company || <span className="text-gray-400 italic">Brak firmy</span>}</p>
            </div>
          </div>
          <div className="text-left md:text-right text-sm text-gray-500 space-y-1 pl-20 md:pl-0">
             <div className="flex items-center md:justify-end gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                {client.email || 'Brak email'}
             </div>
             <div className="flex items-center md:justify-end gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                {client.phone || 'Brak telefonu'}
             </div>
          </div>
        </div>

        {client.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic border border-gray-100">
            "{client.notes}"
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto px-4 md:px-8 py-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
           Historia Rozmów ({conversations.length})
        </h3>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm w-40">Data</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Temat</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm w-32 text-center">Ocena</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {conversations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      Brak przypisanych rozmów.
                    </td>
                  </tr>
                ) : (
                  conversations.map((convo) => (
                    <tr 
                      key={convo.id} 
                      onClick={() => onSelectConversation(convo.id)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-6 text-sm text-gray-600">
                        <div className="font-medium text-gray-800">{new Date(convo.date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{new Date(convo.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-gray-800 mb-1">{convo.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{convo.shortDescription}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {getSentimentBadge(convo.sentiment)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 scale-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Edytuj Klienta</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko <span className="text-red-500">*</span></label>
                <input 
                  type="text" required
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Telefon <span className="text-red-500">*</span></label>
                   <input 
                    type="tel" required
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Firma <span className="text-gray-400 font-normal text-xs">(opcjonalne)</span></label>
                   <input 
                    type="text" 
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    value={editForm.company}
                    onChange={e => setEditForm({...editForm, company: e.target.value})}
                  />
                </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal text-xs">(opcjonalne)</span></label>
                  <input 
                    type="email" 
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    value={editForm.email}
                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notatki</label>
                <textarea 
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-shadow"
                  value={editForm.notes}
                  onChange={e => setEditForm({...editForm, notes: e.target.value})}
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Anuluj
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors"
                >
                  Zapisz zmiany
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;
