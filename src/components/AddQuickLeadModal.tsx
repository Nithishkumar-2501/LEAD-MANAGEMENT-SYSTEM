"use client";

import { useState } from "react";
import { X, Mail, Phone, AlertCircle } from "lucide-react";
import { Lead, Application, CampusLocation, VSB_DEPARTMENTS_COURSES } from "@/types/crm";
import { TAMIL_NADU_DISTRICTS } from "@/lib/mockData";
import { saveStudentToFirebase } from "@/lib/firebaseSync";
import { validateLeadPhoneNumber, extractRaw10Digits } from "@/lib/phoneValidation";
import { mobileSafeFetch } from "@/lib/mobileFetch";

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
    city: "Karur",
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
      const res = await mobileSafeFetch("/api/applications", {
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

      if (res) {
        const json = await res.json();
        if (res.ok && json.lead) {
          savedLead = json.lead;
        } else {
          throw new Error(json.error || "Failed to post to API");
        }
      } else {
        throw new Error("Mobile mode — skip API");
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
          marks10th: 0,
          marks12th: 0,
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
        city: "Karur",
      });
      setError(null);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-obsidian/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-graphite w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-fog animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div>
          <div className="p-5 border-b border-fog flex items-center justify-between bg-white">
            <h3 className="text-base font-semibold text-obsidian">Add Quick Lead</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-button hover:bg-paper text-steel hover:text-obsidian transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Validation Error Banner */}
          {error && (
            <div className="mx-4 mt-3 p-3 rounded-button bg-mist border border-fog text-ember text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-ember" />
              <span>{error}</span>
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex border-b border-fog bg-white text-xs font-medium">
            <button
              onClick={() => setActiveTab("LEAD")}
              className={`flex-1 py-3 text-center border-b-2 transition-all ${
                activeTab === "LEAD"
                  ? "border-obsidian text-obsidian font-semibold"
                  : "border-transparent text-steel hover:text-graphite"
              }`}
            >
              Lead Details *
            </button>
            <button
              onClick={() => setActiveTab("ADDITIONAL")}
              className={`flex-1 py-3 text-center border-b-2 transition-all ${
                activeTab === "ADDITIONAL"
                  ? "border-obsidian text-obsidian font-semibold"
                  : "border-transparent text-steel hover:text-graphite"
              }`}
            >
              Additional
            </button>
            <button
              onClick={() => setActiveTab("FACEBOOK")}
              className={`flex-1 py-3 text-center border-b-2 transition-all ${
                activeTab === "FACEBOOK"
                  ? "border-obsidian text-obsidian font-semibold"
                  : "border-transparent text-steel hover:text-graphite"
              }`}
            >
              Campaign / Social
            </button>
          </div>

          {/* Body Form */}
          <div className="p-5 space-y-4">
            {/* Upload Via */}
            <div>
              <label className="block text-[11px] font-semibold text-steel uppercase tracking-wider mb-1.5">
                UPLOAD VIA
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUploadVia("EMAIL")}
                  className={`flex-1 py-2 px-3 rounded-button text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    uploadVia === "EMAIL"
                      ? "border-obsidian bg-obsidian text-white shadow-sm"
                      : "border-fog bg-paper text-graphite hover:border-steel"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> EMAIL
                </button>
                <button
                  type="button"
                  onClick={() => setUploadVia("MOBILE")}
                  className={`flex-1 py-2 px-3 rounded-button text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    uploadVia === "MOBILE"
                      ? "border-obsidian bg-obsidian text-white shadow-sm"
                      : "border-fog bg-paper text-graphite hover:border-steel"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> MOBILE
                </button>
              </div>
            </div>

            {/* Choose Form Interested In */}
            <div>
              <label className="block text-xs font-medium text-steel mb-1">
                Choose Form Interested In
              </label>
              <select
                value={formData.formInterested}
                onChange={(e) => setFormData({ ...formData, formInterested: e.target.value as any })}
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper focus:bg-white focus:outline-none focus:border-obsidian transition-all"
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
              <label className="block text-xs font-medium text-steel mb-1">
                Enter Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name"
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper placeholder-steel focus:bg-white focus:outline-none focus:border-obsidian transition-all"
              />
            </div>

            {/* Enter Email Address */}
            <div>
              <label className="block text-xs font-medium text-steel mb-1">
                Enter Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email Address"
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper placeholder-steel focus:bg-white focus:outline-none focus:border-obsidian transition-all"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-medium text-steel mb-1">
                Contact Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper placeholder-steel focus:bg-white focus:outline-none focus:border-obsidian transition-all"
              />
            </div>

            {/* Father's Name */}
            <div>
              <label className="block text-xs font-medium text-steel mb-1">
                {"Father's Name"}
              </label>
              <input
                type="text"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                placeholder="Father's Full Name"
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper placeholder-steel focus:bg-white focus:outline-none focus:border-obsidian transition-all"
              />
            </div>

            {/* Mother's Name */}
            <div>
              <label className="block text-xs font-medium text-steel mb-1">
                {"Mother's Name"}
              </label>
              <input
                type="text"
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                placeholder="Mother's Full Name"
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper placeholder-steel focus:bg-white focus:outline-none focus:border-obsidian transition-all"
              />
            </div>

            {/* Select Gender */}
            <div>
              <label className="block text-xs font-medium text-steel mb-1">
                Select Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper focus:bg-white focus:outline-none focus:border-obsidian transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-medium text-steel mb-1">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper focus:bg-white focus:outline-none focus:border-obsidian transition-all"
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            {/* Community */}
            <div>
              <label className="block text-xs font-medium text-steel mb-1">
                Community
              </label>
              <select
                value={formData.community}
                onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper focus:bg-white focus:outline-none focus:border-obsidian transition-all"
              >
                {["OC", "BC", "BCM", "MBC/DNC", "SC", "SCA", "ST"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Select State */}
            <div>
              <label className="block text-xs font-medium text-steel mb-1">
                Select State *
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper focus:bg-white focus:outline-none focus:border-obsidian transition-all"
              >
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Kerala">Kerala</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>

            {/* Select City / District */}
            <div>
              <label className="block text-xs font-medium text-steel mb-1">
                Select District / City *
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-fog rounded-button p-2.5 text-xs text-obsidian bg-paper focus:bg-white focus:outline-none focus:border-obsidian transition-all max-h-48"
              >
                {TAMIL_NADU_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-fog bg-paper flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-button border border-fog bg-white text-xs font-medium text-graphite hover:text-obsidian hover:border-steel transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 rounded-button border border-fog bg-white text-xs font-medium text-obsidian hover:bg-mist transition-all"
          >
            Save and Add new
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 rounded-button bg-obsidian hover:bg-black text-white text-xs font-medium shadow-sm transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
