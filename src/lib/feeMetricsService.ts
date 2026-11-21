import { Lead, Application, CampusLocation, Payment } from "@/types/crm";
import { sanitizeLeadFields, resolveAcademicCourse } from "@/lib/csvParser";

export interface StudentFeeSummaryItem {
  id: string;
  studentName: string;
  applicationNo: string;
  course: string;
  campus: CampusLocation;
  phone: string;
  email: string;
  feeCategory: string;
  totalFee: number;
  amountPaid: number;
  balanceDue: number;
  status: "COMPLETED" | "PENDING" | "PARTIAL";
  transactionId?: string;
  paymentMethod?: string;
  paidAt?: string;
  rawPayment?: Payment;
}

export interface FeeHeadcountMetrics {
  totalStudentsCount: number;
  paidStudentsCount: number;
  pendingStudentsCount: number;
  partialStudentsCount: number;
  paidPercentage: number;
  totalAmountCollected: number;
  records: StudentFeeSummaryItem[];
}

/**
 * Aggregates CRM applicants and live Firebase payment receipts into a unified fee record list.
 */
export function buildStudentFeeRecords(
  applicants: (Lead & { application: Application })[] = [],
  payments: Payment[] = [],
  fallbackCampus: CampusLocation = "KARUR"
): StudentFeeSummaryItem[] {
  const list: StudentFeeSummaryItem[] = [];
  const processedStudentNames = new Set<string>();

  // 1. Process admitted / enrolled applicants from CRM database
  applicants.forEach((app, idx) => {
    const sanitizedApp = sanitizeLeadFields(app);
    const name = (sanitizedApp.name || app.name || "Student Applicant").trim();
    processedStudentNames.add(name.toLowerCase());

    // Check if this student has a recorded payment in Firebase
    const matchingPayment = payments.find(
      (p) =>
        p.applicationId === app.id ||
        (p.studentName && p.studentName.trim().toLowerCase() === name.toLowerCase())
    );

    const hasPartialPayment =
      matchingPayment?.status === "PARTIAL" ||
      (app.application as any)?.paymentStatus === "PARTIAL" ||
      (matchingPayment && matchingPayment.amount < 85000);

    const isCompleted =
      !hasPartialPayment &&
      (matchingPayment?.status === "COMPLETED" ||
        (matchingPayment && matchingPayment.amount >= 85000) ||
        app.application?.paymentStatus === "COMPLETED" ||
        app.status === "ADMITTED" ||
        (app.application?.stage as string) === "FEE_PAID");

    const totalFee = 85000;
    const amountPaid = matchingPayment
      ? matchingPayment.amount
      : isCompleted
      ? 85000
      : 0;
    const balanceDue = Math.max(0, totalFee - amountPaid);

    const status: "COMPLETED" | "PENDING" | "PARTIAL" =
      balanceDue === 0 && amountPaid >= totalFee && !hasPartialPayment
        ? "COMPLETED"
        : amountPaid > 0
        ? "PARTIAL"
        : "PENDING";

    const resolvedCourse = resolveAcademicCourse(
      sanitizedApp.courseInterest || app.courseInterest,
      "B.E. Computer Science and Engineering"
    );

    list.push({
      id: app.id || `stud_${idx}`,
      studentName: name,
      applicationNo: (app.application as any)?.applicationNo || `VSB-2026-${String(idx + 1).padStart(4, "0")}`,
      course: resolvedCourse,
      campus: sanitizedApp.campus || app.campus || fallbackCampus,
      phone: sanitizedApp.phone || app.phone || "",
      email: sanitizedApp.email || app.email || "",
      feeCategory: "Tuition Fee",
      totalFee,
      amountPaid,
      balanceDue,
      status,
      transactionId: matchingPayment?.transactionId || (isCompleted ? `VSB_TXN_${app.id.slice(-6)}` : undefined),
      paymentMethod: matchingPayment ? "Online UPI / NetBanking" : isCompleted ? "Net Banking" : undefined,
      paidAt: matchingPayment?.createdAt || (isCompleted ? app.createdAt : undefined),
      rawPayment: matchingPayment,
    });
  });

  // 2. Add any standalone Firebase payments not directly mapped to an applicant
  payments.forEach((p, idx) => {
    const cleanName = (p.studentName || "").trim().toLowerCase();
    if (cleanName && !processedStudentNames.has(cleanName)) {
      processedStudentNames.add(cleanName);
      const totalFee = Math.max(p.amount, 85000);
      const amountPaid = p.amount;
      const balanceDue = Math.max(0, totalFee - amountPaid);
      const status: "COMPLETED" | "PENDING" | "PARTIAL" =
        balanceDue === 0 && amountPaid >= totalFee && p.status !== "PARTIAL"
          ? "COMPLETED"
          : amountPaid > 0
          ? "PARTIAL"
          : "PENDING";

      const resolvedCourse = resolveAcademicCourse(
        p.course,
        "B.E. Computer Science and Engineering"
      );

      list.push({
        id: p.id || `pay_${idx}`,
        studentName: p.studentName,
        applicationNo: `VSB-PAY-${p.id.slice(-4)}`,
        course: resolvedCourse,
        campus: p.campus || fallbackCampus,
        phone: "",
        email: "",
        feeCategory: "Tuition Fee",
        totalFee,
        amountPaid,
        balanceDue,
        status,
        transactionId: p.transactionId,
        paymentMethod: "Online UPI / NetBanking",
        paidAt: p.createdAt,
        rawPayment: p,
      });
    }
  });

  return list;
}

/**
 * Computes headcount metrics strictly scoped to the active campus filter.
 */
export function calculateStudentFeeMetrics(
  applicants: (Lead & { application: Application })[] = [],
  payments: Payment[] = [],
  campusFilter: string = "ALL",
  fallbackCampus: CampusLocation = "KARUR"
): FeeHeadcountMetrics {
  const allRecords = buildStudentFeeRecords(applicants, payments, fallbackCampus);
  const campusScoped = allRecords.filter(
    (s) => campusFilter === "ALL" || s.campus === campusFilter
  );

  const totalStudentsCount = campusScoped.length;
  const paidStudentsCount = campusScoped.filter((s) => s.status === "COMPLETED").length;
  const pendingStudentsCount = campusScoped.filter((s) => s.status === "PENDING").length;
  const partialStudentsCount = campusScoped.filter((s) => s.status === "PARTIAL").length;
  const paidPercentage = totalStudentsCount > 0 ? Math.round((paidStudentsCount / totalStudentsCount) * 100) : 0;
  const totalAmountCollected = campusScoped.reduce((sum, s) => sum + s.amountPaid, 0);

  return {
    totalStudentsCount,
    paidStudentsCount,
    pendingStudentsCount,
    partialStudentsCount,
    paidPercentage,
    totalAmountCollected,
    records: campusScoped,
  };
}
