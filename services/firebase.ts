
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";

// Configuração do Firebase fornecida pelo console
const firebaseConfig = {
  apiKey: "AIzaSyAMvNZpvfmne063VHsM8QxhBwApfegTUb0",
  authDomain: "amigo-do-professor.firebaseapp.com",
  projectId: "amigo-do-professor",
  storageBucket: "amigo-do-professor.firebasestorage.app",
  messagingSenderId: "218248723844",
  appId: "1:218248723844:web:67890a31d0e0718aebf1d1",
  measurementId: "G-1QRKBNDH71"
};

// Inicializa o Firebase App
const app = initializeApp(firebaseConfig);

// Inicializa o Analytics de forma segura
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("Firebase Analytics falhou ao carregar (possivelmente bloqueador de anúncios).", e);
  }
}

// Inicializa o Firestore (Banco de Dados)
// A inicialização direta aqui é segura agora que o importmap foi corrigido.
const db = getFirestore(app);

export { app, analytics, db };
