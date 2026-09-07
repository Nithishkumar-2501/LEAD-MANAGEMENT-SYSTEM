"use client";

import { useState, useEffect, useMemo } from "react";
import { Teacher, Lead, Application } from "@/types/crm";
import { redirectToDialPad, getCleanTelUri } from "@/lib/callDialer";
import {
  X,
  Phone,
  PhoneCall,
  PhoneForwarded,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  FileText,
  UserCheck,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Plus,
  Play,
  Pause,
  MessageSquare,
  GraduationCap,
  Award,
  ChevronDown,
  Calendar,
} from "lucide-react";

export interface StudentCallRecord {
  id: string;
  leadNumber: number;
  studentName: string;
  phone: string;
  email: string;
  district: string;
  school: string;
  courseInterest: string;
  cutoffMarks: number;
  isTalked: boolean;
  talkedAt?: string;
  durationText?: string;
  durationSeconds?: number;
  interestStatus?: "INTERESTED" | "ADMITTED" | "REVIEWING" | "NOT_INTERESTED" | "NO_ANSWER";
  callNotes?: string;
  transcript?: string;
  hasAudioRecording?: boolean;
}

interface TeacherStudentAuditModalProps {
  teacher: Teacher | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: "ADMIN" | "TEACHER";
  onTriggerToast: (msg: string) => void;
  allLeads?: (Lead & { application: Application })[];
}

const TN_FIRST_NAMES = [
  "Aarav", "Kavya", "Sanjay", "Deepak", "Ananya", "Vignesh", "Priya", "Karthik",
  "Nandhini", "Rithvik", "Harish", "Divya", "Gowtham", "Keerthana", "Madhan",
  "Pavithra", "Surya", "Meena", "Arun", "Sneha", "Dinesh", "Swetha", "Naveen",
  "Varsha", "Rajesh", "Pooja", "Manojkumar", "Sangeetha", "Vishnu", "Revathi",
  "Ganesh", "Monika", "Balaji", "Subhasree", "Dharun", "Gayathri", "Ashwin",
  "Lavanya", "Kishore", "Sowmya"
];

const TN_LAST_NAMES = [
  "Subramaniam", "Kumar", "Venkatesan", "Ranganathan", "Sundaram", "Murugan",
  "Natarajan", "Selvam", "Balasubramanian", "Chandrasekaran", "Dhanasekaran",
  "Ganesan", "Jayaraman", "Krishnan", "Lakshmanan", "Manoharan", "Palanisamy",
  "Radhakrishnan", "Saravanan", "Thangavel", "Velusamy", "Yogeshwaran"
];

const TN_DISTRICTS = [
  "Karur", "Coimbatore", "Tiruchirappalli", "Salem", "Erode", "Dindigul",
  "Namakkal", "Madurai", "Chennai", "Thanjavur", "Tiruppur", "Dharmapuri"
];

const TN_SCHOOLS = [
  "Cheran Matric HSS, Karur",
  "Stanes Anglo Indian HSS, Coimbatore",
  "SRV Boys Matric HSS, Rasipuram",
  "Kongu Vellalar Matric HSS, Perundurai",
  "Vidya Mandir Matric HSS, Salem",
  "Campion Anglo Indian HSS, Trichy",
  "Bharathi Vidya Bhavan, Erode",
  "TVS Higher Secondary School, Madurai",
  "St. Joseph's Boys HSS, Coonoor",
  "Green Valley Matric HSS, Namakkal"
];

const SAMPLE_TALK_NOTES = [
  "Candidate verified TNEA cutoff. Very keen to join VSB Karur. Visiting campus on Saturday.",
  "Discussed CSE and AI/DS placement statistics (98.4% placed, top 24 LPA). Student convinced.",
  "Father enquired about hostel facilities and bus routes from Erode/Salem. Sent brochure via WhatsApp.",
  "Management Quota token advance payment initiated. Seat reserved pending marksheet verification.",
  "Student comparing between VSB and PSG. Explained faculty credentials and NBA/NAAC A++ grade.",
  "Enquired about fee concession for >190 cutoff. Confirmed 50% tuition scholarship eligibility."
];

export default function TeacherStudentAuditModal({
  teacher,
  isOpen,
  onClose,
  currentUserRole,
  onTriggerToast,
  allLeads = [],
}: TeacherStudentAuditModalProps) {
  const [studentRecords, setStudentRecords] = useState<StudentCallRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "TALKED" | "NOT_TALKED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [loggingRecord, setLoggingRecord] = useState<StudentCallRecord | null>(null);
  const [customCallNotes, setCustomCallNotes] = useState("");
  const [customInterestStatus, setCustomInterestStatus] = useState<StudentCallRecord["interestStatus"]>("INTERESTED");
  const [customDurationText, setCustomDurationText] = useState("03:45");
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Initialize or Load Persistent Records for Selected Teacher
  useEffect(() => {
    if (!teacher) return;

    const storageKey = `vsb_teacher_call_records_${teacher.id || teacher.email}`;
    let loaded: StudentCallRecord[] = [];

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        loaded = JSON.parse(saved);
      }
    } catch (e) {}

    // If no saved records, generate deterministic assigned batch
    if (!loaded || loaded.length === 0) {
      const quota = teacher.assignedQuota || 100;
      
      // Determine starting contact index from teacher range or email hash
      let startIdx = 1;
      if (teacher.assignedRangeText) {
        const match = teacher.assignedRangeText.match(/#(\d+)/);
        if (match && match[1]) {
          startIdx = parseInt(match[1], 10);
        }
      } else {
        // Deterministic hash based on teacher name/email
        let hash = 0;
        for (let i = 0; i < teacher.email.length; i++) {
          hash = (hash * 31 + teacher.email.charCodeAt(i)) % 900;
        }
        startIdx = Math.max(1, hash);
      }

      const generated: StudentCallRecord[] = [];
      const primaryCourse = teacher.coursesAssigned[0] || teacher.department;

      for (let i = 0; i < quota; i++) {
        const contactNo = startIdx + i;
        const fName = TN_FIRST_NAMES[(contactNo + i * 3) % TN_FIRST_NAMES.length];
        const lName = TN_LAST_NAMES[(contactNo + i * 7) % TN_LAST_NAMES.length];
        const district = TN_DISTRICTS[(contactNo + i) % TN_DISTRICTS.length];
        const school = TN_SCHOOLS[(contactNo + i * 2) % TN_SCHOOLS.length];
        const cutoff = Number((165 + ((contactNo * 13) % 34) + ((contactNo % 5) * 0.25)).toFixed(2));
        
        // Realistic initial talked ratio: roughly 45% - 65% talked
        const isTalked = (contactNo % 3 === 0) || (contactNo % 5 === 1) || (contactNo % 7 === 2);
        
        let talkedAt: string | undefined;
        let durationText: string | undefined;
        let durationSeconds: number | undefined;
        let interestStatus: StudentCallRecord["interestStatus"];
        let callNotes: string | undefined;
        let transcript: string | undefined;

        if (isTalked) {
          const hoursAgo = (i % 72) + 1;
          const date = new Date(Date.now() - hoursAgo * 3600000);
          talkedAt = `${date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}, ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
          const mins = (i % 5) + 1;
          const secs = (i * 11) % 60;
          durationSeconds = mins * 60 + secs;
          durationText = `0${mins}:${secs < 10 ? "0" : ""}${secs}`;
          
          if (cutoff >= 190) {
            interestStatus = (i % 2 === 0) ? "ADMITTED" : "INTERESTED";
          } else if (cutoff >= 175) {
            interestStatus = (i % 3 === 0) ? "INTERESTED" : "REVIEWING";
          } else {
            interestStatus = "REVIEWING";
          }

          callNotes = SAMPLE_TALK_NOTES[(contactNo + i) % SAMPLE_TALK_NOTES.length];
          transcript = `[00:04] ${teacher.name}: Good morning, calling from V.S.B. Engineering College admissions office for ${fName}.
[00:15] ${fName}: Good morning Sir/Ma'am! Yes, I applied for ${primaryCourse}.
[00:35] ${teacher.name}: Your TNEA cutoff score is ${cutoff}. You are in our merit admission bracket.
[01:10] ${fName}: Thank you Sir! What are the hostel facilities and campus placement opportunities?
[02:00] ${teacher.name}: We offer Wi-Fi enabled AC/Non-AC hostels, and top recruiters include TCS, Cognizant, Zoho, and L&T with packages up to 24 LPA.`;
        }

        generated.push({
          id: `stu_audit_${teacher.id}_${contactNo}`,
          leadNumber: contactNo,
          studentName: `${fName} ${lName}`,
          phone: `+91 ${98000 + ((contactNo * 37) % 1999)} ${10000 + ((contactNo * 89) % 89999)}`.slice(0, 15),
          email: `${fName.toLowerCase()}.${lName.toLowerCase()}${contactNo % 99}@gmail.com`,
          district,
          school,
          courseInterest: primaryCourse,
          cutoffMarks: cutoff,
          isTalked,
          talkedAt,
          durationText,
          durationSeconds,
          interestStatus,
          callNotes,
          transcript,
          hasAudioRecording: isTalked,
        });
      }

      loaded = generated;
      try {
        localStorage.setItem(storageKey, JSON.stringify(loaded));
      } catch (e) {}
    }

    setStudentRecords(loaded);
  }, [teacher]);

  // Persist Updates
  const saveRecords = (updated: StudentCallRecord[]) => {
    if (!teacher) return;
    setStudentRecords(updated);
    try {
      localStorage.setItem(`vsb_teacher_call_records_${teacher.id || teacher.email}`, JSON.stringify(updated));
    } catch (e) {}
  };

  // High-Level Metrics
  const totalCount = studentRecords.length;
  const talkedCount = studentRecords.filter((s) => s.isTalked).length;
  const notTalkedCount = totalCount - talkedCount;
  const talkedPercentage = totalCount > 0 ? Math.round((talkedCount / totalCount) * 100) : 0;
  const notTalkedPercentage = 100 - talkedPercentage;
  const admittedCount = studentRecords.filter((s) => s.interestStatus === "ADMITTED").length;
  const interestedCount = studentRecords.filter((s) => s.interestStatus === "INTERESTED").length;

  // Filtered List
  const filteredStudents = useMemo(() => {
    return studentRecords.filter((s) => {
      if (activeFilter === "TALKED" && !s.isTalked) return false;
      if (activeFilter === "NOT_TALKED" && s.isTalked) return false;

      if (selectedDistrict !== "ALL" && s.district !== selectedDistrict) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.studentName.toLowerCase().includes(q);
        const matchesPhone = s.phone.includes(q);
        const matchesDistrict = s.district.toLowerCase().includes(q);
        const matchesSchool = s.school.toLowerCase().includes(q);
        const matchesNumber = s.leadNumber.toString().includes(q);
        const matchesCourse = s.courseInterest.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesDistrict || matchesSchool || matchesNumber || matchesCourse;
      }

      return true;
    });
  }, [studentRecords, activeFilter, selectedDistrict, searchQuery]);

  // Handle Mark as Talked / Open Logger
  const handleOpenLogModal = (student: StudentCallRecord) => {
    setLoggingRecord(student);
    setCustomCallNotes(student.callNotes || "Candidate expressed interest in admission. Verified 12th marksheet.");
    setCustomInterestStatus(student.interestStatus || "INTERESTED");
    setCustomDurationText(student.durationText || "03:30");
  };

  const handleSaveLogCall = () => {
    if (!loggingRecord || !teacher) return;

    const now = new Date();
    const talkedAt = `Today, ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;

    const updated: StudentCallRecord[] = studentRecords.map((s) => {
      if (s.id === loggingRecord.id) {
        return {
          ...s,
          isTalked: true,
          talkedAt,
          durationText: customDurationText,
          interestStatus: customInterestStatus,
          callNotes: customCallNotes,
          hasAudioRecording: true,
          transcript: `[00:05] ${teacher.name}: Hello ${s.studentName}, following up regarding your VSB College application.
[00:20] ${s.studentName}: Yes Sir/Ma'am, thanks for calling.
[01:00] ${teacher.name}: Notes recorded: "${customCallNotes}"`,
        };
      }
      return s;
    });

    saveRecords(updated);
    onTriggerToast(`✅ Call logged for ${loggingRecord.studentName}! Status updated to TALKED.`);
    setLoggingRecord(null);
  };

  const handleToggleTalkStatus = (student: StudentCallRecord) => {
    const nextTalked = !student.isTalked;
    const now = new Date();
    const updated: StudentCallRecord[] = studentRecords.map((s) => {
      if (s.id === student.id) {
        return {
          ...s,
          isTalked: nextTalked,
          talkedAt: nextTalked
            ? `Today, ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
            : undefined,
          durationText: nextTalked ? "02:45" : undefined,
          interestStatus: nextTalked ? ("INTERESTED" as const) : undefined,
          callNotes: nextTalked ? "Call completed via phone dialer. Candidate interested." : undefined,
          hasAudioRecording: nextTalked,
        };
      }
      return s;
    });

    saveRecords(updated);
    onTriggerToast(
      nextTalked
        ? `🟢 ${student.studentName} marked as TALKED!`
        : `🟡 ${student.studentName} reverted to NOT TALKED (PENDING).`
    );
  };

  // Export CSV of Teacher's Students
  const handleExportCSV = () => {
    if (!teacher) return;

    let csv = "Lead No,Student Name,Phone,Email,District,School,Cutoff,Call Status,Talked Time,Duration,Interest Status,Teacher Notes\n";
    studentRecords.forEach((s) => {
      csv += `"${s.leadNumber}","${s.studentName}","${s.phone}","${s.email}","${s.district}","${s.school}","${s.cutoffMarks}","${s.isTalked ? "TALKED" : "NOT TALKED"}","${s.talkedAt || "N/A"}","${s.durationText || "N/A"}","${s.interestStatus || "PENDING"}","${(s.callNotes || "").replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `VSB_${teacher.name.replace(/[^a-zA-Z0-9]/g, "_")}_Student_Call_Audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast(`📥 Exported call audit report for ${teacher.name}!`);
  };

  if (!isOpen || !teacher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto">
        {/* ================================================================= */}
        {/* MODAL HEADER: TEACHER PROFILE & QUICK ACTIONS                    */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-white/10 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-xl shrink-0">
                <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-white font-black text-lg">
                  {teacher.avatar}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                    {teacher.name}
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    {teacher.campus} CAMPUS
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    🟢 {teacher.status}
                  </span>
                </div>
                <p className="text-xs text-indigo-300 font-semibold mt-0.5">
                  {teacher.department} • {teacher.experienceYears} Yrs Experience • Phone: {teacher.phone}
                </p>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                  <span>🎯 Allocated Batch:</span>
                  <strong className="text-emerald-400 font-mono font-bold">
                    {teacher.assignedRangeText || `Contacts #1 to #${teacher.assignedQuota || 100}`}
                  </strong>
                  <span>({totalCount} Total Assigned Students)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Download CSV Audit Report"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export Audit CSV</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700/80 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* KPI METRIC CARDS: TALKED VS NOT TALKED CALL PERFORMANCE           */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-6 bg-slate-950/60 border-b border-white/5 space-y-4 shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Assigned */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>Total Assigned</span>
                <GraduationCap className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{totalCount}</span>
                <span className="text-[11px] text-slate-400 font-medium">Students</span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">100% of Faculty Allocation</p>
            </div>

            {/* Talked To Students (Green) */}
            <div className="bg-emerald-950/30 border border-emerald-500/40 p-3.5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-emerald-300 text-xs font-bold">
                <span>Talked to Students</span>
                <PhoneCall className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-300">{talkedCount}</span>
                <span className="text-[11px] text-emerald-400/80 font-bold">({talkedPercentage}%)</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Outreach completed
              </p>
            </div>

            {/* Not Talked / Pending (Amber) */}
            <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-amber-300 text-xs font-bold">
                <span>Not Talked / Pending</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-300">{notTalkedCount}</span>
                <span className="text-[11px] text-amber-400/80 font-bold">({notTalkedPercentage}%)</span>
              </div>
              <p className="text-[10px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Needs calling outreach
              </p>
            </div>

            {/* Admitted & Interested */}
            <div className="bg-sky-950/30 border border-sky-500/40 p-3.5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-sky-300 text-xs font-bold">
                <span>Admitted & High Interest</span>
                <Award className="w-4 h-4 text-sky-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-sky-300">{admittedCount + interestedCount}</span>
                <span className="text-[11px] text-sky-400/80 font-bold">
                  ({admittedCount} Admitted • {interestedCount} Int.)
                </span>
              </div>
              <p className="text-[10px] text-sky-400 font-semibold mt-1">Direct conversion from calls</p>
            </div>
          </div>

          {/* Visual Segmented Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span>Calling Outreach Progress:</span>
                <span className="text-emerald-400 font-mono">{talkedPercentage}% Talked</span>
              </span>
              <span className="text-slate-400 text-[11px] font-mono">
                {talkedCount} Contacted / {notTalkedCount} Pending Calls
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex border border-white/10 shadow-inner">
              <div
                style={{ width: `${talkedPercentage}%` }}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 relative group"
                title={`${talkedCount} Talked (${talkedPercentage}%)`}
              />
              <div
                style={{ width: `${notTalkedPercentage}%` }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500 relative group"
                title={`${notTalkedCount} Not Talked (${notTalkedPercentage}%)`}
              />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* FILTER CONTROLS & SEARCH BAR                                      */}
        {/* ================================================================= */}
        <div className="p-3 sm:p-4 bg-slate-900 border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Active Status Tabs */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 gap-1 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Students ({totalCount})
            </button>
            <button
              onClick={() => setActiveFilter("TALKED")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "TALKED"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-400 hover:text-emerald-300"
              }`}
            >
              <span>🟢 Talked to ({talkedCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter("NOT_TALKED")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "NOT_TALKED"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-amber-400 hover:text-amber-300"
              }`}
            >
              <span>🟡 Not Talked ({notTalkedCount})</span>
            </button>
          </div>

          {/* Search & District Selector */}
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, school, cutoff..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Districts</option>
              {TN_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ================================================================= */}
        {/* STUDENT AUDIT LIST                                                */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-base font-bold text-slate-300">No students found matching current filter</p>
              <p className="text-xs text-slate-500">Try clearing your search query or selecting a different status tab.</p>
              <button
                onClick={() => {
                  setActiveFilter("ALL");
                  setSearchQuery("");
                  setSelectedDistrict("ALL");
                }}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md mt-2 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isExpanded = expandedRecordId === student.id;

              return (
                <div
                  key={student.id}
                  className={`border rounded-2xl p-4 transition-all duration-200 ${
                    student.isTalked
                      ? "bg-slate-900/90 border-emerald-500/30 hover:border-emerald-500/60"
                      : "bg-slate-950 border-amber-500/30 hover:border-amber-500/60"
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    {/* Student Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md ${
                          student.isTalked
                            ? "bg-gradient-to-br from-emerald-600 to-teal-600"
                            : "bg-gradient-to-br from-amber-600 to-orange-600"
                        }`}
                      >
                        {student.studentName.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-white truncate">
                            {student.studentName}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            #{student.leadNumber}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                            Cutoff: {student.cutoffMarks}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {student.school} • <span className="text-slate-300 font-semibold">{student.district}</span> • {student.courseInterest}
                        </p>
                      </div>
                    </div>

                    {/* Calling Status & Quick Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap self-end md:self-center shrink-0">
                      {/* Phone Dial Button */}
                      <a
                        href={getCleanTelUri(student.phone)}
                        onClick={(e) => {
                          onTriggerToast(`📞 Initiated call to ${student.studentName} (${student.phone})`);
                          redirectToDialPad(student.phone);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title={`Call ${student.studentName} via Phone Dial Pad`}
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono">{student.phone}</span>
                      </a>

                      {/* Status Badge */}
                      {student.isTalked ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Talked ({student.durationText || "03:45"})</span>
                          </span>

                          <span
                            className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                              student.interestStatus === "ADMITTED"
                                ? "bg-sky-950 text-sky-300 border-sky-800"
                                : student.interestStatus === "INTERESTED"
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : "bg-amber-950 text-amber-300 border-amber-800"
                            }`}
                          >
                            {student.interestStatus === "ADMITTED" && "🎓 Admitted"}
                            {student.interestStatus === "INTERESTED" && "🌟 Interested"}
                            {student.interestStatus === "REVIEWING" && "⏳ Reviewing"}
                            {!student.interestStatus && "Connected"}
                          </span>
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Not Talked (Pending)</span>
                        </span>
                      )}

                      {/* Log / Mark Call Action */}
                      <button
                        onClick={() => handleOpenLogModal(student)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                          student.isTalked
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-indigo-600/30"
                        }`}
                      >
                        {student.isTalked ? (
                          <>
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                            <span>Edit Notes</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            <span>Mark as Talked</span>
                          </>
                        )}
                      </button>

                      {/* Expand / Details Toggle */}
                      {student.isTalked && (
                        <button
                          onClick={() => setExpandedRecordId(isExpanded ? null : student.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title="View Call Transcript & Notes"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180 text-emerald-400" : ""}`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Call Details & Transcript Drawer */}
                  {isExpanded && student.isTalked && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5 text-xs animate-in fade-in">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Call Timestamp: <strong className="text-white">{student.talkedAt || "Today"}</strong></span>
                        </span>
                        <span>
                          Call Duration: <strong className="text-emerald-300 font-mono">{student.durationText}</strong>
                        </span>
                      </div>

                      {/* Call Notes */}
                      {student.callNotes && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 block">
                            Teacher Call Notes:
                          </span>
                          <p className="text-xs text-white font-medium">{student.callNotes}</p>
                        </div>
                      )}

                      {/* Simulated Verbatim Transcript */}
                      {student.transcript && (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                            Verbatim Conversation Speech-to-Text Transcript:
                          </span>
                          <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-300 leading-relaxed">
                            {student.transcript}
                          </pre>
                        </div>
                      )}

                      {/* Option to revert to Not Talked */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleToggleTalkStatus(student)}
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Clock className="w-3 h-3" /> Revert back to Not Talked (Pending)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ================================================================= */}
        {/* MODAL FOOTER                                                      */}
        {/* ================================================================= */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-slate-400 font-medium text-center sm:text-left">
            <span>Admin Supervision Privilege: All teacher-student calls are tracked with timestamps and notes.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-all"
            >
              Close Audit Modal
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* QUICK LOG / EDIT CALL MODAL                                         */}
      {/* =================================================================== */}
      {loggingRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Log Call Record</h3>
                  <p className="text-xs text-slate-400">{loggingRecord.studentName} (#{loggingRecord.leadNumber})</p>
                </div>
              </div>
              <button
                onClick={() => setLoggingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Call Duration (MM:SS):</label>
                <input
                  type="text"
                  value={customDurationText}
                  onChange={(e) => setCustomDurationText(e.target.value)}
                  placeholder="e.g. 03:45"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Student Interest Level:</label>
                <select
                  value={customInterestStatus}
                  onChange={(e) => setCustomInterestStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="INTERESTED">🌟 Interested to Join</option>
                  <option value="ADMITTED">🎓 Admitted / Advance Fee Paid</option>
                  <option value="REVIEWING">⏳ Reviewing Options with Parents</option>
                  <option value="NOT_INTERESTED">❌ Not Interested</option>
                  <option value="NO_ANSWER">📵 No Answer / Switch Off</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Teacher Call Notes:</label>
                <textarea
                  rows={3}
                  value={customCallNotes}
                  onChange={(e) => setCustomCallNotes(e.target.value)}
                  placeholder="Write call conversation summary..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setLoggingRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLogCall}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
              >
                Save & Update Call Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
