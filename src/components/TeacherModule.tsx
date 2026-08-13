"use client";

import { useState, useEffect } from "react";
import { Teacher, CampusLocation, VSB_DEPARTMENTS_COURSES } from "@/types/crm";
import { MOCK_TEACHERS } from "@/lib/mockData";
import { UserCheck, BookOpen, GraduationCap, Mail, Phone, Plus, Search, CheckCircle2, Award, Edit3, Save, X } from "lucide-react";

interface TeacherModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  currentUserRole: "ADMIN" | "TEACHER";
  onTriggerToast: (msg: string) => void;
}

export default function TeacherModule({ loggedInCampus, currentUserRole, onTriggerToast }: TeacherModuleProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

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
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.coursesAssigned.some((c) => c.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = selectedDept === "ALL" || t.department === selectedDept;

    const matchesCampus = t.campus === loggedInCampus;

    return matchesSearch && matchesDept && matchesCampus;
  });

  const handleAddTeacher = (e: React.FormEvent) => {
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

    setTeachers([teacherToAdd, ...teachers]);
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
  };

  const handleUpdateTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    setTeachers((prev) =>
      prev.map((t) => (t.id === editingTeacher.id ? editingTeacher : t))
    );
    onTriggerToast(`🔑 Profile updated for faculty member ${editingTeacher.name}!`);
    setEditingTeacher(null);
  };

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

            {currentUserRole === "ADMIN" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:opacity-90"
              >
                <Plus className="w-4 h-4" /> Add Faculty
              </button>
            )}
          </div>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeachers.map((tch) => (
            <div
              key={tch.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {tch.avatar}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100">{tch.name}</h4>
                    <p className="text-xs text-indigo-400 font-medium">{tch.department}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    tch.status === "ACTIVE"
                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                      : "bg-amber-950 text-amber-400 border-amber-800"
                  }`}
                >
                  {tch.campus} CAMPUS
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Experience</span>
                  <span className="font-semibold text-slate-200">{tch.experienceYears} Years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="font-semibold text-slate-200">{tch.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-semibold text-slate-200">{tch.phone}</span>
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

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div>
                  {currentUserRole === "ADMIN" && (
                    <button
                      onClick={() => setEditingTeacher(tch)}
                      className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800/80"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Faculty
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onTriggerToast(`Sending email to ${tch.name}...`)}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-3 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/40"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button
                    onClick={() => onTriggerToast(`Calling ${tch.name}...`)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </button>
                </div>
              </div>
            </div>
          ))}
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

            <form onSubmit={handleUpdateTeacherSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Phone</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.phone}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Campus</label>
                  <select
                    value={editingTeacher.campus}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, campus: e.target.value as CampusLocation })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="KARUR">Karur Campus</option>
                    <option value="COIMBATORE">Coimbatore Campus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={editingTeacher.department}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, department: e.target.value })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    required
                    value={editingTeacher.experienceYears}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, experienceYears: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Course</label>
                  <select
                    value={editingTeacher.coursesAssigned[0] || VSB_DEPARTMENTS_COURSES[0]}
                    onChange={(e) => {
                      const courses = [...editingTeacher.coursesAssigned];
                      courses[0] = e.target.value;
                      setEditingTeacher({ ...editingTeacher, coursesAssigned: courses });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
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
    </div>
  );
}
