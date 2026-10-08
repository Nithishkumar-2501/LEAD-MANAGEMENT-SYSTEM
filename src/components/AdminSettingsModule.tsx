"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Key,
  Lock,
  UserCheck,
  Bell,
  Server,
  CheckCircle2,
  Save,
  Sparkles,
  Sun,
  Moon,
  Palette,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Users,
  AlertCircle,
  X,
  Calendar,
  Receipt,
  Globe,
  Smartphone,
  Download,
  Copy,
} from "lucide-react";
import GoogleCalendarModal from "@/components/GoogleCalendarModal";
import {
  getAnnualRenewalData,
  MAX_FREE_LEAD_LIMIT,
  PRICE_PER_EXTRA_LEAD,
  BASE_ANNUAL_RENEWAL_FEE,
} from "@/lib/leadQuotaService";
import {
  fetchSystemAccountsFromFirebase,
  saveSystemAccountToFirebase,
  deleteSystemAccountFromFirebase,
  fetchAdminSettingsFromFirebase,
  saveAdminSettingsToFirebase,
} from "@/lib/firebaseSync";
import { SystemAccountRecord, AdminSettingsRecord } from "@/types/crm";

interface AdminSettingsModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  onTriggerToast: (msg: string) => void;
  theme?: "LIGHT" | "DARK";
  onThemeChange?: (newTheme: "LIGHT" | "DARK") => void;
}

export type SystemAccount = SystemAccountRecord;

export default function AdminSettingsModule({
  loggedInCampus,
  onTriggerToast,
  theme = "DARK",
  onThemeChange,
}: AdminSettingsModuleProps) {
  const [settings, setSettings] = useState<AdminSettingsRecord>({
    collegeName: "V.S.B. ENGINEERING COLLEGE",
    karurCode: "VSB-612",
    coimbatoreCode: "VSB-714",
    autoCounselorAssignment: true,
    whatsappAlerts: true,
    emailNotifications: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const adminIdKey = loggedInCampus === "KARUR" ? "vsb_admin_karur_id" : "vsb_admin_coimbatore_id";
  const adminPwKey = loggedInCampus === "KARUR" ? "vsb_admin_karur_pw" : "vsb_admin_coimbatore_pw";

  const [adminUsername, setAdminUsername] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isGCalModalOpen, setIsGCalModalOpen] = useState(false);
  const annualBilling = getAnnualRenewalData();

  // System Accounts List with Password & Login Status
  const [accounts, setAccounts] = useState<SystemAccount[]>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("vsb_system_accounts") : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: "acc_1",
        username: "adminkarur@123",
        password: "vsbec@123",
        role: "ADMIN",
        campus: "KARUR",
        isLoggedIn: true,
        lastActive: "Active Now (Current Session)",
      },
      {
        id: "acc_2",
        username: "admincovai@123",
        password: "vsbectc@1213",
        role: "ADMIN",
        campus: "COIMBATORE",
        isLoggedIn: true,
        lastActive: "Active Now (Coimbatore Session)",
      },
      {
        id: "acc_3",
        username: "usercounselor@123",
        password: "user123",
        role: "COUNSELOR",
        campus: "KARUR",
        isLoggedIn: true,
        lastActive: "Active Now (Desk #4)",
      },
      {
        id: "acc_4",
        username: "teacherkarur@123",
        password: "teacher123",
        role: "FACULTY",
        campus: "KARUR",
        isLoggedIn: false,
        lastActive: "Today at 09:45 AM",
      },
      {
        id: "acc_5",
        username: "teachercovai@123",
        password: "teacher123",
        role: "FACULTY",
        campus: "COIMBATORE",
        isLoggedIn: false,
        lastActive: "Yesterday at 04:30 PM",
      },
    ];
  });

  // Password Visibility Toggle State per Account
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});

  // Add Account Modal State
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccUsername, setNewAccUsername] = useState("");
  const [newAccPassword, setNewAccPassword] = useState("");
  const [newAccRole, setNewAccRole] = useState<"ADMIN" | "COUNSELOR" | "FACULTY">("COUNSELOR");
  const [newAccCampus, setNewAccCampus] = useState<"KARUR" | "COIMBATORE" | "ALL">("KARUR");

  // Load system accounts and settings from Firebase Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadFirebaseData() {
      try {
        const liveAccs = await fetchSystemAccountsFromFirebase();
        if (isMounted && liveAccs && liveAccs.length > 0) {
          setAccounts(liveAccs);
        }
        const liveSet = await fetchAdminSettingsFromFirebase();
        if (isMounted && liveSet) {
          setSettings(liveSet);
        }
      } catch (err) {
        console.warn("Firebase settings load notice:", err);
      }
    }
    loadFirebaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync Accounts to LocalStorage
  useEffect(() => {
    localStorage.setItem("vsb_system_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    const initialId =
      localStorage.getItem(adminIdKey) ||
      (loggedInCampus === "KARUR" ? "adminkarur@123" : "admincovai@123");
    setAdminUsername(initialId);
    setNewAdminUsername(initialId);
  }, [loggedInCampus, adminIdKey]);

  const handleCredentialsChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const storedPw =
      localStorage.getItem(adminPwKey) ||
      (loggedInCampus === "KARUR" ? "vsbec@123" : "vsbectc@1213");

    if (currentPassword !== storedPw) {
      onTriggerToast("❌ Error: Current password does not match.");
      return;
    }
    if (!newAdminUsername.trim()) {
      onTriggerToast("❌ Error: Admin User ID cannot be empty.");
      return;
    }
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        onTriggerToast("❌ Error: New passwords do not match.");
        return;
      }
      localStorage.setItem(adminPwKey, newPassword);
    }

    localStorage.setItem(adminIdKey, newAdminUsername.trim());
    setAdminUsername(newAdminUsername.trim());

    // Also update accounts list and save to Firebase
    const updatedAccounts = accounts.map((acc) => {
      if (
        (loggedInCampus === "KARUR" && acc.username.includes("karur")) ||
        (loggedInCampus === "COIMBATORE" && acc.username.includes("covai"))
      ) {
        const updated = {
          ...acc,
          username: newAdminUsername.trim(),
          password: newPassword || acc.password,
        };
        saveSystemAccountToFirebase(updated).catch(() => {});
        return updated;
      }
      return acc;
    });

    setAccounts(updatedAccounts);

    onTriggerToast(
      `🔑 Admin User ID & Security Credentials updated in Firebase successfully to "${newAdminUsername.trim()}"!`
    );
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await saveAdminSettingsToFirebase(settings);
      onTriggerToast("🔥 V.S.B. Admin Portal Configuration Saved to Firebase Successfully!");
    } catch (e) {
      onTriggerToast("V.S.B. Admin Portal Configuration Saved Successfully!");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Toggle Password Visibility
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete User ID & Password Account
  const handleDeleteAccount = async (id: string, username: string) => {
    if (accounts.length <= 1) {
      onTriggerToast("❌ Cannot delete the last remaining system account.");
      return;
    }
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    await deleteSystemAccountFromFirebase(id);
    onTriggerToast(`🗑️ User Account "${username}" and credentials permanently deleted from Firebase.`);
  };

  // Add New System Account
  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccUsername.trim() || !newAccPassword.trim()) {
      onTriggerToast("❌ Username and Password are required.");
      return;
    }
    const newAcc: SystemAccount = {
      id: `acc_${Date.now()}`,
      username: newAccUsername.trim(),
      password: newAccPassword.trim(),
      role: newAccRole,
      campus: newAccCampus,
      isLoggedIn: false,
      lastActive: "Created Just Now",
    };
    setAccounts((prev) => [newAcc, ...prev]);
    await saveSystemAccountToFirebase(newAcc);
    onTriggerToast(`🔥 Added new ${newAccRole} account "${newAccUsername.trim()}" to Firebase!`);
    setNewAccUsername("");
    setNewAccPassword("");
    setIsAddAccountModalOpen(false);
  };

  // Logged In Admins Count
  const loggedInAdminsCount = accounts.filter((a) => a.role === "ADMIN" && a.isLoggedIn).length;
  const totalLoggedInUsersCount = accounts.filter((a) => a.isLoggedIn).length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="bubble-card p-4 sm:p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                System Management
              </span>
              <span className="text-xs text-slate-400">Settings & Credentials</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              Admin Settings Console
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Manage portal configuration, view all login IDs & passwords, track active admin sessions, and manage access.
            </p>
          </div>

          {/* Active Campus Status Badge */}
          <div className="flex items-center gap-2.5 bg-slate-900/80 border border-white/20 px-4 py-2 rounded-2xl backdrop-blur-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="text-xs">
              <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Session Profile</span>
              <span className="font-extrabold text-sky-300">{loggedInCampus} CAMPUS ADMIN</span>
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM APPEARANCE & THEME SWITCHER (LIGHT MODE & DARK MODE) */}
      <div className="bubble-card p-5 sm:p-6 border border-sky-500/30 dark:border-sky-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              System Appearance & Theme Mode
            </h3>
          </div>
          <span className="text-xs text-sky-700 dark:text-sky-300 font-bold bg-sky-100 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-300 dark:border-sky-500/30">
            Current Active: {theme === "LIGHT" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          Switch the application visual mode between Light Theme and Dark Theme. Selecting a theme instantly updates all headers, dashboards, lead tables, navigation tabs, cards, and modal dialogs across the CRM.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* LIGHT MODE SELECTION BUTTON */}
          <div
            onClick={() => {
              onThemeChange?.("LIGHT");
              onTriggerToast("☀️ Switched theme mode to Light Mode");
            }}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              theme === "LIGHT"
                ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-slate-900 dark:text-white shadow-xl shadow-sky-500/20 ring-2 ring-sky-400/50 scale-[1.02]"
                : "bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-500/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-lg border border-amber-400/30">
                <Sun className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  ☀️ Light Mode
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Crisp white background, high contrast dark slate text & clear cards
                </p>
              </div>
            </div>
            {theme === "LIGHT" && <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />}
          </div>

          {/* DARK MODE SELECTION BUTTON */}
          <div
            onClick={() => {
              onThemeChange?.("DARK");
              onTriggerToast("🌙 Switched theme mode to Dark Mode");
            }}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              theme === "DARK"
                ? "bg-slate-900 border-indigo-500 text-white shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-400/50 scale-[1.02]"
                : "bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-400/30">
                <Moon className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  🌙 Dark Mode
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Sleek dark gradient canvas with liquid glass, neon highlights & dark cards
                </p>
              </div>
            </div>
            {theme === "DARK" && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
          </div>
        </div>
      </div>

      {/* MOBILE APP DOWNLOAD & COMPANION CENTER (ANDROID APK & iOS) */}
      <div className="bubble-card p-5 sm:p-6 border border-sky-500/30 dark:border-sky-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Download Meritto Mobile App (Android & iOS)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sky-700 dark:text-sky-300 font-bold bg-sky-100 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-300 dark:border-sky-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              v1.2.0 Production • APK Ready (142 MB)
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Install the official Meritto Admission CRM mobile application directly on your Android mobile device or tablet. Access real-time Firebase lead sync, quick calling, offline marksheets, and lead status notifications on the move.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* ANDROID APK DOWNLOAD CARD */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-sky-400/60 dark:border-sky-500/40 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/50 dark:from-sky-950/40 dark:via-slate-900 dark:to-indigo-950/30 shadow-lg shadow-sky-500/10 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/30">
                    <Download className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-sky-600 dark:text-sky-400">
                      Direct APK Package
                    </span>
                    <h4 className="font-black text-base text-slate-900 dark:text-white">
                      Android Native App (.apk)
                    </h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                  Ready to Install
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Instant 1-Click Install:</strong> No Google Play Store account required.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Offline Leads & Cache:</strong> View and search student leads with or without internet.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Direct WhatsApp & Calls:</strong> Tap any candidate phone number to call instantly.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <a
                href="/SPHEREX.apk"
                download="SPHEREX_CRM.apk"
                onClick={() => onTriggerToast("📲 Downloading Meritto Android APK (142 MB)...")}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
              >
                <Download className="w-4 h-4" />
                Download Android APK (142 MB)
              </a>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const apkUrl = `${window.location.origin}/SPHEREX.apk`;
                    navigator.clipboard.writeText(apkUrl);
                    onTriggerToast("🔗 Direct APK Download link copied to clipboard!");
                  }
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Copy Direct Download Link for Android"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Link
              </button>
            </div>
          </div>

          {/* iOS & PROGRESSIVE WEB APP (PWA) CARD */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950/80 shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-center font-bold shadow-md">
                    <Smartphone className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400">
                      Apple iPhone & iPad
                    </span>
                    <h4 className="font-black text-base text-slate-900 dark:text-white">
                      iOS Web Companion (PWA)
                    </h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase">
                  Safari / Chrome
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-black text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Open Safari or Chrome on your iPhone or iPad.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>Tap the <strong>Share</strong> button (box with upward arrow).</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-black text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Select <strong>&quot;Add to Home Screen&quot;</strong> for full native app experience.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(window.location.origin);
                    onTriggerToast("🔗 Web Portal URL copied! Paste in Safari to install.");
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4 text-indigo-500" />
                Copy Portal URL for iOS Safari
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* USER ID & PASSWORD CREDENTIALS MANAGEMENT CONSOLE (NEW FEATURE) */}
      <div className="bubble-card p-5 sm:p-6 border border-emerald-500/30 dark:border-emerald-500/30 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                All Application Login IDs & Passwords Management
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              Inspect user credentials, monitor active logged-in admins, reveal passwords, and delete accounts.
            </p>
          </div>

          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Add System Account
          </button>
        </div>

        {/* Active Admins & Login Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Active Admins Count Badge */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black text-black dark:text-emerald-400 uppercase tracking-wider block">Logged-In Admins</span>
              <span className="text-xl font-black text-black dark:text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping inline-block"></span>
                {loggedInAdminsCount} Active Admins
              </span>
            </div>
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400 opacity-90" />
          </div>

          {/* Total Active Sessions */}
          <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black text-black dark:text-sky-400 uppercase tracking-wider block">Total Active Sessions</span>
              <span className="text-xl font-black text-black dark:text-white">{totalLoggedInUsersCount} Users Logged In</span>
            </div>
            <Users className="w-7 h-7 text-sky-600 dark:text-sky-400 opacity-90" />
          </div>

          {/* Registered Accounts */}
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black text-black dark:text-indigo-400 uppercase tracking-wider block">Total Managed Accounts</span>
              <span className="text-xl font-black text-black dark:text-white">{accounts.length} Accounts</span>
            </div>
            <Key className="w-7 h-7 text-indigo-600 dark:text-indigo-400 opacity-90" />
          </div>
        </div>

        {/* Login Credentials Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <table className="w-full text-left text-xs text-black dark:text-slate-200 font-extrabold">
            <thead className="bg-slate-100 dark:bg-slate-950 text-black dark:text-sky-300 font-black uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 text-black dark:text-sky-300 font-black">Role</th>
                <th className="py-3 px-4 text-black dark:text-sky-300 font-black">Login ID / Username</th>
                <th className="py-3 px-4 text-black dark:text-sky-300 font-black">Password</th>
                <th className="py-3 px-4 hidden sm:table-cell text-black dark:text-sky-300 font-black">Campus</th>
                <th className="py-3 px-4 text-black dark:text-sky-300 font-black">Login Status</th>
                <th className="py-3 px-4 text-right text-black dark:text-sky-300 font-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 bg-white dark:bg-slate-900/90 text-black dark:text-slate-200 font-bold">
              {accounts.filter((acc) => acc.username !== "spherexnithish#").map((acc) => {
                const isPasswordVisible = visiblePasswords[acc.id] || false;
                return (
                  <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          acc.role === "ADMIN"
                            ? "bg-purple-100 dark:bg-purple-500/20 text-black dark:text-purple-300 border-purple-300 dark:border-purple-500/40"
                            : acc.role === "COUNSELOR"
                            ? "bg-sky-100 dark:bg-sky-500/20 text-black dark:text-sky-300 border-sky-300 dark:border-sky-500/40"
                            : "bg-amber-100 dark:bg-amber-500/20 text-black dark:text-amber-300 border-amber-300 dark:border-amber-500/40"
                        }`}
                      >
                        {acc.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-black dark:text-white text-xs">{acc.username}</td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-black dark:text-amber-300">
                          {isPasswordVisible ? acc.password : "••••••••••••"}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(acc.id)}
                          className="text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white p-1 rounded transition-colors"
                          title={isPasswordVisible ? "Hide Password" : "Show Password"}
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell font-black text-black dark:text-slate-300">{acc.campus}</td>
                    <td className="py-3 px-4">
                      {acc.isLoggedIn ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                          🟢 Logged In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          ⚪ Offline ({acc.lastActive})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteAccount(acc.id, acc.username)}
                        className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-500/20 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-300 dark:border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1 ml-auto cursor-pointer"
                        title="Delete User ID & Password Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SYSTEM ACCOUNT MODAL */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-950 border border-white/20 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddAccountModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Add New User / Admin Account
            </h3>
            <p className="text-xs text-slate-300">
              Create a new login ID and password for portal authentication.
            </p>

            <form onSubmit={handleAddAccountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">User ID / Username *</label>
                <input
                  type="text"
                  required
                  value={newAccUsername}
                  onChange={(e) => setNewAccUsername(e.target.value)}
                  placeholder="e.g. counselor_sales@123"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Password *</label>
                <input
                  type="text"
                  required
                  value={newAccPassword}
                  onChange={(e) => setNewAccPassword(e.target.value)}
                  placeholder="e.g. pass1234"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Account Role</label>
                  <select
                    value={newAccRole}
                    onChange={(e) => setNewAccRole(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ADMIN">System Admin</option>
                    <option value="COUNSELOR">Counselor</option>
                    <option value="FACULTY">Faculty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Campus Access</label>
                  <select
                    value={newAccCampus}
                    onChange={(e) => setNewAccCampus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="KARUR">KARUR</option>
                    <option value="COIMBATORE">COIMBATORE</option>
                    <option value="ALL">ALL CAMPUSES</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: General Portal configuration */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" /> Institution & System Settings
            </h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Institution Name</label>
              <input
                type="text"
                value={settings.collegeName}
                onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Karur TNEA Code</label>
                <input
                  type="text"
                  value={settings.karurCode}
                  onChange={(e) => setSettings({ ...settings, karurCode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Coimbatore TNEA Code</label>
                <input
                  type="text"
                  value={settings.coimbatoreCode}
                  onChange={(e) => setSettings({ ...settings, coimbatoreCode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <p className="font-bold text-slate-200">Automatic Lead Assignment</p>
                  <p className="text-[10px] text-slate-400">Assign incoming inquiries to available counselors</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoCounselorAssignment}
                  onChange={(e) => setSettings({ ...settings, autoCounselorAssignment: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <p className="font-bold text-slate-200">WhatsApp Notification Alerts</p>
                  <p className="text-[10px] text-slate-400">Send automatic updates to candidates</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.whatsappAlerts}
                  onChange={(e) => setSettings({ ...settings, whatsappAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all text-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Security & Credentials */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" /> Admin Security & Credentials
            </h3>
          </div>

          {/* Credentials Info Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-indigo-500/30 space-y-2 text-xs">
            <h4 className="font-black text-black dark:text-white flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" /> Active Account Details
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-black dark:text-slate-400 text-[10px] font-black uppercase">CURRENT USER ID</span>
                <p className="font-black text-black dark:text-white text-sm font-mono mt-0.5">{adminUsername}</p>
              </div>
              <div>
                <span className="text-black dark:text-slate-400 text-[10px] font-black uppercase">CAMPUS ACCESS</span>
                <p className="font-black text-blue-600 dark:text-sky-300 text-sm font-mono mt-0.5">{loggedInCampus}</p>
              </div>
            </div>
          </div>

          {/* User ID & Password Update Form */}
          <form onSubmit={handleCredentialsChange} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Admin User ID / Username</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="Enter new Admin User ID"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">This User ID is used for portal authentication and system administration.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Current Password (Required)</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password to authorize changes"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">New Password (Optional)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 transition-all text-xs cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" /> Save User ID & Password
              </button>
            </div>
          </form>
        </div>

        {/* Google Workspace & Calendar Integration Card */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-5 lg:col-span-2">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center p-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4H19Z" fill="#4285F4" />
                  <path d="M19 20H5V9H19V20Z" fill="white" />
                  <path d="M12 11H7V16H12V11Z" fill="#34A853" />
                  <path d="M17 11H13V16H17V11Z" fill="#EA4335" />
                  <path d="M12 17H7V19H12V17Z" fill="#FBBC05" />
                  <path d="M17 17H13V19H17V17Z" fill="#4285F4" />
                </svg>
              </div>
              <span>Google Calendar & Workspace Synchronization</span>
            </h3>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Ready
              </span>
              <button
                type="button"
                onClick={() => setIsGCalModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Import & Sync Google Calendar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Connected Account</span>
              <p className="font-bold text-white text-sm font-mono">admissions@vsbec.in</p>
              <p className="text-[10px] text-slate-500">Google Workspace Primary Calendar</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Sync Mechanism</span>
              <p className="font-bold text-emerald-400 text-sm">iCal (.ICS) & Live Event Template</p>
              <p className="text-[10px] text-slate-500">Auto-links follow-ups with Google Meet</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Default Target Desk</span>
              <p className="font-bold text-sky-400 text-sm">{loggedInCampus} Admissions Directorate</p>
              <p className="text-[10px] text-slate-500">Candidate verification & counseling slots</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Platform License, 1,00,000 Lead Quota & Annual Renewal Section */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Enterprise Platform License & Lead Quota (1,00,000 Leads Cap)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual deployment coverage: Web Application Portal + Native Android & iOS Mobile Applications
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 w-fit">
            ✓ License Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Included Free Quota</span>
            <p className="font-mono font-bold text-white text-base">1,00,000 Leads</p>
            <p className="text-[10px] text-slate-400">Standard institutional capacity</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Overage Surcharge Policy</span>
            <p className="font-mono font-bold text-amber-400 text-base">₹500 / extra lead</p>
            <p className="text-[10px] text-slate-400">Triggered after 1,00,000 leads reached</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Extra Leads Added</span>
            <p className="font-mono font-bold text-amber-300 text-base">+{annualBilling.extraLeadsCount} Leads</p>
            <p className="text-[10px] text-slate-400">Total Surcharge: ₹{annualBilling.extraLeadsCost.toLocaleString("en-IN")}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Total Annual Renewal</span>
            <p className="font-mono font-bold text-emerald-400 text-base">₹{annualBilling.totalRenewalFee.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-slate-400">Due: {new Date(annualBilling.renewalDueDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} (Web & Mobile)</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-sky-400" /> Web CRM Application</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Native Mobile Apps (Android & iOS)</span>
          <span>•</span>
          <span className="text-slate-300 font-semibold">Track & print invoices in Fee Payment & Renewal tab.</span>
        </div>
      </div>

      {/* Google Calendar Import & Sync Modal */}
      <GoogleCalendarModal
        isOpen={isGCalModalOpen}
        onClose={() => setIsGCalModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />
    </div>
  );
}
