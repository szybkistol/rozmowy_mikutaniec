import React from 'react';
import { Conversation } from '../types';

interface CalendarViewProps {
    conversations?: Conversation[]; // Optional for now
}

const CalendarView: React.FC<CalendarViewProps> = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      <div className="p-8 pb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Kalendarz Spotkań</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Harmonogram spotkań wyciągnięty z rozmów.</p>
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Integracja Kalendarza w budowie</h3>
            <p className="text-gray-500 dark:text-slate-400 max-w-md mb-6">
                Wkrótce tutaj zobaczysz widok miesiąca i tygodnia ze wszystkimi spotkaniami (Events) wykrytymi przez AI, z opcją synchronizacji z Google Calendar.
            </p>
            <div className="flex gap-2 opacity-50 pointer-events-none select-none" aria-hidden="true">
               <div className="w-32 h-24 border border-gray-200 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-800"></div>
               <div className="w-32 h-24 border border-gray-200 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-800"></div>
               <div className="w-32 h-24 border border-gray-200 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-800"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;