import React, { ReactNode, useState } from 'react';
import { Button, ConfirmationModal } from '../ui/SharedUI';
import { School, ClassGroup } from '../../types';
import { AppData } from '../../services/localStorageService';

export interface SchoolManagementViewProps {
    data: AppData;
    renderCloudSyncButton: () => ReactNode;
    openModal: (type: string, mode: string, item?: any) => void;
    requestDelete: (e: any, type: string, id: string, extraId?: string, name?: string) => void;
    setSelectedSchoolId: (id: string) => void;
    setSelectedClassId: (id: string) => void;
    setShowBatchImport: (show: boolean) => void;
    setShowEditStudents: (show: boolean) => void;
    onJoinClass: (seed: string) => Promise<void>;
    onLeaveClass: (classId: string) => Promise<void>;
    onLeaveSchool: (schoolId: string) => Promise<void>;
    onRemoveCollaborator: (collaboratorUid: string, classId: string) => Promise<void>;
    sharedClassIds: string[];
    currentUser: any;
    resolvedTeacherNames: Record<string, string>;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SchoolManagementView: React.FC<SchoolManagementViewProps> = ({
    data, renderCloudSyncButton, openModal, requestDelete,
    setSelectedSchoolId, setSelectedClassId, setShowBatchImport, setShowEditStudents,
    onJoinClass, onLeaveClass, onLeaveSchool, onRemoveCollaborator, sharedClassIds, currentUser,
    resolvedTeacherNames, showToast
}) => {
    const [revealedSeeds, setRevealedSeeds] = useState<Set<string>>(new Set());
    const [joinSeed, setJoinSeed] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [showCollabManager, setShowCollabManager] = useState(false);
    const [managingClassId, setManagingClassId] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState<string | null>(null); // classId being left
    const [confirmLeaveConfig, setConfirmLeaveConfig] = useState<{
        isOpen: boolean,
        type: 'class' | 'school' | 'remove-collab',
        id: string,
        name: string,
        extraId?: string // used for collaboratorUid
    } | null>(null);

    const toggleSeedPreview = (classId: string) => {
        const next = new Set(revealedSeeds);
        if (next.has(classId)) next.delete(classId);
        else next.add(classId);
        setRevealedSeeds(next);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast(`${label} copiado!`, 'success');
    };

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinSeed.trim()) return;
        setIsJoining(true);
        try {
            await onJoinClass(joinSeed.trim());
            setJoinSeed('');
        } finally {
            setIsJoining(false);
        }
    };

    // Filtros para o gerenciador
    const mySchools = data.schools.filter(s => !(s as any).shared);
    const sharedSchools = data.schools.filter(s => (s as any).shared);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            {showCollabManager ? (
                /* --- PROJETO INTEGRADO (COLLAB VIEW) --- */
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <button
                            onClick={() => setShowCollabManager(false)}
                            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">🤝 Projeto Integrado</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* SEÇÃO A — COMO DONO */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                                    <i className="fas fa-crown"></i>
                                </div>
                                <h3 className="font-bold text-slate-700">Seção A — Suas Turmas</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-4">Compartilhe os códigos abaixo com colegas para que eles possam lançar notas e medalhas nestas turmas.</p>

                            <div className="space-y-3">
                                {mySchools.map(school => (
                                    school.classes?.map(cls => (
                                        <div key={cls.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase leading-none mb-1">{school.name}</p>
                                                    <h4 className="font-bold text-slate-800">{cls.name}</h4>
                                                </div>
                                                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-full border border-indigo-100">
                                                    {cls.sharedWith?.length || 0} Colaboradores
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                <code className="flex-1 text-center font-mono font-bold text-indigo-600 tracking-widest bg-white py-1 rounded border border-indigo-50">
                                                    {cls.seed || 'SEM_SEED'}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(cls.seed || '', 'Código Seed')}
                                                    className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                                    title="Copiar Código"
                                                >
                                                    <i className="fas fa-copy text-xs"></i>
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setManagingClassId(managingClassId === cls.id ? null : cls.id)}
                                                className="w-full py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <i className={`fas ${managingClassId === cls.id ? 'fa-chevron-up' : 'fa-users-cog'}`}></i>
                                                {managingClassId === cls.id ? 'Fechar Detalhes' : 'Gerenciar Colaboradores'}
                                            </button>

                                            {managingClassId === cls.id && (
                                                <div className="mt-4 pt-4 border-t border-slate-100 animate-slide-down">
                                                    {(!cls.sharedWith || cls.sharedWith.length === 0) ? (
                                                        <p className="text-[10px] text-slate-400 italic text-center py-2">Nenhum colaborador ainda.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {cls.sharedWith.map(collabUid => (
                                                                <div key={collabUid} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-[10px] font-bold text-slate-600 truncate">{resolvedTeacherNames[collabUid] || 'Carregando Nome...'}</span>
                                                                        <span className="text-[8px] text-slate-400 font-mono">ID: {collabUid.substring(0, 8)}...</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            const collabName = resolvedTeacherNames[collabUid] || 'este colaborador';
                                                                            setConfirmLeaveConfig({
                                                                                isOpen: true,
                                                                                type: 'remove-collab',
                                                                                id: cls.id,
                                                                                name: collabName,
                                                                                extraId: collabUid
                                                                            });
                                                                        }}
                                                                        className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                                                                        title="Remover Colaborador"
                                                                    >
                                                                        <i className="fas fa-user-minus text-[10px]"></i>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ))}
                            </div>
                        </div>

                        {/* SEÇÃO B — COMO COLABORADOR */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                                    <i className="fas fa-handshake"></i>
                                </div>
                                <h3 className="font-bold text-slate-700">Seção B — Como Colaborador</h3>
                            </div>

                            {/* Card para Entrar */}
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg text-white mb-6">
                                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                    <i className="fas fa-plus-circle"></i> Participar de novo Projeto
                                </h4>
                                <form onSubmit={handleJoinSubmit} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Seed da Turma..."
                                        value={joinSeed}
                                        onChange={(e) => setJoinSeed(e.target.value)}
                                        className="flex-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-xs font-bold placeholder:text-white/60 outline-none focus:bg-white/30 transition-all uppercase tracking-widest"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isJoining || !joinSeed.trim()}
                                        className="bg-white text-emerald-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isJoining ? <i className="fas fa-spinner fa-spin"></i> : 'Entrar'}
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-4">
                                {sharedSchools.length === 0 && <p className="text-[10px] text-slate-400 italic text-center py-10">Você ainda não colabora em turmas externas.</p>}
                                {sharedSchools.map(school => (
                                    <div key={school.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                        <div className="bg-emerald-50/50 border-b border-emerald-100 p-3 flex justify-between items-center">
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-slate-800 truncate">{school.name}</h4>
                                                <p className="text-[9px] text-emerald-600 font-bold uppercase">Propriedade de: {resolvedTeacherNames[school.ownerId || ''] || school.ownerName || 'Professor Externo'}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setConfirmLeaveConfig({
                                                        isOpen: true,
                                                        type: 'school',
                                                        id: school.id,
                                                        name: school.name
                                                    });
                                                }}
                                                className="bg-white text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg text-[10px] font-bold border border-red-100 transition-all shadow-sm"
                                                title="Sair de todas as turmas desta escola"
                                            >
                                                Sair da Escola
                                            </button>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {school.classes?.map(cls => (
                                                <div key={cls.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center">
                                                    <h5 className="text-xs font-bold text-slate-700">{cls.name}</h5>
                                                    <button
                                                        onClick={() => {
                                                            setConfirmLeaveConfig({
                                                                isOpen: true,
                                                                type: 'class',
                                                                id: cls.id,
                                                                name: cls.name
                                                            });
                                                        }}
                                                        disabled={isLeaving === cls.id}
                                                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all disabled:opacity-50"
                                                        title="Sair desta turma"
                                                    >
                                                        {isLeaving === cls.id ? <i className="fas fa-spinner fa-spin text-[10px]"></i> : <i className="fas fa-sign-out-alt text-[10px]"></i>}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* --- VISÃO PRINCIPAL (MANAGER VIEW) --- */
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <h2 className="text-lg md:text-xl font-bold text-slate-800">Estrutura Escolar</h2>
                            <button
                                onClick={() => setShowCollabManager(true)}
                                className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-[10px] font-bold border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                            >
                                🤝 Projeto Integrado
                            </button>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {renderCloudSyncButton()}
                            <Button onClick={() => openModal('school', 'create')} className="flex-1 sm:flex-none py-2 px-4 whitespace-nowrap">+ Nova Escola</Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {data.schools.length === 0 && <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400">Nenhuma escola cadastrada. Comece criando uma!</div>}
                        {[...data.schools].sort((a, b) => {
                            if ((a as any).shared && !(b as any).shared) return 1;
                            if (!(a as any).shared && (b as any).shared) return -1;
                            return a.name.localeCompare(b.name);
                        }).map((school: School) => {
                            const isSharedSchool = (school as any).shared;
                            let displayLogo = school.iconUrl;
                            if (!displayLogo) {
                                if (school.name.includes("EE Nossa Senhora Aparecida")) displayLogo = "nsalogo.png";
                                else if (school.name.includes("EMEF Professor Alípio Corrêa Neto") || school.name.includes("EMEF Alípio Corrêa Neto")) displayLogo = "alipiologo.png";
                            }

                            return (
                                <div key={school.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isSharedSchool ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200'}`}>
                                    <div className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-4 ${isSharedSchool ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <div className="relative group/logo flex-shrink-0">
                                                {displayLogo ? (
                                                    <img src={displayLogo} alt={school.name} className="w-12 h-12 rounded-lg object-cover bg-white shadow-sm border-2 border-slate-100" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-white text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                                                        <i className="fas fa-school text-xl"></i>
                                                    </div>
                                                )}
                                                {isSharedSchool && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white shadow-sm" title="Escola compartilhada">
                                                        <i className="fas fa-share-alt"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 pr-2">
                                                <h3 className={`font-bold text-lg truncate leading-tight ${isSharedSchool ? 'text-indigo-900' : 'text-slate-700'}`}>{school.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isSharedSchool ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                                        {isSharedSchool ? 'Projeto Integrado' : 'Minha Escola'}
                                                    </span>
                                                    {isSharedSchool && <span className="text-[10px] text-indigo-400 border-l border-indigo-200 pl-2">Propriedade: {resolvedTeacherNames[school.ownerId || ''] || school.ownerName || 'Outro Professor'}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            {!isSharedSchool ? (
                                                <>
                                                    <Button variant="icon" onClick={(e: any) => { e.stopPropagation(); openModal('school', 'edit', school); }} title="Editar Escola"><i className="fas fa-cog"></i></Button>
                                                    <Button variant="icon" onClick={(e: any) => requestDelete(e, 'school', school.id, undefined, school.name)} title="Excluir Escola"><i className="fas fa-trash text-red-400"></i></Button>
                                                    <div className="hidden sm:block w-px h-6 bg-slate-200 mx-2"></div>
                                                    <button onClick={() => { setSelectedSchoolId(school.id); openModal('class', 'create'); }} className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors border border-indigo-200 bg-white whitespace-nowrap">+ Turma</button>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-indigo-400 font-bold italic mr-2">Visualizando como colaborador</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(!school.classes || school.classes.length === 0) && <p className="text-slate-400 text-sm italic p-2 col-span-full text-center">Nenhuma turma nesta escola.</p>}
                                        {[...(school.classes || [])].sort((a, b) => a.name.localeCompare(b.name)).map((cls: ClassGroup) => {
                                            const isSharedClass = (cls as any).shared || sharedClassIds.includes(cls.id);
                                            const isOwner = cls.ownerId === currentUser?.uid || !cls.ownerId;
                                            return (
                                                <div key={cls.id} className={`border p-4 rounded-xl transition-all bg-white relative group flex flex-col justify-between ${isSharedClass ? 'border-indigo-100 hover:border-indigo-300' : 'border-slate-200 hover:border-slate-300'}`}>
                                                    <div>
                                                        <div className="flex flex-col items-start mb-2 pr-12 gap-1 w-full relative">
                                                            <h4 className={`font-bold line-clamp-1 break-all pr-2 ${isSharedClass ? 'text-indigo-900' : 'text-slate-800'}`} title={cls.name}>{cls.name}</h4>
                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                <button onClick={() => { setSelectedSchoolId(school.id); setSelectedClassId(cls.id); setShowEditStudents(true); }} className={`text-[10px] font-bold px-2 py-1 rounded-full hover:shadow-sm transition-all focus:outline-none ${isSharedClass ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>{cls.students?.length || 0} alunos</button>

                                                                {isOwner && (
                                                                    <div
                                                                        onClick={() => toggleSeedPreview(cls.id)}
                                                                        className="flex bg-indigo-50 text-indigo-600 rounded-md overflow-hidden text-[10px] font-bold border border-indigo-100 items-center cursor-pointer group/seed transition-all"
                                                                        title="Clique para ver/ocultar o Seed"
                                                                    >
                                                                        <span className="px-1.5 py-0.5 border-r border-indigo-100 bg-indigo-100/50 flex items-center justify-center">
                                                                            <i className="fas fa-barcode"></i>
                                                                        </span>
                                                                        <span className={`px-2 py-0.5 tracking-widest transition-all ${revealedSeeds.has(cls.id) ? 'opacity-100 scale-100' : 'opacity-20 blur-[2px] scale-95 select-none group-hover/seed:blur-0 group-hover/seed:opacity-60'}`}>
                                                                            {cls.seed || 'MIGRE_SALA'}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {isSharedClass && !isOwner && (
                                                                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase leading-none">
                                                                        <i className="fas fa-check-circle text-[8px]"></i> Colaborador
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2 mt-4">
                                                            <button onClick={() => { setSelectedSchoolId(school.id); setSelectedClassId(cls.id); setShowBatchImport(true); }} className="flex-1 bg-emerald-50 text-emerald-600 text-[10px] sm:text-xs font-bold py-2 rounded-lg hover:bg-emerald-100 border border-emerald-100 flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm">
                                                                <i className="fas fa-file-import"></i> {isOwner ? 'Importar' : 'Ver Lista'}
                                                            </button>
                                                            <button onClick={() => { setSelectedSchoolId(school.id); setSelectedClassId(cls.id); setShowEditStudents(true); }} className="flex-1 bg-indigo-50 text-indigo-600 text-[10px] sm:text-xs font-bold py-2 rounded-lg hover:bg-indigo-100 border border-indigo-100 flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm">
                                                                <i className="fas fa-users-cog"></i> {isOwner ? 'Gerenciar' : 'Ver Alunos'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="absolute top-3 right-3 flex gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-slate-100 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        {isOwner && (
                                                            <>
                                                                <button onClick={(e: any) => { e.stopPropagation(); openModal('class', 'edit', cls); }} className="p-1 text-slate-400 hover:text-indigo-500 w-7 h-7 flex items-center justify-center" title="Configurações da Turma"><i className="fas fa-cog text-xs"></i></button>
                                                                <button onClick={(e: any) => requestDelete(e, 'class', cls.id, school.id, cls.name)} className="p-1 text-slate-400 hover:text-red-500 w-7 h-7 flex items-center justify-center" title="Excluir Turma Temporariamente"><i className="fas fa-trash text-xs"></i></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!confirmLeaveConfig?.isOpen}
                onClose={() => setConfirmLeaveConfig(null)}
                onConfirm={async () => {
                    if (!confirmLeaveConfig) return;
                    try {
                        if (confirmLeaveConfig.type === 'class') {
                            setIsLeaving(confirmLeaveConfig.id);
                            await onLeaveClass(confirmLeaveConfig.id);
                        } else if (confirmLeaveConfig.type === 'school') {
                            setIsLeaving(confirmLeaveConfig.id);
                            await onLeaveSchool(confirmLeaveConfig.id);
                        } else if (confirmLeaveConfig.type === 'remove-collab') {
                            await onRemoveCollaborator(confirmLeaveConfig.extraId!, confirmLeaveConfig.id);
                        }
                    } finally {
                        setIsLeaving(null);
                        setConfirmLeaveConfig(null);
                    }
                }}
                title={
                    confirmLeaveConfig?.type === 'class' ? 'Sair da Turma' :
                        confirmLeaveConfig?.type === 'school' ? 'Sair da Escola' :
                            'Remover Colaborador'
                }
                message={
                    confirmLeaveConfig?.type === 'class'
                        ? `Deseja realmente deixar de colaborar com a turma ${confirmLeaveConfig.name}?`
                        : confirmLeaveConfig?.type === 'school'
                            ? `Deseja realmente sair de todas as turmas da ${confirmLeaveConfig.name}?`
                            : `Remover ${confirmLeaveConfig?.name}? Ele perderá acesso à turma imediatamente.`
                }
                confirmLabel={confirmLeaveConfig?.type === 'remove-collab' ? "Sim, Remover" : "Sim, Sair"}
                variant={confirmLeaveConfig?.type === 'remove-collab' ? "danger" : "warning"}
            />
        </div>
    );
};
