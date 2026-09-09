/**
 * SPHEREX AI Virtual Counselor Knowledge Base & Natural Language Query Resolver
 * Represents V.S.B. Engineering College (Karur VSB-612 & Coimbatore VSB-714)
 */

export interface CounselorResponse {
  answer: string;
  source: string;
  suggestedFollowUpQuestions: string[];
  recommendedAction?: string;
}

export const VSB_INSTITUTION_KNOWLEDGE = {
  campuses: {
    karur: {
      name: "V.S.B. Engineering College (Karur)",
      tneaCode: "VSB-612",
      location: "NH-67 Covai Road, Karudayampalayam, Karur, Tamil Nadu 639111",
      accreditation: "Autonomous Institution, NAAC 'A' Grade, NBA Accredited (CSE, ECE, EEE, MECH, IT)",
      placementHighlights: "98.4% Placement Record in 2025, Highest Package: ₹18.5 LPA, Average Package: ₹4.8 LPA, Top Recruiters: TCS, Wipro, Cognizant, Zoho, Kaar Tech, Virtusa, Infosys.",
      hostelFee: "₹65,000 - ₹75,000 / year (Inclusive of South Indian vegetarian/non-vegetarian mess, Wi-Fi, 24/7 security, Gym)",
      tuitionFeeGovt: "₹50,000 - ₹55,000 / year (Anna University / TNEA Govt Quota Norms)",
      tuitionFeeMgmt: "₹85,000 - ₹1,10,000 / year (Subject to program & 12th marks scholarship)",
      departments: [
        { name: "B.E Computer Science and Engineering", intake: 180, cutoffAvg: 174.5 },
        { name: "B.Tech Artificial Intelligence and Data Science", intake: 120, cutoffAvg: 171.0 },
        { name: "B.Tech Information Technology", intake: 120, cutoffAvg: 167.5 },
        { name: "B.Tech Artificial Intelligence and Machine Learning", intake: 60, cutoffAvg: 168.0 },
        { name: "B.Tech Computer Science and Business System", intake: 60, cutoffAvg: 164.0 },
        { name: "B.E Electronics and Communication Engineering", intake: 180, cutoffAvg: 160.5 },
        { name: "B.E Electrical and Electronics Engineering", intake: 120, cutoffAvg: 151.0 },
        { name: "B.E Mechanical Engineering", intake: 60, cutoffAvg: 144.0 },
        { name: "B.E BioMedical Engineering", intake: 60, cutoffAvg: 154.0 },
        { name: "B.E Civil Engineering", intake: 30, cutoffAvg: 140.0 },
      ],
    },
    coimbatore: {
      name: "V.S.B. College of Engineering Technical Campus (Coimbatore)",
      tneaCode: "VSB-714",
      location: "Pollachi Main Road, Ealur Pirivu, Solavampalayam, Coimbatore, Tamil Nadu 642109",
      accreditation: "AICTE Approved, Affiliated to Anna University, Modern Labs & Innovation Centers",
      placementHighlights: "Joint Placement Cell with Karur Campus; 450+ core and IT company campus drives.",
      hostelFee: "₹65,000 - ₹72,000 / year",
      tuitionFeeGovt: "₹50,000 - ₹55,000 / year",
      departments: [
        { name: "B.E Computer Science and Engineering", intake: 120, cutoffAvg: 169.0 },
        { name: "B.Tech Artificial Intelligence and Data Science", intake: 60, cutoffAvg: 166.0 },
        { name: "B.Tech Information Technology", intake: 60, cutoffAvg: 163.5 },
        { name: "B.E Electronics and Communication Engineering", intake: 120, cutoffAvg: 156.0 },
        { name: "B.E Mechanical Engineering", intake: 60, cutoffAvg: 138.0 },
      ],
    },
  },
  scholarships: [
    "190+ TNEA Cutoff: 100% Free Tuition Fee Waiver",
    "180 - 189 TNEA Cutoff: 50% Tuition Fee Concession",
    "First Graduate Scholarship: ₹25,000 / year as per TN Govt orders",
    "Post-Matric Scholarship for SC/ST students: 100% tuition + hostel fee assistance",
    "Sports Quota: Up to 100% concession for state/national level athletes",
  ],
};

export function askVirtualCounselor(
  query: string,
  studentContext?: {
    name?: string;
    cutoff?: number;
    course?: string;
    community?: string;
    district?: string;
    campus?: string;
  }
): CounselorResponse {
  const q = query.toLowerCase();

  // 1. Cutoff query
  if (q.includes("cutoff") || q.includes("cut off") || q.includes("marks required") || q.includes("eligible")) {
    const studentCutoff = studentContext?.cutoff || 165;
    const course = studentContext?.course || "CSE / AI & DS";
    const community = studentContext?.community || "BC";

    let answer = `At V.S.B. Engineering College (Karur Code: VSB-612 / Coimbatore Code: VSB-714):\n\n`;
    answer += `• B.E Computer Science (CSE): Typical TNEA cutoff is ~174 (OC) and ~167 (BC/MBC).\n`;
    answer += `• B.Tech AI & DS: Typical cutoff is ~170 (OC) and ~164 (BC/MBC).\n`;
    answer += `• B.Tech IT: Cutoff is ~167 (OC) and ~162 (BC/MBC).\n`;
    answer += `• Core Engineering (ECE, EEE, Mech): Cutoffs range from 140 to 160.\n\n`;

    if (studentContext?.cutoff) {
      if (studentCutoff >= 170) {
        answer += `🎉 **Great news for ${studentContext.name || "the candidate"}**: With a cutoff of **${studentCutoff}/200**, you have a strong probability of getting high-demand branches like ${course} in Round 1!`;
      } else if (studentCutoff >= 155) {
        answer += `⚡ With a cutoff of **${studentCutoff}/200** (${community} community), you are well-positioned for AI & DS, IT, and ECE at Karur/Coimbatore campus.`;
      } else {
        answer += `ℹ️ With a cutoff of **${studentCutoff}/200**, we recommend exploring ECE, EEE, or BioMedical, or speaking with our admissions dean for management quota options.`;
      }
    }

    return {
      answer,
      source: "VSB TNEA Historical Allotment Matrix (2024-2025)",
      suggestedFollowUpQuestions: [
        "What are the scholarship criteria for high cutoffs?",
        "What is the total fee structure for B.E CSE?",
        "How do I apply under the First Graduate scheme?",
      ],
      recommendedAction: "Schedule Marksheet Verification and Campus Counseling",
    };
  }

  // 2. Fee Structure & Hostel
  if (q.includes("fee") || q.includes("cost") || q.includes("hostel") || q.includes("payment") || q.includes("scholarship")) {
    const answer = `🏛️ **V.S.B. Engineering College Fee & Hostel Structure (2026-2027)**:\n\n` +
      `1. **Government Quota (TNEA)**: ₹50,000 - ₹55,000 / year (Fixed by TN Fee Committee).\n` +
      `2. **Management Quota**: ₹85,000 - ₹1,10,000 / year (Depending on branch and 12th marks).\n` +
      `3. **Hostel & Mess**: ₹65,000 - ₹75,000 / year (Spacious rooms, South Indian veg & non-veg mess, 24/7 Wi-Fi, Gym, medical facility).\n` +
      `4. **Scholarships Available**:\n` +
      `   • Cutoff > 190: 100% Free Tuition.\n` +
      `   • Cutoff 180 - 189: 50% Tuition Fee Concession.\n` +
      `   • First Graduate Scholarship: ₹25,000 reduction per year.\n` +
      `   • 100% Govt scholarship for SC/ST eligible students.`;

    return {
      answer,
      source: "VSB Office of Admissions & Accounts Division",
      suggestedFollowUpQuestions: [
        "Can I pay the fees in semester installments?",
        "What are the bus routes available for day scholars?",
        "How is the food menu in the college hostel?",
      ],
      recommendedAction: "Download Official Fee Structure PDF & Scholarship Application",
    };
  }

  // 3. Placements & Salary Packages
  if (q.includes("placement") || q.includes("package") || q.includes("salary") || q.includes("companies") || q.includes("recruit")) {
    const answer = `💼 **V.S.B. Engineering College Placement Milestones**:\n\n` +
      `• **Placement Percentage**: 98.4% of eligible students placed in 2024-2025.\n` +
      `• **Highest Package**: ₹18.50 LPA (Zoho & Kaar Technologies).\n` +
      `• **Average Package**: ₹4.80 LPA across all departments.\n` +
      `• **Top Recruiters**: TCS (Ninja & Digital), Cognizant, Wipro, Infosys, Zoho, Virtusa, Hexaware, Kaar Tech, Mindtree, TVS Motors, L&T.\n` +
      `• **Training**: Intensive training from 2nd year onwards in Full Stack Development, Data Structures, Aptitude, Soft Skills, and Mock Technical Interviews.`;

    return {
      answer,
      source: "VSB Central Training & Placement Cell (Karur & Covai)",
      suggestedFollowUpQuestions: [
        "Do mechanical and civil students get IT placement offers?",
        "What Japanese or foreign language training is offered?",
        "How many companies visit VSB each year?",
      ],
      recommendedAction: "View Placement Statistics Brochure",
    };
  }

  // 4. Campuses & TNEA Codes
  if (q.includes("campus") || q.includes("karur") || q.includes("coimbatore") || q.includes("code") || q.includes("tnea")) {
    const answer = `📍 **V.S.B. Engineering College operates two premier campuses**:\n\n` +
      `1. **Karur Campus (TNEA Counseling Code: VSB-612)**:\n` +
      `   • Autonomous Institution, NAAC 'A' Grade.\n` +
      `   • Location: Covai Road, Karudayampalayam, Karur.\n` +
      `   • Offers: CSE, AI&DS, IT, AIML, CSBS, ECE, EEE, Mech, BioMedical, Civil.\n\n` +
      `2. **Coimbatore Campus (TNEA Counseling Code: VSB-714)**:\n` +
      `   • Location: Pollachi Main Road, Solavampalayam, Coimbatore.\n` +
      `   • Offers: CSE, AI&DS, IT, ECE, Mech.\n\n` +
      `Both campuses share centralized placements, industry internships, and faculty research centers.`;

    return {
      answer,
      source: "Anna University Affiliation & TNEA 2026 Directory",
      suggestedFollowUpQuestions: [
        "What is the difference in cutoff between Karur and Coimbatore?",
        "Is hostel accommodation available in Coimbatore campus?",
        "Can a student transfer between campuses?",
      ],
      recommendedAction: "Select Campus for Admission Application",
    };
  }

  // Default response (ChatGPT Conversational AI Assistant)
  return {
    answer: `🤖 **ChatGPT AI Admissions Assistant for V.S.B. Engineering College**:\n\n` +
      `I can query our live Firebase database and answer any question about:\n` +
      `• 👤 **Student Profiles & Names**: Candidate dossiers, father/mother names, high schools, blood group, community.\n` +
      `• 📞 **Contact & Mobile Numbers**: Primary phone, alternate numbers, parents phone numbers.\n` +
      `• 📍 **Districts & Locations**: Salem, Karur, Coimbatore, Tirupur, Erode, Trichy, Chennai, etc.\n` +
      `• 🌐 **Omnichannel Marketing Channels**: WhatsApp, Facebook/Meta Ads, Google Ads, X (Twitter), E-mail, SMS, Project Expo.\n` +
      `• 🎯 **TNEA Cutoff & Marks**: Math/Physics/Chemistry cutoffs, 10th & 12th percentages, scholarships.\n` +
      `• 🖥️ **CRM Dashboards**: Admin Overview, Counselor Workspace, Marketing ROI, Echo Voice Transcripts, Fee Payments.\n\n` +
      `Feel free to ask me anything in plain natural language (e.g. *"Show Gunal's details"*, *"Who has cutoff > 175 in Salem?"*, *"How many from WhatsApp?"*)!`,
    source: "NORA AI ChatGPT Neural Engine",
    suggestedFollowUpQuestions: [
      "What is Gunal's mobile number?",
      "How many from WhatsApp?",
      "Cutoff > 175 in Salem",
      "Show hot leads",
    ],
    recommendedAction: "Query Firebase Student Database",
  };
}

/**
 * Generates an automated, highly personalized outreach pitch for counselors
 */
export function generateOutreachPitch(
  channel: "WHATSAPP" | "EMAIL" | "CALL",
  student: {
    name: string;
    cutoff?: number;
    course?: string;
    campus?: string;
    phone?: string;
    community?: string;
  }
): string {
  const name = student.name || "Student";
  const course = student.course || "B.E/B.Tech Engineering";
  const campus = student.campus === "COIMBATORE" ? "Coimbatore (VSB-714)" : "Karur (VSB-612)";
  const cutoffStr = student.cutoff ? `your cutoff of ${student.cutoff}/200` : "your 12th marks";

  if (channel === "WHATSAPP") {
    return (
      `🎓 *Greetings from V.S.B. Engineering College, ${campus}!*\n\n` +
      `Dear *${name}*,\n\n` +
      `Based on ${cutoffStr}, you are eligible for prime admission allotment in *${course}* for the 2026 academic session.\n\n` +
      `🌟 *Why Choose V.S.B.?*\n` +
      `• 98.4% Placements (Highest: ₹18.5 LPA | Top recruiters: Zoho, TCS, Cognizant)\n` +
      `• Autonomous NAAC 'A' Grade Institution\n` +
      `• Up to 100% Merit Scholarships for top cutoffs\n\n` +
      `Would you like to reserve a provisional seat or visit our campus this week? Reply *YES* to schedule a guided tour with our HoD.\n\n` +
      `Admissions Helpline: +91 98424 55566 | www.vsbec.in`
    );
  }

  if (channel === "EMAIL") {
    return (
      `Subject: V.S.B. Engineering College - Admission Eligibility & Seat Confirmation for ${name}\n\n` +
      `Dear ${name},\n\n` +
      `Greetings from the Admissions Directorate at V.S.B. Engineering College (${campus}).\n\n` +
      `We have reviewed your academic profile and are pleased to inform you that based on ${cutoffStr}, you are well-qualified for our prestigious ${course} program.\n\n` +
      `Highlights of V.S.B. Engineering College:\n` +
      `- Centralized Placement Cell with 450+ campus recruiters\n` +
      `- World-class smart classrooms, AI labs, and high-speed campus Wi-Fi\n` +
      `- Comfortable separate hostels for boys and girls with multi-cuisine dining\n` +
      `- Merit and First Graduate government scholarship assistance\n\n` +
      `Our faculty admission counselors are ready to help you complete your documentation and verify your marksheet.\n\n` +
      `Best Regards,\n` +
      `Office of Admissions\n` +
      `V.S.B. Engineering College\n` +
      `NH-67 Covai Road, Karur / Pollachi Road, Coimbatore`
    );
  }

  // CALL Script
  return (
    `[Tele-Counselor Script for ${name}]:\n` +
    `"Hello ${name}, Good day! I am calling from V.S.B. Engineering College Admissions Office regarding your inquiry for ${course} at our ${campus} campus. ` +
    `I saw that your TNEA cutoff is around ${student.cutoff || "good standing"}, which qualifies you for our priority seat list. ` +
    `Are you planning to take admission through TNEA counseling or management quota? We are also hosting an open campus visit this Saturday where you can meet the department HoD and tour our labs."`
  );
}
