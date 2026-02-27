import React, { useState } from 'react';
import { Button } from '../ui/SharedUI';
import { TaskDefinition, Badge, PenaltyDefinition, LevelRule, Bimester, CATEGORY_CONFIG } from '../../types';
import { AppData } from '../../services/localStorageService';
import { LEVEL_RULES, LEVEL_COLORS } from '../../utils/gamificationRules';

export interface CatalogViewProps {
    data: AppData;
    catalogTab: 'tasks' | 'badges' | 'penalties' | 'levels';
    setCatalogTab: (tab: 'tasks' | 'badges' | 'penalties' | 'levels') => void;
    setTutorialStep: (step: number) => void;
    setShowTutorial: (show: boolean) => void;
    openModal: (type: string, mode: string, item?: any) => void;
    requestDelete: (e: any, type: string, id: string, extra?: any, name?: string) => void;
    setPenaltySchoolId: (id: string) => void;
    setApplyPenaltyConfig: (config: any) => void;
    onSaveLevelRules: (rules: Partial<Record<Bimester, LevelRule[]>>) => void;
    currentUser: any;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
    data, catalogTab, setCatalogTab, setTutorialStep, setShowTutorial,
    openModal, requestDelete, setPenaltySchoolId, setApplyPenaltyConfig,
    onSaveLevelRules, currentUser
}) => {
    // levels editing state
    const [editingRules, setEditingRules] = useState<Partial<Record<Bimester, LevelRule[]>> | null>(null);
    const [activeLevelBim, setActiveLevelBim] = useState<Bimester>(1);
    const [taskSearch, setTaskSearch] = useState('');
    const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('all');
    const [bimesterFilter, setBimesterFilter] = useState<number | 'all'>('all');
    const [schoolFilter, setSchoolFilter] = useState<string>('all');

    const startEditLevels = () => {
        // Deep clone the current rules (custom or default)
        const current = ([1, 2, 3, 4] as Bimester[]).reduce((acc, b) => {
            acc[b] = JSON.parse(JSON.stringify((data.customLevelRules?.[b]) || LEVEL_RULES[b]));
            return acc;
        }, {} as Record<Bimester, LevelRule[]>);
        setEditingRules(current);
    };

    const handleEditingRuleField = (bim: Bimester, idx: number, field: keyof LevelRule, value: any) => {
        setEditingRules(prev => {
            if (!prev) return prev;
            const copy = { ...prev, [bim]: [...(prev[bim] || [])] };
            (copy[bim] as LevelRule[])[idx] = { ...(copy[bim] as LevelRule[])[idx], [field]: value };
            return copy;
        });
    };

    const handleSaveLevels = () => {
        if (!editingRules) return;
        onSaveLevelRules(editingRules);
        setEditingRules(null);
    };

    const handleResetLevels = () => {
        onSaveLevelRules({});
        setEditingRules(null);
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-20">
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
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200 flex-wrap gap-1">
                    <button onClick={() => setCatalogTab('tasks')} className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${catalogTab === 'tasks' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-600'}`}>Missões</button>
                    <button onClick={() => setCatalogTab('badges')} className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${catalogTab === 'badges' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-600'}`}>Medalhas</button>
                    <button onClick={() => setCatalogTab('penalties')} className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${catalogTab === 'penalties' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:text-red-600'}`}>Penalidades</button>
                    <button onClick={() => { setCatalogTab('levels'); startEditLevels(); }} className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${catalogTab === 'levels' ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-purple-600'}`}>Regras</button>
                </div>
            </div>

            {catalogTab === 'tasks' && (
                <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-indigo-900"><i className="fas fa-tasks mr-2"></i> Tarefas</h3>
                        <Button onClick={() => openModal('task', 'create')} className="text-xs">+ Nova Tarefa</Button>
                    </div>

                    {/* Search + Category filter */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                        {/* Text search */}
                        <div className="relative flex-1">
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                            <input
                                type="text"
                                placeholder="Buscar tarefa..."
                                value={taskSearch}
                                onChange={e => setTaskSearch(e.target.value)}
                                className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-400 bg-slate-50 transition-colors"
                            />
                            {taskSearch && (
                                <button onClick={() => setTaskSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                    <i className="fas fa-times-circle text-xs"></i>
                                </button>
                            )}
                        </div>
                        {/* Category chips */}
                        <div className="flex gap-1.5 flex-wrap">
                            {([
                                { value: 'all', label: 'Todas', cls: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
                                ...Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
                                    value: key,
                                    label: config.label.replace('Missão ', '').replace('— ', '').replace(' —', ''),
                                    cls: `${config.color.replace('text-', 'bg-')}/10 ${config.color} hover:${config.color.replace('text-', 'bg-')}/20`
                                }))
                            ] as { value: string; label: string; cls: string }[]).map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => setTaskCategoryFilter(cat.value)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${cat.cls} ${taskCategoryFilter === cat.value ? 'ring-2 ring-offset-1 ring-indigo-400 shadow-sm' : 'opacity-70'}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* New Filters: Bimester and School */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Filtro por Bimestre</label>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setBimesterFilter('all')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${bimesterFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}
                                >
                                    Todos
                                </button>
                                {[1, 2, 3, 4].map(b => (
                                    <button
                                        key={b}
                                        onClick={() => setBimesterFilter(b)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${bimesterFilter === b ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}
                                    >
                                        {b}º Bim
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="w-full sm:w-64">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Filtro por Escola</label>
                            <select
                                value={schoolFilter}
                                onChange={(e) => setSchoolFilter(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400"
                            >
                                <option value="all">Todas as Escolas</option>
                                {data.schools.filter(s => !s.isDeleted).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Task grid */}
                    {(() => {
                        const filtered = data.taskCatalog.filter(t => {
                            const matchText = !taskSearch ||
                                t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
                                (t.description || '').toLowerCase().includes(taskSearch.toLowerCase());
                            const matchCat = taskCategoryFilter === 'all' ||
                                (taskCategoryFilter === 'Custom' ? (!t.category || t.category === 'Custom') : t.category === taskCategoryFilter);
                            const matchBim = bimesterFilter === 'all' || (t.bimesters && t.bimesters.includes(bimesterFilter as Bimester));
                            const matchSchool = schoolFilter === 'all' || (t.assignedSchoolIds && t.assignedSchoolIds.includes(schoolFilter));
                            return matchText && matchCat && matchBim && matchSchool;
                        });
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.taskCatalog.length === 0 && <p className="col-span-full text-center text-slate-400 py-4 italic">Nenhuma tarefa cadastrada.</p>}
                                {data.taskCatalog.length > 0 && filtered.length === 0 && <p className="col-span-full text-center text-slate-400 py-4 italic">Nenhuma tarefa encontrada para os filtros selecionados.</p>}
                                {filtered.map(t => {
                                    const isOwner = !t.ownerId || t.ownerId === currentUser?.uid;
                                    const taskSchools = (t.assignedSchoolIds || []).map(sid => data.schools.find(s => s.id === sid)?.name).filter(Boolean);

                                    return (
                                        <div key={t.id} className={`group bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${!isOwner ? 'bg-emerald-50/10' : ''}`}>
                                            <div className="p-4 flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {(() => {
                                                            const cat = t.category || 'Custom';
                                                            const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Custom'];
                                                            const bgColor = config.color.replace('text-', 'bg-');
                                                            return (
                                                                <span className={`text-[8px] ${bgColor}/10 ${config.color} font-black px-1.5 py-0.5 rounded uppercase tracking-wider`}>
                                                                    <i className={`fas ${config.icon} mr-1`}></i> {config.label.replace('Missão ', '').replace('— ', '').replace(' —', '')}
                                                                </span>
                                                            );
                                                        })()}
                                                        {t.shared && (
                                                            <span className="text-[8px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider" title={isOwner ? "Compartilhada com seus colaboradores" : "Compartilhada por outro professor"}>
                                                                <i className="fas fa-share-alt mr-1"></i> {isOwner ? 'Pública' : 'Colab'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {isOwner ? (
                                                            <>
                                                                <button onClick={(e: any) => { e.stopPropagation(); openModal('task', 'edit', t); }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"><i className="fas fa-pen text-[10px]"></i></button>
                                                                <button onClick={(e: any) => requestDelete(e, 'task', t.id, undefined, t.title)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"><i className="fas fa-trash text-[10px]"></i></button>
                                                            </>
                                                        ) : (
                                                            <span className="w-7 h-7 flex items-center justify-center text-slate-300" title="Somente Leitura"><i className="fas fa-lock text-[10px]"></i></span>
                                                        )}
                                                    </div>
                                                </div>

                                                <h4 className="font-bold text-slate-800 text-sm mb-1 leading-snug">{t.title}</h4>
                                                <p className="text-[11px] text-slate-500 line-clamp-2 min-h-[2rem]">{t.description || 'Sem descrição.'}</p>

                                                {!isOwner && t.ownerName && (
                                                    <p className="text-[9px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                                                        <i className="fas fa-user-circle text-[8px]"></i> {t.ownerName}
                                                    </p>
                                                )}

                                                <div className="mt-3 flex items-center justify-between">
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4].map(b => (
                                                            <span key={b} className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black ${t.bimesters?.includes(b as Bimester) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                                                {b}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                                        {t.defaultPoints} LXC
                                                    </span>
                                                </div>
                                            </div>

                                            {taskSchools.length > 0 && (
                                                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-hidden">
                                                    <i className="fas fa-school text-[10px] text-slate-400"></i>
                                                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                                        {taskSchools.map((s, idx) => (
                                                            <span key={idx} className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            )}

            {catalogTab === 'badges' && (
                <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-amber-600"><i className="fas fa-medal mr-2"></i> Medalhas & Conquistas</h3>
                        <Button onClick={() => openModal('badge', 'create')} variant="warning" className="text-xs">+ Nova Medalha</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.badgesCatalog.length === 0 && <p className="col-span-full text-center text-slate-400 py-4 italic">Nenhuma medalha cadastrada.</p>}
                        {data.badgesCatalog.map(b => {
                            const isOwner = !b.ownerId || b.ownerId === currentUser?.uid;
                            return (
                                <div key={b.id} className={`p-4 bg-white rounded-xl border-l-4 border border-slate-100 shadow-sm hover:shadow-md transition-all ${isOwner ? 'border-l-amber-500' : 'border-l-emerald-500 bg-emerald-50/10'}`}>
                                    <div className="flex gap-4">
                                        <div className="relative">
                                            {b.imageUrl ? (
                                                <img src={b.imageUrl} alt="Medalha" className="w-12 h-12 rounded-full object-cover border border-amber-200 shadow-sm flex-shrink-0" />
                                            ) : (
                                                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0 text-xl"><i className={`fas ${b.icon}`}></i></div>
                                            )}
                                            {b.shared && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white shadow-sm" title="Compartilhada">
                                                    <i className="fas fa-share-alt"></i>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="pr-2">
                                                    <h4 className="font-bold text-slate-800">{b.name}</h4>
                                                    {!isOwner && b.ownerName && <p className="text-[9px] text-emerald-600 font-bold italic">De: {b.ownerName}</p>}
                                                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{b.description}</p>
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        {b.rewardValue && b.rewardValue > 0 ? (
                                                            <span className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                                + {b.rewardValue} LXC
                                                            </span>
                                                        ) : null}
                                                        {b.bimesters && b.bimesters.map(bim => (
                                                            <span key={bim} className="text-[9px] bg-slate-100 px-1.5 py-1 rounded text-slate-500 font-bold">{bim}ºB</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    {isOwner ? (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); openModal('badge', 'edit', b); }} className="text-slate-400 hover:text-indigo-600 p-1"><i className="fas fa-pen"></i></button>
                                                            <button onClick={(e) => requestDelete(e, 'badge', b.id, undefined, b.name)} className="text-slate-400 hover:text-red-600 p-1"><i className="fas fa-trash"></i></button>
                                                        </>
                                                    ) : (
                                                        <i className="fas fa-lock text-slate-300 text-xs" title="Somente leitura"></i>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
                            {data.penaltiesCatalog?.map(p => {
                                const isOwner = !p.ownerId || p.ownerId === currentUser?.uid;
                                return (
                                    <div key={p.id} className={`p-4 bg-white rounded-xl border-l-4 border border-slate-100 shadow-sm hover:shadow-md transition-all ${isOwner ? 'border-l-red-500' : 'border-l-emerald-500 bg-emerald-50/10'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-slate-800 leading-tight">{p.title}</h4>
                                                    {p.shared && <i className="fas fa-share-alt text-[10px] text-emerald-600" title="Compartilhada"></i>}
                                                </div>
                                                {!isOwner && p.ownerName && <p className="text-[9px] text-emerald-600 font-bold italic mb-1">Dono: {p.ownerName}</p>}
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
                                                {isOwner ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => openModal('penalty', 'edit', p)} className="text-slate-400 hover:text-indigo-600 text-xs"><i className="fas fa-pen"></i></button>
                                                        <button onClick={(e) => requestDelete(e, 'penalty', p.id, undefined, p.title)} className="text-slate-400 hover:text-red-600 text-xs"><i className="fas fa-trash"></i></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end">
                                                        <i className="fas fa-lock text-slate-300 text-[10px]" title="Somente leitura"></i>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            {catalogTab === 'levels' && (
                <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
                    {/* Header */}
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-purple-700"><i className="fas fa-layer-group mr-2"></i>Visualizar os níveis de gamificação</h3>
                        <p className="text-xs text-slate-500 mt-1">Essas são as regras de níveis para a versão atual do projeto, disponíveis aqui apenas para visualização.</p>
                    </div>

                    {/* Info banner */}
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 mb-5">
                        <i className="fas fa-eye text-purple-400 text-sm flex-shrink-0"></i>
                        <p className="text-[11px] text-purple-700">Atualmente os níveis estão disponíveis apenas para <strong>visualização</strong>. A personalização de níveis será habilitada em uma versão futura.</p>
                    </div>

                    {/* Bimester tabs */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 flex-wrap">
                        {([1, 2, 3, 4] as Bimester[]).map(b => (
                            <button key={b} onClick={() => setActiveLevelBim(b)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all min-w-[60px] ${activeLevelBim === b ? 'bg-white shadow text-purple-700' : 'text-slate-400 hover:text-slate-700'}`}>
                                {b}º Bimestre
                            </button>
                        ))}
                    </div>

                    {/* Read-only tier table */}
                    {editingRules && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-[1.5rem_1fr_5rem_4rem] gap-3 px-2">
                                <span></span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Nome do Nível</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Mín. LXC</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Máx. LXC</span>
                            </div>
                            {(editingRules[activeLevelBim] || []).map((rule, idx) => (
                                <div key={idx} className="grid grid-cols-[1.5rem_1fr_5rem_4rem] gap-3 items-center px-2 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${rule.color}`}></div>
                                    <span className="font-semibold text-slate-700 text-sm">{rule.title}</span>
                                    <span className="text-center font-mono text-sm text-slate-600 font-bold">{rule.min}</span>
                                    <span className="text-center font-mono text-sm text-slate-400">{rule.max === null ? '∞' : rule.max}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
