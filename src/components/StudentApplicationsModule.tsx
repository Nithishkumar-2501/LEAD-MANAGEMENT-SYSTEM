"use client";

import { useState } from "react";
import { Lead, Application, AppStage } from "@/types/crm";
import { GraduationCap, Award, CheckCircle2, Search, Eye, Plus, ChevronRight, FileText, UserCheck } from "lucide-react";

interface StudentApplicationsModuleProps {
  applicants: (Lead & { application: Application })[];
  onSelectApplicant: (applicant: Lead & { application: Application }) => void;
  onOpenCreateModal: () => void;
}

export default function StudentApplicationsModule({
  applicants,
  onSelectApplicant,
  onOpenCreateModal,
}: StudentApplicationsModuleProps) {
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  const filteredApplicants = applicants.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.courseInterest.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase());

    const matchesStage = selectedStage === "ALL" || item.application.stage === selectedStage;

    return matchesSearch && matchesStage;
  });

  const highPerformers = applicants.filter((a) => a.application.marks12th >= 90).length;
  const docsVerified = applicants.filter((a) =>
    ["DOCS_VERIFIED", "OFFER_ISSUED", "FEE_PAID"].includes(a.application.stage)
  ).length;

  const getStageBadge = (stage: AppStage) => {
    switch (stage) {
      case "INQUIRY":
        return "bg-blue-950/80 text-blue-400 border-blue-800/60";
      case "SUBMITTED":
        return "bg-purple-950/80 text-purple-400 border-purple-800/60";
      case "DOCS_VERIFIED":
        return "bg-amber-950/80 text-amber-400 border-amber-800/60";
      case "OFFER_ISSUED":
        return "bg-indigo-950/80 text-indigo-400 border-indigo-800/60";
      case "FEE_PAID":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-800/60";
    }
  };

  const stages = ["ALL", "INQUIRY", "SUBMITTED", "DOCS_VERIFIED", "OFFER_ISSUED", "FEE_PAID"];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Applications</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{applicants.length} Candidates</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-indigo-300 font-medium mt-3">2026-2027 Academic Intake</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Performers</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{highPerformers} Students</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-400 font-medium mt-3">&gt; 90% Marks in 12th Grade</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Applications</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{docsVerified} Verified</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-amber-300 font-medium mt-3">Mark-sheets & Credentials Checked</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fee Completed</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {applicants.filter((a) => a.application.stage === "FEE_PAID").length} Enrolled
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-purple-300 font-medium mt-3">Seats Confirmed</p>
        </div>
      </div>

      {/* Main Student Applications Panel */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Student Application Registry</h3>
            <p className="text-xs text-slate-400">Detailed student records, 10th/12th marksheets, and stage timeline</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, course..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Stage Filter */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto hide-scrollbar">
              {stages.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStage(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    selectedStage === st
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* New Application Button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:opacity-90"
            >
              <Plus className="w-4 h-4" /> New Student Application
            </button>
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplicants.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectApplicant(item)}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-800/80 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {item.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">{item.email}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getStageBadge(
                    item.application.stage
                  )}`}
                >
                  {item.application.stage.replace("_", " ")}
                </span>
              </div>

              {/* Marks Banner */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">10th Grade</p>
                  <p className="font-bold text-slate-100">{item.application.marks10th}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">12th Grade</p>
                  <p className="font-bold text-slate-100">{item.application.marks12th}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
                <span>Course: <strong className="text-slate-200">{item.courseInterest}</strong></span>
                <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                  Details <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
