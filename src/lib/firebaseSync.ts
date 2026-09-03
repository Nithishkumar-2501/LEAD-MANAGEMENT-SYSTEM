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

// Ensure client is authenticated with Firebase Auth to pass Firestore/RTDB security rules
export async function ensureFirebaseAuth() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log("✅ Signed in anonymously with Firebase Auth for database permissions");
    }
  } catch (err: any) {
    console.warn("Firebase auth note:", err?.message || err);
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

  // Fulfill Firebase Auth security rules
  await ensureFirebaseAuth();

  let firestoreSuccess = false;
  let rtdbSuccess = false;

  // 1. Write to Firebase Firestore ("students" collection)
  try {
    const docRef = doc(db, "students", studentId);
    await setDoc(docRef, cleanPayload, { merge: true });
    firestoreSuccess = true;
    console.log(`✅ Firestore write success for student: ${studentId}`);
  } catch (firestoreErr: any) {
    console.error("❌ Firestore write error:", firestoreErr?.message || firestoreErr);
  }

  // 2. Write to Firebase Realtime Database ("students" node)
  try {
    const rtdbRef = ref(rtdb, `students/${studentId}`);
    await set(rtdbRef, cleanPayload);
    rtdbSuccess = true;
    console.log(`✅ Realtime DB write success for student: ${studentId}`);
  } catch (rtdbErr: any) {
    console.error("❌ Realtime DB write error:", rtdbErr?.message || rtdbErr);
  }

  // Update local storage cache
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

  // 3. Write to Backend REST API (Prisma / SQLite local database)
  try {
    if (typeof window !== "undefined") {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanPayload),
      });
    }
  } catch (apiErr: any) {
    console.warn("Backend REST API sync notice:", apiErr?.message || apiErr);
  }

  return firestoreSuccess || rtdbSuccess;
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
          callback(liveList);
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

// Safeguard: Retain student records permanently in Firebase (NEVER delete from Firestore or RTDB)
export async function deleteStudentFromFirebase(studentId: string): Promise<boolean> {
  console.log(`🔒 Data Preservation: Student ${studentId} is retained permanently in Firebase and will not be deleted.`);
  // Do NOT call deleteDoc(docRef) or remove(rtdbRef) — records stay in Firebase forever!
  return true;
}

