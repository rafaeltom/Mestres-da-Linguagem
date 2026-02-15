
import React from 'react';
import { NetworkName } from '../constants';

interface SidebarProps {
  currentView: string;
  setView: (view: any) => void;
  network: NetworkName;
  setNetwork: (network: NetworkName) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, network, setNetwork }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: 'fa-chart-pie' },
    { id: 'tasks', label: 'Tarefas & Atividades', icon: 'fa-tasks' },
    { id: 'schools', label: 'Escolas e Turmas', icon: 'fa-school' },
    { id: 'history', label: 'Livro Razão (Ledger)', icon: 'fa-list-ul' },
    { id: 'profile', label: 'Perfil do Professor', icon: 'fa-user-circle' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <i className="fas fa-graduation-cap text-white text-xl"></i>
          </div>
          <span className="font-bold text-lg tracking-tight">Mestres da <span className="text-indigo-400">Linguagem</span></span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id 
                  ? 'bg-indigo-600/10 text-indigo-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <i className={`fas ${item.icon} w-5`}></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800 space-y-4">
        <div>
          <p className="text-xs text-slate-500 uppercase font-bold mb-2">Rede Solana</p>
          <div className="flex bg-slate-800/50 rounded-lg p-1">
            <button 
              onClick={() => setNetwork('devnet')}
              className={`flex-1 text-xs py-1 rounded-md transition-all ${network === 'devnet' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              Devnet (Teste)
            </button>
            <button 
              onClick={() => setNetwork('mainnet-beta')}
              className={`flex-1 text-xs py-1 rounded-md transition-all ${network === 'mainnet-beta' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
            >
              Mainnet (Real)
            </button>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Conexão Ativa
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
