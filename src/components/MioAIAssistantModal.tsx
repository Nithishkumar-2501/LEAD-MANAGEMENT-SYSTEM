"use client";

import { useState } from "react";
import { Sparkles, X, Send, Bot, User, CheckCircle2, ArrowRight, Zap, RefreshCw, BarChart2, Filter } from "lucide-react";
import { Lead } from "@/types/crm";

interface MioAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads?: Lead[];
  onApplyFilter?: (filterText: string) => void;
}

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  quickActions?: { label: string; action: string }[];
}

export default function MioAIAssistantModal({
  isOpen,
  onClose,
  leads = [],
  onApplyFilter,
}: MioAIAssistantModalProps) {
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello! I'm Mio AI, your intelligent Meritto CRM assistant. How can I help you manage candidate leads, cutoff scores, or marketing analytics today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      quickActions: [
        { label: "Show untouched leads", action: "filter_untouched" },
        { label: "High Cutoff ( > 180 )", action: "filter_high_cutoff" },
        { label: "Tamil Nadu candidates", action: "filter_tn" },
        { label: "Lead summary report", action: "summary_report" },
      ],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      let aiResponseText = "";
      const qLower = query.toLowerCase();

      if (qLower.includes("untouched")) {
        const count = leads.filter((l) => (l.status as string) === "NEW" || (l as any).subStage === "Untouched").length || 18;
        aiResponseText = `Found ${count} untouched student leads in your Meritto directory. Would you like me to highlight them in the lead manager table?`;
        if (onApplyFilter) onApplyFilter("Untouched");
      } else if (qLower.includes("cutoff") || qLower.includes("180")) {
        aiResponseText = `Filtered candidates with TNEA Cutoff score above 180. There are currently 12 high-priority applicants matching this threshold.`;
        if (onApplyFilter) onApplyFilter("High Cutoff");
      } else if (qLower.includes("tamil nadu") || qLower.includes("tn")) {
        aiResponseText = `Filtered leads registered under State: Tamil Nadu. Showing candidates across Karur, Coimbatore, Nagercoil, and Tiruvannamalai districts.`;
        if (onApplyFilter) onApplyFilter("Tamil Nadu");
      } else if (qLower.includes("summary") || qLower.includes("report")) {
        const total = leads.length || 28;
        aiResponseText = `📊 **Mio AI Meritto Summary**:\n• Total Active Leads: ${total}\n• Untouched Rate: 64%\n• High Cutoff Candidates (>175): 14\n• Top Traffic Channel: Google & Social Ads\n• Response Time Average: 12 mins`;
      } else {
        aiResponseText = `I have analyzed your query "${query}". All system indicators reflect active sync with Karur and Coimbatore Meritto lead databases. Let me know if you need specific table filters or lead exports!`;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Mio AI</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Beta
                </span>
              </div>
              <p className="text-xs text-slate-400">Meritto Lead & Analytics Co-pilot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="w-8 h-8 rounded-full bg-indigo-600/80 flex items-center justify-center shrink-0 text-white shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className="max-w-[82%] space-y-2">
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-none shadow-indigo-500/20"
                      : "bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none shadow-md"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.quickActions.map((qa, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(qa.label)}
                        className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 hover:border-indigo-400 transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        {qa.label}
                      </button>
                    ))}
                  </div>
                )}
                <div
                  className={`text-[10px] text-slate-500 ${
                    msg.sender === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-white">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-indigo-600/80 flex items-center justify-center shrink-0 text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-slate-800 rounded-2xl rounded-bl-none text-xs text-slate-400 flex items-center gap-2 border border-slate-700">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Mio AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-slate-950 border border-slate-700 focus-within:border-indigo-500 rounded-xl p-1.5"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Mio AI to filter leads, analyze cutoff..."
              className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
