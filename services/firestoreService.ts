import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  runTransaction
} from "firebase/firestore";
import { db } from "./firebase";
import { Student, Transaction, School, ClassGroup, TaskDefinition, Badge, PenaltyDefinition, TeacherProfileData, Bimester } from "../types";
import { AppData } from "./localStorageService";

const sanitizeId = (id: string | undefined): string => {
  if (!id) return '';
  // Firestore IDs cannot contain slashes and should be trimmed
  return id.replace(/\//g, '_').trim();
};

const generateSeed = () => {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
  let seed = '';
  for (let i = 0; i < 12; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return seed;
};

// Collection Names
const COLL_USERS = 'users';
const COLL_SCHOOLS = 'schools';
const COLL_CLASSES = 'classes';
const COLL_STUDENTS = 'students';
const COLL_TRANSACTIONS = 'transactions';
const COLL_CATALOG_TASKS = 'catalog_tasks';
const COLL_CATALOG_BADGES = 'catalog_badges';
const COLL_CATALOG_PENALTIES = 'catalog_penalties';

// --- USER / PROFILE ---

export const saveTeacherProfile = async (uid: string, profile: TeacherProfileData) => {
  await setDoc(doc(db, COLL_USERS, uid), profile, { merge: true });
};

export const getTeacherProfile = async (uid: string): Promise<TeacherProfileData | null> => {
  const snap = await getDoc(doc(db, COLL_USERS, uid));
  return snap.exists() ? snap.data() as TeacherProfileData : null;
};

// --- DATA LOADING (FULL FETCH) ---

export const fetchTeacherData = async (uid: string) => {
  console.log("[Firestore] Fetching data for teacher:", uid);

  try {
    const [schoolsSnap, classesSnap, studentsSnap, tasksSnap, badgesSnap, penaltiesSnap, txSnap] = await Promise.all([
      getDocs(query(collection(db, COLL_SCHOOLS), where("ownerId", "==", uid))),
      getDocs(query(collection(db, COLL_CLASSES), where("ownerId", "==", uid))),
      getDocs(query(collection(db, COLL_STUDENTS), where("ownerId", "==", uid))),
      getDocs(query(collection(db, COLL_CATALOG_TASKS), where("ownerId", "==", uid))),
      getDocs(query(collection(db, COLL_CATALOG_BADGES), where("ownerId", "==", uid))),
      getDocs(query(collection(db, COLL_CATALOG_PENALTIES), where("ownerId", "==", uid))),
      getDocs(query(collection(db, COLL_TRANSACTIONS), where("ownerId", "==", uid)))
    ]);

    const schools: School[] = schoolsSnap.docs.map(d => ({ ...d.data(), id: d.id, classes: [] } as School));

    classesSnap.forEach(d => {
      const c = { ...d.data(), id: d.id, students: [] } as ClassGroup;
      const parentSchool = schools.find(s => s.id === c.schoolId);
      if (parentSchool) {
        if (!parentSchool.classes) parentSchool.classes = [];
        parentSchool.classes.push(c);
      }
    });

    studentsSnap.forEach(d => {
      const s = { ...d.data(), id: d.id } as Student;
      schools.forEach(school => {
        const parentClass = school.classes?.find(c => c.id === s.classId);
        if (parentClass) {
          if (!parentClass.students) parentClass.students = [];
          parentClass.students.push(s);
        }
      });
    });

    const tasks = tasksSnap.docs.map(d => ({ ...d.data(), id: d.id } as TaskDefinition));
    const badges = badgesSnap.docs.map(d => ({ ...d.data(), id: d.id } as Badge));
    const penalties = penaltiesSnap.docs.map(d => ({ ...d.data(), id: d.id } as PenaltyDefinition));

    const transactions = txSnap.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
      } as Transaction;
    });

    console.log(`[Firestore] Loaded: ${schools.length} schools, ${transactions.length} transactions.`);

    return {
      schools,
      taskCatalog: tasks,
      badgesCatalog: badges,
      penaltiesCatalog: penalties,
      transactions: [] // Transações serão carregadas via sync unificado por ClassId
    };
  } catch (err) {
    console.error("[Firestore] Error fetching teacher data:", err);
    throw err;
  }
};

// --- CRUD OPERATIONS ---

// Schools
export const firestoreAddSchool = async (uid: string, school: School) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { classes, ...schoolData } = school;
  await setDoc(doc(db, COLL_SCHOOLS, school.id), { ...schoolData, ownerId: uid });
};
export const firestoreUpdateSchool = async (school: School) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { classes, ...schoolData } = school;
  await updateDoc(doc(db, COLL_SCHOOLS, school.id), schoolData);
};
export const firestoreDeleteSchool = async (schoolId: string) => {
  await deleteDoc(doc(db, COLL_SCHOOLS, schoolId));
};

/**
 * Busca os metadados de uma escola específica.
 */
export const firestoreGetSchool = async (schoolId: string): Promise<School | null> => {
  const snap = await getDoc(doc(db, COLL_SCHOOLS, schoolId));
  return snap.exists() ? { ...snap.data(), id: snap.id } as School : null;
};

// Classes
export const firestoreAddClass = async (uid: string, classGroup: ClassGroup) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { students, ...classData } = classGroup;
  await setDoc(doc(db, COLL_CLASSES, classGroup.id), { ...classData, ownerId: uid });
};
export const firestoreUpdateClass = async (classGroup: ClassGroup) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { students, ...classData } = classGroup;
  await updateDoc(doc(db, COLL_CLASSES, classGroup.id), classData);
};
export const firestoreDeleteClass = async (classId: string) => {
  await deleteDoc(doc(db, COLL_CLASSES, classId));
};

// Students
export const firestoreAddStudent = async (uid: string, student: Student) => {
  await setDoc(doc(db, COLL_STUDENTS, student.id), { ...student, ownerId: uid });
};
export const firestoreUpdateStudent = async (student: Student) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(doc(db, COLL_STUDENTS, student.id), student as any);
};
export const firestoreDeleteStudent = async (studentId: string) => {
  await deleteDoc(doc(db, COLL_STUDENTS, studentId));
};

// Catalog
export const firestoreAddCatalogItem = async (uid: string, type: 'task' | 'badge' | 'penalty', item: any) => {
  const coll = type === 'task' ? COLL_CATALOG_TASKS : type === 'badge' ? COLL_CATALOG_BADGES : COLL_CATALOG_PENALTIES;
  await setDoc(doc(db, coll, item.id), { ...item, ownerId: uid });
};
export const firestoreUpdateCatalogItem = async (type: 'task' | 'badge' | 'penalty', item: any) => {
  const coll = type === 'task' ? COLL_CATALOG_TASKS : type === 'badge' ? COLL_CATALOG_BADGES : COLL_CATALOG_PENALTIES;
  await updateDoc(doc(db, coll, item.id), item);
};
export const firestoreDeleteCatalogItem = async (type: 'task' | 'badge' | 'penalty', itemId: string) => {
  const coll = type === 'task' ? COLL_CATALOG_TASKS : type === 'badge' ? COLL_CATALOG_BADGES : COLL_CATALOG_PENALTIES;
  await deleteDoc(doc(db, coll, itemId));
};

// Transactions & Batch Operations
export const firestoreAddTransaction = async (uid: string, tx: Transaction) => {
  await setDoc(doc(db, COLL_TRANSACTIONS, tx.id), { ...tx, ownerId: uid });
};

// Atomic Bonus/Task/Penalty
export const firestoreGiveRewardAtomic = async (uid: string, tx: Transaction) => {
  await runTransaction(db, async (transaction) => {
    // 1. Get Student
    const sRef = doc(db, COLL_STUDENTS, tx.studentId);
    const sDoc = await transaction.get(sRef);
    if (!sDoc.exists()) throw new Error("Student not found");

    const sData = sDoc.data() as Student;
    const currentTotal = sData.lxcTotal[tx.bimester] || 0;
    const newTotal = currentTotal + tx.amount;

    // 2. Update Student
    transaction.update(sRef, {
      [`lxcTotal.${tx.bimester}`]: newTotal
    });

    // 3. Create Transaction
    const txRef = doc(db, COLL_TRANSACTIONS, tx.id);
    transaction.set(txRef, { ...tx, ownerId: uid });
  });
};

export const firestoreDeleteTransaction = async (txId: string) => {
  await runTransaction(db, async (transaction) => {
    const txRef = doc(db, COLL_TRANSACTIONS, txId);
    const txDoc = await transaction.get(txRef);
    if (!txDoc.exists()) return;

    const txData = txDoc.data() as Transaction;
    const sRef = doc(db, COLL_STUDENTS, txData.studentId);
    const sDoc = await transaction.get(sRef);

    if (sDoc.exists()) {
      const sData = sDoc.data() as Student;
      const currentTotal = sData.lxcTotal[txData.bimester] || 0;

      const updates: any = {
        [`lxcTotal.${txData.bimester}`]: currentTotal - txData.amount
      };

      if (txData.type === 'BADGE' && sData.badges) {
        updates.badges = sData.badges.filter(b => b !== txData.description);
      }

      transaction.update(sRef, updates);
    }

    transaction.delete(txRef);
  });
};

export const firestoreUpdateTransaction = async (newTx: Transaction) => {
  await runTransaction(db, async (transaction) => {
    const txRef = doc(db, COLL_TRANSACTIONS, newTx.id);
    const txDoc = await transaction.get(txRef);
    if (!txDoc.exists()) throw new Error("Transaction does not exist");

    const oldTx = txDoc.data() as Transaction;
    const diff = newTx.amount - oldTx.amount;

    const sRef = doc(db, COLL_STUDENTS, newTx.studentId);
    const sDoc = await transaction.get(sRef);

    if (sDoc.exists()) {
      const sData = sDoc.data() as Student;
      const currentTotal = sData.lxcTotal[oldTx.bimester] || 0;
      transaction.update(sRef, {
        [`lxcTotal.${oldTx.bimester}`]: currentTotal + diff
      });
    }

    transaction.update(txRef, { amount: newTx.amount, description: newTx.description });
  });
};

// Batch Import
export const firestoreBatchImportStudents = async (uid: string, students: Student[]) => {
  const batch = writeBatch(db);
  students.forEach(s => {
    const ref = doc(db, COLL_STUDENTS, s.id);
    batch.set(ref, { ...s, ownerId: uid });
  });
  await batch.commit();
};

// --- SYNC ALL TO CLOUD ---
export const firestoreSyncAll = async (uid: string, data: AppData, profile: TeacherProfileData) => {
  const operations: { ref: any, data: any, merge?: boolean }[] = [];

  // Log environment info
  console.log(`[Firestore Sync] Iniciando sincronização no projeto: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}`);

  const userRef = doc(db, COLL_USERS, sanitizeId(uid));
  if (userRef.id) operations.push({ ref: userRef, data: profile, merge: true });

  data.taskCatalog.forEach(t => {
    const sId = sanitizeId(t.id);
    if (!sId) return;
    if (t.ownerId === uid || !t.ownerId) {
      operations.push({ ref: doc(db, COLL_CATALOG_TASKS, sId), data: { ...t, id: sId, ownerId: uid } });
    }
  });

  data.badgesCatalog.forEach(b => {
    const sId = sanitizeId(b.id);
    if (!sId) return;
    if (b.ownerId === uid || !b.ownerId) {
      operations.push({ ref: doc(db, COLL_CATALOG_BADGES, sId), data: { ...b, id: sId, ownerId: uid } });
    }
  });

  data.penaltiesCatalog.forEach(p => {
    const sId = sanitizeId(p.id);
    if (!sId) return;
    if (p.ownerId === uid || !p.ownerId) {
      operations.push({ ref: doc(db, COLL_CATALOG_PENALTIES, sId), data: { ...p, id: sId, ownerId: uid } });
    }
  });

  data.transactions.forEach(tx => {
    const sId = sanitizeId(tx.id);
    if (!sId) return;
    if (tx.ownerId === uid || !tx.ownerId) {
      operations.push({ ref: doc(db, COLL_TRANSACTIONS, sId), data: { ...tx, id: sId, ownerId: uid } });
    }
  });

  data.schools.forEach(s => {
    const sSchoolId = sanitizeId(s.id);
    if (!sSchoolId) return;
    // Skip shared schools — they belong to other teachers
    if (s.shared || (s.ownerId && s.ownerId !== uid)) return;

    const { classes, ...schoolData } = s;
    operations.push({ ref: doc(db, COLL_SCHOOLS, sSchoolId), data: { ...schoolData, id: sSchoolId, ownerId: uid } });

    s.classes?.forEach(c => {
      const sClassId = sanitizeId(c.id);
      if (!sClassId) return;
      if (c.shared || (c.ownerId && c.ownerId !== uid)) return; // Skip shared classes

      if (!c.seed) c.seed = generateSeed();
      const { students, shared: _shared, ...classData } = c;
      operations.push({ ref: doc(db, COLL_CLASSES, sClassId), data: { ...classData, id: sClassId, ownerId: uid } });

      c.students?.forEach(st => {
        const sStudentId = sanitizeId(st.id);
        if (!sStudentId) return;
        operations.push({ ref: doc(db, COLL_STUDENTS, sStudentId), data: { ...st, id: sStudentId, ownerId: uid } });
      });
    });
  });

  const chunkSize = 100;
  console.log(`[Firestore Sync] Iniciando sincronização de ${operations.length} registros...`);

  for (let i = 0; i < operations.length; i += chunkSize) {
    const chunk = operations.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach(op => {
      if (op.merge) batch.set(op.ref, op.data, { merge: true });
      else batch.set(op.ref, op.data);
    });

    try {
      await batch.commit();
      console.log(`[Firestore Sync] Lote ${Math.floor(i / chunkSize) + 1} concluído.`);
    } catch (err: any) {
      console.error(`[Firestore Sync] Erro no lote ${Math.floor(i / chunkSize) + 1}:`, err);
      throw err;
    }
  }
  console.log("[Firestore Sync] Sincronização finalizada com sucesso.");
};

// ─── PROJETO INTEGRADO — Colaboração Multi-Professor ─────────────────────────

import { arrayUnion, arrayRemove } from 'firebase/firestore';

/**
 * Busca uma turma pelo código seed.
 * Classes são lidas por qualquer usuário autenticado (regra do Firestore).
 */
export const firestoreLookupBySeed = async (seed: string): Promise<(ClassGroup & { ownerId: string }) | null> => {
  const snap = await getDocs(query(collection(db, COLL_CLASSES), where('seed', '==', seed.trim().toUpperCase())));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...d.data(), id: d.id } as ClassGroup & { ownerId: string };
};

/**
 * Carrega alunos e transações de uma turma compartilhada (sem catálogo).
 */
export const firestoreReadSharedClassFull = async (classId: string) => {
  const [studentsSnap, txSnap] = await Promise.all([
    getDocs(query(collection(db, COLL_STUDENTS), where('classId', '==', classId))),
    getDocs(query(collection(db, COLL_TRANSACTIONS), where('classId', '==', classId))),
  ]);

  const students: Student[] = studentsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Student));
  const transactions: Transaction[] = txSnap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
    } as Transaction;
  });

  return { students, transactions };
};

/**
 * Busca itens de catálogo explicitamente marcados como shared=true de um dono específico.
 * Chamado UMA vez por ownerId para evitar duplicação.
 */
export const firestoreFetchSharedCatalog = async (ownerId: string) => {
  const [tasksSnap, badgesSnap, penaltiesSnap] = await Promise.all([
    getDocs(query(collection(db, COLL_CATALOG_TASKS), where('ownerId', '==', ownerId), where('shared', '==', true))),
    getDocs(query(collection(db, COLL_CATALOG_BADGES), where('ownerId', '==', ownerId), where('shared', '==', true))),
    getDocs(query(collection(db, COLL_CATALOG_PENALTIES), where('ownerId', '==', ownerId), where('shared', '==', true))),
  ]);

  return {
    tasks: tasksSnap.docs.map(d => ({ ...d.data(), id: d.id } as TaskDefinition)),
    badges: badgesSnap.docs.map(d => ({ ...d.data(), id: d.id } as Badge)),
    penalties: penaltiesSnap.docs.map(d => ({ ...d.data(), id: d.id } as PenaltyDefinition)),
  };
};

/**
 * Adiciona o uid do colaborador ao array sharedWith da turma.
 */
export const firestoreJoinClass = async (uid: string, classId: string): Promise<void> => {
  await updateDoc(doc(db, COLL_CLASSES, classId), { sharedWith: arrayUnion(uid) });
};

/**
 * Remove o uid do colaborador do array sharedWith (saída voluntária).
 */
export const firestoreLeaveClass = async (uid: string, classId: string): Promise<void> => {
  await updateDoc(doc(db, COLL_CLASSES, classId), { sharedWith: arrayRemove(uid) });
};

/**
 * Remove um colaborador específico do array sharedWith (usado pelo dono).
 */
export const firestoreRemoveCollaborator = async (collaboratorUid: string, classId: string): Promise<void> => {
  await updateDoc(doc(db, COLL_CLASSES, classId), { sharedWith: arrayRemove(collaboratorUid) });
};

/**
 * Lista turmas onde o uid aparece no array sharedWith.
 */
export const firestoreFetchMySharedClasses = async (uid: string): Promise<(ClassGroup & { ownerId: string })[]> => {
  const snap = await getDocs(query(collection(db, COLL_CLASSES), where('sharedWith', 'array-contains', uid)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as ClassGroup & { ownerId: string }));
};

/**
 * Busca transações para uma lista de classes em lotes.
 */
export const firestoreFetchTransactionsByClasses = async (classIds: string[]): Promise<Transaction[]> => {
  if (classIds.length === 0) return [];

  const allTransactions: Transaction[] = [];
  const chunkSize = 10; // Firestore queries support up to 30 'in', but 10 is safer for stability

  for (let i = 0; i < classIds.length; i += chunkSize) {
    const chunk = classIds.slice(i, i + chunkSize);
    const q = query(collection(db, COLL_TRANSACTIONS), where('classId', 'in', chunk));
    const snap = await getDocs(q);

    snap.forEach(d => {
      const data = d.data();
      allTransactions.push({
        ...data,
        id: d.id,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
      } as Transaction);
    });
  }

  return allTransactions;
};

/**
 * Migração Legada: Tenta encontrar transações sem classId e vinculá-las baseado no aluno.
 * Retorna o número de registros migrados.
 */
export const firestoreMigrateLegacyTransactions = async (uid: string, data: AppData): Promise<number> => {
  const txSnap = await getDocs(query(collection(db, COLL_TRANSACTIONS), where("ownerId", "==", uid)));
  const legacyTxs = txSnap.docs.filter(d => !d.data().classId);

  if (legacyTxs.length === 0) return 0;

  // Criar mapa StudentId -> ClassId
  const studentMap: Record<string, string> = {};
  data.schools.forEach(s => {
    s.classes?.forEach(c => {
      c.students?.forEach(st => {
        studentMap[st.id] = c.id;
      });
    });
  });

  const batch = writeBatch(db);
  let count = 0;

  legacyTxs.forEach(d => {
    const studentId = d.data().studentId;
    const classId = studentMap[studentId];
    if (classId) {
      batch.update(d.ref, { classId });
      count++;
    }
  });

  if (count > 0) await batch.commit();
  return count;
};
