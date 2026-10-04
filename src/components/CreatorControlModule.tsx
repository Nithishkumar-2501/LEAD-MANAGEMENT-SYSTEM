"use client";

import { useState, useEffect } from "react";
import { CampusLocation, Lead, Application } from "@/types/crm";
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
} from "@/lib/firebaseSync";
import {
  CollegeClientLicense,
  getAllCollegeLicenses,
  setCollegeWebApplicationStatus,
  setCollegeMobileApplicationStatus,
  freezeCollegeEntireApplication,
  recordCollegePaymentAndOpenApp,
  registerNewCollegeClient,
  LICENSE_EVENT_KEY,
} from "@/lib/collegeLicenseService";
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
} from "lucide-react";

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

  // System Controls State
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isBypassQuotaActive, setIsBypassQuotaActive] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"COLLEGES" | "QUOTA" | "LICENSING" | "DATABASE" | "SECURITY">("COLLEGES");
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

  // Sync colleges registry whenever an update occurs
  useEffect(() => {
    const handleLicenseUpdate = () => {
      setColleges(getAllCollegeLicenses());
    };
    window.addEventListener(LICENSE_EVENT_KEY, handleLicenseUpdate);
    return () => window.removeEventListener(LICENSE_EVENT_KEY, handleLicenseUpdate);
  }, []);

  // Load latest billing data on mount
  useEffect(() => {
    setAnnualBilling(getAnnualRenewalData());
    setColleges(getAllCollegeLicenses());
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

  const effectiveTotalLeads = getEffectiveLeadCount(currentLeadsCount);
  const percentQuotaUsed = Math.min(100, Number(((effectiveTotalLeads / customQuotaLimit) * 100).toFixed(1)));
  const isCapReached = effectiveTotalLeads >= customQuotaLimit;

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

  // Full Database JSON Snapshot Export
  const handleExportDatabaseSnapshot = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      creator: "spherexnithish# (Nithish Kumar)",
      totalApplicants: applicants.length,
      colleges,
      annualRenewalBilling: annualBilling,
      applicantsSnapshot: applicants,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SPHEREX_CREATOR_SNAPSHOT_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onTriggerToast("💾 Exported full Creator JSON database snapshot!");
    addLog("Creator downloaded full JSON database snapshot.", "success");
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
      {/* 2. CREATOR NAVIGATION TABS                                     */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
        {[
          { id: "COLLEGES", label: "🏛️ Client Colleges & Payment Controls", icon: Building },
          { id: "QUOTA", label: "1,00,000 Quota & Overage Engine", icon: Sliders },
          { id: "LICENSING", label: "Dual-Platform Software Licensing", icon: DollarSign },
          { id: "DATABASE", label: "Firebase Health & Diagnostics", icon: Database },
          { id: "SECURITY", label: "Emergency Overrides & Logs", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                isActive
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
      {/* TAB 1: CLIENT COLLEGES & PAYMENT CONTROLS (PRIMARY VIEW)       */}
      {/* ============================================================== */}
      {activeTab === "COLLEGES" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Financial & Tenant KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Active Client Colleges
              </p>
              <h3 className="text-2xl font-black text-white font-mono">
                {colleges.length} <span className="text-xs font-normal text-slate-400">Institutions</span>
              </h3>
              <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <span>Karur, Coimbatore & Registered Tenants</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Total Annual Subscription Billed
              </p>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">
                ₹{totalAnnualBilled.toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-slate-400">Includes Base License + Overages</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Total Revenue Cleared (Paid)
              </p>
              <h3 className="text-2xl font-black text-sky-400 font-mono">
                ₹{totalRevenueCollected.toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-emerald-400 font-bold">
                {totalOutstandingBalance === 0 ? "100% Cleared" : `Outstanding: ₹${totalOutstandingBalance.toLocaleString("en-IN")}`}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Application Access Status
              </p>
              <h3 className="text-xl font-black text-white font-mono flex items-center gap-2">
                {totalWebStoppedCount === 0 && totalMobileStoppedCount === 0 ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" /> All Operational
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-5 h-5" /> {totalWebStoppedCount} Web / {totalMobileStoppedCount} Mobile Stopped
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">Controlled exclusively by Creator</p>
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
                restore full access.
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
                  className={`p-6 rounded-3xl border transition-all ${
                    isEntirelyStopped
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
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isFullyPaid
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
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Enrolled Leads:</span>
                          <span className="font-mono font-bold text-white">
                            {applicants.filter((a) => a.campus === college.campus).length} Records
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Web CRM Deployment:</span>
                          <span className={isWebStopped ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                            {isWebStopped ? "🛑 Stopped by Creator" : "🟢 Active & Online"}
                          </span>
                        </div>
                        <div className="flex justify-between">
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

                  {/* Bottom Action Bar: UNILATERAL CREATOR STOP / OPEN CONTROLS */}
                  <div className="pt-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Creator Access Controls:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Web App Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleWebApp(college)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isWebStopped
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                            : "bg-slate-800 hover:bg-rose-950 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-700"
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{isWebStopped ? "🟢 Open Web App" : "🔴 Stop Web App"}</span>
                      </button>

                      {/* Mobile App Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleMobileApp(college)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isMobileStopped
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                            : "bg-slate-800 hover:bg-rose-950 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-700"
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>{isMobileStopped ? "🟢 Open Mobile App" : "🔴 Stop Mobile App"}</span>
                      </button>

                      {/* Freeze All (Web & Mobile) */}
                      <button
                        type="button"
                        onClick={() => handleToggleEntireInstitution(college)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                          isEntirelyStopped
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                            : "bg-rose-900/90 hover:bg-rose-800 text-white border border-rose-700 shadow-md shadow-rose-950/40"
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isEntirelyStopped ? "✨ Re-Open Entire Institution" : "🚨 Stop All (Web & Mobile)"}</span>
                      </button>

                      {/* Record Payment Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentModal(college)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Record Payment & Open</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isSimulating
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isBypassQuotaActive
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
                  Full institutional admission portal for Desktop, Laptop, and Tablet browsers. Multi-campus admissions, teacher allocations, voice access, and real-time Firestore sync.
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isMaintenanceMode ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300"
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isBypassQuotaActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"
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
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                        log.type === "success"
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
