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
  const [activeTab, setActiveTab] = useState<"QUOTA" | "LICENSING" | "TENANTS" | "DATABASE" | "SECURITY">("QUOTA");
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
      action: "Institutional Tenants Active: Karur (VSBEC) & Coimbatore (VSBCTC).",
      type: "info",
    },
  ]);

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

  const effectiveTotalLeads = getEffectiveLeadCount(currentLeadsCount);
  const percentQuotaUsed = Math.min(100, Number(((effectiveTotalLeads / customQuotaLimit) * 100).toFixed(1)));
  const isCapReached = effectiveTotalLeads >= customQuotaLimit;

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
    } catch (e) {
      onTriggerToast("❌ Error standardizing phone numbers in Firebase.");
      addLog("Failed to standardize phone numbers in Firebase.", "warn");
    } finally {
      setIsNormalizing(false);
    }
  };

  // Toggle Maintenance Mode
  const handleToggleMaintenance = () => {
    const next = !isMaintenanceMode;
    setIsMaintenanceMode(next);
    localStorage.setItem("spherex_maintenance_mode", next ? "true" : "false");
    if (next) {
      onTriggerToast("🚨 System Maintenance Mode Activated! Portal locked for normal users.");
      addLog("Master Creator ACTIVATED System Maintenance Mode.", "warn");
    } else {
      onTriggerToast("🟢 Maintenance Mode Deactivated. Portal is live.");
      addLog("Master Creator DEACTIVATED System Maintenance Mode.", "success");
    }
  };

  // Toggle Quota Bypass for Admin
  const handleToggleBypass = () => {
    const next = !isBypassQuotaActive;
    setIsBypassQuotaActive(next);
    localStorage.setItem("spherex_bypass_quota", next ? "true" : "false");
    if (next) {
      onTriggerToast("🔓 Quota Bypass Active: College Admin can add leads without overage lock.");
      addLog("Creator enabled Lead Quota Bypass for college admins.", "warn");
    } else {
      onTriggerToast("🔒 Quota Enforcement Enforced: 1,00,000 limit active.");
      addLog("Creator restored strict 1,00,000 Lead Quota enforcement.", "info");
    }
  };

  // Download raw JSON database snapshot
  const handleExportDatabaseSnapshot = () => {
    const snapshot = {
      exportTimestamp: new Date().toISOString(),
      creator: "spherexnithish# (Nithish Kumar)",
      tenant: "V.S.B. Educational Trust",
      campus: currentCampus,
      quotaLimit: customQuotaLimit,
      leadCount: applicants.length,
      applicants: applicants,
      annualRenewal: annualBilling,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SPHEREX_CREATOR_SNAPSHOT_${currentCampus}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    onTriggerToast("💾 Creator JSON database snapshot downloaded!");
    addLog(`Creator exported full database snapshot (${applicants.length} records).`, "success");
  };

  // Print Institutional Software License Renewal Invoice
  const handlePrintAnnualRenewalInvoice = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      onTriggerToast("⚠️ Popup blocked! Please allow popups to view Annual Renewal Invoice.");
      return;
    }

    const invoiceNo = `SPX-INV-2026-${Date.now().toString().slice(-4)}`;
    const invoiceDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SphereX_Annual_Renewal_Invoice_${invoiceNo}.pdf</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 35px; color: #0f172a; background: #fff; }
          .invoice-box { max-width: 800px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 12px; padding: 32px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
          .logo-text { font-size: 24px; font-weight: 900; letter-spacing: -1px; color: #4338ca; }
          .sub { font-size: 11px; color: #64748b; margin-top: 4px; }
          .inv-title { font-size: 20px; font-weight: 900; text-align: right; color: #0f172a; text-transform: uppercase; }
          .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 12px; }
          .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
          .client-box strong { display: block; margin-bottom: 4px; font-size: 13px; color: #1e293b; }
          .table-box { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 12px; }
          .table-box th { background: #1e1b4b; color: #fff; text-align: left; padding: 10px 12px; font-weight: 700; text-transform: uppercase; font-size: 10px; }
          .table-box td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .total-row { font-size: 14px; font-weight: 900; background: #e0e7ff; color: #1e1b4b; }
          .stamp-box { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; }
          .stamp { border: 2px solid #059669; color: #059669; font-weight: 900; font-size: 11px; padding: 8px 14px; border-radius: 8px; text-transform: uppercase; transform: rotate(-4deg); display: inline-block; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="logo-text">SPHEREX OS CREATOR SUITE</div>
              <div class="sub">Intelligent Admission CRM & Institutional Lead OS</div>
              <div class="sub">Master Architect: Nithish Kumar (spherexnithish#)</div>
            </div>
            <div>
              <div class="inv-title">Annual License Tax Invoice</div>
              <div class="sub" style="text-align: right;">Invoice No: <strong>${invoiceNo}</strong></div>
              <div class="sub" style="text-align: right;">Billing Date: ${invoiceDate}</div>
              <div class="sub" style="text-align: right;">License Tier: <strong>Dual-Platform Enterprise (1,00,000 Cap)</strong></div>
            </div>
          </div>

          <div class="client-grid">
            <div class="client-box">
              <span style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b;">Billed To (Institution):</span>
              <strong>V.S.B. EDUCATIONAL TRUST</strong>
              <div>NH-67, Kovai Road, Karur, Tamil Nadu 639111</div>
              <div>Campuses: Karur (VSBEC) & Coimbatore (VSBCTC)</div>
              <div>Admin Contact: adminkarur@123 • admincovai@123</div>
            </div>
            <div class="client-box">
              <span style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b;">Creator Platform Coverage:</span>
              <strong>SPHEREX CLOUD DUAL-PLATFORM</strong>
              <div>• Web Application Portal (Desktop, Laptop, Tablet)</div>
              <div>• Native Android & iOS Mobile Applications</div>
              <div>• Multi-Campus Institutional Lead Management OS</div>
              <div>• 1,00,000 Capacity Real-time Firebase Database</div>
            </div>
          </div>

          <table class="table-box">
            <thead>
              <tr>
                <th>Service Description</th>
                <th>Platform Scope</th>
                <th>Qty / Lead Usage</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Institutional Base License (Annual Renewal)</strong><br/>
                  <span style="color: #64748b; font-size: 11px;">Covers 1,00,000 free student leads, unlimited teachers & multi-campus engine</span>
                </td>
                <td>Web + Mobile Apps</td>
                <td>1 Year License</td>
                <td style="text-align: right; font-weight: 700;">₹${customBaseAnnualFee.toLocaleString("en-IN")}.00</td>
              </tr>
              <tr>
                <td>
                  <strong>Extra Leads Overage Fee (₹${customOveragePrice}/lead)</strong><br/>
                  <span style="color: #64748b; font-size: 11px;">Overage leads authorized beyond 1,00,000 institutional quota cap</span>
                </td>
                <td>Cloud Database Sync</td>
                <td>${annualBilling.extraLeadsCount} Extra Leads</td>
                <td style="text-align: right; font-weight: 700;">₹${(annualBilling.extraLeadsCount * customOveragePrice).toLocaleString("en-IN")}.00</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="text-align: right; font-weight: 900;">TOTAL ANNUAL RENEWAL DUE:</td>
                <td style="text-align: right; font-weight: 900;">₹${(customBaseAnnualFee + (annualBilling.extraLeadsCount * customOveragePrice)).toLocaleString("en-IN")}.00</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; color: #64748b; margin-top: 15px; border-left: 3px solid #4338ca; padding-left: 10px;">
            <p style="margin: 0;">• Official software license statement issued by SphereX OS Developer & Root Creator.</p>
            <p style="margin: 3px 0 0 0;">• Includes continuous Firebase real-time database synchronization, offline mobile caches & security updates.</p>
          </div>

          <div class="stamp-box">
            <div>
              <div class="stamp">LICENSED & AUTHORIZED</div>
              <p style="font-size: 10px; color: #64748b; margin-top: 5px;">SphereX Developer Network</p>
            </div>
            <div style="text-align: center; font-size: 11px; font-weight: 700;">
              <div style="border-bottom: 1px solid #94a3b8; width: 150px; margin-bottom: 5px;"></div>
              Nithish Kumar (spherexnithish#)<br/>
              <span style="font-size: 10px; color: #64748b; font-weight: normal;">Master Software Architect</span>
            </div>
          </div>

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="background: #4338ca; color: #fff; padding: 10px 24px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* ============================================================== */}
      {/* 1. MASTER CREATOR HEADER BANNER                                */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>SPHEREX OS MASTER CREATOR PORTAL</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-800">
                Root Auth ID: spherexnithish#
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                ● Subsystems Online
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Creator Control & Master Architecture Console</span>
            </h1>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
              Welcome, <strong>Nithish Kumar</strong>. This is your isolated creator environment. It is completely inaccessible to college administrators and faculty accounts. You have total control over quota limits, software annual licenses, and database provisioning.
            </p>
          </div>

          {/* Quick Actions for Creator */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrintAnnualRenewalInvoice}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Institutional Annual Bill</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Exit Creator Session</span>
              </button>
            )}
          </div>
        </div>

        {/* Isolation Notice Alert Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-amber-200/90 font-medium">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Strict Privacy Active: College Admin accounts (adminkarur@123, admincovai@123) cannot see this console or credentials.</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
            <span>Passkey: spherex#2501</span>
            <span>•</span>
            <span>Protected Route</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. CREATOR NAVIGATION TABS                                     */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
        {[
          { id: "QUOTA", label: "1,00,000 Quota & Overage Engine", icon: Sliders },
          { id: "LICENSING", label: "Annual Software License (₹1,50,000)", icon: DollarSign },
          { id: "TENANTS", label: "Multi-Campus Tenants (Karur & Covai)", icon: Building },
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
      {/* TAB 1: 1,00,000 LEAD QUOTA & OVERAGE ENGINE                     */}
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
              <p className="text-xs text-emerald-400 font-semibold">Institutional Quota Included Free</p>
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
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Extra Lead Surcharge
              </p>
              <h3 className="text-2xl font-black text-indigo-400 font-mono">
                ₹{customOveragePrice} <span className="text-xs font-normal text-slate-400">/ lead</span>
              </h3>
              <p className="text-xs text-slate-400">Billed to Annual Renewal</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Accumulated Overage
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
      {/* TAB 2: ANNUAL SOFTWARE LICENSE (DUAL-PLATFORM)                 */}
      {/* ============================================================== */}
      {activeTab === "LICENSING" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Dual-Platform Application Annual License</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client: V.S.B. Educational Trust • Covers Web Application & Native Mobile Apps
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrintAnnualRenewalInvoice}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Generate Official PDF Tax Invoice</span>
              </button>
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
                  Status: Licensed & Active
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
                  Status: Licensed & Active
                </span>
              </div>
            </div>

            {/* License Breakdown Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Component Head</th>
                    <th className="p-3">Terms & Included Quota</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  <tr>
                    <td className="p-3 font-semibold text-white">Base Annual Platform Subscription</td>
                    <td className="p-3 text-slate-400">Includes 1,00,000 free student leads, unlimited faculty accounts</td>
                    <td className="p-3 font-mono">Annual Flat</td>
                    <td className="p-3 text-right font-mono font-bold text-white">₹{customBaseAnnualFee.toLocaleString("en-IN")}.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">Extra Lead Surcharges</td>
                    <td className="p-3 text-slate-400">{annualBilling.extraLeadsCount} extra leads added beyond 1,00,000 cap</td>
                    <td className="p-3 font-mono">₹{customOveragePrice} / lead</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-400">₹{(annualBilling.extraLeadsCount * customOveragePrice).toLocaleString("en-IN")}.00</td>
                  </tr>
                  <tr className="bg-slate-950/80 font-bold">
                    <td colSpan={3} className="p-3 text-right text-slate-300 uppercase text-[11px]">Total Annual Renewal:</td>
                    <td className="p-3 text-right font-mono text-emerald-400 text-sm">
                      ₹{(customBaseAnnualFee + (annualBilling.extraLeadsCount * customOveragePrice)).toLocaleString("en-IN")}.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MULTI-CAMPUS TENANTS (KARUR & COIMBATORE)               */}
      {/* ============================================================== */}
      {activeTab === "TENANTS" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Karur Campus Tenant */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                    🏛️
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">V.S.B. Engineering College</h4>
                    <p className="text-[11px] text-slate-400 font-mono">Tenant ID: VSB_KARUR</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Active
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Campus Branch:</span>
                  <span className="font-semibold text-white">Karur, Tamil Nadu (NH-67)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Admin Login ID:</span>
                  <span className="font-mono text-indigo-400 font-bold">adminkarur@123</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Total Enrolled Records:</span>
                  <span className="font-mono text-white font-bold">{applicants.filter((a) => a.campus === "KARUR").length} Leads</span>
                </div>
              </div>

              {onSwitchCampus && (
                <button
                  type="button"
                  onClick={() => {
                    onSwitchCampus("KARUR");
                    onTriggerToast("🏛️ Switched creator view to Karur Campus.");
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                >
                  Inspect Karur Tenant Database
                </button>
              )}
            </div>

            {/* Coimbatore Campus Tenant */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
                    🏢
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">V.S.B. College of Engineering Technical Campus</h4>
                    <p className="text-[11px] text-slate-400 font-mono">Tenant ID: VSB_COIMBATORE</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Active
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Campus Branch:</span>
                  <span className="font-semibold text-white">Coimbatore, Tamil Nadu (Pollachi Road)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Admin Login ID:</span>
                  <span className="font-mono text-amber-400 font-bold">admincovai@123</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Total Enrolled Records:</span>
                  <span className="font-mono text-white font-bold">{applicants.filter((a) => a.campus === "COIMBATORE").length} Leads</span>
                </div>
              </div>

              {onSwitchCampus && (
                <button
                  type="button"
                  onClick={() => {
                    onSwitchCampus("COIMBATORE");
                    onTriggerToast("🏢 Switched creator view to Coimbatore Campus.");
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                >
                  Inspect Coimbatore Tenant Database
                </button>
              )}
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
    </div>
  );
}
