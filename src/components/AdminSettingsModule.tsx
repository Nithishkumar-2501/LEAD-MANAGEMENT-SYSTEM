"use client";

import { useState } from "react";
import { ShieldCheck, Key, Lock, UserCheck, Bell, Server, CheckCircle2, Save } from "lucide-react";

interface AdminSettingsModuleProps {
  onTriggerToast: (msg: string) => void;
}

export default function AdminSettingsModule({ onTriggerToast }: AdminSettingsModuleProps) {
  const [settings, setSettings] = useState({
    adminEmail: "admin@vsb",
    collegeName: "V.S.B. ENGINEERING COLLEGE",
    karurCode: "VSB-612",
    coimbatoreCode: "VSB-714",
    autoCounselorAssignment: true,
    whatsappAlerts: true,
    emailNotifications: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerToast("V.S.B. Admin Portal Configuration Saved Successfully!");
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" /> Admin System Controls & Security
          </h3>
          <p className="text-xs text-slate-400">Manage V.S.B. Karur & Coimbatore portal settings and access credentials</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 text-xs">
        {/* Credentials Info Box */}
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-2">
          <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-emerald-400" /> Admin Access Credentials
          </h4>
          <div className="grid grid-cols-2 gap-3 text-slate-300">
            <div>
              <span className="text-slate-400">Admin Email:</span>
              <p className="font-bold text-white font-mono mt-0.5">{settings.adminEmail}</p>
            </div>
            <div>
              <span className="text-slate-400">Current Password:</span>
              <p className="font-bold text-white font-mono mt-0.5">admin@1234</p>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Institution Name</label>
            <input
              type="text"
              value={settings.collegeName}
              onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Karur TNEA Code</label>
            <input
              type="text"
              value={settings.karurCode}
              onChange={(e) => setSettings({ ...settings, karurCode: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <p className="font-semibold text-slate-200">Automatic Lead Assignment</p>
              <p className="text-[11px] text-slate-400">Automatically assign incoming TNEA inquiries to available counselors</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoCounselorAssignment}
              onChange={(e) => setSettings({ ...settings, autoCounselorAssignment: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <p className="font-semibold text-slate-200">WhatsApp Notification Alerts</p>
              <p className="text-[11px] text-slate-400">Send automatic WhatsApp admission updates to applicants</p>
            </div>
            <input
              type="checkbox"
              checked={settings.whatsappAlerts}
              onChange={(e) => setSettings({ ...settings, whatsappAlerts: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
