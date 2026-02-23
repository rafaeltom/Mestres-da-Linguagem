import React, { RefObject } from 'react';
import { Button } from '../ui/SharedUI';

export interface SettingsViewProps {
    exportDataToJSON: () => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: RefObject<HTMLInputElement>;
    onMigrateDatabase: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ exportDataToJSON, handleFileUpload, fileInputRef, onMigrateDatabase }) => {
    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6">Segurança dos Dados</h2>
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 text-center space-y-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 text-3xl mb-4">
                    <i className="fas fa-database"></i>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Backup e Restauração</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm md:text-base">Para garantir que você nunca perca o progresso dos seus alunos, faça o download do backup regularmente.</p>
                </div>
                <div className="flex flex-col gap-4 justify-center pt-4">
                    <Button onClick={exportDataToJSON} className="py-4 px-8 text-base w-full">
                        <i className="fas fa-download"></i> Baixar Backup
                    </Button>
                    <div className="relative w-full">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="py-4 px-8 text-base w-full">
                            <i className="fas fa-upload"></i> Restaurar de Arquivo
                        </Button>
                    </div>
                </div>
                <div className="w-full pt-4 border-t border-slate-100 mt-2 text-center text-slate-400 text-xs">
                    Versão Beta 0.10
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <h2 className="text-lg font-bold text-slate-800">Manutenção Avançada</h2>
                <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                            <i className="fas fa-tools"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Sincronizar Vínculos (classId)</h4>
                            <p className="text-sm text-slate-500 mt-1">Se você ou seus colaboradores não estiverem vendo algumas tarefas antigas, clique abaixo para reparar os vínculos de banco de dados.</p>
                            <Button variant="secondary" onClick={onMigrateDatabase} className="mt-4 border-amber-200 hover:bg-amber-50 text-amber-700">
                                <i className="fas fa-magic mr-2"></i> Reparar Vínculos Legados
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
