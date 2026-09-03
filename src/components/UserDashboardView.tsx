"use client";

import { useState } from "react";
import { Lead, Application, Task, CampusLocation } from "@/types/crm";
import {
  UserCheck,
  PhoneCall,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Info,
  ChevronDown,
  Filter,
  BarChart3,
  Layers,
  Activity,
  CalendarDays,
} from "lucide-react";

interface UserDashboardViewProps {
  loggedInUsername: string;
  currentUserRole: "ADMIN" | "TEACHER";
  applicants: (Lead & { application: Application })[];
  tasks: Task[];
  selectedCampus: CampusLocation;
  onSelectApplicant: (applicant: Lead & { application: Application }) => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onToggleTask: (taskId: string) => void;
}

export default function UserDashboardView({
  loggedInUsername,
  currentUserRole,
  applicants,
  tasks,
  selectedCampus,
  onSelectApplicant,
  onActionTrigger,
  onToggleTask,
}: UserDashboardViewProps) {
  // Filter personal leads & tasks assigned to logged-in user
  const assignedLeads = applicants.slice(0, 10);
  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  // Application Stage Segregation Campus Form State
  const [selectedForm, setSelectedForm] = useState("Application Form VSB Coimbatore");

  // Engagement Chart View Mode State
  const [engagementView, setEngagementView] = useState<"DAY" | "WEEK">("DAY");
  const [selectedDateFilter, setSelectedDateFilter] = useState("2026-09-03");

  // Exact Data from NoPaperForms Counselor Dashboard Screenshot
  const allocationData = {
    applications: 574,
    leads: 235791,
    maxScale: 250000,
  };

  const leadStageData = [
    {
      stage: "Closed",
      primary: { label: "56510", val: 56510, color: "bg-blue-600" },
      secondary: { label: "22763", val: 22763, color: "bg-amber-400" },
    },
    {
      stage: "Admitted in VSB",
      primary: { label: "2208", val: 2208, color: "bg-cyan-500" },
    },
    {
      stage: "Not Reachable",
      primary: { label: "69095", val: 69095, color: "bg-pink-600" },
    },
    {
      stage: "Untouched",
      primary: { label: "34141", val: 34141, color: "bg-blue-500" },
      secondary: { label: "14027", val: 14027, color: "bg-amber-400" },
    },
    {
      stage: "Walkin",
      primary: { label: "3384", val: 3384, color: "bg-emerald-500" },
    },
    {
      stage: "After NEET",
      primary: { label: "1954", val: 1954, color: "bg-cyan-500" },
    },
    {
      stage: "Not Decided",
      primary: { label: "26911", val: 26911, color: "bg-blue-600" },
    },
    {
      stage: "Counseling applied",
      primary: { label: "3216", val: 3216, color: "bg-amber-400" },
      secondary: { label: "3256", val: 3256, color: "bg-emerald-500" },
    },
    {
      stage: "Interested to Join VSB",
      primary: { label: "363", val: 363, color: "bg-emerald-600" },
    },
    {
      stage: "Test Lead",
      primary: { label: "58", val: 58, color: "bg-sky-400" },
    },
    {
      stage: "Studying +1",
      primary: { label: "119", val: 119, color: "bg-amber-400" },
      secondary: { label: "109", val: 109, color: "bg-teal-400" },
    },
    {
      stage: "WhatsApp contact",
      primary: { label: "3", val: 3, color: "bg-pink-500" },
    },
  ];

  const maxLeadStageVal = 70000;

  const leadSubStageData = [
    {
      subStage: "Wrong Number(Closed)",
      bars: [
        { label: "4660", val: 4660, color: "bg-blue-600" },
        { label: "37887", val: 37887, color: "bg-amber-400" },
      ],
    },
    {
      subStage: "Number Busy(Not Reachable)",
      bars: [
        { label: "12227", val: 12227, color: "bg-orange-500" },
        { label: "11598", val: 11598, color: "bg-emerald-500" },
        { label: "7859", val: 7859, color: "bg-cyan-400" },
      ],
    },
    {
      subStage: "Medical(Not Interested in Engineering)",
      bars: [
        { label: "2134", val: 2134, color: "bg-purple-600" },
        { label: "3607", val: 3607, color: "bg-amber-400" },
        { label: "5246", val: 5246, color: "bg-emerald-500" },
        { label: "3055", val: 3055, color: "bg-cyan-400" },
      ],
    },
    {
      subStage: "Number Switched Off(Not Reachable)",
      bars: [
        { label: "5313", val: 5313, color: "bg-amber-400" },
        { label: "26878", val: 26878, color: "bg-emerald-500" },
        { label: "6811", val: 6811, color: "bg-pink-500" },
      ],
    },
    {
      subStage: "Coimbatore Campus(Walkin)",
      bars: [
        { label: "718", val: 718, color: "bg-pink-500" },
        { label: "1951", val: 1951, color: "bg-cyan-400" },
      ],
    },
    {
      subStage: "Not Maths Group(Closed)",
      bars: [
        { label: "857", val: 857, color: "bg-amber-400" },
        { label: "3142", val: 3142, color: "bg-emerald-500" },
        { label: "1487", val: 1487, color: "bg-cyan-400" },
      ],
    },
    {
      subStage: "Invalid Email(Closed)",
      bars: [
        { label: "12212", val: 12212, color: "bg-amber-400" },
        { label: "7842", val: 7842, color: "bg-cyan-400" },
      ],
    },
    {
      subStage: "After Result(Not Decided)",
      bars: [
        { label: "1420", val: 1420, color: "bg-purple-500" },
        { label: "2146", val: 2146, color: "bg-cyan-400" },
        { label: "1545", val: 1545, color: "bg-emerald-500" },
      ],
    },
    {
      subStage: "Agri(Not Interested in Engineering)",
      bars: [
        { label: "150", val: 150, color: "bg-amber-400" },
        { label: "86", val: 86, color: "bg-cyan-400" },
      ],
    },
    {
      subStage: "Studying in VSB(Closed)",
      bars: [
        { label: "34", val: 34, color: "bg-pink-500" },
        { label: "29", val: 29, color: "bg-amber-400" },
        { label: "18", val: 18, color: "bg-cyan-400" },
      ],
    },
    {
      subStage: "Within a Week(Interested to Join VSB)",
      bars: [
        { label: "23", val: 23, color: "bg-amber-400" },
        { label: "18", val: 18, color: "bg-cyan-400" },
      ],
    },
    {
      subStage: "Message 1 sent(WhatsApp contact)",
      bars: [
        { label: "2", val: 2, color: "bg-amber-400" },
        { label: "1", val: 1, color: "bg-cyan-400" },
      ],
    },
  ];

  const maxSubStageVal = 40000;

  // Engagement Chart Data Points
  const engagementTimeline = [
    { label: "Day 1", allocated: 235791, dayEngaged: 850, totalEngaged: 15200 },
    { label: "Day 2", allocated: 235791, dayEngaged: 1240, totalEngaged: 32400 },
    { label: "Day 3", allocated: 235791, dayEngaged: 1890, totalEngaged: 58900 },
    { label: "Day 4", allocated: 235791, dayEngaged: 2450, totalEngaged: 89400 },
    { label: "Day 5", allocated: 235791, dayEngaged: 3120, totalEngaged: 128500 },
    { label: "Day 6", allocated: 235791, dayEngaged: 3870, totalEngaged: 174200 },
    { label: "Day 7", allocated: 235791, dayEngaged: 4230, totalEngaged: 235791 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-sky-950 dark:via-slate-900 dark:to-indigo-950 border border-slate-200 dark:border-sky-500/30 text-slate-900 dark:text-white shadow-md dark:shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-600/30 border border-sky-200 dark:border-sky-400/40 flex items-center justify-center text-sky-600 dark:text-sky-300 shadow-sm shrink-0">
            <UserCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Counselor Personal Workspace</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Logged in as <span className="font-extrabold text-sky-700 dark:text-sky-300">{loggedInUsername}</span> • Active follow-up lead quota</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-slate-900/90 border border-emerald-200 dark:border-white/15 text-xs font-black text-emerald-800 dark:text-emerald-300 shadow-sm">
            Assigned Range: Contacts #1 to #100
          </div>
        </div>
      </div>

      {/* Counselor Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bubble-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Assigned Leads</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white">{assignedLeads.length} Candidates</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-400/30 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Pending Follow-ups</p>
            <h4 className="text-xl font-black text-amber-600 dark:text-amber-300">{pendingTasks.length} Tasks</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Completed Calls</p>
            <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{completedTasks.length} Calls</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Conversion Rate</p>
            <h4 className="text-xl font-black text-indigo-600 dark:text-indigo-300">42.8%</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NOPAPERFORMS COUNSELOR ANALYTICS SECTION (Exact data from provided image) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Allocation Snapshot */}
        <div className="bubble-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Allocation Snapshot</h3>
              <span title="Allocation Snapshot details"><Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-sky-500" /></span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total: 236,365 Records</span>
          </div>

          <div className="space-y-6 pt-2">
            {/* Applications Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 w-24">Applications</span>
                <div className="flex-1 mx-3 h-8 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1 relative flex items-center">
                  <div
                    className="h-full bg-blue-600 rounded flex items-center transition-all duration-500"
                    style={{ width: `${Math.max(1.5, (allocationData.applications / allocationData.maxScale) * 100)}%` }}
                  />
                  <span className="ml-2 text-xs font-black text-slate-800 dark:text-slate-200">
                    — {allocationData.applications.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Leads Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 w-24">Leads</span>
                <div className="flex-1 mx-3 h-14 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1 relative flex items-center">
                  <div
                    className="h-full bg-amber-500 rounded flex items-center justify-end pr-2 transition-all duration-500 shadow-sm"
                    style={{ width: `${(allocationData.leads / allocationData.maxScale) * 100}%` }}
                  >
                    <span className="text-xs font-black text-slate-950">
                      {allocationData.leads.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Scale Line */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between text-[10px] text-slate-600 dark:text-slate-300 font-mono font-bold">
              <span>0</span>
              <span>50,000</span>
              <span>100,000</span>
              <span>150,000</span>
              <span>200,000</span>
              <span>250,000</span>
            </div>
          </div>
        </div>

        {/* CARD 2: Lead Stage Segregation */}
        <div className="bubble-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Lead Stage Segregation</h3>
              <span title="Lead Stage Segregation breakdown"><Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-sky-500" /></span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">12 Primary Stages</span>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {leadStageData.map((item, idx) => (
              <div key={idx} className="flex items-center text-xs group">
                <span className="w-36 truncate text-[11px] font-bold text-slate-700 dark:text-slate-300 text-right pr-3 shrink-0" title={item.stage}>
                  {item.stage}
                </span>
                <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800/60 rounded flex items-center overflow-hidden gap-1 px-0.5">
                  {/* Primary Bar */}
                  <div
                    className={`h-4 rounded ${item.primary.color} flex items-center justify-end px-1 transition-all duration-300`}
                    style={{ width: `${Math.max(3, (item.primary.val / maxLeadStageVal) * 100)}%` }}
                  >
                    <span className="text-[9px] font-black text-white">{item.primary.label}</span>
                  </div>
                  {/* Secondary Bar if present */}
                  {item.secondary && (
                    <div
                      className={`h-4 rounded ${item.secondary.color} flex items-center justify-end px-1 transition-all duration-300`}
                      style={{ width: `${Math.max(3, (item.secondary.val / maxLeadStageVal) * 100)}%` }}
                    >
                      <span className="text-[9px] font-black text-slate-950">{item.secondary.label}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 3: Lead Sub Stage Segregation */}
        <div className="bubble-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Lead Sub Stage Segregation</h3>
              <span title="Sub-stage granular analytics"><Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-sky-500" /></span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Detailed Classification</span>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {leadSubStageData.map((item, idx) => (
              <div key={idx} className="flex items-center text-xs group">
                <span className="w-44 truncate text-[10px] font-bold text-slate-700 dark:text-slate-300 text-right pr-3 shrink-0" title={item.subStage}>
                  {item.subStage}
                </span>
                <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800/60 rounded flex items-center overflow-hidden gap-1 px-0.5">
                  {item.bars.map((b, bIdx) => (
                    <div
                      key={bIdx}
                      className={`h-4 rounded ${b.color} flex items-center justify-end px-1 transition-all duration-300`}
                      style={{ width: `${Math.max(4, (b.val / maxSubStageVal) * 100)}%` }}
                    >
                      <span className="text-[9px] font-black text-slate-950 dark:text-white">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 4: Application Stage Segregation */}
        <div className="bubble-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Application Stage Segr..</h3>
              <span title="Application Form conversion stage"><Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-sky-500" /></span>
            </div>
            <div className="relative">
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="Application Form VSB Coimbatore">Application Form VSB Coimbatore</option>
                <option value="Application Form VSB Karur">Application Form VSB Karur</option>
                <option value="All Campus Application Forms">All Campus Application Forms</option>
              </select>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <div className="flex items-center text-xs">
              <span className="w-24 font-bold text-slate-700 dark:text-slate-300 text-right pr-3">Untouched</span>
              <div className="flex-1 mx-2 h-20 bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1 flex items-center">
                <div
                  className="h-full bg-blue-600 rounded flex items-center justify-end pr-3 shadow-md transition-all duration-500"
                  style={{ width: "65%" }}
                >
                  <span className="text-sm font-black text-white">— 368</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 text-xs space-y-1">
              <p className="font-extrabold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> High Priority Follow-up Queue
              </p>
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                368 applicant forms for {selectedForm} remain untouched. Immediate counselor telecall is advised to secure confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 5: Engagement Chart (Full Width) */}
      <div className="bubble-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Engagement Chart</h3>
            <span title="Historical counselor lead engagement graph"><Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-sky-500" /></span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
                <span className="text-slate-700 dark:text-slate-300">Total Allocated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="text-slate-700 dark:text-slate-300">Day-wise Engaged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 bg-red-500 inline-block rounded" />
                <span className="text-slate-700 dark:text-slate-300">Total Engaged</span>
              </div>
            </div>

            {/* Date Filter & Day/Week Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-2.5 py-1 rounded-lg text-xs text-slate-700 dark:text-slate-300 font-semibold">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter By date</span>
              </div>

              <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 p-0.5">
                <button
                  onClick={() => setEngagementView("DAY")}
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-md transition-all ${
                    engagementView === "DAY"
                      ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setEngagementView("WEEK")}
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-md transition-all ${
                    engagementView === "WEEK"
                      ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Graph Visualizer */}
        <div className="pt-2">
          <div className="flex items-start">
            {/* Y-axis Labels */}
            <div className="flex flex-col justify-between h-48 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 pr-3 border-r border-slate-200 dark:border-white/10 shrink-0">
              <span>400,000</span>
              <span>300,000</span>
              <span>200,000</span>
              <span>100,000</span>
              <span>0</span>
            </div>

            {/* Chart SVG Plot */}
            <div className="flex-1 pl-4 relative h-48">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
                <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
                <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
                <div className="border-b border-dashed border-slate-200 dark:border-white/10 w-full" />
                <div className="border-b border-slate-300 dark:border-white/20 w-full" />
              </div>

              {/* SVG Curve for Total Engaged (Red) & Day-wise points */}
              <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 180">
                <defs>
                  <linearGradient id="engagementGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Total Allocated line (constant benchmark around 235k) */}
                <line x1="20" y1="74" x2="680" y2="74" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />

                {/* Smooth Curve for Total Engaged (Red) */}
                <path
                  d="M 50 172 Q 200 160, 350 110 T 650 74"
                  fill="none"
                  stroke="url(#engagementGrad)"
                  strokeWidth="3.5"
                />

                {/* Points on Red Line */}
                {[
                  { cx: 50, cy: 172, label: "15,200" },
                  { cx: 150, cy: 165, label: "32,400" },
                  { cx: 250, cy: 145, label: "58,900" },
                  { cx: 350, cy: 110, label: "89,400" },
                  { cx: 450, cy: 92, label: "128,500" },
                  { cx: 550, cy: 82, label: "174,200" },
                  { cx: 650, cy: 74, label: "235,791" },
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.cx} cy={pt.cy} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx={pt.cx} cy={165} r="3" fill="#f59e0b" />
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* X-axis Timeline Labels */}
          <div className="flex justify-between pl-16 pt-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span>28 Aug</span>
            <span>29 Aug</span>
            <span>30 Aug</span>
            <span>31 Aug</span>
            <span>01 Sep</span>
            <span>02 Sep</span>
            <span>03 Sep (Today)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: My Assigned Leads & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: My Assigned Student Leads Table */}
        <div className="lg:col-span-2 bubble-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" /> My Priority Lead Queue
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Top 10 Assigned</span>
          </div>

          <div className="space-y-2.5">
            {assignedLeads.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectApplicant(item)}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 hover:border-sky-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-700 dark:text-sky-300 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-300 dark:border-indigo-400/40">
                    {item.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors flex items-center gap-2">
                      {item.name}
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10">
                        Cutoff: {item.tneaCutoff || 185}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      {item.courseInterest || "B.E. Computer Science"} • {item.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onActionTrigger("CALL", item.name);
                    }}
                    className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onActionTrigger("WHATSAPP", item.name);
                    }}
                    className="p-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Personal Daily Tasks & Call Checklist */}
        <div className="bubble-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Pending Follow-up Tasks
            </h3>
            <span className="text-xs text-amber-600 dark:text-amber-300 font-black">{pendingTasks.length} Due Today</span>
          </div>

          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  task.isCompleted
                    ? "bg-slate-100 dark:bg-slate-950/40 border-slate-300 dark:border-slate-800 text-slate-500 line-through"
                    : "bg-slate-50 dark:bg-slate-950/90 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-400/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => onToggleTask(task.id)}
                  className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{task.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Due: {task.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
