const HSC_SYLLABUS: Record<string, string[]> = {
  'p1': [
    "Physical World and Measurement",
    "Vector",
    "Dynamics",
    "Newtonian Mechanics",
    "Work, Energy and Power",
    "Gravitation and Gravity",
    "Structural Properties of Matter",
    "Periodic Motion",
    "Waves",
    "Ideal Gas and Kinetic Theory of Gases"
  ],
  'p2': [
    "Thermodynamics",
    "Static Electricity",
    "Current Electricity",
    "Magnetic Effect of Current and Magnetism",
    "Electromagnetic Induction and Alternating Current",
    "Geometrical Optics",
    "Physical Optics",
    "Introduction to Modern Physics",
    "Atomic Model and Nuclear Physics",
    "Semiconductor and Electronics",
    "Astronomy"
  ],
  'c1': [
    "Safe use of Laboratory",
    "Qualitative Chemistry",
    "Periodic Properties of Elements and Chemical Bond",
    "Chemical Change",
    "Working Chemistry"
  ],
  'c2': [
    "Environmental Chemistry",
    "Organic Chemistry",
    "Quantitative Chemistry",
    "Electrochemistry",
    "Economic Chemistry"
  ],
  'm1': [
    "Matrices and Determinants",
    "Vector",
    "Straight Lines",
    "Circle",
    "Permutation and Combination",
    "Trigonometric Ratios",
    "Inverse Trigonometric Ratios",
    "Functions and Graph of Functions",
    "Differentiation",
    "Integration"
  ],
  'm2': [
    "Real Numbers and Inequalities",
    "Linear Programming",
    "Complex Numbers",
    "Polynomials and Polynomial Equations",
    "Binomial Expansion",
    "Inverse Trigonometric Functions and Trigonometric Equations",
    "Statics",
    "Dynamics",
    "Probability"
  ],
  'b1': [
    "Cell and its Structure",
    "Cell Division",
    "Cell Chemistry",
    "Microorganisms",
    "Algae and Fungi",
    "Bryophyta and Pteridophyta",
    "Gymnosperm and Angiosperm",
    "Tissue and Tissue System",
    "Plant Physiology",
    "Plant Breeding",
    "Biotechnology",
    "Environment, Distribution and Conservation of Organisms"
  ],
  'b2': [
    "Animal Diversity and Classification",
    "Introduction to Animals",
    "Digestion and Absorption",
    "Blood and Circulation",
    "Respiration and Breathing",
    "Excretion and Waste Management",
    "Movement and Locomotion",
    "Coordination and Control",
    "Animal Defense",
    "Immune System",
    "Genetics and Evolution",
    "Animal Behavior"
  ],
  'ict': [
    "Information and Communication Technology: World and Bangladesh Perspective",
    "Communication Systems and Networking",
    "Number Systems and Digital Devices",
    "Introduction to Web Design and HTML",
    "Programming Language",
    "Database Management System"
  ]
};

export function stringToUUID(str: string): string {
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
};

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
};

const chapters: AcademicChapter[] = [];
Object.entries(HSC_SYLLABUS).forEach(([subjectId, names]) => {
  names.forEach(name => {
    const rawId = `anon_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
    chapters.push({
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

const iterations = 10000;
console.log(`Running benchmark with ${chapters.length} chapters and ${iterations} iterations...`);

console.time('Original');
for (let i = 0; i < iterations; i++) {
  calculateAllSubjectsProgressOriginal(chapters, null);
}
console.timeEnd('Original');

console.time('Optimized');
for (let i = 0; i < iterations; i++) {
  calculateAllSubjectsProgressOptimized(chapters, null);
}
console.timeEnd('Optimized');
