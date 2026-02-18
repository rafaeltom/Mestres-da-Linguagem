
import React, { useState, useEffect } from 'react';
import { db } from './services/firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { Bimester, Student, School, ClassGroup, Transaction, Badge } from './types';
import { getLevel, getNextLevel } from './utils/gamificationRules';
import { getGeminiRewardSuggestion } from './services/geminiService';

// --- COMPONENTES INTERNOS SIMPLIFICADOS PARA O ARQUIVO ÚNICO ---

const BADGES_CATALOG: Badge[] = [
  { id: 'reporter', name: 'Repórter', icon: 'fa-microphone', description: 'Excelente em reportar fatos', lxcBonus: 20 },
  { id: 'biografia', name: 'Biógrafo', icon: 'fa-book-open', description: 'Escreveu uma biografia incrível', lxcBonus: 30 },
  { id: 'participacao', name: 'Participativo', icon: 'fa-hand-paper', description: 'Participa ativamente das aulas', lxcBonus: 10 },
  { id: 'artista', name: 'Artista', icon: 'fa-palette', description: 'Trabalho visual de destaque', lxcBonus: 15 },
];

const INITIAL_SCHOOLS: School[] = [
  { id: 'nsa', name: 'EE Nossa Senhora Aparecida' },
  { id: 'pac', name: 'EMEF Prof. Alípio Corrêa Neto' }
];

// --- TELA DE LOGIN / SELEÇÃO DE PAPEL ---
const RoleSelection = ({ onSelect }: { onSelect: (role: 'teacher' | 'student') => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-8 border-4 border-indigo-500/30">
      <div>
        <h1 className="text-4xl font-bold text-indigo-900 mb-2 gamified-font">Mestres da Linguagem</h1>
        <p className="text-slate-500">Gamificação Educacional</p>
      </div>
      
      <div className="space-y-4">
        <button onClick={() => onSelect('teacher')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-2xl flex items-center gap-4 transition-all transform hover:scale-105 shadow-lg group">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl group-hover:bg-white/30">
            👨‍🏫
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Sou Professor</h3>
            <p className="text-indigo-200 text-sm">Gerenciar turmas e atividades</p>
          </div>
        </button>

        <button onClick={() => onSelect('student')} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-2xl flex items-center gap-4 transition-all transform hover:scale-105 shadow-lg group">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl group-hover:bg-white/30">
            🎒
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Sou Aluno</h3>
            <p className="text-emerald-100 text-sm">Ver minhas medalhas e nível</p>
          </div>
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-4">Versão 2.0 - Desenvolvido para o Mestre Rafael</p>
    </div>
  </div>
);

// --- DASHBOARD DO PROFESSOR ---
const TeacherDashboard = ({ 
  schools, 
  classes, 
  students, 
  onAddPoints, 
  onAddBadge, 
  onImportCsv 
}: any) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [currentBimester, setCurrentBimester] = useState<Bimester>(1);
  const [viewMode, setViewMode] = useState<'list' | 'tasks'>('list');
  
  // Estados para Modal de Tarefa
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPoints, setTaskPoints] = useState(10);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');

  // Estados para Importação CSV
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');

  const filteredClasses = classes.filter((c: any) => c.schoolId === selectedSchoolId);
  const filteredStudents = students.filter((s: any) => s.classId === selectedClassId);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s: any) => s.id));
    }
  };

  const executeTask = () => {
    if (selectedStudentIds.length === 0) return alert("Selecione alunos");
    onAddPoints(selectedStudentIds, taskPoints, taskDescription, currentBimester);
    setTaskModalOpen(false);
    setSelectedStudentIds([]);
    setTaskDescription('');
  };

  const askAi = async () => {
    try {
      setAiSuggestion("Consultando o oráculo pedagógico...");
      const result = await getGeminiRewardSuggestion(taskDescription);
      setTaskPoints(result.amount);
      setAiSuggestion(result.message);
    } catch (e) {
      setAiSuggestion("Erro ao consultar IA.");
    }
  };

  const processCsv = () => {
    if (!selectedClassId) return alert("Selecione uma turma antes de importar");
    onImportCsv(csvContent, selectedClassId, selectedSchoolId);
    setImportModalOpen(false);
    setCsvContent('');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header Professor */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">Painel do Mestre</h1>
            <p className="text-xs text-slate-500">Gestão de Gamificação</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 rounded-lg p-1">
             {[1, 2, 3, 4].map(b => (
               <button 
                key={b}
                onClick={() => setCurrentBimester(b as Bimester)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${currentBimester === b ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-600'}`}
               >
                 {b}º Bim
               </button>
             ))}
          </div>
          <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
          <div className="p-4">
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Escola</label>
            <select 
              value={selectedSchoolId} 
              onChange={e => { setSelectedSchoolId(e.target.value); setSelectedClassId(''); }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
            >
              {schools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex-1 px-2">
            <label className="px-2 text-xs font-bold text-slate-400 uppercase mb-2 block">Turmas</label>
            <div className="space-y-1">
              {filteredClasses.length === 0 && <p className="text-xs text-slate-400 px-2 italic">Nenhuma turma cadastrada.</p>}
              {filteredClasses.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex justify-between items-center ${selectedClassId === c.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {c.name}
                  <i className="fas fa-chevron-right text-xs opacity-50"></i>
                </button>
              ))}
              <button 
                onClick={() => {
                  const name = prompt("Nome da nova turma:");
                  if(name) {
                    /* Logica para adicionar turma seria aqui, simplificado para o exemplo */
                    alert("Para adicionar turmas, use o banco de dados ou importe via CSV");
                  }
                }}
                className="w-full text-left px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-slate-200 mt-2 flex items-center gap-2 justify-center"
              >
                <i className="fas fa-plus"></i> Nova Turma
              </button>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-200">
             <button 
              onClick={() => setImportModalOpen(true)}
              className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center gap-2"
             >
               <i className="fas fa-file-csv"></i> Importar Alunos (CSV)
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {!selectedClassId ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <i className="fas fa-users text-6xl mb-4 opacity-20"></i>
              <p>Selecione uma turma para começar a avaliar.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-end mb-6">
                <div>
                   <h2 className="text-2xl font-bold text-slate-800">{classes.find((c: any) => c.id === selectedClassId)?.name}</h2>
                   <p className="text-sm text-slate-500">{filteredStudents.length} Alunos • {schools.find((s:any) => s.id === selectedSchoolId)?.name}</p>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => { setTaskPoints(10); setTaskModalOpen(true); }}
                    disabled={selectedStudentIds.length === 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                   >
                     <i className="fas fa-star"></i> Avaliar Selecionados ({selectedStudentIds.length})
                   </button>
                </div>
              </div>

              {/* Lista de Alunos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 <div onClick={handleSelectAll} className="col-span-full mb-2 flex items-center gap-2 cursor-pointer text-sm text-slate-500 hover:text-indigo-600">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                      <i className="fas fa-check text-xs"></i>
                    </div>
                    Selecionar Todos
                 </div>

                 {filteredStudents.map((student: any) => {
                   const level = getLevel(student.lxcTotal[currentBimester] || 0, currentBimester);
                   const isSelected = selectedStudentIds.includes(student.id);

                   return (
                     <div 
                      key={student.id}
                      onClick={() => handleSelectStudent(student.id)}
                      className={`relative bg-white rounded-xl p-4 border-2 transition-all cursor-pointer group ${isSelected ? 'border-indigo-500 shadow-md transform -translate-y-1' : 'border-transparent shadow-sm hover:border-indigo-200'}`}
                     >
                       <div className="flex items-center gap-3 mb-3">
                         <div className={`w-12 h-12 rounded-full ${level.color} flex items-center justify-center text-white text-lg font-bold shadow-inner`}>
                           {student.name.charAt(0)}
                         </div>
                         <div className="overflow-hidden">
                           <h3 className="font-bold text-slate-800 truncate">{student.name}</h3>
                           <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold ${level.color}`}>
                             {level.title}
                           </span>
                         </div>
                       </div>
                       
                       <div className="flex justify-between items-end">
                          <div className="text-2xl font-black text-slate-700 gamified-font">
                            {student.lxcTotal[currentBimester] || 0} <span className="text-xs text-slate-400 font-normal">LXC</span>
                          </div>
                          <div className="flex gap-1">
                             {student.badges?.slice(0,3).map((bId: string) => {
                               const badge = BADGES_CATALOG.find(b => b.id === bId);
                               return badge ? <i key={bId} className={`fas ${badge.icon} text-slate-300 text-xs`} title={badge.name}></i> : null;
                             })}
                          </div>
                       </div>
                     </div>
                   );
                 })}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal de Tarefa */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold"><i className="fas fa-star mr-2"></i> Atribuir Pontos</h3>
              <button onClick={() => setTaskModalOpen(false)} className="text-white/70 hover:text-white"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-800 border border-indigo-100">
                <span className="font-bold">{selectedStudentIds.length} alunos selecionados.</span> Essa ação será registrada no histórico de cada um.
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Motivo / Atividade</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                    className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                    placeholder="Ex: Entrega da redação..."
                  />
                  <button onClick={askAi} className="px-3 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 border border-purple-200" title="Sugerir valor com IA">
                    <i className="fas fa-magic"></i>
                  </button>
                </div>
                {aiSuggestion && <p className="text-xs text-purple-600 mt-1 italic"><i className="fas fa-robot mr-1"></i> {aiSuggestion}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Valor (LXC)</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setTaskPoints(prev => prev - 5)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold">-</button>
                  <input 
                    type="number" 
                    value={taskPoints}
                    onChange={e => setTaskPoints(Number(e.target.value))}
                    className="w-24 text-center p-2 text-2xl font-bold text-indigo-600 border-b-2 border-indigo-100 outline-none"
                  />
                  <button onClick={() => setTaskPoints(prev => prev + 5)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold">+</button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                 <button onClick={() => setTaskModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                 <button onClick={executeTask} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Importar Alunos via CSV</h3>
            <p className="text-sm text-slate-500 mb-4">Cole o conteúdo do seu CSV abaixo. Formato esperado: Apenas nomes, um por linha.</p>
            <textarea 
              value={csvContent}
              onChange={e => setCsvContent(e.target.value)}
              className="w-full h-48 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono mb-4"
              placeholder="João da Silva&#10;Maria Oliveira&#10;Pedro Santos"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setImportModalOpen(false)} className="px-4 py-2 text-slate-500">Cancelar</button>
              <button onClick={processCsv} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Importar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- VISÃO DO ALUNO ---
const StudentView = ({ student, transactions, currentBimester }: any) => {
  if (!student) return <div className="text-center p-10">Aluno não encontrado.</div>;

  const currentLxc = student.lxcTotal[currentBimester] || 0;
  const level = getLevel(currentLxc, currentBimester);
  const nextLevelInfo = getNextLevel(currentLxc, currentBimester);

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header Gamificado */}
      <div className={`${level.color} pb-16 pt-8 px-6 rounded-b-[3rem] shadow-xl relative overflow-hidden`}>
         <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         
         <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-2xl mb-4">
               <div className={`w-full h-full rounded-full ${level.color} flex items-center justify-center text-4xl text-white font-bold`}>
                 {student.name.charAt(0)}
               </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{student.name}</h1>
            <span className="bg-white/20 px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              {level.title}
            </span>
            
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-black text-white gamified-font">{currentLxc}</span>
              <span className="text-white/80 font-medium">LXC</span>
            </div>
         </div>
      </div>

      {/* Barra de Progresso */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
           <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
             <span>Progresso Bimestre {currentBimester}</span>
             <span>Próximo: {nextLevelInfo ? nextLevelInfo.nextTitle : 'MÁXIMO!'}</span>
           </div>
           {nextLevelInfo ? (
             <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
               <div 
                 className={`h-full ${level.color} transition-all duration-1000`} 
                 style={{ width: `${Math.min(100, (currentLxc / (currentLxc + nextLevelInfo.pointsNeeded)) * 100)}%` }}
               ></div>
             </div>
           ) : (
             <div className="text-center text-amber-500 font-bold text-sm">🏆 Você alcançou o topo!</div>
           )}
           {nextLevelInfo && <p className="text-center text-xs text-slate-400 mt-2">Faltam {nextLevelInfo.pointsNeeded} LXC para evoluir!</p>}
        </div>
      </div>

      {/* Histórico */}
      <div className="px-6 mt-6 space-y-4">
        <h3 className="font-bold text-slate-700 ml-1">Últimas Conquistas</h3>
        {transactions.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">Nenhuma atividade registrada ainda.</p>
        ) : (
          transactions.map((tx: any) => (
            <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                   <i className={`fas ${tx.amount > 0 ? 'fa-plus' : 'fa-minus'}`}></i>
                 </div>
                 <div>
                   <p className="font-bold text-slate-700 text-sm">{tx.description}</p>
                   <p className="text-[10px] text-slate-400">{new Date(tx.date.seconds * 1000).toLocaleDateString()}</p>
                 </div>
              </div>
              <span className={`font-bold ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </span>
            </div>
          ))
        )}
      </div>
      
      {/* Botão Flutuante Loja (Mockup) */}
      <div className="fixed bottom-6 right-6">
        <button className="w-14 h-14 bg-indigo-600 rounded-full text-white shadow-xl flex items-center justify-center text-xl hover:scale-110 transition-transform">
          <i className="fas fa-store"></i>
        </button>
      </div>
    </div>
  );
};


// --- APP PRINCIPAL ---
const App: React.FC = () => {
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Fake Student Login ID for Demo
  const [demoStudentId, setDemoStudentId] = useState<string | null>(null);

  // Inicialização e Carga de Dados
  useEffect(() => {
    // Carregar Escolas (se não existirem, cria as padrão)
    const initData = async () => {
      const schoolsSnap = await getDocs(collection(db, 'schools'));
      if (schoolsSnap.empty) {
        for (const s of INITIAL_SCHOOLS) {
          await addDoc(collection(db, 'schools'), s);
        }
      }
      
      // Listeners em Tempo Real
      const unsubSchools = onSnapshot(collection(db, 'schools'), (snap) => 
        setSchools(snap.docs.map(d => ({ id: d.id, ...d.data() } as School)))
      );
      
      const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => 
        setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassGroup)))
      );

      const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => 
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)))
      );

      // Carregar Transações (Limitadas para performance)
      const qTx = query(collection(db, 'transactions'), orderBy('date', 'desc')); // limit(50)
      const unsubTx = onSnapshot(qTx, (snap) => 
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))
      );

      return () => { unsubSchools(); unsubClasses(); unsubStudents(); unsubTx(); };
    };
    
    initData();
  }, []);

  // Actions
  const handleAddPoints = async (studentIds: string[], amount: number, description: string, bimester: Bimester) => {
    const batchPromises = studentIds.map(async (studentId) => {
      // 1. Criar transação
      await addDoc(collection(db, 'transactions'), {
        studentId,
        type: amount >= 0 ? 'TASK' : 'PENALTY',
        amount,
        description,
        bimester,
        date: new Date(),
        teacherId: 'admin'
      });

      // 2. Atualizar saldo do aluno
      const studentRef = doc(db, 'students', studentId);
      const student = students.find(s => s.id === studentId);
      if(student) {
        const currentTotal = student.lxcTotal[bimester] || 0;
        await updateDoc(studentRef, {
          [`lxcTotal.${bimester}`]: currentTotal + amount
        });
      }
    });
    
    await Promise.all(batchPromises);
  };

  const handleImportCsv = async (content: string, classId: string, schoolId: string) => {
    const names = content.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    const promises = names.map(name => addDoc(collection(db, 'students'), {
      name,
      classId,
      schoolId,
      lxcTotal: { 1: 0, 2: 0, 3: 0, 4: 0 },
      badges: [],
      messages: []
    }));
    await Promise.all(promises);
    alert(`${names.length} alunos importados com sucesso!`);
  };

  if (!role) return <RoleSelection onSelect={setRole} />;

  if (role === 'teacher') {
    return (
      <TeacherDashboard 
        schools={schools} 
        classes={classes} 
        students={students}
        onAddPoints={handleAddPoints}
        onImportCsv={handleImportCsv}
      />
    );
  }

  if (role === 'student') {
    // Tela de "Login" do aluno simplificada para o MVP
    if (!demoStudentId) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
             <h2 className="text-xl font-bold mb-4">Quem é você?</h2>
             <p className="text-xs text-slate-500 mb-4">Selecione seu nome na lista (Simulação)</p>
             <div className="max-h-64 overflow-y-auto space-y-2">
               {students.length === 0 && <p>Nenhum aluno cadastrado.</p>}
               {students.map(s => (
                 <button key={s.id} onClick={() => setDemoStudentId(s.id)} className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 border border-slate-200 block">
                   {s.name}
                 </button>
               ))}
             </div>
             <button onClick={() => setRole(null)} className="mt-4 text-xs text-slate-400">Voltar</button>
          </div>
        </div>
      );
    }
    
    const student = students.find(s => s.id === demoStudentId);
    const myTransactions = transactions.filter(t => t.studentId === demoStudentId);
    
    return <StudentView student={student} transactions={myTransactions} currentBimester={1} />; // Default Bimester 1 for view
  }

  return null;
};

export default App;
