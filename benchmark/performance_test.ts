
import { HSC_SYLLABUS } from '../src/constants';

// Mock stringToUUID for testing
function stringToUUID(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const fullHex = (hex + hex + hex + hex).substring(0, 32);
  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(13, 16)}-a${fullHex.slice(17, 20)}-${fullHex.slice(20, 32)}`;
}

interface AcademicChapter {
  id: string;
  subject_id: string;
  chapter_name: string;
  is_active: boolean;
  read_textbook: boolean;
  watch_class: boolean;
  practice_problems: boolean;
  make_notes: boolean;
}

// Old implementation (O(N^2))
function calculateOld(chapters: AcademicChapter[], userId: string | null) {
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

  const uniqueChapters = Array.from(new Map(chapters.map(c => [c.id, c])).values()) as AcademicChapter[];

  return subjects.map(s => {
    const officialNames = HSC_SYLLABUS[s.id] || [];
    let totalActiveCount = 0;
    let completedTasks = 0;

    officialNames.forEach(name => {
      const rawId = `${userId || 'anon'}_${s.id}_ch_${name.replace(/\s+/g, '_')}`;
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
    return { id: s.id, progress: totalPossibleTasks > 0 ? Math.round((completedTasks / totalPossibleTasks) * 100) : 0 };
  });
}

// New implementation (O(N))
function calculateNew(chapters: AcademicChapter[], userId: string | null) {
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

  const chapterMap = new Map(chapters.map(c => [c.id, c]));

  return subjects.map(s => {
    const officialNames = HSC_SYLLABUS[s.id] || [];
    let totalActiveCount = 0;
    let completedTasks = 0;

    officialNames.forEach(name => {
      const rawId = `${userId || 'anon'}_${s.id}_ch_${name.replace(/\s+/g, '_')}`;
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
    return { id: s.id, progress: totalPossibleTasks > 0 ? Math.round((completedTasks / totalPossibleTasks) * 100) : 0 };
  });
}

// Test with 10,000 chapters (simulated scale)
const testChapters: AcademicChapter[] = [];
for (let i = 0; i < 10000; i++) {
  testChapters.push({
    id: `id_${i}`,
    subject_id: 'p1',
    chapter_name: `Chapter ${i}`,
    is_active: true,
    read_textbook: true,
    watch_class: true,
    practice_problems: true,
    make_notes: true
  });
}

console.log("Starting Benchmark...");

const startOld = performance.now();
calculateOld(testChapters, 'user1');
const endOld = performance.now();
console.log(`Old Implementation (O(N^2)): ${(endOld - startOld).toFixed(4)}ms`);

const startNew = performance.now();
calculateNew(testChapters, 'user1');
const endNew = performance.now();
console.log(`New Implementation (O(N)): ${(endNew - startNew).toFixed(4)}ms`);

console.log(`Improvement: ${((endOld - startOld) / (endNew - startNew)).toFixed(2)}x faster`);
