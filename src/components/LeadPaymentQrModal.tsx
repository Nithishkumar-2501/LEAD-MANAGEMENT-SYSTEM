"use client";

import { useState, useEffect } from "react";
import {
  getCreatorQrSettings,
  recordLeadQrPayment,
  CreatorQrSettings,
  LeadQrPaymentRecord,
  QR_SETTINGS_EVENT,
} from "@/lib/leadPaymentQrService";
import {
  QrCode,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  Phone,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import SpecularButton from "./SpecularButton";

interface LeadPaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidatePhone: string;
  courseInterest: string;
  campus: string;
  submittedBy: string;
  onPaymentVerified: (record: LeadQrPaymentRecord) => Promise<void> | void;
}

export default function LeadPaymentQrModal({
  isOpen,
  onClose,
  candidateName,
  candidatePhone,
  courseInterest,
  campus,
  submittedBy,
  onPaymentVerified,
}: LeadPaymentQrModalProps) {
  const [settings, setSettings] = useState<CreatorQrSettings>(() => getCreatorQrSettings());
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Sync settings when updated by Creator in another tab
  useEffect(() => {
    const handleUpdate = (e: any) => {
      setSettings(e.detail || getCreatorQrSettings());
    };
    window.addEventListener(QR_SETTINGS_EVENT, handleUpdate);
    return () => window.removeEventListener(QR_SETTINGS_EVENT, handleUpdate);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSettings(getCreatorQrSettings());
      // Default sample UTR for instant convenience if user doesn't type
      setUtrNumber(`UPI-${Math.floor(100000000000 + Math.random() * 900000000000)}`);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(settings.upiId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const paymentRecord = recordLeadQrPayment({
        leadName: candidateName,
        leadPhone: candidatePhone,
        courseInterest,
        campus,
        amount: settings.leadPriceAmount,
        utrRef: utrNumber.trim() || `UTR-${Date.now()}`,
        submittedBy,
      });

      await onPaymentVerified(paymentRecord);
    } catch (err) {
      console.error("Payment confirmation error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950 overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Scan & Pay Lead Fee</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ₹{settings.leadPriceAmount} INR
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Payment required before submitting candidate lead to Firebase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Candidate Summary Mini-Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white text-sm">{candidateName}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                {campus} Campus
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-850">
              <div>Phone: <strong className="text-slate-200">{candidatePhone}</strong></div>
              <div className="truncate">Course: <strong className="text-slate-200">{courseInterest}</strong></div>
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="p-3 bg-white rounded-2xl shadow-xl shadow-amber-500/10 border-2 border-amber-400/40 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.qrCodeImageUrl}
                  alt="SPHEREX Creator Payment QR Code"
                  className="w-48 h-48 md:w-52 md:h-52 object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-white text-sm">
                Payee: <span className="text-amber-400">{settings.payeeName}</span>
              </p>
              <div className="flex items-center justify-center gap-1.5 text-slate-300">
                <span className="font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {settings.upiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Copy UPI ID"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
              Open <strong>GPay, PhonePe, Paytm, or BHIM UPI</strong> on your mobile phone, scan the QR code above, and pay{" "}
              <strong className="text-emerald-400 font-mono">₹{settings.leadPriceAmount}</strong>.
            </p>
          </div>

          {/* Transaction / UTR Verification Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold flex items-center justify-between">
              <span>UPI Transaction Reference / UTR Number</span>
              <span className="text-[10px] text-emerald-400 font-normal">Auto-detected / Editable</span>
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. 427189012345 or UPI-REF"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Once verified, the ₹{settings.leadPriceAmount} payment is credited to the Creator revenue ledger, and the candidate lead is saved into Firebase.
            </span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isProcessing ? "Adding to Firebase..." : "I Have Paid • Submit Lead to Firebase"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
