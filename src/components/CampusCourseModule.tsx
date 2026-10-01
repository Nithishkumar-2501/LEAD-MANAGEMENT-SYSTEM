"use client";

import { useState, useEffect } from "react";
import { CampusLocation, CourseProgram } from "@/types/crm";
import {
  Building2,
  GraduationCap,
  MapPin,
  CheckCircle2,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Cpu,
  Brain,
  Radio,
  ShieldAlert,
  Wrench,
  Zap,
  Trash2,
  X,
  BookOpen,
  Users,
  Award,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  Save,
  Loader2,
} from "lucide-react";
import { FaBookmark } from "react-icons/fa6";
import { colorVariants } from "@/components/ui/blog-card";
import { cn } from "@/lib/utils";
import {
  fetchCoursesFromFirebase,
  saveCourseToFirebase,
  deleteCourseFromFirebase,
  DEFAULT_COURSES,
} from "@/lib/firebaseSync";

interface CampusCourseModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  onTriggerToast: (msg: string) => void;
  onApplyCourse?: (courseName: string, campus: "KARUR" | "COIMBATORE") => void;
}

export default function CampusCourseModule({
  loggedInCampus,
  onTriggerToast,
  onApplyCourse,
}: CampusCourseModuleProps) {
  const [courses, setCourses] = useState<CourseProgram[]>(DEFAULT_COURSES);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarkedCourses, setBookmarkedCourses] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("vsb_saved_courses");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return ["CSE-101", "AIDS-102"];
  });

  // Modals state
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<CourseProgram | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for adding program
  const [newProgram, setNewProgram] = useState<CourseProgram>({
    code: "",
    name: "",
    dept: "Computer Science",
    hod: "",
    karurSeats: 120,
    coimbatoreSeats: 120,
    tuitionFee: "₹85,000 / Year",
    nbaAccredited: true,
    meta: "4 Years • Full-Time Degree",
    description: "",
    eligibility: "10+2 with PCM (Physics, Chemistry, Maths)",
    syllabus: ["Data Structures & Algorithms", "Computer Networks", "Cloud Computing"],
    careerRoles: ["Software Engineer", "Systems Architect"],
  });

  // Load courses live from Firebase
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchCoursesFromFirebase();
        if (isMounted && data && data.length > 0) {
          setCourses(data);
        }
      } catch (e) {
        console.warn("Error loading courses:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleBookmark = (code: string, name: string) => {
    setBookmarkedCourses((prev) => {
      const exists = prev.includes(code);
      let updated: string[];
      if (exists) {
        onTriggerToast(`Removed ${code} from saved favorites`);
        updated = prev.filter((c) => c !== code);
      } else {
        onTriggerToast(`Saved ${name} (${code}) to favorites`);
        updated = [...prev, code];
      }
      try {
        localStorage.setItem("vsb_saved_courses", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgram.code.trim() || !newProgram.name.trim()) {
      onTriggerToast("⚠️ Please provide Course Code and Degree Name.");
      return;
    }

    setIsSaving(true);
    try {
      const formattedCode = newProgram.code.toUpperCase().trim();
      const payload: CourseProgram = {
        ...newProgram,
        code: formattedCode,
      };

      const success = await saveCourseToFirebase(payload);
      if (success) {
        setCourses((prev) => [payload, ...prev.filter((c) => c.code !== payload.code)]);
        onTriggerToast(`🔥 Academic Program ${payload.name} (${payload.code}) saved to Firebase!`);
        setIsAddModalOpen(false);
        setNewProgram({
          code: "",
          name: "",
          dept: "Computer Science",
          hod: "",
          karurSeats: 120,
          coimbatoreSeats: 120,
          tuitionFee: "₹85,000 / Year",
          nbaAccredited: true,
          meta: "4 Years • Full-Time Degree",
          description: "",
          eligibility: "10+2 with PCM (Physics, Chemistry, Maths)",
          syllabus: ["Data Structures & Algorithms", "Computer Networks", "Cloud Computing"],
          careerRoles: ["Software Engineer", "Systems Architect"],
        });
      } else {
        onTriggerToast("❌ Failed to save program to Firebase.");
      }
    } catch (err) {
      onTriggerToast("❌ Error saving academic program.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProgram = async (code: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name} (${code}) from Firebase?`)) return;
    try {
      await deleteCourseFromFirebase(code);
      setCourses((prev) => prev.filter((c) => c.code !== code));
      onTriggerToast(`🗑️ Deleted program ${code} from Firebase.`);
      if (selectedCourseDetail?.code === code) {
        setSelectedCourseDetail(null);
      }
    } catch (e) {
      onTriggerToast("❌ Failed to delete program.");
    }
  };

  const getCourseIcon = (code: string) => {
    if (code.includes("CSE")) return Cpu;
    if (code.includes("AI")) return Brain;
    if (code.includes("ECE")) return Radio;
    if (code.includes("CY") || code.includes("SEC")) return ShieldAlert;
    if (code.includes("MECH")) return Wrench;
    if (code.includes("EEE")) return Zap;
    return GraduationCap;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Campuses Summary Banner */}
      <div className="grid grid-cols-1 gap-5">
        {/* Karur Campus Card */}
        {loggedInCampus === "KARUR" && (
          <div className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 relative overflow-hidden shadow-xs">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    V.S.B. Engineering College (Karur Campus)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>NH-67, Kovai Road, Karur, Tamil Nadu 639111</span>
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 px-3.5 py-1.5 rounded-full self-start sm:self-auto">
                ESTD. 2002
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Total Intake</p>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base mt-0.5">720 Seats</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">NAAC Grade</p>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base mt-0.5">A+ Accredited</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Placement %</p>
                <p className="font-extrabold text-blue-600 dark:text-sky-400 text-sm sm:text-base mt-0.5">94.8% Record</p>
              </div>
            </div>
          </div>
        )}

        {/* Coimbatore Campus Card */}
        {loggedInCampus === "COIMBATORE" && (
          <div className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 relative overflow-hidden shadow-xs">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-500" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    V.S.B. College of Engineering Technical Campus (Coimbatore)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>EAL, Pollachi Main Rd, Coimbatore, Tamil Nadu 642109</span>
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 px-3.5 py-1.5 rounded-full self-start sm:self-auto">
                ESTD. 2012
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Total Intake</p>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base mt-0.5">840 Seats</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">NAAC Grade</p>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base mt-0.5">A+ Accredited</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Placement %</p>
                <p className="font-extrabold text-purple-600 dark:text-purple-400 text-sm sm:text-base mt-0.5">96.2% Record</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Academic Degree Programs & Intake Capacity</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-black">
              🔥 Live Firebase
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            AICTE Approved & Anna University Affiliated Engineering Curriculum at V.S.B. ({courses.length} Active Programs)
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Program</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-bold">Synchronizing academic programs from Firebase Firestore...</p>
        </div>
      )}

      {/* Program Cards Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c, index) => {
            const Icon = getCourseIcon(c.code);
            const isSaved = bookmarkedCourses.includes(c.code);
            const colorClass = colorVariants[index % colorVariants.length];

            return (
              <article
                key={c.code}
                className={cn(
                  "group relative flex min-h-[380px] flex-col justify-between rounded-4xl p-6 sm:p-7 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 cursor-pointer",
                  colorClass
                )}
                onClick={() => setSelectedCourseDetail(c)}
              >
                <div className="flex flex-1 flex-col">
                  {/* Top Meta Header: Course Code, Accreditation & Bookmark Icon */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-black/15 dark:bg-white/15 text-slate-950 dark:text-white backdrop-blur-sm border border-black/10 dark:border-white/10">
                        {c.code}
                      </span>
                      {c.nbaAccredited && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/20 dark:bg-emerald-400/20 px-2 py-0.5 rounded-full border border-emerald-600/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                          <span>NBA Accredited</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(c.code, c.name);
                        }}
                        className={cn(
                          "p-2 rounded-full transition-all cursor-pointer active:scale-90",
                          isSaved
                            ? "text-rose-600 dark:text-rose-400 bg-white/40 dark:bg-black/30 shadow-xs"
                            : "text-slate-700/60 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
                        )}
                        title={isSaved ? "Remove bookmark" : "Bookmark this degree"}
                      >
                        <FaBookmark className="size-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProgram(c.code, c.name);
                        }}
                        className="p-2 rounded-full text-slate-700/50 dark:text-white/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Delete Course from Firebase"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle: Title & Arrow */}
                  <div className="flex flex-1 flex-col justify-center py-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-slate-950 dark:text-white text-2xl sm:text-3xl leading-[1.2] font-black tracking-tight line-clamp-2">
                        {c.name}
                      </h3>
                      <ArrowRight
                        className="text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white mt-1 size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1.5"
                        strokeWidth={2.5}
                      />
                    </div>

                    <p className="text-slate-800/80 dark:text-slate-200/80 text-xs font-bold uppercase tracking-wider mt-1">
                      {c.dept} Department
                    </p>

                    {/* Seat Intake & Tuition Fee Badges */}
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-white/40 dark:border-white/10 backdrop-blur-xs">
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {loggedInCampus === "KARUR" ? "Karur Campus Seats" : "Coimbatore Seats"}
                        </p>
                        <p className="text-sm font-black text-slate-950 dark:text-white mt-0.5">
                          {loggedInCampus === "KARUR" ? `${c.karurSeats} Intake` : `${c.coimbatoreSeats} Intake`}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-white/40 dark:border-white/10 backdrop-blur-xs">
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Tuition Fee</p>
                        <p className="text-sm font-black text-slate-950 dark:text-white mt-0.5">
                          {c.tuitionFee}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Department Lead Avatar & Glass Action Button */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-900 dark:text-white shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 leading-tight">
                        <span className="block text-slate-950 dark:text-white text-xs font-bold truncate">
                          {c.hod || "HoD / Faculty Lead"}
                        </span>
                        <span className="block text-slate-700/80 dark:text-slate-300/80 text-[10.5px] font-medium truncate">
                          Head of Department
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onApplyCourse) {
                          onApplyCourse(c.name, loggedInCampus);
                        } else {
                          onTriggerToast(`📝 Selected ${c.name} for admission application!`);
                          setSelectedCourseDetail(c);
                        }
                      }}
                      className="ml-auto flex items-center justify-center rounded-xl border border-white/40 dark:border-white/20 bg-white/40 dark:bg-black/30 backdrop-blur-md px-3.5 py-1.5 text-xs font-black text-slate-950 dark:text-white shadow-2xs group-hover:scale-105 active:scale-95 transition-transform shrink-0 cursor-pointer"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD NEW ACADEMIC PROGRAM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/15 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Add Academic Degree Program
                  </h3>
                  <p className="text-xs text-slate-500">Directly saves to Firebase Firestore courses database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ROBO-107"
                    value={newProgram.code}
                    onChange={(e) => setNewProgram({ ...newProgram, code: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robotics & Automation"
                    value={newProgram.dept}
                    onChange={(e) => setNewProgram({ ...newProgram, dept: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  Full Degree Program Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.E. Robotics & Automation Engineering"
                  value={newProgram.name}
                  onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Head of Department (HoD)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. G. Ramesh"
                    value={newProgram.hod}
                    onChange={(e) => setNewProgram({ ...newProgram, hod: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Annual Tuition Fee
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹85,000 / Year"
                    value={newProgram.tuitionFee}
                    onChange={(e) => setNewProgram({ ...newProgram, tuitionFee: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Karur Campus Intake Seats
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProgram.karurSeats}
                    onChange={(e) => setNewProgram({ ...newProgram, karurSeats: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Coimbatore Campus Intake Seats
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProgram.coimbatoreSeats}
                    onChange={(e) => setNewProgram({ ...newProgram, coimbatoreSeats: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  Program Description & Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Overview of curriculum, labs and career avenues..."
                  value={newProgram.description || ""}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="nbaAccredited"
                  checked={newProgram.nbaAccredited}
                  onChange={(e) => setNewProgram({ ...newProgram, nbaAccredited: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="nbaAccredited" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                  NBA Accredited & AICTE Certified Program
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Firebase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Program to Firebase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COURSE DETAILS & SYLLABUS MODAL */}
      {selectedCourseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/15 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                    {selectedCourseDetail.code}
                  </span>
                  {selectedCourseDetail.nbaAccredited && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> NBA Accredited
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedCourseDetail.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCourseDetail.dept} Department • Head of Dept: {selectedCourseDetail.hod}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCourseDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview & Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Course Overview</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {selectedCourseDetail.description ||
                  "This degree program offers advanced specialized knowledge, laboratory exposure, and direct industry internships aligned with Anna University curriculum."}
              </p>
            </div>

            {/* Seat Matrix & Fee */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Karur Intake</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedCourseDetail.karurSeats} Seats
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Coimbatore Intake</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedCourseDetail.coimbatoreSeats} Seats
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Tuition Fee</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedCourseDetail.tuitionFee}
                </p>
              </div>
            </div>

            {/* Core Syllabus Modules */}
            {selectedCourseDetail.syllabus && selectedCourseDetail.syllabus.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Core Curriculum & Syllabus Subjects
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCourseDetail.syllabus.map((syl, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                      <span>{syl}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Career Opportunities */}
            {selectedCourseDetail.careerRoles && selectedCourseDetail.careerRoles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Career Pathways & MNC Recruiters
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCourseDetail.careerRoles.map((role, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{role}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleDeleteProgram(selectedCourseDetail.code, selectedCourseDetail.name)}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Program</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCourseDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cName = selectedCourseDetail.name;
                    setSelectedCourseDetail(null);
                    if (onApplyCourse) {
                      onApplyCourse(cName, loggedInCampus);
                    } else {
                      onTriggerToast(`📝 Selected ${cName} for registration!`);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-transform cursor-pointer"
                >
                  <span>Apply for Admission</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
