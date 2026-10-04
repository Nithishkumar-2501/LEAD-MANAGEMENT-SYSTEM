"use client";

import { useState, useEffect, useMemo } from "react";
import { Payment, CampusLocation, Lead, Application } from "@/types/crm";
import {
  fetchPaymentsFromFirebase,
  savePaymentToFirebase,
} from "@/lib/firebaseSync";
import { MAX_FREE_LEAD_LIMIT, getEffectiveLeadCount } from "@/lib/leadQuotaService";
import {
  CreditCard,
  Search,
  CheckCircle2,
  ShieldCheck,
  Plus,
  X,
  Printer,
  User,
  Loader2,
  Receipt,
  Clock,
  Phone,
  MessageCircle,
  Filter,
  Sparkles,
  DollarSign,
  AlertCircle,
  Calendar,
  Building,
  GraduationCap,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { getWhatsAppUrl } from "@/lib/whatsappSender";

export interface StudentFeeItem {
  id: string;
  studentName: string;
  applicationNo: string;
  course: string;
  campus: CampusLocation;
  phone: string;
  email: string;
  feeCategory: "Tuition Fee" | "Seat Allotment Deposit" | "Hostel & Mess Fee" | "Transport Fee";
  totalFee: number;
  amountPaid: number;
  balanceDue: number;
  status: "COMPLETED" | "PENDING" | "PARTIAL";
  transactionId?: string;
  paymentMethod?: string;
  paidAt?: string;
  rawPayment?: Payment;
}

interface PaymentBillingModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  onTriggerToast: (msg: string) => void;
  currentLeadsCount?: number;
  applicants?: (Lead & { application: Application })[];
}

export default function PaymentBillingModule({
  loggedInCampus,
  onTriggerToast,
  currentLeadsCount = 0,
  applicants = [],
}: PaymentBillingModuleProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "PENDING" | "PARTIAL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [campusFilter, setCampusFilter] = useState<string>("ALL");

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Payment Form state
  const [newPayment, setNewPayment] = useState({
    studentName: "",
    course: "B.E. Computer Science and Engineering",
    campus: loggedInCampus,
    amount: 85000,
    feeCategory: "Tuition Fee" as "Tuition Fee" | "Seat Allotment Deposit" | "Hostel & Mess Fee" | "Transport Fee",
    status: "COMPLETED" as "COMPLETED" | "PENDING" | "PARTIAL",
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

  // Aggregate student fee list from CRM applicants + Firebase receipts
  const allStudentFeeRecords: StudentFeeItem[] = useMemo(() => {
    const list: StudentFeeItem[] = [];
    const processedStudentNames = new Set<string>();

    // 1. Process admitted / enrolled applicants from CRM database
    applicants.forEach((app, idx) => {
      const name = app.name || "Student Applicant";
      processedStudentNames.add(name.toLowerCase());

      // Check if this student has a recorded payment in Firebase
      const matchingPayment = payments.find(
        (p) =>
          p.applicationId === app.id ||
          p.studentName.toLowerCase() === name.toLowerCase()
      );

      const isCompleted =
        matchingPayment?.status === "COMPLETED" ||
        app.application?.paymentStatus === "COMPLETED" ||
        app.status === "ADMITTED" ||
        (app.application?.stage as string) === "FEE_PAID";

      const totalFee = 85000;
      const amountPaid = isCompleted
        ? matchingPayment?.amount || 85000
        : matchingPayment ? matchingPayment.amount : 0;
      const balanceDue = Math.max(0, totalFee - amountPaid);

      const status: "COMPLETED" | "PENDING" | "PARTIAL" =
        amountPaid >= totalFee
          ? "COMPLETED"
          : amountPaid > 0
          ? "PARTIAL"
          : "PENDING";

      list.push({
        id: app.id || `stud_${idx}`,
        studentName: name,
        applicationNo: (app.application as any)?.applicationNo || `VSB-2026-${String(idx + 1).padStart(4, "0")}`,
        course: app.courseInterest || "B.E. Computer Science and Engineering",
        campus: app.campus || loggedInCampus,
        phone: app.phone || "",
        email: app.email || "",
        feeCategory: "Tuition Fee",
        totalFee,
        amountPaid,
        balanceDue,
        status,
        transactionId: matchingPayment?.transactionId || (isCompleted ? `VSB_TXN_${app.id.slice(-6)}` : undefined),
        paymentMethod: matchingPayment ? "Online UPI / NetBanking" : isCompleted ? "Net Banking" : undefined,
        paidAt: matchingPayment?.createdAt || (isCompleted ? app.createdAt : undefined),
        rawPayment: matchingPayment,
      });
    });

    // 2. Add any standalone Firebase payments not directly mapped to an applicant
    payments.forEach((p, idx) => {
      if (!processedStudentNames.has(p.studentName.toLowerCase())) {
        processedStudentNames.add(p.studentName.toLowerCase());
        const totalFee = Math.max(p.amount, 85000);
        list.push({
          id: p.id || `pay_${idx}`,
          studentName: p.studentName,
          applicationNo: `VSB-PAY-${p.id.slice(-4)}`,
          course: p.course || "B.E. Computer Science and Engineering",
          campus: p.campus || loggedInCampus,
          phone: "",
          email: "",
          feeCategory: "Tuition Fee",
          totalFee,
          amountPaid: p.amount,
          balanceDue: Math.max(0, totalFee - p.amount),
          status: p.status === "COMPLETED" ? "COMPLETED" : "PENDING",
          transactionId: p.transactionId,
          paymentMethod: "Online UPI / NetBanking",
          paidAt: p.createdAt,
          rawPayment: p,
        });
      }
    });

    return list;
  }, [applicants, payments, loggedInCampus]);

  // Overall Headcount Metrics (HOW MANY STUDENTS HAVE PAID THEIR FEES)
  const totalStudentsCount = allStudentFeeRecords.length;
  const paidStudentsCount = allStudentFeeRecords.filter((s) => s.status === "COMPLETED").length;
  const pendingStudentsCount = allStudentFeeRecords.filter((s) => s.status === "PENDING").length;
  const partialStudentsCount = allStudentFeeRecords.filter((s) => s.status === "PARTIAL").length;
  const paidPercentage = totalStudentsCount > 0 ? Math.round((paidStudentsCount / totalStudentsCount) * 100) : 0;
  const totalAmountCollected = allStudentFeeRecords.reduce((sum, s) => sum + s.amountPaid, 0);

  // Filtered Student Fee List
  const filteredStudents = useMemo(() => {
    return allStudentFeeRecords.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        s.studentName.toLowerCase().includes(q) ||
        s.applicationNo.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.transactionId && s.transactionId.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || s.feeCategory === categoryFilter;
      const matchesCampus = campusFilter === "ALL" || s.campus === campusFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesCampus;
    });
  }, [allStudentFeeRecords, search, statusFilter, categoryFilter, campusFilter]);

  // Record Student Fee in Firebase
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
        status: newPayment.status === "PENDING" ? "PENDING" : "COMPLETED",
        transactionId: newPayment.transactionId.trim() || `VSB_TXN_${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
      };

      const ok = await savePaymentToFirebase(payload);
      if (ok) {
        setPayments((prev) => [payload, ...prev]);
        onTriggerToast(`🎉 Student fee payment ₹${payload.amount.toLocaleString("en-IN")} recorded for ${payload.studentName}!`);
        setIsRecordModalOpen(false);
        setNewPayment({
          studentName: "",
          course: "B.E. Computer Science and Engineering",
          campus: loggedInCampus,
          amount: 85000,
          feeCategory: "Tuition Fee",
          status: "COMPLETED",
          paymentMethod: "Online UPI / NetBanking",
          transactionId: `VSB_TXN_${Date.now().toString().slice(-6)}`,
        });
      } else {
        onTriggerToast("❌ Failed to save student fee payment to Firebase.");
      }
    } catch (err) {
      onTriggerToast("❌ Error recording student fee payment.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open modal pre-filled for a specific student
  const handleOpenRecordForStudent = (s: StudentFeeItem) => {
    setNewPayment({
      studentName: s.studentName,
      course: s.course,
      campus: (s.campus === "COIMBATORE" ? "COIMBATORE" : "KARUR") as "KARUR" | "COIMBATORE",
      amount: s.balanceDue > 0 ? s.balanceDue : s.totalFee,
      feeCategory: s.feeCategory,
      status: "COMPLETED",
      paymentMethod: "Online UPI / NetBanking",
      transactionId: `VSB_TXN_${Date.now().toString().slice(-6)}`,
    });
    setIsRecordModalOpen(true);
  };

  // Official Fee Receipt Printable PDF Generator
  const handlePrintReceipt = (s: StudentFeeItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      onTriggerToast("⚠️ Popup blocked! Please allow popups to print fee receipt.");
      return;
    }

    const collegeTitle =
      s.campus === "COIMBATORE"
        ? "V.S.B. COLLEGE OF ENGINEERING TECHNICAL CAMPUS (COIMBATORE)"
        : "V.S.B. ENGINEERING COLLEGE (KARUR)";
    const address =
      s.campus === "COIMBATORE"
        ? "Pollachi Main Road, EAL, Coimbatore, Tamil Nadu 642109"
        : "NH-67, Kovai Road, Karur, Tamil Nadu 639111";

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>VSB_Official_Student_Fee_Receipt_${s.transactionId || s.applicationNo}.pdf</title>
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
            <div class="receipt-title">Official Student College Fee E-Receipt</div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Receipt Number:</span>
              <span class="meta-val">VSB-REC-${s.id.slice(-6).toUpperCase()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date & Time:</span>
              <span class="meta-val">${s.paidAt ? new Date(s.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-IN")}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Application / Roll No:</span>
              <span class="meta-val">${s.applicationNo}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Campus Branch:</span>
              <span class="meta-val">${s.campus} CAMPUS</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Student Name:</span>
              <span class="meta-val">${s.studentName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Fee Payment Status:</span>
              <span class="meta-val" style="color:#059669;">✔ ${s.status === "COMPLETED" ? "FEES FULLY PAID" : s.status}</span>
            </div>
          </div>

          <table class="table-box">
            <thead>
              <tr>
                <th>Fee Description / Account Head</th>
                <th>Academic Year</th>
                <th style="text-align: right;">Amount Paid (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${s.feeCategory}</strong><br/>
                  <span style="color:#64748b; font-size:11px;">Degree & Branch: ${s.course}</span>
                </td>
                <td>2026 - 2027</td>
                <td style="text-align: right; font-weight:800;">₹${s.amountPaid.toLocaleString("en-IN")}.00</td>
              </tr>
              <tr class="amount-row">
                <td colspan="2" style="text-align: right;">TOTAL STUDENT FEE RECEIVED:</td>
                <td style="text-align: right;">₹${s.amountPaid.toLocaleString("en-IN")}.00</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; color: #475569; margin-top: 15px; border-left: 3px solid #1e3a8a; padding-left: 10px;">
            <p style="margin: 0;">• Official bank receipt generated electronically via V.S.B. Central Admission Portal.</p>
            <p style="margin: 3px 0 0 0;">• Subject to Anna University / DOTE seat approval verification.</p>
          </div>

          <div class="stamp-box">
            <div>
              <div class="stamp">VERIFIED & CONFIRMED</div>
              <p style="font-size: 10px; color: #64748b; margin-top: 5px;">VSB Central Treasury</p>
            </div>
            <div class="signature">
              <div style="border-bottom: 1px solid #94a3b8; width: 140px; margin-bottom: 5px;"></div>
              Authorized Cashier / Bursar Desk
            </div>
          </div>

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="background:#1e3a8a; color:#fff; padding:10px 24px; border:none; border-radius:8px; font-weight:700; cursor:pointer;">
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  // WhatsApp Fee Receipt / Reminder
  const handleWhatsAppAction = (s: StudentFeeItem) => {
    if (!s.phone) {
      onTriggerToast("⚠️ No mobile number available for this student.");
      return;
    }

    let text = "";
    if (s.status === "COMPLETED") {
      text = `Dear ${s.studentName}, your college fee payment of ₹${s.amountPaid.toLocaleString("en-IN")} for ${s.course} at V.S.B. Engineering College has been verified and confirmed. Receipt No: ${s.transactionId || s.applicationNo}. Thank you!`;
    } else {
      text = `Dear ${s.studentName}, your college admission fee payment for ${s.course} at V.S.B. Engineering College is currently pending (Balance Due: ₹${s.balanceDue.toLocaleString("en-IN")}). Please complete your fee payment to secure your seat. Helpline: +91 98424 11223.`;
    }

    const url = getWhatsAppUrl(s.phone, text);
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* Top Banner: Student Fee Payments Console */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Student Fee Console
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              V.S.B. {loggedInCampus} Campus Intake
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Student Fee Payments & Receipts</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time tracking of <strong>how many students have paid their college fees</strong>, pending fee clearances, verified bank tuition deposits, and official V.S.B. printable receipts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadPayments}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh latest fee receipts from Firebase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
            <span>{isLoading ? "Syncing..." : "Sync Fees"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Student Fee</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4 PROMINENT HEADCOUNT METRICS: HOW MANY STUDENTS PAID FEES     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Students Paid Fees (Full Clearance) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-slate-900 shadow-xs space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                STUDENTS PAID FEES
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {paidStudentsCount} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/ {totalStudentsCount} Students</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-emerald-100 dark:bg-emerald-950/60 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${paidPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{paidPercentage}% Cleared</span>
              <span>100% Fee Paid & Seat Confirmed</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Students Fee Pending */}
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/60 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-xs space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                FEE PENDING STUDENTS
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {pendingStudentsCount} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Students</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-amber-100 dark:bg-amber-950/60 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${totalStudentsCount > 0 ? (pendingStudentsCount / totalStudentsCount) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              <span className="text-amber-600 dark:text-amber-400 font-bold">Awaiting Payment</span>
              <span>Follow-up Due</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Partial / Allotment Token Paid */}
        <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 to-white dark:from-indigo-950/20 dark:to-slate-900 shadow-xs space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                PARTIAL / TOKEN PAID
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {partialStudentsCount} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Students</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            Seat Allotment Deposit Paid (Balance Due)
          </p>
        </div>

        {/* Metric 4: Total Admitted Intake */}
        <div className="p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-900/60 bg-gradient-to-br from-sky-50/60 to-white dark:from-sky-950/20 dark:to-slate-900 shadow-xs space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                TOTAL REGISTERED INTAKE
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {totalStudentsCount} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Students</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <User className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
            ₹{totalAmountCollected.toLocaleString("en-IN")} Total Student Fees Collected
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* STUDENT FEE DIRECTORY & RECEIPT TABLE                          */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 sm:p-6 space-y-4">
        {/* Filter Navigation Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          {/* Quick Headcount Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              All Students ({totalStudentsCount})
            </button>

            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "COMPLETED"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Fees Paid ({paidStudentsCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "PENDING"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Fee Pending ({pendingStudentsCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter("PARTIAL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === "PARTIAL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Partial Paid ({partialStudentsCount})</span>
            </button>
          </div>

          {/* Search & Secondary Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Box */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, app no, phone..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Campus Selector */}
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Campuses</option>
              <option value="KARUR">Karur Campus</option>
              <option value="COIMBATORE">Coimbatore Campus</option>
            </select>

            {/* Category Selector */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Fee Types</option>
              <option value="Tuition Fee">Tuition Fee</option>
              <option value="Seat Allotment Deposit">Allotment Deposit</option>
              <option value="Hostel & Mess Fee">Hostel & Mess</option>
              <option value="Transport Fee">Transport Fee</option>
            </select>
          </div>
        </div>

        {/* Student Fee Records Table */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-xs font-semibold">Loading student fee records from Firebase...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No student fee records found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">Student Details</th>
                  <th className="py-3 px-3">Course / Branch</th>
                  <th className="py-3 px-3">Campus</th>
                  <th className="py-3 px-3">Fee Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Fee Paid</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Receipt & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-medium">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Student Name & Roll No */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-200 dark:border-emerald-800">
                          {s.studentName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">
                            {s.studentName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {s.applicationNo} {s.phone ? `• ${s.phone}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3 px-3 max-w-[200px] truncate" title={s.course}>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                        {s.course}
                      </span>
                    </td>

                    {/* Campus */}
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          s.campus === "COIMBATORE"
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800"
                        }`}
                      >
                        {s.campus}
                      </span>
                    </td>

                    {/* Fee Category */}
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {s.feeCategory}
                      </span>
                    </td>

                    {/* Fee Status Badge */}
                    <td className="py-3 px-3">
                      {s.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Fees Paid</span>
                        </span>
                      ) : s.status === "PARTIAL" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                          <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Partial Paid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Fee Pending</span>
                        </span>
                      )}
                    </td>

                    {/* Amount Paid */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      ₹{s.amountPaid.toLocaleString("en-IN")}.00
                    </td>

                    {/* Balance Due */}
                    <td className="py-3 px-3 text-right font-mono text-xs">
                      {s.balanceDue > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          ₹{s.balanceDue.toLocaleString("en-IN")}.00
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">₹0.00</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Print Receipt Button */}
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(s)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          title="Print Official V.S.B. PDF Fee Receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        </button>

                        {/* Record / Collect Payment Button */}
                        {s.status !== "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() => handleOpenRecordForStudent(s)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            title="Collect / Record Fee Payment for this student"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Collect Fee</span>
                          </button>
                        )}

                        {/* WhatsApp Receipt or Reminder */}
                        {s.phone && (
                          <button
                            type="button"
                            onClick={() => handleWhatsAppAction(s)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                            title={s.status === "COMPLETED" ? "Send WhatsApp Fee Receipt" : "Send Fee Payment Reminder"}
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* RECORD NEW STUDENT FEE MODAL                                   */}
      {/* ============================================================== */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsRecordModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Record Student Fee Payment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Record student college tuition, admission, or hostel fees directly into Firebase.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPayment.studentName}
                  onChange={(e) => setNewPayment({ ...newPayment, studentName: e.target.value })}
                  placeholder="e.g. S. Vignesh"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Course / Branch
                  </label>
                  <select
                    value={newPayment.course}
                    onChange={(e) => setNewPayment({ ...newPayment, course: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="B.E. Computer Science and Engineering">B.E. Computer Science</option>
                    <option value="B.Tech Artificial Intelligence and Data Science">B.Tech AI & Data Science</option>
                    <option value="B.Tech Information Technology">B.Tech Information Technology</option>
                    <option value="B.E. Electronics and Communication">B.E. Electronics & Communication</option>
                    <option value="B.E. Mechanical Engineering">B.E. Mechanical Engineering</option>
                    <option value="B.E. Electrical and Electronics">B.E. Electrical & Electronics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Campus Branch
                  </label>
                  <select
                    value={newPayment.campus}
                    onChange={(e) => setNewPayment({ ...newPayment, campus: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="KARUR">Karur Campus</option>
                    <option value="COIMBATORE">Coimbatore Campus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Fee Category
                  </label>
                  <select
                    value={newPayment.feeCategory}
                    onChange={(e) => setNewPayment({ ...newPayment, feeCategory: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Tuition Fee">Tuition Fee (₹85,000)</option>
                    <option value="Seat Allotment Deposit">Seat Allotment Token (₹25,000)</option>
                    <option value="Hostel & Mess Fee">Hostel & Mess Fee (₹40,000)</option>
                    <option value="Transport Fee">Transport / Bus Fee (₹15,000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Payment Method
                  </label>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Online UPI / NetBanking">Online UPI / GPay / PhonePe</option>
                    <option value="Net Banking / NEFT / RTGS">Net Banking / NEFT / RTGS</option>
                    <option value="Demand Draft (DD)">Demand Draft (DD)</option>
                    <option value="Cash Deposit">Cash Deposit (Bursar Office)</option>
                    <option value="Debit / Credit Card">Debit / Credit Card (POS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Transaction / Receipt ID
                  </label>
                  <input
                    type="text"
                    value={newPayment.transactionId}
                    onChange={(e) => setNewPayment({ ...newPayment, transactionId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Firebase...</span>
                    </>
                  ) : (
                    <span>Save Fee Receipt</span>
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
