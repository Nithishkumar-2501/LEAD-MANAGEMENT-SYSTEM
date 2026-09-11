/**
 * Cross-Platform SMS Messaging Utility for SPHEREX CRM.
 * 
 * Works across Native Mobile Apps (Android Capacitor WebView, iOS) and Web Browsers.
 * Standardizes international & Indian phone numbers and dispatches directly to the 
 * user's native SMS messaging app (Google Messages, Samsung Messages, Apple Messages, etc.)
 * with the recipient's phone number and pre-filled admission text.
 */

/**
 * Standardize phone number for SMS apps (digits only or optional leading '+')
 */
export function formatSmsNumber(rawPhone?: string | null): string {
  if (!rawPhone || typeof rawPhone !== "string") return "";

  // Strip all non-numeric characters except optional leading '+'
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, "");
  if (!cleaned) return "";

  let digits = cleaned.replace(/\D/g, "");
  if (!digits) return "";

  // If 10 digits (standard Indian mobile number), prepend +91
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // If 11 digits starting with 0, replace 0 with +91
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }

  // If 12 digits starting with 91, add leading '+'
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  return `+${digits}`;
}

/**
 * Check if the current browser environment is iOS (iPhone/iPad)
 */
function isIosDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Generate standard SMS URL based on platform conventions:
 * - Android & Standard: sms:+91XXXXXXXXXX?body=message
 * - iOS: sms:+91XXXXXXXXXX&body=message
 */
export function getSmsUrl(rawPhone?: string | null, message?: string): string {
  const cleanPhone = formatSmsNumber(rawPhone);
  if (!cleanPhone) return "";

  const encodedBody = message ? encodeURIComponent(message.trim()) : "";
  const separator = isIosDevice() ? "&" : "?";

  return `sms:${cleanPhone}${encodedBody ? `${separator}body=${encodedBody}` : ""}`;
}

/**
 * Generate alternate Android smsto: URI
 */
export function getSmstoUrl(rawPhone?: string | null, message?: string): string {
  const cleanPhone = formatSmsNumber(rawPhone);
  if (!cleanPhone) return "";
  const encodedBody = message ? encodeURIComponent(message.trim()) : "";
  return `smsto:${cleanPhone}${encodedBody ? `?body=${encodedBody}` : ""}`;
}

/**
 * Launch native SMS messaging app across Android Mobile App (Capacitor), iOS, and Web.
 * Directly accesses the phone's SMS application with pre-filled student recipient and message.
 */
export function redirectToSms(rawPhone?: string | null, message?: string): boolean {
  if (typeof window === "undefined") return false;

  const cleanPhone = formatSmsNumber(rawPhone);
  if (!cleanPhone) {
    console.warn("[SMS] No valid phone number provided for SMS dispatch");
    alert("⚠️ Please provide a valid 10-digit mobile number to send an SMS.");
    return false;
  }

  const smsUrl = getSmsUrl(cleanPhone, message);

  try {
    // Create and click a hidden anchor element to trigger the native app handler
    const anchor = document.createElement("a");
    anchor.href = smsUrl;
    anchor.rel = "noopener noreferrer";
    anchor.target = "_self";
    anchor.style.position = "fixed";
    anchor.style.left = "-9999px";
    anchor.style.top = "-9999px";
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
    }, 500);

    return true;
  } catch (err) {
    console.warn("[SMS] Anchor click failed, falling back to window.location.href:", err);
    try {
      window.location.href = smsUrl;
      return true;
    } catch (e) {
      console.error("[SMS] Error redirecting to SMS app:", e);
      return false;
    }
  }
}

/**
 * Generate concise, professional admission outreach SMS text (fits SMS character limits)
 */
export function getDefaultAdmissionSmsText(student: {
  name: string;
  courseInterest?: string;
  campus?: string;
  cutoff?: number | string;
  stage?: string;
}): string {
  const name = student.name || "Student";
  const course = student.courseInterest || "Engineering Program";
  const campus = student.campus || "KARUR";

  return `Dear ${name}, Greetings from V.S.B. Engineering College (${campus}). Follow-up on your admission application for ${course}. Admissions 2026-27 are open. Contact admissions: +91-6380270912 / visit campus for counseling.`;
}
