import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GenericModal, Button } from '../ui/SharedUI';
import { Student } from '../../types';

interface EditStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedStudents: Student[]) => void;
    initialStudents: Student[];
    schoolId: string;
    classId: string;
}

export const EditStudentsModal: React.FC<EditStudentsModalProps> = ({ isOpen, onClose, onSave, initialStudents, schoolId, classId }) => {
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        if (isOpen) {
            setStudents(JSON.parse(JSON.stringify(initialStudents || [])));
        }
    }, [isOpen, initialStudents]);

    if (!isOpen) return null;

    const capitalizeName = (name: string) => {
        return name.toLowerCase()
            .replace(/(?:^|\s)\S/g, a => a.toUpperCase())
            .replace(/\b(De|Da|Do|Das|Dos|E)\b/gi, match => match.toLowerCase());
    };

    const handleCapitalizeAll = () => {
        setStudents(prev => prev.map(s => ({ ...s, name: capitalizeName(s.name) })));
    };

    const handleNameChange = (id: string, newName: string) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
    };

    const handleRegIdChange = (id: string, val: string) => {
        // Remove spaces, limit 15 chars
        const clean = val.replace(/\s/g, '').slice(0, 15);
        setStudents(prev => prev.map(s => s.id === id ? { ...s, registrationId: clean || undefined } : s));
    };


    const addStudent = () => {
        setStudents(prev => [...prev, {
            id: uuidv4(),
            name: '',
            schoolId,
            classId,
            avatarId: 'default',
            lxcTotal: { 1: 0, 2: 0, 3: 0, 4: 0 },
            badges: []
        }]);
    };

    const handleSave = () => {
        const validStudents = students.filter(s => s.name.trim() !== '');
        onSave(validStudents);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl animate-fade-in shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">Editar Alunos</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{students.length} aluno(s)</span>
                        <Button variant="secondary" onClick={handleCapitalizeAll} className="text-xs">
                            <i className="fas fa-font text-indigo-500 mr-1"></i> Capitalizar Nomes
                        </Button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg p-1">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Info banner */}
                <div className="mx-4 mt-3 mb-1 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex-shrink-0">
                    <i className="fas fa-info-circle text-amber-400 text-sm flex-shrink-0"></i>
                    <p className="text-[11px] text-amber-700">Para <strong>excluir</strong> um aluno, acesse o <strong>Painel</strong>, clique no ícone de engrenagem ao lado do aluno e use a opção "Excluir".</p>
                </div>

                {/* Table header */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex-shrink-0 mt-2">
                    <div className="grid grid-cols-[1.5rem_1fr_11rem] gap-3 items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">#</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Nome completo</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Matrícula (opcional)</span>
                    </div>
                </div>

                {/* Student rows */}
                <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 custom-scrollbar">
                    {students.length === 0 && <p className="text-center text-slate-400 text-xs py-6">Nenhum aluno cadastrado. Adicione abaixo.</p>}
                    {students.map((student, index) => (
                        <div key={student.id} className="grid grid-cols-[1.5rem_1fr_11rem] gap-3 items-center">
                            <span className="text-[10px] text-slate-300 text-right font-mono">{index + 1}.</span>
                            <input
                                type="text"
                                value={student.name}
                                onChange={e => handleNameChange(student.id, e.target.value)}
                                placeholder="Nome do aluno..."
                                className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-400 transition-colors w-full"
                            />
                            <input
                                type="text"
                                value={student.registrationId || ''}
                                onChange={e => handleRegIdChange(student.id, e.target.value)}
                                placeholder="Ex: 2024001"
                                maxLength={15}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-400 transition-colors w-full font-mono text-slate-600"
                            />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                    <Button variant="secondary" onClick={addStudent} className="flex-1 border-dashed border-2 hover:border-indigo-300 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600">
                        <i className="fas fa-plus mr-1"></i> Adicionar Aluno
                    </Button>
                    <Button variant="secondary" onClick={onClose} className="px-5">Cancelar</Button>
                    <Button onClick={handleSave} className="px-6">Salvar</Button>
                </div>
            </div>
        </div>
    );
};
