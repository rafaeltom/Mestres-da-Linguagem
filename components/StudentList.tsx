
import React from 'react';
import { Student } from '../types';

interface StudentListProps {
  students: Student[];
  onReward: (student: Student) => void;
  compact?: boolean;
}

const StudentList: React.FC<StudentListProps> = ({ students, onReward, compact }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-slate-500 text-sm border-b border-slate-800">
            <th className="pb-4 font-semibold px-4">Aluno</th>
            {!compact && <th className="pb-4 font-semibold px-4">Escola / Série</th>}
            <th className="pb-4 font-semibold px-4">Carteira (Public Key)</th>
            <th className="pb-4 font-semibold px-4 text-right">Saldo (LC)</th>
            <th className="pb-4 font-semibold px-4 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {students.map((student) => (
            <tr key={student.id} className="group hover:bg-slate-800/30 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {student.name.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-200">{student.name}</span>
                </div>
              </td>
              {!compact && (
                <td className="py-4 px-4 text-sm text-slate-400">
                  <div>{student.school}</div>
                  <div className="text-[10px] opacity-60 uppercase">{student.grade}</div>
                </td>
              )}
              <td className="py-4 px-4">
                <code className="text-[10px] bg-slate-800/50 text-indigo-300 px-2 py-1 rounded border border-slate-700 font-mono">
                  {student.walletAddress}
                </code>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="font-bold text-indigo-400">{student.balance}</span>
                  <span className="text-[10px] text-slate-500 font-bold tracking-widest">LC</span>
                </div>
              </td>
              <td className="py-4 px-4 text-center">
                <button 
                  onClick={() => onReward(student)}
                  className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-all border border-indigo-600/30"
                >
                  <i className="fas fa-coins mr-2"></i> Premiar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList;
