"use client";

import { useState } from "react";
import { X, Mail, Phone, AlertCircle } from "lucide-react";
import { Lead, Application, CampusLocation, VSB_DEPARTMENTS_COURSES } from "@/types/crm";
import { TAMIL_NADU_DISTRICTS } from "@/lib/mockData";
import { saveStudentToFirebase } from "@/lib/firebaseSync";
import { validateLeadPhoneNumber, extractRaw10Digits } from "@/lib/phoneValidation";

interface AddQuickLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: (newLead: Lead & { application: Application }) => void;
  existingLeads?: Lead[];
}

export default function AddQuickLeadModal({
  isOpen,
  onClose,
  onLeadAdded,
  existingLeads = [],
}: AddQuickLeadModalProps) {
  const [activeTab, setActiveTab] = useState<"LEAD" | "ADDITIONAL" | "FACEBOOK">("LEAD");
  const [uploadVia, setUploadVia] = useState<"EMAIL" | "MOBILE">("EMAIL");
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    formInterested: VSB_DEPARTMENTS_COURSES[0],
    name: "",
    email: "",
    gender: "Male",
    phone: "",
    fatherName: "",
    motherName: "",
    bloodGroup: "O+",
    physicallyDisabled: "No",
    community: "BC",
    address: "",
    school: "",
    state: "Tamil Nadu",
    city: "Salem",
  });

  if (!isOpen) return null;

  const handleSubmit = async (saveAndNew: boolean = false) => {
    setError(null);
    if (!formData.name || !formData.email) {
      setError("Please enter Name and Email Address.");
      return;
    }

    const phoneErr = validateLeadPhoneNumber(formData.phone, existingLeads);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }

    const rawPhoneDigits = extractRaw10Digits(formData.phone);

    let savedLead: Lead & { application: Application };

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: `+91 ${rawPhoneDigits}`,
          fatherName: formData.fatherName,
          motherName: formData.motherName,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          physicallyDisabled: formData.physicallyDisabled,
          community: formData.community,
          address: formData.address,
          school: formData.school,
          district: formData.city || "Karur",
          state: formData.state || "Tamil Nadu",
          source: "Quick Lead Entry",
          courseInterest: formData.formInterested,
          campus: "KARUR",
          marks10th: 85,
          marks12th: 88,
          stage: "INQUIRY",
        }),
      });

      const json = await res.json();
      if (res.ok && json.lead) {
        savedLead = json.lead;
      } else {
        throw new Error(json.error || "Failed to post to API");
      }
    } catch (apiErr) {
      savedLead = {
        id: `lead_quick_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: `+91-${rawPhoneDigits}`,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        bloodGroup: formData.bloodGroup,
        physicallyDisabled: formData.physicallyDisabled,
        community: formData.community,
        address: formData.address,
        school: formData.school,
        source: "Quick Lead Entry",
        courseInterest: formData.formInterested,
        campus: "KARUR" as CampusLocation,
        state: formData.state,
        district: formData.city,
        gender: formData.gender,
        status: "NEW",
        createdAt: new Date().toISOString(),
        application: {
          id: `app_quick_${Date.now()}`,
          leadId: `lead_quick_${Date.now()}`,
          stage: "INQUIRY",
          marks10th: 85,
          marks12th: 88,
          paymentStatus: "PENDING",
        },
      };
    }

    // Real-time Firebase Database update
    try {
      await saveStudentToFirebase(savedLead);
      console.log(`🔥 Successfully saved lead ${savedLead.name} to Firebase`);
    } catch (e) {
      console.error("Firebase save error in modal:", e);
    }

    onLeadAdded(savedLead);

    if (saveAndNew) {
      setFormData({
        formInterested: VSB_DEPARTMENTS_COURSES[0],
        name: "",
        email: "",
        gender: "Male",
        phone: "",
        fatherName: "",
        motherName: "",
        bloodGroup: "O+",
        physicallyDisabled: "No",
        community: "BC",
        address: "",
        school: "",
        state: "Tamil Nadu",
        city: "Salem",
      });
      setError(null);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-950 text-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-white/10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div>
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900">
            <h3 className="text-base font-extrabold text-white">Add Quick Lead</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Validation Error Banner */}
          {error && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex border-b border-white/10 bg-slate-900/90 text-xs font-bold">
            <button
              onClick={() => setActiveTab("LEAD")}
              className={`flex-1 py-2.5 text-center border-b-2 ${
                activeTab === "LEAD"
                  ? "border-sky-600 text-sky-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Lead Details *
            </button>
            <button
              onClick={() => setActiveTab("ADDITIONAL")}
              className={`flex-1 py-2.5 text-center border-b-2 ${
                activeTab === "ADDITIONAL"
                  ? "border-sky-600 text-sky-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Additional Details
            </button>
            <button
              onClick={() => setActiveTab("FACEBOOK")}
              className={`flex-1 py-2.5 text-center border-b-2 ${
                activeTab === "FACEBOOK"
                  ? "border-sky-600 text-sky-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Facebook Details
            </button>
          </div>

          {/* Body Form */}
          <div className="p-5 space-y-4">
            {/* Upload Via */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                UPLOAD VIA
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUploadVia("EMAIL")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    uploadVia === "EMAIL"
                      ? "border-sky-500 bg-sky-50 text-sky-600 shadow-sm"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> EMAIL
                </button>
                <button
                  type="button"
                  onClick={() => setUploadVia("MOBILE")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    uploadVia === "MOBILE"
                      ? "border-sky-500 bg-sky-50 text-sky-600 shadow-sm"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> MOBILE
                </button>
              </div>
            </div>

            {/* Choose Form Interested In */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Choose Form Interested In
              </label>
              <select
                value={formData.formInterested}
                onChange={(e) => setFormData({ ...formData, formInterested: e.target.value as any })}
                className="w-full border border-white/15 rounded-lg p-2.5 text-xs text-white bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {VSB_DEPARTMENTS_COURSES.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            {/* Enter Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Enter Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email Address"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Father's Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {"Father's Name"}
              </label>
              <input
                type="text"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                placeholder="Father's Full Name"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Mother's Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {"Mother's Name"}
              </label>
              <input
                type="text"
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                placeholder="Mother's Full Name"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Select Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full border border-white/15 rounded-lg p-2.5 text-xs text-white bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full border border-white/15 rounded-lg p-2.5 text-xs text-white bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            {/* Physically Disabled */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physically Disabled
              </label>
              <select
                value={formData.physicallyDisabled}
                onChange={(e) => setFormData({ ...formData, physicallyDisabled: e.target.value })}
                className="w-full border border-white/15 rounded-lg p-2.5 text-xs text-white bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Community Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Community Category (BC, MBC, SC, ST) *
              </label>
              <select
                value={formData.community}
                onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-sky-700 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="BC">BC (Backward Class)</option>
                <option value="BCM">BCM (BC Muslim)</option>
                <option value="MBC">MBC / DNC</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="SCA">SC (Arunthathiyar)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="OC">OC (Open Competition)</option>
              </select>
            </div>

            {/* Home Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Home Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full Residential Address"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* School Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Name
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="Higher Sec School Name"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Enter WhatsApp Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter WhatsApp Number *
              </label>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                <span className="bg-slate-100 px-3 py-2.5 text-xs font-mono text-slate-500 border-r">
                  +91
                </span>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter WhatsApp Number"
                  className="w-full p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Select State */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select State *
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border border-white/15 rounded-lg p-2.5 text-xs text-white bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Kerala">Kerala</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>

            {/* Select City / District */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select District / City *
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-white/15 rounded-lg p-2.5 text-xs text-white bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 max-h-48"
              >
                {TAMIL_NADU_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist} className="bg-slate-900 text-white">
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 rounded-lg border border-sky-600 text-xs font-bold text-sky-600 hover:bg-sky-50 transition-colors"
          >
            Save and Add new
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
