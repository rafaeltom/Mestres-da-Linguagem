import React, { ReactNode } from 'react';
import { Button } from '../ui/SharedUI';
import { TeacherProfileData, LicenseKeyType } from '../../types';
import { MASTER_KEY_LIMIT, TEST_KEY_LIMIT, computeTeacherLimits } from '../../services/licenseService';

export interface ProfileViewProps {
    profile: TeacherProfileData;
    handleProfileUpdate: (e: React.FormEvent) => void;
    auth: any;
    renderCloudSyncButton: () => ReactNode;
    onClaimKey: (key: string) => Promise<void>;
    onGenerateBatch: (keyType: LicenseKeyType) => Promise<void>;
    onGetKeys: () => Promise<any[]>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, handleProfileUpdate, auth, renderCloudSyncButton, onClaimKey, onGenerateBatch, onGetKeys }) => {
    const [licenseInput, setLicenseInput] = React.useState('');
    const [isClaiming, setIsClaiming] = React.useState(false);
    const [adminKeys, setAdminKeys] = React.useState<any[]>([]);
    const [showAdminPanel, setShowAdminPanel] = React.useState(false);
    const [genKeyType, setGenKeyType] = React.useState<LicenseKeyType>('master');

    const handleClaim = async () => {
        if (!licenseInput.trim()) return;
        setIsClaiming(true);
        try {
            await onClaimKey(licenseInput.trim());
            setLicenseInput('');
        } finally {
            setIsClaiming(false);
        }
    };

    const handleLoadKeys = async () => {
        const keys = await onGetKeys();
        setAdminKeys(keys);
    };
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
                        <label htmlFor="prof-name" className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                        <input
                            id="prof-name"
                            name="name"
                            defaultValue={profile.name}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div>
                        <label htmlFor="prof-email" className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail (Vínculo da Conta)</label>
                        <input
                            id="prof-email"
                            type="email"
                            value={profile.email || ''}
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 outline-none cursor-not-allowed text-slate-500 font-medium"
                            readOnly
                            title="O e-mail é fixo e vinculado à sua autenticação."
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <label htmlFor="prof-display-name" className="block text-xs font-bold text-slate-500 uppercase">Nome de Exibição / Sigla</label>
                            <div className="group relative inline-block text-slate-400 cursor-help">
                                <i className="fas fa-info-circle"></i>
                                <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded z-20 shadow-lg text-center normal-case tracking-normal">
                                    Abreviação (ex "Prof. Rafael") que assinará a distribuição de tarefas na linha do tempo dos alunos.
                                </div>
                            </div>
                        </div>
                        <input
                            id="prof-display-name"
                            name="displayName"
                            maxLength={20}
                            defaultValue={profile.displayName || ''}
                            placeholder="Ex: Prof. Rafael"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                            autoComplete="nickname"
                        />
                    </div>

                    <div>
                        <label htmlFor="prof-subject" className="block text-xs font-bold text-slate-500 uppercase mb-1">Disciplina / Matéria</label>
                        <input
                            id="prof-subject"
                            name="subject"
                            defaultValue={profile.subject}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="prof-bio" className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio / Comentário (Visível para alunos)</label>
                        <textarea
                            id="prof-bio"
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
                                    <label htmlFor="prof-current-pass" className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha Atual *</label>
                                    <input
                                        id="prof-current-pass"
                                        type="password"
                                        name="currentPass"
                                        autoComplete="current-password"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                        placeholder="Digite a senha atual..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="prof-new-pass" className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova Senha</label>
                                        <input
                                            id="prof-new-pass"
                                            type="password"
                                            name="newPass"
                                            autoComplete="new-password"
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                            placeholder="Nova senha..."
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="prof-confirm-pass" className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Nova Senha</label>
                                        <input
                                            id="prof-confirm-pass"
                                            type="password"
                                            name="confirmPass"
                                            autoComplete="new-password"
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
                                <label htmlFor="prof-current-pin" className="block text-xs font-bold text-slate-500 uppercase mb-1">PIN Atual *</label>
                                <input
                                    id="prof-current-pin"
                                    type="password"
                                    name="currentPin"
                                    autoComplete="one-time-code"
                                    inputMode="numeric"
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
                                    <label htmlFor="prof-new-pin" className="block text-xs font-bold text-slate-500 uppercase mb-1">Novo PIN</label>
                                    <input
                                        id="prof-new-pin"
                                        type="password"
                                        name="newPin"
                                        autoComplete="one-time-code"
                                        inputMode="numeric"
                                        maxLength={4}
                                        className="w-[120px] text-center tracking-widest font-bold bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                        placeholder="••••"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="prof-confirm-pin" className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar PIN</label>
                                    <input
                                        id="prof-confirm-pin"
                                        type="password"
                                        name="confirmPin"
                                        autoComplete="one-time-code"
                                        inputMode="numeric"
                                        maxLength={4}
                                        className="w-[120px] text-center tracking-widest font-bold bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                        placeholder="••••"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-certificate text-indigo-500"></i> Licença e Acesso</h4>

                        {(() => {
                            const limits = computeTeacherLimits(profile);
                            const masterCount = profile.masterKeysCount ?? 0;
                            const testCount = profile.testKeysCount ?? 0;
                            const hasKeys = masterCount > 0 || testCount > 0 || limits.isAdmin;
                            return (
                                <div className={`p-4 rounded-xl border mb-4 ${hasKeys ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <i className={`fas ${hasKeys ? 'fa-check-double text-emerald-500' : 'fa-lock text-amber-400'} text-lg`}></i>
                                        <div className="flex-1">
                                            {hasKeys ? (
                                                <>
                                                    <h5 className="font-bold text-emerald-800 text-sm">Acesso Ativo</h5>
                                                    <div className="flex gap-2 flex-wrap mt-1">
                                                        {limits.isAdmin && (
                                                            <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg border border-purple-200 text-purple-700 font-bold">
                                                                👑 Acesso Total (Admin)
                                                            </span>
                                                        )}
                                                        {masterCount > 0 && (
                                                            <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg border border-emerald-200 text-emerald-700 font-bold">
                                                                🔑 {masterCount}/{MASTER_KEY_LIMIT} Chave(s) Mestre
                                                            </span>
                                                        )}
                                                        {testCount > 0 && (
                                                            <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg border border-blue-200 text-blue-700 font-bold">
                                                                🧪 {testCount}/{TEST_KEY_LIMIT} Chave(s) Teste
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-emerald-600 mt-1">
                                                        {limits.isAdmin ? 'Sem restrições (Admin)' : `Até ${isFinite(limits.maxSchools) ? limits.maxSchools : '∞'} escola(s) / ${isFinite(limits.maxClasses) ? limits.maxClasses : '∞'} turma(s)`}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <h5 className="font-bold text-amber-800 text-sm">Conta Gratuita</h5>
                                                    <p className="text-[10px] text-amber-600">Apenas colaboração em projetos. Catálogo: 200 atividades / 20 medalhas / 5 penalidades.</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="text-xs text-slate-600 mb-3"><i className="fas fa-info-circle text-indigo-400 mr-1"></i>Insira uma chave (Mestre ou Teste) para expandir seus recursos.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="INSIRA SUA CHAVE AQUI"
                                    value={licenseInput}
                                    onChange={e => setLicenseInput(e.target.value.toUpperCase())}
                                    className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-bold tracking-widest outline-none focus:border-indigo-500"
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={handleClaim}
                                    disabled={isClaiming || !licenseInput}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {isClaiming ? <i className="fas fa-spinner fa-spin"></i> : 'ATIVAR'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {profile.role === 'admin' && (
                        <div className="pt-6 border-t border-slate-100">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-red-600"><i className="fas fa-user-shield"></i> Painel Administrativo</h4>
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                                    className="w-full bg-slate-900 text-white p-3 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-between"
                                >
                                    <span>GESTÃO DE CHAVES DE LICENÇA</span>
                                    <i className={`fas fa-chevron-${showAdminPanel ? 'up' : 'down'}`}></i>
                                </button>

                                {showAdminPanel && (
                                    <div className="bg-slate-100 p-4 rounded-xl space-y-4 animate-slide-down">
                                        {/* Key type selector */}
                                        <div className="flex gap-2">
                                            {(['master', 'test'] as LicenseKeyType[]).map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setGenKeyType(type)}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold border-2 transition-all ${genKeyType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                                                >
                                                    {type === 'master' ? '🔑 Chave Mestre' : '🧪 Chave Teste'}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-slate-500">
                                            {genKeyType === 'master'
                                                ? `Concede +${4} escolas e +${20} turmas. Limite de 3 por conta.`
                                                : `Concede 1 escola (1ª chave) + 1 turma por chave. Validade: final do ano. Limite de 5 por conta.`
                                            }
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onGenerateBatch(genKeyType)}
                                                className="flex-1 bg-indigo-600 text-white p-2 rounded-lg text-[10px] font-bold hover:bg-indigo-700"
                                            >
                                                GERAR LOTE (5) {genKeyType.toUpperCase()}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleLoadKeys}
                                                className="flex-1 bg-white border border-slate-300 text-slate-700 p-2 rounded-lg text-[10px] font-bold hover:bg-slate-50"
                                            >
                                                LISTAR CHAVES
                                            </button>
                                        </div>

                                        {adminKeys.length > 0 && (
                                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                                <div className="grid grid-cols-1 gap-2">
                                                    {[...adminKeys].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 50).map((k, idx) => (
                                                        <div key={idx} className={`bg-white p-2 rounded border font-mono text-[9px] flex justify-between items-center ${k.type === 'test' ? 'border-blue-200' : 'border-indigo-200'} ${k.used ? 'opacity-50 bg-slate-50' : ''}`}>
                                                            <div>
                                                                <span className={`text-[8px] font-bold px-1 rounded mr-1 ${k.type === 'test' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>{k.type ?? 'master'}</span>
                                                                <span className={k.used ? "line-through text-slate-400" : ""}>{k.id}</span>
                                                                {k.used && (
                                                                    <span className="ml-2 text-red-500 font-bold"><i className="fas fa-times-circle"></i> Usada</span>
                                                                )}
                                                            </div>
                                                            <i className={`fas fa-copy cursor-pointer ${k.used ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-indigo-500'}`} onClick={() => !k.used && navigator.clipboard.writeText(k.id)} title={k.used ? "Chave já utilizada" : "Copiar"}></i>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[9px] text-slate-400 text-center">Exibindo últimas 50 chaves.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button className="w-full md:w-auto px-8">Salvar Alterações</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
