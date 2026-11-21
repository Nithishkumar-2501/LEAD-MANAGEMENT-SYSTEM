import { Lead, CampusLocation } from "@/types/crm";

export interface FacultyMember {
  id: string;
  name: string;
  department: string;
  campus: "KARUR" | "COIMBATORE";
}

export const FACULTY_DIRECTORY: FacultyMember[] = [
  { id: "rajesh.mech@vsbec.in", name: "Prof. P. Rajesh", department: "Mechanical Engineering", campus: "KARUR" },
  { id: "arulmurugan.cse@vsbec.in", name: "Dr. K. Arulmurugan", department: "Computer Science", campus: "KARUR" },
  { id: "meenakshi.ece@vsbec.in", name: "Dr. S. Meenakshi", department: "Electronics & Communication", campus: "COIMBATORE" },
  { id: "gayathri.it@vsbec.in", name: "Dr. N. Gayathri", department: "Information Technology", campus: "KARUR" },
  { id: "karthik.ai@vsbec.in", name: "Prof. M. Karthik", department: "Artificial Intelligence & Data Science", campus: "KARUR" },
  { id: "saravanan.eee@vsbec.in", name: "Dr. R. Saravanan", department: "Electrical & Electronics Engg", campus: "KARUR" },
  { id: "anitha.bme@vsbec.in", name: "Prof. V. Anitha", department: "Biomedical Engineering", campus: "KARUR" },
  { id: "senthil.civil@vsbec.in", name: "Dr. T. Senthil", department: "Civil Engineering", campus: "KARUR" },
  { id: "kavitha.cyber@vsbec.in", name: "Prof. P. Kavitha", department: "Cyber Security", campus: "COIMBATORE" },
  { id: "ramesh.robotics@vsbec.in", name: "Dr. G. Ramesh", department: "Robotics & Automation", campus: "KARUR" },
  { id: "divya.chem@vsbec.in", name: "Prof. S. Divya", department: "Chemical Engineering", campus: "KARUR" },
  { id: "manikandan.aero@vsbec.in", name: "Dr. A. Manikandan", department: "Aeronautical Engineering", campus: "COIMBATORE" },
  { id: "priya.biotech@vsbec.in", name: "Prof. R. Priya", department: "Biotechnology", campus: "KARUR" },
  { id: "suresh.ds@vsbec.in", name: "Dr. K. Suresh", department: "Data Science", campus: "KARUR" },
  { id: "deepa.it@vsbec.in", name: "Prof. N. Deepa", department: "Information Technology", campus: "COIMBATORE" },
  { id: "prakash.cse@vsbec.in", name: "Dr. M. Prakash", department: "Computer Science & Engineering", campus: "COIMBATORE" },
  { id: "teacherkarur@123", name: "Dr Dhanabal M Assistant Professor MECH", department: "Mechanical Engineering", campus: "KARUR" },
  { id: "teachercovai@123", name: "Dr. S. Meenakshi", department: "Electronics & Communication", campus: "COIMBATORE" },
  { id: "teacher_rajesh@123", name: "Prof. P. Rajesh", department: "Mechanical Engineering", campus: "KARUR" },
];

/**
 * Resolves the display name of a teacher given their username or ID
 */
export function getTeacherDisplayName(username?: string): string {
  if (!username) return "Faculty Member";
  const clean = username.toLowerCase().trim();
  const found = FACULTY_DIRECTORY.find(
    (f) => f.id.toLowerCase().trim() === clean || f.name.toLowerCase().trim() === clean
  );
  if (found) return found.name;
  return username;
}

/**
 * Checks if a lead is assigned strictly to the logged-in teacher.
 * Returns true if the lead is assigned to this teacher, false otherwise.
 * If user is ADMIN, caller can bypass this or pass isAdmin check.
 */
export function isLeadAssignedToTeacher(
  lead: Lead,
  teacherUsername?: string,
  teacherCampus?: "KARUR" | "COIMBATORE"
): boolean {
  if (!teacherUsername) return false;

  const cleanUser = teacherUsername.toLowerCase().trim();
  if (!cleanUser) return false;

  // Strict campus isolation: A teacher can NEVER access leads from a different campus
  // 1. Check explicit teacherCampus argument
  if (teacherCampus && lead.campus && lead.campus !== teacherCampus) {
    return false;
  }

  // 2. Fallback check: look up teacher's campus from directory
  const registeredFaculty = FACULTY_DIRECTORY.find(
    (f) => f.id.toLowerCase().trim() === cleanUser || f.name.toLowerCase().trim() === cleanUser
  );
  if (registeredFaculty && lead.campus && lead.campus !== registeredFaculty.campus) {
    return false;
  }

  const assigned = (lead.assignedTo || "").toLowerCase().trim();
  const counselorId = (lead.counselorId || "").toLowerCase().trim();

  // Known non-teacher or unassigned sentinel values
  const UNASSIGNED_OR_ADMIN_TOKENS = new Set([
    "",
    "unassigned",
    "none",
    "not assigned",
    "usr_admin_vsb",
    "usr_creator",
    "admin",
    "admin@vsb.ac.in",
    "admissions admin",
    "creator",
    "creator@vsb.ac.in",
  ]);

  // If lead is unassigned or assigned to generic admin/creator on both fields, reject immediately
  const hasAssigned = assigned !== "" && !UNASSIGNED_OR_ADMIN_TOKENS.has(assigned);
  const hasCounselor = counselorId !== "" && !UNASSIGNED_OR_ADMIN_TOKENS.has(counselorId);

  if (!hasAssigned && !hasCounselor) {
    return false;
  }

  // Build the strict aliases for the logged-in teacher
  const teacherAliases = new Set<string>();
  teacherAliases.add(cleanUser);

  // Known account mappings
  if (cleanUser === "teacherkarur@123") {
    teacherAliases.add("teacherkarur@123");
    teacherAliases.add("dr dhanabal m assistant professor mech");
    teacherAliases.add("dr dhanabal m");
    teacherAliases.add("dr. dhanabal m");
    teacherAliases.add("dr dhanabal");
    teacherAliases.add("dhanabal");
    teacherAliases.add("fac-karur-01");
  } else if (cleanUser === "teachercovai@123") {
    teacherAliases.add("teachercovai@123");
    teacherAliases.add("meenakshi.ece@vsbec.in");
    teacherAliases.add("dr. s. meenakshi");
    teacherAliases.add("dr s meenakshi");
    teacherAliases.add("dr. meenakshi");
    teacherAliases.add("dr meenakshi");
    teacherAliases.add("meenakshi");
  } else if (cleanUser === "teacher_rajesh@123" || cleanUser.includes("rajesh")) {
    teacherAliases.add("teacher_rajesh@123");
    teacherAliases.add("rajesh.mech@vsbec.in");
    teacherAliases.add("prof. p. rajesh");
    teacherAliases.add("prof p rajesh");
    teacherAliases.add("prof. rajesh");
    teacherAliases.add("p. rajesh");
    teacherAliases.add("rajesh");
  }

  // Match against faculty directory
  const faculty = FACULTY_DIRECTORY.find(
    (f) =>
      f.id.toLowerCase().trim() === cleanUser ||
      f.name.toLowerCase().trim() === cleanUser ||
      cleanUser.includes(f.id.split("@")[0].toLowerCase())
  );

  if (faculty) {
    const fId = faculty.id.toLowerCase().trim();
    const fName = faculty.name.toLowerCase().trim();
    teacherAliases.add(fId);
    teacherAliases.add(fName);
    const prefix = fId.split("@")[0];
    if (prefix.length >= 4) {
      teacherAliases.add(prefix);
    }
  }

  // Helper function to test candidate value against aliases
  const matchesTeacher = (candidate: string): boolean => {
    if (!candidate || UNASSIGNED_OR_ADMIN_TOKENS.has(candidate)) return false;

    // Exact match
    if (candidate === cleanUser || teacherAliases.has(candidate)) return true;

    // Substring match for substantial tokens (minimum 5 chars to avoid loose collisions)
    for (const alias of teacherAliases) {
      if (alias.length >= 5) {
        if (candidate.includes(alias) || alias.includes(candidate)) {
          return true;
        }
      }
    }
    return false;
  };

  if (hasAssigned && matchesTeacher(assigned)) {
    return true;
  }

  if (hasCounselor && matchesTeacher(counselorId)) {
    return true;
  }

  return false;
}

/**
 * Deterministically computes the starting lead/contact number for a faculty member.
 */
export function getTeacherStartIdx(assignedRangeText?: string, email?: string): number {
  if (assignedRangeText) {
    const match = assignedRangeText.match(/#(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  let hash = 0;
  const cleanEmail = email || "";
  for (let i = 0; i < cleanEmail.length; i++) {
    hash = (hash * 31 + cleanEmail.charCodeAt(i)) % 900;
  }
  return Math.max(1, hash);
}

/**
 * Deterministic status rule for whether a contact in the initial batch was talked to.
 */
export function isTeacherLeadTalked(contactNo: number): boolean {
  return (contactNo % 3 === 0) || (contactNo % 5 === 1) || (contactNo % 7 === 2);
}

/**
 * Helper to determine if a faculty member has an active allocated student lead batch.
 */
export function isFacultyBatchAllocated(tch?: {
  assignedQuota?: number;
  assignedRangeText?: string;
}): boolean {
  if (!tch) return false;
  const quota = tch.assignedQuota;
  if (!quota || quota <= 0) return false;
  if (!tch.assignedRangeText) return false;
  const lower = tch.assignedRangeText.toLowerCase();
  if (lower.includes("unassigned") || lower.includes("awaiting") || lower.includes("pool")) {
    return false;
  }
  return true;
}

/**
 * Calculates teacher calling audit statistics (talked vs not talked vs total).
 * Reads persistent localStorage records if present, or falls back to the exact
 * deterministic generation rule used by TeacherStudentAuditModal so card and modal counts
 * always match 100%.
 */
export function getTeacherCallStats(tch: {
  id?: string;
  email?: string;
  assignedQuota?: number;
  assignedRangeText?: string;
}): { talked: number; notTalked: number; total: number } {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const key = `vsb_teacher_call_records_${tch.id || tch.email}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const expectedStartIdx = getTeacherStartIdx(tch.assignedRangeText, tch.email);
          if (parsed[0]?.leadNumber === undefined || parsed[0]?.leadNumber === expectedStartIdx) {
            const talked = parsed.filter((p: any) => p.isTalked).length;
            const total = parsed.length;
            return { talked, notTalked: Math.max(0, total - talked), total };
          }
        }
      }
    }
  } catch (e) {}

  if (!isFacultyBatchAllocated(tch)) {
    return { talked: 0, notTalked: 0, total: 0 };
  }

  const quota = tch.assignedQuota || 100;
  const startIdx = getTeacherStartIdx(tch.assignedRangeText, tch.email);

  let talked = 0;
  for (let i = 0; i < quota; i++) {
    const contactNo = startIdx + i;
    if (isTeacherLeadTalked(contactNo)) {
      talked++;
    }
  }
  return { talked, notTalked: Math.max(0, quota - talked), total: quota };
}

export interface BatchRange {
  start: number;
  end: number;
}

/**
 * Extracts numerical [start, end] boundaries from an assignedRangeText string.
 * Handles formats like: "Contacts #601 to #700", "Batch #1 - #100", "#101 to #200", "#1-#100".
 */
export function parseBatchRange(rangeText?: string): BatchRange | null {
  if (!rangeText) return null;
  const match = rangeText.match(/#(\d+)\s*(?:to|-)\s*#?(\d+)/i);
  if (match) {
    const s = parseInt(match[1], 10);
    const e = parseInt(match[2], 10);
    if (!isNaN(s) && !isNaN(e) && s > 0 && e >= s) {
      return { start: s, end: e };
    }
  }
  const single = rangeText.match(/#(\d+)/);
  if (single) {
    const s = parseInt(single[1], 10);
    if (!isNaN(s) && s > 0) {
      return { start: s, end: s + 99 };
    }
  }
  return null;
}

/**
 * Checks if two batch ranges overlap.
 */
export function doBatchRangesOverlap(a: BatchRange, b: BatchRange): boolean {
  return Math.max(a.start, b.start) <= Math.min(a.end, b.end);
}

/**
 * Finds the first available non-overlapping batch range of length `quota` in [1, maxTotalContacts].
 */
export function findNextAvailableBatchRange(
  occupiedRanges: BatchRange[],
  quota = 100,
  maxTotalContacts = 1000
): BatchRange | null {
  const safeQuota = Math.max(1, quota);
  for (let s = 1; s + safeQuota - 1 <= maxTotalContacts; s += safeQuota) {
    const candidate: BatchRange = { start: s, end: s + safeQuota - 1 };
    const hasOverlap = occupiedRanges.some((occ) => doBatchRangesOverlap(candidate, occ));
    if (!hasOverlap) {
      return candidate;
    }
  }
  return null;
}

/**
 * Finds if a proposed batch allocation for a teacher collides with any other teacher's active batch.
 */
export function findConflictingAllocatedTeacher<
  T extends { id?: string; email?: string; name?: string; assignedQuota?: number; assignedRangeText?: string }
>(
  targetTeacherIdentifier: string,
  startNumber: number,
  quantity: number,
  teachersList: T[]
): { teacher: T; range: BatchRange } | null {
  const targetEnd = startNumber + quantity - 1;
  const targetRange: BatchRange = { start: startNumber, end: targetEnd };
  const cleanTarget = (targetTeacherIdentifier || "").toLowerCase().trim();

  for (const t of teachersList) {
    const tId = (t.id || "").toLowerCase().trim();
    const tEmail = (t.email || "").toLowerCase().trim();
    if (tId === cleanTarget || tEmail === cleanTarget) continue;
    if (!isFacultyBatchAllocated(t)) continue;

    const existingRange = parseBatchRange(t.assignedRangeText);
    if (!existingRange) continue;

    if (doBatchRangesOverlap(targetRange, existingRange)) {
      return { teacher: t, range: existingRange };
    }
  }
  return null;
}

/**
 * Reconciles and sanitizes an entire list of teachers so that NO TWO TEACHERS
 * ever hold overlapping batches. If a collision is found (e.g. Sangeetha and
 * Soundararajan both holding #601 to #700), the first teacher retains their batch
 * and any subsequent colliding teacher is automatically reassigned to an exclusive,
 * non-overlapping batch from the pool, preventing duplicate student allocations.
 */
export function reconcileOverlappingTeacherBatches<
  T extends { id?: string; email?: string; name?: string; assignedQuota?: number; assignedRangeText?: string }
>(
  teachersList: T[],
  maxTotalContacts = 1000
): { reconciled: T[]; modified: T[] } {
  if (!Array.isArray(teachersList)) return { reconciled: [], modified: [] };

  const occupiedRanges: BatchRange[] = [];
  const modified: T[] = [];

  const reconciled = teachersList.map((tch) => {
    if (!isFacultyBatchAllocated(tch)) {
      return tch;
    }

    const range = parseBatchRange(tch.assignedRangeText);
    const quota = tch.assignedQuota || (range ? range.end - range.start + 1 : 100);

    // Check if this teacher's range collides with an already occupied range
    const isColliding = !range || occupiedRanges.some((occ) => doBatchRangesOverlap(range, occ));

    if (!isColliding && range) {
      occupiedRanges.push(range);
      return tch;
    }

    // Collision detected! Find next free non-overlapping batch
    const freeBatch = findNextAvailableBatchRange(occupiedRanges, quota, maxTotalContacts);
    if (freeBatch) {
      occupiedRanges.push(freeBatch);
      const updatedTeacher = {
        ...tch,
        assignedQuota: freeBatch.end - freeBatch.start + 1,
        assignedRangeText: `Contacts #${freeBatch.start} to #${freeBatch.end}`,
      };
      modified.push(updatedTeacher);
      return updatedTeacher;
    } else {
      // Pool exhausted: gracefully revert to general pool
      const updatedTeacher = {
        ...tch,
        assignedQuota: 0,
        assignedRangeText: "Unassigned (General Pool)",
      };
      modified.push(updatedTeacher);
      return updatedTeacher;
    }
  });

  return { reconciled, modified };
}
