"use client";

import { useState } from "react";
import { CampusLocation } from "@/types/crm";
import { Building2, GraduationCap, Users, BookOpen, CheckCircle2, MapPin, Award, Plus } from "lucide-react";

interface CampusCourseModuleProps {
  loggedInCampus: "KARUR" | "COIMBATORE";
  onTriggerToast: (msg: string) => void;
}

export default function CampusCourseModule({ loggedInCampus, onTriggerToast }: CampusCourseModuleProps) {
  const [selectedCampus, setSelectedCampus] = useState<CampusLocation>(loggedInCampus);

  const courses = [
    {
      code: "CSE-101",
      name: "B.E. Computer Science & Engineering",
      dept: "Computer Science",
      karurSeats: 180,
      coimbatoreSeats: 240,
      tuitionFee: "₹85,000 / Year",
      nbaAccredited: true,
    },
    {
      code: "AIDS-102",
      name: "B.Tech Artificial Intelligence & Data Science",
      dept: "AI & DS",
      karurSeats: 120,
      coimbatoreSeats: 180,
      tuitionFee: "₹95,000 / Year",
      nbaAccredited: true,
    },
    {
      code: "ECE-103",
      name: "B.E. Electronics & Communication Engg",
      dept: "Electronics",
      karurSeats: 180,
      coimbatoreSeats: 180,
      tuitionFee: "₹80,000 / Year",
      nbaAccredited: true,
    },
    {
      code: "CY-104",
      name: "B.Tech Cyber Security",
      dept: "Information Tech",
      karurSeats: 60,
      coimbatoreSeats: 120,
      tuitionFee: "₹90,000 / Year",
      nbaAccredited: true,
    },
    {
      code: "MECH-105",
      name: "B.E. Mechanical Engineering",
      dept: "Mechanical",
      karurSeats: 120,
      coimbatoreSeats: 60,
      tuitionFee: "₹75,000 / Year",
      nbaAccredited: true,
    },
    {
      code: "EEE-106",
      name: "B.E. Electrical & Electronics Engg",
      dept: "Electrical",
      karurSeats: 60,
      coimbatoreSeats: 60,
      tuitionFee: "₹75,000 / Year",
      nbaAccredited: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Campuses Summary Banner */}
      <div className="grid grid-cols-1 gap-5">
        {/* Karur Campus Card */}
        {loggedInCampus === "KARUR" && (
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">V.S.B. Karur Campus</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> NH-67, Kovai Road, Karur, Tamil Nadu 639111
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-full">
                ESTD. 2002
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div>
                <p className="text-slate-400">Total Intake</p>
                <p className="font-bold text-slate-100 mt-0.5">720 Seats</p>
              </div>
              <div>
                <p className="text-slate-400">NAAC Grade</p>
                <p className="font-bold text-emerald-400 mt-0.5">A+ Accredited</p>
              </div>
              <div>
                <p className="text-slate-400">Placement %</p>
                <p className="font-bold text-indigo-400 mt-0.5">94.8% Record</p>
              </div>
            </div>
          </div>
        )}

        {/* Coimbatore Campus Card */}
        {loggedInCampus === "COIMBATORE" && (
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">V.S.B. Coimbatore Campus</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" /> EAL, Pollachi Main Rd, Coimbatore, Tamil Nadu 642109
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800 px-3 py-1 rounded-full">
                ESTD. 2012
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div>
                <p className="text-slate-400">Total Intake</p>
                <p className="font-bold text-slate-100 mt-0.5">840 Seats</p>
              </div>
              <div>
                <p className="text-slate-400">NAAC Grade</p>
                <p className="font-bold text-emerald-400 mt-0.5">A+ Accredited</p>
              </div>
              <div>
                <p className="text-slate-400">Placement %</p>
                <p className="font-bold text-purple-400 mt-0.5">96.2% Record</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Courses List */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100">B.E. & B.Tech Degree Programs</h3>
            <p className="text-xs text-slate-400">AICTE Approved & Anna University Affiliated Courses</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerToast("Opening program registry editor...")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> Add Program
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.code} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {c.code}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> NBA Accredited
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-100 leading-snug">{c.name}</h4>
              <p className="text-xs text-slate-400 font-medium">{c.dept} Department</p>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                {loggedInCampus === "KARUR" ? (
                  <div>
                    <p className="text-[10px] text-slate-400">Karur Campus Seats</p>
                    <p className="font-bold text-indigo-300 text-sm mt-0.5">{c.karurSeats} Intake</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-slate-400">Coimbatore Campus Seats</p>
                    <p className="font-bold text-purple-300 text-sm mt-0.5">{c.coimbatoreSeats} Intake</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Tuition Fee</span>
                <span className="font-bold text-emerald-400">{c.tuitionFee}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
