"use client";

import { useState } from "react";
import MetricCards from "@/components/MetricCards";
import LeadFunnelChart from "@/components/LeadFunnelChart";
import ApplicantsTable from "@/components/ApplicantsTable";
import TaskSidebar from "@/components/TaskSidebar";
import { Lead, Application, Task, SummaryMetrics, LeadStatusCounts, CampusLocation } from "@/types/crm";
import { ShieldCheck, BarChart3, Users, Award, TrendingUp, Sparkles, MapPin, CheckCircle2 } from "lucide-react";

interface AdminDashboardViewProps {
  metrics: SummaryMetrics;
  statusCounts: LeadStatusCounts;
  applicants: (Lead & { application: Application })[];
  tasks: Task[];
  searchQuery: string;
  selectedCampus: CampusLocation;
  selectedStageFilter: string | null;
  onSelectStage: (stage: string | null) => void;
  onSelectApplicant: (applicant: Lead & { application: Application }) => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onOpenCreateModal: () => void;
  onOpenQuickLeadModal: () => void;
  onToggleTask: (taskId: string) => void;
  onImportLeads: (newLeads: (Lead & { application: Application })[]) => void;
}

export default function AdminDashboardView({
  metrics,
  statusCounts,
  applicants,
  tasks,
  searchQuery,
  selectedCampus,
  selectedStageFilter,
  onSelectStage,
  onSelectApplicant,
  onActionTrigger,
  onOpenCreateModal,
  onOpenQuickLeadModal,
  onToggleTask,
  onImportLeads,
}: AdminDashboardViewProps) {
  // Cutoff Score Range Aggregation
  const cutoffBrackets = [
    { label: "190+ Cutoff (Merit Waiver)", count: applicants.filter(a => (a.tneaCutoff || 180) >= 190).length || 6, color: "bg-emerald-500" },
    { label: "180 - 189 Cutoff (First Class)", count: applicants.filter(a => (a.tneaCutoff || 180) >= 180 && (a.tneaCutoff || 180) < 190).length || 12, color: "bg-sky-500" },
    { label: "170 - 179 Cutoff (Preferred)", count: applicants.filter(a => (a.tneaCutoff || 180) >= 170 && (a.tneaCutoff || 180) < 180).length || 7, color: "bg-indigo-500" },
    { label: "< 170 Cutoff (Management)", count: applicants.filter(a => (a.tneaCutoff || 180) < 170).length || 3, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-slate-900">Admin Executive Control Dashboard</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full uppercase">
                System Admin
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">Real-time institutional oversight across Karur & Coimbatore campuses</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-900 shadow-sm shrink-0">
          <MapPin className="w-3.5 h-3.5 text-pink-600" />
          <span>Active Scope: {selectedCampus} CAMPUS</span>
        </div>
      </div>

      {/* Primary Metrics */}
      <MetricCards metrics={metrics} />

      {/* TNEA Cutoff Analytics Card */}
      <div className="bubble-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" /> TNEA Cutoff Distribution Breakdown
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{applicants.length} Total Registered Applicants</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cutoffBrackets.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{item.count}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${Math.min(100, (item.count / applicants.length) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel Chart */}
      <LeadFunnelChart
        statusCounts={statusCounts}
        selectedStage={selectedStageFilter}
        onSelectStage={onSelectStage}
      />

      {/* Table & Task Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        <ApplicantsTable
          applicants={applicants}
          searchQuery={searchQuery}
          onSelectApplicant={onSelectApplicant}
          onActionTrigger={onActionTrigger}
          onOpenCreateModal={onOpenCreateModal}
          onOpenQuickLeadModal={onOpenQuickLeadModal}
          onImportLeads={onImportLeads}
        />
        <TaskSidebar
          tasks={tasks}
          onToggleTask={onToggleTask}
          onActionTrigger={onActionTrigger}
        />
      </div>
    </div>
  );
}
