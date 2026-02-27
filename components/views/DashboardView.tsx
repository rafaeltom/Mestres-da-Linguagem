import React, { ReactNode, useMemo } from 'react';
import { Button } from '../ui/SharedUI';
import { School, ClassGroup, Bimester, TaskDefinition, CATEGORY_CONFIG } from '../../types';
import { AppData } from '../../services/localStorageService';


const getTaskCategory = (task?: TaskDefinition) => task?.category || 'Custom';
const getCatConfig = (task?: TaskDefinition) => CATEGORY_CONFIG[getTaskCategory(task)] || CATEGORY_CONFIG['Custom'];

export interface DashboardViewProps {
    currentSchool: School | undefined;
    currentClass: ClassGroup | undefined;
    currentBimester: Bimester;
    setCurrentBimester: (b: Bimester) => void;
    setModalConfig: (config: any) => void;
    renderCloudSyncButton: () => ReactNode;
    selectedSchoolId: string;
    selectedClassId: string;
    data: AppData;
    showToast: (msg: string, type?: string) => void;
    selectedStudentsForTask: string[];
    setSelectedStudentsForTask: React.Dispatch<React.SetStateAction<string[]>>;
    filteredStudentsList: any[];
    individualScores: Record<string, number>;
    setIndividualScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    selectedTaskId: string;
    setSelectedTaskId: (id: string) => void;
    isGivingBadge: boolean;
    setIsGivingBadge: (val: boolean) => void;
    manualPoints: number;
    setManualPoints: React.Dispatch<React.SetStateAction<number>>;
    manualDesc: string;
    setManualDesc: (desc: string) => void;
    customMissionDesc: string;
    setCustomMissionDesc: (desc: string) => void;
    studentSearch: string;
    setStudentSearch: (search: string) => void;
    setView: (view: string) => void;
    setViewingStudentId: (id: string) => void;
    pendingDeleteStudentId: string | null;
    setPendingDeleteStudentId: (id: string | null) => void;
    requestDelete: (e: any, type: string, id: string, extraId?: string, name?: string) => void;
    openModal: (type: string, mode: string, item?: any) => void;
    giveRewards: () => void;
    openStudentSettings: (student: any) => void;
    getLevel: (lxc: number, bimester: number) => { title: string, color: string };
    profile: any;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    currentSchool, currentClass, currentBimester, setCurrentBimester,
    setModalConfig, renderCloudSyncButton, selectedSchoolId, selectedClassId,
    data, showToast, selectedStudentsForTask, setSelectedStudentsForTask,
    filteredStudentsList, individualScores, setIndividualScores,
    selectedTaskId, setSelectedTaskId, isGivingBadge, setIsGivingBadge,
    manualPoints, setManualPoints, manualDesc, setManualDesc,
    customMissionDesc, setCustomMissionDesc, studentSearch, setStudentSearch,
    setView, setViewingStudentId, pendingDeleteStudentId, setPendingDeleteStudentId,
    requestDelete, openModal, giveRewards, openStudentSettings, getLevel, profile
}) => {
    // Derive selected task object to use category metadata
    const selectedTask = useMemo(() =>
        isGivingBadge ? undefined : (selectedTaskId ? data.taskCatalog.find(t => t.id === selectedTaskId) : undefined),
        [isGivingBadge, selectedTaskId, data.taskCatalog]
    );
    const catConfig = useMemo(() => getCatConfig(selectedTask), [selectedTask]);
    const pointMin = catConfig.min;
    const pointMax = catConfig.max;

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="w-full md:w-36 lg:w-48 flex-shrink-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Escola</label>
                    <button
                        onClick={() => setModalConfig({ isOpen: true, type: 'school-selector', mode: 'create' })}
                        className="w-full flex items-center justify-between py-1 text-sm font-bold text-slate-800 group"
                    >
                        <span className="truncate group-hover:text-indigo-600 transition-colors block text-left" title={currentSchool?.name || 'Selecione a Escola...'}>{currentSchool?.name || 'Selecione a Escola...'}</span>
                        <i className="fas fa-chevron-down text-[10px] opacity-30 group-hover:opacity-100 transition-all ml-1 flex-shrink-0"></i>
                    </button>
                </div>
                <div className="hidden md:block w-px h-8 bg-slate-200 flex-shrink-0"></div>
                <div className="w-full md:w-36 lg:w-40 flex-shrink-0 border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        Turma
                        {currentClass?.shared && <i className="fas fa-share-alt text-indigo-400 animate-pulse"></i>}
                    </label>
                    <button
                        onClick={() => {
                            if (!selectedSchoolId) {
                                showToast("Selecione uma escola primeiro.", "info");
                                return;
                            }
                            setModalConfig({ isOpen: true, type: 'class-selector', mode: 'create' });
                        }}
                        className="w-full flex items-center justify-between py-1 text-sm font-bold text-slate-800 group"
                    >
                        <span className="truncate group-hover:text-indigo-600 transition-colors block text-left" title={currentClass?.name || 'Selecione a Turma...'}>
                            {currentClass?.name || 'Selecione a Turma...'}
                        </span>
                        <i className="fas fa-chevron-down text-[10px] opacity-30 group-hover:opacity-100 transition-all ml-1 flex-shrink-0"></i>
                    </button>
                    {currentClass?.shared && currentSchool?.ownerName && (
                        <p className="text-[8px] text-indigo-400 font-bold -mt-1 truncate opacity-70">Dono: {currentSchool.ownerName}</p>
                    )}
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1 w-full md:w-auto overflow-x-auto justify-between md:justify-start mt-2 md:mt-0">
                    {[1, 2, 3, 4].map(b => (
                        <button key={b} onClick={() => setCurrentBimester(b as Bimester)} className={`flex-1 md:flex-none px-3 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${currentBimester === b ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>{b}º Bim</button>
                    ))}
                </div>
                {renderCloudSyncButton()}
            </div>

            {!selectedClassId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-20 md:py-0">
                    <i className="fas fa-chalkboard-teacher text-6xl mb-4"></i>
                    <p className="font-bold text-center">Selecione uma turma acima para começar</p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 h-full overflow-y-auto lg:overflow-hidden">
                    <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-sm min-h-[400px]">
                        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-3">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button onClick={() => {
                                    if (selectedStudentsForTask.length === filteredStudentsList.length && filteredStudentsList.length > 0) {
                                        setSelectedStudentsForTask([]);
                                        setIndividualScores({});
                                    }
                                    else {
                                        setSelectedStudentsForTask(filteredStudentsList.map(s => s.id));
                                        const defaultPts = selectedTaskId ? (isGivingBadge ? 0 : data.taskCatalog.find(t => t.id === selectedTaskId)?.defaultPoints ?? manualPoints) : manualPoints;
                                        const newScores: Record<string, number> = {};
                                        filteredStudentsList.forEach(s => newScores[s.id] = defaultPts);
                                        setIndividualScores(newScores);
                                    }
                                }} className="bg-white border text-slate-600 hover:bg-slate-100 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm whitespace-nowrap">
                                    {selectedStudentsForTask.length === filteredStudentsList.length && filteredStudentsList.length > 0 ? 'Desmarcar' : 'Todos'}
                                </button>
                                <div className="relative flex-1 md:flex-none">
                                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                    <input
                                        type="text"
                                        placeholder="Buscar aluno(a)..."
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        className="w-full md:w-48 pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-white"
                                    />
                                    {studentSearch && (
                                        <button
                                            onClick={() => setStudentSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                        >
                                            <i className="fas fa-times-circle"></i>
                                        </button>
                                    )}
                                </div>
                                <div className="bg-indigo-50 px-3 py-1.5 rounded-lg flex justify-between items-center gap-2 border border-indigo-100">
                                    <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">Selecionados</span>
                                    <span className="bg-white text-indigo-600 px-2 rounded text-[10px] font-bold shadow-sm">{selectedStudentsForTask.length}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {filteredStudentsList.length === 0 && <div className="text-center py-20 text-slate-400 italic">Nenhum aluno encontrado na busca.</div>}
                            {filteredStudentsList.map(student => {
                                const isSelected = selectedStudentsForTask.includes(student.id);
                                const level = getLevel(student.lxcTotal[currentBimester] || 0, currentBimester);
                                return (
                                    <div key={student.id}
                                        onClick={() => setSelectedStudentsForTask(prev => {
                                            if (prev.includes(student.id)) {
                                                const newScores = { ...individualScores };
                                                delete newScores[student.id];
                                                setIndividualScores(newScores);
                                                return prev.filter(id => id !== student.id);
                                            }
                                            const defaultPts = selectedTaskId ? (isGivingBadge ? 0 : data.taskCatalog.find(t => t.id === selectedTaskId)?.defaultPoints ?? manualPoints) : manualPoints;
                                            setIndividualScores(s => ({ ...s, [student.id]: defaultPts }));
                                            return [...prev, student.id];
                                        })}
                                        className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border-2 transition-all group ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-9 h-9 rounded-full ${level.color} flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0 relative overflow-hidden`}>
                                                {student.avatarId && student.avatarId !== 'default' ? (
                                                    <img src={`/assets/avatars/${student.avatarId}.png`} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{student.name.charAt(0)}</span>
                                                )}
                                                {student.marked && (
                                                    <div
                                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white z-10"
                                                        style={{ backgroundColor: student.markedColor || '#22c55e' }}
                                                    ></div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-700 text-sm truncate">{student.nickname || student.name}</p>
                                                    {student.marked && student.markedLabel && (
                                                        <span
                                                            className="text-[9px] px-1.5 py-0.5 rounded text-white font-bold"
                                                            style={{ backgroundColor: student.markedColor || '#22c55e' }}
                                                        >
                                                            {student.markedLabel}
                                                        </span>
                                                    )}
                                                    {student.nickname && <span className="text-[9px] text-slate-400 hidden sm:inline">({student.name})</span>}
                                                </div>
                                                <div className="flex gap-2">
                                                    {student.registrationId && <span className="text-[9px] bg-slate-100 px-2 rounded-full text-slate-500 whitespace-nowrap">Matr: {student.registrationId}</span>}
                                                    <span className="text-[10px] bg-slate-100 px-2 rounded-full text-slate-500 whitespace-nowrap">{level.title}</span>
                                                    <a
                                                        href={`?view=student-view&studentId=${student.id}`}
                                                        onClick={(e) => {
                                                            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setViewingStudentId(student.id);
                                                                setView('student-view');
                                                            }
                                                        }}
                                                        className="text-[10px] text-indigo-400 font-bold hover:underline whitespace-nowrap flex items-center gap-1"
                                                    >
                                                        <i className="fas fa-eye"></i> <i className="fas fa-pen text-[8px]"></i> Ver e editar
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 pl-2 flex-shrink-0">
                                            {isSelected && !isGivingBadge ? (
                                                <div className="flex items-center gap-1 bg-white rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="number"
                                                        className={`w-14 text-center border-b-2 bg-transparent font-bold text-sm outline-none ${(individualScores[student.id] ?? manualPoints) < 0 ? 'text-red-500 border-red-200 focus:border-red-400' : 'text-indigo-600 border-indigo-200 focus:border-indigo-400'
                                                            } custom-number-input transition-colors`}
                                                        value={individualScores[student.id] ?? manualPoints}
                                                        min={pointMin}
                                                        max={pointMax}
                                                        onChange={(e) => {
                                                            let val = parseInt(e.target.value) || 0;
                                                            setIndividualScores(prev => ({ ...prev, [student.id]: Math.min(pointMax, Math.max(pointMin, val)) }));
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <span className="font-mono font-bold text-slate-600">{student.lxcTotal[currentBimester] || 0}</span>
                                            )}

                                            {pendingDeleteStudentId === student.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        requestDelete(e, 'student', student.id, undefined, student.name);
                                                        setPendingDeleteStudentId(null);
                                                    }}
                                                    className="text-red-400 hover:text-red-600 px-2 animate-bounce"
                                                    title="Confirmar Exclusão Definitiva"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openStudentSettings(student); }}
                                                className="text-slate-300 hover:text-indigo-500 px-2"
                                                title="Configurações do Aluno"
                                            >
                                                <i className="fas fa-cog"></i>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-full lg:w-72 xl:w-80 bg-white rounded-3xl border border-slate-200 p-4 xl:p-5 flex flex-col shadow-xl shadow-slate-200/50 lg:h-full h-[580px] flex-shrink-0">
                        <div className="flex bg-slate-100 rounded-xl p-1 mb-4 xl:mb-5">
                            <button onClick={() => setIsGivingBadge(false)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!isGivingBadge ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Dar Pontos</button>
                            <button onClick={() => setIsGivingBadge(true)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${isGivingBadge ? 'bg-white shadow text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>Dar Medalha</button>
                        </div>

                        <div className="mb-3">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    {isGivingBadge ? 'Escolher Medalha' : 'Categoria da tarefa'}
                                </span>
                                <button onClick={() => openModal(isGivingBadge ? 'badge' : 'task', 'create')} className="text-[10px] text-indigo-500 font-bold hover:underline bg-indigo-50 px-2 py-0.5 rounded-md">+ Novo</button>
                            </div>

                            <button
                                onClick={() => setModalConfig({ isOpen: true, type: 'mission-selector', mode: 'create' })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:border-indigo-500 text-left flex justify-between items-center transition-colors"
                            >
                                <span className="truncate pr-2 flex items-center gap-1.5">
                                    {selectedTaskId
                                        ? (isGivingBadge
                                            ? data.badgesCatalog.find(b => b.id === selectedTaskId)?.name
                                            : (() => {
                                                const t = data.taskCatalog.find(t => t.id === selectedTaskId);
                                                const cc = CATEGORY_CONFIG[t?.category || 'Custom'] || CATEGORY_CONFIG['Custom'];
                                                return <><i className={`fas ${cc.icon} ${cc.color}`}></i> {cc.label}</>;
                                            })())
                                        : <span className="text-slate-400">— Tarefa Rápida —</span>
                                    }
                                </span>
                                <i className="fas fa-chevron-down text-slate-400 text-[10px]"></i>
                            </button>
                        </div>

                        {!isGivingBadge && (
                            <div className="animate-fade-in space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wide">Nome da missão</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="Ex: Participação"
                                        value={manualDesc}
                                        onFocus={(e: any) => {
                                            if (!manualDesc && !selectedTaskId) {
                                                setManualDesc(`Atividade de ${profile?.subject || 'Linguagem'}`);
                                            }
                                            setTimeout(() => e.target.select(), 10);
                                        }}
                                        onChange={(e: any) => setManualDesc(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wide">Descrição (opcional)</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-400 transition-colors text-slate-600"
                                        placeholder="Detalhes da missão..."
                                        value={customMissionDesc}
                                        onChange={(e: any) => setCustomMissionDesc(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-1 justify-center mt-1 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                                    <button onClick={() => {
                                        setManualPoints(p => Math.max(pointMin, p - 5));
                                    }} className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:border-indigo-300 touch-manipulation text-slate-600 transition-all active:scale-95">-</button>
                                    <div className="flex items-center justify-center flex-1 gap-2">
                                        <div className="flex flex-col items-center">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase">LXC</label>
                                            <input
                                                type="number"
                                                className="w-16 text-center font-black text-xl outline-none bg-transparent text-indigo-600 hide-number-arrows"
                                                value={manualPoints}
                                                min={pointMin}
                                                max={pointMax}
                                                onChange={e => {
                                                    let val = parseInt(e.target.value) || 0;
                                                    setManualPoints(Math.min(pointMax, Math.max(pointMin, val)));
                                                }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-slate-300 font-mono leading-tight">{pointMin}<br />–{pointMax}</span>
                                    </div>
                                    <button onClick={() => {
                                        setManualPoints(p => Math.min(pointMax, p + 5));
                                    }} className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:border-indigo-300 touch-manipulation text-slate-600 transition-all active:scale-95">+</button>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-4 md:pt-0">
                            <Button onClick={giveRewards} className="w-full py-3.5 text-sm uppercase tracking-wider" variant={isGivingBadge ? 'warning' : 'primary'} disabled={selectedStudentsForTask.length === 0}>
                                {isGivingBadge ? 'Condecorar Alunos' : 'Enviar LXC'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
