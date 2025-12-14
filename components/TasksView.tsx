import React from 'react';
import { Conversation } from '../types';

interface TasksViewProps {
    conversations?: Conversation[]; // Optional for now
}

const TasksView: React.FC<TasksViewProps> = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      <div className="p-8 pb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Moje Zadania</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Zadania wygenerowane z analiz rozmów oraz dodane ręcznie.</p>
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Integracja Zadań w budowie</h3>
            <p className="text-gray-500 dark:text-slate-400 max-w-md mb-6">
                Wkrótce tutaj znajdziesz zbiorczą listę wszystkich zadań (Action Items) wykrytych w Twoich rozmowach, zintegrowaną z Google Tasks.
            </p>
            <button className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium">
                Powiadom mnie kiedy będzie gotowe
            </button>
        </div>
      </div>
    </div>
  );
};

export default TasksView;