"use client";

import { useState } from "react";
import { LeadStatusCounts } from "@/types/crm";
import {
  Filter,
  PieChart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface LeadFunnelChartProps {
  statusCounts: LeadStatusCounts;
  selectedStage?: string | null;
  onSelectStage?: (stageKey: string | null) => void;
}

export default function LeadFunnelChart({
  statusCounts,
  selectedStage: externalSelectedStage,
  onSelectStage,
}: LeadFunnelChartProps) {
  const [internalSelectedStage, setInternalSelectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"SINGLE" | "ALL" | "SEGREGATION">("SINGLE");

  const segregationData = [
    { label: "Closed", count: 56456, color: "bg-blue-600" },
    { label: "Interested to Study Engineering", count: 22755, color: "bg-amber-500" },
    { label: "Admitted in VSB", count: 2197, color: "bg-green-600" },
    { label: "Not Reachable", count: 69083, color: "bg-pink-600" },
    { label: "Untouched", count: 34035, color: "bg-blue-500" },
    { label: "Not Interested in Engineering", count: 14027, color: "bg-amber-500" },
    { label: "Walkin", count: 3384, color: "bg-green-600" },
    { label: "After NEET", count: 1954, color: "bg-pink-600" },
    { label: "Not Decided", count: 26911, color: "bg-blue-600" },
    { label: "Counseling applied", count: 3216, color: "bg-amber-500" },
    { label: "Partially Interested in Engineering", count: 3256, color: "bg-green-600" },
    { label: "Interested to Join VSB", count: 362, color: "bg-pink-600" },
    { label: "Test Lead", count: 58, color: "bg-blue-500" },
    { label: "Studying +1", count: 119, color: "bg-amber-400" },
    { label: "Partially Interested to Join VSB", count: 109, color: "bg-green-500" },
    { label: "WhatsApp contact", count: 3, color: "bg-pink-500" },
  ];

  const maxSegregationCount = Math.max(...segregationData.map((d) => d.count));

  const activeStageKey = externalSelectedStage !== undefined ? externalSelectedStage : internalSelectedStage;

  const handleStageSelect = (stageKey: string | null) => {
    if (onSelectStage) {
      onSelectStage(stageKey);
    } else {
      setInternalSelectedStage(stageKey);
    }
  };

  const total =
    statusCounts.NEW +
    statusCounts.CONTACTED +
    statusCounts.IN_REVIEW +
    statusCounts.ADMITTED +
    statusCounts.REJECTED || 1;

  const stages = [
    {
      label: "New Inquiry",
      key: "NEW",
      count: statusCounts.NEW,
      color: "bg-sky-400",
      text: "text-sky-600 dark:text-sky-300",
      border: "border-sky-400/40",
      activeBg: "bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-sky-950/80 dark:via-slate-900 dark:to-sky-900/40 border-sky-400",
      bar: "from-sky-400 to-blue-600",
      glow: "shadow-sky-500/25",
      desc: "Initial candidates who registered or submitted inquiry forms for VSB admissions.",
    },
    {
      label: "Contacted",
      key: "CONTACTED",
      count: statusCounts.CONTACTED,
      color: "bg-indigo-400",
      text: "text-indigo-600 dark:text-indigo-300",
      border: "border-indigo-400/40",
      activeBg: "bg-gradient-to-br from-indigo-50 via-white to-purple-100 dark:from-indigo-950/80 dark:via-slate-900 dark:to-purple-900/40 border-indigo-400",
      bar: "from-indigo-500 to-purple-600",
      glow: "shadow-indigo-500/25",
      desc: "Candidates actively engaged by admission counselors via telecall or email outreach.",
    },
    {
      label: "Cutoff Review",
      key: "IN_REVIEW",
      count: statusCounts.IN_REVIEW,
      color: "bg-amber-400",
      text: "text-amber-600 dark:text-amber-300",
      border: "border-amber-400/40",
      activeBg: "bg-gradient-to-br from-amber-50 via-white to-orange-100 dark:from-amber-950/80 dark:via-slate-900 dark:to-orange-900/40 border-amber-400",
      bar: "from-amber-400 to-orange-500",
      glow: "shadow-amber-500/25",
      desc: "Academic TNEA cutoff analysis & document verification in progress by verification officer.",
    },
    {
      label: "Admitted",
      key: "ADMITTED",
      count: statusCounts.ADMITTED,
      color: "bg-emerald-400",
      text: "text-emerald-600 dark:text-emerald-300",
      border: "border-emerald-400/40",
      activeBg: "bg-gradient-to-br from-emerald-50 via-white to-teal-100 dark:from-emerald-950/80 dark:via-slate-900 dark:to-teal-900/40 border-emerald-400",
      bar: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-500/25",
      desc: "Official offer letter issued and seat reservation fee completed successfully.",
    },
    {
      label: "Rejected",
      key: "REJECTED",
      count: statusCounts.REJECTED,
      color: "bg-rose-400",
      text: "text-rose-600 dark:text-rose-300",
      border: "border-rose-400/40",
      activeBg: "bg-gradient-to-br from-rose-50 via-white to-pink-100 dark:from-rose-950/80 dark:via-slate-900 dark:to-pink-900/40 border-rose-400",
      bar: "from-rose-500 to-pink-600",
      glow: "shadow-rose-500/25",
      desc: "Candidates ineligible or who opted out during counseling rounds.",
    },
  ];

  // Index for "one by one" stepping
  const currentStageIndex = stages.findIndex((s) => s.key === activeStageKey);
  const activeSingleIndex = currentStageIndex >= 0 ? currentStageIndex : 0;
  const currentStage = stages[activeSingleIndex];

  const handlePrevStage = () => {
    const prevIdx = (activeSingleIndex - 1 + stages.length) % stages.length;
    handleStageSelect(stages[prevIdx].key);
  };

  const handleNextStage = () => {
    const nextIdx = (activeSingleIndex + 1) % stages.length;
    handleStageSelect(stages[nextIdx].key);
  };

  return (
    <div className="bubble-card p-4 sm:p-6 mb-4 sm:mb-6 relative overflow-hidden">
      {/* Header with Title and View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-2 ring-white/20 shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              VSB TNEA Lead Conversion Funnel
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Filter stage options and view candidates one by one
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Total Counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/15 text-[11px] font-bold">
            <button
              onClick={() => setViewMode("SINGLE")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "SINGLE"
                  ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              One by One View
            </button>
            <button
              onClick={() => setViewMode("ALL")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "ALL"
                  ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Show All Grid
            </button>
            <button
              onClick={() => setViewMode("SEGREGATION")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "SEGREGATION"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Stage Segregation Chart 📊
            </button>
          </div>

          <div className="text-xs text-slate-200 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-white/15 backdrop-blur-xl shrink-0">
            <span className="text-slate-400">Total Pipeline:</span>{" "}
            <strong className="text-white font-bold">{total}</strong>
          </div>
        </div>
      </div>

      {/* FILTER OPTIONS PILLS BAR (ALL + 5 STAGES) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 hide-scrollbar">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5 text-sky-400" /> Filter Stage:
        </span>

        {/* ALL Option Pill */}
        <button
          onClick={() => handleStageSelect(null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeStageKey === null
              ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30 ring-2 ring-sky-300/50 font-black"
              : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/10"
          }`}
        >
          <span>All Stages</span>
          <span className="text-[10px] bg-slate-950/40 px-1.5 py-0.5 rounded-full font-mono">
            {total}
          </span>
        </button>

        {/* Stage Filter Options */}
        {stages.map((stage) => {
          const isSelected = activeStageKey === stage.key;
          return (
            <button
              key={stage.key}
              onClick={() => handleStageSelect(stage.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/30 ring-2 ring-white/40 font-black"
                  : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/10"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${stage.color}`} />
              <span>{stage.label}</span>
              <span className="text-[10px] bg-slate-950/40 px-1.5 py-0.5 rounded-full font-mono text-white">
                {stage.count}
              </span>
            </button>
          );
        })}

        {activeStageKey !== null && (
          <button
            onClick={() => handleStageSelect(null)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-950/40 border border-rose-500/30 shrink-0 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Reset Filter
          </button>
        )}
      </div>

      {/* Multi-segment Liquid Capsule Bar */}
      <div className="w-full h-3 bg-slate-950/80 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-white/20 mb-5 shadow-inner">
        {stages.map((stage) => {
          const pct = ((stage.count / total) * 100).toFixed(1);
          const isSelected = activeStageKey === stage.key;
          return (
            <div
              key={stage.key}
              onClick={() => handleStageSelect(isSelected ? null : stage.key)}
              style={{ width: `${Math.max(Number(pct), 4)}%` }}
              className={`h-full bg-gradient-to-r ${stage.bar} rounded-full transition-all duration-300 cursor-pointer shadow-sm ${
                isSelected ? "ring-2 ring-white scale-y-125 z-10 opacity-100" : "opacity-75 hover:opacity-100"
              }`}
              title={`${stage.label}: ${stage.count} (${pct}%)`}
            />
          );
        })}
      </div>

      {/* VIEW MODE 1: SHOW ONE BY ONE (FOCUSED STAGE CARD SLIDER) */}
      {viewMode === "SINGLE" && (
        <div className="relative">
          <div
            className={`p-5 sm:p-6 rounded-3xl border ${currentStage.activeBg} ${currentStage.glow} transition-all duration-500 shadow-2xl relative`}
          >
            {/* Top Stepper Badge & Navigation Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400 bg-sky-950/80 px-3 py-1 rounded-full border border-sky-400/30">
                  Stage {activeSingleIndex + 1} of {stages.length}
                </span>
                {activeStageKey === currentStage.key && (
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active Table Filter
                  </span>
                )}
              </div>

              {/* Prev / Next Stage Stepper Arrows */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevStage}
                  className="p-2 rounded-xl bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white hover:border-sky-400 transition-all shadow-md active:scale-95 flex items-center gap-1 text-xs font-bold"
                  title="Previous Stage"
                >
                  <ChevronLeft className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="p-2 rounded-xl bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white hover:border-sky-400 transition-all shadow-md active:scale-95 flex items-center gap-1 text-xs font-bold"
                  title="Next Stage"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4 text-sky-400" />
                </button>
              </div>
            </div>

            {/* Stage Detail Card Body */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              {/* Left Column: Stage Identity */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full ${currentStage.color} shadow-lg ring-4 ring-white/10`} />
                  <h4 className="text-lg font-black text-white">{currentStage.label}</h4>
                </div>
                <p className="text-xs text-white/90 font-medium leading-relaxed">
                  {currentStage.desc}
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-mono text-white/80 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-white/20">
                    Filter Key: {currentStage.key}
                  </span>
                </div>
              </div>

              {/* Center Column: Big Metrics Display */}
              <div className="bg-slate-950/80 border border-white/20 rounded-2xl p-4 text-center space-y-1 backdrop-blur-xl shadow-inner">
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider block">
                  Total Stage Candidates
                </span>
                <div className="text-4xl font-black text-white tracking-tight flex items-center justify-center gap-1">
                  <span>{currentStage.count}</span>
                  <span className="text-xs text-white/70 font-normal">leads</span>
                </div>
                <div className="pt-1">
                  <span className={`inline-block text-xs font-black px-3 py-0.5 rounded-full bg-slate-900 ${currentStage.text}`}>
                    {Math.round((currentStage.count / total) * 100)}% of pipeline
                  </span>
                </div>
              </div>

              {/* Right Column: Progress & Action Button */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-white font-bold mb-1.5">
                    <span>Funnel Share</span>
                    <span className={currentStage.text}>
                      {((currentStage.count / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-950/90 rounded-full overflow-hidden p-0.5 border border-white/15">
                    <div
                      style={{ width: `${((currentStage.count / total) * 100).toFixed(1)}%` }}
                      className={`h-full bg-gradient-to-r ${currentStage.bar} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleStageSelect(activeStageKey === currentStage.key ? null : currentStage.key)
                  }
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xl ${
                    activeStageKey === currentStage.key
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30"
                      : "bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-white shadow-sky-500/30"
                  }`}
                >
                  {activeStageKey === currentStage.key ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Filter Applied (Click to Clear)
                    </>
                  ) : (
                    <>
                      <Filter className="w-4 h-4" /> Filter Table by {currentStage.label}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: SHOW ALL GRID CARDS */}
      {viewMode === "ALL" && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {stages.map((stage) => {
            const pct = Math.round((stage.count / total) * 100);
            const isSelected = activeStageKey === stage.key;
            return (
              <div
                key={stage.key}
                onClick={() => handleStageSelect(isSelected ? null : stage.key)}
                className={`border rounded-2xl p-4 flex flex-col justify-between transform hover:-translate-y-1 transition-all duration-300 cursor-pointer backdrop-blur-md group ${
                  isSelected
                    ? `${stage.activeBg} shadow-xl ${stage.glow} ring-2 ring-white/50 scale-105`
                    : "bg-slate-900/60 border-white/15 hover:border-sky-400/60"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.color} shadow-sm`} />
                    <span className="text-xs text-slate-200 font-extrabold group-hover:text-white transition-colors">
                      {stage.label}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-400/30 inline-block mb-2">
                      Active Filter
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-black text-white group-hover:text-sky-300 transition-colors">
                    {stage.count}
                  </span>
                  <span className={`text-xs font-black ${stage.text}`}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* VIEW MODE 3: LEAD STAGE SEGREGATION HORIZONTAL BAR CHART (PICTURE 5) */}
      {viewMode === "SEGREGATION" && (
        <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-bold text-slate-800">Lead Stage Segregation</h3>
            <button
              onClick={() => setViewMode("SINGLE")}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ✖
            </button>
          </div>

          <div className="space-y-2.5 pt-2 font-sans">
            {segregationData.map((item) => {
              const widthPct = Math.max((item.count / maxSegregationCount) * 100, 1.5);
              return (
                <div key={item.label} className="grid grid-cols-12 items-center gap-3 text-xs">
                  <div className="col-span-4 sm:col-span-3 text-right font-medium text-slate-700 truncate">
                    {item.label}
                  </div>
                  <div className="col-span-8 sm:col-span-9 flex items-center gap-2">
                    <div className="w-full bg-slate-100 rounded-sm h-5 relative overflow-hidden flex items-center">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className={`h-full ${item.color} transition-all duration-500 rounded-r-sm`}
                      />
                      <span className="text-[11px] font-bold text-slate-800 ml-2">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
