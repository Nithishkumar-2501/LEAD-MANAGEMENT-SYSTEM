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

import { isCapacitorNative, isMobileDeviceOrApp } from "./mobileFetch";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

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
  updatedAtMs?: number;
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

// Merge incoming colleges safely over DEFAULT_COLLEGES so essential metadata is never lost
export function mergeCollegesWithDefaults(incoming: any[]): CollegeClientLicense[] {
  if (!Array.isArray(incoming) || incoming.length === 0) return DEFAULT_COLLEGES;
  return DEFAULT_COLLEGES.map((def) => {
    const found = incoming.find(
      (c) => (c.id && c.id === def.id) || (c.campus && c.campus.toUpperCase() === def.campus.toUpperCase())
    );
    if (!found) return def;
    const total = (found.baseAnnualFee || def.baseAnnualFee || 150000) + (found.overageSurcharge || 0);
    const paid = found.amountPaid ?? def.amountPaid ?? 0;
    const outstanding = Math.max(0, total - paid);
    let status: CollegePaymentStatus = found.paymentStatus || def.paymentStatus || "PENDING";
    if (outstanding === 0) status = "PAID";
    else if (new Date(found.paymentDueDate || def.paymentDueDate).getTime() < Date.now()) status = "OVERDUE";

    return {
      ...def,
      ...found,
      totalPayableAmount: total,
      outstandingBalance: outstanding,
      paymentStatus: status,
      isWebApplicationStopped: Boolean(found.isWebApplicationStopped),
      isMobileApplicationStopped: Boolean(found.isMobileApplicationStopped),
      suspensionReason: found.suspensionReason || def.suspensionReason || "",
    };
  });
}

// In-memory runtime cache
let memoryColleges: CollegeClientLicense[] = DEFAULT_COLLEGES;
let memoryGlobalLockout: GlobalLockoutState = DEFAULT_GLOBAL_LOCKOUT;
let lastLocalActionTime = 0; // Monotonic guard preventing polling from reverting recent user actions

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
      // If memoryGlobalLockout is active/open (false), do not let a stale stopped state in localStorage override it
      if (!memoryGlobalLockout.isGlobalWebStopped && !memoryGlobalLockout.isGlobalMobileStopped && (parsed.isGlobalWebStopped || parsed.isGlobalMobileStopped)) {
        localStorage.setItem(GLOBAL_LOCKOUT_KEY, JSON.stringify(memoryGlobalLockout));
        return memoryGlobalLockout;
      }
      memoryGlobalLockout = {
        isGlobalWebStopped: Boolean(parsed.isGlobalWebStopped),
        isGlobalMobileStopped: Boolean(parsed.isGlobalMobileStopped),
        reason: String(parsed.reason || ""),
        stoppedAt: parsed.stoppedAt || undefined,
        updatedAtMs: parsed.updatedAtMs,
      };
      return memoryGlobalLockout;
    }
  } catch (err) {
    console.warn("Failed to load global lockout state from localStorage:", err);
  }
  return memoryGlobalLockout;
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
      const mapped = mergeCollegesWithDefaults(parsed);
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
 * Ensures an atomic snapshot payload containing BOTH colleges and globalLockout.
 */
export async function pushLicensesToCloud(
  colleges: CollegeClientLicense[],
  globalLockout: GlobalLockoutState
): Promise<void> {
  const mergedColleges = mergeCollegesWithDefaults(colleges);
  const payload = sanitizeForFirebase({
    colleges: mergedColleges,
    globalLockout,
    updatedAt: new Date().toISOString(),
    updatedAtMs: Date.now(),
    updatedBy: "SPHEREX_MASTER_CREATOR",
  });

  // 1. Next.js API Route (Syncs Vercel serverless host and updates Firestore REST)
  const apiTask = (async () => {
    try {
      await fetch("/api/creator/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colleges: mergedColleges, globalLockout }),
      });
    } catch (e) {
      // Local or native network catch
    }
  })();

  // 2. Cloud Firestore SDK (Direct client SDK write with 2500ms safety timeout)
  const firestoreTask = (async () => {
    try {
      const fsTasks = [
        setDoc(doc(db, "system_licenses", "college_registry"), payload, { merge: true }),
        setDoc(doc(db, "system_licenses", "global_lockout"), sanitizeForFirebase(globalLockout), { merge: true }),
        ...mergedColleges
          .filter((c) => c.campus)
          .map((c) => setDoc(doc(db, "system_licenses", c.campus), sanitizeForFirebase(c), { merge: true })),
      ];
      await Promise.race([
        Promise.allSettled(fsTasks),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500)),
      ]);
    } catch (e) {
      console.warn("Firestore license push error notice:", e);
    }
  })();

  await Promise.allSettled([apiTask, firestoreTask]);
}

/**
 * Atomic save of both colleges registry and globalLockout to avoid race conditions.
 */
export function saveAllLicensesAndLockout(
  colleges: CollegeClientLicense[],
  globalLockout: GlobalLockoutState
): void {
  lastLocalActionTime = Date.now();
  const merged = mergeCollegesWithDefaults(colleges);
  const lockoutWithTimestamp: GlobalLockoutState = {
    ...globalLockout,
    updatedAtMs: Date.now(),
  };

  memoryColleges = merged;
  memoryGlobalLockout = lockoutWithTimestamp;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem(GLOBAL_LOCKOUT_KEY, JSON.stringify(lockoutWithTimestamp));
      window.dispatchEvent(
        new CustomEvent(LICENSE_EVENT_KEY, {
          detail: { colleges: merged, globalLockout: lockoutWithTimestamp },
        })
      );
    } catch (err) {
      console.warn("Failed to save license registry to localStorage:", err);
    }
  }

  // Broadcast to Cloud Firestore and API
  pushLicensesToCloud(merged, lockoutWithTimestamp);
}

/**
 * Save Global Lockout state to localStorage and cloud.
 */
export function saveGlobalLockoutState(lockout: GlobalLockoutState): void {
  saveAllLicensesAndLockout(memoryColleges, lockout);
}

/**
 * Save updated college registry to localStorage and cloud.
 */
export function saveCollegeLicenses(licenses: CollegeClientLicense[]): void {
  saveAllLicensesAndLockout(licenses, memoryGlobalLockout);
}

/**
 * Direct Force-Fetch from Cloud Firestore / API:
 * Call this immediately on app launch or prior to login so mobile and web
 * NEVER rely on stale local defaults.
 */
export async function forceFetchLatestLicenseFromCloud(): Promise<{
  colleges: CollegeClientLicense[];
  globalLockout: GlobalLockoutState;
}> {
  // If the user made a local change in the last 4 seconds, don't let cloud latency overwrite it
  if (Date.now() - lastLocalActionTime < 4000) {
    return {
      colleges: memoryColleges,
      globalLockout: memoryGlobalLockout,
    };
  }

  // 1. Primary on Web: Direct Next.js API route (proxies live Cloud Firestore with no-store cache)
  if (typeof window !== "undefined" && !isCapacitorNative()) {
    try {
      const res = await Promise.race([
        fetch("/api/creator/licenses", { cache: "no-store" }),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
      ]);
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.colleges)) {
          const gl: GlobalLockoutState = {
            isGlobalWebStopped: Boolean(json.globalLockout?.isGlobalWebStopped),
            isGlobalMobileStopped: Boolean(json.globalLockout?.isGlobalMobileStopped),
            reason: String(json.globalLockout?.reason || ""),
            stoppedAt: json.globalLockout?.stoppedAt || undefined,
            updatedAtMs: json.globalLockout?.updatedAtMs,
          };
          const merged = mergeCollegesWithDefaults(json.colleges);
          memoryColleges = merged;
          memoryGlobalLockout = gl;
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              localStorage.setItem(GLOBAL_LOCKOUT_KEY, JSON.stringify(gl));
              window.dispatchEvent(
                new CustomEvent(LICENSE_EVENT_KEY, {
                  detail: { colleges: merged, globalLockout: gl },
                })
              );
            } catch (e) {}
          }
          return { colleges: merged, globalLockout: gl };
        }
      }
    } catch (e) {
      // Continue to direct Cloud Firestore SDK fallback
    }
  }

  // 2. Direct Cloud Firestore SDK fetch (ideal for Mobile apps and fallback on web)
  try {
    const docSnap = await Promise.race([
      getDoc(doc(db, "system_licenses", "college_registry")),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
    ]);
    if (docSnap?.exists?.()) {
      const data = docSnap.data();
      if (Array.isArray(data?.colleges) && data.colleges.length > 0) {
        const gl: GlobalLockoutState = {
          isGlobalWebStopped: Boolean(data.globalLockout?.isGlobalWebStopped),
          isGlobalMobileStopped: Boolean(data.globalLockout?.isGlobalMobileStopped),
          reason: String(data.globalLockout?.reason || ""),
          stoppedAt: data.globalLockout?.stoppedAt || undefined,
          updatedAtMs: data.globalLockout?.updatedAtMs,
        };
        const merged = mergeCollegesWithDefaults(data.colleges);
        memoryColleges = merged;
        memoryGlobalLockout = gl;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            localStorage.setItem(GLOBAL_LOCKOUT_KEY, JSON.stringify(gl));
            window.dispatchEvent(
              new CustomEvent(LICENSE_EVENT_KEY, {
                detail: { colleges: merged, globalLockout: gl },
              })
            );
          } catch (e) {}
        }
        return { colleges: merged, globalLockout: gl };
      }
    }
  } catch (err) {}

  return {
    colleges: getAllCollegeLicenses(),
    globalLockout: getGlobalLockoutState(),
  };
}

/**
 * Live Subscription & Heartbeat Listener:
 * Syncs license status in real-time across ALL systems, browsers, and mobile devices worldwide.
 */
export function listenToCollegeLicenses(
  callback: (colleges: CollegeClientLicense[], globalLockout: GlobalLockoutState) => void
): () => void {
  let isUnsubscribed = false;

  const handleUpdate = (incomingColleges: CollegeClientLicense[], incomingGlobalLockout: GlobalLockoutState) => {
    // If the creator just toggled a button locally in the past 4 seconds, ignore older incoming echoes
    if (Date.now() - lastLocalActionTime < 4000) {
      return;
    }
    const merged = mergeCollegesWithDefaults(incomingColleges);
    memoryColleges = merged;
    memoryGlobalLockout = incomingGlobalLockout;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem(GLOBAL_LOCKOUT_KEY, JSON.stringify(incomingGlobalLockout));
      } catch (e) {}
    }
    callback(merged, incomingGlobalLockout);
  };

  // 1. Initial trigger with cached data
  callback(getAllCollegeLicenses(), getGlobalLockoutState());

  // 2. Force instant pull from Cloud Firestore on start
  forceFetchLatestLicenseFromCloud().then((res) => {
    if (!isUnsubscribed) {
      handleUpdate(res.colleges, res.globalLockout);
    }
  });

  // 3. Window CustomEvent listener (intra-tab communication)
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

  // 4. Realtime Firestore Live Snapshot Listener (Sub-100ms instant cloud synchronization)
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
              updatedAtMs: data.globalLockout?.updatedAtMs,
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

  // 5. Periodic Heartbeat Polling (every 4s) to guarantee consistent state across mobile & web
  const pollInterval = setInterval(async () => {
    if (isUnsubscribed) return;
    if (Date.now() - lastLocalActionTime < 4000) return;
    try {
      const res = await forceFetchLatestLicenseFromCloud();
      if (!isUnsubscribed && res.colleges.length > 0) {
        handleUpdate(res.colleges, res.globalLockout);
      }
    } catch (e) {}
  }, 4000);

  return () => {
    isUnsubscribed = true;
    clearInterval(pollInterval);
    if (typeof window !== "undefined") {
      window.removeEventListener(LICENSE_EVENT_KEY, eventHandler);
    }
    fsUnsub();
  };
}

/**
 * Find license by campus key ("KARUR" | "COIMBATORE").
 */
export function getCollegeLicenseByCampus(campusOrId?: string): CollegeClientLicense | undefined {
  if (!campusOrId) return undefined;
  const colleges = getAllCollegeLicenses();
  const clean = campusOrId.toUpperCase().trim();
  return colleges.find(
    (c) =>
      c.campus.toUpperCase() === clean ||
      c.id.toUpperCase() === clean ||
      c.shortCode.toUpperCase() === clean ||
      clean.includes(c.campus.toUpperCase()) ||
      c.id.toUpperCase().includes(clean)
  );
}

/**
 * Find license by college identifier.
 */
export function getCollegeLicenseById(id: string): CollegeClientLicense | undefined {
  const colleges = getAllCollegeLicenses();
  return colleges.find((c) => c.id === id);
}

/**
 * Universal Environment Suspension Check:
 * Determines if access is stopped for the current environment (Web or Mobile).
 * 
 * Hierarchy:
 * 1. Global Emergency Freeze (Web AND Mobile stopped globally) -> ALWAYS LOCKS EVERYONE.
 * 2. Global Mobile Stopped -> Locks Native Mobile App + Mobile Browsers.
 * 3. Global Web Stopped -> Locks Desktop Web Browsers.
 * 4. College Frozen (Web AND Mobile stopped for college) -> LOCKS THAT COLLEGE ON ALL PLATFORMS.
 * 5. College Mobile Stopped -> Locks Native Mobile App + Mobile Browsers for that college.
 * 6. College Web Stopped -> Locks Web for that college.
 */
export function isCollegeSuspendedForCurrentEnvironment(
  campus?: string,
  overrideColleges?: CollegeClientLicense[],
  overrideGlobal?: GlobalLockoutState
): {
  isSuspended: boolean;
  platform: "WEB" | "MOBILE";
  college?: CollegeClientLicense;
  isGlobal?: boolean;
  reason?: string;
} {
  const isNativeApp = isCapacitorNative();
  const isMobile = isNativeApp || isMobileDeviceOrApp();
  const platform: "WEB" | "MOBILE" = isNativeApp ? "MOBILE" : "WEB";

  // 1. MASTER GLOBAL LOCKOUT CHECK (Applies to all systems and colleges worldwide)
  const global = overrideGlobal || getGlobalLockoutState();

  // A. Emergency Global Freeze: BOTH Web and Mobile stopped everywhere
  if (global.isGlobalWebStopped && global.isGlobalMobileStopped) {
    return {
      isSuspended: true,
      platform,
      isGlobal: true,
      reason:
        global.reason ||
        "EMERGENCY SYSTEM LOCKDOWN: Master Creator (SPHEREX Nithish Kumar) has stopped all Web and Mobile applications globally.",
    };
  }

  // B. Global Mobile Stoppage: Mobile app stopped on all devices worldwide
  if ((isNativeApp || isMobile) && global.isGlobalMobileStopped) {
    return {
      isSuspended: true,
      platform: "MOBILE",
      isGlobal: true,
      reason:
        global.reason ||
        "Mobile Application stopped globally across all systems by Master Creator (SPHEREX Nithish Kumar).",
    };
  }

  // C. Global Web Stoppage: Web application stopped across all computers & browsers worldwide
  if (!isNativeApp && global.isGlobalWebStopped) {
    return {
      isSuspended: true,
      platform: "WEB",
      isGlobal: true,
      reason:
        global.reason ||
        "Web Application host stopped globally across all systems by Master Creator (SPHEREX Nithish Kumar).",
    };
  }

  // 2. SPECIFIC COLLEGE CLIENT CHECK
  if (campus) {
    const list = overrideColleges || getAllCollegeLicenses();
    const clean = campus.toUpperCase().trim();
    const college = list.find(
      (c) =>
        c.campus.toUpperCase() === clean ||
        c.id.toUpperCase() === clean ||
        c.shortCode.toUpperCase() === clean ||
        clean.includes(c.campus.toUpperCase()) ||
        c.id.toUpperCase().includes(clean)
    );

    if (college) {
      // Both Web and Mobile stopped for this college -> Complete institutional lockout
      if (college.isWebApplicationStopped && college.isMobileApplicationStopped) {
        return {
          isSuspended: true,
          platform,
          college,
          isGlobal: false,
          reason:
            college.suspensionReason ||
            `Full application access (Web & Mobile) stopped for ${college.collegeName} by Master Creator due to pending annual license renewal.`,
        };
      }

      // Mobile stopped for this college
      if ((isNativeApp || isMobile) && college.isMobileApplicationStopped) {
        return {
          isSuspended: true,
          platform: "MOBILE",
          college,
          isGlobal: false,
          reason:
            college.suspensionReason ||
            `Native Mobile App stopped for ${college.collegeName} by Master Creator due to pending annual renewal payment.`,
        };
      }

      // Web stopped for this college
      if (!isNativeApp && college.isWebApplicationStopped) {
        return {
          isSuspended: true,
          platform: "WEB",
          college,
          isGlobal: false,
          reason:
            college.suspensionReason ||
            `Web Application stopped for ${college.collegeName} by Master Creator due to pending annual renewal payment.`,
        };
      }

      return { isSuspended: false, platform, college };
    }
  }

  // 3. Fallback when campus is not yet provided (e.g. on initial Login page before typing ID):
  // If ALL registered colleges have Web or Mobile stopped, lock out access
  const allRegisteredColleges = overrideColleges || getAllCollegeLicenses();
  if (allRegisteredColleges.length > 0) {
    const allStopped = allRegisteredColleges.every((c) =>
      isMobile ? c.isMobileApplicationStopped : c.isWebApplicationStopped
    );
    if (allStopped) {
      return {
        isSuspended: true,
        platform,
        isGlobal: true,
        reason: isMobile
          ? "Native Mobile Application access stopped across all institutions by Master Creator."
          : "Web Application access stopped across all institutions by Master Creator.",
      };
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
        suspensionReason: isStopped ? reason : c.isMobileApplicationStopped ? c.suspensionReason : "",
        suspendedAt: isStopped ? new Date().toISOString() : undefined,
      };
    }
    return c;
  });
  saveAllLicensesAndLockout(updated, memoryGlobalLockout);
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
        suspensionReason: isStopped ? reason : c.isWebApplicationStopped ? c.suspensionReason : "",
        suspendedAt: isStopped ? new Date().toISOString() : undefined,
      };
    }
    return c;
  });
  saveAllLicensesAndLockout(updated, memoryGlobalLockout);
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
  saveAllLicensesAndLockout(updated, memoryGlobalLockout);
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
  saveAllLicensesAndLockout(memoryColleges, updated);
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
  saveAllLicensesAndLockout(memoryColleges, updated);
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

  saveAllLicensesAndLockout(colleges, globalLockout);
  return { colleges, globalLockout };
}

/**
 * Creator Action: Restore ALL Applications Globally - Open Web and Mobile everywhere with 1 click.
 */
export function restoreAllApplicationsGlobally(): {
  colleges: CollegeClientLicense[];
  globalLockout: GlobalLockoutState;
} {
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

  saveAllLicensesAndLockout(updated, memoryGlobalLockout);
  return { updatedList: updated, targetCollege };
}

/**
 * Creator Action: Register a new College using SPHEREX CRM.
 */
export function registerNewCollegeClient(
  newCollege: Partial<CollegeClientLicense>
): CollegeClientLicense[] {
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
  saveAllLicensesAndLockout(updated, memoryGlobalLockout);
  return updated;
}
