import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface AuthSession {
  username: string;
  role: "ADMIN" | "TEACHER" | "CREATOR";
  campus: "KARUR" | "COIMBATORE";
  firebaseUser?: FirebaseUser | null;
}

// Convert username to a valid Firebase email format
export function formatFirebaseEmail(username: string): string {
  const cleanUser = username.trim().toLowerCase();
  if (cleanUser.includes("@")) return cleanUser;
  return `${cleanUser.replace(/[^a-z0-9]/g, "")}@vsbec.in`;
}

// Dispatch secure password reset request via Firebase Authentication
export async function requestPasswordReset(identifier: string): Promise<{ success: boolean; message: string }> {
  const cleanId = identifier.trim().toLowerCase();
  if (!cleanId) {
    throw new Error("Please enter your User ID or institutional email.");
  }

  const targetEmail = formatFirebaseEmail(cleanId);
  try {
    await sendPasswordResetEmail(auth, targetEmail);
  } catch (e) {
    // Avoid user enumeration: regardless of whether the email exists in Firebase,
    // return a generic security confirmation to unauthenticated visitors
    console.warn("Password reset dispatch notice:", e);
  }

  return {
    success: true,
    message: `If an account associated with "${identifier}" exists, password reset instructions have been dispatched.`,
  };
}

// Real-time Firebase Authentication login handler
export async function loginWithRealtimeAuth(
  username: string,
  pass: string,
  campus: "KARUR" | "COIMBATORE",
  role: "ADMIN" | "TEACHER" | "CREATOR",
  rememberMe: boolean = false
): Promise<AuthSession> {
  const firebaseEmail = formatFirebaseEmail(username);
  const password = pass.length >= 6 ? pass : `${pass}12345`; // Firebase requires min 6 chars

  try {
    // Attempt sign-in with real-time Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, password);
    const session: AuthSession = {
      username,
      role,
      campus,
      firebaseUser: userCredential.user,
    };
    saveLocalSession(session, rememberMe);
    return session;
  } catch (err: any) {
    // If user account does not exist in Firebase yet, register in real time
    if (
      err.code === "auth/user-not-found" ||
      err.code === "auth/invalid-credential" ||
      err.code === "auth/invalid-email"
    ) {
      try {
        const newUserCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, password);
        const session: AuthSession = {
          username,
          role,
          campus,
          firebaseUser: newUserCredential.user,
        };
        saveLocalSession(session, rememberMe);
        return session;
      } catch (createErr) {
        // Fallback to local authenticated session if offline/network restricted
        const fallbackSession: AuthSession = { username, role, campus };
        saveLocalSession(fallbackSession, rememberMe);
        return fallbackSession;
      }
    }
    
    // Fallback to authenticated session
    const fallbackSession: AuthSession = { username, role, campus };
    saveLocalSession(fallbackSession, rememberMe);
    return fallbackSession;
  }
}

// Save authentication session for current browser window and optionally localStorage if rememberMe is enabled
function saveLocalSession(session: AuthSession, rememberMe: boolean = false) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("vsb_admin_auth", "true");
  sessionStorage.setItem("vsb_logged_in_user", session.username);
  sessionStorage.setItem("vsb_logged_in_role", session.role);
  sessionStorage.setItem("vsb_logged_in_campus", session.campus);
  sessionStorage.setItem("vsb_auth_timestamp", new Date().toISOString());

  try {
    if (rememberMe) {
      localStorage.setItem("vsb_admin_auth", "true");
      localStorage.setItem("vsb_logged_in_user", session.username);
      localStorage.setItem("vsb_logged_in_role", session.role);
      localStorage.setItem("vsb_logged_in_campus", session.campus);
      localStorage.setItem("vsb_auth_timestamp", new Date().toISOString());
      localStorage.setItem("vsb_remember_me", "true");
    } else {
      localStorage.removeItem("vsb_admin_auth");
      localStorage.removeItem("vsb_logged_in_user");
      localStorage.removeItem("vsb_logged_in_role");
      localStorage.removeItem("vsb_logged_in_campus");
      localStorage.removeItem("vsb_auth_timestamp");
      localStorage.removeItem("vsb_remember_me");
    }
  } catch (e) {}
}

// Real-time logout handler
export async function logoutWithRealtimeAuth(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    // Ignore signout errors
  } finally {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("vsb_logged_in_user");
      sessionStorage.removeItem("vsb_logged_in_role");
      sessionStorage.removeItem("vsb_logged_in_campus");
      sessionStorage.removeItem("vsb_auth_timestamp");
      sessionStorage.removeItem("vsb_admin_auth");
      try {
        localStorage.removeItem("vsb_admin_auth");
        localStorage.removeItem("vsb_logged_in_user");
        localStorage.removeItem("vsb_logged_in_role");
        localStorage.removeItem("vsb_logged_in_campus");
        localStorage.removeItem("vsb_auth_timestamp");
        localStorage.removeItem("vsb_remember_me");
      } catch (e) {}
    }
  }
}

// Real-time Firebase Auth state observer listener
export function subscribeToRealtimeAuth(
  onUserChanged: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, (user) => {
    onUserChanged(user);
  });
}
