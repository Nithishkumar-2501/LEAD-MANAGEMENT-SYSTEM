// -------------------------------------------------------------
// GOOGLE CALENDAR SYNCHRONIZATION & IMPORT UTILITY
// -------------------------------------------------------------

import { Task } from "@/types/crm";
import { ensureFirebaseAuth } from "./firebaseSync";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end?: Date;
  attendees?: string[];
  status?: string;
  htmlLink?: string;
}

const LOCAL_STORAGE_GCAL_SETTINGS = "vsb_google_calendar_settings";

export interface GoogleCalendarConfig {
  calendarId: string;
  autoSync: boolean;
  connectedAccount?: string;
  lastSynced?: string;
}

export function getGoogleCalendarConfig(): GoogleCalendarConfig {
  if (typeof window === "undefined") {
    return { calendarId: "primary", autoSync: true, connectedAccount: "admissions@vsbec.in" };
  }
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_GCAL_SETTINGS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return { calendarId: "primary", autoSync: true, connectedAccount: "admissions@vsbec.in" };
}

export function saveGoogleCalendarConfig(config: Partial<GoogleCalendarConfig>): GoogleCalendarConfig {
  const current = getGoogleCalendarConfig();
  const updated = { ...current, ...config };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_GCAL_SETTINGS, JSON.stringify(updated));
    } catch (e) {}
  }
  return updated;
}

/**
 * Parses raw .ics (iCalendar) format string exported from Google Calendar
 */
export function parseICSGoogleCalendar(icsContent: string): GoogleCalendarEvent[] {
  const events: GoogleCalendarEvent[] = [];
  const lines = icsContent.split(/\r\n|\n|\r/);
  
  let inEvent = false;
  let currentEvent: Partial<GoogleCalendarEvent> = {};

  const parseICSDate = (dateStr: string): Date => {
    // Examples: 20261203T100000Z or 20261203 or TZID=Asia/Kolkata:20261203T100000
    const cleanStr = dateStr.includes(":") ? dateStr.split(":").pop()! : dateStr;
    const match = cleanStr.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?/);
    if (match) {
      const [_, y, m, d, h = "00", min = "00", s = "00"] = match;
      return new Date(
        parseInt(y, 10),
        parseInt(m, 10) - 1,
        parseInt(d, 10),
        parseInt(h, 10),
        parseInt(min, 10),
        parseInt(s, 10)
      );
    }
    return new Date();
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Handle multiline continuation in .ics
    while (i + 1 < lines.length && (lines[i + 1].startsWith(" ") || lines[i + 1].startsWith("\t"))) {
      i++;
      line += lines[i].slice(1);
    }

    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      currentEvent = {
        id: `gcal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };
    } else if (line === "END:VEVENT") {
      if (currentEvent.summary && currentEvent.start) {
        events.push(currentEvent as GoogleCalendarEvent);
      }
      inEvent = false;
      currentEvent = {};
    } else if (inEvent) {
      if (line.startsWith("SUMMARY:")) {
        currentEvent.summary = line.substring(8).replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\n/g, "\n");
      } else if (line.startsWith("DESCRIPTION:")) {
        currentEvent.description = line.substring(12).replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\n/g, "\n");
      } else if (line.startsWith("LOCATION:")) {
        currentEvent.location = line.substring(9).replace(/\\,/g, ",").replace(/\\;/g, ";");
      } else if (line.startsWith("DTSTART")) {
        currentEvent.start = parseICSDate(line);
      } else if (line.startsWith("DTEND")) {
        currentEvent.end = parseICSDate(line);
      } else if (line.startsWith("UID:")) {
        currentEvent.id = line.substring(4);
      }
    }
  }

  return events;
}

/**
 * Converts Google Calendar events into CRM Tasks
 */
export function convertGoogleEventsToTasks(
  events: GoogleCalendarEvent[],
  counselorId: string = "usr_admin_vsb"
): Task[] {
  return events.map((ev, index) => {
    const summaryLower = (ev.summary || "").toLowerCase();
    let type: "CALL" | "EMAIL" | "WHATSAPP" | "SMS" = "CALL";
    if (summaryLower.includes("email") || summaryLower.includes("mail")) {
      type = "EMAIL";
    } else if (summaryLower.includes("whatsapp") || summaryLower.includes("chat")) {
      type = "WHATSAPP";
    } else if (summaryLower.includes("sms") || summaryLower.includes("message")) {
      type = "SMS";
    }

    return {
      id: `task_gcal_${Date.now()}_${index}`,
      counselorId,
      leadId: `lead_gcal_${Date.now()}_${index}`,
      title: `[Google Calendar] ${ev.summary}`,
      type,
      dueDate: ev.start ? ev.start.toISOString() : new Date().toISOString(),
      isCompleted: false,
    };
  });
}

/**
 * Generates an official Google Calendar Add Event URL
 */
export function buildGoogleCalendarUrl(options: {
  title: string;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
}): string {
  const { title, description = "", location = "V.S.B. Group of Institutions (Admissions Directorate)", startDate, endDate } = options;
  const start = startDate || new Date();
  const end = endDate || new Date(start.getTime() + 45 * 60 * 1000); // 45 min default duration

  const formatGCalDate = (d: Date): string => {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const datesParam = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: `${description}\n\n[Scheduled via SPHEREX Admissions CRM]`,
    location,
    dates: datesParam,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Persists imported events in localStorage and Firestore
 */
export async function persistImportedEvents(tasks: Task[]): Promise<boolean> {
  if (tasks.length === 0) return true;

  // 1. LocalStorage
  if (typeof window !== "undefined") {
    try {
      const existingStr = localStorage.getItem("vsb_tasks_cache");
      const existing: Task[] = existingStr ? JSON.parse(existingStr) : [];
      const merged = [...tasks, ...existing];
      localStorage.setItem("vsb_tasks_cache", JSON.stringify(merged));
    } catch (e) {}
  }

  // 2. Firebase Firestore
  try {
    await ensureFirebaseAuth();
    for (const task of tasks) {
      const docRef = doc(db, "tasks", task.id);
      await setDoc(docRef, task, { merge: true });
    }
  } catch (err: any) {
    console.warn("Firestore task sync notice:", err?.message || err);
  }

  return true;
}
