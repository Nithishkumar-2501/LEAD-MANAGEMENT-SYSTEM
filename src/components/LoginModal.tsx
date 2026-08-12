"use client";

import { useState } from "react";
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: () => void;
}

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (
        (username.trim() === "admin@vsb" || username.trim() === "admin@vsb.ac.in") &&
        password.trim() === "admin@1234"
      ) {
        setLoading(false);
        onLoginSuccess();
      } else {
        setLoading(false);
        setError("Invalid Admin Credentials. Please use admin@vsb / admin@1234");
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050813]/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bubble-card w-full max-w-md border border-white/25 shadow-2xl overflow-hidden p-8 relative">
        {/* Top Iridescent Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500" />

        {/* Branding & Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/40 ring-4 ring-white/30 mb-3 animate-pulse">
            <Sparkles className="w-9 h-9 text-white font-black" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            V.S.B. ENGINEERING COLLEGE
          </h2>
          <p className="text-xs font-bold text-sky-300 mt-1">
            KARUR & COIMBATORE CAMPUSES
          </p>
          <p className="text-[11px] text-slate-300 font-medium mt-1">
            Liquid Bubble Glass Admin Portal Login
          </p>
        </div>

        {/* Credentials Info Box */}
        <div className="mb-5 p-4 rounded-3xl bg-slate-900/80 border border-white/20 text-xs text-slate-200 backdrop-blur-xl shadow-inner">
          <div className="flex items-center gap-1.5 font-bold text-sky-300 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Authorized Admin Credentials
          </div>
          <div className="flex justify-between text-[11px] font-mono mt-1 pt-1 border-t border-white/10">
            <span>Admin Email: <strong className="text-white">admin@vsb</strong></span>
            <span>Password: <strong className="text-white">admin@1234</strong></span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Admin Username / Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@vsb"
                className="w-full bg-slate-950/90 border border-white/20 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 backdrop-blur-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Admin Password
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
            className="glossy-btn w-full py-3 text-xs font-black shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            <span>{loading ? "Authenticating Admin..." : "Login to V.S.B. Portal"}</span>
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
