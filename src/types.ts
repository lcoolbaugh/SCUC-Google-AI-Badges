export type BadgeCategoryType =
  | 'Introduction to Gemini for Education'
  | 'Introduction to Gemini for Notebook'
  | 'Introduction to Vibe Coding with Gemini';

export interface BadgeRecord {
  id: string;
  timestamp: string;
  firstName: string;
  lastName: string;
  fullName: string;
  department: string;
  role: string;
  credentialUrl: string;
  badge: BadgeCategoryType | string;
  rawBadge: string;
}

export interface CategoryTopCampus {
  name: string;
  count: number;
}

export interface CategoryInfo {
  name: string;
  count: number;
  top4: CategoryTopCampus[];
}

export interface CampusLeaderboardItem {
  name: string;
  totalBadges: number;
  earnersCount: number;
  eduCount: number;
  notebookCount: number;
  codingCount: number;
}

export interface EarnerBadgeDetail {
  badge: string;
  rawBadge: string;
  timestamp: string;
  credentialUrl: string;
}

export interface EarnerProfile {
  fullName: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  badges: EarnerBadgeDetail[];
}

export interface DashboardStats {
  totalBadges: number;
  activeCampusesCount: number;
  totalEarnersCount: number;
  categories: {
    edu: CategoryInfo;
    notebook: CategoryInfo;
    coding: CategoryInfo;
  };
  campusLeaderboard: CampusLeaderboardItem[];
}

export interface ApiResponse {
  success: boolean;
  isLive: boolean;
  error?: string;
  lastUpdated: string;
  sheetUrl: string;
  celebrations?: Record<string, number>;
  stats: DashboardStats;
  records: BadgeRecord[];
  earnerProfiles: EarnerProfile[];
}
