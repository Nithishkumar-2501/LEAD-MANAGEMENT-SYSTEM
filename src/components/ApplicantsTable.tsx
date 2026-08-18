"use client";

import { useState } from "react";
import { Lead, Application, AppStage } from "@/types/crm";
import { Eye, Phone, Mail, MessageSquare, ChevronRight, UserCheck, Plus, QrCode } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import SpecularButton from "@/components/SpecularButton";
import LeadQRCodeModal from "@/components/LeadQRCodeModal";

import InPortalCommunicationModals, { ContactTarget } from "@/components/InPortalCommunicationModals";

interface ApplicantsTableProps {
  applicants: (Lead & { application: Application })[];
  searchQuery: string;
  onSelectApplicant: (applicant: Lead & { application: Application }) => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onOpenCreateModal: () => void;
  onOpenQuickLeadModal?: () => void;
}

export default function ApplicantsTable({
  applicants,
  searchQuery,
  onSelectApplicant,
  onActionTrigger,
  onOpenCreateModal,
  onOpenQuickLeadModal,
}: ApplicantsTableProps) {
  const [selectedStage, setSelectedStage] = useState<string>("ALL");

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQrLead, setSelectedQrLead] = useState<(Lead & { application?: Application | null }) | null>(null);

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

  const stagesList = ["ALL", "INQUIRY", "SUBMITTED", "DOCS_VERIFIED", "OFFER_ISSUED", "FEE_PAID"];

  return (
    <div className="bubble-card p-4 sm:p-6 border border-white/20 flex-1 flex flex-col justify-between">
      <div>
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-400" />
              Recent Applicants
            </h3>
            <p className="text-xs text-slate-400">TNEA & Management intake candidates at V.S.B.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenQuickLeadModal && (
              <SpecularButton
                size="sm"
                tint="#ec4899"
                tintOpacity={0.25}
                lineColor="#f472b6"
                baseColor="#db2777"
                intensity={1.5}
                followMouse
                onClick={onOpenQuickLeadModal}
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Quick Lead</span>
              </SpecularButton>
            )}

            <SpecularButton
              size="sm"
              tint="#38bdf8"
              tintOpacity={0.25}
              lineColor="#38bdf8"
              baseColor="#0284c7"
              intensity={1.5}
              followMouse
              onClick={onOpenCreateModal}
            >
              <Plus className="w-4 h-4" />
              <span>New Application</span>
            </SpecularButton>

            {/* Bubble Stage Control Pills */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-full border border-white/20 text-xs font-semibold backdrop-blur-md overflow-x-auto hide-scrollbar">
              {stagesList.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStage(st)}
                  className={`px-3 py-1 rounded-full transition-all duration-300 whitespace-nowrap shrink-0 transform hover:-translate-y-1 hover:scale-110 active:scale-95 ${
                    selectedStage === st
                      ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold shadow-md shadow-sky-500/40 scale-[1.05]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950/80 text-sky-300/80 uppercase font-bold text-[10px] tracking-wider border-y border-white/10">
              <tr>
                <th className="py-3 px-4">Applicant Name</th>
                <th className="py-3 px-4">Applied Program</th>
                <th className="py-3 px-4 hidden sm:table-cell">Campus</th>
                <th className="py-3 px-4">Stage Status</th>
                <th className="py-3 px-4 hidden md:table-cell">TNEA Cutoff & Counselling</th>
                <th className="py-3 px-4 hidden sm:table-cell">12th Marks</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectApplicant(item)}
                    className="hover:bg-slate-800/80 transition-all cursor-pointer group"
                  >
                    {/* Applicant Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                          {item.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-sky-300 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Applied Program */}
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {item.courseInterest}
                    </td>

                    {/* Campus Badge */}
                    <td className="py-3.5 px-4 hidden sm:table-cell">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider transform group-hover:scale-105 transition-transform inline-block ${
                          item.campus === "KARUR"
                            ? "bg-sky-500/20 text-sky-300 border-sky-400/30"
                            : "bg-pink-500/20 text-pink-300 border-pink-400/30"
                        }`}
                      >
                        {item.campus || "KARUR"} Campus
                      </span>
                    </td>

                    {/* Stage Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 shadow-sm transform group-hover:scale-105 transition-transform ${getStageBadge(
                          item.application.stage
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {item.application.stage.replace("_", " ")}
                      </span>
                    </td>

                    {/* TNEA Cutoff & Counselling Cell */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-sky-300 font-mono text-[11px]">
                          Cutoff: {item.tneaCutoff || 188.5} / 200
                        </div>
                        {item.appliedCounselling !== false ? (
                          <span className="inline-block text-[9.5px] font-extrabold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                            ✅ TNEA ({item.counsellingAppNo || "TNEA2026-61201"})
                          </span>
                        ) : (
                          <span className="inline-block text-[9.5px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded-md border border-amber-800">
                            ⏳ Management Quota
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Marks */}
                    <td className="py-3.5 px-4 font-black text-white hidden sm:table-cell">
                      {item.application.marks12th}%
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Tooltip text={`Scan & View QR Code Pass for ${item.name}`}>
                          <button
                            onClick={() => {
                              setSelectedQrLead(item);
                              setIsQrModalOpen(true);
                            }}
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-purple-500 hover:text-white text-slate-300 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-purple-500/40"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip text={`View ${item.name} Details`}>
                          <button
                            onClick={() => onSelectApplicant(item)}
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-sky-500 hover:text-white text-slate-300 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-sky-500/40"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip text={`In-Portal Call ${item.name}`}>
                          <button
                            onClick={() => handleOpenCommModal("CALL", {
                              name: item.name,
                              phone: item.phone,
                              email: item.email,
                              courseInterest: item.courseInterest,
                              campus: item.campus,
                              school: item.school || undefined,
                              district: item.district || undefined,
                            })}
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-emerald-500 hover:text-white text-slate-300 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-emerald-500/40"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip text={`In-Portal Email ${item.name}`}>
                          <button
                            onClick={() => handleOpenCommModal("EMAIL", {
                              name: item.name,
                              phone: item.phone,
                              email: item.email,
                              courseInterest: item.courseInterest,
                              campus: item.campus,
                              school: item.school || undefined,
                              district: item.district || undefined,
                            })}
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-indigo-500 hover:text-white text-slate-300 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-indigo-500/40"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip text={`In-Portal Message ${item.name}`}>
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
                            className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-teal-500 hover:text-white text-slate-300 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-teal-500/40"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
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

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span>Showing <strong>{filteredApplicants.length}</strong> of <strong>{applicants.length}</strong> applicants</span>
        <span className="flex items-center gap-1 text-sky-400 hover:underline cursor-pointer font-bold">
          Export Candidate List <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* IN-PORTAL DIRECT COMMUNICATION MODALS */}
      <InPortalCommunicationModals
        activeModal={activeCommModal}
        contact={activeCommContact}
        onClose={() => setActiveCommModal(null)}
        onLogSuccess={handleCommLogSuccess}
      />

      {/* QR CODE SCAN & DETAILS MODAL */}
      <LeadQRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        lead={selectedQrLead}
        allLeads={applicants}
        onActionTrigger={onActionTrigger}
      />
    </div>
  );
}
