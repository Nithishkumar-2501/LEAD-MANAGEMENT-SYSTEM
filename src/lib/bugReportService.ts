"use client";

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { ref, set, update, remove, get } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";

export type BugSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type BugStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type BugCategory =
  | "LEADS"
  | "ADMISSIONS"
  | "CSV_IMPORT"
  | "MOBILE_APP"
  | "AUTHENTICATION"
  | "CALLS_COMMUNICATION"
  | "PAYMENTS"
  | "DASHBOARD_UI"
  | "OTHER";

export interface BugReport {
  id: string;
  ticketNumber: string; // e.g. "SPH-BUG-101"
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity: BugSeverity;
  status: BugStatus;
  category: BugCategory;
  reportedBy: string; // Username of the admin/teacher/user
  reportedRole: "ADMIN" | "TEACHER" | "CREATOR" | "USER";
  campus: string; // "KARUR" | "COIMBATORE" | "ALL"
  pageOrUrl?: string;
  deviceInfo: {
    platform: "WEB" | "ANDROID" | "IOS";
    userAgent: string;
    screenResolution?: string;
    timestamp: string;
  };
  attachmentUrl?: string;
  errorStack?: string;
  creatorNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BugMetrics {
  total: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  hasCriticalOpen: boolean;
}

const STORAGE_KEY = "spherex_bug_reports_cache";
export const BUGS_UPDATED_EVENT = "spherex_bugs_updated";

// Default realistic sample bug reports to demonstrate live telemetry
export const DEFAULT_BUGS: BugReport[] = [
  {
    id: "bug_sample_101",
    ticketNumber: "SPH-BUG-101",
    title: "CSV Lead Import with empty email triggers fallback notification",
    description: "When importing CSV files from school outreach where students don't have personal emails, candidate ID fallback email takes 2 seconds to generate.",
    severity: "MEDIUM",
    status: "RESOLVED",
    category: "CSV_IMPORT",
    reportedBy: "adminkarur@123",
    reportedRole: "ADMIN",
    campus: "KARUR",
    pageOrUrl: "/dashboard?tab=CONTACTS",
    deviceInfo: {
      platform: "WEB",
      userAgent: "Chrome 122 on Windows 11",
      screenResolution: "1920x1080",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    creatorNotes: "Fixed in csvParser.ts with atomic fallback email generator.",
    resolvedAt: new Date(Date.now() - 86400000).toISOString(),
    resolvedBy: "spherexnithish# (Master Creator)",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "bug_sample_102",
    ticketNumber: "SPH-BUG-102",
    title: "Native Android dialer requires confirmation on Xiaomi MIUI devices",
    description: "Calling lead candidate from mobile view opens native tel: URI but asks for SIM selection dialog twice on dual SIM phones.",
    severity: "LOW",
    status: "IN_PROGRESS",
    category: "CALLS_COMMUNICATION",
    reportedBy: "faculty_cse@vsb.ac.in",
    reportedRole: "TEACHER",
    campus: "COIMBATORE",
    pageOrUrl: "/dashboard?tab=USER_DASHBOARD",
    deviceInfo: {
      platform: "ANDROID",
      userAgent: "Capacitor Mobile Native / Android 14",
      screenResolution: "1080x2400",
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    creatorNotes: "Investigating Capacitor CallIntent bridge permission handler.",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

/**
 * Retrieve all bug reports from local cache
 */
export function getAllBugReports(): BugReport[] {
  if (typeof window === "undefined") return DEFAULT_BUGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BUGS));
      return DEFAULT_BUGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_BUGS;
  } catch (e) {
    return DEFAULT_BUGS;
  }
}

/**
 * Save / Raise a new bug report from Admin, Teacher, or User
 */
export async function saveBugReport(
  payload: Omit<BugReport, "id" | "ticketNumber" | "status" | "createdAt" | "updatedAt" | "deviceInfo"> & {
    id?: string;
    ticketNumber?: string;
    status?: BugStatus;
    deviceInfo?: BugReport["deviceInfo"];
  }
): Promise<BugReport> {
  const currentBugs = getAllBugReports();
  const nextTicketNum = `SPH-BUG-${100 + currentBugs.length + 1}`;
  const now = new Date().toISOString();

  const newBug: BugReport = {
    id: payload.id || `bug_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticketNumber: payload.ticketNumber || nextTicketNum,
    title: payload.title,
    description: payload.description,
    stepsToReproduce: payload.stepsToReproduce || "",
    expectedBehavior: payload.expectedBehavior || "",
    actualBehavior: payload.actualBehavior || "",
    severity: payload.severity || "MEDIUM",
    status: payload.status || "OPEN",
    category: payload.category || "OTHER",
    reportedBy: payload.reportedBy || "anonymous_user",
    reportedRole: payload.reportedRole || "USER",
    campus: payload.campus || "KARUR",
    pageOrUrl: payload.pageOrUrl || (typeof window !== "undefined" ? window.location.pathname : ""),
    deviceInfo: payload.deviceInfo || {
      platform: "WEB",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Web Client",
      screenResolution: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "Unknown",
      timestamp: now,
    },
    attachmentUrl: payload.attachmentUrl,
    errorStack: payload.errorStack,
    creatorNotes: payload.creatorNotes || "",
    createdAt: now,
    updatedAt: now,
  };

  const updatedBugs = [newBug, ...currentBugs.filter((b) => b.id !== newBug.id)];

  // Update localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBugs));
      window.dispatchEvent(new CustomEvent(BUGS_UPDATED_EVENT, { detail: newBug }));
    } catch (e) {}
  }

  // Asynchronously synchronize to Firebase Firestore & RTDB in background
  Promise.allSettled([
    setDoc(doc(db, "bug_reports", newBug.id), newBug, { merge: true }),
    set(ref(rtdb, `bugs/${newBug.id}`), newBug),
  ]).catch((err) => {
    console.warn("Notice syncing bug report to Firebase:", err);
  });

  return newBug;
}

/**
 * Update the status or resolution notes of a bug report (Master Creator action)
 */
export async function updateBugStatus(
  bugId: string,
  newStatus: BugStatus,
  creatorNotes?: string,
  resolvedBy: string = "spherexnithish# (Master Creator)"
): Promise<BugReport | null> {
  const currentBugs = getAllBugReports();
  const target = currentBugs.find((b) => b.id === bugId);
  if (!target) return null;

  const now = new Date().toISOString();
  const updatedBug: BugReport = {
    ...target,
    status: newStatus,
    creatorNotes: creatorNotes !== undefined ? creatorNotes : target.creatorNotes,
    resolvedAt: (newStatus === "RESOLVED" || newStatus === "CLOSED") ? (target.resolvedAt || now) : undefined,
    resolvedBy: (newStatus === "RESOLVED" || newStatus === "CLOSED") ? resolvedBy : undefined,
    updatedAt: now,
  };

  const updatedList = currentBugs.map((b) => (b.id === bugId ? updatedBug : b));

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent(BUGS_UPDATED_EVENT, { detail: updatedBug }));
    } catch (e) {}
  }

  // Update Firestore & RTDB
  Promise.allSettled([
    updateDoc(doc(db, "bug_reports", bugId), {
      status: updatedBug.status,
      creatorNotes: updatedBug.creatorNotes || "",
      resolvedAt: updatedBug.resolvedAt || null,
      resolvedBy: updatedBug.resolvedBy || null,
      updatedAt: now,
    }),
    update(ref(rtdb, `bugs/${bugId}`), {
      status: updatedBug.status,
      creatorNotes: updatedBug.creatorNotes || "",
      resolvedAt: updatedBug.resolvedAt || null,
      resolvedBy: updatedBug.resolvedBy || null,
      updatedAt: now,
    }),
  ]).catch((err) => {
    console.warn("Notice updating bug in Firebase:", err);
  });

  return updatedBug;
}

/**
 * Permanently delete / archive a bug report
 */
export async function deleteBugReport(bugId: string): Promise<boolean> {
  const currentBugs = getAllBugReports();
  const filtered = currentBugs.filter((b) => b.id !== bugId);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent(BUGS_UPDATED_EVENT, { detail: { id: bugId, deleted: true } }));
    } catch (e) {}
  }

  Promise.allSettled([
    deleteDoc(doc(db, "bug_reports", bugId)),
    remove(ref(rtdb, `bugs/${bugId}`)),
  ]).catch((err) => {
    console.warn("Notice deleting bug from Firebase:", err);
  });

  return true;
}

/**
 * Listen to live bug report updates from Firestore, RTDB, and local window events
 */
export function listenToBugReports(callback: (bugs: BugReport[]) => void): () => void {
  // 1. Initial emit from local cache
  callback(getAllBugReports());

  // 2. Listen to local custom window events
  const handleLocalUpdate = () => {
    callback(getAllBugReports());
  };
  if (typeof window !== "undefined") {
    window.addEventListener(BUGS_UPDATED_EVENT, handleLocalUpdate);
    window.addEventListener("storage", handleLocalUpdate);
  }

  // 3. Live Firestore subscription
  let unsubscribeFirestore: (() => void) | null = null;
  try {
    const bugsCol = collection(db, "bug_reports");
    unsubscribeFirestore = onSnapshot(
      bugsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteBugs: BugReport[] = [];
          snapshot.forEach((d) => {
            remoteBugs.push(d.data() as BugReport);
          });
          remoteBugs.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteBugs));
          }
          callback(remoteBugs);
        }
      },
      (err) => {
        console.warn("Firestore bug_reports listener notice:", err);
      }
    );
  } catch (e) {
    console.warn("Firestore subscription error:", e);
  }

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener(BUGS_UPDATED_EVENT, handleLocalUpdate);
      window.removeEventListener("storage", handleLocalUpdate);
    }
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

/**
 * Calculate metrics for bug indicators
 */
export function calculateBugMetrics(bugs: BugReport[]): BugMetrics {
  const total = bugs.length;
  const openCount = bugs.filter((b) => b.status === "OPEN").length;
  const inProgressCount = bugs.filter((b) => b.status === "IN_PROGRESS").length;
  const resolvedCount = bugs.filter((b) => b.status === "RESOLVED").length;
  const closedCount = bugs.filter((b) => b.status === "CLOSED").length;

  const criticalCount = bugs.filter(
    (b) => b.severity === "CRITICAL" && (b.status === "OPEN" || b.status === "IN_PROGRESS")
  ).length;
  const highCount = bugs.filter(
    (b) => b.severity === "HIGH" && (b.status === "OPEN" || b.status === "IN_PROGRESS")
  ).length;
  const mediumCount = bugs.filter(
    (b) => b.severity === "MEDIUM" && (b.status === "OPEN" || b.status === "IN_PROGRESS")
  ).length;
  const lowCount = bugs.filter(
    (b) => b.severity === "LOW" && (b.status === "OPEN" || b.status === "IN_PROGRESS")
  ).length;

  return {
    total,
    openCount,
    inProgressCount,
    resolvedCount,
    closedCount,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    hasCriticalOpen: criticalCount > 0,
  };
}
