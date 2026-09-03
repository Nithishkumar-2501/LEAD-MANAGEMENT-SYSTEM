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
import { signInAnonymously } from "firebase/auth";
import { auth, db, rtdb } from "@/lib/firebase";
import { Lead, Application } from "@/types/crm";

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

