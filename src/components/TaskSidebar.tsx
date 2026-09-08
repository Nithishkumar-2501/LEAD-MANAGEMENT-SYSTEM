"use client";

import { useState } from "react";
import { Task, TaskType } from "@/types/crm";
import { CheckSquare, Square, Phone, Mail, MessageSquare, Clock, CalendarCheck, Sparkles } from "lucide-react";
import { redirectToDialPad, getCleanTelUri } from "@/lib/callDialer";

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
        return { icon: Phone, label: "Call" };
      case "EMAIL":
        return { icon: Mail, label: "Email" };
      case "WHATSAPP":
        return { icon: MessageSquare, label: "WhatsApp" };
    }
  };

  return (
    <aside className="bg-white rounded-[36px] p-5 sm:p-6 border border-fog w-full lg:w-96 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-fog">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-paper border border-fog flex items-center justify-center text-obsidian">
              <CalendarCheck className="w-4 h-4 text-obsidian" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-obsidian">Today&apos;s Follow-ups</h3>
              <p className="text-xs text-steel font-normal">Counselor Action Queue</p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-ember text-white px-2.5 py-0.5 rounded-full">
            {pendingCount} Pending
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-paper p-1 rounded-full border border-fog mb-4 text-xs font-medium">
          {(["PENDING", "ALL", "COMPLETED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1 rounded-full transition-all ${
                filter === tab
                  ? "bg-obsidian text-white font-medium shadow-sm"
                  : "text-steel hover:text-graphite"
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
                  className={`p-3.5 rounded-[20px] border transition-all ${
                    task.isCompleted
                      ? "bg-paper/50 border-fog opacity-50"
                      : "bg-paper border-fog hover:border-steel"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-obsidian hover:text-ember transition-colors"
                      title={task.isCompleted ? "Mark as Pending" : "Mark as Completed"}
                    >
                      {task.isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-ember" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-fog text-graphite flex items-center gap-1">
                          <TypeIcon className="w-3 h-3 text-obsidian" />
                          {typeInfo.label}
                        </span>
                        <span className="text-[10px] text-steel flex items-center gap-1 font-normal">
                          <Clock className="w-3 h-3 text-steel" /> Today
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-snug mb-1 font-medium ${
                          task.isCompleted ? "line-through text-steel" : "text-obsidian"
                        }`}
                      >
                        {task.title}
                      </p>

                      {task.lead && (
                        <p className="text-[11px] text-steel truncate">
                          Candidate: <strong className="text-obsidian font-semibold">{task.lead.name}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {task.lead && !task.isCompleted && (
                    <div className="flex items-center justify-end gap-1.5 mt-3 pt-2.5 border-t border-fog">
                      <a
                        href={getCleanTelUri(task.lead?.phone)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onActionTrigger("CALL", task.lead!.name);
                          if (task.lead?.phone) redirectToDialPad(task.lead.phone);
                        }}
                        className="px-2.5 py-1 rounded-button bg-white border border-fog hover:border-steel text-graphite hover:text-obsidian text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                        title={`Call ${task.lead?.name || "Candidate"}`}
                      >
                        <Phone className="w-3 h-3 text-ember" /> Call
                      </a>
                      <button
                        onClick={() => onActionTrigger("EMAIL", task.lead!.name)}
                        className="px-2.5 py-1 rounded-button bg-white border border-fog hover:border-steel text-graphite hover:text-obsidian text-[11px] font-medium transition-all flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" /> Email
                      </button>
                      <button
                        onClick={() => onActionTrigger("WHATSAPP", task.lead!.name)}
                        className="px-2.5 py-1 rounded-button bg-white border border-fog hover:border-steel text-graphite hover:text-obsidian text-[11px] font-medium transition-all flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" /> WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-steel text-xs">
              No tasks found in this view.
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 p-4 rounded-[20px] bg-paper border border-fog flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-ember shrink-0" />
        <p className="text-[11px] text-graphite leading-snug font-normal">
          Counselor Tip: Verified cutoff candidates show a 40% higher response rate on direct WhatsApp outreach.
        </p>
      </div>
    </aside>
  );
}
