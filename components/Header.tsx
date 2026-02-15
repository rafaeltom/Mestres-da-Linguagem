
import React from 'react';

interface HeaderProps {
  adminAddress: string | null;
  onConnect: () => void;
}

const Header: React.FC<HeaderProps> = ({ adminAddress, onConnect }) => {
  return (
    <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-200">Bem-vindo, Mestre</h1>
        {adminAddress && <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs border border-emerald-500/20 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full"></span> Conectado
        </span>}
      </div>
      
      <div className="flex items-center gap-4">
        {adminAddress ? (
          <div className="text-right">
            <p className="text-sm font-medium text-slate-300 font-mono">
              {`${adminAddress.substring(0, 6)}...${adminAddress.substring(adminAddress.length - 4)}`}
            </p>
            <p className="text-[10px] text-slate-500">Carteira do Administrador</p>
          </div>
        ) : (
          <button onClick={onConnect} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
            <i className="fas fa-wallet"></i> Conectar Carteira
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
