"use client";

import { useState, useEffect } from "react";
import { Teacher, CampusLocation, VSB_DEPARTMENTS_COURSES } from "@/types/crm";
import { MOCK_TEACHERS } from "@/lib/mockData";
import { parseCSVToTeachers } from "@/lib/csvParser";
import InPortalCommunicationModals, { ContactTarget } from "@/components/InPortalCommunicationModals";
import { UserCheck, BookOpen, GraduationCap, Mail, Phone, Plus, Search, CheckCircle2, Award, Edit3, Save, X, ShieldCheck, Upload, FileSpreadsheet, Download } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import SpecularButton from "@/components/SpecularButton";

interface TeacherModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  currentUserRole: "ADMIN" | "TEACHER";
  loggedInUsername?: string;
  onTriggerToast: (msg: string) => void;
}

export default function TeacherModule({ loggedInCampus, currentUserRole, loggedInUsername, onTriggerToast }: TeacherModuleProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // In-Portal Communication Modal State
  const [activeCommModal, setActiveCommModal] = useState<"CALL" | "MESSAGE" | "EMAIL" | null>(null);
  const [activeCommContact, setActiveCommContact] = useState<ContactTarget | null>(null);

  const handleOpenCommModal = (type: "CALL" | "MESSAGE" | "EMAIL", target: ContactTarget) => {
    setActiveCommContact(target);
    setActiveCommModal(type);
  };

  const handleCommLogSuccess = (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => {
    onTriggerToast(`✨ In-Portal ${type} to faculty completed: ${details}`);
  };

  // CSV Import State
  const [csvParsedTeachers, setCsvParsedTeachers] = useState<Teacher[]>([]);
  const [showCsvPreviewModal, setShowCsvPreviewModal] = useState(false);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const parsed = parseCSVToTeachers(text, loggedInCampus);
      if (parsed.length === 0) {
        onTriggerToast("⚠️ No valid faculty records found in the uploaded CSV file.");
        return;
      }
      setCsvParsedTeachers(parsed);
      setShowCsvPreviewModal(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Persistent Storage Sync Helper (LocalStorage + Database API)
  const saveTeachersList = (updatedList: Teacher[]) => {
    setTeachers(updatedList);
    try {
      localStorage.setItem("vsb_crm_teachers", JSON.stringify(updatedList));
    } catch (e) {}
  };

  // Initial Load: Fetch from LocalStorage & Database API
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vsb_crm_teachers");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTeachers(parsed);
        }
      }
    } catch (err) {}

    fetch(`/api/teachers?campus=${loggedInCampus}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTeachers((prev) => {
            const dbIds = new Set(data.map((d: Teacher) => d.id || d.email));
            const localOnly = prev.filter((p) => !dbIds.has(p.id) && !dbIds.has(p.email));
            const merged = [...data, ...localOnly];
            try {
              localStorage.setItem("vsb_crm_teachers", JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [loggedInCampus]);

  const handleConfirmCSVImport = async () => {
    if (csvParsedTeachers.length === 0) return;
    const normalizedTeachers = csvParsedTeachers.map((t) => ({
      ...t,
      campus: loggedInCampus,
    }));
    const updated = [...normalizedTeachers, ...teachers];
    saveTeachersList(updated);
    onTriggerToast(`✨ Successfully imported ${normalizedTeachers.length} faculty members into V.S.B. ${loggedInCampus} Directory!`);
    setCsvParsedTeachers([]);
    setShowCsvPreviewModal(false);

    try {
      await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedTeachers),
      });
    } catch (err) {}
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      "Name,Email,Phone,Department,Campus,Courses,Experience,Lead Quota\n" +
      "Dr. S. Kanthaswamy,kanthaswamy@vsb.ac.in,+91 94432 11223,Computer Science & Engineering,KARUR,B.E. Computer Science,14,1200\n" +
      "Prof. M. Soundarya,soundarya.ece@vsb.ac.in,+91 98421 99887,Electronics & Communication,COIMBATORE,B.E. ECE,8,950\n" +
      "Dr. R. Vignesh,vignesh.mech@vsb.ac.in,+91 97860 44556,Mechanical Engineering,KARUR,B.E. Mechanical,10,1100\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `vsb_faculty_import_template_${loggedInCampus.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast("📥 Faculty CSV Template downloaded!");
  };

  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    department: VSB_DEPARTMENTS_COURSES[0] as string,
    campus: loggedInCampus as CampusLocation,
    courses: VSB_DEPARTMENTS_COURSES[0] as string,
    experienceYears: 5,
  });

  useEffect(() => {
    setNewTeacher((prev) => ({ ...prev, campus: loggedInCampus }));
  }, [loggedInCampus]);

  const departments = ["ALL", ...VSB_DEPARTMENTS_COURSES];

  const filteredTeachers = teachers.filter((t) => {
    // If logged in as TEACHER role, strictly scope to ONLY their unique User ID / Email!
    const matchesTeacherSelf =
      currentUserRole === "ADMIN"
        ? true
        : Boolean(
            loggedInUsername &&
              (t.email.toLowerCase().trim() === loggedInUsername.toLowerCase().trim() ||
                t.id.toLowerCase().trim() === loggedInUsername.toLowerCase().trim())
          );

    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.coursesAssigned.some((c) => c.toLowerCase().includes(search.toLowerCase()));

    const matchesDept =
      selectedDept === "ALL" ||
      t.department === selectedDept ||
      t.department.toLowerCase().includes(selectedDept.toLowerCase()) ||
      selectedDept.toLowerCase().includes(t.department.toLowerCase());

    const matchesCampus =
      currentUserRole === "TEACHER"
        ? true
        : !t.campus ||
          t.campus === loggedInCampus ||
          t.campus.toUpperCase().includes(loggedInCampus);

    return matchesTeacherSelf && matchesSearch && matchesDept && matchesCampus;
  });

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.name || !newTeacher.email) return;

    const teacherToAdd: Teacher = {
      id: `tch_${Date.now()}`,
      name: newTeacher.name,
      email: newTeacher.email,
      phone: newTeacher.phone || "+91 98765 00000",
      department: newTeacher.department,
      campus: loggedInCampus,
      coursesAssigned: [newTeacher.courses],
      experienceYears: Number(newTeacher.experienceYears) || 3,
      status: "ACTIVE",
      avatar: newTeacher.name.slice(0, 2).toUpperCase(),
    };

    const updated = [teacherToAdd, ...teachers];
    saveTeachersList(updated);
    setShowAddModal(false);
    onTriggerToast(`Faculty member ${teacherToAdd.name} registered at V.S.B. ${teacherToAdd.campus} Campus!`);
    setNewTeacher({
      name: "",
      email: "",
      phone: "",
      department: "Computer Science & Engineering",
      campus: loggedInCampus,
      courses: "B.E. Computer Science",
      experienceYears: 5,
    });

    try {
      await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherToAdd),
      });
    } catch (err) {}
  };

  const handleUpdateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    const updatedList = teachers.map((t) => (t.id === editingTeacher.id ? editingTeacher : t));
    saveTeachersList(updatedList);

    setCsvParsedTeachers((prev) =>
      prev.map((t) => (t.id === editingTeacher.id ? editingTeacher : t))
    );
    onTriggerToast(`🔑 Profile updated for faculty member ${editingTeacher.name}!`);
    const teacherToSave = editingTeacher;
    setEditingTeacher(null);

    try {
      await fetch("/api/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherToSave),
      });
    } catch (err) {}
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const tchStartIndex = (safeCurrentPage - 1) * rowsPerPage;
  const tchEndIndex = Math.min(filteredTeachers.length, tchStartIndex + rowsPerPage);
  const paginatedTeachers = filteredTeachers.slice(tchStartIndex, tchEndIndex);

  return (
    <div className="space-y-6">
      {/* Module Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Faculty</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{filteredTeachers.length} Professors</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-400 font-medium mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Ph.D & M.E. Qualified
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Academic Depts</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">4 Departments</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-purple-300 font-medium mt-3">CSE, ECE, IT, Mechanical</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campus Faculty</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {loggedInCampus === "KARUR" ? "Karur Campus" : "Coimbatore Campus"}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-300 font-medium mt-3">V.S.B. Group of Institutions</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Experience</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">12.5 Years</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-amber-300 font-medium mt-3">Senior Academic Leadership</p>
        </div>
      </div>

      {/* Main Faculty Directory Card */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Teacher & Faculty Directory</h3>
            <p className="text-xs text-slate-400">View faculty allocations, department leads, and contact information</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teacher, department..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Hidden File Input for CSV Upload */}
            <input
              id="teacher-csv-file-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />

            {/* Download Sample CSV Template */}
            <button
              onClick={handleDownloadSampleCSV}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Download Faculty CSV Template"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> <span>Sample CSV</span>
            </button>

            {/* Upload CSV File Button */}
            <button
              onClick={() => document.getElementById("teacher-csv-file-upload")?.click()}
              className="px-3 py-1.5 rounded-xl border border-indigo-400/50 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              title="Upload CSV File to Import Faculty Directory"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-100" /> <span>Import CSV</span>
            </button>

            {currentUserRole === "ADMIN" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-1.5 rounded-xl border border-purple-400/50 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> <span>Add Faculty</span>
              </button>
            )}
          </div>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedTeachers.map((tch) => (
            <div
              key={tch.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/60 transition-all duration-300 space-y-3 transform hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    {tch.avatar}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-black dark:text-white group-hover:text-sky-400 transition-colors">{tch.name}</h4>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold">{tch.department}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-slate-950 text-slate-300 border-slate-700 shadow-sm">
                    {tch.campus} CAMPUS
                  </span>

                  {/* Interactive Active / On Leave Status Toggle Switch */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newStatus: "ACTIVE" | "ON_LEAVE" = tch.status === "ACTIVE" ? "ON_LEAVE" : "ACTIVE";
                      const updatedList = teachers.map((t) => (t.id === tch.id || t.email === tch.email ? { ...t, status: newStatus } : t));
                      saveTeachersList(updatedList);
                      onTriggerToast(
                        `🔄 Status updated for ${tch.name}: ${newStatus === "ACTIVE" ? "🟢 ACTIVE" : "🟡 ON LEAVE"}`
                      );
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 transition-all cursor-pointer shadow-md transform hover:scale-105 active:scale-95 ${
                      tch.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/60 hover:bg-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-400/60 hover:bg-amber-500/30"
                    }`}
                    title="Click to toggle Active vs On Leave availability status"
                  >
                    <span className={`w-2 h-2 rounded-full ${tch.status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                    <span>{tch.status === "ACTIVE" ? "🟢 ACTIVE" : "🟡 ON LEAVE"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Experience</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">{tch.experienceYears} Years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Email</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 font-mono text-[11px]">{tch.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Phone</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 font-mono">{tch.phone}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 font-bold">
                  <span className="text-sky-600 dark:text-sky-400 flex items-center gap-1 font-black">
                    <UserCheck className="w-3.5 h-3.5" /> Assigned Lead Quota
                  </span>
                  <span className="text-sky-700 dark:text-sky-300 font-black">{tch.assignedQuota?.toLocaleString() || "1,000"} Contacts</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Assigned Programs
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tch.coursesAssigned.map((c, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 px-2.5 py-0.5 rounded-lg"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-start gap-2 relative z-10">
                <div className="flex items-center gap-2">
                  <Tooltip text={`In-Portal Email ${tch.name}`} position="bottom">
                    <button
                      onClick={() => handleOpenCommModal("EMAIL", {
                        name: tch.name,
                        email: tch.email,
                        phone: tch.phone,
                        campus: tch.campus,
                        courseInterest: tch.department,
                      })}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 shadow-md transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                  </Tooltip>
                  <Tooltip text={`In-Portal Call ${tch.name}`} position="bottom">
                    <button
                      onClick={() => handleOpenCommModal("CALL", {
                        name: tch.name,
                        email: tch.email,
                        phone: tch.phone,
                        campus: tch.campus,
                        courseInterest: tch.department,
                      })}
                      className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 shadow-md transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </button>
                  </Tooltip>
                </div>

                {currentUserRole === "ADMIN" && (
                  <div className="ml-auto">
                    <Tooltip text={`Edit ${tch.name}`} position="bottom">
                      <button
                        onClick={() => setEditingTeacher(tch)}
                        className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800/80 shadow-md transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Faculty
                      </button>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Table Pagination Footer Bar */}
        <div className="mt-4 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300 font-sans shadow-xl">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-200">
              Showing {filteredTeachers.length > 0 ? tchStartIndex + 1 : 0} - {tchEndIndex} of {filteredTeachers.length} Faculty Members
            </span>
          </div>

          {/* Page Control Pills */}
          <div className="flex items-center gap-1.5">
            <button
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-200 cursor-pointer"
              title="First Page"
            >
              ⏮
            </button>
            <button
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-200 cursor-pointer"
            >
              ◀ Prev
            </button>

            <div className="flex items-center gap-1">
              {(() => {
                const maxVisible = 5;
                let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
                let end = start + maxVisible - 1;
                if (end > totalPages) {
                  end = totalPages;
                  start = Math.max(1, end - maxVisible + 1);
                }
                const pages = [];
                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }
                return pages.map((pNum) => {
                  const isActive = pNum === safeCurrentPage;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg font-black text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/40 scale-105"
                          : "bg-slate-950 border border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                });
              })()}
            </div>

            <button
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-200 cursor-pointer"
            >
              Next ▶
            </button>
            <button
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-200 cursor-pointer"
              title="Last Page"
            >
              ⏭
            </button>
          </div>

          {/* Rows Per Page */}
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <span>Show Per Page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 font-extrabold focus:outline-none cursor-pointer"
            >
              <option value={6}>6 items</option>
              <option value={12}>12 items</option>
              <option value={24}>24 items</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Register New V.S.B. Faculty</h3>

            <form onSubmit={handleAddTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="e.g. Dr. K. Arulmurugan"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  placeholder="e.g. arul.cse@vsb.ac.in"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Campus</label>
                  <select
                    value={newTeacher.campus}
                    onChange={(e) => setNewTeacher({ ...newTeacher, campus: e.target.value as CampusLocation })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="KARUR">Karur Campus</option>
                    <option value="COIMBATORE">Coimbatore Campus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={newTeacher.department}
                    onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  >
                    {departments.filter((d) => d !== "ALL").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Course</label>
                <select
                  value={newTeacher.courses}
                  onChange={(e) => setNewTeacher({ ...newTeacher, courses: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                >
                  {VSB_DEPARTMENTS_COURSES.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                >
                  Register Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal (Admin Only) */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
                <Edit3 className="w-5 h-5 text-sky-400" />
                Edit Faculty details
              </h3>
              <button
                onClick={() => setEditingTeacher(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {currentUserRole === "TEACHER" && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-2">
                <span>🔒</span>
                <span>
                  <strong>Faculty Profile Scoping:</strong> Name, Email, Department & Quota are managed by College Admin. You are authorized to update your <strong>Active vs. On Leave</strong> status below.
                </span>
              </div>
            )}

            <form onSubmit={handleUpdateTeacherSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name {currentUserRole === "TEACHER" && "(Locked)"}</label>
                <input
                  type="text"
                  required
                  disabled={currentUserRole === "TEACHER"}
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                    currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email {currentUserRole === "TEACHER" && "(Locked)"}</label>
                <input
                  type="email"
                  required
                  disabled={currentUserRole === "TEACHER"}
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                    currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Phone {currentUserRole === "TEACHER" && "(Locked)"}</label>
                <input
                  type="text"
                  required
                  disabled={currentUserRole === "TEACHER"}
                  value={editingTeacher.phone}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                    currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Campus {currentUserRole === "TEACHER" && "(Locked)"}</label>
                  <select
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.campus}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, campus: e.target.value as CampusLocation })}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                      currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    <option value="KARUR">Karur Campus</option>
                    <option value="COIMBATORE">Coimbatore Campus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department {currentUserRole === "TEACHER" && "(Locked)"}</label>
                  <select
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.department}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, department: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                      currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    {departments.filter((d) => d !== "ALL").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Lead Quota {currentUserRole === "TEACHER" && "(Locked)"}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.assignedQuota || 1000}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, assignedQuota: Number(e.target.value) })}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-100 font-bold text-sky-300 ${
                      currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-emerald-400">Faculty Status (Editable ✨)</label>
                  <select
                    value={editingTeacher.status}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, status: e.target.value as "ACTIVE" | "ON_LEAVE" })}
                    className="w-full bg-slate-900 border border-emerald-500/60 rounded-xl px-3 py-2 text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVE">🟢 ACTIVE</option>
                    <option value="ON_LEAVE">🟡 ON LEAVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Experience (Years) {currentUserRole === "TEACHER" && "(Locked)"}</label>
                  <input
                    type="number"
                    required
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.experienceYears}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, experienceYears: Number(e.target.value) })}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                      currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Course {currentUserRole === "TEACHER" && "(Locked)"}</label>
                  <select
                    disabled={currentUserRole === "TEACHER"}
                    value={editingTeacher.coursesAssigned[0] || VSB_DEPARTMENTS_COURSES[0]}
                    onChange={(e) => {
                      const courses = [...editingTeacher.coursesAssigned];
                      courses[0] = e.target.value;
                      setEditingTeacher({ ...editingTeacher, coursesAssigned: courses });
                    }}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-100 ${
                      currentUserRole === "TEACHER" ? "bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed" : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    {VSB_DEPARTMENTS_COURSES.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  <Save className="w-3.5 h-3.5" /> Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORTER PREVIEW MODAL */}
      {showCsvPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-3xl shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    Import Faculty CSV Preview
                  </h3>
                  <p className="text-xs text-slate-400">
                    Found <span className="font-bold text-indigo-400">{csvParsedTeachers.length}</span> faculty members in file
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCsvPreviewModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold sticky top-0 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3">Faculty Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Campus</th>
                    <th className="px-4 py-3">Experience</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {csvParsedTeachers.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {t.avatar}
                        </span>
                        {t.name}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-indigo-300">{t.email}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{t.phone}</td>
                      <td className="px-4 py-2.5 text-purple-300 font-medium">{t.department}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {t.campus}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-amber-300">{t.experienceYears} Yrs</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setEditingTeacher(t)}
                          className="px-2 py-1 rounded-lg bg-sky-950 text-sky-400 hover:text-sky-200 border border-sky-800 font-bold text-[11px] flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                All CSV records validated against V.S.B. Directory schema.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCsvPreviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCSVImport}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/40 border border-emerald-300/40 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>Import {csvParsedTeachers.length} Faculty Members</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-PORTAL DIRECT COMMUNICATION MODALS (Call, Message, Email) */}
      <InPortalCommunicationModals
        activeModal={activeCommModal}
        contact={activeCommContact}
        onClose={() => setActiveCommModal(null)}
        onLogSuccess={handleCommLogSuccess}
      />
    </div>
  );
}
