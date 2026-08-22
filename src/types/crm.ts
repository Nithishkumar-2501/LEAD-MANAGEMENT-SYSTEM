export type Role = "ADMIN" | "COUNSELOR" | "STUDENT" | "TEACHER";

export const VSB_DEPARTMENTS_COURSES = [
  "B.Tech Artificial Intelligence and Data Science",
  "B.E Bio Technology",
  "B.E BioMedical",
  "B.E Civil Engineering",
  "B.E Chemical Engineering",
  "B.E Computer Science and Engineering",
  "B.Tech Computer Science and Business System",
  "B.Tech Artificial Intelligence and Machine Learning",
  "B.Tech Computer Communication Engineering",
  "B.E Electrical and Electronics Engineering",
  "B.E Electronics and Communication Engineering",
  "B.Tech Information Technology",
  "B.E Mechanical Engineering",
] as const;

export type LeadStatus = "NEW" | "CONTACTED" | "IN_REVIEW" | "ADMITTED" | "REJECTED";

export type AppStage = "INQUIRY" | "SUBMITTED" | "DOCS_VERIFIED" | "OFFER_ISSUED" | "FEE_PAID";

export type TaskType = "CALL" | "EMAIL" | "WHATSAPP";

export type CampusLocation = "ALL" | "KARUR" | "COIMBATORE";

export type ActiveTab =
  | "ADMISSIONS"
  | "CONTACTS"
  | "STUDENTS"
  | "TEACHERS"
  | "CAMPUSES"
  | "PAYMENTS"
  | "SETTINGS"
  | "CONTACT_PLATFORM"
  | "SOCIAL_ADS"
  | "SOCIAL_FACEBOOK"
  | "SOCIAL_TWITTER"
  | "SOCIAL_WHATSAPP"
  | "SOCIAL_EMAIL"
  | "SOCIAL_SMS"
  | "SOCIAL_CAMPAIGN"
  | "SOCIAL_EXPO";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  fatherName?: string;
  motherName?: string;
  gender?: string;
  bloodGroup?: string;
  physicallyDisabled?: string;
  community?: string;
  source: string;
  courseInterest: string;
  campus: CampusLocation;
  school?: string;
  district?: string;
  state?: string;
  address?: string;
  status: LeadStatus;
  subStage?: string;
  leadScore?: number;
  counselorId?: string | null;
  assignedTo?: string;
  appliedCounselling?: boolean;
  counsellingAppNo?: string;
  tneaCutoff?: number;
  counsellingCategory?: string;
  generalRank?: number;
  createdAt: string;
  application?: Application | null;
}

export interface Application {
  id: string;
  leadId: string;
  stage: AppStage;
  marks10th: number;
  marks12th: number;
  paymentStatus: string;
  payments?: Payment[];
}

export interface Task {
  id: string;
  counselorId: string;
  leadId: string;
  title: string;
  type: TaskType;
  dueDate: string;
  isCompleted: boolean;
  lead?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    courseInterest: string;
  };
}

export interface Payment {
  id: string;
  applicationId: string;
  studentName: string;
  course: string;
  campus: CampusLocation;
  amount: number;
  status: string;
  transactionId: string;
  createdAt: string;
}

export interface CallRecording {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  teacherId: string;
  teacherName: string;
  recordingDate: string; // ISO date string e.g. "2026-08-22"
  timestamp: string; // e.g. "10:45 AM"
  durationSeconds: number;
  durationText: string;
  studentInterestStatus: "INTERESTED" | "ADMITTED" | "REVIEWING" | "NOT_INTERESTED" | "NO_ANSWER";
  teacherNotes: string;
  callTranscript: string;
  audioUrl?: string;
  expiresAt: string; // 30 days after creation: "2026-09-21"
  autoDeleted?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  campus: CampusLocation;
  coursesAssigned: string[];
  experienceYears: number;
  status: "ACTIVE" | "ON_LEAVE";
  avatar: string;
  assignedQuota?: number;
  assignedRangeText?: string;
  contactedCount?: number;
}

export interface SummaryMetrics {
  totalLeads: number;
  leadsTrend: number;
  applicationsVerified: number;
  docsVerifiedTrend: number;
  seatsFilled: number;
  seatsFilledTrend: number;
  totalRevenue: number;
  revenueTrend: number;
}

export interface LeadStatusCounts {
  NEW: number;
  CONTACTED: number;
  IN_REVIEW: number;
  ADMITTED: number;
  REJECTED: number;
}

export interface DashboardMetricsResponse {
  summary: SummaryMetrics;
  leadStatusCounts: LeadStatusCounts;
  todaysTasks: Task[];
  recentApplicants: (Lead & { application: Application })[];
}
