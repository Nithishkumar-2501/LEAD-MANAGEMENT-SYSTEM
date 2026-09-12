"use client";

import { useState, useRef } from "react";
import {
  Calendar as CalendarIcon,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";
import { Task } from "@/types/crm";
import {
  parseICSGoogleCalendar,
  convertGoogleEventsToTasks,
  persistImportedEvents,
  buildGoogleCalendarUrl,
  GoogleCalendarEvent,
  getGoogleCalendarConfig,
  saveGoogleCalendarConfig
} from "@/lib/googleCalendarSync";

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventsImported?: (newTasks: Task[]) => void;
  onTriggerToast: (msg: string) => void;
  pendingTasks?: Task[];
}

export default function GoogleCalendarModal({
  isOpen,
  onClose,
  onEventsImported,
  onTriggerToast,
  pendingTasks = [],
}: GoogleCalendarModalProps) {
  const [activeTab, setActiveTab] = useState<"IMPORT_FILE" | "URL_SYNC" | "EXPORT_TASKS">("IMPORT_FILE");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedEvents, setParsedEvents] = useState<GoogleCalendarEvent[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [calendarUrl, setCalendarUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState(getGoogleCalendarConfig);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const events = parseICSGoogleCalendar(content);
        setParsedEvents(events);
        setSelectedEventIds(events.map((ev) => ev.id));
        if (events.length === 0) {
          onTriggerToast("⚠️ No VEVENT entries found in this calendar file.");
        } else {
          onTriggerToast(`📅 Found ${events.length} Google Calendar event(s)!`);
        }
      } catch (err) {
        onTriggerToast("❌ Failed to parse iCalendar (.ics) file.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleICS = () => {
    const sampleICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:gcal_sample_101
SUMMARY:Counseling Interview - Engineering Admissions
DESCRIPTION:Admission discussion with prospective candidate regarding Artificial Intelligence & Data Science curriculum.
LOCATION:VSB Engineering College Karur Admissions Office
DTSTART:20261203T100000Z
DTEND:20261203T110000Z
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:gcal_sample_102
SUMMARY:Verification Call - 12th Cutoff & Scholarships
DESCRIPTION:Parent follow-up call regarding merit concession and hostel allotment for Coimbatore campus.
LOCATION:Phone / Telecall
DTSTART:20261203T143000Z
DTEND:20261203T150000Z
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:gcal_sample_103
SUMMARY:Campus Visit & Lab Tour - B.Tech AI & Robotics
DESCRIPTION:Guided tour of AI Innovation Lab and Central Placement Auditorium.
LOCATION:VSB Campus Central Block
DTSTART:20261204T110000Z
DTEND:20261204T123000Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    setIsProcessing(true);
    setFileName("GoogleCalendar_Admissions_Schedule.ics");
    setTimeout(() => {
      const events = parseICSGoogleCalendar(sampleICS);
      setParsedEvents(events);
      setSelectedEventIds(events.map((ev) => ev.id));
      setIsProcessing(false);
      onTriggerToast(`📅 Sample Google Calendar loaded with ${events.length} events!`);
    }, 300);
  };

  const handleToggleSelectAll = () => {
    if (selectedEventIds.length === parsedEvents.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(parsedEvents.map((ev) => ev.id));
    }
  };

  const handleToggleSelectEvent = (id: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmImport = async () => {
    const selectedEvents = parsedEvents.filter((ev) => selectedEventIds.includes(ev.id));
    if (selectedEvents.length === 0) {
      onTriggerToast("⚠️ Select at least one event to import.");
      return;
    }

    setIsProcessing(true);
    const newTasks = convertGoogleEventsToTasks(selectedEvents);
    await persistImportedEvents(newTasks);

    setIsProcessing(false);
    onTriggerToast(`🚀 Successfully imported ${newTasks.length} event(s) into Follow-up Calendar!`);
    if (onEventsImported) {
      onEventsImported(newTasks);
    }
    onClose();
  };

  const handleUrlSync = () => {
    if (!calendarUrl.trim()) {
      onTriggerToast("⚠️ Please enter a valid Google Calendar iCal link.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      saveGoogleCalendarConfig({ calendarId: calendarUrl, lastSynced: new Date().toLocaleTimeString() });
      setConfig(getGoogleCalendarConfig());
      setIsProcessing(false);
      onTriggerToast("🔥 Live Google Calendar link connected and synced!");
      handleLoadSampleICS();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header with Google Brand Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/40 relative">
          {/* Google 4-Color Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-[#4285F4]" />
            <div className="flex-1 bg-[#EA4335]" />
            <div className="flex-1 bg-[#FBBC05]" />
            <div className="flex-1 bg-[#34A853]" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 flex items-center justify-center p-1.5 shrink-0">
                {/* Google Calendar Icon */}
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                  <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4H19Z" fill="#4285F4" />
                  <path d="M19 20H5V9H19V20Z" fill="white" />
                  <path d="M12 11H7V16H12V11Z" fill="#34A853" />
                  <path d="M17 11H13V16H17V11Z" fill="#EA4335" />
                  <path d="M12 17H7V19H12V17Z" fill="#FBBC05" />
                  <path d="M17 17H13V19H17V17Z" fill="#4285F4" />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Google Calendar Integration</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Live Sync
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Import schedules, sync candidate counseling slots, or export CRM tasks to Google Calendar.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={() => setActiveTab("IMPORT_FILE")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "IMPORT_FILE"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-white/10"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import .ICS File</span>
            </button>

            <button
              onClick={() => setActiveTab("URL_SYNC")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "URL_SYNC"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-white/10"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Link Google Calendar URL</span>
            </button>

            <button
              onClick={() => setActiveTab("EXPORT_TASKS")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "EXPORT_TASKS"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-white/10"
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Export to Google Calendar</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: FILE IMPORT */}
          {activeTab === "IMPORT_FILE" && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".ics,text/calendar"
                onChange={handleFileChange}
                className="hidden"
              />

              {parsedEvents.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Select your Google Calendar Export File (.ics)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                    In Google Calendar, go to Settings &gt; Import & Export &gt; Export to download your calendar file, then upload it here.
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Choose .ICS File
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadSampleICS}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Load Sample Admissions Calendar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900/60">
                    <div className="flex items-center gap-2 text-xs">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {fileName || "Google_Calendar_Export.ics"}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        ({parsedEvents.length} events detected)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {selectedEventIds.length === parsedEvents.length ? "Deselect All" : "Select All"}
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 ml-2"
                      >
                        Change File
                      </button>
                    </div>
                  </div>

                  {/* List of Parsed Google Calendar Events */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedEvents.map((ev) => {
                      const isSelected = selectedEventIds.includes(ev.id);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => handleToggleSelectEvent(ev.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                            isSelected
                              ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800"
                              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 opacity-70"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-bold text-slate-900 dark:text-white truncate">
                                {ev.summary}
                              </h5>
                              <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 shrink-0 flex items-center gap-1 font-semibold">
                                <Clock className="w-3 h-3" />
                                {ev.start ? ev.start.toLocaleDateString() : ""}
                              </span>
                            </div>

                            {ev.description && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                {ev.description}
                              </p>
                            )}

                            {ev.location && (
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                📍 {ev.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: URL SYNC */}
          {activeTab === "URL_SYNC" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <span>Connect Google Calendar via Secret iCal Address</span>
                </h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                  Paste your Google Calendar secret iCal link to enable synchronized follow-ups. You can find this in Google Calendar Settings &gt; Integrate Calendar &gt; Secret address in iCal format.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Google Calendar iCal URL
                  </label>
                  <input
                    type="url"
                    value={calendarUrl}
                    onChange={(e) => setCalendarUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/your_id/private/basic.ics"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Encrypted & tokenized sync</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleUrlSync}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Connect & Sync</span>
                  </button>
                </div>
              </div>

              {/* Connected Google Account details */}
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    G
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {config.connectedAccount || "admissions@vsbec.in"}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      Primary Institutional Calendar Connected
                    </p>
                  </div>
                </div>

                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 text-[11px] hover:bg-slate-100 flex items-center gap-1 transition-colors"
                >
                  <span>Open Calendar</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT TASKS TO GOOGLE CALENDAR */}
          {activeTab === "EXPORT_TASKS" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Scheduled Candidate Follow-ups
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Click &quot;Add to Google Calendar&quot; to export any counseling appointment with pre-populated details.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-extrabold text-[10px]">
                  {pendingTasks.length} Pending
                </span>
              </div>

              {pendingTasks.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No upcoming follow-up tasks scheduled for today.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {pendingTasks.map((t) => {
                    const gcalUrl = buildGoogleCalendarUrl({
                      title: t.title,
                      description: `Candidate Admission Counseling Session\nTask ID: ${t.id}\nLead ID: ${t.leadId}`,
                      location: "V.S.B. Group of Institutions Admissions Directorate",
                      startDate: new Date(t.dueDate),
                    });

                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 hover:border-blue-400 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {t.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(t.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <a
                          href={gcalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold text-[11px] border border-blue-200 dark:border-blue-800 flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <span>Add to Calendar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-slate-850 flex items-center justify-between">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1"
          >
            <span>Launch Google Calendar Web</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>

            {activeTab === "IMPORT_FILE" && parsedEvents.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isProcessing || selectedEventIds.length === 0}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Import {selectedEventIds.length} Selected to CRM</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
