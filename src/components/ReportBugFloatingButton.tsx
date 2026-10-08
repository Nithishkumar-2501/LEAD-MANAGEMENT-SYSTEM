"use client";

import React from "react";
import { Bug } from "lucide-react";

interface ReportBugFloatingButtonProps {
  onOpen: () => void;
  currentUserRole?: string;
}

export default function ReportBugFloatingButton({
  onOpen,
  currentUserRole,
}: ReportBugFloatingButtonProps) {
  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
      <button
        type="button"
        onClick={onOpen}
        className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xl shadow-rose-950/40 border border-white/20 transition-all duration-200 active:scale-95 cursor-pointer hover:shadow-rose-500/20"
        title="Found an issue? Report a bug directly to Master Creator"
        aria-label="Report a bug"
      >
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-300" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-200" />
        </span>
        <Bug className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-black tracking-wide hidden md:inline">
          Report Bug
        </span>
      </button>
    </div>
  );
}
