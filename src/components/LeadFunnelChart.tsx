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
    { label: "Closed", count: 56456 + statusCounts.REJECTED, color: "bg-obsidian" },
    { label: "Interested to Study Engineering", count: 22755, color: "bg-slate-a" },
    { label: "Admitted in VSB", count: 2197 + statusCounts.ADMITTED, color: "bg-ember" },
    { label: "Not Reachable", count: 69083, color: "bg-iron" },
    { label: "Untouched", count: 34035 + statusCounts.NEW, color: "bg-steel" },
    { label: "Not Interested in Engineering", count: 14027, color: "bg-fog" },
    { label: "Walkin", count: 3384, color: "bg-obsidian" },
    { label: "After NEET", count: 1954, color: "bg-steel" },
    { label: "Not Decided", count: 26911 + statusCounts.IN_REVIEW, color: "bg-graphite" },
    { label: "Counseling applied", count: 3216 + statusCounts.CONTACTED, color: "bg-ember" },
    { label: "Partially Interested in Engineering", count: 3256, color: "bg-slate-a" },
    { label: "Interested to Join VSB", count: 362, color: "bg-obsidian" },
    { label: "Test Lead", count: 58, color: "bg-iron" },
    { label: "Studying +1", count: 119, color: "bg-steel" },
    { label: "Partially Interested to Join VSB", count: 109, color: "bg-fog" },
    { label: "WhatsApp contact", count: 3, color: "bg-ember" },
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
      dotColor: "bg-obsidian",
      bar: "bg-obsidian",
      desc: "Initial candidates who registered or submitted inquiry forms for VSB admissions.",
    },
    {
      label: "Contacted",
      key: "CONTACTED",
      count: statusCounts.CONTACTED,
      dotColor: "bg-graphite",
      bar: "bg-graphite",
      desc: "Candidates actively engaged by admission counselors via telecall or email outreach.",
    },
    {
      label: "Cutoff Review",
      key: "IN_REVIEW",
      count: statusCounts.IN_REVIEW,
      dotColor: "bg-slate-a",
      bar: "bg-slate-a",
      desc: "Academic TNEA cutoff analysis & document verification in progress by verification officer.",
    },
    {
      label: "Admitted",
      key: "ADMITTED",
      count: statusCounts.ADMITTED,
      dotColor: "bg-ember",
      bar: "bg-ember",
      desc: "Official offer letter issued and seat reservation fee completed successfully.",
    },
    {
      label: "Rejected",
      key: "REJECTED",
      count: statusCounts.REJECTED,
      dotColor: "bg-steel",
      bar: "bg-steel",
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
    <div className="bg-white rounded-[36px] p-5 sm:p-6 border border-fog mb-6 relative overflow-hidden w-full max-w-full min-w-0">
      {/* Header with Title and View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 w-full max-w-full min-w-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-paper border border-fog flex items-center justify-center text-obsidian shrink-0">
            <PieChart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-obsidian truncate">
              Lead Conversion Funnel
            </h3>
            <p className="text-xs text-steel font-normal truncate">
              TNEA conversion metrics and candidate lifecycle filtering
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Total Counter */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-paper p-1 rounded-badge border border-fog text-xs font-medium">
            <button
              onClick={() => setViewMode("SINGLE")}
              className={`px-3 py-1 rounded-badge transition-all ${
                viewMode === "SINGLE"
                  ? "bg-obsidian text-white shadow-sm"
                  : "text-steel hover:text-graphite"
              }`}
            >
              Focused View
            </button>
            <button
              onClick={() => setViewMode("ALL")}
              className={`px-3 py-1 rounded-badge transition-all ${
                viewMode === "ALL"
                  ? "bg-obsidian text-white shadow-sm"
                  : "text-steel hover:text-graphite"
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode("SEGREGATION")}
              className={`px-3 py-1 rounded-badge transition-all ${
                viewMode === "SEGREGATION"
                  ? "bg-obsidian text-white shadow-sm"
                  : "text-steel hover:text-graphite"
              }`}
            >
              Segregation
            </button>
          </div>

          <div className="text-xs text-graphite bg-paper px-3.5 py-1.5 rounded-full border border-fog shrink-0">
            <span className="text-steel">Total Pipeline:</span>{" "}
            <strong className="text-obsidian font-semibold">{total}</strong>
          </div>
        </div>
      </div>

      {/* FILTER OPTIONS PILLS BAR (ALL + 5 STAGES) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar w-full max-w-full">
        <span className="text-xs font-medium text-steel flex items-center gap-1.5 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5 text-obsidian" /> Stage:
        </span>

        {/* ALL Option Pill */}
        <button
          onClick={() => handleStageSelect(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-2 ${
            activeStageKey === null
              ? "bg-obsidian text-white shadow-sm font-semibold"
              : "bg-paper text-graphite hover:border-steel border border-fog"
          }`}
        >
          <span>All Stages</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-2 ${
                isSelected
                  ? "bg-obsidian text-white shadow-sm font-semibold"
                  : "bg-paper text-graphite hover:border-steel border border-fog"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
              <span>{stage.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? "bg-white/20 text-white" : "bg-mist text-steel"}`}>
                {stage.count}
              </span>
            </button>
          );
        })}

        {activeStageKey !== null && (
          <button
            onClick={() => handleStageSelect(null)}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-ember bg-mist border border-fog hover:border-steel shrink-0 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Reset Filter
          </button>
        )}
      </div>

      {/* Multi-segment Hairline Capsule Bar */}
      <div className="w-full h-2.5 bg-mist rounded-full overflow-hidden flex gap-1 p-0.5 border border-fog mb-5">
        {stages.map((stage) => {
          const pct = ((stage.count / total) * 100).toFixed(1);
          const isSelected = activeStageKey === stage.key;
          return (
            <div
              key={stage.key}
              onClick={() => handleStageSelect(isSelected ? null : stage.key)}
              style={{ width: `${Math.max(Number(pct), 4)}%` }}
              className={`h-full ${stage.bar} rounded-full transition-all duration-300 cursor-pointer ${
                isSelected ? "ring-2 ring-obsidian opacity-100 scale-y-110" : "opacity-80 hover:opacity-100"
              }`}
              title={`${stage.label}: ${stage.count} (${pct}%)`}
            />
          );
        })}
      </div>

      {/* VIEW MODE 1: SHOW ONE BY ONE (FOCUSED STAGE CARD SLIDER) */}
      {viewMode === "SINGLE" && (
        <div className="relative">
          <div className="p-5 sm:p-6 rounded-[28px] bg-paper border border-fog transition-all duration-300">
            {/* Top Stepper Badge & Navigation Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-obsidian bg-white px-3 py-1 rounded-full border border-fog">
                  Stage {activeSingleIndex + 1} of {stages.length}
                </span>
                {activeStageKey === currentStage.key && (
                  <span className="text-[10px] font-semibold text-white bg-ember px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active Filter
                  </span>
                )}
              </div>

              {/* Prev / Next Stage Stepper Arrows */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevStage}
                  className="px-3 py-1.5 rounded-button bg-white border border-fog text-graphite hover:text-obsidian hover:border-steel transition-all flex items-center gap-1 text-xs font-medium"
                  title="Previous Stage"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="px-3 py-1.5 rounded-button bg-white border border-fog text-graphite hover:text-obsidian hover:border-steel transition-all flex items-center gap-1 text-xs font-medium"
                  title="Next Stage"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stage Detail Card Body */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              {/* Left Column: Stage Identity */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${currentStage.dotColor}`} />
                  <h4 className="text-lg font-semibold text-obsidian">{currentStage.label}</h4>
                </div>
                <p className="text-xs text-steel font-normal leading-relaxed">
                  {currentStage.desc}
                </p>
                <div className="pt-1">
                  <span className="text-[11px] font-mono text-graphite bg-white font-medium px-2.5 py-1 rounded-badge border border-fog">
                    Key: {currentStage.key}
                  </span>
                </div>
              </div>

              {/* Center Column: Big Metrics Display */}
              <div className="bg-white border border-fog rounded-[20px] p-5 text-center space-y-1">
                <span className="text-xs font-semibold text-steel uppercase tracking-wider block">
                  Stage Candidates
                </span>
                <div className="text-3xl font-semibold text-obsidian tracking-tight flex items-center justify-center gap-1">
                  <span>{currentStage.count}</span>
                  <span className="text-xs text-steel font-normal">leads</span>
                </div>
                <div className="pt-1">
                  <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-paper border border-fog text-graphite">
                    {Math.round((currentStage.count / total) * 100)}% of pipeline
                  </span>
                </div>
              </div>

              {/* Right Column: Progress & Action Button */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-graphite font-medium mb-1.5">
                    <span>Funnel Share</span>
                    <span className="font-semibold text-obsidian">
                      {((currentStage.count / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-mist rounded-full overflow-hidden">
                    <div
                      style={{ width: `${((currentStage.count / total) * 100).toFixed(1)}%` }}
                      className="h-full bg-obsidian rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleStageSelect(activeStageKey === currentStage.key ? null : currentStage.key)
                  }
                  className={`w-full py-2.5 px-4 rounded-button text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeStageKey === currentStage.key
                      ? "bg-ember hover:bg-orange-600 text-white shadow-sm"
                      : "bg-obsidian hover:bg-black text-white shadow-sm"
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
                className={`border rounded-[20px] p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-paper border-steel shadow-sm"
                    : "bg-white border-fog hover:border-steel"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
                    <span className="text-xs text-graphite font-semibold">
                      {stage.label}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] bg-ember text-white px-2 py-0.5 rounded-full font-semibold inline-block mb-2">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-fog">
                  <span className="text-2xl font-semibold text-obsidian">
                    {stage.count}
                  </span>
                  <span className="text-xs font-medium text-steel">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: LEAD STAGE SEGREGATION HORIZONTAL BAR CHART */}
      {viewMode === "SEGREGATION" && (
        <div className="bg-paper p-5 sm:p-6 rounded-[28px] border border-fog space-y-4">
          <div className="flex items-center justify-between border-b border-fog pb-3">
            <h3 className="text-sm font-semibold text-obsidian">Lead Stage Segregation</h3>
            <button
              onClick={() => setViewMode("SINGLE")}
              className="text-xs font-medium text-steel hover:text-obsidian"
            >
              Close ✕
            </button>
          </div>

          <div className="space-y-2 pt-2">
            {segregationData.map((item) => {
              const widthPct = Math.max((item.count / maxSegregationCount) * 100, 1.5);
              return (
                <div key={item.label} className="grid grid-cols-12 items-center gap-3 text-xs">
                  <div className="col-span-4 sm:col-span-3 text-right font-medium text-graphite truncate">
                    {item.label}
                  </div>
                  <div className="col-span-8 sm:col-span-9 flex items-center gap-2">
                    <div className="w-full bg-mist rounded-badge h-4 relative overflow-hidden flex items-center">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className={`h-full ${item.color} transition-all duration-500 rounded-badge`}
                      />
                      <span className="text-[10px] font-semibold text-obsidian ml-2">
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
