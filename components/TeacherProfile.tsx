
import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

const TeacherProfile: React.FC = () => {
  const [firebaseStatus, setFirebaseStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [logMessage, setLogMessage] = useState<string>('');

  const handleTestConnection = async () => {
    setFirebaseStatus('testing');
    setLogMessage('Iniciando handshake com Firestore...');
    
    try {
      // 1. Tentar escrever um documento de teste
      setLogMessage('Tentando escrever no banco de dados...');
      const docRef = await addDoc(collection(db, "system_diagnostics"), {
        timestamp: new Date(),
        action: "connection_test",
        userAgent: navigator.userAgent
      });
      
      // 2. Tentar ler para confirmar
      setLogMessage('Escrita ok. Tentando ler confirmação...');
      const q = query(collection(db, "system_diagnostics"), limit(1));
      await getDocs(q);

      setFirebaseStatus('success');
      setLogMessage(`Sucesso! ID do documento gerado: ${docRef.id}`);
    } catch (error: any) {
      console.error("Erro Firebase:", error);
      setFirebaseStatus('error');
      setLogMessage(`Erro: ${error.message || "Falha na conexão"}. Verifique se o Firestore foi criado no console.`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-full border-4 border-indigo-500 bg-slate-800 flex items-center justify-center shadow-xl">
            <i className="fas fa-user-tie text-4xl text-slate-300"></i>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Professor Mestre</h2>
            <p className="text-indigo-300 font-medium mb-4">Especialista em Gamificação Educacional</p>
            <div className="flex items-center gap-4 justify-center md:justify-start">
               <span className="px-3 py-1 bg-slate-950/50 rounded-lg text-xs font-mono border border-indigo-500/30 text-indigo-200">
                 Level 12
               </span>
               <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="w-[70%] h-full bg-emerald-500"></div>
               </div>
               <span className="text-xs text-slate-400">700/1000 XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <i className="fas fa-gem text-amber-500 text-xl"></i>
            </div>
            <div>
                <h4 className="font-bold text-slate-200">Pioneiro Crypto</h4>
                <p className="text-xs text-slate-500">Criou a primeira carteira de turma</p>
            </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <i className="fas fa-users text-emerald-500 text-xl"></i>
            </div>
            <div>
                <h4 className="font-bold text-slate-200">Engajador</h4>
                <p className="text-xs text-slate-500">Mais de 50 alunos ativos</p>
            </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-4 opacity-50">
            <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                <i className="fas fa-lock text-slate-600 text-xl"></i>
            </div>
            <div>
                <h4 className="font-bold text-slate-500">Mestre DeFi</h4>
                <p className="text-xs text-slate-600">Bloqueado: Faça 100 transferências</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações Avançadas */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Configurações Avançadas</h3>
            <p className="text-sm text-slate-400 mb-6">Gerencie suas chaves de API e preferências de rede.</p>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                        <p className="font-bold text-sm">Chave Privada de Administrador (Custódia)</p>
                        <p className="text-xs text-slate-500">Usada para assinar transações em nome dos alunos</p>
                    </div>
                    <button className="text-indigo-400 text-xs hover:underline">Revelar</button>
                </div>
                 <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                        <p className="font-bold text-sm">Exportar Dados Completos</p>
                        <p className="text-xs text-slate-500">Baixar backup de todas as turmas e alunos (JSON)</p>
                    </div>
                    <button className="text-emerald-400 text-xs hover:underline">Download JSON</button>
                </div>
            </div>
        </div>

        {/* Diagnóstico Firebase */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="fas fa-database text-amber-500"></i> Diagnóstico de Banco de Dados
            </h3>
            <p className="text-sm text-slate-400 mb-6">Teste a conexão com Google Firestore (Nuvem).</p>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 h-24 overflow-y-auto font-mono text-[10px]">
                {logMessage ? (
                    <span className={firebaseStatus === 'error' ? 'text-red-400' : 'text-emerald-400'}>
                        {">"} {logMessage}
                    </span>
                ) : (
                    <span className="text-slate-600">Aguardando início do teste...</span>
                )}
            </div>

            <button 
                onClick={handleTestConnection}
                disabled={firebaseStatus === 'testing'}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    firebaseStatus === 'success' 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                    : firebaseStatus === 'error'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
            >
                {firebaseStatus === 'testing' ? (
                    <><i className="fas fa-spinner animate-spin"></i> Conectando...</>
                ) : firebaseStatus === 'success' ? (
                    <><i className="fas fa-check-circle"></i> Conexão Verificada</>
                ) : (
                    <><i className="fas fa-plug"></i> Testar Conexão Firebase</>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
