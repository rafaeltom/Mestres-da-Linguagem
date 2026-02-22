import React from 'react';
import { Button } from '../ui/SharedUI';
import { TaskDefinition, Badge, PenaltyDefinition } from '../../types';
import { AppData } from '../../services/localStorageService';

export interface CatalogViewProps {
    data: AppData;
    catalogTab: 'tasks' | 'badges' | 'penalties';
    setCatalogTab: (tab: 'tasks' | 'badges' | 'penalties') => void;
    setTutorialStep: (step: number) => void;
    setShowTutorial: (show: boolean) => void;
    openModal: (type: string, mode: string, item?: any) => void;
    requestDelete: (e: any, type: string, id: string, extra?: any, name?: string) => void;
    setPenaltySchoolId: (id: string) => void;
    setApplyPenaltyConfig: (config: any) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
    data, catalogTab, setCatalogTab, setTutorialStep, setShowTutorial,
    openModal, requestDelete, setPenaltySchoolId, setApplyPenaltyConfig
}) => {
    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
                <div className="flex flex-col">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                        Gerenciamento de missões e recompensas
                        <button onClick={() => { setTutorialStep(1); setShowTutorial(true); }} className="text-indigo-400 hover:text-indigo-600 transition-colors" title="Como funciona?">
                            <i className="fas fa-info-circle"></i>
                        </button>
                    </h2>
                    <p className="text-xs text-slate-500">Crie missões, medalhas e penalidades que estarão disponíveis para todas as escolas.</p>
                </div>
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                    <button onClick={() => setCatalogTab('tasks')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${catalogTab === 'tasks' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-600'}`}>Missões</button>
                    <button onClick={() => setCatalogTab('badges')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${catalogTab === 'badges' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-600'}`}>Medalhas</button>
                    <button onClick={() => setCatalogTab('penalties')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${catalogTab === 'penalties' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:text-red-600'}`}>Penalidades</button>
                </div>
            </div>

            {catalogTab === 'tasks' && (
                <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-indigo-900"><i className="fas fa-tasks mr-2"></i> Missões Padrão</h3>
                        <Button onClick={() => openModal('task', 'create')} className="text-xs">+ Nova Missão</Button>
                    </div>
                    <div className="space-y-3">
                        {data.taskCatalog.length === 0 && <p className="text-center text-slate-400 py-4 italic">Nenhuma missão cadastrada.</p>}
                        {data.taskCatalog.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                                <div className="min-w-0 pr-2">
                                    <p className="font-bold text-slate-700 truncate">{t.title}</p>
                                    <p className="text-xs text-slate-500 mb-1">Vale {t.defaultPoints} LXC</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {t.bimesters && t.bimesters.map(b => (
                                            <span key={b} className="text-[9px] bg-slate-200 px-1.5 rounded text-slate-600 font-bold">{b}ºB</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <Button variant="icon" onClick={(e: any) => { e.stopPropagation(); openModal('task', 'edit', t); }} title="Editar"><i className="fas fa-pen"></i></Button>
                                    <Button variant="icon" onClick={(e: any) => requestDelete(e, 'task', t.id, undefined, t.title)} title="Excluir"><i className="fas fa-trash text-red-400"></i></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {catalogTab === 'badges' && (
                <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-amber-600"><i className="fas fa-medal mr-2"></i> Medalhas & Conquistas</h3>
                        <Button onClick={() => openModal('badge', 'create')} variant="warning" className="text-xs">+ Nova Medalha</Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.badgesCatalog.length === 0 && <p className="col-span-3 text-center text-slate-400 py-4 italic">Nenhuma medalha cadastrada.</p>}
                        {data.badgesCatalog.map(b => (
                            <div key={b.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 relative hover:border-amber-300 transition-colors">
                                {b.imageUrl ? (
                                    <img src={b.imageUrl} alt="Medalha" className="w-10 h-10 rounded-full object-cover border border-amber-200 shadow-sm flex-shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0 text-lg"><i className={`fas ${b.icon}`}></i></div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-xs text-amber-900 leading-tight truncate">{b.name}</p>
                                    {b.rewardValue && b.rewardValue > 0 ? (
                                        <p className="text-[9px] text-emerald-600 font-bold">+ {b.rewardValue} LXC</p>
                                    ) : null}
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {b.bimesters && b.bimesters.map(bim => (
                                            <span key={bim} className="text-[8px] bg-white border border-amber-200 px-1 rounded text-amber-600 font-bold">{bim}º</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-1 bg-amber-100/50 rounded-lg flex-shrink-0 p-1">
                                    <button onClick={(e) => { e.stopPropagation(); openModal('badge', 'edit', b); }} className="text-amber-600 hover:text-amber-800 p-1"><i className="fas fa-pen text-xs"></i></button>
                                    <button onClick={(e) => requestDelete(e, 'badge', b.id, undefined, b.name)} className="text-red-400 hover:text-red-600 p-1"><i className="fas fa-trash text-xs"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {catalogTab === 'penalties' && (
                <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-red-600"><i className="fas fa-gavel mr-2"></i> Penalidades</h3>
                        <Button onClick={() => openModal('penalty', 'create')} variant="danger" className="text-xs">+ Nova Penalidade</Button>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                            <i className="fas fa-info-circle text-red-500 mt-0.5"></i>
                            <div>
                                <h4 className="font-bold text-red-800 text-sm">Área Restrita</h4>
                                <p className="text-xs text-red-700 mt-1">Use penalidades com moderação. O objetivo da gamificação é o reforço positivo.</p>
                            </div>
                        </div>

                        {data.penaltiesCatalog?.length === 0 && <p className="text-center text-slate-400 py-4 italic">Nenhuma penalidade cadastrada.</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.penaltiesCatalog?.map(p => (
                                <div key={p.id} className="p-4 bg-white rounded-xl border-l-4 border-l-red-500 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{p.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                                            <span className="inline-block mt-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                                                {p.defaultPoints} LXC
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button variant="danger" className="py-1 px-3 text-xs" onClick={() => {
                                                setPenaltySchoolId(data.schools[0]?.id || '');
                                                setApplyPenaltyConfig({ isOpen: true, penaltyId: p.id, amount: p.defaultPoints });
                                            }}>Aplicar</Button>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal('penalty', 'edit', p)} className="text-slate-400 hover:text-indigo-600 text-xs"><i className="fas fa-pen"></i></button>
                                                <button onClick={(e) => requestDelete(e, 'penalty', p.id, undefined, p.title)} className="text-slate-400 hover:text-red-600 text-xs"><i className="fas fa-trash"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
