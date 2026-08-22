"use client";

import { useState, useEffect } from "react";
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles, ShieldCheck, UserCheck } from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (campus: "KARUR" | "COIMBATORE", role: "ADMIN" | "TEACHER", username: string) => void;
}

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize default credentials if they don't exist
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
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const inputUser = username.trim();
    const inputPass = password.trim();

    // Admins
    const karurUser = localStorage.getItem("vsb_admin_karur_id") || "adminkarur@123";
    const karurPass = localStorage.getItem("vsb_admin_karur_pw") || "vsbec@123";
    const covaiUser = localStorage.getItem("vsb_admin_coimbatore_id") || "admincovai@123";
    const covaiPass = localStorage.getItem("vsb_admin_coimbatore_pw") || "vsbectc@1213";

    // Teachers
    const tkUser = localStorage.getItem("vsb_teacher_karur_id") || "teacherkarur@123";
    const tkPass = localStorage.getItem("vsb_teacher_karur_pw") || "vsbteacher@123";
    const tcUser = localStorage.getItem("vsb_teacher_coimbatore_id") || "teachercovai@123";
    const tcPass = localStorage.getItem("vsb_teacher_coimbatore_pw") || "vsbteacher@1213";

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

    setTimeout(() => {
      if (inputUser === karurUser && inputPass === karurPass) {
        setLoading(false);
        onLoginSuccess("KARUR", "ADMIN", inputUser);
      } else if (inputUser === covaiUser && inputPass === covaiPass) {
        setLoading(false);
        onLoginSuccess("COIMBATORE", "ADMIN", inputUser);
      } else if (FACULTY_ACCOUNTS[inputUser] && FACULTY_ACCOUNTS[inputUser].pass === inputPass) {
        setLoading(false);
        onLoginSuccess(FACULTY_ACCOUNTS[inputUser].campus, "TEACHER", inputUser);
      } else {
        setLoading(false);
        setError("Invalid credentials. Please enter your faculty email ID & password.");
      }
    }, 400);
  };

  const autoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050813]/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bubble-card w-full max-w-md border border-white/25 shadow-2xl overflow-hidden p-5 sm:p-7 relative">
        {/* Top Iridescent Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500" />

        {/* Branding & Logo */}
        <div className="text-center mb-5">
          {/* Official V.S.B. Engineering College Logo Emblem */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-amber-400 shadow-xl shadow-amber-500/30 bg-white mx-auto mb-3 p-0.5 transform hover:scale-105 transition-transform">
            <img
              src="/vsb-logo.png"
              alt="V.S.B. Engineering College Official Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            V.S.B. ENGINEERING COLLEGE
          </h2>
          <p className="text-xs font-bold text-sky-300 mt-0.5">
            KARUR & COIMBATORE CAMPUSES
          </p>
          <p className="text-[11px] text-slate-300 font-medium mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Authorized Portal Access
          </p>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Authorized Username / Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="adminkarur@123 or admincovai@123"
                className="w-full bg-slate-950/90 border border-white/20 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 backdrop-blur-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Portal Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/90 border border-white/20 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 backdrop-blur-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glossy-btn w-full py-3 text-xs font-black shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-1"
          >
            <span>{loading ? "Authenticating..." : "Login to V.S.B. Portal"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-400 font-medium mt-6">
          © 2026 V.S.B. Engineering College. Autonomous Institution - AICTE Approved & NAAC Accredited.
        </p>
      </div>
    </div>
  );
}
