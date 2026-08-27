"use client";

import { useState } from "react";
import { Lead, Application, Task, CampusLocation } from "@/types/crm";
import { UserCheck, PhoneCall, Mail, MessageSquare, CheckCircle2, Clock, Calendar, ArrowUpRight, Sparkles } from "lucide-react";

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/30 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-600/30 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-md shrink-0">
            <UserCheck className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Counselor Personal Workspace</h2>
            <p className="text-xs text-slate-300 font-medium">Logged in as <span className="font-extrabold text-sky-300">{loggedInUsername}</span> • Active follow-up lead quota</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-bold text-emerald-300">
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
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Pending Follow-up Tasks
            </h3>
            <span className="text-xs text-amber-300 font-black">{pendingTasks.length} Due Today</span>
          </div>

          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  task.isCompleted
                    ? "bg-slate-950/40 border-slate-800 text-slate-500 line-through"
                    : "bg-slate-950/90 border-slate-800 text-slate-200 hover:border-amber-400/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => onToggleTask(task.id)}
                  className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{task.title}</p>
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
