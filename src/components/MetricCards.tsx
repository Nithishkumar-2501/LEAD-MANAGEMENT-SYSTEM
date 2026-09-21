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
      subtitle: "vs last cycle",
      icon: Users,
      badgeStyle: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60",
      barColor: "bg-indigo-600",
      iconStyle: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50",
      progress: 82,
    },
    {
      title: "Verified Marksheets",
      value: metrics.applicationsVerified.toLocaleString(),
      trend: `+${metrics.docsVerifiedTrend}%`,
      subtitle: "10th & 12th Cutoffs",
      icon: FileCheck2,
      badgeStyle: "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60",
      barColor: "bg-sky-500",
      iconStyle: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200 dark:border-sky-800/50",
      progress: 68,
    },
    {
      title: "Confirmed Enrolment",
      value: metrics.seatsFilled.toLocaleString(),
      trend: `+${metrics.seatsFilledTrend}%`,
      subtitle: "Seats Filled",
      icon: GraduationCap,
      badgeStyle: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
      barColor: "bg-emerald-600",
      iconStyle: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
      progress: 54,
    },
    {
      title: "Total Fee Receipts",
      value: `₹${metrics.totalRevenue.toLocaleString("en-IN")}`,
      trend: `+${metrics.revenueTrend}%`,
      subtitle: "Tuition Yield",
      icon: DollarSign,
      badgeStyle: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
      barColor: "bg-amber-500",
      iconStyle: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/50",
      progress: 90,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-white/10 p-5 shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 group cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Header: Title & Clean Icon Container */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${card.iconStyle}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              {/* Metric Value */}
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                {card.value}
              </h3>
            </div>

            {/* Footer: Soft Pastel Trend Tag & Progress Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${card.badgeStyle}`}>
                  <TrendingUp className="w-3 h-3" />
                  <span>{card.trend}</span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {card.subtitle}
                </span>
              </div>

              {/* Clean Minimal Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${card.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
