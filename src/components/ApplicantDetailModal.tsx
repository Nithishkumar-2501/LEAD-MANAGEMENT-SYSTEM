"use client";

import { useState, useEffect } from "react";
import { X, Phone, Mail, MessageSquare, Award, CheckCircle2, DollarSign, Calendar, BookOpen, Edit3, Save, Landmark } from "lucide-react";
import { Lead, Application, AppStage, VSB_DEPARTMENTS_COURSES } from "@/types/crm";
import Tooltip from "@/components/Tooltip";

interface ApplicantDetailModalProps {
  applicant: (Lead & { application: Application }) | null;
  currentUserRole: "ADMIN" | "TEACHER";
  onClose: () => void;
  onActionTrigger: (type: "CALL" | "EMAIL" | "WHATSAPP", name: string) => void;
  onSave?: (updated: Lead & { application: Application }) => void;
}

export default function ApplicantDetailModal({
  applicant,
  currentUserRole,
  onClose,
  onActionTrigger,
  onSave,
}: ApplicantDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<(Lead & { application: Application }) | null>(applicant);

  useEffect(() => {
    setFormData(applicant);
  }, [applicant]);

  if (!applicant || !formData) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    setIsEditing(false);
  };

  const app = formData.application;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border border-slate-700 shadow-2xl overflow-hidden text-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
              {formData.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{formData.name}</h3>
              <p className="text-xs text-indigo-400 font-medium">{formData.courseInterest}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-sky-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {isEditing ? (
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Profile Details (Editable by BOTH Admin and Teacher) */}
              <div className="space-y-3">
                <h4 className="text-sky-300 font-bold border-b border-slate-800 pb-1 uppercase tracking-wider text-[10px]">
                  Student Details (Editable)
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Student Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Course Interest</label>
                    <select
                      value={formData.courseInterest}
                      onChange={(e) => setFormData({ ...formData, courseInterest: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      {VSB_DEPARTMENTS_COURSES.map((course) => (
                        <option key={course} value={course} className="bg-slate-900">
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Mobile Phone</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Affiliated School</label>
                    <input
                      type="text"
                      value={formData.school || ""}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">District</label>
                    <input
                      type="text"
                      value={formData.district || ""}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Application Details (Editable ONLY by ADMIN, Disabled/Masked for TEACHER) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <h4 className="text-purple-300 font-bold uppercase tracking-wider text-[10px]">
                    Application Details {currentUserRole === "TEACHER" && "(Locked)"}
                  </h4>
                  {currentUserRole === "TEACHER" && (
                    <span className="text-[9px] bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded-full font-bold">
                      Admin Access Only
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">10th Marks (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={currentUserRole === "TEACHER"}
                      value={app.marks10th}
                      onChange={(e) => setFormData({
                        ...formData,
                        application: { ...app, marks10th: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">12th Marks (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={currentUserRole === "TEACHER"}
                      value={app.marks12th}
                      onChange={(e) => setFormData({
                        ...formData,
                        application: { ...app, marks12th: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Application Stage</label>
                    <select
                      disabled={currentUserRole === "TEACHER"}
                      value={app.stage}
                      onChange={(e) => setFormData({
                        ...formData,
                        application: { ...app, stage: e.target.value as AppStage }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white disabled:opacity-40"
                    >
                      <option value="INQUIRY">INQUIRY</option>
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="DOCS_VERIFIED">DOCS VERIFIED</option>
                      <option value="OFFER_ISSUED">OFFER ISSUED</option>
                      <option value="FEE_PAID">FEE PAID</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Payment Status</label>
                    <select
                      disabled={currentUserRole === "TEACHER"}
                      value={app.paymentStatus}
                      onChange={(e) => setFormData({
                        ...formData,
                        application: { ...app, paymentStatus: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white disabled:opacity-40"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Key Metrics grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">10th Grade</p>
                    <p className="text-xs font-bold text-slate-100">{app.marks10th}%</p>
                  </div>
                </div>
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">12th Grade</p>
                    <p className="text-xs font-bold text-slate-100">{app.marks12th}%</p>
                  </div>
                </div>
                <div className="bg-sky-950/60 p-3 rounded-xl border border-sky-500/40 flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-sky-300 uppercase font-bold">TNEA Cutoff</p>
                    <p className="text-xs font-extrabold text-white font-mono">{formData.tneaCutoff || 188.5} / 200</p>
                  </div>
                </div>
              </div>

              {/* Details list */}
              <div className="space-y-2.5 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> Email</span>
                  <span className="font-semibold text-slate-200">{formData.email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Phone</span>
                  <span className="font-semibold text-slate-200">{formData.phone}</span>
                </div>

                {/* TNEA Counselling Status */}
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-sky-400 font-bold flex items-center gap-1.5">🎓 TNEA Counselling</span>
                  {formData.appliedCounselling !== false ? (
                    <span className="font-extrabold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800 text-[11px]">
                      ✅ Applied ({formData.counsellingAppNo || "TNEA2026-61201"})
                    </span>
                  ) : (
                    <span className="font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded-md border border-amber-800 text-[11px]">
                      ⏳ Direct Management Intake
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">🏛️ Counselling Category</span>
                  <span className="font-semibold text-sky-300">{formData.counsellingCategory || "TNEA General Counselling"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-slate-400" /> Acquisition Source</span>
                  <span className="font-semibold text-indigo-300">{formData.source}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5 text-slate-400" /> Home Affiliation</span>
                  <span className="font-semibold text-amber-200 truncate max-w-[200px]" title={formData.school}>
                    {formData.school || "Govt HSS"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Lead Created</span>
                  <span className="font-semibold text-slate-200">{new Date(formData.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-400" /> Payment Status</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${app.paymentStatus === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                    {app.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Application Stage Banner */}
              <div className="bg-indigo-950/40 border border-indigo-800/60 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-300 font-medium">Application Stage</p>
                  <p className="text-sm font-bold text-white mt-0.5">{app.stage.replace('_', ' ')}</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-indigo-400" />
              </div>

              {/* Quick Action Buttons */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Contact Lead</p>
                <div className="grid grid-cols-3 gap-2">
                  <Tooltip text={`Call ${formData.name}`}>
                    <button
                      onClick={() => onActionTrigger("CALL", formData.name)}
                      className="w-full flex items-center justify-center gap-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 py-2 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </button>
                  </Tooltip>
                  <Tooltip text={`Email ${formData.name}`}>
                    <button
                      onClick={() => onActionTrigger("EMAIL", formData.name)}
                      className="w-full flex items-center justify-center gap-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 py-2 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                  </Tooltip>
                  <Tooltip text={`WhatsApp ${formData.name}`}>
                    <button
                      onClick={() => onActionTrigger("WHATSAPP", formData.name)}
                      className="w-full flex items-center justify-center gap-1.5 bg-teal-600/20 border border-teal-500/30 text-teal-300 hover:bg-teal-600/30 py-2 rounded-xl text-xs font-semibold transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                  </Tooltip>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
