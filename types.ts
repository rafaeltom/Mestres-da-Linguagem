
export type Bimester = 1 | 2 | 3 | 4;

export interface LevelRule {
  min: number;
  max: number | null; // null significa "e acima"
  title: string;
  color: string;
}

export interface TeacherProfileData {
  name: string;
  email?: string; // E-mail do professor (imutável após registro)
  displayName?: string; // Nome a ser exibido
  subject: string;
  bio: string;
  passwordHash: string; // Armazena apenas o Hash
  pin?: string; // PIN de 4 dígitos numéricos para desbloqueio
}

export interface Student {
  id: string;
  name: string;
  nickname?: string; // Novo: Apelido escolhido pelo aluno
  classId: string;
  schoolId: string;
  avatarId: string;
  lxcTotal: { [key in Bimester]: number };
  badges: string[]; // IDs das medalhas
  walletAddress?: string;
  encryptedPrivateKey?: string;
  messages?: string[];
  marked?: boolean;
  markedColor?: string;
  markedLabel?: string;
  registrationId?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  schoolId: string;
  seed?: string; // Código único de compartilhamento
  sharedWith?: string[]; // UIDs de outros professores que têm acesso
  students?: Student[];
}

export interface School {
  id: string;
  name: string;
  iconUrl?: string; // Novo: URL do ícone customizado da escola
  bimesterDates?: {
    [key in Bimester]?: { start: string; end: string } // Formato YYYY-MM-DD
  };
  classes?: ClassGroup[];
}

export interface Transaction {
  id: string;
  studentId: string;
  type: 'TASK' | 'BONUS' | 'PENALTY' | 'BADGE';
  amount: number;
  description: string;
  bimester: Bimester;
  date: Date;
  studentName?: string;
  hash?: string;
  customDescription?: string;
  teacherName?: string; // Nome a ser exibido do professor
}

// Novo: Definição de Tarefa Padrão (O "Cardápio")
// Novo: Definição de Penalidade Padrão
export interface PenaltyDefinition {
  id: string;
  title: string;
  description: string;
  defaultPoints: number; // Valor negativo
  bimesters: Bimester[];
}

export type TaskCategory = 'Daily' | 'Weekly' | 'Side Quest' | 'Boss' | 'Custom';

export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  defaultPoints: number;
  bimesters: Bimester[]; // Quais bimestres essa tarefa está disponível
  category?: TaskCategory;
}

export interface Badge {
  id: string;
  name: string;
  icon: string; // Classe do FontAwesome (ex: fa-star)
  imageUrl?: string; // URL de imagem externa (opcional)
  description: string;
  rewardValue?: number; // Novo: Recompensa opcional em LXC ao ganhar a medalha
  bimesters: Bimester[]; // Quais bimestres essa medalha está disponível
  cost?: number; // Se custar algo para comprar (futuro)
  autoUnlockCriteria?: { type: 'LXC' | 'TASKS'; threshold: number }; // Requisito automático
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
