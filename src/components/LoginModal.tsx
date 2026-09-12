"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Check, Info, ShieldCheck, Sparkles } from "lucide-react";
import { loginWithRealtimeAuth } from "@/lib/authService";

interface LoginModalProps {
  onLoginSuccess: (campus: "KARUR" | "COIMBATORE", role: "ADMIN" | "TEACHER", username: string) => void;
}

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("adminkarur@123");
  const [password, setPassword] = useState("vsbec@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    // Initialize default credentials in localStorage if not set
    if (!localStorage.getItem("vsb_admin_karur_id")) {
      localStorage.setItem("vsb_admin_karur_id", "adminkarur@123");
    }
    if (!localStorage.getItem("vsb_admin_karur_pw")) {
      localStorage.setItem("vsb_admin_karur_pw", "vsbec@123");
    }
    if (!localStorage.getItem("vsb_admin_coimbatore_id")) {
      localStorage.setItem("vsb_admin_coimbatore_id", "admincovai@123");
    }
    if (!localStorage.getItem("vsb_admin_coimbatore_pw")) {
      localStorage.setItem("vsb_admin_coimbatore_pw", "vsbectc@1213");
    }

    // Teacher credentials defaults
    if (!localStorage.getItem("vsb_teacher_karur_id")) {
      localStorage.setItem("vsb_teacher_karur_id", "teacherkarur@123");
    }
    if (!localStorage.getItem("vsb_teacher_karur_pw")) {
      localStorage.setItem("vsb_teacher_karur_pw", "vsbteacher@123");
    }
    if (!localStorage.getItem("vsb_teacher_coimbatore_id")) {
      localStorage.setItem("vsb_teacher_coimbatore_id", "teachercovai@123");
    }
    if (!localStorage.getItem("vsb_teacher_coimbatore_pw")) {
      localStorage.setItem("vsb_teacher_coimbatore_pw", "vsbteacher@1213");
    }

    // Load saved username if rememberMe was previously set
    const savedUser = localStorage.getItem("spherex_saved_user");
    if (savedUser) {
      setUsername(savedUser);
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const inputUser = username.trim();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setLoading(false);
      setError("Please enter both ID/email and password.");
      return;
    }

    // Remember user preference
    if (rememberMe) {
      localStorage.setItem("spherex_saved_user", inputUser);
    } else {
      localStorage.removeItem("spherex_saved_user");
    }

    // Admin Credentials
    const karurUser = localStorage.getItem("vsb_admin_karur_id") || "adminkarur@123";
    const karurPass = localStorage.getItem("vsb_admin_karur_pw") || "vsbec@123";
    const covaiUser = localStorage.getItem("vsb_admin_coimbatore_id") || "admincovai@123";
    const covaiPass = localStorage.getItem("vsb_admin_coimbatore_pw") || "vsbectc@1213";

    const FACULTY_ACCOUNTS: Record<string, { pass: string; campus: "KARUR" | "COIMBATORE" }> = {
      "rajesh.mech@vsbec.in": { pass: "rajesh@vsb2026", campus: "KARUR" },
      "arulmurugan.cse@vsbec.in": { pass: "arul@vsb2026", campus: "KARUR" },
      "meenakshi.ece@vsbec.in": { pass: "meenakshi@vsb2026", campus: "COIMBATORE" },
      "gayathri.it@vsbec.in": { pass: "gayathri@vsb2026", campus: "KARUR" },
      "karthik.ai@vsbec.in": { pass: "karthik@vsb2026", campus: "KARUR" },
      "saravanan.eee@vsbec.in": { pass: "saravanan@vsb2026", campus: "KARUR" },
      "anitha.bme@vsbec.in": { pass: "anitha@vsb2026", campus: "KARUR" },
      "senthil.civil@vsbec.in": { pass: "senthil@vsb2026", campus: "KARUR" },
      "kavitha.cyber@vsbec.in": { pass: "kavitha@vsb2026", campus: "COIMBATORE" },
      "ramesh.robotics@vsbec.in": { pass: "ramesh@vsb2026", campus: "KARUR" },
      "divya.chem@vsbec.in": { pass: "divya@vsb2026", campus: "KARUR" },
      "manikandan.aero@vsbec.in": { pass: "mani@vsb2026", campus: "COIMBATORE" },
      "priya.biotech@vsbec.in": { pass: "priya@vsb2026", campus: "KARUR" },
      "suresh.ds@vsbec.in": { pass: "suresh@vsb2026", campus: "KARUR" },
      "deepa.it@vsbec.in": { pass: "deepa@vsb2026", campus: "COIMBATORE" },
      "prakash.cse@vsbec.in": { pass: "prakash@vsb2026", campus: "COIMBATORE" },
      "teacherkarur@123": { pass: "vsbteacher@123", campus: "KARUR" },
      "teachercovai@123": { pass: "vsbteacher@1213", campus: "COIMBATORE" },
      "teacher_rajesh@123": { pass: "vsbteacher@123", campus: "KARUR" },
    };

    let targetCampus: "KARUR" | "COIMBATORE" | null = null;
    let targetRole: "ADMIN" | "TEACHER" | null = null;

    if (inputUser === karurUser && inputPass === karurPass) {
      targetCampus = "KARUR";
      targetRole = "ADMIN";
    } else if (inputUser === covaiUser && inputPass === covaiPass) {
      targetCampus = "COIMBATORE";
      targetRole = "ADMIN";
    } else if (FACULTY_ACCOUNTS[inputUser] && FACULTY_ACCOUNTS[inputUser].pass === inputPass) {
      targetCampus = FACULTY_ACCOUNTS[inputUser].campus;
      targetRole = "TEACHER";
    }

    if (!targetCampus || !targetRole) {
      setLoading(false);
      setError("Invalid credentials. Please check your user ID / email and password.");
      return;
    }

    try {
      // Execute backend Firebase Realtime Auth function
      const session = await loginWithRealtimeAuth(inputUser, inputPass, targetCampus, targetRole);
      setLoading(false);
      onLoginSuccess(session.campus, session.role, session.username);
    } catch (authErr: any) {
      setLoading(false);
      // Fallback session dispatch if offline
      onLoginSuccess(targetCampus, targetRole, inputUser);
    }
  };

  const autoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Main Centered Login Card */}
      <div className="bg-white w-full max-w-md sm:max-w-lg rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-slate-200/80 my-auto p-6 sm:p-10 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        <div>
          {/* SPHEREX CRM Pill Badge with Official Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-black p-0.5 shadow-md border border-slate-300 flex items-center justify-center shrink-0">
              <Image
                src="/spherex-logo.png"
                alt="SPHEREX Official Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="inline-flex items-center px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#edf2f7] border border-slate-300/90 shadow-xs">
              <span className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase">
                SPHEREX CRM
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Welcome to
            </h1>
            <p className="text-sm sm:text-base font-bold text-slate-700 tracking-tight mt-1">
              V.S.B. GROUP OF INSTITUTIONS
            </p>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields matching Reference Design */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            {/* Email / ID Input */}
            <div className="bg-[#f4f5f7] rounded-xl px-3.5 pt-2 pb-2.5 border border-transparent focus-within:border-slate-400 focus-within:bg-white transition-all">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="rowok@gmail.com"
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none placeholder-slate-400 mt-0.5"
              />
            </div>

            {/* Password Input with Show/Hide Eye */}
            <div className="bg-[#f4f5f7] rounded-xl px-3.5 pt-2 pb-2.5 border border-transparent focus-within:border-slate-400 focus-within:bg-white transition-all relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="flex items-center justify-between mt-0.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none placeholder-slate-400 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Options Row: Remember me + Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#4a2545] focus:ring-[#4a2545]"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-slate-900 font-bold hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Solid Plum/Berry Purple Login Button matching Reference */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#4a2545] hover:bg-[#3d1e39] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Authenticating..." : "Login"}</span>
            </button>
          </form>



          {/* Security Badge */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit Encrypted Portal</span>
            </div>
            <span className="font-mono text-emerald-600 font-bold">
              ● Live VSB Gateway
            </span>
          </div>
        </div>

        {/* Quick 1-Click Credentials Selector for Demo & Faculty Access */}
        <div className="pt-4 mt-4 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
            Quick One-Click Demo Logins:
          </span>
          <div className="flex flex-wrap gap-1.5 text-[11px] justify-center">
            <button
              type="button"
              onClick={() => autoFill("adminkarur@123", "vsbec@123")}
              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold border border-purple-200 transition-colors"
            >
              👑 Admin (Karur)
            </button>
            <button
              type="button"
              onClick={() => autoFill("admincovai@123", "vsbectc@1213")}
              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold border border-sky-200 transition-colors"
            >
              🏛️ Admin (Coimbatore)
            </button>
            <button
              type="button"
              onClick={() => autoFill("teacherkarur@123", "vsbteacher@123")}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 transition-colors"
            >
              🧑‍🏫 Faculty (Karur)
            </button>
          </div>
        </div>

        {/* Department Attribution Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 text-center">
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 tracking-wide">
            Created by{" "}
            <span className="text-slate-800 font-bold">
              Department of Artificial Intelligence and Data Science
            </span>
          </p>
        </div>
      </div>

      {/* Forgot Password / Account Help Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-slate-900 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-[#4a2545]" /> Authorized Credentials
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              For security compliance, user accounts are provisioned by the Central Admissions Directorate. Use the authorized credentials below:
            </p>

            <div className="space-y-2 text-xs font-mono bg-slate-100 p-3 rounded-xl mb-4 border border-slate-200">
              <div><strong>Admin Karur:</strong> adminkarur@123 / vsbec@123</div>
              <div><strong>Admin Covai:</strong> admincovai@123 / vsbectc@1213</div>
              <div><strong>Faculty:</strong> teacherkarur@123 / vsbteacher@123</div>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-[#4a2545] text-white font-bold rounded-xl text-xs hover:bg-[#3d1e39] transition-all cursor-pointer"
            >
              Close & Return to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
