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
  const [selectedCampus, setSelectedCampus] = useState<CampusLocation>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalLeads: 1248,
    leadsTrend: 14.2,
    applicationsVerified: 856,
    docsVerifiedTrend: 8.5,
    seatsFilled: 642,
    seatsFilledTrend: 18.0,
    totalRevenue: 54500000,
    revenueTrend: 12.4,
  });

  const [statusCounts, setStatusCounts] = useState<LeadStatusCounts>({
    NEW: 340,
    CONTACTED: 412,
    IN_REVIEW: 214,
    ADMITTED: 180,
    REJECTED: 102,
  });

  const [applicants, setApplicants] = useState<(Lead & { application: Application })[]>(MOCK_LEADS as (Lead & { application: Application })[]);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TODAYS_TASKS);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<(Lead & { application: Application }) | null>(null);

  // Action Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const authSession = sessionStorage.getItem("vsb_admin_auth");
    if (authSession === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    sessionStorage.setItem("vsb_admin_auth", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("vsb_admin_auth");
    setIsAuthenticated(false);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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

  // Filter applicants by selected campus
  const filteredApplicants = applicants.filter((item) => {
    if (selectedCampus === "ALL") return true;
    return item.campus === selectedCampus;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-full shadow-2xl animate-bounce flex items-center gap-2 border border-white/30">
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
      />

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ADMISSIONS CRM MODULE */}
        {activeTab === "ADMISSIONS" && (
          <>
            <MetricCards metrics={metrics} />
            <LeadFunnelChart statusCounts={statusCounts} />
            <div className="flex flex-col lg:flex-row gap-6">
              <ApplicantsTable
                applicants={filteredApplicants}
                searchQuery={searchQuery}
                onSelectApplicant={setSelectedApplicant}
                onActionTrigger={handleActionTrigger}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
              />
              <TaskSidebar
                tasks={tasks}
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
            onActionTrigger={handleActionTrigger}
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
          <TeacherModule onTriggerToast={triggerToast} />
        )}

        {/* CAMPUS & COURSES MODULE */}
        {activeTab === "CAMPUSES" && (
          <CampusCourseModule onTriggerToast={triggerToast} />
        )}

        {/* FEE PAYMENTS MODULE */}
        {activeTab === "PAYMENTS" && (
          <PaymentBillingModule onTriggerToast={triggerToast} />
        )}

        {/* ADMIN SETTINGS MODULE */}
        {activeTab === "SETTINGS" && <AdminSettingsModule onTriggerToast={triggerToast} />}
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
          onClose={() => setSelectedApplicant(null)}
          onActionTrigger={handleActionTrigger}
        />
      )}
    </div>
  );
}
