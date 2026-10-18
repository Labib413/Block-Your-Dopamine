import { HSC_SYLLABUS } from './src/constants';
import { stringToUUID } from './src/lib/utils';

interface AcademicChapter {
  id: string;
  subject_id: string;
  chapter_name: string;
  is_weak: boolean;
  is_important: boolean;
  is_active: boolean;
  read_textbook: boolean;
  watch_class: boolean;
  practice_problems: boolean;
  make_notes: boolean;
  resources: any[];
  _timestamp?: number;
}

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

function calculateAllSubjectsProgress_Current(chapters: AcademicChapter[], userId: string | null) {
  const uniqueChapters = Array.from(new Map(chapters.map(c => [c.id, c])).values()) as AcademicChapter[];

  return subjects.map(s => {
    const subjectId = s.id;
    const officialNames = HSC_SYLLABUS[subjectId] || [];
    let totalActiveCount = 0;
    let completedTasks = 0;

    officialNames.forEach(name => {
      const rawId = `${userId || 'anon'}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const chapterId = stringToUUID(rawId);
      const chapter = uniqueChapters.find(c => c.id === chapterId);
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
    return totalPossibleTasks > 0 ? Math.round((completedTasks / totalPossibleTasks) * 100) : 0;
  });
}

function calculateAllSubjectsProgress_Optimized(chapters: AcademicChapter[], userId: string | null) {
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
    return totalPossibleTasks > 0 ? Math.round((completedTasks / totalPossibleTasks) * 100) : 0;
  });
}

// Mock data
const mockChapters: AcademicChapter[] = [];
Object.entries(HSC_SYLLABUS).forEach(([subjectId, chapters]) => {
  chapters.forEach(name => {
    const rawId = `user123_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
    mockChapters.push({
      id: stringToUUID(rawId),
      subject_id: subjectId,
      chapter_name: name,
      is_weak: false,
      is_important: false,
      is_active: true,
      read_textbook: Math.random() > 0.5,
      watch_class: Math.random() > 0.5,
      practice_problems: Math.random() > 0.5,
      make_notes: Math.random() > 0.5,
      resources: []
    });
  });
});

const iterations = 5000;
console.log(`Running benchmark with ${mockChapters.length} chapters over ${iterations} iterations...`);

const startCurrent = performance.now();
for (let i = 0; i < iterations; i++) {
  calculateAllSubjectsProgress_Current(mockChapters, 'user123');
}
const endCurrent = performance.now();
console.log(`Current (Linear Search): ${(endCurrent - startCurrent).toFixed(2)}ms`);

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  calculateAllSubjectsProgress_Optimized(mockChapters, 'user123');
}
const endOptimized = performance.now();
console.log(`Optimized (Map Lookup): ${(endOptimized - startOptimized).toFixed(2)}ms`);

console.log(`Speedup: ${((endCurrent - startCurrent) / (endOptimized - startOptimized)).toFixed(2)}x`);
