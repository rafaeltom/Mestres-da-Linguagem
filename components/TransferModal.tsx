
import React, { useState } from 'react';
import { Student } from '../types';
import { getGeminiRewardSuggestion } from '../services/geminiService';

interface TransferModalProps {
  student: Student;
  onClose: () => void;
  onConfirm: (id: string, amount: number, desc: string) => void;
  isProcessing?: boolean;
}

const TransferModal: React.FC<TransferModalProps> = ({ student, onClose, onConfirm, isProcessing }) => {
  const [amount, setAmount] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const handleAISuggestion = async () => {
    if (!description) return;
    setLoadingAI(true);
    const suggestion = await getGeminiRewardSuggestion(description);
    setAmount(suggestion.amount);
    setDescription(prev => prev + " - " + suggestion.message);
    setLoadingAI(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-indigo-600/5">
          <div>
            <h3 className="text-lg font-bold">Assinar Transação</h3>
            <p className="text-xs text-slate-500">Beneficiário: {student.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors" disabled={isProcessing}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Destinatário (Public Key)</p>
            <code className="text-[10px] text-indigo-400 font-mono break-all leading-tight block">{student.walletAddress}</code>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Justificativa Acadêmica</label>
            <div className="relative">
              <textarea 
                value={description}
                disabled={isProcessing}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none min-h-[100px]"
                placeholder="Ex: Excelente participação no debate..."
              />
              <button 
                onClick={handleAISuggestion}
                disabled={loadingAI || !description || isProcessing}
                className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] px-2 py-1 rounded-md transition-all flex items-center gap-1 shadow-lg"
              >
                {loadingAI ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-magic"></i>}
                Consultar IA
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Valor da Recompensa (LC)</label>
            <div className="flex items-center gap-4">
              <input 
                type="number"
                value={amount}
                disabled={isProcessing}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xl font-bold text-center text-indigo-400 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-950 border-t border-slate-800 flex gap-4">
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 transition-all font-bold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(student.id, amount, description || 'Prêmio de Atividade')}
            disabled={isProcessing}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 px-4 py-3 rounded-xl text-white font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <i className="fas fa-circle-notch animate-spin"></i>
                Enviando...
              </>
            ) : (
              <>
                <i className="fas fa-signature"></i>
                Assinar e Enviar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
