"use client";

import { useState, useEffect, useMemo } from "react";
import { CampusLocation, Lead, Application, CourseProgram, Teacher } from "@/types/crm";
import {
  getAnnualRenewalData,
  setSimulatedQuotaMode,
  resetOverageLedger,
  MAX_FREE_LEAD_LIMIT,
  PRICE_PER_EXTRA_LEAD,
  BASE_ANNUAL_RENEWAL_FEE,
  getEffectiveLeadCount,
  AnnualRenewalBillingRecord,
} from "@/lib/leadQuotaService";
import {
  normalizeAllFirebasePhones,
  fetchPaymentsFromFirebase,
  fetchTeachersFromFirebase,
  fetchCoursesFromFirebase,
  DEFAULT_COURSES,
} from "@/lib/firebaseSync";
import { MOCK_TEACHERS } from "@/lib/mockData";
import {
  CollegeClientLicense,
  GlobalLockoutState,
  getAllCollegeLicenses,
  getGlobalLockoutState,
  forceFetchLatestLicenseFromCloud,
  setCollegeWebApplicationStatus,
  setCollegeMobileApplicationStatus,
  freezeCollegeEntireApplication,
  setGlobalWebStatus,
  setGlobalMobileStatus,
  freezeAllApplicationsGlobally,
  restoreAllApplicationsGlobally,
  recordCollegePaymentAndOpenApp,
  registerNewCollegeClient,
  listenToCollegeLicenses,
  LICENSE_EVENT_KEY,
} from "@/lib/collegeLicenseService";
import {
  getCreatorQrSettings,
  saveCreatorQrSettings,
  getAllLeadQrPayments,
  calculateLeadQrRevenueMetrics,
  CreatorQrSettings,
  LeadQrPaymentRecord,
  QR_SETTINGS_EVENT,
  QR_PAYMENT_EVENT,
} from "@/lib/leadPaymentQrService";
import {
  ShieldAlert,
  Crown,
  Key,
  Database,
  Cpu,
  RefreshCw,
  Server,
  Layers,
  DollarSign,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Building,
  Building2,
  Users,
  Smartphone,
  Globe,
  Sliders,
  Terminal,
  LogOut,
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  FileSpreadsheet,
  CreditCard,
  Plus,
  X,
  Check,
  Power,
  ShieldCheck,
  QrCode,
  Upload,
  BookOpen,
  GraduationCap,
  School,
  Share2,
  Compass,
  Bug,
} from "lucide-react";
import { calculateAllSourcesTelemetry } from "@/lib/leadSourceAnalytics";
import {
  listenToBugReports,
  updateBugStatus,
  deleteBugReport,
  calculateBugMetrics,
  saveBugReport,
  BugReport,
  BugStatus,
  BugSeverity,
} from "@/lib/bugReportService";

interface CreatorControlModuleProps {
  onTriggerToast: (msg: string) => void;
  currentLeadsCount?: number;
  applicants?: (Lead & { application: Application })[];
  onLogout?: () => void;
  onSwitchCampus?: (campus: CampusLocation) => void;
  currentCampus?: CampusLocation;
}

export default function CreatorControlModule({
  onTriggerToast,
  currentLeadsCount = 0,
  applicants = [],
  onLogout,
  onSwitchCampus,
  currentCampus = "KARUR",
}: CreatorControlModuleProps) {
  // College Clients & Payments State
  const [colleges, setColleges] = useState<CollegeClientLicense[]>(() => getAllCollegeLicenses());
  const [globalLockout, setGlobalLockout] = useState<GlobalLockoutState>(() => getGlobalLockoutState());
  const [selectedCollegeForPayment, setSelectedCollegeForPayment] = useState<CollegeClientLicense | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentRefInput, setPaymentRefInput] = useState<string>("");
  const [autoUnlockOnPayment, setAutoUnlockOnPayment] = useState<boolean>(true);

  // New College Modal State
  const [isAddCollegeModalOpen, setIsAddCollegeModalOpen] = useState(false);
  const [newCollegeData, setNewCollegeData] = useState({
    collegeName: "",
    shortCode: "",
    campus: "",
    location: "",
    adminUsername: "",
    contactEmail: "",
    contactPhone: "",
    baseAnnualFee: 150000,
  });

  // Quota & Annual Renewal State
  const [annualBilling, setAnnualBilling] = useState<AnnualRenewalBillingRecord>(getAnnualRenewalData());
  const [isSimulating, setIsSimulating] = useState(false);
  const [customQuotaLimit, setCustomQuotaLimit] = useState(MAX_FREE_LEAD_LIMIT);
  const [customOveragePrice, setCustomOveragePrice] = useState(PRICE_PER_EXTRA_LEAD);
  const [customBaseAnnualFee, setCustomBaseAnnualFee] = useState(BASE_ANNUAL_RENEWAL_FEE);

  // QR Code & Lead Payments State (Owner Managed)
  const [qrSettings, setQrSettings] = useState<CreatorQrSettings>(() => getCreatorQrSettings());
  const [leadQrPayments, setLeadQrPayments] = useState<LeadQrPaymentRecord[]>(() => getAllLeadQrPayments());
  const [qrRevenueMetrics, setQrRevenueMetrics] = useState(() => calculateLeadQrRevenueMetrics());
  const [isQrSaving, setIsQrSaving] = useState(false);

  // System Controls State
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isBypassQuotaActive, setIsBypassQuotaActive] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"COLLEGES" | "COURSES" | "QR_PAYMENTS" | "QUOTA" | "LICENSING" | "DATABASE" | "SECURITY" | "BUGS">("COLLEGES");

  // Bug Reporting & Live Incident Triage State (User & Admin reported issues received by Master Creator)
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [bugStatusFilter, setBugStatusFilter] = useState<"ALL" | BugStatus>("ALL");
  const [bugSeverityFilter, setBugSeverityFilter] = useState<"ALL" | BugSeverity>("ALL");
  const [bugSearchQuery, setBugSearchQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const bugMetrics = useMemo(() => calculateBugMetrics(bugs), [bugs]);
  // Faculty & Courses Live State for Master Creator Telemetry
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [courses, setCourses] = useState<CourseProgram[]>(DEFAULT_COURSES);
  const [creatorLogs, setCreatorLogs] = useState<Array<{ id: string; time: string; action: string; type: "info" | "warn" | "success" }>>([
    {
      id: "log_1",
      time: new Date().toLocaleTimeString("en-IN"),
      action: "Master Creator Authenticated (spherexnithish#). Full Subsystem Root Control Unlocked.",
      type: "success",
    },
    {
      id: "log_2",
      time: new Date().toLocaleTimeString("en-IN"),
      action: "Active College Clients Loaded: V.S.B. Engineering College & V.S.B. Technical Campus.",
      type: "info",
    },
  ]);

  // Sync colleges registry, global lockout & QR payments whenever updates occur (Cloud + Local)
  useEffect(() => {
    const handleQrUpdate = () => {
      setQrSettings(getCreatorQrSettings());
      setLeadQrPayments(getAllLeadQrPayments());
      setQrRevenueMetrics(calculateLeadQrRevenueMetrics());
    };

    window.addEventListener(QR_SETTINGS_EVENT, handleQrUpdate);
    window.addEventListener(QR_PAYMENT_EVENT, handleQrUpdate);

    // Live continuous subscription across Firebase Firestore, RTDB, and Cloud API
    const unsubscribeLicenses = listenToCollegeLicenses((latestColleges, latestGlobal) => {
      setColleges(latestColleges);
      setGlobalLockout(latestGlobal);
    });

    // Immediately fetch latest persisted licenses from disk and server
    forceFetchLatestLicenseFromCloud().then((res) => {
      if (res?.colleges) setColleges(res.colleges);
      if (res?.globalLockout) setGlobalLockout(res.globalLockout);
    }).catch(() => { });

    // Live fetch of faculty and degree programs for Creator telemetry
    fetchTeachersFromFirebase()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTeachers(data);
      })
      .catch((e) => console.warn("Notice loading faculty in creator view:", e));

    fetchCoursesFromFirebase()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCourses(data);
      })
      .catch((e) => console.warn("Notice loading courses in creator view:", e));

    // Live continuous subscription to Bug Reports raised by Admin & Users
    const unsubscribeBugs = listenToBugReports((latestBugs) => {
      setBugs(latestBugs);
    });

    return () => {
      window.removeEventListener(QR_SETTINGS_EVENT, handleQrUpdate);
      window.removeEventListener(QR_PAYMENT_EVENT, handleQrUpdate);
      unsubscribeLicenses();
      unsubscribeBugs();
    };
  }, []);

  // Load latest billing data on mount
  useEffect(() => {
    setAnnualBilling(getAnnualRenewalData());
    const savedMaintenance = localStorage.getItem("spherex_maintenance_mode");
    if (savedMaintenance === "true") setIsMaintenanceMode(true);
    const savedBypass = localStorage.getItem("spherex_bypass_quota");
    if (savedBypass === "true") setIsBypassQuotaActive(true);
  }, []);

  const addLog = (action: string, type: "info" | "warn" | "success" = "info") => {
    setCreatorLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        time: new Date().toLocaleTimeString("en-IN"),
        action,
        type,
      },
      ...prev.slice(0, 20),
    ]);
  };

  // 1. TOTAL STUDENT COUNT (COUNT ONLY, ZERO PERSONAL STUDENT DATA)
  const effectiveTotalLeads = getEffectiveLeadCount(currentLeadsCount || applicants.length);
  const totalStudentsCount = effectiveTotalLeads;
  const karurStudentsCount = applicants.filter((a) => a.campus === "KARUR").length;
  const covaiStudentsCount = applicants.filter((a) => a.campus === "COIMBATORE").length;
  const percentQuotaUsed = Math.min(100, Number(((effectiveTotalLeads / customQuotaLimit) * 100).toFixed(1)));
  const isCapReached = effectiveTotalLeads >= customQuotaLimit;
  const remainingFreeQuota = Math.max(0, customQuotaLimit - effectiveTotalLeads);

  // Student Funnel Stages Breakdown (pure aggregate counts)
  const studentFunnelCounts = useMemo(() => {
    const counts = { inquiry: 0, counseling: 0, applications: 0, admitted: 0 };
    applicants.forEach((a) => {
      const st = (a.status || "NEW").toUpperCase();
      if (st === "NEW" || st === "INQUIRY") counts.inquiry++;
      else if (st === "CONTACTED" || st === "COUNSELING") counts.counseling++;
      else if (st === "APPLICATION" || st === "IN_REVIEW") counts.applications++;
      else counts.admitted++;
    });
    return counts;
  }, [applicants]);

  // 1.5 ALL LEAD SOURCES TELEMETRY (PROJECT EXPO, CSV, SOCIAL MEDIA ADS, ETC.)
  const leadSourceTelemetry = useMemo(() => {
    return calculateAllSourcesTelemetry(applicants);
  }, [applicants]);

  // 2. TEACHER COUNT (FACULTY METRICS)
  const totalTeachersCount = teachers.length;
  const activeTeachersCount = teachers.filter((t) => (t.status || "").toUpperCase() === "ACTIVE").length;
  const offlineTeachersCount = Math.max(0, totalTeachersCount - activeTeachersCount);
  const karurTeachersCount = teachers.filter((t) => t.campus === "KARUR").length;
  const covaiTeachersCount = teachers.filter((t) => t.campus === "COIMBATORE").length;

  // Faculty Department Staffing breakdown (counts only)
  const departmentStaffCounts = useMemo(() => {
    const map: Record<string, number> = {};
    teachers.forEach((t) => {
      const dept = t.department || "General Engineering";
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [teachers]);

  // 3. COURSES & DEMAND METRICS
  const totalCoursesCount = courses.length;
  const totalKarurSeats = courses.reduce((acc, c) => acc + (c.karurSeats || 0), 0);
  const totalCoimbatoreSeats = courses.reduce((acc, c) => acc + (c.coimbatoreSeats || 0), 0);

  const courseDemandMap = useMemo(() => {
    const map: Record<string, number> = {};
    courses.forEach((c) => {
      map[c.name] = 0;
    });
    applicants.forEach((a) => {
      const target = (a.courseInterest || "").toLowerCase().trim();
      const matched = courses.find(
        (c) =>
          c.name.toLowerCase() === target ||
          target.includes(c.code.toLowerCase()) ||
          c.code.toLowerCase().includes(target)
      );
      const name = matched ? matched.name : (a.courseInterest || "General Engineering");
      map[name] = (map[name] || 0) + 1;
    });
    return map;
  }, [courses, applicants]);

  // Total finances across all client colleges
  const totalAnnualBilled = colleges.reduce((acc, c) => acc + (c.totalPayableAmount || 0), 0);
  const totalRevenueCollected = colleges.reduce((acc, c) => acc + (c.amountPaid || 0), 0);
  const totalOutstandingBalance = colleges.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
  const totalWebStoppedCount = colleges.filter((c) => c.isWebApplicationStopped).length;
  const totalMobileStoppedCount = colleges.filter((c) => c.isMobileApplicationStopped).length;

  // Toggle Web Application Stop/Open for a college
  const handleToggleWebApp = (college: CollegeClientLicense) => {
    const willStop = !college.isWebApplicationStopped;
    const updated = setCollegeWebApplicationStatus(
      college.id,
      willStop,
      willStop ? "Creator stopped Web Application access due to pending subscription payment." : ""
    );
    setColleges(updated);
    if (willStop) {
      onTriggerToast(`🛑 Web Application STOPPED for ${college.collegeName}!`);
      addLog(`Creator STOPPED Web Application for ${college.collegeName} (${college.id}).`, "warn");
    } else {
      onTriggerToast(`🟢 Web Application OPENED & RESTORED for ${college.collegeName}!`);
      addLog(`Creator OPENED Web Application for ${college.collegeName} (${college.id}).`, "success");
    }
  };

  // Toggle Mobile App Stop/Open for a college
  const handleToggleMobileApp = (college: CollegeClientLicense) => {
    const willStop = !college.isMobileApplicationStopped;
    const updated = setCollegeMobileApplicationStatus(
      college.id,
      willStop,
      willStop ? "Creator stopped Native Mobile App access due to pending subscription payment." : ""
    );
    setColleges(updated);
    if (willStop) {
      onTriggerToast(`🛑 Native Mobile App STOPPED for ${college.collegeName}!`);
      addLog(`Creator STOPPED Mobile App for ${college.collegeName} (${college.id}).`, "warn");
    } else {
      onTriggerToast(`🟢 Native Mobile App OPENED & RESTORED for ${college.collegeName}!`);
      addLog(`Creator OPENED Mobile App for ${college.collegeName} (${college.id}).`, "success");
    }
  };

  // One-Click Freeze or Restore Entire Institution (Web + Mobile)
  const handleToggleEntireInstitution = (college: CollegeClientLicense) => {
    const isCurrentlyStopped = college.isWebApplicationStopped && college.isMobileApplicationStopped;
    const willFreeze = !isCurrentlyStopped;
    const updated = freezeCollegeEntireApplication(
      college.id,
      willFreeze,
      willFreeze ? "Annual software license payment defaulted. Access restricted by SPHEREX Creator." : ""
    );
    setColleges(updated);
    if (willFreeze) {
      onTriggerToast(`🚨 Entire Institution ACCESS FROZEN for ${college.collegeName}! Both Web & Mobile stopped.`);
      addLog(`Creator completely FROZE ${college.collegeName} (Web & Mobile stopped).`, "warn");
    } else {
      onTriggerToast(`✨ Restored FULL Web & Mobile Application access for ${college.collegeName}!`);
      addLog(`Creator restored full access for ${college.collegeName} (Web & Mobile re-opened).`, "success");
    }
  };

  // Master Global Killswitch: Stop or Restore ALL Web Applications worldwide
  const handleToggleGlobalWeb = () => {
    const willStop = !globalLockout.isGlobalWebStopped;
    const updated = setGlobalWebStatus(
      willStop,
      willStop ? "SPHEREX Master Creator (Nithish Kumar) has stopped Web Application access across all institutions." : ""
    );
    setGlobalLockout(updated);
    if (willStop) {
      onTriggerToast("🛑 ALL Web Applications STOPPED worldwide across every system!");
      addLog("Master Creator STOPPED Web Applications GLOBALLY on all systems.", "warn");
    } else {
      onTriggerToast("🟢 ALL Web Applications RESTORED & OPENED globally!");
      addLog("Master Creator RESTORED Web Applications globally.", "success");
    }
  };

  // Master Global Killswitch: Stop or Restore ALL Mobile Applications worldwide
  const handleToggleGlobalMobile = () => {
    const willStop = !globalLockout.isGlobalMobileStopped;
    const updated = setGlobalMobileStatus(
      willStop,
      willStop ? "SPHEREX Master Creator (Nithish Kumar) has stopped Native Mobile App access across all institutions." : ""
    );
    setGlobalLockout(updated);
    if (willStop) {
      onTriggerToast("🛑 ALL Mobile Applications STOPPED worldwide across all devices!");
      addLog("Master Creator STOPPED Mobile Apps GLOBALLY across all devices.", "warn");
    } else {
      onTriggerToast("🟢 ALL Mobile Applications RESTORED & OPENED globally!");
      addLog("Master Creator RESTORED Mobile Apps globally.", "success");
    }
  };

  // Master Emergency Freeze: Freeze EVERY Web & Mobile app simultaneously
  const handleEmergencyFreezeAll = () => {
    if (!confirm("⚠️ EMERGENCY LOCKDOWN CONFIRMATION:\n\nAre you sure you want to STOP ALL Web & Mobile applications for ALL colleges worldwide? No college user will be able to access the system until you restore it.")) {
      return;
    }
    const res = freezeAllApplicationsGlobally(
      true,
      "EMERGENCY SYSTEM LOCKOUT: Master Creator (Nithish Kumar) has stopped all Web & Mobile application access."
    );
    setColleges(res.colleges);
    setGlobalLockout(res.globalLockout);
    onTriggerToast("🚨 EMERGENCY FREEZE ACTIVATED: Every Web & Mobile application locked worldwide!");
    addLog("Master Creator activated EMERGENCY FREEZE: All Web and Mobile apps stopped.", "warn");
  };

  // Master Restore All: Re-open all applications everywhere
  const handleRestoreAllSystems = () => {
    const res = restoreAllApplicationsGlobally();
    setColleges(res.colleges);
    setGlobalLockout(res.globalLockout);
    onTriggerToast("✨ ALL SYSTEMS RESTORED: All Web & Mobile applications are now fully open!");
    addLog("Master Creator restored all applications globally (Web & Mobile open).", "success");
  };

  // Open Record Payment Modal
  const handleOpenPaymentModal = (college: CollegeClientLicense) => {
    setSelectedCollegeForPayment(college);
    setPaymentAmountInput(college.outstandingBalance > 0 ? college.outstandingBalance : college.totalPayableAmount);
    setPaymentRefInput(`NEFT-${college.shortCode}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setAutoUnlockOnPayment(true);
  };

  // Submit Payment Clearance & Auto-Open Application
  const handleConfirmPayment = () => {
    if (!selectedCollegeForPayment) return;
    if (paymentAmountInput <= 0) {
      alert("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    const { updatedList, targetCollege } = recordCollegePaymentAndOpenApp(
      selectedCollegeForPayment.id,
      paymentAmountInput,
      paymentRefInput
    );
    setColleges(updatedList);
    onTriggerToast(
      `💳 Received ₹${paymentAmountInput.toLocaleString("en-IN")} from ${selectedCollegeForPayment.collegeName}! Application & Mobile access OPENED.`
    );
    addLog(
      `Creator cleared payment of ₹${paymentAmountInput.toLocaleString("en-IN")} for ${selectedCollegeForPayment.collegeName}. Application unlocked.`,
      "success"
    );
    setSelectedCollegeForPayment(null);
  };

  // Upload Custom Payment QR Image (Owner / Creator)
  const handleUploadQrImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, JPEG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const updated = saveCreatorQrSettings({ qrCodeImageUrl: base64 });
        setQrSettings(updated);
        onTriggerToast("📸 Custom Payment QR Code image uploaded and activated for all lead forms!");
        addLog("Creator uploaded new custom Payment QR Code image.", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset to Default Auto-Generated UPI QR
  const handleResetToUpiQr = () => {
    const upiPayload = `upi://pay?pa=${encodeURIComponent(qrSettings.upiId)}&pn=${encodeURIComponent(qrSettings.payeeName)}&am=${qrSettings.leadPriceAmount}&cu=INR&tn=${encodeURIComponent("SPHEREX Student Lead Registration")}`;
    const defaultUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiPayload)}&margin=12&format=png`;
    const updated = saveCreatorQrSettings({ qrCodeImageUrl: defaultUrl });
    setQrSettings(updated);
    onTriggerToast("🔄 Reset to dynamic UPI QR code generator.");
    addLog("Creator reset QR code to dynamic UPI generator.", "info");
  };

  // Save QR Settings Form
  const handleSaveQrSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsQrSaving(true);
    const updated = saveCreatorQrSettings(qrSettings);
    setQrSettings(updated);
    setIsQrSaving(false);
    onTriggerToast("💾 Saved Payment QR Code settings successfully!");
    addLog(`Creator updated Payment QR: UPI=${qrSettings.upiId}, Fee=₹${qrSettings.leadPriceAmount}.`, "success");
  };

  // Register New Client College
  const handleCreateNewCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeData.collegeName || !newCollegeData.shortCode) {
      alert("Please provide at least College Name and Short Code.");
      return;
    }

    const updated = registerNewCollegeClient({
      id: `COLLEGE_${newCollegeData.shortCode.toUpperCase()}`,
      campus: newCollegeData.campus.toUpperCase() || newCollegeData.shortCode.toUpperCase(),
      collegeName: newCollegeData.collegeName,
      shortCode: newCollegeData.shortCode.toUpperCase(),
      location: newCollegeData.location || "Tamil Nadu, India",
      adminUsername: newCollegeData.adminUsername || `admin_${newCollegeData.shortCode.toLowerCase()}@123`,
      contactEmail: newCollegeData.contactEmail || "principal@college.edu",
      contactPhone: newCollegeData.contactPhone || "+91 99999 00000",
      baseAnnualFee: Number(newCollegeData.baseAnnualFee) || 150000,
    });

    setColleges(updated);
    setIsAddCollegeModalOpen(false);
    onTriggerToast(`🎉 Registered new client college: ${newCollegeData.collegeName}!`);
    addLog(`Creator registered new institutional client: ${newCollegeData.collegeName}.`, "success");
    setNewCollegeData({
      collegeName: "",
      shortCode: "",
      campus: "",
      location: "",
      adminUsername: "",
      contactEmail: "",
      contactPhone: "",
      baseAnnualFee: 150000,
    });
  };

  // Toggle simulation mode
  const handleToggleSimulation = () => {
    const nextState = !isSimulating;
    setIsSimulating(nextState);
    setSimulatedQuotaMode(nextState);
    setAnnualBilling(getAnnualRenewalData());
    if (nextState) {
      onTriggerToast("⚡ Simulated 1,00,000 lead quota limit triggered for testing!");
      addLog("Creator triggered 1,00,000 quota limit test simulation.", "warn");
    } else {
      onTriggerToast("✅ Returned to real database lead count.");
      addLog("Creator deactivated test simulation. Real database count restored.", "success");
    }
  };

  // Reset overage ledger
  const handleResetOverageLedger = () => {
    if (confirm("Reset accumulated overage leads back to 0 for V.S.B. institutional license?")) {
      const updated = resetOverageLedger();
      setAnnualBilling(updated);
      onTriggerToast("🔄 Institutional overage ledger reset to base annual fee (₹1,50,000).");
      addLog("Creator reset accumulated overage leads ledger to 0.", "info");
    }
  };

  // Standardize All Student Phones in Firebase to +91-
  const handleNormalizePhones = async () => {
    setIsNormalizing(true);
    try {
      const result = await normalizeAllFirebasePhones();
      onTriggerToast(`📱 Standardized ${result.updatedStudents} student phone numbers with +91- in Firebase!`);
      addLog(`Normalized ${result.updatedStudents} phone numbers in Firebase to compulsory +91-.`, "success");
    } catch (err: any) {
      onTriggerToast(`⚠️ Normalization notice: ${err?.message || "Check connection"}`);
      addLog(`Firebase phone normalization notice: ${err?.message}`, "warn");
    } finally {
      setIsNormalizing(false);
    }
  };

  // Toggle Global Maintenance Mode
  const handleToggleMaintenance = () => {
    const next = !isMaintenanceMode;
    setIsMaintenanceMode(next);
    localStorage.setItem("spherex_maintenance_mode", String(next));
    if (next) {
      onTriggerToast("🔒 Master Maintenance Mode ACTIVATED! College Admins & Teachers blocked.");
      addLog("Master Creator activated System Maintenance Mode.", "warn");
    } else {
      onTriggerToast("🟢 Master Maintenance Mode DEACTIVATED. Systems operational.");
      addLog("Master Creator deactivated System Maintenance Mode.", "success");
    }
  };

  // Toggle Admin Quota Bypass Lock
  const handleToggleBypass = () => {
    const next = !isBypassQuotaActive;
    setIsBypassQuotaActive(next);
    localStorage.setItem("spherex_bypass_quota", String(next));
    if (next) {
      onTriggerToast("🔓 Quota Bypass ACTIVE: Admins can add leads without overage surcharge!");
      addLog("Creator enabled Admin Quota Bypass.", "warn");
    } else {
      onTriggerToast("🔒 Quota Bypass DISABLED: Strict 1,00,000 cap enforced!");
      addLog("Creator re-enforced strict 1,00,000 quota limit.", "info");
    }
  };

  // Print College-Specific Tax Invoice
  const handlePrintCollegeInvoice = (college: CollegeClientLicense) => {
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SPHEREX OS - Institutional Tax Invoice: ${college.collegeName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #f59e0b; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
          .logo span { color: #f59e0b; }
          .badge { background: #fef3c7; color: #b45309; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; border: 1px solid #fde68a; }
          .title { font-size: 20px; font-weight: bold; margin-top: 30px; color: #0f172a; }
          .meta-table, .line-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          .meta-table td { padding: 8px 0; }
          .line-table th { background: #0f172a; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
          .line-table td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; }
          .total-box { margin-top: 30px; float: right; width: 340px; border: 2px solid #0f172a; border-radius: 12px; padding: 16px; background: #f8fafc; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .total-row.grand { font-size: 18px; font-weight: 900; border-top: 2px dashed #cbd5e1; padding-top: 10px; margin-top: 6px; color: #0f172a; }
          .footer { margin-top: 120px; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }
          .status-paid { color: #059669; font-weight: bold; }
          .status-due { color: #dc2626; font-weight: bold; }
          @media print { body { margin: 15mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">SPHEREX <span>OS</span></div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
              Intelligent Admission CRM & Multi-Campus Enterprise Operating System
            </div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">
              Root Developer & Architecture: <strong>Nithish Kumar</strong> (spherexnithish#)
            </div>
          </div>
          <div style="text-align: right;">
            <span class="badge">OFFICIAL INSTITUTIONAL INVOICE</span>
            <div style="font-size: 13px; font-weight: bold; margin-top: 10px;">INVOICE #: SPH-TAX-${new Date().getFullYear()}-${college.shortCode}</div>
            <div style="font-size: 12px; color: #64748b;">Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</div>
            <div style="font-size: 12px; color: #64748b;">Payment Due: ${college.paymentDueDate}</div>
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Billed To Institution:</strong><br />
              <strong style="font-size: 16px; color: #0f172a;">${college.collegeName}</strong><br />
              <span>Campus Branch: ${college.location}</span><br />
              <span>Institutional Admin: ${college.adminUsername}</span><br />
              <span>Contact: ${college.contactEmail} • ${college.contactPhone}</span>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Licensing & Deployment Scope:</strong><br />
              <strong style="color: #0f172a;">Dual-Platform Enterprise License</strong><br />
              <span>• Web Application (Desktop & Tablet CRM)</span><br />
              <span>• Native Android & iOS Mobile Apps (Capacitor)</span><br />
              <span>• Up to 1,00,000 Included Free Leads</span>
            </td>
          </tr>
        </table>

        <table class="line-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Platform / Coverage</th>
              <th>Billing Terms</th>
              <th style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>SPHEREX OS Annual Platform Software Subscription</strong><br />
                <span style="font-size: 12px; color: #64748b;">Includes full database hosting, real-time Firebase sync, multi-faculty access, and student admission pipelines.</span>
              </td>
              <td>Web + Native Mobile App</td>
              <td>Annual Flat Fee</td>
              <td style="text-align: right; font-weight: bold;">₹${college.baseAnnualFee.toLocaleString("en-IN")}.00</td>
            </tr>
            <tr>
              <td>
                <strong>Lead Quota Overage Surcharges</strong><br />
                <span style="font-size: 12px; color: #64748b;">${college.extraLeadsCount} student leads added beyond 1,00,000 included threshold @ ₹${PRICE_PER_EXTRA_LEAD}/lead</span>
              </td>
              <td>Cloud Database</td>
              <td>₹${PRICE_PER_EXTRA_LEAD} / extra lead</td>
              <td style="text-align: right; font-weight: bold;">₹${college.overageSurcharge.toLocaleString("en-IN")}.00</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row">
            <span>Total Payable Amount:</span>
            <span style="font-weight: bold;">₹${college.totalPayableAmount.toLocaleString("en-IN")}.00</span>
          </div>
          <div class="total-row">
            <span>Amount Cleared / Paid:</span>
            <span style="font-weight: bold; color: #059669;">- ₹${college.amountPaid.toLocaleString("en-IN")}.00</span>
          </div>
          <div class="total-row grand">
            <span>Outstanding Balance Due:</span>
            <span style="color: ${college.outstandingBalance > 0 ? "#dc2626" : "#059669"};">
              ₹${college.outstandingBalance.toLocaleString("en-IN")}.00
            </span>
          </div>
          <div style="margin-top: 10px; font-size: 12px; text-align: right;">
            Status: <span class="${college.paymentStatus === "PAID" ? "status-paid" : "status-due"}">${college.paymentStatus}</span>
          </div>
        </div>

        <div style="clear: both;"></div>

        <div class="footer">
          This is an official computer-generated institutional tax invoice issued by SPHEREX OS Root Administration.<br />
          For software renewal, API key provisioning, or mobile application deployment, contact Master Creator: <strong>Nithish Kumar</strong> (spherexnithish#).
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    }
    addLog(`Generated official PDF invoice for ${college.collegeName}.`, "info");
  };

  // Full Database JSON Snapshot Export (Sanitized: ZERO personal student records)
  const handleExportDatabaseSnapshot = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      creator: "spherexnithish# (Nithish Kumar)",
      totalStudentCount: totalStudentsCount,
      totalTeacherCount: totalTeachersCount,
      totalCoursesCount: totalCoursesCount,
      studentCountsByCampus: {
        KARUR: karurStudentsCount,
        COIMBATORE: covaiStudentsCount,
      },
      teacherCountsByCampus: {
        KARUR: karurTeachersCount,
        COIMBATORE: covaiTeachersCount,
      },
      collegesUsingProduct: colleges.map((c) => ({
        id: c.id,
        collegeName: c.collegeName,
        shortCode: c.shortCode,
        campus: c.campus,
        location: c.location,
        isWebApplicationStopped: c.isWebApplicationStopped,
        isMobileApplicationStopped: c.isMobileApplicationStopped,
        baseAnnualFee: c.baseAnnualFee,
        amountPaid: c.amountPaid,
        outstandingBalance: c.outstandingBalance,
        paymentStatus: c.paymentStatus,
        studentsCount: applicants.filter((a) => a.campus === c.campus).length,
        teachersCount: teachers.filter((t) => t.campus === c.campus).length,
      })),
      coursesCatalog: courses.map((c) => ({
        code: c.code,
        name: c.name,
        dept: c.dept,
        karurSeats: c.karurSeats,
        coimbatoreSeats: c.coimbatoreSeats,
        tuitionFee: c.tuitionFee,
        studentDemandCount: courseDemandMap[c.name] || 0,
      })),
      annualRenewalBilling: annualBilling,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SPHEREX_CREATOR_TELEMETRY_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onTriggerToast("💾 Exported Creator telemetry JSON snapshot (Privacy Protected: 0 student records)!");
    addLog("Creator downloaded aggregate telemetry JSON snapshot.", "success");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ============================================================== */}
      {/* 1. CREATOR IDENTITY BANNER (STRICTLY ISOLATED & EXCLUSIVE)     */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 p-6 md:p-8 border-2 border-amber-500/40 shadow-2xl shadow-amber-950/20">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Crown className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  <span>SPHEREX ROOT MASTER CREATOR</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Full Authority Active
                </span>
                {/* LIVE SYSTEM BUGS INDICATOR */}
                <button
                  type="button"
                  onClick={() => setActiveTab("BUGS")}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${bugMetrics.hasCriticalOpen
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/60 ring-2 ring-rose-500/50 animate-pulse hover:bg-rose-500/30"
                      : bugMetrics.openCount > 0
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                    }`}
                  title="Live Bugs reported by Admin & Faculty. Click to triage."
                >
                  <Bug className="w-3 h-3 text-rose-400" />
                  <span>
                    {bugMetrics.openCount === 0
                      ? "0 Active Bugs"
                      : `${bugMetrics.openCount} Open ${bugMetrics.openCount === 1 ? "Bug" : "Bugs"}${bugMetrics.criticalCount > 0 ? ` (${bugMetrics.criticalCount} CRITICAL)` : ""
                      }`}
                  </span>
                </button>
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Creator & Multi-College Control Center</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium">
                System Architect: <strong className="text-amber-400">Nithish Kumar</strong> • Master ID:{" "}
                <code className="text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded font-mono font-bold">spherexnithish#</code>
              </p>
            </div>
          </div>

          {/* Quick Actions & Logout */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Direct Bugs Tracker Quick Button */}
            <button
              type="button"
              onClick={() => setActiveTab("BUGS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${bugMetrics.hasCriticalOpen
                  ? "bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-400 animate-pulse"
                  : bugMetrics.openCount > 0
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                }`}
              title="Inspect user reported bugs and issues"
            >
              <Bug className="w-4 h-4" />
              <span>Bugs ({bugMetrics.openCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddCollegeModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add College</span>
            </button>

            <button
              type="button"
              onClick={handleExportDatabaseSnapshot}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export JSON</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Creator</span>
              </button>
            )}
          </div>
        </div>

        {/* Root Security Isolation Disclaimer */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-amber-300/90 font-mono">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Strict Privacy Active: College Admin & Teacher logins cannot view this portal or credentials.</span>
          </div>
          <div className="text-slate-400 font-mono">
            Active Tenant: <strong className="text-white">{currentCampus}</strong> Campus
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* 2. CREATOR NAVIGATION TABS                                     */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
        {[
          { id: "COLLEGES", label: "🏛️ Overview & Colleges", icon: Building },
          { id: "BUGS", label: `🐞 Bug Tracker (${bugMetrics.openCount})`, icon: Bug },
          { id: "COURSES", label: "📚 Academic Courses Catalog", icon: GraduationCap },
          { id: "QR_PAYMENTS", label: "💳 QR Code & Lead Pricing", icon: QrCode },
          { id: "QUOTA", label: "📊 1,00,000 Quota Engine", icon: Sliders },
          { id: "LICENSING", label: "📄 Dual-Platform Software Licensing", icon: DollarSign },
          { id: "DATABASE", label: "⚡ Firebase Health & Diagnostics", icon: Database },
          { id: "SECURITY", label: "🛡️ Emergency Overrides & Logs", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${isActive
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: CLIENT COLLEGES & EXECUTIVE TELEMETRY (PRIMARY VIEW)    */}
      {/* ============================================================== */}
      {activeTab === "COLLEGES" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 4 CORE EXECUTIVE PILLARS: STUDENTS, TEACHERS, COURSES, COLLEGES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* PILLAR 1: TOTAL STUDENT COUNT (COUNT ONLY) */}
            <div className="p-5 rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 shadow-xl shadow-indigo-950/20 space-y-3 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Total Student Count</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Privacy Protected</span>
                </span>
              </div>
              <div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {totalStudentsCount.toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Overall student leads across all campuses</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Karur Campus:</span>
                  <span className="font-mono font-bold text-amber-300">{karurStudentsCount} students</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Coimbatore Campus:</span>
                  <span className="font-mono font-bold text-sky-300">{covaiStudentsCount} students</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
                  <span>Capacity ({percentQuotaUsed}%):</span>
                  <span className="font-mono font-bold text-emerald-400">{remainingFreeQuota.toLocaleString("en-IN")} Free</span>
                </div>
              </div>
            </div>

            {/* PILLAR 2: TEACHER COUNT */}
            <div className="p-5 rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 shadow-xl shadow-purple-950/20 space-y-3 relative overflow-hidden group hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Teacher Count</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Live Faculty</span>
                </span>
              </div>
              <div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {totalTeachersCount}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Active faculty using SPHEREX CRM</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Karur Faculty:</span>
                  <span className="font-mono font-bold text-amber-300">{karurTeachersCount} teachers</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Coimbatore Faculty:</span>
                  <span className="font-mono font-bold text-sky-300">{covaiTeachersCount} teachers</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
                  <span>Active Now:</span>
                  <span className="font-mono font-bold text-emerald-400">{activeTeachersCount} Online</span>
                </div>
              </div>
            </div>

            {/* PILLAR 3: COURSES */}
            <div className="p-5 rounded-3xl border-2 border-sky-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 shadow-xl shadow-sky-950/20 space-y-3 relative overflow-hidden group hover:border-sky-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                  <span>Academic Courses</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  <span>AICTE / NBA</span>
                </span>
              </div>
              <div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {totalCoursesCount}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Accredited degree programs offered</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Top Program:</span>
                  <span className="font-bold text-white truncate max-w-[130px]">B.E. Computer Science</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Total Seats:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {(totalKarurSeats + totalCoimbatoreSeats).toLocaleString("en-IN")} seats
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
                  <span>Programs Scope:</span>
                  <span className="font-mono font-bold text-sky-400">B.E. & B.Tech Tech</span>
                </div>
              </div>
            </div>

            {/* PILLAR 4: COLLEGES USING MY PRODUCT */}
            <div className="p-5 rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 shadow-xl shadow-amber-950/20 space-y-3 relative overflow-hidden group hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span>Colleges Using Product</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span>Active Clients</span>
                </span>
              </div>
              <div>
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {colleges.length}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Institutions running SPHEREX OS</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Web CRM Status:</span>
                  <span className={totalWebStoppedCount === 0 ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
                    {totalWebStoppedCount === 0 ? "🟢 All Online" : `🛑 ${totalWebStoppedCount} Stopped`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Mobile Apps:</span>
                  <span className={totalMobileStoppedCount === 0 ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
                    {totalMobileStoppedCount === 0 ? "🟢 All Active" : `🛑 ${totalMobileStoppedCount} Stopped`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
                  <span>Annual Cleared:</span>
                  <span className="font-mono font-bold text-emerald-400">₹{totalRevenueCollected.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* MULTI-SOURCE INGESTION TELEMETRY (PROJECT EXPO, CSV, SOCIAL MEDIA, ADS) */}
          <div className="p-6 rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 shadow-xl shadow-indigo-950/20 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-900/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                    <span>Lead Acquisition Sources &amp; Multi-Application Ingestion</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      All Sources Active
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Total leads calculated dynamically from Project Expo, CSV file uploads, Google Ads, Meta Facebook, WhatsApp, and State Counselling.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-slate-300">
                  Dominant: <strong className="text-sky-400">{leadSourceTelemetry.dominantSource.shortLabel}</strong> ({leadSourceTelemetry.dominantSource.percentage}%)
                </span>
              </div>
            </div>

            {/* Ingestion Highlights 5-Card Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Overall Total */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Overall Total</span>
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                </span>
                <p className="text-2xl font-black font-mono text-white">
                  {leadSourceTelemetry.totalLeads.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-500">100% of lead database</p>
              </div>

              {/* Project Expo */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 flex items-center justify-between">
                  <span>Project Expo</span>
                  <School className="w-3.5 h-3.5" />
                </span>
                <p className="text-2xl font-black font-mono text-teal-300">
                  {leadSourceTelemetry.primaryHighlights.expoCount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-500">
                  {leadSourceTelemetry.totalLeads > 0
                    ? ((leadSourceTelemetry.primaryHighlights.expoCount / leadSourceTelemetry.totalLeads) * 100).toFixed(1)
                    : 0}% share
                </p>
              </div>

              {/* CSV Uploads */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-lime-400 flex items-center justify-between">
                  <span>CSV File Uploads</span>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </span>
                <p className="text-2xl font-black font-mono text-lime-300">
                  {leadSourceTelemetry.primaryHighlights.csvCount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-500">
                  {leadSourceTelemetry.totalLeads > 0
                    ? ((leadSourceTelemetry.primaryHighlights.csvCount / leadSourceTelemetry.totalLeads) * 100).toFixed(1)
                    : 0}% share
                </p>
              </div>

              {/* Social Media & Ads */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center justify-between">
                  <span>Social Media &amp; Ads</span>
                  <Share2 className="w-3.5 h-3.5" />
                </span>
                <p className="text-2xl font-black font-mono text-indigo-300">
                  {leadSourceTelemetry.primaryHighlights.socialCount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-500">
                  {leadSourceTelemetry.totalLeads > 0
                    ? ((leadSourceTelemetry.primaryHighlights.socialCount / leadSourceTelemetry.totalLeads) * 100).toFixed(1)
                    : 0}% share
                </p>
              </div>

              {/* TNEA Counselling */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
                  <span>TNEA Counselling</span>
                  <Compass className="w-3.5 h-3.5" />
                </span>
                <p className="text-2xl font-black font-mono text-cyan-300">
                  {leadSourceTelemetry.primaryHighlights.counsellingCount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-500">
                  {leadSourceTelemetry.totalLeads > 0
                    ? ((leadSourceTelemetry.primaryHighlights.counsellingCount / leadSourceTelemetry.totalLeads) * 100).toFixed(1)
                    : 0}% share
                </p>
              </div>
            </div>

            {/* Proportion Bar */}
            {leadSourceTelemetry.totalLeads > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  {leadSourceTelemetry.channels
                    .filter((ch) => ch.count > 0)
                    .map((ch) => {
                      const pct = (ch.count / leadSourceTelemetry.totalLeads) * 100;
                      return (
                        <div
                          key={ch.key}
                          style={{ width: `${pct}%`, backgroundColor: ch.colorHex }}
                          className="h-full"
                          title={`${ch.shortLabel}: ${ch.count} (${pct.toFixed(1)}%)`}
                        />
                      );
                    })}
                </div>
              </div>
            )}

            {/* All Ingestion Channels Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 text-xs">
              {leadSourceTelemetry.channels.map((ch) => (
                <div
                  key={ch.key}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: ch.colorHex }}
                    />
                    <span className="font-bold text-slate-300 truncate text-[11px]">{ch.shortLabel}</span>
                  </div>
                  <span className="font-mono font-black text-white text-xs shrink-0">
                    {ch.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE SYSTEM BUGS & INCIDENT TRIAGE STATUS (MAIN USAGE PAGE) */}
          <div className="p-6 rounded-3xl border-2 border-rose-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/30 shadow-xl shadow-rose-950/20 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-900/40">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${bugMetrics.hasCriticalOpen
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  }`}>
                  <Bug className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                    <span>Live Bug Ingestion &amp; Incident Triage</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${bugMetrics.hasCriticalOpen
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}>
                      {bugMetrics.openCount} Unresolved
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Real-time tickets filed by College Admins and Teachers across Karur and Coimbatore campuses.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    saveBugReport({
                      title: "Test simulated bug from Master Creator console",
                      description: "Telemetry and event-bus verification triggered by Master Creator.",
                      severity: "LOW",
                      category: "DASHBOARD_UI",
                      reportedBy: "spherexnithish#",
                      reportedRole: "CREATOR",
                      campus: currentCampus,
                    });
                    onTriggerToast("🐞 Test bug simulation created!");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  + Simulate Test Bug
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("BUGS")}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Open Bug Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4 Mini Bug KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Reported</span>
                <p className="text-2xl font-black font-mono text-white">{bugMetrics.total}</p>
                <p className="text-[10px] text-slate-500">Historical tickets filed</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">Open Tickets</span>
                <p className="text-2xl font-black font-mono text-amber-400">{bugMetrics.openCount}</p>
                <p className="text-[10px] text-slate-500">Awaiting creator action</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">Critical Blockers</span>
                <p className="text-2xl font-black font-mono text-rose-400">{bugMetrics.criticalCount}</p>
                <p className="text-[10px] text-slate-500">Urgent attention needed</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Resolved / Closed</span>
                <p className="text-2xl font-black font-mono text-emerald-400">{bugMetrics.resolvedCount + bugMetrics.closedCount}</p>
                <p className="text-[10px] text-emerald-500 font-semibold">Fix verified</p>
              </div>
            </div>

            {/* Recent Open Bugs Quick List */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Recent User-Reported Issues:</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Showing top active issues
                </span>
              </div>

              {bugs.filter(b => b.status === "OPEN" || b.status === "IN_PROGRESS").length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No open bugs reported by Admin or Faculty. All CRM subsystems operational.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {bugs
                    .filter(b => b.status === "OPEN" || b.status === "IN_PROGRESS")
                    .slice(0, 3)
                    .map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black text-white">{b.ticketNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${b.severity === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : b.severity === "HIGH"
                                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}>
                              {b.severity}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {b.campus} Campus • Filed by <strong className="text-slate-200">{b.reportedBy}</strong> ({b.reportedRole})
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-200 truncate">{b.title}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{b.description}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {b.status === "OPEN" && (
                            <button
                              type="button"
                              onClick={async () => {
                                await updateBugStatus(b.id, "IN_PROGRESS", "Creator began investigation");
                                onTriggerToast(`🔧 Set ticket ${b.ticketNumber} to IN_PROGRESS.`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                            >
                              Start Fixing
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              await updateBugStatus(b.id, "RESOLVED", "Issue verified and resolved");
                              onTriggerToast(`✅ Ticket ${b.ticketNumber} marked as RESOLVED.`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* EMERGENCY MASTER KILL-SWITCH & GLOBAL SYSTEM LOCKOUT BAR */}
          <div className="p-6 rounded-3xl border-2 border-rose-600/70 bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-950 shadow-2xl shadow-rose-950/50 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-900/50">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border-2 border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
                  <Power className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-black text-white flex flex-wrap items-center gap-2">
                    <span>Emergency Master Kill-Switch (All Systems Worldwide)</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Live Cloud Lockout
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Instantly stops or re-opens the Web & Mobile application for <strong>ALL colleges</strong> across every computer, laptop, tablet, and mobile device worldwide.
                  </p>
                </div>
              </div>

              {/* Live Cloud Status Indicators */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-bold shadow-sm ${globalLockout.isGlobalWebStopped
                    ? "bg-rose-950 border-rose-600 text-rose-300 animate-pulse"
                    : "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                  }`}>
                  <Globe className="w-4 h-4" />
                  <span>Web App: {globalLockout.isGlobalWebStopped ? "🛑 STOPPED GLOBALLY" : "🟢 ACTIVE EVERYWHERE"}</span>
                </div>

                <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-bold shadow-sm ${globalLockout.isGlobalMobileStopped
                    ? "bg-rose-950 border-rose-600 text-rose-300 animate-pulse"
                    : "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                  }`}>
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile App: {globalLockout.isGlobalMobileStopped ? "🛑 STOPPED GLOBALLY" : "🟢 ACTIVE EVERYWHERE"}</span>
                </div>
              </div>
            </div>

            {/* Kill-switch control buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Global Web Toggle */}
              <button
                type="button"
                onClick={handleToggleGlobalWeb}
                className={`py-3.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${globalLockout.isGlobalWebStopped
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 ring-2 ring-emerald-400"
                    : "bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-600 text-slate-200 hover:text-rose-200"
                  }`}
              >
                <Globe className="w-4 h-4" />
                <span>{globalLockout.isGlobalWebStopped ? "🟢 RESTORE ALL WEB APPS" : "🛑 Click to STOP ALL WEB APPS"}</span>
              </button>

              {/* Global Mobile Toggle */}
              <button
                type="button"
                onClick={handleToggleGlobalMobile}
                className={`py-3.5 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${globalLockout.isGlobalMobileStopped
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 ring-2 ring-emerald-400"
                    : "bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-600 text-slate-200 hover:text-rose-200"
                  }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{globalLockout.isGlobalMobileStopped ? "🟢 RESTORE ALL MOBILE APPS" : "🛑 Click to STOP ALL MOBILE APPS"}</span>
              </button>

              {/* Emergency Freeze All */}
              <button
                type="button"
                onClick={handleEmergencyFreezeAll}
                className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-rose-950/60 cursor-pointer active:scale-95 transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>🚨 EMERGENCY FREEZE ALL</span>
              </button>

              {/* Restore All Systems */}
              <button
                type="button"
                onClick={handleRestoreAllSystems}
                className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 cursor-pointer active:scale-95 transition-all"
              >
                <Unlock className="w-4 h-4" />
                <span>✨ RESTORE ALL (OPEN ALL)</span>
              </button>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-300">
                Creator Stop & Open Application Architecture:
              </p>
              <p className="text-amber-200/90 leading-relaxed">
                As the master creator, you can see all colleges using the SPHEREX application and the exact payments they make.
                If any college fails to pay the annual renewal or lead overage fee, you can unilaterally <strong>STOP</strong> their
                Web application and Mobile app. When payment is cleared, click <strong>Record Payment & Open App</strong> to immediately
                restore full access. All changes synchronize in real-time across Firestore, Realtime Database, and Cloud APIs.
              </p>
            </div>
          </div>

          {/* College Cards Grid */}
          <div className="space-y-6">
            {colleges.map((college) => {
              const isWebStopped = Boolean(college.isWebApplicationStopped);
              const isMobileStopped = Boolean(college.isMobileApplicationStopped);
              const isEntirelyStopped = isWebStopped && isMobileStopped;
              const isFullyPaid = college.outstandingBalance === 0;

              return (
                <div
                  key={college.id}
                  className={`p-6 rounded-3xl border transition-all ${isEntirelyStopped
                      ? "border-rose-700 bg-rose-950/30 shadow-xl shadow-rose-950/30"
                      : isWebStopped || isMobileStopped
                        ? "border-amber-700 bg-slate-900/90"
                        : "border-slate-800 bg-slate-900/90 hover:border-slate-700"
                    }`}
                >
                  {/* Top Bar: College Name, Crest & Status */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xl shrink-0">
                        🏛️
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg md:text-xl font-black text-white">{college.collegeName}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                            {college.shortCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {college.location} • Admin ID: <code className="text-amber-300 font-mono font-bold">{college.adminUsername}</code>
                        </p>
                      </div>
                    </div>

                    {/* Overall Status Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isEntirelyStopped ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1.5 animate-pulse">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Institution Frozen (Web & Mobile Stopped)</span>
                        </span>
                      ) : isWebStopped ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Web App Stopped</span>
                        </span>
                      ) : isMobileStopped ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Mobile App Stopped</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>All Systems Active</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Section: Financial & Payment Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6 border-b border-slate-800">
                    {/* Left: Financial Statement */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <span>Institutional Subscription & Payment Breakdown</span>
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isFullyPaid
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : college.paymentStatus === "OVERDUE"
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : "bg-amber-950 text-amber-300 border border-amber-800"
                            }`}
                        >
                          {college.paymentStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                          <p className="text-[10px] text-slate-400 font-semibold">Base Annual Fee</p>
                          <p className="font-mono font-bold text-white text-sm">
                            ₹{college.baseAnnualFee.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[9px] text-slate-500">Includes 1,00,000 leads</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                          <p className="text-[10px] text-slate-400 font-semibold">Lead Surcharges</p>
                          <p className="font-mono font-bold text-amber-400 text-sm">
                            +₹{college.overageSurcharge.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[9px] text-slate-500">{college.extraLeadsCount} extra leads</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                          <p className="text-[10px] text-slate-400 font-semibold">Total Payable</p>
                          <p className="font-mono font-bold text-white text-sm">
                            ₹{college.totalPayableAmount.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[9px] text-slate-500">Due: {college.paymentDueDate}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                          <p className="text-[10px] text-slate-400 font-semibold">Amount Paid</p>
                          <p className="font-mono font-bold text-emerald-400 text-sm">
                            ₹{college.amountPaid.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[9px] text-emerald-500 font-semibold">
                            {isFullyPaid ? "Cleared in Full" : `Due: ₹${college.outstandingBalance.toLocaleString("en-IN")}`}
                          </p>
                        </div>
                      </div>

                      {/* Outstanding Alert Bar */}
                      {!isFullyPaid && (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>
                              <strong>Payment Pending:</strong> Outstanding balance of{" "}
                              <strong className="text-white font-mono">₹{college.outstandingBalance.toLocaleString("en-IN")}</strong> is due by{" "}
                              <strong>{college.paymentDueDate}</strong>.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(college)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
                          >
                            Clear Payment & Open App
                          </button>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-4">
                        <span>Last Payment: <strong className="text-slate-200 font-mono">{college.lastPaymentDate || "Initial Onboarding"}</strong></span>
                        <span>Reference: <code className="text-indigo-300 font-mono">{college.paymentReference || "N/A"}</code></span>
                        <span>Contact: <strong className="text-slate-200">{college.contactPhone}</strong></span>
                      </div>
                    </div>

                    {/* Right: Platform Coverage & Database Link */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Server className="w-4 h-4 text-indigo-400" />
                        <span>Platform & Tenant Telemetry</span>
                      </h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Total Students:</span>
                          </span>
                          <span className="font-mono font-bold text-indigo-300">
                            {applicants.filter((a) => a.campus === college.campus).length.toLocaleString("en-IN")} leads
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                            <span>Faculty Teachers:</span>
                          </span>
                          <span className="font-mono font-bold text-purple-300">
                            {teachers.filter((t) => t.campus === college.campus).length} active staff
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                            <span>Degree Programs:</span>
                          </span>
                          <span className="font-mono font-bold text-sky-300">
                            {courses.filter((c) => college.campus === "KARUR" ? c.karurSeats > 0 : c.coimbatoreSeats > 0).length || courses.length} courses
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Web CRM Deployment:</span>
                          <span className={isWebStopped ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                            {isWebStopped ? "🛑 Stopped by Creator" : "🟢 Active & Online"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Native Mobile Apps:</span>
                          <span className={isMobileStopped ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                            {isMobileStopped ? "🛑 Stopped by Creator" : "🟢 Active (Android/iOS)"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        {onSwitchCampus && (
                          <button
                            type="button"
                            onClick={() => {
                              onSwitchCampus(college.campus as CampusLocation);
                              onTriggerToast(`🏛️ Switched creator view to ${college.collegeName}.`);
                            }}
                            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Inspect Campus Database
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handlePrintCollegeInvoice(college)}
                          className="w-full py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Generate Tax Invoice (PDF)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar: UNILATERAL CREATOR STOP / OPEN CONTROLS (Single Clean Line) */}
                  <div className="pt-4 border-t border-slate-800/80 w-full overflow-x-auto pb-1 scrollbar-none">
                    <div className="flex items-center justify-between gap-3 min-w-max flex-nowrap whitespace-nowrap">
                      {/* Left: Access State Badges */}
                      <div className="flex items-center gap-2 shrink-0 flex-nowrap whitespace-nowrap">
                        <span className="text-xs font-bold text-slate-400 shrink-0">Current Access State:</span>
                        <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 shrink-0 whitespace-nowrap ${isWebStopped
                            ? "bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse"
                            : "bg-emerald-950/40 border-emerald-700 text-emerald-300"
                          }`}>
                          <Globe className="w-3 h-3 shrink-0" />
                          <span>Web: {isWebStopped ? "🛑 STOPPED (Blocked)" : "🟢 ACTIVE"}</span>
                        </div>

                        <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 shrink-0 whitespace-nowrap ${isMobileStopped
                            ? "bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse"
                            : "bg-emerald-950/40 border-emerald-700 text-emerald-300"
                          }`}>
                          <Smartphone className="w-3 h-3 shrink-0" />
                          <span>Mobile: {isMobileStopped ? "🛑 STOPPED (Blocked)" : "🟢 ACTIVE"}</span>
                        </div>
                      </div>

                      {/* Right: Controls & Payment */}
                      <div className="flex items-center gap-2 shrink-0 flex-nowrap whitespace-nowrap">
                        {/* Web App Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleWebApp(college)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${isWebStopped
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400"
                              : "bg-slate-800 hover:bg-rose-950 text-slate-200 hover:text-rose-200 border border-slate-700 hover:border-rose-600"
                            }`}
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span>{isWebStopped ? "🟢 Restore & Open Web App" : "🛑 Click to STOP Web App"}</span>
                        </button>

                        {/* Mobile App Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleMobileApp(college)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${isMobileStopped
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400"
                              : "bg-slate-800 hover:bg-rose-950 text-slate-200 hover:text-rose-200 border border-slate-700 hover:border-rose-600"
                            }`}
                        >
                          <Smartphone className="w-3.5 h-3.5 shrink-0" />
                          <span>{isMobileStopped ? "🟢 Restore & Open Mobile App" : "🛑 Click to STOP Mobile App"}</span>
                        </button>

                        {/* Freeze All (Web & Mobile) */}
                        <button
                          type="button"
                          onClick={() => handleToggleEntireInstitution(college)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${isEntirelyStopped
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400"
                              : "bg-rose-950 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-700 shadow-md shadow-rose-950/40"
                            }`}
                        >
                          <Power className="w-3.5 h-3.5 shrink-0" />
                          <span>{isEntirelyStopped ? "✨ Re-Open Institution (Restore All)" : "🚨 Click to STOP ALL (Web + Mobile)"}</span>
                        </button>

                        {/* Record Payment Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenPaymentModal(college)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          <CreditCard className="w-3.5 h-3.5 shrink-0" />
                          <span>Record Payment & Open</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Institutional Academic Courses & Student Demand Overview */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Academic Courses Catalog & Student Interest Volume</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {totalCoursesCount} Programs
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Accredited engineering & technology degree programs offered across client institutions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 font-mono font-bold">
                  Karur: {totalKarurSeats} seats
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 font-mono font-bold">
                  Coimbatore: {totalCoimbatoreSeats} seats
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Course Code</th>
                    <th className="p-3">Degree Program</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-center">Karur Seats</th>
                    <th className="p-3 text-center">Coimbatore Seats</th>
                    <th className="p-3">Tuition Fee / Year</th>
                    <th className="p-3 text-right">Student Demand (Count)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {courses.map((course) => {
                    const demand = courseDemandMap[course.name] || 0;
                    return (
                      <tr key={course.code} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400">
                          {course.code}
                        </td>
                        <td className="p-3 font-semibold text-white">
                          {course.name}
                        </td>
                        <td className="p-3 text-slate-400">
                          {course.dept}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-300">
                          {course.karurSeats}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-sky-300">
                          {course.coimbatoreSeats}
                        </td>
                        <td className="p-3 font-mono text-emerald-400">
                          {course.tuitionFee?.startsWith("₹") ? course.tuitionFee : `₹${course.tuitionFee || "85,000"}`}
                        </td>
                        <td className="p-3 text-right">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {demand} Students
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Admission Funnel & Faculty Telemetry (Pure Aggregate Counts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Admission Pipeline Volume */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">Student Admission Funnel (Total Volume)</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {totalStudentsCount} Total Students
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">1. New Inquiries</p>
                  <p className="text-xl font-mono font-black text-white">{studentFunnelCounts.inquiry}</p>
                  <p className="text-[10px] text-slate-500">Fresh candidate inquiries</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">2. In Counseling</p>
                  <p className="text-xl font-mono font-black text-amber-400">{studentFunnelCounts.counseling}</p>
                  <p className="text-[10px] text-slate-500">Counselor engagement active</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">3. Applications</p>
                  <p className="text-xl font-mono font-black text-sky-400">{studentFunnelCounts.applications}</p>
                  <p className="text-[10px] text-slate-500">Forms submitted & verifying</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">4. Confirmed Seats</p>
                  <p className="text-xl font-mono font-black text-emerald-400">{studentFunnelCounts.admitted}</p>
                  <p className="text-[10px] text-slate-500">Admissions finalized</p>
                </div>
              </div>
            </div>

            {/* Teacher Staffing by Department */}
            <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">Teacher Count by Department</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {totalTeachersCount} Faculty Members
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {departmentStaffCounts.slice(0, 5).map(([dept, count]) => {
                  const pct = Math.round((count / (totalTeachersCount || 1)) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="font-medium text-slate-200">{dept}</span>
                        <span className="font-mono font-bold text-purple-300">{count} teachers ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: ACADEMIC COURSES & SEAT ALLOCATION CATALOG                */}
      {/* ============================================================== */}
      {activeTab === "COURSES" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Courses KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Total Accredited Programs
              </p>
              <h3 className="text-2xl font-black text-sky-400 font-mono">
                {totalCoursesCount} <span className="text-xs font-normal text-slate-400">Degrees</span>
              </h3>
              <p className="text-xs text-slate-400">B.E. & B.Tech approved degrees</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                VSB Karur Total Seats
              </p>
              <h3 className="text-2xl font-black text-amber-400 font-mono">
                {totalKarurSeats.toLocaleString("en-IN")} <span className="text-xs font-normal text-slate-400">Seats</span>
              </h3>
              <p className="text-xs text-slate-400">Engineering College Campus</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                VSB Coimbatore Total Seats
              </p>
              <h3 className="text-2xl font-black text-indigo-400 font-mono">
                {totalCoimbatoreSeats.toLocaleString("en-IN")} <span className="text-xs font-normal text-slate-400">Seats</span>
              </h3>
              <p className="text-xs text-slate-400">Technical Campus</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Combined Intake Capacity
              </p>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">
                {(totalKarurSeats + totalCoimbatoreSeats).toLocaleString("en-IN")} <span className="text-xs font-normal text-slate-400">Students</span>
              </h3>
              <p className="text-xs text-emerald-400 font-semibold">Anna University Sanctioned</p>
            </div>
          </div>

          {/* Programs Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => {
              const demand = courseDemandMap[course.name] || 0;
              return (
                <div
                  key={course.code}
                  className="p-5 rounded-3xl border border-slate-800 bg-slate-900/90 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-sky-500/10 text-sky-400 border border-sky-500/30">
                        {course.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                        {course.meta || "4 Years / 8 Sem"}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white leading-snug">{course.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">{course.dept}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Karur Seats:</span>
                        <span className="font-mono font-bold text-amber-300">{course.karurSeats} Intake</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Coimbatore Seats:</span>
                        <span className="font-mono font-bold text-sky-300">{course.coimbatoreSeats} Intake</span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
                        <span className="text-slate-400">Tuition Fee:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {course.tuitionFee?.startsWith("₹") ? course.tuitionFee : `₹${course.tuitionFee || "85,000"}`}/yr
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Student Demand:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {demand} Student Inquiries
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: CREATOR PAYMENT QR CODE & STUDENT LEAD REVENUE             */}
      {/* ============================================================== */}
      {activeTab === "QR_PAYMENTS" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Revenue KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Total QR Lead Payments Collected
              </p>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">
                ₹{qrRevenueMetrics.totalRevenue.toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-slate-400">Calculated directly in Creator center</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Paid Student Leads Added
              </p>
              <h3 className="text-2xl font-black text-amber-400 font-mono">
                {qrRevenueMetrics.totalTransactionsCount} <span className="text-xs font-normal text-slate-400">Candidates</span>
              </h3>
              <p className="text-xs text-emerald-400 font-semibold">100% Synced to Firebase</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Karur Campus QR Volume
              </p>
              <h3 className="text-2xl font-black text-sky-400 font-mono">
                ₹{qrRevenueMetrics.karurRevenue.toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-slate-400">VSB Engineering College</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Coimbatore Campus QR Volume
              </p>
              <h3 className="text-2xl font-black text-indigo-400 font-mono">
                ₹{qrRevenueMetrics.coimbatoreRevenue.toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-slate-400">VSB Technical Campus</p>
            </div>
          </div>

          {/* Two Columns: QR Image Uploader (Left) & Pricing Gateway Config (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Active QR Code & Image Upload (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Owner Payment QR Code</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live on Checkout
                </span>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-amber-400/40 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrSettings.qrCodeImageUrl}
                    alt="Active Creator Payment QR Code"
                    className="w-48 h-48 md:w-52 md:h-52 object-contain rounded-lg"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white font-mono">{qrSettings.upiId}</p>
                  <p className="text-[11px] text-slate-400">{qrSettings.payeeName}</p>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="space-y-3 pt-2">
                <label className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Upload Custom Payment QR Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadQrImage}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleResetToUpiQr}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  Regenerate from UPI ID
                </button>

                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  Supported formats: PNG, JPG, JPEG, WebP. Once uploaded, this QR code immediately replaces the checkout QR code on all student lead creation forms.
                </p>
              </div>
            </div>

            {/* Right: Payment Gateway & Lead Pricing Settings (7 cols) */}
            <form
              onSubmit={handleSaveQrSettings}
              className="lg:col-span-7 p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">Lead Checkout & Pricing Engine</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Creator Controlled
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">Charge per Student Lead (INR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={qrSettings.leadPriceAmount}
                        onChange={(e) =>
                          setQrSettings({ ...qrSettings, leadPriceAmount: Number(e.target.value) })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Default rate: ₹500 per lead</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">Creator UPI ID</label>
                    <input
                      type="text"
                      value={qrSettings.upiId}
                      onChange={(e) => setQrSettings({ ...qrSettings, upiId: e.target.value })}
                      placeholder="e.g. spherexnithish@okaxis"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-slate-500">Receiving bank UPI address</p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-slate-300 font-bold">Payee Display Name</label>
                    <input
                      type="text"
                      value={qrSettings.payeeName}
                      onChange={(e) => setQrSettings({ ...qrSettings, payeeName: e.target.value })}
                      placeholder="e.g. Nithish Kumar (SPHEREX Creator)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-slate-300 font-bold">Checkout Purpose Description</label>
                    <input
                      type="text"
                      value={qrSettings.merchantNote}
                      onChange={(e) => setQrSettings({ ...qrSettings, merchantNote: e.target.value })}
                      placeholder="e.g. SPHEREX Student Lead Registration Fee"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qrSettings.isPaymentRequired}
                      onChange={(e) =>
                        setQrSettings({ ...qrSettings, isPaymentRequired: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Require QR Code Payment on Student Lead Creation
                      </p>
                      <p className="text-[11px] text-slate-400">
                        When enabled, college admins and teachers cannot save candidate leads to Firebase until the ₹{qrSettings.leadPriceAmount} QR payment is verified.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isQrSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isQrSaving ? "Saving Settings..." : "Save QR Settings & Apply Live"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Real-Time Student Lead QR Payment Transactions Ledger */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span>Real-Time Student Lead QR Payments Ledger</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live audit log of all candidate registrations paid via QR code and synchronized with Firebase
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 font-mono">
                {leadQrPayments.length} Total Payments Recorded
              </span>
            </div>

            {leadQrPayments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-dashed border-slate-800 text-center space-y-2">
                <QrCode className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No QR payments recorded yet</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  When college admins or teachers click the lead button, fill candidate details, scan the QR code, and verify payment, transactions will automatically compute and appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Lead Token / ID</th>
                      <th className="p-3">Campus / College</th>
                      <th className="p-3">Course</th>
                      <th className="p-3">Amount (INR)</th>
                      <th className="p-3">UPI Ref / UTR</th>
                      <th className="p-3">Submitted By</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3 text-right">Firebase Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {leadQrPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <strong className="text-white font-mono">#LEAD-{p.id.slice(0, 8).toUpperCase()}</strong>
                          <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Privacy Protected</span>
                          </p>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {p.campus}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 truncate max-w-[180px]">{p.courseInterest}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          ₹{p.amount.toLocaleString("en-IN")}.00
                        </td>
                        <td className="p-3 font-mono text-[11px] text-amber-300">{p.utrRef}</td>
                        <td className="p-3 font-mono text-[11px] text-indigo-300">{p.submittedBy}</td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {new Date(p.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Verified & Synced
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* TAB 2: 1,00,000 LEAD QUOTA & OVERAGE ENGINE                     */}
      {/* ============================================================== */}
      {activeTab === "QUOTA" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Quota KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Institutional Lead Cap
              </p>
              <h3 className="text-2xl font-black text-white font-mono">
                {customQuotaLimit.toLocaleString("en-IN")} <span className="text-xs font-normal text-slate-400">Leads</span>
              </h3>
              <p className="text-xs text-emerald-400 font-semibold">Included in Annual Subscription</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Live Database Usage
              </p>
              <h3 className="text-2xl font-black text-amber-400 font-mono">
                {effectiveTotalLeads.toLocaleString("en-IN")} <span className="text-xs font-normal text-slate-400">Leads</span>
              </h3>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isCapReached ? "bg-rose-500 w-full" : "bg-amber-400"}`}
                  style={{ width: `${percentQuotaUsed}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {percentQuotaUsed}% Capacity • {isCapReached ? "⚠️ Cap Reached" : `${(customQuotaLimit - effectiveTotalLeads).toLocaleString("en-IN")} Leads Free`}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Extra Lead Surcharge
              </p>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">
                ₹{customOveragePrice} <span className="text-xs font-normal text-slate-400">/ Extra Lead</span>
              </h3>
              <p className="text-xs text-slate-400">Billed on Annual Renewal</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Accumulated Overages
              </p>
              <h3 className="text-2xl font-black text-rose-400 font-mono">
                +{annualBilling.extraLeadsCount} <span className="text-xs font-normal text-slate-400">Extra Leads</span>
              </h3>
              <p className="text-xs text-rose-400 font-bold">
                +₹{(annualBilling.extraLeadsCount * customOveragePrice).toLocaleString("en-IN")} Surcharge
              </p>
            </div>
          </div>

          {/* Master Quota Controls Card */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Creator Quota Limit & Pricing Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  As the application creator, you can dynamically adjust the free quota threshold and the surcharge rate.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Creator Only
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Free Lead Limit Threshold (Default: 1,00,000)
                </label>
                <input
                  type="number"
                  value={customQuotaLimit}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomQuotaLimit(val);
                    addLog(`Creator changed quota limit to ${val.toLocaleString("en-IN")} leads.`, "info");
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Extra Lead Price Rate (Default: ₹500 / lead)
                </label>
                <input
                  type="number"
                  value={customOveragePrice}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomOveragePrice(val);
                    addLog(`Creator updated extra lead surcharge to ₹${val}/lead.`, "info");
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Annual Platform License Base (Default: ₹1,50,000)
                </label>
                <input
                  type="number"
                  value={customBaseAnnualFee}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomBaseAnnualFee(val);
                    addLog(`Creator adjusted base annual subscription to ₹${val.toLocaleString("en-IN")}.`, "info");
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Quick Testing Toggles */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSimulation}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${isSimulating
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30"
                  }`}
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span>{isSimulating ? "Deactivate Quota Simulation" : "Simulate 1,00,000 Limit Reached"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetOverageLedger}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
              >
                Reset Accumulated Overage to 0
              </button>

              <button
                type="button"
                onClick={handleToggleBypass}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isBypassQuotaActive
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
              >
                {isBypassQuotaActive ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isBypassQuotaActive ? "Quota Bypass ACTIVE (Admin Unlocked)" : "Strict Quota Enforcement"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: DUAL-PLATFORM SOFTWARE LICENSING                        */}
      {/* ============================================================== */}
      {activeTab === "LICENSING" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Dual-Platform Application Annual License Specifications</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Standard Enterprise Tier • Covers Web Application & Native Mobile Apps
                </p>
              </div>
            </div>

            {/* Platform Coverage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Globe className="w-4 h-4" />
                  <span>Platform 1: Responsive Web Application</span>
                </div>
                <p className="text-xs text-slate-300">
                  Full institutional admission portal for Desktop, Laptop, and Tablet browsers. Multi-campus admissions, teacher allocations, and real-time Firestore sync.
                </p>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Status: Standard Enterprise Distribution
                </span>
              </div>

              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>Platform 2: Native Android & iOS Mobile Apps</span>
                </div>
                <p className="text-xs text-slate-300">
                  Capacitor-powered native mobile apps for on-the-go admission counseling, direct WhatsApp integration, phone dialer access, and offline data caching.
                </p>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Status: Standard Enterprise Distribution
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: FIREBASE HEALTH & DIAGNOSTICS                           */}
      {/* ============================================================== */}
      {activeTab === "DATABASE" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <span>Live Firebase & Database Operations Center</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute deep database maintenance, standardize data formats, and trigger offline backups.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tool 1: Normalize Phones */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-white text-xs">Standardize +91- Phones</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Scans all student leads in Firebase and ensures every valid mobile number has the compulsory Indian +91- prefix.
                </p>
                <button
                  type="button"
                  disabled={isNormalizing}
                  onClick={handleNormalizePhones}
                  className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isNormalizing ? "Processing Firebase..." : "Execute Standardize +91-"}
                </button>
              </div>

              {/* Tool 2: Download Full JSON Backup */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs">Export Creator JSON Backup</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Downloads an offline, timestamped JSON snapshot of all applicants, payments, and system billing states.
                </p>
                <button
                  type="button"
                  onClick={handleExportDatabaseSnapshot}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Download JSON Snapshot
                </button>
              </div>

              {/* Tool 3: Sync & Refresh Listeners */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs">Purge Cache & Re-sync</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Flushes in-memory local caches and forces real-time re-fetch of all lead documents from Cloud Firestore.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("vsb_all_contacts_cache");
                    onTriggerToast("🔄 Local cache purged. Re-fetching live data.");
                    addLog("Creator purged local database cache.", "info");
                  }}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition-colors cursor-pointer border border-amber-500/30"
                >
                  Purge Cache Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: EMERGENCY OVERRIDES & AUDIT LOGS                        */}
      {/* ============================================================== */}
      {activeTab === "SECURITY" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Security Switches */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Emergency Master Killswitches</span>
              </h3>

              <div className="space-y-3">
                {/* Maintenance Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-white">System Maintenance Mode</p>
                    <p className="text-[10px] text-slate-400">Lock down the portal for college admins and faculty</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleMaintenance}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isMaintenanceMode ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300"
                      }`}
                  >
                    {isMaintenanceMode ? "Active (Locked)" : "Off (Live)"}
                  </button>
                </div>

                {/* Quota Bypass Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-white">Admin Quota Bypass</p>
                    <p className="text-[10px] text-slate-400">Allow admin to bypass 1,00,000 lead cap</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleBypass}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isBypassQuotaActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"
                      }`}
                  >
                    {isBypassQuotaActive ? "Bypass ON" : "Enforce CAP"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Creator Activity Audit Log */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Creator Root Audit Ledger</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Live Session</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-[11px]">
                {creatorLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-slate-200">{log.action}</p>
                      <p className="text-[9px] text-slate-500">{log.time}</p>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0 ${log.type === "success"
                          ? "bg-emerald-950 text-emerald-400"
                          : log.type === "warn"
                            ? "bg-amber-950 text-amber-400"
                            : "bg-indigo-950 text-indigo-400"
                        }`}
                    >
                      {log.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 8: BUG TRACKER & USER INCIDENT TRIAGE CENTER               */}
      {/* ============================================================== */}
      {activeTab === "BUGS" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header & KPI Summary */}
          <div className="p-6 rounded-3xl border-2 border-rose-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40 shadow-2xl shadow-rose-950/30 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-900/50">
              <div className="flex items-center gap-3.5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${bugMetrics.hasCriticalOpen
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/60 ring-2 ring-rose-500/40 animate-pulse"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  }`}>
                  <Bug className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <span>Master Creator Bug &amp; Incident Triage Center</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${bugMetrics.hasCriticalOpen
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}>
                      {bugMetrics.openCount} Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Live bug stream filed by College Admins and Teachers across all campuses. Updates synchronize instantly to Firebase and all devices.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    const sample = await saveBugReport({
                      title: `Simulated System Telemetry Check #${Math.floor(100 + Math.random() * 900)}`,
                      description: "Automated verification ticket created from Master Creator console. Verifying real-time dispatch and notification bus.",
                      severity: "LOW",
                      category: "DASHBOARD_UI",
                      reportedBy: "spherexnithish#",
                      reportedRole: "CREATOR",
                      campus: currentCampus,
                    });
                    onTriggerToast(`🐞 Created test bug ticket #${sample.ticketNumber}!`);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>+ File Test Bug</span>
                </button>
              </div>
            </div>

            {/* 5 KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Filed</span>
                <p className="text-2xl font-black font-mono text-white">{bugMetrics.total}</p>
                <p className="text-[10px] text-slate-500">Historical tickets</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Open Tickets</span>
                <p className="text-2xl font-black font-mono text-amber-400">{bugMetrics.openCount}</p>
                <p className="text-[10px] text-slate-500">Pending review</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">In Progress</span>
                <p className="text-2xl font-black font-mono text-sky-400">{bugMetrics.inProgressCount}</p>
                <p className="text-[10px] text-slate-500">Under developer triage</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Critical Blockers</span>
                <p className="text-2xl font-black font-mono text-rose-400">{bugMetrics.criticalCount}</p>
                <p className="text-[10px] text-slate-500">Immediate action needed</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Resolved / Closed</span>
                <p className="text-2xl font-black font-mono text-emerald-400">{bugMetrics.resolvedCount + bugMetrics.closedCount}</p>
                <p className="text-[10px] text-emerald-500 font-semibold">Fix completed</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={bugSearchQuery}
                onChange={(e) => setBugSearchQuery(e.target.value)}
                placeholder="Search by ticket #, title, reporter, campus..."
                className="w-full px-4 py-2 pl-9 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 text-white placeholder-slate-500 text-xs outline-hidden"
              />
              <Bug className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setBugStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${bugStatusFilter === st
                      ? "bg-rose-600 text-white shadow-md shadow-rose-950/40"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <select
              value={bugSeverityFilter}
              onChange={(e) => setBugSeverityFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold outline-hidden cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low (Minor)</option>
            </select>
          </div>

          {/* Bug List Items */}
          <div className="space-y-4">
            {bugs
              .filter((b) => {
                if (bugStatusFilter !== "ALL" && b.status !== bugStatusFilter) return false;
                if (bugSeverityFilter !== "ALL" && b.severity !== bugSeverityFilter) return false;
                if (bugSearchQuery.trim()) {
                  const q = bugSearchQuery.toLowerCase();
                  const match =
                    b.ticketNumber.toLowerCase().includes(q) ||
                    b.title.toLowerCase().includes(q) ||
                    b.description.toLowerCase().includes(q) ||
                    b.reportedBy.toLowerCase().includes(q) ||
                    b.campus.toLowerCase().includes(q);
                  if (!match) return false;
                }
                return true;
              })
              .map((b) => {
                const notesValue = editingNotes[b.id] !== undefined ? editingNotes[b.id] : (b.creatorNotes || "");
                return (
                  <div
                    key={b.id}
                    className="p-5 md:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition-all"
                  >
                    {/* Header Row: Ticket #, Status, Severity, Category, Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black text-white px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                          {b.ticketNumber}
                        </span>

                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${b.severity === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/50"
                              : b.severity === "HIGH"
                                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                                : b.severity === "MEDIUM"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                                  : "bg-sky-500/20 text-sky-300 border border-sky-500/50"
                            }`}
                        >
                          {b.severity}
                        </span>

                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          {b.category}
                        </span>

                        <span className="text-xs text-slate-400 font-mono">
                          {b.campus} Campus
                        </span>
                      </div>

                      {/* Status Selector & Quick Changer */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-bold">Status:</span>
                        <select
                          value={b.status}
                          onChange={async (e) => {
                            const newSt = e.target.value as BugStatus;
                            await updateBugStatus(b.id, newSt);
                            onTriggerToast(`Updated ${b.ticketNumber} status to ${newSt}!`);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black outline-hidden cursor-pointer ${b.status === "OPEN"
                              ? "bg-amber-950 text-amber-300 border border-amber-600"
                              : b.status === "IN_PROGRESS"
                                ? "bg-sky-950 text-sky-300 border border-sky-600"
                                : b.status === "RESOLVED"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-600"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>

                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Delete bug ticket ${b.ticketNumber}?`)) {
                              await deleteBugReport(b.id);
                              onTriggerToast(`Deleted ticket ${b.ticketNumber}.`);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete Ticket"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bug Title & Description */}
                    <div className="space-y-1.5">
                      <h4 className="text-base font-bold text-white">{b.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{b.description}</p>
                    </div>

                    {/* Reproduction steps & Expected/Actual details if present */}
                    {(b.stepsToReproduce || b.expectedBehavior || b.actualBehavior || b.errorStack) && (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 text-xs">
                        {b.stepsToReproduce && (
                          <div>
                            <span className="font-bold text-slate-400">Steps to reproduce: </span>
                            <span className="text-slate-300">{b.stepsToReproduce}</span>
                          </div>
                        )}
                        {b.expectedBehavior && (
                          <div>
                            <span className="font-bold text-slate-400">Expected: </span>
                            <span className="text-slate-300">{b.expectedBehavior}</span>
                          </div>
                        )}
                        {b.actualBehavior && (
                          <div>
                            <span className="font-bold text-slate-400">Actual: </span>
                            <span className="text-slate-300">{b.actualBehavior}</span>
                          </div>
                        )}
                        {b.errorStack && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-rose-300 overflow-x-auto">
                            <code>{b.errorStack}</code>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reporter & Device Telemetry Strip */}
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-850/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                      <div>
                        Reported by: <strong className="text-slate-200 font-mono">{b.reportedBy}</strong> ({b.reportedRole}) •{" "}
                        <span>{new Date(b.createdAt).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px]">
                        <span>Platform: <strong className="text-indigo-400">{b.deviceInfo?.platform || "WEB"}</strong></span>
                        <span>Screen: {b.deviceInfo?.screenResolution || "1920x1080"}</span>
                      </div>
                    </div>

                    {/* Developer Resolution Notes & Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={notesValue}
                          onChange={(e) =>
                            setEditingNotes((prev) => ({ ...prev, [b.id]: e.target.value }))
                          }
                          placeholder="Add Creator developer resolution notes..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 outline-hidden focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await updateBugStatus(b.id, b.status, notesValue);
                            onTriggerToast(`Saved notes for ${b.ticketNumber}!`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          Save Notes
                        </button>
                      </div>

                      {/* Fast State Transitions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {b.status !== "RESOLVED" && (
                          <button
                            type="button"
                            onClick={async () => {
                              await updateBugStatus(b.id, "RESOLVED", notesValue || "Resolved by Master Creator");
                              onTriggerToast(`✅ Marked ${b.ticketNumber} as RESOLVED!`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {b.status !== "CLOSED" && (
                          <button
                            type="button"
                            onClick={async () => {
                              await updateBugStatus(b.id, "CLOSED", notesValue || "Closed");
                              onTriggerToast(`Closed ticket ${b.ticketNumber}.`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                          >
                            Close Ticket
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RECORD PAYMENT & AUTO-OPEN APPLICATION                   */}
      {/* ============================================================== */}
      {selectedCollegeForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl shadow-slate-950">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record Institutional Payment</h3>
                  <p className="text-xs text-slate-400">{selectedCollegeForPayment.collegeName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCollegeForPayment(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Total Outstanding Balance:</span>
                <span className="text-sm font-mono font-bold text-rose-400">
                  ₹{selectedCollegeForPayment.outstandingBalance.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Amount Received (INR)</label>
                <input
                  type="number"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Transaction Reference / NEFT ID</label>
                <input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="e.g. NEFT-VSBEC-2026-9912"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={autoUnlockOnPayment}
                  onChange={(e) => setAutoUnlockOnPayment(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-300 font-semibold">
                  Automatically Re-Open & Restore Web & Mobile Application access
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCollegeForPayment(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Payment & Open App</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REGISTER NEW CLIENT COLLEGE                              */}
      {/* ============================================================== */}
      {isAddCollegeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateNewCollege}
            className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl shadow-slate-950"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <span>Register New College Client</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCollegeModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-300 font-bold">College Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kongu Engineering College"
                  value={newCollegeData.collegeName}
                  onChange={(e) => setNewCollegeData({ ...newCollegeData, collegeName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Short Code / Tenant ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KEC"
                  value={newCollegeData.shortCode}
                  onChange={(e) => setNewCollegeData({ ...newCollegeData, shortCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Base Annual Fee (INR)</label>
                <input
                  type="number"
                  value={newCollegeData.baseAnnualFee}
                  onChange={(e) => setNewCollegeData({ ...newCollegeData, baseAnnualFee: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-300 font-bold">Campus Location</label>
                <input
                  type="text"
                  placeholder="e.g. Perundurai, Erode, Tamil Nadu"
                  value={newCollegeData.location}
                  onChange={(e) => setNewCollegeData({ ...newCollegeData, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Admin Username</label>
                <input
                  type="text"
                  placeholder="e.g. adminkec@123"
                  value={newCollegeData.adminUsername}
                  onChange={(e) => setNewCollegeData({ ...newCollegeData, adminUsername: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Contact Email</label>
                <input
                  type="email"
                  placeholder="principal@college.edu"
                  value={newCollegeData.contactEmail}
                  onChange={(e) => setNewCollegeData({ ...newCollegeData, contactEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddCollegeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Register College
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
