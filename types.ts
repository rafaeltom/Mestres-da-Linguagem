
export interface Student {
  id: string;
  name: string;
  walletAddress: string;
  encryptedPrivateKey?: string; // Para carteiras geradas automaticamente (Custodial)
  balance: number;
  school?: string;
  grade?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  students: Student[];
}

export interface School {
  id: string;
  name: string;
  classes: ClassGroup[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  rewardAmount: number;
  assignedClassIds: string[];
  createdAt: Date;
}

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  type: 'REWARD' | 'TRANSFER';
  description: string;
  timestamp: Date;
  hash: string;
}

export interface SchoolStats {
  totalStudents: number;
  totalDistributed: number;
  activeSchools: number;
}
