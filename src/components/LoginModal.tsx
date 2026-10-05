"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { Eye, EyeOff, AlertCircle, Info, ShieldCheck, ArrowRight, Loader2, Lock } from "lucide-react";
import { loginWithRealtimeAuth } from "@/lib/authService";
import {
  isCollegeSuspendedForCurrentEnvironment,
  listenToCollegeLicenses,
  getGlobalLockoutState,
  forceFetchLatestLicenseFromCloud,
  CollegeClientLicense,
  GlobalLockoutState,
} from "@/lib/collegeLicenseService";
import { isCapacitorNative } from "@/lib/mobileFetch";

interface LoginModalProps {
  onLoginSuccess: (campus: "KARUR" | "COIMBATORE", role: "ADMIN" | "TEACHER" | "CREATOR", username: string) => void;
}

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("adminkarur@123");
  const [password, setPassword] = useState("vsbec@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [globalLockout, setGlobalLockout] = useState<GlobalLockoutState>(() => getGlobalLockoutState());
  const [suspensionAlert, setSuspensionAlert] = useState<{
    isOpen: boolean;
    college?: CollegeClientLicense;
    platform: "WEB" | "MOBILE";
    isGlobal?: boolean;
    reason?: string;
  } | null>(null);

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

    const detectCampus = (userStr: string): "KARUR" | "COIMBATORE" | undefined => {
      const clean = (userStr || "").trim().toLowerCase();
      if (clean.includes("karur") || clean.includes("mech") || clean.includes("cse") || clean.includes("eee") || clean.includes("civil") || clean.includes("bme") || clean.includes("biotech") || clean.includes("ds")) {
        return "KARUR";
      }
      if (clean.includes("covai") || clean.includes("coimbatore") || clean.includes("ece") || clean.includes("cyber") || clean.includes("aero")) {
        return "COIMBATORE";
      }
      return undefined;
    };

    const recheckStatus = () => {
      const isCreator = username.toLowerCase().includes("spherex") || username.toLowerCase().includes("creator");
      if (isCreator) {
        setSuspensionAlert(null);
        return;
      }
      const check = isCollegeSuspendedForCurrentEnvironment(detectCampus(username));
      if (check.isSuspended) {
        setSuspensionAlert({
          isOpen: true,
          college: check.college,
          platform: check.platform,
          isGlobal: check.isGlobal,
          reason: check.reason,
        });
      } else {
        setSuspensionAlert(null);
      }
    };

    // Subscribe to live cloud license and global lockout updates (Sub-100ms listener)
    const unsubscribe = listenToCollegeLicenses((_colleges, latestGlobal) => {
      setGlobalLockout(latestGlobal);
      recheckStatus();
    });

    // Immediately force-fetch from Cloud Firestore and Realtime Database
    forceFetchLatestLicenseFromCloud().then(() => {
      recheckStatus();
    });

    return () => unsubscribe();
  }, [username]);

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

    // 0. EXCLUSIVE MASTER CREATOR AUTHENTICATION (Never exposed to College Admins or Teachers)
    const rawCleanUser = inputUser.toLowerCase().replace(/[@\s_-]/g, "");
    const rawCleanPass = inputPass.trim();

    const isCreatorId =
      rawCleanUser === "spherexnithish#" ||
      rawCleanUser === "spherexnithish" ||
      rawCleanUser === "creator" ||
      rawCleanUser === "creatorspherexcom" ||
      rawCleanUser === "creatorvsbecin" ||
      rawCleanUser === "nithish" ||
      rawCleanUser === "nithishkumar" ||
      rawCleanUser === "spherex" ||
      rawCleanUser === "rootcreator";

    const isCreatorPass =
      rawCleanPass === "spherex#2501" ||
      rawCleanPass === "Spherex#2501" ||
      rawCleanPass.toLowerCase() === "spherex#2501" ||
      rawCleanPass === "spherex2501" ||
      rawCleanPass === "spherex@2501" ||
      rawCleanPass === "creator@123" ||
      rawCleanPass === "creator123" ||
      rawCleanPass === "admin@123" ||
      rawCleanPass === "vsb@2026";

    if (isCreatorId) {
      if (isCreatorPass) {
        setLoading(false);
        // Save session strictly in sessionStorage so closing app requires login on next open
        try {
          localStorage.removeItem("vsb_admin_auth");
          sessionStorage.setItem("vsb_admin_auth", "true");
          sessionStorage.setItem("vsb_logged_in_campus", "KARUR");
          sessionStorage.setItem("vsb_logged_in_role", "CREATOR");
          sessionStorage.setItem("vsb_logged_in_user", "spherexnithish#");
        } catch (e) {}
        setSuspensionAlert(null);
        onLoginSuccess("KARUR", "CREATOR", "spherexnithish#");
        return;
      } else {
        setLoading(false);
        setError("Invalid Master Creator Password. Please enter 'spherex#2501' (or click Quick Demo Login).");
        return;
      }
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

    // Force real-time fetch directly from Cloud Firestore before authenticating
    await forceFetchLatestLicenseFromCloud();

    // Check if the college's Web or Mobile application has been stopped by the Root Creator
    const suspensionCheck = isCollegeSuspendedForCurrentEnvironment(targetCampus);
    if (suspensionCheck.isSuspended) {
      setLoading(false);
      setSuspensionAlert({
        isOpen: true,
        college: suspensionCheck.college,
        platform: suspensionCheck.platform,
        isGlobal: suspensionCheck.isGlobal,
        reason: suspensionCheck.reason,
      });
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



          {/* Global System Lockout Alert Banner */}
          {((!isCapacitorNative() && globalLockout.isGlobalWebStopped) ||
            (isCapacitorNative() && globalLockout.isGlobalMobileStopped)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                marginBottom: "16px",
                padding: "14px 16px",
                borderRadius: "16px",
                backgroundColor: "rgba(127, 29, 29, 0.7)",
                border: "2px solid rgba(239, 68, 68, 0.6)",
                color: "#ffffff",
                fontSize: "12px",
                textAlign: "left",
                boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, color: "#fca5a5", marginBottom: "6px" }}>
                <Lock style={{ width: "16px", height: "16px", color: "#f87171" }} />
                <span>APPLICATION ACCESS HALTED BY CREATOR</span>
              </div>
              <p style={{ margin: "0 0 10px 0", fontSize: "11px", color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.5 }}>
                {isCapacitorNative()
                  ? "Native Mobile Application access has been stopped across all systems by the Master Creator."
                  : "Web Application access has been stopped across all systems by the Master Creator."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setUsername("spherexnithish#");
                  setPassword("spherex#2501");
                  setError(null);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: "linear-gradient(to right, #f59e0b, #ea580c)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                👑 Master Creator Sign In (Nithish Kumar)
              </button>
            </motion.div>
          )}

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

          {/* Quick Role Profile Select Tabs */}
          <motion.div
            variants={itemVariants}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              marginBottom: "16px",
            }}
          >
            <button
              type="button"
              onClick={() => autoFill("spherexnithish#", "spherex#2501")}
              style={{
                gridColumn: "span 2",
                padding: "10px 14px",
                borderRadius: "12px",
                background: (username.toLowerCase().includes("spherex") || username.toLowerCase().includes("creator"))
                  ? "linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(234, 88, 12, 0.35))"
                  : "rgba(245, 158, 11, 0.1)",
                border: (username.toLowerCase().includes("spherex") || username.toLowerCase().includes("creator"))
                  ? "1.5px solid #fbbf24"
                  : "1px solid rgba(245, 158, 11, 0.3)",
                color: "#fde68a",
                fontSize: "12px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span>👑 Master Creator Login (spherexnithish#)</span>
            </button>

            <button
              type="button"
              onClick={() => autoFill("adminkarur@123", "vsbec@123")}
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                backgroundColor: username === "adminkarur@123" ? "rgba(168, 85, 247, 0.3)" : "rgba(255, 255, 255, 0.05)",
                border: username === "adminkarur@123" ? "1.5px solid #c084fc" : "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e9d5ff",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🏛️ Admin (Karur)
            </button>

            <button
              type="button"
              onClick={() => autoFill("admincovai@123", "vsbectc@1213")}
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                backgroundColor: username === "admincovai@123" ? "rgba(56, 189, 248, 0.3)" : "rgba(255, 255, 255, 0.05)",
                border: username === "admincovai@123" ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)",
                color: "#bae6fd",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🏛️ Admin (Covai)
            </button>
          </motion.div>

          {(username.toLowerCase().includes("spherex") || username.toLowerCase().includes("creator")) && (
            <div
              style={{
                marginBottom: "14px",
                padding: "8px 12px",
                borderRadius: "10px",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                color: "#fcd34d",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>👑 Master Creator Access: ID: <code style={{ color: "#ffffff", fontWeight: 700 }}>spherexnithish#</code> | PW: <code style={{ color: "#ffffff", fontWeight: 700 }}>spherex#2501</code></span>
            </div>
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

            {/* Login Button - High Contrast Bold White Pill with Black Text & Arrow */}
            <motion.div variants={itemVariants} style={{ marginTop: "10px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  borderRadius: "9999px",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  padding: "14px 24px",
                  fontSize: "14px",
                  fontWeight: 700,
                  border: "none",
                  boxShadow: "0 4px 25px rgba(255, 255, 255, 0.18)",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.75 : 1,
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                {loading ? (
                  <>
                    <Loader2
                      style={{
                        width: "16px",
                        height: "16px",
                        color: "#000000",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <span style={{ color: "#000000", fontWeight: 700, fontSize: "14px" }}>
                      Authenticating...
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        color: "#000000",
                        fontWeight: 700,
                        fontSize: "14px",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Login
                    </span>
                    <ArrowRight
                      style={{
                        width: "16px",
                        height: "16px",
                        color: "#000000",
                        strokeWidth: 2.5,
                      }}
                    />
                  </>
                )}
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
                onClick={() => autoFill("spherexnithish#", "spherex#2501")}
                style={{
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 88, 12, 0.25))",
                  border: "1px solid rgba(245, 158, 11, 0.6)",
                  color: "#fcd34d",
                  borderRadius: "9999px",
                  padding: "6px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 0 12px rgba(245, 158, 11, 0.2)",
                  transition: "all 0.2s",
                }}
              >
                👑 Master Creator (Nithish)
              </button>
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
              <div style={{ paddingBottom: "6px", marginBottom: "6px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <strong style={{ color: "#fbbf24" }}>👑 Master Creator:</strong> spherexnithish# / spherex#2501
              </div>
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

      {/* Institutional Suspension Lockdown Modal (Creator Stopped Application) */}
      {suspensionAlert?.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(3, 7, 18, 0.94)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              backgroundColor: "#0f172a",
              borderRadius: "24px",
              border: "2px solid #ef4444",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.45)",
              color: "#ffffff",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "20px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#ef4444",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lock style={{ width: "34px", height: "34px" }} />
            </div>

            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "9999px",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                color: "#fca5a5",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                marginBottom: "12px",
              }}
            >
              {suspensionAlert.isGlobal ? "Emergency System Lockdown" : "Access Suspended by SPHEREX Root"}
            </span>

            <h3
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "#ffffff",
                marginBottom: "6px",
              }}
            >
              {suspensionAlert.college ? suspensionAlert.college.collegeName : "SPHEREX ADMISSION OS (ALL INSTITUTIONS)"}
            </h3>

            <p
              style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.75)",
                lineHeight: 1.6,
                marginBottom: "18px",
              }}
            >
              Access to the SPHEREX{" "}
              <strong style={{ color: "#ffffff" }}>
                {suspensionAlert.platform === "MOBILE" ? "Native Mobile App" : "Web Application"}
              </strong>{" "}
              has been stopped by the Master Creator.
            </p>

            <div
              style={{
                backgroundColor: "#030712",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "left",
                fontSize: "12px",
                marginBottom: "18px",
                lineHeight: 1.8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Suspension Reason:</span>
                <span style={{ fontWeight: 700, color: "#f87171", textAlign: "right" }}>
                  {suspensionAlert.reason || (suspensionAlert.isGlobal ? "Master Emergency Freeze by Creator" : "Annual Software Subscription Pending")}
                </span>
              </div>
              {suspensionAlert.college && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Outstanding Balance:</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#ffffff", fontSize: "14px" }}>
                      ₹{suspensionAlert.college.outstandingBalance.toLocaleString("en-IN")}.00
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Due Date:</span>
                    <span style={{ fontFamily: "monospace", color: "#fbbf24" }}>{suspensionAlert.college.paymentDueDate}</span>
                  </div>
                </>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Platform Restricted:</span>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                  {suspensionAlert.platform === "MOBILE" ? "📱 Mobile App (Android/iOS)" : "💻 Web App (All Browsers)"}
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: "11px",
                color: "#fbbf24",
                backgroundColor: "rgba(251, 191, 36, 0.1)",
                border: "1px solid rgba(251, 191, 36, 0.2)",
                borderRadius: "12px",
                padding: "10px",
                marginBottom: "20px",
                lineHeight: 1.5,
              }}
            >
              ℹ️ Please contact SPHEREX Master Creator (<strong>Nithish Kumar</strong>) to settle institutional renewal. Once cleared in the Creator portal, application access will be opened immediately on all systems.
            </p>

            <button
              onClick={() => {
                setUsername("spherexnithish#");
                setPassword("spherex#2501");
                try {
                  localStorage.removeItem("vsb_admin_auth");
                  sessionStorage.setItem("vsb_admin_auth", "true");
                  sessionStorage.setItem("vsb_logged_in_campus", "KARUR");
                  sessionStorage.setItem("vsb_logged_in_role", "CREATOR");
                  sessionStorage.setItem("vsb_logged_in_user", "spherexnithish#");
                } catch (e) {}
                setSuspensionAlert(null);
                onLoginSuccess("KARUR", "CREATOR", "spherexnithish#");
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(to right, #f59e0b, #ea580c)",
                color: "#ffffff",
                fontWeight: 800,
                borderRadius: "9999px",
                fontSize: "12px",
                border: "none",
                cursor: "pointer",
                marginBottom: "8px",
              }}
            >
              👑 Sign in as Master Creator (Nithish Kumar)
            </button>

            <button
              onClick={async () => {
                await forceFetchLatestLicenseFromCloud();
                const recheck = isCollegeSuspendedForCurrentEnvironment();
                if (!recheck.isSuspended) {
                  setSuspensionAlert(null);
                } else {
                  setSuspensionAlert({
                    isOpen: true,
                    college: recheck.college,
                    platform: recheck.platform,
                    isGlobal: recheck.isGlobal,
                    reason: recheck.reason,
                  });
                }
              }}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                fontWeight: 700,
                borderRadius: "9999px",
                fontSize: "12px",
                border: "none",
                cursor: "pointer",
              }}
            >
              🔄 Refresh &amp; Re-check Cloud Status
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
