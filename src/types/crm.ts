export type Role = "ADMIN" | "COUNSELOR" | "STUDENT" | "TEACHER";

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
  | "SETTINGS";

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
  source: string;
  courseInterest: string;
  campus: CampusLocation;
  school?: string;
  district?: string;
  address?: string;
  status: LeadStatus;
  counselorId?: string | null;
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
