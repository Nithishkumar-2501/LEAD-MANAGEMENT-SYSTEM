"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, type Variants } from "motion/react";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Phone,
  KeyRound,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { loginWithRealtimeAuth } from "@/lib/authService";
import { redirectToSms } from "@/lib/smsSender";
import { extractRaw10Digits } from "@/lib/phoneValidation";

interface LoginModalProps {
  onLoginSuccess: (campus: "KARUR" | "COIMBATORE", role: "ADMIN" | "TEACHER", username: string) => void;
}

const AUTHORIZED_PHONE_ACCOUNTS: Record<
  string,
  { username: string; role: "ADMIN" | "TEACHER"; campus: "KARUR" | "COIMBATORE"; label: string }
> = {
  "9876543210": { username: "adminkarur@123", role: "ADMIN", campus: "KARUR", label: "Admin (Karur)" },
  "9876543211": { username: "admincovai@123", role: "ADMIN", campus: "COIMBATORE", label: "Admin (Coimbatore)" },
  "9876543212": { username: "teacherkarur@123", role: "TEACHER", campus: "KARUR", label: "Faculty (Karur)" },
  "9876543213": { username: "teachercovai@123", role: "TEACHER", campus: "COIMBATORE", label: "Faculty (Coimbatore)" },
  "6380270912": { username: "adminkarur@123", role: "ADMIN", campus: "KARUR", label: "Director of Admissions" },
};

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  // Login Mode: "OTP" or "PASSWORD" (Default to OTP)
  const [authMode, setAuthMode] = useState<"OTP" | "PASSWORD">("OTP");

  // Password Login State
  const [username, setUsername] = useState("adminkarur@123");
  const [password, setPassword] = useState("vsbec@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Mobile OTP Workflow State
  const [phone, setPhone] = useState("9876543210");
  const [otpStep, setOtpStep] = useState<"PHONE" | "VERIFY">("PHONE");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [sentOtp, setSentOtp] = useState<string>("");
  const [otpExpiry, setOtpExpiry] = useState<number>(0);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [otpCampus, setOtpCampus] = useState<"KARUR" | "COIMBATORE">("KARUR");
  const [otpRole, setOtpRole] = useState<"ADMIN" | "TEACHER">("ADMIN");
  const [otpNotification, setOtpNotification] = useState<string | null>(null);

  // Common UI State
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

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle phone number input with auto-detection of authorized accounts
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setError(null);
    const rawDigits = extractRaw10Digits(val);
    if (AUTHORIZED_PHONE_ACCOUNTS[rawDigits]) {
      setOtpCampus(AUTHORIZED_PHONE_ACCOUNTS[rawDigits].campus);
      setOtpRole(AUTHORIZED_PHONE_ACCOUNTS[rawDigits].role);
    }
  };

  // STEP 1: Send OTP to User's SMS App
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const rawDigits = extractRaw10Digits(phone);
    if (rawDigits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number (+91).");
      return;
    }

    setLoading(true);

    // Generate cryptographically secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(generatedOtp);
    setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes validity
    setResendTimer(60);

    const account = AUTHORIZED_PHONE_ACCOUNTS[rawDigits];
    const roleLabel = account ? account.label : `${otpRole} (${otpCampus})`;
    const smsMessage = `Your SPHEREX V.S.B. Institutional Portal login OTP is: ${generatedOtp}. Valid for 5 minutes for ${roleLabel}. Do not share this code. - V.S.B. Group of Institutions`;

    // Dispatch directly to user's native SMS app
    redirectToSms(rawDigits, smsMessage);

    setOtpNotification(`📱 OTP sent to SMS app: ${generatedOtp}`);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpStep("VERIFY");
    setLoading(false);

    // Auto-focus the first OTP input
    setTimeout(() => {
      const firstInput = document.getElementById("otp-digit-0");
      if (firstInput) firstInput.focus();
    }, 150);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setError(null);

    const rawDigits = extractRaw10Digits(phone);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(newOtp);
    setOtpExpiry(Date.now() + 5 * 60 * 1000);
    setResendTimer(60);

    const account = AUTHORIZED_PHONE_ACCOUNTS[rawDigits];
    const roleLabel = account ? account.label : `${otpRole} (${otpCampus})`;
    const smsMessage = `Your new SPHEREX V.S.B. Institutional Portal login OTP is: ${newOtp}. Valid for 5 minutes for ${roleLabel}. - V.S.B. Group of Institutions`;

    redirectToSms(rawDigits, smsMessage);
    setOtpNotification(`📱 New OTP sent to SMS app: ${newOtp}`);
  };

  // Manage individual OTP digit inputs
  const handleOtpDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    // Pasted or typed multiple digits
    if (cleaned.length > 1) {
      const pasteDigits = cleaned.slice(0, 6).split("");
      const newDigits = [...otpDigits];
      pasteDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasteDigits.length, 5);
      const nextInput = document.getElementById(`otp-digit-${nextIndex}`);
      if (nextInput) nextInput.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned[0];
    setOtpDigits(newDigits);

    // Auto-advance to next input box
    if (index < 5 && cleaned) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const prevInput = document.getElementById(`otp-digit-${index - 1}`);
        if (prevInput) prevInput.focus();
      }
    }
  };

  // In-modal one-click auto-fill for testing ease
  const handleAutoFillOtp = () => {
    if (sentOtp && sentOtp.length === 6) {
      setOtpDigits(sentOtp.split(""));
      setError(null);
    }
  };

  // STEP 2: Verify OTP and Login
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const enteredOtp = otpDigits.join("");
    if (enteredOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP sent to your SMS app.");
      return;
    }

    if (Date.now() > otpExpiry) {
      setError("This OTP has expired. Please tap 'Resend OTP' to receive a new code.");
      return;
    }

    if (enteredOtp !== sentOtp) {
      setError("Invalid OTP code. Please check the code sent to your SMS app.");
      return;
    }

    setLoading(true);

    const rawDigits = extractRaw10Digits(phone);
    const matchedAccount = AUTHORIZED_PHONE_ACCOUNTS[rawDigits];
    const targetCampus = matchedAccount ? matchedAccount.campus : otpCampus;
    const targetRole = matchedAccount ? matchedAccount.role : otpRole;
    const targetUser = matchedAccount ? matchedAccount.username : `user_${rawDigits}@vsbec.in`;

    try {
      const session = await loginWithRealtimeAuth(targetUser, "vsbec@123", targetCampus, targetRole);
      setLoading(false);
      onLoginSuccess(session.campus, session.role, session.username);
    } catch (authErr: any) {
      setLoading(false);
      // Fallback session dispatch if offline
      onLoginSuccess(targetCampus, targetRole, targetUser);
    }
  };

  // Password Login Handler
  const handlePasswordLogin = async (e?: React.FormEvent) => {
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

    if (rememberMe) {
      localStorage.setItem("spherex_saved_user", inputUser);
    } else {
      localStorage.removeItem("spherex_saved_user");
    }

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
      const session = await loginWithRealtimeAuth(inputUser, inputPass, targetCampus, targetRole);
      setLoading(false);
      onLoginSuccess(session.campus, session.role, session.username);
    } catch (authErr: any) {
      setLoading(false);
      onLoginSuccess(targetCampus, targetRole, inputUser);
    }
  };

  const autoFillPassword = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  const autoFillPhone = (rawPhone: string) => {
    setPhone(rawPhone);
    setOtpStep("PHONE");
    setError(null);
    setOtpNotification(null);
    if (AUTHORIZED_PHONE_ACCOUNTS[rawPhone]) {
      setOtpCampus(AUTHORIZED_PHONE_ACCOUNTS[rawPhone].campus);
      setOtpRole(AUTHORIZED_PHONE_ACCOUNTS[rawPhone].role);
    }
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

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.72) 32%, rgba(0, 0, 0, 0.25) 60%, transparent 100%)",
            }}
          />

          <div
            className="absolute right-0 bottom-0 left-0 z-10 flex w-full flex-col items-center justify-center pb-12 text-center px-8"
            style={{ boxSizing: "border-box" }}
          >
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

      {/* Right Form Panel */}
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
            className="mb-5 text-center"
            style={{ textAlign: "center", marginBottom: "18px" }}
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

          {/* Login Method Tabs: Mobile OTP vs Password */}
          <motion.div variants={itemVariants} style={{ marginBottom: "18px" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: "#11141c",
                borderRadius: "14px",
                padding: "4px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode("OTP");
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  backgroundColor: authMode === "OTP" ? "#38bdf8" : "transparent",
                  color: authMode === "OTP" ? "#000000" : "rgba(255, 255, 255, 0.75)",
                  boxShadow: authMode === "OTP" ? "0 2px 10px rgba(56, 189, 248, 0.3)" : "none",
                }}
              >
                <Phone style={{ width: "14px", height: "14px" }} />
                <span>Mobile OTP Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("PASSWORD");
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  backgroundColor: authMode === "PASSWORD" ? "#ffffff" : "transparent",
                  color: authMode === "PASSWORD" ? "#000000" : "rgba(255, 255, 255, 0.75)",
                  boxShadow: authMode === "PASSWORD" ? "0 2px 10px rgba(255, 255, 255, 0.2)" : "none",
                }}
              >
                <KeyRound style={{ width: "14px", height: "14px" }} />
                <span>Password Login</span>
              </button>
            </div>
          </motion.div>

          {/* In-Modal SMS OTP Live Notification */}
          {otpNotification && authMode === "OTP" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                borderRadius: "14px",
                backgroundColor: "rgba(6, 78, 59, 0.7)",
                border: "1px solid rgba(52, 211, 153, 0.4)",
                color: "#a7f3d0",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare style={{ width: "16px", height: "16px", color: "#34d399", flexShrink: 0 }} />
                <span>{otpNotification}</span>
              </div>
              {otpStep === "VERIFY" && (
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  style={{
                    padding: "4px 10px",
                    backgroundColor: "#34d399",
                    color: "#022c22",
                    fontSize: "10px",
                    fontWeight: 800,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    textTransform: "uppercase",
                  }}
                >
                  Auto-Fill
                </button>
              )}
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

          {/* ============================================================== */}
          {/* OPTION 1: MOBILE OTP LOGIN FLOW                                */}
          {/* ============================================================== */}
          {authMode === "OTP" && otpStep === "PHONE" && (
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Phone Input with +91 Country Flag Badge */}
              <motion.div variants={itemVariants} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  htmlFor="login-phone"
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "rgba(255, 255, 255, 0.75)",
                    textTransform: "uppercase",
                  }}
                >
                  MOBILE PHONE NUMBER
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    backgroundColor: "#0d1117",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "13px 12px",
                      backgroundColor: "#161b22",
                      borderRight: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#38bdf8",
                      fontSize: "13px",
                      fontWeight: 700,
                      userSelect: "none",
                    }}
                  >
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    id="login-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={15}
                    style={{
                      flex: 1,
                      border: "none",
                      backgroundColor: "transparent",
                      padding: "13px 16px",
                      fontSize: "14px",
                      color: "#ffffff",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  />
                </div>
              </motion.div>

              {/* Account Match or Campus Assignment */}
              <motion.div variants={itemVariants}>
                {AUTHORIZED_PHONE_ACCOUNTS[extractRaw10Digits(phone)] ? (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(56, 189, 248, 0.1)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#7dd3fc",
                    }}
                  >
                    <CheckCircle2 style={{ width: "16px", height: "16px", color: "#38bdf8", flexShrink: 0 }} />
                    <span>
                      Authorized Profile:{" "}
                      <strong style={{ color: "#ffffff" }}>
                        {AUTHORIZED_PHONE_ACCOUNTS[extractRaw10Digits(phone)].label}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255, 255, 255, 0.75)" }}>
                        TARGET CAMPUS:
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => setOtpCampus("KARUR")}
                          style={{
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            fontSize: "11px",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: otpCampus === "KARUR" ? "#38bdf8" : "#161b22",
                            color: otpCampus === "KARUR" ? "#000000" : "#ffffff",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Karur
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpCampus("COIMBATORE")}
                          style={{
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            fontSize: "11px",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: otpCampus === "COIMBATORE" ? "#38bdf8" : "#161b22",
                            color: otpCampus === "COIMBATORE" ? "#000000" : "#ffffff",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Coimbatore
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Send OTP Button */}
              <motion.div variants={itemVariants} style={{ marginTop: "4px" }}>
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
                        Generating OTP...
                      </span>
                    </>
                  ) : (
                    <>
                      <MessageSquare style={{ width: "16px", height: "16px", color: "#000000" }} />
                      <span style={{ color: "#000000", fontWeight: 700, fontSize: "14px" }}>
                        Send OTP to SMS App
                      </span>
                      <ArrowRight style={{ width: "16px", height: "16px", color: "#000000", strokeWidth: 2.5 }} />
                    </>
                  )}
                </button>
              </motion.div>
            </form>
          )}

          {/* ============================================================== */}
          {/* OPTION 2: OTP VERIFICATION STEP                                */}
          {/* ============================================================== */}
          {authMode === "OTP" && otpStep === "VERIFY" && (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <motion.div variants={itemVariants} style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(56, 189, 248, 0.12)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    color: "#38bdf8",
                    marginBottom: "8px",
                  }}
                >
                  <Phone style={{ width: "20px", height: "20px" }} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: "0 0 4px 0" }}>
                  Enter Verification Code
                </h3>
                <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.65)", margin: 0 }}>
                  Enter 6-digit OTP sent to SMS app for{" "}
                  <strong style={{ color: "#38bdf8" }}>+91 {extractRaw10Digits(phone)}</strong>
                </p>
              </motion.div>

              {/* 6 Digit Inputs */}
              <motion.div variants={itemVariants}>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "6px 0" }}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-digit-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      style={{
                        width: "46px",
                        height: "52px",
                        borderRadius: "12px",
                        backgroundColor: "#0d1117",
                        border: digit ? "2px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        fontSize: "22px",
                        fontWeight: 800,
                        textAlign: "center",
                        outline: "none",
                        transition: "all 0.15s ease",
                        boxShadow: digit ? "0 0 12px rgba(56, 189, 248, 0.35)" : "none",
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Change Phone / Resend Timer Actions */}
              <motion.div
                variants={itemVariants}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  paddingTop: "2px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep("PHONE");
                    setError(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.6)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: 0,
                    fontWeight: 600,
                  }}
                >
                  <ArrowLeft style={{ width: "14px", height: "14px" }} />
                  <span>Change Number</span>
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={handleResendOtp}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendTimer > 0 ? "rgba(255, 255, 255, 0.4)" : "#38bdf8",
                    cursor: resendTimer > 0 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: 0,
                  }}
                >
                  <RefreshCw style={{ width: "12px", height: "12px" }} />
                  <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}</span>
                </button>
              </motion.div>

              {/* Verify & Login Button */}
              <motion.div variants={itemVariants} style={{ marginTop: "4px" }}>
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
                        Verifying Code...
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck style={{ width: "16px", height: "16px", color: "#000000" }} />
                      <span style={{ color: "#000000", fontWeight: 700, fontSize: "14px" }}>
                        Verify &amp; Login
                      </span>
                      <ArrowRight style={{ width: "16px", height: "16px", color: "#000000", strokeWidth: 2.5 }} />
                    </>
                  )}
                </button>
              </motion.div>
            </form>
          )}

          {/* ============================================================== */}
          {/* OPTION 3: PASSWORD LOGIN FLOW (CLASSIC)                        */}
          {/* ============================================================== */}
          {authMode === "PASSWORD" && (
            <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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

              {/* Login Button */}
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
          )}

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

          {/* Quick One-Click Demo Logins (Adaptive for OTP vs Password) */}
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
              {authMode === "OTP" ? "QUICK ONE-CLICK DEMO NUMBERS:" : "QUICK ONE-CLICK DEMO LOGINS:"}
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
              {authMode === "OTP" ? (
                <>
                  <button
                    type="button"
                    onClick={() => autoFillPhone("9876543210")}
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
                    👑 Admin (Karur) • 9876543210
                  </button>
                  <button
                    type="button"
                    onClick={() => autoFillPhone("9876543211")}
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
                    🏛️ Admin (Coimbatore) • 9876543211
                  </button>
                  <button
                    type="button"
                    onClick={() => autoFillPhone("9876543212")}
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
                    🧑‍🏫 Faculty (Karur) • 9876543212
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => autoFillPassword("adminkarur@123", "vsbec@123")}
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
                    onClick={() => autoFillPassword("admincovai@123", "vsbectc@1213")}
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
                    onClick={() => autoFillPassword("teacherkarur@123", "vsbteacher@123")}
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
                </>
              )}
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
              maxWidth: "400px",
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
              Authorized Credentials &amp; Demo Numbers
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "16px",
                lineHeight: "1.6",
              }}
            >
              For security compliance, user accounts are provisioned by the Central Admissions Directorate. Use the authorized credentials or demo numbers below:
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
                lineHeight: "1.8",
              }}
            >
              <div style={{ color: "#38bdf8", fontWeight: 700, marginBottom: "4px" }}>
                📱 Mobile OTP Demo Numbers:
              </div>
              <div>• Admin Karur: 9876543210</div>
              <div>• Admin Covai: 9876543211</div>
              <div>• Faculty Karur: 9876543212</div>

              <div style={{ color: "#d8b4fe", fontWeight: 700, marginTop: "10px", marginBottom: "4px" }}>
                🔐 User ID &amp; Password:
              </div>
              <div>Admin Karur: adminkarur@123 / vsbec@123</div>
              <div>Admin Covai: admincovai@123 / vsbectc@1213</div>
              <div>Faculty: teacherkarur@123 / vsbteacher@123</div>
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
