"use client";

import { useState, useEffect } from "react";
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
  Facebook,
  Twitter,
  MessageSquare,
  Mail,
  Smartphone,
  Rocket,
} from "lucide-react";
import { User, ActiveTab, CampusLocation } from "@/types/crm";
import { SocialSubChannel } from "@/components/ContactPlatformModule";
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
  activeSocialChannel?: SocialSubChannel;
  onSelectSocialChannel?: (channel: SocialSubChannel) => void;
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
  activeSocialChannel = "ALL",
  onSelectSocialChannel,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdmissionCrmOpen, setIsAdmissionCrmOpen] = useState(true);
  const [isContactPlatformOpen, setIsContactPlatformOpen] = useState(true);

  // Auto-expand menu section based on activeTab selection
  useEffect(() => {
    if (
      activeTab === "ADMISSIONS" ||
      activeTab === "CONTACTS" ||
      activeTab === "STUDENTS" ||
      activeTab === "TEACHERS" ||
      activeTab === "CAMPUSES" ||
      activeTab === "PAYMENTS" ||
      activeTab === "SETTINGS"
    ) {
      setIsAdmissionCrmOpen(true);
    } else if (activeTab === "CONTACT_PLATFORM") {
      setIsContactPlatformOpen(true);
    }
  }, [activeTab]);

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
    {
      id: "SETTINGS" as ActiveTab,
      label: "Admin Settings",
      sublabel: "System Configuration",
      icon: Settings,
      color: "from-rose-500 to-pink-600",
      activeBorder: "border-rose-400",
      activeGlow: "shadow-rose-500/30",
    },
  ];

  const filteredSubItems =
    currentUserRole === "TEACHER"
      ? admissionSubItems.filter((item) => item.id !== "PAYMENTS" && item.id !== "SETTINGS")
      : admissionSubItems;

  const contactPlatformSubItems = [
    {
      channelId: "ADS" as SocialSubChannel,
      label: "Ads & Paid Media",
      sublabel: "Google & Meta Ads ROI",
      icon: Megaphone,
      color: "from-amber-500 to-red-600",
      activeBorder: "border-amber-400",
      activeGlow: "shadow-amber-500/30",
    },
    {
      channelId: "FACEBOOK" as SocialSubChannel,
      label: "Facebook Leads",
      sublabel: "Meta Page Lead Forms",
      icon: Facebook,
      color: "from-blue-600 to-indigo-700",
      activeBorder: "border-blue-400",
      activeGlow: "shadow-blue-500/30",
    },
    {
      channelId: "TWITTER" as SocialSubChannel,
      label: "X (Twitter) Feed",
      sublabel: "X Social Outreach",
      icon: Twitter,
      color: "from-slate-700 to-slate-900",
      activeBorder: "border-slate-400",
      activeGlow: "shadow-slate-500/30",
    },
    {
      channelId: "WHATSAPP" as SocialSubChannel,
      label: "WhatsApp Portal",
      sublabel: "Direct & Bulk Chat",
      icon: MessageSquare,
      color: "from-emerald-500 to-teal-600",
      activeBorder: "border-emerald-400",
      activeGlow: "shadow-emerald-500/30",
    },
    {
      channelId: "EMAIL" as SocialSubChannel,
      label: "E-Mail Direct",
      sublabel: "Gmail API Mailer",
      icon: Mail,
      color: "from-rose-500 to-pink-600",
      activeBorder: "border-rose-400",
      activeGlow: "shadow-rose-500/30",
    },
    {
      channelId: "SMS" as SocialSubChannel,
      label: "SMS Broadcast",
      sublabel: "Bulk SMS & Alerts",
      icon: Smartphone,
      color: "from-purple-500 to-indigo-600",
      activeBorder: "border-purple-400",
      activeGlow: "shadow-purple-500/30",
    },
    {
      channelId: "CAMPAIGN" as SocialSubChannel,
      label: "Campaign Manager",
      sublabel: "Outreach Campaigns",
      icon: Sparkles,
      color: "from-amber-400 to-orange-600",
      activeBorder: "border-amber-400",
      activeGlow: "shadow-amber-500/30",
    },
    {
      channelId: "EXPO" as SocialSubChannel,
      label: "Project Expo",
      sublabel: "V.S.B. Tech Expo Leads",
      icon: Rocket,
      color: "from-indigo-500 to-cyan-500",
      activeBorder: "border-cyan-400",
      activeGlow: "shadow-cyan-500/30",
    },
  ];

  const handleNavClick = (id: ActiveTab) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSocialSubChannelClick = (channel: SocialSubChannel) => {
    onTabChange("CONTACT_PLATFORM");
    if (onSelectSocialChannel) onSelectSocialChannel(channel);
    if (onCloseMobile) onCloseMobile();
  };

  const toggleAdmissionMenu = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsAdmissionCrmOpen(true);
      onTabChange("ADMISSIONS");
    } else {
      const nextState = !isAdmissionCrmOpen;
      setIsAdmissionCrmOpen(nextState);
      if (nextState && !isAnySubItemActive) {
        onTabChange("ADMISSIONS");
      }
    }
  };

  const toggleContactPlatformMenu = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsContactPlatformOpen(true);
      onTabChange("CONTACT_PLATFORM");
    } else {
      const nextState = !isContactPlatformOpen;
      setIsContactPlatformOpen(nextState);
      if (nextState && activeTab !== "CONTACT_PLATFORM") {
        onTabChange("CONTACT_PLATFORM");
      }
    }
  };

  const isLight = theme === "LIGHT";
  const isAnySubItemActive = filteredSubItems.some((item) => item.id === activeTab);

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
        <div className="flex-1 px-3 py-4 space-y-3 overflow-y-auto hide-scrollbar">
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

                })}
              </div>
            )}
          </div>

          {/* PARENT MENU ITEM: CONTACT PLATFORM / SOCIAL MEDIA */}
          <div className="space-y-1 mt-3">
            {isCollapsed ? (
              <Tooltip text="Contact Platform (Social Media & Channels)" position="right">
                <button
                  onClick={() => {
                    toggleContactPlatformMenu();
                    handleNavClick("CONTACT_PLATFORM");
                  }}
                  className={`w-full flex items-center justify-center p-3 rounded-2xl transition-all duration-300 relative ${
                    activeTab === "CONTACT_PLATFORM"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30 border border-indigo-400 scale-105"
                      : isLight
                      ? "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200"
                      : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10 hover:border-white/20"
                  }`}
                >
                  <Share2 className="w-5 h-5 text-indigo-400" />
                  {activeTab === "CONTACT_PLATFORM" && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
              </Tooltip>
            ) : (
              <div
                className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer group border ${
                  activeTab === "CONTACT_PLATFORM"
                    ? isLight
                      ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-md"
                      : "bg-indigo-950/50 border-indigo-500/40 text-indigo-200 shadow-lg shadow-indigo-950/50"
                    : isLight
                    ? "bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200"
                    : "bg-slate-900/60 hover:bg-slate-900 text-slate-200 border-white/10 hover:border-white/20"
                }`}
                onClick={() => {
                  toggleContactPlatformMenu();
                  handleNavClick("CONTACT_PLATFORM");
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110 shadow-sm ${
                      activeTab === "CONTACT_PLATFORM"
                        ? "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white"
                        : isLight
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    <Share2 className="w-4 h-4 text-indigo-400" />
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
                      Social Media & Channels
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      isLight
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                    }`}
                  >
                    {contactPlatformSubItems.length}
                  </span>
                  <div className="p-1 rounded-lg hover:bg-white/10 transition-transform">
                    {isContactPlatformOpen ? (
                      <ChevronDown className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NESTED INSIDE CONTACT PLATFORM */}
            {(isContactPlatformOpen || isCollapsed) && (
              <div
                className={`space-y-1 transition-all duration-300 ${
                  isCollapsed
                    ? "pt-2 space-y-2 border-t border-white/10 mt-2"
                    : "ml-3 pl-3 border-l-2 border-indigo-500/30 dark:border-indigo-400/20 mt-1.5 space-y-1.5"
                }`}
              >
                {contactPlatformSubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === "CONTACT_PLATFORM" && activeSocialChannel === item.channelId;

                  const buttonContent = (
                    <button
                      key={item.channelId}
                      onClick={() => handleSocialSubChannelClick(item.channelId)}
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
                      <Tooltip key={item.channelId} text={`${item.label} (${item.sublabel})`} position="right">
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

