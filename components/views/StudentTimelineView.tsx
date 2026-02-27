import React from 'react';
import { Bimester, Student } from '../../types';
import { AppData } from '../../services/localStorageService';
import { GenericModal } from '../ui/SharedUI';
import { StoreView } from './StoreView';

export interface StudentTimelineViewProps {
    student: Student;
    data: AppData;
    currentBimester: Bimester;
    getLevel: (lxc: number, bimester: number) => { title: string, color: string };
    setView: (view: string) => void;
    updateStudentNickname: (studentId: string, newNick: string) => void;
    viewingTransactionId: string | null;
    setViewingTransactionId: (id: string | null) => void;
    editingTxDescId: string | null;
    setEditingTxDescId: (id: string | null) => void;
    editingTxDescValue: string;
    setEditingTxDescValue: (val: string) => void;
    saveTxDescEdit: (txId: string) => void;
    editingTransactionId: string | null;
    setEditingTransactionId: (id: string | null) => void;
    editingTransactionValue: string;
    setEditingTransactionValue: (val: string | ((prev: string) => string)) => void;
    saveTransactionEdit: (txId: string) => void;
    handleEditTransactionAmount: (txId: string, currentAmount: number) => void;
    handleDeleteTransaction: (txId: string) => void;
    updateStudentAvatar: (updatedStudent: Student) => void; // Reused as updateStudentData
}

export const StudentTimelineView: React.FC<StudentTimelineViewProps> = ({
    student, data, currentBimester, getLevel, setView, updateStudentNickname,
    viewingTransactionId, setViewingTransactionId,
    editingTxDescId, setEditingTxDescId, editingTxDescValue, setEditingTxDescValue, saveTxDescEdit,
    editingTransactionId, setEditingTransactionId, editingTransactionValue, setEditingTransactionValue,
    saveTransactionEdit, handleEditTransactionAmount, handleDeleteTransaction, updateStudentAvatar
}) => {
    const [isStoreOpen, setIsStoreOpen] = React.useState(false);

    const total = student.lxcTotal[currentBimester] || 0;
    const level = getLevel(total, currentBimester);

    const studentTransactions = data.transactions
        .filter(t => t.studentId === student.id && t.bimester === currentBimester)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Derived badges: combined from student.badges array and BADGE type transactions for robustness
    const badgeIdsFromTransactions = studentTransactions
        .filter(t => t.type === 'BADGE')
        .map(t => t.description); // We store ID (or name in legacy) in description

    const combinedBadgeIdentifiers = Array.from(new Set([
        ...(student.badges || []),
        ...badgeIdsFromTransactions
    ]));

    const myBadges = data.badgesCatalog.filter(b =>
        combinedBadgeIdentifiers.includes(b.id) ||
        combinedBadgeIdentifiers.includes(b.name)
    );

    let runningBalance = 0;
    let currentLevelTitle = getLevel(0, currentBimester).title;

    const timelineEvents = studentTransactions.map(tx => {
        runningBalance += tx.amount;
        const newLevel = getLevel(runningBalance, currentBimester);
        let levelUpData = null;

        if (newLevel.title !== currentLevelTitle) {
            levelUpData = { prev: currentLevelTitle, next: newLevel.title, level: newLevel };
            currentLevelTitle = newLevel.title;
        }
        return { ...tx, levelUpData, runningBalance };
    }).reverse();

    return (
        <div className="min-h-screen bg-slate-100 font-sans pb-10" >
            <div className={`${level.color} text-white p-8 rounded-b-[3rem] shadow-xl relative`}>
                <button onClick={() => setView('dashboard')} className="absolute top-4 left-4 bg-white/20 px-3 py-1 rounded-full text-xs font-bold hover:bg-white/30 transition-all z-10"><i className="fas fa-arrow-left"></i> Voltar</button>
                {student.registrationId && (
                    <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs font-bold z-10" title="Matrícula">
                        <i className="fas fa-id-card mr-1"></i> {student.registrationId}
                    </div>
                )}
                <div className="flex flex-col items-center mt-4">
                    <div className="relative mb-4">
                        <div
                            className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden text-5xl text-slate-700 font-bold shadow-lg border-4 border-white/30"
                        >
                            {student.avatarId && student.avatarId !== 'default' ? (
                                <img src={`/assets/avatars/${student.avatarId}.png`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : student.name.charAt(0)}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const newNick = prompt("Escolha seu Nickname:", student.nickname || "");
                                if (newNick !== null) updateStudentNickname(student.id, newNick);
                            }}
                            className="absolute -bottom-1 -right-1 w-9 h-9 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs shadow-md border-2 border-white transition-transform hover:scale-110 z-20"
                            title="Editar Nickname"
                        >
                            <i className="fas fa-pen"></i>
                        </button>
                    </div>

                    {student.nickname && (
                        <h1 className="text-xl font-black gamified-font mb-1 tracking-wide">{student.nickname}</h1>
                    )}
                    <h2 className={`${student.nickname ? 'text-sm opacity-80 font-medium' : 'text-xl font-bold'}`}>{student.name}</h2>

                    <div className="mt-4 flex items-center gap-2">
                        <span className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <i className="fas fa-crown"></i> {level.title}
                        </span>
                    </div>

                    <div className="mt-6 flex items-center justify-center relative w-full">
                        <div className="text-6xl font-black gamified-font drop-shadow-md">{total} <span className="text-lg opacity-70 font-bold">LXC</span></div>

                        {total >= 242 && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center group z-10 scale-100 md:scale-110">
                                <button
                                    onClick={() => setIsStoreOpen(true)}
                                    className="w-44 h-44 md:w-52 md:h-52 transition-all hover:scale-110 active:scale-95 drop-shadow-2xl flex items-center justify-center"
                                    title="Entrar na Lojinha — Jardim das Flores de Lácio"
                                >
                                    <img src="/lojinha.png" alt="Lojinha" className="w-full h-full object-contain" />
                                </button>
                                <div className="bg-amber-400 text-slate-900 px-4 py-1.5 rounded-full text-[12px] font-black tracking-widest flex items-center gap-1.5 shadow-xl -mt-4 border-4 border-slate-900">
                                    <span className="text-sm leading-none">❀</span> {student.currency || 0} FLORES
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 -mt-8 relative z-10 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-amber-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-slate-700 font-bold text-sm uppercase flex items-center gap-2"><i className="fas fa-medal text-amber-500 text-lg"></i> Hall de Medalhas</h3>
                        <div className="flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full">{myBadges.length} Medalhas</span>
                        </div>
                    </div>

                    {myBadges.length === 0 ? <p className="text-slate-400 text-sm italic text-center py-4">Sua coleção de medalhas está vazia. Continue se esforçando!</p> : (
                        <div className="flex flex-wrap gap-4 justify-center">
                            {myBadges.map(b => (
                                <div key={b.id} className="flex flex-col items-center group relative cursor-pointer">
                                    {b.imageUrl ? (
                                        <img src={b.imageUrl} alt={b.name} className="w-16 h-16 rounded-full object-cover border-4 border-amber-200 shadow-md mb-2 bg-white transition-transform group-hover:scale-110" />
                                    ) : (
                                        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 text-3xl mb-2 border-4 border-amber-200 shadow-md transition-transform group-hover:scale-110">
                                            <i className={`fas ${b.icon}`}></i>
                                        </div>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-600 max-w-[80px] text-center leading-tight bg-slate-100 px-2 py-1 rounded-full">{b.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h3 className="text-slate-500 font-bold text-xs uppercase ml-4 tracking-widest">Linha do Tempo</h3>
                    {timelineEvents.length === 0 && <div className="text-center text-slate-400 italic">Nenhuma atividade registrada neste bimestre.</div>}
                    {timelineEvents.map((tx: any) => (
                        <div key={tx.id}>
                            {tx.levelUpData && (
                                <div className="my-6 text-center animate-fade-in">
                                    <div className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-transform">
                                        <p className="text-xs font-bold uppercase opacity-80 mb-1">Promoção Conquistada!</p>
                                        <div className="flex items-center gap-2 text-sm font-black">
                                            <span>{tx.levelUpData.prev}</span>
                                            <i className="fas fa-arrow-right"></i>
                                            <span className="text-lg text-yellow-300"><i className="fas fa-crown mr-1"></i> {tx.levelUpData.next}</span>
                                        </div>
                                    </div>
                                    <div className="h-4 w-0.5 bg-slate-300 mx-auto mt-2"></div>
                                </div>
                            )}

                            <div
                                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center relative overflow-hidden group hover:border-indigo-400 cursor-pointer transition-colors"
                                onClick={() => setViewingTransactionId(tx.id)}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${tx.amount > 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                                <div className="pl-3 flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-700 text-sm truncate relative group/title">
                                            {tx.teacherName && (
                                                <span className="absolute left-[-10px] top-1/2 -translate-y-1/2 -translate-x-full opacity-0 group-hover/title:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                                                    Lançado por: {tx.teacherName}
                                                    <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-800"></span>
                                                </span>
                                            )}
                                            {tx.type === 'BADGE' ? (
                                                <span className="flex items-center gap-2 text-amber-600">
                                                    <i className="fas fa-medal"></i>
                                                    {data.badgesCatalog.find(b => b.id === tx.description || b.name === tx.description)?.name || 'Nova Medalha'}
                                                </span>
                                            ) : tx.description}
                                        </p>
                                    </div>
                                    {editingTxDescId === tx.id ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            className="w-full text-xs p-1 border rounded mt-1 outline-none focus:border-indigo-400 font-medium text-slate-600 bg-slate-50"
                                            value={editingTxDescValue}
                                            onChange={e => setEditingTxDescValue(e.target.value)}
                                            onBlur={() => saveTxDescEdit(tx.id)}
                                            onKeyDown={e => { if (e.key === 'Enter') saveTxDescEdit(tx.id); if (e.key === 'Escape') setEditingTxDescId(null); }}
                                            placeholder="Adicione uma descrição..."
                                        />
                                    ) : (
                                        <p
                                            className="text-xs mt-1 cursor-pointer transition-colors group/desc"
                                            onClick={(e) => { e.stopPropagation(); setEditingTxDescId(tx.id); setEditingTxDescValue(tx.customDescription || ''); }}
                                            title="Clique para editar a descrição"
                                        >
                                            {tx.customDescription ? (
                                                <span className="text-slate-500 font-medium group-hover/desc:text-indigo-600">{tx.customDescription}</span>
                                            ) : (
                                                <span className="text-[10px] italic text-slate-300 font-normal group-hover/desc:text-indigo-400">+ Adicionar Descrição</span>
                                            )}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                                        <i className="far fa-clock"></i> {new Date(tx.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 pl-2">
                                    <div className="text-right">
                                        {editingTransactionId === tx.id ? (
                                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                <button
                                                    className="w-6 h-6 bg-slate-100 rounded text-slate-500 hover:text-indigo-600 font-bold flex items-center justify-center text-xs"
                                                    onClick={() => setEditingTransactionValue(prev => (Number(prev) - 1).toString())}
                                                >-</button>
                                                <input
                                                    type="number"
                                                    className="w-12 text-center font-black text-lg text-indigo-600 bg-transparent outline-none border-b border-indigo-300"
                                                    value={editingTransactionValue as string}
                                                    onChange={(e) => setEditingTransactionValue(e.target.value)}
                                                    onBlur={() => saveTransactionEdit(tx.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveTransactionEdit(tx.id);
                                                        if (e.key === 'Escape') setEditingTransactionId(null);
                                                    }}
                                                    autoFocus
                                                />
                                                <button
                                                    className="w-6 h-6 bg-slate-100 rounded text-slate-500 hover:text-indigo-600 font-bold flex items-center justify-center text-xs"
                                                    onClick={() => setEditingTransactionValue(prev => (Number(prev) + 1).toString())}
                                                >+</button>
                                            </div>
                                        ) : (
                                            <div
                                                className={`font-black text-lg cursor-pointer hover:scale-110 transition-transform ${tx.amount > 0 ? 'text-emerald-500' : 'text-slate-400'}`}
                                                onClick={(e) => { e.stopPropagation(); handleEditTransactionAmount(tx.id, tx.amount); }}
                                                title="Clique para editar"
                                            >
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            </div>
                                        )}
                                        <div className="text-[9px] font-bold text-slate-300 uppercase">LXC</div>
                                    </div>
                                    <div className="flex gap-1">
                                        {editingTransactionId !== tx.id && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditTransactionAmount(tx.id, tx.amount); }}
                                                className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                                title="Editar Valor"
                                            >
                                                <i className="fas fa-pen text-xs"></i>
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(tx.id); }}
                                            className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
                                            title="Excluir Item"
                                        >
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="h-4 w-0.5 bg-slate-200 mx-auto -mb-2 last:hidden"></div>
                        </div>
                    ))}
                </div>
            </div>

            {viewingTransactionId && (
                <GenericModal
                    title="Detalhes da Transação"
                    onClose={() => setViewingTransactionId(null)}
                    onSave={() => setViewingTransactionId(null)}
                    saveLabel="Fechar"
                    saveVariant="secondary"
                >
                    {(() => {
                        const tx = studentTransactions.find(t => t.id === viewingTransactionId);
                        if (!tx) return <p>Transação não encontrada.</p>;
                        return (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Data do Registro</span>
                                    <span className="text-slate-700 font-medium">{new Date(tx.date).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Tipo</span>
                                    <span className="text-slate-700 font-medium">{tx.type === 'BADGE' ? 'Medalha' : tx.type === 'TASK' ? 'Tarefa' : 'Penalidade'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Valor na Carteira</span>
                                    <span className={`font-black text-lg ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} LXC
                                    </span>
                                </div>
                                {tx.teacherName && (
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Assinatura / Autor</span>
                                        <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-xs">
                                            <i className="fas fa-tag mr-1"></i> {tx.teacherName}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-2 border-b border-slate-100 pb-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Motivo Principal</span>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 font-medium">
                                        {tx.description}
                                    </div>
                                </div>
                                {tx.customDescription && (
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Anotações do Professor</span>
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm italic">
                                            "{tx.customDescription}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </GenericModal>
            )}

            {
                isStoreOpen && (
                    <StoreView
                        student={student}
                        currentLxc={total}
                        onClose={() => setIsStoreOpen(false)}
                        onUpdateStudent={updateStudentAvatar}
                    />
                )
            }
        </div>
    );
};
