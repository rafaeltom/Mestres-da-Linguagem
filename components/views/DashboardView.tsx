import React, { ReactNode } from 'react';
import { Button, Input } from '../ui/SharedUI';
import { School, ClassGroup, Bimester } from '../../types';
import { AppData } from '../../services/localStorageService';

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
    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex-1 w-full md:w-auto">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Escola</label>
                    <button
                        onClick={() => setModalConfig({ isOpen: true, type: 'school-selector', mode: 'create' })}
                        className="w-full flex items-center justify-between py-1 font-bold text-slate-800 group"
                    >
                        <span className="truncate group-hover:text-indigo-600 transition-colors">{currentSchool?.name || 'Selecione a Escola...'}</span>
                        <i className="fas fa-chevron-down text-[10px] opacity-30 group-hover:opacity-100 transition-all"></i>
                    </button>
                </div>
                <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                <div className="flex-1 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Turma</label>
                    <button
                        onClick={() => {
                            if (!selectedSchoolId) {
                                showToast("Selecione uma escola primeiro.", "info");
                                return;
                            }
                            setModalConfig({ isOpen: true, type: 'class-selector', mode: 'create' });
                        }}
                        className="w-full flex items-center justify-between py-1 font-bold text-slate-800 group"
                    >
                        <span className="truncate group-hover:text-indigo-600 transition-colors">{currentClass?.name || 'Selecione a Turma...'}</span>
                        <i className="fas fa-chevron-down text-[10px] opacity-30 group-hover:opacity-100 transition-all"></i>
                    </button>
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
                                            <div className={`w-10 h-10 rounded-full ${level.color} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 relative`}>
                                                {student.name.charAt(0)}
                                                {student.marked && (
                                                    <div
                                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
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
                                                        onChange={(e) => {
                                                            let val = parseInt(e.target.value) || 0;
                                                            setIndividualScores(prev => ({ ...prev, [student.id]: Math.min(250, Math.max(-10, val)) }));
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

                    <div className="w-full lg:w-80 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col shadow-xl shadow-slate-200/50 lg:h-full h-auto flex-shrink-0">
                        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                            <button onClick={() => setIsGivingBadge(false)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!isGivingBadge ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Dar Pontos</button>
                            <button onClick={() => setIsGivingBadge(true)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${isGivingBadge ? 'bg-white shadow text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>Dar Medalha</button>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">
                                    {isGivingBadge ? 'Escolher Medalha' : 'Escolher Missão'}
                                </span>
                                <button onClick={() => openModal(isGivingBadge ? 'badge' : 'task', 'create')} className="text-[10px] text-indigo-500 font-bold hover:underline">+ Criar Nova</button>
                            </div>

                            <button
                                onClick={() => setModalConfig({ isOpen: true, type: 'mission-selector', mode: 'create' })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none hover:border-indigo-500 text-left flex justify-between items-center"
                            >
                                <span className="truncate">{selectedTaskId ? (isGivingBadge ? data.badgesCatalog.find(b => b.id === selectedTaskId)?.name : data.taskCatalog.find(t => t.id === selectedTaskId)?.title) : '-- Personalizado --'}</span>
                                <i className="fas fa-chevron-down text-slate-400"></i>
                            </button>
                        </div>

                        {!isGivingBadge && (
                            <div className="animate-fade-in space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Título / Motivo</label>
                                    <Input
                                        placeholder="Ex: Participação em Aula"
                                        value={manualDesc}
                                        onFocus={(e: any) => {
                                            if (!manualDesc && !selectedTaskId) {
                                                setManualDesc(`Atividade de ${profile?.subject || 'Linguagens'}`);
                                            }
                                            setTimeout(() => e.target.select(), 10);
                                        }}
                                        onChange={(e: any) => setManualDesc(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Descrição da Missão</label>
                                    <Input
                                        placeholder="Válido apenas para este lançamento..."
                                        value={customMissionDesc}
                                        onChange={(e: any) => setCustomMissionDesc(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 justify-center mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <button onClick={() => {
                                        const minL = selectedTaskId ? (isGivingBadge ? 0 : -10) : -5;
                                        setManualPoints(p => Math.max(minL, p - 5));
                                    }} className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-sm border border-slate-200 rounded-lg font-bold hover:bg-slate-50 touch-manipulation text-slate-600">-</button>
                                    <div className="flex flex-col items-center px-4">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">LXC</label>
                                        <input type="number" className="w-16 md:w-20 text-center font-bold text-lg md:text-xl outline-none bg-transparent text-indigo-600" value={manualPoints} onChange={e => {
                                            let val = parseInt(e.target.value) || 0;
                                            const minL = selectedTaskId ? (isGivingBadge ? 0 : -10) : -5;
                                            const maxL = selectedTaskId ? (isGivingBadge ? 50 : 250) : 100;
                                            setManualPoints(Math.min(maxL, Math.max(minL, val)));
                                        }} />
                                    </div>
                                    <button onClick={() => {
                                        const maxL = selectedTaskId ? (isGivingBadge ? 50 : 250) : 100;
                                        setManualPoints(p => Math.min(maxL, p + 5));
                                    }} className="w-8 h-8 md:w-10 md:h-10 bg-white shadow-sm border border-slate-200 rounded-lg font-bold hover:bg-slate-50 touch-manipulation text-slate-600">+</button>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-4 md:pt-0">
                            <div className="bg-indigo-50 p-3 rounded-xl mb-4 flex justify-between items-center">
                                <span className="text-xs font-bold text-indigo-800">Alunos Selecionados:</span>
                                <span className="bg-white text-indigo-600 px-2 py-1 rounded text-xs font-bold shadow-sm">{selectedStudentsForTask.length}</span>
                            </div>
                            <Button onClick={giveRewards} className="w-full py-4 text-lg" variant={isGivingBadge ? 'warning' : 'primary'} disabled={selectedStudentsForTask.length === 0}>
                                {isGivingBadge ? 'Condecorar' : 'Confirmar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
