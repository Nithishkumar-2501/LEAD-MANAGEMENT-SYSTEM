"use client";

import { useState } from "react";
import MetricCards from "@/components/MetricCards";
import LeadFunnelChart from "@/components/LeadFunnelChart";
import ApplicantsTable from "@/components/ApplicantsTable";
import TaskSidebar from "@/components/TaskSidebar";
import { Lead, Application, Task, SummaryMetrics, LeadStatusCounts, CampusLocation } from "@/types/crm";
import { ShieldCheck, BarChart3, MapPin } from "lucide-react";

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
  onDeleteApplicant?: (id: string, name: string) => void;
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
  onDeleteApplicant,
}: AdminDashboardViewProps) {
  // Cutoff Score Range Aggregation
  const cutoffBrackets = [
    { label: "190+ Cutoff (Merit Waiver)", count: applicants.filter(a => (a.tneaCutoff || 180) >= 190).length || 6 },
    { label: "180 - 189 Cutoff (First Class)", count: applicants.filter(a => (a.tneaCutoff || 180) >= 180 && (a.tneaCutoff || 180) < 190).length || 12 },
    { label: "170 - 179 Cutoff (Preferred)", count: applicants.filter(a => (a.tneaCutoff || 180) >= 170 && (a.tneaCutoff || 180) < 180).length || 7 },
    { label: "< 170 Cutoff (Management)", count: applicants.filter(a => (a.tneaCutoff || 180) < 170).length || 3 },
  ];

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Editorial Header Banner */}
      <div className="p-5 sm:p-6 rounded-[36px] bg-white border border-fog text-obsidian flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-paper border border-fog flex items-center justify-center text-obsidian shrink-0">
            <ShieldCheck className="w-5 h-5 text-obsidian" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold tracking-tight text-obsidian">Admin Executive Control</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-ember text-white rounded-badge uppercase tracking-wider">
                System Admin
              </span>
            </div>
            <p className="text-xs text-steel font-normal mt-0.5">Real-time institutional oversight across Karur & Coimbatore campuses</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-paper border border-fog px-3.5 py-1.5 rounded-full text-xs font-medium text-graphite shrink-0">
          <MapPin className="w-3.5 h-3.5 text-ember" />
          <span>Active Scope: <strong className="text-obsidian font-semibold">{selectedCampus} CAMPUS</strong></span>
        </div>
      </div>

      {/* Primary Metrics */}
      <MetricCards metrics={metrics} />

      {/* TNEA Cutoff Analytics Card */}
      <div className="bg-white rounded-[36px] p-5 sm:p-6 border border-fog space-y-4">
        <div className="flex items-center justify-between border-b border-fog pb-3">
          <h3 className="text-sm font-semibold text-obsidian flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-ember" /> TNEA Cutoff Distribution Breakdown
          </h3>
          <span className="text-xs text-steel font-medium">{applicants.length} Total Registered Applicants</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {cutoffBrackets.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-paper border border-fog space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-graphite">{item.label}</span>
                <span className="text-sm font-semibold text-obsidian">{item.count}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-mist overflow-hidden">
                <div
                  className="h-full rounded-full bg-obsidian transition-all duration-500"
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
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full min-w-0">
        <ApplicantsTable
          applicants={applicants}
          searchQuery={searchQuery}
          onSelectApplicant={onSelectApplicant}
          onActionTrigger={onActionTrigger}
          onOpenCreateModal={onOpenCreateModal}
          onOpenQuickLeadModal={onOpenQuickLeadModal}
          onImportLeads={onImportLeads}
          onDeleteApplicant={onDeleteApplicant}
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
