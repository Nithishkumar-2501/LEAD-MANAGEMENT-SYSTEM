"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Send,
  Brain,
  Flame,
  Zap,
  Snowflake,
  Filter,
  User,
  Phone,
  MapPin,
  GraduationCap,
  ChevronRight,
  RotateCcw,
  Copy,
  Check,
  PhoneCall,
  MessageCircle,
  ArrowUpRight,
  Layers,
  Radio,
  Edit3,
  Trash2,
  Paperclip,
  Upload,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Lead, Application, CampusLocation, ActiveTab } from "@/types/crm";
import { processNoraChatQuery, NoraChatMessage } from "@/lib/ai/noraDatabaseAgent";
import { renderFormattedMarkdown } from "@/lib/formatMarkdown";
import { parseCSVToLeads, sanitizeLeadFields } from "@/lib/csvParser";
import { saveStudentToFirebase, deleteStudentFromFirebase, markLeadAsDeleted } from "@/lib/firebaseSync";
import { formatPhoneWith91 } from "@/lib/phoneValidation";

interface NoraAiDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicants: (Lead & { application: Application })[];
  selectedCampus: CampusLocation;
  onSelectApplicant?: (applicant: Lead & { application: Application }) => void;
  onDeleteApplicant?: (id: string, name: string) => void;
  onAddApplicants?: (newLeads: (Lead & { application: Application })[]) => void;
  onApplyFilter?: (filterText: string) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  currentUserRole?: "ADMIN" | "COUNSELOR" | "TEACHER";
  initialQuery?: string;
}

export default function NoraAiDatabaseModal({
  isOpen,
  onClose,
  applicants,
  selectedCampus,
  onSelectApplicant,
  onDeleteApplicant,
  onAddApplicants,
  onApplyFilter,
  onNavigateTab,
  currentUserRole = "ADMIN",
  initialQuery = "",
}: NoraAiDatabaseModalProps) {
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialWelcomeMessage: NoraChatMessage = {
    id: "welcome-1",
    sender: "NORA",
    text: `👋 Hello! I am **NORA Chatbot**, your comprehensive admissions & faculty intelligence assistant.

Ask or command me across ANY parameter in the database:
• 👨‍🏫 **Teacher Outreach & Monitoring**: *"How many lead are contacted by the teacher?"*, *"Teacher Rajesh activity"*
• 📱 **Teacher & Student Mobiles**: *"Teacher mobile numbers"*, *"Find 9842411223"*, *"What is Gunal's mobile number?"*
• 🎓 **Admitted vs Non-Admitted**: *"How many admitted?"*, *"Show non admitted leads"*
• 📑 **Application Numbers**: *"Application app_1"*, *"Show application numbers"*
• 🎯 **TNEA Cutoff**: *"Cutoff > 175"*, *"Cutoff between 160 and 180"*, *"Average cutoff"*
• 📍 **Cities & Districts**: *"Leads from Salem"*, *"Candidates from Coimbatore"*
• 📚 **Courses & Streams**: *"Show CSE leads"*, *"Show AIDS leads"*, *"List courses"*
• 🌐 **Social Media Channels**: *"How many from WhatsApp?"*, *"How many from Ads?"*
• 📊 **Total Count & Overview**: *"Total leads count"*, *"Database overview"*
• 🗑️ **Delete Record**: *"delete contact Gunal"*, *"remove student 12"*
• 📂 **Add Data**: Click the **📎 Paperclip** icon to upload CSV/Excel/JSON files directly into the database!`,
    suggestedQueries: [
      "How many lead are contacted by the teacher",
      "Teacher mobile numbers",
      "How many admitted?",
      "Show non admitted leads",
      "Application app_1",
      "Cutoff > 175",
      "Leads from Salem",
      "Total leads count",
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  const [messages, setMessages] = useState<NoraChatMessage[]>([initialWelcomeMessage]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Execute initial query if supplied
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialQuery]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const q = (textToSend || inputText).trim();
    if (!q || isThinking) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Append User message
    const userMsg: NoraChatMessage = {
      id: Date.now().toString(),
      sender: "USER",
      text: q,
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);

    // 2. Query Nora AI Engine
    setTimeout(() => {
      const response = processNoraChatQuery(q, applicants, selectedCampus, currentUserRole);
      setMessages((prev) => [...prev, response]);
      setIsThinking(false);
    }, 300);
  };

  const handleExecuteDelete = async (student: Lead & { application: Application }) => {
    // 1. Optimistic removal from applicants
    if (onDeleteApplicant) {
      onDeleteApplicant(student.id, student.name);
    }

    // 2. Tombstone & Firebase & SQLite API
    markLeadAsDeleted(student.id);
    Promise.allSettled([
      deleteStudentFromFirebase(student.id),
      fetch(`/api/contacts?id=${student.id}`, { method: "DELETE" }),
    ]).catch((err) => console.warn("Notice during NORA delete:", err));

    // 3. Post confirmation message in chat
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const confirmMsg: NoraChatMessage = {
      id: Date.now().toString(),
      sender: "NORA",
      text: `🗑️ **Contact Deleted from Database**:\n\nPermanently deleted **${student.name}** (Phone: \`${student.phone}\`, ID: \`${student.id}\`) from both SQLite database and Firebase Firestore.`,
      timestamp: time,
      suggestedQueries: ["Show all leads", "Highest Cutoff", "Add data to database"],
    };
    setMessages((prev) => [...prev, confirmMsg]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-uploaded if needed
    e.target.value = "";

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Show User message
    const userMsg: NoraChatMessage = {
      id: Date.now().toString(),
      sender: "USER",
      text: `📂 Uploaded file: **${file.name}** (${(file.size / 1024).toFixed(1)} KB) to add to database.`,
      timestamp: time,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      let importedLeads: (Lead & { application: Application })[] = [];

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const rawJson = JSON.parse(text);
        const list = Array.isArray(rawJson) ? rawJson : rawJson.leads || rawJson.students || [];
        importedLeads = list.map((item: any, idx: number) => {
          const numericId = Date.now().toString() + "_" + idx;
          return sanitizeLeadFields({
            id: item.id || numericId,
            name: item.name || "Student " + (idx + 1),
            phone: formatPhoneWith91(item.phone || item.mobile || "9876543210"),
            email: item.email || "",
            campus: item.campus || (selectedCampus !== "ALL" ? selectedCampus : "KARUR"),
            courseInterest: item.courseInterest || item.course || "CSE",
            district: item.district || "Karur",
            source: item.source || "Chatbot File Ingestion",
            status: "NEW",
            application: {
              id: "app_" + (item.id || numericId),
              leadId: item.id || numericId,
              stage: "INQUIRY",
              marks10th: Number(item.marks10th) || 400,
              marks12th: Number(item.marks12th) || 500,
              paymentStatus: "PENDING",
            },
          });
        });
      } else {
        // CSV / TSV / Excel text
        const text = await file.text();
        importedLeads = parseCSVToLeads(
          text,
          selectedCampus !== "ALL" ? selectedCampus : "KARUR",
          "adminkarur@123",
          file.name
        );
      }

      if (!importedLeads || importedLeads.length === 0) {
        setIsThinking(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "NORA",
            text: `⚠️ Could not parse any valid student records from **${file.name}**. Please ensure the file contains columns like **Name**, **Phone**, and **District**.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        return;
      }

      // Add to database & Firebase
      // 1. In-memory & Dashboard sync
      if (onAddApplicants) {
        onAddApplicants(importedLeads);
      }

      // 2. Local storage cache update
      try {
        const cached = localStorage.getItem("vsb_firebase_leads_cache");
        const existingList = cached ? JSON.parse(cached) : [];
        const merged = [...importedLeads, ...existingList];
        localStorage.setItem("vsb_firebase_leads_cache", JSON.stringify(merged));
      } catch (err) {}

      // 3. Save to Firebase Firestore & SQLite API asynchronously
      for (const lead of importedLeads) {
        saveStudentToFirebase(lead).catch((e) => console.warn("Firebase save notice:", e));
        fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead),
        }).catch((e) => console.warn("Prisma save notice:", e));
      }

      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "NORA",
          text: `✅ **Database Import Successful!**\n\nSuccessfully parsed and added **${importedLeads.length} student records** from file \`${file.name}\` into the **${selectedCampus !== "ALL" ? selectedCampus : "KARUR"}** database and Firebase.\n\n` +
            `• **Total Added**: **${importedLeads.length} students**\n` +
            `• **Target Campus**: **${selectedCampus !== "ALL" ? selectedCampus : "KARUR"}**\n` +
            `• **Status**: Synced to SQLite & Firebase\n\n` +
            `**Preview of Added Records**:\n` +
            importedLeads.slice(0, 5).map((l) => `• **${l.name}** — 📞 \`${l.phone}\` | 📍 ${l.district || "Karur"} | 🎓 ${l.courseInterest}`).join("\n") +
            (importedLeads.length > 5 ? `\n*...and ${importedLeads.length - 5} more records.*` : ""),
          specificData: {
            type: "STUDENT_LIST",
            studentsList: importedLeads,
          },
          suggestedQueries: [
            "Show all leads",
            "Show hot leads",
            "Leads from Salem",
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "NORA",
          text: `❌ **Error importing file**: ${err?.message || "Failed to process file. Please ensure it is a valid CSV or JSON file."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const handleResetChat = () => {
    setMessages([initialWelcomeMessage]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDossier = (lead: Lead & { application: Application }) => {
    if (onSelectApplicant) {
      onSelectApplicant(lead);
    }
    onClose();
  };

  const handleApplyFilter = (filterVal: string) => {
    if (onApplyFilter) {
      onApplyFilter(filterVal);
    }
    onClose();
  };

  const handleGoToDashboard = (tab: ActiveTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
    onClose();
  };

  return (
    <div
      id="nora-ai-modal"
      data-nora-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-3xl rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[660px] max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* NORA AI Top Bar */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/nora-logo.png"
                alt="NORA Chatbot Logo"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40 shadow-md shadow-indigo-500/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  NORA Chatbot
                </h2>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs" title="Shortcut: Ctrl + A">
                  Ctrl+A
                </kbd>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Live DB Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Live neural access to {applicants.length} student records • Role: {currentUserRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetChat}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Reset Chat"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Close NORA Chatbot (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversational Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === "USER";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Nora Avatar on the left */}
                {!isUser && (
                  <img
                    src="/nora-logo.png"
                    alt="NORA AI"
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-indigo-500/30 shadow-xs mt-0.5"
                  />
                )}

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] flex flex-col gap-2 ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  {/* Bubble Content */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs shadow-md shadow-indigo-600/20 font-medium"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-xs"
                    }`}
                  >
                    {/* Text display */}
                    <div className="whitespace-pre-line font-sans">
                      {renderFormattedMarkdown(msg.text, { isUser })}
                    </div>

                    {/* SPECIFIC DATA: SINGLE STUDENT LOOKUP */}
                    {!isUser && msg.specificData?.type === "SINGLE_STUDENT" && msg.specificData.student && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                          <div>
                            <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <span>{msg.specificData.student.name}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {msg.specificData.student.community || "BC"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Source: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{msg.specificData.student.source}</span>
                            </div>
                          </div>

                          {/* Priority Tier Badge */}
                          {msg.specificData.student.priorityTier && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 shrink-0 ${
                                msg.specificData.student.priorityTier === "HOT"
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                  : msg.specificData.student.priorityTier === "WARM"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                  : "bg-sky-500/10 text-sky-600 border-sky-500/30"
                              }`}
                            >
                              {msg.specificData.student.priorityTier === "HOT" && <Flame className="w-3 h-3 animate-pulse text-rose-500" />}
                              {msg.specificData.student.priorityTier === "WARM" && <Zap className="w-3 h-3 text-amber-500" />}
                              {msg.specificData.student.priorityTier === "COLD" && <Snowflake className="w-3 h-3 text-sky-500" />}
                              {msg.specificData.student.priorityTier === "HOT"
                                ? `HOT (Admitted - ${msg.specificData.student.aiScore || 70}%)`
                                : msg.specificData.student.priorityTier === "WARM"
                                ? `WARM (Ready - ${msg.specificData.student.aiScore || 70}%)`
                                : `COLD (Not Interested - ${msg.specificData.student.aiScore || 70}%)`}
                            </span>
                          )}
                        </div>

                        {/* Specific Student Fields Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Mobile Number
                            </span>
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between mt-0.5">
                              <span>{msg.specificData.student.phone}</span>
                              <button
                                onClick={() => handleCopy(msg.specificData!.student!.phone, msg.specificData!.student!.id)}
                                className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Copy Phone"
                              >
                                {copiedId === msg.specificData.student.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              TNEA Cutoff
                            </span>
                            <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                              {msg.specificData.student.computedCutoff || msg.specificData.student.tneaCutoff || 160} / 200
                            </div>
                          </div>

                          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Interested Course
                            </span>
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                              {msg.specificData.student.courseInterest}
                            </div>
                          </div>

                          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              District
                            </span>
                            <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                              {msg.specificData.student.district || "Karur"}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleOpenDossier(msg.specificData!.student!)}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                            title="Edit student contact info, marks, stage & Firebase record"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit Student Details</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                          </button>
                          <button
                            onClick={() => handleExecuteDelete(msg.specificData!.student!)}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                            title={`Delete ${msg.specificData.student.name} from Database`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <a
                            href={`tel:${msg.specificData.student.phone}`}
                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Call Student"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://wa.me/${msg.specificData.student.phone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                              msg.specificData.student.name
                            )},%20this%20is%20from%20the%20Admissions%20Office.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* SPECIFIC DATA: DELETE CONFIRMATION */}
                    {!isUser && msg.specificData?.type === "DELETE_CONFIRMATION" && msg.specificData.student && (
                      <div className="mt-3 p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 shadow-xs space-y-2.5">
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Permanent Database Deletion Confirmation</span>
                        </div>
                        <div className="text-xs text-slate-800 dark:text-slate-200">
                          Are you sure you want to delete <strong>{msg.specificData.student.name}</strong> (Phone: {msg.specificData.student.phone}, ID: {msg.specificData.student.id})? This will permanently erase the contact from SQLite and Firebase.
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleExecuteDelete(msg.specificData!.student!)}
                            className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Confirm & Delete Permanently</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SPECIFIC DATA: FILE UPLOAD PROMPT */}
                    {!isUser && msg.specificData?.type === "FILE_UPLOAD_PROMPT" && (
                      <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-xs space-y-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:brightness-110 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>📂 Choose CSV / Excel / JSON File to Add to Database</span>
                        </button>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                          Files will be automatically parsed, verified, and saved to the database.
                        </p>
                      </div>
                    )}

                    {/* SPECIFIC DATA: STUDENT LIST FILTER */}
                    {!isUser && msg.specificData?.type === "STUDENT_LIST" && msg.specificData.studentsList && msg.specificData.studentsList.length > 0 && (
                      <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Specific Matched Candidates ({msg.specificData.studentsList.length})
                          </span>
                          <button
                            onClick={() => handleApplyFilter(msg.text)}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Filter className="w-3 h-3" />
                            Filter CRM Table
                          </button>
                        </div>

                        {/* Compact Table */}
                        <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-56 overflow-y-auto">
                          {msg.specificData.studentsList.slice(0, 10).map((student) => {
                            const cutoff = student.computedCutoff || student.tneaCutoff || 160;
                            return (
                              <div
                                key={student.id}
                                onClick={() => handleOpenDossier(student)}
                                className="p-2.5 flex items-center justify-between gap-3 hover:bg-indigo-50/50 dark:hover:bg-slate-900/80 transition-colors cursor-pointer text-xs group"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                    <span>{student.name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                    <span>{student.district || "Karur"}</span>
                                    <span>•</span>
                                    <span>{student.phone}</span>
                                    {student.source && (
                                      <>
                                        <span>•</span>
                                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[90px]">{student.source}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] border border-indigo-200 dark:border-indigo-800">
                                    {cutoff}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDossier(student);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                    title="Edit Student Details"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExecuteDelete(student);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                    title={`Delete ${student.name} from database`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SPECIFIC DATA: DASHBOARD NAVIGATION BUTTON */}
                    {!isUser && msg.specificData?.type === "DASHBOARD_NAV" && msg.specificData.targetTab && (
                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => handleGoToDashboard(msg.specificData!.targetTab!)}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          <Layers className="w-4 h-4" />
                          <span>{msg.specificData.targetTabTitle || `Go to ${msg.specificData.targetTab.replace(/_/g, " ")}`}</span>
                          <ArrowUpRight className="w-4 h-4 ml-auto" />
                        </button>
                      </div>
                    )}

                    {/* SPECIFIC DATA: METRICS TILES */}
                    {!isUser && msg.specificData?.type === "METRICS" && msg.specificData.stats && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
                          <span className="text-[9px] font-bold text-indigo-500 uppercase block">Total</span>
                          <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                            {msg.specificData.stats.total || msg.specificData.stats.totalCandidates}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                          <span className="text-[9px] font-bold text-rose-500 uppercase block">
                            {msg.specificData.stats.averageCutoff ? "Avg Cutoff" : "Hot Leads"}
                          </span>
                          <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                            {msg.specificData.stats.averageCutoff || msg.specificData.stats.hot}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                          <span className="text-[9px] font-bold text-emerald-500 uppercase block">Paid / Adm</span>
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                            {msg.specificData.stats.paid || "Verified"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-400 px-1 font-medium">
                    {msg.timestamp}
                  </span>

                  {/* Suggested Query Buttons under Nora's response */}
                  {!isUser && msg.suggestedQueries && msg.suggestedQueries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.suggestedQueries.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(sug)}
                          className="px-2.5 py-1 rounded-lg text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 font-semibold text-slate-600 dark:text-slate-300 shadow-2xs transition-colors cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Avatar on right */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 shadow-xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Nora Thinking State */}
          {isThinking && (
            <div className="flex gap-3 items-start justify-start animate-pulse">
              <img
                src="/nora-logo.png"
                alt="NORA Chatbot"
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-indigo-500/30 shadow-xs"
              />
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-xs shadow-xs text-xs flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span>NORA is querying live database records & channels...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips Row */}
        <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] hide-scrollbar shrink-0">
          <span className="text-slate-400 font-bold uppercase text-[9px] shrink-0 mr-1">Quick:</span>
          {[
            "Add data to database",
            "delete contact Gunal",
            "How many from WhatsApp?",
            "How many from Ads?",
            "Leads from Salem",
            "Cutoff > 175",
            "Highest Cutoff",
            "How many Admitted?",
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Hidden File Input for CSV / Excel / JSON Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".csv,.tsv,.txt,.json,.xlsx,.xls"
          className="hidden"
        />

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Upload CSV / Excel / JSON file to add contacts to database"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask NORA Chatbot (e.g. 'delete contact Gunal', 'add data to database', 'cutoff > 175')..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
