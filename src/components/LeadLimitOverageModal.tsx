"use client";

import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Receipt,
  CheckCircle,
  X,
  CreditCard,
  Building,
  Smartphone,
  Globe,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  QuotaEvaluation,
  PRICE_PER_EXTRA_LEAD,
  BASE_ANNUAL_RENEWAL_FEE,
} from "@/lib/leadQuotaService";

interface LeadLimitOverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  quotaEvaluation: QuotaEvaluation | null;
  candidateName?: string;
  incomingBatchCount?: number;
  isProcessing?: boolean;
}

export default function LeadLimitOverageModal({
  isOpen,
  onClose,
  onConfirm,
  quotaEvaluation,
  candidateName = "Candidate",
  incomingBatchCount = 1,
  isProcessing = false,
}: LeadLimitOverageModalProps) {
  if (!isOpen || !quotaEvaluation) return null;

  const overageCount = quotaEvaluation.overageLeadsCount || incomingBatchCount;
  const surchargeTotal = overageCount * PRICE_PER_EXTRA_LEAD;
  const currentTotalRenewal = quotaEvaluation.annualBilling.totalRenewalFee || BASE_ANNUAL_RENEWAL_FEE;
  const projectedTotalRenewal = currentTotalRenewal + surchargeTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-amber-400/40 dark:border-amber-500/40 shadow-2xl p-5 sm:p-6 space-y-4 text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close / Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Warning Shield */}
        <div className="flex items-start gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950">
                Quota Reached
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                1,00,000 Leads Cap
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
              Lead Limit Exceeded (1,00,000 Leads)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              The institutional quota of 1,00,000 free student leads has been exhausted.
            </p>
          </div>
        </div>

        {/* Quota Progress Bar Indicator */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Current Lead Capacity
            </span>
            <span className="text-amber-900 dark:text-amber-200 font-mono font-black">
              {quotaEvaluation.currentTotalLeads.toLocaleString("en-IN")} / {quotaEvaluation.maxLimit.toLocaleString("en-IN")} (100%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 w-full rounded-full transition-all duration-300" />
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
            Admin cannot add any new leads for free once the <strong>1,00,000 limit</strong> is reached. Extra leads require an approved overage surcharge.
          </p>
        </div>

        {/* Surcharge Policy & Cost Breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overage Pricing Schedule
            </div>
            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              ₹500 / extra lead
            </div>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-200 dark:divide-slate-800">
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600 dark:text-slate-400">
                Candidate / Batch:
              </span>
              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                {candidateName} {incomingBatchCount > 1 ? `(${incomingBatchCount} leads)` : ""}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600 dark:text-slate-400">
                Number of extra leads:
              </span>
              <span className="font-black text-amber-600 dark:text-amber-400 font-mono">
                +{overageCount} Lead{overageCount > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600 dark:text-slate-400">
                Surcharge Rate:
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {overageCount} × ₹500
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 text-sm font-black text-rose-600 dark:text-rose-400">
              <span>Surcharge Amount Payable:</span>
              <span className="font-mono text-base">₹{surchargeTotal.toLocaleString("en-IN")}.00</span>
            </div>
          </div>
        </div>

        {/* Annual Payment Renewal Application Notice */}
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
            <Receipt className="w-4 h-4 text-indigo-500" />
            <span>Billing Method: Added to Annual Renewal</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
            This <strong>₹{surchargeTotal.toLocaleString("en-IN")}</strong> fee will not be charged right now. It is automatically accumulated into the <strong>Annual Payment Renewal of the application</strong> covering both the <strong>Web Platform & Mobile App</strong>.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-center text-xs">
            <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-800">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                Current Renewal
              </div>
              <div className="font-mono font-black text-slate-800 dark:text-slate-200">
                ₹{currentTotalRenewal.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700">
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">
                Updated Renewal Total
              </div>
              <div className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                ₹{projectedTotalRenewal.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-sky-500" /> Web CRM</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Smartphone className="w-3 h-3 text-emerald-500" /> Android & iOS Mobile</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel / Do Not Add
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {isProcessing
                ? "Authorizing..."
                : `Authorize & Add to Annual Renewal (+₹${surchargeTotal.toLocaleString("en-IN")})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
