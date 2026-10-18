
import { HSC_SYLLABUS } from '../src/constants';
import { stringToUUID } from '../src/lib/utils';

// Current implementation logic
const calculateAllSubjectsProgress_OLD = (chapters: any[], userId: string | null) => {
  const subjects = [
    { id: 'p1', name: 'Physics 1st Paper' },
    { id: 'p2', name: 'Physics 2nd Paper' },
    { id: 'm1', name: 'Math 1st Paper' },
    { id: 'm2', name: 'Math 2nd Paper' },
    { id: 'c1', name: 'Chemistry 1st Paper' },
    { id: 'c2', name: 'Chemistry 2nd Paper' },
    { id: 'b1', name: 'Biology 1st Paper' },
    { id: 'b2', name: 'Biology 2nd Paper' },
    { id: 'ict', name: 'ICT' },
  ];

  // PRIMARY FIX: Filter out any duplicate chapter IDs to prevent "ghost" data
  const uniqueChapters = Array.from(new Map(chapters.map(c => [c.id, c])).values()) as any[];

  return subjects.map(s => {
    const subjectId = s.id;
    const officialNames = HSC_SYLLABUS[subjectId] || [];

    let totalActiveCount = 0;
    let completedTasks = 0;

    officialNames.forEach(name => {
      const rawId = `${userId || 'anon'}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const chapterId = stringToUUID(rawId);

      const chapter = uniqueChapters.find(c => c.id === chapterId); // BOTTLENECK

      let isActive = true;
      if (chapter && chapter.is_active !== undefined) {
        isActive = chapter.is_active;
      }

      if (isActive) {
        totalActiveCount++;
        if (chapter) {
          if (chapter.read_textbook) completedTasks++;
          if (chapter.watch_class) completedTasks++;
          if (chapter.practice_problems) completedTasks++;
          if (chapter.make_notes) completedTasks++;
        }
      }
    });

    const totalPossibleTasks = totalActiveCount * 4;
    const progressValue = totalPossibleTasks > 0
      ? Math.round((completedTasks / totalPossibleTasks) * 100)
      : 0;

    return { id: subjectId, name: s.name, progress: progressValue };
  });
};

// Optimized implementation logic
const calculateAllSubjectsProgress_NEW = (chapters: any[], userId: string | null) => {
  const subjects = [
    { id: 'p1', name: 'Physics 1st Paper' },
    { id: 'p2', name: 'Physics 2nd Paper' },
    { id: 'm1', name: 'Math 1st Paper' },
    { id: 'm2', name: 'Math 2nd Paper' },
    { id: 'c1', name: 'Chemistry 1st Paper' },
    { id: 'c2', name: 'Chemistry 2nd Paper' },
    { id: 'b1', name: 'Biology 1st Paper' },
    { id: 'b2', name: 'Biology 2nd Paper' },
    { id: 'ict', name: 'ICT' },
  ];

  // Optimization: Use a Map for O(1) lookups
  const chaptersMap = new Map(chapters.map(c => [c.id, c]));

  return subjects.map(s => {
    const subjectId = s.id;
    const officialNames = HSC_SYLLABUS[subjectId] || [];

    let totalActiveCount = 0;
    let completedTasks = 0;

    officialNames.forEach(name => {
      const rawId = `${userId || 'anon'}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const chapterId = stringToUUID(rawId);

      const chapter = chaptersMap.get(chapterId); // OPTIMIZED

      let isActive = true;
      if (chapter && chapter.is_active !== undefined) {
        isActive = chapter.is_active;
      }

      if (isActive) {
        totalActiveCount++;
        if (chapter) {
          if (chapter.read_textbook) completedTasks++;
          if (chapter.watch_class) completedTasks++;
          if (chapter.practice_problems) completedTasks++;
          if (chapter.make_notes) completedTasks++;
        }
      }
    });

    const totalPossibleTasks = totalActiveCount * 4;
    const progressValue = totalPossibleTasks > 0
      ? Math.round((completedTasks / totalPossibleTasks) * 100)
      : 0;

    return { id: subjectId, name: s.name, progress: progressValue };
  });
};

// Simulation setup
const userId = "test-user";
const baseChapters: any[] = [];
Object.entries(HSC_SYLLABUS).forEach(([subjectId, syllabusChapters]) => {
  syllabusChapters.forEach(name => {
    const rawId = `${userId}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
    baseChapters.push({
      id: stringToUUID(rawId),
      subject_id: subjectId,
      chapter_name: name,
      is_active: true,
      read_textbook: Math.random() > 0.5,
      watch_class: Math.random() > 0.5,
      practice_problems: Math.random() > 0.5,
      make_notes: Math.random() > 0.5,
    });
  });
});

// Scale up to 2000 chapters to see measurable difference
const scaledChapters = Array.from({ length: 20 }, (_, j) =>
  baseChapters.map((c, i) => ({...c, id: `${c.id}-${j}`}))
).flat();

console.log(`Running benchmark with ${scaledChapters.length} chapters...`);

const ITERATIONS = 500;

const startOld = performance.now();
for(let i=0; i<ITERATIONS; i++) calculateAllSubjectsProgress_OLD(scaledChapters, userId);
const endOld = performance.now();
const oldTotal = endOld - startOld;
console.log(`Old implementation (total for ${ITERATIONS} iterations): ${oldTotal.toFixed(2)}ms`);
console.log(`Old implementation (average): ${(oldTotal / ITERATIONS).toFixed(4)}ms`);

const startNew = performance.now();
for(let i=0; i<ITERATIONS; i++) calculateAllSubjectsProgress_NEW(scaledChapters, userId);
const endNew = performance.now();
const newTotal = endNew - startNew;
console.log(`New implementation (total for ${ITERATIONS} iterations): ${newTotal.toFixed(2)}ms`);
console.log(`New implementation (average): ${(newTotal / ITERATIONS).toFixed(4)}ms`);

console.log(`Improvement: ${((oldTotal - newTotal) / oldTotal * 100).toFixed(2)}%`);
