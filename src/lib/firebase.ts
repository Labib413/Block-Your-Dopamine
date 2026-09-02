import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import localFirebaseConfig from '../../firebase-applet-config.json';

const resolvedConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (localFirebaseConfig as any)?.projectId || "strange-chord-g8chg",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (localFirebaseConfig as any)?.appId || "1:128361356379:web:14b35bce8e0b74e4c7f37e",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (localFirebaseConfig as any)?.apiKey || "AIzaSyDK2dN8WDM5sFCeLGkUwITES3jWChxpNwE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (localFirebaseConfig as any)?.authDomain || "strange-chord-g8chg.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (localFirebaseConfig as any)?.firestoreDatabaseId || "ai-studio-bydblockyourdopa-32c39fe0-3899-42d7-a769-18e607d26b2d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (localFirebaseConfig as any)?.storageBucket || "strange-chord-g8chg.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (localFirebaseConfig as any)?.messagingSenderId || "128361356379",
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || (localFirebaseConfig as any)?.oAuthClientId || "128361356379-7miof413g0nq7n3qq5nm91886shvg6do.apps.googleusercontent.com"
};

// Initialize Firebase App
const app = initializeApp(resolvedConfig);

// Initialize Firestore Database with explicit firestoreDatabaseId
export const db = getFirestore(app, resolvedConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */

// Initialize Authentication
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test Firestore Connection upon app initialization
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("[Firebase] Firestore connection test passed");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("[Firebase] Please check your Firebase configuration: client is offline.");
    } else {
      console.log("[Firebase] Firestore ping completed:", (error as any)?.code || "ok");
    }
  }
}
testConnection();

// Standardized Operation Types
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Authentication
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("[Firebase Auth] Google Sign-In Error:", error);
    throw error;
  }
}

// Sign Out
export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("[Firebase Auth] Sign-Out Error:", error);
    throw error;
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };

// Mirror sync item to Firestore
export async function syncItemToFirestore(userId: string, table: string, data: any, type: string = 'upsert') {
  if (!userId) return;
  try {
    const cleanId = String(data.id || data.session_id || data.log_id || data.task_id || data.website_id || 'default').replace(/[^a-zA-Z0-9_\-]/g, '_');
    
    let subcollection = '';
    if (table === 'sessions') subcollection = 'sessions';
    else if (table === 'focus_logs') subcollection = 'focus_logs';
    else if (table === 'user_streaks') subcollection = 'streaks';
    else if (table === 'user_preferences') subcollection = 'preferences';
    else if (table === 'guarded_websites') subcollection = 'guarded_websites';
    else if (table === 'planner_tasks') subcollection = 'planner_tasks';
    else if (table === 'health_logs') subcollection = 'health_logs';
    else if (table === 'academic_progress') subcollection = 'academic_progress';
    else if (table === 'profiles') {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { ...data, userId }, { merge: true });
      return;
    }

    if (!subcollection) return;

    const docRef = doc(db, 'users', userId, subcollection, cleanId);
    if (type === 'delete') {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, { ...data, userId }, { merge: true });
    }
  } catch (err) {
    console.warn(`[Firestore sync] ${table}:`, err);
  }
}

