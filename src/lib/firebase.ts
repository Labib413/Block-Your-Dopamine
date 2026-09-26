import { initializeApp } from 'firebase/app';
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
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (localFirebaseConfig as any)?.projectId || "byd-block-your-dopamine",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (localFirebaseConfig as any)?.appId || "1:745556836846:web:78f106f621f631cdfd4eff",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (localFirebaseConfig as any)?.apiKey || "AIzaSyAKXUQRtdmZcF603nYAYhD_7qII75I_SWE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (localFirebaseConfig as any)?.authDomain || "byd-block-your-dopamine.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (localFirebaseConfig as any)?.firestoreDatabaseId || "(default)",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (localFirebaseConfig as any)?.storageBucket || "byd-block-your-dopamine.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (localFirebaseConfig as any)?.messagingSenderId || "745556836846",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (localFirebaseConfig as any)?.measurementId || "G-P4LJ3HDY7G"
};

// Initialize Firebase App
const app = initializeApp(resolvedConfig);

// Initialize Firestore Database (handles both custom db name and standard default)
export const db = resolvedConfig.firestoreDatabaseId && resolvedConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, resolvedConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test Firestore Connection quietly upon app initialization
async function testConnection() {
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error) {
    // Silent catch - allows offline and delayed initialization without throwing errors
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
    const rawId = data.id || data.session_id || data.reportId || data.report_id || data.log_id || data.task_id || data.website_id || (table === 'sessions' ? `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` : data.user_id || 'default');
    const cleanId = String(rawId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    
    let subcollection = '';
    if (table === 'sessions') subcollection = 'sessions';
    else if (table === 'focus_logs') subcollection = 'focus_logs';
    else if (table === 'session_reports' || table === 'reports') subcollection = 'session_reports';
    else if (table === 'user_streaks') subcollection = 'streaks';
    else if (table === 'user_preferences') subcollection = 'preferences';
    else if (table === 'guarded_websites') subcollection = 'guarded_websites';
    else if (table === 'distraction_events') subcollection = 'distraction_events';
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
      const cleanPayload = { ...data, userId };
      if (cleanPayload.equipped_badges && Array.isArray(cleanPayload.equipped_badges)) {
        cleanPayload.equipped_badges = [
          (typeof cleanPayload.equipped_badges[0] === 'string' ? cleanPayload.equipped_badges[0] : (Array.isArray(cleanPayload.equipped_badges[0]) ? cleanPayload.equipped_badges[0][0] : null)) || null,
          (typeof cleanPayload.equipped_badges[1] === 'string' ? cleanPayload.equipped_badges[1] : (Array.isArray(cleanPayload.equipped_badges[1]) ? cleanPayload.equipped_badges[1][0] : null)) || null,
          (typeof cleanPayload.equipped_badges[2] === 'string' ? cleanPayload.equipped_badges[2] : (Array.isArray(cleanPayload.equipped_badges[2]) ? cleanPayload.equipped_badges[2][0] : null)) || null,
        ];
      }
      if (cleanPayload.badges && Array.isArray(cleanPayload.badges)) {
        cleanPayload.badges = Array.from(new Set(
          cleanPayload.badges
            .flat(2)
            .filter((b: any) => typeof b === 'string' && b.trim().length > 0)
        ));
      }
      await setDoc(userRef, cleanPayload, { merge: true });
      return;
    }

    if (!subcollection) return;

    const docRef = doc(db, 'users', userId, subcollection, cleanId);
    if (type === 'delete') {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, { ...data, userId, updatedAt: new Date().toISOString() }, { merge: true });
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

// ---------------------------------------------------------------------------
// Guilds Database Operations & User Association Logic
// ---------------------------------------------------------------------------

export interface FirestoreGuildMember {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  role: 'leader' | 'officer' | 'member';
  level: number;
  xp: number;
  streak: number;
  detoxScore: number;
  joinedAt: string;
  status?: 'focusing' | 'idle' | 'break';
  currentTask?: string;
}

export interface FirestoreGuild {
  id: string;
  name: string;
  tag: string;
  description: string;
  category: "Engineering" | "Medical" | "Varsity" | "General" | "HSC";
  leaderId: string;
  leaderName: string;
  membersCount: number;
  maxMembers: number;
  level: number;
  rank?: number;
  totalXp: number;
  weeklyGoalHours: number;
  perks: string;
  members?: FirestoreGuildMember[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all guilds from Firestore
 */
export async function fetchGuildsFromFirestore(): Promise<FirestoreGuild[]> {
  try {
    const colRef = collection(db, 'guilds');
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreGuild));
  } catch (err) {
    console.warn('[Firestore] fetchGuildsFromFirestore error:', err);
    return [];
  }
}

/**
 * Subscribe in realtime to all community guilds
 */
export function subscribeToGuilds(callback: (guilds: FirestoreGuild[]) => void): () => void {
  try {
    const colRef = collection(db, 'guilds');
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreGuild));
      callback(list);
    }, (err) => {
      console.warn('[Firestore] subscribeToGuilds error:', err);
    });
    return unsub;
  } catch (err) {
    console.warn('[Firestore] subscribeToGuilds init error:', err);
    return () => {};
  }
}

/**
 * Create a new guild in Firestore and associate creator
 */
export async function createGuildInFirestore(
  guildData: Omit<FirestoreGuild, 'id' | 'createdAt' | 'updatedAt' | 'members'>,
  creator: FirestoreGuildMember
): Promise<FirestoreGuild> {
  const guildId = `guild_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newGuild: FirestoreGuild = {
    ...guildData,
    id: guildId,
    membersCount: 1,
    members: [{ ...creator, role: 'leader', joinedAt: now }],
    createdAt: now,
    updatedAt: now
  };

  try {
    const docRef = doc(db, 'guilds', guildId);
    await setDoc(docRef, newGuild);

    // Associate user in user's profile
    if (creator.userId) {
      await updateUserGuildAssociation(creator.userId, guildId, newGuild.name, newGuild.tag, 'leader');
    }
  } catch (err) {
    console.warn('[Firestore] createGuildInFirestore error:', err);
  }

  return newGuild;
}

/**
 * Associate a user with a guild in database and update guild members list
 */
export async function joinGuildInFirestore(guildId: string, member: FirestoreGuildMember): Promise<void> {
  try {
    const guildRef = doc(db, 'guilds', guildId);
    const snap = await getDoc(guildRef);
    if (!snap.exists()) return;

    const existingGuild = snap.data() as FirestoreGuild;
    const currentMembers = existingGuild.members || [];
    
    // Filter out if already in list to avoid duplicates
    const filteredMembers = currentMembers.filter(m => m.userId !== member.userId);
    const updatedMembers = [...filteredMembers, { ...member, joinedAt: new Date().toISOString() }];

    await setDoc(guildRef, {
      ...existingGuild,
      members: updatedMembers,
      membersCount: updatedMembers.length,
      totalXp: (existingGuild.totalXp || 0) + (member.xp || 500),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Update user profile document in Firestore
    if (member.userId) {
      await updateUserGuildAssociation(member.userId, guildId, existingGuild.name, existingGuild.tag, member.role || 'member');
    }
  } catch (err) {
    console.warn('[Firestore] joinGuildInFirestore error:', err);
  }
}

/**
 * Leave a guild in Firestore and disassociate user
 */
export async function leaveGuildInFirestore(guildId: string, userId: string): Promise<void> {
  try {
    const guildRef = doc(db, 'guilds', guildId);
    const snap = await getDoc(guildRef);
    if (!snap.exists()) return;

    const existingGuild = snap.data() as FirestoreGuild;
    const currentMembers = existingGuild.members || [];
    const updatedMembers = currentMembers.filter(m => m.userId !== userId);

    await setDoc(guildRef, {
      ...existingGuild,
      members: updatedMembers,
      membersCount: Math.max(0, updatedMembers.length),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Clear guild association in user profile
    if (userId) {
      await updateUserGuildAssociation(userId, null, null, null, null);
    }
  } catch (err) {
    console.warn('[Firestore] leaveGuildInFirestore error:', err);
  }
}

/**
 * Update user document in Firestore to persist their guild ID and role
 */
export async function updateUserGuildAssociation(
  userId: string,
  guildId: string | null,
  guildName?: string | null,
  guildTag?: string | null,
  guildRole?: string | null
): Promise<void> {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      guildId: guildId || null,
      guildName: guildName || null,
      guildTag: guildTag || null,
      guildRole: guildRole || null,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] updateUserGuildAssociation error:', err);
  }
}

// ---------------------------------------------------------------------------
// Distraction Guard Realtime Operations & Event Logging
// ---------------------------------------------------------------------------

export interface DistractionLogEvent {
  eventId: string;
  userId: string;
  websiteName: string;
  websiteUrl: string;
  timestamp: string;
  action: 'lock_activated' | 'access_intercepted' | 'site_unlocked' | 'depex_activated';
}

/**
 * Log intercepted distraction attempts and security lock triggers to Firestore in real-time
 */
export async function logDistractionEventInFirestore(
  userId: string,
  event: {
    websiteName: string;
    websiteUrl: string;
    action: 'lock_activated' | 'access_intercepted' | 'site_unlocked' | 'depex_activated';
  }
): Promise<void> {
  if (!userId) return;
  try {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const eventDocRef = doc(db, 'users', userId, 'distraction_events', eventId);
    await setDoc(eventDocRef, {
      eventId,
      userId,
      websiteName: event.websiteName,
      websiteUrl: event.websiteUrl,
      timestamp: new Date().toISOString(),
      action: event.action
    });
  } catch (err) {
    console.warn('[Firestore] logDistractionEventInFirestore error:', err);
  }
}

/**
 * Realtime listener for distraction events in Firestore
 */
export function subscribeToDistractionEvents(
  userId: string,
  callback: (events: DistractionLogEvent[]) => void
): () => void {
  if (!userId) return () => {};
  try {
    const eventsCol = collection(db, 'users', userId, 'distraction_events');
    const unsub = onSnapshot(eventsCol, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as DistractionLogEvent));
      callback(list);
    }, (err) => {
      console.warn('[Firestore] subscribeToDistractionEvents error:', err);
    });
    return unsub;
  } catch (err) {
    console.warn('[Firestore] subscribeToDistractionEvents error:', err);
    return () => {};
  }
}




