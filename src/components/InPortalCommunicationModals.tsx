"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Mail,
  MessageSquare,
  X,
  Send,
  Sparkles,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Paperclip,
} from "lucide-react";
import Tooltip from "@/components/Tooltip";

export interface ContactTarget {
  name: string;
  phone: string;
  email: string;
  courseInterest?: string;
  campus?: string;
  school?: string;
  district?: string;
}

interface InPortalCommunicationModalsProps {
  activeModal: "CALL" | "MESSAGE" | "EMAIL" | null;
  contact: ContactTarget | null;
  onClose: () => void;
  onLogSuccess: (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => void;
}

export default function InPortalCommunicationModals({
  activeModal,
  contact,
  onClose,
  onLogSuccess,
}: InPortalCommunicationModalsProps) {
  if (!activeModal || !contact) return null;

  return (
    <>
      {activeModal === "CALL" && (
        <CallModal contact={contact} onClose={onClose} onLogSuccess={onLogSuccess} />
      )}
      {activeModal === "MESSAGE" && (
        <MessageModal contact={contact} onClose={onClose} onLogSuccess={onLogSuccess} />
      )}
      {activeModal === "EMAIL" && (
        <EmailModal contact={contact} onClose={onClose} onLogSuccess={onLogSuccess} />
      )}
    </>
  );
}

// ----------------------------------------------------
// 1. IN-PORTAL VOICE CALL MODAL
// ----------------------------------------------------
function CallModal({
  contact,
  onClose,
  onLogSuccess,
}: {
  contact: ContactTarget;
  onClose: () => void;
  onLogSuccess: (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => void;
}) {
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callNotes, setCallNotes] = useState("");
  const [callStatus, setCallStatus] = useState<"CONNECTING" | "CONNECTED" | "ENDED">("CONNECTING");

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus("CONNECTED");
    }, 1500);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === "CONNECTED") {
      interval = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    setCallStatus("ENDED");
    const notesSummary = callNotes.trim()
      ? `Call duration: ${formatTime(callSeconds)}. Notes: ${callNotes}`
      : `In-portal call completed (${formatTime(callSeconds)})`;
    onLogSuccess("CALL", notesSummary);
    setTimeout(() => onClose(), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050813]/90 backdrop-blur-xl animate-in fade-in">
      <div className="bubble-card w-full max-w-md p-6 border border-emerald-500/40 shadow-2xl relative text-slate-100 flex flex-col items-center">
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Security Indicator */}
        <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          V.S.B. In-Portal Calling Line
        </div>

        {/* Candidate Avatar & Rings */}
        <div className="relative mb-4">
          {callStatus === "CONNECTING" && (
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
          )}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-xl border-2 border-white/20 relative z-10">
            {contact.name.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Candidate Name & Info */}
        <h3 className="text-xl font-black text-white text-center">{contact.name}</h3>
        <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5">{contact.phone}</p>
        <p className="text-xs text-slate-300 font-medium mt-1">
          {contact.courseInterest || "B.E. Computer Science"} • {contact.campus || "KARUR"} CAMPUS
        </p>

        {/* Call Timer / Status */}
        <div className="my-4 py-2 px-6 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-2 font-mono font-black text-lg text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {callStatus === "CONNECTING" ? "Dialing Candidate..." : formatTime(callSeconds)}
        </div>

        {/* Call Controls */}
        <div className="flex items-center gap-4 my-2">
          <Tooltip text={isMuted ? "Unmute Mic" : "Mute Mic"}>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-full border transition-all ${
                isMuted
                  ? "bg-rose-500/30 border-rose-400 text-rose-300"
                  : "bg-slate-900 border-white/20 text-slate-200 hover:text-white"
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </Tooltip>

          <Tooltip text={isSpeakerOn ? "Speaker On" : "Speaker Off"}>
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-full border transition-all ${
                isSpeakerOn
                  ? "bg-emerald-500/30 border-emerald-400 text-emerald-300"
                  : "bg-slate-900 border-white/20 text-slate-200 hover:text-white"
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </Tooltip>

          {/* End Call Button */}
          <Tooltip text="End In-Portal Call">
            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 border border-rose-400 transition-transform active:scale-95"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </Tooltip>
        </div>

        {/* Call Notes Area */}
        <div className="w-full mt-4 text-xs space-y-1">
          <label className="block text-slate-300 font-bold flex items-center justify-between">
            <span>Call Discussion Log / Notes</span>
            <span className="text-[10px] text-slate-400">In-Portal Record</span>
          </label>
          <textarea
            rows={3}
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            placeholder="Type key details discussed with candidate (e.g. 12th Cutoff score, hostel inquiries, campus tour date)..."
            className="w-full bg-slate-950 border border-white/20 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. IN-PORTAL DIRECT MESSAGE / WHATSAPP / EMAIL MODAL
// ----------------------------------------------------
function MessageModal({
  contact,
  onClose,
  onLogSuccess,
}: {
  contact: ContactTarget;
  onClose: () => void;
  onLogSuccess: (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => void;
}) {
  const [channel, setChannel] = useState<"WHATSAPP" | "SMS" | "EMAIL">("WHATSAPP");
  const [emailSubject, setEmailSubject] = useState(
    `V.S.B. Engineering College Admission Update - ${contact.name}`
  );

  const templates = [
    {
      title: "🎓 Admission & Cutoff Info",
      text: `Dear ${contact.name}, greetings from V.S.B. Engineering College (${contact.campus || "KARUR"} Campus)! Admissions for ${contact.courseInterest || "B.E. Programs"} are currently open. Please share your 12th cutoff details for counseling guidance.`,
    },
    {
      title: "📄 Document Verification Reminder",
      text: `Hello ${contact.name}, this is a reminder regarding your application to V.S.B. Group of Institutions. Please upload your 10th & 12th marksheets in the portal for document verification.`,
    },
    {
      title: "🏫 Campus Tour Invitation",
      text: `Respected Candidate ${contact.name}, you and your parents are warmly invited to visit our V.S.B. ${contact.campus || "KARUR"} Campus to inspect our state-of-the-art labs, library, and hostel facilities. Reply to confirm your visit date.`,
    },
    {
      title: "💰 Fee Structure & Scholarship",
      text: `Dear ${contact.name}, V.S.B. offers merit-based fee concessions for high TNEA cutoff scores in ${contact.courseInterest || "Engineering"}. Reply to receive the detailed fee break-up.`,
    },
  ];

  const [messageText, setMessageText] = useState(templates[0].text);

  // Simulated sent message history
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "System Portal",
      text: `Initial admission inquiry logged for ${contact.name}`,
      time: "Yesterday, 4:30 PM",
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setChatHistory((prev) => [
      ...prev,
      {
        sender: "Teacher / Portal",
        text: messageText,
        time: "Just now",
      },
    ]);

    if (channel === "EMAIL") {
      onLogSuccess("EMAIL", `Dispatched Email ("${emailSubject}") to ${contact.email}`);
    } else {
      onLogSuccess("MESSAGE", `Dispatched ${channel} message to ${contact.name}`);
    }
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050813]/90 backdrop-blur-xl animate-in fade-in">
      <div className="bubble-card w-full max-w-lg p-6 border border-teal-500/40 shadow-2xl relative text-slate-100 space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/40">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">In-Portal Direct Messenger</h3>
            <p className="text-xs text-slate-400">
              {channel === "EMAIL" ? (
                <>Send Email directly from CRM to candidate: <strong className="text-violet-300">{contact.name}</strong> ({contact.email || "No Email Provided"})</>
              ) : (
                <>Send SMS / WhatsApp directly from CRM to candidate: <strong className="text-teal-300">{contact.name}</strong> ({contact.phone})</>
              )}
            </p>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setChannel("WHATSAPP")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              channel === "WHATSAPP"
                ? "bg-teal-500 text-white shadow-md font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>💬</span> <span>WhatsApp Gateway</span>
          </button>
          <button
            type="button"
            onClick={() => setChannel("SMS")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              channel === "SMS"
                ? "bg-indigo-600 text-white shadow-md font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📱</span> <span>Direct SMS Portal</span>
          </button>
          <button
            type="button"
            onClick={() => setChannel("EMAIL")}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              channel === "EMAIL"
                ? "bg-violet-600 text-white shadow-md font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📧</span> <span>Direct E-mail Portal</span>
          </button>
        </div>

        {/* Template Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Quick Message Templates
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {templates.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMessageText(tpl.text)}
                className="p-2 rounded-xl bg-slate-950/80 border border-white/10 text-left hover:border-teal-400/60 text-slate-300 hover:text-white transition-all text-[11px] font-medium"
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input & Submit */}
        <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
          {channel === "EMAIL" && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Subject Line</label>
              <input
                type="text"
                required
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full bg-slate-950 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="Enter email subject line..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {channel === "EMAIL" ? "Email Content" : "Message Text"}
            </label>
            <textarea
              rows={4}
              required
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-slate-950 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-400" /> Secure V.S.B. Portal Outbound API
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-white shadow-lg text-xs transition-all ${
                  channel === "EMAIL"
                    ? "bg-violet-600 hover:bg-violet-500 shadow-violet-600/30"
                    : channel === "SMS"
                    ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                    : "bg-teal-500 hover:bg-teal-400 shadow-teal-500/30"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                {channel === "EMAIL"
                  ? "Send Direct E-mail"
                  : channel === "SMS"
                  ? "Send Direct SMS"
                  : "Send In-Portal Message"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. IN-PORTAL EMAIL COMPOSER MODAL
// ----------------------------------------------------
function EmailModal({
  contact,
  onClose,
  onLogSuccess,
}: {
  contact: ContactTarget;
  onClose: () => void;
  onLogSuccess: (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => void;
}) {
  const [subject, setSubject] = useState(`V.S.B. Engineering College Admission Details - ${contact.name}`);
  const [emailBody, setEmailBody] = useState(
    `Dear ${contact.name},\n\nThank you for expressing interest in V.S.B. Engineering College (${contact.campus || "KARUR"} Campus) for ${contact.courseInterest || "B.E. Computer Science"}.\n\nOur admission portal allows you to complete document verification, review fee structures, and secure your seat allotment online.\n\nShould you have any questions, please contact our admission counselor desk directly through this portal.\n\nWarm regards,\nV.S.B. Admission Office`
  );
  const [attachProspectus, setAttachProspectus] = useState(true);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !emailBody) return;

    onLogSuccess("EMAIL", `Sent in-portal email "${subject}" to ${contact.email}`);
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050813]/90 backdrop-blur-xl animate-in fade-in">
      <div className="bubble-card w-full max-w-lg p-6 border border-indigo-500/40 shadow-2xl relative text-slate-100 space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">In-Portal Email Dispatcher</h3>
            <p className="text-xs text-slate-400">
              Send official institutional email to: <strong className="text-indigo-300">{contact.email}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Subject Line</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Content</label>
            <textarea
              rows={6}
              required
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full bg-slate-950 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-white/10">
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={attachProspectus}
                onChange={(e) => setAttachProspectus(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-white/20 focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 text-xs">
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                Attach V.S.B. Information Prospectus & Cutoff Guide 2026.pdf
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Institutional Mail Gateway Active
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 text-xs"
              >
                <Send className="w-3.5 h-3.5" /> Send Portal Email
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
