
import React from 'react';

const AIAdvice: React.FC = () => {
  return (
    <div className="bg-indigo-600/10 border border-indigo-600/30 rounded-2xl p-6 relative overflow-hidden">
      <div className="flex gap-4 items-start relative z-10">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
          <i className="fas fa-lightbulb text-white text-xl"></i>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-400">Conselho do Especialista sobre sua ideia:</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            "Sua ideia de usar wallets reais para alunos é inovadora! No entanto, **nunca armazene chaves privadas** (senhas) online. Salve apenas as **Chaves Públicas** (os endereços da carteira) no seu banco de dados."
          </p>
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-shield-alt text-emerald-500"></i>
              Recomendação Técnica
            </p>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-500 text-[10px]"></i> Use a rede <strong>Polygon</strong> ou <strong>Solana</strong> (taxas quase zero).</li>
              <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-500 text-[10px]"></i> Comece usando uma <strong>Testnet</strong> (dinheiro de mentira, segurança total).</li>
              <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-500 text-[10px]"></i> Ensine os alunos a usarem a <strong>MetaMask</strong> ou <strong>Phantom</strong> para verem seus saldos.</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 text-indigo-500/10 text-9xl">
        <i className="fas fa-robot"></i>
      </div>
    </div>
  );
};

export default AIAdvice;
