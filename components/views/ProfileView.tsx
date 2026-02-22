import React, { ReactNode } from 'react';
import { Button } from '../ui/SharedUI';

export interface ProfileViewProps {
    profile: any;
    handleProfileUpdate: (e: React.FormEvent) => void;
    auth: any;
    renderCloudSyncButton: () => ReactNode;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, handleProfileUpdate, auth, renderCloudSyncButton }) => {
    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-6 gap-4">
                <h2 className="text-lg md:text-xl font-bold text-slate-800">Perfil do Professor</h2>
                {renderCloudSyncButton()}
            </div>
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex items-center gap-6 mb-6">
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-4xl shadow-inner">
                            <i className="fas fa-user-tie"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{profile.name}</h3>
                            <p className="text-slate-500 text-sm">{profile.subject}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                        <input
                            name="name"
                            defaultValue={profile.name}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Nome de Exibição / Sigla</label>
                            <div className="group relative inline-block text-slate-400 cursor-help">
                                <i className="fas fa-info-circle"></i>
                                <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded z-20 shadow-lg text-center normal-case tracking-normal">
                                    Abreviação (ex "Prof. Rafael") que assinará a distribuição de tarefas na linha do tempo dos alunos.
                                </div>
                            </div>
                        </div>
                        <input
                            name="displayName"
                            maxLength={20}
                            defaultValue={profile.displayName || ''}
                            placeholder="Ex: Prof. Rafael"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Disciplina / Matéria</label>
                        <input
                            name="subject"
                            defaultValue={profile.subject}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio / Comentário (Visível para alunos)</label>
                        <textarea
                            name="bio"
                            defaultValue={profile.bio}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 h-24"
                        />
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-lock text-amber-500"></i> Segurança</h4>

                        {auth.currentUser?.providerData.some((p: any) => p.providerId === 'google.com') ? (
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                                <i className="fab fa-google text-amber-500 mt-1"></i>
                                <div>
                                    <h5 className="font-bold text-amber-800 text-sm">Conta Google Vinculada</h5>
                                    <p className="text-xs text-amber-700 mt-1">Sua conta utiliza o login seguro do Google. A alteração de senha deve ser feita diretamente na sua conta Google.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha Atual *</label>
                                    <input
                                        type="password"
                                        name="currentPass"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                        placeholder="Digite a senha atual..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova Senha</label>
                                        <input
                                            type="password"
                                            name="newPass"
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                            placeholder="Nova senha..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Nova Senha</label>
                                        <input
                                            type="password"
                                            name="confirmPass"
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                            placeholder="Repita a senha..."
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Atenção: Deixe em branco caso não queira alterar a senha.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-key text-amber-500"></i> Proteção por PIN</h4>
                        <p className="text-sm text-slate-500 mb-4">O PIN é utilizado para bloquear configurações sensíveis nas Turmas e Escolas.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PIN Atual *</label>
                                <input
                                    type="password"
                                    name="currentPin"
                                    maxLength={4}
                                    className="w-[120px] text-center tracking-widest font-bold bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                    placeholder="0000"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 italic">
                                    O PIN provisório padrão é "0000".
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Novo PIN</label>
                                    <input
                                        type="password"
                                        name="newPin"
                                        maxLength={4}
                                        className="w-[120px] text-center tracking-widest font-bold bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                        placeholder="••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar PIN</label>
                                    <input
                                        type="password"
                                        name="confirmPin"
                                        maxLength={4}
                                        className="w-[120px] text-center tracking-widest font-bold bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                        placeholder="••••"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button className="w-full md:w-auto px-8">Salvar Alterações</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
