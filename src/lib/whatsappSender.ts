/**
 * Cross-Platform WhatsApp Messaging Utility for SPHEREX CRM.
 * 
 * Functions on both Mobile App (Android Capacitor WebView) and Web Browsers (Desktop/Mobile Web).
 * Automatically cleans and formats international phone numbers (e.g. 10-digit Indian numbers -> 91XXXXXXXXXX)
 * and dispatches messages directly to the recipient's WhatsApp chat with pre-filled text.
 */

/**
 * Standardize phone number for WhatsApp API (digits only with country code, NO '+', '-', '(', ')', or spaces)
 */
export function formatWhatsAppNumber(rawPhone?: string | null): string {
  if (!rawPhone || typeof rawPhone !== "string") return "";

  // Strip all non-numeric characters
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";

  // If 10 digits (standard Indian mobile number starting with 6, 7, 8, or 9), prepend India country code 91
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // If 11 digits starting with 0 (e.g. 09876543210), replace leading 0 with 91
  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  // If 12 digits starting with 91 (already formatted Indian number)
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  // Otherwise return full digits as provided
  return digits;
}

/**
 * Generate Universal WhatsApp URL (works on both native WhatsApp apps & WhatsApp Web)
 */
export function getWhatsAppUrl(rawPhone?: string | null, message?: string): string {
  const cleanPhone = formatWhatsAppNumber(rawPhone);
  const encodedText = message ? encodeURIComponent(message.trim()) : "";

  if (!cleanPhone) {
    return "";
  }

  // Using api.whatsapp.com/send which automatically directs to WhatsApp Mobile App
  // on smartphones (Android/iOS) and to WhatsApp Web/Desktop on computers.
  return `https://api.whatsapp.com/send?phone=${cleanPhone}${encodedText ? `&text=${encodedText}` : ""}`;
}

/**
 * Generate native app deep link for Android / iOS
 */
export function getWhatsAppNativeDeepLink(rawPhone?: string | null, message?: string): string {
  const cleanPhone = formatWhatsAppNumber(rawPhone);
  const encodedText = message ? encodeURIComponent(message.trim()) : "";
  if (!cleanPhone) return "";
  return `whatsapp://send?phone=${cleanPhone}${encodedText ? `&text=${encodedText}` : ""}`;
}

/**
 * Generate direct wa.me link for universal mobile and web routing
 */
export function getWaMeUrl(rawPhone?: string | null, message?: string): string {
  const cleanPhone = formatWhatsAppNumber(rawPhone);
  const encodedText = message ? encodeURIComponent(message.trim()) : "";
  if (!cleanPhone) return "";
  return `https://wa.me/${cleanPhone}${encodedText ? `?text=${encodedText}` : ""}`;
}

/**
 * Generate direct WhatsApp Web URL for desktop browsers
 */
export function getWhatsAppWebUrl(rawPhone?: string | null, message?: string): string {
  const cleanPhone = formatWhatsAppNumber(rawPhone);
  const encodedText = message ? encodeURIComponent(message.trim()) : "";
  if (!cleanPhone) return "";
  return `https://web.whatsapp.com/send?phone=${cleanPhone}${encodedText ? `&text=${encodedText}` : ""}`;
}

/**
 * Format phone for clear visual presentation e.g. +91 98765 43210
 */
export function formatDisplayPhone(rawPhone?: string | null): string {
  const clean = formatWhatsAppNumber(rawPhone);
  if (!clean) return "No Phone";
  if (clean.startsWith("91") && clean.length === 12) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  return `+${clean}`;
}


/**
 * Launch WhatsApp chat across Web and Mobile App.
 * Accesses the recipient's WhatsApp directly and pre-fills the message text.
 */
export function redirectToWhatsApp(rawPhone?: string | null, message?: string): boolean {
  if (typeof window === "undefined") return false;

  const cleanPhone = formatWhatsAppNumber(rawPhone);
  if (!cleanPhone) {
    console.warn("[WhatsApp] No valid phone number provided for WhatsApp redirect");
    alert("⚠️ Please provide a valid 10-digit mobile number for WhatsApp messaging.");
    return false;
  }

  const universalUrl = getWhatsAppUrl(cleanPhone, message);
  const nativeDeepLink = getWhatsAppNativeDeepLink(cleanPhone, message);

  // Check if running on Android/iOS (either in Capacitor mobile app or mobile browser)
  const userAgent = navigator.userAgent || "";
  const isMobileDevice = /Android|iPhone|iPad|iPod|webOS/i.test(userAgent);
  const isCapacitor = Boolean((window as any).Capacitor || (window as any).Android);

  try {
    if (isCapacitor || isMobileDevice) {
      // On mobile / Capacitor, attempt opening the native WhatsApp application first
      try {
        const anchor = document.createElement("a");
        anchor.href = nativeDeepLink;
        anchor.rel = "noopener noreferrer";
        anchor.target = "_self";
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => {
          if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
        }, 500);
      } catch (nativeErr) {
        // Fallback to universal URL
        window.location.href = universalUrl;
      }
    } else {
      // On Desktop Web browser, open in new tab (WhatsApp Web or Desktop App)
      const openedWindow = window.open(universalUrl, "_blank", "noopener,noreferrer");
      if (!openedWindow || openedWindow.closed || typeof openedWindow.closed === "undefined") {
        // Pop-up was blocked; use anchor element click
        const anchor = document.createElement("a");
        anchor.href = universalUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => {
          if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
        }, 500);
      }
    }
    return true;
  } catch (err) {
    console.error("[WhatsApp] Error opening WhatsApp:", err);
    // Final fallback
    window.location.href = universalUrl;
    return true;
  }
}

/**
 * Generate professional admission outreach templates
 */
export function getDefaultAdmissionWhatsAppText(student: {
  name: string;
  courseInterest?: string;
  campus?: string;
  cutoff?: number | string;
  stage?: string;
}): string {
  const name = student.name || "Student";
  const course = student.courseInterest || "Engineering Program";
  const campus = student.campus || "KARUR";

  return `Hello ${name}! Greetings from V.S.B. Engineering College (${campus} Campus). 

We are following up regarding your admission application for ${course}. Admissions for 2026-2027 are currently underway.

Please let us know if you need any assistance with:
1. TNEA Cutoff Eligibility & Management Quota
2. Detailed Fee Structure & Scholarships
3. Hostel & Bus Transport Facilities
4. Campus Visit & Lab Tour

Best regards,
V.S.B. Admissions Office
Phone: +91 6380270912`;
}
