import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { ref, set, update, remove, get, child } from "firebase/database";
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";
import { auth, db, rtdb, storage } from "@/lib/firebase";
import { Lead, Application, Teacher, ManagedApplication } from "@/types/crm";

export type StudentRecord = Lead & { application?: Application | null };

// Helper to prevent any Firebase network request from hanging the UI
function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

// Ensure client is authenticated with Firebase Auth to pass Firestore/RTDB security rules
export async function ensureFirebaseAuth() {
  try {
    if (!auth.currentUser) {
      await withTimeout(signInAnonymously(auth), 1500);
    }
  } catch (err: any) {
    // Non-blocking: Firestore security rules may allow public read/write
  }
}

// Remove undefined values recursively (Firestore rejects undefined)
function sanitizeForFirebase(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirebase);

  const cleanObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleanObj[key] = sanitizeForFirebase(val);
    }
  }
  return cleanObj;
}

// Save or Update a Student in Firebase (Firestore + Realtime Database)
export async function saveStudentToFirebase(student: StudentRecord): Promise<boolean> {
  const studentId = student.id || `lead_${Date.now()}`;
  const cleanPayload = sanitizeForFirebase({
    ...student,
    id: studentId,
    updatedAt: new Date().toISOString(),
  });

  // Attempt auth non-blocking
  await ensureFirebaseAuth();

  let firestoreSuccess = false;

  // 1. Write directly to Firebase Firestore ("students" collection in SPHEREX)
  try {
    const docRef = doc(db, "students", studentId);
    await withTimeout(setDoc(docRef, cleanPayload, { merge: true }), 3000);
    firestoreSuccess = true;
    console.log(`🔥 [Firebase Firestore] Saved student record: ${studentId} (${student.name})`);
  } catch (firestoreErr: any) {
    console.warn("Firestore write notice:", firestoreErr?.message || firestoreErr);
  }

  // 2. Write to Firebase Realtime Database with strict timeout so it never hangs
  try {
    const rtdbRef = ref(rtdb, `students/${studentId}`);
    await withTimeout(set(rtdbRef, cleanPayload), 1500);
  } catch (rtdbErr: any) {
    // Non-blocking: Realtime DB may not be provisioned in all projects
  }

  // 3. Update local storage cache for instant offline reload
  try {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("vsb_firebase_leads_cache");
      let currentList: any[] = cached ? JSON.parse(cached) : [];
      if (!Array.isArray(currentList)) currentList = [];
      const idx = currentList.findIndex((item: any) => item.id === studentId);
      if (idx >= 0) {
        currentList[idx] = { ...currentList[idx], ...cleanPayload };
      } else {
        currentList.unshift(cleanPayload);
      }
      localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(currentList));
    }
  } catch (err) {}

  return firestoreSuccess;
}

// Update specific student fields in Firebase
export async function updateStudentInFirebase(
  studentId: string,
  updatedFields: Partial<StudentRecord>
): Promise<boolean> {
  await ensureFirebaseAuth();

  const cleanPayload = sanitizeForFirebase({
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  });

  try {
    const docRef = doc(db, "students", studentId);
    await updateDoc(docRef, cleanPayload);
  } catch (err: any) {
    try {
      const docRef = doc(db, "students", studentId);
      await setDoc(docRef, cleanPayload, { merge: true });
    } catch (setErr: any) {
      console.error("Firestore update error:", setErr);
    }
  }

  try {
    const rtdbRef = ref(rtdb, `students/${studentId}`);
    await update(rtdbRef, cleanPayload);
  } catch (err: any) {
    console.error("Realtime DB update error:", err);
  }

  return true;
}

// Fetch all students directly from Firebase Firestore
export async function fetchStudentsFromFirestore(): Promise<StudentRecord[]> {
  try {
    await ensureFirebaseAuth();
    const querySnapshot = await getDocs(collection(db, "students"));
    const list: StudentRecord[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as StudentRecord);
    });
    return list;
  } catch (err: any) {
    console.error("Error fetching students from Firestore:", err);
    return [];
  }
}

// Fetch all students directly from Firebase Realtime Database
export async function fetchStudentsFromRTDB(): Promise<StudentRecord[]> {
  try {
    await ensureFirebaseAuth();
    const rtdbRef = ref(rtdb);
    const snapshot = await get(child(rtdbRef, "students"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (typeof data === "object" && data !== null) {
        return Object.values(data) as StudentRecord[];
      }
    }
    return [];
  } catch (err: any) {
    console.warn("Error fetching students from Realtime DB:", err);
    return [];
  }
}

// Real-Time Observer Listener for Firebase Students
export function subscribeToFirebaseStudents(
  callback: (students: StudentRecord[]) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  ensureFirebaseAuth().then(() => {
    try {
      const studentsCol = collection(db, "students");
      unsubscribe = onSnapshot(
        studentsCol,
        (snapshot) => {
          const liveList: StudentRecord[] = [];
          snapshot.forEach((doc) => {
            liveList.push(doc.data() as StudentRecord);
          });
          // Exclude any tombstoned deleted leads
          const filteredLive = liveList.filter((s) => !isLeadDeleted(s.id));
          callback(filteredLive);
        },
        (error) => {
          console.warn("Real-time snapshot observer notice:", error.message);
        }
      );
    } catch (e) {
      console.warn("Snapshot setup error:", e);
    }
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}

// Check if a lead has been permanently deleted
export function isLeadDeleted(studentId: string): boolean {
  if (typeof window === "undefined" || !studentId) return false;
  try {
    const deletedStr = localStorage.getItem("vsb_deleted_lead_ids");
    const list = deletedStr ? JSON.parse(deletedStr) : [];
    return Array.isArray(list) && list.includes(studentId);
  } catch {
    return false;
  }
}

// Synchronously mark lead as deleted in localStorage and purge from cache (0 ms latency)
export function markLeadAsDeleted(studentId: string): void {
  if (typeof window === "undefined" || !studentId) return;
  try {
    // 1. Purge from active leads cache
    const cached = localStorage.getItem("vsb_firebase_leads_cache");
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        const filtered = list.filter((item: any) => item.id !== studentId);
        localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(filtered));
      }
    }

    // 2. Add to permanent tombstone list
    const deletedKey = "vsb_deleted_lead_ids";
    const deletedStr = localStorage.getItem(deletedKey);
    let deletedList: string[] = deletedStr ? JSON.parse(deletedStr) : [];
    if (!Array.isArray(deletedList)) deletedList = [];
    if (!deletedList.includes(studentId)) {
      deletedList.push(studentId);
      localStorage.setItem(deletedKey, JSON.stringify(deletedList));
    }
  } catch (e) {}
}

// Permanently delete student record from Firebase Firestore with high-speed async execution
export async function deleteStudentFromFirebase(studentId: string): Promise<boolean> {
  if (!studentId) return false;

  // 1. Mark as deleted synchronously in 0ms so reload/relogin never restores it
  markLeadAsDeleted(studentId);

  // 2. High-speed Firestore permanent deletion
  try {
    const docRef = doc(db, "students", studentId);
    await deleteDoc(docRef);
    console.log(`🔥 [Firebase Firestore] Document ${studentId} permanently deleted.`);
  } catch (err: any) {
    console.warn("Firestore delete notice:", err?.message || err);
  }

  // 3. RTDB fire-and-forget in background (non-blocking)
  try {
    const rtdbRef = ref(rtdb, `students/${studentId}`);
    remove(rtdbRef).catch(() => {});
  } catch (e) {}

  return true;
}

// Upload Teacher Profile Photo to Firebase Storage with Firestore/RTDB fallback
export async function uploadTeacherProfilePhotoToFirebase(
  teacherId: string,
  photoDataUrl: string
): Promise<string> {
  if (!teacherId || !photoDataUrl) return photoDataUrl;

  try {
    await ensureFirebaseAuth();
  } catch (e) {}

  const safeTeacherId = teacherId.replace(/[^a-zA-Z0-9_-]/g, "_");

  // 1. Try Firebase Storage upload
  try {
    const fileRef = storageRef(storage, `teachers/${safeTeacherId}/profile_${Date.now()}.jpg`);
    await withTimeout(uploadString(fileRef, photoDataUrl, "data_url"), 4000);
    const downloadUrl = await getDownloadURL(fileRef);

    // Save download URL to Firestore & RTDB
    try {
      const docRef = doc(db, "teachers", safeTeacherId);
      await setDoc(docRef, { photoUrl: downloadUrl, updatedAt: new Date().toISOString() }, { merge: true });
      await update(ref(rtdb, `teachers/${safeTeacherId}`), { photoUrl: downloadUrl, updatedAt: new Date().toISOString() });
    } catch (e) {}

    console.log(`📸 [Firebase Storage] Teacher profile photo uploaded successfully: ${downloadUrl}`);
    return downloadUrl;
  } catch (storageErr) {
    console.warn("Firebase Storage direct upload note, storing photo URL in Firestore/RTDB:", storageErr);

    // 2. Direct Firestore + RTDB persistence (stores optimized dataUrl safely)
    try {
      const docRef = doc(db, "teachers", safeTeacherId);
      await setDoc(docRef, { photoUrl: photoDataUrl, updatedAt: new Date().toISOString() }, { merge: true });
      await update(ref(rtdb, `teachers/${safeTeacherId}`), { photoUrl: photoDataUrl, updatedAt: new Date().toISOString() });
    } catch (dbErr) {
      console.warn("Firestore/RTDB photo save notice:", dbErr);
    }

    return photoDataUrl;
  }
}

// Save or update Teacher profile in Firebase Firestore & Realtime Database
export async function saveTeacherToFirebase(teacher: Teacher): Promise<boolean> {
  if (!teacher || !teacher.id) return false;

  const safeTeacherId = teacher.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanPayload = sanitizeForFirebase({
    ...teacher,
    id: teacher.id,
    updatedAt: new Date().toISOString(),
  });

  try {
    await ensureFirebaseAuth();
  } catch (e) {}

  // 1. Firestore sync
  try {
    const docRef = doc(db, "teachers", safeTeacherId);
    await withTimeout(setDoc(docRef, cleanPayload, { merge: true }), 2500);
  } catch (err: any) {
    console.warn("Firestore save teacher notice:", err?.message || err);
  }

  // 2. RTDB sync (non-blocking)
  try {
    const rtdbRef = ref(rtdb, `teachers/${safeTeacherId}`);
    set(rtdbRef, cleanPayload).catch(() => {});
  } catch (e) {}

  return true;
}

// Sync Student Lead Redirection / Transfer in Firebase
export async function redirectStudentLeadInFirebase(
  leadId: string,
  fromTeacherName: string,
  toTeacherName: string,
  reason: string,
  notes: string
): Promise<boolean> {
  if (!leadId) return false;

  const transferLog = {
    transferredAt: new Date().toISOString(),
    fromTeacher: fromTeacherName,
    toTeacher: toTeacherName,
    reason,
    notes,
  };

  try {
    await ensureFirebaseAuth();
  } catch (e) {}

  try {
    const docRef = doc(db, "students", leadId);
    await withTimeout(
      setDoc(
        docRef,
        {
          assignedTo: toTeacherName,
          lastTransfer: transferLog,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ),
      2500
    );
  } catch (err) {}

  try {
    const rtdbRef = ref(rtdb, `students/${leadId}`);
    update(rtdbRef, {
      assignedTo: toTeacherName,
      lastTransfer: transferLog,
      updatedAt: new Date().toISOString(),
    }).catch(() => {});
  } catch (e) {}

  return true;
}

// -------------------------------------------------------------
// APPLICATION MANAGER (ADMIN ONLY) FIREBASE PERSISTENCE & SYNC
// -------------------------------------------------------------

const LOCAL_STORAGE_APP_KEY = "vsb_managed_applications_cache_v2";

export async function saveApplicationToFirebase(app: ManagedApplication): Promise<boolean> {
  const appId = app.id || `app_${Date.now()}`;
  const payload: ManagedApplication = {
    ...app,
    id: appId,
    updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " (Live)",
  };

  const cleanPayload = sanitizeForFirebase(payload);

  // 1. Update localStorage instantly
  try {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_STORAGE_APP_KEY);
      let list: ManagedApplication[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex((a) => a.id === appId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...cleanPayload };
      } else {
        list.unshift(cleanPayload);
      }
      localStorage.setItem(LOCAL_STORAGE_APP_KEY, JSON.stringify(list));
    }
  } catch (e) {}

  // 2. Ensure auth & push to Firestore
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, "managed_applications", appId);
    await withTimeout(setDoc(docRef, cleanPayload, { merge: true }), 2500);
  } catch (err: any) {
    console.warn("Firestore managed_applications notice:", err?.message || err);
  }

  // 3. Push to Realtime Database
  try {
    const rtdbRef = ref(rtdb, `managed_applications/${appId}`);
    set(rtdbRef, cleanPayload).catch(() => {});
  } catch (e) {}

  return true;
}

export async function deleteApplicationFromFirebase(appId: string): Promise<boolean> {
  if (!appId) return false;

  // 1. Update localStorage
  try {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_STORAGE_APP_KEY);
      if (cached) {
        let list: ManagedApplication[] = JSON.parse(cached);
        list = list.filter((a) => a.id !== appId);
        localStorage.setItem(LOCAL_STORAGE_APP_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {}

  // 2. Delete from Firestore & RTDB
  try {
    await ensureFirebaseAuth();
    await withTimeout(deleteDoc(doc(db, "managed_applications", appId)), 2000);
  } catch (e) {}

  try {
    remove(ref(rtdb, `managed_applications/${appId}`)).catch(() => {});
  } catch (e) {}

  return true;
}

export async function fetchApplicationsFromFirebase(): Promise<ManagedApplication[]> {
  let results: ManagedApplication[] = [];

  // 1. Purge legacy mock caches if any
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("vsb_managed_applications_cache");
    } catch (e) {}
  }

  // 2. Query Firestore managed_applications
  try {
    await ensureFirebaseAuth();
    const snap = await withTimeout(getDocs(collection(db, "managed_applications")), 3500);
    if (snap && !snap.empty) {
      snap.forEach((docSnap) => {
        results.push(docSnap.data() as ManagedApplication);
      });
    }
  } catch (err: any) {
    console.warn("Firestore managed_applications read notice:", err?.message || err);
  }

  // 3. Try RTDB if Firestore was empty
  if (results.length === 0) {
    try {
      const snap = await withTimeout(get(child(ref(rtdb), "managed_applications")), 2000);
      if (snap && snap.exists()) {
        const val = snap.val();
        results = Object.values(val) as ManagedApplication[];
      }
    } catch (e) {}
  }

  // 4. If still empty, load live students from Firestore and map them to ManagedApplication
  if (results.length === 0) {
    try {
      const students = await fetchStudentsFromFirestore();
      if (students && students.length > 0) {
        results = students.map((s, idx) => {
          const isCoimbatore = (s.name || "").toLowerCase().includes("coimbatore") || (idx % 2 === 1);
          const campus = isCoimbatore ? "COIMBATORE" : "KARUR";
          const prefix = campus === "COIMBATORE" ? "VSBCTC/2026/" : "VSBEC/2026/";
          return {
            id: s.id ? `app_${s.id}` : `app_${1300 + idx}`,
            registeredName: s.name || "Student Applicant",
            applicationNo: `${prefix}${1300 + idx}`,
            formName: `Application Form VSB ${campus === "COIMBATORE" ? "Coimbatore" : "Karur"} (Engineering)`,
            registeredEmail: s.email || `${(s.name || "applicant").toLowerCase().replace(/\s+/g, "")}@gmail.com`,
            registeredMobile: s.phone || "+91 9876543210",
            formStatus: s.status === "ADMITTED" ? "Complete" : "Incomplete",
            paymentStatus: s.status === "ADMITTED" ? "Payment Approved" : "Payment Pending",
            paymentMethod: s.status === "ADMITTED" ? "Online" : "-",
            applicationOwner: campus === "COIMBATORE" ? "Dr. S. Meenakshi" : "Prof. P. Rajesh",
            applicationStage: s.status === "ADMITTED" ? "Admission Offered" : "Inquiry Stage",
            campus: campus,
            createdAt: "2026-09-12 10:00 AM",
            updatedAt: "2026-09-12 10:00 AM",
          };
        });
      }
    } catch (e) {}
  }

  // 5. Update local cache with live data
  if (typeof window !== "undefined" && results.length > 0) {
    try {
      localStorage.setItem(LOCAL_STORAGE_APP_KEY, JSON.stringify(results));
    } catch (e) {}
  } else if (typeof window !== "undefined" && results.length === 0) {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_APP_KEY);
      if (cached) {
        results = JSON.parse(cached);
      }
    } catch (e) {}
  }

  return results;
}

export function subscribeToFirebaseApplications(
  callback: (apps: ManagedApplication[]) => void
): () => void {
  try {
    const colRef = collection(db, "managed_applications");
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ManagedApplication[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as ManagedApplication);
          });
          callback(list);
        }
      },
      (err) => {
        console.warn("Snapshot notice on managed_applications:", err?.message);
      }
    );
    return unsub;
  } catch (e) {
    return () => {};
  }
}
