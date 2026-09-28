"use client";

import { useState } from "react";
import { CampusLocation } from "@/types/crm";
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
} from "lucide-react";
import { FaBookmark } from "react-icons/fa6";
import { colorVariants } from "@/components/ui/blog-card";
import { cn } from "@/lib/utils";

interface CampusCourseModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  onTriggerToast: (msg: string) => void;
}

export default function CampusCourseModule({ loggedInCampus, onTriggerToast }: CampusCourseModuleProps) {
  const [selectedCampus, setSelectedCampus] = useState<CampusLocation>(loggedInCampus);
  const [bookmarkedCourses, setBookmarkedCourses] = useState<string[]>(["CSE-101", "AIDS-102"]);

  const toggleBookmark = (code: string, name: string) => {
    setBookmarkedCourses((prev) => {
      const exists = prev.includes(code);
      if (exists) {
        onTriggerToast(`Removed ${code} from saved favorites`);
        return prev.filter((c) => c !== code);
      } else {
        onTriggerToast(`Saved ${name} (${code}) to favorites`);
        return [...prev, code];
      }
    });
  };

  const courses = [
    {
      code: "CSE-101",
      name: "B.E. Computer Science & Engineering",
      dept: "Computer Science",
      icon: Cpu,
      hod: "Dr. K. Senthilkumar",
      karurSeats: 180,
      coimbatoreSeats: 240,
      tuitionFee: "₹85,000 / Year",
      nbaAccredited: true,
      meta: "4 Years • Full-Time Degree",
    },
    {
      code: "AIDS-102",
      name: "B.Tech Artificial Intelligence & Data Science",
      dept: "AI & DS",
      icon: Brain,
      hod: "Dr. P. Rajasekaran",
      karurSeats: 120,
      coimbatoreSeats: 180,
      tuitionFee: "₹95,000 / Year",
      nbaAccredited: true,
      meta: "4 Years • High Demand Tech",
    },
    {
      code: "ECE-103",
      name: "B.E. Electronics & Communication Engg",
      dept: "Electronics",
      icon: Radio,
      hod: "Dr. M. Karthikeyan",
      karurSeats: 180,
      coimbatoreSeats: 180,
      tuitionFee: "₹80,000 / Year",
      nbaAccredited: true,
      meta: "4 Years • VLSI & Embedded",
    },
    {
      code: "CY-104",
      name: "B.Tech Cyber Security",
      dept: "Information Tech",
      icon: ShieldAlert,
      hod: "Dr. V. Deepa",
      karurSeats: 60,
      coimbatoreSeats: 120,
      tuitionFee: "₹90,000 / Year",
      nbaAccredited: true,
      meta: "4 Years • Network & Security",
    },
    {
      code: "MECH-105",
      name: "B.E. Mechanical Engineering",
      dept: "Mechanical",
      icon: Wrench,
      hod: "Dr. S. Ramesh",
      karurSeats: 120,
      coimbatoreSeats: 60,
      tuitionFee: "₹75,000 / Year",
      nbaAccredited: true,
      meta: "4 Years • CAD & Automation",
    },
    {
      code: "EEE-106",
      name: "B.E. Electrical & Electronics Engg",
      dept: "Electrical",
      icon: Zap,
      hod: "Dr. G. Anbalagan",
      karurSeats: 60,
      coimbatoreSeats: 60,
      tuitionFee: "₹75,000 / Year",
      nbaAccredited: true,
      meta: "4 Years • Power & EV Systems",
    },
  ];

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
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Academic Degree Programs & Intake Capacity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            AICTE Approved & Anna University Affiliated Engineering Curriculum at V.S.B.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => onTriggerToast("Opening new academic program registration modal...")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Program</span>
          </button>
        </div>
      </div>

      {/* 6 Program Cards matching Image 1 & Blog2 Color Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c, index) => {
          const Icon = c.icon;
          const isSaved = bookmarkedCourses.includes(c.code);
          const colorClass = colorVariants[index % colorVariants.length];

          return (
            <article
              key={c.code}
              className={cn(
                "group relative flex min-h-[380px] flex-col justify-between rounded-4xl p-6 sm:p-7 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 cursor-pointer",
                colorClass
              )}
              onClick={() => onTriggerToast(`Viewing curriculum syllabus and admission criteria for ${c.name}`)}
            >
              <div className="flex flex-1 flex-col">
                {/* Top Meta Header: Course Code, Accreditation & Bookmark Icon */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-black/15 dark:bg-white/15 text-slate-950 dark:text-white backdrop-blur-sm border border-black/10 dark:border-white/10">
                      {c.code}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/20 dark:bg-emerald-400/20 px-2 py-0.5 rounded-full border border-emerald-600/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                      <span>NBA Accredited</span>
                    </span>
                  </div>

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
                        {c.hod}
                      </span>
                      <span className="block text-slate-700/80 dark:text-slate-300/80 text-[10.5px] font-medium truncate">
                        Head of Department
                      </span>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center justify-center rounded-xl border border-white/40 dark:border-white/20 bg-white/40 dark:bg-black/30 backdrop-blur-md px-3.5 py-1.5 text-xs font-black text-slate-950 dark:text-white shadow-2xs group-hover:scale-105 active:scale-95 transition-transform shrink-0">
                    Apply Now
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
