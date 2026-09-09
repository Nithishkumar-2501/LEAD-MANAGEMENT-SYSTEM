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
} from "lucide-react";
import { Lead, Application, CampusLocation, ActiveTab } from "@/types/crm";
import { processNoraChatQuery, NoraChatMessage } from "@/lib/ai/noraDatabaseAgent";

interface NoraAiDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicants: (Lead & { application: Application })[];
  selectedCampus: CampusLocation;
  onSelectApplicant?: (applicant: Lead & { application: Application }) => void;
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
  onApplyFilter,
  onNavigateTab,
  currentUserRole = "ADMIN",
  initialQuery = "",
}: NoraAiDatabaseModalProps) {
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialWelcomeMessage: NoraChatMessage = {
    id: "welcome-1",
    sender: "NORA",
    text: `👋 Hello! I am **NORA AI**, your specialized admissions neural database assistant.\n\nAsk me anything across the student database and CRM modules:\n• 📞 **Mobile Numbers** (*"Find 9551082291"*, *"Who has phone 9894283561?"*)\n• 📍 **Districts & Names** (*"Leads from Salem"*, *"What is Gunal's cutoff?"*)\n• 🌐 **Channels & Ads** (*"How many from WhatsApp?"*, *"How many from Ads?"*, *"Facebook leads"*, *"Project Expo"*)\n• 🎯 **Cutoffs & Statuses** (*"Cutoff > 175"*, *"Highest cutoff"*, *"How many admitted?"*)\n• 🛡️ **Dashboards & Guides** (*"Explain Echo Dashboard"*, *"Admin Dashboard overview"*)\n\nI will query the database in real time and display **only the specific data** you need.`,
    suggestedQueries: [
      "How many from WhatsApp?",
      "How many from Ads?",
      "How many from Project Expo?",
      "Leads from Salem",
      "Cutoff > 175",
      "How many admitted?",
      "What is Echo Dashboard?",
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
  }, [isOpen, initialQuery]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-3xl rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[660px] max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* NORA AI Top Bar */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  NORA AI Database Assistant
                </h2>
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
              title="Close Nora AI"
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/20 mt-0.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
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
                      {msg.text}
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
                              {msg.specificData.student.priorityTier === "HOT" && <Flame className="w-3 h-3" />}
                              {msg.specificData.student.priorityTier === "WARM" && <Zap className="w-3 h-3" />}
                              {msg.specificData.student.priorityTier === "COLD" && <Snowflake className="w-3 h-3" />}
                              {msg.specificData.student.priorityTier} ({msg.specificData.student.aiScore || 70}%)
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

                    {/* SPECIFIC DATA: STUDENT LIST FILTER */}
                    {!isUser && msg.specificData?.type === "STUDENT_LIST" && msg.specificData.studentsList && (
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

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] border border-indigo-200 dark:border-indigo-800">
                                    {cutoff}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDossier(student);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                    title="Edit Student Details"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0">
                <Brain className="w-4 h-4" />
              </div>
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
            "How many from WhatsApp?",
            "How many from Ads?",
            "How many from Facebook?",
            "How many from Project Expo?",
            "Leads from Salem",
            "Cutoff > 175",
            "Highest Cutoff",
            "How many Admitted?",
            "Explain Echo Dashboard",
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

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Nora: mobile number, district, ads, whatsapp, facebook, X, cutoff, admitted..."
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
