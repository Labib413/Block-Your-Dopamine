const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'AppContext.tsx');
let text = fs.readFileSync(filePath, 'utf8');

const startStr = '  const [state, setState] = useState<AppState>(() => {\n    const now = new Date();\n    const today = getLocalDateString(now);';
const endStr = '  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);';

const startIndex = text.indexOf(startStr);
const endIndex = text.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `  const [state, setState] = useState<AppState>(() => {
    const now = new Date();
    const today = getLocalDateString(now);
    
    return {
      xp: 0,
      level: 1,
      streak: 0,
      lastStreakDate: null,
      consecutiveMissedDays: 0,
      streakSeasonStartDate: today,
      focusTime: 0,
      isFocusing: false,
      tasksCompleted: 0,
      detoxPercent: 100,
      physicalFitness: 0,
      weeklyRank: "---",
      globalRank: "---",
      topSkill: "TBD",
      resources: [],
      totalNetFocusTime: 0,
      dailyTotalFocusTime: 0,
      dailyGoalHours: 2.0,
      dailySessions: 0,
      lastResetDate: today,
      currentSessionDuration: 0,
      currentSessionId: null,
      currentSubjectId: null,
      currentSessionResources: [],
      isManualExit: false,
      sessionTimeLeft: 0,
      sessionDistractionTime: 0,
      isSessionDistracted: false,
      waterGlasses: 0,
      sleepHours: 0,
      steps: 0,
      consumedCalories: 0,
      screenTimeHours: 0,
      screenTimeMinutes: 0,
      healthTargets: {
        hydration: '8',
        sleep: '8',
        footsteps: '10000',
        calories: '2000'
      },
      tasks: [],
      notificationsEnabled: true,
      notifications: [],
      user: null,
      profile: null,
      daysActive: 1,
      equippedBadges: [null, null, null],
      unlockedBadgeIds: [],
      badgeHealth: {},
      lastActivityTimestamp: now.toISOString(),
      weeklyHistory: [],
      sessionScores: [],
      focusHistory: [],
      healthHistory: [],
      isSyncing: false,
      hasFetchedFocusData: false,
      latestMood: null,
      macros: { protein: 0, carbs: 0, fats: 0 },
      geminiApiKey: null,
      syncQueue: [],
      offlineSyncQueue: [],
      currentSessionStartTime: null,
      academicSettings: { examDate: null, focusSubjectId: null, prepStartDate: null },
      academicChapters: generateDefaultChapters(null),
      academicSubjects: calculateAllSubjectsProgress(generateDefaultChapters(null), null),
      academicRoutines: [],
      guardedWebsites: [],
      depexMode: false
    };
  });\n\n`;
  
  text = text.substring(0, startIndex) + replacement + text.substring(endIndex);
  fs.writeFileSync(filePath, text);
  console.log("Successfully replaced initialization block.");
} else {
  console.log("Start or end logic not found!");
}
