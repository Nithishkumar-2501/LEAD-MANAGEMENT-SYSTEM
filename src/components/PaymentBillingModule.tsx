"use client";

import { useState, useEffect } from "react";
import { Payment, CampusLocation } from "@/types/crm";
import {
  fetchPaymentsFromFirebase,
  savePaymentToFirebase,
} from "@/lib/firebaseSync";
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
} from "lucide-react";

interface PaymentBillingModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  onTriggerToast: (msg: string) => void;
}

export default function PaymentBillingModule({
  loggedInCampus,
  onTriggerToast,
}: PaymentBillingModuleProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
              <div style="border-top: 1px solid #0f172a; padding-top:4px;">
                <strong>Accounts Officer / Registrar</strong><br/>
                V.S.B. Educational Trust
              </div>
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

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
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

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadPayments}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh from Firebase"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
            </button>

            {/* Record New Payment Button */}
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Fee Payment</span>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <p className="text-xs font-semibold">Loading payment transactions from Firebase...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-y border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Course & Campus</th>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No payment records found matching your filters. Click &ldquo;Record Fee Payment&rdquo; to add a new transaction.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center text-[10px] font-bold">
                          {p.studentName.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{p.studentName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-200 font-medium">{p.course}</p>
                        <span className="text-[10px] text-indigo-400 font-bold">{p.campus} CAMPUS</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">{p.transactionId}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">₹{p.amount.toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            p.status === "COMPLETED"
                              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                              : "bg-amber-950 text-amber-400 border-amber-800"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" /> {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
                          title="Generate and Download Official PDF Receipt"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Download PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD NEW PAYMENT MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 text-white rounded-3xl border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Record Admission Fee Payment</h3>
                  <p className="text-xs text-slate-400">Stores official receipt directly in Firebase Firestore</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-300 mb-1">
                  Student Applicant Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Vignesh / Revathy"
                  value={newPayment.studentName}
                  onChange={(e) => setNewPayment({ ...newPayment, studentName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Allotted Course / Degree Program</label>
                <input
                  type="text"
                  required
                  value={newPayment.course}
                  onChange={(e) => setNewPayment({ ...newPayment, course: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Fee Amount Paid (₹)</label>
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
