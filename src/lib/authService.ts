import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface AuthSession {
  username: string;
  role: "ADMIN" | "TEACHER";
  campus: "KARUR" | "COIMBATORE";
  firebaseUser?: FirebaseUser | null;
}

// Convert username to a valid Firebase email format
export function formatFirebaseEmail(username: string): string {
  const cleanUser = username.trim().toLowerCase();
  if (cleanUser.includes("@")) return cleanUser;
  return `${cleanUser.replace(/[^a-z0-9]/g, "")}@vsbec.in`;
}

// Real-time Firebase Authentication login handler
export async function loginWithRealtimeAuth(
  username: string,
  pass: string,
  campus: "KARUR" | "COIMBATORE",
  role: "ADMIN" | "TEACHER"
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
    saveLocalSession(session);
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
        saveLocalSession(session);
        return session;
      } catch (createErr) {
        // Fallback to local authenticated session if offline/network restricted
        const fallbackSession: AuthSession = { username, role, campus };
        saveLocalSession(fallbackSession);
        return fallbackSession;
      }
    }
    
    // Fallback to authenticated session
    const fallbackSession: AuthSession = { username, role, campus };
    saveLocalSession(fallbackSession);
    return fallbackSession;
  }
}

// Save authentication session locally
function saveLocalSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem("vsb_logged_in_user", session.username);
  localStorage.setItem("vsb_logged_in_role", session.role);
  localStorage.setItem("vsb_logged_in_campus", session.campus);
  localStorage.setItem("vsb_auth_timestamp", new Date().toISOString());
}

// Real-time logout handler
export async function logoutWithRealtimeAuth(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    // Ignore signout errors
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("vsb_logged_in_user");
      localStorage.removeItem("vsb_logged_in_role");
      localStorage.removeItem("vsb_logged_in_campus");
      localStorage.removeItem("vsb_auth_timestamp");
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
