/**
 * Safe date parsing and formatting utilities for CRM leads and students.
 * Prevents "NaN/NaN/NaN, Invalid Date" display errors across tables and exports.
 */

export function parseSafeDate(raw: any): Date | null {
  if (raw === null || raw === undefined) return null;

  if (raw instanceof Date) {
    return isNaN(raw.getTime()) ? null : raw;
  }

  // Handle Firestore Timestamp or objects with .toDate()
  if (typeof raw === "object") {
    if (typeof raw.toDate === "function") {
      try {
        const d = raw.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {}
    }
    const sec = raw.seconds ?? raw._seconds;
    if (typeof sec === "number" && !isNaN(sec)) {
      const d = new Date(sec * 1000);
      if (!isNaN(d.getTime())) return d;
    }
    // An empty object {} or unparseable object
    return null;
  }

  // Handle epoch milliseconds or seconds
  if (typeof raw === "number") {
    if (isNaN(raw) || raw <= 0) return null;
    const d = new Date(raw < 1e11 ? raw * 1000 : raw);
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle string representations
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (
      !trimmed ||
      trimmed === "{}" ||
      trimmed === "null" ||
      trimmed === "undefined" ||
      trimmed.toLowerCase() === "invalid date"
    ) {
      return null;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;

    // Check if numeric string timestamp
    const num = Number(trimmed);
    if (!isNaN(num) && num > 0) {
      const dNum = new Date(num < 1e11 ? num * 1000 : num);
      if (!isNaN(dNum.getTime())) return dNum;
    }
  }

  return null;
}

export function getLeadRegistrationDate(lead: any): Date | null {
  if (!lead) return null;
  return (
    parseSafeDate(lead.createdAt) ||
    parseSafeDate(lead.registeredDate) ||
    parseSafeDate(lead.registrationDate) ||
    parseSafeDate(lead.updatedAt) ||
    null
  );
}

export function formatRegistrationDate(
  leadOrDate: any,
  includeTime: boolean = true,
  fallbackText: string = "Date Unavailable"
): string {
  const d = leadOrDate instanceof Date ? parseSafeDate(leadOrDate) : getLeadRegistrationDate(leadOrDate) || parseSafeDate(leadOrDate);
  if (!d) return fallbackText;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  if (!includeTime) {
    return `${day}/${month}/${year}`;
  }

  const timeStr = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return `${day}/${month}/${year}, ${timeStr}`;
}
