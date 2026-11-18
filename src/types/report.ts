export type PerformanceLevel = 1 | 2 | 3 | 4 | 5;

export interface LevelInfo {
  score: PerformanceLevel;
  level: string;
  vietnamese: string;
  shortLabel: string;
  description: string;
  bgLight: string;
  borderActive: string;
  textActive: string;
  badgeBg: string;
}

export interface EvaluationItem {
  id: string;
  nameEn: string;
  nameVi: string;
}

export interface EvaluationGroup {
  id: string;
  order: string;
  nameEn: string;
  nameVi: string;
  items: EvaluationItem[];
}

export type ApprovalStatus = 'NOT_GENERATED' | 'DRAFT' | 'NEEDS_REVIEW' | 'APPROVED';

export interface ReportMetadata {
  className: string;
  teacherName: string;
  responsibleSkill: string;
  otherSkill?: string;
  reportMonth: string;
}

export interface StudentData {
  id: string;
  fullName: string;
  score: string; // 0 to 10 scale (accepts decimal: e.g. "6.5", "7.25")
  evaluations: Record<string, PerformanceLevel>; // item id -> level (1-5)
  aiComment: string; // AI generated comment
  comment: string; // Current teacher-edited / active comment
  status: ApprovalStatus;
  isGenerating?: boolean;
}

export interface SupportActivitiesState {
  selectedActivities: string[];
  customDetails: string;
  aiSummary: string;
  summary: string;
  status: ApprovalStatus;
  isGenerating?: boolean;
}

export interface RecommendationsState {
  selectedRecommendations: string[];
  customDetails: string;
  aiRecommendations: string;
  recommendations: string;
  status: ApprovalStatus;
  isGenerating?: boolean;
}

export interface GenerateStudentCommentRequest {
  studentName: string;
  score: string | number;
  responsibleSkill?: string;
  evaluations: Array<{
    category: string;
    characteristic: string;
    level: PerformanceLevel;
    levelText: string;
  }>;
  customApiKey?: string;
  customModel?: string;
}

export interface GenerateStudentCommentResponse {
  comment: string;
}

export interface GenerateSupportSummaryRequest {
  className?: string;
  teacherName?: string;
  responsibleSkill?: string;
  selectedActivities: string[];
  customDetails?: string;
  customApiKey?: string;
  customModel?: string;
}

export interface GenerateSupportSummaryResponse {
  summary: string;
}

export interface GenerateRecommendationsRequest {
  className?: string;
  teacherName?: string;
  responsibleSkill?: string;
  selectedRecommendations: string[];
  customDetails?: string;
  customApiKey?: string;
  customModel?: string;
}

export interface GenerateRecommendationsResponse {
  recommendations: string;
}
