import { NextResponse } from "next/server";
import { db, rtdb } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, get, set } from "firebase/database";

export interface GlobalLockoutState {
  isGlobalWebStopped: boolean;
  isGlobalMobileStopped: boolean;
  reason: string;
  stoppedAt?: string;
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

// In-memory cache for ultra-fast server response and offline resilience
let cachedColleges = DEFAULT_COLLEGES;
let cachedGlobalLockout: GlobalLockoutState = {
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
    // 1. Try reading from Firestore
    try {
      const docRef = doc(db, "system_licenses", "college_registry");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.colleges) && data.colleges.length > 0) {
          cachedColleges = data.colleges;
        }
        if (data?.globalLockout) {
          cachedGlobalLockout = {
            isGlobalWebStopped: Boolean(data.globalLockout.isGlobalWebStopped),
            isGlobalMobileStopped: Boolean(data.globalLockout.isGlobalMobileStopped),
            reason: String(data.globalLockout.reason || ""),
            stoppedAt: data.globalLockout.stoppedAt || undefined,
          };
        }
      }
    } catch (fsErr) {
      // 2. Fallback to Firebase Realtime Database
      try {
        const rtdbRef = ref(rtdb, "spherex_licenses");
        const rtdbSnap = await get(rtdbRef);
        if (rtdbSnap.exists()) {
          const val = rtdbSnap.val();
          if (Array.isArray(val?.colleges)) cachedColleges = val.colleges;
          if (val?.globalLockout) cachedGlobalLockout = val.globalLockout;
        }
      } catch (rtErr) {
        // Fallback to cached memory
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
      cachedColleges = colleges;
    }
    if (globalLockout) {
      cachedGlobalLockout = {
        isGlobalWebStopped: Boolean(globalLockout.isGlobalWebStopped),
        isGlobalMobileStopped: Boolean(globalLockout.isGlobalMobileStopped),
        reason: String(globalLockout.reason || ""),
        stoppedAt: globalLockout.stoppedAt || (globalLockout.isGlobalWebStopped || globalLockout.isGlobalMobileStopped ? new Date().toISOString() : undefined),
      };
    }

    // Persist to Cloud Firestore
    const payload = sanitizeForFirestore({
      colleges: cachedColleges,
      globalLockout: cachedGlobalLockout,
      updatedAt: new Date().toISOString(),
      updatedBy: "SPHEREX_MASTER_CREATOR",
    });

    try {
      await setDoc(doc(db, "system_licenses", "college_registry"), payload, { merge: true });
    } catch (fsErr) {
      console.warn("Firestore license save notice:", fsErr);
    }

    // Persist to Firebase Realtime Database
    try {
      await set(ref(rtdb, "spherex_licenses"), payload);
    } catch (rtErr) {
      console.warn("RTDB license save notice:", rtErr);
    }

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
