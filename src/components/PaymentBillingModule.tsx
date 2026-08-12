"use client";

import { useState } from "react";
import { Payment, CampusLocation } from "@/types/crm";
import { MOCK_PAYMENTS } from "@/lib/mockData";
import { CreditCard, DollarSign, Download, Search, CheckCircle2, ShieldCheck, ArrowUpRight } from "lucide-react";

interface PaymentBillingModuleProps {
  onTriggerToast: (msg: string) => void;
}

export default function PaymentBillingModule({ onTriggerToast }: PaymentBillingModuleProps) {
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState<CampusLocation>("ALL");

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      p.course.toLowerCase().includes(search.toLowerCase());

    const matchesCampus = campusFilter === "ALL" || p.campus === campusFilter;

    return matchesSearch && matchesCampus;
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Fee Collected</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">₹{totalCollected.toLocaleString("en-IN")}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-400 font-medium mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Bank Cleared Receipts
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Karur Collections</p>
              <h3 className="text-2xl font-bold text-indigo-300 mt-1">₹85,000</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-indigo-400 font-medium mt-3">VSB Karur Treasury</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Coimbatore Collections</p>
              <h3 className="text-2xl font-bold text-purple-300 mt-1">₹95,000</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-purple-400 font-medium mt-3">VSB Coimbatore Treasury</p>
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Admission Fee Receipts & Transactions</h3>
            <p className="text-xs text-slate-400">Verified tuition and allotment fee payments for V.S.B. Colleges</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transaction ID, student..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value as CampusLocation)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Campuses</option>
              <option value="KARUR">Karur Campus</option>
              <option value="COIMBATORE">Coimbatore Campus</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-y border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Course & Campus</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{p.studentName}</td>
                  <td className="py-3.5 px-4">
                    <p className="text-slate-200 font-medium">{p.course}</p>
                    <span className="text-[10px] text-indigo-400 font-bold">{p.campus} CAMPUS</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{p.transactionId}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">₹{p.amount.toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onTriggerToast(`Downloading Official VSB Fee Receipt for ${p.studentName}...`)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-semibold text-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
