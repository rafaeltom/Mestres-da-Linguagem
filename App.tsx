
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bimester, Student, School, ClassGroup, Transaction, TaskDefinition, Badge, LevelRule, TeacherProfileData, PenaltyDefinition } from './types';
import { getLevel, getNextLevel } from './utils/gamificationRules';
import {
    loadData,
    saveData,
    AppData,
    addTransaction,
    getAllStudents,
    exportDataToJSON,
    importDataFromJSON,
    removeTransaction,
    updateTransactionAmount,
    loadProfile,
    saveProfile,
    generateClassSeed
} from './services/localStorageService';
import { loginWithEmail, loginWithGoogle, logout, subscribeToAuthChanges, registerWithEmail } from './services/auth';
import {
    fetchTeacherData,
    saveTeacherProfile,
    getTeacherProfile,
    firestoreAddSchool,
    firestoreUpdateSchool,
    firestoreDeleteSchool,
    firestoreAddClass,
    firestoreUpdateClass,
    firestoreDeleteClass,
    firestoreAddStudent,
    firestoreUpdateStudent,
    firestoreDeleteStudent,
    firestoreAddCatalogItem,
    firestoreUpdateCatalogItem,
    firestoreDeleteCatalogItem,
    firestoreAddTransaction,
    firestoreDeleteTransaction,
    firestoreUpdateTransaction,
    firestoreBatchImportStudents,
    firestoreGiveRewardAtomic,
    firestoreSyncAll
} from './services/firestoreService';
import { auth } from './services/firebase';


// --- CONSTANTES VISUAIS ---

const ICON_LIBRARY = [
    // Acadêmico & Conhecimento
    'fa-book', 'fa-book-reader', 'fa-graduation-cap', 'fa-brain', 'fa-atom',
    'fa-calculator', 'fa-microscope', 'fa-globe-americas', 'fa-pen-nib', 'fa-language',
    'fa-laptop-code', 'fa-flask', 'fa-dna', 'fa-history', 'fa-palette',

    // Comportamento & Liderança
    'fa-hands-helping', 'fa-users', 'fa-user-clock', 'fa-check-circle', 'fa-heart',
    'fa-star', 'fa-medal', 'fa-trophy', 'fa-crown', 'fa-thumbs-up',
    'fa-award', 'fa-certificate', 'fa-hand-peace', 'fa-smile', 'fa-lightbulb',

    // Gamificação & Diversão
    'fa-gamepad', 'fa-puzzle-piece', 'fa-chess', 'fa-dice', 'fa-rocket',
    'fa-ghost', 'fa-dragon', 'fa-robot', 'fa-hat-wizard', 'fa-space-shuttle',
    'fa-shield-alt', 'fa-sword', 'fa-scroll', 'fa-map-marked-alt', 'fa-gem',

    // Esportes & Artes
    'fa-running', 'fa-swimmer', 'fa-futbol', 'fa-basketball-ball', 'fa-music',
    'fa-guitar', 'fa-camera', 'fa-video', 'fa-theater-masks', 'fa-paint-brush'
];

// --- SEGURANÇA SIMPLIFICADA (BASE64) ---

const MASTER_EMAIL = "rafaelalmeida293@gmail.com";
// senha codificada
const MASTER_PASS_ENCODED = "U3dmMTIzc3dm";

// Função simples para codificar senha (não é criptografia, é ofuscação para não ficar texto puro no código)
const obscurePassword = (pass: string): string => {
    try {
        return btoa(pass);
    } catch (e) {
        return "";
    }
};

// --- COMPONENTES UI ---

const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false, title = '' }: any) => {
    const base = "px-4 py-3 md:py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0 touch-manipulation";
    const variants: any = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200",
        secondary: "bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200",
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200",
        icon: "w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
    };
    return <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`} title={title}>{children}</button>;
};

const Input = ({ label, ...props }: any) => (
    <div className="mb-4">
        {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>}
        <input {...props} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors" />
    </div>
);

// --- MODAIS GERAIS ---

const GenericModal = ({ title, onClose, onSave, children, saveLabel = "Salvar", saveVariant = "primary", showFooter = true }: any) => (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end md:items-center justify-center z-50 backdrop-blur-sm p-0 md:p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-md shadow-2xl transform transition-all scale-100 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times text-lg"></i></button>
            </div>
            <div className={`space-y-4 overflow-y-auto custom-scrollbar ${showFooter ? 'mb-6' : ''}`}>
                {children}
            </div>
            {(showFooter && onSave) && (
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                    <Button variant="secondary" onClick={onClose} className="flex-1 md:flex-none">Cancelar</Button>
                    <Button onClick={onSave} variant={saveVariant} className="flex-1 md:flex-none">{saveLabel}</Button>
                </div>
            )}
        </div>
    </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
    if (!isOpen) return null;
    return (
        <GenericModal
            title={title}
            onClose={onClose}
            onSave={onConfirm}
            saveLabel="Sim, Excluir"
            saveVariant="danger"
        >
            <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-2xl">
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <p className="text-slate-600 text-sm font-medium">{message}</p>
            </div>
        </GenericModal>
    );
};

const BatchStudentModal = ({ onClose, onSave }: any) => {
    const [text, setText] = useState('');
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg animate-fade-in shadow-2xl">
                <h3 className="text-xl font-bold mb-2">Importar Lista de Alunos</h3>
                <p className="text-sm text-slate-500 mb-4">Cole a lista de nomes abaixo (um nome por linha).</p>
                <textarea
                    className="w-full h-48 bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm mb-4 focus:border-indigo-500 outline-none font-mono"
                    placeholder="Ana Silva&#10;Bruno Souza&#10;Carlos Lima..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={() => onSave(text)} variant="success">Importar Agora</Button>
                </div>
            </div>
        </div>
    );
};

// --- LOGIN COMPONENT ---
const LoginScreen = ({ onLogin }: { onLogin: (e: string, p: string) => Promise<boolean> }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [passConfirm, setPassConfirm] = useState('');
    const [name, setName] = useState('');
    const [school, setSchool] = useState('');
    const [subject, setSubject] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (isRegistering) {
            if (pass !== passConfirm) {
                setError('As senhas não coincidem.');
                setLoading(false);
                return;
            }
            if (!name || !school || !subject) {
                setError('Preencha os campos obrigatórios.');
                setLoading(false);
                return;
            }
            try {
                const user = await registerWithEmail(email, pass);
                const newProfile: TeacherProfileData = {
                    name,
                    subject,
                    bio: 'Educador focado em gamificação.',
                    passwordHash: obscurePassword(pass)
                };
                await saveTeacherProfile(user.uid, newProfile);
                saveProfile(newProfile); // Para UI imediata
            } catch (err: any) {
                setError(err.message || 'Erro ao criar conta.');
            } finally {
                setLoading(false);
            }
        } else {
            try {
                await loginWithEmail(email, pass);
            } catch (err: any) {
                try {
                    const localSuccess = await onLogin(email, pass);
                    if (!localSuccess) setError('Credenciais inválidas.');
                } catch (localErr) {
                    setError('Credenciais inválidas.');
                }
            } finally {
                setLoading(false);
            }
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await loginWithGoogle();
        } catch (err) {
            setError('Erro no login com Google.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500"></div>

                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl text-indigo-400 shadow-lg mb-4">
                        <i className="fas fa-gamepad"></i>
                    </div>
                    <h1 className="text-xl font-black gamified-font text-slate-800 text-center">Mestres da Linguagem</h1>
                </div>

                <form onSubmit={handleAuth} className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pb-2 custom-scrollbar">
                    {isRegistering && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Professor</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors" value={name} onChange={e => setName(e.target.value)} disabled={loading} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Escola Primária</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors" value={school} onChange={e => setSchool(e.target.value)} disabled={loading} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Disciplina</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors" value={subject} onChange={e => setSubject(e.target.value)} disabled={loading} required />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="usuario@email.com"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
                        <input
                            type="password"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />
                    </div>
                    {isRegistering && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Senha</label>
                            <input
                                type="password"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                                value={passConfirm}
                                onChange={e => setPassConfirm(e.target.value)}
                                placeholder="••••••••"
                                disabled={loading}
                                required
                            />
                        </div>
                    )}

                    {error && <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-2 rounded-lg animate-fade-in">{error}</p>}

                    <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                        {loading ? <i className="fas fa-spinner animate-spin"></i> : <><i className={`fas ${isRegistering ? 'fa-user-plus' : 'fa-sign-in-alt'}`}></i> {isRegistering ? 'Criar Conta' : 'Entrar'}</>}
                    </button>

                    <div className="text-center mt-2">
                        <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 underline">
                            {isRegistering ? 'Já tenho uma conta. Entrar.' : 'Não possui uma conta? Crie agora!'}
                        </button>
                    </div>

                    {!isRegistering && (
                        <>
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-200"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">OU</span>
                                <div className="flex-grow border-t border-slate-200"></div>
                            </div>

                            <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white border-2 border-slate-100 hover:border-slate-300 text-slate-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                <i className="fab fa-google text-red-500"></i> Entrar com Google
                            </button>
                        </>
                    )}
                </form>

                <p className="text-[10px] text-center text-slate-400 mt-6 flex flex-col items-center gap-1">
                    <span>&copy; 2026 Projeto Mestres da Linguagem</span>
                    <span className="uppercase tracking-widest font-bold text-indigo-400/50">Beta 0.8</span>
                </p>
            </div>
        </div>
    );
};

// --- APP PRINCIPAL ---

export default function App() {
    const [data, setData] = useState<AppData>({ schools: [], transactions: [], taskCatalog: [], badgesCatalog: [], penaltiesCatalog: [] });
    const [profile, setProfile] = useState<TeacherProfileData>(loadProfile());
    const [view, setView] = useState<'dashboard' | 'schools' | 'catalog' | 'settings' | 'student-view' | 'profile'>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSchoolTabUnlocked, setIsSchoolTabUnlocked] = useState(false);
    const [pinModalConfig, setPinModalConfig] = useState<{ isOpen: boolean, targetView: 'schools' | 'profile' | null }>({ isOpen: false, targetView: null });
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState(0);

    // Lockout Timer Logic
    useEffect(() => {
        let timer: any;
        if (lockoutTime > 0) {
            timer = setInterval(() => {
                setLockoutTime(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [lockoutTime]);

    // Auto-verify PIN
    useEffect(() => {
        if (pinInput.length === 4 && lockoutTime === 0) {
            const expectedPin = profile.pin || "0000";
            if (pinInput === expectedPin) {
                setIsSchoolTabUnlocked(true);
                setFailedAttempts(0);
                setPinModalConfig({ isOpen: false, targetView: null });
                if (pinModalConfig.targetView) setView(pinModalConfig.targetView);
                setPinInput('');
                setPinError('');
            } else {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);
                setPinInput('');

                if (newAttempts > 3) {
                    const extraTime = (newAttempts - 4) * 5;
                    setLockoutTime(30 + extraTime);
                    setPinError(`Muitas tentativas. Aguarde 30s (+${extraTime}s).`);
                } else {
                    setPinError(`PIN Incorreto. (${newAttempts}/3 tentativas antes do bloqueio)`);
                }
            }
        }
    }, [pinInput, profile.pin, lockoutTime, failedAttempts, pinModalConfig.targetView]);

    // Contexto de Seleção
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [viewingStudentId, setViewingStudentId] = useState<string>('');
    const [currentBimester, setCurrentBimester] = useState<Bimester>(1);

    // Estados de Gerenciamento
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'school' | 'class' | 'task' | 'badge' | 'penalty' | null;
        mode: 'create' | 'edit';
        editingId?: string;
        initialData?: any;
    }>({ isOpen: false, type: null, mode: 'create' });

    const [deleteConfig, setDeleteConfig] = useState<{
        isOpen: boolean;
        type: 'school' | 'class' | 'task' | 'badge' | 'penalty' | 'student' | null;
        id: string | null;
        parentId?: string;
        itemName?: string;
    }>({ isOpen: false, type: null, id: null });

    // Campos de Formulário
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        points: 10,
        icon: 'fa-medal',
        imageUrl: '',
        rewardValue: 0,
        bimesters: [1, 2, 3, 4] as Bimester[],
        autoUnlockEnabled: false,
        autoUnlockType: 'LXC' as 'LXC' | 'TASKS',
        autoUnlockThreshold: 0
    });

    const [showBatchImport, setShowBatchImport] = useState(false);
    const [selectedStudentsForTask, setSelectedStudentsForTask] = useState<string[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [manualDesc, setManualDesc] = useState('');
    const [missionSearch, setMissionSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [customMissionDesc, setCustomMissionDesc] = useState('');
    const [manualPoints, setManualPoints] = useState(0);
    const [isGivingBadge, setIsGivingBadge] = useState(false);

    const [studentSettingsConfig, setStudentSettingsConfig] = useState<{
        isOpen: boolean;
        studentId: string | null;
        tab: 'edit' | 'mark' | 'exclude' | 'transfer';
        initialName?: string;
        initialRegId?: string;
        snapshot?: Student | null;
    }>({ isOpen: false, studentId: null, tab: 'edit' });

    const [transferConfig, setTransferConfig] = useState<{ targetSchoolId: string; targetClassId: string; }>({ targetSchoolId: '', targetClassId: '' });

    const [viewingTransactionId, setViewingTransactionId] = useState<string | null>(null);

    const [pendingDeleteStudentId, setPendingDeleteStudentId] = useState<string | null>(null);

    // Estado para pontuação individual nesta rodada
    const [individualScores, setIndividualScores] = useState<Record<string, number>>({});

    // Estado para Penalidades
    const [catalogTab, setCatalogTab] = useState<'tasks' | 'badges' | 'penalties'>('tasks');
    const [applyPenaltyConfig, setApplyPenaltyConfig] = useState<{ isOpen: boolean; penaltyId: string | null; amount: number }>({ isOpen: false, penaltyId: null, amount: 0 });
    const [penaltyStudents, setPenaltyStudents] = useState<string[]>([]);
    const [penaltyClassId, setPenaltyClassId] = useState<string>('');
    const [penaltySchoolId, setPenaltySchoolId] = useState<string>('');

    // Estado para edição de transação individual
    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
    const [editingTransactionValue, setEditingTransactionValue] = useState<string>('');
    const [editingTxDescId, setEditingTxDescId] = useState<string | null>(null);
    const [editingTxDescValue, setEditingTxDescValue] = useState<string>('');
    const [missionModalTab, setMissionModalTab] = useState<'missions' | 'penalties'>('missions');

    // --- TUTORIAL STATE ---
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(1);

    // --- AUTH STATE (FIREBASE) ---
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // --- SYNC STATE ---
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    // --- EFEITOS (AUTH LISTENER) ---
    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges(async (user) => {
            if (user) {
                setIsAuthenticated(true);
                setCurrentUser(user);
                localStorage.setItem('mestres_auth_token', 'firebase_session');

                // Firestore Load
                try {
                    const cloudData = await fetchTeacherData(user.uid);
                    // If cloud data is empty, we might want to keep local data?
                    // For now, let's assume cloud is authority if logged in.
                    // But if it's the first time, cloud is empty.
                    // Logic: If cloud is empty AND local has data, ask to sync? 
                    // Or just set data.
                    // Simplest: Set data. If empty, user starts fresh or imports.
                    // Ideally: Check if cloud has schools. If not, create defaults?
                    setData(cloudData);

                    // Profile
                    const cloudProfile = await getTeacherProfile(user.uid);
                    if (cloudProfile) setProfile(cloudProfile);
                    else await saveTeacherProfile(user.uid, profile);

                } catch (err) {
                    console.error("Erro ao carregar do Firestore:", err);
                    alert("Erro ao carregar dados da nuvem. Verifique sua conexão.");
                }

            } else {
                setIsAuthenticated(false);
                setCurrentUser(null);
                localStorage.removeItem('mestres_auth_token');
                // Optional: Clear data or load local demo data
                // setData({ schools: [], transactions: [], taskCatalog: [], badgesCatalog: [], penaltiesCatalog: [] });
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- INICIALIZAÇÃO ---
    useEffect(() => {
        const storedAuth = localStorage.getItem('mestres_auth_token');
        if (storedAuth === 'valid_session_secured') {
            setIsAuthenticated(true);
        }

        const loaded = loadData();
        setData(loaded);
        if (loaded.schools.length > 0) {
            if (!selectedSchoolId) setSelectedSchoolId(loaded.schools[0].id);
            if (loaded.schools[0].classes?.length && !selectedClassId) {
                setSelectedClassId(loaded.schools[0].classes[0].id);
            }
        }
    }, []);

    // --- AUTO BIMESTER SWITCHER ---
    useEffect(() => {
        if (!selectedSchoolId || !data.schools.length) return;

        const school = data.schools.find(s => s.id === selectedSchoolId);
        if (!school || !school.bimesterDates) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let activeBimester: Bimester | null = null;

        for (const [bStr, rawDates] of Object.entries(school.bimesterDates)) {
            const b = parseInt(bStr) as Bimester;
            const dates = rawDates as { start: string; end: string } | undefined;
            if (dates?.start && dates?.end) {
                const [sYear, sMonth, sDay] = dates.start.split('-').map(Number);
                const start = new Date(sYear, sMonth - 1, sDay);

                const [eYear, eMonth, eDay] = dates.end.split('-').map(Number);
                const end = new Date(eYear, eMonth - 1, eDay);
                end.setHours(23, 59, 59, 999);

                if (today >= start && today <= end) {
                    activeBimester = b;
                    break;
                }
            }
        }

        if (activeBimester !== null && currentBimester !== activeBimester) {
            setCurrentBimester(activeBimester);
        }
    }, [selectedSchoolId, data.schools, currentBimester]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [view]);

    // --- AUTH HANDLERS ---
    const performLogin = async (emailInput: string, passInput: string): Promise<boolean> => {
        // Normaliza o email
        const cleanEmail = emailInput.trim().toLowerCase();

        // Gera "hash" simples da senha inserida para comparação
        const inputEncoded = obscurePassword(passInput);

        // 1. CHECAGEM MESTRA (Prioridade Máxima)
        // Verifica se é o dono da conta com a senha mestre
        if (cleanEmail === MASTER_EMAIL && inputEncoded === MASTER_PASS_ENCODED) {
            setIsAuthenticated(true);
            localStorage.setItem('mestres_auth_token', 'valid_session_secured');
            return true;
        }

        // 2. Validação contra Perfil Personalizado (se a senha for diferente da padrão)
        // Caso o professor tenha alterado a senha no perfil
        if (profile.passwordHash && profile.passwordHash !== MASTER_PASS_ENCODED) {
            if (cleanEmail === MASTER_EMAIL && inputEncoded === profile.passwordHash) {
                setIsAuthenticated(true);
                localStorage.setItem('mestres_auth_token', 'valid_session_secured');
                return true;
            }
        }

        return false;
    };

    const performLogout = () => {
        logout();
        setIsAuthenticated(false);
        localStorage.removeItem('mestres_auth_token');
    };

    // --- HELPER: ATUALIZAR ALUNO ---
    const updateStudentNickname = (studentId: string, nickname: string) => {
        const newData = JSON.parse(JSON.stringify(data));
        newData.schools.forEach((s: School) => {
            s.classes?.forEach((c: ClassGroup) => {
                if (c.students) {
                    c.students = c.students.map((std: Student) => {
                        if (std.id === studentId) return { ...std, nickname };
                        return std;
                    });
                }
            });
        });
        setData(newData);
        saveData(newData);
    };

    // --- HELPER: GERENCIAR TRANSAÇÕES (EDITAR/EXCLUIR) ---
    const handleDeleteTransaction = (transactionId: string) => {
        if (window.confirm("Tem certeza que deseja apagar este recebimento/medalha? O saldo do aluno será recalculado.")) {
            const newData = removeTransaction(data, transactionId);
            setData(newData);
            saveData(newData);
            if (auth.currentUser?.uid) firestoreDeleteTransaction(transactionId);
        }
    };

    const handleEditTransactionAmount = (transactionId: string, currentAmount: number) => {
        setEditingTransactionId(transactionId);
        setEditingTransactionValue(currentAmount.toString());
    };

    const saveTransactionEdit = (transactionId: string) => {
        const newVal = Number(editingTransactionValue);
        if (!isNaN(newVal)) {
            const newData = updateTransactionAmount(data, transactionId, newVal);
            setData(newData);
            saveData(newData);

            const updatedTx = newData.transactions.find(t => t.id === transactionId);
            if (updatedTx && auth.currentUser?.uid) {
                firestoreUpdateTransaction(updatedTx);
            }

            setEditingTransactionId(null);
            setEditingTransactionValue('');
        } else {
            alert("Valor inválido.");
        }
    };

    const saveTxDescEdit = (id: string) => {
        let newData = JSON.parse(JSON.stringify(data));
        const txIndex = newData.transactions.findIndex((t: Transaction) => t.id === id);
        if (txIndex > -1) {
            newData.transactions[txIndex].customDescription = editingTxDescValue;
            setData(newData);
            saveData(newData);
            const uid = auth.currentUser?.uid;
            if (uid) {
                firestoreUpdateTransaction(newData.transactions[txIndex]).catch(console.error);
            }
        }
        setEditingTxDescId(null);
    };

    // --- CRUD HANDLERS ---

    const openModal = (type: 'school' | 'class' | 'task' | 'badge' | 'penalty', mode: 'create' | 'edit', dataItem?: any) => {
        setModalConfig({
            isOpen: true,
            type,
            mode,
            editingId: dataItem?.id,
            initialData: dataItem
        });

        if (mode === 'edit' && dataItem) {
            setFormData({
                name: dataItem.name || dataItem.title,
                description: dataItem.description || '',
                points: Math.abs(dataItem.defaultPoints) || 10,
                icon: dataItem.icon || 'fa-star',
                imageUrl: dataItem.imageUrl || '',
                rewardValue: dataItem.rewardValue || 0,
                bimesters: dataItem.bimesters || [1, 2, 3, 4],
                autoUnlockEnabled: !!dataItem.autoUnlockCriteria,
                autoUnlockType: dataItem.autoUnlockCriteria?.type || 'LXC',
                autoUnlockThreshold: dataItem.autoUnlockCriteria?.threshold || 0,
                schoolIconUrl: dataItem.iconUrl || '',
                bimesterDates: dataItem.bimesterDates || {
                    1: { start: '', end: '' },
                    2: { start: '', end: '' },
                    3: { start: '', end: '' },
                    4: { start: '', end: '' }
                }
            });
        } else {
            // Reset form
            setFormData({
                name: '',
                description: '',
                points: 10,
                icon: 'fa-star',
                imageUrl: '',
                rewardValue: 0,
                bimesters: (type === 'badge' || type === 'penalty') ? [1, 2, 3, 4] : [currentBimester],
                autoUnlockEnabled: false,
                autoUnlockType: 'LXC',
                autoUnlockThreshold: 0,
                schoolIconUrl: '',
                bimesterDates: {
                    1: { start: '', end: '' },
                    2: { start: '', end: '' },
                    3: { start: '', end: '' },
                    4: { start: '', end: '' }
                }
            });
        }
    };

    const openStudentSettings = (student: Student) => {
        setStudentSettingsConfig({
            isOpen: true,
            studentId: student.id,
            tab: 'edit',
            initialName: student.name,
            initialRegId: student.registrationId,
            snapshot: JSON.parse(JSON.stringify(student))
        });
    };

    const revertStudentSettings = async () => {
        const snap = studentSettingsConfig.snapshot;
        if (!snap || !studentSettingsConfig.studentId) {
            setStudentSettingsConfig({ ...studentSettingsConfig, isOpen: false });
            return;
        }

        const newData = JSON.parse(JSON.stringify(data));
        const uid = auth.currentUser?.uid;
        let found = false;

        newData.schools.forEach((school: School) => {
            school.classes?.forEach((cls: ClassGroup) => {
                const sIndex = cls.students?.findIndex((s: Student) => s.id === snap.id);
                if (sIndex !== undefined && sIndex > -1 && cls.students) {
                    cls.students[sIndex] = snap;
                    found = true;
                }
            });
        });

        if (found) {
            setData(newData);
            saveData(newData);
            if (uid) firestoreUpdateStudent(snap).catch(console.error);
        }
        setStudentSettingsConfig({ ...studentSettingsConfig, isOpen: false });
    };

    const handleStudentSettingsSave = async (updates: Partial<Student>) => {
        if (!studentSettingsConfig.studentId) return;

        const newData = JSON.parse(JSON.stringify(data));
        const uid = auth.currentUser?.uid;
        let found = false;
        let targetStudent: Student | null = null;

        newData.schools.forEach((school: School) => {
            school.classes?.forEach((cls: ClassGroup) => {
                const sIndex = cls.students?.findIndex((s: Student) => s.id === studentSettingsConfig.studentId);
                if (sIndex !== undefined && sIndex !== -1 && cls.students) {
                    cls.students[sIndex] = { ...cls.students[sIndex], ...updates };
                    found = true;
                    targetStudent = cls.students[sIndex];
                }
            });
        });

        if (found && targetStudent) {
            setData(newData);
            saveData(newData);
            if (uid) firestoreUpdateStudent(targetStudent);

            // If explicit save (not just toggle mark), maybe close or show toast?
            // Existing logic didn't close modal automatically on toggle, only on "Salvar Alterações" button which calls this.
            // But the button calls it with name/regId. 
            // The checkboxes call it directly.
            // We'll keep behavior as is.
        }

        // If it was a full save (called from button with name/regId), we might want to close?
        // The onclick in GenericModal (line 1901) calls this then doesn't explicitly close.
        // But the previous code didn't close either. 
        // Logic at 550 was commented out: // setStudentSettingsConfig({ ...studentSettingsConfig, isOpen: false });
        // So I will just respect that? 
        // Actually, if I click "Salvar Alterações", I expect it to close.
        // Let's check line 1901 in view.
        if (updates.name || updates.registrationId) {
            setStudentSettingsConfig(prev => ({ ...prev, isOpen: false }));
        }
    };

    const closeModal = () => {
        setModalConfig({ ...modalConfig, isOpen: false });
        setFormData({ name: '', description: '', points: 10, icon: 'fa-medal', imageUrl: '', rewardValue: 0, bimesters: [1, 2, 3, 4] });
    };

    const handleModalSave = async () => {
        const { type, mode, editingId } = modalConfig;
        const { name, description, points, icon, bimesters, imageUrl, rewardValue } = formData;

        if (!name.trim()) return alert("O nome é obrigatório.");
        if ((type === 'task' || type === 'badge') && bimesters.length === 0) return alert("Selecione pelo menos um bimestre.");

        const newData = JSON.parse(JSON.stringify(data));
        const uid = auth.currentUser?.uid;

        if (type === 'school') {
            if (mode === 'create') {
                const newSchool: School = {
                    id: uuidv4(),
                    name,
                    classes: [],
                    iconUrl: formData.schoolIconUrl,
                    bimesterDates: formData.bimesterDates
                };
                newData.schools.push(newSchool);
                setSelectedSchoolId(newSchool.id);
                if (uid) firestoreAddSchool(uid, newSchool);
            } else {
                const school = newData.schools.find((s: School) => s.id === editingId);
                if (school) {
                    school.name = name;
                    school.iconUrl = formData.schoolIconUrl;
                    school.bimesterDates = formData.bimesterDates;
                    if (uid) firestoreUpdateSchool(school);
                }
            }
        }
        else if (type === 'class') {
            const targetSchoolId = mode === 'create' ? selectedSchoolId : modalConfig.initialData.schoolId;
            const school = newData.schools.find((s: School) => s.id === targetSchoolId);
            if (school) {
                if (mode === 'create') {
                    const newClass: ClassGroup = { id: uuidv4(), name, schoolId: targetSchoolId, students: [], seed: generateClassSeed() };
                    if (!school.classes) school.classes = [];
                    school.classes.push(newClass);
                    setSelectedClassId(newClass.id);
                    if (uid) firestoreAddClass(uid, newClass);
                } else {
                    const cls = school.classes.find((c: ClassGroup) => c.id === editingId);
                    if (cls) {
                        cls.name = name;
                        if (uid) firestoreUpdateClass(cls);
                    }
                }
            }
        }
        else if (type === 'task') {
            const clampedPoints = Math.max(5, Math.min(250, Number(points)));
            if (mode === 'create') {
                const newItem = { id: uuidv4(), title: name, description, defaultPoints: clampedPoints, bimesters: bimesters };
                newData.taskCatalog.push(newItem);
                if (uid) firestoreAddCatalogItem(uid, 'task', newItem);
            } else {
                const task = newData.taskCatalog.find((t: TaskDefinition) => t.id === editingId);
                if (task) {
                    task.title = name; task.description = description; task.defaultPoints = clampedPoints; task.bimesters = bimesters;
                    if (uid) firestoreUpdateCatalogItem('task', task);
                }
            }
        }
        else if (type === 'badge') {
            const clampedReward = Math.max(0, Math.min(100, Number(rewardValue)));
            const criteria = formData.autoUnlockEnabled ? { type: formData.autoUnlockType, threshold: Number(formData.autoUnlockThreshold) } : undefined;
            if (mode === 'create') {
                const newItem: Badge = { id: uuidv4(), name, icon, imageUrl, description, rewardValue: clampedReward, bimesters: bimesters, autoUnlockCriteria: criteria };
                newData.badgesCatalog.push(newItem);
                if (uid) firestoreAddCatalogItem(uid, 'badge', newItem);
            } else {
                const badge = newData.badgesCatalog.find((b: Badge) => b.id === editingId);
                if (badge) {
                    badge.name = name; badge.icon = icon; badge.imageUrl = imageUrl; badge.description = description; badge.rewardValue = Number(rewardValue); badge.bimesters = bimesters; badge.autoUnlockCriteria = criteria;
                    if (uid) firestoreUpdateCatalogItem('badge', badge);
                }
            }
        }
        else if (type === 'penalty') {
            const clampedPoints = Math.max(-30, Math.min(-1, -Math.abs(Number(points))));
            if (mode === 'create') {
                const newItem = { id: uuidv4(), title: name, description, defaultPoints: clampedPoints, bimesters: bimesters };
                newData.penaltiesCatalog.push(newItem);
                if (uid) firestoreAddCatalogItem(uid, 'penalty', newItem);
            } else {
                const pen = newData.penaltiesCatalog.find((p: PenaltyDefinition) => p.id === editingId);
                if (pen) {
                    pen.title = name; pen.description = description; pen.defaultPoints = clampedPoints; pen.bimesters = bimesters;
                    if (uid) firestoreUpdateCatalogItem('penalty', pen);
                }
            }
        }

        setData(newData);
        saveData(newData); // Keep saving local backup
        closeModal();
    };

    // --- DELETE SYSTEM ---

    const requestDelete = (e: React.MouseEvent, type: 'school' | 'class' | 'task' | 'badge' | 'penalty' | 'student', id: string, parentId?: string, itemName?: string) => {
        e.stopPropagation();
        setDeleteConfig({ isOpen: true, type, id, parentId, itemName });
    };

    const executeDelete = async () => {
        const { type, id, parentId } = deleteConfig;
        const newData = JSON.parse(JSON.stringify(data));
        const uid = auth.currentUser?.uid;

        if (type === 'school') {
            newData.schools = newData.schools.filter((s: School) => s.id !== id);
            if (selectedSchoolId === id) { setSelectedSchoolId(''); setSelectedClassId(''); }
            if (uid && id) firestoreDeleteSchool(id);
        }
        else if (type === 'class') {
            const school = newData.schools.find((s: School) => s.id === parentId);
            if (school && school.classes) school.classes = school.classes.filter((c: ClassGroup) => c.id !== id);
            if (selectedClassId === id) setSelectedClassId('');
            if (uid && id) firestoreDeleteClass(id);
        }
        else if (type === 'student') {
            newData.schools.forEach((s: School) => {
                s.classes?.forEach((c: ClassGroup) => {
                    if (c.students) {
                        c.students = c.students.filter((st: Student) => st.id !== id);
                    }
                });
            });
            if (studentSettingsConfig.isOpen && studentSettingsConfig.studentId === id) setStudentSettingsConfig({ ...studentSettingsConfig, isOpen: false });
            if (view === 'student-view' && viewingStudentId === id) setView('dashboard');
            if (uid && id) firestoreDeleteStudent(id);
        }
        else if (type === 'task') {
            newData.taskCatalog = newData.taskCatalog.filter((t: TaskDefinition) => t.id !== id);
            if (uid && id) firestoreDeleteCatalogItem('task', id);
        }
        else if (type === 'badge') {
            newData.badgesCatalog = newData.badgesCatalog.filter((b: Badge) => b.id !== id);
            if (uid && id) firestoreDeleteCatalogItem('badge', id);
        }
        else if (type === 'penalty') {
            newData.penaltiesCatalog = newData.penaltiesCatalog.filter((p: PenaltyDefinition) => p.id !== id);
            if (uid && id) firestoreDeleteCatalogItem('penalty', id);
        }

        setData(newData);
        saveData(newData);
        setDeleteConfig({ isOpen: false, type: null, id: null });
    };

    // --- IMPORT SYSTEM ---

    const batchImportStudents = (text: string) => {
        if (!selectedSchoolId || !selectedClassId) return;
        const names = text.split('\n').map(n => n.trim()).filter(n => n.length > 0);

        const newData = JSON.parse(JSON.stringify(data));
        const school = newData.schools.find((s: School) => s.id === selectedSchoolId);
        const cls = school?.classes.find((c: ClassGroup) => c.id === selectedClassId);

        if (cls) {
            const newStudents = names.map((name: string) => ({
                id: uuidv4(),
                name,
                schoolId: selectedSchoolId,
                classId: selectedClassId,
                avatarId: 'default',
                lxcTotal: { 1: 0, 2: 0, 3: 0, 4: 0 },
                badges: [],
            }));
            cls.students = [...(cls.students || []), ...newStudents];
            setData(newData);
            saveData(newData);
        }
        setShowBatchImport(false);
    };

    // --- REWARD SYSTEM ---

    const giveRewards = async () => {
        if (selectedStudentsForTask.length === 0) return alert("Selecione alunos.");

        let currentData = JSON.parse(JSON.stringify(data));
        const uid = auth.currentUser?.uid;
        const txPromises: Promise<void>[] = [];

        if (isGivingBadge) {
            if (!selectedTaskId) return alert("Selecione uma medalha.");
            const badge = data.badgesCatalog.find(b => b.id === selectedTaskId);
            if (!badge) return;

            selectedStudentsForTask.forEach(sid => {
                const tx: Transaction = {
                    id: uuidv4(),
                    studentId: sid,
                    type: 'BADGE',
                    amount: badge.rewardValue || 0,
                    description: badge.name, // Use name instead of ID for description
                    customDescription: customMissionDesc || badge.description,
                    bimester: currentBimester,
                    date: new Date()
                };

                // Update Local Data (Optimistic)
                // We need to implement addTransaction locally logic effectively
                // But wait, addTransaction helper in localStorageService might be useful but we are operating on currentData object
                // Let's replicate simple logic here or import helper
                // For now, manual update on currentData
                currentData.transactions.push(tx);
                // Also update student total? Badges usually don't give points in this system? 
                // Wait, badge.rewardValue exists.
                if (badge.rewardValue) {
                    const school = currentData.schools.find((s: School) => s.classes?.some((c: ClassGroup) => c.students?.some((st: Student) => st.id === sid)));
                    const cls = school?.classes?.find((c: ClassGroup) => c.students?.some((st: Student) => st.id === sid));
                    const student = cls?.students?.find((st: Student) => st.id === sid);
                    if (student) {
                        student.lxcTotal[currentBimester] = (student.lxcTotal[currentBimester] || 0) + badge.rewardValue;
                    }
                }

                if (uid) txPromises.push(firestoreGiveRewardAtomic(uid, tx));
            });
        } else {
            // Task or Penalty
            for (const sid of selectedStudentsForTask) {
                let points = manualPoints;
                let desc = manualDesc;
                let isPenalty = false;

                const penalty = data.penaltiesCatalog.find(p => p.id === selectedTaskId);
                const task = data.taskCatalog.find(t => t.id === selectedTaskId);

                if (penalty) {
                    points = penalty.defaultPoints;
                    desc = penalty.title;
                    isPenalty = true;
                } else if (task) {
                    points = task.defaultPoints;
                    desc = task.title;
                    isPenalty = false;
                } else {
                    // Custom
                    // Logic handled below
                }

                // If custom manual points/desc
                if (!selectedTaskId) {
                    // points and desc are already set from state
                }

                if (individualScores[sid] !== undefined) {
                    points = individualScores[sid];
                }

                // Final check on type
                let type: 'TASK' | 'PENALTY' | 'BONUS' = points < 0 ? 'PENALTY' : 'TASK';
                if (!desc) desc = type === 'PENALTY' ? "Penalidade" : "Atividade";
                if (!selectedTaskId && (!desc || !desc.trim())) {
                    alert("Você precisa informar um Título / Motivo para a missão personalizada.");
                    return; // Prevent further execution
                }

                const tx: Transaction = {
                    id: uuidv4(),
                    studentId: sid,
                    type: type,
                    amount: points,
                    description: desc,
                    customDescription: customMissionDesc || (task ? task.description : penalty ? penalty.description : ''),
                    bimester: currentBimester,
                    date: new Date(),
                    ...(type === 'TASK' ? { teacherName: profile?.displayName || profile?.name?.split(' ')[0] || 'Professor' } : {})
                };

                // Update Local Data (Optimistic)
                currentData.transactions.push(tx);
                const school = currentData.schools.find((s: School) => s.classes?.some((c: ClassGroup) => c.students?.some((st: Student) => st.id === sid)));
                const cls = school?.classes?.find((c: ClassGroup) => c.students?.some((st: Student) => st.id === sid));
                const student = cls?.students?.find((st: Student) => st.id === sid);
                if (student) {
                    student.lxcTotal[currentBimester] = (student.lxcTotal[currentBimester] || 0) + points;

                    // NEW LOGIC: check and award automatic badges
                    student.badges = student.badges || [];
                    const autoBadges = currentData.badgesCatalog.filter((b: Badge) =>
                        b.autoUnlockCriteria &&
                        b.bimesters?.includes(currentBimester) &&
                        !student.badges.includes(b.id)
                    );

                    autoBadges.forEach((badge: Badge) => {
                        const crit = badge.autoUnlockCriteria!;
                        let unlock = false;
                        if (crit.type === 'LXC') {
                            if ((student.lxcTotal[currentBimester] || 0) >= crit.threshold) unlock = true;
                        } else if (crit.type === 'TASKS') {
                            const taskCount = currentData.transactions.filter((t: Transaction) => t.studentId === student.id && t.type === 'TASK' && t.bimester === currentBimester).length;
                            if (taskCount >= crit.threshold) unlock = true;
                        }

                        if (unlock) {
                            student.badges.push(badge.id);

                            const autoTx: Transaction = {
                                id: uuidv4(),
                                studentId: student.id,
                                type: 'BADGE',
                                amount: badge.rewardValue || 0,
                                description: badge.name,
                                customDescription: "Desbloqueio Automático",
                                bimester: currentBimester,
                                date: new Date(),
                                teacherName: 'Sistema'
                            };
                            currentData.transactions.push(autoTx);
                            if (badge.rewardValue) {
                                student.lxcTotal[currentBimester] = (student.lxcTotal[currentBimester] || 0) + badge.rewardValue;
                            }
                            if (uid) txPromises.push(firestoreGiveRewardAtomic(uid, autoTx));
                        }
                    });
                }

                if (uid) txPromises.push(firestoreGiveRewardAtomic(uid, tx));
            }
        }

        setData(currentData);
        saveData(currentData);

        // Execute Firestore in background (or await if we want to show loading)
        // For better UX, we just let it sync. If error, we might need a global error handler or toast.
        // But for now let's log.
        Promise.all(txPromises).catch(err => console.error("Erro ao sincronizar transações:", err));

        // Reset UI
        setSelectedStudentsForTask([]);
        setIndividualScores({});
        setManualDesc('');
        setCustomMissionDesc('');
        setManualPoints(10);
        setIsGivingBadge(false);
        setSelectedTaskId('');
        alert("Salvo com sucesso!");
    };

    // --- BACKUP ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const confirmRestore = window.confirm("Atenção: A restauração substituirá os dados locais atuais. Para que as alterações reflitam na nuvem (Firestore), você precisará clicar em 'Salvar na Nuvem' no topo da tela do Dashboard após a restauração. Deseja continuar?");
        if (!confirmRestore) {
            e.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            if (importDataFromJSON(ev.target?.result as string)) {
                alert("Dados restaurados com sucesso! Não se esqueça de Salvar na Nuvem.");
                setData(loadData());
                setProfile(loadProfile()); // Refresh profile if it was imported
            } else {
                alert("Arquivo inválido.");
            }
        };
        reader.readAsText(file);
    };

    // --- PENALTY APPLICATION SYSTEM ---
    const applyPenalty = async () => {
        if (!applyPenaltyConfig.penaltyId || penaltyStudents.length === 0) return alert("Selecione alunos e uma penalidade.");
        if (applyPenaltyConfig.amount > -1 || applyPenaltyConfig.amount < -30) return alert("Penalidade inválida (-30 a -1).");
        const uid = auth.currentUser?.uid;

        const penalty = data.penaltiesCatalog.find(p => p.id === applyPenaltyConfig.penaltyId);
        if (!penalty) return;

        let currentData = JSON.parse(JSON.stringify(data));
        let appliedCount = 0;
        const txPromises: Promise<void>[] = [];

        penaltyStudents.forEach(sid => {
            const tx: Transaction = {
                id: uuidv4(),
                studentId: sid,
                type: 'PENALTY',
                amount: applyPenaltyConfig.amount, // Usa o montante editado
                description: penalty.title, // Pode ser customizada no futuro se quiser
                bimester: currentBimester,
                date: new Date()
            };

            // Update Local
            currentData.transactions.push(tx);
            const school = currentData.schools.find((s: School) => s.classes?.some((c: ClassGroup) => c.students?.some((st: Student) => st.id === sid)));
            const cls = school?.classes?.find((c: ClassGroup) => c.students?.some((st: Student) => st.id === sid));
            const student = cls?.students?.find((st: Student) => st.id === sid);
            if (student) {
                student.lxcTotal[currentBimester] = (student.lxcTotal[currentBimester] || 0) + applyPenaltyConfig.amount;
            }

            if (uid) txPromises.push(firestoreGiveRewardAtomic(uid, tx));
            appliedCount++;
        });

        setData(currentData);
        saveData(currentData);

        Promise.all(txPromises).catch(err => console.error("Erro ao aplicar penalidades no Firestore:", err));

        alert(`${appliedCount} penalidade(s) aplicada(s).`);
        setApplyPenaltyConfig({ isOpen: false, penaltyId: null, amount: 0 });
        setPenaltyStudents([]);
    };

    // --- STUDENT TRANSFER LOGIC ---
    const handleTransferStudent = async (studentId: string) => {
        const { targetSchoolId, targetClassId } = transferConfig;
        if (!targetSchoolId || !targetClassId || !studentId) return;

        // Find the student's current school and class
        let sourceSchoolId = '';
        let sourceClassId = '';
        let studentToMove: Student | null = null;

        for (const s of data.schools) {
            for (const c of s.classes || []) {
                const found = c.students?.find(std => std.id === studentId);
                if (found) {
                    sourceSchoolId = s.id;
                    sourceClassId = c.id;
                    studentToMove = { ...found };
                    break;
                }
            }
            if (studentToMove) break;
        }

        if (!studentToMove) {
            alert("Aluno não encontrado na base atual.");
            return;
        }

        if (sourceSchoolId === targetSchoolId && sourceClassId === targetClassId) {
            alert("O aluno já está nesta turma.");
            return;
        }

        const confirmData = confirm(`Deseja realmente transferir ${studentToMove.name} para a nova turma selecionada?`);
        if (!confirmData) return;

        const uid = auth.currentUser?.uid;
        let currentData = { ...data };

        // Remove from source
        const sourceSchoolIndex = currentData.schools.findIndex(s => s.id === sourceSchoolId);
        const sourceClassIndex = currentData.schools[sourceSchoolIndex].classes!.findIndex(c => c.id === sourceClassId);
        currentData.schools[sourceSchoolIndex].classes![sourceClassIndex].students =
            currentData.schools[sourceSchoolIndex].classes![sourceClassIndex].students!.filter(s => s.id !== studentId);

        // Update the student's class reference
        studentToMove.classId = targetClassId;

        // Add to target
        const targetSchoolIndex = currentData.schools.findIndex(s => s.id === targetSchoolId);
        const targetClassIndex = currentData.schools[targetSchoolIndex].classes!.findIndex(c => c.id === targetClassId);
        if (!currentData.schools[targetSchoolIndex].classes![targetClassIndex].students) {
            currentData.schools[targetSchoolIndex].classes![targetClassIndex].students = [];
        }
        currentData.schools[targetSchoolIndex].classes![targetClassIndex].students!.push(studentToMove);

        setData(currentData);
        saveData(currentData);

        if (uid) {
            try {
                await firestoreUpdateStudent(studentToMove);
            } catch (err) {
                console.error("Error during transfer sync: ", err);
                alert("Erro ao salvar transferência na nuvem. A alteração foi salva localmente.");
            }
        }

        setStudentSettingsConfig({ isOpen: false, studentId: null, tab: 'transfer' });
        setTransferConfig({ targetSchoolId: '', targetClassId: '' });
        alert('Aluno transferido com sucesso!');
    };

    // --- PROFILE LOGIC ---
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const newName = (form.elements.namedItem('name') as HTMLInputElement).value;
        const newDisplayName = (form.elements.namedItem('displayName') as HTMLInputElement).value;
        const newSubject = (form.elements.namedItem('subject') as HTMLInputElement).value;
        const newBio = (form.elements.namedItem('bio') as HTMLInputElement).value;

        let newHash = profile.passwordHash;

        const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');

        if (!isGoogleUser) {
            const currentPass = (form.elements.namedItem('currentPass') as HTMLInputElement)?.value;
            const newPass = (form.elements.namedItem('newPass') as HTMLInputElement)?.value;
            const confirmPass = (form.elements.namedItem('confirmPass') as HTMLInputElement)?.value;

            if (newPass || currentPass || confirmPass) {
                if (!currentPass) {
                    return alert("Digite a Senha Atual para poder alterá-la.");
                }

                // Verify current password
                const currentHashInput = obscurePassword(currentPass);
                const isCurrentPassValid =
                    (currentPass.toLowerCase() === 'swf123swf' && currentHashInput === MASTER_PASS_ENCODED) ||
                    (profile.passwordHash && profile.passwordHash !== MASTER_PASS_ENCODED && currentHashInput === profile.passwordHash);

                if (!isCurrentPassValid) {
                    return alert("A Senha Atual informada está incorreta.");
                }

                if (newPass !== confirmPass) {
                    return alert("A Nova Senha e a Confirmação não coincidem.");
                }

                if (newPass.length < 6) {
                    return alert("A Nova Senha deve ter pelo menos 6 caracteres.");
                }

                newHash = obscurePassword(newPass);
            }
        }

        let finalPin = profile.pin;
        const currentPin = (form.elements.namedItem('currentPin') as HTMLInputElement)?.value;
        const newPin = (form.elements.namedItem('newPin') as HTMLInputElement)?.value;
        const confirmPin = (form.elements.namedItem('confirmPin') as HTMLInputElement)?.value;

        if (newPin || currentPin || confirmPin) {
            if (!currentPin) {
                return alert("Digite o PIN atual para alterá-lo.");
            }
            const actualPin = profile.pin || "0000";
            if (currentPin !== actualPin) {
                return alert("PIN Atual incorreto.");
            }
            if (newPin !== confirmPin) {
                return alert("O Novo PIN e a confirmação não coincidem.");
            }
            if (newPin && !/^\d{4}$/.test(newPin)) {
                return alert("O Novo PIN deve ter exatamente 4 dígitos numéricos.");
            }
            if (newPin) finalPin = newPin;
        }

        const uid = auth.currentUser?.uid;

        const updatedProfile = {
            name: newName,
            displayName: newDisplayName,
            subject: newSubject,
            bio: newBio,
            passwordHash: newHash,
            pin: finalPin
        };

        setProfile(updatedProfile);
        saveProfile(updatedProfile);

        if (uid) {
            try {
                await saveTeacherProfile(uid, updatedProfile);
            } catch (err) {
                console.error("Erro ao salvar perfil no Firestore:", err);
            }
        }

        alert("Perfil atualizado com sucesso!");
    };

    // --- MANAUL SYNC TO CLOUD ---
    const handleSyncToCloud = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) {
            alert("Você precisa estar logado para salvar na nuvem.");
            return;
        }
        setIsSyncing(true);
        setSyncMessage('');
        try {
            await firestoreSyncAll(uid, data, profile);
            setSyncMessage('Dados salvos com sucesso!');
            setTimeout(() => setSyncMessage(''), 3000);
        } catch (err: any) {
            console.error("Erro ao sincronizar dados manualmente:", err);
            alert("Erro ao salvar dados na nuvem: " + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // --- PIN VERIFICATION ---
    const navigateWithPinCheck = (targetView: 'schools' | 'profile' | 'catalog' | 'settings' | 'dashboard') => {
        if (targetView === 'schools' || targetView === 'profile') {
            if (!isSchoolTabUnlocked) {
                // Necessário PIN
                setPinModalConfig({ isOpen: true, targetView });
                setPinInput('');
                setPinError('');
                return;
            }
        } else {
            // Ao navegar para áreas públicas, tranca novamente as áreas sensíveis
            setIsSchoolTabUnlocked(false);
        }
        setView(targetView);
    };

    // handlePinSubmit removed, now handled by useEffect auto-verify

    // --- DERIVED STATE ---
    const currentSchool = data.schools.find(s => s.id === selectedSchoolId);
    const currentClass = currentSchool?.classes?.find(c => c.id === selectedClassId);

    // Sort and Filter logic
    const studentsListRaw = currentClass?.students || [];
    const studentsListAlphabetical = [...studentsListRaw].sort((a, b) => a.name.localeCompare(b.name));
    const filteredStudentsList = studentsListAlphabetical.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.nickname?.toLowerCase().includes(studentSearch.toLowerCase()));
    const studentsList = filteredStudentsList;

    const filteredTasks = data.taskCatalog.filter(t => t.bimesters && t.bimesters.includes(currentBimester));
    const filteredBadges = data.badgesCatalog.filter(b => b.bimesters && b.bimesters.includes(currentBimester));

    // --- AUTH CHECK ---
    if (!isAuthenticated) {
        return <LoginScreen onLogin={performLogin} />;
    }

    // --- VIEW: STUDENT ---
    if (view === 'student-view') {
        const student = getAllStudents(data.schools).find(s => s.id === viewingStudentId);
        if (!student) return <div className="p-8 text-center text-red-500">Erro: Aluno não encontrado. Volte ao painel.</div>;
        const total = student.lxcTotal[currentBimester] || 0;
        const level = getLevel(total, currentBimester);
        const myBadges = data.badgesCatalog.filter(b => student.badges?.includes(b.id));

        const studentTransactions = data.transactions
            .filter(t => t.studentId === student.id && t.bimester === currentBimester)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        let currentLevelTitle = getLevel(0, currentBimester).title;

        const timelineEvents = studentTransactions.map(tx => {
            runningBalance += tx.amount;
            const newLevel = getLevel(runningBalance, currentBimester);
            let levelUpData = null;

            if (newLevel.title !== currentLevelTitle) {
                levelUpData = { prev: currentLevelTitle, next: newLevel.title, level: newLevel };
                currentLevelTitle = newLevel.title;
            }
            return { ...tx, levelUpData, runningBalance };
        }).reverse();

        return (
            <div className="min-h-screen bg-slate-100 font-sans pb-10">
                <div className={`${level.color} text-white p-8 rounded-b-[3rem] shadow-xl relative`}>
                    <button onClick={() => setView('dashboard')} className="absolute top-4 left-4 bg-white/20 px-3 py-1 rounded-full text-xs font-bold hover:bg-white/30 transition-all z-10"><i className="fas fa-arrow-left"></i> Voltar</button>
                    {student.registrationId && (
                        <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs font-bold z-10" title="Matrícula">
                            <i className="fas fa-id-card mr-1"></i> {student.registrationId}
                        </div>
                    )}
                    <div className="flex flex-col items-center mt-4">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl text-slate-700 font-bold mb-4 shadow-lg border-4 border-white/30 relative">
                            {student.name.charAt(0)}
                            <button
                                onClick={() => {
                                    const newNick = prompt("Escolha seu Nickname:", student.nickname || "");
                                    if (newNick !== null) updateStudentNickname(student.id, newNick);
                                }}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs shadow-md border-2 border-white"
                                title="Editar Nickname"
                            >
                                <i className="fas fa-pen"></i>
                            </button>
                        </div>

                        {student.nickname && (
                            <h1 className="text-xl font-black gamified-font mb-1 tracking-wide">{student.nickname}</h1>
                        )}
                        <h2 className={`${student.nickname ? 'text-sm opacity-80 font-medium' : 'text-xl font-bold'}`}>{student.name}</h2>

                        <div className="mt-4 flex items-center gap-2">
                            <span className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <i className="fas fa-crown"></i> {level.title}
                            </span>
                        </div>

                        <div className="mt-6 text-6xl font-black gamified-font drop-shadow-md">{total} <span className="text-lg opacity-70 font-bold">LXC</span></div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-6 -mt-8 relative z-10 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-amber-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-slate-700 font-bold text-sm uppercase flex items-center gap-2"><i className="fas fa-medal text-amber-500 text-lg"></i> Hall de Medalhas</h3>
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">{myBadges.length}</span>
                        </div>

                        {myBadges.length === 0 ? <p className="text-slate-400 text-sm italic text-center py-4">Sua coleção de medalhas está vazia. Continue se esforçando!</p> : (
                            <div className="flex flex-wrap gap-4 justify-center">
                                {myBadges.map(b => (
                                    <div key={b.id} className="flex flex-col items-center group relative cursor-pointer">
                                        {b.imageUrl ? (
                                            <img src={b.imageUrl} alt={b.name} className="w-16 h-16 rounded-full object-cover border-4 border-amber-200 shadow-md mb-2 bg-white transition-transform group-hover:scale-110" />
                                        ) : (
                                            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 text-3xl mb-2 border-4 border-amber-200 shadow-md transition-transform group-hover:scale-110">
                                                <i className={`fas ${b.icon}`}></i>
                                            </div>
                                        )}
                                        <span className="text-[10px] font-bold text-slate-600 max-w-[80px] text-center leading-tight bg-slate-100 px-2 py-1 rounded-full">{b.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-slate-500 font-bold text-xs uppercase ml-4 tracking-widest">Linha do Tempo</h3>
                        {timelineEvents.length === 0 && <div className="text-center text-slate-400 italic">Nenhuma atividade registrada neste bimestre.</div>}
                        {timelineEvents.map((tx: any) => (
                            <div key={tx.id}>
                                {tx.levelUpData && (
                                    <div className="my-6 text-center animate-fade-in">
                                        <div className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-transform">
                                            <p className="text-xs font-bold uppercase opacity-80 mb-1">Promoção Conquistada!</p>
                                            <div className="flex items-center gap-2 text-sm font-black">
                                                <span>{tx.levelUpData.prev}</span>
                                                <i className="fas fa-arrow-right"></i>
                                                <span className="text-lg text-yellow-300"><i className="fas fa-crown mr-1"></i> {tx.levelUpData.next}</span>
                                            </div>
                                        </div>
                                        <div className="h-4 w-0.5 bg-slate-300 mx-auto mt-2"></div>
                                    </div>
                                )}

                                <div
                                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center relative overflow-hidden group hover:border-indigo-400 cursor-pointer transition-colors"
                                    onClick={() => setViewingTransactionId(tx.id)}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${tx.amount > 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                                    <div className="pl-3 flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-700 text-sm truncate relative group/title">
                                                {tx.teacherName && (
                                                    <span className="absolute left-[-10px] top-1/2 -translate-y-1/2 -translate-x-full opacity-0 group-hover/title:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                                                        Lançado por: {tx.teacherName}
                                                        <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-800"></span>
                                                    </span>
                                                )}
                                                {tx.type === 'BADGE' ? (
                                                    <span className="flex items-center gap-2 text-amber-600">
                                                        <i className="fas fa-medal"></i>
                                                        {data.badgesCatalog.find(b => b.id === tx.description)?.name || 'Nova Medalha'}
                                                    </span>
                                                ) : tx.description}
                                            </p>
                                        </div>
                                        {/* NOVO: Exibir e editar customDescription */}
                                        {editingTxDescId === tx.id ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                className="w-full text-xs p-1 border rounded mt-1 outline-none focus:border-indigo-400 font-medium text-slate-600 bg-slate-50"
                                                value={editingTxDescValue}
                                                onChange={e => setEditingTxDescValue(e.target.value)}
                                                onBlur={() => saveTxDescEdit(tx.id)}
                                                onKeyDown={e => { if (e.key === 'Enter') saveTxDescEdit(tx.id); if (e.key === 'Escape') setEditingTxDescId(null); }}
                                                placeholder="Adicione uma descrição..."
                                            />
                                        ) : (
                                            <p
                                                className="text-xs mt-1 cursor-pointer transition-colors group/desc"
                                                onClick={(e) => { e.stopPropagation(); setEditingTxDescId(tx.id); setEditingTxDescValue(tx.customDescription || ''); }}
                                                title="Clique para editar a descrição"
                                            >
                                                {tx.customDescription ? (
                                                    <span className="text-slate-500 font-medium group-hover/desc:text-indigo-600">{tx.customDescription}</span>
                                                ) : (
                                                    <span className="text-[10px] italic text-slate-300 font-normal group-hover/desc:text-indigo-400">+ Adicionar Descrição</span>
                                                )}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                                            <i className="far fa-clock"></i> {new Date(tx.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 pl-2">
                                        <div className="text-right">
                                            {editingTransactionId === tx.id ? (
                                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        className="w-6 h-6 bg-slate-100 rounded text-slate-500 hover:text-indigo-600 font-bold flex items-center justify-center text-xs"
                                                        onClick={() => setEditingTransactionValue(prev => (Number(prev) - 1).toString())}
                                                    >-</button>
                                                    <input
                                                        type="number"
                                                        className="w-12 text-center font-black text-lg text-indigo-600 bg-transparent outline-none border-b border-indigo-300"
                                                        value={editingTransactionValue}
                                                        onChange={(e) => setEditingTransactionValue(e.target.value)}
                                                        onBlur={() => saveTransactionEdit(tx.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveTransactionEdit(tx.id);
                                                            if (e.key === 'Escape') setEditingTransactionId(null);
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        className="w-6 h-6 bg-slate-100 rounded text-slate-500 hover:text-indigo-600 font-bold flex items-center justify-center text-xs"
                                                        onClick={() => setEditingTransactionValue(prev => (Number(prev) + 1).toString())}
                                                    >+</button>
                                                </div>
                                            ) : (
                                                <div
                                                    className={`font-black text-lg cursor-pointer hover:scale-110 transition-transform ${tx.amount > 0 ? 'text-emerald-500' : 'text-slate-400'}`}
                                                    onClick={(e) => { e.stopPropagation(); handleEditTransactionAmount(tx.id, tx.amount); }}
                                                    title="Clique para editar"
                                                >
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                                </div>
                                            )}
                                            <div className="text-[9px] font-bold text-slate-300 uppercase">LXC</div>
                                        </div>
                                        <div className="flex gap-1">
                                            {editingTransactionId !== tx.id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditTransactionAmount(tx.id, tx.amount); }}
                                                    className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                                    title="Editar Valor"
                                                >
                                                    <i className="fas fa-pen text-xs"></i>
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(tx.id); }}
                                                className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
                                                title="Excluir Item"
                                            >
                                                <i className="fas fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-4 w-0.5 bg-slate-200 mx-auto -mb-2 last:hidden"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {viewingTransactionId && (
                    <GenericModal
                        title="Detalhes da Transação"
                        onClose={() => setViewingTransactionId(null)}
                        onSave={() => setViewingTransactionId(null)}
                        saveLabel="Fechar"
                        saveVariant="secondary"
                    >
                        {(() => {
                            const tx = studentTransactions.find(t => t.id === viewingTransactionId);
                            if (!tx) return <p>Transação não encontrada.</p>;
                            return (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Data do Registro</span>
                                        <span className="text-slate-700 font-medium">{new Date(tx.date).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Tipo</span>
                                        <span className="text-slate-700 font-medium">{tx.type === 'BADGE' ? 'Medalha' : tx.type === 'TASK' ? 'Tarefa' : 'Penalidade'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Valor na Carteira</span>
                                        <span className={`font-black text-lg ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount} LXC
                                        </span>
                                    </div>
                                    {tx.teacherName && (
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Assinatura / Autor</span>
                                            <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-xs">
                                                <i className="fas fa-tag mr-1"></i> {tx.teacherName}
                                            </span>
                                        </div>
                                    )}
                                    <div className="space-y-2 border-b border-slate-100 pb-4">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Motivo Principal</span>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 font-medium">
                                            {tx.description}
                                        </div>
                                    </div>
                                    {tx.customDescription && (
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Anotações do Professor</span>
                                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm italic">
                                                "{tx.customDescription}"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </GenericModal>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-slate-50 overflow-hidden font-sans text-slate-800 flex-col md:flex-row">
            <div className="md:hidden h-16 bg-slate-900 flex items-center justify-between px-6 z-30 shadow-md flex-shrink-0">
                <div className="flex items-center gap-2">
                    <i className="fas fa-gamepad text-indigo-400"></i>
                    <span className="text-white font-bold gamified-font">Mestres da Linguagem</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="text-white text-xl p-2">
                    <i className="fas fa-bars"></i>
                </button>
            </div>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            <aside
                className={`
            fixed top-0 left-0 h-full w-64 bg-slate-900 text-white flex flex-col z-50 shadow-2xl 
            transform transition-transform duration-300 ease-in-out
            md:translate-x-0 md:static md:h-screen md:shadow-none
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
         `}
            >
                <div className="p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold gamified-font text-indigo-400"><i className="fas fa-gamepad mr-2"></i>Mestres da Linguagem</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Beta 0.9</p>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                    {[
                        { id: 'dashboard', icon: 'fa-chalkboard-teacher', label: 'Painel de Aulas' },
                        { id: 'schools', icon: 'fa-school', label: 'Escolas & Turmas' },
                        { id: 'catalog', icon: 'fa-list-alt', label: 'Missões & Medalhas' },
                        { id: 'settings', icon: 'fa-save', label: 'Dados & Backup' },
                        { id: 'profile', icon: 'fa-user-circle', label: 'Perfil do Professor' }
                    ].map(item => {
                        const isProtected = ['schools', 'profile'].includes(item.id);

                        const handleNavClick = () => {
                            if (window.innerWidth < 768) setIsMobileMenuOpen(false);
                            navigateWithPinCheck(item.id as any);
                        };

                        return (
                            <button key={item.id} onClick={handleNavClick} className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors font-medium text-sm ${view === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                                <div className="flex items-center gap-3">
                                    <i className={`fas ${item.icon} w-5 text-center`}></i> {item.label}
                                </div>
                                {isProtected && !isSchoolTabUnlocked && (
                                    <i className="fas fa-lock text-[10px] opacity-50" title="Protegido por PIN"></i>
                                )}
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
                    <button onClick={performLogout} className="w-full text-left px-4 py-2 rounded-xl flex items-center gap-3 transition-colors font-medium text-sm text-red-400 hover:bg-red-500/10">
                        <i className="fas fa-sign-out-alt w-5 text-center"></i> Sair do Sistema
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-2">Desenvolvido com Gemini AI</p>
                </div>
            </aside>

            <main className="flex-1 h-[calc(100vh-64px)] md:h-screen overflow-y-auto p-4 md:p-8 relative bg-slate-50">

                {/* GLOBAL TOP-RIGHT SAVE BUTTON REMOVED FROM HERE, MOVED TO SIDEBAR/HEADER */}

                {view === 'profile' && (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6">Perfil do Professor</h2>
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

                                    {auth.currentUser?.providerData.some(p => p.providerId === 'google.com') ? (
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
                )}

                {view === 'settings' && (
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
                )}

                {view === 'catalog' && (

                    <div className="max-w-5xl mx-auto animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
                            <div className="flex flex-col">
                                <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                                    Gerenciamento de missões e recompensas
                                    <button onClick={() => { setTutorialStep(1); setShowTutorial(true); }} className="text-indigo-400 hover:text-indigo-600 transition-colors" title="Como funciona?">
                                        <i className="fas fa-info-circle"></i>
                                    </button>
                                </h2>
                                <p className="text-xs text-slate-500">Crie missões, medalhas e penalidades que estarão disponíveis para todas as escolas.</p>
                            </div>
                            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                                <button onClick={() => setCatalogTab('tasks')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${catalogTab === 'tasks' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-600'}`}>Missões</button>
                                <button onClick={() => setCatalogTab('badges')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${catalogTab === 'badges' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-indigo-600'}`}>Medalhas</button>
                                <button onClick={() => setCatalogTab('penalties')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${catalogTab === 'penalties' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:text-red-600'}`}>Penalidades</button>
                            </div>
                        </div>

                        {catalogTab === 'tasks' && (
                            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-indigo-900"><i className="fas fa-tasks mr-2"></i> Missões Padrão</h3>
                                    <Button onClick={() => openModal('task', 'create')} className="text-xs">+ Nova Missão</Button>
                                </div>
                                <div className="space-y-3">
                                    {data.taskCatalog.length === 0 && <p className="text-center text-slate-400 py-4 italic">Nenhuma missão cadastrada.</p>}
                                    {data.taskCatalog.map(t => (
                                        <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                                            <div className="min-w-0 pr-2">
                                                <p className="font-bold text-slate-700 truncate">{t.title}</p>
                                                <p className="text-xs text-slate-500 mb-1">Vale {t.defaultPoints} LXC</p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {t.bimesters && t.bimesters.map(b => (
                                                        <span key={b} className="text-[9px] bg-slate-200 px-1.5 rounded text-slate-600 font-bold">{b}ºB</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <Button variant="icon" onClick={(e: any) => { e.stopPropagation(); openModal('task', 'edit', t); }} title="Editar"><i className="fas fa-pen"></i></Button>
                                                <Button variant="icon" onClick={(e: any) => requestDelete(e, 'task', t.id, undefined, t.title)} title="Excluir"><i className="fas fa-trash text-red-400"></i></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {catalogTab === 'badges' && (
                            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-amber-600"><i className="fas fa-medal mr-2"></i> Medalhas & Conquistas</h3>
                                    <Button onClick={() => openModal('badge', 'create')} variant="warning" className="text-xs">+ Nova Medalha</Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {data.badgesCatalog.length === 0 && <p className="col-span-3 text-center text-slate-400 py-4 italic">Nenhuma medalha cadastrada.</p>}
                                    {data.badgesCatalog.map(b => (
                                        <div key={b.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 relative hover:border-amber-300 transition-colors">
                                            {b.imageUrl ? (
                                                <img src={b.imageUrl} alt="Medalha" className="w-10 h-10 rounded-full object-cover border border-amber-200 shadow-sm flex-shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0 text-lg"><i className={`fas ${b.icon}`}></i></div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-xs text-amber-900 leading-tight truncate">{b.name}</p>
                                                {b.rewardValue && b.rewardValue > 0 ? (
                                                    <p className="text-[9px] text-emerald-600 font-bold">+ {b.rewardValue} LXC</p>
                                                ) : null}
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {b.bimesters && b.bimesters.map(bim => (
                                                        <span key={bim} className="text-[8px] bg-white border border-amber-200 px-1 rounded text-amber-600 font-bold">{bim}º</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 bg-amber-100/50 rounded-lg flex-shrink-0 p-1">
                                                <button onClick={(e) => { e.stopPropagation(); openModal('badge', 'edit', b); }} className="text-amber-600 hover:text-amber-800 p-1"><i className="fas fa-pen text-xs"></i></button>
                                                <button onClick={(e) => requestDelete(e, 'badge', b.id, undefined, b.name)} className="text-red-400 hover:text-red-600 p-1"><i className="fas fa-trash text-xs"></i></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {catalogTab === 'penalties' && (
                            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-red-600"><i className="fas fa-gavel mr-2"></i> Penalidades</h3>
                                    <Button onClick={() => openModal('penalty', 'create')} variant="danger" className="text-xs">+ Nova Penalidade</Button>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                                        <i className="fas fa-info-circle text-red-500 mt-0.5"></i>
                                        <div>
                                            <h4 className="font-bold text-red-800 text-sm">Área Restrita</h4>
                                            <p className="text-xs text-red-700 mt-1">Use penalidades com moderação. O objetivo da gamificação é o reforço positivo.</p>
                                        </div>
                                    </div>

                                    {data.penaltiesCatalog?.length === 0 && <p className="text-center text-slate-400 py-4 italic">Nenhuma penalidade cadastrada.</p>}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {data.penaltiesCatalog?.map(p => (
                                            <div key={p.id} className="p-4 bg-white rounded-xl border-l-4 border-l-red-500 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800">{p.title}</h4>
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                                                        <span className="inline-block mt-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                                                            {p.defaultPoints} LXC
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Button variant="danger" className="py-1 px-3 text-xs" onClick={() => {
                                                            setPenaltySchoolId(data.schools[0]?.id || '');
                                                            setApplyPenaltyConfig({ isOpen: true, penaltyId: p.id, amount: p.defaultPoints });
                                                        }}>Aplicar</Button>
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => openModal('penalty', 'edit', p)} className="text-slate-400 hover:text-indigo-600 text-xs"><i className="fas fa-pen"></i></button>
                                                            <button onClick={(e) => requestDelete(e, 'penalty', p.id, undefined, p.title)} className="text-slate-400 hover:text-red-600 text-xs"><i className="fas fa-trash"></i></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {
                    view === 'schools' && (
                        <div className="max-w-4xl mx-auto animate-fade-in">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
                                <h2 className="text-lg md:text-xl font-bold text-slate-800">Estrutura Escolar</h2>
                                <Button onClick={() => openModal('school', 'create')} className="w-full sm:w-auto">+ Nova Escola</Button>
                            </div>

                            <div className="space-y-6">
                                {data.schools.length === 0 && <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400">Nenhuma escola cadastrada. Comece criando uma!</div>}
                                {data.schools.map(school => (
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
                                            {school.classes?.map(cls => (
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
                                                        <button onClick={(e) => { e.stopPropagation(); openModal('class', 'edit', cls); }} className="p-1 text-slate-400 hover:text-indigo-500 w-7 h-7 flex items-center justify-center" title="Editar Turma"><i className="fas fa-pen text-xs"></i></button>
                                                        <button onClick={(e) => requestDelete(e, 'class', cls.id, school.id, cls.name)} className="p-1 text-slate-400 hover:text-red-500 w-7 h-7 flex items-center justify-center" title="Excluir Turma"><i className="fas fa-trash text-xs"></i></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {
                    view === 'dashboard' && (
                        <div className="flex flex-col h-full animate-fade-in">
                            <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex-1 w-full md:w-auto">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Escola</label>
                                    <select className="w-full bg-transparent font-bold text-slate-800 outline-none cursor-pointer py-1" value={selectedSchoolId} onChange={e => { setSelectedSchoolId(e.target.value); setSelectedClassId(''); }}>
                                        <option value="">Selecione...</option>
                                        {data.schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                                    </select>
                                </div>
                                <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                                <div className="flex-1 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Turma</label>
                                    <select className="w-full bg-transparent font-bold text-slate-800 outline-none cursor-pointer py-1" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {currentSchool?.classes?.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex bg-slate-100 rounded-lg p-1 w-full md:w-auto overflow-x-auto justify-between md:justify-start mt-2 md:mt-0">
                                    {[1, 2, 3, 4].map(b => (
                                        <button key={b} onClick={() => setCurrentBimester(b as Bimester)} className={`flex-1 md:flex-none px-3 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${currentBimester === b ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>{b}º Bim</button>
                                    ))}
                                </div>

                                <button
                                    onClick={async () => {
                                        setIsSyncing(true);
                                        setSyncMessage('Salvando na nuvem...');
                                        try {
                                            const uid = auth.currentUser?.uid;
                                            if (uid) {
                                                await firestoreSyncAll(uid, data, profile);
                                                setSyncMessage('Salvo com sucesso!');
                                            } else {
                                                setSyncMessage('Erro: Não autenticado.');
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            setSyncMessage('Erro ao salvar.');
                                        }
                                        setTimeout(() => {
                                            setIsSyncing(false);
                                            setSyncMessage('');
                                        }, 3000);
                                    }}
                                    className="hidden md:flex ml-auto w-10 h-10 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl items-center justify-center transition-all shadow-sm"
                                    title="Salvar na Nuvem"
                                >
                                    {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                                </button>
                                {syncMessage && <span className="hidden md:block text-xs font-bold text-indigo-500 animate-fade-in">{syncMessage}</span>}
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
                                                        placeholder="Buscar Aluno..."
                                                        value={studentSearch}
                                                        onChange={(e) => setStudentSearch(e.target.value)}
                                                        className="w-full md:w-48 pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-white"
                                                    />
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
                                                        className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border-2 transition-all group ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : (student.marked ? 'bg-white hover:bg-slate-50' : 'bg-white border-transparent hover:bg-slate-50')}`}
                                                        style={(!isSelected && student.marked && student.markedColor) ? { borderColor: student.markedColor } : {}}
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
                                                                            setIndividualScores(prev => ({ ...prev, [student.id]: val }));
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

                                        {!isGivingBadge && !selectedTaskId && (
                                            <div className="animate-fade-in space-y-4">
                                                <Input
                                                    placeholder="Título / Motivo (ex: Ajudou colega)"
                                                    value={manualDesc}
                                                    onFocus={(e: any) => {
                                                        if (!manualDesc) {
                                                            setManualDesc(`Missão diária de ${profile?.subject || 'Linguagens'}`);
                                                        }
                                                        setTimeout(() => e.target.select(), 10);
                                                    }}
                                                    onChange={(e: any) => setManualDesc(e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Descrição (opcional)"
                                                    value={customMissionDesc}
                                                    onChange={(e: any) => setCustomMissionDesc(e.target.value)}
                                                />
                                                <div className="flex items-center gap-2 justify-center mt-2">
                                                    <button onClick={() => setManualPoints(p => Math.max(-10, p - 5))} className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-lg font-bold hover:bg-slate-200 touch-manipulation text-slate-600">-</button>
                                                    <input type="number" className="w-16 md:w-20 text-center font-bold text-lg md:text-xl py-1 border-b-2 border-indigo-100 outline-none bg-transparent" value={manualPoints} onChange={e => {
                                                        let val = parseInt(e.target.value) || 0;
                                                        if (val < -10) val = -10;
                                                        if (val > 250) val = 250;
                                                        setManualPoints(val);
                                                    }} />
                                                    <button onClick={() => setManualPoints(p => Math.min(250, p + 5))} className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-lg font-bold hover:bg-slate-200 touch-manipulation text-slate-600">+</button>
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
                    )
                }
            </main >

            {modalConfig.isOpen && modalConfig.type === 'mission-selector' && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-end md:items-center justify-center z-50 backdrop-blur-sm p-0 md:p-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-md shadow-2xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 className="text-xl font-bold text-slate-800">{isGivingBadge ? 'Selecionar Medalha' : 'Selecionar Atividade'}</h3>
                            <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times text-lg"></i></button>
                        </div>

                        {/* Tabs removidas a pedido do usuário, apenas missões */}

                        <div className="mb-4 flex-shrink-0">
                            <div className="relative">
                                <i className="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-indigo-500 font-bold text-slate-600"
                                    placeholder="Buscar..."
                                    autoFocus
                                    onChange={(e) => setMissionSearch(e.target.value)}
                                    value={missionSearch}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            <button
                                onClick={() => {
                                    setSelectedTaskId('');
                                    setManualDesc('');
                                    setCustomMissionDesc('');
                                    setManualPoints(missionModalTab === 'penalties' ? -5 : 0);
                                    closeModal();
                                    openModal(isGivingBadge ? 'badge' : 'task', 'create');
                                }}
                                className={`w-full p-3 rounded-xl border-2 border-dashed font-bold transition-all flex items-center gap-3 ${missionModalTab === 'penalties' ? 'border-red-200 text-red-400 hover:border-red-500 hover:text-red-600' : 'border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-600'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${missionModalTab === 'penalties' ? 'bg-red-50' : 'bg-slate-100'}`}>
                                    <i className="fas fa-edit text-xs"></i>
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-sm">Personalizado</h4>
                                    <p className="text-[10px] opacity-70">Criar {missionModalTab === 'penalties' ? 'penalidade' : 'pontuação'} manual</p>
                                </div>
                            </button>

                            {!isGivingBadge ? (
                                data.taskCatalog
                                    .filter(t => t.bimesters.includes(currentBimester) && t.title.toLowerCase().includes(missionSearch.toLowerCase()))
                                    .map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => {
                                                setSelectedTaskId(task.id);
                                                setManualDesc(task.title);
                                                setCustomMissionDesc(task.description);
                                                setManualPoints(task.defaultPoints);
                                                closeModal();
                                                setMissionSearch('');
                                            }}
                                            className="w-full p-3 rounded-xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-between group text-left"
                                        >
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-700 group-hover:text-indigo-700">{task.title}</h4>
                                                <p className="text-[10px] text-slate-400 line-clamp-1">{task.description}</p>
                                            </div>
                                            <div className="font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded text-[10px]">{task.defaultPoints} pts</div>
                                        </button>
                                    ))
                            ) : (
                                data.badgesCatalog.filter(b => b.bimesters.includes(currentBimester) && b.name.toLowerCase().includes(missionSearch.toLowerCase())).map(badge => (
                                    <button
                                        key={badge.id}
                                        onClick={() => {
                                            setSelectedTaskId(badge.id);
                                            setCustomMissionDesc(badge.description);
                                            closeModal();
                                            setMissionSearch('');
                                        }}
                                        className="w-full p-3 rounded-xl border border-slate-100 hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center gap-3 group text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center text-sm">
                                            <i className={`fas ${badge.icon}`}></i>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-700 group-hover:text-amber-700">{badge.name}</h4>
                                            <p className="text-[10px] text-slate-400 line-clamp-1">{badge.description}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div >
            )
            }

            {
                modalConfig.isOpen && modalConfig.type !== 'mission-selector' && (
                    <GenericModal
                        title={
                            modalConfig.mode === 'create'
                                ? `Nova ${modalConfig.type === 'school' ? 'Escola' : modalConfig.type === 'class' ? 'Turma' : modalConfig.type === 'task' ? 'Missão' : modalConfig.type === 'badge' ? 'Medalha' : 'Penalidade'}`
                                : `Editar ${modalConfig.type === 'school' ? 'Escola' : modalConfig.type === 'class' ? 'Turma' : modalConfig.type === 'task' ? 'Missão' : modalConfig.type === 'badge' ? 'Medalha' : 'Penalidade'}`
                        }
                        onClose={closeModal}
                        onSave={handleModalSave}
                    >
                        <Input
                            label="Nome / Título"
                            value={formData.name}
                            onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                            autoFocus
                        />

                        {modalConfig.type === 'school' && (
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-4 items-start">
                                    <div className="w-full md:flex-1">
                                        <Input
                                            label="URL do Ícone / Logo da Escola"
                                            placeholder="https://exemplo.com/logo.png"
                                            value={formData.schoolIconUrl || ''}
                                            onChange={(e: any) => setFormData({ ...formData, schoolIconUrl: e.target.value })}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            <i className="fas fa-info-circle mr-1"></i>
                                            Dica: Você pode usar links do Imgur, PostImages ou o URL de uma imagem já existente na internet.
                                        </p>
                                    </div>
                                    <div className="w-20 h-20 bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {formData.schoolIconUrl ? (
                                            <img src={formData.schoolIconUrl} alt="Preview" className="w-full h-full object-cover" onError={(e: any) => e.target.src = 'https://via.placeholder.com/80?text=Erro'} />
                                        ) : (
                                            <i className="fas fa-school text-slate-300 text-2xl"></i>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Definição dos Bimestres</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(b => (
                                            <div key={b} className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                                                <span className="font-bold text-slate-700 text-sm block mb-2">{b}º Bimestre</span>
                                                <div className="flex flex-col gap-2">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Início</span>
                                                        <input
                                                            type="date"
                                                            className="w-full text-xs p-2 border border-slate-200 rounded outline-none focus:border-indigo-400"
                                                            value={formData.bimesterDates?.[b as Bimester]?.start || ''}
                                                            onChange={e => {
                                                                const currentDates = { ...formData.bimesterDates } as any;
                                                                if (!currentDates[b]) currentDates[b] = { start: '', end: '' };
                                                                currentDates[b].start = e.target.value;
                                                                setFormData({ ...formData, bimesterDates: currentDates });
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Fim</span>
                                                        <input
                                                            type="date"
                                                            className="w-full text-xs p-2 border border-slate-200 rounded outline-none focus:border-indigo-400"
                                                            value={formData.bimesterDates?.[b as Bimester]?.end || ''}
                                                            onChange={e => {
                                                                const currentDates = { ...formData.bimesterDates } as any;
                                                                if (!currentDates[b]) currentDates[b] = { start: '', end: '' };
                                                                currentDates[b].end = e.target.value;
                                                                setFormData({ ...formData, bimesterDates: currentDates });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-3 italic text-center">As datas ajudarão no controle automático de bimestres. Formato: Dia/Mês/Ano.</p>
                                </div>
                            </div>
                        )}

                        {(modalConfig.type === 'task' || modalConfig.type === 'badge' || modalConfig.type === 'penalty') && (
                            <Input
                                label="Descrição"
                                value={formData.description}
                                onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                            />
                        )}

                        {modalConfig.type === 'task' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pontos (LXC) [5 a 250]</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="250"
                                    value={formData.points}
                                    onChange={(e: any) => setFormData({ ...formData, points: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                />
                            </div>
                        )}

                        {modalConfig.type === 'penalty' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pontos Perdidos (LXC) [-30 a -1]</label>
                                <input
                                    type="number"
                                    min="-30"
                                    max="-1"
                                    value={formData.points}
                                    onChange={(e: any) => setFormData({ ...formData, points: e.target.value })}
                                    className="w-full bg-red-50 border border-red-300 rounded-xl p-3 outline-none focus:border-red-500 text-red-700 font-bold"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Insira o valor negativo. Ex: -10</p>
                            </div>
                        )}

                        {modalConfig.type === 'badge' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Recompensa Extra (Opcional)</label>
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.rewardValue}
                                        onChange={(e: any) => setFormData({ ...formData, rewardValue: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                        placeholder="0"
                                    />
                                    <span className="font-bold text-slate-500 text-sm">LXC</span>
                                </div>

                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Visual da Medalha</label>

                                <div className="flex justify-center mb-4">
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} className="w-16 h-16 rounded-full object-cover border-4 border-indigo-100 shadow-lg" alt="Preview" />
                                    ) : (
                                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-3xl text-indigo-500 shadow-lg border-4 border-indigo-100">
                                            <i className={`fas ${formData.icon}`}></i>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Opção 1: Selecione um Ícone</p>
                                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                                        {ICON_LIBRARY.map(ic => (
                                            <button
                                                key={ic}
                                                onClick={() => setFormData({ ...formData, icon: ic, imageUrl: '' })}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${formData.icon === ic && !formData.imageUrl ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 hover:text-indigo-500 border border-slate-200'}`}
                                            >
                                                <i className={`fas ${ic}`}></i>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Input
                                    label="Opção 2: URL de Imagem (Substitui Ícone)"
                                    placeholder="https://..."
                                    value={formData.imageUrl}
                                    onChange={(e: any) => setFormData({ ...formData, imageUrl: e.target.value })}
                                />

                                {/* Auto Unlock Criteria UI */}
                                <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-2">
                                            <i className="fas fa-robot text-indigo-500"></i> Desbloqueio Automático
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, autoUnlockEnabled: !formData.autoUnlockEnabled })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${formData.autoUnlockEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${formData.autoUnlockEnabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
                                        </button>
                                    </div>

                                    <p className="text-[10px] text-slate-500 mb-4 leading-tight">
                                        Se ativado, o sistema entregará esta medalha automaticamente quando o aluno atingir a meta no bimestre selecionado.
                                    </p>

                                    {formData.autoUnlockEnabled && (
                                        <div className="flex gap-3 animate-fade-in">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Meta</label>
                                                <select
                                                    value={formData.autoUnlockType}
                                                    onChange={(e: any) => setFormData({ ...formData, autoUnlockType: e.target.value })}
                                                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 text-slate-700 font-medium"
                                                >
                                                    <option value="LXC">LXC Acumulado</option>
                                                    <option value="TASKS">Total de Tarefas</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Alvo</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.autoUnlockThreshold || ''}
                                                    onChange={(e: any) => setFormData({ ...formData, autoUnlockThreshold: e.target.value })}
                                                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 text-slate-700 font-medium"
                                                    placeholder="Ex: 50"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {(modalConfig.type === 'task' || modalConfig.type === 'badge' || modalConfig.type === 'penalty') && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Disponibilidade (Sazonalidade)</label>
                                <div className="flex gap-2 flex-wrap">
                                    {[1, 2, 3, 4].map(b => (
                                        <button
                                            key={b}
                                            onClick={() => {
                                                const current = formData.bimesters;
                                                if (current.includes(b as Bimester)) {
                                                    setFormData({ ...formData, bimesters: current.filter(x => x !== b) });
                                                } else {
                                                    setFormData({ ...formData, bimesters: [...current, b as Bimester].sort() });
                                                }
                                            }}
                                            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border-2 flex items-center justify-center ${formData.bimesters.includes(b as Bimester) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}
                                        >
                                            {b}º
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Selecione em quais bimestres este item aparecerá na lista.
                                </p>
                            </div>
                        )}
                    </GenericModal>
                )
            }

            {/* --- TUTORIAL MODAL --- */}
            {showTutorial && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-up border-4 border-indigo-100 flex flex-col">
                        <div className="bg-indigo-600 p-6 text-white text-center relative">
                            <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors"><i className="fas fa-times"></i></button>
                            <i className="fas fa-graduation-cap text-4xl mb-3 text-indigo-300"></i>
                            <h2 className="text-xl font-black gamified-font">Guia de Catálogo</h2>
                            <p className="text-xs opacity-80 mt-1">Passo {tutorialStep} de 3</p>
                        </div>

                        <div className="p-6 text-slate-600 text-sm space-y-4 flex-1">
                            {tutorialStep === 1 && (
                                <div className="animate-fade-in text-center">
                                    <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"><i className="fas fa-tasks"></i></div>
                                    <h3 className="font-bold text-lg text-slate-800 mb-2">1. Missões (LXC)</h3>
                                    <p>São as tarefas do dia a dia. Ao completá-las, o aluno ganha <strong>LXC</strong> (experiência). Defina pontos baseados no esforço.</p>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-4 text-left">
                                        <p className="font-bold text-xs text-slate-700">Exemplo Padrão:</p>
                                        <p className="text-indigo-600 font-bold"><i className="fas fa-check-circle"></i> "Side Quest 01" (+50 LXC)</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Tarefa opcional para incentivar pesquisa em casa.</p>
                                    </div>
                                </div>
                            )}

                            {tutorialStep === 2 && (
                                <div className="animate-fade-in text-center">
                                    <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"><i className="fas fa-medal"></i></div>
                                    <h3 className="font-bold text-lg text-slate-800 mb-2">2. Medalhas & Conquistas</h3>
                                    <p>As medalhas são conquistas especiais que os alunos colecionam no perfil. Podem (ou não) dar bônus extra de LXC.</p>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-4 text-left">
                                        <p className="font-bold text-xs text-slate-700">Exemplo Padrão:</p>
                                        <p className="text-amber-500 font-bold"><i className="fas fa-hands-helping"></i> "Ajudante da Vez"</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Concedida a quem ajudou o professor a organizar a sala.</p>
                                    </div>
                                </div>
                            )}

                            {tutorialStep === 3 && (
                                <div className="animate-fade-in text-center">
                                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"><i className="fas fa-gavel"></i></div>
                                    <h3 className="font-bold text-lg text-slate-800 mb-2">3. Penalidades</h3>
                                    <p>Usadas para corrigir comportamentos inadequados. Elas <strong>subtraem LXC</strong> do saldo do aluno no bimestre atual.</p>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-4 text-left">
                                        <p className="font-bold text-xs text-slate-700">Exemplo Padrão:</p>
                                        <p className="text-red-500 font-bold"><i className="fas fa-exclamation-triangle"></i> "Desrespeito" (-30 LXC)</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Falta grave contra colegas ou o educador.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setShowTutorial(false)}
                                className="text-xs font-bold px-4"
                            >
                                Pular
                            </Button>

                            {tutorialStep < 3 ? (
                                <Button onClick={() => setTutorialStep(prev => prev + 1)} className="flex-1 text-xs">
                                    Próximo <i className="fas fa-arrow-right ml-1"></i>
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        setShowTutorial(false);
                                        // Auto-populate se tiver vazio
                                        if (data.taskCatalog.length === 0 && data.badgesCatalog.length === 0 && data.penaltiesCatalog.length === 0) {
                                            const newData = JSON.parse(JSON.stringify(data));
                                            const uid = auth.currentUser?.uid;

                                            const t1: TaskDefinition = { id: uuidv4(), title: 'Side Quest 01', description: 'Tarefa opcional para incentivar pesquisa em casa', defaultPoints: 50, bimesters: [currentBimester] };
                                            const b1: Badge = { id: uuidv4(), name: 'Ajudante da Vez', description: 'Concedida a quem ajudou o professor a organizar a sala', icon: 'fa-hands-helping', rewardValue: 0, bimesters: [1, 2, 3, 4] };
                                            const p1: PenaltyDefinition = { id: uuidv4(), title: 'Desrespeito', description: 'Falta grave contra colegas ou o educador', defaultPoints: -30, bimesters: [1, 2, 3, 4] };

                                            newData.taskCatalog.push(t1);
                                            newData.badgesCatalog.push(b1);
                                            newData.penaltiesCatalog.push(p1);

                                            setData(newData);
                                            saveData(newData);

                                            if (uid) {
                                                firestoreAddCatalogItem(uid, 'task', t1);
                                                firestoreAddCatalogItem(uid, 'badge', b1);
                                                firestoreAddCatalogItem(uid, 'penalty', p1);
                                            }
                                        }
                                    }}
                                    className="flex-1 text-xs bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                                >
                                    <i className="fas fa-check mr-1"></i> Entendi
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}



            {
                studentSettingsConfig.isOpen && (
                    <GenericModal
                        title="Configurações do Aluno"
                        onClose={revertStudentSettings}
                        onSave={() => {
                            handleStudentSettingsSave({
                                name: studentSettingsConfig.initialName,
                                registrationId: studentSettingsConfig.initialRegId
                            });
                            setStudentSettingsConfig({ ...studentSettingsConfig, isOpen: false });
                        }}
                        saveLabel="Ok"
                    >
                        <div className="flex gap-2 mb-4 border-b border-slate-100">
                            <button
                                onClick={() => setStudentSettingsConfig({ ...studentSettingsConfig, tab: 'edit' })}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${studentSettingsConfig.tab === 'edit' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => setStudentSettingsConfig({ ...studentSettingsConfig, tab: 'mark' })}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${studentSettingsConfig.tab === 'mark' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Marcar
                            </button>
                            <button
                                onClick={() => setStudentSettingsConfig({ ...studentSettingsConfig, tab: 'exclude' })}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${studentSettingsConfig.tab === 'exclude' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-400 hover:text-red-500'}`}
                            >
                                Excluir
                            </button>
                            <button
                                onClick={() => setStudentSettingsConfig({ ...studentSettingsConfig, tab: 'transfer' })}
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${studentSettingsConfig.tab === 'transfer' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-amber-500'}`}
                            >
                                Remanejar
                            </button>
                        </div>

                        {studentSettingsConfig.tab === 'edit' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Aluno</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                                            value={studentSettingsConfig.initialName || ''}
                                            onChange={(e) => setStudentSettingsConfig({ ...studentSettingsConfig, initialName: e.target.value })}
                                        />
                                        <button
                                            onClick={() => {
                                                const formatted = (studentSettingsConfig.initialName || '').toLowerCase()
                                                    .replace(/(?:^|\s)\S/g, a => a.toUpperCase())
                                                    .replace(/\b(De|Da|Do|Das|Dos|E)\b/gi, match => match.toLowerCase());
                                                setStudentSettingsConfig({ ...studentSettingsConfig, initialName: formatted });
                                            }}
                                            className="px-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 font-bold"
                                            title="Formatar Maiúsculas/Minúsculas"
                                        >
                                            Aa
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Matrícula</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                                        value={studentSettingsConfig.initialRegId || ''}
                                        onChange={(e) => setStudentSettingsConfig({ ...studentSettingsConfig, initialRegId: e.target.value })}
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>
                        )}

                        {studentSettingsConfig.tab === 'transfer' && (
                            <div className="space-y-4">
                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl mb-4 text-sm text-amber-800">
                                    <i className="fas fa-info-circle mr-2"></i> O aluno será movido para outra turma da mesma escola. Missões pendentes podem ser desativadas se não pertencerem à nova escola/turma.
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Escola de Destino</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                            value={transferConfig.targetSchoolId}
                                            onChange={e => setTransferConfig({ targetSchoolId: e.target.value, targetClassId: '' })}
                                        >
                                            <option value="">Selecione...</option>
                                            {data.schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turma de Destino</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 disabled:opacity-50"
                                            value={transferConfig.targetClassId}
                                            onChange={e => setTransferConfig({ ...transferConfig, targetClassId: e.target.value })}
                                            disabled={!transferConfig.targetSchoolId}
                                        >
                                            <option value="">Selecione...</option>
                                            {data.schools.find(s => s.id === transferConfig.targetSchoolId)?.classes?.filter(c => c.id !== selectedClassId)?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <Button
                                    className="w-full mt-4"
                                    variant="warning"
                                    disabled={!transferConfig.targetClassId}
                                    onClick={() => handleTransferStudent(studentSettingsConfig.studentId!)}
                                >
                                    Confirmar Transferência
                                </Button>
                            </div>
                        )}

                        {studentSettingsConfig.tab === 'mark' && (() => {
                            // Find student current data for controlled inputs in "mark" tab
                            // Since we are editing directly in the change handler for simplicity in this constrained environment
                            const student = getAllStudents(data.schools).find(s => s.id === studentSettingsConfig.studentId);
                            if (!student) return null;

                            return (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                            checked={student.marked || false}
                                            onChange={(e) => handleStudentSettingsSave({ marked: e.target.checked })}
                                        />
                                        <label className="text-sm font-bold text-slate-700">Marcar este aluno</label>
                                    </div>

                                    <div className={`space-y-4 transition-all ${!student.marked ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cor da Marcação</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b'].map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => handleStudentSettingsSave({ markedColor: color })}
                                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${student.markedColor === color ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent'}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Texto (Max 15)</label>
                                            <input
                                                type="text"
                                                maxLength={15}
                                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                                                value={student.markedLabel || ''}
                                                onChange={(e) => handleStudentSettingsSave({ markedLabel: e.target.value })}
                                                placeholder="Ex: Monitor"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {studentSettingsConfig.tab === 'exclude' && (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-2xl">
                                    <i className="fas fa-user-times"></i>
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 mb-2">Excluir Aluno?</h4>
                                <p className="text-sm text-slate-500 mb-6">
                                    Deseja realmente excluir este aluno? Esta ação abrirá a confirmação final.
                                </p>
                                <Button
                                    className="w-full"
                                    variant="danger"
                                    onClick={(e: any) => {
                                        setStudentSettingsConfig({ ...studentSettingsConfig, isOpen: false });
                                        setPendingDeleteStudentId(studentSettingsConfig.studentId);
                                    }}
                                >
                                    Confirmar Intenção de Exclusão
                                </Button>
                            </div>
                        )}
                    </GenericModal>
                )
            }

            < ConfirmationModal
                isOpen={deleteConfig.isOpen}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir "${deleteConfig.itemName || 'este item'}"? Esta ação é irreversível.`}
                onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
                onConfirm={executeDelete}
            />

            {showBatchImport && <BatchStudentModal onClose={() => setShowBatchImport(false)} onSave={batchImportStudents} />}

            {
                applyPenaltyConfig.isOpen && (
                    <GenericModal
                        title="Aplicar Penalidade"
                        onClose={() => setApplyPenaltyConfig({ isOpen: false, penaltyId: null, amount: 0 })}
                        onSave={applyPenalty}
                        saveLabel="Aplicar Penalidade"
                        saveVariant="danger"
                    >
                        <div className="space-y-4">
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-red-800">{data.penaltiesCatalog.find(p => p.id === applyPenaltyConfig.penaltyId)?.title}</h4>
                                    <p className="text-sm text-red-600 mt-1">{data.penaltiesCatalog.find(p => p.id === applyPenaltyConfig.penaltyId)?.description}</p>
                                </div>
                                <div className="flex flex-col items-center ml-4">
                                    <label className="text-[10px] font-bold text-red-700 uppercase mb-1">Impacto (LXC)</label>
                                    <input
                                        type="number"
                                        className="w-20 text-center font-bold text-lg py-1 border-b-2 border-red-300 outline-none bg-transparent text-red-600"
                                        value={applyPenaltyConfig.amount}
                                        onChange={e => {
                                            let val = parseInt(e.target.value) || 0;
                                            if (val < -30) val = -30;
                                            if (val > -1) val = -1;
                                            setApplyPenaltyConfig(prev => ({ ...prev, amount: val }));
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Escola</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none"
                                        value={penaltySchoolId}
                                        onChange={e => { setPenaltySchoolId(e.target.value); setPenaltyClassId(''); }}
                                    >
                                        <option value="">Selecione...</option>
                                        {data.schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turma</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none"
                                        value={penaltyClassId}
                                        onChange={e => setPenaltyClassId(e.target.value)}
                                        disabled={!penaltySchoolId}
                                    >
                                        <option value="">Selecione...</option>
                                        {data.schools.find(s => s.id === penaltySchoolId)?.classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Selecionar Alunos</label>
                                <div className="max-h-60 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2">
                                    {!penaltyClassId ? (
                                        <p className="text-center text-slate-400 text-xs py-4">Selecione uma turma para ver os alunos.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {data.schools.find(s => s.id === penaltySchoolId)?.classes?.find(c => c.id === penaltyClassId)?.students?.map(std => (
                                                <div key={std.id}
                                                    className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${penaltyStudents.includes(std.id) ? 'bg-red-100 border border-red-200' : 'hover:bg-slate-100'}`}
                                                    onClick={() => setPenaltyStudents(prev => prev.includes(std.id) ? prev.filter(id => id !== std.id) : [...prev, std.id])}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${penaltyStudents.includes(std.id) ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'}`}>
                                                        {penaltyStudents.includes(std.id) && <i className="fas fa-check text-white text-[10px]"></i>}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">{std.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-right mt-1 text-slate-400">{penaltyStudents.length} alunos selecionados</p>
                            </div>
                        </div>
                    </GenericModal>
                )
            }

            {pinModalConfig.isOpen && (
                <GenericModal
                    title="Acesso Protegido"
                    onClose={() => {
                        setPinModalConfig({ isOpen: false, targetView: null });
                        setPinInput('');
                        setPinError('');
                    }}
                    showFooter={false}
                >
                    <div className="text-center py-4">
                        <div className={`w-16 h-16 ${lockoutTime > 0 ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500'} rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse`}>
                            <i className={`fas ${lockoutTime > 0 ? 'fa-hourglass-half' : 'fa-lock'}`}></i>
                        </div>
                        <h4 className="font-bold text-slate-700 mb-2">Digite o PIN do Professor</h4>
                        <p className="text-xs text-slate-500 mb-6 px-4">Esta área contém configurações sensíveis e requer autorização.</p>

                        <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                            <div className="relative w-full">
                                <input
                                    type="password"
                                    className={`w-full text-center tracking-[1em] font-bold text-3xl py-4 border-2 rounded-2xl outline-none transition-all ${lockoutTime > 0 ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-50' : 'bg-white border-slate-200 focus:border-indigo-500'}`}
                                    maxLength={4}
                                    value={pinInput}
                                    onChange={e => {
                                        if (lockoutTime > 0) return;
                                        const val = e.target.value.replace(/\D/g, '');
                                        setPinInput(val);
                                        setPinError('');
                                    }}
                                    disabled={lockoutTime > 0}
                                    autoFocus
                                    placeholder="••••"
                                />
                                {lockoutTime > 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[1px] rounded-2xl">
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black animate-bounce shadow-lg">
                                            Aguarde {lockoutTime}s
                                        </span>
                                    </div>
                                )}
                            </div>

                            {pinError && (
                                <p className={`text-xs font-bold p-2 rounded-lg w-full ${lockoutTime > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                                    <i className="fas fa-info-circle mr-1"></i>
                                    {pinError}
                                </p>
                            )}

                            {(!profile.pin || profile.pin === '0000') && lockoutTime === 0 && (
                                <p className="text-[10px] text-slate-400 mt-2 italic px-2">
                                    <i className="fas fa-lightbulb text-amber-400 mr-1"></i>
                                    Dica: O PIN padrão é 0000. Altere no perfil.
                                </p>
                            )}
                        </div>
                    </div>
                </GenericModal>
            )
            }

        </div >
    );
}
