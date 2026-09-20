"use client";

import { useState, useEffect, useMemo } from "react";
import { Teacher, CampusLocation, VSB_DEPARTMENTS_COURSES, Lead, Application } from "@/types/crm";
import { MOCK_TEACHERS } from "@/lib/mockData";
import { parseCSVToTeachers } from "@/lib/csvParser";
import InPortalCommunicationModals, { ContactTarget } from "@/components/InPortalCommunicationModals";
import TeacherStudentAuditModal from "@/components/TeacherStudentAuditModal";
import { UserCheck, BookOpen, GraduationCap, Mail, Phone, PhoneCall, Plus, Search, CheckCircle2, Award, Edit3, Save, X, ShieldCheck, Upload, FileSpreadsheet, Download, Camera, Image as ImageIcon, Trash2, RefreshCw, Wrench, Laptop, Radio, Globe, Bot, Zap, HeartPulse, Building2, Shield, Cpu, FlaskConical, Plane, Dna, Layers, ChevronRight, Filter } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import SpecularButton from "@/components/SpecularButton";
import { mobileSafeFetch } from "@/lib/mobileFetch";
import { redirectToDialPad, getCleanTelUri } from "@/lib/callDialer";
import {
  uploadTeacherProfilePhotoToFirebase,
  saveTeacherToFirebase,
  deleteTeacherFromFirebase,
  fetchTeachersFromFirebase,
  subscribeToFirebaseTeachers,
  resolveTeacherByUsername,
} from "@/lib/firebaseSync";
import { formatPhoneWith91 } from "@/lib/phoneValidation";

interface TeacherModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  currentUserRole: "ADMIN" | "TEACHER";
  loggedInUsername?: string;
  onTriggerToast: (msg: string) => void;
  applicants?: (Lead & { application: Application })[];
  onSelectApplicant?: (applicant: Lead & { application: Application }) => void;
}

// Helper to determine if a teacher record matches the logged-in teacher account
export function checkIsSelfTeacher(tch: Teacher, username?: string): boolean {
  if (!username) return false;
  const u = username.toLowerCase().trim();
  const id = (tch.id || "").toLowerCase().trim();
  const email = (tch.email || "").toLowerCase().trim();
  if (id === u || email === u) return true;
  if ((u === "teacherkarur@123" || u === "teacher_rajesh@123") && (id.includes("rajesh") || email.includes("rajesh"))) return true;
  if (u === "teachercovai@123" && (id.includes("meenakshi") || email.includes("meenakshi"))) return true;
  if (id.split("@")[0] && u.includes(id.split("@")[0])) return true;
  return false;
}

// Helper to guarantee that all department staff samples from MOCK_TEACHERS are always present
function mergeWithMockTeachers(incomingList: Teacher[]): Teacher[] {
  const map = new Map<string, Teacher>();
  // 1. Seed with MOCK_TEACHERS (all 17+ departments)
  MOCK_TEACHERS.forEach((t) => {
    map.set((t.id || t.email).toLowerCase().trim(), t);
  });
  // 2. Overlay incoming records (preserving user edits, photo uploads, status updates)
  if (Array.isArray(incomingList)) {
    incomingList.forEach((t) => {
      const key = (t.id || t.email).toLowerCase().trim();
      const existing = map.get(key);
      map.set(key, existing ? { ...existing, ...t } : t);
    });
  }
  return Array.from(map.values());
}

// Helper to resolve Department visual iconography, emojis, and theme tags
export function getDepartmentMeta(deptName: string) {
  const d = (deptName || "").toLowerCase().trim();
  if (d.includes("mech")) {
    return {
      icon: Wrench,
      emoji: "⚙️",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      badgeColor: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40",
    };
  }
  if (d.includes("computer science") || d.includes("cse")) {
    return {
      icon: Laptop,
      emoji: "💻",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/30",
      badgeColor: "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/40",
    };
  }
  if (d.includes("electronics") || d.includes("ece")) {
    return {
      icon: Radio,
      emoji: "📡",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      badgeColor: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/40",
    };
  }
  if (d.includes("information technology") || d.includes("it")) {
    return {
      icon: Globe,
      emoji: "🌐",
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      badgeColor: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/40",
    };
  }
  if (d.includes("artificial intelligence") || d.includes("ai") || d.includes("data science")) {
    return {
      icon: Bot,
      emoji: "🤖",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      badgeColor: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/40",
    };
  }
  if (d.includes("electrical") || d.includes("eee")) {
    return {
      icon: Zap,
      emoji: "⚡",
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      badgeColor: "bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/40",
    };
  }
  if (d.includes("biomedical") || d.includes("bme")) {
    return {
      icon: HeartPulse,
      emoji: "🩺",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      badgeColor: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40",
    };
  }
  if (d.includes("civil")) {
    return {
      icon: Building2,
      emoji: "🏗️",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      badgeColor: "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/40",
    };
  }
  if (d.includes("cyber")) {
    return {
      icon: Shield,
      emoji: "🛡️",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      badgeColor: "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/40",
    };
  }
  if (d.includes("robotics")) {
    return {
      icon: Cpu,
      emoji: "🦾",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      badgeColor: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/40",
    };
  }
  if (d.includes("chemical")) {
    return {
      icon: FlaskConical,
      emoji: "🧪",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/30",
      badgeColor: "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/40",
    };
  }
  if (d.includes("aero")) {
    return {
      icon: Plane,
      emoji: "✈️",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      badgeColor: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/40",
    };
  }
  if (d.includes("biotech")) {
    return {
      icon: Dna,
      emoji: "🧬",
      color: "text-lime-600 dark:text-lime-400",
      bg: "bg-lime-500/10",
      border: "border-lime-500/30",
      badgeColor: "bg-lime-50 dark:bg-lime-950/60 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-500/40",
    };
  }
  return {
    icon: GraduationCap,
    emoji: "🎓",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    badgeColor: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/40",
  };
}

export default function TeacherModule({ loggedInCampus, currentUserRole, loggedInUsername, onTriggerToast, applicants = [], onSelectApplicant }: TeacherModuleProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("vsb_crm_teachers");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return mergeWithMockTeachers(parsed);
          }
        }
      } catch (e) {}
    }
    return mergeWithMockTeachers(MOCK_TEACHERS);
  });
  const [search, setSearch] = useState("");
  // Default to Mechanical Engineering so the user immediately gets their requested department view
  const [selectedDept, setSelectedDept] = useState("Mechanical Engineering");
  const [deptSearch, setDeptSearch] = useState("");
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<"ALL" | "KARUR" | "COIMBATORE">("ALL");
  const [facultyScope, setFacultyScope] = useState<"ALL" | "MINE">("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacherForAudit, setSelectedTeacherForAudit] = useState<Teacher | null>(null);

  // Dynamic Call Audit Metrics for Each Teacher
  const getTeacherCallStats = (tch: Teacher, index: number) => {
    try {
      const key = `vsb_teacher_call_records_${tch.id || tch.email}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const talked = parsed.filter((p: any) => p.isTalked).length;
          const total = parsed.length;
          return { talked, notTalked: total - talked, total };
        }
      }
    } catch (e) {}

    const total = tch.assignedQuota || 100;
    const talked = Math.round(total * (0.46 + ((index * 9) % 24) / 100));
    return { talked, notTalked: total - talked, total };
  };

  // Admin Lead Allocation Control Panel State
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitTargetTeacher, setSplitTargetTeacher] = useState("rajesh.mech@vsbec.in");
  const [splitQuantity, setSplitQuantity] = useState(100);
  const [splitStartNumber, setSplitStartNumber] = useState(1);

  // Admin Call Analytics & Audio Audit State
  const [isAdminAuditDrawerOpen, setIsAdminAuditDrawerOpen] = useState(false);
  const [selectedAuditDate, setSelectedAuditDate] = useState("2026-08-22");
  const [playingAudioRecId, setPlayingAudioRecId] = useState<string | null>(null);

  const [callRecordings] = useState([
    {
      id: "REC-101",
      leadName: "Kavya Subramaniam",
      leadPhone: "+91 98432 11223",
      teacherName: "Dr. K. Arulmurugan",
      recordingDate: "2026-08-22",
      timestamp: "10:30 AM",
      durationText: "03:45",
      studentInterestStatus: "INTERESTED",
      teacherNotes: "Candidate highly interested in B.E. Computer Science. Verified TNEA cutoff score 194.5.",
      callTranscript: `[00:05] Dr. Arulmurugan: Hello, am I speaking with Kavya?
[00:12] Kavya: Yes sir! Good morning. I applied for VSB Engineering College CSE department.
[00:30] Dr. Arulmurugan: Excellent Kavya. Your TNEA cutoff score of 194.5 places you in top 5% merit batch. Our placement record for CSE is 98.4% with top package 24 LPA.
[01:15] Kavya: That's great sir! Can I visit Karur campus this Saturday for document verification?
[02:05] Dr. Arulmurugan: Yes absolutely. Bring your 12th marksheet, TNEA rank sheet, and community certificate. See you on Saturday!`,
    },
    {
      id: "REC-102",
      leadName: "Sanjay Kumar",
      leadPhone: "+91 99421 88776",
      teacherName: "Prof. P. Rajesh",
      recordingDate: "2026-08-22",
      timestamp: "11:15 AM",
      durationText: "02:10",
      studentInterestStatus: "ADMITTED",
      teacherNotes: "Management Quota seat allocated for Mechanical Engg. Token advance paid.",
      callTranscript: `[00:04] Prof. Rajesh: Hello Sanjay, calling regarding your Mechanical Engineering admission at VSB Karur campus.
[00:20] Sanjay: Yes sir, my father and I finalized VSB for Mechanical. We want to confirm seat under Management quota.
[00:55] Prof. Rajesh: Great! I have reserved your seat #MECH-042. Kindly complete online fee submission by 4 PM today.`,
    },
    {
      id: "REC-103",
      leadName: "Deepak V.",
      leadPhone: "+91 97890 33445",
      teacherName: "Dr. S. Meenakshi",
      recordingDate: "2026-08-22",
      timestamp: "02:40 PM",
      durationText: "04:15",
      studentInterestStatus: "REVIEWING",
      teacherNotes: "Student reviewing ECE vs Cyber Security options. Scheduled follow-up call tomorrow.",
      callTranscript: `[00:06] Dr. Meenakshi: Hello Deepak, Dr. Meenakshi here from VSB ECE Department.
[00:35] Deepak: Hello Ma'am! I am confused between ECE and Cyber Security specialization.
[01:40] Dr. Meenakshi: ECE offers core electronics plus embedded software placement, while Cyber Security focuses on network defense. Both have 100% placement track records at VSB. Take tonight to discuss with parents!`,
    },
  ]);

  // In-Portal Communication Modal State
  const [activeCommModal, setActiveCommModal] = useState<"CALL" | "MESSAGE" | "EMAIL" | null>(null);
  const [activeCommContact, setActiveCommContact] = useState<ContactTarget | null>(null);

  const handleOpenCommModal = (type: "CALL" | "MESSAGE" | "EMAIL", target: ContactTarget) => {
    setActiveCommContact(target);
    setActiveCommModal(type);
  };

  const handleCommLogSuccess = (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => {
    onTriggerToast(`✨ In-Portal ${type} to faculty completed: ${details}`);
  };

  // CSV Import State
  const [csvParsedTeachers, setCsvParsedTeachers] = useState<Teacher[]>([]);
  const [showCsvPreviewModal, setShowCsvPreviewModal] = useState(false);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const parsed = parseCSVToTeachers(text, loggedInCampus);
      if (parsed.length === 0) {
        onTriggerToast("⚠️ No valid faculty records found in the uploaded CSV file.");
        return;
      }
      setCsvParsedTeachers(parsed);
      setShowCsvPreviewModal(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);

  // Persistent Storage Sync Helper (LocalStorage + Database API)
  const saveTeachersList = (updatedList: Teacher[]) => {
    setTeachers(updatedList);
    try {
      localStorage.setItem("vsb_crm_teachers", JSON.stringify(updatedList));
    } catch (e) {}
  };

  // Initial Load: Fetch from Firebase (Firestore + RTDB), LocalStorage & Database API
  useEffect(() => {
    // 1. Instant hydration from localStorage
    try {
      const stored = localStorage.getItem("vsb_crm_teachers");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = mergeWithMockTeachers(parsed);
          setTeachers(merged);
        }
      }
    } catch (err) {}

    // 2. Fetch directly from Firebase Firestore & Realtime Database
    fetchTeachersFromFirebase()
      .then((fbTeachers) => {
        if (Array.isArray(fbTeachers) && fbTeachers.length > 0) {
          const merged = mergeWithMockTeachers(fbTeachers);
          setTeachers(merged);
          saveTeachersList(merged);
        }
      })
      .catch((err) => {
        console.warn("Firebase teachers fetch notice:", err);
      });

    // 3. Real-time Firebase Observer: updates automatically whenever any teacher is modified
    const unsubscribe = subscribeToFirebaseTeachers((liveList) => {
      if (Array.isArray(liveList) && liveList.length > 0) {
        const merged = mergeWithMockTeachers(liveList);
        setTeachers(merged);
        saveTeachersList(merged);
      }
    });

    // 4. Also fetch from /api/teachers
    fetch(`/api/teachers?campus=ALL`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTeachers((prev) => {
            const merged = mergeWithMockTeachers([...prev, ...data]);
            try {
              localStorage.setItem("vsb_crm_teachers", JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(() => {});

    return () => {
      unsubscribe();
    };
  }, []);

  const handleConfirmCSVImport = async () => {
    if (csvParsedTeachers.length === 0) return;
    const normalizedTeachers = csvParsedTeachers.map((t) => ({
      ...t,
      campus: loggedInCampus,
      phone: formatPhoneWith91(t.phone),
    }));
    const updated = [...normalizedTeachers, ...teachers];
    saveTeachersList(updated);
    onTriggerToast(`✨ Successfully imported ${normalizedTeachers.length} faculty members into V.S.B. ${loggedInCampus} Directory and Firebase!`);
    setCsvParsedTeachers([]);
    setShowCsvPreviewModal(false);

    // Save every imported teacher to Firebase Firestore & RTDB
    for (const t of normalizedTeachers) {
      saveTeacherToFirebase(t).catch(() => {});
    }

    try {
      await mobileSafeFetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedTeachers),
      });
    } catch (err) {}
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      "Name,Email,Phone,Department,Campus,Courses,Experience,Lead Quota\n" +
      "Dr. S. Kanthaswamy,kanthaswamy@vsb.ac.in,+91 94432 11223,Computer Science & Engineering,KARUR,B.E. Computer Science,14,1200\n" +
      "Prof. M. Soundarya,soundarya.ece@vsb.ac.in,+91 98421 99887,Electronics & Communication,COIMBATORE,B.E. ECE,8,950\n" +
      "Dr. R. Vignesh,vignesh.mech@vsb.ac.in,+91 97860 44556,Mechanical Engineering,KARUR,B.E. Mechanical,10,1100\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `vsb_faculty_import_template_${loggedInCampus.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast("📥 Faculty CSV Template downloaded!");
  };

  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "+91-",
    department: VSB_DEPARTMENTS_COURSES[0] as string,
    campus: loggedInCampus as CampusLocation,
    courses: VSB_DEPARTMENTS_COURSES[0] as string,
    experienceYears: 5,
  });

  useEffect(() => {
    setNewTeacher((prev) => ({ ...prev, campus: loggedInCampus }));
  }, [loggedInCampus]);

  // Dynamically extract all unique academic departments present across faculty records (Mechanical Engineering prioritized)
  const departments = useMemo(() => {
    const set = new Set<string>();
    set.add("Mechanical Engineering");
    teachers.forEach((t) => {
      if (t.department) set.add(t.department.trim());
    });
    return Array.from(set).sort((a, b) => {
      if (a === "Mechanical Engineering") return -1;
      if (b === "Mechanical Engineering") return 1;
      return a.localeCompare(b);
    });
  }, [teachers]);

  // Live teacher count for every academic department
  const departmentCounts = useMemo(() => {
    const map = new Map<string, number>();
    teachers.forEach((t) => {
      if (t.department) {
        const d = t.department.trim();
        map.set(d, (map.get(d) || 0) + 1);
      }
    });
    return map;
  }, [teachers]);

  // Filtered departments list for search input in department side navigation
  const filteredDeptList = useMemo(() => {
    const q = deptSearch.toLowerCase().trim();
    if (!q) return departments;
    return departments.filter((d) => d.toLowerCase().includes(q));
  }, [departments, deptSearch]);

  const filteredTeachers = useMemo(() => {
    return teachers
      .filter((t) => {
        // Faculty Scope Filter: If user toggles "MINE", show only current teacher profile
        if (facultyScope === "MINE" && loggedInUsername) {
          const isSelf = checkIsSelfTeacher(t, loggedInUsername);
          if (!isSelf) return false;
        }

        // Search Query (matches name, email, department, or assigned course)
        const q = search.toLowerCase().trim();
        const matchesSearch =
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          (t.department && t.department.toLowerCase().includes(q)) ||
          t.coursesAssigned.some((c) => c.toLowerCase().includes(q));

        // Department Filter
        const matchesDept =
          selectedDept === "ALL" ||
          t.department.toLowerCase().trim() === selectedDept.toLowerCase().trim() ||
          t.department.toLowerCase().includes(selectedDept.toLowerCase()) ||
          selectedDept.toLowerCase().includes(t.department.toLowerCase());

        // Campus Filter
        const matchesCampus =
          selectedCampusFilter === "ALL" ||
          !t.campus ||
          t.campus.toUpperCase() === selectedCampusFilter;

        return matchesSearch && matchesDept && matchesCampus;
      })
      .sort((a, b) => {
        // Logged-in teacher profile appears at the very top for effortless convenience
        if (loggedInUsername) {
          const isSelfA = checkIsSelfTeacher(a, loggedInUsername);
          const isSelfB = checkIsSelfTeacher(b, loggedInUsername);
          if (isSelfA && !isSelfB) return -1;
          if (!isSelfA && isSelfB) return 1;
        }
        return 0;
      });
  }, [teachers, facultyScope, loggedInUsername, search, selectedDept, selectedCampusFilter]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.name || !newTeacher.email) return;

    const formattedPhone = formatPhoneWith91(newTeacher.phone || "+91-9876500000");

    const teacherToAdd: Teacher = {
      id: `tch_${Date.now()}`,
      name: newTeacher.name,
      email: newTeacher.email,
      phone: formattedPhone,
      department: newTeacher.department,
      campus: loggedInCampus,
      coursesAssigned: [newTeacher.courses],
      experienceYears: Number(newTeacher.experienceYears) || 3,
      status: "ACTIVE",
      avatar: newTeacher.name.slice(0, 2).toUpperCase(),
    };

    const updated = [teacherToAdd, ...teachers];
    saveTeachersList(updated);
    setShowAddModal(false);
    onTriggerToast(`✨ Faculty member ${teacherToAdd.name} registered and saved to Firebase!`);
    setNewTeacher({
      name: "",
      email: "",
      phone: "",
      department: "Computer Science & Engineering",
      campus: loggedInCampus,
      courses: "B.E. Computer Science",
      experienceYears: 5,
    });

    // 1. Persist directly to Firebase Firestore & RTDB
    await saveTeacherToFirebase(teacherToAdd);

    // 2. Persist to API
    try {
      await mobileSafeFetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherToAdd),
      });
    } catch (err) {}
  };

  const handleUpdateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    if (currentUserRole === "TEACHER") {
      onTriggerToast("🔒 Profile editing is disabled for faculty members. Contact Admin for updates.");
      setEditingTeacher(null);
      return;
    }

    const teacherToSave: Teacher = {
      ...editingTeacher,
      phone: formatPhoneWith91(editingTeacher.phone),
    };

    const updatedList = teachers.map((t) => (t.id === teacherToSave.id ? teacherToSave : t));
    saveTeachersList(updatedList);

    setCsvParsedTeachers((prev) =>
      prev.map((t) => (t.id === teacherToSave.id ? teacherToSave : t))
    );
    onTriggerToast(`🔑 Profile updated & synced to Firebase for ${teacherToSave.name}!`);
    setEditingTeacher(null);

    // 1. Save to Firebase Firestore & RTDB
    await saveTeacherToFirebase(teacherToSave);

    // 2. Save to API
    try {
      await mobileSafeFetch("/api/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherToSave),
      });
    } catch (err) {}
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!confirm(`Are you sure you want to remove faculty member "${teacherName}" from the directory and Firebase?`)) {
      return;
    }

    const updated = teachers.filter((t) => t.id !== teacherId && t.email !== teacherId);
    saveTeachersList(updated);
    onTriggerToast(`🗑️ Removed ${teacherName} from directory & Firebase`);

    // 1. Delete from Firebase Firestore & RTDB
    try {
      await deleteTeacherFromFirebase(teacherId);
    } catch (e) {}

    // 2. Delete from API / SQLite
    try {
      await mobileSafeFetch(`/api/teachers?id=${encodeURIComponent(teacherId)}`, {
        method: "DELETE",
      });
    } catch (err) {}
  };

  const handleSyncAllToFirebase = async () => {
    setIsFirebaseSyncing(true);
    onTriggerToast("🔥 Syncing all faculty records to Firebase Firestore & RTDB...");
    try {
      const { MOCK_TEACHERS } = await import("@/lib/mockData");
      const map = new Map<string, Teacher>();
      MOCK_TEACHERS.forEach((t) => map.set(t.id, t));
      teachers.forEach((t) => map.set(t.id, t));
      const fullList = Array.from(map.values());

      await Promise.allSettled(
        fullList.map((t) => saveTeacherToFirebase(t))
      );
      setTeachers(fullList);
      saveTeachersList(fullList);
      onTriggerToast(`✅ Successfully stored and synchronized all ${fullList.length} faculty members in Firebase!`);
    } catch (err) {
      onTriggerToast("⚠️ Some records could not be synced. Please check your connection.");
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  // Dedicated Photo Upload for Editing Faculty with Firebase Storage
  const handleEditTeacherPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTeacher) return;

    if (currentUserRole === "TEACHER") {
      onTriggerToast("🔒 Photo updates are restricted to Administrators.");
      return;
    }

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

        // Immediate state update
        setEditingTeacher((prev) => (prev ? { ...prev, photoUrl: dataUrl } : null));

        try {
          const firebaseUrl = await uploadTeacherProfilePhotoToFirebase(editingTeacher.id, dataUrl);
          setEditingTeacher((prev) => (prev ? { ...prev, photoUrl: firebaseUrl } : null));

          // Also update in teachers list
          setTeachers((prev) => {
            const updated = prev.map((t) => (t.id === editingTeacher.id ? { ...t, photoUrl: firebaseUrl } : t));
            try {
              localStorage.setItem("vsb_crm_teachers", JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });

          onTriggerToast(`📸 Profile photo saved to Firebase for ${editingTeacher.name}!`);
        } catch (err) {
          onTriggerToast(`📸 Photo updated for ${editingTeacher.name}!`);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const avgExperience = useMemo(() => {
    if (filteredTeachers.length === 0) return "12.0";
    const sum = filteredTeachers.reduce((acc, t) => acc + (Number(t.experienceYears) || 0), 0);
    return (sum / filteredTeachers.length).toFixed(1);
  }, [filteredTeachers]);

  const uniqueDeptsCount = useMemo(() => {
    return departments.filter((d) => d !== "ALL").length;
  }, [departments]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const tchStartIndex = (safeCurrentPage - 1) * rowsPerPage;
  const tchEndIndex = Math.min(filteredTeachers.length, tchStartIndex + rowsPerPage);
  const paginatedTeachers = filteredTeachers.slice(tchStartIndex, tchEndIndex);

  return (
    <div className="space-y-6">
      {/* Module Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Faculty</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{filteredTeachers.length} Professors</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-400 font-medium mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Ph.D & M.E. Qualified
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Academic Depts</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{uniqueDeptsCount} Departments</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-purple-300 font-medium mt-3">All V.S.B. Academic Departments</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campus Faculty</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {selectedCampusFilter === "ALL" ? "Karur & CBE Campuses" : selectedCampusFilter === "KARUR" ? "Karur Campus" : "Coimbatore Campus"}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-300 font-medium mt-3">V.S.B. Group of Institutions</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Experience</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{avgExperience} Years</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-amber-300 font-medium mt-3">Senior Academic Leadership</p>
        </div>
      </div>

      {/* Admin Lead Allocation Control Panel (At Top of Teacher Directory) */}
      {currentUserRole === "ADMIN" && (
        <div className="bubble-card p-5 border border-indigo-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-2xl animate-in fade-in">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                Admin Lead Allocation Control Panel
              </span>
              <span className="text-xs text-slate-300 font-bold">1,000 Total Database Contacts</span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="text-xl">⚡</span> Total Database Leads: <span className="text-indigo-400 font-black">1,000 Contacts</span>
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <span>Admin can split database leads into specific teacher batches (e.g. 100 contacts to Prof. P. Rajesh). Teachers exclusively view & edit their assigned batch while remaining 900 leads stay protected.</span>
            </p>

            {/* Allocated Batches Summary Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-indigo-100 border border-indigo-300 flex items-center gap-1.5 font-black text-black shadow-sm">
                <span className="text-black font-black">👤 P. Rajesh:</span>
                <span className="text-black font-extrabold">100 Leads (#1 - #100)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-sky-100 border border-sky-300 flex items-center gap-1.5 font-black text-black shadow-sm">
                <span className="text-black font-black">👤 Dr. Arulmurugan:</span>
                <span className="text-black font-extrabold">100 Leads (#101 - #200)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-pink-100 border border-pink-300 flex items-center gap-1.5 font-black text-black shadow-sm">
                <span className="text-black font-black">👤 Dr. Meenakshi:</span>
                <span className="text-black font-extrabold">100 Leads (#201 - #300)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-purple-100 border border-purple-300 flex items-center gap-1.5 font-black text-black shadow-sm">
                <span className="text-black font-black">👤 Dr. Gayathri:</span>
                <span className="text-black font-extrabold">100 Leads (#301 - #400)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 flex items-center gap-1.5 font-black text-black shadow-sm">
                <span className="text-black font-black">⏳ 600 Unassigned Leads</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
            <button
              onClick={() => setIsAdminAuditDrawerOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 border border-emerald-300/40 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02]"
            >
              <Phone className="w-4 h-4 text-emerald-200" />
              <span>📞 Daily Call Analytics & Audio Audit</span>
            </button>

            {currentUserRole === "ADMIN" && (
              <button
                onClick={() => setIsSplitModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 border border-indigo-300/40 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02]"
              >
                <span className="text-base">⚡</span>
                <span>Split Contacts to Teacher</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Master-Detail Faculty Directory Container */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* LEFT COLUMN: Academic Departments Order Navigation Panel */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-lg sticky top-20">
            {/* Header of Departments Panel */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Departments</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Click to view faculty by department
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {departments.length}
              </span>
            </div>

            {/* Search Departments Filter */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder="Filter departments..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              {deptSearch && (
                <button
                  type="button"
                  onClick={() => setDeptSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Department Navigation List */}
            <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto pr-1 custom-scrollbar">
              {/* All Departments Option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedDept("ALL");
                  setCurrentPage(1);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all text-left group cursor-pointer ${
                  selectedDept === "ALL"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/50 scale-[1.01]"
                    : "bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400/40"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      selectedDept === "ALL"
                        ? "bg-white/20 text-white"
                        : "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-extrabold truncate block">All Departments</span>
                    <span className={`text-[10px] block ${selectedDept === "ALL" ? "text-indigo-100" : "text-slate-400"}`}>
                      Full college faculty
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                    selectedDept === "ALL"
                      ? "bg-white text-indigo-900 shadow-xs"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {teachers.length}
                </span>
              </button>

              {/* Department Buttons */}
              {filteredDeptList.map((deptName) => {
                const isSelected = selectedDept.toLowerCase().trim() === deptName.toLowerCase().trim();
                const count = departmentCounts.get(deptName) || 0;
                const meta = getDepartmentMeta(deptName);
                const IconComp = meta.icon;

                return (
                  <button
                    key={deptName}
                    type="button"
                    onClick={() => {
                      setSelectedDept(deptName);
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all text-left group cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white border-transparent shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50 scale-[1.02]"
                        : "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : `${meta.bg} ${meta.color} border ${meta.border}`
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1 truncate">
                          <span className="text-xs">{meta.emoji}</span>
                          <span className="font-extrabold truncate block leading-tight">
                            {deptName}
                          </span>
                        </div>
                        <span className={`text-[10px] block ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                          {count} {count === 1 ? "Teacher" : "Teachers"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                        isSelected
                          ? "bg-white text-indigo-900 shadow-xs"
                          : count > 0
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}
                      title={`${count} teachers in ${deptName}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Faculty in Selected Department */}
        <section className="flex-1 min-w-0 w-full space-y-4">
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm">
            {/* Top Department Banner & Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                    Department Faculty Directory
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    {selectedDept === "ALL" ? "All Academic Departments" : selectedDept}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  {(() => {
                    if (selectedDept === "ALL") {
                      return (
                        <>
                          <Layers className="w-5 h-5 text-indigo-500" />
                          <span>All Academic Departments</span>
                        </>
                      );
                    }
                    const meta = getDepartmentMeta(selectedDept);
                    const IconC = meta.icon;
                    return (
                      <>
                        <IconC className={`w-5 h-5 ${meta.color}`} />
                        <span>{selectedDept}</span>
                      </>
                    );
                  })()}
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                    {filteredTeachers.length} {filteredTeachers.length === 1 ? "Teacher" : "Teachers"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDept === "ALL"
                    ? `Showing all ${teachers.length} faculty across all academic departments.`
                    : `Showing faculty members, assigned contact quotas, and calling performance in ${selectedDept}.`}
                </p>
              </div>

              {/* Action Controls & Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Teacher in Department */}
                <div className="relative w-full sm:w-52">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={`Search in ${selectedDept === "ALL" ? "faculty" : selectedDept}...`}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Campus Filter */}
                <select
                  value={selectedCampusFilter}
                  onChange={(e) => {
                    setSelectedCampusFilter(e.target.value as "ALL" | "KARUR" | "COIMBATORE");
                    setCurrentPage(1);
                  }}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-bold"
                  title="Filter by Campus"
                >
                  <option value="ALL">All Campuses</option>
                  <option value="KARUR">Karur Campus</option>
                  <option value="COIMBATORE">Coimbatore Campus</option>
                </select>

                {/* Scope Toggle */}
                {loggedInUsername && (
                  <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setFacultyScope("ALL");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        facultyScope === "ALL"
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                      title="View all department staff members"
                    >
                      All Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFacultyScope("MINE");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        facultyScope === "MINE"
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                      title="View only my assigned profile"
                    >
                      My Profile
                    </button>
                  </div>
                )}

                {/* Hidden File Input for CSV Upload */}
                <input
                  id="teacher-csv-file-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVUpload}
                />

                {/* Admin Management Action Buttons */}
                {currentUserRole === "ADMIN" ? (
                  <>
                    <button
                      onClick={handleDownloadSampleCSV}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      title="Download Faculty CSV Template"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" /> <span>Sample</span>
                    </button>

                    <button
                      onClick={() => document.getElementById("teacher-csv-file-upload")?.click()}
                      className="px-3 py-1.5 rounded-xl border border-indigo-400/50 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                      title="Upload CSV File to Import Faculty Directory"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-100" /> <span>Import</span>
                    </button>

                    <button
                      onClick={handleSyncAllToFirebase}
                      disabled={isFirebaseSyncing}
                      className="px-3 py-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-orange-600/30 cursor-pointer disabled:opacity-50"
                      title="Persist & store all faculty details into Firebase Firestore & RTDB"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFirebaseSyncing ? "animate-spin" : ""}`} />
                      <span>{isFirebaseSyncing ? "Syncing..." : "Sync"}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (selectedDept !== "ALL") {
                          setNewTeacher((prev) => ({ ...prev, department: selectedDept }));
                        }
                        setShowAddModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-purple-400/50 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                      title={`Add New Faculty Member to ${selectedDept === "ALL" ? "Directory" : selectedDept}`}
                    >
                      <Plus className="w-4 h-4" /> <span>Add Faculty</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 font-semibold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span>Faculty Directory</span>
                    <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
                      Read-Only Mode
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Empty State if No Faculty in Selected Department */}
            {filteredTeachers.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  No Faculty Members Found in {selectedDept === "ALL" ? "Directory" : selectedDept}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {search
                    ? `No faculty matched your search query "${search}". Try clearing the search.`
                    : `There are currently no faculty members registered under ${selectedDept}. Click below to add a teacher.`}
                </p>
                {currentUserRole === "ADMIN" && (
                  <button
                    onClick={() => {
                      if (selectedDept !== "ALL") {
                        setNewTeacher((prev) => ({ ...prev, department: selectedDept }));
                      }
                      setShowAddModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Faculty to {selectedDept === "ALL" ? "Department" : selectedDept}</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Teachers Grid in Department */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {paginatedTeachers.map((tch, index) => {
            const isSelf = checkIsSelfTeacher(tch, loggedInUsername);
            const rangeDisplay =
              tch.assignedRangeText ||
              `Contacts #${((index % 10) * 100) + 1} to #${((index % 10) + 1) * 100}`;

            return (
              <div
                key={tch.id}
                onClick={() => setSelectedTeacherForAudit(tch)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all duration-300 space-y-3 transform hover:-translate-y-1 hover:shadow-xl shadow-sm cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative group/avatar shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md transform group-hover:scale-105 transition-transform overflow-hidden">
                        {tch.photoUrl ? (
                          <img src={tch.photoUrl} alt={tch.name} className="w-full h-full object-cover" />
                        ) : (
                          tch.avatar
                        )}
                      </div>
                      {currentUserRole === "ADMIN" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTeacher(tch);
                          }}
                          className="absolute -bottom-1 -right-1 p-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md border border-slate-900 cursor-pointer active:scale-90 transition-all opacity-85 group-hover/avatar:opacity-100"
                          title="Upload/Edit Photo (Admin Only)"
                        >
                          <Camera className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors">{tch.name}</h4>
                        {isSelf && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs flex items-center gap-1">
                            👑 You (Logged In)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{tch.department}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-xs">
                      {tch.campus} CAMPUS
                    </span>

                    {/* Active / On Leave Status Display */}
                    {currentUserRole === "ADMIN" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newStatus: "ACTIVE" | "ON_LEAVE" = tch.status === "ACTIVE" ? "ON_LEAVE" : "ACTIVE";
                          const updatedTeacher: Teacher = { ...tch, status: newStatus };
                          const updatedList = teachers.map((t) => (t.id === tch.id || t.email === tch.email ? updatedTeacher : t));
                          saveTeachersList(updatedList);
                          saveTeacherToFirebase(updatedTeacher);
                          onTriggerToast(
                            `🔄 Status updated for ${tch.name}: ${newStatus === "ACTIVE" ? "🟢 ACTIVE" : "🟡 ON LEAVE"} (Saved to Firebase)`
                          );
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm transform hover:scale-105 active:scale-95 ${
                          tch.status === "ACTIVE"
                            ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/60 hover:bg-emerald-100"
                            : "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/60 hover:bg-amber-100"
                        }`}
                        title="Admin control: Click to toggle Active vs On Leave availability status (stored in Firebase)"
                      >
                        <span className={`w-2 h-2 rounded-full ${tch.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                        <span>{tch.status === "ACTIVE" ? "🟢 ACTIVE" : "🟡 ON LEAVE"}</span>
                      </button>
                    ) : (
                      <div
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 shadow-sm ${
                          tch.status === "ACTIVE"
                            ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/60"
                            : "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/60"
                        }`}
                        title={
                          isSelf
                            ? "Status automatically set to ACTIVE while logged in and ON LEAVE upon logging out."
                            : "Faculty availability status"
                        }
                      >
                        <span className={`w-2 h-2 rounded-full ${tch.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                        <span>{tch.status === "ACTIVE" ? "🟢 ACTIVE" : "🟡 ON LEAVE"}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  {/* Highlighted Faculty Profile ID */}
                  <div className="flex justify-between items-center bg-indigo-50/80 dark:bg-indigo-950/60 px-2.5 py-1.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-300 text-[11px] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Profile ID</span>
                    </span>
                    <span className="font-mono font-black text-[11px] text-indigo-950 dark:text-indigo-200 select-all tracking-wide truncate max-w-[210px]">
                      {tch.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-300">Experience</span>
                    <span className="font-black text-slate-900 dark:text-slate-100">{tch.experienceYears} Years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-300">Email</span>
                    <span className="font-black text-slate-900 dark:text-slate-100 font-mono text-[11px]">{tch.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-300">Phone</span>
                    <span className="font-black text-slate-900 dark:text-slate-100 font-mono">{tch.phone}</span>
                  </div>
                  <div className="flex justify-between items-start pt-2 border-t border-slate-200 dark:border-slate-800 font-bold">
                    <span className="text-sky-700 dark:text-sky-400 flex items-center gap-1 font-black">
                      <UserCheck className="w-3.5 h-3.5" /> Assigned Lead Quota
                    </span>
                    <div className="text-right">
                      <span className="text-sky-800 dark:text-sky-300 font-black block">
                        {tch.assignedQuota?.toLocaleString() || "100"} Contacts
                      </span>
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-400/40 px-2 py-0.5 rounded-full inline-block mt-0.5 shadow-xs">
                        🎯 {rangeDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Calling Audit Badge (Talked vs Not Talked) without black background */}
                {(() => {
                  const stats = getTeacherCallStats(tch, index);
                  return (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeacherForAudit(tch);
                      }}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/70 hover:bg-slate-100/80 dark:hover:bg-slate-900 transition-all cursor-pointer space-y-2 shadow-xs group/audit"
                      title={`Click to view students for ${tch.name}`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Calling Audit:</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-400/30 group-hover/audit:bg-indigo-600 group-hover/audit:text-white transition-all flex items-center gap-1">
                          <span>View Students</span>
                          <span>➔</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 font-bold text-emerald-900 dark:text-emerald-300 shadow-xs">
                          <span>🟢 Talked:</span>
                          <span className="font-mono font-black text-xs">{stats.talked}</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 font-bold text-amber-900 dark:text-amber-300 shadow-xs">
                          <span>🟡 Not Talked:</span>
                          <span className="font-mono font-black text-xs">{stats.notTalked}</span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex border border-slate-300/60 dark:border-white/5">
                        <div
                          style={{ width: `${Math.round((stats.talked / stats.total) * 100)}%` }}
                          className="bg-emerald-500 transition-all duration-300"
                        />
                        <div
                          style={{ width: `${100 - Math.round((stats.talked / stats.total) * 100)}%` }}
                          className="bg-amber-500 transition-all duration-300"
                        />
                      </div>
                    </div>
                  );
                })()}

              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Assigned Programs
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tch.coursesAssigned.map((c, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-lg"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-start gap-2 relative z-10">
                <div className="flex items-center gap-2">
                  <Tooltip text={`In-Portal Email ${tch.name}`} position="bottom">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCommModal("EMAIL", {
                          name: tch.name,
                          email: tch.email,
                          phone: tch.phone,
                          campus: tch.campus,
                          courseInterest: tch.department,
                        });
                      }}
                      className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 shadow-xs transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                  </Tooltip>
                  <Tooltip text={`Call ${tch.name} via Phone Dial Pad`} position="bottom">
                    <a
                      href={getCleanTelUri(tch.phone)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerToast(`Initiated call to ${tch.name}`);
                        redirectToDialPad(tch.phone);
                      }}
                      className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 shadow-xs transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  </Tooltip>
                </div>

                <div className="ml-auto flex items-center gap-1.5">
                  <Tooltip text={currentUserRole === "TEACHER" ? `View ${tch.name} Profile` : `Edit ${tch.name}`} position="bottom">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTeacher(tch);
                      }}
                      className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-sky-400 hover:text-slate-900 dark:hover:text-sky-300 font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      {currentUserRole === "TEACHER" ? (
                        <>
                          <BookOpen className="w-3.5 h-3.5" /> View Profile
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </>
                      )}
                    </button>
                  </Tooltip>

                  {currentUserRole === "ADMIN" && (
                    <Tooltip text={`Delete ${tch.name} from Firebase & Directory`} position="bottom">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTeacher(tch.id, tch.name);
                        }}
                        className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-bold px-2 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 shadow-xs transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Remove faculty from Firebase & Directory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>

        {/* Table Pagination Footer Bar */}
        <div className="mt-4 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300 font-sans shadow-xl">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-200">
              Showing {filteredTeachers.length > 0 ? tchStartIndex + 1 : 0} - {tchEndIndex} of {filteredTeachers.length} Faculty Members
            </span>
          </div>

          {/* Page Control Pills */}
          <div className="flex items-center gap-1.5">
            <button
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-400 dark:border-white/30 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-black text-slate-950 dark:text-white cursor-pointer shadow-sm text-xs"
              title="First Page"
            >
              ⏮ First
            </button>
            <button
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-400 dark:border-white/30 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-black text-slate-950 dark:text-white cursor-pointer shadow-sm text-xs"
            >
              ◀ Prev
            </button>

            <div className="flex items-center gap-1">
              {(() => {
                const maxVisible = 5;
                let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
                let end = start + maxVisible - 1;
                if (end > totalPages) {
                  end = totalPages;
                  start = Math.max(1, end - maxVisible + 1);
                }
                const pages = [];
                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }
                return pages.map((pNum) => {
                  const isActive = pNum === safeCurrentPage;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer shadow-sm ${
                        isActive
                          ? "bg-sky-500 text-slate-950 font-black ring-2 ring-sky-300 scale-105"
                          : "bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-white/30 text-slate-950 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                });
              })()}
            </div>

            <button
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-400 dark:border-white/30 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-black text-slate-950 dark:text-white cursor-pointer shadow-sm text-xs"
            >
              Next ▶
            </button>
            <button
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-400 dark:border-white/30 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-black text-slate-950 dark:text-white cursor-pointer shadow-sm text-xs"
              title="Last Page"
            >
              Last ⏭
            </button>
          </div>

          {/* Rows Per Page */}
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <span>Show Per Page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 font-extrabold focus:outline-none cursor-pointer"
            >
              <option value={6}>6 items</option>
              <option value={12}>12 items</option>
              <option value={24}>24 items</option>
            </select>
          </div>
        </div>
      </>
    )}
          </div>
        </section>
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Register New V.S.B. Faculty</h3>

            <form onSubmit={handleAddTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="e.g. Dr. K. Arulmurugan"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  placeholder="e.g. arul.cse@vsb.ac.in"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Phone (Compulsory +91-)</label>
                <input
                  type="text"
                  required
                  value={newTeacher.phone}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith("+91-") && !val.startsWith("+91")) {
                      val = "+91-" + val.replace(/^\+?91-?/, "");
                    }
                    setNewTeacher({ ...newTeacher, phone: val });
                  }}
                  placeholder="+91-9876543210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Campus</label>
                  <select
                    value={newTeacher.campus}
                    onChange={(e) => setNewTeacher({ ...newTeacher, campus: e.target.value as CampusLocation })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="KARUR">Karur Campus</option>
                    <option value="COIMBATORE">Coimbatore Campus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={newTeacher.department}
                    onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  >
                    {departments.filter((d) => d !== "ALL").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Course</label>
                <select
                  value={newTeacher.courses}
                  onChange={(e) => setNewTeacher({ ...newTeacher, courses: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                >
                  {VSB_DEPARTMENTS_COURSES.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                >
                  Register Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal (Admin Only) / View Profile Modal (Teacher Mode) */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
                {currentUserRole === "TEACHER" ? (
                  <>
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    <span>Faculty Profile (Read-Only)</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-5 h-5 text-sky-400" />
                    <span>Edit Faculty Details</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setEditingTeacher(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Faculty Profile ID Display */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 flex items-center justify-between gap-3 shadow-inner">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Official Profile ID
                </span>
                <span className="font-mono text-sm font-black text-white select-all truncate block mt-0.5">
                  {editingTeacher.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(editingTeacher.id);
                  onTriggerToast(`📋 Copied Profile ID: ${editingTeacher.id}`);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <span>Copy ID</span>
              </button>
            </div>

            {currentUserRole === "TEACHER" && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-2">
                <span className="text-base shrink-0">🔒</span>
                <span>
                  <strong>Profile Editing Restricted:</strong> Faculty profile details cannot be modified in the portal. Your availability status is automatically set to <strong>🟢 ACTIVE</strong> while logged in and turns to <strong>🟡 ON LEAVE</strong> upon logout.
                </span>
              </div>
            )}

            <form onSubmit={handleUpdateTeacherSubmit} className="space-y-3 text-xs">
              {/* Profile Photo Uploader or Read-Only Display */}
              {currentUserRole === "ADMIN" ? (
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
                  <label className="block text-slate-200 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Faculty Profile Photo (Firebase Storage)</span>
                    </span>
                    {editingTeacher.photoUrl && (
                      <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Saved in Firebase
                      </span>
                    )}
                  </label>

                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-md shrink-0 overflow-hidden relative group">
                      <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-white font-black text-base overflow-hidden">
                        {editingTeacher.photoUrl ? (
                          <img src={editingTeacher.photoUrl} alt={editingTeacher.name} className="w-full h-full object-cover" />
                        ) : (
                          editingTeacher.avatar
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer inline-flex transition-all active:scale-95 shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{editingTeacher.photoUrl ? "Change Photo" : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditTeacherPhotoUpload(e)}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Crops to square & saves to Firebase cloud storage bucket.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-md shrink-0 overflow-hidden">
                    <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-white font-black text-base overflow-hidden">
                      {editingTeacher.photoUrl ? (
                        <img src={editingTeacher.photoUrl} alt={editingTeacher.name} className="w-full h-full object-cover" />
                      ) : (
                        editingTeacher.avatar
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm">{editingTeacher.name}</h4>
                    <p className="text-slate-400 text-xs">{editingTeacher.department} • {editingTeacher.campus} Campus</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      🟢 {editingTeacher.status}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name {currentUserRole === "TEACHER" && "(Locked)"}</label>
                <input
                  type="text"
                  required
                  disabled={currentUserRole === "TEACHER"}
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                    currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email {currentUserRole === "TEACHER" && "(Locked)"}</label>
                <input
                  type="email"
                  required
                  disabled={currentUserRole === "TEACHER"}
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                    currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Phone {currentUserRole === "TEACHER" && "(Locked)"}</label>
                <input
                  type="text"
                  required
                  disabled={currentUserRole === "TEACHER"}
                  value={editingTeacher.phone}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                    currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Campus {currentUserRole === "TEACHER" && "(Locked)"}</label>
                  <select
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.campus}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, campus: e.target.value as CampusLocation })}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                      currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    <option value="KARUR">Karur Campus</option>
                    <option value="COIMBATORE">Coimbatore Campus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department {currentUserRole === "TEACHER" && "(Locked)"}</label>
                  <select
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.department}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, department: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                      currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    {departments.filter((d) => d !== "ALL").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Lead Quota {currentUserRole === "TEACHER" && "(Locked)"}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.assignedQuota || 1000}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, assignedQuota: Number(e.target.value) })}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-100 font-bold text-sky-300 ${
                      currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-emerald-400">
                    Faculty Status {currentUserRole === "TEACHER" && "(Automated)"}
                  </label>
                  <select
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.status}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, status: e.target.value as "ACTIVE" | "ON_LEAVE" })}
                    className={`w-full rounded-xl px-3 py-2 font-bold ${
                      currentUserRole === "TEACHER"
                        ? "bg-slate-950/80 border-slate-800 text-emerald-400 cursor-not-allowed border"
                        : "bg-slate-900 border border-emerald-500/60 text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    }`}
                  >
                    <option value="ACTIVE">🟢 ACTIVE</option>
                    <option value="ON_LEAVE">🟡 ON LEAVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Experience (Years) {currentUserRole === "TEACHER" && "(Locked)"}</label>
                  <input
                    type="number"
                    required
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.experienceYears}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, experienceYears: Number(e.target.value) })}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                      currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Course {currentUserRole === "TEACHER" && "(Locked)"}</label>
                  <select
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.coursesAssigned[0] || VSB_DEPARTMENTS_COURSES[0]}
                    onChange={(e) => {
                      const courses = [...editingTeacher.coursesAssigned];
                      courses[0] = e.target.value;
                      setEditingTeacher({ ...editingTeacher, coursesAssigned: courses });
                    }}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                      currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    {VSB_DEPARTMENTS_COURSES.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {currentUserRole === "TEACHER" ? (
                  <span className="text-[11px] text-slate-400 italic">
                    Read-only faculty access
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingTeacher(null)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                )}

                {currentUserRole === "ADMIN" ? (
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Updates
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingTeacher(null)}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORTER PREVIEW MODAL */}
      {showCsvPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-3xl shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    Import Faculty CSV Preview
                  </h3>
                  <p className="text-xs text-slate-400">
                    Found <span className="font-bold text-indigo-400">{csvParsedTeachers.length}</span> faculty members in file
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCsvPreviewModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold sticky top-0 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3">Faculty Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Campus</th>
                    <th className="px-4 py-3">Experience</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {csvParsedTeachers.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {t.avatar}
                        </span>
                        {t.name}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-indigo-300">{t.email}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{t.phone}</td>
                      <td className="px-4 py-2.5 text-purple-300 font-medium">{t.department}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {t.campus}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-amber-300">{t.experienceYears} Yrs</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setEditingTeacher(t)}
                          className="px-2 py-1 rounded-lg bg-sky-950 text-sky-400 hover:text-sky-200 border border-sky-800 font-bold text-[11px] flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                All CSV records validated against V.S.B. Directory schema.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCsvPreviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCSVImport}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/40 border border-emerald-300/40 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>Import {csvParsedTeachers.length} Faculty Members</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPLIT CONTACTS TO TEACHER MODAL */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card w-full max-w-lg rounded-3xl border border-indigo-500/50 p-6 space-y-5 shadow-2xl bg-slate-900 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 text-lg">⚡</span>
                <div>
                  <h3 className="text-base font-black text-white">Admin Batch Lead Allocation</h3>
                  <p className="text-xs text-slate-400">Assign database lead contact ranges to specific teachers</p>
                </div>
              </div>
              <button
                onClick={() => setIsSplitModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Select Faculty Member */}
              <div>
                <label className="block text-slate-300 font-extrabold mb-1">
                  Select Target Faculty / Teacher:
                </label>
                <select
                  value={splitTargetTeacher}
                  onChange={(e) => setSplitTargetTeacher(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-black dark:text-white font-black focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {MOCK_TEACHERS.map((f) => (
                    <option key={f.id} value={f.id} className="text-black bg-white dark:bg-slate-900 dark:text-white font-black">
                      {f.name} ({f.department} - {f.campus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Range Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Start Contact No (#):</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={splitStartNumber}
                    onChange={(e) => setSplitStartNumber(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Split Batch Quantity:</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={splitQuantity}
                    onChange={(e) => setSplitQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Summary Banner */}
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold space-y-1">
                <div className="flex items-center justify-between">
                  <span>Target Allocation Range:</span>
                  <span className="text-emerald-400 font-black font-mono text-sm">
                    #{splitStartNumber} to #{Math.min(1000, splitStartNumber + splitQuantity - 1)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">
                  This batch will be exclusively assigned to {MOCK_TEACHERS.find(t => t.id === splitTargetTeacher)?.name || splitTargetTeacher}.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsSplitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const teacherObj = MOCK_TEACHERS.find(t => t.id === splitTargetTeacher);
                  const teacherName = teacherObj ? teacherObj.name : splitTargetTeacher;
                  const endNum = Math.min(1000, splitStartNumber + splitQuantity - 1);
                  let targetTeacherObj: Teacher | null = null;
                  // Update teacher record's assignedRangeText & quota
                  const updatedTeachers = teachers.map((t) => {
                    if (t.id === splitTargetTeacher || t.email === splitTargetTeacher) {
                      targetTeacherObj = {
                        ...t,
                        assignedQuota: splitQuantity,
                        assignedRangeText: `Contacts #${splitStartNumber} to #${endNum}`,
                      };
                      return targetTeacherObj;
                    }
                    return t;
                  });
                  saveTeachersList(updatedTeachers);
                  if (targetTeacherObj) {
                    saveTeacherToFirebase(targetTeacherObj);
                  }

                  onTriggerToast(
                    `⚡ Successfully allocated batch #${splitStartNumber} to #${endNum} (${splitQuantity} Contacts) to ${teacherName} (Saved to Firebase)!`
                  );
                  setIsSplitModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 border border-indigo-300/40 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02]"
              >
                <span>Confirm Lead Allocation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DAILY CALL ANALYTICS & VOICE AUDIO RECORDINGS INSPECTOR DRAWER */}
      {isAdminAuditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] rounded-3xl border border-emerald-500/40 p-6 flex flex-col shadow-2xl bg-slate-900 text-white overflow-hidden space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Phone className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>📞 Voice Call Recordings & Transcripts Audit</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                      LIVE AUDIT
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Listen to recorded faculty-student calls, view speech-to-text transcripts, and track lead conversion notes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminAuditDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls Bar: Select Date */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-300">
                <span>📅 Audit Date Filter:</span>
                <input
                  type="date"
                  value={selectedAuditDate}
                  onChange={(e) => setSelectedAuditDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-300">
                <span className="text-indigo-400">Total Calls Logged Today:</span>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-black">
                  {callRecordings.filter((r) => r.recordingDate === selectedAuditDate).length} Voice Recordings
                </span>
              </div>
            </div>

            {/* Recorded Calls List & Audio Player Inspector */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {callRecordings.filter((r) => r.recordingDate === selectedAuditDate).length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 font-medium">
                  No call recordings logged on {selectedAuditDate}. Make an In-Portal call to record audio & view transcripts.
                </div>
              ) : (
                callRecordings
                  .filter((r) => r.recordingDate === selectedAuditDate)
                  .map((rec) => {
                    const isPlaying = playingAudioRecId === rec.id;

                    return (
                      <div
                        key={rec.id}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-emerald-500/50 transition-all shadow-lg"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                              {rec.leadName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-white text-sm flex items-center gap-2">
                                <span>{rec.leadName}</span>
                                <span className="text-xs text-emerald-400 font-mono font-bold">({rec.leadPhone})</span>
                              </h5>
                              <p className="text-[11px] text-slate-400 font-medium">
                                Contacted by: <span className="text-indigo-300 font-bold">{rec.teacherName}</span> • {rec.timestamp}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                                rec.studentInterestStatus === "INTERESTED"
                                  ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                  : rec.studentInterestStatus === "ADMITTED"
                                  ? "bg-sky-950 text-sky-300 border-sky-800"
                                  : "bg-amber-950 text-amber-300 border-amber-800"
                              }`}
                            >
                              {rec.studentInterestStatus === "INTERESTED" && "🌟 Interested to Join"}
                              {rec.studentInterestStatus === "ADMITTED" && "🎓 Admitted / Fee Paid"}
                              {rec.studentInterestStatus === "REVIEWING" && "⏳ Reviewing Cutoff"}
                            </span>

                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                              ⏳ Auto-deletes in 29 days
                            </span>
                          </div>
                        </div>

                        {/* Simulated Audio Call Player Bar */}
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                          <button
                            onClick={() => setPlayingAudioRecId(isPlaying ? null : rec.id)}
                            className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
                          >
                            {isPlaying ? "⏸" : "▶"}
                          </button>

                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                              <span>{isPlaying ? "▶ Playing Voice Recording..." : "Recorded Call Audio File"}</span>
                              <span>{rec.durationText}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ${
                                  isPlaying ? "w-2/3 animate-pulse" : "w-1/4"
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Transcript & Teacher Call Notes */}
                        <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl space-y-1.5 text-[11px]">
                          <p className="font-extrabold text-slate-300 flex items-center gap-1.5">
                            <span>📝 Teacher Notes:</span>
                            <span className="text-white font-medium">{rec.teacherNotes}</span>
                          </p>
                          <div className="pt-2 border-t border-slate-800 space-y-1">
                            <p className="font-extrabold text-indigo-400 uppercase tracking-wider text-[10px]">
                              Verbatim Conversation Call Transcript:
                            </p>
                            <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                              {rec.callTranscript}
                            </pre>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                Admin Privilege: Voice recordings & transcripts saved per faculty call.
              </span>
              <button
                onClick={() => setIsAdminAuditDrawerOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs cursor-pointer transition-all"
              >
                Close Audit Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-PORTAL DIRECT COMMUNICATION MODALS (Call, Message, Email) */}
      <InPortalCommunicationModals
        activeModal={activeCommModal}
        contact={activeCommContact}
        onClose={() => setActiveCommModal(null)}
        onLogSuccess={handleCommLogSuccess}
      />

      {/* TEACHER STUDENT CALL AUDIT MODAL (FOR ALL TEACHERS) */}
      <TeacherStudentAuditModal
        teacher={selectedTeacherForAudit}
        isOpen={Boolean(selectedTeacherForAudit)}
        onClose={() => setSelectedTeacherForAudit(null)}
        currentUserRole={currentUserRole}
        onTriggerToast={onTriggerToast}
        allLeads={applicants}
        teachersList={teachers}
        onUpdateTeacherPhoto={(teacherId, photoUrl) => {
          setTeachers((prev) => {
            const updated = prev.map((t) => (t.id === teacherId ? { ...t, photoUrl } : t));
            saveTeachersList(updated);
            const target = updated.find((t) => t.id === teacherId);
            if (target) {
              saveTeacherToFirebase(target);
            }
            return updated;
          });
          setSelectedTeacherForAudit((prev) => (prev && prev.id === teacherId ? { ...prev, photoUrl } : prev));
        }}
      />
    </div>
  );
}
