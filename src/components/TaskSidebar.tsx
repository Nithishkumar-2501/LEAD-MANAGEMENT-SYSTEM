"use client";

import { useState } from "react";
import { Task, TaskType } from "@/types/crm";
import { CheckSquare, Square, Phone, Mail, MessageSquare, Clock, CalendarCheck, Sparkles } from "lucide-react";

interface TaskSidebarProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onActionTrigger: (type: TaskType, leadName: string) => void;
}

export default function TaskSidebar({ tasks, onToggleTask, onActionTrigger }: TaskSidebarProps) {
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("PENDING");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "PENDING") return !t.isCompleted;
    if (filter === "COMPLETED") return t.isCompleted;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.isCompleted).length;

  const getTypeBadge = (type: TaskType) => {
    switch (type) {
      case "CALL":
        return {
          icon: Phone,
          color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
        };
      case "EMAIL":
        return {
          icon: Mail,
          color: "bg-indigo-500/20 text-indigo-300 border-indigo-400/40",
        };
      case "WHATSAPP":
        return {
          icon: MessageSquare,
          color: "bg-teal-500/20 text-teal-300 border-teal-400/40",
        };
    }
  };

  return (
    <aside className="bubble-card p-6 border border-white/20 w-full lg:w-96 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 ring-2 ring-white/20">
              <CalendarCheck className="w-5 h-5 text-white font-bold" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Today's Reminders</h3>
              <p className="text-xs text-slate-400 font-medium">Counselor Follow-up Panel</p>
            </div>
          </div>
          <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full backdrop-blur-md">
            {pendingCount} Pending
          </span>
        </div>

        {/* Bubble Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-full border border-white/20 mb-4 text-xs font-bold backdrop-blur-md">
          {(["PENDING", "ALL", "COMPLETED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1 rounded-full transition-all ${
                filter === tab
                  ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-black shadow-md shadow-sky-500/40 scale-[1.02]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Task Cards List */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const typeInfo = getTypeBadge(task.type);
              const TypeIcon = typeInfo.icon;

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    task.isCompleted
                      ? "bg-slate-950/40 border-white/5 opacity-50"
                      : "bg-slate-950/80 border-white/15 hover:border-sky-400/40 shadow-md backdrop-blur-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-sky-400 hover:text-sky-300 transition-colors"
                      title={task.isCompleted ? "Mark as Pending" : "Mark as Completed"}
                    >
                      {task.isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[10px] font-black px-3 py-0.5 rounded-full border flex items-center gap-1.5 ${typeInfo.color}`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          {task.type}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-sky-400" /> Today
                        </span>
                      </div>

                      <p
                        className={`text-xs font-bold leading-relaxed mb-1 ${
                          task.isCompleted ? "line-through text-slate-500" : "text-white"
                        }`}
                      >
                        {task.title}
                      </p>

                      {task.lead && (
                        <p className="text-[11px] text-sky-300 font-medium">
                          Candidate: <strong className="text-white font-bold">{task.lead.name}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {task.lead && !task.isCompleted && (
                    <div className="flex items-center justify-end gap-1.5 mt-3 pt-2.5 border-t border-white/10">
                      <button
                        onClick={() => onActionTrigger("CALL", task.lead!.name)}
                        className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-400/40 text-[11px] font-bold transition-all flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </button>
                      <button
                        onClick={() => onActionTrigger("EMAIL", task.lead!.name)}
                        className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-400/40 text-[11px] font-bold transition-all flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" /> Email
                      </button>
                      <button
                        onClick={() => onActionTrigger("WHATSAPP", task.lead!.name)}
                        className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 hover:bg-teal-500 hover:text-white border border-teal-400/40 text-[11px] font-bold transition-all flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" /> WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No tasks found in this view.
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 p-4 rounded-3xl bg-slate-900/80 border border-white/20 flex items-center gap-3 backdrop-blur-xl">
        <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
        <p className="text-[11px] text-slate-300 leading-snug font-medium">
          Liquid Tip: High priority TNEA candidates respond 40% faster on WhatsApp.
        </p>
      </div>
    </aside>
  );
}
