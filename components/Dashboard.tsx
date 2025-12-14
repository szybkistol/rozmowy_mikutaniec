
import React, { useState, useMemo } from 'react';
import { Conversation, Client, Sentiment } from '../types';

interface DashboardProps {
  conversations: Conversation[];
  clients: Client[];
  onSelectConversation: (id: string) => void;
  onOpenUpload: () => void;
  onDeleteConversation: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ conversations, clients, onSelectConversation, onOpenUpload, onDeleteConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  const getClientName = (id: string | null) => {
    if (!id) return <span className="text-gray-400 italic">Nieprzypisany</span>;
    const client = clients.find(c => c.id === id);
    return client ? client.name : 'Nieznany';
  };

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

  // Filtering and Sorting Logic
  const filteredAndSortedConversations = useMemo(() => {
    let result = [...conversations];

    // 1. Filter by Client
    if (selectedClientId !== 'all') {
      result = result.filter(c => c.clientId === selectedClientId);
    }

    // 2. Search (Title & Short Description)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(term) || 
        c.shortDescription.toLowerCase().includes(term)
      );
    }

    // 3. Sort by Date
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [conversations, searchTerm, selectedClientId, sortOrder]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden transition-colors duration-200">
      <div className="p-4 md:p-8 pb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Wszystkie Rozmowy</h2>
          <p className="text-gray-500 text-sm mt-1">Przeglądaj i zarządzaj transkrypcjami rozmów.</p>
        </div>
        <button 
          onClick={onOpenUpload}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all shadow-blue-600/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Dodaj Rozmowę
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="px-4 md:px-8 pb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
          
          {/* Search Input */}
          <div className="flex-1 w-full relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
              placeholder="Szukaj w tematach..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

          {/* Client Filter */}
          <div className="w-full md:w-auto">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-white text-gray-700 cursor-pointer hover:bg-gray-50"
            >
              <option value="all">Wszyscy klienci</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="w-full md:w-auto">
             <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-white text-gray-700 cursor-pointer hover:bg-gray-50"
            >
              <option value="desc">Data: Od najnowszych</option>
              <option value="asc">Data: Od najstarszych</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 md:px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm w-32">Data</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm w-48">Klient</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Temat rozmowy</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm w-32 text-center">Ocena</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-sm w-24 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedConversations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      {conversations.length === 0 
                        ? "Brak rozmów. Kliknij \"Dodaj Rozmowę\" aby rozpocząć." 
                        : "Nie znaleziono rozmów spełniających kryteria wyszukiwania."}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedConversations.map((convo) => (
                    <tr 
                      key={convo.id} 
                      onClick={() => onSelectConversation(convo.id)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors group relative"
                    >
                      <td className="py-4 px-6 text-sm text-gray-600">
                        <div className="font-medium text-gray-800">{new Date(convo.date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{new Date(convo.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-800 font-medium">
                        {getClientName(convo.clientId)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-gray-800 mb-1">
                          {/* Highlight search term in title if exists */}
                          {searchTerm && convo.title.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                              <>
                                {convo.title.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                                  part.toLowerCase() === searchTerm.toLowerCase() 
                                    ? <span key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{part}</span> 
                                    : part
                                )}
                              </>
                          ) : convo.title}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">
                          {searchTerm && convo.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                              <>
                                {convo.shortDescription.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                                  part.toLowerCase() === searchTerm.toLowerCase() 
                                    ? <span key={i} className="bg-yellow-100 text-gray-800 rounded px-0.5 font-medium">{part}</span> 
                                    : part
                                )}
                              </>
                          ) : convo.shortDescription}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {getSentimentBadge(convo.sentiment)}
                      </td>
                      <td className="py-4 px-6 text-right relative">
                        <div className="flex items-center justify-end gap-3 relative z-20">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(convo.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Usuń rozmowę"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                          <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
