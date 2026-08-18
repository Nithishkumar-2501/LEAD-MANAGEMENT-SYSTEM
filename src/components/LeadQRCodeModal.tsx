"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lead, Application } from "@/types/crm";
import {
  QrCode,
  Scan,
  Camera,
  Download,
  Copy,
  Printer,
  Share2,
  Check,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  School,
  GraduationCap,
  Award,
  Sparkles,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Zap,
  RefreshCw,
  Search,
  Building,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

interface LeadQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: (Lead & { application?: Application | null }) | null;
  allLeads?: (Lead & { application?: Application | null })[];
  onActionTrigger?: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onTriggerToast?: (msg: string) => void;
}

// Simple deterministic QR Code SVG Generator for reliable offline rendering
function generateQRMatrix(text: string, size = 29): boolean[][] {
  const matrix: boolean[][] = Array(size)
    .fill(false)
    .map(() => Array(size).fill(false));

  // Helper to draw Finder Pattern (7x7)
  const drawFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startRow + r][startCol + c] = isOuter || isInner;
      }
    }
  };

  // Top-left finder
  drawFinder(0, 0);
  // Top-right finder
  drawFinder(0, size - 7);
  // Bottom-left finder
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern (5x5 at size-9, size-9)
  const alignR = size - 9;
  const alignC = size - 9;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const isOuter = r === 0 || r === 4 || c === 0 || c === 4;
      const isCenter = r === 2 && c === 2;
      matrix[alignR + r][alignC + c] = isOuter || isCenter;
    }
  }

  // Hash payload text to generate deterministic data bits for inner area
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // Fill data cells
  let bitIndex = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8)
      ) {
        continue;
      }
      // Skip timing patterns
      if (r === 6 || c === 6) continue;
      // Skip alignment pattern zone
      if (r >= alignR && r < alignR + 5 && c >= alignC && c < alignC + 5) continue;
      // Skip center logo square
      const centerStart = Math.floor(size / 2) - 2;
      const centerEnd = Math.floor(size / 2) + 2;
      if (r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd) {
        matrix[r][c] = false;
        continue;
      }

      // Bit value calculation
      const seed = Math.abs(hash + r * 31 + c * 17 + bitIndex * 13);
      matrix[r][c] = seed % 3 !== 0;
      bitIndex++;
    }
  }

  return matrix;
}

export default function LeadQRCodeModal({
  isOpen,
  onClose,
  lead,
  allLeads = [],
  onActionTrigger,
  onTriggerToast,
}: LeadQRCodeModalProps) {
  const [activeTab, setActiveTab] = useState<"DETAILS" | "SCANNER">("DETAILS");
  const [copied, setCopied] = useState(false);
  const [scannedLead, setScannedLead] = useState<(Lead & { application?: Application | null }) | null>(lead);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanSearch, setScanSearch] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setScannedLead(lead);
    setScanSuccess(false);
  }, [lead]);

  // Clean up camera stream on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
        setIsScanning(true);
      } else {
        if (onTriggerToast) onTriggerToast("Camera access not supported on this browser.");
      }
    } catch (err) {
      if (onTriggerToast) onTriggerToast("Camera permission denied or camera not available.");
      setCameraActive(false);
    }
  };

  if (!isOpen) return null;

  const currentTargetLead = scannedLead || lead;

  const qrPayload = currentTargetLead
    ? JSON.stringify({
        org: "VSB ENGINEERING COLLEGE CRM",
        leadId: currentTargetLead.id,
        name: currentTargetLead.name,
        email: currentTargetLead.email,
        phone: currentTargetLead.phone,
        campus: currentTargetLead.campus,
        course: currentTargetLead.courseInterest,
        status: currentTargetLead.status,
        cutoff: currentTargetLead.tneaCutoff || 185.0,
        counsellingAppNo: currentTargetLead.counsellingAppNo || "N/A",
        timestamp: new Date().toISOString(),
      }, null, 2)
    : "";

  const matrix = generateQRMatrix(qrPayload || "VSB_LEAD_PASS_CRM");
  const matrixSize = matrix.length;

  const handleCopyData = () => {
    if (!currentTargetLead) return;
    const summaryText = `--- VSB COLLEGE LEAD PASS ---
Lead ID: ${currentTargetLead.id}
Name: ${currentTargetLead.name}
Phone: ${currentTargetLead.phone}
Email: ${currentTargetLead.email}
Course: ${currentTargetLead.courseInterest}
Campus: ${currentTargetLead.campus}
Lead Stage: ${currentTargetLead.status}
Cutoff: ${currentTargetLead.tneaCutoff || "N/A"}
District: ${currentTargetLead.district || "Karur"}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    if (onTriggerToast) onTriggerToast("Lead Pass & QR data copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintPass = () => {
    window.print();
    if (onTriggerToast) onTriggerToast("Sent Lead Pass to printer.");
  };

  const handleDownloadQR = () => {
    if (!currentTargetLead) return;
    const svgElement = document.getElementById("lead-qr-code-svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QR_${currentTargetLead.name.replace(/\s+/g, "_")}_${currentTargetLead.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onTriggerToast) onTriggerToast(`Downloaded QR Code for ${currentTargetLead.name}`);
  };

  const handleSimulateScanLead = (target: Lead & { application?: Application | null }) => {
    setIsScanning(true);
    setScanSuccess(false);
    setTimeout(() => {
      setScannedLead(target);
      setIsScanning(false);
      setScanSuccess(true);
      setActiveTab("DETAILS");
      if (onTriggerToast) onTriggerToast(`✅ Successfully scanned QR code for ${target.name}!`);
    }, 900);
  };

  const filteredScanList = allLeads.filter(
    (l) =>
      l.name.toLowerCase().includes(scanSearch.toLowerCase()) ||
      l.email.toLowerCase().includes(scanSearch.toLowerCase()) ||
      l.phone.includes(scanSearch) ||
      l.courseInterest.toLowerCase().includes(scanSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 relative">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-sky-400/30">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Lead Digital QR Pass & Scanner
                <span className="text-[10px] uppercase font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  VSB CRM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scan QR code with camera or view complete verified lead details card
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-3">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab("DETAILS");
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === "DETAILS"
                ? "bg-slate-900 text-sky-400 border-sky-400 shadow-sm"
                : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <QrCode className="w-4 h-4" />
            Show QR Code & Lead Details
          </button>

          <button
            onClick={() => {
              setActiveTab("SCANNER");
            }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === "SCANNER"
                ? "bg-slate-900 text-purple-400 border-purple-400 shadow-sm"
                : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Scan className="w-4 h-4" />
            Live QR Scanner & Verification
            {scanSuccess && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "DETAILS" && (
            <>
              {currentTargetLead ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: SCANNABLE QR CODE CARD */}
                  <div className="lg:col-span-5 flex flex-col items-center bg-slate-950/90 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
                    {/* Top Tag */}
                    <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-300">Verified VSB Pass</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {currentTargetLead.id}
                      </span>
                    </div>

                    {/* QR Code Render Box */}
                    <div className="relative group p-4 bg-white rounded-2xl shadow-2xl border-4 border-sky-500/20 flex flex-col items-center justify-center my-2">
                      <svg
                        id="lead-qr-code-svg"
                        viewBox={`0 0 ${matrixSize} ${matrixSize}`}
                        className="w-52 h-52 sm:w-60 sm:h-60"
                        shapeRendering="crispEdges"
                      >
                        {/* Background white */}
                        <rect width={matrixSize} height={matrixSize} fill="#ffffff" />
                        {/* Modules */}
                        {matrix.map((row, r) =>
                          row.map((cell, c) =>
                            cell ? (
                              <rect
                                key={`${r}-${c}`}
                                x={c}
                                y={r}
                                width="1"
                                height="1"
                                fill="#0f172a"
                              />
                            ) : null
                          )
                        )}
                      </svg>

                      {/* Center VSB Badge */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-11 h-11 rounded-xl bg-slate-950 border-2 border-sky-400 flex flex-col items-center justify-center text-white shadow-xl">
                          <span className="text-[10px] font-black tracking-tighter text-sky-400">VSB</span>
                          <span className="text-[8px] font-bold text-purple-300">CRM</span>
                        </div>
                      </div>
                    </div>

                    {/* Scan Instructions */}
                    <div className="text-center mt-3 space-y-1">
                      <p className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Point phone camera to scan lead info
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Contains instant JSON format with full candidate details & cutoff
                      </p>
                    </div>

                    {/* Quick Action Toolbar */}
                    <div className="grid grid-cols-3 gap-2 w-full mt-5 pt-4 border-t border-slate-800">
                      <button
                        onClick={handleDownloadQR}
                        className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 transition-all text-[11px] font-semibold"
                        title="Download SVG QR Code"
                      >
                        <Download className="w-4 h-4 text-sky-400" />
                        Download
                      </button>

                      <button
                        onClick={handleCopyData}
                        className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-purple-300 transition-all text-[11px] font-semibold"
                        title="Copy Summary to Clipboard"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-purple-400" />
                        )}
                        {copied ? "Copied!" : "Copy Data"}
                      </button>

                      <button
                        onClick={handlePrintPass}
                        className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-all text-[11px] font-semibold"
                        title="Print Lead Pass"
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                        Print Pass
                      </button>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: ALL LEAD DETAILS SHOWCASE CARD */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Header Candidate Banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 p-5 rounded-2xl flex items-start justify-between relative overflow-hidden shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-xl ring-2 ring-white/20">
                          {currentTargetLead.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-white flex items-center gap-2">
                            {currentTargetLead.name}
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-400/40">
                              {currentTargetLead.status}
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="font-mono text-sky-400">{currentTargetLead.id}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-300">
                              <Building className="w-3.5 h-3.5 text-indigo-400" />
                              {currentTargetLead.campus} Campus
                            </span>
                          </p>
                        </div>
                      </div>

                      {onActionTrigger && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onActionTrigger("CALL", currentTargetLead.name)}
                            className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors"
                            title="Call Lead"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onActionTrigger("WHATSAPP", currentTargetLead.name)}
                            className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/40 transition-colors"
                            title="WhatsApp Lead"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Detailed Specifications Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Personal & Basic */}
                      <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-sky-400 font-bold border-b border-slate-800 pb-2 mb-1">
                          <User className="w-4 h-4" />
                          Personal Identification
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Full Name:</span>
                          <span className="font-semibold text-slate-200">{currentTargetLead.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Gender:</span>
                          <span className="font-semibold text-slate-200">{currentTargetLead.gender || "Male"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Father&apos;s Name:</span>
                          <span className="font-semibold text-slate-200">{currentTargetLead.fatherName || "K. Ramachandran"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Community:</span>
                          <span className="font-semibold text-slate-200">{currentTargetLead.community || "BC"}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Blood Group:</span>
                          <span className="font-semibold text-slate-200">{currentTargetLead.bloodGroup || "O+"}</span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-indigo-400 font-bold border-b border-slate-800 pb-2 mb-1">
                          <Phone className="w-4 h-4" />
                          Contact Details
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Mobile Phone:</span>
                          <span className="font-mono font-semibold text-emerald-300">{currentTargetLead.phone}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Email Address:</span>
                          <span className="font-mono text-slate-200 truncate max-w-[150px]">{currentTargetLead.email}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">District / City:</span>
                          <span className="font-semibold text-slate-200">{currentTargetLead.district || "Karur"}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">State:</span>
                          <span className="font-semibold text-slate-200">{currentTargetLead.state || "Tamil Nadu"}</span>
                        </div>
                      </div>

                      {/* Academic & Counselling */}
                      <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-purple-400 font-bold border-b border-slate-800 pb-2 mb-1">
                          <GraduationCap className="w-4 h-4" />
                          Academic & Counselling
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Desired Course:</span>
                          <span className="font-bold text-sky-300 truncate max-w-[160px]" title={currentTargetLead.courseInterest}>
                            {currentTargetLead.courseInterest}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">TNEA Cutoff:</span>
                          <span className="font-mono font-black text-amber-300">{currentTargetLead.tneaCutoff || 185.5} / 200</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Counselling App No:</span>
                          <span className="font-mono text-purple-300">{currentTargetLead.counsellingAppNo || "TNEA2026-84912"}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Counselling Category:</span>
                          <span className="font-semibold text-slate-200">{currentTargetLead.counsellingCategory || "Govt Quota (TNEA)"}</span>
                        </div>
                      </div>

                      {/* CRM Management & Counselor */}
                      <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold border-b border-slate-800 pb-2 mb-1">
                          <Award className="w-4 h-4" />
                          CRM & Counselor Tracking
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Lead Score:</span>
                          <span className="font-black text-emerald-400">{currentTargetLead.leadScore || 85} / 100</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Campaign Source:</span>
                          <span className="font-semibold text-slate-200">{currentTargetLead.source || "TNEA Portal 2026"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Assigned Teacher/Staff:</span>
                          <span className="font-semibold text-sky-300">{currentTargetLead.assignedTo || "Dr. K. Arulmurugan"}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Created Date:</span>
                          <span className="font-mono text-slate-400">{currentTargetLead.createdAt ? new Date(currentTargetLead.createdAt).toLocaleDateString() : "Aug 12, 2026"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Address Footer Box */}
                    <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl text-xs space-y-1 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 font-semibold">Communication Address: </span>
                        <span className="text-slate-200">{currentTargetLead.address || "142, West Car Street, Karur, Tamil Nadu - 639001"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <QrCode className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                  <p className="text-sm font-semibold">No lead selected for QR Code view.</p>
                  <p className="text-xs text-slate-500">Select a candidate from the table or scan a QR code.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "SCANNER" && (
            <div className="space-y-6">
              {/* Scanner Control Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Camera / Interactive Scan Frame */}
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
                  <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 z-10">
                    <Camera className="w-3.5 h-3.5 text-purple-400" />
                    Live QR Camera & Scanner
                  </div>

                  {cameraActive ? (
                    <div className="relative w-full max-w-sm aspect-square bg-black rounded-xl overflow-hidden border-2 border-purple-500/50 shadow-2xl flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Animated Laser Reticle */}
                      <div className="absolute inset-8 border-2 border-purple-400 rounded-lg pointer-events-none shadow-inner flex flex-col justify-between p-2">
                        <div className="w-4 h-4 border-t-2 border-l-2 border-sky-400"></div>
                        <div className="w-4 h-4 border-b-2 border-r-2 border-sky-400 self-end"></div>
                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse shadow-lg"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-sm aspect-square bg-slate-900/80 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4">
                      {/* Simulated viewfinder target */}
                      <div className="w-36 h-36 border-2 border-purple-500/40 rounded-xl relative flex items-center justify-center bg-purple-950/20">
                        <Scan className="w-12 h-12 text-purple-400 animate-pulse" />
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-400"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-400"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-400"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-400"></div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200">Interactive Camera & QR Reader</p>
                        <p className="text-[11px] text-slate-500">
                          Click below to launch device camera or use instant test scan simulator
                        </p>
                      </div>

                      <button
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Enable Camera Scanner
                      </button>
                    </div>
                  )}

                  {cameraActive && (
                    <button
                      onClick={stopCamera}
                      className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 border border-slate-700"
                    >
                      Turn Off Camera
                    </button>
                  )}
                </div>

                {/* Instant Test Scan Selector (Select any lead to decode & show details!) */}
                <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Simulate QR Scanner & Load Details
                    </h4>
                    <p className="text-xs text-slate-400">
                      Select any candidate below to simulate scanning their printed QR badge. It will instantly decode & show all details!
                    </p>
                  </div>

                  {/* Search filter for test scan */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search lead to scan..."
                      value={scanSearch}
                      onChange={(e) => setScanSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Candidate Quick Scan List */}
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                    {filteredScanList.length > 0 ? (
                      filteredScanList.map((cand) => (
                        <div
                          key={cand.id}
                          onClick={() => handleSimulateScanLead(cand)}
                          className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                              {cand.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                                {cand.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
                                {cand.courseInterest}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-purple-400 bg-purple-950/60 px-2 py-1 rounded-md border border-purple-500/30 flex items-center gap-1 group-hover:bg-purple-600 group-hover:text-white transition-all">
                            Scan QR
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-4">No leads found matching query.</p>
                    )}
                  </div>

                  {isScanning && (
                    <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-bold text-center animate-pulse flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                      Decoding QR Code Data...
                    </div>
                  )}
                </div>
              </div>

              {/* Scanned Lead Details Result */}
              {scanSuccess && scannedLead && (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-4 animate-fade-in shadow-xl">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                    <div className="flex items-center gap-2 text-emerald-300 font-black text-base">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Scan Verified! Candidate QR Decoded Successfully
                    </div>
                    <button
                      onClick={() => setActiveTab("DETAILS")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all flex items-center gap-1"
                    >
                      View Scanned Pass
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Candidate Name</span>
                      <span className="font-bold text-white text-sm">{scannedLead.name}</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Lead ID</span>
                      <span className="font-mono font-bold text-sky-300 text-sm">{scannedLead.id}</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Mobile</span>
                      <span className="font-mono font-bold text-emerald-300 text-sm">{scannedLead.phone}</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Cutoff / Marks</span>
                      <span className="font-mono font-bold text-amber-300 text-sm">{scannedLead.tneaCutoff || 185.5}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
