
export type Bimester = 1 | 2 | 3 | 4;

export interface LevelRule {
  min: number;
  max: number | null; // null significa "e acima"
  title: string;
  color: string;
}

export interface Message {
  id: string;
  text: string;
  date: Date;
  fromStudent: boolean; // true = aluno enviou, false = professor respondeu
  read: boolean;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  schoolId: string;
  avatarId: string; // ex: 'hero-1', 'hero-2'
  lxcTotal: { [key in Bimester]: number }; // Saldo por bimestre
  badges: string[]; // IDs das medalhas conquistadas
  messages: Message[];
  walletAddress?: string;
  encryptedPrivateKey?: string;
}

export interface ClassGroup {
  id: string;
  name: string; // Ex: 9º Ano A
  schoolId: string;
  students?: Student[];
}

export interface School {
  id: string;
  name: string;
  classes?: ClassGroup[];
}

export interface Transaction {
  id: string;
  studentId: string;
  type: 'TASK' | 'BONUS' | 'PENALTY' | 'SHOP' | 'BADGE';
  amount: number;
  description: string;
  bimester: Bimester;
  date: Date;
  teacherId: string;
}

export interface TaskCatalog {
  id: string;
  title: string;
  defaultPoints: number;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  lxcBonus: number;
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
