
import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';

const TeacherProfile: React.FC = () => {
  const [firebaseStatus, setFirebaseStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [logMessage, setLogMessage] = useState<string>('');

  const handleTestConnection = async () => {
    setFirebaseStatus('testing');
    setLogMessage('Verificando coleções...');
    
    try {
      const colls = ['schools', 'classes', 'students', 'transactions'];
      let msg = "Status do Banco de Dados:\n";
      
      for (const c of colls) {
        const collRef = collection(db, c);
        const snapshot = await getCountFromServer(collRef);
        msg += `- ${c}: ${snapshot.data().count} documentos\n`;
      }

      setFirebaseStatus('success');
      setLogMessage(msg);
    } catch (error: any) {
      console.error("Erro Firebase:", error);
      setFirebaseStatus('error');
      setLogMessage(`Erro: ${error.message}. Verifique a conexão.`);
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnóstico Firebase */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="fas fa-database text-amber-500"></i> Diagnóstico de Banco de Dados
            </h3>
            <p className="text-sm text-slate-400 mb-6">Teste a conexão com Google Firestore (Nuvem).</p>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 h-32 overflow-y-auto font-mono text-[10px] whitespace-pre-line">
                {logMessage ? (
                    <span className={firebaseStatus === 'error' ? 'text-red-400' : 'text-emerald-400'}>
                        {logMessage}
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
                ) : (
                    <><i className="fas fa-plug"></i> Verificar Conexão</>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
