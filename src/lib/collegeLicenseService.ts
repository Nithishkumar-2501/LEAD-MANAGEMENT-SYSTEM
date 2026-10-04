/**
 * SPHEREX CRM - Multi-College Tenant & Software License Management Service
 * 
 * Exclusively controlled by Root Creator (spherexnithish#).
 * 
 * Responsibilities:
 * 1. Track which colleges are using SPHEREX CRM.
 * 2. Track institutional payments: Annual software license fee, extra lead overages, amount paid, and outstanding balance.
 * 3. Give Root Creator unilateral power to STOP / SUSPEND the Web Application and Mobile App if a college fails to pay.
 * 4. Re-open / restore Web & Mobile application immediately once payment is cleared by the Creator.
 */

import { isCapacitorNative } from "./mobileFetch";

export type CollegePaymentStatus = "PAID" | "PENDING" | "OVERDUE";

export interface CollegeClientLicense {
  id: string; // e.g., "VSB_KARUR", "VSB_COIMBATORE"
  campus: "KARUR" | "COIMBATORE" | string;
  collegeName: string;
  shortCode: string;
  location: string;
  adminUsername: string;
  contactEmail: string;
  contactPhone: string;
  platformCoverage: string; // "Web Application + Native Android & iOS Apps"
  baseAnnualFee: number; // ₹1,50,000 INR
  extraLeadsCount: number; // from overage tracking
  overageSurcharge: number; // ₹500 * extraLeadsCount
  totalPayableAmount: number; // baseAnnualFee + overageSurcharge
  amountPaid: number; // Amount cleared by college
  outstandingBalance: number; // totalPayableAmount - amountPaid
  paymentStatus: CollegePaymentStatus;
  paymentDueDate: string;
  lastPaymentDate?: string;
  paymentReference?: string;
  // Creator Access Killswitches
  isWebApplicationStopped: boolean;
  isMobileApplicationStopped: boolean;
  suspensionReason?: string;
  suspendedAt?: string;
  notes?: string;
}

const STORAGE_KEY = "spherex_college_licenses_registry";
export const LICENSE_EVENT_KEY = "spherex_license_update_event";

export const DEFAULT_COLLEGES: CollegeClientLicense[] = [
  {
    id: "VSB_KARUR",
    campus: "KARUR",
    collegeName: "V.S.B. Engineering College",
    shortCode: "VSBEC",
    location: "Karur, Tamil Nadu (NH-67)",
    adminUsername: "adminkarur@123",
    contactEmail: "principal@vsbec.com",
    contactPhone: "+91 99422 21289",
    platformCoverage: "Dual Platform: Web Application + Native Android/iOS Mobile App",
    baseAnnualFee: 150000,
    extraLeadsCount: 0,
    overageSurcharge: 0,
    totalPayableAmount: 150000,
    amountPaid: 150000,
    outstandingBalance: 0,
    paymentStatus: "PAID",
    paymentDueDate: "2026-12-31",
    lastPaymentDate: "2026-04-15",
    paymentReference: "NEFT-VSBEC-2026-00412",
    isWebApplicationStopped: false,
    isMobileApplicationStopped: false,
    suspensionReason: "",
    notes: "Active institutional client. Karur campus annual subscription fully cleared.",
  },
  {
    id: "VSB_COIMBATORE",
    campus: "COIMBATORE",
    collegeName: "V.S.B. College of Engineering Technical Campus",
    shortCode: "VSBCTC",
    location: "Coimbatore, Tamil Nadu (Pollachi Main Road)",
    adminUsername: "admincovai@123",
    contactEmail: "principal@vsbctc.com",
    contactPhone: "+91 99422 21288",
    platformCoverage: "Dual Platform: Web Application + Native Android/iOS Mobile App",
    baseAnnualFee: 150000,
    extraLeadsCount: 0,
    overageSurcharge: 0,
    totalPayableAmount: 150000,
    amountPaid: 150000,
    outstandingBalance: 0,
    paymentStatus: "PAID",
    paymentDueDate: "2026-11-30",
    lastPaymentDate: "2026-04-20",
    paymentReference: "NEFT-VSBCTC-2026-00891",
    isWebApplicationStopped: false,
    isMobileApplicationStopped: false,
    suspensionReason: "",
    notes: "Active institutional client. Coimbatore campus annual license valid through 2026.",
  },
];

/**
 * Retrieve all registered client colleges and their payment/access statuses.
 */
export function getAllCollegeLicenses(): CollegeClientLicense[] {
  if (typeof window === "undefined") return DEFAULT_COLLEGES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COLLEGES));
      return DEFAULT_COLLEGES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => {
        const total = (item.baseAnnualFee || 150000) + (item.overageSurcharge || 0);
        const paid = item.amountPaid ?? 0;
        const outstanding = Math.max(0, total - paid);
        let status: CollegePaymentStatus = item.paymentStatus || "PENDING";
        if (outstanding === 0) status = "PAID";
        else if (new Date(item.paymentDueDate).getTime() < Date.now()) status = "OVERDUE";

        return {
          ...item,
          totalPayableAmount: total,
          outstandingBalance: outstanding,
          paymentStatus: status,
          isWebApplicationStopped: Boolean(item.isWebApplicationStopped),
          isMobileApplicationStopped: Boolean(item.isMobileApplicationStopped),
        };
      });
    }
  } catch (err) {
    console.warn("Failed to load college licenses registry:", err);
  }

  return DEFAULT_COLLEGES;
}

/**
 * Save updated college registry and broadcast event to all listeners.
 */
export function saveCollegeLicenses(licenses: CollegeClientLicense[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(licenses));
    window.dispatchEvent(new CustomEvent(LICENSE_EVENT_KEY, { detail: licenses }));
  } catch (err) {
    console.warn("Failed to save college licenses registry:", err);
  }
}

/**
 * Find license by campus key ("KARUR" | "COIMBATORE").
 */
export function getCollegeLicenseByCampus(campus: string): CollegeClientLicense | undefined {
  const colleges = getAllCollegeLicenses();
  return colleges.find((c) => c.campus.toUpperCase() === campus.toUpperCase());
}

/**
 * Find license by college identifier.
 */
export function getCollegeLicenseById(id: string): CollegeClientLicense | undefined {
  const colleges = getAllCollegeLicenses();
  return colleges.find((c) => c.id === id);
}

/**
 * Check if a college's access is stopped for the current platform (Web or Mobile).
 */
export function isCollegeSuspendedForCurrentEnvironment(campus: string): {
  isSuspended: boolean;
  platform: "WEB" | "MOBILE";
  college?: CollegeClientLicense;
} {
  const college = getCollegeLicenseByCampus(campus);
  if (!college) {
    return { isSuspended: false, platform: "WEB" };
  }

  const isMobile = isCapacitorNative();
  const platform = isMobile ? "MOBILE" : "WEB";

  if (isMobile && college.isMobileApplicationStopped) {
    return { isSuspended: true, platform: "MOBILE", college };
  }

  if (!isMobile && college.isWebApplicationStopped) {
    return { isSuspended: true, platform: "WEB", college };
  }

  return { isSuspended: false, platform, college };
}

/**
 * Creator Action: Stop or Open Web Application for a specific college.
 */
export function setCollegeWebApplicationStatus(
  collegeId: string,
  isStopped: boolean,
  reason: string = "Annual subscription payment pending / overdue"
): CollegeClientLicense[] {
  const colleges = getAllCollegeLicenses();
  const updated = colleges.map((c) => {
    if (c.id === collegeId) {
      return {
        ...c,
        isWebApplicationStopped: isStopped,
        suspensionReason: isStopped ? reason : "",
        suspendedAt: isStopped ? new Date().toISOString() : undefined,
      };
    }
    return c;
  });
  saveCollegeLicenses(updated);
  return updated;
}

/**
 * Creator Action: Stop or Open Native Mobile App for a specific college.
 */
export function setCollegeMobileApplicationStatus(
  collegeId: string,
  isStopped: boolean,
  reason: string = "Annual subscription payment pending / overdue"
): CollegeClientLicense[] {
  const colleges = getAllCollegeLicenses();
  const updated = colleges.map((c) => {
    if (c.id === collegeId) {
      return {
        ...c,
        isMobileApplicationStopped: isStopped,
        suspensionReason: isStopped ? reason : "",
        suspendedAt: isStopped ? new Date().toISOString() : undefined,
      };
    }
    return c;
  });
  saveCollegeLicenses(updated);
  return updated;
}

/**
 * Creator Action: Freeze both Web Application & Mobile App at once for a defaulting college.
 */
export function freezeCollegeEntireApplication(
  collegeId: string,
  isFrozen: boolean,
  reason: string = "Annual software renewal payment defaulted by institution"
): CollegeClientLicense[] {
  const colleges = getAllCollegeLicenses();
  const updated = colleges.map((c) => {
    if (c.id === collegeId) {
      return {
        ...c,
        isWebApplicationStopped: isFrozen,
        isMobileApplicationStopped: isFrozen,
        suspensionReason: isFrozen ? reason : "",
        suspendedAt: isFrozen ? new Date().toISOString() : undefined,
      };
    }
    return c;
  });
  saveCollegeLicenses(updated);
  return updated;
}

/**
 * Creator Action: Record received payment and IMMEDIATELY OPEN / UNFREEZE the application.
 */
export function recordCollegePaymentAndOpenApp(
  collegeId: string,
  amountReceived: number,
  paymentReference: string = "CASH/NEFT-CLEARED"
): { updatedList: CollegeClientLicense[]; targetCollege?: CollegeClientLicense } {
  const colleges = getAllCollegeLicenses();
  let targetCollege: CollegeClientLicense | undefined;

  const updated = colleges.map((c) => {
    if (c.id === collegeId) {
      const newPaid = (c.amountPaid || 0) + amountReceived;
      const total = c.totalPayableAmount;
      const outstanding = Math.max(0, total - newPaid);
      const newStatus: CollegePaymentStatus = outstanding === 0 ? "PAID" : "PENDING";

      const updatedCollege: CollegeClientLicense = {
        ...c,
        amountPaid: newPaid,
        outstandingBalance: outstanding,
        paymentStatus: newStatus,
        lastPaymentDate: new Date().toISOString().split("T")[0],
        paymentReference,
        // Automatically restore / open Web and Mobile application access upon clearing payment
        isWebApplicationStopped: false,
        isMobileApplicationStopped: false,
        suspensionReason: "",
      };
      targetCollege = updatedCollege;
      return updatedCollege;
    }
    return c;
  });

  saveCollegeLicenses(updated);
  return { updatedList: updated, targetCollege };
}

/**
 * Creator Action: Register a new College using SPHEREX CRM.
 */
export function registerNewCollegeClient(newCollege: Partial<CollegeClientLicense>): CollegeClientLicense[] {
  const colleges = getAllCollegeLicenses();
  const id = newCollege.id || `COLLEGE_${Date.now()}`;
  const total = (newCollege.baseAnnualFee || 150000) + (newCollege.overageSurcharge || 0);
  const paid = newCollege.amountPaid || 0;

  const created: CollegeClientLicense = {
    id,
    campus: newCollege.campus || id,
    collegeName: newCollege.collegeName || "New Partner College",
    shortCode: newCollege.shortCode || "NPC",
    location: newCollege.location || "Tamil Nadu, India",
    adminUsername: newCollege.adminUsername || `admin_${id.toLowerCase()}@spherex.in`,
    contactEmail: newCollege.contactEmail || "admin@college.in",
    contactPhone: newCollege.contactPhone || "+91 90000 00000",
    platformCoverage: "Dual Platform: Web Application + Native Android/iOS Mobile App",
    baseAnnualFee: newCollege.baseAnnualFee || 150000,
    extraLeadsCount: 0,
    overageSurcharge: 0,
    totalPayableAmount: total,
    amountPaid: paid,
    outstandingBalance: Math.max(0, total - paid),
    paymentStatus: paid >= total ? "PAID" : "PENDING",
    paymentDueDate: newCollege.paymentDueDate || "2026-12-31",
    isWebApplicationStopped: false,
    isMobileApplicationStopped: false,
    notes: newCollege.notes || "Newly added client college under SPHEREX OS.",
  };

  const updated = [...colleges, created];
  saveCollegeLicenses(updated);
  return updated;
}
