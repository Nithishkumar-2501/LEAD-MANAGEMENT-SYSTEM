"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Key, Lock, UserCheck, Bell, Server, CheckCircle2, Save, Sparkles, Sun, Moon, Palette } from "lucide-react";

interface AdminSettingsModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  onTriggerToast: (msg: string) => void;
  theme?: "LIGHT" | "DARK";
  onThemeChange?: (newTheme: "LIGHT" | "DARK") => void;
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
              Manage portal configuration and security credentials for V.S.B. campuses.
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
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all text-xs"
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
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-indigo-950/40 border border-blue-200 dark:border-indigo-800/60 space-y-2 text-xs">
            <h4 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" /> Active Account Details
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-700 dark:text-slate-400 text-[10px] font-black uppercase">CURRENT USER ID</span>
                <p className="font-black text-black dark:text-white text-sm font-mono mt-0.5">{adminUsername}</p>
              </div>
              <div>
                <span className="text-slate-700 dark:text-slate-400 text-[10px] font-black uppercase">CAMPUS ACCESS</span>
                <p className="font-black text-sky-800 dark:text-sky-300 text-sm font-mono mt-0.5">{loggedInCampus}</p>
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
