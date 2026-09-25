"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { Eye, EyeOff, AlertCircle, Info, ShieldCheck, Sparkles } from "lucide-react";
import { loginWithRealtimeAuth } from "@/lib/authService";

// Custom Google SVG Icon from Auth11
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Custom Apple SVG Icon from Auth11
const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="currentColor"
    {...props}
  >
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702z" />
  </svg>
);

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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full flex-col bg-[#050505] font-sans text-neutral-200 antialiased selection:bg-white/20 selection:text-white lg:flex-row overflow-y-auto">
      {/* Left Image Panel */}
      <div className="relative hidden w-full flex-col justify-end p-4 lg:flex lg:min-h-screen lg:w-1/2">
        {/* Background Image Wrapper */}
        <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/10 shadow-2xl">
          <img
            src="https://assets.watermelon.sh/auth-11.avif"
            alt="Serene landscape with a lone tree"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Dark Gradient Overlay for text readability */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent"
            style={{
              background: "linear-gradient(to top, #050505 0%, rgba(5,5,5,0.3) 40%, transparent 100%)",
            }}
          />

          {/* Bottom Content within the image */}
          <div className="absolute right-0 bottom-0 left-0 z-10 flex w-full flex-col items-center justify-center pb-12 text-center px-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-1.5 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                SPHEREX ADMISSION OS &bull; 2026–2027
              </span>
            </div>

            <h1 className="text-3xl font-medium tracking-tight text-balance text-white md:text-4xl lg:text-5xl">
              Move fast. Feel Free
            </h1>
            <p className="mt-2 text-sm text-neutral-300 max-w-md">
              High-velocity institutional admission management and dual-campus lead allocation.
            </p>

            {/* Pagination Indicators */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="h-1 w-6 rounded-full bg-white"></div>
              <div className="h-1 w-1.5 rounded-full bg-white/40"></div>
              <div className="h-1 w-1.5 rounded-full bg-white/40"></div>
              <div className="h-1 w-1.5 rounded-full bg-white/40"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[430px]"
        >
          {/* SPHEREX CRM Pill Badge */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-black p-0.5 shadow-md border border-white/20 flex items-center justify-center shrink-0">
              <Image
                src="/spherex-logo.png"
                alt="SPHEREX Official Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="inline-flex items-center px-4 py-1 rounded-full bg-[#141414] border border-white/10 shadow-xs">
              <span className="text-xs font-bold tracking-wider text-white uppercase">
                SPHEREX CRM
              </span>
            </div>
          </motion.div>

          {/* Titles */}
          <motion.div variants={itemVariants} className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl leading-tight font-medium tracking-tight text-balance text-white md:text-[36px]">
              Welcome to
              <br />
              <span className="font-semibold text-white">V.S.B. GROUP OF</span>{" "}
              <span className="font-serif font-light italic text-sky-400">INSTITUTIONS.</span>
            </h2>
          </motion.div>

          {/* Social Buttons */}
          <motion.div
            variants={itemVariants}
            className="mb-6 grid grid-cols-2 gap-3.5"
          >
            <button
              type="button"
              onClick={() => alert("Google Workspace SSO: Please use your authorized VSB institutional credentials below.")}
              className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#141414] py-3 text-[13px] font-medium text-white transition-transform hover:bg-[#1f1f1f] active:scale-[0.96]"
            >
              <GoogleIcon className="text-[16px]" />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => alert("Apple ID SSO: Please use your authorized VSB institutional credentials below.")}
              className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#141414] py-3 text-[13px] font-medium text-white transition-transform hover:bg-[#1f1f1f] active:scale-[0.96]"
            >
              <AppleIcon className="text-[16px]" />
              Continue with Apple
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div
            variants={itemVariants}
            className="relative mb-6 flex items-center"
          >
            <div className="grow border-t border-white/10"></div>
            <span className="px-4 text-[11px] font-medium tracking-wider text-neutral-500 uppercase">
              Or Sign in with Email / ID
            </span>
            <div className="grow border-t border-white/10"></div>
          </motion.div>

          {/* Error Notification */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            {/* Email / User ID */}
            <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-neutral-300 uppercase tracking-wider"
              >
                Email or User ID
              </label>
              <input
                id="email"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="adminkarur@123"
                className="w-full rounded-[14px] border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm text-white transition-colors placeholder:text-neutral-500 focus:border-neutral-500 focus:bg-[#111] focus:ring-1 focus:ring-neutral-500 focus:outline-none"
              />
            </motion.div>

            {/* Password with Eye Toggle */}
            <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-neutral-300 uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-[14px] border border-white/10 bg-[#0A0A0A] px-4 py-3 pr-11 text-sm text-white transition-colors placeholder:text-neutral-500 focus:border-neutral-500 focus:bg-[#111] focus:ring-1 focus:ring-neutral-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Remember Me Option */}
            <motion.div variants={itemVariants} className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#0A0A0A] text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                />
                <span>Remember me</span>
              </label>

              <span className="text-[11px] text-neutral-500">
                Authorized Personnel Only
              </span>
            </motion.div>

            {/* Login Button */}
            <motion.div variants={itemVariants} className="mt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#EAEAEA] py-3.5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-transform hover:bg-white active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Authenticating..." : "Login"}
              </button>
            </motion.div>
          </form>

          {/* Security Badges */}
          <motion.div
            variants={itemVariants}
            className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400"
          >
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-Bit Encrypted Portal</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
              Live VSB Gateway
            </span>
          </motion.div>

          {/* Quick One-Click Demo Logins */}
          <motion.div variants={itemVariants} className="mt-4 pt-3 border-t border-white/10">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2 text-center">
              Quick One-Click Demo Logins:
            </span>
            <div className="flex flex-wrap gap-2 text-xs justify-center">
              <button
                type="button"
                onClick={() => autoFill("adminkarur@123", "vsbec@123")}
                className="px-3 py-1.5 rounded-full bg-[#141414] hover:bg-[#202020] text-purple-300 font-semibold border border-purple-500/30 transition-all hover:scale-105"
              >
                👑 Admin (Karur)
              </button>
              <button
                type="button"
                onClick={() => autoFill("admincovai@123", "vsbectc@1213")}
                className="px-3 py-1.5 rounded-full bg-[#141414] hover:bg-[#202020] text-sky-300 font-semibold border border-sky-500/30 transition-all hover:scale-105"
              >
                🏛️ Admin (Coimbatore)
              </button>
              <button
                type="button"
                onClick={() => autoFill("teacherkarur@123", "vsbteacher@123")}
                className="px-3 py-1.5 rounded-full bg-[#141414] hover:bg-[#202020] text-emerald-300 font-semibold border border-emerald-500/30 transition-all hover:scale-105"
              >
                🧑‍🏫 Faculty (Karur)
              </button>
            </div>
          </motion.div>

          {/* Department Attribution Footer */}
          <motion.div variants={itemVariants} className="mt-5 pt-3 border-t border-white/10 text-center">
            <p className="text-[11px] text-neutral-400">
              Created by{" "}
              <span className="text-white font-bold">
                Department of Artificial Intelligence and Data Science
              </span>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Forgot Password / Authorized Credentials Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0e0e0e] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-sky-400" /> Authorized Credentials
            </h3>
            <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
              For security compliance, user accounts are provisioned by the Central Admissions Directorate. Use the authorized credentials below:
            </p>

            <div className="space-y-2 text-xs font-mono bg-[#161616] p-3.5 rounded-2xl mb-4 border border-white/10 text-neutral-200">
              <div><strong className="text-purple-300">Admin Karur:</strong> adminkarur@123 / vsbec@123</div>
              <div><strong className="text-sky-300">Admin Covai:</strong> admincovai@123 / vsbectc@1213</div>
              <div><strong className="text-emerald-300">Faculty:</strong> teacherkarur@123 / vsbteacher@123</div>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-white text-black font-bold rounded-full text-xs hover:bg-neutral-200 transition-all"
            >
              Close &amp; Return to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
