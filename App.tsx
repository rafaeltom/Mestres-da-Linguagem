
import React, { useState, useEffect, useMemo } from 'react';
import { School, Transaction, SchoolStats, Task, Student } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TransactionHistory from './components/TransactionHistory';
import TransferModal from './components/TransferModal';
import StatsOverview from './components/StatsOverview';
import AIAdvice from './components/AIAdvice';
import SchoolManager from './components/SchoolManager';
import TaskCreator from './components/TaskCreator';
import TeacherProfile from './components/TeacherProfile';
import { connectWallet, sendTokenTransfer, getTokenBalance, SolanaWallet } from './services/blockchainService';
import { Connection } from '@solana/web3.js';
import { SOLANA_NETWORKS, NetworkName } from './constants';

const INITIAL_SCHOOLS: School[] = [
  {
    id: '1',
    name: 'EE Nossa Senhora Aparecida',
    classes: [
      { id: 'c1', name: '9º Ano A', students: [] },
      { id: 'c2', name: '9º Ano B', students: [] }
    ]
  },
  {
    id: '2',
    name: 'EMEF Professor Alípio Corrêa Neto',
    classes: [
      { id: 'c3', name: '8º Ano C', students: [] }
    ]
  }
];

const App: React.FC = () => {
  const [schools, setSchools] = useState<School[]>(INITIAL_SCHOOLS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // UI State
  const [currentView, setCurrentView] = useState<'dashboard' | 'tasks' | 'schools' | 'history' | 'profile'>('dashboard');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<Student | null>(null);
  const [showTaskCreator, setShowTaskCreator] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Solana State
  const [network, setNetwork] = useState<NetworkName>('devnet');
  const [wallet, setWallet] = useState<SolanaWallet | null>(null);
  const [adminAddress, setAdminAddress] = useState<string | null>(null);
  
  const connection = useMemo(() => new Connection(SOLANA_NETWORKS[network].url), [network]);
  const tokenMintAddress = SOLANA_NETWORKS[network].tokenMintAddress;

  // Flatten students for easier access in some views
  const allStudents = useMemo(() => {
    return schools.flatMap(s => s.classes.flatMap(c => c.students.map(std => ({
      ...std,
      school: s.name,
      grade: c.name
    }))));
  }, [schools]);

  const handleConnectWallet = async () => {
    try {
      const connectedWallet = await connectWallet();
      setWallet(connectedWallet);
      setAdminAddress(connectedWallet.publicKey.toBase58());
    } catch (error: any) {
      alert(error.message);
    }
  };

  const syncBalances = async () => {
    if (!wallet) return;
    setIsSyncing(true);
    try {
      // In a real app, we would batch this or do it on demand per class
      // For now, we simulate iterating over the nested structure
      const updatedSchools = await Promise.all(schools.map(async (school) => {
        const updatedClasses = await Promise.all(school.classes.map(async (cls) => {
           const updatedStudents = await Promise.all(cls.students.map(async (std) => {
             if (!std.walletAddress) return std;
             const balance = await getTokenBalance(connection, std.walletAddress, tokenMintAddress);
             return { ...std, balance: parseFloat(balance) };
           }));
           return { ...cls, students: updatedStudents };
        }));
        return { ...school, classes: updatedClasses };
      }));
      setSchools(updatedSchools);
    } catch (error) {
      console.error("Falha ao sincronizar balanços", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTransfer = async (studentId: string, amount: number, description: string) => {
    if (!wallet) {
      alert("Por favor, conecte sua carteira primeiro.");
      return;
    }
    setIsSyncing(true);
    try {
      const student = allStudents.find(s => s.id === studentId);
      if (!student) throw new Error("Aluno não encontrado");
      if (!student.walletAddress) throw new Error("Aluno não possui carteira configurada.");

      const result = await sendTokenTransfer(connection, wallet, student.walletAddress, amount, tokenMintAddress);

      const newTx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        studentId, studentName: student.name, amount, type: 'REWARD',
        description, timestamp: new Date(), hash: result.hash
      };

      setTransactions(prev => [newTx, ...prev]);
      await syncBalances();
      setIsTransferModalOpen(false);
      setSelectedStudentForTransfer(null);
    } catch (error: any) {
      alert("Falha na transação: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const stats: SchoolStats = {
    totalStudents: allStudents.length,
    totalDistributed: transactions.reduce((acc, tx) => acc + tx.amount, 0),
    activeSchools: schools.length,
  };

  const handleSaveTask = (task: Task) => {
    setTasks(prev => [task, ...prev]);
    setShowTaskCreator(false);
    // Future: Automatically notify or create "Pending Rewards" for students in the assigned classes
  };

  useEffect(() => {
    if (wallet) {
      syncBalances();
    }
  }, [wallet, network]);

  const renderContent = () => {
    switch(currentView) {
      case 'dashboard':
        return (
          <>
            <StatsOverview stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              <div className="lg:col-span-2 space-y-8">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2"><i className="fas fa-tasks text-indigo-400"></i> Tarefas Recentes</h2>
                        <button onClick={() => { setCurrentView('tasks'); setShowTaskCreator(true); }} className="text-xs text-indigo-400 hover:text-white transition-colors">Nova Tarefa</button>
                    </div>
                    {tasks.length === 0 ? (
                        <p className="text-slate-500 italic text-sm">Nenhuma tarefa criada.</p>
                    ) : (
                        <div className="space-y-4">
                            {tasks.slice(0, 3).map(task => (
                                <div key={task.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold">{task.title}</h4>
                                        <p className="text-xs text-slate-500 truncate max-w-xs">{task.description}</p>
                                    </div>
                                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded font-mono font-bold">{task.rewardAmount} LXC</span>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                <AIAdvice />
              </div>
              <div className="space-y-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><i className="fas fa-receipt text-emerald-400"></i> Transações Recentes</h2>
                  <TransactionHistory transactions={transactions.slice(0, 6)} compact={true} network={network} />
                </div>
              </div>
            </div>
          </>
        );
      case 'schools':
        return <SchoolManager schools={schools} setSchools={setSchools} />;
      case 'tasks':
        return showTaskCreator ? (
            <TaskCreator schools={schools} onSaveTask={handleSaveTask} onCancel={() => setShowTaskCreator(false)} />
        ) : (
             <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">Mural de Atividades</h2>
                    <button onClick={() => setShowTaskCreator(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
                        <i className="fas fa-plus"></i> Criar Tarefa
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl group hover:border-indigo-500/50 transition-all">
                             <div className="flex justify-between items-start mb-4">
                                <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-1 rounded uppercase font-bold tracking-wider">Atividade</span>
                                <span className="text-emerald-400 font-mono font-bold text-lg">{task.rewardAmount} LXC</span>
                             </div>
                             <h3 className="text-xl font-bold text-slate-100 mb-2">{task.title}</h3>
                             <p className="text-slate-400 text-sm mb-4 line-clamp-2">{task.description}</p>
                             <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-800 pt-4">
                                <i className="fas fa-users"></i>
                                {task.assignedClassIds.length} Turmas atribuídas
                             </div>
                        </div>
                    ))}
                </div>
             </div>
        );
      case 'profile':
        return <TeacherProfile />;
      case 'history':
        return (
             <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6">Livro Razão (Ledger Imutável)</h2>
              <TransactionHistory transactions={transactions} network={network} />
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar currentView={currentView} setView={setCurrentView} network={network} setNetwork={setNetwork} />
      
      <main className="flex-1 overflow-y-auto">
        <Header adminAddress={adminAddress} onConnect={handleConnectWallet} />
        
        {isSyncing && <div className="bg-indigo-600 px-4 py-2 flex items-center justify-center gap-2 animate-pulse text-xs font-bold sticky top-20 z-10"><i className="fas fa-network-wired"></i> Sincronizando Blockchain...</div>}

        <div className="p-6 space-y-8 max-w-7xl mx-auto">
           {renderContent()}
        </div>
      </main>

      {isTransferModalOpen && selectedStudentForTransfer && (
        <TransferModal 
          student={selectedStudentForTransfer} 
          onClose={() => setIsTransferModalOpen(false)} 
          onConfirm={handleTransfer}
          isProcessing={isSyncing}
        />
      )}
    </div>
  );
};

export default App;
