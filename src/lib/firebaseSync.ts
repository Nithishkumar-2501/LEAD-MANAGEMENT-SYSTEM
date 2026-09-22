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
import { Lead, Application, Teacher, ManagedApplication } from "@/types/crm";
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

