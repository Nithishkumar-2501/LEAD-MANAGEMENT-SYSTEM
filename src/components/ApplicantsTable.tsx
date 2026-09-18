"use client";

import { useState } from "react";
import { Lead, Application, AppStage } from "@/types/crm";
import { Eye, Phone, Mail, MessageSquare, ChevronRight, UserCheck, Plus, Upload, Trash2, Flame, Zap, Snowflake, Send } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import SpecularButton from "@/components/SpecularButton";
import { parseCSVToLeads } from "@/lib/csvParser";
import { getStudentLeadState } from "@/lib/studentLeadState";

import InPortalCommunicationModals, { ContactTarget } from "@/components/InPortalCommunicationModals";
import { redirectToDialPad, getCleanTelUri } from "@/lib/callDialer";
import { redirectToWhatsApp, getDefaultAdmissionWhatsAppText } from "@/lib/whatsappSender";
import { redirectToSms, getDefaultAdmissionSmsText } from "@/lib/smsSender";

interface ApplicantsTableProps {
  applicants: (Lead & { application: Application })[];
  searchQuery: string;
  onSelectApplicant: (applicant: Lead & { application: Application }) => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP" | "SMS", name: string) => void;
  onOpenCreateModal: () => void;
  onOpenQuickLeadModal?: () => void;
  onImportLeads?: (importedLeads: (Lead & { application: Application })[]) => void;
  onDeleteApplicant?: (id: string, name: string) => void;
}

export default function ApplicantsTable({
  applicants,
  searchQuery,
  onSelectApplicant,
  onActionTrigger,
  onOpenCreateModal,
  onOpenQuickLeadModal,
  onImportLeads,
  onDeleteApplicant,
}: ApplicantsTableProps) {
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // In-Portal Communication Modal State
  const [activeCommModal, setActiveCommModal] = useState<"CALL" | "MESSAGE" | "EMAIL" | null>(null);
  const [activeCommContact, setActiveCommContact] = useState<ContactTarget | null>(null);

  const handleOpenCommModal = (type: "CALL" | "MESSAGE" | "EMAIL", target: ContactTarget) => {
    setActiveCommContact(target);
    setActiveCommModal(type);
  };

  const handleCommLogSuccess = (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => {
    const triggerType = type === "MESSAGE" ? (details.toLowerCase().includes("sms") ? "SMS" : "WHATSAPP") : type;
    onActionTrigger(triggerType, activeCommContact?.name || "Candidate");
  };

  const filteredApplicants = applicants.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courseInterest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase());

    const stateInfo = getStudentLeadState(item);
    const matchesStage = (() => {
      if (selectedStage === "ALL") return true;
      if (selectedStage === "HOT") return stateInfo.state === "HOT";
      if (selectedStage === "WARM") return stateInfo.state === "WARM";
      if (selectedStage === "COLD") return stateInfo.state === "COLD";
      return item.application.stage === selectedStage;
    })();

    return matchesSearch && matchesStage;
  });

  // Table Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const appStartIndex = (safeCurrentPage - 1) * rowsPerPage;
  const appEndIndex = Math.min(filteredApplicants.length, appStartIndex + rowsPerPage);
  const paginatedApplicants = filteredApplicants.slice(appStartIndex, appEndIndex);

  const getStageBadge = (stage: AppStage) => {
    switch (stage) {
      case "INQUIRY":
        return "bg-sky-500/20 text-sky-300 border-sky-400/40";
      case "SUBMITTED":
        return "bg-purple-500/20 text-purple-300 border-purple-400/40";
      case "DOCS_VERIFIED":
        return "bg-amber-500/20 text-amber-300 border-amber-400/40";
      case "OFFER_ISSUED":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-400/40";
      case "FEE_PAID":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-400/40";
      default:
        return "bg-slate-900 text-slate-400 border-slate-700";
    }
  };

  const stagesList = ["ALL", "HOT", "WARM", "COLD", "INQUIRY", "SUBMITTED", "DOCS_VERIFIED", "OFFER_ISSUED", "FEE_PAID"];

  return (
    <div className="bubble-card p-3 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-1 flex flex-col justify-between w-full max-w-full min-w-0 overflow-hidden shadow-xs">
      <div className="w-full max-w-full min-w-0">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Recent Applicants
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">TNEA & Management intake candidates at V.S.B.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenQuickLeadModal && (
              <button
                onClick={onOpenQuickLeadModal}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Add Quick Lead</span>
              </button>
            )}

            <button
              onClick={onOpenCreateModal}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-white shrink-0" />
              <span>New Application</span>
            </button>

            <input
              type="file"
              id="csv-dashboard-upload"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                  const text = evt.target?.result as string;
                  if (!text) return;
                  const imported = parseCSVToLeads(text);
                  if (imported.length > 0 && onImportLeads) {
                    onImportLeads(imported);
                  }
                };
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => document.getElementById("csv-dashboard-upload")?.click()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>Import CSV</span>
            </button>

            {/* Stage Control Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs font-medium overflow-x-auto hide-scrollbar max-w-full">
              {stagesList.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStage(st)}
                  className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap shrink-0 text-xs ${
                    selectedStage === st
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto w-full max-w-full rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[580px] sm:min-w-full text-left text-xs text-slate-800 dark:text-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3.5">Applicant Name</th>
                <th className="py-2.5 px-3.5">Applied Program</th>
                <th className="py-2.5 px-3.5 hidden sm:table-cell">Campus</th>
                <th className="py-2.5 px-3.5">State & Stage</th>
                <th className="py-2.5 px-3.5 hidden md:table-cell">TNEA Cutoff & Counselling</th>
                <th className="py-2.5 px-3.5 hidden sm:table-cell">12th Marks</th>
                <th className="py-2.5 px-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedApplicants.length > 0 ? (
                paginatedApplicants.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectApplicant(item)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Applicant Info */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {item.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xs">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Applied Program */}
                    <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      {item.courseInterest}
                    </td>

                    {/* Campus Badge */}
                    <td className="py-3 px-3.5 hidden sm:table-cell">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider inline-block ${
                          item.campus === "KARUR"
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50"
                            : "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50"
                        }`}
                      >
                        {item.campus || "KARUR"} Campus
                      </span>
                    </td>

                    {/* State & Stage Status */}
                    <td className="py-3.5 px-4">
                      {(() => {
                        const stateInfo = getStudentLeadState(item);
                        return (
                          <div className="flex flex-col gap-1 items-start">
                            {stateInfo.state === "HOT" && (
                              <span className="badge-status-hot px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 shadow-sm">
                                <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
                                <span>HOT (Admitted)</span>
                              </span>
                            )}
                            {stateInfo.state === "WARM" && (
                              <span className="badge-status-warm px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 shadow-sm">
                                <Zap className="w-3 h-3 text-amber-500" />
                                <span>WARM (Ready)</span>
                              </span>
                            )}
                            {stateInfo.state === "COLD" && (
                              <span className="badge-status-cold px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 shadow-sm">
                                <Snowflake className="w-3 h-3 text-sky-500" />
                                <span>COLD (Not Interested)</span>
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border inline-flex items-center gap-1 ${getStageBadge(
                                item.application.stage
                              )}`}
                            >
                              {item.application.stage.replace("_", " ")}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* TNEA Cutoff & Counselling Cell */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {item.tneaCutoff && (
                          <div className="font-extrabold text-sky-300 font-mono text-[11px]">
                            Cutoff: {item.tneaCutoff} / 200
                          </div>
                        )}
                        {item.counsellingAppNo && (
                          <span className="inline-block text-[9.5px] font-extrabold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                            ✅ TNEA ({item.counsellingAppNo})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Marks */}
                    <td className="py-3.5 px-4 font-extrabold text-slate-100 dark:text-slate-100 hidden sm:table-cell text-sm">
                      {item.application?.marks12th ? `${item.application.marks12th}%` : ""}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">

                        <Tooltip text={`View ${item.name} Details`}>
                          <button
                            onClick={() => onSelectApplicant(item)}
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-sky-500 hover:text-white text-slate-300 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-sky-500/40"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip text={`Call ${item.name} via Phone Dial Pad`}>
                          <a
                            href={getCleanTelUri(item.phone)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onActionTrigger("CALL", item.name);
                              redirectToDialPad(item.phone);
                            }}
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-emerald-500 hover:text-white text-emerald-400 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-emerald-500/40 cursor-pointer inline-flex items-center justify-center"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </Tooltip>
                        <Tooltip text={`In-Portal Email ${item.name}`}>
                          <button
                            onClick={() => handleOpenCommModal("EMAIL", {
                              id: item.id,
                              name: item.name,
                              phone: item.phone,
                              email: item.email,
                              courseInterest: item.courseInterest,
                              campus: item.campus,
                              school: item.school || undefined,
                              district: item.district || undefined,
                              state: item.state || undefined,
                              tneaCutoff: item.tneaCutoff,
                              counsellingAppNo: item.counsellingAppNo,
                              marks10th: item.application?.marks10th,
                              marks12th: item.application?.marks12th,
                              stage: item.application?.stage,
                              status: item.status,
                            })}
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-indigo-500 hover:text-white text-slate-300 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-indigo-500/40"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip text={`WhatsApp Chat with ${item.name}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onActionTrigger("WHATSAPP", item.name);
                              redirectToWhatsApp(item.phone, getDefaultAdmissionWhatsAppText(item));
                            }}
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-emerald-500 hover:text-white text-emerald-400 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-emerald-500/40 cursor-pointer inline-flex items-center justify-center"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>

                        <Tooltip text={`Native SMS to ${item.name}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onActionTrigger("SMS", item.name);
                              redirectToSms(item.phone, getDefaultAdmissionSmsText(item));
                            }}
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-indigo-500 hover:text-white text-indigo-400 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-indigo-500/40 cursor-pointer inline-flex items-center justify-center"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>

                        <Tooltip text={`Delete ${item.name}`}>
                          <button
                            onClick={() => {
                              if (onDeleteApplicant) {
                                onDeleteApplicant(item.id, item.name);
                              } else if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                fetch(`/api/contacts?id=${item.id}`, { method: "DELETE" });
                              }
                            }}
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-rose-600 hover:text-white text-rose-400 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-rose-600/40 cursor-pointer"
                            title={`Delete ${item.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching applicants found for &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Pagination Footer Bar */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300 font-sans">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-slate-200">
            Showing {filteredApplicants.length > 0 ? appStartIndex + 1 : 0} - {appEndIndex} of {filteredApplicants.length} Applicants
          </span>
        </div>

        {/* Page Control Pills */}
        <div className="flex items-center gap-1.5">
          <button
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-400 dark:border-white/30 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-black text-slate-950 dark:text-white cursor-pointer shadow-sm text-xs"
            title="First Page"
          >
            ⏮ First
          </button>
          <button
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="px-2.5 py-1.5 rounded-lg border border-slate-400 dark:border-white/30 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-black text-slate-950 dark:text-white cursor-pointer shadow-sm text-xs"
          >
            ◀ Prev
          </button>

          <div className="flex items-center gap-1">
            {(() => {
              const maxVisible = 5;
              let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
              let end = start + maxVisible - 1;
              if (end > totalPages) {
                end = totalPages;
                start = Math.max(1, end - maxVisible + 1);
              }
              const pages = [];
              for (let i = start; i <= end; i++) {
                pages.push(i);
              }
              return pages.map((pNum) => {
                const isActive = pNum === safeCurrentPage;
                return (
                  <button
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer shadow-sm ${
                      isActive
                        ? "bg-sky-500 text-slate-950 font-black ring-2 ring-sky-300 scale-105"
                        : "bg-slate-100 dark:bg-slate-800 border border-slate-400 dark:border-white/30 text-slate-950 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              });
            })()}
          </div>

          <button
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-2.5 py-1.5 rounded-lg border border-slate-400 dark:border-white/30 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-black text-slate-950 dark:text-white cursor-pointer shadow-sm text-xs"
          >
            Next ▶
          </button>
          <button
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-400 dark:border-white/30 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-black text-slate-950 dark:text-white cursor-pointer shadow-sm text-xs"
            title="Last Page"
          >
            Last ⏭
          </button>
        </div>

        {/* Rows Per Page */}
        <div className="flex items-center gap-2 font-bold text-slate-300">
          <span>Show Rows:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1 text-slate-100 font-extrabold focus:outline-none cursor-pointer"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      {/* IN-PORTAL DIRECT COMMUNICATION MODALS */}
      <InPortalCommunicationModals
        activeModal={activeCommModal}
        contact={activeCommContact}
        onClose={() => setActiveCommModal(null)}
        onLogSuccess={handleCommLogSuccess}
      />


    </div>
  );
}
