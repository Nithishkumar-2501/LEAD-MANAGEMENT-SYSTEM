/**
 * NORA AI Database Analytics & Conversational Query Agent
 * Provides precise data extraction, multi-field database search, and intelligent responses
 * for:
 * 1. Name & Full Student Profiles
 * 2. Mobile Numbers & Verified Phone Directories (Students & Teachers)
 * 3. City / District Analytics (Tamil Nadu & Inter-State)
 * 4. TNEA Cutoff & Academic Marks (Above, Below, Range, Highest, Average)
 * 5. E-mail Addresses & Verification
 * 6. Admitted vs. Non-Admitted Statuses & Counts
 * 7. Application Numbers & Counselling Numbers (e.g. app_1, app 1001)
 * 8. Priority Tiers (HOT ≥72%, WARM 45-71%, COLD <45%)
 * 9. Teacher Names & Faculty Profiles
 * 10. Teacher Mobile Numbers & Direct Lines
 * 11. Courses & Engineering Degree Programs (CSE, AIDS, AIML, IT, ECE, EEE, Mech, Civil, etc.)
 * 12. Social Media & Omnichannel Acquisition Channels (WhatsApp, Facebook, Ads, X, SMS, Email, Expo)
 * 13. Total Counts & Executive Metrics (Campus-wise, Status-wise, Overall)
 * 14. Teacher Outreach & Action Monitoring (Tracking leads contacted by every faculty mentor)
 */

import { Lead, Application, CampusLocation, ActiveTab, Teacher } from "@/types/crm";
import { predictStudentConversion } from "./leadScoringEngine";
import { askVirtualCounselor } from "./counselorKnowledge";
import { MOCK_TEACHERS } from "@/lib/mockData";
import { FACULTY_DIRECTORY, getTeacherCallStats, isLeadAssignedToTeacher } from "@/lib/teacherAssignment";

export const TN_DISTRICTS = [
  "salem", "karur", "coimbatore", "covai", "tirupur", "tiruppur", "erode", "namakkal", "dindigul",
  "trichy", "tiruchirappalli", "madurai", "chennai", "theni", "thanjavur", "pudukkottai",
  "ariyalur", "chengalpattu", "cuddalore", "dharmapuri", "kallakurichi", "kancheepuram",
  "kanniyakumari", "krishnagiri", "mayiladuthurai", "nagapattinam", "nilgiris", "perambalur",
  "ramanathapuram", "ranipet", "sivaganga", "tenkasi", "thoothukudi", "tirunelveli",
  "tirupathur", "tiruvallur", "tiruvannamalai", "tiruvarur", "vellore", "viluppuram", "virudhunagar"
];

export const OTHER_DISTRICTS = [
  "bengaluru", "bangalore", "mysuru", "mysore", "palakkad", "kozhikode", "calicut", "ernakulam",
  "kochi", "thiruvananthapuram", "trivandrum", "chittoor", "tirupati", "vijayawada", "guntur",
  "visakhapatnam", "vizag", "nellore", "kurnool", "anantapur", "mangalore", "belagavi"
];

export const CRM_COURSES = [
  { key: "cse", name: "Computer Science and Engineering" },
  { key: "aids", name: "Artificial Intelligence and Data Science" },
  { key: "aiml", name: "Artificial Intelligence and Machine Learning" },
  { key: "ai", name: "Artificial Intelligence and Data Science" },
  { key: "it", name: "Information Technology" },
  { key: "ece", name: "Electronics and Communication Engineering" },
  { key: "eee", name: "Electrical and Electronics Engineering" },
  { key: "mech", name: "Mechanical Engineering" },
  { key: "bio", name: "BioMedical / Bio Technology" },
  { key: "civil", name: "Civil Engineering" },
  { key: "cyber", name: "Cyber Security" },
  { key: "robotics", name: "Robotics and Automation" },
  { key: "chem", name: "Chemical Engineering" },
  { key: "aero", name: "Aeronautical Engineering" },
];

export const CRM_SOURCE_KEYWORDS = [
  { key: "ads", label: "Google & Social Ads", match: ["ads", "google ads", "social ads", "ad campaign", "newspaper ad"] },
  { key: "whatsapp", label: "WhatsApp Direct", match: ["whatsapp", "wa", "whatsapp messenger", "whatsapp campaign"] },
  { key: "facebook", label: "Facebook / Meta", match: ["facebook", "fasebook", "fb", "meta", "messenger"] },
  { key: "x", label: "X (Twitter)", match: ["x", "twitter", "tweet", "broadcasts"] },
  { key: "email", label: "E-mail", match: ["email", "e-mail", "mail", "portal", "automated email"] },
  { key: "sms", label: "SMS", match: ["sms", "sms gateway", "text message", "alerts"] },
  { key: "campaign", label: "Marketing Campaign", match: ["campaign", "omnichannel", "marketing campaign"] },
  { key: "expo", label: "Project Expo", match: ["project expo", "expo", "college expo", "event leads", "fair"] },
  { key: "tnea", label: "TNEA Counselling", match: ["tnea", "counselling", "general counselling", "quota", "merit quota"] },
  { key: "walkin", label: "Direct Walk-in", match: ["walkin", "walk-in", "walk in", "direct visit", "in-person", "campus visit"] },
];

export interface NoraChatMessage {
  id: string;
  sender: "USER" | "NORA";
  text: string;
  specificData?: {
    type: "SINGLE_STUDENT" | "STUDENT_LIST" | "METRICS" | "DASHBOARD_NAV" | "TEXT_ONLY" | "DELETE_CONFIRMATION" | "FILE_UPLOAD_PROMPT";
    student?: Lead & { application: Application; aiScore?: number; priorityTier?: string; computedCutoff?: number };
    studentsList?: (Lead & { application: Application; aiScore?: number; priorityTier?: string; computedCutoff?: number })[];
    stats?: Record<string, any>;
    targetTab?: ActiveTab;
    targetTabTitle?: string;
  };
  suggestedQueries?: string[];
  timestamp: string;
}

/**
 * Loads the active faculty roster from localStorage or falls back to MOCK_TEACHERS
 */
export function getFacultyList(): Teacher[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = localStorage.getItem("vsb_crm_teachers");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return MOCK_TEACHERS;
}

/**
 * Computes live outreach metrics for each faculty mentor (contacts allocated vs contacted)
 */
export function getTeacherOutreachMetrics(teachers: Teacher[], applicants: Lead[]): {
  teachersWithStats: (Teacher & { actualContacted: number; completionPct: number; pendingCount: number })[];
  totalAllocated: number;
  totalContacted: number;
  overallCompletionPct: number;
} {
  let totalAllocated = 0;
  let totalContacted = 0;

  const teachersWithStats = teachers.map((tch) => {
    const quota = tch.assignedQuota || 0;
    const stats = getTeacherCallStats(tch);

    // Live count from applicants array
    const liveAssignedContacted = applicants.filter((a) => {
      const isAssigned =
        (a.assignedTo || "").toLowerCase().includes(tch.name.toLowerCase()) ||
        (a.assignedTo || "").toLowerCase().includes(tch.id.toLowerCase()) ||
        (a.counselorId || "").toLowerCase().includes(tch.id.toLowerCase());
      const isContacted =
        a.status === "CONTACTED" ||
        a.status === "ADMITTED" ||
        a.status === "INTERESTED" ||
        (a.subStage && a.subStage.toLowerCase() !== "untouched");
      return isAssigned && isContacted;
    }).length;

    const actualContacted = Math.max(tch.contactedCount || 0, stats.talked, liveAssignedContacted);
    const completionPct = quota > 0 ? Math.min(100, Math.round((actualContacted / quota) * 100)) : (actualContacted > 0 ? 100 : 0);
    const pendingCount = quota > 0 ? Math.max(0, quota - actualContacted) : 0;

    totalAllocated += quota;
    totalContacted += actualContacted;

    return {
      ...tch,
      actualContacted,
      completionPct,
      pendingCount,
    };
  });

  const overallCompletionPct = totalAllocated > 0 ? Math.round((totalContacted / totalAllocated) * 100) : 0;

  return {
    teachersWithStats,
    totalAllocated,
    totalContacted,
    overallCompletionPct,
  };
}

export function processNoraChatQuery(
  query: string,
  applicants: (Lead & { application: Application })[],
  currentCampus: CampusLocation = "ALL",
  currentUserRole: "ADMIN" | "COUNSELOR" | "TEACHER" = "ADMIN"
): NoraChatMessage {
  const rawQuery = (query || "").trim();
  const normalizedQuery = rawQuery
    .toLowerCase()
    .replace(/\bdasgboard\b|\bdashbord\b|\bdashbaord\b|\bdash board\b/g, "dashboard")
    .replace(/\bcontant platform\b|\bcontact platform\b|\bcommunication platform\b/g, "contact platform")
    .replace(/\bmobil\b|\bmob\b|\bphno\b|\bcellphone\b/g, "mobile")
    .replace(/\bcoures\b|\bcourses\b|\bcourse\b/g, "course")
    .replace(/\bcontected\b|\bcontacted\b/g, "contacted")
    .replace(/\badmission crm\b|\bcrm system\b|\badmission system\b/g, "crm");

  const q = normalizedQuery;
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // 1. Scope applicants to current campus
  const scopeApplicants = applicants.filter((a) => {
    if (currentCampus !== "ALL" && (a.campus || "KARUR").toUpperCase() !== currentCampus.toUpperCase()) return false;
    return true;
  });

  // 2. Scope teachers to current campus
  const allFaculty = getFacultyList();
  const scopeTeachers = allFaculty.filter((t) => {
    if (currentCampus !== "ALL" && (t.campus || "KARUR").toUpperCase() !== currentCampus.toUpperCase()) return false;
    return true;
  });

  // 3. Enrich applicants with real-time ML prediction scores
  const enrichedApplicants = scopeApplicants.map((a) => {
    const pred = predictStudentConversion({
      tneaCutoff: a.tneaCutoff || (a.application ? a.application.marks12th * 2 : 160),
      community: a.community || "BC",
      district: a.district || "Karur",
      source: a.source || "TNEA Counselling",
      counselorFollowups: 2,
      courseInterest: a.courseInterest,
      status: a.status,
      stage: a.application?.stage,
    });
    return {
      ...a,
      aiScore: pred.conversionProbability,
      priorityTier: pred.priorityTier,
      computedCutoff: pred.tneaCutoff || (a.application ? a.application.marks12th * 2 : 160),
    };
  });

  // -------------------------------------------------------------
  // 0. DELETE CONTACT / STUDENT FROM DATABASE INTENT
  // -------------------------------------------------------------
  const isDeleteIntent =
    /^(delete|remove|erase|drop|purge)\b/i.test(q) ||
    (/\b(delete|remove|erase|purge)\b/i.test(q) && /\b(contact|student|lead|candidate|record|data|contect)\b/i.test(q));

  if (isDeleteIntent) {
    const cleanTarget = q
      .replace(/^(delete|remove|erase|drop|purge)\s+/i, "")
      .replace(/\b(the|this|contact|contect|student|lead|candidate|record|data|from database|from the database|in database|in the database)\b/gi, "")
      .trim();

    if (!cleanTarget) {
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `🗑️ **Delete Contact from Database**:\n\nPlease specify the student's **Name**, **Phone Number**, or **ID** that you would like to delete.\n\n*Examples:* \n• \`delete contact Gunal\`\n• \`delete student 9894283561\`\n• \`delete lead 12\``,
        suggestedQueries: [
          "Show all leads",
          "Highest Cutoff",
          "Add data to database",
        ],
        timestamp,
      };
    }

    const targetDigits = cleanTarget.replace(/\D/g, "");
    const matchedToDelete = enrichedApplicants.filter((a) => {
      if (a.id.toLowerCase() === cleanTarget.toLowerCase()) return true;
      if (targetDigits.length >= 6 && ((a.phone || "").replace(/\D/g, "").includes(targetDigits) || (a.alternatePhone || "").replace(/\D/g, "").includes(targetDigits))) return true;
      if (a.name.toLowerCase().includes(cleanTarget.toLowerCase())) return true;
      return false;
    });

    if (matchedToDelete.length === 0) {
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `❌ Could not find any student record matching **"${cleanTarget}"** in the database to delete.\n\nPlease verify the student name, phone number, or ID and try again.`,
        suggestedQueries: ["Show all leads", "Add data to database"],
        timestamp,
      };
    }

    if (matchedToDelete.length === 1) {
      const s = matchedToDelete[0];
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `⚠️ **Confirm Permanent Deletion from Database**:\n\nDo you want to permanently delete this contact record?\n\n• **Student Name**: **${s.name}**\n• 📞 **Mobile**: \`${s.phone}\`\n• 📍 **District**: ${s.district || "Karur"}\n• 🎓 **Course**: ${s.courseInterest}\n• 🆔 **Lead ID**: \`${s.id}\`\n\nClick **Confirm & Delete Permanently** below to erase this record from the database and Firebase:`,
        specificData: {
          type: "DELETE_CONFIRMATION",
          student: s,
        },
        suggestedQueries: [
          `Confirm delete ${s.name}`,
          "Cancel",
        ],
        timestamp,
      };
    }

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `Found **${matchedToDelete.length} candidates** matching **"${cleanTarget}"**. Click **Delete** on the specific student you wish to remove from the database:`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matchedToDelete,
      },
      suggestedQueries: matchedToDelete.slice(0, 3).map((s) => `delete contact ${s.name}`),
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 0.1 ADD DATA / FILE UPLOAD INTENT
  // -------------------------------------------------------------
  const isUploadIntent =
    /\b(add data|upload file|upload csv|upload excel|import leads|import data|add file|insert file|upload to database|add to database|add student file|import contacts)\b/i.test(q);

  if (isUploadIntent) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📂 **Add Data to Database via File Upload**:\n\nYou can upload a **CSV, Excel (.xlsx/.xls), or JSON** file directly into NORA Chatbot to instantly ingest and add contacts to the database!\n\n• **Supported Formats**: CSV, TSV, TXT, JSON, Excel\n• **Auto Detection**: Maps \`Name\`, \`Phone\`, \`Email\`, \`District\`, \`Course\`, \`Cutoff\`, \`Marks12th\`, \`School\`\n• **Live Sync**: Instantly saves into Prisma SQLite & Firebase Firestore\n\nClick the **Choose & Upload File** button below or use the **📎 Paperclip** icon in the chat bar:`,
      specificData: {
        type: "FILE_UPLOAD_PROMPT",
      },
      suggestedQueries: [
        "Show all leads",
        "How many admitted?",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 1. TEACHER LEAD OUTREACH & ACTION MONITORING INTENT
  // (e.g. "how many lead are contected by the teacher", "teacher action", "monitor teacher", "teacher monitoring", "counselor activity", "contacted by teacher", "teacher audit", "leads contacted by faculty")
  // -------------------------------------------------------------
  const isTeacherMonitoringIntent =
    /\b(how many|count|show|monitor|track|audit|view|get)\s+(leads?|contects?|contacts?|students?)\s+(are\s+)?(contacted|called|talked)\s+(by|by\s+the)\s+(teacher|teachers|faculty)\b/i.test(q) ||
    /\b(how many|count)\s+(leads?|contacts?)\s+(contacted)\s+by\s+(teacher|teachers|faculty)\b/i.test(q) ||
    /\b(teacher|teachers|faculty)\s+(action|monitoring|activity|audit|performance|progress|outreach|calling)\b/i.test(q) ||
    /\b(monitor|track)\s+(every|all|the)?\s*(teacher|teachers|faculty)\b/i.test(q) ||
    /\bleads?\s+(contacted)\s+by\s+(the\s+)?(teacher|teachers|faculty)\b/i.test(q) ||
    (/\b(teacher|teachers|faculty)\b/i.test(q) && /\b(contacted|calling|outreach|progress|audit)\b/i.test(q));

  if (isTeacherMonitoringIntent) {
    const { teachersWithStats, totalAllocated, totalContacted, overallCompletionPct } = getTeacherOutreachMetrics(
      scopeTeachers,
      enrichedApplicants
    );

    const activeTeachersWithQuota = teachersWithStats.filter((t) => (t.assignedQuota || 0) > 0);
    const topPerformers = [...teachersWithStats].sort((a, b) => b.actualContacted - a.actualContacted).slice(0, 5);

    let report = `👨‍🏫 **Teacher Lead Outreach & Action Monitoring Dashboard**:\n\n`;
    report += `• 📊 **Overall Outreach**: **${totalContacted}** of **${totalAllocated} assigned student leads** contacted (**${overallCompletionPct}% completed**)\n`;
    report += `• 🏛️ **Monitored Faculty Mentors**: **${scopeTeachers.length} active teachers** across ${currentCampus === "ALL" ? "Karur & Coimbatore campuses" : `${currentCampus} campus`}\n`;
    report += `• 🎯 **Top Performing Counselor**: **${topPerformers[0]?.name || "Faculty"}** (${topPerformers[0]?.actualContacted || 0} leads contacted)\n\n`;

    report += `**Detailed Teacher Action Breakdown**:\n`;
    activeTeachersWithQuota.forEach((t) => {
      const quota = t.assignedQuota || 100;
      const contacted = t.actualContacted;
      const pct = t.completionPct;
      const statusIcon = pct >= 80 ? "🟢" : pct >= 50 ? "🟡" : "🔴";
      report += `• ${statusIcon} **${t.name}** (${t.department} • ${t.campus})\n`;
      report += `  - 📞 Mobile: \`${t.phone}\` | Batch: \`${t.assignedRangeText || "General Pool"}\`\n`;
      report += `  - ✅ **Contacted**: **${contacted} / ${quota} leads** (**${pct}%**) | ⏳ Pending: **${t.pendingCount} leads**\n`;
    });

    if (activeTeachersWithQuota.length === 0) {
      report += `\n*Currently, all faculty members are set to the General Unassigned Pool. Use the Teacher Directory to allocate batches.*`;
    }

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: report,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "TEACHERS",
        targetTabTitle: "Open Teacher Directory & Calling Audits",
      },
      suggestedQueries: [
        "Teacher mobile numbers",
        "How many admitted?",
        "Total leads count",
        "Show hot leads",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 2. SPECIFIC TEACHER LOOKUP (BY NAME, SPECIFIC ACTION, OR PHONE NUMBER)
  // (e.g. "contacted by Rajesh", "teacher Rajesh activity", "Dr. Arulmurugan", "Prof Rajesh", "Meenakshi phone")
  // -------------------------------------------------------------
  const teacherIdentMatch = scopeTeachers.find((t) => {
    const cleanName = t.name.toLowerCase();
    const cleanId = t.id.toLowerCase();
    const parts = cleanName.replace(/^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+/i, "").split(/\s+/);

    if (q.includes(cleanName)) return true;
    if (q.includes(cleanId.split("@")[0])) return true;

    // Substantial surname or unique name check (e.g. "rajesh", "arulmurugan", "meenakshi", "dhanabal", "gayathri", "saravanan")
    const meaningfulParts = parts.filter((p) => p.length >= 4 && !["assistant", "professor", "engineering", "dr", "prof"].includes(p));
    if (meaningfulParts.some((part) => q.includes(part))) return true;

    // Phone match
    const cleanTPhone = (t.phone || "").replace(/\D/g, "");
    const qDigits = q.replace(/\D/g, "");
    if (qDigits.length >= 6 && cleanTPhone.includes(qDigits)) return true;

    return false;
  });

  if (teacherIdentMatch && (q.includes("teacher") || q.includes("faculty") || q.includes("prof") || q.includes("dr") || q.includes("contacted") || q.includes("leads") || q.includes("phone") || q.includes("mobile") || q.includes("action") || q.includes("activity") || q.includes("number") || q.includes("call"))) {
    const t = teacherIdentMatch;
    const stats = getTeacherCallStats(t);
    const assignedLeads = enrichedApplicants.filter((a) =>
      isLeadAssignedToTeacher(a, t.id, t.campus === "ALL" ? undefined : t.campus) ||
      (a.assignedTo || "").toLowerCase().includes(t.name.toLowerCase()) ||
      (a.counselorId || "").toLowerCase().includes(t.id.toLowerCase())
    );

    const liveContacted = assignedLeads.filter((a) =>
      a.status === "CONTACTED" || a.status === "ADMITTED" || a.status === "INTERESTED" || (a.subStage && a.subStage.toLowerCase() !== "untouched")
    ).length;

    const actualContacted = Math.max(t.contactedCount || 0, stats.talked, liveContacted);
    const quota = t.assignedQuota || (actualContacted > 0 ? actualContacted : 100);
    const completionPct = quota > 0 ? Math.min(100, Math.round((actualContacted / quota) * 100)) : 100;
    const pendingCount = Math.max(0, quota - actualContacted);

    let tCard = `👨‍🏫 **Faculty Profile & Action Monitor: ${t.name}**:\n\n`;
    tCard += `• **Full Name**: **${t.name}**\n`;
    tCard += `• 🏢 **Department**: **${t.department}**\n`;
    tCard += `• 🏛️ **Campus**: **${t.campus} Campus**\n`;
    tCard += `• 📞 **Direct Mobile**: \`${t.phone}\`\n`;
    tCard += `• 📧 **Official Email**: \`${t.email}\`\n`;
    tCard += `• 🎓 **Assigned Courses**: ${t.coursesAssigned?.join(", ") || "General Engineering"}\n`;
    tCard += `• 📋 **Assigned Quota**: **${quota} Student Contacts** (\`${t.assignedRangeText || "General Pool"}\`)\n\n`;

    tCard += `📞 **Outreach Action Progress**:\n`;
    tCard += `• **Leads Contacted**: **${actualContacted} / ${quota} contacts** (**${completionPct}% completed**)\n`;
    tCard += `• **Pending Outreach**: **${pendingCount} contacts** awaiting call\n`;
    tCard += `• **Status**: **${t.status === "ACTIVE" ? "🟢 ACTIVE & ON TRACK" : "🟡 ON LEAVE"}**\n`;

    if (assignedLeads.length > 0) {
      tCard += `\n**Directly Assigned Students in CRM (${assignedLeads.length})**:\n`;
      tCard += assignedLeads.slice(0, 5).map((a) => `• **${a.name}** (📞 \`${a.phone}\` | Cutoff: ${a.computedCutoff}/200 | ${a.courseInterest} • ${a.status})`).join("\n");
      if (assignedLeads.length > 5) tCard += `\n*...and ${assignedLeads.length - 5} more assigned candidates.*`;
    }

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: tCard,
      specificData: assignedLeads.length > 0 ? {
        type: "STUDENT_LIST",
        studentsList: assignedLeads,
      } : {
        type: "DASHBOARD_NAV",
        targetTab: "TEACHERS",
        targetTabTitle: `View ${t.name} in Teacher Directory`,
      },
      suggestedQueries: [
        `How many leads contacted by ${t.name.split(" ")[1] || t.name}?`,
        "Teacher mobile numbers",
        "How many lead are contacted by the teacher",
        "Show hot leads",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 3. TEACHER MOBILE / PHONE DIRECTORY INTENT
  // (e.g. "teacher mobile number", "teacher phone number", "faculty phone numbers", "faculty mobile", "teacher contact")
  // -------------------------------------------------------------
  const isTeacherPhoneQuery =
    /\b(teacher|teachers|faculty)\s+(mobile|mobil|phone|phno|contact|number|numbers)\b/i.test(q) ||
    /\b(mobile|mobil|phone|phno|contact)\s+(number|numbers|list)?\s*(of|for)\s+(teacher|teachers|faculty)\b/i.test(q);

  if (isTeacherPhoneQuery) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📱 **Verified Faculty & Teacher Contact Directory** (${scopeTeachers.length} mentors recorded in database):\n\n` +
        scopeTeachers.map((t) => `• **${t.name}**: 📞 \`${t.phone}\` | 📧 \`${t.email}\` (${t.department} • ${t.campus})`).join("\n") +
        `\n\n💡 *All teacher phone numbers are verified for direct student counseling and admission queries.*`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "TEACHERS",
        targetTabTitle: "Open Teacher Directory",
      },
      suggestedQueries: [
        "How many lead are contacted by the teacher",
        "Show student mobile numbers",
        "How many admitted?",
        "Total leads count",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 4. TEACHER NAME / FACULTY DIRECTORY INTENT
  // (e.g. "teacher name", "teacher names", "faculty names", "show teachers", "all teachers", "who are the teachers")
  // -------------------------------------------------------------
  const isTeacherNameQuery =
    /\b(teacher|teachers|faculty)\s+(name|names|list|directory)\b/i.test(q) ||
    /\b(all|show|list)\s+(teachers|faculty)\b/i.test(q) ||
    q === "teacher" || q === "teachers" || q === "faculty" || q === "faculty directory";

  if (isTeacherNameQuery) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📖 **VSB Engineering College Faculty Mentors Directory** (${scopeTeachers.length} active mentors):\n\n` +
        scopeTeachers.map((t) => `• **${t.name}** — ${t.department} (${t.campus} Campus) | 📞 \`${t.phone}\` | Quota: **${t.assignedQuota || 0} leads**`).join("\n") +
        `\n\n💡 *Each faculty mentor is allocated student candidates to guide through admissions and counselling.*`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "TEACHERS",
        targetTabTitle: "Open Teacher Directory",
      },
      suggestedQueries: [
        "How many lead are contacted by the teacher",
        "Teacher mobile numbers",
        "What is CSE cutoff?",
        "Show hot leads",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 5. APPLICATION NUMBER SEARCH & LOOKUP
  // (e.g. "app_1", "app_1001", "app 1", "application #12", "application no 101", "counselling number", "application number")
  // -------------------------------------------------------------
  const appNumMatch =
    q.match(/\b(?:app(?:lication)?(?:_|\s*#?|\s*no\.?|\s*id)?\s*(\d+|[a-zA-Z0-9_-]+))\b/i) ||
    q.match(/\b(?:counselling\s*(?:app(?:lication)?)?\s*#?\s*(\d+|[a-zA-Z0-9_-]+))\b/i);

  const isGenericAppNumQuery =
    (q.includes("application number") || q.includes("application no") || q.includes("application id") || q.includes("counselling app no") || q.includes("application list")) &&
    !appNumMatch;

  if (appNumMatch && !isGenericAppNumQuery) {
    const rawTarget = (appNumMatch[1] || "").toLowerCase().trim();
    const matchedByApp = enrichedApplicants.find((a) => {
      const aAppId = (a.application?.id || "").toLowerCase();
      const aLeadId = (a.id || "").toLowerCase();
      const aCounselling = (a.counsellingAppNo || "").toLowerCase();

      if (aAppId === rawTarget || aAppId === `app_${rawTarget}` || aAppId.includes(rawTarget)) return true;
      if (aLeadId === rawTarget || aLeadId.includes(rawTarget)) return true;
      if (aCounselling && (aCounselling === rawTarget || aCounselling.includes(rawTarget))) return true;
      return false;
    });

    if (matchedByApp) {
      const s = matchedByApp;
      const cutoff = s.computedCutoff || s.tneaCutoff || 160;
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `📑 **Application Record Found for Application ID \`${s.application?.id || s.id}\`**:\n\n` +
          `• **Candidate Name**: **${s.name}**\n` +
          `• 🆔 **Application ID**: \`${s.application?.id || "app_" + s.id}\` (Lead ID: \`${s.id}\`)\n` +
          `• 🏛️ **Counselling App No**: \`${s.counsellingAppNo || "TNEA-2026-" + s.id}\`\n` +
          `• 📞 **Mobile Number**: \`${s.phone}\`\n` +
          `• 📧 **E-mail Address**: \`${s.email || "student@vsbec.in"}\`\n` +
          `• 🎯 **TNEA Cutoff**: **${cutoff}/200** (12th Marks: **${s.application?.marks12th || 480}**, 10th Marks: **${s.application?.marks10th || 420}**)\n` +
          `• 🎓 **Applied Course**: **${s.courseInterest}** (${s.campus} Campus)\n` +
          `• 📍 **District**: **${s.district || "Karur"}**\n` +
          `• 📊 **Application Stage**: **${s.application?.stage || "INQUIRY"}** (Status: **${s.status}**)\n` +
          `• 💳 **Payment Status**: **${s.application?.paymentStatus || "PENDING"}**\n` +
          `• 🏷️ **AI Priority**: **${s.priorityTier}** (${s.aiScore || 75}% Conversion Probability)`,
        specificData: {
          type: "SINGLE_STUDENT",
          student: s,
        },
        suggestedQueries: [
          `What is the cutoff for ${s.name}?`,
          "How many admitted?",
          "Show all leads",
        ],
        timestamp,
      };
    }
  }

  if (isGenericAppNumQuery) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📑 **Live Application Numbers Directory** (${enrichedApplicants.length} registered candidate applications):\n\n` +
        enrichedApplicants.slice(0, 10).map((s) => `• **App ID: \`${s.application?.id || "app_" + s.id}\`** — **${s.name}** (Counselling: \`${s.counsellingAppNo || "TNEA-" + s.id}\` • ${s.courseInterest} • Stage: **${s.application?.stage || "INQUIRY"}**)`).join("\n") +
        (enrichedApplicants.length > 10 ? `\n\n*...and ${enrichedApplicants.length - 10} more application records in live database.*` : ""),
      specificData: {
        type: "STUDENT_LIST",
        studentsList: enrichedApplicants,
      },
      suggestedQueries: [
        "Application app_1",
        "How many admitted?",
        "Total leads count",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 6. E-MAIL SEARCH & DIRECTORY INTENT
  // (e.g. "student@gmail.com", "email", "e.mail", "student email", "email address", "show emails")
  // -------------------------------------------------------------
  const emailRegexMatch = q.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i);
  if (emailRegexMatch) {
    const targetEmail = emailRegexMatch[0].toLowerCase();

    // Check teacher email first
    const matchedTeacherByEmail = scopeTeachers.find((t) => t.email.toLowerCase() === targetEmail);
    if (matchedTeacherByEmail) {
      const t = matchedTeacherByEmail;
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `👨‍🏫 **Faculty Record for Email \`${t.email}\`**:\n\n` +
          `• **Name**: **${t.name}**\n` +
          `• **Department**: ${t.department}\n` +
          `• 📞 **Mobile**: \`${t.phone}\`\n` +
          `• 🏛️ **Campus**: ${t.campus}\n` +
          `• 📋 **Assigned Quota**: ${t.assignedQuota || 0} leads (Contacted: **${t.contactedCount || 0}**)`,
        specificData: {
          type: "DASHBOARD_NAV",
          targetTab: "TEACHERS",
          targetTabTitle: `View ${t.name} in Faculty Directory`,
        },
        suggestedQueries: ["Teacher mobile numbers", "How many lead are contacted by the teacher"],
        timestamp,
      };
    }

    // Check student email next
    const matchedStudentByEmail = enrichedApplicants.find((a) => (a.email || "").toLowerCase() === targetEmail);
    if (matchedStudentByEmail) {
      const s = matchedStudentByEmail;
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `👤 **Student Record for Email \`${s.email}\`**:\n\n` +
          `• **Name**: **${s.name}**\n` +
          `• 📞 **Mobile**: \`${s.phone}\`\n` +
          `• 🎯 **TNEA Cutoff**: **${s.computedCutoff}/200**\n` +
          `• 🎓 **Course**: **${s.courseInterest}**\n` +
          `• 📍 **District**: **${s.district || "Karur"}**\n` +
          `• 📊 **Status**: **${s.status}** (${s.priorityTier})`,
        specificData: {
          type: "SINGLE_STUDENT",
          student: s,
        },
        suggestedQueries: [`What is ${s.name}'s phone number?`, "Show all leads"],
        timestamp,
      };
    }
  }

  const isGenericEmailQuery =
    (q.includes("email") || q.includes("e.mail") || q.includes("e-mail") || q.includes("mail address")) &&
    (q.includes("list") || q.includes("show") || q.includes("all") || q.includes("student") || q.includes("directory") || q === "email" || q === "e.mail");

  if (isGenericEmailQuery) {
    const listWithEmail = enrichedApplicants.filter((a) => a.email);
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📧 **Candidate E-mail Directory** (${listWithEmail.length} registered students with verified email addresses):\n\n` +
        listWithEmail.slice(0, 10).map((s) => `• **${s.name}**: \`${s.email}\` | 📞 \`${s.phone}\` (${s.courseInterest})`).join("\n") +
        (listWithEmail.length > 10 ? `\n\n*...and ${listWithEmail.length - 10} more candidate email records.*` : ""),
      specificData: {
        type: "STUDENT_LIST",
        studentsList: listWithEmail,
      },
      suggestedQueries: [
        "Teacher mobile numbers",
        "Show student mobile numbers",
        "How many admitted?",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 7. ADMITTED VS. NON-ADMITTED INTENT
  // (Handling "non admitted", "not admitted", "unadmitted" vs. "admitted", "how many admitted")
  // -------------------------------------------------------------
  const isNonAdmittedQuery =
    /\b(non admitted|not admitted|unadmitted|un-admitted|pending admission|without admission|not yet admitted)\b/i.test(q);

  if (isNonAdmittedQuery) {
    const nonAdmittedList = enrichedApplicants.filter(
      (a) =>
        a.status !== "ADMITTED" &&
        a.application?.stage !== "FEE_PAID" &&
        a.application?.paymentStatus !== "PAID" &&
        a.application?.paymentStatus !== "COMPLETED"
    );

    const nonAdmittedPct = enrichedApplicants.length > 0 ? Math.round((nonAdmittedList.length / enrichedApplicants.length) * 100) : 0;
    const hotNonAdmitted = nonAdmittedList.filter((a) => a.priorityTier === "HOT").length;
    const warmNonAdmitted = nonAdmittedList.filter((a) => a.priorityTier === "WARM").length;
    const coldNonAdmitted = nonAdmittedList.filter((a) => a.priorityTier === "COLD").length;

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `⏳ **Non-Admitted Leads Analysis & Report**:\n\n` +
        `• **Total Non-Admitted Candidates**: **${nonAdmittedList.length} leads** (**${nonAdmittedPct}% of database**)\n` +
        `• 🔥 **High-Probability Leads (HOT ≥72%)**: **${hotNonAdmitted} candidates** (Immediate conversion target!)\n` +
        `• ⚡ **Warm Follow-ups (45-71%)**: **${warmNonAdmitted} candidates**\n` +
        `• ❄️ **Cold / Untouched (<45%)**: **${coldNonAdmitted} candidates**\n\n` +
        `**Top Non-Admitted Candidates Awaiting Admission Finalization**:\n` +
        nonAdmittedList.slice(0, 8).map((s) => `• **${s.name}** | 📞 \`${s.phone}\` | Cutoff: **${s.computedCutoff}/200** | ${s.courseInterest} (${s.priorityTier})`).join("\n") +
        (nonAdmittedList.length > 8 ? `\n\n*...and ${nonAdmittedList.length - 8} more non-admitted candidate records.*` : ""),
      specificData: {
        type: "STUDENT_LIST",
        studentsList: nonAdmittedList,
      },
      suggestedQueries: [
        "How many admitted?",
        "Show hot leads",
        "How many lead are contacted by the teacher",
        "Total count",
      ],
      timestamp,
    };
  }

  const isAdmittedQuery =
    /\b(admitted|how many admitted|who is admitted|admission confirmed|admitted students|total admitted)\b/i.test(q);

  if (isAdmittedQuery) {
    const admittedList = enrichedApplicants.filter(
      (a) =>
        a.status === "ADMITTED" ||
        a.application?.stage === "FEE_PAID" ||
        a.application?.paymentStatus === "PAID" ||
        a.application?.paymentStatus === "COMPLETED"
    );

    const admittedPct = enrichedApplicants.length > 0 ? Math.round((admittedList.length / enrichedApplicants.length) * 100) : 0;

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🎓 **Confirmed Admitted Students Report**:\n\n` +
        `• **Total Officially Admitted**: **${admittedList.length} students** (**${admittedPct}% of total leads**)\n` +
        `• 💳 **Tuition Fee Verified**: **${admittedList.filter((a) => a.application?.paymentStatus === "PAID" || a.application?.stage === "FEE_PAID").length} students**\n` +
        `• 🏛️ **Campus Enrollment**: ${currentCampus === "ALL" ? "Across Karur & Coimbatore" : currentCampus}\n\n` +
        `**Admitted Students List**:\n` +
        admittedList.map((s) => `• **${s.name}** | 📞 \`${s.phone}\` | Cutoff: **${s.computedCutoff}/200** | ${s.courseInterest} (${s.campus})`).join("\n"),
      specificData: {
        type: "STUDENT_LIST",
        studentsList: admittedList,
      },
      suggestedQueries: [
        "Show non admitted leads",
        "Total leads count",
        "How many fee paid?",
        "How many lead are contacted by the teacher",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 8. MOBILE NUMBER / PHONE SEARCH (any query containing 6+ digits)
  // (Checks teacher phone first, then student phone)
  // -------------------------------------------------------------
  const phoneDigits = q.replace(/\D/g, "");
  if (phoneDigits.length >= 6) {
    // 1. Check if digits match any teacher's phone
    const matchedTeacherPhone = scopeTeachers.find((t) => (t.phone || "").replace(/\D/g, "").includes(phoneDigits));
    if (matchedTeacherPhone) {
      const t = matchedTeacherPhone;
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `👨‍🏫 **Faculty Member Matched for Phone Number \`${phoneDigits}\`**:\n\n` +
          `• **Faculty Name**: **${t.name}**\n` +
          `• 📞 **Mobile**: \`${t.phone}\`\n` +
          `• 📧 **Email**: \`${t.email}\`\n` +
          `• 🏢 **Department**: ${t.department} (${t.campus} Campus)\n` +
          `• 📋 **Assigned Quota**: ${t.assignedQuota || 0} contacts (Leads Contacted: **${t.contactedCount || 0}**)\n` +
          `• 🎓 **Assigned Courses**: ${t.coursesAssigned?.join(", ") || "General"}`,
        specificData: {
          type: "DASHBOARD_NAV",
          targetTab: "TEACHERS",
          targetTabTitle: `View ${t.name} in Faculty Directory`,
        },
        suggestedQueries: ["How many lead are contacted by the teacher", "Teacher mobile numbers"],
        timestamp,
      };
    }

    // 2. Check if digits match any student
    const matchedByPhone = enrichedApplicants.filter((a) => {
      const cleanLeadPhone = (a.phone || "").replace(/\D/g, "");
      const cleanAltPhone = (a.alternatePhone || "").replace(/\D/g, "");
      return cleanLeadPhone.includes(phoneDigits) || cleanAltPhone.includes(phoneDigits);
    });

    if (matchedByPhone.length === 1) {
      const s = matchedByPhone[0];
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `Found candidate record matching phone number \`${phoneDigits}\` in Firebase database:\n\n` +
          `• **Student Name**: **${s.name}**\n` +
          `• 📞 **Mobile**: \`${s.phone}\`` + (s.alternatePhone ? ` (Alt: \`${s.alternatePhone}\`)` : "") + `\n` +
          `• 🎯 **TNEA Cutoff**: **${s.computedCutoff}/200**\n` +
          `• 📍 **District**: **${s.district || "Karur"}**\n` +
          `• 🎓 **Course**: **${s.courseInterest}**\n` +
          `• 📊 **Status**: **${s.status}** (${s.subStage || "Untouched"})\n\n` +
          `✏️ *Click **Edit Student Details** below to modify contact info, marks, or stage in Firebase.*`,
        specificData: {
          type: "SINGLE_STUDENT",
          student: s,
        },
        suggestedQueries: [
          `What is the cutoff for ${s.name}?`,
          `Show leads from ${s.district || "Karur"}`,
          "Show hot leads",
        ],
        timestamp,
      };
    } else if (matchedByPhone.length > 1) {
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `Found **${matchedByPhone.length} candidates** matching phone digits \`${phoneDigits}\`:`,
        specificData: {
          type: "STUDENT_LIST",
          studentsList: matchedByPhone,
        },
        suggestedQueries: ["Show hot leads", "Show untouched inquiries"],
        timestamp,
      };
    }
  }

  // -------------------------------------------------------------
  // 9. GENERAL MOBILE / PHONE NUMBER DIRECTORY SEARCH
  // (e.g. "mobile number", "mobil number", "show mobile numbers", "phone numbers", "contact list", "get student numbers")
  // -------------------------------------------------------------
  if (
    q.includes("mobile") ||
    q.includes("mobil") ||
    q.includes("phone") ||
    q.includes("contact number") ||
    q.includes("contact list") ||
    q.includes("phone number")
  ) {
    const listWithPhone = enrichedApplicants.filter((a) => a.phone);
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📱 **Live Candidate Mobile Directory** (${listWithPhone.length} candidates with verified numbers in database):\n\n` +
        listWithPhone.slice(0, 10).map((s) => `• **${s.name}**: \`${s.phone}\` (${s.district || "Karur"} • ${s.courseInterest})`).join("\n") +
        (listWithPhone.length > 10 ? `\n\n*...and ${listWithPhone.length - 10} more candidate records in live database.*` : ""),
      specificData: {
        type: "STUDENT_LIST",
        studentsList: listWithPhone,
      },
      suggestedQueries: [
        "Teacher mobile numbers",
        "What is Gunal's mobile number?",
        "Show hot leads",
        "How many from WhatsApp?",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 10. SPECIFIC STUDENT LOOKUP BY NAME (ChatGPT-Style Detailed Profile)
  // -------------------------------------------------------------
  const matchingStudent = enrichedApplicants.find((a) => {
    const nameLower = a.name.toLowerCase();
    const queryClean = q
      .replace(/^(who is|find|search for|search|get|show|details of|about|tell me about|info on|give me|check|call|view)\s+/i, "")
      .replace(/\b(lead|student|candidate|details|record|data|profile|info|phone|cutoff|marks?|number|contact|mobile|mobil)\b/gi, "")
      .trim();

    if (queryClean.length >= 3 && (nameLower.includes(queryClean) || queryClean.includes(nameLower))) return true;
    if (q.includes(nameLower)) return true;
    const nameParts = nameLower.split(/\s+/);
    const COMMON_NAME_EXCLUSIONS = new Set(["student", "students", "candidate", "candidates", "lead", "leads", "test", "demo", "sample", "admitted", "teacher", "faculty", "name", "names"]);
    if (nameParts.some((part) => part.length >= 3 && !COMMON_NAME_EXCLUSIONS.has(part) && q.includes(part))) return true;

    return false;
  });

  if (matchingStudent) {
    const s = matchingStudent;
    const cutoff = s.computedCutoff || s.tneaCutoff || 160;

    let chatGptBio = `🤖 **ChatGPT Database Insight for ${s.name}**:\n\n`;
    chatGptBio += `👤 **Student Full Name**: **${s.name}**\n`;
    chatGptBio += `📞 **Primary Mobile**: \`${s.phone}\`` + (s.alternatePhone ? ` (Alt: \`${s.alternatePhone}\`)` : "") + `\n`;
    chatGptBio += `📧 **E-mail Address**: \`${s.email || "student@vsbec.in"}\`\n`;
    chatGptBio += `🎯 **TNEA Cutoff**: **${cutoff} / 200**` + (s.application ? ` (12th: ${s.application.marks12th}%, 10th: ${s.application.marks10th}%)` : "") + `\n`;
    chatGptBio += `🎓 **Interested Course**: **${s.courseInterest}**\n`;
    chatGptBio += `📍 **District & Location**: **${s.district || "Karur"}**, ${s.state || "Tamil Nadu"}\n`;
    if (s.school) chatGptBio += `🏫 **High School**: **${s.school}**\n`;
    if (s.fatherName || s.motherName) chatGptBio += `👨‍👩‍👦 **Parents**: Father: **${s.fatherName || "N/A"}** | Mother: **${s.motherName || "N/A"}**\n`;
    if (s.community) chatGptBio += `🏷️ **Community**: **${s.community}** (Blood Group: ${s.bloodGroup || "O+"})\n`;
    chatGptBio += `🌐 **Lead Acquisition Channel**: **${s.source}** (${s.campus} Campus)\n`;
    const tierState = s.priorityTier === "HOT" ? "🔥 HOT (Admitted)" : s.priorityTier === "WARM" ? "⚡ WARM (Ready to Admit)" : "❄️ COLD (Not Interested)";
    chatGptBio += `🎯 **Student State & Priority**: **${tierState}** (${s.aiScore || 80}% Conversion Probability)\n`;
    if (s.application?.paymentStatus) chatGptBio += `💳 **Payment Status**: **${s.application.paymentStatus}**\n`;

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: chatGptBio,
      specificData: {
        type: "SINGLE_STUDENT",
        student: s,
      },
      suggestedQueries: [
        `What is ${s.name}'s phone number?`,
        `What is the cutoff for ${s.name}?`,
        `Show leads from ${s.district || "Karur"}`,
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 11. MULTI-CRITERIA COMBINED SEARCH (e.g. District + Cutoff, District + Course, etc.)
  // -------------------------------------------------------------
  const allKnownDistricts = [...TN_DISTRICTS, ...OTHER_DISTRICTS];
  const matchedDistrictName = allKnownDistricts.find((d) => q.includes(d));
  let districtKey: string | null = null;
  let districtDisplayName: string | null = null;
  if (matchedDistrictName) {
    districtKey = matchedDistrictName === "covai" ? "coimbatore" : matchedDistrictName === "trichy" ? "tiruchirappalli" : matchedDistrictName;
    districtDisplayName = districtKey.charAt(0).toUpperCase() + districtKey.slice(1);
  }

  interface CutoffCriterion {
    type: "BELOW" | "ABOVE" | "RANGE";
    threshold?: number;
    low?: number;
    high?: number;
    symbol: string;
    isStrict?: boolean;
    description: string;
  }

  let cutoffCrit: CutoffCriterion | null = null;

  // Range match (e.g. between 150 and 175, 150 to 175)
  const rangeMatch = q.match(/(?:cutoff|cut off|marks?)?\s*(?:between\s*(\d{2,3}(?:\.\d+)?)\s*(?:and|to|-)\s*(\d{2,3}(?:\.\d+)?)|(\d{2,3}(?:\.\d+)?)\s*(?:to|-)\s*(\d{2,3}(?:\.\d+)?))\s*(?:cutoff|cut off|marks?)?/i);
  if (rangeMatch) {
    const r1 = parseFloat(rangeMatch[1] || rangeMatch[3]);
    const r2 = parseFloat(rangeMatch[2] || rangeMatch[4]);
    if (!isNaN(r1) && !isNaN(r2)) {
      const low = Math.min(r1, r2);
      const high = Math.max(r1, r2);
      cutoffCrit = {
        type: "RANGE",
        low,
        high,
        symbol: "between",
        description: `between ${low} and ${high}/200`,
      };
    }
  }

  // Below match (e.g. cutoff below 150, cutoff < 150)
  if (!cutoffCrit) {
    const belowMatch =
      q.match(/(?:cutoff|cut off|marks?)\s*(?:<|<=|below|under|less than|lesser than|lower than)\s*(\d{2,3}(?:\.\d+)?)/i) ||
      q.match(/(?:<|<=|below|under|less than|lesser than|lower than)\s*(\d{2,3}(?:\.\d+)?)\s*(?:cutoff|cut off|marks?)?/i) ||
      q.match(/(\d{2,3}(?:\.\d+)?)\s*(?:and below|or below|and under|or less)/i);
    if (belowMatch) {
      const val = parseFloat(belowMatch[1]);
      const isOrEqual = q.includes("<=") || q.includes("or below") || q.includes("and below") || q.includes("or less");
      cutoffCrit = {
        type: "BELOW",
        threshold: val,
        isStrict: !isOrEqual,
        symbol: isOrEqual ? "≤" : "<",
        description: `${isOrEqual ? "≤" : "<"} ${val}/200`,
      };
    }
  }

  // Above match (e.g. cutoff > 175, cutoff above 180, cutoff 180+)
  if (!cutoffCrit) {
    const aboveMatch =
      q.match(/(?:cutoff|cut off|marks?)\s*(?:>|>=|above|greater than|more than|higher than|exceeding)\s*(\d{2,3}(?:\.\d+)?)/i) ||
      q.match(/(?:>|>=|above|greater than|more than|higher than|exceeding)\s*(\d{2,3}(?:\.\d+)?)\s*(?:cutoff|cut off|marks?)?/i) ||
      q.match(/(\d{2,3}(?:\.\d+)?)\s*(?:\+|and above|or above|and more|or more)/i) ||
      ((q.includes("cutoff") || q.includes("cut off")) && q.match(/(\d{2,3}(?:\.\d+)?)/i));
    if (aboveMatch) {
      const val = parseFloat(aboveMatch[1]);
      const isStrict = (q.includes(">") && !q.includes(">=")) || q.includes("more than") || q.includes("greater than") || q.includes("exceeding") || q.includes("above");
      cutoffCrit = {
        type: "ABOVE",
        threshold: val,
        isStrict,
        symbol: isStrict ? ">" : "≥",
        description: `${isStrict ? ">" : "≥"} ${val}/200`,
      };
    }
  }

  const matchedCourse = CRM_COURSES.find((c) => {
    const keyRegex = new RegExp(`\\b${c.key}\\b`, "i");
    return keyRegex.test(q) || q.includes(c.name.toLowerCase());
  });

  const matchedSource = CRM_SOURCE_KEYWORDS.find((src) =>
    src.match.some((m) => {
      const regex = new RegExp(`\\b${m}\\b`, "i");
      return regex.test(q);
    })
  );

  let statusCrit: { key: string; label: string; filter: (a: any) => boolean } | null = null;
  if (isNonAdmittedQuery) {
    statusCrit = { key: "NON_ADMITTED", label: "not admitted (pending)", filter: (a) => a.status !== "ADMITTED" && a.application?.stage !== "FEE_PAID" && a.application?.paymentStatus !== "PAID" };
  } else if (q.includes("admitted") || q.includes("admission confirmed")) {
    statusCrit = { key: "ADMITTED", label: "officially admitted", filter: (a) => a.status === "ADMITTED" || a.application?.stage === "FEE_PAID" };
  } else if (q.includes("fee paid") || (q.includes("paid") && !q.includes("dialpad"))) {
    statusCrit = { key: "PAID", label: "fee paid", filter: (a) => a.application?.stage === "FEE_PAID" || a.application?.paymentStatus === "PAID" || a.application?.paymentStatus === "COMPLETED" };
  } else if (q.includes("untouched") || q.includes("new inquiry") || q.includes("new leads")) {
    statusCrit = { key: "NEW", label: "untouched new inquiries", filter: (a) => a.status === "NEW" || a.subStage === "Untouched" };
  } else if (q.includes("hot")) {
    statusCrit = { key: "HOT", label: "HOT priority (≥72%)", filter: (a) => a.priorityTier === "HOT" };
  } else if (q.includes("warm")) {
    statusCrit = { key: "WARM", label: "WARM priority (45-71%)", filter: (a) => a.priorityTier === "WARM" };
  } else if (q.includes("cold")) {
    statusCrit = { key: "COLD", label: "COLD priority (<45%)", filter: (a) => a.priorityTier === "COLD" };
  }

  const criteriaCount =
    (districtKey ? 1 : 0) +
    (cutoffCrit ? 1 : 0) +
    (matchedCourse ? 1 : 0) +
    (matchedSource ? 1 : 0) +
    (statusCrit ? 1 : 0);

  // Composite multi-criteria filtering
  if (criteriaCount >= 2) {
    let matched = enrichedApplicants;

    if (districtKey) {
      matched = matched.filter((a) => (a.district || "").toLowerCase().includes(districtKey!));
    }

    if (cutoffCrit) {
      matched = matched.filter((a) => {
        const c = a.computedCutoff || a.tneaCutoff || (a.application ? a.application.marks12th * 2 : 0);
        if (cutoffCrit!.type === "BELOW") {
          return cutoffCrit!.isStrict ? c < cutoffCrit!.threshold! : c <= cutoffCrit!.threshold!;
        } else if (cutoffCrit!.type === "ABOVE") {
          return cutoffCrit!.isStrict ? c > cutoffCrit!.threshold! : c >= cutoffCrit!.threshold!;
        } else if (cutoffCrit!.type === "RANGE") {
          return c >= cutoffCrit!.low! && c <= cutoffCrit!.high!;
        }
        return true;
      });
    }

    if (matchedCourse) {
      matched = matched.filter((a) =>
        (a.courseInterest || "").toLowerCase().includes(matchedCourse.key) ||
        (a.courseInterest || "").toLowerCase().includes(matchedCourse.name.toLowerCase())
      );
    }

    if (matchedSource) {
      matched = matched.filter((a) => {
        const leadSrc = (a.source || "").toLowerCase();
        return matchedSource.match.some((m) => leadSrc.includes(m)) ||
          (matchedSource.key === "tnea" && a.appliedCounselling);
      });
    }

    if (statusCrit) {
      matched = matched.filter(statusCrit.filter);
    }

    const criteriaPhrases: string[] = [];
    if (districtDisplayName) criteriaPhrases.push(`from **${districtDisplayName}**`);
    if (cutoffCrit) criteriaPhrases.push(`with TNEA Cutoff **${cutoffCrit.description}**`);
    if (matchedCourse) criteriaPhrases.push(`for **${matchedCourse.name}**`);
    if (matchedSource) criteriaPhrases.push(`via **${matchedSource.label}**`);
    if (statusCrit) criteriaPhrases.push(`with status **${statusCrit.label}**`);

    const criteriaSummary = criteriaPhrases.join(" and ");

    if (matched.length > 0) {
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `Found **${matched.length} candidate(s)** ${criteriaSummary}:`,
        specificData: {
          type: "STUDENT_LIST",
          studentsList: matched,
        },
        suggestedQueries: [
          districtDisplayName ? `Show all leads from ${districtDisplayName}` : "Show hot leads",
          cutoffCrit ? `Cutoff > 160` : "Average cutoff",
          "Show all candidates",
        ],
        timestamp,
      };
    } else {
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `No candidates found ${criteriaSummary} in the live database.`,
        specificData: {
          type: "STUDENT_LIST",
          studentsList: [],
        },
        suggestedQueries: [
          districtDisplayName ? `Show leads from ${districtDisplayName}` : "Show hot leads",
          cutoffCrit ? `Cutoff > 160` : "Average cutoff",
          "Show all candidates",
        ],
        timestamp,
      };
    }
  }

  // -------------------------------------------------------------
  // 12. CUTOFF / MARKS SEARCH & COMPARISON
  // -------------------------------------------------------------
  const isCutoffMentioned = q.includes("cutoff") || q.includes("cut off") || /\bmarks?\b/i.test(q);

  if (
    q.includes("highest cutoff") ||
    q.includes("top cutoff") ||
    q.includes("best cutoff") ||
    q.includes("topper") ||
    q.includes("maximum cutoff")
  ) {
    const sorted = [...enrichedApplicants].sort((a, b) => (b.computedCutoff || 0) - (a.computedCutoff || 0));
    const maxScore = sorted[0]?.computedCutoff || 195;
    const topLeads = sorted.slice(0, 8);

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🏆 The highest TNEA Cutoff in the database is **${maxScore}/200**. Here are the top candidates:`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: topLeads,
      },
      suggestedQueries: [
        "Cutoff > 185",
        "Show hot leads",
        "Average cutoff",
      ],
      timestamp,
    };
  }

  if (
    q.includes("average cutoff") ||
    q.includes("mean cutoff") ||
    q.includes("avg cutoff")
  ) {
    const totalScore = enrichedApplicants.reduce((sum, a) => sum + (a.computedCutoff || 160), 0);
    const avg = enrichedApplicants.length > 0 ? (totalScore / enrichedApplicants.length).toFixed(1) : "172.0";

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📊 The **average TNEA Cutoff** across all ${enrichedApplicants.length} registered candidates is **${avg} / 200**.\n\n` +
        `• Candidates above average (≥${avg}): **${enrichedApplicants.filter((a) => (a.computedCutoff || 0) >= parseFloat(avg)).length}**\n` +
        `• Candidates below average (<${avg}): **${enrichedApplicants.filter((a) => (a.computedCutoff || 0) < parseFloat(avg)).length}**`,
      specificData: {
        type: "METRICS",
        stats: { averageCutoff: avg, totalCandidates: enrichedApplicants.length },
      },
      suggestedQueries: [
        `Cutoff > ${Math.round(parseFloat(avg))}`,
        "Highest cutoff",
        "Show hot leads",
      ],
      timestamp,
    };
  }

  // Below Cutoff Filter
  if (cutoffCrit && cutoffCrit.type === "BELOW") {
    const targetCutoff = cutoffCrit.threshold!;
    const matched = enrichedApplicants.filter((a) => {
      const c = a.computedCutoff || a.tneaCutoff || (a.application ? a.application.marks12th * 2 : 0);
      return cutoffCrit!.isStrict ? c < targetCutoff : c <= targetCutoff;
    });

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: matched.length > 0
        ? `Found **${matched.length} candidate(s)** with TNEA Cutoff **${cutoffCrit.symbol} ${targetCutoff}/200**:`
        : `No candidates found with TNEA Cutoff **${cutoffCrit.symbol} ${targetCutoff}/200** in the live database.`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        `Cutoff > ${targetCutoff}`,
        "Highest cutoff",
        "Average cutoff",
      ],
      timestamp,
    };
  }

  // Above Cutoff Filter
  if (cutoffCrit && cutoffCrit.type === "ABOVE") {
    const targetCutoff = cutoffCrit.threshold!;
    const matched = enrichedApplicants.filter((a) => {
      const c = a.computedCutoff || a.tneaCutoff || (a.application ? a.application.marks12th * 2 : 0);
      return cutoffCrit!.isStrict ? c > targetCutoff : c >= targetCutoff;
    });

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: matched.length > 0
        ? `Found **${matched.length} candidate(s)** with TNEA Cutoff **${cutoffCrit.symbol} ${targetCutoff}/200**:`
        : `No candidates found with TNEA Cutoff **${cutoffCrit.symbol} ${targetCutoff}/200** in the live database.`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        "Show hot leads",
        "Leads from Salem",
        "Highest cutoff",
      ],
      timestamp,
    };
  }

  // Range Cutoff Filter
  if (cutoffCrit && cutoffCrit.type === "RANGE") {
    const { low, high } = cutoffCrit;
    const matched = enrichedApplicants.filter((a) => {
      const c = a.computedCutoff || a.tneaCutoff || (a.application ? a.application.marks12th * 2 : 0);
      return c >= low! && c <= high!;
    });

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: matched.length > 0
        ? `Found **${matched.length} candidate(s)** with TNEA Cutoff between **${low} and ${high}/200**:`
        : `No candidates found with TNEA Cutoff between **${low} and ${high}/200** in the live database.`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        `Cutoff > ${high}`,
        `Cutoff < ${low}`,
        "Show hot leads",
      ],
      timestamp,
    };
  }

  // General Cutoff Mentions
  if (isCutoffMentioned && (q.includes("report") || q.includes("summary") || q.includes("list") || q.includes("show") || q.includes("what is") || q.includes("all"))) {
    const totalScore = enrichedApplicants.reduce((sum, a) => sum + (a.computedCutoff || 160), 0);
    const avg = enrichedApplicants.length > 0 ? (totalScore / enrichedApplicants.length).toFixed(1) : "172.0";
    const sorted = [...enrichedApplicants].sort((a, b) => (b.computedCutoff || 0) - (a.computedCutoff || 0));

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📊 **TNEA Cutoff Distribution & Analytics**:\n\n` +
        `• **Average Cutoff**: **${avg} / 200**\n` +
        `• **Highest Recorded**: **${sorted[0]?.computedCutoff || 195} / 200**\n` +
        `• **Cutoff ≥ 180**: **${enrichedApplicants.filter((a) => (a.computedCutoff || 0) >= 180).length}** candidates\n` +
        `• **Cutoff 160–179**: **${enrichedApplicants.filter((a) => (a.computedCutoff || 0) >= 160 && (a.computedCutoff || 0) < 180).length}** candidates\n` +
        `• **Cutoff < 160**: **${enrichedApplicants.filter((a) => (a.computedCutoff || 0) < 160).length}** candidates`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: sorted.slice(0, 10),
      },
      suggestedQueries: [
        "Cutoff > 180",
        "Cutoff below 150",
        "Highest cutoff",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 13. PRIORITY TIERS (HOT, WARM, COLD)
  // -------------------------------------------------------------
  if (q.includes("hot") || q.includes("warm") || q.includes("cold")) {
    const targetTier = q.includes("hot") ? "HOT" : q.includes("warm") ? "WARM" : "COLD";
    const matched = enrichedApplicants.filter((a) => a.priorityTier === targetTier);

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🎯 Here are the **${matched.length} ${targetTier} leads** (Conversion Probability ${
        targetTier === "HOT" ? "≥ 72%" : targetTier === "WARM" ? "45–71%" : "< 45%"
      }):`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        "Show untouched leads",
        "Leads from Salem",
        "Cutoff > 175",
        "How many admitted?",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 14. COURSES & DEGREE PROGRAMS
  // (e.g. "courses", "programs", "CSE", "AIDS", "AIML", "ECE", "EEE", "Mech", "Civil", "IT", "BioMedical")
  // -------------------------------------------------------------
  const isGeneralCourseQuery =
    q === "course" || q === "courses" || q === "all courses" || q === "programs" || q === "list courses" || q.includes("what courses") || q.includes("degree programs");

  if (isGeneralCourseQuery) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🎓 **Approved NBA-Accredited Engineering Courses Offered**:\n\n` +
        `• **Computer Science & AI Stream**:\n` +
        `  1. B.E. Computer Science and Engineering (CSE)\n` +
        `  2. B.Tech Artificial Intelligence and Data Science (AIDS)\n` +
        `  3. B.Tech Artificial Intelligence and Machine Learning (AIML)\n` +
        `  4. B.Tech Information Technology (IT)\n` +
        `  5. B.Tech Cyber Security\n\n` +
        `• **Electronics & Electrical Stream**:\n` +
        `  6. B.E. Electronics and Communication Engineering (ECE)\n` +
        `  7. B.E. Electrical and Electronics Engineering (EEE)\n\n` +
        `• **Mechanical, Civil & Specialized Sciences**:\n` +
        `  8. B.E. Mechanical Engineering (Mech)\n` +
        `  9. B.E. Civil Engineering\n` +
        `  10. B.E. BioMedical Engineering\n` +
        `  11. B.E. Biotechnology\n` +
        `  12. B.E. Robotics & Automation`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "CAMPUSES",
        targetTabTitle: "Explore Campuses & Courses",
      },
      suggestedQueries: [
        "Show CSE leads",
        "Show AIDS leads",
        "Show ECE leads",
        "Cutoff > 175",
      ],
      timestamp,
    };
  }

  if (matchedCourse) {
    const matched = enrichedApplicants.filter((a) =>
      a.courseInterest.toLowerCase().includes(matchedCourse.key) ||
      a.courseInterest.toLowerCase().includes(matchedCourse.name.toLowerCase())
    );

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🎓 Found **${matched.length} candidate(s)** interested in **${matchedCourse.name}**:`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        `Show hot leads for ${matchedCourse.key.toUpperCase()}`,
        `What is the cutoff for ${matchedCourse.key.toUpperCase()}?`,
        "Show all leads",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 15. CITY / DISTRICT SEARCH
  // (e.g. "salem", "coimbatore", "chennai", "karur", "city", "district", "district list")
  // -------------------------------------------------------------
  const isGeneralDistrictQuery =
    q === "city" || q === "cities" || q === "district" || q === "districts" || q.includes("city list") || q.includes("district list") || q.includes("leads by city");

  if (isGeneralDistrictQuery) {
    const countsByDistrict: Record<string, number> = {};
    enrichedApplicants.forEach((a) => {
      const d = (a.district || "Karur").trim();
      countsByDistrict[d] = (countsByDistrict[d] || 0) + 1;
    });

    const sortedDistricts = Object.entries(countsByDistrict).sort((a, b) => b[1] - a[1]);

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📍 **Candidate Distribution by District / City** (${sortedDistricts.length} districts represented):\n\n` +
        sortedDistricts.map(([dist, count]) => `• **${dist}**: **${count} candidate(s)**`).join("\n"),
      specificData: {
        type: "STUDENT_LIST",
        studentsList: enrichedApplicants,
      },
      suggestedQueries: sortedDistricts.slice(0, 3).map(([dist]) => `Leads from ${dist}`),
      timestamp,
    };
  }

  if (matchedDistrictName) {
    const districtKeyLocal = matchedDistrictName === "covai" ? "coimbatore" : matchedDistrictName === "trichy" ? "tiruchirappalli" : matchedDistrictName;
    const matched = enrichedApplicants.filter((a) =>
      (a.district || "").toLowerCase().includes(districtKeyLocal)
    );
    const districtNameLocal = districtKeyLocal.charAt(0).toUpperCase() + districtKeyLocal.slice(1);

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: matched.length > 0
        ? `📍 Found **${matched.length} candidate(s)** from **${districtNameLocal}** in the live database:`
        : `There are currently no candidates recorded from **${districtNameLocal}**.`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        `Show hot leads from ${districtNameLocal}`,
        "Show untouched inquiries",
        "Cutoff > 175",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 16. SOCIAL MEDIA & LEAD SOURCES
  // (e.g. "social media", "channels", "whatsapp", "facebook", "ads", "x", "sms", "email", "expo", "walkin")
  // -------------------------------------------------------------
  const isGeneralSocialMediaQuery =
    q === "social media" || q === "social media channels" || q === "channels" || q === "lead sources" || q.includes("marketing channels") || q.includes("acquisition channels");

  if (isGeneralSocialMediaQuery) {
    const channelCounts: Record<string, number> = {};
    CRM_SOURCE_KEYWORDS.forEach((src) => {
      const count = enrichedApplicants.filter((a) => {
        const leadSrc = (a.source || "").toLowerCase();
        return src.match.some((m) => leadSrc.includes(m)) || (src.key === "tnea" && a.appliedCounselling);
      }).length;
      channelCounts[src.label] = count;
    });

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🌐 **Social Media & Lead Acquisition Channels Breakdown**:\n\n` +
        Object.entries(channelCounts).map(([label, count]) => {
          const pct = enrichedApplicants.length > 0 ? Math.round((count / enrichedApplicants.length) * 100) : 0;
          return `• **${label}**: **${count} leads** (${pct}%)`;
        }).join("\n"),
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "CONTACT_PLATFORM",
        targetTabTitle: "Open Omnichannel Contact Platform",
      },
      suggestedQueries: [
        "How many from WhatsApp?",
        "How many from Ads?",
        "How many from Facebook?",
      ],
      timestamp,
    };
  }

  for (const src of CRM_SOURCE_KEYWORDS) {
    const isMatched = src.match.some((m) => {
      const regex = new RegExp(`\\b${m}\\b`, "i");
      return regex.test(q) || (m === "x" && /\b(?:from x|on x|x leads|x channel)\b/i.test(q));
    });

    if (isMatched && (q.includes("how many") || q.includes("from") || q.includes("lead") || q.includes("student") || q.includes("show") || q.includes("list") || q.includes("count") || q.includes("channel"))) {
      const matchedLeads = enrichedApplicants.filter((a) => {
        const leadSrc = (a.source || "").toLowerCase();
        return src.match.some((m) => leadSrc.includes(m)) ||
          (src.key === "tnea" && a.appliedCounselling);
      });

      const pct = enrichedApplicants.length > 0
        ? Math.round((matchedLeads.length / enrichedApplicants.length) * 100)
        : 0;

      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `📊 Found **${matchedLeads.length} student leads** (${pct}% of total database) acquired through **${src.label}**:\n\n` +
          `• Channel: **${src.label}**\n` +
          `• Matched Records: **${matchedLeads.length} candidates**\n` +
          (matchedLeads.length > 0 ? `• Top interested courses: **${Array.from(new Set(matchedLeads.map(m => m.courseInterest))).slice(0, 3).join(", ")}**` : `No records found under this specific source filter.`),
        specificData: {
          type: "STUDENT_LIST",
          studentsList: matchedLeads,
        },
        suggestedQueries: [
          `Show hot leads from ${src.label}`,
          "How many from WhatsApp?",
          "How many from Facebook?",
          "Show untouched inquiries",
        ],
        timestamp,
      };
    }
  }

  // -------------------------------------------------------------
  // 17. TOTAL COUNT & EXECUTIVE DATABASE METRICS
  // (e.g. "total count", "total leads", "count", "how many students", "how many leads", "overview", "summary")
  // -------------------------------------------------------------
  if (
    q === "count" ||
    q === "total count" ||
    q.includes("total count") ||
    q.includes("total leads") ||
    q.includes("how many students") ||
    q.includes("how many leads") ||
    q.includes("total students") ||
    q.includes("overall count") ||
    q.includes("database summary") ||
    q.includes("overview")
  ) {
    const total = enrichedApplicants.length;
    const hot = enrichedApplicants.filter((a) => a.priorityTier === "HOT").length;
    const warm = enrichedApplicants.filter((a) => a.priorityTier === "WARM").length;
    const cold = enrichedApplicants.filter((a) => a.priorityTier === "COLD").length;
    const admitted = enrichedApplicants.filter(
      (a) => a.status === "ADMITTED" || a.application?.paymentStatus === "PAID" || a.application?.paymentStatus === "COMPLETED" || a.application?.stage === "FEE_PAID"
    ).length;
    const nonAdmitted = Math.max(0, total - admitted);

    const karurCount = enrichedApplicants.filter((a) => (a.campus || "KARUR").toUpperCase() === "KARUR").length;
    const covaiCount = enrichedApplicants.filter((a) => (a.campus || "KARUR").toUpperCase() === "COIMBATORE").length;

    const teacherMetrics = getTeacherOutreachMetrics(scopeTeachers, enrichedApplicants);

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📊 **Live CRM Database Executive Summary & Metrics**:\n\n` +
        `• 👥 **Total Registered Candidates**: **${total} students**\n` +
        `  - 🏛️ Karur Campus: **${karurCount} leads** | 🏛️ Coimbatore Campus: **${covaiCount} leads**\n\n` +
        `• 🎓 **Admission Status**:\n` +
        `  - Confirmed Admitted: **${admitted} students** (${total > 0 ? Math.round((admitted / total) * 100) : 0}%)\n` +
        `  - Non-Admitted / In Progress: **${nonAdmitted} leads** (${total > 0 ? Math.round((nonAdmitted / total) * 100) : 0}%)\n\n` +
        `• 🎯 **AI Conversion Priority Tiers**:\n` +
        `  - 🔥 **HOT (≥72%)**: **${hot} leads**\n` +
        `  - ⚡ **WARM (45-71%)**: **${warm} leads**\n` +
        `  - ❄️ **COLD (<45%)**: **${cold} leads**\n\n` +
        `• 👨‍🏫 **Teacher Outreach Action**:\n` +
        `  - Total Faculty Mentors: **${scopeTeachers.length} teachers**\n` +
        `  - Leads Contacted by Teachers: **${teacherMetrics.totalContacted} / ${teacherMetrics.totalAllocated} contacts** (**${teacherMetrics.overallCompletionPct}% completed**)\n\n` +
        `*You can ask me to search any student by Name, Mobile, Cutoff, Course, City, Application Number, or Teacher!*`,
      specificData: {
        type: "METRICS",
        stats: { total, hot, warm, cold, paid: admitted },
      },
      suggestedQueries: [
        "How many lead are contacted by the teacher",
        "Teacher mobile numbers",
        "How many admitted?",
        "Show non admitted leads",
        "Cutoff > 175",
        "Leads from Salem",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 18. GENERAL CANDIDATE LIST DIRECTORY
  // -------------------------------------------------------------
  const isGeneralCandidateListQuery =
    q.includes("student name") ||
    q.includes("student details") ||
    q.includes("student list") ||
    q.includes("all students") ||
    q.includes("candidate names") ||
    q.includes("show candidates") ||
    q.includes("list students") ||
    q.includes("show all leads");

  if (isGeneralCandidateListQuery) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🎓 **Live Candidate Database Directory** (${enrichedApplicants.length} registered students):\n\n` +
        enrichedApplicants.slice(0, 10).map((s) => `• **${s.name}** | 📞 \`${s.phone}\` | Cutoff: **${s.computedCutoff}/200** | ${s.district || "Karur"} | ${s.courseInterest}`).join("\n") +
        (enrichedApplicants.length > 10 ? `\n\n*...and ${enrichedApplicants.length - 10} more candidate records.*` : ""),
      specificData: {
        type: "STUDENT_LIST",
        studentsList: enrichedApplicants,
      },
      suggestedQueries: [
        "What is Gunal's mobile number?",
        "Show hot leads",
        "Cutoff > 175",
        "Show leads from Salem",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 19. DASHBOARDS SUITE NAVIGATION & EXPLANATION
  // -------------------------------------------------------------
  if (q.includes("admin dashboard") || (q.includes("executive") && q.includes("overview"))) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🛡️ **Admin Dashboard (Executive Overview & TNEA)**:\n\n` +
        `• Real-time TNEA Counselling vs Management Quota seat metrics.\n` +
        `• Total revenue tracking and tuition fee payment verification.\n` +
        `• Counselor outreach efficiency and conversion funnels.\n` +
        `• Karur Main Campus vs Coimbatore Tech Campus quota comparisons.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "ADMIN_DASHBOARD",
        targetTabTitle: "Open Admin Dashboard",
      },
      suggestedQueries: ["How many total leads?", "How many admitted?", "How many lead are contacted by the teacher"],
      timestamp,
    };
  }

  if (q.includes("user dashboard") || q.includes("counselor lead tasks") || q.includes("counselor task")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `👤 **User Dashboard (Counselor Lead Tasks)**:\n\n` +
        `• Prioritized task queue (Calls, Emails, WhatsApp follow-ups).\n` +
        `• 1-click student dialer and automated WhatsApp pitch templates.\n` +
        `• Sub-stage updating (Call Back Later, Interested, Documents Pending).\n` +
        `• Daily conversion velocity tracking.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "USER_DASHBOARD",
        targetTabTitle: "Open User Dashboard",
      },
      suggestedQueries: ["Who are the hot leads?", "Show non admitted leads", "What is Marketing Dashboard?"],
      timestamp,
    };
  }

  if (q.includes("marketing dashboard") || q.includes("ad campaign") || q.includes("cpl roi") || q.includes("cpl")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📢 **Marketing Dashboard (Ad Campaigns & CPL ROI)**:\n\n` +
        `• Real-time Cost-Per-Lead (CPL) and Return on Ad Spend (ROAS).\n` +
        `• Channel attribution across Google Ads, Meta/Facebook, X, and Project Expos.\n` +
        `• Campaign reach, impression analytics, and high school lead capture.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "MARKETING_DASHBOARD",
        targetTabTitle: "Open Marketing Dashboard",
      },
      suggestedQueries: ["How many from ads?", "How many from Facebook?", "How many from WhatsApp?"],
      timestamp,
    };
  }

  if (q.includes("echo dashboard") || q.includes("voice transcript") || q.includes("echo")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `💬 **Echo Dashboard (WhatsApp & Voice Transcripts)**:\n\n` +
        `• Automatic transcription of counselor-student phone conversations.\n` +
        `• Student sentiment classification (INTERESTED, ADMITTED, REVIEWING, NOT_INTERESTED).\n` +
        `• In-browser audio playback and counselor note summaries.\n` +
        `• Compliance-ready **30-day automatic deletion policy** for student privacy.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "ECHO_DASHBOARD",
        targetTabTitle: "Open Echo Dashboard",
      },
      suggestedQueries: ["How many from WhatsApp?", "Who are the hot leads?", "What is NORA AI Suite?"],
      timestamp,
    };
  }

  if (
    q === "dashboard" ||
    q === "dashboards" ||
    q.includes("all dashboards") ||
    q.includes("list dashboards") ||
    q.includes("explain dashboards")
  ) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🖥️ **V.S.B. CRM Dashboard Navigation Suite**:\n\n` +
        `1. 🛡️ **Admin Dashboard**: Executive Overview, TNEA vs Management Quota, revenue & quotas.\n` +
        `2. 👤 **User Dashboard**: Daily operational workspace for counselors with 1-click calls.\n` +
        `3. 📢 **Marketing Dashboard**: Ad campaign tracking, Cost-Per-Lead (CPL), ROAS & channels.\n` +
        `4. 💬 **Echo Dashboard**: Speech-to-text transcripts of counselor calls & audio playback.\n` +
        `5. ✨ **NORA AI Suite**: ML conversion scoring, cutoff analysis & automated AI responses.\n` +
        `6. 👥 **Lead Manager**: Filterable candidate database with full academic & contact dossiers.\n` +
        `7. 📖 **Teacher Directory**: Faculty mentor quota allocations & outreach progress.\n` +
        `8. 💳 **Fee Payment**: Transaction verification & admission confirmation.\n` +
        `9. 🌐 **Contact Platform**: 8 integrated outreach channels.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "ADMIN_DASHBOARD",
        targetTabTitle: "Open Admin Dashboard",
      },
      suggestedQueries: ["Open User Dashboard", "Open Marketing Dashboard", "Open Teacher Directory", "Open Contact Platform"],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 20. GENERAL INSTITUTIONAL KNOWLEDGE (Placements, Fees, Hostels)
  // -------------------------------------------------------------
  const counselorResp = askVirtualCounselor(query);
  return {
    id: Date.now().toString(),
    sender: "NORA",
    text: counselorResp.answer,
    specificData: {
      type: "TEXT_ONLY",
    },
    suggestedQueries: counselorResp.suggestedFollowUpQuestions,
    timestamp,
  };
}
