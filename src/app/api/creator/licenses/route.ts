import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface GlobalLockoutState {
  isGlobalWebStopped: boolean;
  isGlobalMobileStopped: boolean;
  reason: string;
  stoppedAt?: string;
  updatedAtMs?: number;
}

const FIRESTORE_PROJECT_ID = "spherex-5463b";
const FIRESTORE_API_KEY = "AIzaSyCx3cvAA5dWfLQfIKYzG236yUHy07_D67A";
const FIRESTORE_DOC_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/system_licenses/college_registry?key=${FIRESTORE_API_KEY}`;

const DEFAULT_COLLEGES = [
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

const PERSISTENT_LICENSE_FILE = path.join(process.cwd(), "prisma", "system_licenses.json");

function loadPersistentFromFile(): { colleges: any[]; globalLockout: GlobalLockoutState } | null {
  try {
    if (fs.existsSync(PERSISTENT_LICENSE_FILE)) {
      const raw = fs.readFileSync(PERSISTENT_LICENSE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.colleges)) {
        return parsed;
      }
    }
  } catch (err) {
    // Silent catch (e.g. read issues on Vercel lambda)
  }
  return null;
}

function savePersistentToFile(colleges: any[], globalLockout: GlobalLockoutState): void {
  try {
    const dir = path.dirname(PERSISTENT_LICENSE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      PERSISTENT_LICENSE_FILE,
      JSON.stringify({ colleges, globalLockout, savedAt: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  } catch (err) {
    // Expected on Vercel serverless read-only filesystem (EROFS), safely ignore
  }
}

// Convert Firestore REST field format to clean JavaScript value
function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("booleanValue" in val) return Boolean(val.booleanValue);
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return parseFloat(val.doubleValue);
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) return (val.arrayValue?.values || []).map(fromFirestoreValue);
  if ("mapValue" in val) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return val;
}

// Convert JavaScript value to Firestore REST field format
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Merge incoming colleges safely over DEFAULT_COLLEGES so essential metadata is never wiped
function mergeWithDefaultColleges(incoming: any[]): any[] {
  if (!Array.isArray(incoming) || incoming.length === 0) return DEFAULT_COLLEGES;
  return DEFAULT_COLLEGES.map((def) => {
    const found = incoming.find(
      (c) => (c.id && c.id === def.id) || (c.campus && c.campus.toUpperCase() === def.campus.toUpperCase())
    );
    if (!found) return def;
    return {
      ...def,
      ...found,
      isWebApplicationStopped: Boolean(found.isWebApplicationStopped),
      isMobileApplicationStopped: Boolean(found.isMobileApplicationStopped),
      suspensionReason: found.suspensionReason || def.suspensionReason || "",
    };
  });
}

// In-memory cache for ultra-fast server response
const initialFileCache = loadPersistentFromFile();
let cachedColleges = initialFileCache ? mergeWithDefaultColleges(initialFileCache.colleges) : DEFAULT_COLLEGES;
let cachedGlobalLockout: GlobalLockoutState = initialFileCache?.globalLockout || {
  isGlobalWebStopped: false,
  isGlobalMobileStopped: false,
  reason: "",
};

export async function GET() {
  try {
    // 1. Primary: Fetch LIVE data directly from Cloud Firestore REST API (works seamlessly on Vercel host)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(FIRESTORE_DOC_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const docJson = await res.json();
        if (docJson && docJson.fields) {
          const parsedDoc: Record<string, any> = {};
          for (const [k, v] of Object.entries(docJson.fields)) {
            parsedDoc[k] = fromFirestoreValue(v);
          }

          if (Array.isArray(parsedDoc.colleges) && parsedDoc.colleges.length > 0) {
            cachedColleges = mergeWithDefaultColleges(parsedDoc.colleges);
          }
          if (parsedDoc.globalLockout) {
            cachedGlobalLockout = {
              isGlobalWebStopped: Boolean(parsedDoc.globalLockout.isGlobalWebStopped),
              isGlobalMobileStopped: Boolean(parsedDoc.globalLockout.isGlobalMobileStopped),
              reason: String(parsedDoc.globalLockout.reason || ""),
              stoppedAt: parsedDoc.globalLockout.stoppedAt || undefined,
              updatedAtMs: parsedDoc.globalLockout.updatedAtMs,
            };
          }

          // Asynchronously update local file if disk is writable
          savePersistentToFile(cachedColleges, cachedGlobalLockout);

          return NextResponse.json({
            success: true,
            colleges: cachedColleges,
            globalLockout: cachedGlobalLockout,
            liveCloud: true,
            timestamp: new Date().toISOString(),
          }, {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              "Pragma": "no-cache",
              "Expires": "0",
            }
          });
        }
      }
    } catch (fsRestErr) {
      // If Firestore REST timed out or failed, try SDK or local fallback
    }

    // 2. Secondary fallback: Local persistent file / memory cache
    const fromFile = loadPersistentFromFile();
    if (fromFile) {
      cachedColleges = mergeWithDefaultColleges(fromFile.colleges);
      if (fromFile.globalLockout) {
        cachedGlobalLockout = {
          isGlobalWebStopped: Boolean(fromFile.globalLockout.isGlobalWebStopped),
          isGlobalMobileStopped: Boolean(fromFile.globalLockout.isGlobalMobileStopped),
          reason: String(fromFile.globalLockout.reason || ""),
          stoppedAt: fromFile.globalLockout.stoppedAt || undefined,
          updatedAtMs: fromFile.globalLockout.updatedAtMs,
        };
      }
    }

    return NextResponse.json({
      success: true,
      colleges: cachedColleges,
      globalLockout: cachedGlobalLockout,
      liveCloud: false,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: true,
        colleges: cachedColleges,
        globalLockout: cachedGlobalLockout,
        error: err?.message || "Fallback to memory cache",
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { colleges, globalLockout } = body;

    if (Array.isArray(colleges)) {
      cachedColleges = mergeWithDefaultColleges(colleges);
    }
    if (globalLockout) {
      cachedGlobalLockout = {
        isGlobalWebStopped: Boolean(globalLockout.isGlobalWebStopped),
        isGlobalMobileStopped: Boolean(globalLockout.isGlobalMobileStopped),
        reason: String(globalLockout.reason || ""),
        stoppedAt:
          globalLockout.stoppedAt ||
          (globalLockout.isGlobalWebStopped || globalLockout.isGlobalMobileStopped
            ? new Date().toISOString()
            : undefined),
        updatedAtMs: globalLockout.updatedAtMs || Date.now(),
      };
    }

    // Save to local disk file if writable (local dev machine)
    savePersistentToFile(cachedColleges, cachedGlobalLockout);

    // Save directly to Cloud Firestore REST API (guarantees persistence on Vercel deployment)
    try {
      const payloadObj: Record<string, any> = {
        colleges: cachedColleges,
        globalLockout: cachedGlobalLockout,
        updatedAt: new Date().toISOString(),
        updatedAtMs: Date.now(),
        updatedBy: "SPHEREX_MASTER_CREATOR",
      };

      const firestoreFields: Record<string, any> = {};
      for (const [k, v] of Object.entries(payloadObj)) {
        firestoreFields[k] = toFirestoreValue(v);
      }

      await fetch(FIRESTORE_DOC_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: firestoreFields }),
      });
    } catch (fsWriteErr) {
      console.warn("Firestore REST write notice:", fsWriteErr);
    }

    // Also sync via client SDK if running in environment with active connection
    try {
      setDoc(doc(db, "system_licenses", "college_registry"), {
        colleges: cachedColleges,
        globalLockout: cachedGlobalLockout,
        updatedAt: new Date().toISOString(),
        updatedAtMs: Date.now(),
        updatedBy: "SPHEREX_MASTER_CREATOR",
      }, { merge: true }).catch(() => {});
    } catch (e) {}

    return NextResponse.json({
      success: true,
      colleges: cachedColleges,
      globalLockout: cachedGlobalLockout,
      message: "Licenses and killswitch status updated across cloud infrastructure and Vercel host",
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update licenses" },
      { status: 500 }
    );
  }
}

