
import React from 'react';
import { Transaction } from '../types';
import { SOLANA_NETWORKS, NetworkName } from '../constants';

interface TransactionHistoryProps {
  transactions: Transaction[];
  compact?: boolean;
  network: NetworkName;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, compact, network }) => {
  const explorerUrl = SOLANA_NETWORKS[network].explorerUrl;

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
        <i className="fas fa-cube text-4xl mb-4 opacity-20"></i>
        <p>Aguardando primeira transação on-chain...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <div key={tx.id} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-indigo-500/30 transition-all group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-bold text-slate-200">{tx.studentName || 'Aluno Desconhecido'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter line-clamp-1">{tx.description}</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} LC
              </span>
              <p className="text-[10px] text-slate-500">{new Date(tx.date).toLocaleTimeString()}</p>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <i className="fas fa-link text-[10px] text-slate-600"></i>
              <code className="text-[9px] text-slate-600 font-mono truncate">{tx.hash || 'Off-chain'}</code>
            </div>
            {tx.hash && (
            <a 
              href={`${explorerUrl}/tx/${tx.hash}?cluster=${network}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase font-bold hover:bg-indigo-500 hover:text-white transition-colors flex items-center gap-1"
            >
              Solscan <i className="fas fa-external-link-alt text-[8px]"></i>
            </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory;