
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bimester, Student, School, ClassGroup, Transaction, TaskDefinition, Badge, LevelRule, TeacherProfileData } from './types';
import { getLevel, getNextLevel } from './utils/gamificationRules';
import { loadData, saveData, AppData, addTransaction, getAllStudents, exportDataToJSON, importDataFromJSON, removeTransaction, updateTransactionAmount, loadProfile, saveProfile } from './services/localStorageService';
import { TURMAS_2026 } from './services/turmas2026';

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

const GenericModal = ({ title, onClose, onSave, children, saveLabel = "Salvar", saveVariant = "primary" }: any) => (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end md:items-center justify-center z-50 backdrop-blur-sm p-0 md:p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-md shadow-2xl transform transition-all scale-100 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times text-lg"></i></button>
            </div>
            <div className="mb-6 space-y-4 overflow-y-auto custom-scrollbar">
                {children}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                <Button variant="secondary" onClick={onClose} className="flex-1 md:flex-none">Cancelar</Button>
                <Button onClick={onSave} variant={saveVariant} className="flex-1 md:flex-none">{saveLabel}</Button>
            </div>
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
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const success = await onLogin(email, pass);
            if (!success) {
                setError('Credenciais inválidas.');
            }
        } catch (err) {
            setError('Erro ao processar login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500"></div>

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl text-indigo-400 shadow-lg mb-4">
                        <i className="fas fa-gamepad"></i>
                    </div>
                    <h1 className="text-2xl font-black gamified-font text-slate-800 text-center">Mestres da Linguagem</h1>
                    <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Área Restrita</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="usuario@email.com"
                            disabled={loading}
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
                        />
                    </div>

                    {error && <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-2 rounded-lg animate-fade-in">{error}</p>}

                    <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                        {loading ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-sign-in-alt"></i> Entrar</>}
                    </button>
                </form>

                <p className="text-[10px] text-center text-slate-400 mt-6">
                    &copy; 2026 Projeto Mestres da Linguagem
                </p>
            </div>
        </div>
    );
};

// --- APP PRINCIPAL ---

export default function App() {
    const [data, setData] = useState<AppData>({ schools: [], transactions: [], taskCatalog: [], badgesCatalog: [] });
    const [profile, setProfile] = useState<TeacherProfileData>(loadProfile());
    const [view, setView] = useState<'dashboard' | 'schools' | 'catalog' | 'settings' | 'student-view' | 'profile'>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Contexto de Seleção
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [viewingStudentId, setViewingStudentId] = useState<string>('');
    const [currentBimester, setCurrentBimester] = useState<Bimester>(1);

    // Estados de Gerenciamento
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'school' | 'class' | 'task' | 'badge' | null;
        mode: 'create' | 'edit';
        editingId?: string;
        initialData?: any;
    }>({ isOpen: false, type: null, mode: 'create' });

    const [deleteConfig, setDeleteConfig] = useState<{
        isOpen: boolean;
        type: 'school' | 'class' | 'task' | 'badge' | 'student' | null;
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
        bimesters: [1, 2, 3, 4] as Bimester[]
    });

    const [showBatchImport, setShowBatchImport] = useState(false);
    const [selectedStudentsForTask, setSelectedStudentsForTask] = useState<string[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [manualDesc, setManualDesc] = useState('');
    const [manualPoints, setManualPoints] = useState(10);
    const [isGivingBadge, setIsGivingBadge] = useState(false);

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
        }
    };

    const handleEditTransactionAmount = (transactionId: string, currentAmount: number) => {
        const newValStr = prompt("Novo valor (LXC):", currentAmount.toString());
        if (newValStr !== null) {
            const newVal = Number(newValStr);
            if (!isNaN(newVal)) {
                const newData = updateTransactionAmount(data, transactionId, newVal);
                setData(newData);
                saveData(newData);
            } else {
                alert("Valor inválido.");
            }
        }
    };

    // --- HELPER: CARGA RÁPIDA 2026 ---
    const load2026Backup = () => {
        if (window.confirm("ATENÇÃO: Isso substituirá todos os dados atuais pelas Turmas de 2026. Deseja continuar?")) {
            const rawData = TURMAS_2026;
            // Salva diretamente
            saveData(rawData);
            alert("Backup carregado! Recarregando sistema...");
            setTimeout(() => {
                window.location.reload();
            }, 200);
        }
    };

    // --- CRUD HANDLERS ---

    const openModal = (type: 'school' | 'class' | 'task' | 'badge', mode: 'create' | 'edit', dataItem?: any) => {
        setFormData({
            name: dataItem?.name || dataItem?.title || '',
            description: dataItem?.description || '',
            points: dataItem?.defaultPoints || 10,
            icon: dataItem?.icon || 'fa-medal',
            imageUrl: dataItem?.imageUrl || '',
            rewardValue: dataItem?.rewardValue || 0,
            bimesters: dataItem?.bimesters || [1, 2, 3, 4]
        });
        setModalConfig({ isOpen: true, type, mode, editingId: dataItem?.id, initialData: dataItem });
    };

    const closeModal = () => {
        setModalConfig({ ...modalConfig, isOpen: false });
        setFormData({ name: '', description: '', points: 10, icon: 'fa-medal', imageUrl: '', rewardValue: 0, bimesters: [1, 2, 3, 4] });
    };

    const handleModalSave = () => {
        const { type, mode, editingId } = modalConfig;
        const { name, description, points, icon, bimesters, imageUrl, rewardValue } = formData;

        if (!name.trim()) return alert("O nome é obrigatório.");
        if ((type === 'task' || type === 'badge') && bimesters.length === 0) return alert("Selecione pelo menos um bimestre.");

        const newData = JSON.parse(JSON.stringify(data));

        if (type === 'school') {
            if (mode === 'create') {
                const newSchool: School = { id: uuidv4(), name, classes: [] };
                newData.schools.push(newSchool);
                setSelectedSchoolId(newSchool.id);
            } else {
                const school = newData.schools.find((s: School) => s.id === editingId);
                if (school) school.name = name;
            }
        }
        else if (type === 'class') {
            const targetSchoolId = mode === 'create' ? selectedSchoolId : modalConfig.initialData.schoolId;
            const school = newData.schools.find((s: School) => s.id === targetSchoolId);
            if (school) {
                if (mode === 'create') {
                    const newClass: ClassGroup = { id: uuidv4(), name, schoolId: targetSchoolId, students: [] };
                    if (!school.classes) school.classes = [];
                    school.classes.push(newClass);
                    setSelectedClassId(newClass.id);
                } else {
                    const cls = school.classes.find((c: ClassGroup) => c.id === editingId);
                    if (cls) cls.name = name;
                }
            }
        }
        else if (type === 'task') {
            if (mode === 'create') {
                newData.taskCatalog.push({ id: uuidv4(), title: name, description, defaultPoints: Number(points), bimesters: bimesters });
            } else {
                const task = newData.taskCatalog.find((t: TaskDefinition) => t.id === editingId);
                if (task) { task.title = name; task.description = description; task.defaultPoints = Number(points); task.bimesters = bimesters; }
            }
        }
        else if (type === 'badge') {
            if (mode === 'create') {
                newData.badgesCatalog.push({ id: uuidv4(), name, icon, imageUrl, description, rewardValue: Number(rewardValue), bimesters: bimesters });
            } else {
                const badge = newData.badgesCatalog.find((b: Badge) => b.id === editingId);
                if (badge) { badge.name = name; badge.icon = icon; badge.imageUrl = imageUrl; badge.description = description; badge.rewardValue = Number(rewardValue); badge.bimesters = bimesters; }
            }
        }

        setData(newData);
        saveData(newData);
        closeModal();
    };

    // --- DELETE SYSTEM ---

    const requestDelete = (e: React.MouseEvent, type: 'school' | 'class' | 'task' | 'badge' | 'student', id: string, parentId?: string, itemName?: string) => {
        e.stopPropagation();
        setDeleteConfig({ isOpen: true, type, id, parentId, itemName });
    };

    const executeDelete = () => {
        const { type, id, parentId } = deleteConfig;
        const newData = JSON.parse(JSON.stringify(data));

        if (type === 'school') {
            newData.schools = newData.schools.filter((s: School) => s.id !== id);
            if (selectedSchoolId === id) { setSelectedSchoolId(''); setSelectedClassId(''); }
        }
        else if (type === 'class') {
            const school = newData.schools.find((s: School) => s.id === parentId);
            if (school && school.classes) school.classes = school.classes.filter((c: ClassGroup) => c.id !== id);
            if (selectedClassId === id) setSelectedClassId('');
        }
        else if (type === 'student') {
            newData.schools.forEach((s: School) => {
                s.classes?.forEach((c: ClassGroup) => {
                    if (c.students) c.students = c.students.filter((std: Student) => std.id !== id);
                });
            });
        }
        else if (type === 'task') {
            newData.taskCatalog = newData.taskCatalog.filter((t: TaskDefinition) => t.id !== id);
        }
        else if (type === 'badge') {
            newData.badgesCatalog = newData.badgesCatalog.filter((b: Badge) => b.id !== id);
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

    const giveRewards = () => {
        if (selectedStudentsForTask.length === 0) return alert("Selecione alunos.");

        let currentData = data;

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
                    description: badge.id,
                    bimester: currentBimester,
                    date: new Date()
                };
                currentData = addTransaction(currentData, tx);
            });
        } else {
            let points = manualPoints;
            let desc = manualDesc;

            if (selectedTaskId) {
                const task = data.taskCatalog.find(t => t.id === selectedTaskId);
                if (task) { points = task.defaultPoints; desc = task.title; }
            }
            if (!desc) desc = "Atividade de Sala";

            selectedStudentsForTask.forEach(sid => {
                const tx: Transaction = {
                    id: uuidv4(),
                    studentId: sid,
                    type: 'TASK',
                    amount: points,
                    description: desc,
                    bimester: currentBimester,
                    date: new Date()
                };
                currentData = addTransaction(currentData, tx);
            });
        }

        setData(currentData);
        saveData(currentData);
        setSelectedStudentsForTask([]);
        alert(isGivingBadge ? "Medalhas entregues!" : "Pontos atribuídos!");
    };

    // --- BACKUP ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (importDataFromJSON(ev.target?.result as string)) {
                alert("Dados restaurados com sucesso!");
                setData(loadData());
            } else {
                alert("Arquivo inválido.");
            }
        };
        reader.readAsText(file);
    };

    // --- PROFILE LOGIC ---
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const newName = (form.elements.namedItem('name') as HTMLInputElement).value;
        const newSubject = (form.elements.namedItem('subject') as HTMLInputElement).value;
        const newBio = (form.elements.namedItem('bio') as HTMLInputElement).value;
        const newPass = (form.elements.namedItem('newPass') as HTMLInputElement).value;

        let newHash = profile.passwordHash;
        if (newPass.trim()) {
            newHash = obscurePassword(newPass);
        }

        const updatedProfile = {
            name: newName,
            subject: newSubject,
            bio: newBio,
            passwordHash: newHash
        };

        setProfile(updatedProfile);
        saveProfile(updatedProfile);
        alert("Perfil atualizado com sucesso!");
    };

    // --- DERIVED STATE ---
    const currentSchool = data.schools.find(s => s.id === selectedSchoolId);
    const currentClass = currentSchool?.classes?.find(c => c.id === selectedClassId);
    const studentsList = currentClass?.students || [];

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
                            <h1 className="text-3xl font-black gamified-font mb-1 tracking-wide">{student.nickname}</h1>
                        )}
                        <h2 className={`${student.nickname ? 'text-sm opacity-80 font-medium' : 'text-2xl font-bold'}`}>{student.name}</h2>

                        <div className="mt-4 flex items-center gap-2">
                            <span className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <i className="fas fa-crown"></i> {level.title}
                            </span>
                        </div>

                        <div className="mt-6 text-6xl font-black gamified-font drop-shadow-md">{total} <span className="text-lg opacity-70 font-bold">LXC</span></div>
                    </div>
                </div>

                <div className="max-w-md mx-auto px-6 -mt-8 relative z-10 space-y-6">
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

                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center relative overflow-hidden group">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${tx.amount > 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                                    <div className="pl-3 flex-1 min-w-0">
                                        <p className="font-bold text-slate-700 text-sm truncate">
                                            {tx.type === 'BADGE' ? (
                                                <span className="flex items-center gap-2 text-amber-600">
                                                    <i className="fas fa-medal"></i>
                                                    {data.badgesCatalog.find(b => b.id === tx.description)?.name || 'Nova Medalha'}
                                                </span>
                                            ) : tx.description}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                                            <i className="far fa-clock"></i> {new Date(tx.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 pl-2">
                                        <div className="text-right">
                                            <div className={`font-black text-lg ${tx.amount > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-300 uppercase">LXC</div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditTransactionAmount(tx.id, tx.amount); }}
                                                className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 flex items-center justify-center transition-colors"
                                                title="Editar Valor"
                                            >
                                                <i className="fas fa-pen text-xs"></i>
                                            </button>
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
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Beta 0.2</p>
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
                    ].map(item => (
                        <button key={item.id} onClick={() => setView(item.id as any)} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors font-medium text-sm ${view === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                            <i className={`fas ${item.icon} w-5 text-center`}></i> {item.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
                    <button onClick={performLogout} className="w-full text-left px-4 py-2 rounded-xl flex items-center gap-3 transition-colors font-medium text-sm text-red-400 hover:bg-red-500/10">
                        <i className="fas fa-sign-out-alt w-5 text-center"></i> Sair do Sistema
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-2">Desenvolvido com Gemini AI</p>
                </div>
            </aside>

            <main className="flex-1 h-[calc(100vh-64px)] md:h-screen overflow-y-auto p-4 md:p-8 relative bg-slate-50">

                {view === 'profile' && (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">Perfil do Professor</h2>
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
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome de Exibição</label>
                                    <input
                                        name="name"
                                        defaultValue={profile.name}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                        required
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
                                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-lock text-amber-500"></i> Alterar Senha</h4>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova Senha (Deixe em branco para manter a atual)</label>
                                    <input
                                        type="password"
                                        name="newPass"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                                        placeholder="Nova senha..."
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2">
                                        Atenção: Ao alterar a senha, ela será salva neste navegador.
                                    </p>
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
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">Segurança dos Dados</h2>
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 text-center space-y-6">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 text-3xl mb-4">
                                <i className="fas fa-database"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Backup Manual</h3>
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
                                <div className="w-full pt-4 border-t border-slate-100 mt-2">
                                    <Button variant="warning" onClick={load2026Backup} className="py-4 px-8 text-base w-full bg-amber-500 hover:bg-amber-600 text-white">
                                        <i className="fas fa-bolt"></i> Carga Rápida: Turmas 2026
                                    </Button>
                                    <p className="text-[10px] text-slate-400 mt-2">Usa o backup interno pré-configurado.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'catalog' && (
                    <div className="max-w-5xl mx-auto animate-fade-in">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 md:mb-8">Catálogo Global</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
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
                            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-amber-600"><i className="fas fa-medal mr-2"></i> Medalhas</h3>
                                    <Button onClick={() => openModal('badge', 'create')} variant="warning" className="text-xs">+ Nova Medalha</Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {data.badgesCatalog.length === 0 && <p className="col-span-2 text-center text-slate-400 py-4 italic">Nenhuma medalha cadastrada.</p>}
                                    {data.badgesCatalog.map(b => (
                                        <div key={b.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 relative hover:border-amber-300 transition-colors">
                                            {b.imageUrl ? (
                                                <img src={b.imageUrl} alt="Medalha" className="w-8 h-8 rounded-full object-cover border border-amber-200 shadow-sm flex-shrink-0" />
                                            ) : (
                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0"><i className={`fas ${b.icon}`}></i></div>
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
                                            <div className="flex gap-1 bg-amber-50 rounded-lg flex-shrink-0">
                                                <button onClick={(e) => { e.stopPropagation(); openModal('badge', 'edit', b); }} className="text-amber-400 hover:text-amber-600 p-1"><i className="fas fa-pen text-xs"></i></button>
                                                <button onClick={(e) => requestDelete(e, 'badge', b.id, undefined, b.name)} className="text-red-300 hover:text-red-500 p-1"><i className="fas fa-trash text-xs"></i></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'schools' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Estrutura Escolar</h2>
                            <Button onClick={() => openModal('school', 'create')} className="w-full sm:w-auto">+ Nova Escola</Button>
                        </div>

                        <div className="space-y-6">
                            {data.schools.length === 0 && <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400">Nenhuma escola cadastrada. Comece criando uma!</div>}
                            {data.schools.map(school => (
                                <div key={school.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="bg-slate-50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 gap-4">
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0"><i className="fas fa-school"></i></div>
                                            <h3 className="font-bold text-lg text-slate-700 truncate">{school.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <Button variant="icon" onClick={(e: any) => { e.stopPropagation(); openModal('school', 'edit', school); }} title="Renomear Escola"><i className="fas fa-pen"></i></Button>
                                            <Button variant="icon" onClick={(e: any) => requestDelete(e, 'school', school.id, undefined, school.name)} title="Excluir Escola"><i className="fas fa-trash text-red-400"></i></Button>
                                            <div className="hidden sm:block w-px h-6 bg-slate-300 mx-2"></div>
                                            <button onClick={() => { setSelectedSchoolId(school.id); openModal('class', 'create'); }} className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors border border-indigo-200 bg-white whitespace-nowrap">+ Turma</button>
                                        </div>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {school.classes?.length === 0 && <p className="text-slate-400 text-sm italic p-2 col-span-full text-center">Nenhuma turma nesta escola.</p>}
                                        {school.classes?.map(cls => (
                                            <div key={cls.id} className="border border-slate-200 p-4 rounded-xl hover:border-indigo-300 transition-colors bg-white relative group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-slate-800 truncate pr-6">{cls.name}</h4>
                                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0">{cls.students?.length || 0} alunos</span>
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <button onClick={() => { setSelectedSchoolId(school.id); setSelectedClassId(cls.id); setShowBatchImport(true); }} className="flex-1 bg-emerald-50 text-emerald-600 text-xs font-bold py-2 rounded-lg hover:bg-emerald-100 border border-emerald-100 flex items-center justify-center gap-1">
                                                        <i className="fas fa-file-import"></i> Importar
                                                    </button>
                                                </div>
                                                <div className="absolute top-2 right-2 flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                                                    <button onClick={(e) => { e.stopPropagation(); openModal('class', 'edit', cls); }} className="p-1 text-slate-400 hover:text-indigo-500" title="Editar"><i className="fas fa-pen text-xs"></i></button>
                                                    <button onClick={(e) => requestDelete(e, 'class', cls.id, school.id, cls.name)} className="p-1 text-slate-400 hover:text-red-500" title="Excluir"><i className="fas fa-trash text-xs"></i></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'dashboard' && (
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
                        </div>

                        {!selectedClassId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-20 md:py-0">
                                <i className="fas fa-chalkboard-teacher text-6xl mb-4"></i>
                                <p className="font-bold text-center">Selecione uma turma acima para começar</p>
                            </div>
                        ) : (
                            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-y-auto lg:overflow-hidden">
                                <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-sm min-h-[400px]">
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                        <button onClick={() => {
                                            if (selectedStudentsForTask.length === studentsList.length) setSelectedStudentsForTask([]);
                                            else setSelectedStudentsForTask(studentsList.map(s => s.id));
                                        }} className="text-xs font-bold text-indigo-600 hover:underline">
                                            {selectedStudentsForTask.length === studentsList.length ? 'Desmarcar' : 'Todos'}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400">{studentsList.length} Alunos</span>
                                            <Button variant="success" className="py-1 px-2 text-xs h-8" onClick={() => setShowBatchImport(true)}>+ Importar</Button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                        {studentsList.length === 0 && <div className="text-center py-20 text-slate-400 italic">Lista vazia. Importe alunos.</div>}
                                        {studentsList.map(student => {
                                            const isSelected = selectedStudentsForTask.includes(student.id);
                                            const level = getLevel(student.lxcTotal[currentBimester] || 0, currentBimester);
                                            return (
                                                <div key={student.id}
                                                    onClick={() => setSelectedStudentsForTask(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id])}
                                                    className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all group ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`w-10 h-10 rounded-full ${level.color} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>{student.name.charAt(0)}</div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-700 text-sm truncate">{student.nickname || student.name}</p>
                                                                {student.nickname && <span className="text-[9px] text-slate-400 hidden sm:inline">({student.name})</span>}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="text-[10px] bg-slate-100 px-2 rounded-full text-slate-500 whitespace-nowrap">{level.title}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); setViewingStudentId(student.id); setView('student-view'); }} className="text-[10px] text-indigo-400 font-bold hover:underline whitespace-nowrap"><i className="fas fa-eye"></i> Ver</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 pl-2 flex-shrink-0">
                                                        <span className="font-mono font-bold text-slate-600">{student.lxcTotal[currentBimester] || 0}</span>
                                                        <button onClick={(e) => requestDelete(e, 'student', student.id, undefined, student.name)} className="text-slate-300 hover:text-red-500 px-2" title="Excluir Aluno"><i className="fas fa-trash"></i></button>
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
                                        <select
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                                            value={selectedTaskId}
                                            onChange={e => {
                                                setSelectedTaskId(e.target.value);
                                                if (!isGivingBadge) {
                                                    const t = data.taskCatalog.find(tsk => tsk.id === e.target.value);
                                                    if (t) { setManualDesc(t.title); setManualPoints(t.defaultPoints); }
                                                    else { setManualDesc(''); setManualPoints(10); }
                                                }
                                            }}
                                        >
                                            <option value="">{isGivingBadge ? '-- Selecione a Medalha --' : '-- Personalizado --'}</option>

                                            {!isGivingBadge && filteredTasks.map(t => (
                                                <option key={t.id} value={t.id}>{t.title} ({t.defaultPoints} pts)</option>
                                            ))}

                                            {isGivingBadge && filteredBadges.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>

                                        {((!isGivingBadge && filteredTasks.length === 0) || (isGivingBadge && filteredBadges.length === 0)) && (
                                            <p className="text-[10px] text-orange-500 mt-2 font-bold italic">
                                                <i className="fas fa-exclamation-circle"></i> Nada disponível para o {currentBimester}º Bimestre.
                                            </p>
                                        )}
                                    </div>

                                    {!isGivingBadge && !selectedTaskId && (
                                        <div className="animate-fade-in space-y-4">
                                            <Input placeholder="Motivo (ex: Ajudou colega)" value={manualDesc} onChange={(e: any) => setManualDesc(e.target.value)} />
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setManualPoints(p => p - 5)} className="w-10 h-10 bg-slate-100 rounded-lg font-bold hover:bg-slate-200 touch-manipulation">-</button>
                                                <input type="number" className="flex-1 text-center font-bold text-xl py-2 border-b-2 border-indigo-100 outline-none bg-transparent" value={manualPoints} onChange={e => setManualPoints(Number(e.target.value))} />
                                                <button onClick={() => setManualPoints(p => p + 5)} className="w-10 h-10 bg-slate-100 rounded-lg font-bold hover:bg-slate-200 touch-manipulation">+</button>
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
                )}
            </main>

            {modalConfig.isOpen && (
                <GenericModal
                    title={
                        modalConfig.mode === 'create'
                            ? `Nova ${modalConfig.type === 'school' ? 'Escola' : modalConfig.type === 'class' ? 'Turma' : modalConfig.type === 'task' ? 'Tarefa' : 'Medalha'}`
                            : `Editar ${modalConfig.type === 'school' ? 'Escola' : modalConfig.type === 'class' ? 'Turma' : modalConfig.type === 'task' ? 'Tarefa' : 'Medalha'}`
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

                    {(modalConfig.type === 'task' || modalConfig.type === 'badge') && (
                        <Input
                            label="Descrição"
                            value={formData.description}
                            onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                        />
                    )}

                    {modalConfig.type === 'task' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pontos (LXC)</label>
                            <input
                                type="number"
                                value={formData.points}
                                onChange={(e: any) => setFormData({ ...formData, points: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500"
                            />
                        </div>
                    )}

                    {modalConfig.type === 'badge' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Recompensa Extra (Opcional)</label>
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="number"
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
                        </div>
                    )}

                    {(modalConfig.type === 'task' || modalConfig.type === 'badge') && (
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
            )}

            <ConfirmationModal
                isOpen={deleteConfig.isOpen}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir "${deleteConfig.itemName || 'este item'}"? Esta ação é irreversível.`}
                onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
                onConfirm={executeDelete}
            />

            {showBatchImport && <BatchStudentModal onClose={() => setShowBatchImport(false)} onSave={batchImportStudents} />}
        </div>
    );
}
