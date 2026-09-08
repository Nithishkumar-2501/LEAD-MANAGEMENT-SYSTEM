"use client";

import { useState } from "react";
import { Lead, Application, AppStage } from "@/types/crm";
import { Eye, Phone, Mail, MessageSquare, UserCheck, Plus, Upload, Trash2 } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import { parseCSVToLeads } from "@/lib/csvParser";

import InPortalCommunicationModals, { ContactTarget } from "@/components/InPortalCommunicationModals";
import { redirectToDialPad, getCleanTelUri } from "@/lib/callDialer";

interface ApplicantsTableProps {
  applicants: (Lead & { application: Application })[];
  searchQuery: string;
  onSelectApplicant: (applicant: Lead & { application: Application }) => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
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
    onActionTrigger(type === "MESSAGE" ? "WHATSAPP" : type, activeCommContact?.name || "Candidate");
  };

  const filteredApplicants = applicants.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courseInterest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = selectedStage === "ALL" || item.application.stage === selectedStage;

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
        return "bg-paper text-graphite border-fog";
      case "SUBMITTED":
        return "bg-paper text-graphite border-fog";
      case "DOCS_VERIFIED":
        return "bg-mist text-obsidian border-fog";
      case "OFFER_ISSUED":
        return "bg-mist text-obsidian border-steel";
      case "FEE_PAID":
        return "bg-ember text-white border-ember";
      default:
        return "bg-paper text-steel border-fog";
    }
  };

  const stagesList = ["ALL", "INQUIRY", "SUBMITTED", "DOCS_VERIFIED", "OFFER_ISSUED", "FEE_PAID"];

  return (
    <div className="bg-white rounded-[36px] p-5 sm:p-6 border border-fog flex-1 flex flex-col justify-between w-full max-w-full min-w-0 overflow-hidden">
      <div className="w-full max-w-full min-w-0">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-fog">
          <div>
            <h3 className="text-base font-semibold text-obsidian flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-ember" />
              Recent Applicants
            </h3>
            <p className="text-xs text-steel font-normal">TNEA & Management intake candidates at V.S.B.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenQuickLeadModal && (
              <button
                onClick={onOpenQuickLeadModal}
                className="px-3.5 py-2 rounded-button bg-ember hover:bg-orange-600 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Quick Lead</span>
              </button>
            )}

            <button
              onClick={onOpenCreateModal}
              className="px-3.5 py-2 rounded-button bg-obsidian hover:bg-black text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
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
              className="px-3.5 py-2 rounded-button bg-paper hover:bg-mist text-graphite border border-fog font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-steel shrink-0" />
              <span>Import CSV</span>
            </button>

            {/* Stage Control Pills */}
            <div className="flex items-center gap-1 bg-paper p-1 rounded-full border border-fog text-xs font-medium overflow-x-auto hide-scrollbar max-w-full">
              {stagesList.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStage(st)}
                  className={`px-3 py-1 rounded-full transition-all whitespace-nowrap shrink-0 text-xs ${
                    selectedStage === st
                      ? "bg-obsidian text-white font-medium shadow-sm"
                      : "text-steel hover:text-graphite"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto w-full max-w-full rounded-[20px] border border-fog">
          <table className="w-full min-w-[580px] sm:min-w-full text-left text-xs text-graphite">
            <thead className="bg-paper text-steel uppercase font-semibold text-[10px] tracking-wider border-b border-fog">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4 hidden sm:table-cell">Campus</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4 hidden md:table-cell">TNEA Cutoff</th>
                <th className="py-3 px-4 hidden sm:table-cell">12th Marks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {paginatedApplicants.length > 0 ? (
                paginatedApplicants.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectApplicant(item)}
                    className="hover:bg-paper/70 transition-all cursor-pointer group"
                  >
                    {/* Applicant Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-paper border border-fog text-obsidian font-semibold text-xs flex items-center justify-center shrink-0">
                          {item.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="font-semibold text-obsidian text-xs group-hover:text-ember transition-colors">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-steel">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Applied Program */}
                    <td className="py-3 px-4 font-normal text-graphite">
                      {item.courseInterest}
                    </td>

                    {/* Campus Badge */}
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-fog bg-paper text-graphite uppercase tracking-wider inline-block">
                        {item.campus || "KARUR"}
                      </span>
                    </td>

                    {/* Stage Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border inline-flex items-center gap-1.5 ${getStageBadge(
                          item.application.stage
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {item.application.stage.replace("_", " ")}
                      </span>
                    </td>

                    {/* TNEA Cutoff & Counselling Cell */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {item.tneaCutoff && (
                          <div className="font-semibold text-obsidian font-mono text-xs">
                            {item.tneaCutoff} / 200
                          </div>
                        )}
                        {item.counsellingAppNo && (
                          <span className="inline-block text-[10px] font-medium text-steel">
                            App: {item.counsellingAppNo}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Marks */}
                    <td className="py-3 px-4 font-semibold text-obsidian hidden sm:table-cell text-xs">
                      {item.application?.marks12th ? `${item.application.marks12th}%` : "—"}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip text={`View ${item.name} Details`}>
                          <button
                            onClick={() => onSelectApplicant(item)}
                            className="p-1.5 rounded-button bg-paper border border-fog text-steel hover:text-obsidian hover:border-steel hover:bg-white transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip text={`Call ${item.name}`}>
                          <a
                            href={getCleanTelUri(item.phone)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onActionTrigger("CALL", item.name);
                              redirectToDialPad(item.phone);
                            }}
                            className="p-1.5 rounded-button bg-paper border border-fog text-steel hover:text-ember hover:border-steel hover:bg-white transition-all inline-flex items-center justify-center cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </Tooltip>
                        <Tooltip text={`Email ${item.name}`}>
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
                            className="p-1.5 rounded-button bg-paper border border-fog text-steel hover:text-obsidian hover:border-steel hover:bg-white transition-all"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip text={`Message ${item.name}`}>
                          <button
                            onClick={() => handleOpenCommModal("MESSAGE", {
                              name: item.name,
                              phone: item.phone,
                              email: item.email,
                              courseInterest: item.courseInterest,
                              campus: item.campus,
                              school: item.school || undefined,
                              district: item.district || undefined,
                            })}
                            className="p-1.5 rounded-button bg-paper border border-fog text-steel hover:text-obsidian hover:border-steel hover:bg-white transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
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
                            className="p-1.5 rounded-button bg-paper border border-fog text-steel hover:text-red-600 hover:border-steel hover:bg-white transition-all cursor-pointer"
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
                  <td colSpan={7} className="py-8 text-center text-steel">
                    No matching applicants found for &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Pagination Footer Bar */}
      <div className="mt-4 pt-3 border-t border-fog flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-steel">
        <div className="flex items-center gap-3">
          <span className="font-normal text-graphite">
            Showing <strong className="font-semibold text-obsidian">{filteredApplicants.length > 0 ? appStartIndex + 1 : 0} - {appEndIndex}</strong> of <strong className="font-semibold text-obsidian">{filteredApplicants.length}</strong> Applicants
          </span>
        </div>

        {/* Page Control Pills */}
        <div className="flex items-center gap-1.5">
          <button
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="px-2.5 py-1 rounded-badge border border-fog bg-white hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed font-medium text-graphite cursor-pointer text-xs transition-all"
            title="First Page"
          >
            First
          </button>
          <button
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="px-2.5 py-1 rounded-badge border border-fog bg-white hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed font-medium text-graphite cursor-pointer text-xs transition-all"
          >
            Prev
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
                    className={`w-7 h-7 rounded-badge font-semibold text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-obsidian text-white border border-obsidian"
                        : "bg-white border border-fog text-graphite hover:bg-paper"
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
            className="px-2.5 py-1 rounded-badge border border-fog bg-white hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed font-medium text-graphite cursor-pointer text-xs transition-all"
          >
            Next
          </button>
          <button
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="px-2.5 py-1 rounded-badge border border-fog bg-white hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed font-medium text-graphite cursor-pointer text-xs transition-all"
            title="Last Page"
          >
            Last
          </button>
        </div>

        {/* Rows Per Page */}
        <div className="flex items-center gap-2 font-medium text-steel">
          <span>Show Rows:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-fog rounded-button px-2.5 py-1 text-obsidian font-medium focus:outline-none cursor-pointer text-xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
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
