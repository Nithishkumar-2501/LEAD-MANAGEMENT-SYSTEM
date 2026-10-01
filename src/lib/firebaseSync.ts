import {
  collection,
  doc,
  getDoc,
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
import {
  Lead,
  Application,
  Teacher,
  ManagedApplication,
  CourseProgram,
  Payment,
  OfflineUploadLog,
  SystemAccountRecord,
  AdminSettingsRecord,
  StudentDocument,
  CampusLocation,
} from "@/types/crm";
import { formatPhoneWith91 } from "@/lib/phoneValidation";

export type StudentRecord = Lead & { application?: Application | null };

// Helper to prevent any Firebase network request from hanging the UI
function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

// Ensure client is authenticated with Firebase Auth if available
export async function ensureFirebaseAuth() {
  // Direct access is enabled for Firestore in this project. Anonymous auth is disabled by project admin.
  return;
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

// Atomic Sequential Numeric Lead ID Generator (1, 2, 3...)
export async function getNextNumericLeadId(): Promise<string> {
  await ensureFirebaseAuth();
  try {
    const counterRef = doc(db, "counters", "leads");
    const counterSnap = await withTimeout(getDoc(counterRef), 3000);
    if (counterSnap && counterSnap.exists()) {
      const data = counterSnap.data();
      const current = typeof data.lastLeadId === "number" ? data.lastLeadId : 41;
      const nextId = current + 1;
      await setDoc(counterRef, {
        lastLeadId: nextId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return String(nextId);
    }
  } catch (err) {
    console.warn("Error reading lead counter from Firestore:", err);
  }

  // Fallback: scan students collection to find max numeric ID
  try {
    const studentsSnap = await withTimeout(getDocs(collection(db, "students")), 3000);
    let maxId = 0;
    if (studentsSnap && !studentsSnap.empty) {
      studentsSnap.forEach((docSnap) => {
        const idNum = parseInt(docSnap.id, 10);
        if (!isNaN(idNum) && idNum > maxId) {
          maxId = idNum;
        }
      });
    }
    const nextId = maxId > 0 ? maxId + 1 : 1;
    try {
      await setDoc(doc(db, "counters", "leads"), {
        lastLeadId: nextId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {}
    return String(nextId);
  } catch (e) {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("vsb_firebase_leads_cache");
      if (cached) {
        try {
          const list = JSON.parse(cached);
          if (Array.isArray(list)) {
            let maxId = 0;
            list.forEach((item: any) => {
              const num = parseInt(String(item.id || ""), 10);
              if (!isNaN(num) && num > maxId) maxId = num;
            });
            return String(maxId + 1);
          }
        } catch (err) {}
      }
    }
    return String(Date.now() % 100000);
  }
}

// Save or Update a Student in Firebase (Firestore + Realtime Database)
export async function saveStudentToFirebase(student: StudentRecord): Promise<boolean> {
  // Check if student.id is already a clean sequential numeric string (e.g. "1", "2", "41")
  let studentId = student.id ? String(student.id).trim() : "";
  const isNumeric = /^\d+$/.test(studentId);

  if (!isNumeric || !studentId) {
    studentId = await getNextNumericLeadId();
    student.id = studentId;
  }

  // Ensure compulsory +91- formatting for student mobile and parent numbers
  const formattedStudent: StudentRecord = {
    ...student,
    id: studentId,
    phone: formatPhoneWith91(student.phone),
    fatherMobile: student.fatherMobile ? formatPhoneWith91(student.fatherMobile) : student.fatherMobile,
    motherMobile: student.motherMobile ? formatPhoneWith91(student.motherMobile) : student.motherMobile,
  };

  const cleanPayload = sanitizeForFirebase({
    ...formattedStudent,
    id: studentId,
    leadId: studentId,
    numericId: Number(studentId),
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
    console.log(`🔥 [Firebase Firestore] Saved student record #${studentId}: ${student.name}`);
  } catch (firestoreErr: any) {
    console.warn("Firestore write notice:", firestoreErr?.message || firestoreErr);
  }

  // 2. Write to Firebase Realtime Database with strict timeout so it never hangs
  try {
    const rtdbRef = ref(rtdb, `students/${studentId}`);
    await withTimeout(set(rtdbRef, cleanPayload), 1000);
  } catch (rtdbErr: any) {
    // Non-blocking: Realtime DB may not be provisioned in all projects
  }

  // 3. Update local storage cache for instant offline reload
  try {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("vsb_firebase_leads_cache");
      let currentList: any[] = cached ? JSON.parse(cached) : [];
      if (!Array.isArray(currentList)) currentList = [];
      const idx = currentList.findIndex((item: any) => String(item.id) === studentId);
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

  const formattedFields = { ...updatedFields };
  if (formattedFields.phone) {
    formattedFields.phone = formatPhoneWith91(formattedFields.phone);
  }
  if (formattedFields.fatherMobile) {
    formattedFields.fatherMobile = formatPhoneWith91(formattedFields.fatherMobile);
  }
  if (formattedFields.motherMobile) {
    formattedFields.motherMobile = formatPhoneWith91(formattedFields.motherMobile);
  }

  const cleanPayload = sanitizeForFirebase({
    ...formattedFields,
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
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as StudentRecord;
      const docId = docSnap.id;
      list.push({
        ...data,
        id: docId,
        leadId: docId,
        numericId: /^\d+$/.test(docId) ? Number(docId) : (data as any).numericId,
        phone: formatPhoneWith91(data.phone),
        fatherMobile: data.fatherMobile ? formatPhoneWith91(data.fatherMobile) : data.fatherMobile,
        motherMobile: data.motherMobile ? formatPhoneWith91(data.motherMobile) : data.motherMobile,
      });
    });
    // Sort numerically 1, 2, 3...
    list.sort((a, b) => {
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a.id).localeCompare(String(b.id));
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
        const rawList = Object.values(data) as StudentRecord[];
        return rawList.map((s) => ({
          ...s,
          phone: formatPhoneWith91(s.phone),
          fatherMobile: s.fatherMobile ? formatPhoneWith91(s.fatherMobile) : s.fatherMobile,
          motherMobile: s.motherMobile ? formatPhoneWith91(s.motherMobile) : s.motherMobile,
        }));
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
  try {
    const studentsCol = collection(db, "students");
    const unsubscribe = onSnapshot(
      studentsCol,
      (snapshot) => {
        const liveList: StudentRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as StudentRecord;
          const docId = docSnap.id;
          liveList.push({
            ...data,
            id: docId,
            leadId: docId,
            numericId: /^\d+$/.test(docId) ? Number(docId) : (data as any).numericId,
            phone: formatPhoneWith91(data.phone),
            fatherMobile: data.fatherMobile ? formatPhoneWith91(data.fatherMobile) : data.fatherMobile,
            motherMobile: data.motherMobile ? formatPhoneWith91(data.motherMobile) : data.motherMobile,
          });
        });
        // Sort numerically 1, 2, 3...
        liveList.sort((a, b) => {
          const numA = parseInt(a.id, 10);
          const numB = parseInt(b.id, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return String(a.id).localeCompare(String(b.id));
        });
        // Exclude any tombstoned deleted leads
        const filteredLive = liveList.filter((s) => !isLeadDeleted(s.id));
        callback(filteredLive);
      },
      (error) => {
        console.warn("Real-time snapshot observer notice:", error.message);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("Snapshot setup error:", e);
    return () => {};
  }
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
  const formattedPhone = formatPhoneWith91(teacher.phone);
  const cleanPayload = sanitizeForFirebase({
    ...teacher,
    id: teacher.id,
    phone: formattedPhone,
    coursesAssigned: Array.isArray(teacher.coursesAssigned)
      ? teacher.coursesAssigned
      : typeof teacher.coursesAssigned === "string"
      ? JSON.parse(teacher.coursesAssigned)
      : ["B.E. Computer Science"],
    updatedAt: new Date().toISOString(),
  });

  try {
    await ensureFirebaseAuth();
  } catch (e) {}

  let firestoreSuccess = false;

  // 1. Firestore sync
  try {
    const docRef = doc(db, "teachers", safeTeacherId);
    await withTimeout(setDoc(docRef, cleanPayload, { merge: true }), 8000);
    firestoreSuccess = true;
    console.log(`🔥 [Firebase Firestore] Saved teacher record: ${safeTeacherId} (${teacher.name})`);
  } catch (err: any) {
    console.warn("Firestore save teacher notice:", err?.message || err);
  }

  // 2. RTDB sync (non-blocking)
  try {
    const rtdbRef = ref(rtdb, `teachers/${safeTeacherId}`);
    set(rtdbRef, cleanPayload).catch(() => {});
  } catch (e) {}

  // 3. LocalStorage update for instantaneous offline hydration
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vsb_crm_teachers");
      let list: Teacher[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];
      const idx = list.findIndex((t) => t.id === teacher.id || t.email === teacher.email);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...cleanPayload };
      } else {
        list.unshift(cleanPayload);
      }
      localStorage.setItem("vsb_crm_teachers", JSON.stringify(list));
    }
  } catch (e) {}

  return firestoreSuccess;
}

// Delete a Teacher from Firebase Firestore & Realtime Database
export async function deleteTeacherFromFirebase(teacherId: string): Promise<boolean> {
  if (!teacherId) return false;
  const safeTeacherId = teacherId.replace(/[^a-zA-Z0-9_-]/g, "_");

  try {
    await ensureFirebaseAuth();
  } catch (e) {}

  try {
    const docRef = doc(db, "teachers", safeTeacherId);
    await withTimeout(deleteDoc(docRef), 2500);
    console.log(`🔥 [Firebase Firestore] Deleted teacher record: ${safeTeacherId}`);
  } catch (err: any) {
    console.warn("Firestore delete teacher notice:", err?.message || err);
  }

  try {
    const rtdbRef = ref(rtdb, `teachers/${safeTeacherId}`);
    remove(rtdbRef).catch(() => {});
  } catch (e) {}

  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vsb_crm_teachers");
      if (stored) {
        let list: Teacher[] = JSON.parse(stored);
        if (Array.isArray(list)) {
          list = list.filter((t) => t.id !== teacherId && t.id !== safeTeacherId && t.email !== teacherId);
          localStorage.setItem("vsb_crm_teachers", JSON.stringify(list));
        }
      }
    }
  } catch (e) {}

  return true;
}

// Fetch all teachers directly from Firebase Firestore
export async function fetchTeachersFromFirestore(): Promise<Teacher[]> {
  try {
    await ensureFirebaseAuth();
    const querySnapshot = await withTimeout(getDocs(collection(db, "teachers")), 4000);
    if (!querySnapshot || querySnapshot.empty) return [];

    const list: Teacher[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Teacher;
      list.push({
        ...data,
        id: data.id || docSnap.id,
        phone: formatPhoneWith91(data.phone),
        coursesAssigned: Array.isArray(data.coursesAssigned)
          ? data.coursesAssigned
          : typeof data.coursesAssigned === "string"
          ? JSON.parse(data.coursesAssigned)
          : ["B.E. Computer Science"],
      });
    });
    return list;
  } catch (err: any) {
    console.warn("Error fetching teachers from Firestore:", err?.message || err);
    return [];
  }
}

// Fetch all teachers directly from Firebase Realtime Database
export async function fetchTeachersFromRTDB(): Promise<Teacher[]> {
  try {
    await ensureFirebaseAuth();
    const rtdbRef = ref(rtdb);
    const snapshot = await withTimeout(get(child(rtdbRef, "teachers")), 2500);
    if (snapshot && snapshot.exists()) {
      const data = snapshot.val();
      if (typeof data === "object" && data !== null) {
        const rawList = Object.values(data) as Teacher[];
        return rawList.map((t) => ({
          ...t,
          phone: formatPhoneWith91(t.phone),
          coursesAssigned: Array.isArray(t.coursesAssigned)
            ? t.coursesAssigned
            : typeof t.coursesAssigned === "string"
            ? JSON.parse(t.coursesAssigned)
            : ["B.E. Computer Science"],
        }));
      }
    }
    return [];
  } catch (err: any) {
    console.warn("Error fetching teachers from Realtime DB:", err);
    return [];
  }
}

// Seed initial faculty members to Firebase Firestore and RTDB if empty
export async function seedInitialTeachersToFirebase(): Promise<Teacher[]> {
  try {
    const { MOCK_TEACHERS } = await import("@/lib/mockData");
    const seededList: Teacher[] = [];

    await Promise.allSettled(
      MOCK_TEACHERS.map(async (t) => {
        const formatted: Teacher = {
          ...t,
          phone: formatPhoneWith91(t.phone),
        };
        await saveTeacherToFirebase(formatted);
        seededList.push(formatted);
      })
    );
    console.log(`🔥 [Firebase Seed] Successfully seeded ${seededList.length} faculty members to Firebase!`);
    return seededList;
  } catch (e) {
    console.warn("Error seeding teachers to Firebase:", e);
    return [];
  }
}

// Fetch all teachers from Firebase with fallback and auto-seed
export async function fetchTeachersFromFirebase(): Promise<Teacher[]> {
  let results: Teacher[] = [];

  // 1. Try Firestore first
  results = await fetchTeachersFromFirestore();

  // 2. Try RTDB if Firestore returned nothing
  if (results.length === 0) {
    results = await fetchTeachersFromRTDB();
  }

  // 3. If still empty, seed initial teachers into Firebase so they are permanently stored in Firebase!
  if (results.length === 0) {
    results = await seedInitialTeachersToFirebase();
  }

  // 4. Update localStorage cache
  if (typeof window !== "undefined" && results.length > 0) {
    try {
      localStorage.setItem("vsb_crm_teachers", JSON.stringify(results));
    } catch (e) {}
  }

  return results;
}

// Real-Time Observer Listener for Firebase Teachers
export function subscribeToFirebaseTeachers(
  callback: (teachers: Teacher[]) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  ensureFirebaseAuth().then(() => {
    try {
      const teachersCol = collection(db, "teachers");
      unsubscribe = onSnapshot(
        teachersCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveList: Teacher[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Teacher;
              liveList.push({
                ...data,
                id: data.id || docSnap.id,
                phone: formatPhoneWith91(data.phone),
                coursesAssigned: Array.isArray(data.coursesAssigned)
                  ? data.coursesAssigned
                  : typeof data.coursesAssigned === "string"
                  ? JSON.parse(data.coursesAssigned)
                  : ["B.E. Computer Science"],
              });
            });
            callback(liveList);
          }
        },
        (error) => {
          console.warn("Real-time teacher observer notice:", error.message);
        }
      );
    } catch (e) {
      console.warn("Teacher snapshot setup error:", e);
    }
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}

// Resolve teacher entity by username, email, or campus alias
export function resolveTeacherByUsername(
  teachers: Teacher[],
  username?: string,
  campus?: "KARUR" | "COIMBATORE"
): Teacher | undefined {
  if (!username || !Array.isArray(teachers) || teachers.length === 0) return undefined;
  const clean = username.toLowerCase().trim();

  // 1. Direct match by id or email
  let found = teachers.find(
    (t) => t.id.toLowerCase().trim() === clean || t.email.toLowerCase().trim() === clean
  );
  if (found) return found;

  // 2. Known faculty demo / alias logins
  if (clean === "teacherkarur@123" || clean === "teacher_rajesh@123") {
    found = teachers.find(
      (t) => t.id.toLowerCase().includes("rajesh") || t.email.toLowerCase().includes("rajesh")
    );
    if (found) return found;
  }
  if (clean === "teachercovai@123") {
    found = teachers.find(
      (t) => t.id.toLowerCase().includes("meenakshi") || t.email.toLowerCase().includes("meenakshi")
    );
    if (found) return found;
  }

  // 3. Match username prefix (e.g. "rajesh" matches "rajesh.mech@vsbec.in")
  found = teachers.find(
    (t) =>
      clean.includes(t.id.split("@")[0].toLowerCase().trim()) ||
      t.email.toLowerCase().includes(clean)
  );
  if (found) return found;

  // 4. Fallback to first teacher matching campus
  if (campus) {
    found = teachers.find((t) => t.campus === campus);
    if (found) return found;
  }

  return teachers[0];
}

// Update Teacher Online Status (ACTIVE on login, ON_LEAVE on logout) with immediate Firebase & LocalStorage sync
export async function updateTeacherOnlineStatus(
  username: string,
  campus?: "KARUR" | "COIMBATORE",
  status: "ACTIVE" | "ON_LEAVE" = "ACTIVE"
): Promise<Teacher | null> {
  if (!username) return null;
  try {
    // 1. Get current teachers from Firebase or localStorage
    let currentTeachers = await fetchTeachersFromFirebase();
    if (!currentTeachers || currentTeachers.length === 0) {
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("vsb_crm_teachers");
          if (cached) currentTeachers = JSON.parse(cached);
        } catch (e) {}
      }
    }
    if (!currentTeachers || currentTeachers.length === 0) {
      const { MOCK_TEACHERS } = await import("@/lib/mockData");
      currentTeachers = [...MOCK_TEACHERS];
    }

    const matchedTeacher = resolveTeacherByUsername(currentTeachers, username, campus);
    if (!matchedTeacher) {
      console.warn(`[updateTeacherOnlineStatus] No matching teacher found for ${username}`);
      return null;
    }

    const updatedTeacher: Teacher = {
      ...matchedTeacher,
      status,
    };

    console.log(
      `🔄 [Firebase Teacher Status] Setting status for ${updatedTeacher.name} (${updatedTeacher.id}) -> ${status}`
    );

    // Save to Firebase (Firestore, RTDB, and localStorage)
    await saveTeacherToFirebase(updatedTeacher);

    // Also update memory in localStorage cache immediately
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("vsb_crm_teachers");
        let list: Teacher[] = stored ? JSON.parse(stored) : [];
        if (Array.isArray(list)) {
          const idx = list.findIndex(
            (t) => t.id === updatedTeacher.id || t.email === updatedTeacher.email
          );
          if (idx >= 0) {
            list[idx] = updatedTeacher;
          } else {
            list.unshift(updatedTeacher);
          }
          localStorage.setItem("vsb_crm_teachers", JSON.stringify(list));
        }
      } catch (e) {}
    }

    return updatedTeacher;
  } catch (err) {
    console.warn("Error updating teacher online status in Firebase:", err);
    return null;
  }
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
    registeredMobile: formatPhoneWith91(app.registeredMobile),
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
        const item = docSnap.data() as ManagedApplication;
        results.push({
          ...item,
          registeredMobile: formatPhoneWith91(item.registeredMobile),
        });
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
        const raw = Object.values(val) as ManagedApplication[];
        results = raw.map((a) => ({
          ...a,
          registeredMobile: formatPhoneWith91(a.registeredMobile),
        }));
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
            registeredMobile: formatPhoneWith91(s.phone || "+91-9876543210"),
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
            const item = docSnap.data() as ManagedApplication;
            list.push({
              ...item,
              registeredMobile: formatPhoneWith91(item.registeredMobile),
            });
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

/**
 * Scans all existing documents in Firebase ("students" and "managed_applications")
 * and migrates any phone numbers without the compulsory '+91-' prefix so that
 * all existing records conform to '+91-XXXXXXXXXX'.
 */
export async function normalizeAllFirebasePhones(): Promise<{
  updatedStudents: number;
  updatedApplications: number;
  totalScanned: number;
}> {
  await ensureFirebaseAuth();
  let updatedStudents = 0;
  let updatedApplications = 0;
  let totalScanned = 0;

  try {
    // 1. Scan and migrate students collection in Firestore
    const studentsSnap = await withTimeout(getDocs(collection(db, "students")), 6000);
    if (studentsSnap && !studentsSnap.empty) {
      for (const docSnap of studentsSnap.docs) {
        totalScanned++;
        const data = docSnap.data();
        let needsUpdate = false;
        const updates: Record<string, any> = {};

        if (data.phone) {
          const norm = formatPhoneWith91(data.phone);
          if (norm && norm !== data.phone) {
            updates.phone = norm;
            needsUpdate = true;
          }
        }

        if (data.fatherMobile) {
          const norm = formatPhoneWith91(data.fatherMobile);
          if (norm && norm !== data.fatherMobile) {
            updates.fatherMobile = norm;
            needsUpdate = true;
          }
        }

        if (data.motherMobile) {
          const norm = formatPhoneWith91(data.motherMobile);
          if (norm && norm !== data.motherMobile) {
            updates.motherMobile = norm;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          try {
            await setDoc(doc(db, "students", docSnap.id), updates, { merge: true });
            try {
              await update(ref(rtdb, `students/${docSnap.id}`), updates);
            } catch (e) {}
            updatedStudents++;
            console.log(`🔥 [Firebase Migration] Converted student ${docSnap.id} phone to +91-:`, updates);
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.warn("Error normalizing students phone numbers in Firebase:", err);
  }

  try {
    // 2. Scan and migrate managed_applications collection in Firestore
    const appsSnap = await withTimeout(getDocs(collection(db, "managed_applications")), 6000);
    if (appsSnap && !appsSnap.empty) {
      for (const docSnap of appsSnap.docs) {
        totalScanned++;
        const data = docSnap.data();
        if (data.registeredMobile) {
          const norm = formatPhoneWith91(data.registeredMobile);
          if (norm && norm !== data.registeredMobile) {
            try {
              await setDoc(doc(db, "managed_applications", docSnap.id), { registeredMobile: norm }, { merge: true });
              try {
                await update(ref(rtdb, `managed_applications/${docSnap.id}`), { registeredMobile: norm });
              } catch (e) {}
              updatedApplications++;
              console.log(`🔥 [Firebase Migration] Converted application ${docSnap.id} registeredMobile to ${norm}`);
            } catch (e) {}
          }
        }
      }
    }
  } catch (err) {
    console.warn("Error normalizing applications mobile numbers in Firebase:", err);
  }

  try {
    // 3. Scan and migrate teachers collection in Firestore
    const teachersSnap = await withTimeout(getDocs(collection(db, "teachers")), 6000);
    if (teachersSnap && !teachersSnap.empty) {
      for (const docSnap of teachersSnap.docs) {
        totalScanned++;
        const data = docSnap.data();
        if (data.phone) {
          const norm = formatPhoneWith91(data.phone);
          if (norm && norm !== data.phone) {
            try {
              await setDoc(doc(db, "teachers", docSnap.id), { phone: norm }, { merge: true });
              try {
                await update(ref(rtdb, `teachers/${docSnap.id}`), { phone: norm });
              } catch (e) {}
              console.log(`🔥 [Firebase Migration] Converted teacher ${docSnap.id} phone to ${norm}`);
            } catch (e) {}
          }
        }
      }
    }
  } catch (err) {
    console.warn("Error normalizing teachers phone numbers in Firebase:", err);
  }

  // 4. Update localStorage caches as well
  try {
    if (typeof window !== "undefined") {
      const leadsCache = localStorage.getItem("vsb_firebase_leads_cache");
      if (leadsCache) {
        const list = JSON.parse(leadsCache);
        if (Array.isArray(list)) {
          const updated = list.map((item: any) => ({
            ...item,
            phone: formatPhoneWith91(item.phone),
            fatherMobile: item.fatherMobile ? formatPhoneWith91(item.fatherMobile) : item.fatherMobile,
            motherMobile: item.motherMobile ? formatPhoneWith91(item.motherMobile) : item.motherMobile,
          }));
          localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(updated));
        }
      }

      const appsCache = localStorage.getItem(LOCAL_STORAGE_APP_KEY);
      if (appsCache) {
        const list = JSON.parse(appsCache);
        if (Array.isArray(list)) {
          const updated = list.map((item: any) => ({
            ...item,
            registeredMobile: formatPhoneWith91(item.registeredMobile),
          }));
          localStorage.setItem(LOCAL_STORAGE_APP_KEY, JSON.stringify(updated));
        }
      }

      const teachersCache = localStorage.getItem("vsb_crm_teachers");
      if (teachersCache) {
        const list = JSON.parse(teachersCache);
        if (Array.isArray(list)) {
          const updated = list.map((item: any) => ({
            ...item,
            phone: formatPhoneWith91(item.phone),
          }));
          localStorage.setItem("vsb_crm_teachers", JSON.stringify(updated));
        }
      }
    }
  } catch (e) {}

  return { updatedStudents, updatedApplications, totalScanned };
}

// Auto-run once in browser background to ensure all existing numbers in Firebase have +91-
if (typeof window !== "undefined") {
  setTimeout(() => {
    normalizeAllFirebasePhones().catch(() => {});
  }, 2500);
}

// -------------------------------------------------------------
// 1. ACADEMIC DEGREE PROGRAMS & COURSES FIREBASE CRUD
// -------------------------------------------------------------

export const DEFAULT_COURSES: CourseProgram[] = [
  {
    code: "CSE-101",
    name: "B.E. Computer Science & Engineering",
    dept: "Computer Science",
    hod: "Dr. K. Senthilkumar",
    karurSeats: 180,
    coimbatoreSeats: 240,
    tuitionFee: "₹85,000 / Year",
    nbaAccredited: true,
    meta: "4 Years • Full-Time Degree",
    iconName: "Cpu",
    description: "Industry-aligned computing curriculum covering Data Structures, Cloud Computing, Full-Stack Development, and DevOps engineering.",
    eligibility: "10+2 with Physics, Chemistry & Mathematics (Min. 50% for OC, 45% for BC/MBC, 40% for SC/ST).",
    syllabus: ["Data Structures & Algorithms", "Database Management Systems", "Computer Networks", "Cloud Computing & AWS", "Compiler Design"],
    careerRoles: ["Full-Stack Software Engineer", "Cloud Architect", "System Analyst", "Cybersecurity Specialist"],
  },
  {
    code: "AIDS-102",
    name: "B.Tech Artificial Intelligence & Data Science",
    dept: "AI & DS",
    hod: "Dr. P. Rajasekaran",
    karurSeats: 120,
    coimbatoreSeats: 180,
    tuitionFee: "₹95,000 / Year",
    nbaAccredited: true,
    meta: "4 Years • High Demand Tech",
    iconName: "Brain",
    description: "Cutting-edge artificial intelligence, machine learning algorithms, deep learning neural networks, Big Data analytics, and generative AI models.",
    eligibility: "10+2 with Physics, Chemistry & Mathematics with strong aptitude in computing and statistics.",
    syllabus: ["Foundations of AI", "Machine Learning & Deep Learning", "Big Data Analytics", "Natural Language Processing", "Computer Vision"],
    careerRoles: ["AI/ML Engineer", "Data Scientist", "NLP Researcher", "Business Intelligence Architect"],
  },
  {
    code: "ECE-103",
    name: "B.E. Electronics & Communication Engg",
    dept: "Electronics",
    hod: "Dr. M. Karthikeyan",
    karurSeats: 180,
    coimbatoreSeats: 180,
    tuitionFee: "₹80,000 / Year",
    nbaAccredited: true,
    meta: "4 Years • VLSI & Embedded",
    iconName: "Radio",
    description: "Specialized focus on VLSI design, semiconductor chips, IoT sensor networks, 5G wireless telecommunications, and robotics.",
    eligibility: "10+2 with PCM. TNEA Counselling and Management Quota direct admission available.",
    syllabus: ["Digital Signal Processing", "VLSI System Design", "Embedded Microcontrollers", "Wireless Communication", "Optical Networks"],
    careerRoles: ["VLSI Design Engineer", "Embedded Systems Developer", "Telecom Specialist", "Robotics Hardware Engineer"],
  },
  {
    code: "CY-104",
    name: "B.Tech Cyber Security",
    dept: "Information Tech",
    hod: "Dr. V. Deepa",
    karurSeats: 60,
    coimbatoreSeats: 120,
    tuitionFee: "₹90,000 / Year",
    nbaAccredited: true,
    meta: "4 Years • Network & Security",
    iconName: "ShieldAlert",
    description: "Comprehensive offensive and defensive cybersecurity, ethical hacking, digital forensics, cloud governance, and zero-trust security.",
    eligibility: "10+2 with PCM. Suitable for students passionate about cyber forensics and ethical hacking.",
    syllabus: ["Ethical Hacking & Penetration Testing", "Cryptography", "Network Defense & Countermeasures", "Digital Forensics", "Cloud Security"],
    careerRoles: ["Security Operations Analyst (SOC)", "Penetration Tester", "Information Security Consultant", "Forensic Investigator"],
  },
  {
    code: "MECH-105",
    name: "B.E. Mechanical Engineering",
    dept: "Mechanical",
    hod: "Dr. S. Ramesh",
    karurSeats: 120,
    coimbatoreSeats: 60,
    tuitionFee: "₹75,000 / Year",
    nbaAccredited: true,
    meta: "4 Years • CAD & Automation",
    iconName: "Wrench",
    description: "Core mechanical engineering fundamentals combined with modern Industry 4.0, CAD/CAM/CAE, electric vehicle (EV) engineering, and robotics.",
    eligibility: "10+2 with PCM or Diploma in Mechanical (Direct 2nd Year Lateral Entry eligible).",
    syllabus: ["Thermodynamics & Heat Transfer", "Design of Machine Elements", "Finite Element Analysis (FEA)", "Automotive & EV Technology", "Robotics & Automation"],
    careerRoles: ["Mechanical Design Engineer", "EV Powertrain Engineer", "Production & Quality Manager", "Automotive Specialist"],
  },
  {
    code: "EEE-106",
    name: "B.E. Electrical & Electronics Engg",
    dept: "Electrical",
    hod: "Dr. G. Anbalagan",
    karurSeats: 60,
    coimbatoreSeats: 60,
    tuitionFee: "₹75,000 / Year",
    nbaAccredited: true,
    meta: "4 Years • Power & EV Systems",
    iconName: "Zap",
    description: "Smart grids, renewable energy systems, electric vehicle drivetrains, power electronics, and industrial automation controls.",
    eligibility: "10+2 with PCM. Anna University affiliated.",
    syllabus: ["Power Systems & Smart Grids", "Power Electronics & Inverters", "Electric Vehicle Drives", "Control Systems Engineering", "Renewable Energy Technology"],
    careerRoles: ["Power Systems Engineer", "EV Battery Specialist", "Automation & PLC Engineer", "Solar/Wind Energy Consultant"],
  },
];

export async function fetchCoursesFromFirebase(): Promise<CourseProgram[]> {
  try {
    await ensureFirebaseAuth();
    const snap = await withTimeout(getDocs(collection(db, "courses")), 4000);
    if (snap && !snap.empty) {
      const list: CourseProgram[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as CourseProgram);
      });
      return list;
    }
  } catch (err) {
    console.warn("Firestore fetchCourses notice:", err);
  }

  // If empty in Firestore, auto-seed default courses into Firebase!
  return await seedInitialCoursesToFirebase();
}

export async function saveCourseToFirebase(course: CourseProgram): Promise<boolean> {
  if (!course || !course.code) return false;
  const clean = sanitizeForFirebase({
    ...course,
    updatedAt: new Date().toISOString(),
  });

  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, "courses", course.code);
    await withTimeout(setDoc(docRef, clean, { merge: true }), 3000);
    console.log(`🔥 [Firebase Firestore] Saved academic program: ${course.code} (${course.name})`);
    return true;
  } catch (err) {
    console.warn("Firestore saveCourse notice:", err);
    return false;
  }
}

export async function deleteCourseFromFirebase(courseCode: string): Promise<boolean> {
  if (!courseCode) return false;
  try {
    await ensureFirebaseAuth();
    await withTimeout(deleteDoc(doc(db, "courses", courseCode)), 2500);
    console.log(`🔥 [Firebase Firestore] Deleted course: ${courseCode}`);
    return true;
  } catch (err) {
    console.warn("Firestore deleteCourse notice:", err);
    return false;
  }
}

export async function seedInitialCoursesToFirebase(): Promise<CourseProgram[]> {
  try {
    await ensureFirebaseAuth();
    await Promise.allSettled(
      DEFAULT_COURSES.map(async (c) => {
        const docRef = doc(db, "courses", c.code);
        await setDoc(docRef, sanitizeForFirebase(c), { merge: true });
      })
    );
    console.log(`🔥 [Firebase Firestore] Seeded ${DEFAULT_COURSES.length} academic courses successfully!`);
    return DEFAULT_COURSES;
  } catch (e) {
    console.warn("Error seeding courses to Firebase:", e);
    return DEFAULT_COURSES;
  }
}

// -------------------------------------------------------------
// 2. ADMISSION FEE PAYMENTS & BILLING FIREBASE CRUD
// -------------------------------------------------------------

export async function fetchPaymentsFromFirebase(campus?: CampusLocation): Promise<Payment[]> {
  try {
    await ensureFirebaseAuth();
    const snap = await withTimeout(getDocs(collection(db, "payments")), 4000);
    if (snap && !snap.empty) {
      const list: Payment[] = [];
      snap.forEach((docSnap) => {
        const item = docSnap.data() as Payment;
        if (!campus || campus === "ALL" || item.campus === campus) {
          list.push(item);
        }
      });
      if (list.length > 0) return list;
    }
  } catch (err) {
    console.warn("Firestore fetchPayments notice:", err);
  }

  // Fallback: seed initial payments
  return await seedInitialPaymentsToFirebase();
}

export async function savePaymentToFirebase(payment: Payment): Promise<boolean> {
  if (!payment || !payment.id) return false;
  const clean = sanitizeForFirebase({
    ...payment,
    updatedAt: new Date().toISOString(),
  });

  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, "payments", payment.id);
    await withTimeout(setDoc(docRef, clean, { merge: true }), 3000);
    console.log(`🔥 [Firebase Firestore] Saved payment receipt: ${payment.transactionId} for ${payment.studentName}`);

    // If student ID is known, also update paymentStatus in students & managed_applications
    if (payment.applicationId) {
      const studentId = payment.applicationId.replace(/^app_/, "");
      try {
        await setDoc(
          doc(db, "students", studentId),
          {
            application: { paymentStatus: "COMPLETED", stage: "FEE_PAID" },
            status: "ADMITTED",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {}

      try {
        await setDoc(
          doc(db, "managed_applications", payment.applicationId),
          { paymentStatus: "Payment Approved", formStatus: "Complete", updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (e) {}
    }

    return true;
  } catch (err) {
    console.warn("Firestore savePayment notice:", err);
    return false;
  }
}

export async function seedInitialPaymentsToFirebase(): Promise<Payment[]> {
  const initialPayments: Payment[] = [
    {
      id: "pay_401",
      applicationId: "app_1",
      studentName: "Revathy",
      course: "B.E. Computer Science and Engineering",
      campus: "KARUR",
      amount: 85000,
      status: "COMPLETED",
      transactionId: "VSB_TXN_998827361",
      createdAt: "2026-08-01T15:00:00Z",
    },
    {
      id: "pay_402",
      applicationId: "app_2",
      studentName: "Gunal",
      course: "B.Tech AI & Data Science",
      campus: "COIMBATORE",
      amount: 95000,
      status: "COMPLETED",
      transactionId: "VSB_TXN_998827362",
      createdAt: "2026-08-05T09:00:00Z",
    },
    {
      id: "pay_403",
      applicationId: "app_3",
      studentName: "Priyadharshini",
      course: "B.E. Electronics & Communication",
      campus: "KARUR",
      amount: 80000,
      status: "COMPLETED",
      transactionId: "VSB_TXN_998827363",
      createdAt: "2026-08-10T11:30:00Z",
    },
  ];

  try {
    await ensureFirebaseAuth();
    await Promise.allSettled(
      initialPayments.map(async (p) => {
        await setDoc(doc(db, "payments", p.id), sanitizeForFirebase(p), { merge: true });
      })
    );
    console.log(`🔥 [Firebase Firestore] Seeded ${initialPayments.length} initial payment transactions.`);
    return initialPayments;
  } catch (e) {
    return initialPayments;
  }
}

// -------------------------------------------------------------
// 3. SYSTEM ACCOUNTS & ADMIN SETTINGS FIREBASE CRUD
// -------------------------------------------------------------

export const DEFAULT_SYSTEM_ACCOUNTS: SystemAccountRecord[] = [
  {
    id: "acc_1",
    username: "adminkarur@123",
    password: "vsbec@123",
    role: "ADMIN",
    campus: "KARUR",
    isLoggedIn: true,
    lastActive: "Active Now (Current Session)",
  },
  {
    id: "acc_2",
    username: "admincovai@123",
    password: "vsbectc@1213",
    role: "ADMIN",
    campus: "COIMBATORE",
    isLoggedIn: true,
    lastActive: "Active Now (Coimbatore Session)",
  },
  {
    id: "acc_3",
    username: "usercounselor@123",
    password: "user123",
    role: "COUNSELOR",
    campus: "KARUR",
    isLoggedIn: true,
    lastActive: "Active Now (Desk #4)",
  },
  {
    id: "acc_4",
    username: "teacherkarur@123",
    password: "teacher123",
    role: "FACULTY",
    campus: "KARUR",
    isLoggedIn: false,
    lastActive: "Today at 09:45 AM",
  },
  {
    id: "acc_5",
    username: "teachercovai@123",
    password: "teacher123",
    role: "FACULTY",
    campus: "COIMBATORE",
    isLoggedIn: false,
    lastActive: "Yesterday at 04:30 PM",
  },
];

export async function fetchSystemAccountsFromFirebase(): Promise<SystemAccountRecord[]> {
  try {
    await ensureFirebaseAuth();
    const snap = await withTimeout(getDocs(collection(db, "system_accounts")), 4000);
    if (snap && !snap.empty) {
      const list: SystemAccountRecord[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as SystemAccountRecord);
      });
      if (list.length > 0) return list;
    }
  } catch (err) {
    console.warn("Firestore fetchSystemAccounts notice:", err);
  }

  // Seed defaults into Firestore
  try {
    await ensureFirebaseAuth();
    await Promise.allSettled(
      DEFAULT_SYSTEM_ACCOUNTS.map(async (acc) => {
        await setDoc(doc(db, "system_accounts", acc.id), sanitizeForFirebase(acc), { merge: true });
      })
    );
    return DEFAULT_SYSTEM_ACCOUNTS;
  } catch (e) {
    return DEFAULT_SYSTEM_ACCOUNTS;
  }
}

export async function saveSystemAccountToFirebase(acc: SystemAccountRecord): Promise<boolean> {
  if (!acc || !acc.id) return false;
  const clean = sanitizeForFirebase({
    ...acc,
    updatedAt: new Date().toISOString(),
  });

  try {
    await ensureFirebaseAuth();
    await withTimeout(setDoc(doc(db, "system_accounts", acc.id), clean, { merge: true }), 3000);
    console.log(`🔥 [Firebase Firestore] Saved system account: ${acc.username}`);
    return true;
  } catch (err) {
    console.warn("Firestore saveSystemAccount notice:", err);
    return false;
  }
}

export async function deleteSystemAccountFromFirebase(id: string): Promise<boolean> {
  if (!id) return false;
  try {
    await ensureFirebaseAuth();
    await withTimeout(deleteDoc(doc(db, "system_accounts", id)), 2500);
    console.log(`🔥 [Firebase Firestore] Deleted system account: ${id}`);
    return true;
  } catch (err) {
    console.warn("Firestore deleteSystemAccount notice:", err);
    return false;
  }
}

export async function fetchAdminSettingsFromFirebase(): Promise<AdminSettingsRecord> {
  const defaultSettings: AdminSettingsRecord = {
    collegeName: "V.S.B. ENGINEERING COLLEGE",
    karurCode: "VSB-612",
    coimbatoreCode: "VSB-714",
    autoCounselorAssignment: true,
    whatsappAlerts: true,
    emailNotifications: true,
  };

  try {
    await ensureFirebaseAuth();
    const snap = await withTimeout(getDoc(doc(db, "admin_settings", "general")), 3000);
    if (snap && snap.exists()) {
      return { ...defaultSettings, ...(snap.data() as AdminSettingsRecord) };
    }
  } catch (e) {}

  return defaultSettings;
}

export async function saveAdminSettingsToFirebase(settings: AdminSettingsRecord): Promise<boolean> {
  try {
    await ensureFirebaseAuth();
    await withTimeout(
      setDoc(doc(db, "admin_settings", "general"), sanitizeForFirebase(settings), { merge: true }),
      3000
    );
    console.log("🔥 [Firebase Firestore] Saved admin settings.");
    return true;
  } catch (err) {
    console.warn("Firestore saveAdminSettings notice:", err);
    return false;
  }
}

// -------------------------------------------------------------
// 4. OFFLINE APPLICATION BATCH UPLOAD HISTORY FIREBASE CRUD
// -------------------------------------------------------------

export async function fetchOfflineUploadLogsFromFirebase(): Promise<OfflineUploadLog[]> {
  try {
    await ensureFirebaseAuth();
    const snap = await withTimeout(getDocs(collection(db, "offline_upload_logs")), 4000);
    if (snap && !snap.empty) {
      const list: OfflineUploadLog[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as OfflineUploadLog);
      });
      return list;
    }
  } catch (err) {
    console.warn("Firestore fetchOfflineUploadLogs notice:", err);
  }

  // Initial demo logs
  const demoLogs: OfflineUploadLog[] = [
    {
      id: "LOG_901",
      batchName: "TNEA_WalkIn_Admissions_Karur_Day1.xlsx",
      uploadedBy: "Prof. P. Rajesh",
      recordsCount: 148,
      status: "Verified & Synced",
      timestamp: "Sep 12, 2026 10:15 AM",
      campus: "KARUR",
    },
    {
      id: "LOG_902",
      batchName: "School_Outreach_Coimbatore_Expo.csv",
      uploadedBy: "Dr. S. Meenakshi",
      recordsCount: 92,
      status: "Verified & Synced",
      timestamp: "Sep 11, 2026 04:30 PM",
      campus: "COIMBATORE",
    },
  ];

  try {
    await Promise.allSettled(
      demoLogs.map(async (l) => {
        await setDoc(doc(db, "offline_upload_logs", l.id), sanitizeForFirebase(l), { merge: true });
      })
    );
  } catch (e) {}

  return demoLogs;
}

export async function saveOfflineUploadBatchToFirebase(
  log: OfflineUploadLog,
  applications: ManagedApplication[],
  leads?: Partial<Lead>[]
): Promise<boolean> {
  try {
    await ensureFirebaseAuth();

    // 1. Save log record into offline_upload_logs
    await setDoc(doc(db, "offline_upload_logs", log.id), sanitizeForFirebase(log), { merge: true });

    // 2. Save each parsed application into managed_applications
    await Promise.allSettled(
      applications.map(async (app) => {
        await saveApplicationToFirebase(app);
      })
    );

    // 3. Save each student lead into students
    if (leads && leads.length > 0) {
      await Promise.allSettled(
        leads.map(async (lead) => {
          if (lead.name) {
            await saveStudentToFirebase(lead as any);
          }
        })
      );
    }

    console.log(`🔥 [Firebase Batch Upload] Ingested ${applications.length} applications in batch ${log.batchName}!`);
    return true;
  } catch (err) {
    console.warn("Firestore saveOfflineUploadBatch notice:", err);
    return false;
  }
}

// -------------------------------------------------------------
// 5. STUDENT DOCUMENTS & MARKSHEET OCR UPLOAD TO FIREBASE
// -------------------------------------------------------------

export async function uploadStudentDocumentToFirebase(
  studentId: string,
  docData: StudentDocument
): Promise<boolean> {
  if (!studentId || !docData) return false;
  const cleanDoc = sanitizeForFirebase({
    ...docData,
    updatedAt: new Date().toISOString(),
  });

  try {
    await ensureFirebaseAuth();

    // 1. Store in student document sub-collection
    const docRef = doc(db, "students", studentId, "documents", docData.docType);
    await withTimeout(setDoc(docRef, cleanDoc, { merge: true }), 4000);

    // 2. Also update student document root with documents map and extracted marks
    const studentUpdates: Record<string, any> = {
      [`documents.${docData.docType}`]: cleanDoc,
      updatedAt: new Date().toISOString(),
    };

    if (docData.extractedData) {
      if (docData.extractedData.marks10th) {
        studentUpdates["application.marks10th"] = docData.extractedData.marks10th;
      }
      if (docData.extractedData.marks12th) {
        studentUpdates["application.marks12th"] = docData.extractedData.marks12th;
      }
      if (docData.extractedData.tneaCutoff) {
        studentUpdates.tneaCutoff = docData.extractedData.tneaCutoff;
      }
      if (docData.extractedData.studentName) {
        studentUpdates.name = docData.extractedData.studentName;
      }
    }

    await setDoc(doc(db, "students", studentId), studentUpdates, { merge: true });
    console.log(`🔥 [Firebase Documents] Successfully saved ${docData.title} for student #${studentId}!`);
    return true;
  } catch (err) {
    console.warn("Firestore uploadStudentDocument notice:", err);
    return false;
  }
}

export async function fetchStudentDocumentsFromFirebase(
  studentId: string
): Promise<Record<string, StudentDocument>> {
  if (!studentId) return {};
  try {
    await ensureFirebaseAuth();
    const snap = await withTimeout(getDocs(collection(db, "students", studentId, "documents")), 3000);
    const docsMap: Record<string, StudentDocument> = {};
    if (snap && !snap.empty) {
      snap.forEach((docSnap) => {
        const item = docSnap.data() as StudentDocument;
        docsMap[item.docType] = item;
      });
      return docsMap;
    }

    // Check student root documents field
    const studentSnap = await getDoc(doc(db, "students", studentId));
    if (studentSnap && studentSnap.exists()) {
      const data = studentSnap.data();
      if (data.documents && typeof data.documents === "object") {
        return data.documents;
      }
    }
  } catch (err) {
    console.warn("Firestore fetchStudentDocuments notice:", err);
  }
  return {};
}

export async function deleteStudentDocumentFromFirebase(
  studentId: string,
  docType: string
): Promise<boolean> {
  if (!studentId || !docType) return false;
  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, "students", studentId, "documents", docType));
    await setDoc(
      doc(db, "students", studentId),
      {
        [`documents.${docType}`]: null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`🔥 [Firebase Documents] Removed ${docType} for student #${studentId}`);
    return true;
  } catch (err) {
    console.warn("Firestore deleteStudentDocument notice:", err);
    return false;
  }
}

