
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    AuthError
} from "firebase/auth";
import { auth } from "./firebase";

// --- TIPOS ---
export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

// --- GOOGLE PROVIDER ---
const googleProvider = new GoogleAuthProvider();

// --- FUNÇÕES DE AUTENTICAÇÃO ---

export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        return userCredential.user;
    } catch (error: any) {
        console.error("Erro no login:", error);
        throw mapAuthError(error);
    }
};

export const registerWithEmail = async (email: string, pass: string): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        return userCredential.user;
    } catch (error: any) {
        console.error("Erro no registro:", error);
        throw mapAuthError(error);
    }
};

export const loginWithGoogle = async (): Promise<User> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error: any) {
        console.error("Erro no login Google:", error);
        throw mapAuthError(error);
    }
};

export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro no logout:", error);
    }
};

// --- HELPER DE ERROS ---
const mapAuthError = (error: AuthError): Error => {
    const code = error.code;
    let message = "Ocorreu um erro na autenticação.";

    switch (code) {
        case 'auth/invalid-email':
            message = "O e-mail fornecido é inválido.";
            break;
        case 'auth/user-disabled':
            message = "Este usuário foi desativado.";
            break;
        case 'auth/user-not-found':
            message = "Usuário não encontrado.";
            break;
        case 'auth/wrong-password':
            message = "Senha incorreta.";
            break;
        case 'auth/popup-closed-by-user':
            message = "O login com Google foi cancelado.";
            break;
        case 'auth/invalid-credential':
            message = "Credenciais inválidas. Tente novamente.";
            break;
    }

    return new Error(message);
};

// --- LISTENER (HOOK) ---
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (user) => {
        callback(user);
    });
};
