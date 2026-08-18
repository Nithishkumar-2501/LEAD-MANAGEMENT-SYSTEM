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
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/10"
                        : isPassed
                        ? "bg-slate-800/90 text-slate-300 border border-slate-700"
                        : "bg-slate-950/50 text-slate-500 border border-slate-850"
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
                <div className="grid grid-cols-2 gap-2.5 border-t border-slate-800/80 pt-3">
                  <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 text-center">
                    <div className="w-6 h-6 rounded-full border-2 border-sky-400 flex items-center justify-center mx-auto mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Lead Strength
                    </span>
                    <span className="text-xs font-extrabold text-sky-300">High</span>
                  </div>

                  <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 text-center relative overflow-hidden">
                    <div className="text-xl font-black text-white flex items-center justify-center gap-1">
                      <span>5</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
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
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg">
                  {/* Sub Tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                    {[
                      { id: "LEAD_DETAILS", label: "Lead Details ✎" },
                      { id: "ADDITIONAL", label: "Additional Details" },
                      { id: "FACEBOOK", label: "Facebook Details" },
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubTab(sub.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeSubTab === sub.id
                            ? "bg-slate-800 text-sky-300 border border-slate-700"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}

                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="ml-auto text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> {isEditing ? "Cancel Edit" : "Edit All Details"}
                    </button>
                  </div>

                  {/* FORM EDIT MODE - EDIT ALL DETAILS */}
                  {isEditing ? (
                    <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4" /> Editing All Student Details
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Modify fields below and click Save All Changes
                        </span>
                      </div>

                      {/* SECTION 1: Personal & Contact Information */}
                      <div className="space-y-3 pt-1">
                        <h4 className="text-sky-400 font-extrabold border-b border-slate-800 pb-1 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Personal & Contact Details
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Student Full Name</label>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Mobile Number</label>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-1 items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden px-2">
                                <span className="text-slate-400 text-xs font-mono pr-1">+91</span>
                                <input
                                  type="text"
                                  required
                                  value={formData.phone.replace("+91-", "").replace("+91 ", "")}
                                  onChange={(e) => setFormData({ ...formData, phone: `+91-${e.target.value}` })}
                                  className="w-full bg-transparent py-2 text-white text-xs focus:outline-none font-mono"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => alert("Verification code sent to " + formData.phone)}
                                className="px-3 py-2 bg-sky-950 border border-sky-500/40 text-sky-300 hover:text-white rounded-xl text-[11px] font-bold shrink-0 transition-all"
                              >
                                Verify Number
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Email Address</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => alert("Verification email sent to " + formData.email)}
                                className="px-3 py-2 bg-indigo-950 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-[11px] font-bold shrink-0 transition-all"
                              >
                                Send Verification Email
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Alternate Mobile Number</label>
                            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-2">
                              <span className="text-slate-400 text-xs font-mono pr-1">+91</span>
                              <input
                                type="text"
                                value={(formData.alternatePhone || "").replace("+91-", "").replace("+91 ", "")}
                                onChange={(e) => setFormData({ ...formData, alternatePhone: `+91-${e.target.value}` })}
                                placeholder=""
                                className="w-full bg-transparent py-2 text-white text-xs focus:outline-none font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">State</label>
                            <select
                              value={formData.state || "Tamil Nadu"}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="Tamil Nadu">Tamil Nadu</option>
                              <option value="Kerala">Kerala</option>
                              <option value="Karnataka">Karnataka</option>
                              <option value="Andhra Pradesh">Andhra Pradesh</option>
                              <option value="Telangana">Telangana</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">City / District</label>
                            <input
                              type="text"
                              value={formData.district || "Salem"}
                              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                              placeholder="e.g. Salem, Karur, Coimbatore"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: Lead Stage & Sub-Stage & Follow-up Details (Picture 3) */}
                      <div className="space-y-3 pt-3">
                        <h4 className="text-indigo-400 font-extrabold border-b border-slate-800 pb-1 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" /> Stage Segregation & Follow-up Settings
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Select Lead Stage</label>
                            <select
                              value={formData.status === "NEW" ? "Untouched" : "Interested to Join VSB"}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value === "Untouched" ? "NEW" : "CONTACTED" })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sky-300 font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="Untouched">Untouched</option>
                              <option value="Interested to Join VSB">Interested to Join VSB</option>
                              <option value="Interested to Study Engineering">Interested to Study Engineering</option>
                              <option value="Admitted in VSB">Admitted in VSB</option>
                              <option value="Not Reachable">Not Reachable</option>
                              <option value="Not Interested in Engineering">Not Interested in Engineering</option>
                              <option value="Walkin">Walkin</option>
                              <option value="After NEET">After NEET</option>
                              <option value="Not Decided">Not Decided</option>
                              <option value="Counseling applied">Counseling applied</option>
                              <option value="Partially Interested in Engineering">Partially Interested in Engineering</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Select Lead Sub Stage</label>
                            <select
                              value={formData.subStage || "Asked to Call Back"}
                              onChange={(e) => setFormData({ ...formData, subStage: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="Lead Sub Stage">Lead Sub Stage</option>
                              <option value="Asked to Call Back">Asked to Call Back</option>
                              <option value="Within a Week">Within a Week</option>
                              <option value="After a Week">After a Week</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Select Timezone</label>
                            <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400">
                              <option value="IST">(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Set Follow-up Date</label>
                            <input
                              type="date"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Set Follow-up End Date</label>
                            <input
                              type="date"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Follow-up Assigned To</label>
                            <select
                              value={formData.assignedTo || "Dr Dhanabal M Assistant Professor MECH"}
                              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="Dr Dhanabal M Assistant Professor MECH">Dr Dhanabal M Assistant Professor MECH</option>
                              <option value="Dr. K. Arulmurugan (Karur)">Dr. K. Arulmurugan (Karur)</option>
                              <option value="Dr. S. Meenakshi (Coimbatore)">Dr. S. Meenakshi (Coimbatore)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Campus / Department</label>
                            <select
                              value={formData.campus}
                              onChange={(e) => setFormData({ ...formData, campus: e.target.value as any })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="KARUR">V.S.B. Karur</option>
                              <option value="COIMBATORE">V.S.B. Coimbatore</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Affiliated School</label>
                            <input
                              type="text"
                              value={formData.school || ""}
                              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                              placeholder="e.g. Govt Higher Secondary School"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: Marks & Cutoff Score Details */}
                      <div className="space-y-3 pt-3">
                        <h4 className="text-purple-400 font-extrabold border-b border-slate-800 pb-1 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" /> Marks & Cutoff Performance
                        </h4>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">10th Marks (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={app.marks10th}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  application: { ...app, marks10th: Number(e.target.value) },
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">12th Marks (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={app.marks12th}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  application: { ...app, marks12th: Number(e.target.value) },
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">TNEA Cutoff Score</label>
                            <input
                              type="number"
                              step="0.25"
                              value={formData.tneaCutoff || 188.5}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  tneaCutoff: Number(e.target.value),
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sky-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 4: Application Stage & Payment Status */}
                      <div className="space-y-3 pt-3">
                        <h4 className="text-emerald-400 font-extrabold border-b border-slate-800 pb-1 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" /> Application Stage & Payment
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Application Stage</label>
                            <select
                              value={app.stage}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  application: { ...app, stage: e.target.value as AppStage },
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold"
                            >
                              <option value="INQUIRY">INQUIRY</option>
                              <option value="SUBMITTED">SUBMITTED</option>
                              <option value="DOCS_VERIFIED">DOCS VERIFIED</option>
                              <option value="OFFER_ISSUED">OFFER ISSUED</option>
                              <option value="FEE_PAID">FEE PAID</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Payment Status</label>
                            <select
                              value={app.paymentStatus}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  application: { ...app, paymentStatus: e.target.value },
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="COMPLETED">COMPLETED</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black shadow-lg shadow-sky-500/30"
                        >
                          <Save className="w-4 h-4" /> Save All Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* SUB TAB 1: LEAD DETAILS (VIEW MODE WITH EDIT TRIPPERS) */
                    activeSubTab === "LEAD_DETAILS" ? (
                      <div className="space-y-3.5 text-xs font-sans">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center group">
                          <span className="sm:col-span-5 font-bold text-slate-400">Email Address</span>
                          <span className="sm:col-span-7 font-bold text-white flex items-center justify-between">
                            <span>: <strong className="text-slate-100 font-mono">{formData.email}</strong></span>
                            <span title="Edit Email">
                              <Edit3
                                className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-sky-400 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center group">
                          <span className="sm:col-span-5 font-bold text-slate-400 flex items-center gap-1">
                            Mobile Number <Info className="w-3 h-3 text-slate-500" />
                          </span>
                          <span className="sm:col-span-7 font-bold text-white flex items-center justify-between">
                            <span>: <strong className="text-slate-100 font-mono">{formData.phone}</strong></span>
                            <span title="Edit Phone">
                              <Edit3
                                className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-sky-400 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center group">
                          <span className="sm:col-span-5 font-bold text-slate-400">Alternate Mobile Number</span>
                          <span className="sm:col-span-7 font-semibold text-slate-400 flex items-center justify-between">
                            <span>: {formData.alternatePhone || "NA"}</span>
                            <span title="Edit Alternate Phone">
                              <Edit3
                                className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-sky-400 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center group">
                          <span className="sm:col-span-5 font-bold text-slate-400">Name</span>
                          <span className="sm:col-span-7 font-bold text-white flex items-center justify-between">
                            <span>: {formData.name}</span>
                            <span title="Edit Name">
                              <Edit3
                                className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-sky-400 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center group">
                          <span className="sm:col-span-5 font-bold text-slate-400">State</span>
                          <span className="sm:col-span-7 font-semibold text-slate-200 flex items-center justify-between">
                            <span>: {formData.state || "Tamil Nadu"}</span>
                            <span title="Edit State">
                              <Edit3
                                className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-sky-400 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center group">
                          <span className="sm:col-span-5 font-bold text-slate-400">City</span>
                          <span className="sm:col-span-7 font-semibold text-slate-200 flex items-center justify-between">
                            <span>: {formData.district || "Salem"}</span>
                            <span title="Edit City">
                              <Edit3
                                className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-sky-400 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center group">
                          <span className="sm:col-span-5 font-bold text-slate-400">Campus</span>
                          <span className="sm:col-span-7 font-bold text-sky-300 flex items-center justify-between">
                            <span>: V.S.B. {formData.campus === "COIMBATORE" ? "Coimbatore" : "Karur"}</span>
                            <span title="Edit Campus">
                              <Edit3
                                className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-sky-400 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center group">
                          <span className="sm:col-span-5 font-bold text-slate-400">Course</span>
                          <span className="sm:col-span-7 font-bold text-indigo-300 flex items-center justify-between">
                            <span>: UG</span>
                            <span title="Edit Course">
                              <Edit3
                                className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-sky-400 cursor-pointer transition-all"
                                onClick={() => setIsEditing(true)}
                              />
                            </span>
                          </span>
                        </div>
                      </div>
                    ) : activeSubTab === "ADDITIONAL" ? (
                      /* SUB TAB 2: ADDITIONAL DETAILS */
                      <div className="space-y-3.5 text-xs font-sans">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center">
                          <span className="sm:col-span-5 font-bold text-slate-400">10th Marks (%)</span>
                          <span className="sm:col-span-7 font-bold text-white">: {app.marks10th}%</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center">
                          <span className="sm:col-span-5 font-bold text-slate-400">12th Marks (%)</span>
                          <span className="sm:col-span-7 font-bold text-white">: {app.marks12th}%</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center">
                          <span className="sm:col-span-5 font-bold text-slate-400">TNEA Cutoff Score</span>
                          <span className="sm:col-span-7 font-bold text-sky-300 font-mono">: {formData.tneaCutoff || 188.5} / 200</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center">
                          <span className="sm:col-span-5 font-bold text-slate-400">Affiliated School</span>
                          <span className="sm:col-span-7 font-semibold text-slate-200">: {formData.school || "Govt HSS"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center">
                          <span className="sm:col-span-5 font-bold text-slate-400">Lead Acquisition Source</span>
                          <span className="sm:col-span-7 font-semibold text-indigo-300">: {formData.source || "Organic"}</span>
                        </div>
                      </div>
                    ) : (
                      /* SUB TAB 3: FACEBOOK DETAILS */
                      <div className="space-y-3.5 text-xs font-sans">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center">
                          <span className="sm:col-span-5 font-bold text-slate-400">Facebook Campaign Name</span>
                          <span className="sm:col-span-7 font-bold text-white">: VSB_TNEA_Admissions_2026</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center">
                          <span className="sm:col-span-5 font-bold text-slate-400">Ad Set ID</span>
                          <span className="sm:col-span-7 font-mono text-slate-300">: fb_adset_918237</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-2 border-b border-slate-800/60 items-center">
                          <span className="sm:col-span-5 font-bold text-slate-400">Form ID</span>
                          <span className="sm:col-span-7 font-mono text-slate-300">: fb_form_382109</span>
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
