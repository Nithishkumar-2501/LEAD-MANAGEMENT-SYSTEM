"use client";

import { useState } from "react";
import { X, UserPlus, Send } from "lucide-react";
import { Lead, Application, AppStage, CampusLocation, VSB_DEPARTMENTS_COURSES } from "@/types/crm";
import { saveStudentToFirebase } from "@/lib/firebaseSync";
import { validateLeadPhoneNumber } from "@/lib/phoneValidation";
import { mobileSafeFetch } from "@/lib/mobileFetch";

interface CreateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationCreated: (newLead: Lead & { application: Application }) => void;
  existingLeads?: Lead[];
}

export default function CreateApplicationModal({
  isOpen,
  onClose,
  onApplicationCreated,
  existingLeads = [],
}: CreateApplicationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    fatherName: "",
    motherName: "",
    gender: "Male",
    bloodGroup: "O+",
    physicallyDisabled: "No",
    community: "BC",
    address: "",
    school: "",
    courseInterest: VSB_DEPARTMENTS_COURSES[0] as string,
    campus: "KARUR" as CampusLocation,
    source: "TNEA Counselling",
    marks10th: 0,
    marks12th: 0,
    stage: "INQUIRY" as AppStage,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.name || !formData.email) {
      setError("Please provide applicant name and email address.");
      return;
    }

    const phoneErr = validateLeadPhoneNumber(formData.phone, existingLeads);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await mobileSafeFetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let createdLead: Lead & { application: Application };

      if (res) {
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Failed to create application");
        }
        createdLead = json.lead;
      } else {
        // Mobile mode: create lead locally
        const leadId = `lead_${Date.now()}`;
        createdLead = {
          ...formData,
          id: leadId,
          status: "NEW",
          createdAt: new Date().toISOString(),
          application: {
            id: `app_${leadId}`,
            leadId: leadId,
            stage: formData.stage || "INQUIRY",
            marks10th: formData.marks10th || 0,
            marks12th: formData.marks12th || 0,
            paymentStatus: "PENDING",
          },
        } as Lead & { application: Application };
      }

      // Real-time Firebase Database update
      try {
        await saveStudentToFirebase(createdLead);
      } catch (e) {
        console.error("Firebase save error in modal:", e);
      }

      onApplicationCreated(createdLead);
      setLoading(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong creating application.");
      setLoading(false);
    }
  };

  const sources = [
    "TNEA Counselling",
    "Website Direct Inquiry",
    "School Outreach Campaign",
    "Walk-in / Campus Visit",
    "Social Media Campaign",
    "Education Fair Expo",
    "Newspaper Ad",
  ];

  const stages: AppStage[] = ["INQUIRY", "SUBMITTED", "DOCS_VERIFIED", "OFFER_ISSUED", "FEE_PAID"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-obsidian/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-[36px] border border-fog shadow-sm overflow-hidden text-graphite relative my-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-fog flex items-center justify-between bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-paper border border-fog flex items-center justify-center text-obsidian shrink-0">
              <UserPlus className="w-4 h-4 text-obsidian" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-obsidian">Create New Application</h3>
              <p className="text-xs text-steel font-normal">Register student candidate for Karur or Coimbatore campus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-button text-steel hover:text-obsidian hover:bg-paper transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-button bg-mist border border-fog text-ember text-xs font-medium">
              {error}
            </div>
          )}

          {/* Student Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-steel mb-1">Applicant Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. S. Vignesh"
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian placeholder-steel focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-steel mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. vignesh.s@gmail.com"
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian placeholder-steel focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Parents & Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-steel mb-1">{"Father's Name"}</label>
              <input
                type="text"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                placeholder="Father's Full Name"
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian placeholder-steel focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-steel mb-1">{"Mother's Name"}</label>
              <input
                type="text"
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                placeholder="Mother's Full Name"
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian placeholder-steel focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-steel mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian placeholder-steel focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-steel mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-steel mb-1">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-steel mb-1">Community</label>
              <select
                value={formData.community}
                onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              >
                {["OC", "BC", "BCM", "MBC/DNC", "SC", "SCA", "ST"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-steel mb-1">Physically Challenged?</label>
              <select
                value={formData.physicallyDisabled}
                onChange={(e) => setFormData({ ...formData, physicallyDisabled: e.target.value })}
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          {/* Academic & Program Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-steel mb-1">Preferred Engineering Branch *</label>
              <select
                value={formData.courseInterest}
                onChange={(e) => setFormData({ ...formData, courseInterest: e.target.value })}
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              >
                {VSB_DEPARTMENTS_COURSES.map((course) => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-steel mb-1">Target Campus Location *</label>
              <select
                value={formData.campus}
                onChange={(e) => setFormData({ ...formData, campus: e.target.value as CampusLocation })}
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              >
                <option value="KARUR">VSB Engineering College (Karur)</option>
                <option value="COIMBATORE">VSB College of Engineering Technical Campus (Coimbatore)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-steel mb-1">Previous School / College Name</label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="e.g. Bharathi Higher Secondary School"
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian placeholder-steel focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-steel mb-1">Residential Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="City, District, State"
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian placeholder-steel focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Academic Cutoff Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-steel mb-1">10th Standard Marks (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.marks10th || ""}
                onChange={(e) => setFormData({ ...formData, marks10th: Number(e.target.value) })}
                placeholder="e.g. 88"
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian placeholder-steel focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-steel mb-1">12th Standard Marks (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.marks12th || ""}
                onChange={(e) => setFormData({ ...formData, marks12th: Number(e.target.value) })}
                placeholder="e.g. 92"
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian placeholder-steel focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-steel mb-1">Lead Acquisition Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              >
                {sources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-steel mb-1">Initial Application Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as AppStage })}
                className="w-full bg-paper border border-fog rounded-button px-3.5 py-2 text-xs text-obsidian focus:outline-none focus:border-obsidian focus:bg-white transition-all"
              >
                {stages.map((st) => (
                  <option key={st} value={st}>{st.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-fog flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-button text-graphite hover:text-obsidian border border-fog bg-white hover:bg-paper transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-medium rounded-button bg-obsidian hover:bg-black text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Registering..." : "Create Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
