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
  Sparkles,
  Share2,
  Calendar,
  Ticket,
  FileText,
  Check,
  RotateCcw,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Send,
  Filter,
  CheckCircle,
  MessageCircle,
  PhoneCall,
  UserCheck,
  Zap,
} from "lucide-react";
import { Lead, Application, LeadStatus, AppStage } from "@/types/crm";
import { saveStudentToFirebase } from "@/lib/firebaseSync";

interface ApplicantDetailModalProps {
  applicant: (Lead & { application: Application }) | null;
  currentUserRole: "ADMIN" | "TEACHER" | "COUNSELOR";
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
    "LEAD_DETAILS" | "TIMELINE" | "CALENDAR" | "NOTES" | "COMMUNICATION" | "TICKETS" | "CALL_LOGS"
  >("COMMUNICATION");

  const [activeSubTab, setActiveSubTab] = useState<"LEAD_DETAILS" | "ADDITIONAL" | "FACEBOOK">(
    "LEAD_DETAILS"
  );

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [notesList, setNotesList] = useState<
    { id: string; text: string; date: string; author: string }[]
  >([
    {
      id: "1",
      text: "Student inquired about B.Tech AI & DS fee structure and TNEA cutoffs.",
      date: "25 Aug 2026 06:30 PM",
      author: "Dr Dhanabal M",
    },
  ]);

  const [timelineFilterAction, setTimelineFilterAction] = useState("ALL");
  const [timelineFilterDate, setTimelineFilterDate] = useState("");
  const [commLogDateFilter, setCommLogDateFilter] = useState("");

  useEffect(() => {
    setFormData(applicant);
  }, [applicant]);

  if (!applicant || !formData) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      await saveStudentToFirebase(formData);
    }
    if (onSave && formData) {
      onSave(formData);
    }
    setIsEditing(false);
  };

  const generateAiSummary = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      setAiSummary(
        `High-intent candidate interested in ${
          formData.courseInterest || "B.Tech Engineering"
        }. Mobile number verified (+91-${
          formData.phone.replace("+91-", "")
        }). Lead source: WhatsApp campaign. Assigned owner: ${
          formData.assignedTo || "Dr Dhanabal M Assistant Professor MECH"
        }. Current score: ${formData.leadScore || 10}/100. Recommended next action: Teleconference call for application submission.`
      );
      setIsGeneratingAi(false);
    }, 800);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotesList([
      {
        id: Date.now().toString(),
        text: newNote,
        date: new Date().toLocaleString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        author: currentUserRole === "ADMIN" ? "Admin" : "Dr Dhanabal M",
      },
      ...notesList,
    ]);
    setNewNote("");
  };

  const app = formData.application || {
    id: "app-1",
    leadId: formData.id,
    stage: "INQUIRY" as AppStage,
    marks10th: 88,
    marks12th: 92,
    paymentStatus: "PENDING",
  };

  // 6 Stages matching NoPaperForms / Meritto reference screenshot
  const stageSteps = [
    { label: "Unverified", key: "UNVERIFIED" },
    { label: "Verified", key: "VERIFIED" },
    { label: "Application Started", key: "APP_STARTED" },
    { label: "Payment Approved", key: "PAYMENT_APPROVED" },
    { label: "Application Submitted", key: "APP_SUBMITTED" },
    { label: "Enrolments", key: "ENROLMENTS" },
  ];

  // Stage 1 (Verified) active by default as shown in the provided images
  const currentStageIdx = 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#0b1329] w-full max-w-6xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[96vh] my-auto">
        {/* Top Header / Breadcrumb Bar */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-[#0f172a] shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="text-slate-300 font-bold">Lead Details</span>
            <span className="text-slate-500">&gt;</span>
            <button
              className="p-1 rounded-md bg-slate-800 border border-slate-700 text-sky-400 hover:text-white transition-colors"
              title="Filter Lead Views"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onActionTrigger("CALL", formData.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" /> Add Event
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isEditing
                  ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-sky-400 hover:text-white"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> {isEditing ? "Viewing Mode" : "Edit Details"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Mio AI Coach Section (Banner Card from Screenshot) */}
          <div className="bg-gradient-to-r from-[#1e1b4b]/90 via-[#2e1065]/70 to-[#0f172a] rounded-xl border border-indigo-500/30 p-3 px-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-purple-300 tracking-wide">
                    Mio AI Coach
                  </span>
                  <span className="text-slate-400 text-xs">|</span>
                  <span className="text-xs text-slate-300 font-medium">
                    {aiSummary || "Summary will appear here once generated."}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={generateAiSummary}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shrink-0 ml-4"
            >
              {isGeneratingAi ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Generate Summary
                </>
              )}
            </button>
          </div>

          {/* Chevron Stage Tracker Progress Ribbon (Exact layout from NoPaperForms) */}
          <div className="overflow-x-auto pb-1 hide-scrollbar">
            <div className="flex items-center gap-1 min-w-[700px] bg-[#0f172a] p-1.5 rounded-xl border border-slate-800">
              {stageSteps.map((step, idx) => {
                const isActive = idx === currentStageIdx; // Verified stage active
                const isPassed = idx < currentStageIdx;
                return (
                  <div
                    key={step.key}
                    className={`flex-1 text-center py-2 px-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 relative ${
                      isActive
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold shadow-sm"
                        : isPassed
                        ? "bg-emerald-950/30 text-emerald-400/80 rounded-lg"
                        : "bg-slate-900/60 text-slate-400 rounded-lg border border-slate-800/80"
                    }`}
                  >
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    )}
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
              <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 space-y-4 shadow-lg relative overflow-hidden">
                {/* Avatar & Name */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md ring-2 ring-white/10 shrink-0">
                    {formData.name.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-white tracking-tight truncate">
                      {formData.name.toUpperCase()}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <span>Lead Stage:</span>
                      <span className="font-bold text-sky-400 flex items-center gap-1">
                        {formData.status === "NEW" ? "Untouched" : formData.status}
                        <Edit3
                          className="w-3 h-3 cursor-pointer text-slate-400 hover:text-white inline"
                          onClick={() => setIsEditing(true)}
                        />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email & Phone Contact Rows with Verification Icons */}
                <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <strong className="text-slate-300 font-normal truncate">
                        {formData.email && formData.email !== "student@example.com"
                          ? formData.email
                          : "NA"}
                      </strong>
                    </span>
                    <span
                      title="Unverified"
                      className="text-rose-400 flex items-center justify-center w-4 h-4 rounded-full bg-rose-950/50 text-[10px] font-bold shrink-0"
                    >
                      ✕
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <strong className="text-slate-300 font-medium">
                        {formData.phone || "+91-6380270912"}
                      </strong>
                    </span>
                    <span
                      title="Verified"
                      className="text-emerald-400 flex items-center justify-center w-4 h-4 rounded-full bg-emerald-950/50 text-[10px] font-bold shrink-0"
                    >
                      ✓
                    </span>
                  </div>
                </div>

                {/* Quick 5 Action Buttons Bar */}
                <div className="grid grid-cols-5 gap-1.5 border-t border-slate-800/80 pt-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                    title="Share / Transfer Lead"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onActionTrigger("CALL", formData.name)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                    title="Call Candidate"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveMainTab("NOTES")}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                    title="Add Note"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onActionTrigger("EMAIL", formData.name)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                    title="Send Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onActionTrigger("WHATSAPP", formData.name)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                    title="WhatsApp Outreach"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                  </button>
                </div>

                {/* Lead Strength & Lead Score Stats Widgets (Matching Screenshot) */}
                <div className="grid grid-cols-2 gap-2.5 border-t border-slate-800/80 pt-3">
                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-center">
                    <div className="w-6 h-6 rounded-full border-2 border-sky-400 flex items-center justify-center mx-auto mb-1">
                      <RefreshCw className="w-3 h-3 text-sky-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase block">
                      Lead Strength
                    </span>
                  </div>

                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-center relative overflow-hidden">
                    <div className="text-lg font-black text-white flex items-center justify-center gap-1">
                      <span>{formData.leadScore || 10}</span>
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase block">
                      Lead Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment Details Accordion Card */}
              <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                  <span>Assignment Details</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 text-[11px] block font-medium">
                      Assigned Owner
                    </span>
                    <span className="font-semibold text-slate-200 block">
                      {formData.assignedTo || "Dr Dhanabal M Assistant Professor MECH"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block font-medium">Lead Source</span>
                    <span className="font-semibold text-slate-200 block">
                      {formData.source || "Other Campaigns: Whatsapp"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Important Dates Accordion Card */}
              <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                  <span>Important Dates</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 text-[11px] block font-medium">
                      Upcoming Followup
                    </span>
                    <span className="font-semibold text-slate-400">NA</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block font-medium">Last Active</span>
                    <span className="font-semibold text-slate-200 block">25 Aug 2026 06:30 PM</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block font-medium">Lead Added On</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">25 Aug 2026 06:25 PM</span>
                      <span className="bg-sky-950 text-sky-400 border border-sky-800/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        0d
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Stats Card */}
              <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Engagement Stats</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* RIGHT MAIN DETAILS TAB AREA (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Main Navigation Tabs (Matching exact order in Screenshot) */}
              <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-0.5 hide-scrollbar">
                {[
                  { id: "LEAD_DETAILS", label: "Lead Details", icon: User },
                  { id: "TIMELINE", label: "Timeline", icon: Clock },
                  { id: "CALENDAR", label: "Calendar Pro", icon: Calendar },
                  { id: "NOTES", label: "Notes", icon: FileText },
                  { id: "COMMUNICATION", label: "Communication Logs", icon: Mail },
                  { id: "TICKETS", label: "Tickets", icon: Ticket },
                  { id: "CALL_LOGS", label: "Call Logs", icon: PhoneCall },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveMainTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                        activeMainTab === tab.id
                          ? "border-sky-400 text-sky-300 bg-sky-950/20"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: COMMUNICATION LOGS (MATCHING IMAGE 1 SCREENSHOT EXACTLY) */}
              {activeMainTab === "COMMUNICATION" && (
                <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-6 shadow-xl text-xs">
                  {/* Email Summary Grid */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-300 text-xs">Email Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-emerald-500 text-center">
                        <div className="text-base font-extrabold text-white">0</div>
                        <div className="text-[11px] text-slate-400 font-medium">Email Sent</div>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-purple-500 text-center">
                        <div className="text-base font-extrabold text-white">0%</div>
                        <div className="text-[11px] text-slate-400 font-medium">Open Rate</div>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-amber-500 text-center">
                        <div className="text-base font-extrabold text-white">0%</div>
                        <div className="text-[11px] text-slate-400 font-medium">Click Rate</div>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-rose-500 text-center">
                        <div className="text-base font-extrabold text-white">0</div>
                        <div className="text-[11px] text-slate-400 font-medium">Email Bounced</div>
                      </div>
                    </div>
                  </div>

                  {/* SMS Summary Grid */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-300 text-xs">SMS Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-emerald-500 text-center">
                        <div className="text-base font-extrabold text-white">0</div>
                        <div className="text-[11px] text-slate-400 font-medium">SMS Sent</div>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-purple-500 text-center">
                        <div className="text-base font-extrabold text-white">0</div>
                        <div className="text-[11px] text-slate-400 font-medium">SMS Delivered</div>
                      </div>
                    </div>
                  </div>

                  {/* Whatsapp Summary Grid */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-300 text-xs">Whatsapp Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-emerald-500 text-center">
                        <div className="text-base font-extrabold text-white">1</div>
                        <div className="text-[11px] text-slate-400 font-medium">Whatsapp Sent</div>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-purple-500 text-center">
                        <div className="text-base font-extrabold text-white">0</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          Whatsapp Delivered
                        </div>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-amber-500 text-center">
                        <div className="text-base font-extrabold text-white">0</div>
                        <div className="text-[11px] text-slate-400 font-medium">Click Rate</div>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-rose-500 text-center">
                        <div className="text-base font-extrabold text-white">0</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          Unsubscribe Rate
                        </div>
                      </div>
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 border-b-2 border-b-emerald-500 text-center">
                        <div className="text-base font-extrabold text-white">0</div>
                        <div className="text-[11px] text-slate-400 font-medium">Auto Reply</div>
                      </div>
                    </div>
                  </div>

                  {/* Communication Log Section with Date Filter */}
                  <div className="space-y-3 border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-300 text-xs">Communication Log</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={commLogDateFilter}
                          onChange={(e) => setCommLogDateFilter(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 text-xs"
                        />
                        <span className="text-slate-400 text-xs">Select Date</span>
                      </div>
                    </div>

                    {/* Log Entry Item */}
                    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-white">WhatsApp Outreach Message</span>
                          <span className="bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded text-[10px]">
                            Sent
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">25 Aug 2026 06:25 PM</span>
                      </div>
                      <p className="text-slate-300 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                        Welcome to VSB Educational Institutions! Your inquiry has been registered.
                        Our admissions counselor will guide you through the process.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TIMELINE (MATCHING IMAGE 2 SCREENSHOT EXACTLY) */}
              {activeMainTab === "TIMELINE" && (
                <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-5 shadow-xl text-xs">
                  {/* Top Action & Date Filters */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-white text-sm">Timeline</h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={timelineFilterAction}
                        onChange={(e) => setTimelineFilterAction(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 text-xs font-medium"
                      >
                        <option value="ALL">Select Action</option>
                        <option value="ASSIGNMENT">Lead Assignment</option>
                        <option value="REGISTRATION">Registration</option>
                        <option value="CALL">Calls</option>
                      </select>

                      <input
                        type="date"
                        value={timelineFilterDate}
                        onChange={(e) => setTimelineFilterDate(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Vertical Timeline Feed (Exact items from Screenshot 2) */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {/* Item 1: System Automation Re-assignment */}
                    <div className="relative group">
                      <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-sky-950 border border-sky-400 flex items-center justify-center text-sky-400 shadow-md">
                        <Mail className="w-3 h-3" />
                      </div>

                      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 space-y-1 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400">
                            25 Aug 2026 06:29 PM
                          </span>
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed font-sans">
                          Lead re-assigned to{" "}
                          <strong className="text-white font-bold">
                            {formData.assignedTo || "Dr Dhanabal M Assistant Professor MECH"}
                          </strong>{" "}
                          via System Automation (Automation ID: 54128, Job ID: 17085372) at 25 Aug
                          2026 06:29 PM.
                        </p>
                      </div>
                    </div>

                    {/* Item 2: Lead Registration via WhatsApp Origin */}
                    <div className="relative group">
                      <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-md">
                        <UserCheck className="w-3 h-3" />
                      </div>

                      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 space-y-1 hover:border-slate-700 transition-colors relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400">
                            25 Aug 2026 06:25 PM
                          </span>
                          <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                            +10
                          </span>
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed font-sans pr-12">
                          <strong className="text-slate-100 font-bold">
                            {formData.name.toLowerCase()}
                          </strong>{" "}
                          registered via lead origin:Chat, registration channel: through Publisher:
                          WhatsApp with Campaign Name: whatsapp/api/reply with mobile verified .
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LEAD DETAILS VIEW / EDIT */}
              {activeMainTab === "LEAD_DETAILS" && (
                <div className="bg-[#0f172a] text-slate-100 rounded-xl border border-slate-800 p-5 space-y-4 shadow-xl">
                  {/* Sub Tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    {[
                      { id: "LEAD_DETAILS", label: "Lead Details ✎" },
                      { id: "ADDITIONAL", label: "Additional Details" },
                      { id: "FACEBOOK", label: "Facebook Details" },
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setActiveSubTab(sub.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeSubTab === sub.id
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">
                            Student Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">
                            Mobile Number
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Email</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Course</label>
                          <input
                            type="text"
                            value={formData.courseInterest}
                            onChange={(e) =>
                              setFormData({ ...formData, courseInterest: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3 text-xs text-slate-300">
                      <div className="grid grid-cols-12 border-b border-slate-800/80 py-2">
                        <span className="col-span-5 font-semibold text-slate-400">Student Name</span>
                        <span className="col-span-7 font-bold text-white">: {formData.name}</span>
                      </div>
                      <div className="grid grid-cols-12 border-b border-slate-800/80 py-2">
                        <span className="col-span-5 font-semibold text-slate-400">
                          Mobile Number
                        </span>
                        <span className="col-span-7 font-bold text-sky-400 font-mono">
                          : {formData.phone}
                        </span>
                      </div>
                      <div className="grid grid-cols-12 border-b border-slate-800/80 py-2">
                        <span className="col-span-5 font-semibold text-slate-400">Email</span>
                        <span className="col-span-7 font-bold text-slate-300">
                          : {formData.email || "NA"}
                        </span>
                      </div>
                      <div className="grid grid-cols-12 border-b border-slate-800/80 py-2">
                        <span className="col-span-5 font-semibold text-slate-400">Course</span>
                        <span className="col-span-7 font-bold text-white">
                          : {formData.courseInterest || "B.Tech Computer Science"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CALENDAR PRO */}
              {activeMainTab === "CALENDAR" && (
                <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4 shadow-xl text-xs">
                  <h4 className="font-bold text-white text-sm">Calendar Pro - Followup Schedule</h4>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                    <Calendar className="w-8 h-8 text-sky-400 mx-auto" />
                    <p className="text-slate-300 font-bold">No upcoming followup tasks scheduled.</p>
                    <button
                      onClick={() => onActionTrigger("CALL", formData.name)}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs"
                    >
                      + Schedule Followup Event
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: NOTES */}
              {activeMainTab === "NOTES" && (
                <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4 shadow-xl text-xs">
                  <h4 className="font-bold text-white text-sm">Counselor Notes</h4>
                  <div className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter counselor observation notes here..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-sky-500"
                      rows={3}
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                    >
                      Save Counselor Note
                    </button>
                  </div>

                  <div className="space-y-2 border-t border-slate-800 pt-3">
                    {notesList.map((note) => (
                      <div
                        key={note.id}
                        className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1"
                      >
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span className="font-bold text-sky-400">{note.author}</span>
                          <span>{note.date}</span>
                        </div>
                        <p className="text-slate-200 text-xs">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: TICKETS */}
              {activeMainTab === "TICKETS" && (
                <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4 shadow-xl text-xs">
                  <h4 className="font-bold text-white text-sm">Support & Inquiry Tickets</h4>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                    <Ticket className="w-8 h-8 text-indigo-400 mx-auto" />
                    <p className="text-slate-300 font-bold">No active support tickets found.</p>
                  </div>
                </div>
              )}

              {/* TAB 7: CALL LOGS */}
              {activeMainTab === "CALL_LOGS" && (
                <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4 shadow-xl text-xs">
                  <h4 className="font-bold text-white text-sm">Call Logs & Teleconference Audio</h4>
                  <div className="space-y-3">
                    <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white">Outbound Call - Dr Dhanabal M</div>
                          <div className="text-[11px] text-slate-400">
                            25 Aug 2026 06:30 PM • Duration: 02m 14s
                          </div>
                        </div>
                      </div>
                      <span className="bg-emerald-950 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800">
                        Interested
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
