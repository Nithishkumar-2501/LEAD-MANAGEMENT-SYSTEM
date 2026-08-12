"use client";

import { Users, FileCheck2, GraduationCap, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import { SummaryMetrics } from "@/types/crm";

interface MetricCardsProps {
  metrics: SummaryMetrics;
}

export default function MetricCards({ metrics }: MetricCardsProps) {
  const cards = [
    {
      title: "Total TNEA Leads",
      value: metrics.totalLeads.toLocaleString(),
      trend: `+${metrics.leadsTrend}%`,
      subtitle: "vs last intake",
      icon: Users,
      color: "from-sky-400 to-indigo-500",
      sphereGlow: "from-sky-400 via-indigo-500 to-purple-500",
      progress: 82,
    },
    {
      title: "Verified Marksheets",
      value: metrics.applicationsVerified.toLocaleString(),
      trend: `+${metrics.docsVerifiedTrend}%`,
      subtitle: "10th & 12th Cutoffs",
      icon: FileCheck2,
      color: "from-amber-400 to-orange-500",
      sphereGlow: "from-amber-400 via-orange-500 to-pink-500",
      progress: 68,
    },
    {
      title: "Confirmed Enrolment",
      value: metrics.seatsFilled.toLocaleString(),
      trend: `+${metrics.seatsFilledTrend}%`,
      subtitle: "VSB Seats Filled",
      icon: GraduationCap,
      color: "from-emerald-400 to-teal-500",
      sphereGlow: "from-emerald-400 via-teal-500 to-cyan-500",
      progress: 54,
    },
    {
      title: "Total Fee Receipts",
      value: `₹${metrics.totalRevenue.toLocaleString("en-IN")}`,
      trend: `+${metrics.revenueTrend}%`,
      subtitle: "Tuition Revenue",
      icon: DollarSign,
      color: "from-pink-500 to-rose-500",
      sphereGlow: "from-pink-500 via-rose-500 to-purple-600",
      progress: 90,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="bubble-card p-4 sm:p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          >
            {/* Top Gloss Accent */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${card.color}`} />

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                <h3 className="text-2xl font-black text-white tracking-tight">{card.value}</h3>
              </div>
              <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${card.sphereGlow} flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-2 ring-white/30 backdrop-blur-md`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            {/* Bubble Trend Indicator */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{card.trend}</span>
                <span className="text-slate-400 font-normal ml-1">{card.subtitle}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

            {/* Glossy Progress Pill Capsule */}
            <div className="w-full bg-slate-950/70 h-2 rounded-full mt-3 overflow-hidden border border-white/10 p-0.5">
              <div
                className={`h-full bg-gradient-to-r ${card.color} rounded-full transition-all duration-500 shadow-sm`}
                style={{ width: `${card.progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
