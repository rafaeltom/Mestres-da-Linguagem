
import React, { useState, useRef } from 'react';
import { School, ClassGroup, Student } from '../types';
import { generateStudentWallet } from '../services/blockchainService';
import { downloadTemplateCSV, parseStudentsCSV } from '../services/csvService';

interface SchoolManagerProps {
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
}

const SchoolManager: React.FC<SchoolManagerProps> = ({ schools, setSchools }) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);
  const selectedClass = selectedSchool?.classes?.find(c => c.id === selectedClassId);

  const handleAddClass = (schoolId: string) => {
    const className = prompt("Nome da nova turma (ex: 9º Ano A):");
    if (!className) return;

    setSchools(prev => prev.map(school => {
      if (school.id === schoolId) {
        return {
          ...school,
          classes: [...(school.classes || []), { id: Date.now().toString(), name: className, students: [], schoolId: schoolId }]
        };
      }
      return school;
    }));
  };

  const handleCreateWallet = (studentId: string) => {
    const wallet = generateStudentWallet();
    updateStudent(studentId, { walletAddress: wallet.publicKey, encryptedPrivateKey: wallet.secretKey });
  };

  const updateStudent = (studentId: string, updates: Partial<Student>) => {
    if (!selectedSchoolId || !selectedClassId) return;

    setSchools(prev => prev.map(school => {
      if (school.id === selectedSchoolId) {
        return {
          ...school,
          classes: school.classes?.map(cls => {
            if (cls.id === selectedClassId) {
              return {
                ...cls,
                students: cls.students?.map(std => std.id === studentId ? { ...std, ...updates } : std) || []
              };
            }
            return cls;
          }) || []
        };
      }
      return school;
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSchoolId || !selectedClassId) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsedStudents = parseStudentsCSV(content);
      
      const newStudents: Student[] = parsedStudents.map(p => ({
        id: Math.random().toString(36).substr(2, 9),
        name: p.name || "Aluno Sem Nome",
        classId: selectedClassId,
        schoolId: selectedSchoolId,
        avatarId: 'hero-1',
        lxcTotal: { 1: 0, 2: 0, 3: 0, 4: 0 },
        badges: [],
        messages: [],
        walletAddress: "", 
        encryptedPrivateKey: ""
      }));

      setSchools(prev => prev.map(school => {
        if (school.id === selectedSchoolId) {
          return {
            ...school,
            classes: school.classes?.map(cls => {
              if (cls.id === selectedClassId) {
                return { ...cls, students: [...(cls.students || []), ...newStudents] };
              }
              return cls;
            })
          };
        }
        return school;
      }));
    };
    reader.readAsText(file);
  };

  const handleBulkWalletGeneration = () => {
    if (!selectedClass || !selectedSchoolId) return;
    if (!confirm(`Deseja gerar carteiras automaticamente para ${selectedClass.students?.filter(s => !s.walletAddress).length || 0} alunos sem carteira?`)) return;

    setSchools(prev => prev.map(school => {
        if (school.id === selectedSchoolId) {
          return {
            ...school,
            classes: school.classes?.map(cls => {
              if (cls.id === selectedClassId) {
                const updatedStudents = cls.students?.map(std => {
                    if(!std.walletAddress) {
                        const w = generateStudentWallet();
                        return { ...std, walletAddress: w.publicKey, encryptedPrivateKey: w.secretKey };
                    }
                    return std;
                }) || [];
                return { ...cls, students: updatedStudents };
              }
              return cls;
            })
          };
        }
        return school;
      }));
  };

  // Renderização
  if (!selectedSchool) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-6">Minhas Escolas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schools.map(school => (
            <div key={school.id} 
                 onClick={() => setSelectedSchoolId(school.id)}
                 className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-indigo-500 cursor-pointer transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <i className="fas fa-school text-xl"></i>
                </div>
                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">
                  {school.classes?.length || 0} Turmas
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-200">{school.name}</h3>
              <p className="text-sm text-slate-500 mt-2">
                {school.classes?.reduce((acc, c) => acc + (c.students?.length || 0), 0) || 0} Alunos totais
              </p>
            </div>
          ))}
          <button onClick={() => alert("Funcionalidade futura: Adicionar Escola")} className="border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-600 hover:text-indigo-400 hover:border-indigo-500/50 transition-all">
            <i className="fas fa-plus text-2xl mb-2"></i>
            <span className="font-bold">Adicionar Nova Escola</span>
          </button>
        </div>
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedSchoolId(null)} className="text-indigo-400 text-sm hover:underline flex items-center gap-2">
            <i className="fas fa-arrow-left"></i> Voltar para Escolas
        </button>
        <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold">{selectedSchool.name} <span className="text-slate-500 text-lg font-normal">/ Turmas</span></h2>
             <button onClick={() => handleAddClass(selectedSchool.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <i className="fas fa-plus"></i> Nova Turma
             </button>
        </div>
       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedSchool.classes?.map(cls => (
                <div key={cls.id} onClick={() => setSelectedClassId(cls.id)} className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-indigo-500 cursor-pointer transition-all">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-lg">{cls.name}</h4>
                        <i className="fas fa-chevron-right text-slate-600"></i>
                    </div>
                    <p className="text-sm text-slate-400">{cls.students?.length || 0} Alunos</p>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <button onClick={() => setSelectedClassId(null)} className="text-indigo-400 text-sm hover:underline flex items-center gap-2">
                <i className="fas fa-arrow-left"></i> Voltar para Turmas
            </button>
            <div className="flex gap-2">
                 <button onClick={() => downloadTemplateCSV()} className="text-slate-400 text-xs border border-slate-700 px-3 py-2 rounded-lg hover:bg-slate-800">
                    <i className="fas fa-file-download mr-2"></i> Baixar Modelo CSV
                 </button>
                 <button onClick={() => fileInputRef.current?.click()} className="text-emerald-400 text-xs border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 rounded-lg hover:bg-emerald-500/20">
                    <i className="fas fa-file-upload mr-2"></i> Importar Alunos (CSV)
                 </button>
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
            </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold">{selectedClass.name}</h2>
                    <p className="text-slate-500 text-sm">{selectedSchool.name}</p>
                </div>
                <button onClick={handleBulkWalletGeneration} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-600/20">
                    <i className="fas fa-magic mr-2"></i> Gerar Carteiras em Massa
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-slate-500 text-xs border-b border-slate-800 uppercase">
                            <th className="pb-3 pl-4">Nome do Aluno</th>
                            <th className="pb-3">Carteira (Public Key)</th>
                            <th className="pb-3 text-right">Saldo (1º Bim)</th>
                            <th className="pb-3 pr-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-sm">
                        {(selectedClass.students || []).length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                                    Nenhum aluno nesta turma. Importe um CSV ou adicione manualmente.
                                </td>
                            </tr>
                        ) : selectedClass.students?.map(student => (
                            <tr key={student.id} className="hover:bg-slate-800/30">
                                <td className="py-3 pl-4 font-medium text-slate-200">{student.name}</td>
                                <td className="py-3">
                                    {student.walletAddress ? (
                                        <div className="flex flex-col">
                                            <code className="text-[10px] text-indigo-300 font-mono">{student.walletAddress.substring(0, 8)}...{student.walletAddress.substring(student.walletAddress.length - 8)}</code>
                                            {student.encryptedPrivateKey && <span className="text-[9px] text-red-400/70" title="Chave privada salva localmente (Custodial)">🔑 Chave salva</span>}
                                        </div>
                                    ) : (
                                        <button onClick={() => handleCreateWallet(student.id)} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors">
                                            + Criar Carteira
                                        </button>
                                    )}
                                </td>
                                <td className="py-3 text-right font-mono text-emerald-400">{student.lxcTotal[1] || 0} LXC</td>
                                <td className="py-3 pr-4 text-center">
                                    <span className={`w-2 h-2 rounded-full inline-block ${student.walletAddress ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default SchoolManager;
