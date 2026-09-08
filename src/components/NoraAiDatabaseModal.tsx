"use client";

import { useState, useMemo } from "react";
import {
  X,
  Sparkles,
  Send,
  Search,
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
  ExternalLink,
  Award,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Lead, Application, CampusLocation } from "@/types/crm";
import { queryNoraDatabase, NoraQueryResult } from "@/lib/ai/noraDatabaseAgent";

interface NoraAiDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicants: (Lead & { application: Application })[];
  selectedCampus: CampusLocation;
  onSelectApplicant?: (applicant: Lead & { application: Application }) => void;
  onApplyFilter?: (filterText: string) => void;
  initialQuery?: string;
}

export default function NoraAiDatabaseModal({
  isOpen,
  onClose,
  applicants,
  selectedCampus,
  onSelectApplicant,
  onApplyFilter,
  initialQuery = "",
}: NoraAiDatabaseModalProps) {
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery || "Who are the hot leads?");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Compute Nora's analysis of the database
  const queryResult: NoraQueryResult = useMemo(() => {
    return queryNoraDatabase(activeQuery, applicants, selectedCampus);
  }, [activeQuery, applicants, selectedCampus]);

  if (!isOpen) return null;

  const handleExecuteQuery = (textToRun?: string) => {
    const q = textToRun || searchInput;
    if (!q.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setActiveQuery(q);
      setIsAnalyzing(false);
    }, 300);
  };

  const handleOpenLead = (lead: Lead & { application: Application }) => {
    if (onSelectApplicant) {
      onSelectApplicant(lead);
    }
    onClose();
  };

  const handleFilterCRM = (filterVal: string) => {
    if (onApplyFilter) {
      onApplyFilter(filterVal);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header with Nora AI Gradient */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 text-white border-b border-indigo-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  NORA AI Database Search & Analytics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live DB Active
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Analyzes {applicants.length} candidate records, cutoffs, and counseling allocations in real-time.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            title="Close Nora AI"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExecuteQuery()}
                placeholder="Ask Nora: 'How many leads from Salem?', 'Cutoff > 175', 'Hot leads', 'Find Wilsonrani'..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>
            <button
              onClick={() => handleExecuteQuery()}
              disabled={isAnalyzing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Analyze</span>
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] hide-scrollbar py-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0 mr-1">Quick:</span>
            {[
              "Leads from Salem",
              "Show Hot leads",
              "Cutoff > 175",
              "Untouched Inquiries",
              "Fee Paid Students",
              "CSE Inquiries",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setSearchInput(prompt);
                  handleExecuteQuery(prompt);
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 shrink-0 transition-colors shadow-2xs cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Nora's Analysis and Matched Records */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-100/60 dark:bg-slate-950/40">
          {/* Nora Analysis Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  NORA Intelligence Synthesis
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                Matches Found: {queryResult.totalMatches}
              </span>
            </div>

            {/* Answer Text */}
            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
              {queryResult.answerText}
            </div>

            {/* If there's a filter action available */}
            {queryResult.matchedLeads.length > 0 && (
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500">
                  Showing {Math.min(10, queryResult.matchedLeads.length)} of {queryResult.totalMatches} records
                </span>
                <button
                  onClick={() => handleFilterCRM(searchInput || activeQuery)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter CRM Table with this query
                </button>
              </div>
            )}
          </div>

          {/* Matched Leads Grid/Table */}
          {queryResult.matchedLeads.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-500" />
                  Database Candidate Results
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {queryResult.matchedLeads.slice(0, 8).map((lead) => {
                  const tier = lead.priorityTier || "WARM";
                  const cutoff = lead.computedCutoff || lead.tneaCutoff || 160;

                  return (
                    <div
                      key={lead.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {lead.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {lead.phone}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {lead.district || "Karur"}
                              </span>
                            </div>
                          </div>

                          {/* Priority Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 shrink-0 ${
                              tier === "HOT"
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                : tier === "WARM"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : "bg-sky-500/10 text-sky-600 border-sky-500/30"
                            }`}
                          >
                            {tier === "HOT" && <Flame className="w-2.5 h-2.5" />}
                            {tier === "WARM" && <Zap className="w-2.5 h-2.5" />}
                            {tier === "COLD" && <Snowflake className="w-2.5 h-2.5" />}
                            {tier} ({lead.aiScore || 75}%)
                          </span>
                        </div>

                        {/* Program & Cutoff */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                            {lead.courseInterest}
                          </span>
                          <span className="font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shrink-0">
                            Cutoff: {cutoff}/200
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleOpenLead(lead)}
                        className="w-full py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Open Dossier & History</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
