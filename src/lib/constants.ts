import { BadgeCategoryType, BadgeRecord } from '../types';

export const CAT_EDU: BadgeCategoryType = 'Introduction to Gemini for Education';
export const CAT_NOTEBOOK: BadgeCategoryType = 'Introduction to Gemini for Notebook';
export const CAT_CODING: BadgeCategoryType = 'Introduction to Vibe Coding with Gemini';
export const CAT_CITIZENS: BadgeCategoryType = 'Empowering Digital Citizens';
export const CAT_MATERIALS: BadgeCategoryType = 'Creating Classroom-Ready Instructional Materials';
export const CAT_ADAPT: BadgeCategoryType = 'Adapt (Level) Materials';

export const DEFAULT_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/14RGvXzzk9M0_7DdcaDB_4jcI7ubWijgKzQjnrNtJd98/export?format=csv';

export const OFFICIAL_BADGES_INFO_URL =
  'https://educertifications.google/google-ai-educator-series/badges';

export const CATEGORY_METADATA = {
  [CAT_EDU]: {
    id: 'EDU',
    name: 'Introduction to Gemini for Education',
    shortName: 'Gemini for Education',
    level: 'Foundational Credential',
    badgeColor: '#4285F4', // Google Blue
    bgSoft: 'bg-blue-50',
    borderSoft: 'border-blue-200',
    textColor: 'text-[#1a73e8]',
    pillBg: 'bg-[#4285F4]',
    tagText: 'text-blue-700',
    description: 'Practical AI literacy for educators, lesson planning assistance, and workflow acceleration in K-12 classrooms.',
    officialCourseUrl: OFFICIAL_BADGES_INFO_URL
  },
  [CAT_NOTEBOOK]: {
    id: 'NOTEBOOK',
    name: 'Introduction to Gemini for Notebook',
    shortName: 'Gemini for Notebook',
    level: 'Synthesis & Research',
    badgeColor: '#FBBC05', // Google Yellow / Amber
    bgSoft: 'bg-amber-50',
    borderSoft: 'border-amber-200',
    textColor: 'text-[#b06000]',
    pillBg: 'bg-[#f29900]',
    tagText: 'text-amber-800',
    description: 'Mastering NotebookLM to ground AI in curricula, source materials, lesson units, and audio overviews.',
    officialCourseUrl: OFFICIAL_BADGES_INFO_URL
  },
  [CAT_CODING]: {
    id: 'CODING',
    name: 'Introduction to Vibe Coding with Gemini',
    shortName: 'Vibe Coding with Gemini',
    level: 'Applied Innovation',
    badgeColor: '#34A853', // Google Green
    bgSoft: 'bg-emerald-50',
    borderSoft: 'border-emerald-200',
    textColor: 'text-[#188038]',
    pillBg: 'bg-[#34A853]',
    tagText: 'text-emerald-800',
    description: 'Building custom classroom utilities, interactive learning modules, and teacher productivity tools with AI prompts.',
    officialCourseUrl: OFFICIAL_BADGES_INFO_URL
  },
  [CAT_CITIZENS]: {
    id: 'CITIZENS',
    name: 'Empowering Digital Citizens',
    shortName: 'Empowering Digital Citizens',
    level: 'Digital Citizenship',
    badgeColor: '#EA4335', // Google Red
    bgSoft: 'bg-red-50',
    borderSoft: 'border-red-200',
    textColor: 'text-[#d93025]',
    pillBg: 'bg-[#EA4335]',
    tagText: 'text-red-800',
    description: 'Guiding students to evaluate AI outputs critically, practice safe digital citizenship, and engage responsibly.',
    officialCourseUrl: OFFICIAL_BADGES_INFO_URL
  },
  [CAT_MATERIALS]: {
    id: 'MATERIALS',
    name: 'Creating Classroom-Ready Instructional Materials',
    shortName: 'Classroom-Ready Materials',
    level: 'Instructional Design',
    badgeColor: '#1967D2', // Deep Google Blue
    bgSoft: 'bg-blue-50',
    borderSoft: 'border-blue-200',
    textColor: 'text-[#1967d2]',
    pillBg: 'bg-[#1967D2]',
    tagText: 'text-blue-800',
    description: 'Designing structured, standards-aligned lesson guides, rubrics, and engaging classroom resources with Gemini.',
    officialCourseUrl: OFFICIAL_BADGES_INFO_URL
  },
  [CAT_ADAPT]: {
    id: 'ADAPT',
    name: 'Adapt (Level) Materials',
    shortName: 'Adapt (Level) Materials',
    level: 'Differentiation & Access',
    badgeColor: '#E37400', // Google Amber/Orange
    bgSoft: 'bg-orange-50',
    borderSoft: 'border-orange-200',
    textColor: 'text-[#c26401]',
    pillBg: 'bg-[#E37400]',
    tagText: 'text-orange-800',
    description: 'Differentiating reading levels, scaffolding multilingual support, and adapting instructional content for every learner.',
    officialCourseUrl: OFFICIAL_BADGES_INFO_URL
  }
};

export const FALLBACK_RECORDS: BadgeRecord[] = [
  {
    id: 'rec-1',
    timestamp: '10/1/2026 12:11:26',
    firstName: 'Linda',
    lastName: 'Coolbaugh',
    fullName: 'Linda Coolbaugh',
    department: 'Technology',
    role: 'Lead Instructional Technology Coordinator',
    credentialUrl: 'https://edu.google.accredible.com/profile/lindacoolbaugh323788/wallet',
    badge: CAT_EDU,
    rawBadge: 'Introduction to Gemini'
  },
  {
    id: 'rec-2',
    timestamp: '10/2/2026 10:27:52',
    firstName: 'Linda',
    lastName: 'Coolbaugh',
    fullName: 'Linda Coolbaugh',
    department: 'Technology',
    role: 'Lead Instructional Technology Coordinator',
    credentialUrl: 'https://edu.google.accredible.com/profile/lindacoolbaugh323788/wallet',
    badge: CAT_NOTEBOOK,
    rawBadge: 'Introduction to Gemini Notebook'
  },
  {
    id: 'rec-3',
    timestamp: '10/2/2026 10:34:17',
    firstName: 'Linda',
    lastName: 'Coolbaugh',
    fullName: 'Linda Coolbaugh',
    department: 'Technology',
    role: 'Lead Instructional Technology Coordinator',
    credentialUrl: 'https://edu.google.accredible.com/profile/lindacoolbaugh323788/wallet',
    badge: CAT_CODING,
    rawBadge: 'Introduction to Vibe Coding with Gemini'
  },
  {
    id: 'rec-4',
    timestamp: '10/2/2026 10:51:42',
    firstName: 'Devin',
    lastName: 'Hewer',
    fullName: 'Devin Hewer',
    department: 'Technology',
    role: 'ITC',
    credentialUrl: 'https://edu.google.accredible.com/a7c8217f-d770-4f42-816d-8b7cc2eef533',
    badge: CAT_EDU,
    rawBadge: 'Introduction to Gemini for Education'
  }
];
