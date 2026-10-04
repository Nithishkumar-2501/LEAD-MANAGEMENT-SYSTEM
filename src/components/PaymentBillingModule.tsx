"use client";

import { useState, useEffect } from "react";
import { Payment, CampusLocation } from "@/types/crm";
import {
  fetchPaymentsFromFirebase,
  savePaymentToFirebase,
} from "@/lib/firebaseSync";
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
  CreditCard,
  DollarSign,
  Download,
  Search,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  X,
  FileText,
  Printer,
  Calendar,
  Building,
  User,
  Check,
  Loader2,
  RefreshCw,
  Receipt,
  Smartphone,
  Globe,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Clock,
} from "lucide-react";

interface PaymentBillingModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  onTriggerToast: (msg: string) => void;
  currentLeadsCount?: number;
}

export default function PaymentBillingModule({
  loggedInCampus,
  onTriggerToast,
  currentLeadsCount = 0,
}: PaymentBillingModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"STUDENT_FEES" | "ANNUAL_RENEWAL">("STUDENT_FEES");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Annual Renewal Billing State
  const [annualBilling, setAnnualBilling] = useState<AnnualRenewalBillingRecord>(getAnnualRenewalData());

  // Listen to annual renewal updates
  useEffect(() => {
    const handleRenewalUpdate = () => {
      setAnnualBilling(getAnnualRenewalData());
    };
    window.addEventListener("vsb_annual_renewal_updated", handleRenewalUpdate);
    return () => window.removeEventListener("vsb_annual_renewal_updated", handleRenewalUpdate);
  }, []);

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  // New Payment Form state
  const [newPayment, setNewPayment] = useState({
    studentName: "",
    course: "B.E. Computer Science and Engineering",
    campus: loggedInCampus,
    amount: 85000,
    status: "COMPLETED",
    paymentMethod: "Online UPI / NetBanking",
    transactionId: `VSB_TXN_${Date.now().toString().slice(-6)}`,
  });

  // Load live payments from Firebase
  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPaymentsFromFirebase(loggedInCampus);
      setPayments(data || []);
    } catch (e) {
      console.warn("Error loading payments:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [loggedInCampus]);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      p.course.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesCampus = !p.campus || p.campus === loggedInCampus || p.campus === "ALL";

    return matchesSearch && matchesStatus && matchesCampus;
  });

  const totalCollected = filteredPayments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  const effectiveTotalLeads = getEffectiveLeadCount(currentLeadsCount);
  const percentQuotaUsed = Math.min(100, Number(((effectiveTotalLeads / MAX_FREE_LEAD_LIMIT) * 100).toFixed(1)));
  const isCapReached = effectiveTotalLeads >= MAX_FREE_LEAD_LIMIT;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.studentName.trim()) {
      onTriggerToast("⚠️ Please enter student name.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Payment = {
        id: `pay_${Date.now()}`,
        applicationId: `app_${Date.now()}`,
        studentName: newPayment.studentName.trim(),
        course: newPayment.course,
        campus: newPayment.campus,
        amount: Number(newPayment.amount),
        status: newPayment.status,
        transactionId: newPayment.transactionId.trim() || `VSB_TXN_${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
      };

      const ok = await savePaymentToFirebase(payload);
      if (ok) {
        setPayments((prev) => [payload, ...prev]);
        onTriggerToast(`🎉 Payment receipt ₹${payload.amount.toLocaleString("en-IN")} recorded for ${payload.studentName} in Firebase!`);
        setIsRecordModalOpen(false);
        setNewPayment({
          studentName: "",
          course: "B.E. Computer Science and Engineering",
          campus: loggedInCampus,
          amount: 85000,
          status: "COMPLETED",
          paymentMethod: "Online UPI / NetBanking",
          transactionId: `VSB_TXN_${Date.now().toString().slice(-6)}`,
        });
      } else {
        onTriggerToast("❌ Failed to save payment to Firebase.");
      }
    } catch (err) {
      onTriggerToast("❌ Error recording payment.");
    } finally {
      setIsSaving(false);
    }
  };

  // Official Fee Receipt Printable Generator
  const handlePrintReceipt = (p: Payment) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      onTriggerToast("⚠️ Popup blocked! Please allow popups to print fee receipt.");
      return;
    }

    const collegeTitle =
      p.campus === "COIMBATORE"
        ? "V.S.B. COLLEGE OF ENGINEERING TECHNICAL CAMPUS (COIMBATORE)"
        : "V.S.B. ENGINEERING COLLEGE (KARUR)";
    const address =
      p.campus === "COIMBATORE"
        ? "Pollachi Main Road, EAL, Coimbatore, Tamil Nadu 642109"
        : "NH-67, Kovai Road, Karur, Tamil Nadu 639111";

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>VSB_Official_Fee_Receipt_${p.transactionId}.pdf</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 40px; color: #0f172a; background: #fff; }
          .receipt-box { max-width: 750px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 12px; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
          .college-name { font-size: 20px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 0; }
          .college-sub { font-size: 11px; color: #475569; margin-top: 4px; font-weight: 600; }
          .receipt-title { display: inline-block; background: #1e3a8a; color: #fff; padding: 6px 18px; border-radius: 20px; font-weight: 800; font-size: 12px; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 12px; }
          .meta-item { display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
          .meta-label { color: #64748b; font-weight: 600; }
          .meta-val { font-weight: 800; color: #0f172a; }
          .table-box { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
          .table-box th { background: #f1f5f9; text-align: left; padding: 10px; font-weight: 800; border-bottom: 1px solid #cbd5e1; }
          .table-box td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
          .amount-row { font-size: 14px; font-weight: 900; color: #059669; }
          .stamp-box { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; }
          .signature { text-align: center; font-size: 11px; font-weight: 700; color: #334155; }
          .stamp { border: 2px solid #059669; color: #059669; font-weight: 900; font-size: 11px; padding: 8px 14px; border-radius: 8px; text-transform: uppercase; transform: rotate(-5deg); display: inline-block; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <h1 class="college-name">${collegeTitle}</h1>
            <p class="college-sub">${address}</p>
            <p class="college-sub">Approved by AICTE, New Delhi • Affiliated to Anna University • NAAC 'A+' Accredited</p>
            <div class="receipt-title">Official Admission Fee E-Receipt</div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Receipt Number:</span>
              <span class="meta-val">VSB-REC-2026-${p.id.slice(-4)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date & Time:</span>
              <span class="meta-val">${new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Transaction Ref ID:</span>
              <span class="meta-val">${p.transactionId}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Campus Branch:</span>
              <span class="meta-val">${p.campus} CAMPUS</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Student Applicant:</span>
              <span class="meta-val">${p.studentName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Payment Status:</span>
              <span class="meta-val" style="color:#059669;">✔ ${p.status}</span>
            </div>
          </div>

          <table class="table-box">
            <thead>
              <tr>
                <th>Description / Allotment Account</th>
                <th>Academic Year</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Provisional Admission & Tuition Allotment Fee</strong><br/>
                  <span style="color:#64748b; font-size:11px;">Program: ${p.course}</span>
                </td>
                <td>2026 - 2027</td>
                <td style="text-align: right; font-weight:800;">₹${p.amount.toLocaleString("en-IN")}.00</td>
              </tr>
              <tr class="amount-row">
                <td colspan="2" style="text-align: right;">NET AMOUNT RECEIVED:</td>
                <td style="text-align: right;">₹${p.amount.toLocaleString("en-IN")}.00</td>
              </tr>
            </tbody>
          </table>

          <div class="stamp-box">
            <div>
              <div class="stamp">PAID & VERIFIED</div>
              <p style="font-size:10px; color:#64748b; margin-top:6px;">Bank Cleared via VSB Central Accounts</p>
            </div>
            <div class="signature">
              <p style="margin-bottom:40px; color:#94a3b8;">Digitally Signed by</p>
              <p><strong>Chief Finance Officer</strong><br/>VSB Educational Trust</p>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    onTriggerToast(`📄 Official fee receipt generated for ${p.studentName}!`);
  };

  // Official Annual Platform Renewal Invoice Printable Generator
  const handlePrintAnnualRenewalInvoice = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      onTriggerToast("⚠️ Popup blocked! Please allow popups to view annual renewal invoice.");
      return;
    }

    const invoiceNumber = `VSB-RENEW-2026-001`;
    const invoiceDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const dueDate = new Date(annualBilling.renewalDueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>VSB_Annual_Application_Renewal_Invoice_${invoiceNumber}.pdf</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 40px; color: #0f172a; background: #fff; }
          .invoice-box { max-width: 800px; margin: 0 auto; border: 2px solid #1e293b; border-radius: 14px; padding: 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
          .company-title { font-size: 22px; font-weight: 900; color: #0284c7; text-transform: uppercase; margin: 0; }
          .company-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
          .invoice-badge { background: #0f172a; color: #38bdf8; padding: 6px 14px; border-radius: 8px; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 12px; }
          .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .meta-label { color: #64748b; font-weight: 600; font-size: 11px; text-transform: uppercase; }
          .meta-val { font-weight: 800; color: #0f172a; font-size: 13px; margin-top: 2px; }
          .table-box { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 12px; }
          .table-box th { background: #f1f5f9; text-align: left; padding: 10px; font-weight: 800; border-bottom: 1px solid #cbd5e1; }
          .table-box td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
          .total-row { font-size: 15px; font-weight: 900; color: #0f172a; background: #f8fafc; }
          .grand-total { color: #059669; font-size: 18px; }
          .terms-box { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; font-size: 11px; color: #92400e; margin-top: 24px; line-height: 1.5; }
          .stamp-box { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 20px; }
          .signature { text-align: center; font-size: 11px; font-weight: 700; color: #334155; }
          .stamp { border: 2px solid #0284c7; color: #0284c7; font-weight: 900; font-size: 11px; padding: 8px 14px; border-radius: 8px; text-transform: uppercase; transform: rotate(-3deg); display: inline-block; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <h1 class="company-title">SPHEREX CRM • ANNUAL RENEWAL</h1>
              <p class="company-sub">Multi-Campus Admission Operating System (Web Portal + Native Mobile App)</p>
              <p class="company-sub">Licensed to: <strong>V.S.B. EDUCATIONAL TRUST (KARUR & COIMBATORE)</strong></p>
            </div>
            <div style="text-align: right;">
              <div class="invoice-badge">Official Renewal Statement</div>
              <p style="font-size: 11px; color: #64748b; margin-top: 6px;">Ref: ${invoiceNumber}</p>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Billed Institution</div>
              <div class="meta-val">V.S.B. Group of Institutions</div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">Karur Main Campus & Coimbatore Technical Campus</div>
              <div style="font-size: 11px; color: #0284c7; font-weight: 700; margin-top: 2px;">Coverage: Web Portal + Android & iOS Mobile Apps</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Invoice Details</div>
              <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                <span style="color: #64748b;">Invoice Date:</span>
                <span style="font-weight: 800;">${invoiceDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                <span style="color: #64748b;">Renewal Due Date:</span>
                <span style="font-weight: 800; color: #dc2626;">${dueDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                <span style="color: #64748b;">Included Capacity:</span>
                <span style="font-weight: 800; color: #059669;">1,00,000 Free Leads</span>
              </div>
            </div>
          </div>

          <table class="table-box">
            <thead>
              <tr>
                <th>Service Item / Subscription Breakdown</th>
                <th>Units / Quota</th>
                <th>Rate (INR)</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Annual CRM Enterprise Platform SaaS License</strong><br/>
                  <span style="color: #64748b; font-size: 11px;">Dual Deployment: Responsive Web App + Native Android & iOS Mobile Applications</span>
                </td>
                <td>1 Year</td>
                <td>₹1,50,000.00</td>
                <td style="text-align: right; font-weight: 800;">₹1,50,000.00</td>
              </tr>
              <tr>
                <td>
                  <strong>Standard Admission Lead Capacity Tier</strong><br/>
                  <span style="color: #64748b; font-size: 11px;">Includes up to 1,00,000 candidate leads across both campuses</span>
                </td>
                <td>1,00,000 Leads</td>
                <td>FREE</td>
                <td style="text-align: right; font-weight: 800; color: #059669;">₹0.00 (Included)</td>
              </tr>
              <tr>
                <td>
                  <strong>Additional Overage Leads Pack (Beyond 1,00,000 Cap)</strong><br/>
                  <span style="color: #64748b; font-size: 11px;">Policy: ₹500 per additional lead added after 1,00,000 limit</span>
                </td>
                <td>${annualBilling.extraLeadsCount} Extra Lead(s)</td>
                <td>₹500.00 / lead</td>
                <td style="text-align: right; font-weight: 800; color: ${annualBilling.extraLeadsCost > 0 ? '#b91c1c' : '#64748b'};">
                  ₹${annualBilling.extraLeadsCost.toLocaleString("en-IN")}.00
                </td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">TOTAL ANNUAL PAYMENT RENEWAL:</td>
                <td style="text-align: right;" class="grand-total">₹${annualBilling.totalRenewalFee.toLocaleString("en-IN")}.00</td>
              </tr>
            </tbody>
          </table>

          <div class="terms-box">
            <strong>📋 Quota & Renewal Policy:</strong><br/>
            • Base license covers unlimited admin, counselor & teacher seats, plus up to 1,00,000 student leads.<br/>
            • When the 1,00,000 limit is reached, any new lead authorized by Admin is billed at ₹500/lead and added directly to this Annual Renewal invoice.<br/>
            • Payment encompasses both Web Portal and Native Mobile Applications.
          </div>

          <div class="stamp-box">
            <div>
              <div class="stamp">ENTERPRISE SAAS INVOICE</div>
              <p style="font-size: 10px; color: #64748b; margin-top: 6px;">V.S.B. Cloud System Architecture</p>
            </div>
            <div class="signature">
              <p style="margin-bottom: 40px; color: #94a3b8;">Authorized Signature</p>
              <p><strong>Lead Software Licensing Division</strong><br/>SPHEREX CRM Systems</p>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    onTriggerToast("📄 Official Annual Renewal invoice generated!");
  };

  const handleToggleSimulation = (enabled: boolean) => {
    const updated = setSimulatedQuotaMode(enabled, 100000);
    setAnnualBilling(updated);
    if (enabled) {
      onTriggerToast("🧪 Test Mode: Simulated 1,00,000 Lead Limit is now ACTIVE! Try adding a lead to see the ₹500 overage prompt.");
    } else {
      onTriggerToast("✅ Returned to real database lead count.");
    }
  };

  const handleResetOverage = () => {
    if (confirm("Reset accumulated overage leads back to 0?")) {
      const updated = resetOverageLedger();
      setAnnualBilling(updated);
      onTriggerToast("🔄 Overage ledger reset to base annual renewal (₹1,50,000).");
    }
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* Top Navigation Tabs: Student Fees vs Annual Renewal */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab("STUDENT_FEES")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "STUDENT_FEES"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Student Fee Receipts ({filteredPayments.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("ANNUAL_RENEWAL")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "ANNUAL_RENEWAL"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Annual Application Renewal & Quota (1,00,000 Cap)</span>
            {annualBilling.extraLeadsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                +{annualBilling.extraLeadsCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Quota Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Lead Quota:</span>
          <span className={`font-mono font-bold ${isCapReached ? "text-rose-400" : "text-emerald-400"}`}>
            {effectiveTotalLeads.toLocaleString("en-IN")} / {MAX_FREE_LEAD_LIMIT.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
            {percentQuotaUsed}%
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: ANNUAL APPLICATION PAYMENT RENEWAL & LEAD QUOTA */}
      {/* ============================================================== */}
      {activeSubTab === "ANNUAL_RENEWAL" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Banner: Enterprise License & Dual-Platform Coverage */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900 text-white space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Dual Platform Active
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Web Application + Native Android & iOS Mobile Apps
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Application Annual Payment Renewal & Lead Limit
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Institutional license includes <strong>1,00,000 free student leads</strong>. If the 1,00,000 limit is reached, admin cannot add any leads without approval. Each additional lead costs <strong>₹500</strong>, automatically billed to this Annual Renewal invoice.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrintAnnualRenewalInvoice}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download Annual Invoice (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetOverage}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Reset Overage Ledger to 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Surcharge</span>
                </button>
              </div>
            </div>

            {/* Test Simulation Switch Banner */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200">
                    Live 1,00,000 Limit Testing Simulator
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {annualBilling.simulatedLimitEnabled
                      ? "⚠️ Simulation is ON: System treats lead count as 1,00,000 to demonstrate the ₹500/lead overage prompt."
                      : "Simulation is OFF: Using real database count (" + currentLeadsCount + " leads). Click to test limit."}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleSimulation(!annualBilling.simulatedLimitEnabled)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    annualBilling.simulatedLimitEnabled
                      ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  {annualBilling.simulatedLimitEnabled ? "Disable Test Simulator" : "Activate 1,00,000 Limit Test"}
                </button>
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Lead Quota */}
            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 bg-white/5 backdrop-blur-md space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Total Lead Capacity
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                    {effectiveTotalLeads.toLocaleString("en-IN")}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-xl border ${isCapReached ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}>
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCapReached ? "bg-rose-500 w-full" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, percentQuotaUsed)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-0.5">
                <span>Free Cap: {MAX_FREE_LEAD_LIMIT.toLocaleString("en-IN")}</span>
                <span className={isCapReached ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {percentQuotaUsed}% Used
                </span>
              </div>
            </div>

            {/* Card 2: Extra Leads Added Beyond Limit */}
            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 bg-white/5 backdrop-blur-md space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Extra Leads Added
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1">
                    +{annualBilling.extraLeadsCount} Leads
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Overage rate: <strong>₹{PRICE_PER_EXTRA_LEAD}</strong> per lead
              </p>
              <p className="text-[11px] text-amber-400 font-bold">
                Extra Surcharge: ₹{annualBilling.extraLeadsCost.toLocaleString("en-IN")}
              </p>
            </div>

            {/* Card 3: Base Annual Renewal */}
            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 bg-white/5 backdrop-blur-md space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    Base Annual License
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-indigo-300 font-mono mt-1">
                    ₹{BASE_ANNUAL_RENEWAL_FEE.toLocaleString("en-IN")}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Next Due: <strong>{new Date(annualBilling.renewalDueDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</strong>
              </p>
              <p className="text-[11px] text-indigo-400 font-bold">
                Web CRM + Android & iOS
              </p>
            </div>

            {/* Card 4: Total Annual Payment Renewal */}
            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">
                    Total Renewal Payable
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
                    ₹{annualBilling.totalRenewalFee.toLocaleString("en-IN")}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-300">
                Base Fee + ₹{annualBilling.extraLeadsCost.toLocaleString("en-IN")} Surcharge
              </p>
              <div className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Billed in Annual Renewal
              </div>
            </div>
          </div>

          {/* Detailed Itemized Statement Card */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 bg-white/5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-sky-400" />
                  <span>Annual Subscription & Renewal Ledger Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed cost breakdown for Web and Native Mobile Application maintenance & licensing
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-200">
                Academic Year 2026 - 2027
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Line Item / Service Description</th>
                    <th className="py-3 px-4">Allocated Quota</th>
                    <th className="py-3 px-4">Unit Pricing</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-white">
                      1. SPHEREX Enterprise Admission CRM Platform
                      <div className="text-[11px] text-slate-400 font-normal">
                        Includes Dual-Deploy Web CRM + Native Mobile App APK/IPA build support
                      </div>
                    </td>
                    <td className="py-3.5 px-4">1 Year Term</td>
                    <td className="py-3.5 px-4 font-mono">₹1,50,000 / year</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">₹1,50,000.00</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-bold text-white">
                      2. Free Student Lead Storage Tier (Included)
                      <div className="text-[11px] text-slate-400 font-normal">
                        Standard quota of 1,00,000 leads for Karur and Coimbatore campuses
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">1,00,000 Leads</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400">FREE</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">₹0.00</td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-bold text-white">
                      3. Additional Overage Leads Added Beyond 1,00,000 Limit
                      <div className="text-[11px] text-slate-400 font-normal">
                        Accumulated via Admin Lead Creation / Bulk Imports after cap
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      +{annualBilling.extraLeadsCount} Leads
                    </td>
                    <td className="py-3.5 px-4 font-mono">₹500.00 / lead</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                      ₹{annualBilling.extraLeadsCost.toLocaleString("en-IN")}.00
                    </td>
                  </tr>

                  <tr className="bg-slate-900/60 font-black text-sm text-white">
                    <td colSpan={3} className="py-4 px-4 text-right">
                      TOTAL ANNUAL RENEWAL DUE:
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-400 text-base">
                      ₹{annualBilling.totalRenewalFee.toLocaleString("en-IN")}.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Overage Audit Trail Ledger */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 bg-white/5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Overage Audit Ledger ({annualBilling.overageLedger?.length || 0} Transactions)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time log of each candidate lead added beyond the 1,00,000 limit with ₹500 fee added to Annual Renewal
                </p>
              </div>
            </div>

            {annualBilling.overageLedger && annualBilling.overageLedger.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Candidate / Batch</th>
                      <th className="py-2.5 px-3">Leads Added</th>
                      <th className="py-2.5 px-3">Rate</th>
                      <th className="py-2.5 px-3">Charged Amount</th>
                      <th className="py-2.5 px-3">Billed Destination</th>
                      <th className="py-2.5 px-3 text-right">Authorized By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {annualBilling.overageLedger.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          {item.leadName}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">
                          +{item.count} Lead{item.count > 1 ? "s" : ""}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          ₹{item.costPerLead}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-400">
                          ₹{item.totalCost.toLocaleString("en-IN")}.00
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Annual Renewal (Web & Mobile)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 font-medium">
                          {item.approvedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">No overage leads added yet</p>
                <p className="text-slate-500 mt-0.5">
                  All leads are currently operating within the 1,00,000 capacity.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: STANDARD STUDENT ADMISSION FEE RECEIPTS */}
      {/* ============================================================== */}
      {activeSubTab === "STUDENT_FEES" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-white/5 backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Fee Collected ({loggedInCampus})
                  </p>
                  <h3 className="text-2xl font-bold text-slate-100 mt-1">
                    ₹{totalCollected.toLocaleString("en-IN")}
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-emerald-400 font-medium mt-3 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Bank Cleared Receipts • Firebase Synced
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-white/5 backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Receipts</p>
                  <h3 className="text-2xl font-bold text-indigo-300 mt-1">
                    {filteredPayments.filter((p) => p.status === "COMPLETED").length} Students
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-indigo-400 font-medium mt-3">VSB Central Treasury Account</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-white/5 backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Allotments</p>
                  <h3 className="text-2xl font-bold text-amber-300 mt-1">
                    {filteredPayments.filter((p) => p.status !== "COMPLETED").length} Pending
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-amber-400 font-medium mt-3">Awaiting Bank Reconciliation</p>
            </div>
          </div>

          {/* Payment Transactions Table */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 bg-white/5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Admission Fee Receipts & Transactions</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-extrabold">
                    🔥 Firestore Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Verified tuition and allotment fee payments for V.S.B. ({loggedInCampus} Campus)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Txn ID, student, course..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="COMPLETED">Completed / Paid</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="FAILED">Failed</option>
                </select>

                {/* Record Payment Button */}
                <button
                  onClick={() => setIsRecordModalOpen(true)}
                  className="press-spring flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Fee Payment</span>
                </button>
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                <p className="text-xs">Loading payment transactions...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No payment transactions found matching your filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Transaction Ref</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Course / Program</th>
                      <th className="py-3 px-4">Campus</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">E-Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                          {p.transactionId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.studentName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate" title={p.course}>
                          {p.course}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              p.campus === "COIMBATORE"
                                ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                                : "bg-sky-950/80 text-sky-300 border border-sky-800"
                            }`}
                          >
                            {p.campus || loggedInCampus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          ₹{p.amount.toLocaleString("en-IN")}.00
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === "COMPLETED"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : p.status === "PENDING"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-rose-950 text-rose-300 border border-rose-800"
                            }`}
                          >
                            {p.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                            <span>{p.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handlePrintReceipt(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-medium text-xs transition-colors cursor-pointer"
                            title="Generate Official Printable PDF Receipt"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Print Receipt</span>
                          </button>
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

      {/* RECORD NEW PAYMENT MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsRecordModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Record New Student Fee Payment</span>
            </h3>
            <p className="text-xs text-slate-400">
              Add student admission tuition fee allotment to generate official VSB receipt & sync with Firebase.
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Student Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newPayment.studentName}
                  onChange={(e) => setNewPayment({ ...newPayment, studentName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Course / Engineering Department</label>
                <input
                  type="text"
                  required
                  value={newPayment.course}
                  onChange={(e) => setNewPayment({ ...newPayment, course: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Fee Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Campus</label>
                  <select
                    value={newPayment.campus}
                    onChange={(e) => setNewPayment({ ...newPayment, campus: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold cursor-pointer"
                  >
                    <option value="KARUR">Karur Campus</option>
                    <option value="COIMBATORE">Coimbatore Campus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Transaction Ref ID</label>
                  <input
                    type="text"
                    required
                    value={newPayment.transactionId}
                    onChange={(e) => setNewPayment({ ...newPayment, transactionId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold cursor-pointer"
                  >
                    <option value="Online UPI / NetBanking">Online UPI / NetBanking</option>
                    <option value="Debit / Credit Card">Debit / Credit Card</option>
                    <option value="Demand Draft (DD)">Demand Draft (DD)</option>
                    <option value="Cash Counter">College Cash Counter</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Firebase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Record to Firebase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
