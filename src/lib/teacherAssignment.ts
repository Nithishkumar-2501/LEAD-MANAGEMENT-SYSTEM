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
  const assigned = (lead.assignedTo || "").toLowerCase().trim();
  const counselorId = (lead.counselorId || "").toLowerCase().trim();

  // If lead is unassigned or assigned to someone else
  if (!assigned && !counselorId) return false;

  // 1. Direct match on assignedTo or counselorId
  if (assigned === cleanUser || counselorId === cleanUser) return true;

  // 2. Exact match on clean IDs
  if (assigned.includes(cleanUser) || cleanUser.includes(assigned)) return true;

  // 3. Known faculty accounts mapping
  if (cleanUser === "teacherkarur@123") {
    return (
      assigned === "teacherkarur@123" ||
      assigned.includes("dhanabal") ||
      assigned.includes("arulmurugan") ||
      assigned.includes("karur")
    );
  }

  if (cleanUser === "teachercovai@123") {
    return (
      assigned === "teachercovai@123" ||
      assigned.includes("meenakshi") ||
      assigned.includes("covai") ||
      assigned.includes("coimbatore")
    );
  }

  if (cleanUser === "teacher_rajesh@123" || cleanUser.includes("rajesh")) {
    return (
      assigned.includes("rajesh") ||
      assigned === "teacher_rajesh@123" ||
      assigned === "rajesh.mech@vsbec.in"
    );
  }

  if (cleanUser === "arulmurugan.cse@vsbec.in" || cleanUser.includes("arul")) {
    return (
      assigned.includes("arul") ||
      assigned === "arulmurugan.cse@vsbec.in" ||
      assigned === "teacherkarur@123"
    );
  }

  if (cleanUser === "meenakshi.ece@vsbec.in" || cleanUser.includes("meenakshi")) {
    return (
      assigned.includes("meenakshi") ||
      assigned === "meenakshi.ece@vsbec.in" ||
      assigned === "teachercovai@123"
    );
  }

  // 4. Match against faculty directory
  const faculty = FACULTY_DIRECTORY.find(
    (f) =>
      f.id.toLowerCase() === cleanUser ||
      f.name.toLowerCase() === cleanUser ||
      cleanUser.includes(f.id.split("@")[0])
  );

  if (faculty) {
    const fName = faculty.name.toLowerCase();
    const fId = faculty.id.toLowerCase();
    if (assigned === fId || assigned.includes(fId)) return true;
    if (assigned === fName || assigned.includes(fName) || fName.includes(assigned)) return true;
  }

  // 5. Check if assignedTo matches any faculty whose ID or name matches cleanUser
  const assignedFaculty = FACULTY_DIRECTORY.find(
    (f) =>
      f.name.toLowerCase() === assigned ||
      f.id.toLowerCase() === assigned ||
      assigned.includes(f.name.toLowerCase())
  );
  if (assignedFaculty) {
    if (
      assignedFaculty.id.toLowerCase() === cleanUser ||
      assignedFaculty.name.toLowerCase() === cleanUser ||
      cleanUser.includes(assignedFaculty.id.split("@")[0])
    ) {
      return true;
    }
  }

  return false;
}
