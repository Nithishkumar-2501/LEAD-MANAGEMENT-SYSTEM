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
import { validateLeadPhoneNumber } from "@/lib/phoneValidation";

interface ApplicantDetailModalProps {
  applicant: (Lead & { application: Application }) | null;
  currentUserRole: "ADMIN" | "TEACHER" | "COUNSELOR";
  onClose: () => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onSave?: (updated: Lead & { application: Application }) => void;
  existingLeads?: Lead[];
}

export default function ApplicantDetailModal({
  applicant,
  currentUserRole,
  onClose,
  onActionTrigger,
  onSave,
  existingLeads = [],
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
      const phoneErr = validateLeadPhoneNumber(formData.phone, existingLeads, formData.id);
      if (phoneErr) {
        alert(phoneErr);
        return;
      }
      try {
        await fetch("/api/applications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } catch (e) {}
      saveStudentToFirebase(formData);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl border border-slate-300 shadow-2xl overflow-hidden text-slate-950 flex flex-col max-h-[96vh] my-auto">
        {/* Top Header / Breadcrumb Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-xs font-black text-slate-950">
            <span className="text-slate-950 font-black">Lead Details</span>
            <span className="text-slate-400">&gt;</span>
            <button
              className="p-1 rounded-md bg-white border border-slate-300 text-sky-600 hover:bg-slate-100 transition-colors shadow-sm"
              title="Filter Lead Views"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onActionTrigger("CALL", formData.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-300 text-xs font-black text-sky-700 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600" /> Add Event
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black transition-all shadow-sm ${
                isEditing
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-white hover:bg-slate-100 border-slate-300 text-slate-900"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> {isEditing ? "Viewing Mode" : "Edit Details"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-950 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-100/70">
          {/* Mio AI Coach Section (Banner Card) */}
          <div className="bg-indigo-50/90 rounded-xl border border-indigo-200 p-3 px-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-950 tracking-wide">
                    Mio AI Coach
                  </span>
                  <span className="text-indigo-400 text-xs">|</span>
                  <span className="text-xs text-indigo-900 font-bold">
                    {aiSummary || "Summary will appear here once generated."}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={generateAiSummary}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md shrink-0 ml-4"
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

          {/* Chevron Stage Tracker Progress Ribbon */}
          <div className="overflow-x-auto pb-1 hide-scrollbar">
            <div className="flex items-center gap-1 min-w-[700px] bg-white p-1.5 rounded-xl border border-slate-300 shadow-sm">
              {stageSteps.map((step, idx) => {
                const isActive = idx === currentStageIdx; // Verified stage active
                const isPassed = idx < currentStageIdx;
                return (
                  <div
                    key={step.key}
                    className={`flex-1 text-center py-2 px-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 relative ${
                      isActive
                        ? "bg-emerald-600 text-white border border-emerald-700 rounded-lg font-black shadow-sm"
                        : isPassed
                        ? "bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300 font-black"
                        : "bg-slate-100 text-slate-950 font-black rounded-lg border border-slate-300 hover:bg-slate-200 shadow-sm"
                    }`}
                  >
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
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
              <div className="bg-white rounded-xl border border-slate-300 p-4 space-y-4 shadow-sm relative overflow-hidden text-slate-950">
                {/* Avatar & Name */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md ring-2 ring-sky-200 shrink-0">
                    {formData.name.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-black text-slate-950 tracking-tight truncate uppercase">
                      {formData.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-700 font-extrabold">
                      <span>Lead Stage:</span>
                      <span className="font-black text-sky-700 flex items-center gap-1">
                        {formData.status === "NEW" ? "Untouched" : formData.status}
                        <Edit3
                          className="w-3 h-3 cursor-pointer text-slate-500 hover:text-slate-900 inline"
                          onClick={() => setIsEditing(true)}
                        />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email & Phone Contact Rows with Verification Icons */}
                <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between text-slate-900">
                    <span className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <strong className="text-slate-950 font-black truncate">
                        {formData.email && formData.email !== "student@example.com"
                          ? formData.email
                          : "NA"}
                      </strong>
                    </span>
                    <span
                      title="Unverified"
                      className="text-rose-600 flex items-center justify-center w-4 h-4 rounded-full bg-rose-100 text-[10px] font-black shrink-0 border border-rose-300"
                    >
                      ✕
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-900">
                    <span className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <strong className="text-slate-950 font-black font-mono">
                        {formData.phone || "+91-6380270912"}
                      </strong>
                    </span>
                    <span
                      title="Verified"
                      className="text-emerald-600 flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-[10px] font-black shrink-0 border border-emerald-300"
                    >
                      ✓
                    </span>
                  </div>
                </div>

                {/* Quick 5 Action Buttons Bar */}
                <div className="grid grid-cols-5 gap-1.5 border-t border-slate-200 pt-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 flex items-center justify-center transition-all shadow-sm"
                    title="Share / Transfer Lead"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onActionTrigger("CALL", formData.name)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 flex items-center justify-center transition-all shadow-sm"
                    title="Call Candidate"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveMainTab("NOTES")}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 flex items-center justify-center transition-all shadow-sm"
                    title="Add Note"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onActionTrigger("EMAIL", formData.name)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 flex items-center justify-center transition-all shadow-sm"
                    title="Send Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onActionTrigger("WHATSAPP", formData.name)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-teal-700 flex items-center justify-center transition-all shadow-sm"
                    title="WhatsApp Outreach"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                  </button>
                </div>

                {/* Lead Strength & Lead Score Stats Widgets */}
                <div className="grid grid-cols-2 gap-2.5 border-t border-slate-200 pt-3">
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-300 text-center">
                    <div className="w-6 h-6 rounded-full border-2 border-sky-600 flex items-center justify-center mx-auto mb-1">
                      <RefreshCw className="w-3 h-3 text-sky-600" />
                    </div>
                    <span className="text-[10px] text-slate-900 font-black uppercase block">
                      Lead Strength
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-300 text-center relative overflow-hidden">
                    <div className="text-lg font-black text-slate-950 flex items-center justify-center gap-1">
                      <span>{formData.leadScore || 10}</span>
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] text-slate-900 font-black uppercase block">
                      Lead Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment Details Accordion Card */}
              <div className="bg-white rounded-xl border border-slate-300 p-4 space-y-2 shadow-sm text-slate-950">
                <div className="flex items-center justify-between text-xs font-black text-slate-950 border-b border-slate-200 pb-2">
                  <span>Assignment Details</span>
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                </div>
                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-700 text-[11px] block font-extrabold">
                      Assigned Owner
                    </span>
                    <span className="font-black text-slate-950 block">
                      {formData.assignedTo || "Dr Dhanabal M Assistant Professor MECH"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-700 text-[11px] block font-extrabold">Lead Source</span>
                    <span className="font-black text-slate-950 block">
                      {formData.source || "Organic"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Important Dates Accordion Card */}
              <div className="bg-white rounded-xl border border-slate-300 p-4 space-y-2 shadow-sm text-slate-950">
                <div className="flex items-center justify-between text-xs font-black text-slate-950 border-b border-slate-200 pb-2">
                  <span>Important Dates</span>
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                </div>
                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-700 text-[11px] block font-extrabold">
                      Upcoming Followup
                    </span>
                    <span className="font-black text-slate-950 block">NA</span>
                  </div>
                  <div>
                    <span className="text-slate-700 text-[11px] block font-extrabold">Last Active</span>
                    <span className="font-black text-slate-950 block">25 Aug 2026 06:30 PM</span>
                  </div>
                  <div>
                    <span className="text-slate-700 text-[11px] block font-extrabold">Lead Added On</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-950">25 Aug 2026 06:25 PM</span>
                      <span className="bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.5 rounded text-[10px] font-black">
                        0d
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Stats Card */}
              <div className="bg-white rounded-xl border border-slate-300 p-4 space-y-2 shadow-sm text-slate-950">
                <div className="flex items-center justify-between text-xs font-black text-slate-950">
                  <span>Engagement Stats</span>
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            </div>

            {/* RIGHT MAIN DETAILS TAB AREA (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Main Navigation Tabs */}
              <div className="flex items-center gap-1.5 border-b border-slate-300 overflow-x-auto pb-1 hide-scrollbar">
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
                      className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black whitespace-nowrap transition-all rounded-t-lg border ${
                        activeMainTab === tab.id
                          ? "bg-sky-600 text-white border-sky-600 shadow-md"
                          : "bg-white text-slate-950 hover:bg-slate-100 border-slate-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: COMMUNICATION LOGS */}
              {activeMainTab === "COMMUNICATION" && (
                <div className="bg-white rounded-xl border border-slate-300 p-5 space-y-4 shadow-sm text-slate-950">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="font-black text-sm text-slate-950 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-sky-600" /> Communication Activity History
                    </h4>
                    <span className="text-xs text-sky-700 font-black bg-sky-100 px-2.5 py-1 rounded-full border border-sky-300">
                      Total Logs: 4
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        type: "OUTGOING_CALL",
                        title: "Outgoing Follow-up Call to Candidate",
                        time: "Today at 02:45 PM",
                        desc: "Counselor discussed TNEA Single Window Counselling options for CSE & ECE branches. Candidate confirmed attending direct campus visit.",
                        status: "CONNECTED",
                      },
                      {
                        type: "WHATSAPP",
                        title: "WhatsApp Prospectus & Fee Structure Sent",
                        time: "Yesterday at 11:15 AM",
                        desc: "Sent PDF brochure for V.S.B. Karur Engineering College & hostel fee details via official WhatsApp API channel.",
                        status: "DELIVERED",
                      },
                      {
                        type: "EMAIL",
                        title: "Admission Confirmation & Verification Email",
                        time: "24 Aug 2026, 05:30 PM",
                        desc: "Sent 10th/12th certificate verification checklist & scholarship guidelines.",
                        status: "OPENED",
                      },
                      {
                        type: "SMS",
                        title: "SMS Alert — Application Submitted",
                        time: "24 Aug 2026, 05:25 PM",
                        desc: "Automated SMS notification dispatched for online registration.",
                        status: "SENT",
                      },
                    ].map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 hover:border-sky-400 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-slate-950 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-600" />
                            {log.title}
                          </span>
                          <span className="text-[11px] font-mono text-slate-600 font-bold">{log.time}</span>
                        </div>
                        <p className="text-xs text-slate-800 font-bold leading-relaxed">
                          {log.desc}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-black border border-sky-300">
                            {log.status}
                          </span>
                          <span className="text-slate-600 font-bold">Via CRM Gateway</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: TIMELINE */}
              {activeMainTab === "TIMELINE" && (
                <div className="bg-white rounded-xl border border-slate-300 p-5 space-y-4 shadow-sm text-slate-950">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="font-black text-sm text-slate-950 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-600" /> Timeline Activity Feed
                    </h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={timelineFilterAction}
                        onChange={(e) => setTimelineFilterAction(e.target.value)}
                        className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-950 text-xs font-black"
                      >
                        <option value="ALL">Select Action</option>
                        <option value="REASSIGNED">Reassigned</option>
                        <option value="REGISTERED">Registered</option>
                      </select>
                      <input
                        type="date"
                        value={timelineFilterDate}
                        onChange={(e) => setTimelineFilterDate(e.target.value)}
                        className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-950 text-xs font-black"
                      />
                    </div>
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300 text-xs">
                    <div className="relative">
                      <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-sky-100 border border-sky-500 flex items-center justify-center text-sky-700 shadow-sm">
                        <Mail className="w-3 h-3" />
                      </div>
                      <div className="bg-slate-50 rounded-xl border border-slate-300 p-3.5 space-y-1">
                        <div className="flex items-center justify-between font-black text-slate-950">
                          <span className="font-mono text-slate-700 text-[11px]">25 Aug 2026 06:29 PM</span>
                        </div>
                        <p className="text-slate-900 text-xs font-bold leading-relaxed">
                          Lead re-assigned to{" "}
                          <strong className="text-slate-950 font-black">
                            {formData.assignedTo || "Dr Dhanabal M Assistant Professor MECH"}
                          </strong>{" "}
                          via System Automation (Automation ID: 54128, Job ID: 17085372) at 25 Aug 2026 06:29 PM.
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-emerald-700 shadow-sm">
                        <UserCheck className="w-3 h-3" />
                      </div>
                      <div className="bg-slate-50 rounded-xl border border-slate-300 p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-slate-700 text-[11px] font-bold">25 Aug 2026 06:25 PM</span>
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                            +10
                          </span>
                        </div>
                        <p className="text-slate-900 text-xs font-bold leading-relaxed">
                          <strong className="text-slate-950 font-black">{formData.name}</strong> registered via lead origin: WhatsApp with mobile verified.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LEAD DETAILS VIEW / EDIT */}
              {activeMainTab === "LEAD_DETAILS" && (
                <div className="bg-white text-slate-950 rounded-xl border border-slate-300 p-5 space-y-4 shadow-sm">
                  {/* Sub Tabs */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      {[
                        { id: "LEAD_DETAILS", label: "Lead Details ✎" },
                        { id: "ADDITIONAL", label: "Additional Details" },
                        { id: "FACEBOOK", label: "Facebook Details" },
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setActiveSubTab(sub.id as any)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                            activeSubTab === sub.id
                              ? "bg-indigo-600 text-white shadow-sm border border-indigo-600"
                              : "text-slate-950 font-black bg-slate-100 hover:bg-slate-200 border border-slate-300"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {isEditing ? "View Details" : "Edit Profile"}
                    </button>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-950 font-black mb-1">Student Full Name</label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-black"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-950 font-black mb-1">Mobile Number</label>
                          <input
                            type="text"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-black"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-950 font-black mb-1">Email Address</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-950 font-black mb-1">Father&apos;s Name</label>
                          <input
                            type="text"
                            value={formData.fatherName || ""}
                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-950 font-black mb-1">Mother&apos;s Name</label>
                          <input
                            type="text"
                            value={formData.motherName || ""}
                            onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-950 font-black mb-1">Gender</label>
                          <select
                            value={formData.gender || "Male"}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-black"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-950 font-black mb-1">Blood Group</label>
                          <select
                            value={formData.bloodGroup || "O+"}
                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-black"
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
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-950 font-black mb-1">Community</label>
                          <select
                            value={formData.community || "BC"}
                            onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-black"
                          >
                            <option value="BC">BC</option>
                            <option value="BCM">BCM</option>
                            <option value="MBC">MBC</option>
                            <option value="SC">SC</option>
                            <option value="SCA">SCA</option>
                            <option value="ST">ST</option>
                            <option value="OC">OC</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-950 font-black mb-1">Target Campus</label>
                          <select
                            value={formData.campus || "KARUR"}
                            onChange={(e) => setFormData({ ...formData, campus: e.target.value as any })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-black"
                          >
                            <option value="KARUR">V.S.B. Karur Campus</option>
                            <option value="COIMBATORE">V.S.B. Coimbatore Campus</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-950 font-black mb-1">Course Interest</label>
                          <input
                            type="text"
                            value={formData.courseInterest || ""}
                            onChange={(e) => setFormData({ ...formData, courseInterest: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-black"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-950 font-black mb-1">School Name</label>
                          <input
                            type="text"
                            value={formData.school || ""}
                            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-950 font-black mb-1">District / City</label>
                          <input
                            type="text"
                            value={formData.district || ""}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-950 font-black"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      {/* SUBTAB 1: LEAD DETAILS */}
                      {activeSubTab === "LEAD_DETAILS" && (
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Student Name</span>
                            <span className="col-span-7 font-black text-slate-950 text-sm">: {formData.name}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Mobile Number</span>
                            <span className="col-span-7 font-black text-sky-700 font-mono text-xs">: {formData.phone}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Email Address</span>
                            <span className="col-span-7 font-black text-slate-950">: {formData.email || "NA"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Father&apos;s Name</span>
                            <span className="col-span-7 font-black text-slate-950">: {formData.fatherName || "M. Natarajan"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Mother&apos;s Name</span>
                            <span className="col-span-7 font-black text-slate-950">: {formData.motherName || "N. Lakshmi"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Gender</span>
                            <span className="col-span-7 font-black text-slate-950">: {formData.gender || "Male"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Blood Group</span>
                            <span className="col-span-7 font-black text-rose-700 font-mono">: {formData.bloodGroup || "O+"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Physically Disabled</span>
                            <span className="col-span-7 font-black text-slate-950">: {formData.physicallyDisabled ? "Yes" : "No"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Community Category</span>
                            <span className="col-span-7 font-black text-amber-800">: {formData.community || "BC"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Target V.S.B. Campus</span>
                            <span className="col-span-7 font-black text-sky-800">: {formData.campus || "KARUR"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Degree Program / Course</span>
                            <span className="col-span-7 font-black text-slate-950">: {formData.courseInterest || "B.E. Computer Science & Engineering"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Application Stage</span>
                            <span className="col-span-7 font-black text-emerald-800">: {formData.application?.stage || formData.status || "INQUIRY"}</span>
                          </div>
                        </div>
                      )}

                      {/* SUBTAB 2: ADDITIONAL DETAILS */}
                      {activeSubTab === "ADDITIONAL" && (
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">10th SSLC Marks (%)</span>
                            <span className="col-span-7 font-black text-emerald-800 font-mono">: {formData.application?.marks10th || 88}%</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">12th HSC Cutoff Marks (%)</span>
                            <span className="col-span-7 font-black text-emerald-700 font-mono">: {formData.application?.marks12th || 91.5}%</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Previous School Name</span>
                            <span className="col-span-7 font-black text-slate-950">: {formData.school || "V.S.B. Higher Secondary School"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Lead Acquisition Source</span>
                            <span className="col-span-7 font-black text-sky-800">: {formData.source || "TNEA Single Window Counselling"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Fee Payment Status</span>
                            <span className="col-span-7 font-black text-emerald-800">: {formData.application?.paymentStatus || "PENDING"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">State</span>
                            <span className="col-span-7 font-black text-slate-950">: {formData.state || "Tamil Nadu"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">District / City</span>
                            <span className="col-span-7 font-black text-sky-800">: {formData.district || "Karur"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Residential Address</span>
                            <span className="col-span-7 font-black text-slate-950">: {formData.address || "124, College Road, Karur, Tamil Nadu - 639111"}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Alternate Contact Phone</span>
                            <span className="col-span-7 font-black text-sky-800 font-mono">: {formData.alternatePhone || "+91 94433 11220"}</span>
                          </div>
                        </div>
                      )}

                      {/* SUBTAB 3: FACEBOOK DETAILS */}
                      {activeSubTab === "FACEBOOK" && (
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Facebook Lead ID</span>
                            <span className="col-span-7 font-mono font-black text-sky-800">: fb_lead_987412{formData.id.slice(-4)}</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Ad Campaign Name</span>
                            <span className="col-span-7 font-black text-slate-950">: VSB_Admissions_2026_TN_Engineering</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Adset Target Group</span>
                            <span className="col-span-7 font-black text-slate-950">: TN_Higher_Secondary_Aspirants_Direct</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Lead Form Name</span>
                            <span className="col-span-7 font-black text-emerald-800">: Direct_Admission_Form_2026</span>
                          </div>
                          <div className="grid grid-cols-12 border-b border-slate-200 py-2.5 items-center">
                            <span className="col-span-5 font-black text-slate-700">Lead Generation Platform</span>
                            <span className="col-span-7 font-black text-sky-800">: Meta Ads (Facebook & Instagram)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CALENDAR PRO */}
              {activeMainTab === "CALENDAR" && (
                <div className="bg-white rounded-xl border border-slate-300 p-5 space-y-4 shadow-sm text-xs text-slate-950">
                  <h4 className="font-black text-slate-950 text-sm">Calendar Pro - Followup Schedule</h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-center space-y-2">
                    <Calendar className="w-8 h-8 text-sky-600 mx-auto" />
                    <p className="text-slate-900 font-black">No upcoming followup tasks scheduled.</p>
                    <button
                      onClick={() => onActionTrigger("CALL", formData.name)}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-lg text-xs shadow-sm"
                    >
                      + Schedule Followup Event
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: NOTES */}
              {activeMainTab === "NOTES" && (
                <div className="bg-white rounded-xl border border-slate-300 p-5 space-y-4 shadow-sm text-xs text-slate-950">
                  <h4 className="font-black text-slate-950 text-sm">Counselor Notes</h4>
                  <div className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter counselor observation notes here..."
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-950 font-bold text-xs focus:outline-none focus:border-sky-500"
                      rows={3}
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs shadow-sm"
                    >
                      Save Counselor Note
                    </button>
                  </div>

                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    {notesList.map((note) => (
                      <div
                        key={note.id}
                        className="bg-slate-50 rounded-xl p-3 border border-slate-300 space-y-1 text-slate-950"
                      >
                        <div className="flex justify-between text-[11px] text-slate-700">
                          <span className="font-black text-sky-700">{note.author}</span>
                          <span className="font-mono font-bold">{note.date}</span>
                        </div>
                        <p className="text-slate-900 text-xs font-bold">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: TICKETS */}
              {activeMainTab === "TICKETS" && (
                <div className="bg-white rounded-xl border border-slate-300 p-5 space-y-4 shadow-sm text-xs text-slate-950">
                  <h4 className="font-black text-slate-950 text-sm">Support & Inquiry Tickets</h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-center space-y-2">
                    <Ticket className="w-8 h-8 text-indigo-600 mx-auto" />
                    <p className="text-slate-900 font-black">No active support tickets found.</p>
                  </div>
                </div>
              )}

              {/* TAB 7: CALL LOGS */}
              {activeMainTab === "CALL_LOGS" && (
                <div className="bg-white rounded-xl border border-slate-300 p-5 space-y-4 shadow-sm text-xs text-slate-950">
                  <h4 className="font-black text-slate-950 text-sm">Call Logs & Teleconference Audio</h4>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-300 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center text-emerald-700">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-black text-slate-950">Outbound Call - Dr Dhanabal M</div>
                          <div className="text-[11px] text-slate-700 font-bold">
                            25 Aug 2026 06:30 PM • Duration: 02m 14s
                          </div>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-300">
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
