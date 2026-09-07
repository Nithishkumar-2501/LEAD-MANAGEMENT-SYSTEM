/**
 * Cross-platform telephone dialer utility for SPHEREX CRM.
 * Redirects directly to the native phone dial pad in both Mobile App (Capacitor/Android/iOS)
 * and Web Browsers (Chrome, Safari, Firefox, Edge, etc.).
 */
export function redirectToDialPad(rawPhone?: string | null): void {
  if (!rawPhone || typeof rawPhone !== "string") {
    console.warn("[Dialer] No valid phone number provided to redirectToDialPad");
    return;
  }

  // Clean raw input: keep digits and optional leading '+'
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, "");
  if (!cleaned) return;

  // Standardize 10-digit Indian numbers with +91 if country code isn't present
  if (cleaned.length === 10 && !cleaned.startsWith("+")) {
    cleaned = `+91${cleaned}`;
  }

  const telUri = `tel:${cleaned}`;

  if (typeof window !== "undefined") {
    try {
      // Create and trigger an anchor element click to open dialer
      const anchor = document.createElement("a");
      anchor.href = telUri;
      anchor.rel = "noopener noreferrer";
      anchor.setAttribute("target", "_self");
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
    } catch (err) {
      // Fallback
      window.location.href = telUri;
    }
  }
}

/**
 * Helper to get clean tel: URI for direct href usage on <a> tags
 */
export function getCleanTelUri(rawPhone?: string | null): string {
  if (!rawPhone || typeof rawPhone !== "string") return "tel:";
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, "");
  if (cleaned.length === 10 && !cleaned.startsWith("+")) {
    cleaned = `+91${cleaned}`;
  }
  return `tel:${cleaned}`;
}
