import React, { ReactNode } from 'react';
import { Button } from '../ui/SharedUI';
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
}

export const SchoolManagementView: React.FC<SchoolManagementViewProps> = ({
    data, renderCloudSyncButton, openModal, requestDelete,
    setSelectedSchoolId, setSelectedClassId, setShowBatchImport
}) => {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 flex-1">Estrutura Escolar</h2>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {renderCloudSyncButton()}
                    <Button onClick={() => openModal('school', 'create')} className="flex-1 sm:flex-none py-2 px-4 whitespace-nowrap">+ Nova Escola</Button>
                </div>
            </div>

            <div className="space-y-6">
                {data.schools.length === 0 && <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400">Nenhuma escola cadastrada. Comece criando uma!</div>}
                {data.schools.map((school: School) => (
                    <div key={school.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-slate-50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={(e) => { e.stopPropagation(); openModal('school', 'edit', school); }}
                                    className="relative group/logo flex-shrink-0 transition-transform hover:scale-105 active:scale-95"
                                    title="Clique para alterar o logo da escola"
                                >
                                    {school.iconUrl ? (
                                        <img src={school.iconUrl} alt={school.name} className="w-12 h-12 rounded-lg object-cover bg-white shadow-sm border-2 border-transparent group-hover/logo:border-indigo-400 transition-colors" />
                                    ) : (() => {
                                        const cleanName = school.name.toLowerCase();
                                        let defaultLogo = '';
                                        if (cleanName.includes('alípio') || cleanName.includes('alipio')) defaultLogo = '/alipiologo.png';
                                        else if (cleanName.includes('aparecida') || cleanName.includes('nsa')) defaultLogo = '/nsalogo.png';

                                        return defaultLogo ? (
                                            <img src={defaultLogo} alt={school.name} className="w-12 h-12 rounded-lg object-contain bg-white shadow-sm border-2 border-transparent group-hover/logo:border-indigo-400 transition-colors" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center border-2 border-transparent group-hover/logo:border-indigo-400 transition-colors">
                                                <i className="fas fa-school text-xl"></i>
                                            </div>
                                        );
                                    })()}
                                    <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity">
                                        <i className="fas fa-camera text-white text-xs"></i>
                                    </div>
                                </button>
                                <div className="min-w-0 pr-2">
                                    <h3 className="font-bold text-lg text-slate-700 truncate leading-tight">{school.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gestão Escolar</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <Button variant="icon" onClick={(e: any) => { e.stopPropagation(); openModal('school', 'edit', school); }} title="Editar Escola"><i className="fas fa-pen"></i></Button>
                                <Button variant="icon" onClick={(e: any) => requestDelete(e, 'school', school.id, undefined, school.name)} title="Excluir Escola"><i className="fas fa-trash text-red-400"></i></Button>
                                <div className="hidden sm:block w-px h-6 bg-slate-300 mx-2"></div>
                                <button onClick={() => { setSelectedSchoolId(school.id); openModal('class', 'create'); }} className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors border border-indigo-200 bg-white whitespace-nowrap">+ Turma</button>
                            </div>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {school.classes?.length === 0 && <p className="text-slate-400 text-sm italic p-2 col-span-full text-center">Nenhuma turma nesta escola.</p>}
                            {school.classes?.map((cls: ClassGroup) => (
                                <div key={cls.id} className="border border-slate-200 p-4 rounded-xl hover:border-indigo-300 transition-colors bg-white relative group">
                                    <div className="flex flex-col items-start mb-2 pr-16 gap-1 w-full">
                                        <h4 className="font-bold text-slate-800 line-clamp-1 break-all pr-2" title={cls.name}>{cls.name}</h4>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0">{cls.students?.length || 0} alunos</span>
                                            <div className="flex bg-indigo-50 text-indigo-600 rounded-md overflow-hidden text-[10px] font-bold border border-indigo-100 items-center">
                                                <span className="px-1.5 py-0.5 border-r border-indigo-100 bg-indigo-100/50" title="Código de Escaneamento"><i className="fas fa-barcode"></i></span>
                                                <span className="px-2 py-0.5 tracking-widest">{cls.seed || 'MIGRE_SALA'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => { setSelectedSchoolId(school.id); setSelectedClassId(cls.id); setShowBatchImport(true); }} className="flex-1 bg-emerald-50 text-emerald-600 text-xs font-bold py-2 rounded-lg hover:bg-emerald-100 border border-emerald-100 flex items-center justify-center gap-1">
                                            <i className="fas fa-file-import"></i> Importar
                                        </button>
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-1 bg-white p-1 rounded-lg border border-slate-100">
                                        <button onClick={(e: any) => { e.stopPropagation(); openModal('class', 'edit', cls); }} className="p-1 text-slate-400 hover:text-indigo-500 w-7 h-7 flex items-center justify-center" title="Editar Turma"><i className="fas fa-pen text-xs"></i></button>
                                        <button onClick={(e: any) => requestDelete(e, 'class', cls.id, school.id, cls.name)} className="p-1 text-slate-400 hover:text-red-500 w-7 h-7 flex items-center justify-center" title="Excluir Turma"><i className="fas fa-trash text-xs"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
