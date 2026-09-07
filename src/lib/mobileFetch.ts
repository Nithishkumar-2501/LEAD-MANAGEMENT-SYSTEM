/**
 * Mobile-safe fetch utility for Capacitor apps.
 * When running inside a Capacitor native shell, there is no Next.js server,
 * so API route calls (e.g. /api/applications) will fail.
 * This wrapper detects the Capacitor environment and gracefully skips
 * server-side API calls, returning null so the caller can fall back to Firebase.
 */

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Capacitor?.isNativePlatform?.() || !!(window as any).Capacitor;
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
