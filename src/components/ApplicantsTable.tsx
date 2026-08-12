"use client";

import { useState } from "react";
import { Lead, Application, AppStage } from "@/types/crm";
import { Eye, Phone, Mail, MessageSquare, ChevronRight, UserCheck, Plus } from "lucide-react";

interface ApplicantsTableProps {
  applicants: (Lead & { application: Application })[];
  searchQuery: string;
  onSelectApplicant: (applicant: Lead & { application: Application }) => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onOpenCreateModal: () => void;
}

export default function ApplicantsTable({
  applicants,
  searchQuery,
  onSelectApplicant,
  onActionTrigger,
  onOpenCreateModal,
}: ApplicantsTableProps) {
  const [selectedStage, setSelectedStage] = useState<string>("ALL");

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
    <div className="bubble-card p-6 border border-white/20 flex-1 flex flex-col justify-between">
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
            <button
              onClick={onOpenCreateModal}
              className="glossy-btn flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Application</span>
            </button>

            {/* Bubble Stage Control Pills */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 p-1 rounded-full border border-white/20 text-xs font-semibold backdrop-blur-md">
              {stagesList.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStage(st)}
                  className={`px-3 py-1 rounded-full transition-all ${
                    selectedStage === st
                      ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold shadow-md shadow-sky-500/40 scale-[1.02]"
                      : "text-slate-400 hover:text-slate-200"
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
                <th className="py-3 px-4">Campus</th>
                <th className="py-3 px-4">Stage Status</th>
                <th className="py-3 px-4">12th Marks</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => onSelectApplicant(item)}
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-500 border border-white/20 flex items-center justify-center text-xs font-black text-white shadow-md">
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="group-hover:text-sky-300 transition-colors font-bold">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{item.email}</p>
                      </div>
                    </td>

                    {/* Program */}
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{item.courseInterest}</td>

                    {/* Campus Pill */}
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-extrabold px-3 py-0.5 rounded-full bg-slate-900 border border-white/20 text-sky-300 shadow-inner">
                        {item.campus || "KARUR"} CAMPUS
                      </span>
                    </td>

                    {/* Stage Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${getStageBadge(
                          item.application.stage
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {item.application.stage.replace("_", " ")}
                      </span>
                    </td>

                    {/* Marks */}
                    <td className="py-3.5 px-4 font-black text-white">
                      {item.application.marks12th}%
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectApplicant(item)}
                          className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-sky-500 hover:text-white text-slate-300 transition-all shadow-md"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onActionTrigger("CALL", item.name)}
                          className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-emerald-500 hover:text-white text-slate-300 transition-all shadow-md"
                          title="Call Candidate"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onActionTrigger("EMAIL", item.name)}
                          className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-indigo-500 hover:text-white text-slate-300 transition-all shadow-md"
                          title="Email Candidate"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onActionTrigger("WHATSAPP", item.name)}
                          className="p-2 rounded-full bg-slate-900/80 border border-white/20 hover:bg-teal-500 hover:text-white text-slate-300 transition-all shadow-md"
                          title="WhatsApp Candidate"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching applicants found for "{searchQuery}".
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
    </div>
  );
}
