"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Teacher, Lead, Application } from "@/types/crm";
import { redirectToDialPad, getCleanTelUri } from "@/lib/callDialer";
import { uploadTeacherProfilePhotoToFirebase, redirectStudentLeadInFirebase } from "@/lib/firebaseSync";
import { MOCK_TEACHERS } from "@/lib/mockData";
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
  Camera,
  Upload,
  ArrowRightLeft,
  Users,
  Image as ImageIcon,
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
  isRedirected?: boolean;
  redirectedTo?: string;
  redirectedToId?: string;
  redirectReason?: string;
  redirectNotes?: string;
  redirectedAt?: string;
}

interface TeacherStudentAuditModalProps {
  teacher: Teacher | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: "ADMIN" | "TEACHER";
  onTriggerToast: (msg: string) => void;
  allLeads?: (Lead & { application: Application })[];
  teachersList?: Teacher[];
  onUpdateTeacherPhoto?: (teacherId: string, photoUrl: string) => void;
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
  teachersList = [],
  onUpdateTeacherPhoto,
}: TeacherStudentAuditModalProps) {
  const [studentRecords, setStudentRecords] = useState<StudentCallRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "TALKED" | "NOT_TALKED" | "REDIRECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [loggingRecord, setLoggingRecord] = useState<StudentCallRecord | null>(null);
  const [customCallNotes, setCustomCallNotes] = useState("");
  const [customInterestStatus, setCustomInterestStatus] = useState<StudentCallRecord["interestStatus"]>("INTERESTED");
  const [customDurationText, setCustomDurationText] = useState("03:45");
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Teacher Profile Photo State & Ref
  const [currentTeacherPhoto, setCurrentTeacherPhoto] = useState<string>(teacher?.photoUrl || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (teacher?.photoUrl) {
      setCurrentTeacherPhoto(teacher.photoUrl);
    }
  }, [teacher]);

  // Lead Redirection / Transfer State
  const [redirectingStudent, setRedirectingStudent] = useState<StudentCallRecord | null>(null);
  const [redirectReason, setRedirectReason] = useState("Candidate Unreachable / Number Busy (Alternate Shift Followup)");
  const [redirectTargetTeacherId, setRedirectTargetTeacherId] = useState("");
  const [redirectNotes, setRedirectNotes] = useState("");

  // All Available Teachers for Lead Handover
  const availableTeachers = useMemo<Teacher[]>(() => {
    if (teachersList && teachersList.length > 0) return teachersList;
    try {
      const stored = localStorage.getItem("vsb_crm_teachers");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_TEACHERS;
  }, [teachersList]);

  // Handle Teacher Profile Photo Upload with Firebase & Canvas Optimizer
  const handleTeacherPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teacher) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx?.drawImage(img, sx, sy, minDim, minDim, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

        setCurrentTeacherPhoto(dataUrl);

        try {
          const firebaseUrl = await uploadTeacherProfilePhotoToFirebase(teacher.id, dataUrl);
          setCurrentTeacherPhoto(firebaseUrl);

          // Update local teachers list
          try {
            const stored = localStorage.getItem("vsb_crm_teachers");
            let list: Teacher[] = stored ? JSON.parse(stored) : [];
            if (Array.isArray(list)) {
              list = list.map((t) => (t.id === teacher.id ? { ...t, photoUrl: firebaseUrl } : t));
              localStorage.setItem("vsb_crm_teachers", JSON.stringify(list));
            }
          } catch (e) {}

          onUpdateTeacherPhoto?.(teacher.id, firebaseUrl);
          onTriggerToast(`📸 Profile photo saved to Firebase for ${teacher.name}!`);
        } catch (err) {
          onTriggerToast(`📸 Photo updated for ${teacher.name}!`);
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Open Lead Redirection Modal
  const handleOpenRedirectModal = (student: StudentCallRecord) => {
    setRedirectingStudent(student);
    setRedirectReason("Candidate Unreachable / Number Busy (Alternate Shift Followup)");
    const otherTeachers = availableTeachers.filter(
      (t) => t.id !== teacher?.id && t.email !== teacher?.email
    );
    setRedirectTargetTeacherId(otherTeachers[0]?.id || otherTeachers[0]?.email || "");
    setRedirectNotes(
      `Candidate was unreachable during shift call. Cutoff: ${student.cutoffMarks}. Branch interest: ${student.courseInterest}. Please follow up.`
    );
  };

  // Confirm and Execute Lead Redirection
  const handleConfirmRedirect = async () => {
    if (!redirectingStudent || !teacher || !redirectTargetTeacherId) return;

    const targetTeacher = availableTeachers.find(
      (t) => t.id === redirectTargetTeacherId || t.email === redirectTargetTeacherId
    );
    if (!targetTeacher) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    // 1. Mark as redirected in current teacher's records
    const updatedCurrent: StudentCallRecord[] = studentRecords.map((s) => {
      if (s.id === redirectingStudent.id) {
        return {
          ...s,
          isRedirected: true,
          redirectedTo: targetTeacher.name,
          redirectedToId: targetTeacher.id || targetTeacher.email,
          redirectReason,
          redirectNotes,
          redirectedAt: `Today, ${timeStr}`,
          callNotes: `[REDIRECTED TO ${targetTeacher.name.toUpperCase()}]: ${redirectReason} - Notes: "${redirectNotes}"`,
        };
      }
      return s;
    });
    saveRecords(updatedCurrent);

    // 2. Append to target teacher's queue in localStorage
    try {
      const targetStorageKey = `vsb_teacher_call_records_${targetTeacher.id || targetTeacher.email}`;
      const targetExistingStr = localStorage.getItem(targetStorageKey);
      let targetList: StudentCallRecord[] = targetExistingStr ? JSON.parse(targetExistingStr) : [];
      if (!Array.isArray(targetList)) targetList = [];

      const existingIdx = targetList.findIndex(
        (item) => item.id === redirectingStudent.id || item.phone === redirectingStudent.phone
      );

      const transferredRecord: StudentCallRecord = {
        ...redirectingStudent,
        isTalked: false,
        isRedirected: false,
        talkedAt: undefined,
        callNotes: `[TRANSFERRED FROM ${teacher.name.toUpperCase()}]: ${redirectReason}. Handoff Notes: "${redirectNotes}"`,
      };

      if (existingIdx >= 0) {
        targetList[existingIdx] = transferredRecord;
      } else {
        targetList = [transferredRecord, ...targetList];
      }
      localStorage.setItem(targetStorageKey, JSON.stringify(targetList));
    } catch (e) {
      console.warn("Target queue update error:", e);
    }

    // 3. Sync to Firebase
    try {
      await redirectStudentLeadInFirebase(
        redirectingStudent.id,
        teacher.name,
        targetTeacher.name,
        redirectReason,
        redirectNotes
      );
    } catch (e) {}

    onTriggerToast(`🔀 Lead ${redirectingStudent.studentName} redirected to ${targetTeacher.name} successfully!`);
    setRedirectingStudent(null);
  };

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
  const redirectedCount = studentRecords.filter((s) => s.isRedirected).length;
  const talkedPercentage = totalCount > 0 ? Math.round((talkedCount / totalCount) * 100) : 0;
  const notTalkedPercentage = 100 - talkedPercentage;
  const admittedCount = studentRecords.filter((s) => s.interestStatus === "ADMITTED").length;
  const interestedCount = studentRecords.filter((s) => s.interestStatus === "INTERESTED").length;

  // Filtered List
  const filteredStudents = useMemo(() => {
    return studentRecords.filter((s) => {
      if (activeFilter === "TALKED" && !s.isTalked) return false;
      if (activeFilter === "NOT_TALKED" && s.isTalked) return false;
      if (activeFilter === "REDIRECTED" && !s.isRedirected) return false;

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
              <div className="relative group/photo shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-xl shrink-0 overflow-hidden">
                  <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-white font-black text-lg overflow-hidden">
                    {currentTeacherPhoto ? (
                      <img src={currentTeacherPhoto} alt={teacher.name} className="w-full h-full object-cover" />
                    ) : (
                      teacher.avatar
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md border border-slate-900 cursor-pointer active:scale-95 transition-all"
                  title="Upload Profile Photo to Firebase"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTeacherPhotoUpload}
                  className="hidden"
                />
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
            <button
              onClick={() => setActiveFilter("REDIRECTED")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "REDIRECTED"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-purple-400 hover:text-purple-300"
              }`}
            >
              <PhoneForwarded className="w-3.5 h-3.5" />
              <span>🔀 Redirected ({redirectedCount})</span>
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

                      {/* Unable to Talk / Redirect Lead Action */}
                      {!student.isRedirected && (
                        <button
                          onClick={() => handleOpenRedirectModal(student)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Unable to talk to candidate? Redirect lead to another faculty counselor"
                        >
                          <PhoneForwarded className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Unable to Talk?</span>
                          <span>Redirect</span>
                        </button>
                      )}

                      {/* Redirected Status Badge */}
                      {student.isRedirected && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-950/90 text-purple-300 border border-purple-700/60 flex items-center gap-1 shadow-sm">
                          <PhoneForwarded className="w-3 h-3 text-purple-400" />
                          <span>Redirected to {student.redirectedTo}</span>
                        </span>
                      )}

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

            {/* Quick Handover Trigger when Unable to Connect */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const rec = loggingRecord;
                  setLoggingRecord(null);
                  handleOpenRedirectModal(rec);
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <PhoneForwarded className="w-4 h-4 text-amber-400" />
                <span>Unable to Talk? Redirect Lead to Another Teacher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* REDIRECT STUDENT LEAD TO OTHER TEACHERS MODAL                       */}
      {/* =================================================================== */}
      {redirectingStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <PhoneForwarded className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Redirect Student Lead to Faculty</h3>
                  <p className="text-xs text-slate-400">
                    Hand over candidate to another teacher / department specialist
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRedirectingStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Summary Banner */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-xs">{redirectingStudent.studentName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Cutoff: {redirectingStudent.cutoffMarks}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Phone: <strong className="text-emerald-400 font-mono">{redirectingStudent.phone}</strong> • {redirectingStudent.district} • {redirectingStudent.courseInterest}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Reason Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Reason for Redirection / Unable to Talk:
                </label>
                <select
                  value={redirectReason}
                  onChange={(e) => setRedirectReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Candidate Unreachable / Number Busy (Alternate Shift Followup)">
                    📵 Candidate Unreachable / Number Busy (Alternate Shift Followup)
                  </option>
                  <option value="Student Requested Specific Branch Specialist (AI & DS, CSE, ECE, Mech)">
                    🎓 Student Requested Specific Branch Specialist
                  </option>
                  <option value="Language / Regional Counselor Assistance">
                    🗣️ Language / Regional Counselor Assistance
                  </option>
                  <option value="Teacher Schedule Conflict / On Leave">
                    ⏳ Teacher Schedule Conflict / On Leave
                  </option>
                  <option value="Candidate Requested Senior HoD / Professor Consultation">
                    🏛️ Candidate Requested Senior HoD / Professor Consultation
                  </option>
                  <option value="Follow-up Call Scheduled for Next Shift">
                    🔄 Follow-up Call Scheduled for Next Shift
                  </option>
                </select>
              </div>

              {/* Target Teacher Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Select Recipient Faculty Counselor:
                </label>
                <select
                  value={redirectTargetTeacherId}
                  onChange={(e) => setRedirectTargetTeacherId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {availableTeachers
                    .filter((t) => t.id !== teacher?.id && t.email !== teacher?.email)
                    .map((t) => (
                      <option key={t.id || t.email} value={t.id || t.email}>
                        {t.name} — {t.department} ({t.campus} Campus)
                      </option>
                    ))}
                </select>
              </div>

              {/* Handoff Notes */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Handoff Instructions / Notes for New Teacher:
                </label>
                <textarea
                  rows={3}
                  value={redirectNotes}
                  onChange={(e) => setRedirectNotes(e.target.value)}
                  placeholder="Provide context on candidate interest, best time to call, specific doubts asked..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setRedirectingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRedirect}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-amber-600/30 cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
              >
                <PhoneForwarded className="w-3.5 h-3.5" />
                <span>Confirm & Redirect Lead</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
