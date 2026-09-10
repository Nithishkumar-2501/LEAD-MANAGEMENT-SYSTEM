"use client";

import { useState } from "react";
import { MessageSquare, PhoneCall, Mic, Clock, CheckCircle2, AlertCircle, Bot, Sparkles, Volume2, ShieldCheck } from "lucide-react";
import { CallRecording } from "@/types/crm";

interface EchoDashboardViewProps {
  onTriggerToast?: (msg: string) => void;
}

export default function EchoDashboardView({ onTriggerToast }: EchoDashboardViewProps) {
  const [selectedCall, setSelectedCall] = useState<CallRecording | null>({
    id: "rec_1001",
    leadId: "lead_1",
    leadName: "Revathy S.",
    leadPhone: "+91 95662 07732",
    teacherId: "teacher_rajesh@123",
    teacherName: "Prof. P. Rajesh",
    recordingDate: "2026-08-27",
    timestamp: "09:45 AM",
    durationSeconds: 95,
    durationText: "01:35",
    studentInterestStatus: "INTERESTED",
    teacherNotes: "Candidate has 192.5 TNEA cutoff score. Very interested in B.E. BioMedical at V.S.B. Karur Campus.",
    callTranscript: "[00:02] Prof. Rajesh: Good morning Revathy, calling from V.S.B. Engineering College Admissions Desk.\n[00:08] Revathy: Hello sir! I wanted to verify my cutoff eligibility for BioMedical Engineering.\n[00:15] Prof. Rajesh: Your 192.5 cutoff score qualifies for 50% merit tuition scholarship bracket!",
    expiresAt: "2026-09-26",
    autoDeleted: false,
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Echo WhatsApp Live Chat & Voice Call Dashboard</h2>
            <p className="text-xs text-slate-600 font-medium">Automated WhatsApp chatbot analytics & 30-day voice call audio transcription inspector</p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-800 shadow-sm">
          🟢 Chatbot Status: Online & Auto-replying
        </div>
      </div>

      {/* Echo Platform Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase">Incoming WhatsApp Chats</p>
            <h4 className="text-xl font-black text-slate-900">410 Active Conversations</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase">Average Response Time</p>
            <h4 className="text-xl font-black text-sky-600">1.2 Minutes</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase">Voice Calls Logged</p>
            <h4 className="text-xl font-black text-amber-600">128 Audio Audit Logs</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Mic className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase">AI Transcript Accuracy</p>
            <h4 className="text-xl font-black text-indigo-600">98.5%</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Voice Call Audio Inspector Preview */}
      {selectedCall && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-600" /> Recent Voice Call Audio Inspector & Transcript
            </h3>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              30-Day Auto Purge Retention Active
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {selectedCall.leadName} <span className="text-emerald-700 font-mono font-bold">({selectedCall.leadPhone})</span>
                </h4>
                <p className="text-xs text-slate-600 font-medium">Counselor: {selectedCall.teacherName} • {selectedCall.recordingDate} at {selectedCall.timestamp}</p>
              </div>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                Duration: {selectedCall.durationText}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Speech Transcript:</p>
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-line shadow-xs">
                {selectedCall.callTranscript}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
