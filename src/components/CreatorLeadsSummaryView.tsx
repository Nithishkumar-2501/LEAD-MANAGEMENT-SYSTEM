"use client";

import React, { useMemo, useState, useRef } from "react";
import { Lead, Application, CampusLocation } from "@/types/crm";
import { MAX_FREE_LEAD_LIMIT } from "@/lib/leadQuotaService";
import { parseCSVToLeads, downloadSampleLeadsCSV } from "@/lib/csvParser";
import {
  calculateAllSourcesTelemetry,
  classifyLeadSourceKey,
  LeadSourceChannelMeta,
} from "@/lib/leadSourceAnalytics";
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
  Upload,
  FileSpreadsheet,
  Globe,
  Radio,
  Share2,
  Compass,
  MessageSquare,
  PhoneCall,
  Mail,
  School,
  ExternalLink,
  Filter,
  Check,
  Download,
} from "lucide-react";

interface CreatorLeadsSummaryViewProps {
  applicants: (Lead & { application: Application })[];
  selectedCampus: CampusLocation;
  onNavigateCreatorControl?: () => void;
  onImportLeads?: (importedLeads: (Lead & { application: Application })[], fileName?: string) => void;
  onTriggerToast?: (msg: string) => void;
}

export default function CreatorLeadsSummaryView({
  applicants = [],
  selectedCampus = "ALL",
  onNavigateCreatorControl,
  onImportLeads,
  onTriggerToast,
}: CreatorLeadsSummaryViewProps) {
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Comprehensive Telemetry across all sources (Project Expo, CSV, Social Media, Google Ads, etc.)
  const allSourcesTelemetry = useMemo(() => {
    return calculateAllSourcesTelemetry(applicants);
  }, [applicants]);

  // 2. Filter leads by campus and optional source channel
  const filtered = useMemo(() => {
    let result = applicants;
    if (selectedCampus !== "ALL") {
      result = result.filter((a) => a.campus === selectedCampus);
    }
    if (selectedSourceFilter !== "ALL") {
      result = result.filter((a) => classifyLeadSourceKey(a) === selectedSourceFilter);
    }
    return result;
  }, [applicants, selectedCampus, selectedSourceFilter]);

  const totalOverallLeads = applicants.length;
  const karurCount = applicants.filter((a) => a.campus === "KARUR").length;
  const covaiCount = applicants.filter((a) => a.campus === "COIMBATORE").length;
  const remainingQuota = Math.max(0, MAX_FREE_LEAD_LIMIT - totalOverallLeads);
  const percentUsed = ((totalOverallLeads / MAX_FREE_LEAD_LIMIT) * 100).toFixed(2);

  // Status counts (Count only, privacy preserved)
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

  // Helper for channel icons
  const renderChannelIcon = (type: string, className = "w-4 h-4") => {
    switch (type) {
      case "EXPO":
        return <School className={className} />;
      case "CSV":
        return <FileSpreadsheet className={className} />;
      case "GOOGLE":
        return <Globe className={className} />;
      case "META":
        return <Share2 className={className} />;
      case "WHATSAPP":
        return <MessageSquare className={className} />;
      case "SMS":
        return <PhoneCall className={className} />;
      case "EMAIL":
        return <Mail className={className} />;
      case "COUNSELLING":
        return <Compass className={className} />;
      case "WALKIN":
        return <Building className={className} />;
      case "CAMPAIGN":
        return <Radio className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  // CSV Lead Upload Handler
  const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          if (onTriggerToast) onTriggerToast("⚠️ Empty file selected.");
          return;
        }

        const parsed = parseCSVToLeads(
          text,
          selectedCampus === "ALL" ? "KARUR" : selectedCampus,
          "spherexnithish#",
          file.name
        );

        if (parsed.length === 0) {
          if (onTriggerToast) onTriggerToast(`⚠️ No valid leads parsed from "${file.name}".`);
          return;
        }

        if (onImportLeads) {
          onImportLeads(parsed, file.name);
        } else if (onTriggerToast) {
          onTriggerToast(`📥 Successfully parsed ${parsed.length} leads from "${file.name}".`);
        }
      } catch (err) {
        console.error("CSV parse error:", err);
        if (onTriggerToast) onTriggerToast("❌ Failed to parse CSV file. Please verify format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Hidden file input for CSV imports */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={handleCsvFileSelected}
      />

      {/* ============================================================== */}
      {/* 1. CREATOR PRIVACY HEADER WITH DIRECT CSV IMPORT ACTION       */}
      {/* ============================================================== */}
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
                <span>Multi-Source Lead Volume &amp; Quota Overview</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium">
                Live aggregation across all ingestion channels (Project Expo, CSV file imports, Social Media Ads, WhatsApp, Counselling). Personal student data is strictly hidden for Root Creator privacy compliance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Direct CSV Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>📥 Upload .CSV Leads</span>
            </button>

            {/* Download Template Sample */}
            <button
              type="button"
              onClick={() => downloadSampleLeadsCSV(selectedCampus === "ALL" ? "KARUR" : selectedCampus)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Download standard CSV spreadsheet template"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Template</span>
            </button>

            {onNavigateCreatorControl && (
              <button
                type="button"
                onClick={onNavigateCreatorControl}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <span>👑 Creator Licensing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Privacy Shield Notice */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              Institutional Lead Privacy Shield Active: Individual candidate phone numbers, addresses, and dossiers are accessible only by authorized Campus Admissions Staff.
            </span>
          </div>
          <div className="font-mono text-[11px] text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/50">
            Total Channels Tracked: <strong className="text-white">11 Ingestion Streams</strong>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PRIMARY HIGHLIGHTS & OVERALL COUNT TELEMETRY (SHOWN ABOVE)   */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
              Source Acquisition Breakdown (Shown Above Total Ingestion)
            </h2>
          </div>
          {selectedSourceFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedSourceFilter("ALL")}
              className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Reset Source Filter ({selectedSourceFilter})</span>
            </button>
          )}
        </div>

        {/* Top Highlight Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Overall Leads Ingested */}
          <div
            onClick={() => setSelectedSourceFilter("ALL")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedSourceFilter === "ALL"
                ? "bg-slate-900 border-sky-500 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500"
                : "bg-slate-950 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-black uppercase">
              <span>Overall Total Leads</span>
              <span className="p-1 rounded-lg bg-sky-500/10 text-sky-400">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-white font-mono">
                {totalOverallLeads.toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Sum of all applications &amp; sources</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Quota Cap:</span>
              <span className="font-mono font-bold text-sky-400">{MAX_FREE_LEAD_LIMIT.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Card 2: Project Expo & Outreach */}
          <div
            onClick={() => setSelectedSourceFilter("EXPO")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedSourceFilter === "EXPO"
                ? "bg-teal-950/60 border-teal-500 shadow-lg shadow-teal-950/40 ring-1 ring-teal-500"
                : "bg-slate-950 border-slate-800 hover:border-teal-500/50"
            }`}
          >
            <div className="flex items-center justify-between text-teal-400 text-[11px] font-black uppercase">
              <span>Project Expo</span>
              <span className="p-1 rounded-lg bg-teal-500/10 text-teal-400">
                <School className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-teal-300 font-mono">
                {allSourcesTelemetry.primaryHighlights.expoCount.toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Science exhibitions &amp; fairs</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Share of Total:</span>
              <span className="font-mono font-bold text-teal-400">
                {totalOverallLeads > 0
                  ? ((allSourcesTelemetry.primaryHighlights.expoCount / totalOverallLeads) * 100).toFixed(1)
                  : "0"}%
              </span>
            </div>
          </div>

          {/* Card 3: CSV Spreadsheet Imports */}
          <div
            onClick={() => setSelectedSourceFilter("CSV")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedSourceFilter === "CSV"
                ? "bg-lime-950/60 border-lime-500 shadow-lg shadow-lime-950/40 ring-1 ring-lime-500"
                : "bg-slate-950 border-slate-800 hover:border-lime-500/50"
            }`}
          >
            <div className="flex items-center justify-between text-lime-400 text-[11px] font-black uppercase">
              <span>CSV File Uploads</span>
              <span className="p-1 rounded-lg bg-lime-500/10 text-lime-400">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-lime-300 font-mono">
                {allSourcesTelemetry.primaryHighlights.csvCount.toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Bulk spreadsheet imports</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Share of Total:</span>
              <span className="font-mono font-bold text-lime-400">
                {totalOverallLeads > 0
                  ? ((allSourcesTelemetry.primaryHighlights.csvCount / totalOverallLeads) * 100).toFixed(1)
                  : "0"}%
              </span>
            </div>
          </div>

          {/* Card 4: Social Media & Digital Ads */}
          <div
            onClick={() => setSelectedSourceFilter("META")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedSourceFilter === "META" || selectedSourceFilter === "GOOGLE"
                ? "bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500"
                : "bg-slate-950 border-slate-800 hover:border-indigo-500/50"
            }`}
          >
            <div className="flex items-center justify-between text-indigo-400 text-[11px] font-black uppercase">
              <span>Social Media &amp; Ads</span>
              <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Share2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-indigo-300 font-mono">
                {allSourcesTelemetry.primaryHighlights.socialCount.toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Google, Meta, WhatsApp &amp; SMS</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Share of Total:</span>
              <span className="font-mono font-bold text-indigo-400">
                {totalOverallLeads > 0
                  ? ((allSourcesTelemetry.primaryHighlights.socialCount / totalOverallLeads) * 100).toFixed(1)
                  : "0"}%
              </span>
            </div>
          </div>

          {/* Card 5: Counselling Quota */}
          <div
            onClick={() => setSelectedSourceFilter("COUNSELLING")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedSourceFilter === "COUNSELLING"
                ? "bg-cyan-950/60 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500"
                : "bg-slate-950 border-slate-800 hover:border-cyan-500/50"
            }`}
          >
            <div className="flex items-center justify-between text-cyan-400 text-[11px] font-black uppercase">
              <span>TNEA Counselling</span>
              <span className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Compass className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-cyan-300 font-mono">
                {allSourcesTelemetry.primaryHighlights.counsellingCount.toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Govt merit &amp; general quota</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Share of Total:</span>
              <span className="font-mono font-bold text-cyan-400">
                {totalOverallLeads > 0
                  ? ((allSourcesTelemetry.primaryHighlights.counsellingCount / totalOverallLeads) * 100).toFixed(1)
                  : "0"}%
              </span>
            </div>
          </div>
        </div>

        {/* Visual Stacked Multi-Source Proportion Bar */}
        {totalOverallLeads > 0 && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Live Ingestion Distribution Ratio</span>
              <span>100% of {totalOverallLeads.toLocaleString("en-IN")} Ingested Leads</span>
            </div>
            <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              {allSourcesTelemetry.channels
                .filter((ch) => ch.count > 0)
                .map((ch) => {
                  const pct = totalOverallLeads > 0 ? (ch.count / totalOverallLeads) * 100 : 0;
                  return (
                    <div
                      key={ch.key}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: ch.colorHex,
                      }}
                      className="h-full transition-all hover:opacity-80"
                      title={`${ch.shortLabel}: ${ch.count.toLocaleString("en-IN")} leads (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              {allSourcesTelemetry.channels
                .filter((ch) => ch.count > 0)
                .map((ch) => (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() => setSelectedSourceFilter(ch.key)}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ch.colorHex }}
                    />
                    <span className="font-semibold">{ch.shortLabel}:</span>
                    <span className="font-mono text-slate-300 font-bold">{ch.count}</span>
                    <span className="text-[10px] text-slate-500">({ch.percentage}%)</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Complete 11-Channel Ingestion Grid */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">All Lead Sources Telemetry Breakdown</h3>
                <p className="text-xs text-slate-400">Click any channel card to filter admissions funnel and course demand</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-300">
                Filter: <strong className="text-sky-400">{selectedSourceFilter}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {allSourcesTelemetry.channels.map((channel) => {
              const isSelected = selectedSourceFilter === channel.key;
              return (
                <div
                  key={channel.key}
                  onClick={() =>
                    setSelectedSourceFilter(isSelected ? "ALL" : channel.key)
                  }
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "bg-slate-900 shadow-lg ring-2"
                      : "bg-slate-950 border-slate-800/80 hover:border-slate-700"
                  }`}
                  style={{
                    borderColor: isSelected ? channel.colorHex : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${channel.colorHex}20`,
                          color: channel.colorHex,
                        }}
                      >
                        {renderChannelIcon(channel.iconType, "w-4 h-4")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white truncate" title={channel.label}>
                          {channel.shortLabel}
                        </p>
                        <span
                          className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: `${channel.colorHex}15`,
                            color: channel.colorHex,
                          }}
                        >
                          {channel.badgeText}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-1" title={channel.description}>
                    {channel.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Volume: </span>
                      <strong className="text-lg font-black font-mono text-white">
                        {channel.count.toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold"
                      style={{
                        backgroundColor: `${channel.colorHex}15`,
                        color: channel.colorHex,
                      }}
                    >
                      {channel.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. CAMPUS LEAD CAPACITY & FREE QUOTA OVERVIEW                  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Overall Leads */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold uppercase">
            <span>Current Ingestion Total</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-white font-mono">
            {totalOverallLeads.toLocaleString("en-IN")}
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
              {totalOverallLeads > 0 ? ((karurCount / totalOverallLeads) * 100).toFixed(1) : 0}%
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
              {totalOverallLeads > 0 ? ((covaiCount / totalOverallLeads) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. LEADS COUNT BY ADMISSION STAGE (COUNT ONLY)                  */}
      {/* ============================================================== */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Lead Funnel Distribution (Candidate Counts)</h3>
              <p className="text-xs text-slate-400">
                Pipeline volume {selectedSourceFilter !== "ALL" ? `for ${selectedSourceFilter} source` : "across all sources"}
              </p>
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
            <p className="text-[10px] text-slate-500">Document &amp; marks review</p>
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

      {/* ============================================================== */}
      {/* 5. COURSE DEMAND VOLUME (COUNTS ONLY - NO INDIVIDUAL DATA)       */}
      {/* ============================================================== */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Course Demand Breakdown (Candidate Volume)</h3>
              <p className="text-xs text-slate-400">
                Inquiries and applications per engineering program {selectedSourceFilter !== "ALL" ? `(${selectedSourceFilter} source)` : ""}
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {courseCounts.length} Active Streams
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courseCounts.map(([courseName, count]) => {
            const pct = totalOverallLeads > 0 ? ((count / totalOverallLeads) * 100).toFixed(1) : "0";
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
