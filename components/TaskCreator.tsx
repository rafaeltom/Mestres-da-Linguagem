
import React, { useState } from 'react';
import { School, Task } from '../types';
import { getGeminiRewardSuggestion } from '../services/geminiService';

interface TaskCreatorProps {
  schools: School[];
  onSaveTask: (task: Task) => void;
  onCancel: () => void;
}

const TaskCreator: React.FC<TaskCreatorProps> = ({ schools, onSaveTask, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardAmount, setRewardAmount] = useState(10);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const handleClassToggle = (classId: string) => {
    setAssignedClassIds(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleAIAssist = async () => {
    if(!description && !title) return;
    setIsAIProcessing(true);
    try {
        const suggestion = await getGeminiRewardSuggestion(title + ": " + description);
        setRewardAmount(suggestion.amount);
        if(!description) setDescription(suggestion.message); // Usa a mensagem como descrição se estiver vazia
    } catch(e) {
        console.error(e);
    } finally {
        setIsAIProcessing(false);
    }
  };

  const handleSave = () => {
    if (!title || assignedClassIds.length === 0) {
      alert("Preencha o título e selecione pelo menos uma turma.");
      return;
    }
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      rewardAmount,
      assignedClassIds,
      createdAt: new Date()
    };
    onSaveTask(newTask);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <i className="fas fa-scroll text-indigo-500"></i> Criar Nova Tarefa
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">Título da Atividade</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-indigo-500 outline-none"
            placeholder="Ex: Leitura do Capítulo 4"
          />
        </div>

        <div>
           <div className="flex justify-between items-center mb-2">
             <label className="block text-sm font-bold text-slate-400">Descrição</label>
             <button onClick={handleAIAssist} disabled={isAIProcessing} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                {isAIProcessing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-magic"></i>}
                Sugerir Valor com IA
             </button>
           </div>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-indigo-500 outline-none h-24"
            placeholder="Detalhes da tarefa..."
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">Recompensa Padrão (LXC)</label>
          <input 
            type="number" 
            value={rewardAmount}
            onChange={e => setRewardAmount(Number(e.target.value))}
            className="w-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-indigo-500 outline-none font-mono font-bold text-emerald-400"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-400 mb-4">Atribuir às Turmas</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {schools.flatMap(school => 
              school.classes.map(cls => (
                <div 
                  key={cls.id}
                  onClick={() => handleClassToggle(cls.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${assignedClassIds.includes(cls.id) ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                >
                  <div>
                    <p className="text-sm font-bold">{cls.name}</p>
                    <p className="text-[10px] text-slate-500">{school.name}</p>
                  </div>
                  {assignedClassIds.includes(cls.id) && <i className="fas fa-check-circle text-indigo-400"></i>}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-800">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 font-bold transition-all">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold transition-all shadow-lg shadow-indigo-600/20">Publicar Tarefa</button>
        </div>
      </div>
    </div>
  );
};

export default TaskCreator;
