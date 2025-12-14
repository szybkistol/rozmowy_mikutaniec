
import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, onClose }) => {
  
  const navItemClass = (view: ViewState | string) => {
    // Check if this view is active
    const isActive = currentView === view || (view === 'dashboard' && currentView === 'conversation_detail') || (view === 'clients' && currentView === 'client_detail');
    
    return `w-full text-left px-3 py-2 rounded-lg mb-1 transition-all flex items-center gap-3 text-sm font-medium ${
      isActive
        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' 
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    }`;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-64 bg-gray-50/50 h-full flex flex-col border-r border-gray-200 font-sans transition-transform duration-300 md:translate-x-0 bg-white md:bg-gray-50/50
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'}
      `}>
        {/* Logo Section */}
        <div className="p-5 flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">rozmowy</h1>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Main Menu */}
        <div className="px-4 flex-1">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Menu</h3>
          <nav className="space-y-0.5">
            <button onClick={() => setView('dashboard')} className={navItemClass('dashboard')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Rozmowy
            </button>
            
            <button onClick={() => setView('clients')} className={navItemClass('clients')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Klienci
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
