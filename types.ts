
export type Bimester = 1 | 2 | 3 | 4;

export interface LevelRule {
  min: number;
  max: number | null; // null significa "e acima"
  title: string;
  color: string;
}


export type LicenseKeyType = 'master' | 'test';

export interface LicenseEntry {
  keyId: string;
  type: LicenseKeyType;
  claimedAt: string; // ISO string
  expiresAt?: string; // ISO string — Test keys only
}

export interface TeacherProfileData {
  name: string;
  email?: string; // E-mail do professor (imutável após registro)
  displayName?: string; // Nome a ser exibido
  subject: string;
  bio: string;
  passwordHash: string; // Armazena apenas o Hash
  pin?: string; // PIN de 4 dígitos numéricos para desbloqueio
  role?: 'admin' | 'teacher';
  isUnlocked?: boolean;
  /** @deprecated Use licenseKeys array for new logic */
  licenseKey?: string;
  licenseKeys?: LicenseEntry[]; // Stacked licenses
  masterKeysCount?: number; // 0-3
  testKeysCount?: number;  // 0-5
  /** How many total schools the user has soft-deleted via Test key slot (max 5) */
  testSchoolDeletions?: number;
  /** How many total schools the user has soft-deleted via Master key slots (max masterKeysCount * SCHOOLS_PER_MASTER * 7) */
  masterSchoolDeletions?: number;
}

export interface Student {
  id: string;
  name: string;
  nickname?: string; // Novo: Apelido escolhido pelo aluno
  classId: string;
  schoolId: string;
  avatarId?: string;
  lxcTotal: { [key in Bimester]: number };
  badges: string[]; // IDs das medalhas
  walletAddress?: string;
  encryptedPrivateKey?: string;
  messages?: string[];
  marked?: boolean;
  markedColor?: string;
  markedLabel?: string;
  registrationId?: string;
  currency?: number; // Moeda da lojinha (Flores)
  ownedAvatars?: string[]; // IDs dos avatares desbloqueados
  freeAvatarChoices?: number; // Quantidade de trocas gratuitas disponíveis
  ownerId?: string;
  ownerName?: string;
  shared?: boolean;
  // Soft Delete
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  schoolId: string;
  seed?: string; // Código único de compartilhamento
  sharedWith?: string[]; // UIDs de outros professores que têm acesso
  students?: Student[];
  // Flag de memória (nunca gravada no Firestore) — indica turma de outro professor
  shared?: boolean;
  // UID do professor dono
  ownerId?: string;
  // Soft Delete
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface School {
  id: string;
  name: string;
  iconUrl?: string;
  bimesterDates?: {
    [key in Bimester]?: { start: string; end: string }
  };
  classes?: ClassGroup[];
  // Flag de memória (nunca gravada no Firestore) — indica escola de outro professor
  shared?: boolean;
  // UID do professor dono (preenchido apenas para escolas compartilhadas)
  ownerId?: string;
  // Nome do professor dono (para exibição)
  ownerName?: string;
  // Soft Delete
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Transaction {
  id: string;
  studentId: string;
  classId?: string; // ID da turma — obrigatório para transações de colaboradores
  type: 'TASK' | 'BONUS' | 'PENALTY' | 'BADGE';
  amount: number;
  description: string;
  bimester: Bimester;
  date: Date;
  studentName?: string;
  hash?: string;
  customDescription?: string;
  teacherName?: string;
  ownerId?: string;
  ownerName?: string;
  shared?: boolean;
  currencyAmount?: number; // Flores ganhas nesta transação
}

// Novo: Definição de Tarefa Padrão (O "Cardápio")
// Novo: Definição de Penalidade Padrão
export interface PenaltyDefinition {
  id: string;
  title: string;
  description: string;
  defaultPoints: number;
  bimesters: Bimester[];
  shared?: boolean; // Se true, colaboradores das turmas do dono podem usar esta penalidade
  ownerId?: string; // UID do professor dono
  ownerName?: string; // Nome do professor dono
  assignedSchoolIds?: string[]; // IDs das escolas vinculadas
  assignedClassIds?: string[];  // IDs das turmas vinculadas
}

export type TaskCategory = 'Daily' | 'Weekly' | 'Side Quest' | 'Boss' | 'Custom';

export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  defaultPoints: number;
  bimesters: Bimester[];
  category?: TaskCategory;
  shared?: boolean; // Se true, colaboradores das turmas do dono podem usar esta tarefa
  ownerId?: string; // UID do professor dono
  ownerName?: string; // Nome do professor dono
  assignedSchoolIds?: string[]; // IDs das escolas vinculadas
  assignedClassIds?: string[];  // IDs das turmas vinculadas
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
  description: string;
  rewardValue?: number;
  bimesters: Bimester[];
  cost?: number;
  autoUnlockCriteria?: { type: 'LXC' | 'TASKS'; threshold: number };
  shared?: boolean; // Se true, colaboradores das turmas do dono podem usar esta medalha
  ownerId?: string; // UID do professor dono
  ownerName?: string; // Nome do professor dono
  assignedSchoolIds?: string[]; // IDs das escolas vinculadas
  assignedClassIds?: string[];  // IDs das turmas vinculadas
}

export interface SchoolStats {
  totalStudents: number;
  totalDistributed: number;
  activeSchools: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  rewardAmount: number;
  assignedClassIds: string[];
  createdAt: Date;
}

// Configuration for task categories
export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string; default: number; min: number; max: number }> = {
  'Daily': { label: 'Missão Diária', icon: 'fa-sun', color: 'text-sky-500', default: 20, min: 0, max: 100 },
  'Weekly': { label: 'Missão Semanal', icon: 'fa-calendar-week', color: 'text-purple-500', default: 50, min: 0, max: 200 },
  'Side Quest': { label: 'Side Quest', icon: 'fa-map-signs', color: 'text-emerald-500', default: 10, min: 0, max: 50 },
  'Boss': { label: 'Missão Principal', icon: 'fa-dragon', color: 'text-rose-500', default: 100, min: 0, max: 250 },
  'Custom': { label: '— Tarefa Rápida —', icon: 'fa-cogs', color: 'text-slate-500', default: 10, min: 0, max: 100 },
};
