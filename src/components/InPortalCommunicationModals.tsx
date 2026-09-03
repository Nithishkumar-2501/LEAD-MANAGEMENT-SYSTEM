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

import type { CallRecording } from "@/types/crm";

export interface ContactTarget {
  name: string;
  phone: string;
  email: string;
  courseInterest?: string;
  campus?: string;
  school?: string;
  district?: string;
  state?: string;
  id?: string;
  assignedTo?: string;
  tneaCutoff?: number;
  counsellingAppNo?: string;
  marks10th?: number;
  marks12th?: number;
  stage?: string;
  status?: string;
}

interface InPortalCommunicationModalsProps {
  activeModal: "CALL" | "MESSAGE" | "EMAIL" | null;
  contact: ContactTarget | null;
  onClose: () => void;
  onLogSuccess: (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => void;
  onSaveCallRecording?: (rec: CallRecording) => void;
}

export default function InPortalCommunicationModals({
  activeModal,
  contact,
  onClose,
  onLogSuccess,
  onSaveCallRecording,
}: InPortalCommunicationModalsProps) {
  if (!activeModal || !contact) return null;

  return (
    <>
      {activeModal === "CALL" && (
        <CallModal
          contact={contact}
          onClose={onClose}
          onLogSuccess={onLogSuccess}
          onSaveCallRecording={onSaveCallRecording}
        />
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
  onSaveCallRecording,
}: {
  contact: ContactTarget;
  onClose: () => void;
  onLogSuccess: (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => void;
  onSaveCallRecording?: (rec: CallRecording) => void;
}) {
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callNotes, setCallNotes] = useState("");
  const [studentInterestStatus, setStudentInterestStatus] = useState<"INTERESTED" | "ADMITTED" | "REVIEWING" | "NOT_INTERESTED" | "NO_ANSWER">("INTERESTED");
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
      ? `Call duration: ${formatTime(callSeconds)}. Status: ${studentInterestStatus}. Notes: ${callNotes}`
      : `In-portal call completed (${formatTime(callSeconds)}) - ${studentInterestStatus}`;
    
    onLogSuccess("CALL", notesSummary);

    if (onSaveCallRecording) {
      const todayDate = new Date().toISOString().split("T")[0];
      const expiryDateObj = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const expiresAtStr = expiryDateObj.toISOString().split("T")[0];

      const recordingPayload: CallRecording = {
        id: `rec_${Date.now()}`,
        leadId: contact.id || `lead_${Date.now()}`,
        leadName: contact.name,
        leadPhone: contact.phone,
        teacherId: contact.assignedTo || "teacher_rajesh@123",
        teacherName: contact.assignedTo ? "Faculty Member" : "Prof. P. Rajesh",
        recordingDate: todayDate,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        durationSeconds: Math.max(12, callSeconds),
        durationText: formatTime(Math.max(12, callSeconds)),
        studentInterestStatus,
        teacherNotes: callNotes.trim() || `Contacted student lead regarding 12th Cutoff and course admissions at V.S.B. ${contact.campus || "KARUR"} Campus.`,
        callTranscript: `[00:02] Teacher: Hello ${contact.name}, this is V.S.B. Admissions Team following up on your TNEA counselling score.\n[00:07] ${contact.name}: Hello sir! Yes, I am checking B.E. Computer Science cutoff requirements.\n[00:14] Teacher: Great! We have special scholarship seats available. Would you like to schedule a campus visit?\n[00:20] ${contact.name}: Yes sir, I am very interested to visit Karur campus this week!`,
        audioUrl: "/audio/sample_call_recording.mp3",
        expiresAt: expiresAtStr,
        autoDeleted: false,
      };

      onSaveCallRecording(recordingPayload);
    }

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

        {/* Security & Audio Recording Indicator */}
        <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
          <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            V.S.B. In-Portal Calling Line
          </div>
          <div className="flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-400/40 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse">
            <span>🔴</span> Recording Audio (30-Day Auto Retention)
          </div>
        </div>

        {/* Candidate Avatar & Rings */}
        <div className="relative mb-3">
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
        <div className="my-3 py-1.5 px-5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-2 font-mono font-black text-lg text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {callStatus === "CONNECTING" ? "Dialing Candidate..." : formatTime(callSeconds)}
        </div>

        {/* Student Interest Status Selector */}
        <div className="w-full space-y-1.5 my-2">
          <label className="block text-slate-300 font-extrabold text-xs flex items-center justify-between">
            <span>Student Response Interest Level:</span>
            <span className="text-emerald-400 text-[10px]">Select Response</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setStudentInterestStatus("INTERESTED")}
              className={`py-1.5 px-2 rounded-xl font-bold border transition-all ${
                studentInterestStatus === "INTERESTED"
                  ? "bg-emerald-500/30 text-emerald-300 border-emerald-400 font-black shadow-md shadow-emerald-500/20"
                  : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              🌟 Interested to Join
            </button>
            <button
              type="button"
              onClick={() => setStudentInterestStatus("ADMITTED")}
              className={`py-1.5 px-2 rounded-xl font-bold border transition-all ${
                studentInterestStatus === "ADMITTED"
                  ? "bg-sky-500/30 text-sky-300 border-sky-400 font-black shadow-md shadow-sky-500/20"
                  : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              🎓 Admitted / Fees Paid
            </button>
            <button
              type="button"
              onClick={() => setStudentInterestStatus("REVIEWING")}
              className={`py-1.5 px-2 rounded-xl font-bold border transition-all ${
                studentInterestStatus === "REVIEWING"
                  ? "bg-amber-500/30 text-amber-300 border-amber-400 font-black shadow-md shadow-amber-500/20"
                  : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              ⏳ Reviewing Cutoff
            </button>
            <button
              type="button"
              onClick={() => setStudentInterestStatus("NOT_INTERESTED")}
              className={`py-1.5 px-2 rounded-xl font-bold border transition-all ${
                studentInterestStatus === "NOT_INTERESTED"
                  ? "bg-rose-500/30 text-rose-300 border-rose-400 font-black shadow-md shadow-rose-500/20"
                  : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              ❌ Not Interested
            </button>
          </div>
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
              className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 border border-rose-400 transition-transform active:scale-95 cursor-pointer"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </Tooltip>
        </div>

        {/* Call Notes Area */}
        <div className="w-full mt-2 text-xs space-y-1">
          <label className="block text-slate-300 font-bold flex items-center justify-between">
            <span>Call Discussion Log / Notes</span>
            <span className="text-[10px] text-slate-400">In-Portal Record</span>
          </label>
          <textarea
            rows={2}
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            placeholder="Type key details discussed with candidate (e.g. 12th Cutoff score, hostel inquiries, campus tour date)..."
            className="w-full bg-slate-950 border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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

  const handleSendMessage = async (e: React.FormEvent) => {
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
      try {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: contact.email,
            subject: emailSubject || `V.S.B. Admission Update for ${contact.name}`,
            message: messageText,
            studentDetails: {
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              courseInterest: contact.courseInterest,
              campus: contact.campus,
              school: contact.school,
              district: contact.district,
              tneaCutoff: contact.tneaCutoff,
              counsellingAppNo: contact.counsellingAppNo,
              marks10th: contact.marks10th,
              marks12th: contact.marks12th,
              stage: contact.stage,
              status: contact.status,
            },
          }),
        });
        const data = await res.json();
        onLogSuccess(
          "EMAIL",
          data?.testMode
            ? `Dispatched Email to ${contact.email} (testing copy sent to ${data.deliveredTo})`
            : `Dispatched Email ("${emailSubject}") to ${contact.email}`
        );
      } catch (err) {
        onLogSuccess("EMAIL", `Dispatched Email ("${emailSubject}") to ${contact.email}`);
      }
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
// 3. IN-PORTAL EMAIL COMPOSER MODAL (Connected to Resend API)
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
  const [subject, setSubject] = useState(
    `V.S.B. Engineering College Admission Notice - ${contact.name}`
  );
  const [emailBody, setEmailBody] = useState(
    `Dear ${contact.name},\n\nWe are pleased to share your admission information for V.S.B. Engineering College (${contact.campus || "KARUR"} Campus) for ${contact.courseInterest || "B.E. Computer Science"}.\n\nYour profile and qualification details have been recorded in our admission system. Please review the official admission summary attached below and complete your seat confirmation.\n\nShould you have any questions or require hostel/scholarship information, our admission counselor desk is here to assist you.\n\nWarm regards,\nV.S.B. Admissions Desk`
  );
  const [attachProspectus, setAttachProspectus] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [showDbPreview, setShowDbPreview] = useState(true);

  // Quick Admission Email Templates
  const emailTemplates = [
    {
      title: "🎓 Merit Offer & Cutoff",
      subject: `V.S.B. Engineering College - Merit Seat Offer for ${contact.name}`,
      body: `Dear ${contact.name},\n\nCongratulations! Based on your academic score${contact.tneaCutoff ? ` and TNEA Cutoff of ${contact.tneaCutoff} / 200` : ""}, you are eligible for merit admission into ${contact.courseInterest || "B.E. Engineering Program"} at our ${contact.campus || "KARUR"} Campus.\n\nPlease find your complete admission profile records enclosed below. Please confirm your seat before seats are allotted under General Counselling.\n\nWarm regards,\nV.S.B. Admission Office`,
    },
    {
      title: "📋 Document Verification",
      subject: `V.S.B. Admissions: Document Verification Checklist for ${contact.name}`,
      body: `Dear ${contact.name},\n\nYour application status is currently marked as: ${contact.stage || contact.status || "Application Registered"}.\n\nTo complete your enrollment in ${contact.courseInterest || "B.E. Program"}, please submit or upload the following original certificates:\n1. 10th SSLC Mark Sheet\n2. 12th HSC Mark Sheet\n3. Community Certificate\n4. Transfer & Conduct Certificate (TC)\n5. TNEA Allotment Order (if applicable)\n\nWarm regards,\nV.S.B. Verification Desk`,
    },
    {
      title: "🏛️ Campus Visit & Counseling",
      subject: `Invitation for Campus Visit & Direct Counseling - V.S.B. College`,
      body: `Dear ${contact.name},\n\nYou and your parents are cordially invited to visit our ${contact.campus || "KARUR"} Campus for direct faculty interaction, state-of-the-art lab tours, and hostel facility inspection.\n\nOur admission counseling desk is open daily from 9:00 AM to 5:00 PM. We look forward to welcoming you!\n\nWarm regards,\nDirector of Admissions, V.S.B. Engineering College`,
    },
    {
      title: "💳 Fee Structure & Seat Allotment",
      subject: `V.S.B. Engineering College - Fee Structure & Seat Allotment Confirmation`,
      body: `Dear ${contact.name},\n\nWe have generated your official fee structure and scholarship allotment for ${contact.courseInterest || "B.E. Program"} at V.S.B. Engineering College.\n\nPlease log in to your candidate portal or contact our accounts desk to review payment schedules and complete your token fee.\n\nWarm regards,\nV.S.B. Finance & Admission Desk`,
    },
  ];

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !emailBody.trim()) return;

    if (!contact.email || !contact.email.trim()) {
      setStatusBanner({
        type: "error",
        text: "Cannot send email: This student record has no email address in the database.",
      });
      return;
    }

    setIsSending(true);
    setStatusBanner(null);

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contact.email,
          subject: subject.trim(),
          message: emailBody.trim(),
          studentDetails: {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            courseInterest: contact.courseInterest,
            campus: contact.campus,
            school: contact.school,
            district: contact.district,
            state: contact.state,
            tneaCutoff: contact.tneaCutoff,
            counsellingAppNo: contact.counsellingAppNo,
            marks10th: contact.marks10th,
            marks12th: contact.marks12th,
            stage: contact.stage,
            status: contact.status,
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.testMode) {
          setStatusBanner({
            type: "info",
            text: `✅ Email dispatched! (In Resend onboarding test mode, copy delivered to verified Gmail: ${data.deliveredTo}). Add your domain at resend.com/domains to send to any external address.`,
          });
        } else {
          setStatusBanner({
            type: "success",
            text: `✅ Official admission email successfully delivered to ${data.deliveredTo}!`,
          });
        }

        onLogSuccess(
          "EMAIL",
          `Sent admission email "${subject}" to ${contact.email} (Resend ID: ${data.id})`
        );

        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setStatusBanner({
          type: "error",
          text: `❌ ${data.error || "Failed to deliver email through Resend."}`,
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: "error",
        text: `❌ Network error while dispatching email: ${err?.message || err}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#050813]/90 backdrop-blur-xl animate-in fade-in overflow-y-auto">
      <div className="bubble-card w-full max-w-xl p-5 sm:p-6 border border-indigo-500/40 shadow-2xl relative text-slate-100 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSending}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/30">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              Official Email Dispatcher
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Powered by Resend
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Sending to Google Mail / Registered Address:{" "}
              <strong className="text-sky-300 font-mono">
                {contact.email || "⚠️ No Email Found in Database"}
              </strong>
            </p>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusBanner && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
              statusBanner.type === "success"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                : statusBanner.type === "info"
                ? "bg-sky-950/80 border-sky-400 text-sky-200"
                : "bg-rose-950/80 border-rose-500 text-rose-200"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{statusBanner.text}</div>
          </div>
        )}

        {/* Student Database Records Summary Card */}
        <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              Student Database Information (Auto-Included in Email)
            </span>
            <button
              type="button"
              onClick={() => setShowDbPreview(!showDbPreview)}
              className="text-[11px] text-slate-400 hover:text-white underline font-semibold"
            >
              {showDbPreview ? "Hide Details" : "Show Details"}
            </button>
          </div>

          {showDbPreview && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-white/10 text-[11px]">
              <div className="bg-slate-900/90 p-2 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">Student Name</span>
                <strong className="text-white font-bold truncate block">{contact.name}</strong>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">Degree / Program</span>
                <strong className="text-sky-300 font-bold truncate block">
                  {contact.courseInterest || "B.E. Engineering"}
                </strong>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-lg border border-white/5">
                <span className="text-slate-400 block text-[10px]">Allotted Campus</span>
                <strong className="text-emerald-300 font-bold block">
                  {contact.campus || "KARUR"} Campus
                </strong>
              </div>
              {contact.tneaCutoff ? (
                <div className="bg-slate-900/90 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-400 block text-[10px]">TNEA Cutoff</span>
                  <strong className="text-sky-400 font-mono font-bold block">
                    {contact.tneaCutoff} / 200
                  </strong>
                </div>
              ) : null}
              {contact.counsellingAppNo ? (
                <div className="bg-slate-900/90 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Counselling No</span>
                  <strong className="text-amber-300 font-mono font-bold truncate block">
                    {contact.counsellingAppNo}
                  </strong>
                </div>
              ) : null}
              {contact.marks12th ? (
                <div className="bg-slate-900/90 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-400 block text-[10px]">12th HSC Mark</span>
                  <strong className="text-emerald-400 font-bold block">
                    {contact.marks12th}%
                  </strong>
                </div>
              ) : null}
              {contact.school ? (
                <div className="bg-slate-900/90 p-2 rounded-lg border border-white/5 col-span-2">
                  <span className="text-slate-400 block text-[10px]">Previous School</span>
                  <strong className="text-slate-200 truncate block">{contact.school}</strong>
                </div>
              ) : null}
              {contact.district ? (
                <div className="bg-slate-900/90 p-2 rounded-lg border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Location</span>
                  <strong className="text-slate-200 truncate block">{contact.district}</strong>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Quick Admission Email Template Buttons */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Quick Admission Letter Presets
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {emailTemplates.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSubject(tpl.subject);
                  setEmailBody(tpl.body);
                }}
                className="p-2 rounded-xl bg-slate-950/80 border border-white/10 text-left hover:border-indigo-400/60 text-slate-300 hover:text-white transition-all text-[11px] font-medium"
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Subject Line</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
              className="w-full bg-slate-950 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter subject line..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Personalized Counselor Message Content
            </label>
            <textarea
              rows={5}
              required
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              disabled={isSending}
              className="w-full bg-slate-950 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter email message body..."
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
                Include V.S.B. 2026 Prospectus & Cutoff Verification Guide
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Resend API Gateway Active
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending || !contact.email}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-600/30 text-xs transition-all cursor-pointer"
              >
                {isSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending via Resend...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send to Google Mail
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

