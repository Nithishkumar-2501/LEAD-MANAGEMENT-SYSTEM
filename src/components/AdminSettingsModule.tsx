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
  X
} from "lucide-react";

interface AdminSettingsModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  onTriggerToast: (msg: string) => void;
  theme?: "LIGHT" | "DARK";
  onThemeChange?: (newTheme: "LIGHT" | "DARK") => void;
}

interface SystemAccount {
  id: string;
  username: string;
  password: string;
  role: "ADMIN" | "COUNSELOR" | "FACULTY";
  campus: "KARUR" | "COIMBATORE" | "ALL";
  isLoggedIn: boolean;
  lastActive: string;
}

export default function AdminSettingsModule({
  loggedInCampus,
  onTriggerToast,
  theme = "DARK",
  onThemeChange,
}: AdminSettingsModuleProps) {
  const [settings, setSettings] = useState({
    collegeName: "V.S.B. ENGINEERING COLLEGE",
    karurCode: "VSB-612",
    coimbatoreCode: "VSB-714",
    autoCounselorAssignment: true,
    whatsappAlerts: true,
    emailNotifications: true,
  });

  const adminIdKey = loggedInCampus === "KARUR" ? "vsb_admin_karur_id" : "vsb_admin_coimbatore_id";
  const adminPwKey = loggedInCampus === "KARUR" ? "vsb_admin_karur_pw" : "vsb_admin_coimbatore_pw";

  const [adminUsername, setAdminUsername] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const handleCredentialsChange = (e: React.FormEvent) => {
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

    // Also update accounts list
    setAccounts((prev) =>
      prev.map((acc) => {
        if (
          (loggedInCampus === "KARUR" && acc.username.includes("karur")) ||
          (loggedInCampus === "COIMBATORE" && acc.username.includes("covai"))
        ) {
          return {
            ...acc,
            username: newAdminUsername.trim(),
            password: newPassword || acc.password,
          };
        }
        return acc;
      })
    );

    onTriggerToast(
      `🔑 Admin User ID & Security Credentials updated successfully to "${newAdminUsername.trim()}"!`
    );
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerToast("V.S.B. Admin Portal Configuration Saved Successfully!");
  };

  // Toggle Password Visibility
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Delete User ID & Password Account
  const handleDeleteAccount = (id: string, username: string) => {
    if (accounts.length <= 1) {
      onTriggerToast("❌ Cannot delete the last remaining system account.");
      return;
    }
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    onTriggerToast(`🗑️ User Account "${username}" and credentials permanently deleted.`);
  };

  // Add New System Account
  const handleAddAccountSubmit = (e: React.FormEvent) => {
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
    onTriggerToast(`✅ Added new ${newAccRole} account "${newAccUsername.trim()}"!`);
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
      <div className="bubble-card p-5 sm:p-6 border border-sky-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              System Appearance & Theme Mode
            </h3>
          </div>
          <span className="text-xs text-sky-300 font-bold bg-sky-950/60 px-3 py-1 rounded-full border border-sky-500/30">
            Current Active: {theme === "LIGHT" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Switch the application visual mode between Light Theme and Dark Theme. Selecting a theme instantly updates all headers, dashboards, lead tables, navigation tabs, cards, and modal dialogs across the CRM.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* LIGHT MODE SELECTION BUTTON */}
          <div
            onClick={() => onThemeChange?.("LIGHT")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              theme === "LIGHT"
                ? "bg-slate-100 border-sky-500 text-slate-900 shadow-xl shadow-sky-500/20 ring-2 ring-sky-400/50 scale-[1.02]"
                : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-sky-500/50 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-lg border border-amber-400/30">
                <Sun className="w-5 h-5 text-amber-400" />
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
            onClick={() => onThemeChange?.("DARK")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              theme === "DARK"
                ? "bg-slate-900 border-indigo-500 text-white shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-400/50 scale-[1.02]"
                : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-400/30">
                <Moon className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  🌙 Dark Mode
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Sleek dark gradient canvas with liquid glass, neon highlights & dark cards
                </p>
              </div>
            </div>
            {theme === "DARK" && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
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
              {accounts.map((acc) => {
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
      </div>
    </div>
  );
}
