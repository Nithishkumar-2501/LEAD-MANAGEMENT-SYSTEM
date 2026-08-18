"use client";

import { useState, useEffect } from "react";
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  Edit3,
  Save,
  Sparkles,
  QrCode,
  Bot,
  Plus,
  SlidersHorizontal,
  XCircle,
  TrendingUp,
  ChevronDown,
  Info,
  User,
  GraduationCap,
  Award,
  DollarSign,
} from "lucide-react";
import { Lead, Application, LeadStatus, AppStage, VSB_DEPARTMENTS_COURSES } from "@/types/crm";

interface ApplicantDetailModalProps {
  applicant: (Lead & { application: Application }) | null;
  currentUserRole: "ADMIN" | "TEACHER";
  onClose: () => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onSave?: (updated: Lead & { application: Application }) => void;
}

export default function ApplicantDetailModal({
  applicant,
  currentUserRole,
  onClose,
  onActionTrigger,
  onSave,
}: ApplicantDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<(Lead & { application: Application }) | null>(applicant);

  const [activeMainTab, setActiveMainTab] = useState<
    "LEAD_DETAILS" | "TIMELINE" | "CALENDAR" | "NOTES" | "COMMUNICATION" | "TICKETS"
  >("LEAD_DETAILS");

  const [activeSubTab, setActiveSubTab] = useState<"LEAD_DETAILS" | "ADDITIONAL" | "FACEBOOK">(
    "LEAD_DETAILS"
  );

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    setFormData(applicant);
    setAiSummary(null);
  }, [applicant]);

  if (!applicant || !formData) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    setIsEditing(false);
  };

  const generateAiSummary = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      setAiSummary(
        `Candidate ${formData.name} demonstrates high intent with 12th score ${formData.application.marks12th}% and TNEA Cutoff ${formData.tneaCutoff || 188.5}. Recommended for immediate Merit Scholarship counseling.`
      );
      setIsGeneratingAi(false);
    }, 800);
  };

  const app = formData.application;

  // Stages matching NoPaperForms / Meritto reference
  const stageSteps = [
    { label: "Unverified", key: "INQUIRY" },
    { label: "Verified", key: "SUBMITTED" },
    { label: "Application Started", key: "DOCS_VERIFIED" },
    { label: "Payment Approved", key: "OFFER_ISSUED" },
    { label: "Application Submitted", key: "FEE_PAID" },
    { label: "Enrolments", key: "ENROLLED" },
  ];

  const getStageIndex = (stage: string) => {
    switch (stage) {
      case "INQUIRY":
        return 0;
      case "SUBMITTED":
        return 1;
      case "DOCS_VERIFIED":
        return 2;
      case "OFFER_ISSUED":
        return 3;
      case "FEE_PAID":
      case "ENROLLED":
        return 4;
      default:
        return 0;
    }
  };

  const currentStageIdx = getStageIndex(app.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#0f172a] w-full max-w-6xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[95vh] my-auto">
        {/* Top Header / Breadcrumb Bar */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="text-slate-400">Lead Details</span>
            <span className="text-slate-600">&gt;</span>
            <button className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-sky-400 hover:text-white">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isEditing
                  ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-sky-400 hover:text-white"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> {isEditing ? "Viewing Profile" : "Edit All Details"}
            </button>

            <button
              onClick={() => onActionTrigger("CALL", formData.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" /> Add Event
            </button>
            <button
              onClick={generateAiSummary}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ask Mio AI
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Mio AI Coach Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-indigo-300 mr-2">✨ Mio AI Coach</span>
                <span className="text-slate-300 font-medium">
                  {aiSummary ? aiSummary : "Summary will appear here once generated."}
                </span>
              </div>
            </div>
            <button
              onClick={generateAiSummary}
              disabled={isGeneratingAi}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 disabled:opacity-50 transition-all"
            >
              {isGeneratingAi ? "Generating..." : "+ Generate Summary"}
            </button>
          </div>

          {/* Chevron Stage Tracker Progress Bar */}
          <div className="overflow-x-auto pb-1 hide-scrollbar">
            <div className="flex items-center gap-1 min-w-[650px] bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
              {stageSteps.map((step, idx) => {
                const isActive = idx === currentStageIdx;
                const isPassed = idx < currentStageIdx;
                return (
                  <div
                    key={step.key}
                    className={`flex-1 text-center py-2 px-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/10 font-extrabold"
                        : isPassed
                        ? "bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700"
                        : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-950/50 dark:text-slate-500 dark:border-slate-850"
                    }`}
                  >
                    {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                    {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />}
                    <span className="truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MAIN 2-COLUMN GRID (Left Profile Sidebar + Right Details Tab Area) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT PROFILE SIDEBAR (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Profile Card */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg relative overflow-hidden">
                {/* Avatar & Name */}
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-xl ring-2 ring-white/20">
                      {formData.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-sky-400">
                      <QrCode className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                      {formData.name.toUpperCase()}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <span>Lead Stage:</span>
                      <span className="font-bold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-500/30 flex items-center gap-1">
                        {formData.status}
                        <span title="Edit Stage">
                          <Edit3
                            className="w-3 h-3 cursor-pointer text-slate-400 hover:text-white"
                            onClick={() => setIsEditing(true)}
                          />
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email & Phone Contact Rows */}
                <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <strong className="text-slate-200 truncate">{formData.email}</strong>
                    </span>
                    <span title="Unverified"><XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" /></span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <strong className="text-slate-200">{formData.phone}</strong>
                    </span>
                    <span title="Unverified"><XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" /></span>
                  </div>
                </div>

                {/* Quick 5 Action Buttons Bar */}
                <div className="grid grid-cols-5 gap-1.5 border-t border-slate-800/80 pt-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                    title="Edit All Details"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onActionTrigger("CALL", formData.name)}
                    className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-all"
                    title="Call Candidate"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                    title="Edit Profile Note"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onActionTrigger("EMAIL", formData.name)}
                    className="p-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center transition-all"
                    title="Send Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onActionTrigger("WHATSAPP", formData.name)}
                    className="p-2 rounded-xl bg-teal-950/60 hover:bg-teal-900/80 border border-teal-500/30 text-teal-400 flex items-center justify-center transition-all"
                    title="WhatsApp Outreach"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lead Strength & Lead Score Stats Widgets */}
                <div className="grid grid-cols-2 gap-2.5 border-t border-slate-200 dark:border-slate-800/80 pt-3">
                  <div className="bg-slate-100 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 text-center">
                    <div className="w-6 h-6 rounded-full border-2 border-sky-500 dark:border-sky-400 flex items-center justify-center mx-auto mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block">
                      Lead Strength
                    </span>
                    <span className="text-xs font-extrabold text-sky-600 dark:text-sky-300">High</span>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
                    <div className="text-xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                      <span>5</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block">
                      Lead Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment Details Accordion Card */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                  <span>Assignment Details</span>
                  <Edit3
                    className="w-3.5 h-3.5 text-sky-400 cursor-pointer hover:text-white"
                    onClick={() => setIsEditing(true)}
                  />
                </div>
                <div className="space-y-1.5 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 text-[11px] block font-medium">Assigned Owner</span>
                    <span className="font-bold text-white block">
                      {formData.assignedTo || "Dr Dhanabal M Assistant Professor MECH"}
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 text-[11px] block font-medium">Lead Source</span>
                    <span className="font-bold text-sky-300">{formData.source || "Organic"}</span>
                  </div>
                </div>
              </div>

              {/* Important Dates Accordion Card */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                  <span>Important Dates</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-1.5 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 text-[11px] block font-medium">Upcoming Followup</span>
                    <span className="font-bold text-slate-400">NA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT MAIN DETAILS TAB AREA (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Main Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-0.5 hide-scrollbar">
                {[
                  { id: "LEAD_DETAILS", label: "👤 Lead Details" },
                  { id: "TIMELINE", label: "⏱ Timeline" },
                  { id: "CALENDAR", label: "📅 Calendar Pro" },
                  { id: "NOTES", label: "📝 Notes" },
                  { id: "COMMUNICATION", label: "✉ Communication Logs" },
                  { id: "TICKETS", label: "🎫 Tickets" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMainTab(tab.id as any)}
                    className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                      activeMainTab === tab.id
                        ? "border-sky-400 text-sky-300 bg-sky-950/30 rounded-t-xl"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

                  {/* Tab Content: Lead Details */}
              {activeMainTab === "LEAD_DETAILS" && (
                <div className="bg-white text-black rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xl font-sans" style={{ color: "#000000" }}>
                  {/* Sub Tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    {[
                      { id: "LEAD_DETAILS", label: "Lead Details ✎" },
                      { id: "ADDITIONAL", label: "Additional Details" },
                      { id: "FACEBOOK", label: "Facebook Details" },
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setActiveSubTab(sub.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          activeSubTab === sub.id
                            ? "bg-slate-200 text-black border border-slate-400 shadow-sm"
                            : "text-slate-800 hover:text-black hover:bg-slate-100"
                        }`}
                        style={{ color: "#000000" }}
                      >
                        {sub.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="ml-auto text-xs font-extrabold text-black hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-xl border border-slate-300 shadow-sm"
                      style={{ color: "#000000" }}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-black" /> {isEditing ? "Cancel Edit" : "Edit All Details"}
                    </button>
                  </div>

                  {/* FORM EDIT MODE - EDIT ALL DETAILS */}
                  {isEditing ? (
                    <form onSubmit={handleFormSubmit} className="space-y-4 text-xs text-black" style={{ color: "#000000" }}>
                      <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-black font-bold flex items-center justify-between" style={{ color: "#000000" }}>
                        <span className="flex items-center gap-2 text-black font-extrabold" style={{ color: "#000000" }}>
                          <Edit3 className="w-4 h-4 text-black" /> Editing All Student Details
                        </span>
                        <span className="text-[10px] text-black font-medium" style={{ color: "#000000" }}>
                          Modify fields below and click Save All Changes
                        </span>
                      </div>

                      {/* SECTION 1: Personal & Contact Information */}
                      <div className="space-y-3 pt-1">
                        <h4 className="text-black font-black border-b border-slate-300 pb-1 text-[11px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#000000" }}>
                          <User className="w-3.5 h-3.5 text-black" /> Personal & Contact Details
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>Student Full Name</label>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            />
                          </div>
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>Mobile Number</label>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-1 items-center bg-white border border-slate-300 rounded-xl overflow-hidden px-2">
                                <span className="text-black text-xs font-mono font-bold pr-1" style={{ color: "#000000" }}>+91</span>
                                <input
                                  type="text"
                                  required
                                  value={formData.phone.replace("+91-", "").replace("+91 ", "")}
                                  onChange={(e) => setFormData({ ...formData, phone: `+91-${e.target.value}` })}
                                  className="w-full bg-transparent py-2 text-black text-xs focus:outline-none font-mono font-bold"
                                  style={{ color: "#000000" }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => alert("Verification code sent to " + formData.phone)}
                                className="px-3 py-2 bg-slate-200 border border-slate-400 text-black hover:bg-slate-300 rounded-xl text-[11px] font-extrabold shrink-0 transition-all"
                                style={{ color: "#000000" }}
                              >
                                Verify Number
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>Email Address</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-mono font-bold"
                                style={{ color: "#000000" }}
                              />
                              <button
                                type="button"
                                onClick={() => alert("Verification email sent to " + formData.email)}
                                className="px-3 py-2 bg-slate-200 border border-slate-400 text-black hover:bg-slate-300 rounded-xl text-[11px] font-extrabold shrink-0 transition-all"
                                style={{ color: "#000000" }}
                              >
                                Send Email
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>Alternate Mobile Number</label>
                            <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2">
                              <span className="text-black text-xs font-mono font-bold pr-1" style={{ color: "#000000" }}>+91</span>
                              <input
                                type="text"
                                value={(formData.alternatePhone || "").replace("+91-", "").replace("+91 ", "")}
                                onChange={(e) => setFormData({ ...formData, alternatePhone: `+91-${e.target.value}` })}
                                className="w-full bg-transparent py-2 text-black text-xs focus:outline-none font-mono font-bold"
                                style={{ color: "#000000" }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Parent & Personal Information */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>{"Father's Name"}</label>
                            <input
                              type="text"
                              value={formData.fatherName || "K. Ramachandran"}
                              onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            />
                          </div>
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>{"Mother's Name"}</label>
                            <input
                              type="text"
                              value={formData.motherName || "R. Priya"}
                              onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>Student Gender</label>
                            <select
                              value={formData.gender || "Male"}
                              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>Blood Group</label>
                            <select
                              value={formData.bloodGroup || "O+"}
                              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            >
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>Physically Disabled</label>
                            <select
                              value={formData.physicallyDisabled || "No"}
                              onChange={(e) => setFormData({ ...formData, physicallyDisabled: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>Community Category</label>
                            <select
                              value={formData.community || "BC"}
                              onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-extrabold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            >
                              <option value="BC">BC (Backward Class)</option>
                              <option value="BCM">BCM (BC Muslim)</option>
                              <option value="MBC">MBC / DNC</option>
                              <option value="SC">SC (Scheduled Caste)</option>
                              <option value="SCA">SC (Arunthathiyar)</option>
                              <option value="ST">ST (Scheduled Tribe)</option>
                              <option value="OC">OC (Open Competition)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>Home Address</label>
                            <input
                              type="text"
                              value={formData.address || "14 West Car Street, Salem, Tamil Nadu 636001"}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            />
                          </div>
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>School Name</label>
                            <input
                              type="text"
                              value={formData.school || "Govt Higher Secondary School, Salem"}
                              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>State</label>
                            <select
                              value={formData.state || "Tamil Nadu"}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            >
                              <option value="Tamil Nadu">Tamil Nadu</option>
                              <option value="Kerala">Kerala</option>
                              <option value="Karnataka">Karnataka</option>
                              <option value="Andhra Pradesh">Andhra Pradesh</option>
                              <option value="Telangana">Telangana</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-black font-extrabold mb-1" style={{ color: "#000000" }}>City / District</label>
                            <input
                              type="text"
                              value={formData.district || "Salem"}
                              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-black font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                              style={{ color: "#000000" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-300">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-5 py-2.5 rounded-xl bg-slate-200 border border-slate-300 text-black font-bold"
                          style={{ color: "#000000" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white font-black shadow-lg"
                        >
                          <Save className="w-4 h-4" /> Save All Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* SUB TAB 1: LEAD DETAILS (VIEW MODE WITH EDIT TRIPPERS) */
                    activeSubTab === "LEAD_DETAILS" ? (
                      <div className="space-y-3.5 text-xs font-sans text-black" style={{ color: "#000000" }}>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Email Address</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: <strong className="text-black font-mono font-black" style={{ color: "#000000" }}>{formData.email}</strong></span>
                            <span title="Edit Email">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black flex items-center gap-1" style={{ color: "#000000" }}>
                            Mobile Number <Info className="w-3 h-3 text-black" />
                          </span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: <strong className="text-black font-mono font-black" style={{ color: "#000000" }}>{formData.phone}</strong></span>
                            <span title="Edit Phone">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Alternate Mobile Number</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.alternatePhone || "NA"}</span>
                            <span title="Edit Alternate Phone">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Name</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.name}</span>
                            <span title="Edit Name">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>{"Father's Name"}</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.fatherName || "K. Ramachandran"}</span>
                            <span title="Edit Father's Name">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>{"Mother's Name"}</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.motherName || "R. Priya"}</span>
                            <span title="Edit Mother's Name">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Student Gender</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.gender || "Male"}</span>
                            <span title="Edit Gender">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Blood Group</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.bloodGroup || "O+"}</span>
                            <span title="Edit Blood Group">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Physically Disabled</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.physicallyDisabled || "No"}</span>
                            <span title="Edit Physically Disabled">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Community Category</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.community || "BC"}</span>
                            <span title="Edit Community">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Home Address</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.address || "14 West Car Street, Salem, Tamil Nadu 636001"}</span>
                            <span title="Edit Home Address">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>School Name</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.school || "Govt Higher Secondary School, Salem"}</span>
                            <span title="Edit School Name">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>State</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.state || "Tamil Nadu"}</span>
                            <span title="Edit State">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>City</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: {formData.district || "Salem"}</span>
                            <span title="Edit City">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Campus</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: V.S.B. {formData.campus === "COIMBATORE" ? "Coimbatore" : "Karur"}</span>
                            <span title="Edit Campus">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center group">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Course</span>
                          <span className="sm:col-span-7 font-black text-black flex items-center justify-between" style={{ color: "#000000" }}>
                            <span style={{ color: "#000000" }}>: UG ({formData.courseInterest})</span>
                            <span title="Edit Course">
                              <Edit3
                                className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>
                      </div>
                    ) : activeSubTab === "ADDITIONAL" ? (
                      /* SUB TAB 2: ADDITIONAL DETAILS */
                      <div className="space-y-3.5 text-xs font-sans text-black" style={{ color: "#000000" }}>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>{"Father's Name"}</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {formData.fatherName || "K. Ramachandran"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>{"Mother's Name"}</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {formData.motherName || "R. Priya"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Gender</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {formData.gender || "Male"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Blood Group</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {formData.bloodGroup || "O+"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Physically Disabled</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {formData.physicallyDisabled || "No"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Community Category</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {formData.community || "BC"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Home Address</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {formData.address || "14 West Car Street, Salem, Tamil Nadu 636001"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>10th Marks (%)</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {app.marks10th}%</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>12th Marks (%)</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {app.marks12th}%</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>TNEA Cutoff Score</span>
                          <span className="sm:col-span-7 font-black text-black font-mono" style={{ color: "#000000" }}>: {formData.tneaCutoff || 188.5} / 200</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Affiliated School</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {formData.school || "Govt HSS"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Lead Acquisition Source</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: {formData.source || "Organic"}</span>
                        </div>
                      </div>
                    ) : (
                      /* SUB TAB 3: FACEBOOK DETAILS */
                      <div className="space-y-3.5 text-xs font-sans text-black" style={{ color: "#000000" }}>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Facebook Campaign Name</span>
                          <span className="sm:col-span-7 font-black text-black" style={{ color: "#000000" }}>: VSB_TNEA_Admissions_2026</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Ad Set ID</span>
                          <span className="sm:col-span-7 font-mono text-black font-black" style={{ color: "#000000" }}>: fb_adset_918237</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-300 items-center">
                          <span className="sm:col-span-5 font-black text-black" style={{ color: "#000000" }}>Form ID</span>
                          <span className="sm:col-span-7 font-mono text-black font-black" style={{ color: "#000000" }}>: fb_form_382109</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Other Tabs */}
              {activeMainTab === "TIMELINE" && (
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3 text-xs">
                  <h4 className="font-bold text-white border-b border-slate-800 pb-2">Activity Timeline</h4>
                  <div className="space-y-3 font-mono text-[11px]">
                    <div className="flex gap-3 items-start">
                      <span className="w-2 h-2 rounded-full bg-sky-400 mt-1 shrink-0" />
                      <div>
                        <p className="text-white font-bold">Inquiry Registered</p>
                        <p className="text-slate-400">Lead created via {formData.source} on {new Date(formData.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1 shrink-0" />
                      <div>
                        <p className="text-white font-bold">Counselor Telecall Outreach</p>
                        <p className="text-slate-400">Assigned counselor initiated teleconference check.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeMainTab === "NOTES" && (
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3 text-xs">
                  <h4 className="font-bold text-white border-b border-slate-800 pb-2">Counselor Notes</h4>
                  <textarea
                    placeholder="Add counselor observation notes here..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs"
                    rows={4}
                  />
                  <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                    Save Note
                  </button>
                </div>
              )}

              {activeMainTab === "COMMUNICATION" && (
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3 text-xs">
                  <h4 className="font-bold text-white border-b border-slate-800 pb-2">Communication Logs</h4>
                  <p className="text-slate-400">Log of SMS, WhatsApp outreach, and Portal Emails sent to {formData.email}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
