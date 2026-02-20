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
  console.log("Fetching data for teacher:", uid);

  // 1. Schools
  const qSchools = query(collection(db, COLL_SCHOOLS), where("ownerId", "==", uid));
  const schoolsSnap = await getDocs(qSchools);
  const schools: School[] = schoolsSnap.docs.map(d => ({ ...d.data(), id: d.id, classes: [] } as School));

  // 2. Classes
  const qClasses = query(collection(db, COLL_CLASSES), where("ownerId", "==", uid));
  const classesSnap = await getDocs(qClasses);
  classesSnap.forEach(d => {
    const c = { ...d.data(), id: d.id, students: [] } as ClassGroup;
    const parentSchool = schools.find(s => s.id === c.schoolId);
    if (parentSchool) {
      if (!parentSchool.classes) parentSchool.classes = [];
      parentSchool.classes.push(c);
    }
  });

  // 3. Students
  const qStudents = query(collection(db, COLL_STUDENTS), where("ownerId", "==", uid));
  const studentsSnap = await getDocs(qStudents);
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

  // 4. Catalog
  const qTasks = query(collection(db, COLL_CATALOG_TASKS), where("ownerId", "==", uid));
  const tasks = (await getDocs(qTasks)).docs.map(d => ({ ...d.data(), id: d.id } as TaskDefinition));

  const qBadges = query(collection(db, COLL_CATALOG_BADGES), where("ownerId", "==", uid));
  const badges = (await getDocs(qBadges)).docs.map(d => ({ ...d.data(), id: d.id } as Badge));

  const qPenalties = query(collection(db, COLL_CATALOG_PENALTIES), where("ownerId", "==", uid));
  const penalties = (await getDocs(qPenalties)).docs.map(d => ({ ...d.data(), id: d.id } as PenaltyDefinition));

  // 5. Transactions
  const qTx = query(collection(db, COLL_TRANSACTIONS), where("ownerId", "==", uid));
  const transactions = (await getDocs(qTx)).docs.map(d => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
    } as Transaction;
  });

  return {
    schools,
    taskCatalog: tasks,
    badgesCatalog: badges,
    penaltiesCatalog: penalties,
    transactions
  };
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
    // 1. Get Transaction
    const txRef = doc(db, COLL_TRANSACTIONS, txId);
    const txDoc = await transaction.get(txRef);
    if (!txDoc.exists()) return; // Already deleted or error

    const txData = txDoc.data() as Transaction;

    // 2. Get Student
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

    // 3. Delete Transaction
    transaction.delete(txRef);
  });
};

export const firestoreUpdateTransaction = async (newTx: Transaction) => {
  await runTransaction(db, async (transaction) => {
    // 1. Get Old Transaction
    const txRef = doc(db, COLL_TRANSACTIONS, newTx.id);
    const txDoc = await transaction.get(txRef);
    if (!txDoc.exists()) throw new Error("Transaction does not exist");

    const oldTx = txDoc.data() as Transaction;
    const diff = newTx.amount - oldTx.amount;

    // 2. Get Student
    const sRef = doc(db, COLL_STUDENTS, newTx.studentId);
    const sDoc = await transaction.get(sRef);

    if (sDoc.exists()) {
      const sData = sDoc.data() as Student;
      // We use oldTx.bimester just in case bimester changed (unlikely in this UI but good practice)
      // Actually only amount editing is supported in UI.
      const currentTotal = sData.lxcTotal[oldTx.bimester] || 0;
      transaction.update(sRef, {
        [`lxcTotal.${oldTx.bimester}`]: currentTotal + diff
      });
    }

    // 3. Update Transaction
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

  // Profile
  operations.push({ ref: doc(db, COLL_USERS, uid), data: profile, merge: true });

  // Catalog
  data.taskCatalog.forEach(t => operations.push({ ref: doc(db, COLL_CATALOG_TASKS, t.id), data: { ...t, ownerId: uid } }));
  data.badgesCatalog.forEach(b => operations.push({ ref: doc(db, COLL_CATALOG_BADGES, b.id), data: { ...b, ownerId: uid } }));
  data.penaltiesCatalog.forEach(p => operations.push({ ref: doc(db, COLL_CATALOG_PENALTIES, p.id), data: { ...p, ownerId: uid } }));

  // Transactions
  data.transactions.forEach(tx => operations.push({ ref: doc(db, COLL_TRANSACTIONS, tx.id), data: { ...tx, ownerId: uid } }));

  // Schools, Classes, Students
  data.schools.forEach(s => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { classes, ...schoolData } = s;
    operations.push({ ref: doc(db, COLL_SCHOOLS, s.id), data: { ...schoolData, ownerId: uid } });

    s.classes?.forEach(c => {
      // Auto-generate seed if not present
      if (!c.seed) {
        c.seed = Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { students, ...classData } = c;
      operations.push({ ref: doc(db, COLL_CLASSES, c.id), data: { ...classData, ownerId: uid } });

      c.students?.forEach(st => {
        operations.push({ ref: doc(db, COLL_STUDENTS, st.id), data: { ...st, ownerId: uid } });
      });
    });
  });

  // Execute in batches (Firestore limit is 500 operations per batch)
  const chunkSize = 400;
  for (let i = 0; i < operations.length; i += chunkSize) {
    const chunk = operations.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(op => {
      if (op.merge) {
        batch.set(op.ref, op.data, { merge: true });
      } else {
        batch.set(op.ref, op.data);
      }
    });
    await batch.commit();
  }
};
