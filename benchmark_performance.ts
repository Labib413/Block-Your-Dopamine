
import { HSC_SYLLABUS } from './src/constants';
import { stringToUUID } from './src/lib/utils';

// Mock data
const userId = "test-user-id";
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

const generateChapters = () => {
  const chapters: any[] = [];
  Object.entries(HSC_SYLLABUS).forEach(([subjectId, syllabusChapters]) => {
    syllabusChapters.forEach(name => {
      const rawId = `${userId}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const id = stringToUUID(rawId);
      chapters.push({
        id,
        subject_id: subjectId,
        chapter_name: name,
        is_weak: false,
        is_important: false,
        is_active: true,
        read_textbook: false,
        watch_class: false,
        practice_problems: false,
        make_notes: false,
        resources: []
      });
    });
  });
  return chapters;
};

const chapters = generateChapters();
const uniqueChapters = Array.from(new Map(chapters.map(c => [c.id, c])).values()) as any[];

// Current implementation of calculateAllSubjectsProgress (Linear Search)
function calculateAllSubjectsProgressLinear(chapters: any[], userId: string | null) {
  return subjects.map(s => {
    const subjectId = s.id;
    const officialNames = HSC_SYLLABUS[subjectId] || [];

    let totalActiveCount = 0;
    let completedTasks = 0;

    officialNames.forEach(name => {
      const rawId = `${userId || 'anon'}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const chapterId = stringToUUID(rawId);

      const chapter = chapters.find(c => c.id === chapterId);

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
}

// Optimized implementation (Map lookup)
function calculateAllSubjectsProgressOptimized(chapters: any[], userId: string | null) {
  const chapterMap = new Map(chapters.map(c => [c.id, c]));

  return subjects.map(s => {
    const subjectId = s.id;
    const officialNames = HSC_SYLLABUS[subjectId] || [];

    let totalActiveCount = 0;
    let completedTasks = 0;

    officialNames.forEach(name => {
      const rawId = `${userId || 'anon'}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const chapterId = stringToUUID(rawId);

      const chapter = chapterMap.get(chapterId);

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
}

// Benchmark
const iterations = 1000;

console.log(`Running benchmark with ${iterations} iterations...`);

const startLinear = performance.now();
for (let i = 0; i < iterations; i++) {
  calculateAllSubjectsProgressLinear(uniqueChapters, userId);
}
const endLinear = performance.now();
console.log(`Linear Search Time: ${(endLinear - startLinear).toFixed(2)}ms`);

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  calculateAllSubjectsProgressOptimized(uniqueChapters, userId);
}
const endOptimized = performance.now();
console.log(`Optimized (Map) Time: ${(endOptimized - startOptimized).toFixed(2)}ms`);

console.log(`Speedup: ${((endLinear - startLinear) / (endOptimized - startOptimized)).toFixed(2)}x`);
