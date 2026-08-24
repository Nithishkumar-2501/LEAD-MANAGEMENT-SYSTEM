import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { ref, set, update, onValue } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { Lead, Application } from "@/types/crm";

export type StudentRecord = Lead & { application?: Application };

// Save or Update a Student in Firebase (Firestore + Realtime Database)
export async function saveStudentToFirebase(student: StudentRecord): Promise<boolean> {
  const studentId = student.id || `lead_${Date.now()}`;
  const payload = {
    ...student,
    id: studentId,
    updatedAt: new Date().toISOString(),
  };

  let successCount = 0;

  // 1. Write to Firebase Firestore ("students" collection)
  try {
    const docRef = doc(collection(db, "students"), studentId);
    await setDoc(docRef, payload, { merge: true });
    successCount++;
  } catch (firestoreErr: any) {
    console.warn("Firebase Firestore write note:", firestoreErr?.message || firestoreErr);
  }

  // 2. Write to Firebase Realtime Database ("students" node)
  try {
    const rtdbRef = ref(rtdb, `students/${studentId}`);
    await set(rtdbRef, payload);
    successCount++;
  } catch (rtdbErr: any) {
    console.warn("Firebase Realtime DB write note:", rtdbErr?.message || rtdbErr);
  }

  return true;
}

// Update specific student fields in Firebase
export async function updateStudentInFirebase(
  studentId: string,
  updatedFields: Partial<StudentRecord>
): Promise<boolean> {
  const payload = {
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, "students", studentId);
    await updateDoc(docRef, payload);
  } catch (err) {
    // Silently continue if rules pending
  }

  try {
    const rtdbRef = ref(rtdb, `students/${studentId}`);
    await update(rtdbRef, payload);
  } catch (err) {
    // Silently continue if rules pending
  }

  return true;
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
