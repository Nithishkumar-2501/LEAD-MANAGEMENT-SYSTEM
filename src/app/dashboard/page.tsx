"use client";

import { useState, useEffect, useCallback } from "react";
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
import { logoutWithRealtimeAuth } from "@/lib/authService";
import {
  saveStudentToFirebase,
  deleteStudentFromFirebase,
  isLeadDeleted,
  markLeadAsDeleted,
  fetchStudentsFromFirestore,
  fetchStudentsFromRTDB,
  subscribeToFirebaseStudents,
  StudentRecord,
} from "@/lib/firebaseSync";

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
  MOCK_LEADS,
  MOCK_TODAYS_TASKS,
  MOCK_PAYMENTS,
} from "@/lib/mockData";

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("ADMISSIONS");
  const [selectedCampus, setSelectedCampus] = useState<CampusLocation>("KARUR");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loggedInCampus, setLoggedInCampus] = useState<"KARUR" | "COIMBATORE">("KARUR");
  const [currentUserRole, setCurrentUserRole] = useState<"ADMIN" | "TEACHER">("ADMIN");
  const [loggedInUsername, setLoggedInUsername] = useState<string>("adminkarur@123");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [applicants, setApplicants] = useState<(Lead & { application: Application })[]>([]);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TODAYS_TASKS);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuickLeadModalOpen, setIsQuickLeadModalOpen] = useState(false);

  // Reusable Firebase and Database sync helper
  const applyFirebaseLeads = useCallback((fbLeads: StudentRecord[]) => {
    if (!fbLeads) return;

    const activeFbLeads = fbLeads.filter((fb) => fb.id && !isLeadDeleted(fb.id));

    setApplicants((prev) => {
      const map = new Map<string, Lead & { application: Application }>();
      // Only keep existing leads that are NOT deleted
      prev.filter((p) => !isLeadDeleted(p.id)).forEach((item) => map.set(item.id, item));

      activeFbLeads.forEach((fb) => {
        if (fb.id) {
          const existing = map.get(fb.id);
          const defaultApp: Application = {
            id: `app_${fb.id}`,
            leadId: fb.id,
            stage: "INQUIRY",
            marks10th: (fb as any).marks10th || existing?.application?.marks10th || 0,
            marks12th: (fb as any).marks12th || existing?.application?.marks12th || 0,
            paymentStatus: "PENDING",
          };
          const app = (fb.application || existing?.application || defaultApp) as Application;
          map.set(fb.id, {
            ...existing,
            ...fb,
            application: app,
          } as Lead & { application: Application });
        }
      });

      const merged = Array.from(map.values());
      try {
        localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(merged));
      } catch (err) {}
      return merged;
    });
  }, []);

  const handleReloadLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
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
    fetch("/api/applications")
      .then((res) => res.json())
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
          // Fall back to cached or mock data if database is empty
          setApplicants((prev) => {
            const valid = prev.filter((p) => !isLeadDeleted(p.id));
            return valid.length > 0
              ? valid
              : (MOCK_LEADS as (Lead & { application: Application })[]).filter(
                  (m) => !isLeadDeleted(m.id)
                );
          });
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

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, applyFirebaseLeads]);

  // Dynamic calculations based on selected campus
  const activeCampusLeads = applicants.filter((item) => selectedCampus === "ALL" || item.campus === selectedCampus);
  const totalLeadCount = activeCampusLeads.length > 0 ? activeCampusLeads.length : 28;

  const dynamicMetrics: SummaryMetrics = {
    totalLeads: totalLeadCount,
    leadsTrend: 14.2,
    applicationsVerified: activeCampusLeads.filter(a => a.status === "ADMITTED" || a.status === "IN_REVIEW").length || 10,
    docsVerifiedTrend: 8.5,
    seatsFilled: activeCampusLeads.filter(a => a.status === "ADMITTED").length || 5,
    seatsFilledTrend: 18.0,
    totalRevenue: (activeCampusLeads.filter(a => a.status === "ADMITTED").length || 5) * 95000,
    revenueTrend: 12.4,
  };

  const dynamicStatusCounts: LeadStatusCounts = {
    NEW: activeCampusLeads.filter(c => c.status === "NEW").length || 11,
    CONTACTED: activeCampusLeads.filter(c => c.status === "CONTACTED").length || 6,
    IN_REVIEW: activeCampusLeads.filter(c => c.status === "IN_REVIEW").length || 5,
    ADMITTED: activeCampusLeads.filter(c => c.status === "ADMITTED").length || 5,
    REJECTED: activeCampusLeads.filter(c => c.status === "REJECTED").length || 1,
  };

  // Filter tasks dynamically based on campus of the associated lead
  const filteredTasks = tasks.filter((t) => {
    const lead = applicants.find((l) => l.id === t.leadId);
    if (!lead) return true;
    if (selectedCampus === "ALL") return true;
    return lead.campus === selectedCampus;
  });

  // Modals
  const [selectedApplicant, setSelectedApplicant] = useState<(Lead & { application: Application }) | null>(null);

  // Action Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [theme, setTheme] = useState<"LIGHT" | "DARK">("LIGHT");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("vsb_theme") as "LIGHT" | "DARK") || "LIGHT";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme === "LIGHT" ? "light" : "dark";
  }, []);

  const handleThemeChange = (newTheme: "LIGHT" | "DARK") => {
    setTheme(newTheme);
    localStorage.setItem("vsb_theme", newTheme);
    document.documentElement.className = newTheme === "LIGHT" ? "light" : "dark";
    triggerToast(`Switched theme mode to ${newTheme === "LIGHT" ? "☀️ Light Mode" : "🌙 Dark Mode"}`);
  };

  useEffect(() => {
    const authSession = sessionStorage.getItem("vsb_admin_auth");
    if (authSession === "true") {
      setIsAuthenticated(true);
      const campus = sessionStorage.getItem("vsb_logged_in_campus") as "KARUR" | "COIMBATORE";
      const role = sessionStorage.getItem("vsb_logged_in_role") as "ADMIN" | "TEACHER";
      const user = sessionStorage.getItem("vsb_logged_in_user");
      if (campus) {
        setLoggedInCampus(campus);
        setSelectedCampus(campus);
      }
      if (role) {
        setCurrentUserRole(role);
      }
      if (user) {
        setLoggedInUsername(user);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLoginSuccess = (campus: "KARUR" | "COIMBATORE", role: "ADMIN" | "TEACHER", username: string) => {
    sessionStorage.setItem("vsb_admin_auth", "true");
    sessionStorage.setItem("vsb_logged_in_campus", campus);
    sessionStorage.setItem("vsb_logged_in_role", role);
    sessionStorage.setItem("vsb_logged_in_user", username);
    setLoggedInCampus(campus);
    setCurrentUserRole(role);
    setLoggedInUsername(username);
    setSelectedCampus(campus);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await logoutWithRealtimeAuth();
    sessionStorage.removeItem("vsb_admin_auth");
    sessionStorage.removeItem("vsb_logged_in_campus");
    sessionStorage.removeItem("vsb_logged_in_role");
    sessionStorage.removeItem("vsb_logged_in_user");
    setIsAuthenticated(false);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectApplicant = (applicant: Lead & { application: Application }) => {
    setActiveTab("CONTACTS");
    setSelectedApplicant(applicant);
  };

  const handleUpdateApplicant = async (updated: Lead & { application: Application }) => {
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
    triggerToast(`Initiated ${type} outreach for candidate: ${leadName}`);
  };

  const handleToggleTask = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    const nextCompleted = targetTask ? !targetTask.isCompleted : true;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: nextCompleted } : t))
    );
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, isCompleted: nextCompleted }),
      });
    } catch (e) {}
    triggerToast("Task status updated.");
  };

  const handleCreateApplication = async (newApp: Lead & { application: Application }) => {
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

  // Filter applicants by selected campus and stage filter
  const filteredApplicants = applicants.filter((item) => {
    if (selectedCampus !== "ALL" && item.campus !== selectedCampus) {
      return false;
    }
    if (selectedStageFilter && item.status !== selectedStageFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex font-sans bg-slate-950 text-slate-100">
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
      />

      {/* Main Container Pushed Right by Sidebar on Desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
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
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 w-full space-y-4 sm:space-y-6">
        {/* ADMISSIONS & ADMIN DASHBOARD MODULE */}
        {(activeTab === "ADMISSIONS" || activeTab === "ADMIN_DASHBOARD") && (
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
            onImportLeads={(newLeads) => {
              setApplicants((prev) => [...newLeads, ...prev]);
              triggerToast(`📥 Imported ${newLeads.length} student record(s) from File Manager!`);
              if (newLeads.length > 0) {
                handleSelectApplicant(newLeads[0]);
              }
            }}
            onDeleteApplicant={handleDeleteApplicant}
          />
        )}

        {/* USER DASHBOARD MODULE */}
        {activeTab === "USER_DASHBOARD" && (
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

        {/* LEAD MANAGER MODULE (MERGED CONTACT DIRECTORY & STUDENT APPLICATIONS) */}
        {(activeTab === "CONTACTS" || activeTab === "STUDENTS") && (
          <ContactDirectoryModule
            initialContacts={filteredApplicants}
            selectedCampus={selectedCampus}
            currentUserRole={currentUserRole}
            loggedInUsername={loggedInUsername}
            onActionTrigger={handleActionTrigger}
            onTriggerToast={triggerToast}
            onSelectApplicant={handleSelectApplicant}
            onImportLeads={(newLeads) => {
              setApplicants((prev) => [...newLeads, ...prev]);
              if (newLeads.length > 0) {
                handleSelectApplicant(newLeads[0]);
              }
            }}
            onDeleteContact={handleDeleteApplicant}
            onReloadLeads={handleReloadLeads}
          />
        )}

        {/* TEACHER DIRECTORY MODULE */}
        {activeTab === "TEACHERS" && (
          <TeacherModule
            loggedInCampus={loggedInCampus}
            currentUserRole={currentUserRole}
            loggedInUsername={loggedInUsername}
            onTriggerToast={triggerToast}
          />
        )}

        {/* CAMPUS & COURSES MODULE */}
        {activeTab === "CAMPUSES" && (
          <CampusCourseModule loggedInCampus={loggedInCampus} onTriggerToast={triggerToast} />
        )}

        {/* FEE PAYMENTS MODULE */}
        {activeTab === "PAYMENTS" && (
          <PaymentBillingModule loggedInCampus={loggedInCampus} onTriggerToast={triggerToast} />
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

        {/* CONTACT & SOCIAL MEDIA PLATFORM MODULE */}
        {(activeTab === "CONTACT_PLATFORM" ||
          activeTab.startsWith("SOCIAL_")) && (
          <SocialMediaPlatformModule
            activeTab={activeTab}
            loggedInCampus={selectedCampus}
            onTriggerToast={triggerToast}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* MODALS */}
      <CreateApplicationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onApplicationCreated={handleCreateApplication}
        existingLeads={applicants}
      />

      <AddQuickLeadModal
        isOpen={isQuickLeadModalOpen}
        onClose={() => setIsQuickLeadModalOpen(false)}
        onLeadAdded={handleCreateApplication}
        existingLeads={applicants}
      />

      {selectedApplicant && (
        <ApplicantDetailModal
          applicant={selectedApplicant}
          currentUserRole={currentUserRole}
          onClose={() => setSelectedApplicant(null)}
          onActionTrigger={handleActionTrigger}
          onSave={handleUpdateApplicant}
          existingLeads={applicants}
        />
      )}
      </div>
    </div>
  );
}
