import { db } from './firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    getDocs,
    serverTimestamp,
    writeBatch,
} from 'firebase/firestore';
import type { LicenseEntry, LicenseKeyType } from '../types';

// ─── Limits ────────────────────────────────────────────────────────────────
export const MASTER_KEY_LIMIT = 3;
export const TEST_KEY_LIMIT = 5;

// Per master key: 4 schools + 20 classes
export const SCHOOLS_PER_MASTER = 4;
export const CLASSES_PER_MASTER = 20;

// Test key 1: 1 school + 1 class  |  Test keys 2-5: +1 class each (no new school)
export const SCHOOLS_PER_TEST_FIRST = 1;
export const CLASSES_PER_TEST_ADDITIONAL = 1;

// ─── Deletion budgets ───────────────────────────────────────────────────────
/** Max times a test-key user may soft-delete their one school and recreate it */
export const TEST_SCHOOL_DELETE_BUDGET = 5;
/** Max times a master-key user may soft-delete EACH school slot and recreate it */
export const MASTER_SCHOOL_DELETE_BUDGET_PER_SLOT = 7;

/**
 * Derives effective resource limits from the teacher's profile.
 */
export interface TeacherLimits {
    maxSchools: number;
    maxClasses: number; // total across all owned schools
    maxTasks: number;
    maxBadges: number;
    maxPenalties: number;
    isAdmin: boolean;
    hasAnyKey: boolean;
}

export interface SchoolDeletionPolicy {
    /** Whether the deletion should be allowed at all */
    allowed: boolean;
    /** Whether to show a caution warning (2nd deletion onwards) */
    showWarning: boolean;
    /** Human-readable message to display to the user */
    message: string;
    /** How many deletions the user has remaining after this one, if allowed */
    remainingAfter: number;
}

/**
 * Returns the deletion policy for the user's current school delete action.
 * @param profile  The teacher's profile
 * @param ownNonDeletedSchoolCount  Count of their own non-deleted schools visible in the UI
 */
export const computeSchoolDeletionPolicy = (profile: {
    role?: string;
    masterKeysCount?: number;
    testKeysCount?: number;
    testSchoolDeletions?: number;
    masterSchoolDeletions?: number;
}, ownNonDeletedSchoolCount: number): SchoolDeletionPolicy => {
    // Admins have no restrictions
    if (profile.role === 'admin') {
        return { allowed: true, showWarning: false, message: '', remainingAfter: Infinity };
    }

    const masterCount = profile.masterKeysCount ?? 0;
    const testCount = profile.testKeysCount ?? 0;

    // No license at all — cannot delete structural items either (shouldn't happen but guard it)
    if (masterCount === 0 && testCount === 0) {
        return { allowed: true, showWarning: false, message: '', remainingAfter: 0 };
    }

    if (masterCount > 0) {
        // Master key logic: up to 7 deletions per school slot (4 slots per key)
        const totalBudget = masterCount * SCHOOLS_PER_MASTER * MASTER_SCHOOL_DELETE_BUDGET_PER_SLOT;
        const used = profile.masterSchoolDeletions ?? 0;
        const maxSchools = masterCount * SCHOOLS_PER_MASTER;
        const isLastSchool = ownNonDeletedSchoolCount <= 1;
        const budgetExhausted = used >= totalBudget;

        // Block: no more budget AND they'd delete their only school
        if (budgetExhausted && isLastSchool) {
            return {
                allowed: false,
                showWarning: false,
                message: `Você atingiu o limite de ${MASTER_SCHOOL_DELETE_BUDGET_PER_SLOT} exclusões por slot de escola (${totalBudget} no total). Renomeie a escola atual se precisar mudar de nome.`,
                remainingAfter: 0,
            };
        }

        const remainingAfter = Math.max(0, totalBudget - used - 1);
        const isSecondOrLater = used >= 1;
        const nearLimit = remainingAfter <= 2;

        return {
            allowed: true,
            showWarning: isSecondOrLater,
            message: isSecondOrLater
                ? nearLimit
                    ? `⚠️ Atenção: você tem apenas ${remainingAfter} exclusão(ões) restante(s) no seu orçamento de escola com chave mestre. Considere renomear a escola em vez de apagá-la.`
                    : `Dica: você pode excluir e recriar escolas até ${MASTER_SCHOOL_DELETE_BUDGET_PER_SLOT} vezes por slot (${remainingAfter} restante(s) para este slot). Considere renomear se só precisa mudar o nome.`
                : '',
            remainingAfter,
        };
    }

    // Test key only
    const budget = TEST_SCHOOL_DELETE_BUDGET;
    const used = profile.testSchoolDeletions ?? 0;
    const isLastSchool = ownNonDeletedSchoolCount <= 1;
    const budgetExhausted = used >= budget;

    // Block: no budget left AND it's their only school
    if (budgetExhausted && isLastSchool) {
        return {
            allowed: false,
            showWarning: false,
            message: `Você já atingiu o limite de ${budget} exclusões de escola para contas de teste. Renomeie a escola atual se precisar trocar o nome.`,
            remainingAfter: 0,
        };
    }

    const remainingAfter = Math.max(0, budget - used - 1);
    const isSecondOrLater = used >= 1;
    const nearLimit = remainingAfter <= 1;

    return {
        allowed: true,
        showWarning: isSecondOrLater,
        message: isSecondOrLater
            ? nearLimit
                ? `⚠️ Atenção: você tem apenas ${remainingAfter} exclusão(ões) de escola restante(s) na licença de teste. Se excluir mais, não poderá recriar a escola. Renomeie em vez de apagar!`
                : `Lembrete: contas de teste podem excluir e recriar a escola até ${budget} vezes no total (${remainingAfter} restante(s)). Renomeie a escola se só precisa mudar o nome.`
            : '',
        remainingAfter,
    };
};


export const computeTeacherLimits = (profile: {
    role?: string;
    masterKeysCount?: number;
    testKeysCount?: number;
    licenseKeys?: LicenseEntry[];
}): TeacherLimits => {
    if (profile.role === 'admin') {
        return { maxSchools: Infinity, maxClasses: Infinity, maxTasks: Infinity, maxBadges: Infinity, maxPenalties: Infinity, isAdmin: true, hasAnyKey: true };
    }

    const masterCount = profile.masterKeysCount ?? 0;
    const testCount = profile.testKeysCount ?? 0;
    const now = new Date();

    // Count only non-expired test keys
    const validTestKeys = (profile.licenseKeys ?? []).filter(
        k => k.type === 'test' && (!k.expiresAt || new Date(k.expiresAt) > now)
    );
    const activeTestCount = Math.min(validTestKeys.length, testCount);

    const hasAnyKey = masterCount > 0 || activeTestCount > 0;

    if (!hasAnyKey) {
        // Free tier: no school/class creation, limited catalog
        return { maxSchools: 0, maxClasses: 0, maxTasks: 200, maxBadges: 20, maxPenalties: 5, isAdmin: false, hasAnyKey: false };
    }

    let maxSchools = masterCount * SCHOOLS_PER_MASTER;
    let maxClasses = masterCount * CLASSES_PER_MASTER;

    if (activeTestCount >= 1) {
        maxSchools += SCHOOLS_PER_TEST_FIRST;
        // Each subsequent test key after the 1st adds only 1 extra class
        maxClasses += 1 + (activeTestCount - 1) * CLASSES_PER_TEST_ADDITIONAL;
    }

    return {
        maxSchools,
        maxClasses,
        maxTasks: Infinity,
        maxBadges: Infinity,
        maxPenalties: Infinity,
        isAdmin: false,
        hasAnyKey: true,
    };
};

