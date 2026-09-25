import { 
  db, 
  standardDb,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy, 
  onSnapshot,
  handleFirestoreError,
  OperationType,
  Unsubscribe
} from '../firebase';

export interface CommunityMember {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  streak: number;
  netFocusMinutes: number;
  detoxScore: number;
  status: "focusing" | "idle" | "break";
  currentTask?: string;
  focusStartedAt?: string;
  badges: string[];
  institution?: string;
  year?: string;
  rank?: number;
  updatedAt?: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  timestamp: string;
  type: "milestone" | "reflection" | "challenge_complete" | "general";
  content: string;
  statsHighlight?: {
    label: string;
    value: string;
  };
  reactions: {
    fire: number;
    boost: number;
    shield: number;
    diamond: number;
  };
  userReactions?: string[];
  createdAt?: string;
}

export interface DetoxChallenge {
  id: string;
  title: string;
  description: string;
  category: "Detox" | "Focus" | "Monk Mode" | "Academic";
  daysDuration: number;
  participantsCount: number;
  joined: boolean;
  rewardXp: number;
  badgeRewardId?: string;
  endsInDays: number;
  goal: string;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  leader: string;
  membersCount: number;
  maxMembers: number;
  level: number;
  rank: number;
  totalXp: number;
  weeklyGoalHours: number;
  joined: boolean;
  category: "Engineering" | "Medical" | "Varsity" | "General" | "HSC";
  perks: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuildCheer {
  id: string;
  sender: string;
  text: string;
  time: string;
  emoji: string;
  createdAt?: string;
}

/**
 * Recursively strips undefined fields from an object so Firestore doesn't reject it with:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = (typeof value === 'object' && value !== null) ? cleanFirestoreData(value) : value;
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Helper to choose active firestore instance
const getFirestoreInstance = () => db || standardDb;

export const INITIAL_GUILDS: Guild[] = [
  {
    id: "g1",
    name: "BUET Pioneers",
    tag: "BUET",
    description: "Dedicated to intense problem solving, higher mathematics, and hardcore engineering entrance prep.",
    leader: "Tanvir Hasan",
    membersCount: 48,
    maxMembers: 50,
    level: 12,
    rank: 1,
    totalXp: 184500,
    weeklyGoalHours: 350,
    joined: false,
    category: "Engineering",
    perks: "+10% Focus XP Buff & BUET Question Bank"
  },
  {
    id: "g2",
    name: "DMC Medicos Syndicate",
    tag: "DMC",
    description: "Daily biology memorization, medical question bank mastery, and zero-distraction grinds.",
    leader: "Nabila Tabassum",
    membersCount: 42,
    maxMembers: 50,
    level: 10,
    rank: 2,
    totalXp: 162000,
    weeklyGoalHours: 320,
    joined: true,
    category: "Medical",
    perks: "+8% Bio Mastery Buff & Med Flashcards"
  },
  {
    id: "g3",
    name: "Apex Scholars (DU Ka)",
    tag: "APEX",
    description: "Pure science champions competing for top national varsity ranks with disciplined routines.",
    leader: "Farhan Ahmed",
    membersCount: 36,
    maxMembers: 50,
    level: 8,
    rank: 3,
    totalXp: 139200,
    weeklyGoalHours: 280,
    joined: false,
    category: "Varsity",
    perks: "+5% Daily Streak Protection"
  },
  {
    id: "g4",
    name: "Monk Mode Elite",
    tag: "MONK",
    description: "Strict dopamine detox, 6+ hours daily net focus, and extreme discipline for HSC 2026.",
    leader: "Sabbir Hossain",
    membersCount: 29,
    maxMembers: 30,
    level: 7,
    rank: 4,
    totalXp: 118400,
    weeklyGoalHours: 250,
    joined: false,
    category: "HSC",
    perks: "Exclusive Monk Mode Audio & Emblems"
  }
];

export const INITIAL_MEMBERS: CommunityMember[] = [
  {
    id: "user_top_1",
    username: "arif_focus",
    fullName: "Arif Rahman",
    level: 19,
    xp: 9450,
    streak: 42,
    netFocusMinutes: 2840,
    detoxScore: 98,
    status: "focusing",
    currentTask: "Advanced Physics Chapter 4 - Thermodynamics",
    badges: ["f1", "f2", "f3", "f4", "h1", "h3"],
    institution: "BUET",
    year: "HSC 2025"
  },
  {
    id: "user_top_2",
    username: "nabil_detox",
    fullName: "Nabil Khan",
    level: 16,
    xp: 7820,
    streak: 31,
    netFocusMinutes: 2310,
    detoxScore: 94,
    status: "focusing",
    currentTask: "Monk Mode 4h Sprint - Organic Chemistry",
    badges: ["f1", "f2", "f5", "h2"],
    institution: "Notre Dame College",
    year: "HSC 2026"
  },
  {
    id: "user_top_3",
    username: "sadia_study",
    fullName: "Sadia Islam",
    level: 15,
    xp: 7100,
    streak: 28,
    netFocusMinutes: 2150,
    detoxScore: 96,
    status: "idle",
    badges: ["f1", "f3", "h1", "h4"],
    institution: "Viqarunnisa Noon",
    year: "HSC 2025"
  },
  {
    id: "user_top_4",
    username: "tanvir_code",
    fullName: "Tanvir Ahmed",
    level: 13,
    xp: 6200,
    streak: 19,
    netFocusMinutes: 1890,
    detoxScore: 91,
    status: "focusing",
    currentTask: "Calculus Deep Flow Session",
    badges: ["f1", "f2", "h2"],
    institution: "Dhaka College",
    year: "HSC 2026"
  },
  {
    id: "user_top_5",
    username: "fariha_monk",
    fullName: "Fariha Noor",
    level: 12,
    xp: 5800,
    streak: 15,
    netFocusMinutes: 1640,
    detoxScore: 89,
    status: "break",
    badges: ["f1", "h1"],
    institution: "Holy Cross College",
    year: "HSC 2025"
  }
];

export const INITIAL_CHALLENGES: DetoxChallenge[] = [
  {
    id: "c1",
    title: "7-Day Social Media Blackout",
    description: "Zero minutes on blocked dopamine-trap domains. Complete 5 daily focus logs without distraction strikes.",
    category: "Monk Mode",
    daysDuration: 7,
    participantsCount: 428,
    joined: true,
    rewardXp: 1200,
    badgeRewardId: "f3",
    endsInDays: 3,
    goal: "0 Distraction Strikes"
  },
  {
    id: "c2",
    title: "50-Hour Weekly Focus Marathon",
    description: "Accumulate at least 50 hours of verified Net Focus Time across 7 days.",
    category: "Focus",
    daysDuration: 7,
    participantsCount: 312,
    joined: false,
    rewardXp: 2000,
    badgeRewardId: "f4",
    endsInDays: 5,
    goal: "50h Verified Focus"
  },
  {
    id: "c3",
    title: "Syllabus Mastery Sprint",
    description: "Complete 10 subtopics in your Academic Hub with 100% confidence rating.",
    category: "Academic",
    daysDuration: 14,
    participantsCount: 567,
    joined: false,
    rewardXp: 1500,
    badgeRewardId: "f2",
    endsInDays: 11,
    goal: "10 Topics Mastered"
  }
];

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "p1",
    userId: "user_top_1",
    username: "arif_focus",
    fullName: "Arif Rahman",
    timestamp: "12m ago",
    type: "milestone",
    content: "Just crossed 40 consecutive days of Monk Mode! Unlocked 'The Architect' badge. The hardest part was the first 4 days of social media withdrawal — after that, neural clarity took over.",
    statsHighlight: {
      label: "Detox Streak",
      value: "42 Days"
    },
    reactions: { fire: 34, boost: 18, shield: 12, diamond: 9 }
  },
  {
    id: "p2",
    userId: "user_top_2",
    username: "nabil_detox",
    fullName: "Nabil Khan",
    timestamp: "1h ago",
    type: "reflection",
    content: "Entered a 4-hour uninterrupted study block for HSC Organic Chemistry. Depex Mode and Ambient Rain sound kept my focus score locked at 98%. Let's push today!",
    statsHighlight: {
      label: "Net Focus",
      value: "4h 15m"
    },
    reactions: { fire: 22, boost: 15, shield: 8, diamond: 5 }
  }
];

/* =========================================================================
   1. Community Posts (Feed)
   ========================================================================= */

export async function fetchPostsFromFirebase(): Promise<CommunityPost[]> {
  const firestore = getFirestoreInstance();
  const path = "community_posts";
  try {
    const q = query(collection(firestore, path));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Seed initial posts to Firebase
      for (const p of INITIAL_POSTS) {
        await setDoc(doc(firestore, path, p.id), cleanFirestoreData({
          ...p,
          createdAt: new Date().toISOString()
        }));
      }
      return INITIAL_POSTS;
    }

    const posts: CommunityPost[] = [];
    snapshot.forEach(docSnap => {
      posts.push({ id: docSnap.id, ...(docSnap.data() as Omit<CommunityPost, "id">) });
    });

    // Sort by createdAt / timestamp descending
    posts.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp).getTime() || 0;
      const timeB = new Date(b.createdAt || b.timestamp).getTime() || 0;
      return timeB - timeA;
    });

    return posts;
  } catch (error) {
    console.error("[Community] fetchPosts error:", error);
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToCommunityPosts(
  onUpdate: (posts: CommunityPost[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const firestore = getFirestoreInstance();
  const path = "community_posts";
  
  return onSnapshot(
    collection(firestore, path),
    (snapshot) => {
      if (snapshot.empty) {
        // Provide initial posts if not seeded yet
        onUpdate(INITIAL_POSTS);
        return;
      }
      const posts: CommunityPost[] = [];
      snapshot.forEach(docSnap => {
        posts.push({ id: docSnap.id, ...(docSnap.data() as Omit<CommunityPost, "id">) });
      });

      posts.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp).getTime() || 0;
        const timeB = new Date(b.createdAt || b.timestamp).getTime() || 0;
        return timeB - timeA;
      });

      onUpdate(posts);
    },
    (error) => {
      console.error("[Community] onSnapshot posts error:", error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function createPostInFirebase(newPost: Omit<CommunityPost, "id"> & { id?: string }): Promise<CommunityPost> {
  const firestore = getFirestoreInstance();
  const path = "community_posts";
  try {
    const postId = newPost.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const postPayload = cleanFirestoreData({
      ...newPost,
      id: postId,
      createdAt: new Date().toISOString()
    });
    await setDoc(doc(firestore, path, postId), postPayload);
    return postPayload;
  } catch (error) {
    console.error("[Community] createPost error:", error);
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePostReactionsInFirebase(
  postId: string, 
  reactions: CommunityPost["reactions"], 
  userReactions: string[],
  fallbackPost?: Partial<CommunityPost>
): Promise<void> {
  const firestore = getFirestoreInstance();
  const path = `community_posts/${postId}`;
  try {
    const existing = INITIAL_POSTS.find(p => p.id === postId) || {};
    await setDoc(doc(firestore, "community_posts", postId), cleanFirestoreData({
      ...existing,
      ...(fallbackPost || {}),
      reactions,
      userReactions,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    console.error("[Community] updatePostReactions error:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* =========================================================================
   2. Community Challenges
   ========================================================================= */

export async function fetchChallengesFromFirebase(): Promise<DetoxChallenge[]> {
  const firestore = getFirestoreInstance();
  const path = "community_challenges";
  try {
    const snapshot = await getDocs(collection(firestore, path));
    
    if (snapshot.empty) {
      // Seed initial challenges
      for (const c of INITIAL_CHALLENGES) {
        await setDoc(doc(firestore, path, c.id), cleanFirestoreData(c), { merge: true });
      }
      return INITIAL_CHALLENGES;
    }

    const challenges: DetoxChallenge[] = [];
    snapshot.forEach(docSnap => {
      challenges.push({ id: docSnap.id, ...(docSnap.data() as Omit<DetoxChallenge, "id">) });
    });
    return challenges;
  } catch (error) {
    console.error("[Community] fetchChallenges error:", error);
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToCommunityChallenges(
  onUpdate: (challenges: DetoxChallenge[]) => void
): Unsubscribe {
  const firestore = getFirestoreInstance();
  const path = "community_challenges";

  return onSnapshot(
    collection(firestore, path),
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_CHALLENGES);
        (async () => {
          try {
            for (const c of INITIAL_CHALLENGES) {
              await setDoc(doc(firestore, path, c.id), cleanFirestoreData(c), { merge: true });
            }
          } catch (e) {
            console.warn("[Community] auto-seed challenges error:", e);
          }
        })();
        return;
      }
      const challenges: DetoxChallenge[] = [];
      snapshot.forEach(docSnap => {
        challenges.push({ id: docSnap.id, ...(docSnap.data() as Omit<DetoxChallenge, "id">) });
      });
      onUpdate(challenges);
    },
    (error) => {
      console.error("[Community] onSnapshot challenges error:", error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function updateChallengeParticipationInFirebase(
  challengeId: string, 
  joined: boolean, 
  participantsCount: number,
  fallbackChallenge?: Partial<DetoxChallenge>
): Promise<void> {
  const firestore = getFirestoreInstance();
  const path = `community_challenges/${challengeId}`;
  try {
    const existing = INITIAL_CHALLENGES.find(c => c.id === challengeId) || {};
    await setDoc(doc(firestore, "community_challenges", challengeId), cleanFirestoreData({
      ...existing,
      ...(fallbackChallenge || {}),
      id: challengeId,
      joined,
      participantsCount,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    console.error("[Community] updateChallengeParticipation error:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* =========================================================================
   3. Guilds & Guild Study Rooms
   ========================================================================= */

export async function fetchGuildsFromFirebase(): Promise<Guild[]> {
  const firestore = getFirestoreInstance();
  const path = "guilds";
  try {
    const snapshot = await getDocs(collection(firestore, path));
    
    if (snapshot.empty) {
      // Seed initial guilds
      for (const g of INITIAL_GUILDS) {
        await setDoc(doc(firestore, path, g.id), cleanFirestoreData({
          ...g,
          createdAt: new Date().toISOString()
        }), { merge: true });
      }
      return INITIAL_GUILDS;
    }

    const guilds: Guild[] = [];
    snapshot.forEach(docSnap => {
      guilds.push({ id: docSnap.id, ...(docSnap.data() as Omit<Guild, "id">) });
    });

    guilds.sort((a, b) => (a.rank || 99) - (b.rank || 99));
    return guilds;
  } catch (error) {
    console.error("[Community] fetchGuilds error:", error);
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToGuilds(
  onUpdate: (guilds: Guild[]) => void
): Unsubscribe {
  const firestore = getFirestoreInstance();
  const path = "guilds";

  return onSnapshot(
    collection(firestore, path),
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_GUILDS);
        (async () => {
          try {
            for (const g of INITIAL_GUILDS) {
              await setDoc(doc(firestore, path, g.id), cleanFirestoreData({
                ...g,
                createdAt: new Date().toISOString()
              }), { merge: true });
            }
          } catch (e) {
            console.warn("[Community] auto-seed guilds error:", e);
          }
        })();
        return;
      }
      const guilds: Guild[] = [];
      snapshot.forEach(docSnap => {
        guilds.push({ id: docSnap.id, ...(docSnap.data() as Omit<Guild, "id">) });
      });
      guilds.sort((a, b) => (a.rank || 99) - (b.rank || 99));
      onUpdate(guilds);
    },
    (error) => {
      console.error("[Community] onSnapshot guilds error:", error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function createGuildInFirebase(newGuild: Guild): Promise<Guild> {
  const firestore = getFirestoreInstance();
  const path = `guilds/${newGuild.id}`;
  try {
    const payload = cleanFirestoreData({
      ...newGuild,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(firestore, "guilds", newGuild.id), payload, { merge: true });
    return payload;
  } catch (error) {
    console.error("[Community] createGuild error:", error);
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateGuildMembershipInFirebase(
  guildId: string, 
  joined: boolean, 
  membersCount: number,
  fallbackGuild?: Partial<Guild>
): Promise<void> {
  const firestore = getFirestoreInstance();
  const path = `guilds/${guildId}`;
  try {
    const existing = INITIAL_GUILDS.find(g => g.id === guildId) || {};
    await setDoc(doc(firestore, "guilds", guildId), cleanFirestoreData({
      ...existing,
      ...(fallbackGuild || {}),
      id: guildId,
      joined,
      membersCount,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    console.error("[Community] updateGuildMembership error:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Guild Cheers / Study Room Chat
export function subscribeToGuildCheers(
  guildId: string,
  onUpdate: (cheers: GuildCheer[]) => void
): Unsubscribe {
  const firestore = getFirestoreInstance();
  const path = `guilds/${guildId}/cheers`;

  return onSnapshot(
    collection(firestore, "guilds", guildId, "cheers"),
    (snapshot) => {
      const cheers: GuildCheer[] = [];
      snapshot.forEach(docSnap => {
        cheers.push({ id: docSnap.id, ...(docSnap.data() as Omit<GuildCheer, "id">) });
      });
      cheers.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      onUpdate(cheers);
    },
    (error) => {
      console.error("[Community] onSnapshot guild cheers error:", error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function sendGuildCheerInFirebase(guildId: string, cheer: Omit<GuildCheer, "id">): Promise<void> {
  const firestore = getFirestoreInstance();
  const path = `guilds/${guildId}/cheers`;
  try {
    const cheerId = `cheer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload = cleanFirestoreData({
      ...cheer,
      id: cheerId,
      createdAt: new Date().toISOString()
    });
    await setDoc(doc(firestore, "guilds", guildId, "cheers", cheerId), payload);
  } catch (error) {
    console.error("[Community] sendGuildCheer error:", error);
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/* =========================================================================
   4. Community Members (Leaderboard & Live Pods Presence)
   ========================================================================= */

/**
 * 100% Deterministic multi-tier comparator for leaderboard ranking across all clients
 */
export function compareCommunityMembers(a: CommunityMember, b: CommunityMember): number {
  // 1. Highest XP first
  const xpA = Number(a.xp) || 0;
  const xpB = Number(b.xp) || 0;
  if (xpB !== xpA) return xpB - xpA;

  // 2. Highest Level
  const lvlA = Number(a.level) || 1;
  const lvlB = Number(b.level) || 1;
  if (lvlB !== lvlA) return lvlB - lvlA;

  // 3. More Net Focus Minutes
  const focusA = Number(a.netFocusMinutes) || 0;
  const focusB = Number(b.netFocusMinutes) || 0;
  if (focusB !== focusA) return focusB - focusA;

  // 4. Higher Streak
  const streakA = Number(a.streak) || 0;
  const streakB = Number(b.streak) || 0;
  if (streakB !== streakA) return streakB - streakA;

  // 5. Higher Detox Score
  const scoreA = Number(a.detoxScore) || 0;
  const scoreB = Number(b.detoxScore) || 0;
  if (scoreB !== scoreA) return scoreB - scoreA;

  // 6. 100% Deterministic tie-breaker:
  // Sort alphabetically by clean username / ID so EVERY browser computes the identical rank
  const keyA = (a.username || a.fullName || a.id || "").toLowerCase();
  const keyB = (b.username || b.fullName || b.id || "").toLowerCase();
  return keyA.localeCompare(keyB);
}

export async function fetchMembersFromFirebase(): Promise<CommunityMember[]> {
  const firestore = getFirestoreInstance();
  const path = "community_members";
  try {
    const snapshot = await getDocs(collection(firestore, path));
    
    if (snapshot.empty) {
      // Seed initial members
      for (const m of INITIAL_MEMBERS) {
        await setDoc(doc(firestore, path, m.id), cleanFirestoreData({
          ...m,
          updatedAt: new Date().toISOString()
        }));
      }
      return [...INITIAL_MEMBERS].sort(compareCommunityMembers);
    }

    const members: CommunityMember[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      // Filter out and remove legacy dummy "user_you" / "you" placeholder
      if (docSnap.id === "user_you" || data.username === "you") {
        deleteDoc(doc(firestore, path, docSnap.id)).catch(() => {});
        return;
      }
      members.push({ id: docSnap.id, ...(data as Omit<CommunityMember, "id">) });
    });

    members.sort(compareCommunityMembers);
    return members;
  } catch (error) {
    console.error("[Community] fetchMembers error:", error);
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToCommunityMembers(
  onUpdate: (members: CommunityMember[]) => void
): Unsubscribe {
  const firestore = getFirestoreInstance();
  const path = "community_members";

  return onSnapshot(
    collection(firestore, path),
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([...INITIAL_MEMBERS].sort(compareCommunityMembers));
        return;
      }
      const members: CommunityMember[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as any;
        // Filter out and clean up legacy dummy "user_you" / "you" placeholder
        if (docSnap.id === "user_you" || data.username === "you") {
          deleteDoc(doc(firestore, path, docSnap.id)).catch(() => {});
          return;
        }
        members.push({ id: docSnap.id, ...(data as Omit<CommunityMember, "id">) });
      });
      members.sort(compareCommunityMembers);
      onUpdate(members);
    },
    (error) => {
      console.error("[Community] onSnapshot members error:", error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function syncMemberPresenceToFirebase(member: CommunityMember): Promise<void> {
  // Never write dummy or unauthenticated mock accounts
  if (!member.id || member.id === "user_you" || member.username === "you") return;
  const firestore = getFirestoreInstance();
  const path = `community_members/${member.id}`;
  try {
    const sanitized = cleanFirestoreData({
      ...member,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(firestore, "community_members", member.id), sanitized, { merge: true });
  } catch (error) {
    console.error("[Community] syncMemberPresence error:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
