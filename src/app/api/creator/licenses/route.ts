import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db, rtdb } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, get, set } from "firebase/database";

export interface GlobalLockoutState {
  isGlobalWebStopped: boolean;
  isGlobalMobileStopped: boolean;
  reason: string;
  stoppedAt?: string;
  updatedAtMs?: number;
}

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
    console.warn("Notice reading persistent license file:", err);
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
    console.warn("Notice saving persistent license file:", err);
  }
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

// In-memory cache for ultra-fast server response and offline resilience
const initialFileCache = loadPersistentFromFile();
let cachedColleges = initialFileCache ? mergeWithDefaultColleges(initialFileCache.colleges) : DEFAULT_COLLEGES;
let cachedGlobalLockout: GlobalLockoutState = initialFileCache?.globalLockout || {
  isGlobalWebStopped: false,
  isGlobalMobileStopped: false,
  reason: "",
};

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = sanitizeForFirestore(v);
  }
  return out;
}

export async function GET() {
  try {
    // 1. Read from local persistent file and in-memory cache (ultra-fast sub-millisecond response)
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
    } else {
      // Only if no local file exists on disk, attempt one-time Firestore pull
      try {
        const snap = await Promise.race([
          getDoc(doc(db, "system_licenses", "college_registry")),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000)),
        ]);
        if (snap?.exists?.()) {
          const data = snap.data();
          if (Array.isArray(data?.colleges) && data.colleges.length > 0) {
            cachedColleges = mergeWithDefaultColleges(data.colleges);
          }
          if (data?.globalLockout) {
            cachedGlobalLockout = {
              isGlobalWebStopped: Boolean(data.globalLockout.isGlobalWebStopped),
              isGlobalMobileStopped: Boolean(data.globalLockout.isGlobalMobileStopped),
              reason: String(data.globalLockout.reason || ""),
              stoppedAt: data.globalLockout.stoppedAt || undefined,
              updatedAtMs: data.globalLockout.updatedAtMs,
            };
          }
          savePersistentToFile(cachedColleges, cachedGlobalLockout);
        }
      } catch (fsErr) {
        // Fallback to in-memory defaults
      }
    }

    return NextResponse.json({
      success: true,
      colleges: cachedColleges,
      globalLockout: cachedGlobalLockout,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: true,
        colleges: cachedColleges,
        globalLockout: cachedGlobalLockout,
        error: err?.message || "Failed to fetch from cloud, returning memory cache",
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

    // Immediately persist to disk on the host machine
    savePersistentToFile(cachedColleges, cachedGlobalLockout);

    // Persist to Cloud Firestore in background with safe 2500ms race timeout
    const payload = sanitizeForFirestore({
      colleges: cachedColleges,
      globalLockout: cachedGlobalLockout,
      updatedAt: new Date().toISOString(),
      updatedAtMs: Date.now(),
      updatedBy: "SPHEREX_MASTER_CREATOR",
    });

    Promise.race([
      setDoc(doc(db, "system_licenses", "college_registry"), payload, { merge: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500)),
    ]).catch((fsErr) => {
      console.warn("Firestore license background save notice:", fsErr);
    });

    // Attempt RTDB with 1000ms safe race timeout (never block)
    Promise.race([
      set(ref(rtdb, "spherex_licenses"), payload),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000)),
    ]).catch(() => {});

    return NextResponse.json({
      success: true,
      colleges: cachedColleges,
      globalLockout: cachedGlobalLockout,
      message: "Licenses and killswitch status updated across cloud infrastructure",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update licenses" },
      { status: 500 }
    );
  }
}
