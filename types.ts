
export type Bimester = 1 | 2 | 3 | 4;

export interface LevelRule {
  min: number;
  max: number | null; // null significa "e acima"
  title: string;
  color: string;
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
}

export interface ClassGroup {
  id: string;
  name: string; 
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
  type: 'TASK' | 'BONUS' | 'PENALTY' | 'BADGE';
  amount: number;
  description: string;
  bimester: Bimester;
  date: Date;
  studentName?: string;
  hash?: string;
}

// Novo: Definição de Tarefa Padrão (O "Cardápio")
export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  defaultPoints: number;
  bimesters: Bimester[]; // Quais bimestres essa tarefa está disponível
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
