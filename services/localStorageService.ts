
import { School, Student, Transaction, TaskDefinition, Badge, TeacherProfileData } from '../types';

const DB_KEY = 'mestres_linguagem_v2';
const PROFILE_KEY = 'mestres_teacher_profile';

// Hash Base64 padrão para "Swf123swf"
// btoa("Swf123swf") = "U3dmMTIzc3dm"
const DEFAULT_PASS_HASH = "U3dmMTIzc3dm";

export interface AppData {
  schools: School[];
  transactions: Transaction[];
  taskCatalog: TaskDefinition[];
  badgesCatalog: Badge[];
}

// Dados iniciais com Badges pré-configuradas
const INITIAL_DATA: AppData = {
  schools: [],
  transactions: [],
  taskCatalog: [
    { id: 't1', title: 'Lição de Casa Completa', description: 'Entregou no prazo e completa', defaultPoints: 20, bimesters: [1, 2, 3, 4] },
    { id: 't2', title: 'Participação em Aula', description: 'Respondeu perguntas ou foi ao quadro', defaultPoints: 10, bimesters: [1, 2, 3, 4] },
    { id: 't3', title: 'Comportamento Exemplar', description: 'Ajudou colegas ou manteve a ordem', defaultPoints: 15, bimesters: [1, 2, 3, 4] }
  ],
  badgesCatalog: [
    { id: 'b1', name: 'Leitor Voraz', icon: 'fa-book-reader', description: 'Leu mais de 3 livros no bimestre', bimesters: [1, 2, 3, 4] },
    { id: 'b2', name: 'Matemático', icon: 'fa-calculator', description: 'Excelente desempenho em exatas', bimesters: [1, 2, 3, 4] },
    { id: 'b3', name: 'Artista', icon: 'fa-palette', description: 'Criatividade visual destacada', bimesters: [1, 2, 3, 4] },
    { id: 'b4', name: 'Líder', icon: 'fa-crown', description: 'Organizou grupos e ajudou o professor', bimesters: [1, 2, 3, 4] },
    { id: 'b5', name: 'Pontual', icon: 'fa-clock', description: 'Nunca chegou atrasado', bimesters: [1, 2, 3, 4] }
  ]
};

// --- DATA MANAGEMENT ---

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (!stored) return INITIAL_DATA;
    
    const parsed = JSON.parse(stored);
    
    // Fix datas
    if (parsed.transactions) {
      parsed.transactions = parsed.transactions.map((t: any) => ({
        ...t,
        date: new Date(t.date)
      }));
    }
    
    // Merge com initial e garante compatibilidade de tipos para bimesters
    const tasks = (parsed.taskCatalog || INITIAL_DATA.taskCatalog).map((t: any) => ({
        ...t,
        bimesters: t.bimesters || [1, 2, 3, 4]
    }));

    const badges = (parsed.badgesCatalog || INITIAL_DATA.badgesCatalog).map((b: any) => ({
        ...b,
        bimesters: b.bimesters || [1, 2, 3, 4]
    }));

    return {
        ...INITIAL_DATA,
        ...parsed,
        taskCatalog: tasks,
        badgesCatalog: badges
    };
  } catch (e) {
    console.error("Erro ao carregar dados locais", e);
    return INITIAL_DATA;
  }
};

export const saveData = (data: AppData) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (e) {
    alert("Erro crítico: Armazenamento cheio.");
  }
};

// --- PROFILE MANAGEMENT ---

export const loadProfile = (): TeacherProfileData => {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
        // Migração simples se o hash antigo (ou resetado) estiver salvo
        const profile = JSON.parse(stored);
        if (profile.passwordHash === "DEFAULT_RESET" || profile.passwordHash.length > 30) {
             profile.passwordHash = DEFAULT_PASS_HASH;
        }
        return profile;
    }
    return {
        name: "Professor(a)",
        subject: "Linguagens",
        bio: "Educador focado em gamificação.",
        passwordHash: DEFAULT_PASS_HASH
    };
};

export const saveProfile = (profile: TeacherProfileData) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

// --- DATA BACKUP TOOLS ---

export const exportDataToJSON = () => {
    const data = loadData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `mestres_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const importDataFromJSON = (jsonContent: string): boolean => {
    try {
        const parsed = JSON.parse(jsonContent);
        // Validação básica
        if(!parsed.schools) throw new Error("Arquivo inválido");
        
        saveData(parsed);
        return true;
    } catch(e) {
        console.error(e);
        return false;
    }
};

// --- HELPERS ---

export const getAllStudents = (schools: School[]): Student[] => {
  return schools.flatMap(s => s.classes?.flatMap(c => c.students || []) || []);
};

export const addTransaction = (currentData: AppData, tx: Transaction): AppData => {
  const newData = { ...currentData, transactions: [tx, ...currentData.transactions] };
  
  // Atualiza saldo do aluno
  const schools = newData.schools.map(school => ({
    ...school,
    classes: school.classes?.map(cls => ({
      ...cls,
      students: cls.students?.map(std => {
        if (std.id === tx.studentId) {
          const currentBalance = std.lxcTotal[tx.bimester] || 0;
          
          let updatedBadges = std.badges || [];
          if (tx.type === 'BADGE') {
             if(!updatedBadges.includes(tx.description)) {
                 updatedBadges = [...updatedBadges, tx.description];
             }
          }

          return {
            ...std,
            lxcTotal: {
              ...std.lxcTotal,
              [tx.bimester]: currentBalance + tx.amount
            },
            badges: updatedBadges
          };
        }
        return std;
      }) || []
    })) || []
  }));

  return { ...newData, schools };
};

export const removeTransaction = (currentData: AppData, transactionId: string): AppData => {
    const txToRemove = currentData.transactions.find(t => t.id === transactionId);
    if (!txToRemove) return currentData;

    const newTransactions = currentData.transactions.filter(t => t.id !== transactionId);

    const schools = currentData.schools.map(school => ({
        ...school,
        classes: school.classes?.map(cls => ({
            ...cls,
            students: cls.students?.map(std => {
                if (std.id === txToRemove.studentId) {
                    const currentBalance = std.lxcTotal[txToRemove.bimester] || 0;
                    
                    let updatedBadges = std.badges || [];
                    if (txToRemove.type === 'BADGE') {
                        updatedBadges = updatedBadges.filter(bId => bId !== txToRemove.description);
                    }

                    return {
                        ...std,
                        lxcTotal: {
                            ...std.lxcTotal,
                            [txToRemove.bimester]: currentBalance - txToRemove.amount
                        },
                        badges: updatedBadges
                    };
                }
                return std;
            }) || []
        })) || []
    }));

    return { ...currentData, transactions: newTransactions, schools };
};

export const updateTransactionAmount = (currentData: AppData, transactionId: string, newAmount: number): AppData => {
    const txIndex = currentData.transactions.findIndex(t => t.id === transactionId);
    if (txIndex === -1) return currentData;

    const originalTx = currentData.transactions[txIndex];
    const diff = newAmount - originalTx.amount;

    const updatedTx = { ...originalTx, amount: newAmount };
    const newTransactions = [...currentData.transactions];
    newTransactions[txIndex] = updatedTx;

    const schools = currentData.schools.map(school => ({
        ...school,
        classes: school.classes?.map(cls => ({
            ...cls,
            students: cls.students?.map(std => {
                if (std.id === originalTx.studentId) {
                    const currentBalance = std.lxcTotal[originalTx.bimester] || 0;
                    return {
                        ...std,
                        lxcTotal: {
                            ...std.lxcTotal,
                            [originalTx.bimester]: currentBalance + diff
                        }
                    };
                }
                return std;
            }) || []
        })) || []
    }));

    return { ...currentData, transactions: newTransactions, schools };
};
