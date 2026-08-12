"use client";

import { LeadStatusCounts } from "@/types/crm";
import { Filter, PieChart } from "lucide-react";

interface LeadFunnelChartProps {
  statusCounts: LeadStatusCounts;
}

export default function LeadFunnelChart({ statusCounts }: LeadFunnelChartProps) {
  const total =
    statusCounts.NEW +
    statusCounts.CONTACTED +
    statusCounts.IN_REVIEW +
    statusCounts.ADMITTED +
    statusCounts.REJECTED || 1;

  const stages = [
    { label: "New Inquiry", key: "NEW", count: statusCounts.NEW, color: "bg-sky-400", text: "text-sky-300", bar: "from-sky-400 to-blue-600" },
    { label: "Contacted", key: "CONTACTED", count: statusCounts.CONTACTED, color: "bg-indigo-400", text: "text-indigo-300", bar: "from-indigo-500 to-purple-600" },
    { label: "Cutoff Review", key: "IN_REVIEW", count: statusCounts.IN_REVIEW, color: "bg-amber-400", text: "text-amber-300", bar: "from-amber-400 to-orange-500" },
    { label: "Admitted", key: "ADMITTED", count: statusCounts.ADMITTED, color: "bg-emerald-400", text: "text-emerald-300", bar: "from-emerald-400 to-teal-500" },
    { label: "Rejected", key: "REJECTED", count: statusCounts.REJECTED, color: "bg-rose-400", text: "text-rose-300", bar: "from-rose-500 to-pink-600" },
  ];

  return (
    <div className="bubble-card p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-2 ring-white/20">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">VSB TNEA Lead Conversion Funnel</h3>
            <p className="text-xs text-slate-400 font-medium">Real-time candidate progression through admission stages</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-200 bg-slate-900/80 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-xl">
          <Filter className="w-3.5 h-3.5 text-sky-400" />
          <span>Total Pipeline: <strong className="text-white font-bold">{total}</strong></span>
        </div>
      </div>

      {/* Multi-segment Liquid Capsule Bar */}
      <div className="w-full h-4 bg-slate-950/80 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-white/20 mb-5 shadow-inner">
        {stages.map((stage) => {
          const pct = ((stage.count / total) * 100).toFixed(1);
          return (
            <div
              key={stage.key}
              style={{ width: `${Math.max(Number(pct), 5)}%` }}
              className={`h-full bg-gradient-to-r ${stage.bar} rounded-full transition-all duration-500 hover:opacity-90 cursor-pointer shadow-sm`}
              title={`${stage.label}: ${stage.count} (${pct}%)`}
            />
          );
        })}
      </div>

      {/* Stage Grid Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const pct = Math.round((stage.count / total) * 100);
          return (
            <div
              key={stage.key}
              className="bg-slate-900/60 border border-white/15 rounded-2xl p-3.5 flex flex-col justify-between hover:border-sky-400/40 transition-all backdrop-blur-md"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${stage.color} shadow-sm`} />
                <span className="text-xs text-slate-300 font-bold">{stage.label}</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-white">{stage.count}</span>
                <span className={`text-xs font-black ${stage.text}`}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
