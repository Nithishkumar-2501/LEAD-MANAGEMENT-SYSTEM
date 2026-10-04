"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Download,
  X,
  Search,
  Database,
  Users,
  CreditCard,
  Building,
  Smartphone,
  Layers,
} from "lucide-react";
import { Lead, Application } from "@/types/crm";
import {
  MAX_FREE_LEAD_LIMIT,
  PRICE_PER_EXTRA_LEAD,
  evaluateLeadQuota,
  QuotaEvaluation,
} from "@/lib/leadQuotaService";
import { downloadSampleLeadsCSV } from "@/lib/csvParser";

interface CsvLeadsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (leads: (Lead & { application: Application })[]) => Promise<void> | void;
  fileName: string;
  importedLeads: (Lead & { application: Application })[];
  currentTotalLeads: number;
  isProcessing?: boolean;
}

export default function CsvLeadsImportModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  importedLeads,
  currentTotalLeads,
  isProcessing = false,
}: CsvLeadsImportModalProps) {
  const [searchFilter, setSearchFilter] = useState("");

  const fileLeadCount = importedLeads.length;
  const newTotalLeads = currentTotalLeads + fileLeadCount;
  const remainingFreeQuota = Math.max(0, MAX_FREE_LEAD_LIMIT - newTotalLeads);

  const quotaEvaluation: QuotaEvaluation = useMemo(() => {
    return evaluateLeadQuota(currentTotalLeads, fileLeadCount);
  }, [currentTotalLeads, fileLeadCount]);

  const currentPercent = Math.min(100, (currentTotalLeads / MAX_FREE_LEAD_LIMIT) * 100);
  const newPercent = Math.min(100, (newTotalLeads / MAX_FREE_LEAD_LIMIT) * 100);

  const filteredPreview = useMemo(() => {
    if (!searchFilter.trim()) return importedLeads.slice(0, 15);
    const q = searchFilter.toLowerCase();
    return importedLeads
      .filter(
        (lead) =>
          lead.name.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          (lead.courseInterest && lead.courseInterest.toLowerCase().includes(q)) ||
          (lead.district && lead.district.toLowerCase().includes(q)) ||
          (lead.school && lead.school.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [importedLeads, searchFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-5 sm:p-7 space-y-5 text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 shrink-0">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                CSV Lead Importer
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                1,00,000 Quota System
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Import Student Leads from .CSV File</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              File: <strong className="text-slate-700 dark:text-slate-200">{fileName}</strong> —{" "}
              Found <span className="font-extrabold text-blue-600 dark:text-sky-400">{fileLeadCount}</span> student leads to count into overall 1,00,000 capacity.
            </p>
          </div>
        </div>

        {/* Overall Leads Count Impact Grid (Current -> Added from File -> New Database Total) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-500" />
              Overall 1,00,000 Database Lead Count Calculation
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              Capacity Cap: {MAX_FREE_LEAD_LIMIT.toLocaleString("en-IN")} Leads
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tile 1: Current Database Count */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Current Leads in DB
              </span>
              <p className="font-mono text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
                {currentTotalLeads.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-slate-400">
                {((currentTotalLeads / MAX_FREE_LEAD_LIMIT) * 100).toFixed(1)}% of 1,00,000 used
              </p>
            </div>

            {/* Tile 2: Leads Found in this CSV File */}
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center justify-between">
                <span>Leads in CSV File</span>
                <span className="px-1.5 py-0.2 rounded bg-sky-200 dark:bg-sky-900 text-[10px] font-extrabold text-sky-800 dark:text-sky-200">
                  COUNTED
                </span>
              </span>
              <p className="font-mono text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">
                +{fileLeadCount.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-sky-700 dark:text-sky-300">
                Parsed from {fileName}
              </p>
            </div>

            {/* Tile 3: New Overall Count */}
            <div className={`p-3.5 rounded-xl border shadow-xs space-y-1 ${
              quotaEvaluation.requiresOverageAuthorization
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80"
            }`}>
              <span className={`text-[11px] font-bold flex items-center justify-between ${
                quotaEvaluation.requiresOverageAuthorization
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-emerald-700 dark:text-emerald-300"
              }`}>
                <span>New Overall Total</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <p className={`font-mono text-xl sm:text-2xl font-black ${
                quotaEvaluation.requiresOverageAuthorization
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {newTotalLeads.toLocaleString("en-IN")}
              </p>
              <p className={`text-[10px] font-medium ${
                quotaEvaluation.requiresOverageAuthorization
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-emerald-700 dark:text-emerald-300"
              }`}>
                out of 1,00,000 ({remainingFreeQuota.toLocaleString("en-IN")} remaining)
              </p>
            </div>
          </div>

          {/* Visual Progress Bar (From Current % to New %) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Overall Database Lead Capacity Fill</span>
              <span className="font-mono font-bold">
                {newPercent.toFixed(1)}% ({newTotalLeads.toLocaleString("en-IN")} / {MAX_FREE_LEAD_LIMIT.toLocaleString("en-IN")})
              </span>
            </div>
            <div className="relative w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              {/* Existing progress */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full transition-all duration-300 z-10"
                style={{ width: `${Math.min(100, currentPercent)}%` }}
              />
              {/* Added progress extension */}
              <div
                className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-300 ${
                  quotaEvaluation.requiresOverageAuthorization
                    ? "bg-gradient-to-r from-amber-500 to-rose-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, newPercent)}%` }}
              />
            </div>
          </div>

          {/* Quota Status & Overage Policy Breakdown */}
          {quotaEvaluation.requiresOverageAuthorization ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-bold text-sm text-amber-900 dark:text-amber-100">
                    ⚠️ 1,00,000 Free Lead Limit Reached by this CSV Import
                  </p>
                  <p className="leading-relaxed">
                    This file contains <strong>{fileLeadCount}</strong> leads.{" "}
                    {quotaEvaluation.freeLeadsAllowedInBatch > 0 ? (
                      <>
                        <strong>{quotaEvaluation.freeLeadsAllowedInBatch}</strong> leads fit into the remaining free quota.{" "}
                      </>
                    ) : null}
                    <strong>{quotaEvaluation.overageLeadsCount}</strong> lead(s) exceed the 1,00,000 threshold and incur the mandatory surcharge:
                  </p>
                  <div className="p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 font-mono text-xs flex flex-wrap items-center justify-between gap-2 border border-amber-300/50">
                    <span>
                      {quotaEvaluation.overageLeadsCount} extra lead(s) × ₹{PRICE_PER_EXTRA_LEAD} / lead
                    </span>
                    <span className="font-black text-amber-900 dark:text-amber-100 text-sm">
                      Total Surcharge: ₹{quotaEvaluation.overageTotalCost.toLocaleString("en-IN")} INR
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 italic">
                    ℹ️ This surcharge will be automatically logged to the institutional Annual Payment Renewal (Web CRM + Native Mobile App).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                ✅ All <strong>{fileLeadCount}</strong> leads from this file fit within your <strong>1,00,000 free quota tier</strong>.{" "}
                <strong>{remainingFreeQuota.toLocaleString("en-IN")}</strong> free leads will remain available after import.
              </span>
            </div>
          )}
        </div>

        {/* Data Preview Table */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-500" />
              Preview Leads Extracted from File (Showing up to {filteredPreview.length} of {fileLeadCount}):
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search leads in file..."
                className="pl-8 pr-3 py-1 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-sky-500 w-full sm:w-56"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Candidate Name</th>
                  <th className="px-3 py-2">Mobile Number</th>
                  <th className="px-3 py-2">Course Interest</th>
                  <th className="px-3 py-2">Campus</th>
                  <th className="px-3 py-2">Cutoff</th>
                  <th className="px-3 py-2">District / School</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPreview.map((lead, idx) => (
                  <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-1.5 font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                      {lead.name}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-slate-600 dark:text-slate-300">
                      {lead.phone}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                      {lead.courseInterest || "B.E. Engineering"}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        lead.campus === "COIMBATORE"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}>
                        {lead.campus}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {lead.tneaCutoff ? lead.tneaCutoff : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-slate-500 truncate max-w-[120px]">
                      {lead.district || lead.school || "Tamil Nadu"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => downloadSampleLeadsCSV()}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample CSV Template</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(importedLeads)}
              disabled={isProcessing || fileLeadCount === 0}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>
                {isProcessing
                  ? "Saving to Database..."
                  : `Confirm & Add ${fileLeadCount} Leads (${newTotalLeads.toLocaleString("en-IN")} / 1,00,000)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
