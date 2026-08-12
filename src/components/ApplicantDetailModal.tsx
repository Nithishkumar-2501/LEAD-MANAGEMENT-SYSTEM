"use client";

import { X, Phone, Mail, MessageSquare, Award, CheckCircle2, DollarSign, Calendar, BookOpen } from "lucide-react";
import { Lead, Application } from "@/types/crm";

interface ApplicantDetailModalProps {
  applicant: (Lead & { application: Application }) | null;
  onClose: () => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
}

export default function ApplicantDetailModal({ applicant, onClose, onActionTrigger }: ApplicantDetailModalProps) {
  if (!applicant) return null;

  const app = applicant.application;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden text-slate-100 relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {applicant.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{applicant.name}</h3>
              <p className="text-xs text-indigo-400 font-medium">{applicant.courseInterest}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Key Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <Award className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-medium">10th Grade</p>
                <p className="text-sm font-bold text-slate-100">{app.marks10th}%</p>
              </div>
            </div>
            <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <Award className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-medium">12th Grade</p>
                <p className="text-sm font-bold text-slate-100">{app.marks12th}%</p>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> Email</span>
              <span className="font-semibold text-slate-200">{applicant.email}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Phone</span>
              <span className="font-semibold text-slate-200">{applicant.phone}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-slate-400" /> Acquisition Source</span>
              <span className="font-semibold text-indigo-300">{applicant.source}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Lead Created</span>
              <span className="font-semibold text-slate-200">{new Date(applicant.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-400" /> Payment Status</span>
              <span className={`font-semibold px-2 py-0.5 rounded-full ${app.paymentStatus === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                {app.paymentStatus}
              </span>
            </div>
          </div>

          {/* Application Stage Banner */}
          <div className="bg-indigo-950/40 border border-indigo-800/60 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-300 font-medium">Application Stage</p>
              <p className="text-sm font-bold text-white mt-0.5">{app.stage.replace('_', ' ')}</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-indigo-400" />
          </div>

          {/* Quick Action Buttons */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Contact Lead</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onActionTrigger("CALL", applicant.name)}
                className="flex items-center justify-center gap-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
              <button
                onClick={() => onActionTrigger("EMAIL", applicant.name)}
                className="flex items-center justify-center gap-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button
                onClick={() => onActionTrigger("WHATSAPP", applicant.name)}
                className="flex items-center justify-center gap-1.5 bg-teal-600/20 border border-teal-500/30 text-teal-300 hover:bg-teal-600/30 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
