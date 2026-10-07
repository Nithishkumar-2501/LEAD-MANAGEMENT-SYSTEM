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
