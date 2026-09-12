"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  Edit,
  Trash2,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  MoreHorizontal,
  Share2,
  Save,
  Check,
  AlertCircle
} from "lucide-react";
import { ManagedApplication, CampusLocation } from "@/types/crm";
import {
  saveApplicationToFirebase,
  deleteApplicationFromFirebase,
  fetchApplicationsFromFirebase,
  subscribeToFirebaseApplications
} from "@/lib/firebaseSync";

interface ApplicationManagerModuleProps {
  loggedInCampus?: CampusLocation;
  onTriggerToast: (msg: string) => void;
  subView?: "MANAGE" | "OFFLINE_LOGS";
  onNavigateSubView?: (subView: "MANAGE" | "OFFLINE_LOGS") => void;
}

export default function ApplicationManagerModule({
  loggedInCampus = "ALL",
  onTriggerToast,
  subView = "MANAGE",
  onNavigateSubView,
}: ApplicationManagerModuleProps) {
  const [applications, setApplications] = useState<ManagedApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncedTime, setLastSyncedTime] = useState("Sep 12, 2026 11:57 AM");
  const [isRotating, setIsRotating] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFormFilter, setSelectedFormFilter] = useState("ALL");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("ALL");
  const [selectedOwner, setSelectedOwner] = useState("ALL");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [selectedFormStatus, setSelectedFormStatus] = useState("ALL");
  const [quickView, setQuickView] = useState("System Default View");

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof ManagedApplication>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);

  // Edit / Add Modal State
  const [editingApp, setEditingApp] = useState<ManagedApplication | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Load from Firebase
  const loadData = async (showToast = false) => {
    setIsLoading(true);
    setIsRotating(true);
    try {
      const data = await fetchApplicationsFromFirebase();
      setApplications(data || []);
      const now = new Date();
      const dateFormatted = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timeFormatted = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setLastSyncedTime(`${dateFormatted} ${timeFormatted}`);
      if (showToast) {
        onTriggerToast("🔥 Synchronized with Firebase database!");
      }
    } catch (err) {
      console.error("Failed to load application records:", err);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsRotating(false), 600);
    }
  };

  useEffect(() => {
    loadData(false);
    const unsub = subscribeToFirebaseApplications((liveApps) => {
      if (liveApps && liveApps.length > 0) {
        setApplications(liveApps);
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Filter & Search Logic
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Campus filter
      if (loggedInCampus !== "ALL" && app.campus && app.campus !== loggedInCampus) {
        return false;
      }
      // Form filter
      if (selectedFormFilter !== "ALL") {
        if (!app.formName.toLowerCase().includes(selectedFormFilter.toLowerCase())) {
          return false;
        }
      }
      // Payment status filter
      if (selectedPaymentStatus !== "ALL" && app.paymentStatus !== selectedPaymentStatus) {
        return false;
      }
      // Owner filter
      if (selectedOwner !== "ALL" && app.applicationOwner !== selectedOwner) {
        return false;
      }
      // Stage filter
      if (selectedStage !== "ALL" && app.applicationStage !== selectedStage) {
        return false;
      }
      // Form status filter
      if (selectedFormStatus !== "ALL" && app.formStatus !== selectedFormStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = app.registeredName.toLowerCase().includes(q);
        const matchAppNo = app.applicationNo.toLowerCase().includes(q);
        const matchEmail = app.registeredEmail.toLowerCase().includes(q);
        const matchMobile = app.registeredMobile.toLowerCase().includes(q);
        const matchForm = app.formName.toLowerCase().includes(q);
        if (!matchName && !matchAppNo && !matchEmail && !matchMobile && !matchForm) {
          return false;
        }
      }
      return true;
    });
  }, [
    applications,
    loggedInCampus,
    selectedFormFilter,
    selectedPaymentStatus,
    selectedOwner,
    selectedStage,
    selectedFormStatus,
    searchQuery,
  ]);

  // Sorting
  const sortedApplications = useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredApplications, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedApplications.length / rowsPerPage) || 1;
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedApplications.slice(start, start + rowsPerPage);
  }, [sortedApplications, currentPage, rowsPerPage]);

  const handleSort = (field: keyof ManagedApplication) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedApplications.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    setIsSaving(true);
    try {
      await saveApplicationToFirebase(editingApp);
      setApplications((prev) =>
        prev.map((app) => (app.id === editingApp.id ? editingApp : app))
      );
      onTriggerToast(`✅ Updated application ${editingApp.applicationNo} (${editingApp.registeredName}) in Firebase!`);
      setEditingApp(null);
    } catch (err) {
      console.error(err);
      onTriggerToast("❌ Failed to update application.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add New Application
  const [newApp, setNewApp] = useState<Partial<ManagedApplication>>({
    registeredName: "",
    applicationNo: `VSBEC/2026/${Math.floor(1380 + Math.random() * 200)}`,
    formName: "Application Form VSB Karur (Engineering)",
    registeredEmail: "",
    registeredMobile: "+91-",
    formStatus: "Incomplete",
    paymentStatus: "Payment Pending",
    paymentMethod: "-",
    applicationOwner: "Prof. P. Rajesh",
    applicationStage: "Inquiry Stage",
    campus: "KARUR",
  });

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.registeredName || !newApp.applicationNo) {
      onTriggerToast("⚠️ Please provide candidate name and application number.");
      return;
    }
    setIsSaving(true);
    try {
      const now = new Date();
      const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const payload: ManagedApplication = {
        id: `app_${Date.now()}`,
        registeredName: newApp.registeredName,
        applicationNo: newApp.applicationNo,
        formName: newApp.formName || "Application Form VSB Karur (Engineering)",
        registeredEmail: newApp.registeredEmail || "",
        registeredMobile: newApp.registeredMobile || "",
        formStatus: (newApp.formStatus as any) || "Incomplete",
        paymentStatus: (newApp.paymentStatus as any) || "Payment Pending",
        paymentMethod: newApp.paymentMethod || "-",
        applicationOwner: newApp.applicationOwner || "Prof. P. Rajesh",
        applicationStage: newApp.applicationStage || "Inquiry Stage",
        campus: (newApp.campus as any) || "KARUR",
        createdAt: `${dateFormatted} 12:00 PM`,
        updatedAt: `${dateFormatted} 12:00 PM`,
      };

      await saveApplicationToFirebase(payload);
      setApplications((prev) => [payload, ...prev]);
      onTriggerToast(`🎉 Created application record for ${payload.registeredName}!`);
      setIsAddModalOpen(false);
      setNewApp({
        registeredName: "",
        applicationNo: `VSBEC/2026/${Math.floor(1400 + Math.random() * 200)}`,
        formName: "Application Form VSB Karur (Engineering)",
        registeredEmail: "",
        registeredMobile: "+91-",
        formStatus: "Incomplete",
        paymentStatus: "Payment Pending",
        paymentMethod: "-",
        applicationOwner: "Prof. P. Rajesh",
        applicationStage: "Inquiry Stage",
        campus: "KARUR",
      });
    } catch (err) {
      console.error(err);
      onTriggerToast("❌ Failed to create application.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Application
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete application record for ${name}?`)) {
      return;
    }
    try {
      await deleteApplicationFromFirebase(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      onTriggerToast(`🗑️ Application record for ${name} removed from Firebase.`);
    } catch (err) {
      console.error(err);
      onTriggerToast("❌ Failed to delete record.");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Registered Name",
      "Application No",
      "Form Name",
      "Registered Email",
      "Registered Mobile",
      "Form Status",
      "Payment Status",
      "Payment Method",
      "Application Owner",
      "Campus",
      "Created At"
    ];
    const rows = filteredApplications.map((a) => [
      `"${a.registeredName}"`,
      `"${a.applicationNo}"`,
      `"${a.formName}"`,
      `"${a.registeredEmail}"`,
      `"${a.registeredMobile}"`,
      `"${a.formStatus}"`,
      `"${a.paymentStatus}"`,
      `"${a.paymentMethod || "-"}"`,
      `"${a.applicationOwner || "-"}"`,
      `"${a.campus || "-"}"`,
      `"${a.createdAt}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VSB_Applications_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast(`📥 Exported ${filteredApplications.length} application records to CSV.`);
  };

  // Mock Offline Logs
  const offlineLogs = [
    {
      id: "LOG_901",
      batchName: "TNEA_WalkIn_Admissions_Karur_Day1.xlsx",
      uploadedBy: "Prof. P. Rajesh",
      recordsCount: 148,
      status: "Verified & Synced",
      timestamp: "Sep 12, 2026 10:15 AM",
      campus: "KARUR",
    },
    {
      id: "LOG_902",
      batchName: "School_Outreach_Coimbatore_Expo.csv",
      uploadedBy: "Dr. S. Meenakshi",
      recordsCount: 92,
      status: "Verified & Synced",
      timestamp: "Sep 11, 2026 04:30 PM",
      campus: "COIMBATORE",
    },
    {
      id: "LOG_903",
      batchName: "Direct_Diploma_Lateral_Entry_Batch.xlsx",
      uploadedBy: "Dr. K. Arulmurugan",
      recordsCount: 45,
      status: "Verified & Synced",
      timestamp: "Sep 10, 2026 02:40 PM",
      campus: "COIMBATORE",
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. TOP HEADER BAR (Exact layout from Image 2) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Title + Select Form + Quick View + Last Synced */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Application Manager</span>
            </h1>

            {/* Select Form Dropdown */}
            <div className="relative">
              <select
                value={selectedFormFilter}
                onChange={(e) => setSelectedFormFilter(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg pl-2.5 pr-6 py-1.5 text-xs font-semibold text-sky-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">Select Form ▾</option>
                <option value="Karur">Application Form VSB Karur</option>
                <option value="Coimb">Application Form VSB Coimbatore</option>
              </select>
            </div>

            {/* Quick View */}
            <div className="relative flex items-center gap-1.5 text-slate-600">
              <span className="text-[11px] font-medium">Quick View :</span>
              <select
                value={quickView}
                onChange={(e) => setQuickView(e.target.value)}
                className="bg-transparent border-0 text-sky-700 font-bold hover:underline cursor-pointer focus:outline-none text-xs pr-4 py-1"
              >
                <option value="System Default View">System Default View ▾</option>
                <option value="Complete Applications">Complete Applications</option>
                <option value="Pending Payment">Pending Payment</option>
                <option value="Approved Payment">Approved Payment</option>
              </select>
            </div>

            {/* Last Synced Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Last synced on: {lastSyncedTime}</span>
              <button
                type="button"
                onClick={() => loadData(true)}
                title="Refresh from Firebase"
                className="text-slate-400 hover:text-sky-600 p-0.5 rounded transition-transform cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRotating ? "animate-spin text-sky-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Right Action Icons & Primary Buttons */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {/* Search Input / Toggle */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg px-2 py-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                  <input
                    type="text"
                    placeholder="Search candidate, app no, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-48"
                    autoFocus
                  />
                  <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-600 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Search applications"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
              title="Download Applications CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Offline Logs Toggle */}
            <button
              onClick={() => onNavigateSubView?.(subView === "MANAGE" ? "OFFLINE_LOGS" : "MANAGE")}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                subView === "OFFLINE_LOGS"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
              title="View Offline Upload Logs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>{subView === "OFFLINE_LOGS" ? "View Applications" : "Upload Logs"}</span>
            </button>

            {/* Add Application Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Application</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUB-VIEW: OFFLINE APPLICATION UPLOAD LOGS */}
      {subView === "OFFLINE_LOGS" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>Offline Application Upload Logs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit logs of offline Excel and CSV batch uploads processed into the central database.
              </p>
            </div>
            <button
              onClick={() => onNavigateSubView?.("MANAGE")}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Back to Manage Applications
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Batch File Name</th>
                  <th className="p-3">Uploaded By</th>
                  <th className="p-3">Records Ingested</th>
                  <th className="p-3">Target Campus</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {offlineLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-sky-700">{log.id}</td>
                    <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{log.batchName}</span>
                    </td>
                    <td className="p-3">{log.uploadedBy}</td>
                    <td className="p-3 font-bold text-slate-900">{log.recordsCount} Records</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                        {log.campus}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 3. MAIN APPLICATION MANAGER VIEW (Matching Image 2) */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {/* FILTER ROW (Exact styling from Image 2) */}
          <div className="p-3 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Filter funnel badge */}
              <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 shadow-xs flex items-center justify-center">
                <Filter className="w-3.5 h-3.5 text-sky-600" />
              </div>

              {/* Payment Status Dropdown */}
              <div className="relative min-w-[130px]">
                <label className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider mb-0.5">
                  Payment Status
                </label>
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="ALL">Select Here ▾</option>
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Payment Approved">Payment Approved</option>
                  <option value="Payment Rejected">Payment Rejected</option>
                </select>
              </div>

              {/* Application Owner Dropdown */}
              <div className="relative min-w-[140px]">
                <label className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider mb-0.5">
                  Application Owner / Te...
                </label>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="ALL">Select Here ▾</option>
                  <option value="Prof. P. Rajesh">Prof. P. Rajesh (Karur)</option>
                  <option value="Dr. S. Meenakshi">Dr. S. Meenakshi (Coimbatore)</option>
                  <option value="Dr. K. Arulmurugan">Dr. K. Arulmurugan (Coimbatore)</option>
                </select>
              </div>

              {/* Application Stage Dropdown */}
              <div className="relative min-w-[130px]">
                <label className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider mb-0.5">
                  Application Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="ALL">Select Here ▾</option>
                  <option value="Inquiry Stage">Inquiry Stage</option>
                  <option value="Document Pending">Document Pending</option>
                  <option value="Marks Verification">Marks Verification</option>
                  <option value="Application Completed">Application Completed</option>
                  <option value="Admitted / Enrolled">Admitted / Enrolled</option>
                </select>
              </div>

              {/* Form Status Dropdown */}
              <div className="relative min-w-[120px]">
                <label className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider mb-0.5">
                  Form Status
                </label>
                <select
                  value={selectedFormStatus}
                  onChange={(e) => setSelectedFormStatus(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="ALL">Select Here ▾</option>
                  <option value="Complete">Complete</option>
                  <option value="Incomplete">Incomplete</option>
                </select>
              </div>

              {/* Reset Filters button if any is active */}
              {(selectedPaymentStatus !== "ALL" ||
                selectedOwner !== "ALL" ||
                selectedStage !== "ALL" ||
                selectedFormStatus !== "ALL" ||
                selectedFormFilter !== "ALL" ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedPaymentStatus("ALL");
                    setSelectedOwner("ALL");
                    setSelectedStage("ALL");
                    setSelectedFormStatus("ALL");
                    setSelectedFormFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="mt-3.5 px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Advanced Filter Button on the right */}
            <div className="self-end md:self-center mt-2 md:mt-0">
              <button
                type="button"
                onClick={() => onTriggerToast("ℹ️ Filter presets applied to current table view.")}
                className="px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                <span>Advanced Filter</span>
              </button>
            </div>
          </div>

          {/* DATA TABLE (Columns matching Image 2) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        paginatedApplications.length > 0 &&
                        paginatedApplications.every((a) => selectedIds.includes(a.id))
                      }
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                    onClick={() => handleSort("registeredName")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Registered Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                    onClick={() => handleSort("applicationNo")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Application No</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                    onClick={() => handleSort("formName")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Form Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                    onClick={() => handleSort("registeredEmail")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Registered Email</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                    onClick={() => handleSort("registeredMobile")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Registered Mobile</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                    onClick={() => handleSort("formStatus")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Form Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                    onClick={() => handleSort("paymentStatus")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Payment Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                    onClick={() => handleSort("paymentMethod")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Payment Method</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-500 text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 text-sky-600 animate-spin" />
                        <span className="font-semibold text-slate-600">Loading student applications from Firebase...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedApplications.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-slate-400 text-xs">
                      No applications found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedApplications.map((app) => {
                    const isSelected = selectedIds.includes(app.id);
                    return (
                      <tr
                        key={app.id}
                        className={`transition-colors group hover:bg-sky-50/50 ${
                          isSelected ? "bg-sky-50/80" : ""
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(app.id)}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </td>
                        {/* Registered Name (clickable to edit) */}
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => setEditingApp(app)}
                            className="text-left font-bold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer flex items-center gap-1.5"
                            title="Click to edit application data"
                          >
                            <span>{app.registeredName}</span>
                            {app.paymentStatus === "Payment Approved" && (
                              <span className="text-[10px] text-amber-500" title="Verified Admission">
                                ✨
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Application No */}
                        <td className="p-3 font-mono font-bold text-slate-700 text-[11px]">
                          {app.applicationNo}
                        </td>

                        {/* Form Name */}
                        <td className="p-3 text-slate-700 max-w-[200px] truncate" title={app.formName}>
                          {app.formName}
                        </td>

                        {/* Registered Email */}
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {app.registeredEmail}
                        </td>

                        {/* Registered Mobile with Call and WhatsApp */}
                        <td className="p-3 font-mono text-[11px] text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <span>💬</span>
                              <span>{app.registeredMobile}</span>
                            </span>
                          </div>
                        </td>

                        {/* Form Status */}
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              app.formStatus === "Complete"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {app.formStatus}
                          </span>
                        </td>

                        {/* Payment Status */}
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              app.paymentStatus === "Payment Approved"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : app.paymentStatus === "Payment Rejected"
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {app.paymentStatus}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="p-3 text-slate-600 font-semibold">
                          {app.paymentMethod && app.paymentMethod !== "-" ? (
                            <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">
                              {app.paymentMethod}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        {/* Row Actions Menu */}
                        <td className="p-3 text-center relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === app.id ? null : app.id)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Application options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeMenuId === app.id && (
                            <div className="absolute right-2 top-8 z-30 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left animate-in fade-in">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingApp(app);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 font-bold flex items-center gap-2"
                              >
                                <Edit className="w-3.5 h-3.5 text-sky-600" />
                                <span>Edit Record</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(app.applicationNo);
                                  onTriggerToast(`Copied Application No: ${app.applicationNo}`);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2"
                              >
                                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Copy App No</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleDelete(app.id, app.registeredName);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2 border-t border-slate-100 mt-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER & PAGINATION (Matching Image 2) */}
          <div className="p-3 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Total Records Button */}
            <div>
              <button
                type="button"
                className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Show Total Records ({filteredApplications.length})
              </button>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-3">
              {/* Show Rows selector */}
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span>Show Rows</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Prev / Current / Next */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2.5 py-0.5 rounded border border-slate-300 bg-white text-xs font-bold text-slate-900">
                  {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. EDIT APPLICATION MODAL (Editable Data stored in Firebase) */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-sky-600" />
                  <span>Edit Application Record</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {editingApp.id} • App No: {editingApp.applicationNo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Registered Name */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Registered Name</label>
                  <input
                    type="text"
                    required
                    value={editingApp.registeredName}
                    onChange={(e) =>
                      setEditingApp({ ...editingApp, registeredName: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Application No */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Application Number</label>
                  <input
                    type="text"
                    required
                    value={editingApp.applicationNo}
                    onChange={(e) =>
                      setEditingApp({ ...editingApp, applicationNo: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Registered Email */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={editingApp.registeredEmail}
                    onChange={(e) =>
                      setEditingApp({ ...editingApp, registeredEmail: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Registered Mobile */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Registered Mobile</label>
                  <input
                    type="text"
                    required
                    value={editingApp.registeredMobile}
                    onChange={(e) =>
                      setEditingApp({ ...editingApp, registeredMobile: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Form Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-extrabold text-slate-700">Form Name</label>
                  <select
                    value={editingApp.formName}
                    onChange={(e) => setEditingApp({ ...editingApp, formName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Application Form VSB Karur (Engineering)">
                      Application Form VSB Karur (Engineering)
                    </option>
                    <option value="Application Form VSB Coimbatore (Engineering)">
                      Application Form VSB Coimbatore (Engineering)
                    </option>
                  </select>
                </div>

                {/* Form Status */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Form Status</label>
                  <select
                    value={editingApp.formStatus}
                    onChange={(e) =>
                      setEditingApp({ ...editingApp, formStatus: e.target.value as any })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Incomplete">Incomplete</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Payment Status</label>
                  <select
                    value={editingApp.paymentStatus}
                    onChange={(e) =>
                      setEditingApp({ ...editingApp, paymentStatus: e.target.value as any })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Payment Pending">Payment Pending</option>
                    <option value="Payment Approved">Payment Approved</option>
                    <option value="Payment Rejected">Payment Rejected</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Payment Method</label>
                  <select
                    value={editingApp.paymentMethod || "-"}
                    onChange={(e) => setEditingApp({ ...editingApp, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="-">- (None / Unpaid)</option>
                    <option value="Online">Online Gateway</option>
                    <option value="UPI">UPI Direct</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash Counter">Cash Counter</option>
                  </select>
                </div>

                {/* Application Owner */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Application Owner (Teacher)</label>
                  <select
                    value={editingApp.applicationOwner || "Prof. P. Rajesh"}
                    onChange={(e) => setEditingApp({ ...editingApp, applicationOwner: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Prof. P. Rajesh">Prof. P. Rajesh (Karur)</option>
                    <option value="Dr. S. Meenakshi">Dr. S. Meenakshi (Coimbatore)</option>
                    <option value="Dr. K. Arulmurugan">Dr. K. Arulmurugan (Coimbatore)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving to Firebase..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ADD APPLICATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-sky-600" />
                  <span>Create New Application</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record an incoming candidate application directly into the central database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Registered Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vignesh K"
                    value={newApp.registeredName}
                    onChange={(e) => setNewApp({ ...newApp, registeredName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Application No *</label>
                  <input
                    type="text"
                    required
                    value={newApp.applicationNo}
                    onChange={(e) => setNewApp({ ...newApp, applicationNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Registered Email</label>
                  <input
                    type="email"
                    placeholder="candidate@gmail.com"
                    value={newApp.registeredEmail}
                    onChange={(e) => setNewApp({ ...newApp, registeredEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Registered Mobile</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newApp.registeredMobile}
                    onChange={(e) => setNewApp({ ...newApp, registeredMobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-extrabold text-slate-700">Form Name</label>
                  <select
                    value={newApp.formName}
                    onChange={(e) => setNewApp({ ...newApp, formName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Application Form VSB Karur (Engineering)">
                      Application Form VSB Karur (Engineering)
                    </option>
                    <option value="Application Form VSB Coimbatore (Engineering)">
                      Application Form VSB Coimbatore (Engineering)
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Form Status</label>
                  <select
                    value={newApp.formStatus}
                    onChange={(e) => setNewApp({ ...newApp, formStatus: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Incomplete">Incomplete</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Payment Status</label>
                  <select
                    value={newApp.paymentStatus}
                    onChange={(e) =>
                      setNewApp({ ...newApp, paymentStatus: e.target.value as any })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Payment Pending">Payment Pending</option>
                    <option value="Payment Approved">Payment Approved</option>
                    <option value="Payment Rejected">Payment Rejected</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Create Application"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
