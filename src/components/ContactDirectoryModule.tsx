"use client";

import { useState } from "react";
import { Lead, Application, CampusLocation, VSB_DEPARTMENTS_COURSES } from "@/types/crm";
import Tooltip from "@/components/Tooltip";
import SpecularButton from "@/components/SpecularButton";
import InPortalCommunicationModals, { ContactTarget } from "@/components/InPortalCommunicationModals";
import {
  Phone,
  Mail,
  MapPin,
  School,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  UserCheck,
  Building,
  CheckCircle2,
  X,
  Save,
  MessageSquare,
  Sparkles,
  Upload,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

interface ContactDirectoryModuleProps {
  initialContacts: (Lead & { application?: Application | null })[];
  selectedCampus: CampusLocation;
  currentUserRole?: "ADMIN" | "TEACHER";
  loggedInUsername?: string;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onTriggerToast?: (msg: string) => void;
}

export default function ContactDirectoryModule({
  initialContacts,
  selectedCampus,
  currentUserRole = "ADMIN",
  loggedInUsername = "adminkarur@123",
  onActionTrigger,
  onTriggerToast,
}: ContactDirectoryModuleProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [counsellingFilter, setCounsellingFilter] = useState<"ALL" | "COUNSELLING_ONLY" | "GOVT_QUOTA" | "MANAGEMENT_ONLY">("ALL");

  // Meritto Lead Manager View & Filter States (Image 2)
  const [directoryViewMode, setDirectoryViewMode] = useState<"TABLE" | "GRID">("TABLE");
  const [regDateFilter, setRegDateFilter] = useState("Select Here");
  const [leadStageFilter, setLeadStageFilter] = useState("Select Here");
  const [leadOwnerFilter, setLeadOwnerFilter] = useState("Select Here");
  const [campaignSourceFilter, setCampaignSourceFilter] = useState("Select Here");
  const [trafficChannelFilter, setTrafficChannelFilter] = useState("Select Here");
  const [selectedViewName, setSelectedViewName] = useState("Default View");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Visibility Controls States
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showAddress, setShowAddress] = useState(true);

  // Add Contact Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    school: "",
    district: "Karur",
    address: "",
    campus: "KARUR" as CampusLocation,
    courseInterest: VSB_DEPARTMENTS_COURSES[0] as string,
    appliedCounselling: true,
    counsellingAppNo: `TNEA2026-${Math.floor(10000 + Math.random() * 90000)}`,
    tneaCutoff: 185.0,
    counsellingCategory: "TNEA General Counselling",
  });

  // Edit Contact Modal State
  const [editingContact, setEditingContact] = useState<(Lead & { application?: Application | null }) | null>(null);

  // In-Portal Communication Modal State
  const [activeCommModal, setActiveCommModal] = useState<"CALL" | "MESSAGE" | "EMAIL" | null>(null);
  const [activeCommContact, setActiveCommContact] = useState<ContactTarget | null>(null);

  const handleOpenCommModal = (type: "CALL" | "MESSAGE" | "EMAIL", target: ContactTarget) => {
    setActiveCommContact(target);
    setActiveCommModal(type);
  };

  const handleCommLogSuccess = (type: "CALL" | "MESSAGE" | "EMAIL", details: string) => {
    if (onTriggerToast) {
      onTriggerToast(`✨ In-Portal ${type} completed: ${details}`);
    }
    onActionTrigger(type === "MESSAGE" ? "WHATSAPP" : type, activeCommContact?.name || "Candidate");
  };

  // Teacher Assignment Handler (Admin action)
  const handleAssignTeacher = (contactId: string, teacherUsername: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, assignedTo: teacherUsername } : c))
    );
    if (onTriggerToast) {
      onTriggerToast(`Contact assigned to teacher (${teacherUsername})!`);
    }
  };

  // Filter Contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.school && c.school.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.district && c.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCampus = selectedCampus === "ALL" || c.campus === selectedCampus;

    const matchesDistrict =
      selectedDistrict === "ALL" ||
      (c.district && c.district.toLowerCase() === selectedDistrict.toLowerCase());

    const matchesStatus = selectedStatus === "ALL" || c.status === selectedStatus;

    const matchesCounselling =
      counsellingFilter === "ALL"
        ? true
        : counsellingFilter === "COUNSELLING_ONLY"
        ? c.appliedCounselling === true || c.source?.includes("TNEA")
        : counsellingFilter === "GOVT_QUOTA"
        ? c.counsellingCategory?.includes("7.5%")
        : c.appliedCounselling === false || c.counsellingCategory?.includes("Management");

    const matchesTeacherAssignment =
      currentUserRole === "ADMIN" ||
      c.assignedTo === loggedInUsername ||
      (!c.assignedTo && (c.campus === selectedCampus || selectedCampus === "ALL"));

    return matchesSearch && matchesCampus && matchesDistrict && matchesStatus && matchesCounselling && matchesTeacherAssignment;
  });

  // Extract unique districts
  const districts = ["ALL", "Karur", "Coimbatore", "Salem", "Tiruchirappalli", "Namakkal", "Erode", "Madurai"];

  // Add New Contact Submit Handler
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });

      const data = await res.json();
      setContacts([data, ...contacts]);
      setIsAddModalOpen(false);
      setNewContact({
        name: "",
        phone: "",
        email: "",
        school: "",
        district: "Karur",
        address: "",
        campus: "KARUR",
        courseInterest: "B.E. Computer Science",
        appliedCounselling: true,
        counsellingAppNo: `TNEA2026-${Math.floor(10000 + Math.random() * 90000)}`,
        tneaCutoff: 185.0,
        counsellingCategory: "TNEA General Counselling",
      });
    } catch (err) {
      // Local fallback insert
      const fallback: Lead = {
        id: `lead_${Date.now()}`,
        name: newContact.name,
        email: newContact.email || `${newContact.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
        phone: newContact.phone,
        source: "Direct Entry",
        courseInterest: newContact.courseInterest,
        campus: newContact.campus,
        school: newContact.school || "Govt Higher Secondary School",
        district: newContact.district,
        address: newContact.address || "Tamil Nadu",
        status: "NEW",
        createdAt: new Date().toISOString(),
      };
      setContacts([fallback, ...contacts]);
      setIsAddModalOpen(false);
    }
  };

  // CSV File Importer Handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const imported: Lead[] = [];

      // Detect header row if it contains columns names
      const startIndex = lines[0].toLowerCase().includes("name") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV splitter
        const parts = line.split(",").map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length < 2) continue; // Requires at least Name and Phone

        const [name, phone, email, school, district, address, courseInterest] = parts;

        imported.push({
          id: `lead_csv_${Date.now()}_${i}`,
          name: name || "Imported Candidate",
          phone: phone || "+91 99999 99999",
          email: email || `${(name || "candidate").toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
          source: "CSV Import",
          courseInterest: courseInterest || "B.E. Computer Science",
          campus: selectedCampus === "ALL" ? "KARUR" : selectedCampus,
          school: school || "Govt Higher Secondary School",
          district: district || (selectedCampus === "KARUR" ? "Karur" : "Coimbatore"),
          address: address || "Tamil Nadu",
          status: "NEW",
          createdAt: new Date().toISOString(),
        });
      }

      if (imported.length > 0) {
        setContacts((prev) => [...imported, ...prev]);
        if (onTriggerToast) {
          onTriggerToast(`📥 Successfully imported ${imported.length} candidate contacts from CSV!`);
        }
      } else {
        if (onTriggerToast) {
          onTriggerToast("⚠️ No valid candidate details found in the CSV file.");
        }
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = "";
  };

  // Edit Contact Submit Handler
  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      const res = await fetch("/api/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingContact),
      });

      const updated = await res.json();
      setContacts(contacts.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      setEditingContact(null);
    } catch (err) {
      setContacts(contacts.map((c) => (c.id === editingContact.id ? editingContact : c)));
      setEditingContact(null);
    }
  };

  // Delete Contact Handler
  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete contact record for ${name}?`)) return;

    try {
      await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
    } catch (err) { }

    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Teacher Quota & In-Portal Call/Message Banner */}
      {currentUserRole === "TEACHER" && (
        <div className="bubble-card p-4 sm:p-5 border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                Faculty Lead Allocation
              </span>
              <span className="text-xs text-slate-300 font-bold">Assigned by Admin</span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Assigned Contacts Quota: <span className="text-emerald-400">1,000 Candidates</span>
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>In-Portal Direct Calling, Messaging & Mail Active — No personal phone numbers required.</span>
            </p>
          </div>

          <div className="w-full md:w-64 bg-slate-950/90 p-3.5 rounded-2xl border border-white/10 space-y-1.5 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-slate-400">Outreach Progress</span>
              <span className="text-emerald-400">142 / 1,000 (14.2%)</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[14.2%]" />
            </div>
            <p className="text-[10px] text-slate-400 text-right">858 Assigned Contacts Remaining</p>
          </div>
        </div>
      )}

      {/* MERITTO LEAD MANAGER TOP HEADER BAR (Matching Image 2 Reference) */}
      <div className="bg-[#ffffff] text-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-sans">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Lead Manager
          </h2>

          {/* Default View Selector */}
          <div className="relative">
            <select
              value={selectedViewName}
              onChange={(e) => setSelectedViewName(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Default View">Default View ∨</option>
              <option value="Karur Intake View">Karur Intake View</option>
              <option value="TNEA Candidates">TNEA Candidates</option>
              <option value="High Cutoff Leads">High Cutoff Leads</option>
            </select>
          </div>

          {/* Save View Button */}
          <button
            onClick={() => onTriggerToast?.("Saved custom view configuration!")}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-blue-600 font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save View
          </button>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Last sync on Aug 12, 2026 11:36 AM</span>
            <button onClick={() => onTriggerToast?.("Synced latest candidate leads from server!")} title="Sync Now" className="hover:rotate-180 transition-transform ml-1">
              🔄
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Ask Mio AI Button */}
          <button
            onClick={() => alert("✨ Mio AI Assistant: All candidate registered leads are active and synced.")}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20"
          >
            <span>✨ Ask Mio AI</span>
          </button>

          {/* View Mode Toggle: Table View (Image 2) vs Cards View (Image 1) */}
          <div className="flex items-center bg-slate-200 p-0.5 rounded-xl border border-slate-300">
            <button
              onClick={() => setDirectoryViewMode("TABLE")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                directoryViewMode === "TABLE" ? "bg-blue-600 text-white shadow" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              📋 Lead Manager Table
            </button>
            <button
              onClick={() => setDirectoryViewMode("GRID")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                directoryViewMode === "GRID" ? "bg-blue-600 text-white shadow" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              🎴 Cards View
            </button>
          </div>

          <input
            type="file"
            id="csv-file-upload"
            accept=".csv"
            className="hidden"
            onChange={handleCSVUpload}
          />
          <button
            onClick={() => document.getElementById("csv-file-upload")?.click()}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center gap-1.5 shadow-md shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR (Matching Image 2 Reference) */}
      <div className="bg-[#ffffff] border border-slate-200 rounded-2xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs font-sans text-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* User Registration Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">User Registration Date</label>
            <select
              value={regDateFilter}
              onChange={(e) => setRegDateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Select Here">Select Here 📅</option>
              <option value="Today">Today (12/08/2026)</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          {/* Lead Stage */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lead Stage</label>
            <select
              value={leadStageFilter}
              onChange={(e) => setLeadStageFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Select Here">Select Here ∨</option>
              <option value="Untouched">Untouched</option>
              <option value="New Inquiry">New Inquiry</option>
              <option value="Contacted">Contacted</option>
              <option value="Cutoff Review">Cutoff Review</option>
              <option value="Admitted">Admitted</option>
            </select>
          </div>

          {/* Lead Owner / Teams */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lead Owner / Teams</label>
            <select
              value={leadOwnerFilter}
              onChange={(e) => setLeadOwnerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Select Here">Select Here ∨</option>
              <option value="Admin Karur">Admin Karur</option>
              <option value="Admin Covai">Admin Covai</option>
              <option value="Counselor Team A">Counselor Team A</option>
            </select>
          </div>

          {/* Campaign Source */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Campaign Source</label>
            <select
              value={campaignSourceFilter}
              onChange={(e) => setCampaignSourceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Select Here">Select Here ∨</option>
              <option value="Organic">Organic Search</option>
              <option value="TNEA Counselling">TNEA Counselling</option>
              <option value="Facebook Ads">Facebook Ads</option>
              <option value="College Expo">College Expo</option>
            </select>
          </div>

          {/* Traffic Channel */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Traffic Channel</label>
            <select
              value={trafficChannelFilter}
              onChange={(e) => setTrafficChannelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Select Here">Select Here ∨</option>
              <option value="Direct Intake">Direct Intake</option>
              <option value="Social Media">Social Media</option>
              <option value="Referral">Referral</option>
            </select>
          </div>

          <button className="self-end mb-0.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 font-bold hover:bg-slate-200">
            +2 more
          </button>
        </div>

        <button className="px-3.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-black hover:bg-blue-100 flex items-center gap-1 shadow-sm">
          ⚡ Advanced Filter
        </button>
      </div>

      {/* District & Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bubble-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Contacts</p>
            <h4 className="text-lg font-black text-white">{contacts.length}</h4>
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Districts Covered</p>
            <h4 className="text-lg font-black text-white">8 Tamil Nadu Districts</h4>
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30 flex items-center justify-center font-bold">
            <School className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Schools Tracked</p>
            <h4 className="text-lg font-black text-white">7 Higher Sec Schools</h4>
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Campus</p>
            <h4 className="text-lg font-black text-amber-300">{selectedCampus} CAMPUS</h4>
          </div>
        </div>
      </div>

      {/* V.S.B. TNEA & Lead Stage Icon Filters */}
      <div className="bubble-card p-4 space-y-3.5 border border-sky-400/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" /> V.S.B. TNEA & Lead Stage Filters
            </h3>
            <p className="text-xs text-slate-400">Filter candidate inquiries by stage or TNEA counselling category</p>
          </div>
          
          {/* Counselling Status Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar text-xs font-bold">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider shrink-0 mr-1">Counselling Intake:</span>
            <button
              onClick={() => setCounsellingFilter("ALL")}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 ${
                counsellingFilter === "ALL"
                  ? "bg-slate-800 text-white border-white/30 font-black"
                  : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              All Intake
            </button>
            <button
              onClick={() => setCounsellingFilter("COUNSELLING_ONLY")}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 flex items-center gap-1 ${
                counsellingFilter === "COUNSELLING_ONLY"
                  ? "bg-emerald-500/30 text-emerald-300 border-emerald-400/60 shadow-md font-black"
                  : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              <span>✅ Applied TNEA</span>
            </button>
            <button
              onClick={() => setCounsellingFilter("GOVT_QUOTA")}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 flex items-center gap-1 ${
                counsellingFilter === "GOVT_QUOTA"
                  ? "bg-indigo-500/30 text-indigo-300 border-indigo-400/60 shadow-md font-black"
                  : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              <span>🏛️ 7.5% Govt Quota</span>
            </button>
            <button
              onClick={() => setCounsellingFilter("MANAGEMENT_ONLY")}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 flex items-center gap-1 ${
                counsellingFilter === "MANAGEMENT_ONLY"
                  ? "bg-purple-500/30 text-purple-300 border-purple-400/60 shadow-md font-black"
                  : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              <span>💼 Management Quota</span>
            </button>
          </div>
        </div>

        {/* One by One Icon Status Filter Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
          <button
            onClick={() => setSelectedStatus("ALL")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 ${
              selectedStatus === "ALL"
                ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white border-white/40 shadow-lg shadow-sky-500/30 font-black scale-[1.03]"
                : "bg-slate-950/80 text-slate-300 border-white/15 hover:border-white/30"
            }`}
          >
            <span className="text-lg">🌟</span>
            <div className="text-left leading-tight">
              <span className="block text-xs">All Leads</span>
              <span className="text-[10px] opacity-80">{contacts.length} Total</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("NEW")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 relative overflow-hidden ${
              selectedStatus === "NEW"
                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-300 shadow-xl shadow-sky-500/40 ring-2 ring-sky-400/50 font-black scale-[1.03]"
                : "bg-sky-950/50 text-sky-300 border-sky-500/40 hover:bg-sky-900/60"
            }`}
          >
            <span className="text-lg animate-pulse">🆕</span>
            <div className="text-left leading-tight">
              <span className="block text-xs text-sky-200 font-extrabold">New Inquiry</span>
              <span className="text-[10px] opacity-90">{contacts.filter(c => c.status === "NEW").length} Leads</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("CONTACTED")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 ${
              selectedStatus === "CONTACTED"
                ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-teal-300 shadow-lg shadow-teal-500/30 font-black scale-[1.03]"
                : "bg-teal-950/40 text-teal-300 border-teal-500/30 hover:bg-teal-900/50"
            }`}
          >
            <span className="text-lg">📞</span>
            <div className="text-left leading-tight">
              <span className="block text-xs">Contacted</span>
              <span className="text-[10px] opacity-80">{contacts.filter(c => c.status === "CONTACTED").length} Leads</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("IN_REVIEW")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 ${
              selectedStatus === "IN_REVIEW"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-300 shadow-lg shadow-amber-500/30 font-black scale-[1.03]"
                : "bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/50"
            }`}
          >
            <span className="text-lg">📊</span>
            <div className="text-left leading-tight">
              <span className="block text-xs">Cutoff Review</span>
              <span className="text-[10px] opacity-80">{contacts.filter(c => c.status === "IN_REVIEW").length} Leads</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("ADMITTED")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 ${
              selectedStatus === "ADMITTED"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-300 shadow-lg shadow-emerald-500/30 font-black scale-[1.03]"
                : "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50"
            }`}
          >
            <span className="text-lg">🎓</span>
            <div className="text-left leading-tight">
              <span className="block text-xs">Admitted</span>
              <span className="text-[10px] opacity-80">{contacts.filter(c => c.status === "ADMITTED").length} Leads</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("REJECTED")}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 active:scale-95 ${
              selectedStatus === "REJECTED"
                ? "bg-gradient-to-r from-rose-500 to-red-600 text-white border-rose-300 shadow-lg shadow-rose-500/30 font-black scale-[1.03]"
                : "bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/50"
            }`}
          >
            <span className="text-lg">❌</span>
            <div className="text-left leading-tight">
              <span className="block text-xs">Rejected</span>
              <span className="text-[10px] opacity-80">{contacts.filter(c => c.status === "REJECTED").length} Leads</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search & District Filter Bar */}
      <div className="bubble-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, school, district, address..."
              className="w-full bg-slate-950/80 border border-white/20 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 backdrop-blur-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 hide-scrollbar">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5 text-sky-400" /> District:
            </span>
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${selectedDistrict === d
                    ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-md shadow-sky-500/40"
                    : "bg-slate-900/70 text-slate-300 border border-white/15 hover:text-white"
                  }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Privacy & Visibility Controls */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-white/10 text-xs font-bold text-slate-300">
          <span className="text-sky-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Privacy Settings:
          </span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPhone}
              onChange={(e) => setShowPhone(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-white/20 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Show Phone Numbers</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showEmail}
              onChange={(e) => setShowEmail(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-white/20 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Show Email Addresses</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAddress}
              onChange={(e) => setShowAddress(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-white/20 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Show Home Addresses</span>
          </label>
        </div>
      </div>

      {/* MAIN CONTENT VIEW: LEAD MANAGER TABLE (Image 2) OR CARDS GRID (Image 1) */}
      {directoryViewMode === "TABLE" ? (
        /* MERITTO LEAD MANAGER DATA TABLE (Exact Image 2 Implementation) */
        <div className="bg-[#ffffff] text-slate-800 rounded-2xl border border-slate-200 shadow-xl overflow-hidden font-sans">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(filteredContacts.map((c) => c.id));
                        } else {
                          setSelectedRows([]);
                        }
                      }}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 font-semibold text-slate-600">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                      Registered Name <span className="text-[10px] text-slate-400">↑↓</span>
                    </span>
                  </th>
                  <th className="p-3 font-semibold text-slate-600">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                      Registered Email <span className="text-[10px] text-slate-400">↑↓</span>
                    </span>
                  </th>
                  <th className="p-3 font-semibold text-slate-600">
                    <span className="flex items-center gap-1">Registered Mobile</span>
                  </th>
                  <th className="p-3 font-semibold text-slate-600">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                      State <span className="text-[10px] text-slate-400">↑↓</span>
                    </span>
                  </th>
                  <th className="p-3 font-semibold text-slate-600">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                      City <span className="text-[10px] text-slate-400">↑↓</span>
                    </span>
                  </th>
                  <th className="p-3 font-semibold text-slate-600">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                      User Registration Date <span className="text-[10px] text-slate-400">↑↓</span>
                    </span>
                  </th>
                  <th className="p-3 font-semibold text-slate-600">Lead Stage</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredContacts.slice(0, rowsPerPage).map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-blue-50/60 transition-colors group cursor-pointer"
                  >
                    {/* Select Checkbox */}
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows([...selectedRows, contact.id]);
                          } else {
                            setSelectedRows(selectedRows.filter((id) => id !== contact.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Registered Name with 3-Dots Menu */}
                    <td className="p-3 font-bold text-blue-600 hover:underline">
                      <div className="flex items-center justify-between gap-2">
                        <span onClick={() => setEditingContact(contact)}>
                          {contact.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingContact(contact);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-80 group-hover:opacity-100"
                          title="Lead Options"
                        >
                          ⋮
                        </button>
                      </div>
                    </td>

                    {/* Registered Email */}
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {showEmail ? contact.email : "•••••@•••••.•••"}
                    </td>

                    {/* Registered Mobile with WhatsApp Quick Button */}
                    <td className="p-3 font-mono font-semibold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCommModal("MESSAGE", {
                              name: contact.name,
                              phone: contact.phone,
                              email: contact.email,
                              courseInterest: contact.courseInterest,
                              campus: contact.campus,
                            });
                          }}
                          className="p-1 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                          title={`WhatsApp Chat with ${contact.name}`}
                        >
                          💬
                        </button>
                        <span>{showPhone ? contact.phone : "+91 ••••• •••••"}</span>
                      </div>
                    </td>

                    {/* State */}
                    <td className="p-3 text-slate-700 font-medium">
                      {contact.state || (contact.district ? "Tamil Nadu" : "State Not Available")}
                    </td>

                    {/* City */}
                    <td className="p-3 text-slate-700 font-medium">
                      {contact.district || "City Not Available"}
                    </td>

                    {/* User Registration Date */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {contact.createdAt
                        ? new Date(contact.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })
                        : "12/08/2026, 09:51:43 AM"}
                    </td>

                    {/* Lead Stage Badge (Styled Pill) */}
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold inline-block ${
                          contact.status === "NEW"
                            ? "bg-rose-100 text-rose-600 border border-rose-200"
                            : contact.status === "CONTACTED"
                            ? "bg-sky-100 text-sky-700 border border-sky-200"
                            : contact.status === "IN_REVIEW"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : contact.status === "ADMITTED"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {contact.status === "NEW" ? "Untouched" : contact.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER CONTROLS BAR (Image 2 Reference) */}
          <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-sans">
            {/* Classic View Toggle */}
            <button
              onClick={() => setDirectoryViewMode("GRID")}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold shadow-sm"
            >
              Classic View
            </button>

            {/* Load More Leads Center Button */}
            <button
              onClick={() => onTriggerToast?.("Loaded more records from database!")}
              className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold flex items-center gap-1.5 shadow-sm"
            >
              🔄 Load More Leads
            </button>

            {/* Total Records & Rows Selector */}
            <div className="flex items-center gap-3">
              <button className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold shadow-sm">
                Show Total Records ({filteredContacts.length})
              </button>

              <div className="flex items-center gap-1.5 font-bold">
                <span>Show Rows</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 ∨</option>
                  <option value={20}>20 ∨</option>
                  <option value={50}>50 ∨</option>
                  <option value={100}>100 ∨</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CARDS VIEW (Image 1 Layout) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bubble-card p-5 border border-white/20 hover:border-sky-400/60 transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-sky-500/20 cursor-pointer"
            >
              <div>
                {/* Header: Name & Campus Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-500 text-white font-black flex items-center justify-center shadow-md text-sm border border-white/20 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      {contact.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white group-hover:text-sky-300 transition-colors">
                        {contact.name}
                      </h3>
                      <p className="text-[11px] text-sky-300 font-semibold">{contact.courseInterest}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Stage Status Badge */}
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-sm ${
                      contact.status === "NEW"
                        ? "bg-sky-500/20 text-sky-300 border-sky-400/50 animate-pulse"
                        : contact.status === "CONTACTED"
                        ? "bg-teal-500/20 text-teal-300 border-teal-400/50"
                        : contact.status === "IN_REVIEW"
                        ? "bg-amber-500/20 text-amber-300 border-amber-400/50"
                        : contact.status === "ADMITTED"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                        : "bg-rose-500/20 text-rose-300 border-rose-400/50"
                    }`}>
                      {contact.status === "NEW" && "🆕 New Inquiry"}
                      {contact.status === "CONTACTED" && "📞 Contacted"}
                      {contact.status === "IN_REVIEW" && "📊 Cutoff Review"}
                      {contact.status === "ADMITTED" && "🎓 Admitted"}
                      {contact.status === "REJECTED" && "❌ Rejected"}
                    </span>

                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-950 border border-white/20 text-sky-300">
                      {contact.campus || "KARUR"}
                    </span>
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-2 text-xs text-slate-300 bg-slate-950/70 p-3.5 rounded-2xl border border-white/10 mb-4">
                  {/* Phone */}
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono font-bold text-white">
                      {showPhone ? contact.phone : "+91 ••••• •••••"}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">
                      {showEmail ? contact.email : "•••••@•••••.•••"}
                    </span>
                  </div>

                  {/* School */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium text-amber-200 truncate">{contact.school || "Govt HSS"}</span>
                  </div>

                  {/* District */}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span className="font-bold text-pink-300">{contact.district || "Karur"} District</span>
                  </div>

                  {/* TNEA Counselling Details Box */}
                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-sky-400" /> TNEA Counselling:
                      </span>
                      {contact.appliedCounselling !== false ? (
                        <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                          ✅ Applied ({contact.counsellingAppNo || "TNEA2026-61201"})
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                          ⏳ Direct Management Intake
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/10">
                      <span className="text-slate-300">
                        Cutoff: <strong className="text-sky-300 font-mono font-bold">{contact.tneaCutoff || 188.5} / 200</strong>
                      </span>
                      <span className="text-indigo-300 text-[10px]">
                        {contact.counsellingCategory || "TNEA General"}
                      </span>
                    </div>
                  </div>

                  {/* Admin Teacher Assignment Dropdown */}
                  {currentUserRole === "ADMIN" && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                        🧑‍🏫 Assign Faculty:
                      </span>
                      <select
                        value={contact.assignedTo || (contact.campus === "COIMBATORE" ? "teachercovai@123" : "teacherkarur@123")}
                        onChange={(e) => handleAssignTeacher(contact.id, e.target.value)}
                        className="bg-slate-900 border border-white/20 text-sky-300 font-bold px-2 py-0.5 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer"
                      >
                        <option value="teacherkarur@123">Dr. K. Arulmurugan (Karur)</option>
                        <option value="teachercovai@123">Dr. S. Meenakshi (Coimbatore)</option>
                        <option value="teacher_general">Prof. P. Rajesh (Mechanical)</option>
                        <option value="teacher_it">Dr. N. Gayathri (IT)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Edit, Call, Email, WhatsApp, Delete */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
                <div className="flex items-center gap-1.5">
                  <Tooltip text={`In-Portal Call ${contact.name}`} position="bottom">
                    <button
                      onClick={() => handleOpenCommModal("CALL", {
                        name: contact.name,
                        phone: contact.phone,
                        email: contact.email,
                        courseInterest: contact.courseInterest,
                        campus: contact.campus,
                        school: contact.school || undefined,
                        district: contact.district || undefined,
                      })}
                      className="p-2 rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-400/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-emerald-500/40"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text={`In-Portal Email ${contact.name}`} position="bottom">
                    <button
                      onClick={() => handleOpenCommModal("EMAIL", {
                        name: contact.name,
                        phone: contact.phone,
                        email: contact.email,
                        courseInterest: contact.courseInterest,
                        campus: contact.campus,
                        school: contact.school || undefined,
                        district: contact.district || undefined,
                      })}
                      className="p-2 rounded-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-400/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-indigo-500/40"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text={`In-Portal Message ${contact.name}`} position="bottom">
                    <button
                      onClick={() => handleOpenCommModal("MESSAGE", {
                        name: contact.name,
                        phone: contact.phone,
                        email: contact.email,
                        courseInterest: contact.courseInterest,
                        campus: contact.campus,
                        school: contact.school || undefined,
                        district: contact.district || undefined,
                      })}
                      className="p-2 rounded-full bg-teal-500/20 text-teal-300 hover:bg-teal-500 hover:text-white border border-teal-400/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-teal-500/40"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Edit Button */}
                  <Tooltip text={`Edit ${contact.name}`} position="bottom">
                    <button
                      onClick={() => setEditingContact(contact)}
                      className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white border border-sky-400/40 text-xs font-bold transition-all flex items-center gap-1 shadow-md transform hover:-translate-y-1 hover:scale-110 active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </Tooltip>

                  {/* Delete Button */}
                  <Tooltip text={`Delete ${contact.name}`} position="bottom">
                    <button
                      onClick={() => handleDeleteContact(contact.id, contact.name)}
                      className="p-1.5 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 bubble-card">
            No contacts match the search or district filter.
          </div>
        )}
      </div>
      )}

      {/* ADD NEW CONTACT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050813]/90 backdrop-blur-xl animate-in fade-in">
          <div className="bubble-card w-full max-w-lg p-6 border border-white/30 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-sky-400" />
              Add New Candidate Contact
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter candidate phone number, school name, district, and address.
            </p>

            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Candidate Name *</label>
                <input
                  type="text"
                  required
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="e.g. S. Vignesh"
                  className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="candidate@gmail.com"
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Higher Secondary School</label>
                  <input
                    type="text"
                    value={newContact.school}
                    onChange={(e) => setNewContact({ ...newContact, school: e.target.value })}
                    placeholder="Govt HSS Karur / St. Joseph Coimbatore"
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">District</label>
                  <select
                    value={newContact.district}
                    onChange={(e) => setNewContact({ ...newContact, district: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {districts.filter(d => d !== "ALL").map((d) => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  placeholder="Street Address, City/Town, Pincode"
                  className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Preferred VSB Campus</label>
                  <select
                    value={newContact.campus}
                    onChange={(e) => setNewContact({ ...newContact, campus: e.target.value as CampusLocation })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="KARUR" className="bg-slate-900">KARUR CAMPUS</option>
                    <option value="COIMBATORE" className="bg-slate-900">COIMBATORE CAMPUS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Course Interest</label>
                  <select
                    value={newContact.courseInterest}
                    onChange={(e) => setNewContact({ ...newContact, courseInterest: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {VSB_DEPARTMENTS_COURSES.map((course) => (
                      <option key={course} value={course} className="bg-slate-900">
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-900 text-slate-300 text-xs font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glossy-btn px-5 py-2 text-xs font-bold"
                >
                  Save New Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CONTACT MODAL */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050813]/90 backdrop-blur-xl animate-in fade-in">
          <div className="bubble-card w-full max-w-lg p-6 border border-white/30 shadow-2xl relative">
            <button
              onClick={() => setEditingContact(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white flex items-center gap-2 mb-1">
              <Edit3 className="w-5 h-5 text-sky-400" />
              Edit Contact Record: {editingContact.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update phone number, school affiliation, district, and address.
            </p>

            <form onSubmit={handleUpdateContact} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingContact.email}
                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">School Name</label>
                  <input
                    type="text"
                    value={editingContact.school || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, school: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">District</label>
                  <select
                    value={editingContact.district || "Karur"}
                    onChange={(e) => setEditingContact({ ...editingContact, district: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {districts.filter(d => d !== "ALL").map((d) => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editingContact.address || ""}
                  onChange={(e) => setEditingContact({ ...editingContact, address: e.target.value })}
                  className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Campus</label>
                  <select
                    value={editingContact.campus}
                    onChange={(e) => setEditingContact({ ...editingContact, campus: e.target.value as CampusLocation })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="KARUR" className="bg-slate-900">KARUR CAMPUS</option>
                    <option value="COIMBATORE" className="bg-slate-900">COIMBATORE CAMPUS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Course Interest</label>
                  <select
                    value={editingContact.courseInterest}
                    onChange={(e) => setEditingContact({ ...editingContact, courseInterest: e.target.value })}
                    className="w-full bg-slate-950 border border-white/20 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {VSB_DEPARTMENTS_COURSES.map((course) => (
                      <option key={course} value={course} className="bg-slate-900">
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="px-4 py-2 rounded-full bg-slate-900 text-slate-300 text-xs font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glossy-btn px-5 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
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
