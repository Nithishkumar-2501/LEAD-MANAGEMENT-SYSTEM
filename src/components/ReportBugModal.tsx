"use client";

import React, { useState } from "react";
import {
  Bug,
  X,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Send,
  Laptop,
  Smartphone,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  saveBugReport,
  BugCategory,
  BugSeverity,
} from "@/lib/bugReportService";
import { isCapacitorNative } from "@/lib/mobileFetch";

interface ReportBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  loggedInUsername?: string;
  currentUserRole?: string;
  selectedCampus?: string;
  onTriggerToast?: (msg: string) => void;
}

const CATEGORIES: { key: BugCategory; label: string }[] = [
  { key: "LEADS", label: "📋 Leads & Contacts" },
  { key: "CSV_IMPORT", label: "📊 CSV / File Upload" },
  { key: "ADMISSIONS", label: "🎓 Admissions Pipeline" },
  { key: "MOBILE_APP", label: "📱 Mobile App / APK" },
  { key: "AUTHENTICATION", label: "🔐 Login & Accounts" },
  { key: "CALLS_COMMUNICATION", label: "📞 Calls, SMS & WhatsApp" },
  { key: "PAYMENTS", label: "💳 QR & Fee Payments" },
  { key: "DASHBOARD_UI", label: "🖥️ Dashboard & Views" },
  { key: "OTHER", label: "⚙️ Other System Issue" },
];

const SEVERITIES: {
  key: BugSeverity;
  label: string;
  desc: string;
  color: string;
  badgeBg: string;
}[] = [
  {
    key: "CRITICAL",
    label: "Critical (Blocker)",
    desc: "Application crash, data loss, or blocks admissions work",
    color: "text-rose-400 border-rose-500 bg-rose-950/40",
    badgeBg: "bg-rose-500/20 text-rose-300",
  },
  {
    key: "HIGH",
    label: "High Severity",
    desc: "Major feature broken, workaround needed",
    color: "text-orange-400 border-orange-500 bg-orange-950/40",
    badgeBg: "bg-orange-500/20 text-orange-300",
  },
  {
    key: "MEDIUM",
    label: "Medium",
    desc: "Incorrect behavior or calculation anomaly",
    color: "text-amber-400 border-amber-500 bg-amber-950/40",
    badgeBg: "bg-amber-500/20 text-amber-300",
  },
  {
    key: "LOW",
    label: "Low (Minor)",
    desc: "Typo, cosmetic glitch, or minor UI flaw",
    color: "text-sky-400 border-sky-500 bg-sky-950/40",
    badgeBg: "bg-sky-500/20 text-sky-300",
  },
];

export default function ReportBugModal({
  isOpen,
  onClose,
  loggedInUsername = "admin@vsb.ac.in",
  currentUserRole = "ADMIN",
  selectedCampus = "KARUR",
  onTriggerToast,
}: ReportBugModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<BugCategory>("LEADS");
  const [severity, setSeverity] = useState<BugSeverity>("MEDIUM");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [errorStack, setErrorStack] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      if (onTriggerToast) onTriggerToast("⚠️ Please enter a brief bug title.");
      return;
    }
    if (!description.trim()) {
      if (onTriggerToast) onTriggerToast("⚠️ Please enter a description of the issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const platform = isCapacitorNative() ? "ANDROID" : "WEB";
      const bug = await saveBugReport({
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim(),
        expectedBehavior: expectedBehavior.trim(),
        actualBehavior: actualBehavior.trim(),
        severity,
        category,
        reportedBy: loggedInUsername,
        reportedRole: (currentUserRole.toUpperCase() as any) || "USER",
        campus: selectedCampus,
        pageOrUrl: typeof window !== "undefined" ? window.location.href : "/dashboard",
        deviceInfo: {
          platform,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Web Browser",
          screenResolution:
            typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "1920x1080",
          timestamp: new Date().toISOString(),
        },
        errorStack: errorStack.trim() || undefined,
      });

      if (onTriggerToast) {
        onTriggerToast(
          `🐞 Bug ticket #${bug.ticketNumber} reported! Forwarded instantly to Master Creator (spherexnithish#).`
        );
      }

      // Reset and close
      setTitle("");
      setDescription("");
      setStepsToReproduce("");
      setExpectedBehavior("");
      setActualBehavior("");
      setErrorStack("");
      onClose();
    } catch (err) {
      console.error("Error filing bug:", err);
      if (onTriggerToast) onTriggerToast("❌ Failed to report bug. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border-2 border-rose-500/40 shadow-2xl shadow-rose-950/50 overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <Bug className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Raise Bug / Incident Report</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Direct to Master Creator
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Reports are delivered in real-time to Master Creator (<strong className="text-amber-400">spherexnithish#</strong>)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Reporter context banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Filing as: <strong className="text-white font-mono">{loggedInUsername}</strong> ({currentUserRole})
              </span>
            </div>
            <div className="font-mono text-slate-400">
              Campus: <strong className="text-amber-400">{selectedCampus}</strong>
            </div>
          </div>

          {/* Bug Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Bug Title / Summary *</span>
              <span className="text-[10px] text-slate-500 font-normal">Short, clear statement</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lead count in Project Expo does not update after CSV upload"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-500 text-xs font-medium outline-hidden transition-all"
            />
          </div>

          {/* Severity Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300">
              Bug Severity Level *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEVERITIES.map((sev) => {
                const isSelected = severity === sev.key;
                return (
                  <button
                    key={sev.key}
                    type="button"
                    onClick={() => setSeverity(sev.key)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? `${sev.color} ring-2 ring-rose-500 shadow-md`
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-xs font-black">{sev.label}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {sev.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300">
              Feature / Subsystem Category *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-rose-600 text-white shadow-md shadow-rose-950/40"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Detailed Bug Description *</span>
              <span className="text-[10px] text-slate-500 font-normal">What went wrong?</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the exact error or unexpected behavior in detail..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-500 text-xs font-medium outline-hidden transition-all resize-none"
            />
          </div>

          {/* Steps to Reproduce & Expected vs Actual (Optional Accordion / Row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">
                Steps to Reproduce (Optional)
              </label>
              <textarea
                rows={2}
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="1. Clicked Contacts tab&#10;2. Uploaded CSV file&#10;3. Clicked confirm"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs outline-hidden resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">
                Expected vs Actual Behavior
              </label>
              <textarea
                rows={2}
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                placeholder="Expected lead count to increase by 50, but count remained unchanged."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs outline-hidden resize-none"
              />
            </div>
          </div>

          {/* Error Message / Stack Trace (Optional) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">
              Error Message or Console Log (Optional)
            </label>
            <input
              type="text"
              value={errorStack}
              onChange={(e) => setErrorStack(e.target.value)}
              placeholder="e.g. Uncaught TypeError: Cannot read properties of undefined..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 font-mono text-xs outline-hidden"
            />
          </div>

          {/* Automatic Diagnostics Telemetry Notice */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-slate-400" />
              <span>Platform Telemetry will be attached automatically (Device, OS, Browser, Screen size).</span>
            </div>
            <span className="font-mono text-emerald-400 text-[10px]">Auto-Synced</span>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-rose-950/40 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Submitting..." : "Submit Bug to Master Creator"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
