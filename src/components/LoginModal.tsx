"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { Eye, EyeOff, AlertCircle, Info, ShieldCheck } from "lucide-react";
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
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 320,
        damping: 24,
      },
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen w-full flex-col lg:flex-row overflow-y-auto"
      style={{
        backgroundColor: "#050505",
        color: "#ffffff",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Left Image Panel */}
      <div
        className="relative hidden w-full flex-col justify-end p-4 lg:flex lg:min-h-screen lg:w-1/2"
        style={{ boxSizing: "border-box" }}
      >
        {/* Background Image Wrapper */}
        <div
          className="relative h-full w-full overflow-hidden shadow-2xl"
          style={{
            borderRadius: "28px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            backgroundColor: "#000000",
            minHeight: "calc(100vh - 32px)",
          }}
        >
          <img
            src="https://assets.watermelon.sh/auth-11.avif"
            alt="Serene landscape with a lone tree"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {/* Deep Dark Gradient Overlay for Maximum Legibility */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.72) 32%, rgba(0, 0, 0, 0.25) 60%, transparent 100%)",
            }}
          />

          {/* Bottom Content within the image */}
          <div
            className="absolute right-0 bottom-0 left-0 z-10 flex w-full flex-col items-center justify-center pb-12 text-center px-8"
            style={{ boxSizing: "border-box" }}
          >
            {/* SPHEREX ADMISSION OS Pill */}
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 shadow-lg backdrop-blur-md"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#34d399",
                  boxShadow: "0 0 10px #34d399",
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                SPHEREX ADMISSION OS &bull; 2026–2027
              </span>
            </div>

            {/* Headline with 100% Guaranteed Bright White Contrast */}
            <h1
              style={{
                color: "#ffffff",
                fontSize: "clamp(2rem, 3.2vw, 3rem)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                margin: "0 auto",
                textShadow: "0 3px 20px rgba(0, 0, 0, 0.9)",
              }}
            >
              Move fast. Feel Free
            </h1>

            <p
              style={{
                color: "#cbd5e1",
                fontSize: "0.92rem",
                lineHeight: 1.6,
                maxWidth: "440px",
                margin: "10px auto 0 auto",
                textShadow: "0 2px 12px rgba(0, 0, 0, 0.9)",
              }}
            >
              High-velocity institutional admission management and dual-campus lead allocation.
            </p>

            {/* Pagination Indicators */}
            <div
              className="mt-8 flex items-center justify-center gap-2"
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              <div
                style={{
                  width: "28px",
                  height: "4px",
                  borderRadius: "9999px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.6)",
                }}
              />
              <div
                style={{
                  width: "6px",
                  height: "4px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                }}
              />
              <div
                style={{
                  width: "6px",
                  height: "4px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                }}
              />
              <div
                style={{
                  width: "6px",
                  height: "4px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel with Deep Obsidian Black Background */}
      <div
        className="flex w-full flex-col items-center justify-center p-6 sm:p-10 lg:w-1/2"
        style={{
          backgroundColor: "#050505",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[430px]"
          style={{ width: "100%", maxWidth: "430px", margin: "0 auto" }}
        >
          {/* SPHEREX CRM Pill Badge */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2.5 mb-5"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "#000000",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Image
                src="/spherex-logo.png"
                alt="SPHEREX Official Logo"
                width={28}
                height={28}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div
              style={{
                backgroundColor: "#11141c",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "9999px",
                padding: "4px 16px",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                SPHEREX CRM
              </span>
            </div>
          </motion.div>

          {/* Titles */}
          <motion.div
            variants={itemVariants}
            className="mb-6 text-center"
            style={{ textAlign: "center", marginBottom: "22px" }}
          >
            <h2
              style={{
                color: "#ffffff",
                fontSize: "clamp(1.75rem, 2.5vw, 2.2rem)",
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Welcome to
              <br />
              <span style={{ fontWeight: 800, color: "#ffffff" }}>V.S.B. GROUP OF</span>{" "}
              <span
                style={{
                  fontStyle: "italic",
                  fontFamily: "Georgia, serif",
                  color: "#38bdf8",
                  fontWeight: 300,
                }}
              >
                INSTITUTIONS.
              </span>
            </h2>
          </motion.div>

          {/* Social Buttons */}
          <motion.div
            variants={itemVariants}
            className="mb-6 grid grid-cols-2 gap-3.5"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                alert("Google Workspace SSO: Please use your authorized VSB institutional credentials below.")
              }
              style={{
                backgroundColor: "#11141c",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "9999px",
                padding: "12px 14px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <GoogleIcon style={{ fontSize: "16px" }} />
              <span>Continue with Google</span>
            </button>
            <button
              type="button"
              onClick={() =>
                alert("Apple ID SSO: Please use your authorized VSB institutional credentials below.")
              }
              style={{
                backgroundColor: "#11141c",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "9999px",
                padding: "12px 14px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <AppleIcon style={{ fontSize: "16px" }} />
              <span>Continue with Apple</span>
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div
            variants={itemVariants}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "22px",
              position: "relative",
            }}
          >
            <div style={{ flexGrow: 1, borderTop: "1px solid rgba(255, 255, 255, 0.12)" }} />
            <span
              style={{
                padding: "0 12px",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "rgba(255, 255, 255, 0.5)",
                textTransform: "uppercase",
              }}
            >
              OR SIGN IN WITH EMAIL / ID
            </span>
            <div style={{ flexGrow: 1, borderTop: "1px solid rgba(255, 255, 255, 0.12)" }} />
          </motion.div>

          {/* Error Notification */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                borderRadius: "14px",
                backgroundColor: "rgba(127, 29, 29, 0.6)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0, color: "#f87171" }} />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Email / User ID */}
            <motion.div variants={itemVariants} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="login-email"
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "rgba(255, 255, 255, 0.75)",
                  textTransform: "uppercase",
                }}
              >
                EMAIL OR USER ID
              </label>
              <input
                id="login-email"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="adminkarur@123"
                style={{
                  width: "100%",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  backgroundColor: "#0d1117",
                  padding: "13px 16px",
                  fontSize: "14px",
                  color: "#ffffff",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </motion.div>

            {/* Password with Eye Toggle */}
            <motion.div variants={itemVariants} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label
                  htmlFor="login-password"
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "rgba(255, 255, 255, 0.75)",
                    textTransform: "uppercase",
                  }}
                >
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    color: "#38bdf8",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: "100%",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    backgroundColor: "#0d1117",
                    padding: "13px 44px 13px 16px",
                    fontSize: "14px",
                    color: "#ffffff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.5)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: "18px", height: "18px" }} />
                  ) : (
                    <Eye style={{ width: "18px", height: "18px" }} />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Remember Me Option */}
            <motion.div
              variants={itemVariants}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.75)",
                paddingTop: "2px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: "15px",
                    height: "15px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    accentColor: "#38bdf8",
                  }}
                />
                <span>Remember me</span>
              </label>

              <span style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "11px" }}>
                Authorized Personnel Only
              </span>
            </motion.div>

            {/* Login Button - High Contrast Bold White Pill with Black Text */}
            <motion.div variants={itemVariants} style={{ marginTop: "8px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  borderRadius: "9999px",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  padding: "14px 20px",
                  fontSize: "14px",
                  fontWeight: 700,
                  border: "none",
                  boxShadow: "0 4px 25px rgba(255, 255, 255, 0.15)",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loading ? "Authenticating..." : "Login"}
              </button>
            </motion.div>
          </form>

          {/* Security Badges */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: "22px",
              paddingTop: "16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11.5px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#34d399", fontWeight: 600 }}>
              <ShieldCheck style={{ width: "15px", height: "15px" }} />
              <span>256-Bit Encrypted Portal</span>
            </div>
            <span
              style={{
                fontFamily: "monospace",
                color: "#34d399",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#34d399",
                  display: "inline-block",
                  boxShadow: "0 0 8px #34d399",
                }}
              />
              Live VSB Gateway
            </span>
          </motion.div>

          {/* Quick One-Click Demo Logins */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span
              style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "8px",
                textAlign: "center",
              }}
            >
              QUICK ONE-CLICK DEMO LOGINS:
            </span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                fontSize: "11.5px",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={() => autoFill("adminkarur@123", "vsbec@123")}
                style={{
                  backgroundColor: "rgba(168, 85, 247, 0.12)",
                  border: "1px solid rgba(168, 85, 247, 0.35)",
                  color: "#d8b4fe",
                  borderRadius: "9999px",
                  padding: "6px 14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                👑 Admin (Karur)
              </button>
              <button
                type="button"
                onClick={() => autoFill("admincovai@123", "vsbectc@1213")}
                style={{
                  backgroundColor: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                  color: "#7dd3fc",
                  borderRadius: "9999px",
                  padding: "6px 14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🏛️ Admin (Coimbatore)
              </button>
              <button
                type="button"
                onClick={() => autoFill("teacherkarur@123", "vsbteacher@123")}
                style={{
                  backgroundColor: "rgba(52, 211, 153, 0.12)",
                  border: "1px solid rgba(52, 211, 153, 0.35)",
                  color: "#6ee7b7",
                  borderRadius: "9999px",
                  padding: "6px 14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🧑‍🏫 Faculty (Karur)
              </button>
            </div>
          </motion.div>

          {/* Department Attribution Footer */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: "18px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              textAlign: "center",
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            <p style={{ margin: 0 }}>
              Created by{" "}
              <strong style={{ color: "#ffffff", fontWeight: 700 }}>
                Department of Artificial Intelligence and Data Science
              </strong>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Forgot Password / Authorized Credentials Modal */}
      {showForgotModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#0d1117",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: "24px",
              padding: "24px",
              maxWidth: "380px",
              width: "100%",
              color: "#ffffff",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <Info style={{ width: "18px", height: "18px", color: "#38bdf8" }} />
              Authorized Credentials
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "16px",
                lineHeight: 1.6,
              }}
            >
              For security compliance, user accounts are provisioned by the Central Admissions Directorate. Use the authorized credentials below:
            </p>

            <div
              style={{
                fontSize: "12px",
                fontFamily: "monospace",
                backgroundColor: "#161b24",
                padding: "14px",
                borderRadius: "14px",
                marginBottom: "16px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                lineHeight: 1.8,
              }}
            >
              <div>
                <strong style={{ color: "#d8b4fe" }}>Admin Karur:</strong> adminkarur@123 / vsbec@123
              </div>
              <div>
                <strong style={{ color: "#7dd3fc" }}>Admin Covai:</strong> admincovai@123 / vsbectc@1213
              </div>
              <div>
                <strong style={{ color: "#6ee7b7" }}>Faculty:</strong> teacherkarur@123 / vsbteacher@123
              </div>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontWeight: 700,
                borderRadius: "9999px",
                fontSize: "12px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Close &amp; Return to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
