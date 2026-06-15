
// HSC_SYLLABUS Mock
const HSC_SYLLABUS: Record<string, string[]> = {
  'p1': [
    "Physical World and Measurement", "Vector", "Dynamics", "Newtonian Mechanics", "Work, Energy and Power", "Gravitation and Gravity", "Structural Properties of Matter", "Periodic Motion", "Waves", "Ideal Gas and Kinetic Theory of Gases"
  ],
  'p2': [
    "Thermodynamics", "Static Electricity", "Current Electricity", "Magnetic Effect of Current and Magnetism", "Electromagnetic Induction and Alternating Current", "Geometrical Optics", "Physical Optics", "Introduction to Modern Physics", "Atomic Model and Nuclear Physics", "Semiconductor and Electronics", "Astronomy"
  ],
  'c1': ["Safe use of Laboratory", "Qualitative Chemistry", "Periodic Properties of Elements and Chemical Bond", "Chemical Change", "Working Chemistry"],
  'c2': ["Environmental Chemistry", "Organic Chemistry", "Quantitative Chemistry", "Electrochemistry", "Economic Chemistry"],
  'm1': ["Matrices and Determinants", "Vector", "Straight Lines", "Circle", "Permutation and Combination", "Trigonometric Ratios", "Inverse Trigonometric Ratios", "Functions and Graph of Functions", "Differentiation", "Integration"],
  'm2': ["Real Numbers and Inequalities", "Linear Programming", "Complex Numbers", "Polynomials and Polynomial Equations", "Binomial Expansion", "Inverse Trigonometric Functions and Trigonometric Equations", "Statics", "Dynamics", "Probability"],
  'b1': ["Cell and its Structure", "Cell Division", "Cell Chemistry", "Microorganisms", "Algae and Fungi", "Bryophyta and Pteridophyta", "Gymnosperm and Angiosperm", "Tissue and Tissue System", "Plant Physiology", "Plant Breeding", "Biotechnology", "Environment, Distribution and Conservation of Organisms"],
  'b2': ["Animal Diversity and Classification", "Introduction to Animals", "Digestion and Absorption", "Blood and Circulation", "Respiration and Breathing", "Excretion and Waste Management", "Movement and Locomotion", "Coordination and Control", "Animal Defense", "Immune System", "Genetics and Evolution", "Animal Behavior"],
  'ict': ["Information and Communication Technology: World and Bangladesh Perspective", "Communication Systems and Networking", "Number Systems and Digital Devices", "Introduction to Web Design and HTML", "Programming Language", "Database Management System"]
};

// stringToUUID Mock
const stringToUUID = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Mock types
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

// Current implementation of calculateAllSubjectsProgress (copy-pasted from AppContext.tsx)
const calculateAllSubjectsProgressOriginal = (chapters: AcademicChapter[], userId: string | null) => {
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

  const updatedSubjects = subjects.map(s => {
    const subjectId = s.id;
    const officialNames = HSC_SYLLABUS[subjectId] || [];

    let totalActiveCount = 0;
    let completedTasks = 0;

    officialNames.forEach(name => {
      const rawId = `${userId || 'anon'}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const chapterId = stringToUUID(rawId);

      const chapter = uniqueChapters.find(c => c.id === chapterId);

      let isActive = true;
      try {
        if (chapter && chapter.is_active !== undefined) {
          isActive = chapter.is_active;
        }
      } catch (e) {
        if (chapter) isActive = chapter.is_active;
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

  return updatedSubjects;
};

// Optimized implementation
const calculateAllSubjectsProgressOptimized = (chapters: AcademicChapter[], userId: string | null) => {
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

  const chapterMap = new Map<string, AcademicChapter>(chapters.map(c => [c.id, c]));

  const updatedSubjects = subjects.map(s => {
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

  return updatedSubjects;
};

// Mock data generation
const generateMockChapters = (count: number): AcademicChapter[] => {
  const chapters: AcademicChapter[] = [];
  Object.entries(HSC_SYLLABUS).forEach(([subjectId, syllabusChapters]) => {
    syllabusChapters.forEach(name => {
      const rawId = `test_user_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const id = stringToUUID(rawId);
      chapters.push({
        id,
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

  for (let i = chapters.length; i < count; i++) {
     chapters.push({
        id: stringToUUID(`extra_${i}`),
        subject_id: 'p1',
        chapter_name: `Extra ${i}`,
        is_weak: false,
        is_important: false,
        is_active: true,
        read_textbook: false,
        watch_class: false,
        practice_problems: false,
        make_notes: false,
        resources: []
     });
  }
  return chapters;
};

const runBenchmark = () => {
  const chapterCount = 5000;
  const iterations = 500;
  const mockChapters = generateMockChapters(chapterCount);
  const userId = 'test_user';

  console.log(`Running benchmark with ${chapterCount} chapters and ${iterations} iterations...`);

  // Warm up
  calculateAllSubjectsProgressOriginal(mockChapters, userId);
  calculateAllSubjectsProgressOptimized(mockChapters, userId);

  const startOriginal = Date.now();
  for (let i = 0; i < iterations; i++) {
    calculateAllSubjectsProgressOriginal(mockChapters, userId);
  }
  const endOriginal = Date.now();
  const timeOriginal = endOriginal - startOriginal;
  console.log(`Original implementation: ${timeOriginal}ms`);

  const startOptimized = Date.now();
  for (let i = 0; i < iterations; i++) {
    calculateAllSubjectsProgressOptimized(mockChapters, userId);
  }
  const endOptimized = Date.now();
  const timeOptimized = endOptimized - startOptimized;
  console.log(`Optimized implementation: ${timeOptimized}ms`);

  console.log(`Speedup: ${(timeOriginal / timeOptimized).toFixed(2)}x`);
};

runBenchmark();
