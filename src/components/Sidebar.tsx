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
  ChevronDown,
  ShieldCheck,
  Sparkles,
  MapPin,
  X,
  Sun,
  Moon,
  LayoutDashboard,
  Share2,
  Megaphone,
  MessageSquare,
  Mail,
  Send,
  Award,
  MessageCircle,
  Search,
  Download,
  Calendar,
  FileText,
  HelpCircle,
  BarChart3,
  Users,
  MessageCircleCode,
  FormInput,
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
  onOpenMioAI?: () => void;
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
  onOpenMioAI,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [isAdmissionCrmOpen, setIsAdmissionCrmOpen] = useState(true);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");

  const admissionSubItems = [
    {
      id: "ADMISSIONS" as ActiveTab,
      label: "Admissions Dashboard",
      sublabel: "Funnel & Overview",
      icon: LayoutDashboard,
      color: "from-sky-500 to-blue-600",
      activeBorder: "border-sky-400",
      activeGlow: "shadow-sky-500/30",
    },
    {
      id: "CONTACTS" as ActiveTab,
      label: "Lead Manager",
      sublabel: "Manage Student Leads",
      icon: UserCheck,
      color: "from-indigo-500 to-purple-600",
      activeBorder: "border-indigo-400",
      activeGlow: "shadow-indigo-500/30",
    },
    {
      id: "TEACHERS" as ActiveTab,
      label: "Teacher Directory",
      sublabel: "Faculty Profiles",
      icon: BookOpen,
      color: "from-purple-500 to-pink-600",
      activeBorder: "border-purple-400",
      activeGlow: "shadow-purple-500/30",
    },
    {
      id: "CAMPUSES" as ActiveTab,
      label: "Campus & Courses",
      sublabel: "Campus & Programs",
      icon: Building2,
      color: "from-amber-500 to-orange-600",
      activeBorder: "border-amber-400",
      activeGlow: "shadow-amber-500/30",
    },
    {
      id: "PAYMENTS" as ActiveTab,
      label: "Fee Payment",
      sublabel: "Payment Verification",
      icon: CreditCard,
      color: "from-emerald-500 to-teal-600",
      activeBorder: "border-emerald-400",
      activeGlow: "shadow-emerald-500/30",
    },
  ];

  const filteredSubItems =
    currentUserRole === "TEACHER"
      ? admissionSubItems.filter((item) => item.id !== "PAYMENTS")
      : admissionSubItems;

  const handleNavClick = (id: ActiveTab) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const [isSocialPlatformOpen, setIsSocialPlatformOpen] = useState(true);

  const socialPlatformSubItems = [
    {
      id: "SOCIAL_ADS" as ActiveTab,
      label: "Google & Social Ads",
      sublabel: "Targeted Ad Campaigns",
      icon: Megaphone,
      color: "from-blue-500 to-indigo-600",
      activeBorder: "border-blue-400",
      activeGlow: "shadow-blue-500/30",
    },
    {
      id: "SOCIAL_FACEBOOK" as ActiveTab,
      label: "Facebook",
      sublabel: "Page & Messenger Leads",
      icon: Share2,
      color: "from-sky-500 to-blue-600",
      activeBorder: "border-sky-400",
      activeGlow: "shadow-sky-500/30",
    },
    {
      id: "SOCIAL_TWITTER" as ActiveTab,
      label: "X (Twitter)",
      sublabel: "Tweets & Broadcasts",
      icon: Send,
      color: "from-slate-600 to-slate-800",
      activeBorder: "border-slate-400",
      activeGlow: "shadow-slate-500/30",
    },
    {
      id: "SOCIAL_WHATSAPP" as ActiveTab,
      label: "WhatsApp",
      sublabel: "Direct & Bulk Messaging",
      icon: MessageSquare,
      color: "from-emerald-500 to-teal-600",
      activeBorder: "border-emerald-400",
      activeGlow: "shadow-emerald-500/30",
    },
    {
      id: "SOCIAL_EMAIL" as ActiveTab,
      label: "E-mail",
      sublabel: "Automated Email Portal",
      icon: Mail,
      color: "from-rose-500 to-pink-600",
      activeBorder: "border-rose-400",
      activeGlow: "shadow-rose-500/30",
    },
    {
      id: "SOCIAL_SMS" as ActiveTab,
      label: "SMS",
      sublabel: "SMS Gateway & Alerts",
      icon: MessageCircle,
      color: "from-purple-500 to-indigo-600",
      activeBorder: "border-purple-400",
      activeGlow: "shadow-purple-500/30",
    },
    {
      id: "SOCIAL_CAMPAIGN" as ActiveTab,
      label: "Campaign",
      sublabel: "Omnichannel Marketing",
      icon: Sparkles,
      color: "from-amber-500 to-orange-600",
      activeBorder: "border-amber-400",
      activeGlow: "shadow-amber-500/30",
    },
    {
      id: "SOCIAL_EXPO" as ActiveTab,
      label: "Project Expo",
      sublabel: "College Expo & Event Leads",
      icon: Award,
      color: "from-teal-500 to-cyan-600",
      activeBorder: "border-teal-400",
      activeGlow: "shadow-teal-500/30",
    },
  ];

  const toggleAdmissionMenu = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsAdmissionCrmOpen(true);
    } else {
      setIsAdmissionCrmOpen(!isAdmissionCrmOpen);
    }
  };

  const toggleSocialPlatformMenu = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsSocialPlatformOpen(true);
    } else {
      setIsSocialPlatformOpen(!isSocialPlatformOpen);
    }
  };

  const isLight = theme === "LIGHT";
  const isAnySubItemActive = filteredSubItems.some((item) => item.id === activeTab);
  const isAnySocialSubItemActive = socialPlatformSubItems.some((item) => item.id === activeTab);

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
        {/* Sidebar Header / Brand Emblem (V.S.B. Engineering College) */}
        <div
          className={`p-3.5 border-b flex items-center justify-between gap-2.5 ${
            isLight ? "border-slate-200 bg-slate-50/80" : "border-white/10 bg-slate-950"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Official V.S.B. Logo Badge */}
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400 shadow-md bg-white shrink-0 flex items-center justify-center p-0.5 transform hover:scale-105 transition-transform">
              <img
                src="/vsb-logo.png"
                alt="V.S.B. Engineering College Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <h2
                  className={`font-black text-xs sm:text-sm tracking-tight truncate uppercase leading-tight ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  V.S.B. ENGINEERING COLLEGE
                </h2>
                <p
                  className={`text-[9.5px] font-extrabold truncate flex items-center gap-1 mt-0.5 ${
                    isLight ? "text-slate-600" : "text-slate-300"
                  }`}
                >
                  <MapPin className="w-3 h-3 text-pink-500 shrink-0" />
                  <span>KARUR & COIMBATORE CAMPUSES</span>
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1 rounded-lg border transition-all shadow-sm shrink-0 ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                : "bg-slate-900 border-white/10 hover:border-sky-400/50 text-slate-300 hover:text-white"
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className={`lg:hidden p-1 rounded-lg border ${
              isLight
                ? "bg-slate-100 border-slate-300 text-slate-700"
                : "bg-slate-900 border-white/10 text-slate-300 hover:text-white"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items Section */}
        <div className="flex-1 px-3 py-3 space-y-3 overflow-y-auto hide-scrollbar">
          {/* Search For Menu Input Bar */}
          {!isCollapsed && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                placeholder="Search For Menu"
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none shadow-inner"
              />
            </div>
          )}

          {/* Mio AI (Beta) Button */}
          {isCollapsed ? (
            <Tooltip text="Mio AI (Beta)" position="right">
              <button
                onClick={onOpenMioAI}
                className="w-full flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all border border-indigo-400/30"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={onOpenMioAI}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 hover:from-indigo-900 hover:to-purple-900 border border-indigo-500/40 text-white shadow-md transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-indigo-500/30 text-amber-300 border border-indigo-400/30">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <span className="font-bold text-xs">Mio AI</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-indigo-500/30 text-indigo-300 rounded border border-indigo-400/30">
                  Beta
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* SECTION HEADLINE */}
          <div
            className={`px-2 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
              isCollapsed ? "justify-center text-center" : ""
            } ${isLight ? "text-slate-400" : "text-sky-400/80"}`}
          >
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{isCollapsed ? "SYS" : "SYSTEM MENU"}</span>
          </div>

          {/* PARENT MENU ITEM: ADMISSION CRM */}
          <div className="space-y-1">
            {isCollapsed ? (
              <Tooltip text="Admission CRM" position="right">
                <button
                  onClick={toggleAdmissionMenu}
                  className={`w-full flex items-center justify-center p-3 rounded-2xl transition-all duration-300 relative ${
                    isAnySubItemActive
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xl shadow-sky-500/30 border border-sky-400 scale-105"
                      : isLight
                      ? "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200"
                      : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10 hover:border-white/20"
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  {isAnySubItemActive && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              </Tooltip>
            ) : (
              <div
                className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer group border ${
                  isAnySubItemActive
                    ? isLight
                      ? "bg-sky-50 border-sky-300 text-sky-900 shadow-md"
                      : "bg-sky-950/50 border-sky-500/40 text-sky-200 shadow-lg shadow-sky-950/50"
                    : isLight
                    ? "bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200"
                    : "bg-slate-900/60 hover:bg-slate-900 text-slate-200 border-white/10 hover:border-white/20"
                }`}
                onClick={toggleAdmissionMenu}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110 shadow-sm ${
                      isAnySubItemActive
                        ? "bg-gradient-to-tr from-sky-500 to-blue-600 text-white"
                        : isLight
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left truncate">
                    <span className="font-extrabold text-xs tracking-tight truncate">
                      Admission CRM
                    </span>
                    <span
                      className={`text-[10px] font-semibold truncate ${
                        isLight ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Management Hub
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      isLight
                        ? "bg-sky-100 text-sky-700"
                        : "bg-sky-500/20 text-sky-300 border border-sky-400/30"
                    }`}
                  >
                    {filteredSubItems.length}
                  </span>
                  <div className="p-1 rounded-lg hover:bg-white/10 transition-transform">
                    {isAdmissionCrmOpen ? (
                      <ChevronDown className="w-4 h-4 text-sky-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NESTED INSIDE ADMISSION CRM */}
            {(isAdmissionCrmOpen || isCollapsed) && (
              <div
                className={`space-y-1 transition-all duration-300 ${
                  isCollapsed
                    ? "pt-2 space-y-2 border-t border-white/10 mt-2"
                    : "ml-3 pl-3 border-l-2 border-sky-500/30 dark:border-sky-400/20 mt-1.5 space-y-1.5"
                }`}
              >
                {filteredSubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  const buttonContent = (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 ${
                        isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
                      } rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg ${item.activeGlow} border ${item.activeBorder} scale-[1.02]`
                          : isLight
                          ? "bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
                          : "bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : isLight
                            ? "bg-slate-100 text-slate-600"
                            : "bg-slate-800/90 text-slate-300"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {!isCollapsed && (
                        <div className="flex flex-col items-start min-w-0 text-left">
                          <span
                            className={`font-extrabold text-[11px] tracking-tight truncate w-full ${
                              isActive
                                ? "text-white"
                                : isLight
                                ? "text-slate-900"
                                : "text-slate-200 group-hover:text-white"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`text-[9px] font-medium truncate w-full ${
                              isActive
                                ? "text-white/80"
                                : isLight
                                ? "text-slate-500"
                                : "text-slate-400"
                            }`}
                          >
                            {item.sublabel}
                          </span>
                        </div>
                      )}

                      {isActive && !isCollapsed && (
                        <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
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
            )}
          </div>

          {/* PARENT MENU ITEM 2: CONTACT & SOCIAL MEDIA PLATFORM */}
          <div className="space-y-1 pt-2 border-t border-white/10 mt-2">
            {isCollapsed ? (
              <Tooltip text="Contact & Social Media Platform" position="right">
                <button
                  onClick={toggleSocialPlatformMenu}
                  className={`w-full flex items-center justify-center p-3 rounded-2xl transition-all duration-300 relative ${
                    isAnySocialSubItemActive
                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl shadow-purple-500/30 border border-purple-400 scale-105"
                      : isLight
                      ? "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200"
                      : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10 hover:border-white/20"
                  }`}
                >
                  <Share2 className="w-5 h-5 text-purple-400" />
                  {isAnySocialSubItemActive && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                  )}
                </button>
              </Tooltip>
            ) : (
              <div
                className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer group border ${
                  isAnySocialSubItemActive
                    ? isLight
                      ? "bg-purple-50 border-purple-300 text-purple-900 shadow-md"
                      : "bg-purple-950/50 border-purple-500/40 text-purple-200 shadow-lg shadow-purple-950/50"
                    : isLight
                    ? "bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200"
                    : "bg-slate-900/60 hover:bg-slate-900 text-slate-200 border-white/10 hover:border-white/20"
                }`}
                onClick={toggleSocialPlatformMenu}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110 shadow-sm ${
                      isAnySocialSubItemActive
                        ? "bg-gradient-to-tr from-purple-500 to-indigo-600 text-white"
                        : isLight
                        ? "bg-purple-100 text-purple-700"
                        : "bg-purple-900/50 text-purple-300 border border-purple-500/30"
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left truncate">
                    <span className="font-extrabold text-xs tracking-tight truncate">
                      Contact Platform
                    </span>
                    <span
                      className={`text-[10px] font-semibold truncate ${
                        isLight ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Social Media Channels
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      isLight
                        ? "bg-purple-100 text-purple-700"
                        : "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                    }`}
                  >
                    8
                  </span>
                  <div className="p-1 rounded-lg hover:bg-white/10 transition-transform">
                    {isSocialPlatformOpen ? (
                      <ChevronDown className="w-4 h-4 text-purple-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NESTED INSIDE CONTACT & SOCIAL MEDIA PLATFORM */}
            {(isSocialPlatformOpen || isCollapsed) && (
              <div
                className={`space-y-1 transition-all duration-300 ${
                  isCollapsed
                    ? "pt-2 space-y-2 border-t border-white/10 mt-2"
                    : "ml-3 pl-3 border-l-2 border-purple-500/30 dark:border-purple-400/20 mt-1.5 space-y-1.5"
                }`}
              >
                {socialPlatformSubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  const buttonContent = (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 ${
                        isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
                      } rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg ${item.activeGlow} border ${item.activeBorder} scale-[1.02]`
                          : isLight
                          ? "bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
                          : "bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : isLight
                            ? "bg-slate-100 text-slate-600"
                            : "bg-slate-800/90 text-slate-300"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {!isCollapsed && (
                        <div className="flex flex-col items-start min-w-0 text-left">
                          <span
                            className={`font-extrabold text-[11px] tracking-tight truncate w-full ${
                              isActive
                                ? "text-white"
                                : isLight
                                ? "text-slate-900"
                                : "text-slate-200 group-hover:text-white"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`text-[9px] font-medium truncate w-full ${
                              isActive
                                ? "text-white/80"
                                : isLight
                                ? "text-slate-500"
                                : "text-slate-400"
                            }`}
                          >
                            {item.sublabel}
                          </span>
                        </div>
                      )}

                      {isActive && !isCollapsed && (
                        <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
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
            )}
          </div>
        </div>

        {/* Sidebar Footer: Admin Settings, Theme Toggle & Logout */}
        <div
          className={`p-3 border-t space-y-2 ${
            isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-slate-950/60"
          }`}
        >
          {/* Admin Settings (Moved to Left Side Bottom above Light Mode) */}
          {currentUserRole === "ADMIN" && (
            isCollapsed ? (
              <Tooltip text="Admin Settings (System Configuration)" position="right">
                <button
                  onClick={() => handleNavClick("SETTINGS")}
                  className={`w-full flex items-center justify-center p-2.5 rounded-xl border transition-all ${
                    activeTab === "SETTINGS"
                      ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30 border-rose-400 scale-105"
                      : isLight
                      ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                      : "bg-slate-900/90 text-slate-200 hover:text-white border-white/10 hover:border-white/20"
                  }`}
                >
                  <Settings className="w-4 h-4 text-rose-400" />
                </button>
              </Tooltip>
            ) : (
              <button
                onClick={() => handleNavClick("SETTINGS")}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-xs font-black transition-all duration-300 cursor-pointer group ${
                  activeTab === "SETTINGS"
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30 border-rose-400 scale-[1.02]"
                    : isLight
                    ? "bg-white hover:bg-slate-100 text-slate-900 border-slate-200 shadow-sm"
                    : "bg-slate-900/90 hover:bg-slate-900 text-slate-200 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110 shadow-sm ${
                      activeTab === "SETTINGS"
                        ? "bg-white/20 text-white"
                        : isLight
                        ? "bg-rose-100 text-rose-600"
                        : "bg-rose-950/80 text-rose-400 border border-rose-800/50"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left truncate">
                    <span className="font-extrabold text-xs tracking-tight truncate">
                      Admin Settings
                    </span>
                    <span
                      className={`text-[9px] font-medium truncate ${
                        activeTab === "SETTINGS"
                          ? "text-rose-100"
                          : isLight
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      System Configuration
                    </span>
                  </div>
                </div>
              </button>
            )
          )}

          {/* Download App Footer Link */}
          {!isCollapsed && (
            <button
              onClick={() => alert("Meritto Mobile App APK download initiated for Android & iOS.")}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold transition-all group"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
              <span>Download App</span>
            </button>
          )}

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
                  <p className="text-xs font-black truncate text-black">
                    {loggedInUsername}
                  </p>
                  <p className="text-[10px] font-extrabold truncate text-indigo-700">
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

