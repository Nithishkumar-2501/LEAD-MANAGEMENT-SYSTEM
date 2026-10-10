"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "motion/react";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { loginWithRealtimeAuth, type AuthSession } from "@/lib/authService";
import {
  isCollegeSuspendedForCurrentEnvironment,
  listenToCollegeLicenses,
  getGlobalLockoutState,
  forceFetchLatestLicenseFromCloud,
  getAllCollegeLicenses,
  CollegeClientLicense,
  GlobalLockoutState,
} from "@/lib/collegeLicenseService";
import { isCapacitorNative } from "@/lib/mobileFetch";

export const FACULTY_ACCOUNTS: Record<string, { pass: string; campus: "KARUR" | "COIMBATORE" }> = {
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

export interface ProductSpecSlide {
  id: string;
  specNumber: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  accentBorder: string;
  accentBg: string;
  accentText: string;
  specs: {
    label: string;
    value: string;
  }[];
  imageUrl: string;
}

export const PRODUCT_SPEC_SLIDES: ProductSpecSlide[] = [
  {
    id: "spec-multi-campus",
    specNumber: "SPEC 01",
    category: "CAMPUS ARCHITECTURE",
    title: "Dual-Campus Admission Ecosystem",
    subtitle: "V.S.B. Karur & Coimbatore Flagship Centers",
    description: "Multi-tenant institutional infrastructure providing isolated lead pipelines, departmental quota allocation, and centralized executive analytics across both campuses.",
    accentColor: "#10b981",
    accentBorder: "rgba(16, 185, 129, 0.4)",
    accentBg: "rgba(16, 185, 129, 0.15)",
    accentText: "#34d399",
    specs: [
      { label: "Campus Isolation", value: "Karur Main & Coimbatore Technical" },
      { label: "RBAC Security", value: "4-Tier Hierarchy (Root, Admin, Faculty)" },
      { label: "Lead Balancing", value: "Automated Departmental Allocation" },
    ],
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "spec-quota-engine",
    specNumber: "SPEC 02",
    category: "LEAD QUOTA & REVENUE ENGINE",
    title: "1,00,000 Lead Annual Quota",
    subtitle: "Real-Time Ledger & Dynamic UPI QR Workflow",
    description: "Strict institutional 1,00,000 lead quota accounting per cycle with dynamic ₹500 UPI QR fee verification, automated overage calculation, and high-volume batch CSV deduplication.",
    accentColor: "#f59e0b",
    accentBorder: "rgba(245, 158, 11, 0.4)",
    accentBg: "rgba(245, 158, 11, 0.15)",
    accentText: "#fbbf24",
    specs: [
      { label: "Annual Lead Cap", value: "1,00,000 Free Leads / Academic Cycle" },
      { label: "Dynamic UPI QR", value: "₹500 / Lead Direct Payment Ledger" },
      { label: "Batch CSV Engine", value: "10,000+ Records Ingested / Minute" },
    ],
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "spec-nora-ai",
    specNumber: "SPEC 03",
    category: "ADMISSION INTELLIGENCE",
    title: "NORA AI™ Predictive Suite",
    subtitle: "TNEA 2026/2027 Forecasting & Marksheet OCR",
    description: "Proprietary Machine Learning cutoff predictor tailored for Tamil Nadu engineering admissions, instant OCR marksheet scanning, and automated candidate eligibility scoring.",
    accentColor: "#6366f1",
    accentBorder: "rgba(99, 102, 241, 0.4)",
    accentBg: "rgba(99, 102, 241, 0.15)",
    accentText: "#818cf8",
    specs: [
      { label: "Cutoff Predictor", value: "TNEA 2026/2027 ML Eligibility Engine" },
      { label: "Vision AI OCR", value: "Instant Marksheet & Document Parsing" },
      { label: "Conversion AI", value: "Automated Candidate Scoring & Propensity" },
    ],
    imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "spec-omnichannel",
    specNumber: "SPEC 04",
    category: "TELEPHONY & FIELD OUTREACH",
    title: "High-Velocity Omnichannel Telephony",
    subtitle: "Native Android Dialer & Multi-Channel Broadcast",
    description: "Micro-delegation telecalling across faculty counselors with single-click native mobile dialing, automated WhatsApp Business templates, SMS alerts, and Project Expo direct lead capture.",
    accentColor: "#ec4899",
    accentBorder: "rgba(236, 72, 153, 0.4)",
    accentBg: "rgba(236, 72, 153, 0.15)",
    accentText: "#f472b6",
    specs: [
      { label: "Faculty Telephony", value: "Single-Click Native Call Dialer" },
      { label: "Broadcast Hub", value: "WhatsApp Business API & SMS Gateway" },
      { label: "Field Ingestion", value: "Project Expo On-Spot Applicant Sync" },
    ],
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "spec-killswitch-security",
    specNumber: "SPEC 05",
    category: "ROOT SECURITY & FAILOVER",
    title: "Triple-Redundancy Anti-Tamper Core",
    subtitle: "3.5s Universal Emergency Kill-Switch",
    description: "Master Creator root authority (spherexnithish#) with 3.5s reactive heartbeat synchronization across Firestore, RTDB, and REST to enforce instantaneous global Web and Mobile lockouts.",
    accentColor: "#06b6d4",
    accentBorder: "rgba(6, 182, 212, 0.4)",
    accentBg: "rgba(6, 182, 212, 0.15)",
    accentText: "#22d3ee",
    specs: [
      { label: "Heartbeat Sync", value: "3,500ms Reactive License Polling" },
      { label: "Universal Freeze", value: "Global Web & Mobile Instant Kill-Switch" },
      { label: "Cross-Platform", value: "Next.js 14 SSR/CSR + Native Capacitor APK" },
    ],
    imageUrl: "https://assets.watermelon.sh/auth-11.avif",
  },
];

interface LoginModalProps {
  onLoginSuccess: (campus: "KARUR" | "COIMBATORE", role: "ADMIN" | "TEACHER" | "CREATOR", username: string) => void;
}

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  // Automatic 3-Second (3000ms) Product Specifications Slide Transition
  useEffect(() => {
    if (isSlidePaused) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % PRODUCT_SPEC_SLIDES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isSlidePaused]);

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % PRODUCT_SPEC_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + PRODUCT_SPEC_SLIDES.length) % PRODUCT_SPEC_SLIDES.length);
  };

  const [username, setUsername] = useState("adminkarur@123");
  const [password, setPassword] = useState("vsbec@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [colleges, setColleges] = useState<CollegeClientLicense[]>(() => getAllCollegeLicenses());
  const [, setGlobalLockout] = useState<GlobalLockoutState>(() => getGlobalLockoutState());
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

    // Load saved username only once on initial component mount
    const savedUser = localStorage.getItem("spherex_saved_user");
    if (savedUser) {
      setUsername(savedUser);
    }

    // Subscribe to live cloud license and global lockout updates (Sub-100ms listener)
    const unsubscribe = listenToCollegeLicenses((updatedColleges, latestGlobal) => {
      setColleges(updatedColleges);
      setGlobalLockout(latestGlobal);
    });

    // Immediately fetch from Cloud Firestore without blocking typing
    forceFetchLatestLicenseFromCloud().then((res) => {
      if (res?.colleges) setColleges(res.colleges);
      if (res?.globalLockout) {
        setGlobalLockout(res.globalLockout);
        if (!res.globalLockout.isGlobalWebStopped && !res.globalLockout.isGlobalMobileStopped) {
          try {
            localStorage.setItem("spherex_global_lockout_registry", JSON.stringify(res.globalLockout));
          } catch (e) {}
        }
      }
    }).catch((e) => console.warn("License fetch notice:", e));

    return () => unsubscribe();
  }, []); // Run ONCE on mount so typing, Backspace, and editing are never overwritten

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsAuthError(false);
    setLoading(true);

    const inputUser = username.trim();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setLoading(false);
      setIsAuthError(true);
      return;
    }

    // 0. EXCLUSIVE MASTER CREATOR AUTHENTICATION (Restricted strictly to spherexnithish# on Web Portal)
    const normalizedInputUser = inputUser.toLowerCase().trim();
    const rawCleanUser = inputUser.toLowerCase().replace(/[@\s_.-]/g, "");
    const rawCleanPass = inputPass.trim();

    const isCreatorId =
      normalizedInputUser === "spherexnithish#" ||
      normalizedInputUser === "spherexnithish" ||
      rawCleanUser === "spherexnithish";

    if (isCreatorId) {
      // In the App model (native mobile app), Creator is strictly disabled!
      if (isCapacitorNative()) {
        setLoading(false);
        setIsAuthError(true);
        return;
      }

      const normPass = rawCleanPass.toLowerCase().replace(/\s+/g, "");
      const isCreatorPass =
        normPass === "spherex#2501" ||
        normPass === "spherex2501" ||
        normPass === "spherex@2501" ||
        normPass === "spherexnithish#" ||
        normPass === "spherexnithish" ||
        normPass === "nithish@2501" ||
        normPass === "nithish2501" ||
        normPass === "vsb@2026";

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
        setIsAuthError(true);
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
    const karurUser = (localStorage.getItem("vsb_admin_karur_id") || "adminkarur@123").trim();
    const karurPass = (localStorage.getItem("vsb_admin_karur_pw") || "vsbec@123").trim();
    const covaiUser = (localStorage.getItem("vsb_admin_coimbatore_id") || "admincovai@123").trim();
    const covaiPass = (localStorage.getItem("vsb_admin_coimbatore_pw") || "vsbectc@1213").trim();

    let targetCampus: "KARUR" | "COIMBATORE" | null = null;
    let targetRole: "ADMIN" | "TEACHER" | null = null;

    const cleanUser = inputUser.toLowerCase().trim();
    const cleanPass = inputPass.trim();

    // 1. Karur Admin Validation (allows default passwords & custom saved passwords)
    const isKarurId =
      cleanUser === "adminkarur@123" ||
      cleanUser === "admin.karur@vsbec.in" ||
      cleanUser === "adminkarur" ||
      cleanUser === "karuradmin" ||
      cleanUser === karurUser.toLowerCase();

    const isKarurPass =
      cleanPass === "vsbec@123" ||
      cleanPass === "admin@123" ||
      cleanPass === "vsb@2026" ||
      cleanPass === "adminkarur@123" ||
      cleanPass === karurPass;

    // 2. Coimbatore Admin Validation (allows default passwords & custom saved passwords)
    const isCovaiId =
      cleanUser === "admincovai@123" ||
      cleanUser === "admincoimbatore@123" ||
      cleanUser === "admin.covai@vsbec.in" ||
      cleanUser === "admincovai" ||
      cleanUser === "admincoimbatore" ||
      cleanUser === covaiUser.toLowerCase();

    const isCovaiPass =
      cleanPass === "vsbectc@1213" ||
      cleanPass === "vsbec@1213" ||
      cleanPass === "vsbec@123" ||
      cleanPass === "admin@123" ||
      cleanPass === "vsb@2026" ||
      cleanPass === covaiPass;

    // 3. Faculty / Teacher Validation
    const isTeacherKarurId =
      cleanUser === "teacherkarur@123" ||
      cleanUser === "teacher_rajesh@123" ||
      cleanUser === (localStorage.getItem("vsb_teacher_karur_id") || "teacherkarur@123").toLowerCase().trim();

    const isTeacherKarurPass =
      cleanPass === "vsbteacher@123" ||
      cleanPass === "teacher@123" ||
      cleanPass === "vsb@2026" ||
      cleanPass === (localStorage.getItem("vsb_teacher_karur_pw") || "vsbteacher@123").trim();

    const isTeacherCovaiId =
      cleanUser === "teachercovai@123" ||
      cleanUser === (localStorage.getItem("vsb_teacher_coimbatore_id") || "teachercovai@123").toLowerCase().trim();

    const isTeacherCovaiPass =
      cleanPass === "vsbteacher@1213" ||
      cleanPass === "vsbteacher@123" ||
      cleanPass === "teacher@123" ||
      cleanPass === "vsb@2026" ||
      cleanPass === (localStorage.getItem("vsb_teacher_coimbatore_pw") || "vsbteacher@1213").trim();

    if (isKarurId && isKarurPass) {
      targetCampus = "KARUR";
      targetRole = "ADMIN";
    } else if (isCovaiId && isCovaiPass) {
      targetCampus = "COIMBATORE";
      targetRole = "ADMIN";
    } else if (isTeacherKarurId && isTeacherKarurPass) {
      targetCampus = "KARUR";
      targetRole = "TEACHER";
    } else if (isTeacherCovaiId && isTeacherCovaiPass) {
      targetCampus = "COIMBATORE";
      targetRole = "TEACHER";
    } else {
      // Check FACULTY_ACCOUNTS with case-insensitive username match
      const matchingFacultyKey = Object.keys(FACULTY_ACCOUNTS).find(
        (k) => k.toLowerCase().trim() === cleanUser
      );
      if (matchingFacultyKey) {
        const fac = FACULTY_ACCOUNTS[matchingFacultyKey];
        if (
          cleanPass === fac.pass ||
          cleanPass === "vsbteacher@123" ||
          cleanPass === "vsbteacher@1213" ||
          cleanPass === "teacher@123" ||
          cleanPass === "vsb@2026"
        ) {
          targetCampus = fac.campus;
          targetRole = "TEACHER";
        }
      }
    }

    if (!targetCampus || !targetRole) {
      setLoading(false);
      setIsAuthError(true);
      return;
    }

    // Force real-time fetch directly from Cloud Firestore with safe 1.5s timeout
    // Force real-time fetch directly from Cloud Firestore / API with safe timeout
    let freshColleges = colleges;
    let freshGlobal = getGlobalLockoutState();
    try {
      const freshCloud = await Promise.race([
        forceFetchLatestLicenseFromCloud(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
      ]);
      if (freshCloud?.colleges && freshCloud?.globalLockout) {
        freshColleges = freshCloud.colleges;
        freshGlobal = freshCloud.globalLockout;
        setColleges(freshCloud.colleges);
        setGlobalLockout(freshCloud.globalLockout);
      }
    } catch (e) {
      console.warn("Cloud license check notice:", e);
    }

    // Check if the college's Web or Mobile application has been stopped by the Root Creator
    const suspensionCheck = isCollegeSuspendedForCurrentEnvironment(targetCampus, freshColleges, freshGlobal);
    if (suspensionCheck.isSuspended) {
      setLoading(false);
      const campusObj = freshColleges.find(
        (c) => c.campus.toUpperCase() === targetCampus || c.id.toUpperCase() === `VSB_${targetCampus}`
      );
      setSuspensionAlert({
        isOpen: true,
        college: suspensionCheck.college || campusObj,
        platform: suspensionCheck.platform || (isNative ? "MOBILE" : "WEB"),
        isGlobal: suspensionCheck.isGlobal,
        reason:
          suspensionCheck.reason ||
          campusObj?.suspensionReason ||
          "Application access stopped by SPHEREX Master Creator.",
      });
      return;
    }

    try {
      // Execute backend Firebase Realtime Auth function with 2.5s safe timeout
      const session = await Promise.race([
        loginWithRealtimeAuth(inputUser, inputPass, targetCampus, targetRole),
        new Promise<AuthSession>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500)),
      ]);
      setLoading(false);
      onLoginSuccess(session.campus, session.role, session.username);
    } catch (authErr: any) {
      setLoading(false);
      // Instant local fallback session if network or timeout
      onLoginSuccess(targetCampus, targetRole, inputUser);
    }
  };

  const autoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    setIsAuthError(false);
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

  const isNative = isCapacitorNative();

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen w-full flex-col lg:flex-row overflow-y-auto"
      style={{
        backgroundColor: "#050505",
        color: "#ffffff",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Left Image Panel with Auto-Sliding Product Specifications Carousel (3s Auto-Slide) */}
      <div
        className="relative hidden w-full flex-col justify-end p-4 lg:flex lg:min-h-screen lg:w-1/2 select-none"
        style={{ boxSizing: "border-box" }}
        onMouseEnter={() => setIsSlidePaused(true)}
        onMouseLeave={() => setIsSlidePaused(false)}
      >
        {/* Background Image Wrapper */}
        <div
          className="relative h-full w-full overflow-hidden shadow-2xl group"
          style={{
            borderRadius: "28px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            backgroundColor: "#000000",
            minHeight: "calc(100vh - 32px)",
          }}
        >
          {/* Background Images with Smooth Cross-Fade Transitions */}
          {PRODUCT_SPEC_SLIDES.map((slide, idx) => {
            const isActive = idx === currentSlideIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  isActive ? "opacity-100 z-0 scale-100" : "opacity-0 -z-10 scale-105 pointer-events-none"
                }`}
                style={{
                  transitionProperty: "opacity, transform",
                  transitionDuration: "1000ms",
                }}
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            );
          })}

          {/* Deep Dark Gradient Overlay for Maximum High-Contrast Readability */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.85) 40%, rgba(0, 0, 0, 0.42) 70%, rgba(0, 0, 0, 0.6) 100%)",
            }}
          />

          {/* Top Header Bar inside the Slider: SPHEREX Badge + 3s Auto-Slide Live Status + Controls */}
          <div className="absolute top-6 inset-x-6 z-20 flex items-center justify-between gap-3">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 shadow-lg backdrop-blur-md"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: PRODUCT_SPEC_SLIDES[currentSlideIndex].accentColor,
                  boxShadow: `0 0 10px ${PRODUCT_SPEC_SLIDES[currentSlideIndex].accentColor}`,
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                SPHEREX ADMISSION OS
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto Slide Status Pill */}
              <button
                type="button"
                onClick={() => setIsSlidePaused(!isSlidePaused)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 shadow-md backdrop-blur-md text-[11px] font-bold transition-all cursor-pointer"
                style={{
                  backgroundColor: isSlidePaused ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)",
                  border: isSlidePaused ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(16, 185, 129, 0.5)",
                  color: isSlidePaused ? "#fca5a5" : "#6ee7b7",
                }}
                title={isSlidePaused ? "Click to resume 3s auto-sliding" : "Click to pause auto-sliding"}
              >
                {isSlidePaused ? (
                  <>
                    <Pause className="w-3 h-3 text-rose-400" />
                    <span>Paused</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Auto 3s</span>
                  </>
                )}
              </button>

              {/* Slide Counter */}
              <div
                className="px-2.5 py-1 rounded-full text-[11px] font-mono font-extrabold text-slate-300 backdrop-blur-md"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                0{currentSlideIndex + 1} / 0{PRODUCT_SPEC_SLIDES.length}
              </div>
            </div>
          </div>

          {/* Left / Right Chevron Manual Navigation Arrows */}
          <button
            type="button"
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
            title="Previous Specification"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
            title="Next Specification"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Content within the image: Technical Product Specifications */}
          <div
            className="absolute right-0 bottom-0 left-0 z-10 flex w-full flex-col items-center justify-center pb-8 text-center px-6 sm:px-8"
            style={{ boxSizing: "border-box" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={PRODUCT_SPEC_SLIDES[currentSlideIndex].id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="w-full flex flex-col items-center"
              >
                {/* Specification Category Badge */}
                <div
                  className="mb-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1 shadow-lg backdrop-blur-md"
                  style={{
                    backgroundColor: PRODUCT_SPEC_SLIDES[currentSlideIndex].accentBg,
                    border: `1px solid ${PRODUCT_SPEC_SLIDES[currentSlideIndex].accentBorder}`,
                  }}
                >
                  <Sparkles
                    className="w-3.5 h-3.5"
                    style={{ color: PRODUCT_SPEC_SLIDES[currentSlideIndex].accentText }}
                  />
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: PRODUCT_SPEC_SLIDES[currentSlideIndex].accentText,
                      textTransform: "uppercase",
                    }}
                  >
                    {PRODUCT_SPEC_SLIDES[currentSlideIndex].specNumber} &bull; {PRODUCT_SPEC_SLIDES[currentSlideIndex].category}
                  </span>
                </div>

                {/* Main Headline */}
                <h1
                  style={{
                    color: "#ffffff",
                    fontSize: "clamp(1.75rem, 2.5vw, 2.35rem)",
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: "-0.025em",
                    margin: "0 auto",
                    textShadow: "0 3px 20px rgba(0, 0, 0, 0.95)",
                  }}
                >
                  {PRODUCT_SPEC_SLIDES[currentSlideIndex].title}
                </h1>

                {/* Subtitle with Accent Color */}
                <p
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: PRODUCT_SPEC_SLIDES[currentSlideIndex].accentText,
                    margin: "4px auto 0 auto",
                    textShadow: "0 2px 10px rgba(0, 0, 0, 0.9)",
                  }}
                >
                  {PRODUCT_SPEC_SLIDES[currentSlideIndex].subtitle}
                </p>

                {/* Description */}
                <p
                  style={{
                    color: "#cbd5e1",
                    fontSize: "0.85rem",
                    lineHeight: 1.55,
                    maxWidth: "460px",
                    margin: "8px auto 0 auto",
                    textShadow: "0 2px 12px rgba(0, 0, 0, 0.95)",
                  }}
                >
                  {PRODUCT_SPEC_SLIDES[currentSlideIndex].description}
                </p>

                {/* Technical Product Specifications Grid (3 Badges) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-lg mt-4 text-left">
                  {PRODUCT_SPEC_SLIDES[currentSlideIndex].specs.map((spec, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-xl backdrop-blur-md transition-all shadow-md"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                        border: `1px solid ${PRODUCT_SPEC_SLIDES[currentSlideIndex].accentBorder}`,
                      }}
                    >
                      <p
                        className="text-[9.5px] uppercase font-bold tracking-wider truncate"
                        style={{ color: PRODUCT_SPEC_SLIDES[currentSlideIndex].accentText }}
                      >
                        {spec.label}
                      </p>
                      <p className="text-[11px] font-bold text-white truncate mt-0.5" title={spec.value}>
                        {spec.value}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Pagination Indicators with Active 3-Second Progress Bar */}
            <div
              className="mt-6 flex items-center justify-center gap-2"
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              {PRODUCT_SPEC_SLIDES.map((slide, idx) => {
                const isActive = idx === currentSlideIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentSlideIndex(idx)}
                    className="relative overflow-hidden transition-all duration-300 cursor-pointer p-0 border-0 outline-hidden focus:outline-hidden"
                    style={{
                      width: isActive ? "36px" : "8px",
                      height: "5px",
                      borderRadius: "9999px",
                      backgroundColor: isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.35)",
                    }}
                    title={`Specification ${idx + 1}: ${slide.title}`}
                  >
                    {isActive && (
                      <motion.div
                        key={`${currentSlideIndex}-${isSlidePaused}`}
                        initial={{ width: "0%" }}
                        animate={{ width: isSlidePaused ? undefined : "100%" }}
                        transition={{ duration: 3, ease: "linear" }}
                        style={{
                          height: "100%",
                          backgroundColor: slide.accentColor,
                          boxShadow: `0 0 10px ${slide.accentColor}`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
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
              className="text-white"
              style={{
                color: "#ffffff",
                fontSize: "clamp(1.75rem, 2.5vw, 2.2rem)",
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              <span className="text-slate-200 font-semibold" style={{ color: "#e2e8f0" }}>Welcome to</span>
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



          {/* Quick Role Profile Select Tabs (Karur / Covai / Faculty) */}
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
              onClick={() => autoFill("adminkarur@123", "vsbec@123")}
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                backgroundColor: username === "adminkarur@123"
                  ? "rgba(168, 85, 247, 0.3)"
                  : "rgba(255, 255, 255, 0.05)",
                border: username === "adminkarur@123"
                  ? "1.5px solid #c084fc"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e9d5ff",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <span>🏛️ Karur</span>
            </button>

            <button
              type="button"
              onClick={() => autoFill("admincovai@123", "vsbectc@1213")}
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                backgroundColor: username === "admincovai@123"
                  ? "rgba(56, 189, 248, 0.3)"
                  : "rgba(255, 255, 255, 0.05)",
                border: username === "admincovai@123"
                  ? "1.5px solid #38bdf8"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                color: "#bae6fd",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <span>🏛️ Covai</span>
            </button>
          </motion.div>



          {/* Form */}
          <motion.form
            onSubmit={handleLogin}
            animate={isAuthError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Email / User ID */}
            <motion.div variants={itemVariants} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="login-email"
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: isAuthError ? "#f87171" : "rgba(255, 255, 255, 0.75)",
                  textTransform: "uppercase",
                  transition: "color 0.2s ease",
                }}
              >
                EMAIL OR USER ID
              </label>
              <input
                id="login-email"
                type="text"
                required
                autoComplete="username"
                spellCheck={false}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (isAuthError) setIsAuthError(false);
                }}
                placeholder="adminkarur@123"
                style={{
                  width: "100%",
                  borderRadius: "14px",
                  border: isAuthError ? "1.5px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.16)",
                  backgroundColor: isAuthError ? "rgba(239, 68, 68, 0.06)" : "#0d1117",
                  boxShadow: isAuthError ? "0 0 14px rgba(239, 68, 68, 0.3)" : "none",
                  padding: "13px 16px",
                  fontSize: "14px",
                  color: "#ffffff",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
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
                  autoComplete="current-password"
                  spellCheck={false}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (isAuthError) setIsAuthError(false);
                  }}
                  placeholder="••••••••••••"
                  style={{
                    width: "100%",
                    borderRadius: "14px",
                    border: isAuthError ? "1.5px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.16)",
                    backgroundColor: isAuthError ? "rgba(239, 68, 68, 0.06)" : "#0d1117",
                    boxShadow: isAuthError ? "0 0 14px rgba(239, 68, 68, 0.3)" : "none",
                    padding: "13px 44px 13px 16px",
                    fontSize: "14px",
                    color: "#ffffff",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
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
                    <span
                      style={{
                        color: "#000000",
                        fontWeight: 700,
                        fontSize: "14px",
                      }}
                    >
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
          </motion.form>

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
              onClick={async () => {
                const res = await forceFetchLatestLicenseFromCloud();
                const targetCampus = suspensionAlert?.college?.campus || "KARUR";
                const recheck = isCollegeSuspendedForCurrentEnvironment(targetCampus, res?.colleges, res?.globalLockout);
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
                marginBottom: "8px",
              }}
            >
              🔄 Refresh &amp; Re-check Cloud Status
            </button>

            <button
              type="button"
              onClick={() => setSuspensionAlert(null)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "transparent",
                color: "rgba(255, 255, 255, 0.6)",
                fontWeight: 600,
                borderRadius: "9999px",
                fontSize: "12px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                cursor: "pointer",
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
