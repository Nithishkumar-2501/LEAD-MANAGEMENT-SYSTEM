/**
 * NORA AI Database Analytics & Conversational Query Agent
 * Provides precise data extraction, multi-field database search, and intelligent responses
 * for Students, Mobile Numbers, Districts, Sources/Channels, Cutoffs, Statuses, and all CRM Dashboards.
 */

import { Lead, Application, CampusLocation, ActiveTab } from "@/types/crm";
import { predictStudentConversion } from "./leadScoringEngine";
import { askVirtualCounselor } from "./counselorKnowledge";

export interface NoraChatMessage {
  id: string;
  sender: "USER" | "NORA";
  text: string;
  specificData?: {
    type: "SINGLE_STUDENT" | "STUDENT_LIST" | "METRICS" | "DASHBOARD_NAV" | "TEXT_ONLY";
    student?: Lead & { application: Application; aiScore?: number; priorityTier?: string; computedCutoff?: number };
    studentsList?: (Lead & { application: Application; aiScore?: number; priorityTier?: string; computedCutoff?: number })[];
    stats?: Record<string, any>;
    targetTab?: ActiveTab;
    targetTabTitle?: string;
  };
  suggestedQueries?: string[];
  timestamp: string;
}

export function processNoraChatQuery(
  query: string,
  applicants: (Lead & { application: Application })[],
  currentCampus: CampusLocation = "ALL",
  currentUserRole: "ADMIN" | "COUNSELOR" | "TEACHER" = "ADMIN"
): NoraChatMessage {
  const q = (query || "").trim().toLowerCase();
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Scope to campus if selected
  const scopeApplicants = applicants.filter((a) => {
    if (currentCampus !== "ALL" && a.campus !== currentCampus) return false;
    return true;
  });

  // Enrich applicants with real-time ML prediction scores
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
      computedCutoff: pred.tneaCutoff || (a.application ? a.application.marks12th * 2 : 160),
    };
  });

  // -------------------------------------------------------------
  // 1. MOBILE NUMBER / PHONE SEARCH (any query containing 6+ digits)
  // -------------------------------------------------------------
  const phoneDigits = q.replace(/\D/g, "");
  if (phoneDigits.length >= 6) {
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
        text: `Found candidate record matching phone number \`${phoneDigits}\`:\n\n` +
          `• **Name**: **${s.name}**\n` +
          `• 📞 **Mobile**: \`${s.phone}\`\n` +
          `• 🎯 **TNEA Cutoff**: **${s.computedCutoff}/200**\n` +
          `• 📍 **District**: **${s.district || "Karur"}**\n` +
          `• 🎓 **Course**: **${s.courseInterest}**\n` +
          `• 📊 **Status**: **${s.status}** (${s.subStage || "Untouched"})`,
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
  // 2. SPECIFIC STUDENT LOOKUP BY NAME (e.g. "Gunal", "Wilsonrani", "Manivel", "Revathy")
  // -------------------------------------------------------------
  const matchingStudent = enrichedApplicants.find((a) => {
    const nameLower = a.name.toLowerCase();
    const queryClean = q
      .replace(/^(who is|find|search for|search|get|show|details of|about|tell me about|info on|give me|check|call|view)\s+/i, "")
      .replace(/\b(lead|student|candidate|details|record|data|profile|info|phone|cutoff|marks?|number|contact|mobile)\b/gi, "")
      .trim();

    if (queryClean.length >= 3 && (nameLower.includes(queryClean) || queryClean.includes(nameLower))) return true;
    if (q.includes(nameLower)) return true;
    const nameParts = nameLower.split(/\s+/);
    if (nameParts.some((part) => part.length >= 3 && q.includes(part))) return true;

    // Email match
    if (a.email && q.includes(a.email.toLowerCase())) return true;
    return false;
  });

  if (matchingStudent) {
    const s = matchingStudent;
    const cutoff = s.computedCutoff || s.tneaCutoff || 160;

    const specificFields: string[] = [];
    if (q.includes("phone") || q.includes("mobile") || q.includes("number") || q.includes("contact")) {
      specificFields.push(`📞 **Mobile Number**: \`${s.phone}\``);
    }
    if (q.includes("cutoff") || q.includes("mark")) {
      specificFields.push(`🎯 **TNEA Cutoff**: **${cutoff}/200**`);
    }
    if (q.includes("course") || q.includes("branch") || q.includes("dept") || q.includes("department") || q.includes("intrest")) {
      specificFields.push(`🎓 **Interested Course**: **${s.courseInterest}**`);
    }
    if (q.includes("district") || q.includes("city") || q.includes("location") || q.includes("native")) {
      specificFields.push(`📍 **District**: **${s.district || "Karur"}**`);
    }
    if (q.includes("source") || q.includes("channel") || q.includes("from where")) {
      specificFields.push(`🌐 **Lead Source / Channel**: **${s.source}**`);
    }
    if (q.includes("status") || q.includes("stage") || q.includes("admit")) {
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
        `What is ${s.name}'s phone number?`,
        `What is the cutoff for ${s.name}?`,
        `Show leads from ${s.district || "Karur"}`,
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 3. CONTACT PLATFORM & LEAD SOURCES (Google Ads, Facebook, X, WhatsApp, Email, SMS, Campaign, Project Expo)
  // -------------------------------------------------------------
  const sourceKeywords = [
    { key: "ads", label: "Google & Social Ads", match: ["ads", "google ads", "social ads", "ad campaign", "newspaper ad"] },
    { key: "whatsapp", label: "WhatsApp", match: ["whatsapp", "wa", "whatsapp messenger", "whatsapp campaign"] },
    { key: "facebook", label: "Facebook", match: ["facebook", "fasebook", "fb", "meta", "messenger"] },
    { key: "x", label: "X (Twitter)", match: ["x", "twitter", "tweet", "broadcasts"] },
    { key: "email", label: "E-mail", match: ["email", "e-mail", "mail", "portal", "automated email"] },
    { key: "sms", label: "SMS", match: ["sms", "sms gateway", "text message", "alerts"] },
    { key: "campaign", label: "Campaign", match: ["campaign", "omnichannel", "marketing campaign"] },
    { key: "expo", label: "Project Expo", match: ["project expo", "expo", "college expo", "event leads", "fair"] },
    { key: "tnea", label: "TNEA Counselling", match: ["tnea", "counselling", "general counselling", "quota"] },
  ];

  for (const src of sourceKeywords) {
    const isMatched = src.match.some((m) => {
      // Word boundary check or query contains
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
  // 4. SPECIFIC DISTRICT SEARCH (Tamil Nadu Districts)
  // -------------------------------------------------------------
  const districts = [
    "salem", "karur", "coimbatore", "covai", "tirupur", "tiruppur", "erode", "namakkal", "dindigul",
    "trichy", "tiruchirappalli", "madurai", "chennai", "theni", "thanjavur", "pudukkottai",
    "ariyalur", "chengalpattu", "cuddalore", "dharmapuri", "kallakurichi", "kancheepuram",
    "kanniyakumari", "krishnagiri", "mayiladuthurai", "nagapattinam", "nilgiris", "perambalur",
    "ramanathapuram", "ranipet", "sivaganga", "tenkasi", "thoothukudi", "tirunelveli",
    "tirupathur", "tiruvallur", "tiruvannamalai", "tiruvarur", "vellore", "viluppuram", "virudhunagar"
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
        ? `Found **${matched.length} candidate(s)** from **${districtName}** in the live database:`
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

  // -------------------------------------------------------------
  // 5. CUTOFF / MARKS SEARCH & COMPARISON
  // -------------------------------------------------------------
  // Top / Highest Cutoff
  if (q.includes("highest cutoff") || q.includes("top cutoff") || q.includes("best cutoff") || q.includes("topper")) {
    const sorted = [...enrichedApplicants].sort((a, b) => (b.computedCutoff || 0) - (a.computedCutoff || 0));
    const topLeads = sorted.slice(0, 8);
    const maxScore = sorted[0]?.computedCutoff || 195;

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

  // Average Cutoff
  if (q.includes("average cutoff") || q.includes("mean cutoff") || q.includes("avg cutoff")) {
    const totalScore = enrichedApplicants.reduce((sum, a) => sum + (a.computedCutoff || 160), 0);
    const avg = enrichedApplicants.length > 0 ? (totalScore / enrichedApplicants.length).toFixed(1) : "172.0";

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📊 The **average TNEA Cutoff** across all ${enrichedApplicants.length} registered candidates is **${avg} / 200**.\n\n` +
        `• Candidates above average (≥${avg}): **${enrichedApplicants.filter(a => (a.computedCutoff || 0) >= parseFloat(avg)).length}**\n` +
        `• Candidates below average (<${avg}): **${enrichedApplicants.filter(a => (a.computedCutoff || 0) < parseFloat(avg)).length}**`,
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

  // Numeric Cutoff Filter (e.g. "cutoff > 175", "cutoff above 180", "180+")
  const cutoffMatch = q.match(/(?:cutoff|marks?)\s*(?:>|above|greater than|>=)\s*(\d{2,3})/i) ||
    q.match(/(\d{2,3})\s*(?:\+|cutoff)/i);

  if (cutoffMatch) {
    const targetCutoff = parseFloat(cutoffMatch[1]);
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
        "Leads from Salem",
        "Highest cutoff",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 6. ADMITTED / FEE PAID / STATUS QUERIES
  // -------------------------------------------------------------
  if (q.includes("admitted") || q.includes("how many admitted") || q.includes("who is admitted") || q.includes("admission confirmed")) {
    const matched = enrichedApplicants.filter(
      (a) =>
        a.status === "ADMITTED" ||
        (a.application && (a.application.stage === "FEE_PAID" || a.application.paymentStatus === "PAID" || a.application.paymentStatus === "COMPLETED"))
    );

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🎓 Found **${matched.length} officially admitted student(s)** in the database:`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        "How many fee paid?",
        "Total leads count",
        "Show hot leads",
      ],
      timestamp,
    };
  }

  if (q.includes("fee paid") || q.includes("payment received") || q.includes("paid leads")) {
    const matched = enrichedApplicants.filter(
      (a) =>
        a.application && (a.application.paymentStatus === "PAID" || a.application.paymentStatus === "COMPLETED" || a.application.stage === "FEE_PAID")
    );

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `💳 Found **${matched.length} student(s)** with verified fee payment receipts:`,
      specificData: {
        type: "STUDENT_LIST",
        studentsList: matched,
      },
      suggestedQueries: [
        "How many admitted?",
        "Show untouched inquiries",
        "Cutoff > 175",
      ],
      timestamp,
    };
  }

  // Untouched / New Inquiries
  if (q.includes("untouched") || q.includes("not contacted") || q.includes("pending call") || q.includes("new leads")) {
    const matched = enrichedApplicants.filter(
      (a) =>
        a.status === "NEW" ||
        (a.subStage && a.subStage.toLowerCase().includes("untouched")) ||
        (a.application && a.application.stage === "INQUIRY")
    );

    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `⚡ Found **${matched.length} untouched inquiries** awaiting counselor engagement:`,
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

  // Priority Tiers (Hot, Warm, Cold)
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

  // -------------------------------------------------------------
  // 7. COURSE INTEREST QUERIES (CSE, AIDS, ECE, EEE, Mech, Bio, IT, Civil)
  // -------------------------------------------------------------
  const courses = [
    { key: "cse", name: "Computer Science and Engineering" },
    { key: "ai", name: "Artificial Intelligence and Data Science" },
    { key: "it", name: "Information Technology" },
    { key: "ece", name: "Electronics and Communication Engineering" },
    { key: "eee", name: "Electrical and Electronics Engineering" },
    { key: "mech", name: "Mechanical Engineering" },
    { key: "bio", name: "BioMedical / Bio Technology" },
    { key: "civil", name: "Civil Engineering" },
  ];
  const matchedCourse = courses.find((c) => q.includes(c.key));

  if (matchedCourse && (q.includes("lead") || q.includes("student") || q.includes("applied") || q.includes("show") || q.includes("intrest") || q.includes("how many"))) {
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

  // -------------------------------------------------------------
  // 8. CRM DASHBOARDS & CONTENT EXPLANATION (From Images 1, 2, 3)
  // -------------------------------------------------------------
  // Admin Dashboard
  if (q.includes("admin dashboard") || (q.includes("executive") && q.includes("overview"))) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🛡️ **Admin Dashboard (Executive Overview & TNEA)**:\n\n` +
        `• **Purpose**: Provides leadership with high-level visibility across all admissions, counseling quotas, and revenue.\n` +
        `• **Key Capabilities**:\n` +
        `  1. Real-time TNEA Counselling vs Management Quota seat metrics.\n` +
        `  2. Total revenue tracking and tuition fee payment verification.\n` +
        `  3. Counselor outreach efficiency and conversion funnels.\n` +
        `  4. Karur Main Campus vs Coimbatore Tech Campus quota comparisons.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "ADMIN_DASHBOARD",
        targetTabTitle: "Open Admin Dashboard",
      },
      suggestedQueries: ["How many total leads?", "How many admitted?", "What is Echo Dashboard?"],
      timestamp,
    };
  }

  // User Dashboard (Counselor Lead Tasks)
  if (q.includes("user dashboard") || q.includes("counselor lead tasks") || q.includes("counselor task")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `👤 **User Dashboard (Counselor Lead Tasks)**:\n\n` +
        `• **Purpose**: Daily operational workspace for admission counselors.\n` +
        `• **Key Capabilities**:\n` +
        `  1. Prioritized task queue (Calls, Emails, WhatsApp follow-ups).\n` +
        `  2. 1-click student dialer and automated WhatsApp pitch templates.\n` +
        `  3. Sub-stage updating (Call Back Later, Interested, Documents Pending).\n` +
        `  4. Daily conversion velocity tracking.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "USER_DASHBOARD",
        targetTabTitle: "Open User Dashboard",
      },
      suggestedQueries: ["Who are the hot leads?", "Show untouched inquiries", "What is Marketing Dashboard?"],
      timestamp,
    };
  }

  // Marketing Dashboard (Ad Campaigns & CPL ROI)
  if (q.includes("marketing dashboard") || q.includes("ad campaign") || q.includes("cpl roi") || q.includes("cpl")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📢 **Marketing Dashboard (Ad Campaigns & CPL ROI)**:\n\n` +
        `• **Purpose**: Omnichannel marketing intelligence and campaign attribution.\n` +
        `• **Key Capabilities**:\n` +
        `  1. Real-time Cost-Per-Lead (CPL) and Return on Ad Spend (ROAS).\n` +
        `  2. Channel attribution across Google Ads, Meta/Facebook, X, and Project Expos.\n` +
        `  3. Campaign reach, impression analytics, and high school lead capture.\n` +
        `  4. Admission conversion rates per marketing source.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "MARKETING_DASHBOARD",
        targetTabTitle: "Open Marketing Dashboard",
      },
      suggestedQueries: ["How many from ads?", "How many from Facebook?", "How many from Project Expo?"],
      timestamp,
    };
  }

  // Echo Dashboard (WhatsApp & Voice Transcripts)
  if (q.includes("echo dashboard") || q.includes("voice transcript") || q.includes("echo")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `💬 **Echo Dashboard (WhatsApp & Voice Transcripts)**:\n\n` +
        `• **Purpose**: Speech-to-text intelligence and communication quality assurance.\n` +
        `• **Key Capabilities**:\n` +
        `  1. Automatic transcription of counselor-student phone conversations.\n` +
        `  2. Student sentiment classification (INTERESTED, ADMITTED, REVIEWING, NOT_INTERESTED).\n` +
        `  3. In-browser audio playback and counselor note summaries.\n` +
        `  4. Compliance-ready **30-day automatic deletion policy** for student privacy.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "ECHO_DASHBOARD",
        targetTabTitle: "Open Echo Dashboard",
      },
      suggestedQueries: ["How many from WhatsApp?", "Who are the hot leads?", "What is NORA AI Suite?"],
      timestamp,
    };
  }

  // NORA AI Suite (ML Predictor & Counselor)
  if (q.includes("nora ai suite") || q.includes("ml predictor") || q.includes("model weights")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `✨ **NORA AI Suite (ML Predictor & Counselor)**:\n\n` +
        `• **Purpose**: Native Machine Learning student conversion engine.\n` +
        `• **Key Capabilities**:\n` +
        `  1. Dynamic conversion probability scoring based on TNEA Cutoff (weight: 0.35), District proximity (0.20), Source channel (0.15), and Community quota (0.15).\n` +
        `  2. Auto-categorization into **HOT (≥72%)**, **WARM (45–71%)**, and **COLD (<45%)** priority tiers.\n` +
        `  3. Virtual admission counselor knowledge base answering inquiries 24/7.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "AI_INTELLIGENCE",
        targetTabTitle: "Open NORA AI Suite",
      },
      suggestedQueries: ["Who are the hot leads?", "Cutoff > 175", "What is Lead Manager?"],
      timestamp,
    };
  }

  // Lead Manager
  if (q.includes("lead manager") || (q.includes("manage") && q.includes("student leads"))) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `👥 **Lead Manager (Manage Student Leads)**:\n\n` +
        `• **Purpose**: Centralized CRM database containing all student inquiries and applications.\n` +
        `• **Key Capabilities**:\n` +
        `  1. Full lifecycle pipeline: Inquiry ➔ Submitted ➔ Docs Verified ➔ Offer Issued ➔ Fee Paid/Admitted.\n` +
        `  2. Multi-parameter filtering by Campus, Stage, District, and AI Priority.\n` +
        `  3. Detailed student dossiers with academic history, parental contact, and counselling marks.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "CONTACTS",
        targetTabTitle: "Open Lead Manager",
      },
      suggestedQueries: ["Show hot leads", "Leads from Salem", "Untouched Inquiries"],
      timestamp,
    };
  }

  // Teacher Directory (Faculty Profiles)
  if (q.includes("teacher directory") || q.includes("faculty profile") || q.includes("faculty") || q.includes("teachers")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `📖 **Teacher Directory (Faculty Profiles)**:\n\n` +
        `• **Purpose**: Faculty mentor assignment and outreach management.\n` +
        `• **Key Capabilities**:\n` +
        `  1. Profiles for department professors, HoDs, and admission coordinators.\n` +
        `  2. Automatic quota assignment (100 candidate contacts per teacher).\n` +
        `  3. Live tracking of teacher contact milestones and student conversion success.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "TEACHERS",
        targetTabTitle: "Open Teacher Directory",
      },
      suggestedQueries: ["What is Campus & Courses?", "What is Fee Payment?", "Total leads count"],
      timestamp,
    };
  }

  // Campus & Courses
  if (q.includes("campus & courses") || q.includes("campuses") || q.includes("campus programs") || q.includes("programs offered")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🏛️ **Campus & Courses (Campus & Programs)**:\n\n` +
        `• **VSB Karur Main Campus**: NH-67 Covai Road, Karur. 13+ NBA-accredited B.E./B.Tech engineering programs.\n` +
        `• **VSB Coimbatore Tech Campus**: Pollachi Main Road, Eachanari, Coimbatore. Autonomous research campus.\n` +
        `• **Programs Offered**: AI & Data Science, CSE, Cyber Security, IT, ECE, EEE, Mechanical, BioMedical, Biotechnology, and Civil.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "CAMPUSES",
        targetTabTitle: "Open Campus & Courses",
      },
      suggestedQueries: ["Interested in CSE", "Interested in AI", "What is Fee Payment?"],
      timestamp,
    };
  }

  // Fee Payment
  if (q.includes("fee payment") || q.includes("payment verification") || q.includes("tuition fee")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `💳 **Fee Payment (Payment Verification)**:\n\n` +
        `• **Purpose**: Finance approval and official admission confirmation.\n` +
        `• **Key Capabilities**:\n` +
        `  1. Real-time verification of bank transaction IDs (\`VSB_TXN_...\`).\n` +
        `  2. Automated issuance of provisional admission certificates.\n` +
        `  3. Fee reconciliation between Karur and Coimbatore accounts.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "PAYMENTS",
        targetTabTitle: "Open Fee Payment",
      },
      suggestedQueries: ["How many fee paid?", "How many admitted?", "Total leads count"],
      timestamp,
    };
  }

  // Contact Platform Overview
  if (q.includes("contact platform") || q.includes("social media channels") || q.includes("communication channels")) {
    return {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🌐 **Contact Platform (Omnichannel Communication Channels)**:\n\n` +
        `Integrates 8 marketing and outreach platforms directly into the CRM:\n` +
        `1. **Google & Social Ads**: Targeted Pay-Per-Click campaigns.\n` +
        `2. **Facebook**: Meta Page & Messenger student leads.\n` +
        `3. **X (Twitter)**: Public tweets, broadcasts, and inquiries.\n` +
        `4. **WhatsApp**: Direct 1-on-1 counseling and bulk messaging.\n` +
        `5. **E-mail**: Automated drip campaigns & offer letter dispatches.\n` +
        `6. **SMS**: Instant admission alerts & counselling reminders.\n` +
        `7. **Campaign**: Omnichannel strategic marketing drives.\n` +
        `8. **Project Expo**: School science exhibition and college expo leads.`,
      specificData: {
        type: "DASHBOARD_NAV",
        targetTab: "CONTACT_PLATFORM",
        targetTabTitle: "Open Contact Platform",
      },
      suggestedQueries: ["How many from WhatsApp?", "How many from ads?", "How many from Project Expo?"],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 9. TOTAL COUNT / EXECUTIVE METRICS SUMMARY
  // -------------------------------------------------------------
  if (q.includes("how many") || q.includes("total leads") || q.includes("count") || q.includes("overview") || q.includes("summary")) {
    const total = enrichedApplicants.length;
    const hot = enrichedApplicants.filter((a) => a.priorityTier === "HOT").length;
    const warm = enrichedApplicants.filter((a) => a.priorityTier === "WARM").length;
    const cold = enrichedApplicants.filter((a) => a.priorityTier === "COLD").length;
    const paid = enrichedApplicants.filter(
      (a) => a.status === "ADMITTED" || a.application?.paymentStatus === "PAID" || a.application?.paymentStatus === "COMPLETED"
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
        `Ask me for any candidate (e.g. *"What is Gunal's mobile number?"*), source (e.g. *"How many from WhatsApp?"*), or district!`,
      specificData: {
        type: "METRICS",
        stats: { total, hot, warm, cold, paid },
      },
      suggestedQueries: [
        "Show hot leads",
        "How many from WhatsApp?",
        "How many from Facebook?",
        "Leads from Salem",
      ],
      timestamp,
    };
  }

  // -------------------------------------------------------------
  // 10. ROLE-SPECIFIC GUIDANCE (Admin vs Counselor)
  // -------------------------------------------------------------
  if (q.includes("admin") || q.includes("counselor") || q.includes("what can i do") || q.includes("my role") || q.includes("permissions")) {
    if (currentUserRole === "ADMIN" || q.includes("admin")) {
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `🛡️ **Admin Intelligence & Management Privileges**:\n\n` +
          `As an **Administrator**, you have full control over the CRM:\n` +
          `• Access **Executive Overview & TNEA** metrics across Karur & Coimbatore campuses.\n` +
          `• Monitor counselor call volumes, task completion, and conversion velocities.\n` +
          `• Allocate student quotas to faculty in the **Teacher Directory**.\n` +
          `• Verify fee transactions and grant final admission approval in **Fee Payment**.\n` +
          `• Launch and monitor omnichannel campaigns in **Marketing Dashboard**.\n\n` +
          `You can query any database parameter directly with me!`,
        specificData: {
          type: "DASHBOARD_NAV",
          targetTab: "ADMIN_DASHBOARD",
          targetTabTitle: "Go to Admin Dashboard",
        },
        suggestedQueries: ["How many admitted?", "How many from ads?", "Show hot leads"],
        timestamp,
      };
    } else {
      return {
        id: Date.now().toString(),
        sender: "NORA",
        text: `👤 **Counselor Operational Guide**:\n\n` +
          `As a **Counselor / User**, your primary mission is active student engagement:\n` +
          `• Prioritize outreach to **HOT leads** (probability ≥72%) within 24 hours.\n` +
          `• Use the **User Dashboard** to work through your daily calls, WhatsApp pitches, and verification tasks.\n` +
          `• Update lead sub-stages accurately after each call so AI conversion weights adapt dynamically.\n` +
          `• Listen back to transcripts in **Echo Dashboard** to refine your counseling discussions.`,
        specificData: {
          type: "DASHBOARD_NAV",
          targetTab: "USER_DASHBOARD",
          targetTabTitle: "Go to User Dashboard",
        },
        suggestedQueries: ["Who are the hot leads?", "Show untouched inquiries", "Cutoff > 175"],
        timestamp,
      };
    }
  }

  // -------------------------------------------------------------
  // 11. GENERAL INSTITUTIONAL KNOWLEDGE (Placements, Fees, Hostels)
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
