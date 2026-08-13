"use client";

import { useState } from "react";
import { Lead, Application, CampusLocation, VSB_DEPARTMENTS_COURSES } from "@/types/crm";
import Tooltip from "@/components/Tooltip";
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
} from "lucide-react";

interface ContactDirectoryModuleProps {
  initialContacts: (Lead & { application?: Application | null })[];
  selectedCampus: CampusLocation;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onTriggerToast?: (msg: string) => void;
}

export default function ContactDirectoryModule({
  initialContacts,
  selectedCampus,
  onActionTrigger,
  onTriggerToast,
}: ContactDirectoryModuleProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");

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
  });

  // Edit Contact Modal State
  const [editingContact, setEditingContact] = useState<(Lead & { application?: Application | null }) | null>(null);

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

    return matchesSearch && matchesCampus && matchesDistrict;
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
      {/* Top Banner & Action Controls */}
      <div className="bubble-card p-4 sm:p-6 border border-white/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40">
              V.S.B. Contact Manager
            </span>
            <span className="text-xs text-slate-400">Directory & School Records</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-sky-400" />
            Candidate Contact Directory
          </h2>
          <p className="text-xs text-slate-300 font-medium">
            Manage phone numbers, school affiliations, district origins, and residential addresses for V.S.B. candidates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <input
            type="file"
            id="csv-file-upload"
            accept=".csv"
            className="hidden"
            onChange={handleCSVUpload}
          />
          <button
            onClick={() => document.getElementById("csv-file-upload")?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/20 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all shadow-md"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="glossy-btn flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Contact</span>
          </button>
        </div>
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

      {/* Search & District Filter Bar */}
      <div className="bubble-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search */}
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

          {/* District Filter Pills */}
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

      {/* Contact Cards Directory Grid */}
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
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-950 border border-white/20 text-sky-300 shrink-0 transform group-hover:scale-105 transition-transform">
                    {contact.campus || "KARUR"}
                  </span>
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

                  {/* Full Address */}
                  {contact.address && (
                    <div className="text-[11px] text-slate-400 pl-5.5 italic truncate" title={showAddress ? contact.address : "Address Hidden"}>
                      {showAddress ? contact.address : "•••••••••••••"}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Edit, Call, Email, WhatsApp, Delete */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <Tooltip text={`Call ${contact.name}`}>
                    <button
                      onClick={() => onActionTrigger("CALL", contact.name)}
                      className="p-2 rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-400/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-emerald-500/40"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text={`Email ${contact.name}`}>
                    <button
                      onClick={() => onActionTrigger("EMAIL", contact.name)}
                      className="p-2 rounded-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-400/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-indigo-500/40"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text={`WhatsApp ${contact.name}`}>
                    <button
                      onClick={() => onActionTrigger("WHATSAPP", contact.name)}
                      className="p-2 rounded-full bg-teal-500/20 text-teal-300 hover:bg-teal-500 hover:text-white border border-teal-400/40 transition-all shadow-md transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-teal-500/40"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Edit Button */}
                  <Tooltip text={`Edit ${contact.name}`}>
                    <button
                      onClick={() => setEditingContact(contact)}
                      className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white border border-sky-400/40 text-xs font-bold transition-all flex items-center gap-1 shadow-md transform hover:-translate-y-1 hover:scale-110 active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </Tooltip>

                  {/* Delete Button */}
                  <Tooltip text={`Delete ${contact.name}`}>
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
    </div>
  );
}
