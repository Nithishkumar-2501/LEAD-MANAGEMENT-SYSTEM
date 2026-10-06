"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LayoutDashboard, UserCheck, Plus, BarChart3, BookOpen, ShieldCheck, Mic, Lock, AlertTriangle, ShieldAlert, Crown } from "lucide-react";
import {
  isCollegeSuspendedForCurrentEnvironment,
  listenToCollegeLicenses,
  forceFetchLatestLicenseFromCloud,
  CollegeClientLicense,
  GlobalLockoutState,
} from "@/lib/collegeLicenseService";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MetricCards from "@/components/MetricCards";
import LeadFunnelChart from "@/components/LeadFunnelChart";
import ApplicantsTable from "@/components/ApplicantsTable";
import TaskSidebar from "@/components/TaskSidebar";
import CreateApplicationModal from "@/components/CreateApplicationModal";
import ApplicantDetailModal from "@/components/ApplicantDetailModal";
import LoginModal from "@/components/LoginModal";
import TeacherModule from "@/components/TeacherModule";
import StudentApplicationsModule from "@/components/StudentApplicationsModule";
import CampusCourseModule from "@/components/CampusCourseModule";
import PaymentBillingModule from "@/components/PaymentBillingModule";
import AdminSettingsModule from "@/components/AdminSettingsModule";
import ContactDirectoryModule from "@/components/ContactDirectoryModule";
import AddQuickLeadModal from "@/components/AddQuickLeadModal";
import SocialMediaPlatformModule from "@/components/SocialMediaPlatformModule";
import AdminDashboardView from "@/components/AdminDashboardView";
import UserDashboardView from "@/components/UserDashboardView";
import MarketingDashboardView from "@/components/MarketingDashboardView";
import EchoDashboardView from "@/components/EchoDashboardView";
import AiIntelligenceModule from "@/components/AiIntelligenceModule";
import ApplicationManagerModule from "@/components/ApplicationManagerModule";
import NoraAiDatabaseModal from "@/components/NoraAiDatabaseModal";
import LeadLimitOverageModal from "@/components/LeadLimitOverageModal";
import CreatorControlModule from "@/components/CreatorControlModule";
import CsvLeadsImportModal from "@/components/CsvLeadsImportModal";
import CreatorLeadsSummaryView from "@/components/CreatorLeadsSummaryView";
import CreatorTeachersSummaryView from "@/components/CreatorTeachersSummaryView";
import {
  evaluateLeadQuota,
  recordOverageLeadsToAnnualRenewal,
  QuotaEvaluation,
  MAX_FREE_LEAD_LIMIT,
} from "@/lib/leadQuotaService";
import { logoutWithRealtimeAuth } from "@/lib/authService";
import { mobileSafeFetch, isCapacitorNative } from "@/lib/mobileFetch";
import { redirectToWhatsApp, getDefaultAdmissionWhatsAppText } from "@/lib/whatsappSender";
import { redirectToSms, getDefaultAdmissionSmsText } from "@/lib/smsSender";
import {
  saveStudentToFirebase,
  deleteStudentFromFirebase,
  isLeadDeleted,
  markLeadAsDeleted,
  fetchStudentsFromFirestore,
  fetchStudentsFromRTDB,
  subscribeToFirebaseStudents,
  fetchTeachersFromFirebase,
  updateTeacherOnlineStatus,
  StudentRecord,
} from "@/lib/firebaseSync";
import { isLeadAssignedToTeacher } from "@/lib/teacherAssignment";

import {
  User,
  Lead,
  Application,
  Task,
  Payment,
  SummaryMetrics,
  LeadStatusCounts,
  ActiveTab,
  CampusLocation,
  TaskType,
} from "@/types/crm";

import {
  MOCK_ADMIN_USER,
  MOCK_TODAYS_TASKS,
  MOCK_PAYMENTS,
} from "@/lib/mockData";

export default function DashboardPage() {
  // Always start with login page required whenever the application is opened
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("ADMIN_DASHBOARD");
  const [selectedCampus, setSelectedCampus] = useState<CampusLocation>("KARUR");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loggedInCampus, setLoggedInCampus] = useState<"KARUR" | "COIMBATORE">("KARUR");
  const [currentUserRole, setCurrentUserRole] = useState<"ADMIN" | "TEACHER" | "CREATOR">("ADMIN");
  const [loggedInUsername, setLoggedInUsername] = useState<string>("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sub-modules role: Creator has full administrative privileges across all CRM screens
  const effectiveSubRole: "ADMIN" | "TEACHER" = currentUserRole === "TEACHER" ? "TEACHER" : "ADMIN";

  const [applicants, setApplicants] = useState<(Lead & { application: Application })[]>([]);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TODAYS_TASKS);

  // Real-time Institutional Access Suspension state (controlled by Root Creator)
  const [institutionSuspension, setInstitutionSuspension] = useState<{
    isSuspended: boolean;
    platform: "WEB" | "MOBILE";
    college?: CollegeClientLicense;
    isGlobal?: boolean;
    reason?: string;
  }>({ isSuspended: false, platform: "WEB" });

  useEffect(() => {
    const evaluateSuspension = (overrideColleges?: CollegeClientLicense[], overrideGlobal?: GlobalLockoutState) => {
      if (currentUserRole !== "CREATOR") {
        const check = isCollegeSuspendedForCurrentEnvironment(loggedInCampus || undefined, overrideColleges, overrideGlobal);
        setInstitutionSuspension(check);
      } else {
        setInstitutionSuspension({ isSuspended: false, platform: "WEB" });
      }
    };

    evaluateSuspension();
    forceFetchLatestLicenseFromCloud().then((res) => {
      if (res) {
        evaluateSuspension(res.colleges, res.globalLockout);
      }
    });

    const unsubscribe = listenToCollegeLicenses((updatedColleges, updatedGlobalLockout) => {
      evaluateSuspension(updatedColleges, updatedGlobalLockout);
    });
    return () => unsubscribe();
  }, [currentUserRole, loggedInCampus]);

  // Security & Data Protection: Block copying, cutting, and context menu app-wide
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.getAttribute("contenteditable") === "true");
      if (!isInput) {
        e.preventDefault();
        alert("🚫 Copying student data is strictly disabled by security policy.");
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.getAttribute("contenteditable") === "true");
      if (!isInput) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const activeEl = e.target as HTMLElement;
      const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
      if (!isInput) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        const activeEl = document.activeElement;
        const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.getAttribute("contenteditable") === "true");
        if (!isInput) {
          e.preventDefault();
          alert("🚫 Copying student data is strictly disabled by security policy.");
        }
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Action Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuickLeadModalOpen, setIsQuickLeadModalOpen] = useState(false);
  const [isNoraModalOpen, setIsNoraModalOpen] = useState(false);
  const [noraInitialQuery, setNoraInitialQuery] = useState("");

  // Lead Quota (1,00,000 limit) Overage Authorization Modal State
  const [quotaOverageModal, setQuotaOverageModal] = useState<{
    isOpen: boolean;
    candidateName: string;
    incomingCount: number;
    evaluation: QuotaEvaluation;
    onAuthorize: () => Promise<void> | void;
  } | null>(null);

  // CSV Leads File Import Modal State (Counts leads in CSV and adds to 1,00,000 quota)
  const [csvImportModal, setCsvImportModal] = useState<{
    isOpen: boolean;
    fileName: string;
    leads: (Lead & { application: Application })[];
  } | null>(null);
  const [isProcessingCsvImport, setIsProcessingCsvImport] = useState(false);

  const handleRequestCsvImport = useCallback((newLeads: (Lead & { application: Application })[], fileName: string = "uploaded_leads.csv") => {
    if (!newLeads || newLeads.length === 0) {
      triggerToast(`⚠️ No valid student lead records found in "${fileName}".`);
      return;
    }

    setCsvImportModal({
      isOpen: true,
      fileName,
      leads: newLeads,
    });
  }, [triggerToast]);

  const handleConfirmCsvImport = async (newLeads: (Lead & { application: Application })[]) => {
    if (!newLeads || newLeads.length === 0) return;
    setIsProcessingCsvImport(true);

    try {
      const fileName = csvImportModal?.fileName || "uploaded_leads.csv";
      const incomingCount = newLeads.length;
      const evaluation = evaluateLeadQuota(applicants.length, incomingCount);

      // If overage leads exist beyond 1,00,000 quota, record surcharge to Annual Renewal
      if (evaluation.requiresOverageAuthorization && evaluation.overageLeadsCount > 0) {
        recordOverageLeadsToAnnualRenewal({
          leadName: `CSV Import (${fileName} - ${incomingCount} leads)`,
          count: evaluation.overageLeadsCount,
          source: `CSV File: ${fileName}`,
          approvedBy: loggedInUsername,
        });
      }

      // Update in-memory state and localStorage cache
      setApplicants((prev) => {
        const updated = [...newLeads, ...prev];
        try {
          localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      if (newLeads.length > 0) {
        handleSelectApplicant(newLeads[0]);
      }

      const newTotal = applicants.length + incomingCount;
      const remaining = Math.max(0, MAX_FREE_LEAD_LIMIT - newTotal);

      setCsvImportModal(null);

      if (evaluation.requiresOverageAuthorization) {
        triggerToast(`💳 Added ${incomingCount} lead(s) from "${fileName}"! Database total: ${newTotal.toLocaleString("en-IN")} / 1,00,000. ₹${evaluation.overageTotalCost.toLocaleString("en-IN")} added to Annual Renewal.`);
      } else {
        triggerToast(`📥 Added ${incomingCount} lead(s) from "${fileName}"! Database total: ${newTotal.toLocaleString("en-IN")} / 1,00,000 (${remaining.toLocaleString("en-IN")} remaining).`);
      }

      // Persist all imported leads to Firebase Firestore
      for (const lead of newLeads) {
        await saveStudentToFirebase(lead).catch((err) => console.warn("Notice saving lead to Firebase:", err));
      }
      triggerToast(`🔥 All ${incomingCount} student lead(s) from "${fileName}" saved to Firebase!`);
    } catch (err) {
      console.error("Error during CSV lead import:", err);
      triggerToast("❌ Error saving leads to database. Please try again.");
    } finally {
      setIsProcessingCsvImport(false);
    }
  };

  const handleOpenNora = (query?: string) => {
    setNoraInitialQuery(query || "");
    setIsNoraModalOpen(true);
  };

  // Synchronize activeTab from URL search params (e.g. ?tab=CONTACT_DIRECTORY or ?tab=CONTACTS)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        if (tabParam === "CONTACT_DIRECTORY" || tabParam === "LEADS") {
          setActiveTab("CONTACTS");
        } else {
          setActiveTab(tabParam as ActiveTab);
        }
      }
    }
  }, []);

  // Ensure strict separation: Teachers get Lead Dashboard (USER_DASHBOARD), Admin gets Admin Dashboard (ADMIN_DASHBOARD)
  useEffect(() => {
    if (currentUserRole === "TEACHER") {
      if (
        activeTab === "TEACHERS" ||
        activeTab === "ADMIN_DASHBOARD" ||
        activeTab === "ADMISSIONS" ||
        activeTab === "MARKETING_DASHBOARD" ||
        activeTab === "APPLICATION_MANAGER" ||
        activeTab === "PAYMENTS" ||
        activeTab === "SETTINGS" ||
        activeTab === "CREATOR_CONTROL"
      ) {
        setActiveTab("USER_DASHBOARD");
      }
    } else if (currentUserRole === "ADMIN") {
      if (activeTab === "USER_DASHBOARD" || activeTab === "CREATOR_CONTROL") {
        setActiveTab("ADMIN_DASHBOARD");
      }
    } else if (currentUserRole === "CREATOR") {
      const isMasterCreator =
        loggedInUsername?.toLowerCase().trim() === "spherexnithish#" ||
        sessionStorage.getItem("vsb_logged_in_user")?.toLowerCase().trim() === "spherexnithish#";
      if (!isMasterCreator && activeTab === "CREATOR_CONTROL") {
        setActiveTab("ADMIN_DASHBOARD");
      }
    }
  }, [currentUserRole, activeTab, loggedInUsername]);

  // Reusable Firebase and Database sync helper
  const applyFirebaseLeads = useCallback((fbLeads: StudentRecord[]) => {
    if (!fbLeads || fbLeads.length === 0) return;

    const activeFbLeads = fbLeads.filter((fb) => fb.id && !isLeadDeleted(fb.id));

    setApplicants((prev) => {
      const map = new Map<string, Lead & { application: Application }>();
      // Keep existing leads that are NOT deleted
      prev.filter((p) => !isLeadDeleted(p.id)).forEach((item) => map.set(item.id, item));

      activeFbLeads.forEach((fb) => {
        if (fb.id) {
          const existing = map.get(fb.id);
          const defaultApp: Application = {
            id: `app_${fb.id}`,
            leadId: fb.id,
            stage: "INQUIRY",
            marks10th: (fb as any).marks10th || existing?.application?.marks10th || 85,
            marks12th: (fb as any).marks12th || existing?.application?.marks12th || 85,
            paymentStatus: "PENDING",
          };
          const app = (fb.application || existing?.application || defaultApp) as Application;
          map.set(fb.id, {
            ...existing,
            ...fb,
            id: fb.id,
            leadId: fb.id,
            campus: fb.campus || "KARUR",
            courseInterest: fb.courseInterest || "B.E. Computer Science and Engineering",
            status: fb.status || "NEW",
            application: app,
          } as Lead & { application: Application });
        }
      });

      const merged = Array.from(map.values());
      // Sort numerically (1, 2, 3...)
      merged.sort((a, b) => {
        const numA = parseInt(a.id, 10);
        const numB = parseInt(b.id, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA)) return -1;
        if (!isNaN(numB)) return 1;
        return a.name.localeCompare(b.name);
      });
      try {
        localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(merged));
      } catch (err) {}
      return merged;
    });
  }, []);

  const handleReloadLeads = useCallback(async () => {
    try {
      const res = await mobileSafeFetch("/api/applications");
      if (res) {
        const data = await res.json();
        if (data?.leads && Array.isArray(data.leads) && data.leads.length > 0) {
          const dbLeads = (data.leads as (Lead & { application: Application })[]).filter(
            (l) => !isLeadDeleted(l.id)
          );
          const map = new Map<string, Lead & { application: Application }>();
          dbLeads.forEach((item) => map.set(item.id, item));
          const merged = Array.from(map.values());
          setApplicants(merged);
          try {
            localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(merged));
          } catch (err) {}
        }
      }
      const list = await fetchStudentsFromFirestore();
      if (list && list.length > 0) {
        applyFirebaseLeads(list);
      }
    } catch (err) {
      console.warn("Reload notice:", err);
    }
  }, [applyFirebaseLeads]);

  // Load leads from Prisma Database on mount — database is the single source of truth
  useEffect(() => {
    // 1. Show cached leads instantly while the API loads (excluding deleted leads)
    try {
      const cached = localStorage.getItem("vsb_firebase_leads_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validCached = parsed.filter((item) => !isLeadDeleted(item.id));
          setApplicants(validCached);
        }
      }
    } catch (e) {
      console.warn("Local storage cache load notice:", e);
    }

    // 2. Fetch from Prisma Database API — this is the PERMANENT source of truth
    mobileSafeFetch("/api/applications")
      .then((res) => res ? res.json() : null)
      .then((data) => {
        if (data?.leads && Array.isArray(data.leads) && data.leads.length > 0) {
          const dbLeads = (data.leads as (Lead & { application: Application })[]).filter(
            (l) => !isLeadDeleted(l.id)
          );
          setApplicants((prev) => {
            const map = new Map<string, Lead & { application: Application }>();
            prev.filter((p) => !isLeadDeleted(p.id)).forEach((item) => map.set(item.id, item));
            dbLeads.forEach((item) => map.set(item.id, item));
            const merged = Array.from(map.values());
            try {
              localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(merged));
            } catch (err) {}
            return merged;
          });
        } else {
          // Keep valid real leads without falling back to mock records
          setApplicants((prev) => prev.filter((p) => !isLeadDeleted(p.id)));
        }
      })
      .catch((err) => {
        console.warn("Prisma API load notice:", err);
        setApplicants((prev) => prev.filter((p) => !isLeadDeleted(p.id)));
      });

    fetchStudentsFromFirestore().then((list) => {
      if (list && list.length > 0) {
        applyFirebaseLeads(list);
      } else {
        fetchStudentsFromRTDB().then((rtdbList) => {
          if (rtdbList && rtdbList.length > 0) {
            applyFirebaseLeads(rtdbList);
          }
        });
      }
    });

    const unsubscribe = subscribeToFirebaseStudents((liveList) => {
      applyFirebaseLeads(liveList);
    });

    // Auto-seed and synchronize all faculty records to Firebase Firestore & RTDB on app startup
    fetchTeachersFromFirebase().catch((err) => {
      console.warn("Initial Firebase teachers synchronization notice:", err);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, applyFirebaseLeads]);

  // Dynamic calculations based on selected campus
  const activeCampusLeads = applicants.filter((item) => selectedCampus === "ALL" || !item.campus || item.campus === selectedCampus);
  const totalLeadCount = activeCampusLeads.length > 0 ? activeCampusLeads.length : applicants.length;

  const dynamicMetrics: SummaryMetrics = {
    totalLeads: totalLeadCount,
    leadsTrend: 14.2,
    applicationsVerified: activeCampusLeads.filter(a => a.status === "ADMITTED" || a.status === "IN_REVIEW").length || Math.min(10, totalLeadCount),
    docsVerifiedTrend: 8.5,
    seatsFilled: activeCampusLeads.filter(a => a.status === "ADMITTED").length || Math.min(5, totalLeadCount),
    seatsFilledTrend: 18.0,
    totalRevenue: (activeCampusLeads.filter(a => a.status === "ADMITTED").length || Math.min(5, totalLeadCount)) * 95000,
    revenueTrend: 12.4,
  };

  const dynamicStatusCounts: LeadStatusCounts = {
    NEW: activeCampusLeads.filter(c => c.status === "NEW").length,
    CONTACTED: activeCampusLeads.filter(c => c.status === "CONTACTED").length,
    IN_REVIEW: activeCampusLeads.filter(c => c.status === "IN_REVIEW").length,
    ADMITTED: activeCampusLeads.filter(c => c.status === "ADMITTED").length,
    REJECTED: activeCampusLeads.filter(c => c.status === "REJECTED").length,
  };

  // Filter tasks dynamically based on campus of the associated lead and teacher ownership
  const filteredTasks = tasks.filter((t) => {
    const lead = applicants.find((l) => l.id === t.leadId);
    if (currentUserRole === "TEACHER") {
      if (!lead || !isLeadAssignedToTeacher(lead, loggedInUsername, loggedInCampus)) {
        return false;
      }
    }
    if (!lead) return true;
    if (selectedCampus === "ALL") return true;
    return lead.campus === selectedCampus;
  });

  // Modals
  const [selectedApplicant, setSelectedApplicant] = useState<(Lead & { application: Application }) | null>(null);

  const [theme, setTheme] = useState<"LIGHT" | "DARK">("DARK");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("vsb_theme") as "LIGHT" | "DARK") || "DARK";
    setTheme(savedTheme);
    if (savedTheme === "LIGHT") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleThemeChange = (newTheme: "LIGHT" | "DARK") => {
    setTheme(newTheme);
    localStorage.setItem("vsb_theme", newTheme);
    if (newTheme === "LIGHT") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
    triggerToast(`Switched theme mode to ${newTheme === "LIGHT" ? "☀️ Light Mode" : "🌙 Dark Mode"}`);
  };

  useEffect(() => {
    // Ensure lingering persistent auth is purged so reopening app always requires fresh login
    try {
      localStorage.removeItem("vsb_admin_auth");
      localStorage.removeItem("vsb_logged_in_user");
      localStorage.removeItem("vsb_logged_in_role");
      localStorage.removeItem("vsb_logged_in_campus");
    } catch (e) {}
    setIsAuthenticated(false);
  }, []);

  // Sync teacher status to ON_LEAVE if the browser tab is closed/unloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      const role = sessionStorage.getItem("vsb_logged_in_role");
      const user = sessionStorage.getItem("vsb_logged_in_user");
      const campus = sessionStorage.getItem("vsb_logged_in_campus") as "KARUR" | "COIMBATORE";
      if (role === "TEACHER" && user) {
        updateTeacherOnlineStatus(user, campus, "ON_LEAVE").catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleLoginSuccess = async (campus: "KARUR" | "COIMBATORE", role: "ADMIN" | "TEACHER" | "CREATOR", username: string) => {
    // Security check: non-creator users cannot log into a suspended college or host
    if (role !== "CREATOR") {
      let freshColleges: CollegeClientLicense[] | undefined;
      let freshGlobal: GlobalLockoutState | undefined;
      try {
        const fresh = await forceFetchLatestLicenseFromCloud();
        freshColleges = fresh?.colleges;
        freshGlobal = fresh?.globalLockout;
      } catch (e) {}

      const suspensionCheck = isCollegeSuspendedForCurrentEnvironment(campus, freshColleges, freshGlobal);
      if (suspensionCheck.isSuspended) {
        setInstitutionSuspension(suspensionCheck);
        triggerToast("🛑 Application access has been stopped by Master Creator.");
        return;
      }
    }

    sessionStorage.setItem("vsb_admin_auth", "true");
    sessionStorage.setItem("vsb_logged_in_campus", campus);
    sessionStorage.setItem("vsb_logged_in_role", role);
    sessionStorage.setItem("vsb_logged_in_user", username);
    // Explicitly do not persist to localStorage so closing and reopening always prompts for login!
    try {
      localStorage.removeItem("vsb_admin_auth");
      localStorage.removeItem("vsb_logged_in_user");
      localStorage.removeItem("vsb_logged_in_role");
      localStorage.removeItem("vsb_logged_in_campus");
    } catch (e) {}

    setLoggedInCampus(campus);
    setCurrentUserRole(role);
    setLoggedInUsername(username);
    setSelectedCampus(campus);
    setIsAuthenticated(true);

    if (role === "CREATOR") {
      setActiveTab("CREATOR_CONTROL");
      setInstitutionSuspension({ isSuspended: false, platform: "WEB" });
      triggerToast("👑 Welcome Master Creator (Nithish Kumar)! Full System Control Unlocked.");
    } else if (role === "TEACHER") {
      setActiveTab("USER_DASHBOARD");
      try {
        const updatedTeacher = await updateTeacherOnlineStatus(username, campus, "ACTIVE");
        if (updatedTeacher) {
          triggerToast(`🟢 Welcome ${updatedTeacher.name}! Status: ACTIVE (Profile ID: ${updatedTeacher.id})`);
        } else {
          triggerToast(`🟢 Teacher status activated: ACTIVE! (Logged in: ${username})`);
        }
      } catch (err) {
        console.warn("Error setting teacher to active on login:", err);
      }
    } else {
      triggerToast(`👋 Welcome Admin (${campus} Campus)!`);
    }
  };

  const handleLogout = async () => {
    const role = currentUserRole || (sessionStorage.getItem("vsb_logged_in_role") as "ADMIN" | "TEACHER" | "CREATOR") || (localStorage.getItem("vsb_logged_in_role") as "ADMIN" | "TEACHER" | "CREATOR");
    const user = loggedInUsername || sessionStorage.getItem("vsb_logged_in_user") || localStorage.getItem("vsb_logged_in_user");
    const campus = loggedInCampus || (sessionStorage.getItem("vsb_logged_in_campus") as "KARUR" | "COIMBATORE") || (localStorage.getItem("vsb_logged_in_campus") as "KARUR" | "COIMBATORE");

    // Automatically set teacher status to ON_LEAVE upon logging out
    if (role === "TEACHER" && user) {
      try {
        const updatedTeacher = await updateTeacherOnlineStatus(user, campus, "ON_LEAVE");
        if (updatedTeacher) {
          console.log(`🟡 [Teacher Status] ${updatedTeacher.name} is now ON_LEAVE in Firebase`);
        }
      } catch (err) {
        console.warn("Error setting teacher to on leave on logout:", err);
      }
    }

    await logoutWithRealtimeAuth();
    sessionStorage.removeItem("vsb_admin_auth");
    sessionStorage.removeItem("vsb_logged_in_campus");
    sessionStorage.removeItem("vsb_logged_in_role");
    sessionStorage.removeItem("vsb_logged_in_user");
    try {
      localStorage.removeItem("vsb_admin_auth");
      localStorage.removeItem("vsb_logged_in_campus");
      localStorage.removeItem("vsb_logged_in_role");
      localStorage.removeItem("vsb_logged_in_user");
    } catch (e) {}
    setIsAuthenticated(false);
    triggerToast(
      role === "TEACHER"
        ? "🟡 Teacher status updated to ON LEAVE. Logged out successfully."
        : "Logged out successfully."
    );
  };

  const handleSelectApplicant = (applicant: Lead & { application: Application }) => {
    if (currentUserRole === "TEACHER" && !isLeadAssignedToTeacher(applicant, loggedInUsername, loggedInCampus)) {
      triggerToast("🔒 Access Restricted: You can only view and edit leads assigned to your profile.");
      return;
    }
    setSelectedApplicant(applicant);
  };

  const handleUpdateApplicant = async (updated: Lead & { application: Application }) => {
    if (currentUserRole === "TEACHER" && !isLeadAssignedToTeacher(updated, loggedInUsername, loggedInCampus)) {
      triggerToast("🔒 Access Restricted: You can only edit leads assigned to your profile.");
      return;
    }
    await saveStudentToFirebase(updated);
    setApplicants((prev) => {
      const newList = prev.map((a) => (a.id === updated.id ? updated : a));
      try {
        localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(newList));
      } catch (err) {}
      return newList;
    });
    triggerToast(`Updated profile for ${updated.name}`);
    setSelectedApplicant(null);
  };

  const handleActionTrigger = (type: TaskType, leadName: string) => {
    if (type === "CALL") {
      triggerToast(`📞 Opening phone dial pad for ${leadName}...`);
    } else if (type === "WHATSAPP") {
      const targetLead = applicants.find(
        (a) =>
          a.name.toLowerCase() === leadName.toLowerCase() ||
          leadName.toLowerCase().includes(a.name.toLowerCase()) ||
          a.name.toLowerCase().includes(leadName.toLowerCase())
      );
      if (targetLead?.phone) {
        redirectToWhatsApp(targetLead.phone, getDefaultAdmissionWhatsAppText(targetLead));
        triggerToast(`💬 Opening WhatsApp for ${targetLead.name}...`);
      } else {
        triggerToast(`💬 Initiated WhatsApp outreach for candidate: ${leadName}`);
      }
    } else if (type === "SMS") {
      const targetLead = applicants.find(
        (a) =>
          a.name.toLowerCase() === leadName.toLowerCase() ||
          leadName.toLowerCase().includes(a.name.toLowerCase()) ||
          a.name.toLowerCase().includes(leadName.toLowerCase())
      );
      if (targetLead?.phone) {
        redirectToSms(targetLead.phone, getDefaultAdmissionSmsText(targetLead));
        triggerToast(`📱 Opening native SMS app for ${targetLead.name}...`);
      } else {
        triggerToast(`📱 Initiated native SMS outreach for candidate: ${leadName}`);
      }
    } else {
      triggerToast(`Initiated ${type} outreach for candidate: ${leadName}`);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    const nextCompleted = targetTask ? !targetTask.isCompleted : true;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: nextCompleted } : t))
    );
    try {
      await mobileSafeFetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, isCompleted: nextCompleted }),
      });
    } catch (e) {}
    triggerToast("Task status updated.");
  };

  const proceedSaveApplication = async (newApp: Lead & { application: Application }) => {
    await saveStudentToFirebase(newApp);
    setApplicants((prev) => {
      const newList = [newApp, ...prev.filter((a) => a.id !== newApp.id)];
      try {
        localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(newList));
      } catch (err) {}
      return newList;
    });
    setIsCreateModalOpen(false);
    setIsQuickLeadModalOpen(false);
    triggerToast(`Created new lead for ${newApp.name}`);
  };

  const handleCreateApplication = async (newApp: Lead & { application: Application }) => {
    // Enforce 1,00,000 Lead Limit Quota
    const evaluation = evaluateLeadQuota(applicants.length, 1);
    if (evaluation.requiresOverageAuthorization) {
      setQuotaOverageModal({
        isOpen: true,
        candidateName: newApp.name,
        incomingCount: 1,
        evaluation,
        onAuthorize: async () => {
          recordOverageLeadsToAnnualRenewal({
            leadName: newApp.name,
            leadPhone: newApp.phone,
            count: 1,
            source: newApp.source || "Direct Form",
            approvedBy: loggedInUsername,
          });
          await proceedSaveApplication(newApp);
          triggerToast(`💳 Authorized overage lead "${newApp.name}"! ₹500 added to Annual Payment Renewal.`);
          setQuotaOverageModal(null);
        },
      });
      return;
    }

    await proceedSaveApplication(newApp);
  };

  const handleDeleteApplicant = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete applicant "${name}"?`)) return;

    // 1. INSTANT OPTIMISTIC UI REMOVAL (0 ms latency - disappears immediately)
    setApplicants((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });
    triggerToast(`🗑️ Permanently deleted "${name}"!`);

    // 2. Synchronous permanent tombstone registration (never restores on reload or relogin)
    markLeadAsDeleted(id);

    // 3. High-speed asynchronous permanent deletion in background
    Promise.allSettled([
      deleteStudentFromFirebase(id),
      fetch(`/api/contacts?id=${id}`, { method: "DELETE" }),
    ]).catch((err) => console.warn("Background delete notice:", err));
  };

  if (!isAuthenticated) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  // Institutional Suspension Lockdown View (Creator stopped Web or Mobile access due to unpaid annual fees or emergency killswitch)
  if (currentUserRole !== "CREATOR" && institutionSuspension.isSuspended) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
        <div className="max-w-xl w-full p-6 sm:p-10 rounded-3xl bg-slate-900 border-2 border-rose-600/70 shadow-2xl shadow-rose-950/70 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-rose-950/80 border-2 border-rose-500/50 text-rose-500 mx-auto flex items-center justify-center animate-pulse">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
              {institutionSuspension.isGlobal ? "System Lockout by Master Creator" : "Access Suspended by SPHEREX Creator"}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              {institutionSuspension.college ? institutionSuspension.college.collegeName : "SPHEREX ADMISSION OS"}
            </h1>
            <p className="text-xs md:text-sm text-slate-300">
              Access to the SPHEREX <strong>{institutionSuspension.platform === "MOBILE" ? "Native Mobile App" : "Web Application"}</strong> has been stopped across all systems by the Master Creator.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Suspension Reason:</span>
              <span className="font-bold text-rose-400 text-right">
                {institutionSuspension.reason || (institutionSuspension.isGlobal ? "Emergency System Suspension by Creator" : "Annual Software Subscription Pending")}
              </span>
            </div>
            {institutionSuspension.college && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Outstanding Balance Due:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{institutionSuspension.college.outstandingBalance.toLocaleString("en-IN")}.00
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Due Date:</span>
                  <span className="font-mono text-amber-400">{institutionSuspension.college.paymentDueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Institutional Contact:</span>
                  <span className="text-slate-300">{institutionSuspension.college.contactEmail}</span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Platform Stopped:</span>
              <span className="font-bold text-amber-300">
                {institutionSuspension.platform === "MOBILE" ? "📱 Native Android / iOS App" : "💻 Web Application (All Browsers)"}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs text-left leading-relaxed">
            ℹ️ As soon as the institutional software subscription payment is cleared with the SPHEREX Master Creator (<strong>Nithish Kumar</strong>), full application access will be opened immediately on all systems.
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={async () => {
                const res = await forceFetchLatestLicenseFromCloud();
                const recheck = isCollegeSuspendedForCurrentEnvironment(loggedInCampus || undefined, res?.colleges, res?.globalLockout);
                setInstitutionSuspension(recheck);
                if (!recheck.isSuspended) {
                  triggerToast("✨ Access restored! Resuming application...");
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              🔄 Re-check Cloud License
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Sign Out from Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter applicants by selected campus and stage filter (strictly scoped to current teacher for TEACHER role)
  const filteredApplicants = applicants.filter((item) => {
    if (currentUserRole === "TEACHER") {
      if (!isLeadAssignedToTeacher(item, loggedInUsername, loggedInCampus)) {
        return false;
      }
    }
    if (selectedCampus !== "ALL" && item.campus && item.campus !== selectedCampus) {
      return false;
    }
    if (selectedStageFilter && item.status !== selectedStageFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex font-sans bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 w-full max-w-full overflow-x-hidden relative transition-colors duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-full shadow-2xl animate-bounce flex items-center gap-2 border border-white/30 justify-center sm:justify-start">
          <span>✨ {toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar Navigation Drawer */}
      <Sidebar
        user={MOCK_ADMIN_USER}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedCampus={selectedCampus}
        onCampusChange={setSelectedCampus}
        onLogout={handleLogout}
        loggedInCampus={loggedInCampus}
        currentUserRole={currentUserRole}
        loggedInUsername={loggedInUsername}
        theme={theme}
        onThemeChange={handleThemeChange}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        applicants={applicants}
        onSelectApplicant={handleSelectApplicant}
        onOpenNoraAi={() => handleOpenNora()}
      />

      {/* Main Container Pushed Right by Sidebar on Desktop */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full lg:pl-64 transition-all duration-300 overflow-x-hidden">
        {/* Main Header */}
        <Header
          user={MOCK_ADMIN_USER}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedCampus={selectedCampus}
          onCampusChange={setSelectedCampus}
          onLogout={handleLogout}
          loggedInCampus={loggedInCampus}
          currentUserRole={currentUserRole}
          loggedInUsername={loggedInUsername}
          theme={theme}
          onThemeChange={handleThemeChange}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenAddLeadModal={() => setIsQuickLeadModalOpen(true)}
          applicants={applicants}
          onSelectApplicant={handleSelectApplicant}
          onOpenNoraAi={handleOpenNora}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 pb-28 sm:pb-6 w-full max-w-full space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* ADMISSIONS & ADMIN DASHBOARD MODULE (ADMIN & CREATOR) */}
        {(activeTab === "ADMISSIONS" || activeTab === "ADMIN_DASHBOARD") && (currentUserRole === "ADMIN" || currentUserRole === "CREATOR") && (
          <AdminDashboardView
            metrics={dynamicMetrics}
            statusCounts={dynamicStatusCounts}
            applicants={filteredApplicants}
            tasks={filteredTasks}
            searchQuery={searchQuery}
            selectedCampus={selectedCampus}
            selectedStageFilter={selectedStageFilter}
            onSelectStage={setSelectedStageFilter}
            onSelectApplicant={handleSelectApplicant}
            onActionTrigger={handleActionTrigger}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenQuickLeadModal={() => setIsQuickLeadModalOpen(true)}
            onToggleTask={handleToggleTask}
            onImportLeads={handleRequestCsvImport}
            onDeleteApplicant={handleDeleteApplicant}
          />
        )}

        {/* LEAD DASHBOARD MODULE (TEACHER ONLY) */}
        {activeTab === "USER_DASHBOARD" && currentUserRole === "TEACHER" && (
          <UserDashboardView
            loggedInUsername={loggedInUsername}
            currentUserRole={currentUserRole}
            applicants={filteredApplicants}
            tasks={filteredTasks}
            selectedCampus={selectedCampus}
            onSelectApplicant={handleSelectApplicant}
            onActionTrigger={handleActionTrigger}
            onToggleTask={handleToggleTask}
          />
        )}

        {/* MARKETING DASHBOARD MODULE */}
        {activeTab === "MARKETING_DASHBOARD" && (
          <MarketingDashboardView
            loggedInCampus={selectedCampus}
            onTriggerToast={triggerToast}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* ECHO DASHBOARD MODULE */}
        {activeTab === "ECHO_DASHBOARD" && (
          <EchoDashboardView onTriggerToast={triggerToast} />
        )}

        {/* AI INTELLIGENCE SUITE MODULE */}
        {activeTab === "AI_INTELLIGENCE" && (
          <AiIntelligenceModule
            applicants={applicants}
            selectedCampus={selectedCampus}
            onSelectApplicant={handleSelectApplicant}
          />
        )}

        {/* LEAD MANAGER MODULE (MERGED CONTACT DIRECTORY & STUDENT APPLICATIONS) */}
        {(activeTab === "CONTACTS" || activeTab === "STUDENTS" || (activeTab as string) === "CONTACT_DIRECTORY" || (activeTab as string) === "LEADS") && (
          currentUserRole === "CREATOR" ? (
            <CreatorLeadsSummaryView
              applicants={applicants}
              selectedCampus={selectedCampus}
              onNavigateCreatorControl={() => setActiveTab("CREATOR_CONTROL")}
            />
          ) : (
            <ContactDirectoryModule
              initialContacts={filteredApplicants}
              selectedCampus={selectedCampus}
              currentUserRole={effectiveSubRole}
              loggedInUsername={loggedInUsername}
              onActionTrigger={handleActionTrigger}
              onTriggerToast={triggerToast}
              onSelectApplicant={handleSelectApplicant}
              onImportLeads={handleRequestCsvImport}
              onDeleteContact={handleDeleteApplicant}
              onReloadLeads={handleReloadLeads}
              onOpenNoraAi={handleOpenNora}
            />
          )
        )}

        {/* APPLICATION MANAGER MODULE (ADMIN & CREATOR) */}
        {(activeTab === "APPLICATION_MANAGER" || activeTab === "APPLICATION_OFFLINE_LOGS") &&
          (currentUserRole === "ADMIN" || currentUserRole === "CREATOR") && (
          <ApplicationManagerModule
            loggedInCampus={selectedCampus}
            onTriggerToast={triggerToast}
            subView={activeTab === "APPLICATION_OFFLINE_LOGS" ? "OFFLINE_LOGS" : "MANAGE"}
            onNavigateSubView={(view) =>
              setActiveTab(view === "OFFLINE_LOGS" ? "APPLICATION_OFFLINE_LOGS" : "APPLICATION_MANAGER")
            }
          />
        )}

        {/* TEACHER DIRECTORY MODULE (CREATOR GETS USAGE COUNT ONLY, ADMIN GETS FULL DIRECTORY) */}
        {activeTab === "TEACHERS" && (
          currentUserRole === "CREATOR" ? (
            <CreatorTeachersSummaryView
              selectedCampus={selectedCampus}
              onNavigateCreatorControl={() => setActiveTab("CREATOR_CONTROL")}
            />
          ) : (
            <TeacherModule
              loggedInCampus={loggedInCampus}
              currentUserRole={effectiveSubRole}
              loggedInUsername={loggedInUsername}
              onTriggerToast={triggerToast}
              applicants={filteredApplicants}
              onSelectApplicant={handleSelectApplicant}
            />
          )
        )}

        {/* CAMPUS & COURSES MODULE */}
        {activeTab === "CAMPUSES" && (
          <CampusCourseModule loggedInCampus={loggedInCampus} onTriggerToast={triggerToast} />
        )}

        {/* STUDENT FEE PAYMENTS MODULE */}
        {activeTab === "PAYMENTS" && (
          <PaymentBillingModule
            loggedInCampus={loggedInCampus}
            onTriggerToast={triggerToast}
            currentLeadsCount={applicants.length}
            applicants={applicants}
          />
        )}

        {/* ADMIN SETTINGS MODULE */}
        {activeTab === "SETTINGS" && (
          <AdminSettingsModule
            loggedInCampus={loggedInCampus}
            onTriggerToast={triggerToast}
            theme={theme}
            onThemeChange={handleThemeChange}
          />
        )}

        {/* EXCLUSIVE CREATOR CONTROL MODULE (Only accessible in Web for spherexnithish#) */}
        {activeTab === "CREATOR_CONTROL" &&
          currentUserRole === "CREATOR" &&
          (loggedInUsername?.toLowerCase().trim() === "spherexnithish#" ||
           sessionStorage.getItem("vsb_logged_in_user")?.toLowerCase().trim() === "spherexnithish#") &&
          !isCapacitorNative() && (
          <CreatorControlModule
            onTriggerToast={triggerToast}
            currentLeadsCount={applicants.length}
            applicants={applicants}
            onLogout={handleLogout}
            onSwitchCampus={(c) => {
              setSelectedCampus(c);
              if (c !== "ALL") setLoggedInCampus(c);
            }}
            currentCampus={loggedInCampus}
          />
        )}

        {/* CONTACT & SOCIAL MEDIA PLATFORM MODULE */}
        {(activeTab === "CONTACT_PLATFORM" ||
          activeTab.startsWith("SOCIAL_")) && (
          <SocialMediaPlatformModule
            activeTab={activeTab}
            loggedInCampus={selectedCampus}
            onTriggerToast={triggerToast}
            onNavigateTab={setActiveTab}
            applicants={applicants}
          />
        )}
      </main>

      {/* MODALS */}
      <CreateApplicationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onApplicationCreated={handleCreateApplication}
        existingLeads={applicants}
        loggedInUsername={loggedInUsername}
      />

      <AddQuickLeadModal
        isOpen={isQuickLeadModalOpen}
        onClose={() => setIsQuickLeadModalOpen(false)}
        onLeadAdded={handleCreateApplication}
        existingLeads={applicants}
        loggedInUsername={loggedInUsername}
      />

      {selectedApplicant && (
        <ApplicantDetailModal
          applicant={selectedApplicant}
          currentUserRole={effectiveSubRole}
          onClose={() => setSelectedApplicant(null)}
          onActionTrigger={handleActionTrigger}
          onSave={handleUpdateApplicant}
          onStageChange={(updated) => {
            setApplicants((prev) => {
              const newList = prev.map((a) => (a.id === updated.id ? updated : a));
              try {
                localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(newList));
              } catch (err) {}
              return newList;
            });
            setSelectedApplicant(updated);
          }}
          existingLeads={applicants}
        />
      )}

      {/* NORA AI DATABASE ANALYTICS & SEARCH MODAL */}
      <NoraAiDatabaseModal
        isOpen={isNoraModalOpen}
        onClose={() => setIsNoraModalOpen(false)}
        applicants={applicants}
        selectedCampus={selectedCampus}
        onSelectApplicant={handleSelectApplicant}
        onApplyFilter={(query) => {
          setSearchQuery(query);
          triggerToast(`🔍 Filtered CRM table by: "${query}"`);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          triggerToast(`🚀 Navigated to ${tab.replace(/_/g, " ")}`);
        }}
        currentUserRole={effectiveSubRole}
        initialQuery={noraInitialQuery}
      />

      {/* LEAD LIMIT OVERAGE CONFIRMATION MODAL */}
      {quotaOverageModal && (
        <LeadLimitOverageModal
          isOpen={quotaOverageModal.isOpen}
          onClose={() => setQuotaOverageModal(null)}
          onConfirm={quotaOverageModal.onAuthorize}
          quotaEvaluation={quotaOverageModal.evaluation}
          candidateName={quotaOverageModal.candidateName}
          incomingBatchCount={quotaOverageModal.incomingCount}
        />
      )}

      {/* CSV LEADS FILE IMPORT MODAL (1,00,000 QUOTA CALCULATION & OVERAGE HANDLING) */}
      {csvImportModal && (
        <CsvLeadsImportModal
          isOpen={csvImportModal.isOpen}
          onClose={() => setCsvImportModal(null)}
          onConfirm={handleConfirmCsvImport}
          fileName={csvImportModal.fileName}
          importedLeads={csvImportModal.leads}
          currentTotalLeads={applicants.length}
          isProcessing={isProcessingCsvImport}
        />
      )}

      {/* NATIVE MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-white/15 px-3 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom select-none">
        <button
          type="button"
          onClick={() => setActiveTab("ADMIN_DASHBOARD")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === "ADMIN_DASHBOARD" || activeTab === "ADMISSIONS"
              ? "text-sky-400 font-extrabold scale-105"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CONTACTS")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === "CONTACTS" || activeTab === "STUDENTS"
              ? "text-sky-400 font-extrabold scale-105"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Leads</span>
        </button>

        {/* Floating Quick Action Button: + Lead */}
        <button
          type="button"
          onClick={() => setIsQuickLeadModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-6 w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 text-white shadow-xl shadow-sky-500/40 ring-4 ring-slate-950 active:scale-95 transition-transform"
          title="Add Quick Lead"
        >
          <Plus className="w-6 h-6" />
        </button>

        {currentUserRole === "CREATOR" && !isCapacitorNative() ? (
          <button
            type="button"
            onClick={() => setActiveTab("CREATOR_CONTROL")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              activeTab === "CREATOR_CONTROL"
                ? "text-amber-400 font-extrabold scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] tracking-tight">Licensing</span>
          </button>
        ) : currentUserRole === "ADMIN" ? (
          <button
            type="button"
            onClick={() => setActiveTab("ADMIN_DASHBOARD")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              activeTab === "ADMIN_DASHBOARD"
                ? "text-sky-400 font-extrabold scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Admin</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab("USER_DASHBOARD")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              activeTab === "USER_DASHBOARD"
                ? "text-sky-400 font-extrabold scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Lead Desk</span>
          </button>
        )}

        {currentUserRole === "CREATOR" ? (
          <button
            type="button"
            onClick={() => setActiveTab("TEACHERS")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              activeTab === "TEACHERS"
                ? "text-purple-400 font-extrabold scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Usage</span>
          </button>
        ) : currentUserRole === "ADMIN" ? (
          <button
            type="button"
            onClick={() => setActiveTab("TEACHERS")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
              activeTab === "TEACHERS"
                ? "text-sky-400 font-extrabold scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Faculty</span>
          </button>
        ) : null}
      </nav>

      {/* REAL-TIME LOCKOUT OVERLAY FOR ACTIVE DASHBOARD SESSIONS */}
      {institutionSuspension.isSuspended && currentUserRole !== "CREATOR" && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl shadow-rose-950/50 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {institutionSuspension.isGlobal ? "Emergency Global System Halt" : "Institutional Access Stopped"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                {institutionSuspension.college ? institutionSuspension.college.collegeName : "SPHEREX CRM APPLICATION"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {institutionSuspension.platform === "MOBILE" ? "Native Mobile App" : "Web Application"} access has been stopped by the Master Creator.
              </p>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-4 text-left text-xs space-y-2 border border-slate-800">
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 shrink-0">Lockout Reason:</span>
                <span className="font-bold text-rose-400 text-right">{institutionSuspension.reason || "Application access stopped by Master Creator."}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Platform Restricted:</span>
                <span className="font-bold text-sky-400">{institutionSuspension.platform === "MOBILE" ? "📱 Native Mobile App" : "💻 Web Application"}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Log Out &amp; Return to Login
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
