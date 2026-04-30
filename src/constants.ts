import { 
  Heart, 
  Zap, 
  Shield, 
  Activity, 
  Target, 
  Brain, 
  Focus, 
  Flame,
  Trophy,
  Star,
  Droplets,
  Sunrise,
  Moon,
  Footprints,
  Sparkles,
  Waves,
  Anchor,
  Compass,
  Infinity,
  Crown,
  Rocket,
  Bug
} from 'lucide-react';
import { TheSparkIcon } from './components/icons/TheSparkIcon';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'Health' | 'Focus' | 'Special';
  isUnlocked: boolean;
  color: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export const BADGES: Badge[] = [
  {
    id: 'h1',
    title: 'Hydration Hero',
    description: 'Drink 8 glasses of water for 3 days straight.',
    icon: Droplets,
    category: 'Health',
    isUnlocked: false,
    color: '#00F2FF',
    rarity: 'Common'
  },
  {
    id: 'h2',
    title: 'Early Bird',
    description: 'Wake up before 6 AM for a week.',
    icon: Sunrise,
    category: 'Health',
    isUnlocked: false,
    color: '#FFD700',
    rarity: 'Rare'
  },
  {
    id: 'h3',
    title: 'Sleep Master',
    description: 'Get 8 hours of sleep for 5 consecutive nights.',
    icon: Moon,
    category: 'Health',
    isUnlocked: false,
    color: '#A855F7',
    rarity: 'Epic'
  },
  {
    id: 'h4',
    title: 'Step Warrior',
    description: 'Walk 10,000 steps in a single day.',
    icon: Footprints,
    category: 'Health',
    isUnlocked: false,
    color: '#22C55E',
    rarity: 'Common'
  },
  {
    id: 'f1',
    title: 'The Spark',
    description: '1 week with 5h+ Net Focus Time.',
    icon: TheSparkIcon,
    category: 'Focus',
    isUnlocked: false,
    color: '#FFD700',
    rarity: 'Common'
  },
  {
    id: 'f2',
    title: 'Neural Flow',
    description: '1 week with 5h+ Net Focus Time + 20% To-Do List completion.',
    icon: Waves,
    category: 'Focus',
    isUnlocked: false,
    color: '#00FF9D',
    rarity: 'Common'
  },
  {
    id: 'f3',
    title: 'Deep Diver',
    description: '2 weeks with 6h+ Net Focus Time + 40% To-Do List completion.',
    icon: Anchor,
    category: 'Focus',
    isUnlocked: false,
    color: '#3B82F6',
    rarity: 'Rare'
  },
  {
    id: 'f4',
    title: 'The Architect',
    description: '2 weeks with 8h+ Net Focus Time + 60% To-Do List completion.',
    icon: Compass,
    category: 'Focus',
    isUnlocked: false,
    color: '#A855F7',
    rarity: 'Rare'
  },
  {
    id: 'f5',
    title: 'Unstoppable',
    description: '3 weeks with 10h+ Net Focus Time + 80% To-Do List completion.',
    icon: Infinity,
    category: 'Focus',
    isUnlocked: false,
    color: '#F97316',
    rarity: 'Epic'
  },
  {
    id: 'f6',
    title: 'Apex Focus',
    description: '3 weeks with 11h+ Net Focus Time + 90% To-Do List completion.',
    icon: Crown,
    category: 'Focus',
    isUnlocked: false,
    color: '#FF0055',
    rarity: 'Legendary'
  },
  {
    id: 's1',
    title: 'BYD Pioneer',
    description: 'One of the first users of the BYD platform.',
    icon: Rocket,
    category: 'Special',
    isUnlocked: false,
    color: '#FFFFFF',
    rarity: 'Legendary'
  },
  {
    id: 's2',
    title: 'Bug Hunter',
    description: 'Reported a critical bug and helped improve BYD.',
    icon: Bug,
    category: 'Special',
    isUnlocked: false,
    color: '#EAB308',
    rarity: 'Epic'
  }
];

export const HSC_SYLLABUS: Record<string, string[]> = {
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

export const HSC_SUBJECT_NAMES: Record<string, string> = {
  'p1': 'Physics 1st Paper',
  'p2': 'Physics 2nd Paper',
  'c1': 'Chemistry 1st Paper',
  'c2': 'Chemistry 2nd Paper',
  'm1': 'Math 1st Paper',
  'm2': 'Math 2nd Paper',
  'b1': 'Biology 1st Paper',
  'b2': 'Biology 2nd Paper',
  'ict': 'ICT'
};
