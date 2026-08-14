"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("ADMISSIONS");
  const [selectedCampus, setSelectedCampus] = useState<CampusLocation>("KARUR");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loggedInCampus, setLoggedInCampus] = useState<"KARUR" | "COIMBATORE">("KARUR");
  const [currentUserRole, setCurrentUserRole] = useState<"ADMIN" | "TEACHER">("ADMIN");
  const [loggedInUsername, setLoggedInUsername] = useState<string>("adminkarur@123");

  const [applicants, setApplicants] = useState<(Lead & { application: Application })[]>(MOCK_LEADS as (Lead & { application: Application })[]);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TODAYS_TASKS);

  // Dynamic calculations based on selected campus
  const dynamicMetrics: SummaryMetrics = {
    totalLeads: selectedCampus === "KARUR" ? 580 : selectedCampus === "COIMBATORE" ? 668 : 1248,
    leadsTrend: selectedCampus === "KARUR" ? 12.5 : selectedCampus === "COIMBATORE" ? 15.8 : 14.2,
    applicationsVerified: selectedCampus === "KARUR" ? 398 : selectedCampus === "COIMBATORE" ? 458 : 856,
    docsVerifiedTrend: selectedCampus === "KARUR" ? 7.2 : selectedCampus === "COIMBATORE" ? 9.8 : 8.5,
    seatsFilled: selectedCampus === "KARUR" ? 298 : selectedCampus === "COIMBATORE" ? 344 : 642,
    seatsFilledTrend: selectedCampus === "KARUR" ? 16.2 : selectedCampus === "COIMBATORE" ? 19.4 : 18.0,
    totalRevenue: selectedCampus === "KARUR" ? 25300000 : selectedCampus === "COIMBATORE" ? 29200000 : 54500000,
    revenueTrend: selectedCampus === "KARUR" ? 10.5 : selectedCampus === "COIMBATORE" ? 14.1 : 12.4,
  };

  const dynamicStatusCounts: LeadStatusCounts = {
    NEW: selectedCampus === "KARUR" ? 160 : selectedCampus === "COIMBATORE" ? 180 : 340,
    CONTACTED: selectedCampus === "KARUR" ? 192 : selectedCampus === "COIMBATORE" ? 220 : 412,
    IN_REVIEW: selectedCampus === "KARUR" ? 98 : selectedCampus === "COIMBATORE" ? 116 : 214,
    ADMITTED: selectedCampus === "KARUR" ? 85 : selectedCampus === "COIMBATORE" ? 95 : 180,
    REJECTED: selectedCampus === "KARUR" ? 45 : selectedCampus === "COIMBATORE" ? 57 : 102,
  };

  // Filter tasks dynamically based on campus of the associated lead
  const filteredTasks = tasks.filter((t) => {
    const lead = applicants.find((l) => l.id === t.leadId);
    if (!lead) return true;
    if (selectedCampus === "ALL") return true;
    return lead.campus === selectedCampus;
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<(Lead & { application: Application }) | null>(null);

  // Action Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleLogout = () => {
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

  const handleUpdateApplicant = (updated: Lead & { application: Application }) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    triggerToast(`Updated profile for ${updated.name}`);
    setSelectedApplicant(null);
  };

  const handleActionTrigger = (type: TaskType, leadName: string) => {
    triggerToast(`Initiated ${type} outreach for candidate: ${leadName}`);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    );
    triggerToast("Task status updated.");
  };

  const handleCreateApplication = (newApp: Lead & { application: Application }) => {
    setApplicants((prev) => [newApp, ...prev]);
    setIsCreateModalOpen(false);
    triggerToast(`Created new application for ${newApp.name}`);
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
    <div className="min-h-screen flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-full shadow-2xl animate-bounce flex items-center gap-2 border border-white/30 justify-center sm:justify-start">
          <span>✨ {toastMessage}</span>
        </div>
      )}

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
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
        {/* ADMISSIONS CRM MODULE */}
        {activeTab === "ADMISSIONS" && (
          <>
            <MetricCards metrics={dynamicMetrics} />
            <LeadFunnelChart
              statusCounts={dynamicStatusCounts}
              selectedStage={selectedStageFilter}
              onSelectStage={setSelectedStageFilter}
            />
            <div className="flex flex-col lg:flex-row gap-6">
              <ApplicantsTable
                applicants={filteredApplicants}
                searchQuery={searchQuery}
                onSelectApplicant={setSelectedApplicant}
                onActionTrigger={handleActionTrigger}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
              />
              <TaskSidebar
                tasks={filteredTasks}
                onToggleTask={handleToggleTask}
                onActionTrigger={handleActionTrigger}
              />
            </div>
          </>
        )}

        {/* CONTACT DIRECTORY MODULE */}
        {activeTab === "CONTACTS" && (
          <ContactDirectoryModule
            initialContacts={filteredApplicants}
            selectedCampus={selectedCampus}
            currentUserRole={currentUserRole}
            loggedInUsername={loggedInUsername}
            onActionTrigger={handleActionTrigger}
            onTriggerToast={triggerToast}
          />
        )}

        {/* STUDENT APPLICATIONS MODULE */}
        {activeTab === "STUDENTS" && (
          <StudentApplicationsModule
            applicants={filteredApplicants}
            onSelectApplicant={setSelectedApplicant}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}

        {/* TEACHER DIRECTORY MODULE */}
        {activeTab === "TEACHERS" && (
          <TeacherModule
            loggedInCampus={loggedInCampus}
            currentUserRole={currentUserRole}
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
          />
        )}
      </main>

      {/* MODALS */}
      <CreateApplicationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onApplicationCreated={handleCreateApplication}
      />

      {selectedApplicant && (
        <ApplicantDetailModal
          applicant={selectedApplicant}
          currentUserRole={currentUserRole}
          onClose={() => setSelectedApplicant(null)}
          onActionTrigger={handleActionTrigger}
          onSave={handleUpdateApplicant}
        />
      )}
    </div>
  );
}
