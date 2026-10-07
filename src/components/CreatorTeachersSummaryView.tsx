"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Teacher, CampusLocation } from "@/types/crm";
import { MOCK_TEACHERS } from "@/lib/mockData";
import { fetchTeachersFromFirebase } from "@/lib/firebaseSync";
import {
  BookOpen,
  Users,
  ShieldAlert,
  Crown,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Layers,
  Laptop,
} from "lucide-react";

interface CreatorTeachersSummaryViewProps {
  selectedCampus?: CampusLocation;
  onNavigateCreatorControl?: () => void;
}

export default function CreatorTeachersSummaryView({
  selectedCampus = "ALL",
  onNavigateCreatorControl,
}: CreatorTeachersSummaryViewProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachersFromFirebase()
      .then((liveList) => {
        if (Array.isArray(liveList) && liveList.length > 0) {
          setTeachers(liveList);
        }
      })
      .catch((err) => {
        console.warn("Notice loading teachers in Creator view:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter teachers by selected campus
  const filteredTeachers = useMemo(() => {
    if (selectedCampus === "ALL") return teachers;
    return teachers.filter((t) => t.campus === selectedCampus);
  }, [teachers, selectedCampus]);

  const totalTeachers = teachers.length;
  const activeCount = teachers.filter((t) => (t.status || "").toUpperCase() === "ACTIVE").length;
  const offlineCount = Math.max(0, totalTeachers - activeCount);
  const karurFacultyCount = teachers.filter((t) => t.campus === "KARUR").length;
  const covaiFacultyCount = teachers.filter((t) => t.campus === "COIMBATORE").length;

  // Department staffing breakdown (Count only)
  const departmentCounts = useMemo(() => {
    const map: Record<string, { count: number; active: number }> = {};
    filteredTeachers.forEach((t) => {
      const dept = t.department || "General Engineering";
      if (!map[dept]) {
        map[dept] = { count: 0, active: 0 };
      }
      map[dept].count++;
      if ((t.status || "").toUpperCase() === "ACTIVE") {
        map[dept].active++;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [filteredTeachers]);

  return (
    <div data-creator-view="true" className="creator-page-text space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* 1. CREATOR PRIVACY HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 p-6 md:p-8 border-2 border-purple-500/30 shadow-2xl shadow-purple-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-600 p-0.5 shadow-lg shadow-purple-500/30 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-purple-400" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>MASTER CREATOR TELEMETRY</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>TEACHER APPLICATION USAGE COUNT</span>
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Faculty Application Usage Overview</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 font-medium">
                Live count of teachers actively using the SPHEREX CRM platform across campuses. Individual faculty dossiers, mobile numbers, and student calling assignments are reserved for Campus Admins.
              </p>
            </div>
          </div>

          {onNavigateCreatorControl && (
            <button
              type="button"
              onClick={onNavigateCreatorControl}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-orange-500/20 flex items-center gap-2 shrink-0 transition-transform active:scale-95 cursor-pointer"
            >
              <span>👑 Open Creator Licensing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            Faculty Privacy Protected: Individual calling profiles, dialer actions, and lead allocations are managed directly by Karur and Coimbatore College Administrators.
          </span>
        </div>
      </div>

      {/* 2. PRIMARY TEACHER COUNT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Teachers Using App */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 text-xs font-black uppercase tracking-wider">
            <span>Teachers Using Application</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-950 dark:text-white font-mono">
            {totalTeachers} <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Faculty</span>
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 font-bold">
            <span>Platform Coverage:</span>
            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">100% Deployed</span>
          </div>
        </div>

        {/* Active & Online Count */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 text-xs font-black uppercase tracking-wider">
            <span>Active &amp; Online</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {activeCount} <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Active</span>
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 font-bold">
            <span>Active Utilization:</span>
            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
              {totalTeachers > 0 ? ((activeCount / totalTeachers) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>

        {/* Karur Campus Faculty Count */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 text-xs font-black uppercase tracking-wider">
            <span>Karur Campus Faculty</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-amber-700 dark:text-amber-400 font-mono">
            {karurFacultyCount} <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Staff</span>
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 font-bold">
            <span>Campus Share:</span>
            <span className="font-mono font-black text-slate-950 dark:text-white">
              {totalTeachers > 0 ? ((karurFacultyCount / totalTeachers) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>

        {/* Coimbatore Campus Faculty Count */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 text-xs font-black uppercase tracking-wider">
            <span>Coimbatore Faculty</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-indigo-700 dark:text-indigo-400 font-mono">
            {covaiFacultyCount} <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Staff</span>
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 font-bold">
            <span>Campus Share:</span>
            <span className="font-mono font-black text-slate-950 dark:text-white">
              {totalTeachers > 0 ? ((covaiFacultyCount / totalTeachers) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. DEPARTMENT FACULTY COUNTS (COUNTS ONLY) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">Department Faculty Usage Distribution</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Number of teachers assigned and active per engineering department</p>
            </div>
          </div>
          <span className="text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">
            {departmentCounts.length} Active Academic Departments
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departmentCounts.map(([deptName, info]) => {
            return (
              <div
                key={deptName}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-purple-400 dark:hover:border-slate-700 transition-colors shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[200px]" title={deptName}>
                    {deptName}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shadow-xs">
                    {info.count} Faculty
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 font-mono font-bold">
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    {info.active} Active Online
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">{info.count - info.active} Offline</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
