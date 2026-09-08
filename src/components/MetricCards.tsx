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
      progress: 82,
    },
    {
      title: "Verified Marksheets",
      value: metrics.applicationsVerified.toLocaleString(),
      trend: `+${metrics.docsVerifiedTrend}%`,
      subtitle: "10th & 12th Cutoffs",
      icon: FileCheck2,
      progress: 68,
    },
    {
      title: "Confirmed Enrolment",
      value: metrics.seatsFilled.toLocaleString(),
      trend: `+${metrics.seatsFilledTrend}%`,
      subtitle: "VSB Seats Filled",
      icon: GraduationCap,
      progress: 54,
    },
    {
      title: "Total Fee Receipts",
      value: `₹${metrics.totalRevenue.toLocaleString("en-IN")}`,
      trend: `+${metrics.revenueTrend}%`,
      subtitle: "Tuition Revenue",
      icon: DollarSign,
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
            className="bg-white rounded-[36px] p-5 sm:p-6 border border-fog relative overflow-hidden group hover:border-steel transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] font-semibold text-steel uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                <h3 className="text-3xl font-semibold text-obsidian tracking-tight">{card.value}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-paper border border-fog flex items-center justify-center text-graphite group-hover:text-obsidian group-hover:border-steel transition-all">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            {/* Trend Indicator & Action */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-fog">
              <div className="flex items-center gap-1.5 text-xs font-medium text-graphite bg-mist px-2.5 py-0.5 rounded-full border border-fog">
                <TrendingUp className="w-3 h-3 text-ember" />
                <span className="font-semibold text-obsidian">{card.trend}</span>
                <span className="text-steel font-normal ml-0.5">{card.subtitle}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-steel group-hover:text-ember group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

            {/* Hairline Progress Track */}
            <div className="w-full bg-mist h-1 rounded-full mt-3.5 overflow-hidden">
              <div
                className="h-full bg-obsidian rounded-full transition-all duration-500"
                style={{ width: `${card.progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
