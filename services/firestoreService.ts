
import { 
  collection, 
  addDoc, 
  doc, 
  runTransaction, 
  getDocs, 
  query, 
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { Student, Transaction, Bimester, School, ClassGroup } from "../types";

// Nomes das coleções no Firestore
const COLL_SCHOOLS = 'schools';
const COLL_CLASSES = 'classes';
const COLL_STUDENTS = 'students';
const COLL_TRANSACTIONS = 'transactions';

/**
 * Inicializa a estrutura básica do banco de dados se estiver vazio.
 * Cria escolas e turmas padrão.
 */
export const initializeDatabaseStructure = async () => {
  try {
    const schoolsRef = collection(db, COLL_SCHOOLS);
    const snapshot = await getDocs(schoolsRef);

    if (!snapshot.empty) {
      console.log("Banco de dados já possui dados.");
      return;
    }

    console.log("Inicializando banco de dados...");
    const batch = writeBatch(db);

    // 1. Criar Escolas
    const schoolsData = [
      { name: 'EE Nossa Senhora Aparecida', id: 'nsa' },
      { name: 'EMEF Prof. Alípio Corrêa Neto', id: 'pac' }
    ];

    for (const s of schoolsData) {
      const schoolRef = doc(db, COLL_SCHOOLS, s.id);
      batch.set(schoolRef, { name: s.name });

      // 2. Criar Turmas Padrão para cada escola
      const classesData = ['9º Ano A', '9º Ano B', '3º Médio A'];
      for (const cName of classesData) {
        const classRef = doc(collection(db, COLL_CLASSES));
        batch.set(classRef, {
          name: cName,
          schoolId: s.id,
          createdAt: new Date()
        });
      }
    }

    await batch.commit();
    console.log("Estrutura inicial criada com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar DB:", error);
    throw error;
  }
};

/**
 * Adiciona um aluno e vincula à turma/escola.
 */
export const addStudentToFirestore = async (studentData: Partial<Student>) => {
  try {
    await addDoc(collection(db, COLL_STUDENTS), {
      ...studentData,
      lxcTotal: { 1: 0, 2: 0, 3: 0, 4: 0 },
      badges: [],
      messages: [],
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Erro ao adicionar aluno:", error);
    throw error;
  }
};

/**
 * Operação Atômica: Adiciona histórico E atualiza saldo.
 * Se um falhar, o outro não acontece (Rollback automático).
 */
export const addPointsAtomic = async (
  studentId: string, 
  amount: number, 
  description: string, 
  bimester: Bimester,
  teacherId: string
) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Referência do Aluno
      const studentRef = doc(db, COLL_STUDENTS, studentId);
      const studentDoc = await transaction.get(studentRef);

      if (!studentDoc.exists()) {
        throw new Error("Aluno não encontrado!");
      }

      // 2. Calcular novo saldo
      const studentData = studentDoc.data() as Student;
      const currentBalance = studentData.lxcTotal?.[bimester] || 0;
      const newBalance = currentBalance + amount;

      // 3. Criar referência para nova transação (History)
      const newTxRef = doc(collection(db, COLL_TRANSACTIONS));

      // 4. Executar escritas
      // 4a. Gravar no Histórico
      transaction.set(newTxRef, {
        studentId,
        studentName: studentData.name,
        type: amount >= 0 ? 'TASK' : 'PENALTY',
        amount,
        description,
        bimester,
        date: new Date(), // Firestore converte para Timestamp
        teacherId
      });

      // 4b. Atualizar Saldo do Aluno
      transaction.update(studentRef, {
        [`lxcTotal.${bimester}`]: newBalance
      });
    });
    console.log("Transação atômica concluída com sucesso.");
  } catch (error) {
    console.error("Falha na transação atômica:", error);
    throw error;
  }
};

/**
 * Importação em Massa (Batch) para performance.
 */
export const batchImportStudents = async (
  names: string[], 
  classId: string, 
  schoolId: string
) => {
  const batch = writeBatch(db);
  const studentsRef = collection(db, COLL_STUDENTS);

  names.forEach(name => {
    const newDocRef = doc(studentsRef);
    batch.set(newDocRef, {
      name,
      classId,
      schoolId,
      lxcTotal: { 1: 0, 2: 0, 3: 0, 4: 0 },
      badges: [],
      walletAddress: '', // Pode ser gerado depois
      createdAt: new Date()
    });
  });

  await batch.commit();
};
