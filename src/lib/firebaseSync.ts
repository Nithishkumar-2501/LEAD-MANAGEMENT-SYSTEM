import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { ref, set, update } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { Lead, Application } from "@/types/crm";

export type StudentRecord = Lead & { application?: Application };

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

  return firestoreSuccess || rtdbSuccess;
}

// Update specific student fields in Firebase
export async function updateStudentInFirebase(
  studentId: string,
  updatedFields: Partial<StudentRecord>
): Promise<boolean> {
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

// Real-Time Observer Listener for Firebase Students
export function subscribeToFirebaseStudents(
  callback: (students: StudentRecord[]) => void
) {
  try {
    const studentsCol = collection(db, "students");
    return onSnapshot(
      studentsCol,
      (snapshot) => {
        const liveList: StudentRecord[] = [];
        snapshot.forEach((doc) => {
          liveList.push(doc.data() as StudentRecord);
        });
        if (liveList.length > 0) {
          callback(liveList);
        }
      },
      (error) => {
        console.warn("Real-time snapshot observer notice:", error.message);
      }
    );
  } catch (e) {
    return () => {};
  }
}
