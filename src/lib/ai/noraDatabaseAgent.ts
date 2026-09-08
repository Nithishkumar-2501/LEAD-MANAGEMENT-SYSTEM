/**
 * NORA AI Database Analytics & Conversational Query Agent
 * Provides precise data extraction and conversational answers directly from the student database.
 */

import { Lead, Application, CampusLocation } from "@/types/crm";
import { predictStudentConversion } from "./leadScoringEngine";
import { askVirtualCounselor } from "./counselorKnowledge";

export interface NoraChatMessage {
  id: string;
  sender: "USER" | "NORA";
  text: string;
  specificData?: {
    type: "SINGLE_STUDENT" | "STUDENT_LIST" | "METRICS" | "TEXT_ONLY";
    student?: Lead & { application: Application; aiScore?: number; priorityTier?: string; computedCutoff?: number };
    studentsList?: (Lead & { application: Application; aiScore?: number; priorityTier?: string; computedCutoff?: number })[];
    stats?: Record<string, any>;
  };
  suggestedQueries?: string[];
  timestamp: string;
}

export function processNoraChatQuery(
  query: string,
  applicants: (Lead & { application: Application })[],
  currentCampus: CampusLocation = "ALL"
): NoraChatMessage {
  const q = (query || "").trim().toLowerCase();
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Scope to campus if selected
  const scopeApplicants = applicants.filter((a) => {
    if (currentCampus !== "ALL" && a.campus !== currentCampus) return false;
    return true;
  });

  // Enrich with live calculation
  const enrichedApplicants = scopeApplicants.map((a) => {
    const pred = predictStudentConversion({
      tneaCutoff: a.tneaCutoff || (a.application ? a.application.marks12th * 2 : 160),
      community: a.community || "BC",
      district: a.district || "Karur",
      source: a.source || "TNEA Counselling",
      courseInterest: a.courseInterest,
    });
    return {
      ...a,
      aiScore: pred.conversionProbability,
      priorityTier: pred.priorityTier,
      computedCutoff: pred.tneaCutoff,
    };
  });

  // 1. SPECIFIC STUDENT LOOKUP BY NAME, PHONE, OR EMAIL
  const matchingStudent = enrichedApplicants.find((a) => {
    const nameLower = a.name.toLowerCase();
    const queryClean = q
      .replace(/^(who is|find|search for|search|get|show|details of|about|tell me about|info on|give me|check)\s+/i, "")
      .replace(/\b(lead|student|candidate|details|record|data|profile|info|phone|cutoff|marks?|number|contact)\b/gi, "")
      .trim();

    if (queryClean.length >= 2 && (nameLower.includes(queryClean) || queryClean.includes(nameLower))) return true;
    if (q.includes(nameLower)) return true;
    const nameParts = nameLower.split(/\s+/);
    if (nameParts.some((part) => part.length >= 3 && q.includes(part))) return true;

    // Phone match
    const cleanPhone = (a.phone || "").replace(/\D/g, "");
    const cleanQuery = q.replace(/\D/g, "");
    if (cleanQuery.length >= 6 && cleanPhone.includes(cleanQuery)) return true;

    // Email match
    if (a.email && q.includes(a.email.toLowerCase())) return true;
    return false;
  });

  if (matchingStudent) {
    const s = matchingStudent;
    const cutoff = s.computedCutoff || s.tneaCutoff || 160;

    const specificFields: string[] = [];
    if (q.includes("phone") || q.includes("mobile") || q.includes("number") || q.includes("contact")) {
      specificFields.push(`📞 **Phone**: \`${s.phone}\``);
    }
    if (q.includes("cutoff") || q.includes("mark")) {
      specificFields.push(`🎯 **TNEA Cutoff**: **${cutoff}/200**`);
    }
    if (q.includes("course") || q.includes("branch") || q.includes("dept") || q.includes("department")) {
      specificFields.push(`🎓 **Interested Course**: **${s.courseInterest}**`);
    }
    if (q.includes("district") || q.includes("city") || q.includes("location") || q.includes("native")) {
      specificFields.push(`📍 **District**: **${s.district || "Karur"}**`);
    }
    if (q.includes("status") || q.includes("stage")) {
      specificFields.push(`📊 **Status**: **${s.status}** (${s.subStage || "Untouched"})`);
    }

    const text = specificFields.length > 0
      ? `Here are the specific details you requested for **${s.name}**:\n\n${specificFields.join("\n")}`
      : `Here are the specific database records for **${s.name}**:`;

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text,
      specificData: {
        type: "SINGLE_STUDENT",
        student: s,
      },
      suggestedQueries: [
        `What is the cutoff for ${s.name}?`,
        `What is ${s.name}'s phone number?`,
        "Show hot leads",
      ],
      timestamp,
    };
  }

  // ALL LEADS QUERY
  if (q === "all" || q.includes("all leads") || q.includes("all students") || q.includes("list all") || q.includes("show all")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `Listing all **${enrichedApplicants.length} candidate records** currently in the database:`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: enrichedApplicants,
      },
      suggestedQueries: [
        "Show hot leads",
        "Cutoff > 175",
        "Untouched inquiries",
      ],
      timestamp,
    };
  }

  // 2. SPECIFIC DISTRICT QUERY (e.g. "Salem", "Coimbatore", "Karur", "Trichy")
  const districts = [
    "salem", "karur", "coimbatore", "covai", "tirupur", "erode", "namakkal", "dindigul",
    "trichy", "tiruchirappalli", "madurai", "chennai", "theni", "thanjavur", "pudukkottai"
  ];
  const matchedDistrict = districts.find((d) => q.includes(d));

  if (matchedDistrict) {
    const districtKey = matchedDistrict === "covai" ? "coimbatore" : matchedDistrict === "trichy" ? "tiruchirappalli" : matchedDistrict;
    const matched = enrichedApplicants.filter((a) =>
      (a.district || "").toLowerCase().includes(districtKey)
    );
    const districtName = districtKey.charAt(0).toUpperCase() + districtKey.slice(1);

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: matched.length > 0
        ? `Found **${matched.length} student(s)** from **${districtName}** in the database:`
        : `There are currently no candidates recorded from **${districtName}**.`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        `Show hot leads from ${districtName}`,
        "Show untouched inquiries",
        "Cutoff > 175",
      ],
      timestamp,
    };
  }

  // 3. CUTOFF FILTER QUERIES (e.g. "cutoff > 175", "cutoff above 180", "180+")
  const cutoffMatch = q.match(/(?:cutoff|marks?)\s*(?:>|above|greater than|>=)\s*(\d{2,3})/i) ||
    q.match(/(\d{2,3})\s*(?:\+|cutoff)/i);

  if (cutoffMatch || q.includes("high cutoff") || q.includes("top cutoff")) {
    const targetCutoff = cutoffMatch ? parseFloat(cutoffMatch[1]) : 170;
    const matched = enrichedApplicants.filter((a) => (a.computedCutoff || 0) >= targetCutoff);

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `Found **${matched.length} candidate(s)** with TNEA Cutoff **≥ ${targetCutoff}/200**:`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        "Show hot leads",
        "Candidates from Salem",
        "What are the scholarship rules?",
      ],
      timestamp,
    };
  }

  // 4. PRIORITY TIER QUERY (e.g. "hot leads", "warm leads", "cold leads")
  if (q.includes("hot") || q.includes("warm") || q.includes("cold")) {
    const targetTier = q.includes("hot") ? "HOT" : q.includes("warm") ? "WARM" : "COLD";
    const matched = enrichedApplicants.filter((a) => a.priorityTier === targetTier);

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `Here are the **${matched.length} ${targetTier} leads** (Conversion Probability ${
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
      ],
      timestamp,
    };
  }

  // 5. UNTOUCHED LEADS (e.g. "untouched", "not contacted")
  if (q.includes("untouched") || q.includes("not contacted") || q.includes("pending call")) {
    const matched = enrichedApplicants.filter(
      (a) =>
        a.status === "NEW" ||
        (a.subStage && a.subStage.toLowerCase().includes("untouched")) ||
        (a.application && a.application.stage === "INQUIRY")
    );

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `Found **${matched.length} untouched inquiries** awaiting counselor engagement:`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        "Who are the hot leads?",
        "Show leads from Salem",
        "Cutoff > 170",
      ],
      timestamp,
    };
  }

  // 6. FEE PAYMENT / ADMISSION STATUS (e.g. "fee paid", "paid", "admitted")
  if (q.includes("fee") && (q.includes("paid") || q.includes("payment") || q.includes("received") || q.includes("admitted"))) {
    const matched = enrichedApplicants.filter(
      (a) =>
        a.status === "ADMITTED" ||
        (a.application && (a.application.paymentStatus === "PAID" || a.application.stage === "FEE_PAID"))
    );

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `Found **${matched.length} student(s)** with confirmed fee payment / admitted status:`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        "Total leads count",
        "Show untouched inquiries",
        "Cutoff > 180",
      ],
      timestamp,
    };
  }

  // 7. SPECIFIC COURSE INQUIRY (e.g. "cse", "computer science", "ai", "it", "mech", "ece")
  const courses = [
    { key: "cse", name: "Computer Science and Engineering" },
    { key: "ai", name: "Artificial Intelligence and Data Science" },
    { key: "it", name: "Information Technology" },
    { key: "ece", name: "Electronics and Communication" },
    { key: "eee", name: "Electrical and Electronics" },
    { key: "mech", name: "Mechanical Engineering" },
    { key: "bio", name: "BioMedical Engineering" },
    { key: "civil", name: "Civil Engineering" },
  ];
  const matchedCourse = courses.find((c) => q.includes(c.key));

  if (matchedCourse && (q.includes("lead") || q.includes("student") || q.includes("applied") || q.includes("show"))) {
    const matched = enrichedApplicants.filter((a) =>
      a.courseInterest.toLowerCase().includes(matchedCourse.key)
    );

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `Found **${matched.length} candidate(s)** interested in **${matchedCourse.name}**:`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        `Show hot leads for ${matchedCourse.key.toUpperCase()}`,
        "What is the cutoff for CSE?",
        "Show leads from Salem",
      ],
      timestamp,
    };
  }

  // 8. TOTAL COUNT / METRICS
  if (q.includes("how many") || q.includes("total leads") || q.includes("count") || q.includes("overview")) {
    const total = enrichedApplicants.length;
    const hot = enrichedApplicants.filter((a) => a.priorityTier === "HOT").length;
    const warm = enrichedApplicants.filter((a) => a.priorityTier === "WARM").length;
    const cold = enrichedApplicants.filter((a) => a.priorityTier === "COLD").length;
    const paid = enrichedApplicants.filter(
      (a) => a.status === "ADMITTED" || a.application?.paymentStatus === "PAID"
    ).length;

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📊 **Live Database Metrics Summary**:\n\n` +
        `• **Total Candidates**: **${total}**\n` +
        `• 🔥 **Hot Leads (≥72%)**: **${hot}**\n` +
        `• ⚡ **Warm Leads (45-71%)**: **${warm}**\n` +
        `• ❄️ **Cold Leads (<45%)**: **${cold}**\n` +
        `• 💳 **Confirmed Paid / Admitted**: **${paid}**\n\n` +
        `Ask me for any specific student or filter (e.g. *"Show leads from Salem"*, *"Find Wilsonrani"*).`,
      specificData: {
        type: "METRICS",
        stats: { total, hot, warm, cold, paid },
      },
      suggestedQueries: [
        "Show Hot leads",
        "Show leads from Salem",
        "Find Wilsonrani",
      ],
      timestamp,
    };
  }

  // 9. GENERAL INSTITUTIONAL KNOWLEDGE (e.g. fees, hostel, placements)
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
