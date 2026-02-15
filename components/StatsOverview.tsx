
import React from 'react';
import { SchoolStats } from '../types';

interface StatsOverviewProps {
  stats: SchoolStats;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const cards = [
    { label: 'Total de Alunos', value: stats.totalStudents, icon: 'fa-user-graduate', color: 'indigo' },
    { label: 'Moedas Distribuídas', value: stats.totalDistributed, icon: 'fa-coins', color: 'amber' },
    { label: 'Escolas Ativas', value: stats.activeSchools, icon: 'fa-school', color: 'emerald' },
    { label: 'Preço da Memecoin', value: '0.00012 USD', icon: 'fa-chart-line', color: 'sky' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl text-${card.color}-400`}>
            <i className={`fas ${card.icon}`}></i>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{card.label}</p>
          <p className="text-3xl font-bold text-slate-100">{card.value}</p>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
            <i className="fas fa-arrow-up"></i>
            <span>+12.5% este mês</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
