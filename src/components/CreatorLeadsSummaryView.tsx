"use client";

import React, { useMemo } from "react";
import { Lead, Application, CampusLocation } from "@/types/crm";
import { MAX_FREE_LEAD_LIMIT } from "@/lib/leadQuotaService";
import {
  Users,
  ShieldAlert,
  Crown,
  Building,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart2,
  ShieldCheck,
} from "lucide-react";

interface CreatorLeadsSummaryViewProps {
  applicants: (Lead & { application: Application })[];
  selectedCampus: CampusLocation;
  onNavigateCreatorControl?: () => void;
}

export default function CreatorLeadsSummaryView({
  applicants = [],
  selectedCampus = "ALL",
  onNavigateCreatorControl,
}: CreatorLeadsSummaryViewProps) {
  // Filter leads by campus if selected
  const filtered = useMemo(() => {
    if (selectedCampus === "ALL") return applicants;
    return applicants.filter((a) => a.campus === selectedCampus);
  }, [applicants, selectedCampus]);

  const totalLeads = applicants.length;
  const karurCount = applicants.filter((a) => a.campus === "KARUR").length;
  const covaiCount = applicants.filter((a) => a.campus === "COIMBATORE").length;
  const remainingQuota = Math.max(0, MAX_FREE_LEAD_LIMIT - totalLeads);
  const percentUsed = ((totalLeads / MAX_FREE_LEAD_LIMIT) * 100).toFixed(2);

  // Status counts (Count only, no personal data)
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      NEW: 0,
      INQUIRY: 0,
      CONTACTED: 0,
      COUNSELING: 0,
      APPLICATION: 0,
      IN_REVIEW: 0,
      ADMITTED: 0,
      ENROLLED: 0,
      REJECTED: 0,
    };
    filtered.forEach((lead) => {
      const st = (lead.status || "NEW").toUpperCase();
      if (counts[st] !== undefined) {
        counts[st]++;
      } else {
        counts.INQUIRY = (counts.INQUIRY || 0) + 1;
      }
    });
    return counts;
  }, [filtered]);

  // Course demand counts (Count only)
  const courseCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((lead) => {
      const course = lead.courseInterest || "General Engineering";
      map[course] = (map[course] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* 1. CREATOR PRIVACY HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 p-6 md:p-8 border-2 border-indigo-500/30 shadow-2xl shadow-indigo-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/30 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Users className="w-7 h-7 text-sky-400" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>MASTER CREATOR TELEMETRY</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>STUDENT DATA PROTECTED (COUNT ONLY)</span>
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Total Lead Volume &amp; Quota Overview</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium">
                Showing aggregate student lead counts across campus branches. Personal student data (names, mobile numbers, marks) is strictly hidden for Root Creator privacy compliance.
              </p>
            </div>
          </div>

          {onNavigateCreatorControl && (
            <button
              type="button"
              onClick={onNavigateCreatorControl}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-orange-500/20 flex items-center gap-2 shrink-0 transition-transform active:scale-95 cursor-pointer"
            >
              <span>👑 Open Creator Licensing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Privacy Shield Notice */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            Institutional Lead Privacy Shield Active: Individual candidate phone numbers, addresses, and dossiers are accessible only by authorized Campus Admissions Staff.
          </span>
        </div>
      </div>

      {/* 2. PRIMARY LEAD COUNT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Overall Leads */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold uppercase">
            <span>Overall Leads Ingested</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-white font-mono">
            {totalLeads.toLocaleString("en-IN")}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
            <span>Annual Free Quota:</span>
            <span className="font-mono font-bold text-sky-400">{MAX_FREE_LEAD_LIMIT.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Remaining Quota */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold uppercase">
            <span>Free Quota Remaining</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-emerald-400 font-mono">
            {remainingQuota.toLocaleString("en-IN")}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
            <span>Capacity Utilized:</span>
            <span className="font-mono font-bold text-emerald-400">{percentUsed}%</span>
          </div>
        </div>

        {/* Karur Campus Count */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold uppercase">
            <span>Karur Main Campus</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-amber-400 font-mono">
            {karurCount.toLocaleString("en-IN")}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
            <span>Share of Total:</span>
            <span className="font-mono font-bold text-white">
              {totalLeads > 0 ? ((karurCount / totalLeads) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Coimbatore Campus Count */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold uppercase">
            <span>Coimbatore Campus</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-indigo-400 font-mono">
            {covaiCount.toLocaleString("en-IN")}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
            <span>Share of Total:</span>
            <span className="font-mono font-bold text-white">
              {totalLeads > 0 ? ((covaiCount / totalLeads) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. LEADS COUNT BY ADMISSION STAGE (COUNT ONLY) */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Lead Funnel Distribution (Candidate Counts)</h3>
              <p className="text-xs text-slate-400">Total volume across admission pipeline stages</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-300">
            {filtered.length} Filtered Leads
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Inquiry Leads</span>
            <p className="text-2xl font-black font-mono text-sky-400">
              {(stageCounts.NEW + stageCounts.INQUIRY).toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-500">Initial student inquiries</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Contacted</span>
            <p className="text-2xl font-black font-mono text-amber-400">
              {(stageCounts.CONTACTED + stageCounts.COUNSELING).toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-500">Faculty counseling outreach</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Applications Filed</span>
            <p className="text-2xl font-black font-mono text-indigo-400">
              {(stageCounts.APPLICATION + stageCounts.IN_REVIEW).toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-500">Document & marks review</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Admitted / Enrolled</span>
            <p className="text-2xl font-black font-mono text-emerald-400">
              {(stageCounts.ADMITTED + stageCounts.ENROLLED).toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-emerald-500 font-semibold">Confirmed admission</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Closed / Dropped</span>
            <p className="text-2xl font-black font-mono text-rose-400">
              {(stageCounts.REJECTED).toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-500">Opted for other college</p>
          </div>
        </div>
      </div>

      {/* 4. COURSE DEMAND VOLUME (COUNTS ONLY - NO INDIVIDUAL DATA) */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Course Demand Breakdown (Candidate Volume)</h3>
              <p className="text-xs text-slate-400">Total inquiries and applications aggregated per engineering program</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {courseCounts.length} Active Streams
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courseCounts.map(([courseName, count], idx) => {
            const pct = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : "0";
            return (
              <div
                key={courseName}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-white truncate" title={courseName}>
                    {courseName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {pct}% of platform inquiries
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 font-mono font-black text-xs">
                    {count} Leads
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
