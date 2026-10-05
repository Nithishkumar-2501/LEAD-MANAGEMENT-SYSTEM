/**
 * SPHEREX CRM - Multi-College Tenant & Software License Management Service
 * 
 * Exclusively controlled by Root Creator (spherexnithish#).
 * 
 * Responsibilities:
 * 1. Track which colleges are using SPHEREX CRM.
 * 2. Track institutional payments: Annual software license fee, extra lead overages, amount paid, and outstanding balance.
 * 3. Give Root Creator unilateral power to STOP / SUSPEND the Web Application and Mobile App across all systems worldwide.
 * 4. Master Emergency Global Kill-Switch ("Stop All Web Apps & Stop All Mobile Apps Everywhere").
 * 5. Re-open / restore Web & Mobile application immediately once payment is cleared by the Creator.
 * 6. Real-time synchronization across Firestore, Realtime Database, and API so ANY system, phone, or browser locks immediately.
 */

import { isCapacitorNative } from "./mobileFetch";
import { db, rtdb } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { ref, get, set, onValue } from "firebase/database";

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

export interface GlobalLockoutState {
  isGlobalWebStopped: boolean;
  isGlobalMobileStopped: boolean;
  reason: string;
  stoppedAt?: string;
}

const STORAGE_KEY = "spherex_college_licenses_registry";
const GLOBAL_LOCKOUT_KEY = "spherex_global_lockout_registry";
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

export const DEFAULT_GLOBAL_LOCKOUT: GlobalLockoutState = {
  isGlobalWebStopped: false,
  isGlobalMobileStopped: false,
  reason: "",
};

// In-memory runtime cache
let memoryColleges: CollegeClientLicense[] = DEFAULT_COLLEGES;
let memoryGlobalLockout: GlobalLockoutState = DEFAULT_GLOBAL_LOCKOUT;

// Safe sanitization for Firebase
function sanitizeForFirebase(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirebase);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = sanitizeForFirebase(v);
  }
  return out;
}

/**
 * Retrieve Global Lockout state (checks if Master Creator stopped Web or Mobile everywhere).
 */
export function getGlobalLockoutState(): GlobalLockoutState {
  if (typeof window === "undefined") return memoryGlobalLockout;
  try {
    const raw = localStorage.getItem(GLOBAL_LOCKOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryGlobalLockout = {
        isGlobalWebStopped: Boolean(parsed.isGlobalWebStopped),
        isGlobalMobileStopped: Boolean(parsed.isGlobalMobileStopped),
        reason: String(parsed.reason || ""),
        stoppedAt: parsed.stoppedAt || undefined,
      };
      return memoryGlobalLockout;
    }
  } catch (err) {
    console.warn("Failed to load global lockout state from localStorage:", err);
  }
  return memoryGlobalLockout;
}

/**
 * Save Global Lockout state to localStorage, Firebase Firestore, RTDB, and API.
 */
export function saveGlobalLockoutState(lockout: GlobalLockoutState): void {
  memoryGlobalLockout = lockout;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(GLOBAL_LOCKOUT_KEY, JSON.stringify(lockout));
      window.dispatchEvent(new CustomEvent(LICENSE_EVENT_KEY, { detail: { colleges: memoryColleges, globalLockout: lockout } }));
    } catch (e) {}
  }

  // Asynchronously broadcast to Cloud Firestore, Realtime Database, and API
  pushLicensesToCloud(memoryColleges, lockout);
}

/**
 * Retrieve all registered client colleges and their payment/access statuses.
 */
export function getAllCollegeLicenses(): CollegeClientLicense[] {
  if (typeof window === "undefined") return memoryColleges;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COLLEGES));
      memoryColleges = DEFAULT_COLLEGES;
      return DEFAULT_COLLEGES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const mapped = parsed.map((item) => {
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
      memoryColleges = mapped;
      return mapped;
    }
  } catch (err) {
    console.warn("Failed to load college licenses registry:", err);
  }

  return memoryColleges;
}

/**
 * Broadcast license updates to Cloud Firestore, Realtime Database, and Next.js API.
 */
async function pushLicensesToCloud(colleges: CollegeClientLicense[], globalLockout: GlobalLockoutState): Promise<void> {
  const payload = sanitizeForFirebase({
    colleges,
    globalLockout,
    updatedAt: new Date().toISOString(),
    updatedBy: "SPHEREX_MASTER_CREATOR",
  });

  // 1. Next.js API Route
  try {
    fetch("/api/creator/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colleges, globalLockout }),
    }).catch(() => {});
  } catch (e) {}

  // 2. Cloud Firestore
  try {
    setDoc(doc(db, "system_licenses", "college_registry"), payload, { merge: true }).catch(() => {});
  } catch (e) {}

  // 3. Realtime Database
  try {
    set(ref(rtdb, "spherex_licenses"), payload).catch(() => {});
  } catch (e) {}
}

/**
 * Save updated college registry and broadcast event to all listeners.
 */
export function saveCollegeLicenses(licenses: CollegeClientLicense[]): void {
  memoryColleges = licenses;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(licenses));
      window.dispatchEvent(new CustomEvent(LICENSE_EVENT_KEY, { detail: { colleges: licenses, globalLockout: memoryGlobalLockout } }));
    } catch (err) {
      console.warn("Failed to save college licenses registry:", err);
    }
  }

  // Push to cloud infrastructure
  pushLicensesToCloud(licenses, memoryGlobalLockout);
}

/**
 * Live Subscription & Heartbeat Listener:
 * Syncs license status in real-time across ALL systems, browsers, and mobile devices worldwide.
 */
export function listenToCollegeLicenses(
  callback: (colleges: CollegeClientLicense[], globalLockout: GlobalLockoutState) => void
): () => void {
  let isUnsubscribed = false;

  const handleUpdate = (colleges: CollegeClientLicense[], globalLockout: GlobalLockoutState) => {
    memoryColleges = colleges;
    memoryGlobalLockout = globalLockout;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(colleges));
        localStorage.setItem(GLOBAL_LOCKOUT_KEY, JSON.stringify(globalLockout));
      } catch (e) {}
    }
    callback(colleges, globalLockout);
  };

  // 1. Initial trigger with cached data
  callback(getAllCollegeLicenses(), getGlobalLockoutState());

  // 2. Window CustomEvent listener (intra-tab communication)
  const eventHandler = (e: any) => {
    if (e.detail?.colleges && e.detail?.globalLockout) {
      callback(e.detail.colleges, e.detail.globalLockout);
    } else {
      callback(getAllCollegeLicenses(), getGlobalLockoutState());
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener(LICENSE_EVENT_KEY, eventHandler);
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY || e.key === GLOBAL_LOCKOUT_KEY) {
        callback(getAllCollegeLicenses(), getGlobalLockoutState());
      }
    });
  }

  // 3. Realtime Firestore Listener
  let fsUnsub = () => {};
  try {
    fsUnsub = onSnapshot(
      doc(db, "system_licenses", "college_registry"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.colleges) && data.colleges.length > 0) {
            const gl: GlobalLockoutState = {
              isGlobalWebStopped: Boolean(data.globalLockout?.isGlobalWebStopped),
              isGlobalMobileStopped: Boolean(data.globalLockout?.isGlobalMobileStopped),
              reason: String(data.globalLockout?.reason || ""),
              stoppedAt: data.globalLockout?.stoppedAt || undefined,
            };
            handleUpdate(data.colleges, gl);
          }
        }
      },
      (err) => {
        console.warn("Firestore license listener notice:", err);
      }
    );
  } catch (e) {}

  // 4. Realtime Database Listener
  let rtdbUnsub = () => {};
  try {
    const rtdbRef = ref(rtdb, "spherex_licenses");
    rtdbUnsub = onValue(
      rtdbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (Array.isArray(val?.colleges) && val.colleges.length > 0) {
            const gl: GlobalLockoutState = {
              isGlobalWebStopped: Boolean(val.globalLockout?.isGlobalWebStopped),
              isGlobalMobileStopped: Boolean(val.globalLockout?.isGlobalMobileStopped),
              reason: String(val.globalLockout?.reason || ""),
              stoppedAt: val.globalLockout?.stoppedAt || undefined,
            };
            handleUpdate(val.colleges, gl);
          }
        }
      },
      (err) => {
        console.warn("RTDB license listener notice:", err);
      }
    );
  } catch (e) {}

  // 5. Periodic Heartbeat Polling (every 3.5s) to guarantee updates through proxies & firewalls
  const pollInterval = setInterval(async () => {
    if (isUnsubscribed) return;
    try {
      const res = await fetch("/api/creator/licenses", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.colleges)) {
          const gl: GlobalLockoutState = {
            isGlobalWebStopped: Boolean(json.globalLockout?.isGlobalWebStopped),
            isGlobalMobileStopped: Boolean(json.globalLockout?.isGlobalMobileStopped),
            reason: String(json.globalLockout?.reason || ""),
            stoppedAt: json.globalLockout?.stoppedAt || undefined,
          };
          handleUpdate(json.colleges, gl);
        }
      }
    } catch (e) {}
  }, 3500);

  return () => {
    isUnsubscribed = true;
    clearInterval(pollInterval);
    if (typeof window !== "undefined") {
      window.removeEventListener(LICENSE_EVENT_KEY, eventHandler);
    }
    fsUnsub();
    rtdbUnsub();
  };
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
 * Checks Global Lockout first, and specific college lockout second.
 */
export function isCollegeSuspendedForCurrentEnvironment(campus?: string): {
  isSuspended: boolean;
  platform: "WEB" | "MOBILE";
  college?: CollegeClientLicense;
  isGlobal?: boolean;
  reason?: string;
} {
  const isMobile = isCapacitorNative();
  const platform = isMobile ? "MOBILE" : "WEB";

  // 1. MASTER GLOBAL LOCKOUT CHECK (Applies to all systems and colleges)
  const global = getGlobalLockoutState();
  if (isMobile && global.isGlobalMobileStopped) {
    return {
      isSuspended: true,
      platform: "MOBILE",
      isGlobal: true,
      reason: global.reason || "Mobile Application stopped globally across all systems by Master Creator (SPHEREX Nithish Kumar).",
    };
  }

  if (!isMobile && global.isGlobalWebStopped) {
    return {
      isSuspended: true,
      platform: "WEB",
      isGlobal: true,
      reason: global.reason || "Web Application stopped globally across all systems by Master Creator (SPHEREX Nithish Kumar).",
    };
  }

  // 2. SPECIFIC COLLEGE CLIENT CHECK
  if (campus) {
    const college = getCollegeLicenseByCampus(campus);
    if (college) {
      if (isMobile && college.isMobileApplicationStopped) {
        return {
          isSuspended: true,
          platform: "MOBILE",
          college,
          isGlobal: false,
          reason: college.suspensionReason || "Native Mobile App stopped by Master Creator due to pending annual renewal payment.",
        };
      }

      if (!isMobile && college.isWebApplicationStopped) {
        return {
          isSuspended: true,
          platform: "WEB",
          college,
          isGlobal: false,
          reason: college.suspensionReason || "Web Application stopped by Master Creator due to pending annual renewal payment.",
        };
      }

      return { isSuspended: false, platform, college };
    }
  }

  return { isSuspended: false, platform };
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
 * Creator Action: Global Kill-Switch - Stop or Open Web Application for ALL colleges on ALL systems worldwide.
 */
export function setGlobalWebStatus(
  isStopped: boolean,
  reason: string = "SPHEREX Master Creator has stopped Web Application access across all institutions."
): GlobalLockoutState {
  const current = getGlobalLockoutState();
  const updated: GlobalLockoutState = {
    ...current,
    isGlobalWebStopped: isStopped,
    reason: isStopped ? reason : current.isGlobalMobileStopped ? current.reason : "",
    stoppedAt: isStopped ? new Date().toISOString() : undefined,
  };
  saveGlobalLockoutState(updated);
  return updated;
}

/**
 * Creator Action: Global Kill-Switch - Stop or Open Mobile App for ALL colleges on ALL mobile devices worldwide.
 */
export function setGlobalMobileStatus(
  isStopped: boolean,
  reason: string = "SPHEREX Master Creator has stopped Mobile Application access across all institutions."
): GlobalLockoutState {
  const current = getGlobalLockoutState();
  const updated: GlobalLockoutState = {
    ...current,
    isGlobalMobileStopped: isStopped,
    reason: isStopped ? reason : current.isGlobalWebStopped ? current.reason : "",
    stoppedAt: isStopped ? new Date().toISOString() : undefined,
  };
  saveGlobalLockoutState(updated);
  return updated;
}

/**
 * Creator Action: Emergency Master Freeze - Freeze ALL Web & Mobile Applications everywhere simultaneously!
 */
export function freezeAllApplicationsGlobally(
  isFrozen: boolean,
  reason: string = "EMERGENCY SYSTEM LOCKOUT: Master Creator (Nithish Kumar) has frozen all Web & Mobile application access."
): { colleges: CollegeClientLicense[]; globalLockout: GlobalLockoutState } {
  const globalLockout: GlobalLockoutState = {
    isGlobalWebStopped: isFrozen,
    isGlobalMobileStopped: isFrozen,
    reason: isFrozen ? reason : "",
    stoppedAt: isFrozen ? new Date().toISOString() : undefined,
  };

  const colleges = getAllCollegeLicenses().map((c) => ({
    ...c,
    isWebApplicationStopped: isFrozen,
    isMobileApplicationStopped: isFrozen,
    suspensionReason: isFrozen ? reason : "",
    suspendedAt: isFrozen ? new Date().toISOString() : undefined,
  }));

  saveCollegeLicenses(colleges);
  saveGlobalLockoutState(globalLockout);

  return { colleges, globalLockout };
}

/**
 * Creator Action: Restore ALL Applications Globally - Open Web and Mobile everywhere with 1 click.
 */
export function restoreAllApplicationsGlobally(): { colleges: CollegeClientLicense[]; globalLockout: GlobalLockoutState } {
  return freezeAllApplicationsGlobally(false, "");
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
