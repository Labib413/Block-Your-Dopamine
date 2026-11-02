import { 
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
  app,
  auth,
  db as sharedDb,
  signInWithGoogle,
  signInWithFirebaseEmail,
  signUpWithFirebaseEmail,
  sendFirebasePasswordReset,
  signOutFirebase,
  onAuthStateChanged,
  FirebaseUser
} from './lib/firebase';

export {
  app,
  auth,
  signInWithGoogle,
  signInWithFirebaseEmail,
  signUpWithFirebaseEmail,
  sendFirebasePasswordReset,
  signOutFirebase
};

// Custom database identifier for the Chrome Extension & Distraction Guard
export const CUSTOM_DATABASE_ID = "block-your-dopamine-testing";

// Unified Firestore instance ("block-your-dopamine-testing")
export const db: Firestore = sharedDb;
export const standardDb: Firestore = sharedDb;

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
