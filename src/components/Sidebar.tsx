"use client";

import { useState } from "react";
import {
  GraduationCap,
  UserCheck,
  BookOpen,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { User, ActiveTab, CampusLocation } from "@/types/crm";
import Tooltip from "@/components/Tooltip";

interface SidebarProps {
  user: User;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedCampus: CampusLocation;
  onCampusChange: (campus: CampusLocation) => void;
  onLogout: () => void;
  loggedInCampus: "KARUR" | "COIMBATORE";
  currentUserRole: "ADMIN" | "TEACHER";
  loggedInUsername: string;
  theme?: "LIGHT" | "DARK";
  onThemeChange?: (newTheme: "LIGHT" | "DARK") => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  user,
  activeTab,
  onTabChange,
  selectedCampus,
  onCampusChange,
  onLogout,
  loggedInCampus,
  currentUserRole,
  loggedInUsername,
  theme = "DARK",
  onThemeChange,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      id: "ADMISSIONS" as ActiveTab,
      label: "Admissions CRM",
      sublabel: "Open Admissions CRM",
      icon: GraduationCap,
      color: "from-sky-500 to-blue-600",
      activeBorder: "border-sky-400",
      activeGlow: "shadow-sky-500/30",
    },
    {
      id: "CONTACTS" as ActiveTab,
      label: "Lead Manager",
      sublabel: "Open Lead Manager",
      icon: UserCheck,
      color: "from-indigo-500 to-purple-600",
      activeBorder: "border-indigo-400",
      activeGlow: "shadow-indigo-500/30",
    },
    {
      id: "TEACHERS" as ActiveTab,
      label: "Teacher Directory",
      sublabel: "Open Teacher Directory",
      icon: BookOpen,
      color: "from-purple-500 to-pink-600",
      activeBorder: "border-purple-400",
      activeGlow: "shadow-purple-500/30",
    },
    {
      id: "CAMPUSES" as ActiveTab,
      label: "Campus & Courses",
      sublabel: "Open Campus & Courses",
      icon: Building2,
      color: "from-amber-500 to-orange-600",
      activeBorder: "border-amber-400",
      activeGlow: "shadow-amber-500/30",
    },
    {
      id: "PAYMENTS" as ActiveTab,
      label: "Fee Payments",
      sublabel: "Open Fee Payments",
      icon: CreditCard,
      color: "from-emerald-500 to-teal-600",
      activeBorder: "border-emerald-400",
      activeGlow: "shadow-emerald-500/30",
    },
    {
      id: "SETTINGS" as ActiveTab,
      label: "Admin Settings",
      sublabel: "Open Admin Settings",
      icon: Settings,
      color: "from-rose-500 to-pink-600",
      activeBorder: "border-rose-400",
      activeGlow: "shadow-rose-500/30",
    },
  ];

  const filteredNavItems =
    currentUserRole === "TEACHER"
      ? navItems.filter((item) => item.id !== "PAYMENTS" && item.id !== "SETTINGS")
      : navItems;

  const handleNavClick = (id: ActiveTab) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const isLight = theme === "LIGHT";

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className={`fixed inset-0 z-40 backdrop-blur-md lg:hidden ${
            isLight ? "bg-slate-900/40" : "bg-slate-950/80"
          }`}
          onClick={onCloseMobile}
        />
      )}

      {/* Main Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
          isLight
            ? "bg-white text-slate-900 border-slate-200 shadow-slate-200/50"
            : "bg-slate-950/95 text-white border-white/10 shadow-black/50"
        } ${isCollapsed ? "w-20" : "w-64"} ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header / Brand Emblem */}
        <div
          className={`p-4 border-b flex items-center justify-between gap-3 ${
            isLight ? "border-slate-200 bg-slate-50/80" : "border-white/10"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow-md bg-white shrink-0 flex items-center justify-center p-0.5 transform hover:scale-105 transition-transform">
              <img
                src="/vsb-logo.png"
                alt="V.S.B. Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <h2
                  className={`font-black text-sm tracking-tight truncate flex items-center gap-1.5 ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  <span>V.S.B. CRM</span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isLight
                        ? "bg-sky-100 text-sky-700 border border-sky-300"
                        : "bg-sky-500/20 text-sky-300 border border-sky-400/30"
                    }`}
                  >
                    v4.0
                  </span>
                </h2>
                <p
                  className={`text-[10px] font-bold truncate flex items-center gap-1 ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  <MapPin className="w-3 h-3 text-pink-500 shrink-0" />
                  <span>{loggedInCampus} CAMPUS</span>
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1.5 rounded-xl border transition-all shadow-sm shrink-0 ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                : "bg-slate-800/80 border-white/10 hover:border-sky-400/50 text-slate-300 hover:text-white"
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className={`lg:hidden p-1.5 rounded-xl border ${
              isLight
                ? "bg-slate-100 border-slate-300 text-slate-700"
                : "bg-slate-800/80 border-white/10 text-slate-300 hover:text-white"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items Section */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto hide-scrollbar">
          <div
            className={`px-2 pb-2 text-[10px] font-black uppercase tracking-wider ${
              isCollapsed ? "text-center" : ""
            } ${isLight ? "text-slate-400" : "text-slate-400"}`}
          >
            {isCollapsed ? "NAV" : "MAIN NAVIGATION"}
          </div>

          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            const buttonContent = (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-xs font-bold transition-all duration-300 group relative ${
                  isActive
                    ? `bg-gradient-to-r ${item.color} text-white shadow-xl ${item.activeGlow} border ${item.activeBorder} scale-[1.02]`
                    : isLight
                    ? "bg-slate-50 hover:bg-slate-100 text-slate-800 hover:text-slate-950 border border-slate-200 hover:border-slate-300"
                    : "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-white/5 hover:border-white/20"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isLight
                      ? "bg-slate-200/80 text-slate-700"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col items-start min-w-0 text-left">
                    <span
                      className={`font-black text-xs tracking-tight truncate w-full ${
                        isActive
                          ? "text-white"
                          : isLight
                          ? "text-slate-900 group-hover:text-black"
                          : "text-slate-200 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] font-semibold truncate w-full ${
                        isActive
                          ? "text-white/80"
                          : isLight
                          ? "text-slate-500 group-hover:text-slate-700"
                          : "text-slate-400 group-hover:text-slate-300"
                      }`}
                    >
                      {item.sublabel}
                    </span>
                  </div>
                )}

                {isActive && (
                  <span className="absolute right-2.5 w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.id} text={`${item.label} (${item.sublabel})`} position="right">
                  {buttonContent}
                </Tooltip>
              );
            }

            return buttonContent;
          })}
        </div>

        {/* Sidebar Footer: Theme Toggle & Logout */}
        <div
          className={`p-3 border-t space-y-2 ${
            isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-slate-950/60"
          }`}
        >
          {/* Theme Quick Toggle */}
          {!isCollapsed && onThemeChange && (
            <div
              className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                isLight ? "bg-white border-slate-200" : "bg-slate-900 border-white/10"
              }`}
            >
              <span
                className={`text-[11px] font-bold flex items-center gap-1.5 ${
                  isLight ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {theme === "DARK" ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                )}
                {theme === "DARK" ? "Dark Mode" : "Light Mode"}
              </span>
              <button
                onClick={() => onThemeChange(theme === "DARK" ? "LIGHT" : "DARK")}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all shadow-sm cursor-pointer"
              >
                Switch
              </button>
            </div>
          )}

          {/* User Profile info */}
          <div
            className={`flex items-center justify-between gap-2 p-2 rounded-2xl border ${
              isLight
                ? "bg-white border-slate-200 shadow-sm"
                : "bg-slate-900/90 border-white/10"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                VSB
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {loggedInUsername}
                  </p>
                  <p
                    className={`text-[10px] font-semibold truncate ${
                      isLight ? "text-sky-600" : "text-sky-300"
                    }`}
                  >
                    {currentUserRole === "ADMIN" ? "System Admin" : "Faculty Lead"}
                  </p>
                </div>
              )}
            </div>

            <Tooltip text="Logout Portal" position="top">
              <button
                onClick={onLogout}
                className={`p-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
                  isLight
                    ? "bg-slate-100 hover:bg-rose-500 hover:text-white border-slate-200 text-slate-600"
                    : "bg-slate-800 hover:bg-rose-600/80 border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </aside>
    </>
  );
}
