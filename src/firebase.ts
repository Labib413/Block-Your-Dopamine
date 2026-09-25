import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  collection, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import localFirebaseConfig from '../firebase-applet-config.json';

// Resolve configuration safely from environment or local config
const resolvedConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (localFirebaseConfig as any)?.projectId || "byd-block-your-dopamine",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (localFirebaseConfig as any)?.appId || "1:745556836846:web:78f106f621f631cdfd4eff",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (localFirebaseConfig as any)?.apiKey || "AIzaSyAKXUQRtdmZcF603nYAYhD_7qII75I_SWE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (localFirebaseConfig as any)?.authDomain || "byd-block-your-dopamine.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (localFirebaseConfig as any)?.firestoreDatabaseId || "(default)",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (localFirebaseConfig as any)?.storageBucket || "byd-block-your-dopamine.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (localFirebaseConfig as any)?.messagingSenderId || "745556836846",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (localFirebaseConfig as any)?.measurementId || "G-P4LJ3HDY7G"
};

// Initialize or retrieve existing Firebase App instance
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(resolvedConfig);

// Standard/Default Firestore instance
export const standardDb: Firestore = getFirestore(app);

// Custom database identifier for the Chrome Extension & Distraction Guard
export const CUSTOM_DATABASE_ID = "block-your-dopamine-testing";

/**
 * Cleanly handle custom database initialization alongside standard Firestore initialization.
 * Initializes with "block-your-dopamine-testing", providing safe fallback to standardDb if needed.
 */
function initCustomFirestore(): Firestore {
  try {
    const customInstance = getFirestore(app, CUSTOM_DATABASE_ID);
    return customInstance;
  } catch (error) {
    console.warn(
      `[Firebase] Could not initialize custom database "${CUSTOM_DATABASE_ID}". Falling back to standard Firestore:`,
      error
    );
    return standardDb;
  }
}

// Primary export: db initialized with the custom database ID "block-your-dopamine-testing"
export const db: Firestore = initCustomFirestore();

// Initialize Authentication
export const auth: Auth = getAuth(app);

// Google Auth Provider setup
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Sign in with Google Popup
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("[Firebase Auth] Google Sign-In Error:", error);
    throw error;
  }
}

// Sign In with Email & Password via Firebase Auth
export async function signInWithFirebaseEmail(email: string, password: string): Promise<FirebaseUser> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (error) {
    console.error("[Firebase Auth] Email Sign-In Error:", error);
    throw error;
  }
}

// Sign Up / Create Account with Email & Password via Firebase Auth
export async function signUpWithFirebaseEmail(email: string, password: string, fullName?: string): Promise<FirebaseUser> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName && cred.user) {
      try {
        await updateProfile(cred.user, { displayName: fullName });
      } catch (profileErr) {
        console.warn("[Firebase Auth] Failed to update displayName:", profileErr);
      }
    }
    return cred.user;
  } catch (error) {
    console.error("[Firebase Auth] Email Sign-Up Error:", error);
    throw error;
  }
}

// Password Reset via Firebase Auth
export async function sendFirebasePasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("[Firebase Auth] Password Reset Error:", error);
    throw error;
  }
}

// Sign Out helper
export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("[Firebase Auth] Sign-Out Error:", error);
    throw error;
  }
}

// Standardized Operation Types & Error handling
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

// Re-export common Firestore APIs for consumers
export {
  doc,
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onAuthStateChanged
};
export type { FirebaseUser, Unsubscribe };
