
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import ClientDetail from './components/ClientDetail';
import ConversationDetail from './components/ConversationDetail';
import UploadModal from './components/UploadModal';
import { ViewState, Client, Conversation } from './types';
import * as storage from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    setClients(storage.getClients());
    setConversations(storage.getConversations());
  }, []);

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setView('conversation_detail');
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setView('client_detail');
  };

  const handleAddClient = (client: Client) => {
    storage.saveClient(client);
    setClients(storage.getClients());
  };

  const handleUpdateClient = (client: Client) => {
    storage.updateClient(client);
    setClients(storage.getClients());
  };
  
  const handleDeleteClient = (clientId: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć tego klienta?")) {
      storage.deleteClient(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (view === 'client_detail' && selectedClientId === clientId) {
        setView('clients');
        setSelectedClientId(null);
      }
    }
  };

  const handleSaveConversation = (convo: Conversation) => {
    storage.saveConversation(convo);
    setConversations(storage.getConversations());
  };

  const handleDeleteConversation = (id: string) => {
    if (!id) return;
    if (window.confirm("Czy na pewno chcesz trwale usunąć tę rozmowę? Operacja jest nieodwracalna.")) {
      storage.deleteConversation(id);
      setConversations(prevConversations => prevConversations.filter(c => c.id !== id));
      if (selectedConversationId === id) {
        setView('dashboard');
        setSelectedConversationId(null);
      }
    }
  };

  const handleUpdateClientForConversation = (convoId: string, clientId: string) => {
    const convo = conversations.find(c => c.id === convoId);
    if (convo) {
      const updated = { ...convo, clientId: clientId || null };
      storage.saveConversation(updated);
      setConversations(storage.getConversations());
    }
  };

  const handleSetView = (newView: ViewState) => {
    setView(newView);
    if (newView !== 'conversation_detail') setSelectedConversationId(null);
    if (newView !== 'client_detail') setSelectedClientId(null);
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
  };

  const getActiveConversation = () => conversations.find(c => c.id === selectedConversationId);
  const getActiveClient = () => clients.find(c => c.id === selectedClientId);
  const getClientConversations = () => selectedClientId ? conversations.filter(c => c.clientId === selectedClientId) : [];

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans transition-colors duration-200 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
           </div>
           <span className="font-bold text-gray-900">rozmowy</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      <Sidebar 
        currentView={view} 
        setView={handleSetView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative pt-16 md:pt-0">
        {view === 'dashboard' && (
          <Dashboard 
            conversations={conversations} 
            clients={clients}
            onSelectConversation={handleSelectConversation}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onDeleteConversation={handleDeleteConversation}
          />
        )}

        {view === 'clients' && (
          <ClientManager 
            clients={clients}
            onAddClient={handleAddClient}
            onSelectClient={handleSelectClient}
            onDeleteClient={handleDeleteClient}
          />
        )}
        
        {view === 'client_detail' && getActiveClient() && (
          <ClientDetail
            client={getActiveClient()!}
            conversations={getClientConversations()}
            onBack={() => {
              setView('clients');
              setSelectedClientId(null);
            }}
            onSelectConversation={handleSelectConversation}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={() => handleDeleteClient(getActiveClient()!.id)}
          />
        )}

        {view === 'conversation_detail' && selectedConversationId && getActiveConversation() && (
          <ConversationDetail 
            conversation={getActiveConversation()!}
            clients={clients}
            onUpdateClient={handleUpdateClientForConversation}
            onUpdateConversation={handleSaveConversation}
            onBack={() => {
              if (selectedClientId) {
                 setView('client_detail');
              } else {
                 setView('dashboard');
              }
            }}
            onDelete={() => handleDeleteConversation(selectedConversationId)}
          />
        )}
      </main>

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)}
          onSave={handleSaveConversation}
        />
      )}
    </div>
  );
};

export default App;
