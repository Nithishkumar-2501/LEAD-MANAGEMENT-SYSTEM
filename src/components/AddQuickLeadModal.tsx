"use client";

import { useState } from "react";
import { X, Mail, Phone, AlertCircle, Share2, GraduationCap, CheckCircle2 } from "lucide-react";
import { Lead, Application, CampusLocation, VSB_DEPARTMENTS_COURSES } from "@/types/crm";
import { TAMIL_NADU_DISTRICTS } from "@/lib/mockData";
import { saveStudentToFirebase } from "@/lib/firebaseSync";
import { validateLeadPhoneNumber, extractRaw10Digits } from "@/lib/phoneValidation";
import { mobileSafeFetch } from "@/lib/mobileFetch";
import { evaluateLeadQuota } from "@/lib/leadQuotaService";
import LeadPaymentQrModal from "@/components/LeadPaymentQrModal";
import { getCreatorQrSettings, LeadQrPaymentRecord } from "@/lib/leadPaymentQrService";

interface AddQuickLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: (newLead: Lead & { application: Application }) => void;
  existingLeads?: Lead[];
  loggedInUsername?: string;
}

export default function AddQuickLeadModal({
  isOpen,
  onClose,
  onLeadAdded,
  existingLeads = [],
  loggedInUsername = "Admin",
}: AddQuickLeadModalProps) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [pendingSaveAndNew, setPendingSaveAndNew] = useState(false);
  const [activeTab, setActiveTab] = useState<"LEAD" | "ADDITIONAL" | "FACEBOOK">("LEAD");
  const [uploadVia, setUploadVia] = useState<"EMAIL" | "MOBILE">("EMAIL");
  const [error, setError] = useState<string | null>(null);
  const quotaEval = evaluateLeadQuota(existingLeads.length, 1);

  const [formData, setFormData] = useState({
    // Core Lead Details
    formInterested: VSB_DEPARTMENTS_COURSES[0],
    name: "",
    email: "",
    gender: "Male",
    phone: "",
    state: "Tamil Nadu",
    city: "Karur",

    // Additional Details
    fatherName: "",
    motherName: "",
    bloodGroup: "O+",
    physicallyDisabled: "No",
    community: "BC",
    address: "",
    school: "",
    marks10th: "85",
    marks12th: "88",
    tneaCutoff: "178.5",

    // Facebook / Social Details
    fbLeadId: `fb_lead_${Date.now().toString().slice(-6)}`,
    fbCampaign: "VSB_Admissions_2026_TN_Engineering",
    fbAdSet: "TN_Higher_Secondary_Aspirants_Direct",
    fbAdName: "BTech_AI_Admissions_Banner_2026",
    fbFormName: "Direct_Admission_Form_2026",
    fbPageName: "V.S.B. Engineering College Official",
    fbPlatform: "Meta Ads (Facebook & Instagram)",
  });

  if (!isOpen) return null;

  const handleSubmit = async (saveAndNew: boolean = false) => {
    setError(null);

    // 1. Validate Name
    if (!formData.name.trim()) {
      setError("Please enter Candidate Name.");
      setActiveTab("LEAD");
      return;
    }

    // 2. Validate based on UPLOAD VIA mode
    if (uploadVia === "EMAIL") {
      if (!formData.email.trim()) {
        setError("Please enter Email Address for Email upload.");
        setActiveTab("LEAD");
        return;
      }
      if (formData.phone.trim()) {
        const phoneErr = validateLeadPhoneNumber(formData.phone, existingLeads);
        if (phoneErr) {
          setError(phoneErr);
          setActiveTab("LEAD");
          return;
        }
      }
    } else {
      // MOBILE mode
      if (!formData.phone.trim()) {
        setError("Please enter WhatsApp / Mobile Number for Mobile upload.");
        setActiveTab("LEAD");
        return;
      }
      const phoneErr = validateLeadPhoneNumber(formData.phone, existingLeads);
      if (phoneErr) {
        setError(phoneErr);
        setActiveTab("LEAD");
        return;
      }
    }

    // 3. Check if Creator has mandated QR Payment before submitting candidate lead to Firebase
    const qrSettings = getCreatorQrSettings();
    if (qrSettings.isPaymentRequired) {
      setPendingSaveAndNew(saveAndNew);
      setIsQrModalOpen(true);
      return;
    }

    await executeSaveLead(saveAndNew);
  };

  const executeSaveLead = async (saveAndNew: boolean = false, paymentRecord?: LeadQrPaymentRecord) => {
    const rawPhoneDigits = formData.phone.trim()
      ? extractRaw10Digits(formData.phone)
      : "9876543210";

    const finalEmail = formData.email.trim()
      ? formData.email.trim()
      : `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, "") || "student"}${Date.now().toString().slice(-4)}@student.vsb.ac.in`;

    const finalSource = activeTab === "FACEBOOK"
      ? "Facebook Ads"
      : uploadVia === "MOBILE"
      ? "Quick Lead (Mobile)"
      : "Quick Lead (Email)";

    let savedLead: Lead & { application: Application };

    try {
      const res = await mobileSafeFetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: finalEmail,
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
          source: finalSource,
          courseInterest: formData.formInterested,
          campus: "KARUR",
          marks10th: Number(formData.marks10th) || 85,
          marks12th: Number(formData.marks12th) || 88,
          tneaCutoff: Number(formData.tneaCutoff) || 178.5,
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
    } catch {
      savedLead = {
        id: `lead_quick_${Date.now()}`,
        name: formData.name,
        email: finalEmail,
        phone: `+91-${rawPhoneDigits}`,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        bloodGroup: formData.bloodGroup,
        physicallyDisabled: formData.physicallyDisabled,
        community: formData.community,
        address: formData.address,
        school: formData.school,
        source: finalSource,
        courseInterest: formData.formInterested,
        campus: "KARUR" as CampusLocation,
        state: formData.state,
        district: formData.city,
        gender: formData.gender,
        tneaCutoff: Number(formData.tneaCutoff) || 178.5,
        status: "NEW",
        createdAt: new Date().toISOString(),
        application: {
          id: `app_quick_${Date.now()}`,
          leadId: `lead_quick_${Date.now()}`,
          stage: "INQUIRY",
          marks10th: Number(formData.marks10th) || 85,
          marks12th: Number(formData.marks12th) || 88,
          paymentStatus: paymentRecord ? "PAID" : "PENDING",
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
    setIsQrModalOpen(false);

    if (saveAndNew) {
      setFormData({
        formInterested: VSB_DEPARTMENTS_COURSES[0],
        name: "",
        email: "",
        gender: "Male",
        phone: "",
        state: "Tamil Nadu",
        city: "Karur",
        fatherName: "",
        motherName: "",
        bloodGroup: "O+",
        physicallyDisabled: "No",
        community: "BC",
        address: "",
        school: "",
        marks10th: "85",
        marks12th: "88",
        tneaCutoff: "178.5",
        fbLeadId: `fb_lead_${Date.now().toString().slice(-6)}`,
        fbCampaign: "VSB_Admissions_2026_TN_Engineering",
        fbAdSet: "TN_Higher_Secondary_Aspirants_Direct",
        fbAdName: "BTech_AI_Admissions_Banner_2026",
        fbFormName: "Direct_Admission_Form_2026",
        fbPageName: "V.S.B. Engineering College Official",
        fbPlatform: "Meta Ads (Facebook & Instagram)",
      });
      setError(null);
      setActiveTab("LEAD");
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200 dark:border-white/10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div>
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Quick Lead</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quota Limit Reached Banner */}
          {quotaEval.isLimitReached && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/50 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>1,00,000 Free Lead Quota reached. Submitting will prompt for ₹500 overage surcharge (billed to Annual Renewal).</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shrink-0">
                ₹500 / lead
              </span>
            </div>
          )}

          {/* Validation Error Banner */}
          {error && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Sub-tabs Navigation */}
          <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("LEAD")}
              className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                activeTab === "LEAD"
                  ? "border-sky-600 text-sky-600 bg-white dark:bg-slate-950 font-extrabold shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
              }`}
            >
              Lead Details *
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ADDITIONAL")}
              className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                activeTab === "ADDITIONAL"
                  ? "border-sky-600 text-sky-600 bg-white dark:bg-slate-950 font-extrabold shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
              }`}
            >
              Additional Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("FACEBOOK")}
              className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                activeTab === "FACEBOOK"
                  ? "border-sky-600 text-sky-600 bg-white dark:bg-slate-950 font-extrabold shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
              }`}
            >
              Facebook Details
            </button>
          </div>

          {/* Body Form */}
          <div className="p-5 space-y-4">
            {/* ======================================================== */}
            {/* TAB 1: LEAD DETAILS                                      */}
            {/* ======================================================== */}
            {activeTab === "LEAD" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Upload Via */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    UPLOAD VIA
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadVia("EMAIL")}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        uploadVia === "EMAIL"
                          ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500/20 shadow-2xs"
                          : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20"
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>EMAIL</span>
                      {uploadVia === "EMAIL" && (
                        <CheckCircle2 className="w-3 h-3 text-sky-600 dark:text-sky-400 ml-0.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadVia("MOBILE")}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        uploadVia === "MOBILE"
                          ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500/20 shadow-2xs"
                          : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>MOBILE</span>
                      {uploadVia === "MOBILE" && (
                        <CheckCircle2 className="w-3 h-3 text-sky-600 dark:text-sky-400 ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mode Indicator Hint */}
                <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40 text-[11px] text-sky-700 dark:text-sky-300 font-semibold flex items-center gap-1.5">
                  {uploadVia === "EMAIL" ? (
                    <>
                      <Mail className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                      <span>Email Mode: <strong>Email Address *</strong> is primary and required.</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                      <span>Mobile Mode: <strong>WhatsApp / Mobile Number *</strong> is primary and required.</span>
                    </>
                  )}
                </div>

                {/* Choose Form Interested In */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Choose Form Interested In
                  </label>
                  <select
                    value={formData.formInterested}
                    onChange={(e) => setFormData({ ...formData, formInterested: e.target.value as any })}
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {VSB_DEPARTMENTS_COURSES.map((course) => (
                      <option key={course} value={course} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enter Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Candidate Full Name"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* If EMAIL MODE: Email is Primary, Mobile is Secondary */}
                {uploadVia === "EMAIL" ? (
                  <>
                    {/* Enter Email Address (Primary Required) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Enter Email Address * <span className="text-[10px] text-sky-600 font-bold">(Required)</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="candidate.email@gmail.com"
                        className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    {/* Enter WhatsApp Number (Secondary) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Enter WhatsApp Number <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="flex items-center border border-slate-300 dark:border-white/15 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-xs font-mono text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-white/15">
                          +91
                        </span>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="9876543210"
                          className="w-full p-2.5 text-xs text-slate-900 dark:text-white bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* If MOBILE MODE: Mobile is Primary, Email is Secondary */}
                    {/* Enter WhatsApp / Mobile Number (Primary Required) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Enter WhatsApp / Mobile Number * <span className="text-[10px] text-sky-600 font-bold">(Required)</span>
                      </label>
                      <div className="flex items-center border border-slate-300 dark:border-white/15 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-xs font-mono text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-white/15">
                          +91
                        </span>
                        <input
                          type="text"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter 10-digit mobile number"
                          className="w-full p-2.5 text-xs text-slate-900 dark:text-white bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Enter Email Address (Secondary) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Enter Email Address <span className="text-[10px] text-slate-400 font-normal">(Optional in Mobile mode)</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="candidate.email@gmail.com (Optional)"
                        className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </>
                )}

                {/* Select Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Select State */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select State *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                  </select>
                </div>

                {/* Select City / District */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select District / City *
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 max-h-48"
                  >
                    {TAMIL_NADU_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Next Step Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ADDITIONAL")}
                    className="w-full py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-300 dark:border-white/10"
                  >
                    <span>Continue to Additional Details</span>
                    <span className="text-sky-600 dark:text-sky-400 font-extrabold">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: ADDITIONAL DETAILS                                */}
            {/* ======================================================== */}
            {activeTab === "ADDITIONAL" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span>Personal, Parent, & Academic Background Information</span>
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {"Father's Name"}
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    placeholder="Father's Full Name"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Mother's Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {"Mother's Name"}
                  </label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    placeholder="Mother's Full Name"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Physically Disabled
                  </label>
                  <select
                    value={formData.physicallyDisabled}
                    onChange={(e) => setFormData({ ...formData, physicallyDisabled: e.target.value })}
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* Community Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Community Category (BC, MBC, SC, ST) *
                  </label>
                  <select
                    value={formData.community}
                    onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-sky-700 dark:text-sky-300 font-bold bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Home Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full Residential Address"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* School Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    placeholder="Higher Sec School Name"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Academic Marks Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      10th Marks (%)
                    </label>
                    <input
                      type="number"
                      value={formData.marks10th}
                      onChange={(e) => setFormData({ ...formData, marks10th: e.target.value })}
                      placeholder="85"
                      className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      12th Marks (%)
                    </label>
                    <input
                      type="number"
                      value={formData.marks12th}
                      onChange={(e) => setFormData({ ...formData, marks12th: e.target.value })}
                      placeholder="88"
                      className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      TNEA Cutoff
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.tneaCutoff}
                      onChange={(e) => setFormData({ ...formData, tneaCutoff: e.target.value })}
                      placeholder="178.5"
                      className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                </div>

                {/* Back / Next Navigation */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("LEAD")}
                    className="flex-1 py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-300 dark:border-white/10"
                  >
                    ← Back to Lead Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("FACEBOOK")}
                    className="flex-1 py-2.5 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center gap-1 border border-sky-300 dark:border-sky-800 transition-colors cursor-pointer"
                  >
                    Facebook Details →
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: FACEBOOK DETAILS                                  */}
            {/* ======================================================== */}
            {activeTab === "FACEBOOK" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>Meta / Facebook Lead Ads Attribution & Campaign Tracking</span>
                </div>

                {/* Facebook Lead ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Facebook / Meta Lead ID
                  </label>
                  <input
                    type="text"
                    value={formData.fbLeadId}
                    onChange={(e) => setFormData({ ...formData, fbLeadId: e.target.value })}
                    placeholder="fb_lead_987412"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-sky-700 dark:text-sky-300 font-mono bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Ad Campaign Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ad Campaign Name
                  </label>
                  <input
                    type="text"
                    value={formData.fbCampaign}
                    onChange={(e) => setFormData({ ...formData, fbCampaign: e.target.value })}
                    placeholder="VSB_Admissions_2026_TN_Engineering"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Adset Target Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Adset Target Group
                  </label>
                  <input
                    type="text"
                    value={formData.fbAdSet}
                    onChange={(e) => setFormData({ ...formData, fbAdSet: e.target.value })}
                    placeholder="TN_Higher_Secondary_Aspirants_Direct"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Ad Creative / Ad Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ad Creative Name / ID
                  </label>
                  <input
                    type="text"
                    value={formData.fbAdName}
                    onChange={(e) => setFormData({ ...formData, fbAdName: e.target.value })}
                    placeholder="BTech_AI_Admissions_Banner_2026"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Lead Form Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lead Form Name
                  </label>
                  <input
                    type="text"
                    value={formData.fbFormName}
                    onChange={(e) => setFormData({ ...formData, fbFormName: e.target.value })}
                    placeholder="Direct_Admission_Form_2026"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Facebook Page Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Facebook Page Name
                  </label>
                  <input
                    type="text"
                    value={formData.fbPageName}
                    onChange={(e) => setFormData({ ...formData, fbPageName: e.target.value })}
                    placeholder="V.S.B. Engineering College Official"
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Lead Generation Platform */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lead Generation Platform
                  </label>
                  <select
                    value={formData.fbPlatform}
                    onChange={(e) => setFormData({ ...formData, fbPlatform: e.target.value })}
                    className="w-full border border-slate-300 dark:border-white/15 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Meta Ads (Facebook & Instagram)">Meta Ads (Facebook & Instagram)</option>
                    <option value="Facebook Messenger">Facebook Messenger</option>
                    <option value="Instagram Direct">Instagram Direct</option>
                    <option value="Project Expo Social">Project Expo Social</option>
                  </select>
                </div>

                {/* Back Navigation Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ADDITIONAL")}
                    className="w-full py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-300 dark:border-white/10"
                  >
                    <span>← Back to Additional Details</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 rounded-lg border border-sky-600 text-xs font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
          >
            Save and Add new
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer active:scale-95"
          >
            Save
          </button>
        </div>
      </div>

      {/* Creator Payment QR Code Modal (Scan & Pay before adding to Firebase) */}
      {isQrModalOpen && (
        <LeadPaymentQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          candidateName={formData.name}
          candidatePhone={formData.phone}
          courseInterest={formData.formInterested}
          campus="KARUR"
          submittedBy={loggedInUsername || "Admin"}
          onPaymentVerified={async (record) => {
            await executeSaveLead(pendingSaveAndNew, record);
          }}
        />
      )}
    </div>
  );
}

