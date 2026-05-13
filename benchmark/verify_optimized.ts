
import { HSC_SYLLABUS } from '../src/constants';
import { stringToUUID } from '../src/lib/utils';
// Note: We can't easily import the actual function from AppContext.tsx because it's a React file
// So we re-implement the logic exactly as it is now in the file for verification

const calculateAllSubjectsProgress_VERIFY = (chapters: any[], userId: string | null) => {
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

  // Optimization: Use a Map for O(1) lookups and implicit deduplication
  const chaptersMap = new Map(chapters.map(c => [c.id, c]));

  return subjects.map(s => {
    const subjectId = s.id;
    const officialNames = HSC_SYLLABUS[subjectId] || [];

    let totalActiveCount = 0;
    let completedTasks = 0;

    officialNames.forEach(name => {
      const rawId = `${userId || 'anon'}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const chapterId = stringToUUID(rawId);

      const chapter = chaptersMap.get(chapterId);

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
    return { id: subjectId, name: s.name, progress: totalPossibleTasks > 0 ? Math.round((completedTasks / totalPossibleTasks) * 100) : 0 };
  });
};

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

const scaledChapters = Array.from({ length: 20 }, (_, j) =>
  baseChapters.map((c, i) => ({...c, id: `${c.id}-${j}`}))
).flat();

const ITERATIONS = 1000;
const start = performance.now();
for(let i=0; i<ITERATIONS; i++) calculateAllSubjectsProgress_VERIFY(scaledChapters, userId);
const end = performance.now();
console.log(`Average execution time for optimized version: ${((end - start) / ITERATIONS).toFixed(4)}ms`);
