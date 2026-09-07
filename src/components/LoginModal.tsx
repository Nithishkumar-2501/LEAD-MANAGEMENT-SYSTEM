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
      {/* Main Centered 2-Column Card matching Reference Image */}
      <div className="bg-white w-full max-w-5xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-slate-200/80 my-auto grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: LOGIN FORM                                           */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 p-6 sm:p-12 lg:p-14 flex flex-col justify-between bg-white text-slate-900">
          <div>
            {/* Logo Row matching Reference */}
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-[#4a2545] flex items-center justify-center text-white shadow-md">
                {/* Modern geometric Havenix / SPHEREX icon */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M4 3h4v18H4zm12 0h4v18h-4zm-6 6h4v12h-4z" />
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Havenix<span className="text-[#4a2545]">.</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1 border border-slate-200">
                SPHEREX CRM
              </span>
            </div>

            {/* Headline matching Reference Image */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Wellcome Back
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Let&apos;s login to grab amazing deal & manage admission leads
              </p>
            </div>

            {/* Social Buttons matching Reference */}
            <div className="space-y-2.5 mb-5">
              <button
                type="button"
                onClick={() => autoFill("adminkarur@123", "vsbec@123")}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer group"
              >
                {/* Google G Logo */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => autoFill("admincovai@123", "vsbectc@1213")}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer group"
              >
                {/* Apple / Alternative Social Icon */}
                <svg className="w-4 h-4 fill-slate-900" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-2.02.6-2.66 1.34-.56.65-1.06 1.71-.93 2.74 1.01.08 2.05-.51 2.67-1.21z"/>
                </svg>
                <span>Continue with Facebook</span>
              </button>
            </div>

            {/* Divider matching Reference */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-slate-400 absolute">
                Or
              </span>
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

            {/* Sign Up Row matching Reference */}
            <p className="text-center text-xs text-slate-500 font-medium mt-4">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-bold text-[#4a2545] hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          </div>

          {/* Quick 1-Click Credentials Selector for Demo & Faculty Access */}
          <div className="pt-6 mt-6 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Quick One-Click Demo Logins:
            </span>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
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
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: SURREAL ARCHITECTURAL VISUAL (MATCHING REFERENCE)   */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-slate-50 relative overflow-hidden">
          {/* Asymmetric Organic Cut-out Card matching Reference Image */}
          <div 
            className="w-full h-full min-h-[440px] lg:min-h-[560px] relative overflow-hidden shadow-2xl flex flex-col justify-between p-6 sm:p-8"
            style={{
              borderRadius: "44px 16px 44px 16px",
            }}
          >
            {/* Background Image: Surreal Blue Doors in Sky with Skyscrapers & Highway */}
            <Image
              src="/login-hero.jpg"
              alt="Surreal architecture with open sky doors and city skyscrapers"
              fill
              priority
              className="object-cover object-center"
            />

            {/* Subtle Gradient Vignette to enhance readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/60 pointer-events-none" />

            {/* Top Right Floating Quote matching Reference Image */}
            <div className="relative z-10 max-w-[260px] ml-auto text-right">
              <p className="text-xs sm:text-sm font-bold text-white leading-relaxed drop-shadow-md">
                Browse thousands of properties to buy, sell, or rent with trusted agents.
              </p>
              <p className="text-[10px] text-sky-200 font-semibold mt-1 drop-shadow-xs">
                SPHEREX Admissions Cloud • Powered by V.S.B.
              </p>
            </div>

            {/* Bottom Floating Stats / Security Badge */}
            <div className="relative z-10 flex items-center justify-between bg-slate-950/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-white text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">256-Bit Encrypted Portal</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-300 font-black">
                ● Live VSB Gateway
              </span>
            </div>
          </div>
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
