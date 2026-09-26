"use client";

import { useState, useMemo } from "react";
import {
  Lead,
  Application,
  Task,
  SummaryMetrics,
  LeadStatusCounts,
  CampusLocation,
} from "@/types/crm";
import {
  ShieldCheck,
  BarChart3,
  Users,
  GraduationCap,
  IndianRupee,
  FileCheck2,
  TrendingUp,
  Sparkles,
  MapPin,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  PhoneCall,
  Activity,
  HeartHandshake,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  PlusCircle,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ApplicantsTable from "@/components/ApplicantsTable";
import TaskSidebar from "@/components/TaskSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AdminDashboardViewProps {
  metrics: SummaryMetrics;
  statusCounts: LeadStatusCounts;
  applicants: (Lead & { application: Application })[];
  tasks: Task[];
  searchQuery: string;
  selectedCampus: CampusLocation;
  selectedStageFilter: string | null;
  onSelectStage: (stage: string | null) => void;
  onSelectApplicant: (applicant: Lead & { application: Application }) => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP" | "SMS", name: string) => void;
  onOpenCreateModal: () => void;
  onOpenQuickLeadModal: () => void;
  onToggleTask: (taskId: string) => void;
  onImportLeads: (newLeads: (Lead & { application: Application })[]) => void;
  onDeleteApplicant?: (id: string, name: string) => void;
}

export default function AdminDashboardView({
  metrics,
  statusCounts,
  applicants,
  tasks,
  searchQuery,
  selectedCampus,
  selectedStageFilter,
  onSelectStage,
  onSelectApplicant,
  onActionTrigger,
  onOpenCreateModal,
  onOpenQuickLeadModal,
  onToggleTask,
  onImportLeads,
  onDeleteApplicant,
}: AdminDashboardViewProps) {
  const [timeline, setTimeline] = useState<"7d" | "30d" | "90d" | "1y">("7d");
  const [funnelViewMode, setFunnelViewMode] = useState<"SINGLE" | "GRID" | "SEGREGATION">("SINGLE");
  const [activeStageIndex, setActiveStageIndex] = useState(1);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning, Executive Administrator";
    if (hour < 18) return "Good Afternoon, Executive Administrator";
    return "Good Evening, Executive Administrator";
  }, []);

  // Timeline multipliers
  const timelineLabelMap = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    "1y": "Past Year",
  };

  // Cutoff Range Aggregation
  const cutoffBrackets = useMemo(() => [
    {
      label: "190+ Merit Waiver",
      shortLabel: "190+ Cutoff",
      count: applicants.filter((a) => (a.tneaCutoff || 180) >= 190).length || 6,
      color: "#10b981",
      fillColor: "bg-emerald-500",
      description: "100% Tuition Fee Scholarship",
    },
    {
      label: "180-189 First Class",
      shortLabel: "180-189",
      count: applicants.filter((a) => (a.tneaCutoff || 180) >= 180 && (a.tneaCutoff || 180) < 190).length || 11,
      color: "#0284c7",
      fillColor: "bg-sky-500",
      description: "Priority Core Branch Allocation",
    },
    {
      label: "170-179 Preferred",
      shortLabel: "170-179",
      count: applicants.filter((a) => (a.tneaCutoff || 180) >= 170 && (a.tneaCutoff || 180) < 180).length || 1,
      color: "#6366f1",
      fillColor: "bg-indigo-500",
      description: "Counseling First Choice",
    },
    {
      label: "<170 Management",
      shortLabel: "< 170",
      count: applicants.filter((a) => (a.tneaCutoff || 180) < 170).length || 3,
      color: "#f59e0b",
      fillColor: "bg-amber-500",
      description: "Direct Management Allocation",
    },
  ], [applicants]);

  // Lead Conversion Funnel Stages
  const totalLeads =
    statusCounts.NEW +
    statusCounts.CONTACTED +
    statusCounts.IN_REVIEW +
    statusCounts.ADMITTED +
    statusCounts.REJECTED || 1;

  const funnelStages = useMemo(() => [
    {
      key: "NEW",
      label: "New Inquiry",
      count: statusCounts.NEW,
      share: ((statusCounts.NEW / totalLeads) * 100).toFixed(1),
      desc: "Initial student leads received via TNEA portals, walk-ins, and online inquiries.",
      color: "bg-sky-400",
      textColor: "text-sky-500 dark:text-sky-300",
      badgeColor: "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 border-sky-300",
    },
    {
      key: "CONTACTED",
      label: "Contacted",
      count: statusCounts.CONTACTED,
      share: ((statusCounts.CONTACTED / totalLeads) * 100).toFixed(1),
      desc: "Candidates actively engaged by admission counselors via telecall or parent counseling.",
      color: "bg-indigo-500",
      textColor: "text-indigo-500 dark:text-indigo-300",
      badgeColor: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border-indigo-300",
    },
    {
      key: "IN_REVIEW",
      label: "Cutoff Review",
      count: statusCounts.IN_REVIEW,
      share: ((statusCounts.IN_REVIEW / totalLeads) * 100).toFixed(1),
      desc: "Academic verification of 10th & 12th marks and Anna University normalization check.",
      color: "bg-amber-500",
      textColor: "text-amber-500 dark:text-amber-300",
      badgeColor: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 border-amber-300",
    },
    {
      key: "ADMITTED",
      label: "Admitted",
      count: statusCounts.ADMITTED,
      share: ((statusCounts.ADMITTED / totalLeads) * 100).toFixed(1),
      desc: "Confirmed seat allotment with initial admission fee payment and document verification.",
      color: "bg-emerald-500",
      textColor: "text-emerald-500 dark:text-emerald-300",
      badgeColor: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-300",
    },
    {
      key: "REJECTED",
      label: "Rejected / Withdrawn",
      count: statusCounts.REJECTED,
      share: ((statusCounts.REJECTED / totalLeads) * 100).toFixed(1),
      desc: "Candidates who opted for medical/NEET or withdrew their admission interest.",
      color: "bg-rose-500",
      textColor: "text-rose-500 dark:text-rose-300",
      badgeColor: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-300",
    },
  ], [statusCounts, totalLeads]);

  // Lead Velocity Trend Data (for AreaChart)
  const leadVelocityTrend = useMemo(() => [
    { day: "Mon", leads: 14, calls: 24 },
    { day: "Tue", leads: 22, calls: 38 },
    { day: "Wed", leads: 31, calls: 45 },
    { day: "Thu", leads: 28, calls: 41 },
    { day: "Fri", leads: 35, calls: 52 },
    { day: "Sat", leads: 20, calls: 32 },
    { day: "Sun", leads: 16, calls: 28 },
  ], []);

  // Overall Target Score (ScoreDonut)
  const admissionVelocityScore = 88;

  // Active Stage for Funnel
  const currentStage = funnelStages[activeStageIndex] || funnelStages[0];

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 animate-fadeIn">
      {/* 1. TOP EXECUTIVE HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-md transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 ring-2 ring-white/20">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Admin Executive Control Dashboard
                </h1>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 uppercase tracking-wider">
                  System Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {greeting} &bull; Real-time institutional oversight across Karur & Coimbatore campuses
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Active Scope Pill */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-amber-300 shadow-xs">
              <MapPin className="size-3.5 text-pink-500 animate-bounce" />
              <span>Scope: {selectedCampus} CAMPUS</span>
            </div>

            {/* Timeline Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  <Calendar className="size-3.5 text-sky-500" />
                  <span>{timelineLabelMap[timeline]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 p-1">
                {(["7d", "30d", "90d", "1y"] as const).map((t) => (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => setTimeline(t)}
                    className={cn(
                      "cursor-pointer rounded-lg text-xs font-semibold px-2.5 py-1.5",
                      timeline === t && "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300"
                    )}
                  >
                    {timelineLabelMap[t]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Action Buttons */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusCircle className="size-3.5" />
              <span>New Applicant</span>
            </button>
            <button
              type="button"
              onClick={onOpenQuickLeadModal}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Zap className="size-3.5" />
              <span>Quick Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. OVERALL ADMISSION VELOCITY & SCORE DONUT */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Overall Admission Intake Velocity
            </h2>
            <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Optimal Intake Pace
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Central Admissions is tracking at{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              +18.4% above last year&apos;s intake volume
            </span>{" "}
            for Karur and Coimbatore campuses. Computer Science, AI/DS, and ECE branches are pacing toward 100% quota capacity with strong merit cutoff enrollment.
          </p>
        </div>

        <div className="relative size-28 shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius="80%"
                outerRadius="92%"
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#0284c7" fillOpacity={0.12} />
              </Pie>
              <Pie
                data={[
                  { name: "Filled", value: admissionVelocityScore },
                  { name: "Remaining", value: 100 - admissionVelocityScore },
                ]}
                cx="50%"
                cy="50%"
                innerRadius="80%"
                outerRadius="92%"
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                cornerRadius={10}
              >
                <Cell fill="#0284c7" />
                <Cell fill="transparent" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Target Fill</span>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{admissionVelocityScore}%</span>
          </div>
        </div>
      </section>

      {/* 3. 4 KEY METRIC CARDS (From Image 2) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "TOTAL TNEA LEADS",
            value: metrics.totalLeads.toLocaleString(),
            trend: `+${metrics.leadsTrend}%`,
            subtitle: "vs last intake",
            icon: Users,
            color: "from-sky-500 to-blue-600",
            iconBg: "bg-sky-500",
            progress: 82,
          },
          {
            title: "VERIFIED MARKSHEETS",
            value: metrics.applicationsVerified.toLocaleString(),
            trend: `+${metrics.docsVerifiedTrend}%`,
            subtitle: "10th & 12th Cutoffs",
            icon: FileCheck2,
            color: "from-amber-500 to-orange-600",
            iconBg: "bg-amber-500",
            progress: 68,
          },
          {
            title: "CONFIRMED ENROLMENT",
            value: metrics.seatsFilled.toLocaleString(),
            trend: `+${metrics.seatsFilledTrend}%`,
            subtitle: "VSB Seats Filled",
            icon: GraduationCap,
            color: "from-emerald-500 to-teal-600",
            iconBg: "bg-emerald-500",
            progress: 54,
          },
          {
            title: "TOTAL FEE RECEIPTS",
            value: `₹${metrics.totalRevenue.toLocaleString("en-IN")}`,
            trend: `+${metrics.revenueTrend}%`,
            subtitle: "Tuition Revenue",
            icon: IndianRupee,
            color: "from-pink-500 to-rose-600",
            iconBg: "bg-pink-500",
            progress: 90,
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {card.value}
                  </h3>
                </div>
                <div className={cn("size-10 rounded-xl flex items-center justify-center text-white shadow-sm", card.iconBg)}>
                  <Icon className="size-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                    <TrendingUp className="size-3" />
                    <span>{card.trend}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal">{card.subtitle}</span>
                  </div>
                  <ArrowUpRight className="size-4 text-sky-500" />
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r", card.color)}
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. INTERACTIVE RECHARTS VISUALIZATION ROW */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Cutoff Distribution Breakdown Bar Chart */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-xs">
                <BarChart3 className="size-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  TNEA Cutoff Distribution Breakdown
                </h3>
                <p className="text-[11px] text-slate-500">Applicant qualification and scholarship tier mapping</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {applicants.length} Registered Applicants
            </span>
          </div>

          <div className="h-60 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cutoffBrackets} margin={{ top: 8, right: 8, left: -20, bottom: 8 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="3 3" />
                <XAxis dataKey="shortLabel" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={36} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white shadow-lg">
                        <p className="font-bold text-sky-400">{item.label}</p>
                        <p className="mt-1 font-extrabold text-white text-sm">{item.count} Candidates</p>
                        <p className="text-[11px] text-emerald-400 mt-0.5">{item.description}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {cutoffBrackets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
            {cutoffBrackets.map((item, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                <span className="text-[10px] text-slate-500 block truncate">{item.label}</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </article>

        {/* Lead Inflow & Counseling Velocity Area Chart */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-xs">
                <Activity className="size-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Lead Inflow & Counseling Activity Trend
                </h3>
                <p className="text-[11px] text-slate-500">Daily intake velocity vs. counselor call connects</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan-400" /> TNEA Inflow</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-purple-500" /> Counselor Calls</span>
            </div>
          </div>

          <div className="h-60 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadVelocityTrend} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.15)" strokeDasharray="3 3" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={36} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0]?.payload;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white shadow-lg">
                        <p className="font-bold text-slate-400">{p.day} Activity</p>
                        <p className="text-cyan-300 font-bold mt-1">TNEA Leads Inflow: {p.leads}</p>
                        <p className="text-purple-300 font-bold">Counselor Calls: {p.calls}</p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="leads" stroke="#06b6d4" strokeWidth={2.5} fill="url(#leadsGradient)" />
                <Area type="monotone" dataKey="calls" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#callsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-white/5 text-slate-500">
            <span>Weekly Outreach Velocity</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">92.4% Call Completion</span>
          </div>
        </article>
      </section>

      {/* 5. 3-COLUMN AI & INSTITUTIONAL INSIGHTS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: AI Admission Forecast */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-xs">
                <Sparkles className="size-4" />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs">AI Admission Prediction</h3>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              7d Outlook
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">CSE &amp; AI/DS Quota: 94% Filled</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Projected full allotment within 6 days.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <p className="font-bold text-amber-600 dark:text-amber-400">6 Merit Leads (190+) Awaiting Call</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">High probability of enrollment if engaged today.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <p className="font-bold text-sky-600 dark:text-sky-400">Regional Inflow Up +22%</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Coimbatore and Tirupur inquiries surge.</p>
            </div>
          </div>
        </article>

        {/* Column 2: Campus Vitals */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500 text-white shadow-xs">
                <HeartHandshake className="size-4" />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs">Campus Vitals</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              All Stable
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-600 dark:text-slate-300">Karur Campus Seat Fill</span>
              <span className="font-bold text-slate-900 dark:text-white">84.2%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-600 dark:text-slate-300">Coimbatore Campus Seat Fill</span>
              <span className="font-bold text-slate-900 dark:text-white">78.5%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-600 dark:text-slate-300">Marksheet OCR Audit</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">&lt; 1.2s</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-600 dark:text-slate-300">Counselor Connect Ratio</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">92.4%</span>
            </div>
          </div>
        </article>

        {/* Column 3: Recommended Actions */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-teal-500 text-white shadow-xs">
                <CheckCircle2 className="size-4" />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs">Recommended Actions</h3>
            </div>
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full">
              3 Pending
            </span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onActionTrigger("CALL", "Merit Waiver Candidate")}
              className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors text-xs cursor-pointer border border-transparent hover:border-teal-300 dark:hover:border-teal-700"
            >
              <p className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Telecall 190+ Cutoff Leads</span>
                <PhoneCall className="size-3 text-teal-500" />
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Secure Anna University scholarship confirmation.</p>
            </button>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">Audit 4 Pending Marksheets</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Normalization check ready for review.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">Dispatch Tuition Fee Reminders</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">5 admitted students pending payment lock.</p>
            </div>
          </div>
        </article>
      </section>

      {/* 6. VSB TNEA LEAD CONVERSION FUNNEL (Row 3 from Image 2) */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-xs">
              <Clock className="size-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                VSB TNEA Lead Conversion Funnel
              </h3>
              <p className="text-[11px] text-slate-500">Filter stage options and view candidates one by one</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFunnelViewMode("SINGLE")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                funnelViewMode === "SINGLE"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              One by One View
            </button>
            <button
              type="button"
              onClick={() => setFunnelViewMode("GRID")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                funnelViewMode === "GRID"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              Show All Grid
            </button>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl">
              Total Pipeline: {totalLeads}
            </span>
          </div>
        </div>

        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onSelectStage(null)}
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
              selectedStageFilter === null
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
            )}
          >
            All Stages ({totalLeads})
          </button>
          {funnelStages.map((stg) => (
            <button
              key={stg.key}
              type="button"
              onClick={() => onSelectStage(stg.key)}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5",
                selectedStageFilter === stg.key
                  ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <span className={cn("size-2 rounded-full", stg.color)} />
              <span>{stg.label} ({stg.count})</span>
            </button>
          ))}
          {selectedStageFilter && (
            <button
              type="button"
              onClick={() => onSelectStage(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white ml-1 cursor-pointer"
            >
              &times; Reset Filter
            </button>
          )}
        </div>

        {/* Multi-colored Funnel Progress Line */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
          {funnelStages.map((stg) => (
            <div
              key={stg.key}
              className={cn("h-full transition-all duration-500", stg.color)}
              style={{ width: `${Math.max(2, (stg.count / totalLeads) * 100)}%` }}
            />
          ))}
        </div>

        {/* Detailed Stage View (Single or Grid) */}
        {funnelViewMode === "SINGLE" ? (
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  STAGE {activeStageIndex + 1} OF {funnelStages.length}
                </span>
                <span className={cn("size-2 rounded-full", currentStage.color)} />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{currentStage.label}</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg">{currentStage.desc}</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Stage Leads</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{currentStage.count}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Funnel Share</p>
                <p className="text-2xl font-black text-sky-600 dark:text-sky-400">{currentStage.share}%</p>
              </div>
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveStageIndex((prev) => (prev > 0 ? prev - 1 : funnelStages.length - 1))}
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer shadow-xs"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStageIndex((prev) => (prev < funnelStages.length - 1 ? prev + 1 : 0))}
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer shadow-xs"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {funnelStages.map((stg, i) => (
              <div
                key={stg.key}
                onClick={() => {
                  setActiveStageIndex(i);
                  onSelectStage(stg.key);
                }}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer",
                  selectedStageFilter === stg.key
                    ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 shadow-sm"
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{stg.label}</span>
                  <span className={cn("size-2 rounded-full", stg.color)} />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-black text-slate-900 dark:text-white">{stg.count}</span>
                  <span className="text-xs font-semibold text-slate-500">{stg.share}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. INTEGRATED APPLICANTS TABLE & TASK SIDEBAR */}
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full min-w-0">
        <ApplicantsTable
          applicants={applicants}
          searchQuery={searchQuery}
          onSelectApplicant={onSelectApplicant}
          onActionTrigger={onActionTrigger}
          onOpenCreateModal={onOpenCreateModal}
          onOpenQuickLeadModal={onOpenQuickLeadModal}
          onImportLeads={onImportLeads}
          onDeleteApplicant={onDeleteApplicant}
        />
        <TaskSidebar
          tasks={tasks}
          onToggleTask={onToggleTask}
          onActionTrigger={onActionTrigger}
        />
      </div>
    </div>
  );
}
