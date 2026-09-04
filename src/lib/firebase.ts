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
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Unsubscribe
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

export { onAuthStateChanged, onSnapshot, doc, collection, getDoc, getDocs, setDoc, deleteDoc, query, where };
export type { FirebaseUser };

// Mirror sync item to Firestore
export async function syncItemToFirestore(userId: string, table: string, data: any, type: string = 'upsert') {
  if (!userId) return;
  try {
    const cleanId = String(data.id || data.session_id || data.log_id || data.task_id || data.website_id || data.user_id || 'default').replace(/[^a-zA-Z0-9_\-]/g, '_');
    
    let subcollection = '';
    if (table === 'sessions') subcollection = 'sessions';
    else if (table === 'focus_logs') subcollection = 'focus_logs';
    else if (table === 'user_streaks') subcollection = 'streaks';
    else if (table === 'user_preferences') subcollection = 'preferences';
    else if (table === 'guarded_websites') subcollection = 'guarded_websites';
    else if (table === 'planner_tasks') subcollection = 'planner_tasks';
    else if (table === 'health_logs') subcollection = 'health_logs';
    else if (table === 'academic_progress') subcollection = 'academic_progress';
    else if (table === 'academic_chapters') subcollection = 'academic_chapters';
    else if (table === 'academic_settings') subcollection = 'academic_settings';
    else if (table === 'academic_routines') subcollection = 'academic_routines';
    else if (table === 'mood_entries') subcollection = 'mood_entries';
    else if (table === 'resources') subcollection = 'resources';
    else if (table === 'macro_data') subcollection = 'macro_data';
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

/**
 * Fetch an entire subcollection from Firestore for a given user
 */
export async function fetchFirestoreCollection(userId: string, subcollection: string): Promise<any[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, subcollection);
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn(`[Firestore] Fetch error for ${subcollection}:`, err);
    return [];
  }
}

/**
 * Fetch a single document from Firestore (user profile or subcollection doc)
 */
export async function fetchFirestoreDoc(userId: string, subcollection?: string, docId?: string): Promise<any | null> {
  if (!userId) return null;
  try {
    const docRef = subcollection && docId 
      ? doc(db, 'users', userId, subcollection, docId)
      : doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.warn(`[Firestore] Fetch doc error for ${subcollection || 'user'}:`, err);
    return null;
  }
}

/**
 * Realtime multi-browser/device Firestore subscriber
 */
export function subscribeToFirestoreUserData(
  userId: string,
  callbacks: {
    onProfile?: (data: any) => void;
    onAcademicChapters?: (chapters: any[]) => void;
    onAcademicSettings?: (settings: any) => void;
    onAcademicProgress?: (progress: any[]) => void;
    onPlannerTasks?: (tasks: any[]) => void;
    onHealthLogs?: (logs: any[]) => void;
    onGuardedWebsites?: (websites: any[]) => void;
    onAcademicRoutines?: (routines: any[]) => void;
    onStreaks?: (streak: any) => void;
    onPreferences?: (pref: any) => void;
    onFocusLogs?: (logs: any[]) => void;
    onSessions?: (sessions: any[]) => void;
  }
): () => void {
  if (!userId) return () => {};

  const unsubs: Unsubscribe[] = [];

  try {
    // 1. Root Profile Listener
    const userDocRef = doc(db, 'users', userId);
    unsubs.push(
      onSnapshot(userDocRef, (snap) => {
        if (snap.exists() && callbacks.onProfile) {
          callbacks.onProfile(snap.data());
        }
      }, (err) => console.warn('[Firestore] Realtime profile listener error:', err))
    );

    // 2. Academic Chapters Listener
    const chaptersCol = collection(db, 'users', userId, 'academic_chapters');
    unsubs.push(
      onSnapshot(chaptersCol, (snap) => {
        if (callbacks.onAcademicChapters) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          callbacks.onAcademicChapters(list);
        }
      }, (err) => console.warn('[Firestore] Realtime chapters listener error:', err))
    );

    // 3. Academic Settings Listener
    const settingsCol = collection(db, 'users', userId, 'academic_settings');
    unsubs.push(
      onSnapshot(settingsCol, (snap) => {
        if (callbacks.onAcademicSettings && !snap.empty) {
          callbacks.onAcademicSettings(snap.docs[0].data());
        }
      }, (err) => console.warn('[Firestore] Realtime academic settings listener error:', err))
    );

    // 4. Academic Progress Listener
    const progCol = collection(db, 'users', userId, 'academic_progress');
    unsubs.push(
      onSnapshot(progCol, (snap) => {
        if (callbacks.onAcademicProgress) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          callbacks.onAcademicProgress(list);
        }
      }, (err) => console.warn('[Firestore] Realtime progress listener error:', err))
    );

    // 5. Planner Tasks Listener
    const tasksCol = collection(db, 'users', userId, 'planner_tasks');
    unsubs.push(
      onSnapshot(tasksCol, (snap) => {
        if (callbacks.onPlannerTasks) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          callbacks.onPlannerTasks(list);
        }
      }, (err) => console.warn('[Firestore] Realtime tasks listener error:', err))
    );

    // 6. Health Logs Listener
    const healthCol = collection(db, 'users', userId, 'health_logs');
    unsubs.push(
      onSnapshot(healthCol, (snap) => {
        if (callbacks.onHealthLogs) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          callbacks.onHealthLogs(list);
        }
      }, (err) => console.warn('[Firestore] Realtime health logs listener error:', err))
    );

    // 7. Guarded Websites Listener
    const websitesCol = collection(db, 'users', userId, 'guarded_websites');
    unsubs.push(
      onSnapshot(websitesCol, (snap) => {
        if (callbacks.onGuardedWebsites) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          callbacks.onGuardedWebsites(list);
        }
      }, (err) => console.warn('[Firestore] Realtime guarded websites listener error:', err))
    );

    // 8. Academic Routines Listener
    const routinesCol = collection(db, 'users', userId, 'academic_routines');
    unsubs.push(
      onSnapshot(routinesCol, (snap) => {
        if (callbacks.onAcademicRoutines) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          callbacks.onAcademicRoutines(list);
        }
      }, (err) => console.warn('[Firestore] Realtime routines listener error:', err))
    );

    // 9. Streaks Listener
    const streaksCol = collection(db, 'users', userId, 'streaks');
    unsubs.push(
      onSnapshot(streaksCol, (snap) => {
        if (callbacks.onStreaks && !snap.empty) {
          callbacks.onStreaks(snap.docs[0].data());
        }
      }, (err) => console.warn('[Firestore] Realtime streaks listener error:', err))
    );

    // 10. Preferences Listener
    const prefsCol = collection(db, 'users', userId, 'preferences');
    unsubs.push(
      onSnapshot(prefsCol, (snap) => {
        if (callbacks.onPreferences && !snap.empty) {
          callbacks.onPreferences(snap.docs[0].data());
        }
      }, (err) => console.warn('[Firestore] Realtime preferences listener error:', err))
    );

    // 11. Focus Logs Listener
    const focusLogsCol = collection(db, 'users', userId, 'focus_logs');
    unsubs.push(
      onSnapshot(focusLogsCol, (snap) => {
        if (callbacks.onFocusLogs) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          callbacks.onFocusLogs(list);
        }
      }, (err) => console.warn('[Firestore] Realtime focus_logs listener error:', err))
    );

    // 12. Sessions Listener
    const sessionsCol = collection(db, 'users', userId, 'sessions');
    unsubs.push(
      onSnapshot(sessionsCol, (snap) => {
        if (callbacks.onSessions) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          callbacks.onSessions(list);
        }
      }, (err) => console.warn('[Firestore] Realtime sessions listener error:', err))
    );
  } catch (e) {
    console.warn('[Firestore] Error attaching realtime listeners:', e);
  }

  return () => {
    unsubs.forEach(unsub => {
      try { unsub(); } catch {}
    });
  };
}


