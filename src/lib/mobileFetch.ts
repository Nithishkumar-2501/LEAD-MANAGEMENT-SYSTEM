/**
 * Mobile-safe fetch utility for Capacitor apps.
 * When running inside a Capacitor native shell, there is no Next.js server,
 * so API route calls (e.g. /api/applications) will fail.
 * This wrapper detects the Capacitor environment and gracefully skips
 * server-side API calls, returning null so the caller can fall back to Firebase.
 */

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as any).Capacitor;
  if (cap) {
    if (typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) {
      return true;
    }
    const platform = typeof cap.getPlatform === "function" ? cap.getPlatform() : "";
    if (platform === "android" || platform === "ios") return true;
  }
  // Check Capacitor URL schemes
  if (window.location && (window.location.protocol === "capacitor:" || window.location.hostname === "localhost" && /Android/i.test(navigator.userAgent))) {
    return true;
  }
  return false;
}

/**
 * Universal Mobile Environment Detector:
 * Returns true if running as native Capacitor app, inside an Android WebView,
 * on a mobile smartphone/tablet browser, or in responsive mobile mode.
 */
export function isMobileDeviceOrApp(): boolean {
  if (typeof window === "undefined") return false;
  if (isCapacitorNative()) return true;
  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || "").toLowerCase();
  if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua)) {
    return true;
  }
  if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 768px)").matches && "ontouchstart" in window) {
    return true;
  }
  return false;
}


/**
 * A drop-in replacement for `fetch()` that skips API route calls on mobile.
 * - If running on web (browser), behaves exactly like normal `fetch()`.
 * - If running in Capacitor (mobile), any request to `/api/...` returns `null`.
 */
export async function mobileSafeFetch(
  url: string,
  options?: RequestInit
): Promise<Response | null> {
  // Skip API route calls when running as a native mobile app
  if (isCapacitorNative() && url.startsWith("/api/")) {
    console.log(`📱 [Mobile] Skipping API route: ${url} (no server in native app)`);
    return null;
  }

  return fetch(url, options);
}
