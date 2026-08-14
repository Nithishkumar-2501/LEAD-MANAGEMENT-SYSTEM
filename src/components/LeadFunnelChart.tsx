"use client";

import { useState } from "react";
import { LeadStatusCounts } from "@/types/crm";
import { Filter, PieChart, CheckCircle2, ChevronRight, RefreshCw, Layers } from "lucide-react";

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

  const activeStage = externalSelectedStage !== undefined ? externalSelectedStage : internalSelectedStage;

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
      text: "text-sky-300",
      border: "border-sky-500/40",
      activeBg: "bg-sky-950/40 border-sky-400",
      bar: "from-sky-400 to-blue-600",
      glow: "shadow-sky-500/20",
    },
    {
      label: "Contacted",
      key: "CONTACTED",
      count: statusCounts.CONTACTED,
      color: "bg-indigo-400",
      text: "text-indigo-300",
      border: "border-indigo-500/40",
      activeBg: "bg-indigo-950/40 border-indigo-400",
      bar: "from-indigo-500 to-purple-600",
      glow: "shadow-indigo-500/20",
    },
    {
      label: "Cutoff Review",
      key: "IN_REVIEW",
      count: statusCounts.IN_REVIEW,
      color: "bg-amber-400",
      text: "text-amber-300",
      border: "border-amber-500/40",
      activeBg: "bg-amber-950/40 border-amber-400",
      bar: "from-amber-400 to-orange-500",
      glow: "shadow-amber-500/20",
    },
    {
      label: "Admitted",
      key: "ADMITTED",
      count: statusCounts.ADMITTED,
      color: "bg-emerald-400",
      text: "text-emerald-300",
      border: "border-emerald-500/40",
      activeBg: "bg-emerald-950/40 border-emerald-400",
      bar: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-500/20",
    },
    {
      label: "Rejected",
      key: "REJECTED",
      count: statusCounts.REJECTED,
      color: "bg-rose-400",
      text: "text-rose-300",
      border: "border-rose-500/40",
      activeBg: "bg-rose-950/40 border-rose-400",
      bar: "from-rose-500 to-pink-600",
      glow: "shadow-rose-500/20",
    },
  ];

  return (
    <div className="bubble-card p-4 sm:p-6 mb-4 sm:mb-6">
      {/* Header with Title and Filter Dropdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-2 ring-white/20 shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              VSB TNEA Lead Conversion Funnel
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Real-time candidate progression through admission stages
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Dropdown Filter Option */}
          <div className="relative flex-1 sm:flex-initial">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-sky-400/40 rounded-xl px-3 py-1.5 backdrop-blur-xl shadow-lg hover:border-sky-400 transition-colors">
              <Filter className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <select
                value={activeStage || "ALL"}
                onChange={(e) => handleStageSelect(e.target.value === "ALL" ? null : e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
              >
                <option value="ALL" className="bg-slate-900 text-white font-medium">
                  Filter Stage: All Pipeline ({total})
                </option>
                {stages.map((s) => (
                  <option key={s.key} value={s.key} className="bg-slate-900 text-white font-medium">
                    {s.label} ({s.count} - {Math.round((s.count / total) * 100)}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeStage && (
            <button
              onClick={() => handleStageSelect(null)}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800/80 border border-white/20 px-2.5 py-1.5 rounded-xl transition-all hover:bg-slate-700"
            >
              <RefreshCw className="w-3 h-3 text-sky-400" />
              <span>Reset</span>
            </button>
          )}

          <div className="text-xs text-slate-200 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-white/15 backdrop-blur-xl shrink-0">
            <span className="text-slate-400">Total:</span>{" "}
            <strong className="text-white font-bold">{total}</strong>
          </div>
        </div>
      </div>

      {/* Multi-segment Liquid Capsule Bar */}
      <div className="w-full h-3.5 bg-slate-950/80 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-white/20 mb-5 shadow-inner">
        {stages.map((stage) => {
          const pct = ((stage.count / total) * 100).toFixed(1);
          const isSelected = activeStage === stage.key;
          return (
            <div
              key={stage.key}
              onClick={() => handleStageSelect(isSelected ? null : stage.key)}
              style={{ width: `${Math.max(Number(pct), 4)}%` }}
              className={`h-full bg-gradient-to-r ${stage.bar} rounded-full transition-all duration-300 hover:opacity-100 cursor-pointer shadow-sm ${
                isSelected ? "ring-2 ring-white scale-y-125 z-10 opacity-100" : "opacity-75"
              }`}
              title={`${stage.label}: ${stage.count} (${pct}%) - Click to filter`}
            />
          );
        })}
      </div>

      {/* LIST WISE STAGE LAYOUT */}
      <div className="space-y-2.5">
        <div className="hidden sm:flex items-center justify-between text-[11px] font-bold text-slate-400 px-3 pb-1 border-b border-white/10 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" /> Admission Stage Name
          </span>
          <div className="flex items-center gap-8 pr-2">
            <span>Progress Share</span>
            <span>Candidates</span>
            <span>Filter</span>
          </div>
        </div>

        {stages.map((stage) => {
          const pct = Math.round((stage.count / total) * 100);
          const isSelected = activeStage === stage.key;

          return (
            <div
              key={stage.key}
              onClick={() => handleStageSelect(isSelected ? null : stage.key)}
              className={`p-3 sm:px-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSelected
                  ? `${stage.activeBg} shadow-xl ${stage.glow} ring-1 ring-white/30 scale-[1.01]`
                  : "bg-slate-900/60 border-white/10 hover:border-sky-400/40 hover:bg-slate-900/90"
              }`}
            >
              {/* Left: Stage Title & Indicator */}
              <div className="flex items-center gap-3 sm:w-1/3">
                <span className={`w-3 h-3 rounded-full ${stage.color} shadow-sm shrink-0`} />
                <div>
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    {stage.label}
                    {isSelected && (
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-400/30">
                        Active Filter
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Stage Key: {stage.key}</p>
                </div>
              </div>

              {/* Middle: Horizontal Progress Bar */}
              <div className="flex-1 px-0 sm:px-4">
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold mb-1">
                  <span>Share of total pipeline</span>
                  <span className={stage.text}>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full bg-gradient-to-r ${stage.bar} rounded-full transition-all duration-500`}
                  />
                </div>
              </div>

              {/* Right: Count & Select Button */}
              <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-1/4">
                <div className="text-right">
                  <span className="text-base font-black text-white">{stage.count}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">leads</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStageSelect(isSelected ? null : stage.key);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isSelected
                      ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30"
                      : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                    </>
                  ) : (
                    <>
                      Filter <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
