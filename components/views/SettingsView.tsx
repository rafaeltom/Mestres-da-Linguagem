import React, { RefObject } from 'react';
import { Button } from '../ui/SharedUI';

export interface SettingsViewProps {
    exportDataToJSON: () => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: RefObject<HTMLInputElement>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ exportDataToJSON, handleFileUpload, fileInputRef }) => {
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
                    Versão Beta 0.9
                </div>
            </div>
        </div>
    );
};
