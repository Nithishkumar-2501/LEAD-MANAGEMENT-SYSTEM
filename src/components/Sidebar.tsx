"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
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
import { User, ActiveTab, CampusLocation, Lead, Application } from "@/types/crm";
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
  applicants?: (Lead & { application: Application })[];
  onSelectApplicant?: (applicant: Lead & { application: Application }) => void;
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
  applicants = [],
  onSelectApplicant,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Close settings popup when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node)
      ) {
        setIsSettingsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSettingsMenuOpen(false);
      }
    }

    if (isSettingsMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSettingsMenuOpen]);

  const trimmedQuery = menuSearchQuery.trim().toLowerCase();
  const matchingApplicants =
    trimmedQuery.length > 0 && applicants
      ? applicants
          .filter(
            (app) =>
              app.name.toLowerCase().includes(trimmedQuery) ||
              app.email.toLowerCase().includes(trimmedQuery) ||
              app.phone.toLowerCase().includes(trimmedQuery) ||
              (app.courseInterest && app.courseInterest.toLowerCase().includes(trimmedQuery)) ||
              (app.campus && app.campus.toLowerCase().includes(trimmedQuery)) ||
              (app.district && app.district.toLowerCase().includes(trimmedQuery)) ||
              (app.school && app.school.toLowerCase().includes(trimmedQuery))
          )
          .slice(0, 5)
      : [];

  const handleSelectApplication = (applicant: Lead & { application: Application }) => {
    if (onSelectApplicant) {
      onSelectApplicant(applicant);
    }
    setMenuSearchQuery("");
    if (onCloseMobile) onCloseMobile();
  };

  const dashboardSubItems = [
    {
      id: "ADMIN_DASHBOARD" as ActiveTab,
      label: "Admin Dashboard",
      sublabel: "Executive Overview & TNEA",
      icon: ShieldCheck,
      color: "from-sky-500 to-blue-600",
      activeBorder: "border-sky-400",
      activeGlow: "shadow-sky-500/30",
    },
    {
      id: "USER_DASHBOARD" as ActiveTab,
      label: "User Dashboard",
      sublabel: "Counselor Lead Tasks",
      icon: UserCheck,
      color: "from-indigo-500 to-purple-600",
      activeBorder: "border-indigo-400",
      activeGlow: "shadow-indigo-500/30",
    },
    {
      id: "MARKETING_DASHBOARD" as ActiveTab,
      label: "Marketing Dashboard",
      sublabel: "Ad Campaigns & CPL ROI",
      icon: Megaphone,
      color: "from-purple-500 to-pink-600",
      activeBorder: "border-purple-400",
      activeGlow: "shadow-purple-500/30",
    },
    {
      id: "ECHO_DASHBOARD" as ActiveTab,
      label: "Echo Dashboard",
      sublabel: "WhatsApp & Voice Transcripts",
      icon: MessageSquare,
      color: "from-emerald-500 to-teal-600",
      activeBorder: "border-emerald-400",
      activeGlow: "shadow-emerald-500/30",
    },
  ];

  const admissionSubItems = [
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

  const isDashboardActive = dashboardSubItems.some((item) => item.id === activeTab);
  const isSocialActive = socialPlatformSubItems.some((item) => item.id === activeTab);
  const isAdmissionActive = filteredSubItems.some((item) => item.id === activeTab) || (!isDashboardActive && !isSocialActive);

  const [isDashboardOpen, setIsDashboardOpen] = useState(isDashboardActive);
  const [isAdmissionCrmOpen, setIsAdmissionCrmOpen] = useState(isAdmissionActive);
  const [isSocialPlatformOpen, setIsSocialPlatformOpen] = useState(isSocialActive);

  const toggleDashboardMenu = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsDashboardOpen(true);
      setIsAdmissionCrmOpen(false);
      setIsSocialPlatformOpen(false);
    } else {
      setIsDashboardOpen((prev) => {
        const next = !prev;
        if (next) {
          setIsAdmissionCrmOpen(false);
          setIsSocialPlatformOpen(false);
        }
        return next;
      });
    }
  };

  const toggleAdmissionMenu = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsAdmissionCrmOpen(true);
      setIsDashboardOpen(false);
      setIsSocialPlatformOpen(false);
    } else {
      setIsAdmissionCrmOpen((prev) => {
        const next = !prev;
        if (next) {
          setIsDashboardOpen(false);
          setIsSocialPlatformOpen(false);
        }
        return next;
      });
    }
  };

  const toggleSocialPlatformMenu = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsSocialPlatformOpen(true);
      setIsDashboardOpen(false);
      setIsAdmissionCrmOpen(false);
    } else {
      setIsSocialPlatformOpen((prev) => {
        const next = !prev;
        if (next) {
          setIsDashboardOpen(false);
          setIsAdmissionCrmOpen(false);
        }
        return next;
      });
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
          className={`fixed inset-0 z-40 lg:hidden bg-obsidian/30`}
          onClick={onCloseMobile}
        />
      )}

      {/* Main Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex-col border-r transition-all duration-300 bg-snow text-graphite border-cloud ${isCollapsed ? "w-20" : "w-64"} ${
          isOpenMobile ? "flex translate-x-0" : "hidden lg:flex lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header / Brand Emblem (V.S.B. Engineering College) */}
        <div
          className={`p-3.5 border-b flex items-center justify-between gap-2.5 border-cloud bg-snow`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Official V.S.B. Logo Badge */}
            <div className="w-9 h-9 rounded-full overflow-hidden border border-cloud bg-snow shrink-0 flex items-center justify-center p-0.5 transform hover:scale-105 transition-transform">
              <Image
                src="/vsb-logo.png"
                alt="V.S.B. Engineering College Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <h2
                  className={`font-semibold text-xs sm:text-sm tracking-tight truncate uppercase leading-tight text-obsidian`}
                >
                  V.S.B. ENGINEERING COLLEGE
                </h2>
                <p
                  className={`text-[9.5px] font-medium truncate flex items-center gap-1 mt-0.5 text-fog`}
                >
                  <MapPin className="w-3 h-3 text-ember shrink-0" />
                  <span>KARUR & COIMBATORE CAMPUSES</span>
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1 rounded-lg border transition-all shrink-0 bg-paper hover:bg-cloud border-cloud text-steel`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className={`lg:hidden p-1 rounded-lg border bg-paper border-cloud text-steel`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items Section */}
        <div className="flex-1 px-3 py-3 space-y-3 overflow-y-auto hide-scrollbar">
          {/* Search For Menu & Applications Input Bar */}
          {!isCollapsed && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-ash absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && matchingApplicants.length > 0) {
                      handleSelectApplication(matchingApplicants[0]);
                    }
                  }}
                  placeholder="Search Menu or Application..."
                  className="w-full bg-paper border border-cloud focus:border-ember rounded-btn pl-8 pr-7 py-1.5 text-xs text-graphite placeholder-ash focus:outline-none"
                />
                {menuSearchQuery && (
                  <button
                    onClick={() => setMenuSearchQuery("")}
                    className="absolute right-2 top-2 text-ash hover:text-obsidian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* CANDIDATE APPLICATIONS SEARCH RESULTS */}
              {trimmedQuery.length > 0 && (
                <div className="space-y-1.5 p-2 rounded-btn bg-snow border border-cloud animate-in fade-in duration-150">
                  <div className="text-[10px] font-semibold text-ember uppercase tracking-wider flex items-center justify-between px-1">
                    <span>Matching Applications ({matchingApplicants.length})</span>
                  </div>
                  {matchingApplicants.length > 0 ? (
                    <div className="space-y-1">
                      {matchingApplicants.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => handleSelectApplication(app)}
                          className="p-2 rounded-btn bg-snow hover:bg-paper border border-cloud hover:border-mist cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-1">
                            <div className="font-medium text-xs text-obsidian group-hover:text-ember truncate">
                              {app.name}
                            </div>
                            <div className="text-[10px] text-fog truncate font-mono">
                              {app.phone} • {app.campus}
                            </div>
                          </div>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-badge bg-paper text-iron border border-cloud shrink-0">
                            View App →
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-fog py-1 text-center font-medium">
                      No applications found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION HEADLINE */}
          <div
            className={`px-2 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
              isCollapsed ? "justify-center text-center" : ""
             } text-ash`}
          >
            <Sparkles className="w-3 h-3 text-ember shrink-0" />
            <span>{isCollapsed ? "SYS" : "SYSTEM MENU"}</span>
          </div>

          {/* PARENT MENU ITEM 1: DASHBOARD */}
          <div className="space-y-1">
            {isCollapsed ? (
              <Tooltip text="Dashboard" position="right">
                <button
                  onClick={toggleDashboardMenu}
                  className={`w-full flex items-center justify-center p-3 rounded-2xl transition-all duration-300 relative ${
                    dashboardSubItems.some((item) => item.id === activeTab)
                      ? "bg-obsidian text-snow border border-obsidian"
                      : "bg-paper text-iron hover:bg-cloud border border-cloud"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                </button>
              </Tooltip>
            ) : (
              <div
                id="nav-category-dashboard"
                className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-medium transition-all duration-300 cursor-pointer group border ${
                  dashboardSubItems.some((item) => item.id === activeTab)
                    ? "bg-paper border-cloud text-obsidian"
                    : "bg-snow hover:bg-paper text-graphite border-cloud"
                }`}
                onClick={toggleDashboardMenu}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-btn shrink-0 transition-transform group-hover:scale-110 ${
                      dashboardSubItems.some((item) => item.id === activeTab)
                        ? "bg-obsidian text-snow"
                        : "bg-paper text-steel"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left truncate">
                    <span className="font-medium text-xs tracking-tight truncate">
                      Dashboard
                    </span>
                    <span
                      className={`text-[10px] font-normal truncate text-fog`}
                    >
                      Management Views
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded-badge bg-paper text-iron border border-cloud`}
                  >
                    4
                  </span>
                  <div className="p-1 rounded-lg hover:bg-white/10 transition-transform">
                    {isDashboardOpen ? (
                      <ChevronDown className="w-4 h-4 text-sky-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NESTED INSIDE DASHBOARD */}
            {(isDashboardOpen || isCollapsed) && (
              <div
                className={`space-y-1 transition-all duration-300 ${
                  isCollapsed
                    ? "pt-2 space-y-2 border-t border-cloud mt-2"
                    : "ml-3 pl-3 border-l-2 border-cloud mt-1.5 space-y-1.5"
                }`}
              >
                {dashboardSubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  const buttonContent = (
                    <button
                      key={item.id}
                      id={`nav-${item.id.toLowerCase().replace(/_/g, '-')}`}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 ${
                        isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
                      } rounded-btn text-xs font-medium transition-all duration-200 group relative ${
                        isActive
                          ? "bg-obsidian text-snow border border-obsidian"
                          : "bg-snow hover:bg-paper text-iron hover:text-graphite border border-cloud"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? "bg-snow/20 text-snow"
                            : "bg-paper text-steel"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {!isCollapsed && (
                        <div className="flex flex-col items-start min-w-0 text-left">
                          <span
                            className={`font-medium text-[11px] tracking-tight truncate w-full ${
                              isActive
                                ? "text-snow"
                                : "text-graphite"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`text-[9px] font-normal truncate w-full ${
                              isActive
                                ? "text-snow/80"
                                : "text-fog"
                            }`}
                          >
                            {item.sublabel}
                          </span>
                        </div>
                      )}

                      {isActive && !isCollapsed && (
                        <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-ember" />
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

          {/* PARENT MENU ITEM: ADMISSION CRM */}
          <div className="space-y-1">
            {isCollapsed ? (
              <Tooltip text="Admission CRM" position="right">
                <button
                  onClick={toggleAdmissionMenu}
                  className={`w-full flex items-center justify-center p-3 rounded-2xl transition-all duration-300 relative ${
                    isAnySubItemActive
                      ? "bg-obsidian text-snow border border-obsidian"
                      : "bg-paper text-iron hover:bg-cloud border border-cloud"
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  {isAnySubItemActive && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-ember" />
                  )}
                </button>
              </Tooltip>
            ) : (
              <div
                className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-medium transition-all duration-300 cursor-pointer group border ${
                  isAnySubItemActive
                    ? "bg-paper border-cloud text-obsidian"
                    : "bg-snow hover:bg-paper text-graphite border-cloud"
                }`}
                onClick={toggleAdmissionMenu}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-btn shrink-0 transition-transform group-hover:scale-110 ${
                      isAnySubItemActive
                        ? "bg-obsidian text-snow"
                        : "bg-paper text-steel"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left truncate">
                    <span className="font-medium text-xs tracking-tight truncate">
                      Admission CRM
                    </span>
                    <span
                      className={`text-[10px] font-normal truncate text-fog`}
                    >
                      Management Hub
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded-badge bg-paper text-iron border border-cloud`}
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
                    ? "pt-2 space-y-2 border-t border-cloud mt-2"
                    : "ml-3 pl-3 border-l-2 border-cloud mt-1.5 space-y-1.5"
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
                      } rounded-btn text-xs font-medium transition-all duration-200 group relative ${
                        isActive
                          ? "bg-obsidian text-snow border border-obsidian"
                          : "bg-snow hover:bg-paper text-iron hover:text-graphite border border-cloud"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? "bg-snow/20 text-snow"
                            : "bg-paper text-steel"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {!isCollapsed && (
                        <div className="flex flex-col items-start min-w-0 text-left">
                          <span
                            className={`font-medium text-[11px] tracking-tight truncate w-full ${
                              isActive
                                ? "text-snow"
                                : "text-graphite"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`text-[9px] font-normal truncate w-full ${
                              isActive
                                ? "text-snow/80"
                                : "text-fog"
                            }`}
                          >
                            {item.sublabel}
                          </span>
                        </div>
                      )}

                      {isActive && !isCollapsed && (
                        <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-ember" />
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
          <div className="space-y-1 pt-2 border-t border-cloud mt-2">
            {isCollapsed ? (
              <Tooltip text="Contact & Social Media Platform" position="right">
                <button
                  onClick={toggleSocialPlatformMenu}
                  className={`w-full flex items-center justify-center p-3 rounded-2xl transition-all duration-300 relative ${
                    isAnySocialSubItemActive
                      ? "bg-obsidian text-snow border border-obsidian"
                      : "bg-paper text-iron hover:bg-cloud border border-cloud"
                  }`}
                >
                  <Share2 className="w-5 h-5 text-iron" />
                  {isAnySocialSubItemActive && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-ember" />
                  )}
                </button>
              </Tooltip>
            ) : (
              <div
                className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-xs font-medium transition-all duration-300 cursor-pointer group border ${
                  isAnySocialSubItemActive
                    ? "bg-paper border-cloud text-obsidian"
                    : "bg-snow hover:bg-paper text-graphite border-cloud"
                }`}
                onClick={toggleSocialPlatformMenu}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-btn shrink-0 transition-transform group-hover:scale-110 ${
                      isAnySocialSubItemActive
                        ? "bg-obsidian text-snow"
                        : "bg-paper text-steel"
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left truncate">
                    <span className="font-medium text-xs tracking-tight truncate">
                      Contact Platform
                    </span>
                    <span
                      className={`text-[10px] font-normal truncate text-fog`}
                    >
                      Social Media Channels
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded-badge bg-paper text-iron border border-cloud`}
                  >
                    8
                  </span>
                  <div className="p-1 rounded-lg hover:bg-white/10 transition-transform">
                    {isSocialPlatformOpen ? (
                      <ChevronDown className="w-4 h-4 text-iron" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-ash" />
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
                    ? "pt-2 space-y-2 border-t border-cloud mt-2"
                    : "ml-3 pl-3 border-l-2 border-cloud mt-1.5 space-y-1.5"
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
                      } rounded-btn text-xs font-medium transition-all duration-200 group relative ${
                        isActive
                          ? "bg-obsidian text-snow border border-obsidian"
                          : "bg-snow hover:bg-paper text-iron hover:text-graphite border border-cloud"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? "bg-snow/20 text-snow"
                            : "bg-paper text-steel"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {!isCollapsed && (
                        <div className="flex flex-col items-start min-w-0 text-left">
                          <span
                            className={`font-medium text-[11px] tracking-tight truncate w-full ${
                              isActive
                                ? "text-snow"
                                : "text-graphite"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`text-[9px] font-normal truncate w-full ${
                              isActive
                                ? "text-snow/80"
                                : "text-fog"
                            }`}
                          >
                            {item.sublabel}
                          </span>
                        </div>
                      )}

                      {isActive && !isCollapsed && (
                        <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-ember" />
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

        {/* Sidebar Footer: Unified Compact Bar with Settings Icon Option & Logout */}
        <div
          ref={settingsMenuRef}
          className={`p-2.5 border-t relative border-cloud bg-snow`}
        >
          {/* Floating Settings Popover Menu */}
          {isSettingsMenuOpen && (
            <div
              className={`absolute z-50 p-3 rounded-2xl shadow-2xl border backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 ${
                isCollapsed
                  ? "left-full bottom-2 ml-3 w-72"
                  : "bottom-full left-2 right-2 mb-3"
              } bg-snow border-cloud text-graphite`}
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-cloud">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-paper text-ember border border-cloud">
                    <Settings className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-graphite">
                    Preferences & Tools
                  </span>
                </div>
                <button
                  onClick={() => setIsSettingsMenuOpen(false)}
                  className="p-1 rounded-lg text-fog hover:text-obsidian hover:bg-paper transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Menu Items List */}
              <div className="space-y-1.5">
                {/* Admin Settings Console */}
                {currentUserRole === "ADMIN" && (
                  <button
                    onClick={() => {
                      handleNavClick("SETTINGS");
                      setIsSettingsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-btn border text-xs font-medium transition-all group cursor-pointer ${
                      activeTab === "SETTINGS"
                        ? "bg-obsidian text-snow border-obsidian"
                        : "bg-paper hover:bg-cloud text-graphite border-cloud"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          activeTab === "SETTINGS"
                            ? "bg-snow/20 text-snow"
                            : "bg-paper text-ember"
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="font-medium text-xs">Admin Settings</span>
                        <span className="text-[10px] text-fog font-normal">System Configuration</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-badge bg-paper text-ember font-medium border border-cloud">
                      Console
                    </span>
                  </button>
                )}

                {/* Theme Toggle Button */}
                {onThemeChange && (
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-btn border text-xs bg-paper border-cloud`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          theme === "DARK"
                            ? "bg-paper text-iron"
                            : "bg-paper text-ember"
                        }`}
                      >
                        {theme === "DARK" ? (
                          <Moon className="w-4 h-4" />
                        ) : (
                          <Sun className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-xs">
                          {theme === "DARK" ? "Dark Mode" : "Light Mode"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {theme === "DARK" ? "Dark theme active" : "Light theme active"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onThemeChange(theme === "DARK" ? "LIGHT" : "DARK");
                      }}
                      className="px-2.5 py-1 rounded-btn bg-obsidian hover:bg-graphite text-snow font-medium text-[10px] transition-all cursor-pointer"
                    >
                      Switch
                    </button>
                  </div>
                )}

                {/* Download App Link */}
                <button
                  onClick={() => {
                    alert("Meritto Mobile App APK download initiated for Android & iOS.");
                    setIsSettingsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-btn border text-xs font-medium transition-all group cursor-pointer bg-paper hover:bg-cloud text-graphite border-cloud`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-paper text-ember border border-cloud">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-xs">Download App</span>
                      <span className="text-[10px] text-slate-400">Android & iOS APK</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-ember font-medium group-hover:translate-x-0.5 transition-transform">
                    APK ↓
                  </span>
                </button>
              </div>

              {/* Account Quick Info */}
              <div className="mt-2.5 pt-2.5 border-t border-cloud flex items-center justify-between text-[11px] text-fog">
                <span className="truncate">{loggedInUsername}</span>
                <span className="px-1.5 py-0.5 rounded-pill bg-paper text-iron font-medium text-[9px] border border-cloud">
                  {currentUserRole === "ADMIN" ? "Admin" : "Teacher"}
                </span>
              </div>
            </div>
          )}

          {/* Collapsed vs Expanded Footer Bar */}
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-obsidian text-snow font-medium text-xs flex items-center justify-center shrink-0">
                VSB
              </div>

              {/* Settings Icon Button */}
              <Tooltip text="Settings & Tools" position="right">
                <button
                  onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                  className={`p-2 rounded-btn border transition-all cursor-pointer relative ${
                    isSettingsMenuOpen || activeTab === "SETTINGS"
                      ? "bg-obsidian text-snow border-obsidian"
                      : "bg-paper hover:bg-cloud text-steel border-cloud"
                  }`}
                >
                  <Settings
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isSettingsMenuOpen ? "rotate-90 text-snow" : "text-ember"
                    }`}
                  />
                  {activeTab === "SETTINGS" && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-ember rounded-full" />
                  )}
                </button>
              </Tooltip>

              {/* Logout Button */}
              <Tooltip text="Logout Portal" position="right">
                <button
                  onClick={onLogout}
                  className={`p-2 rounded-btn border transition-all shrink-0 cursor-pointer bg-paper hover:bg-red-50 hover:text-red-600 border-cloud text-fog`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <div
              className={`flex items-center justify-between gap-2 p-2 rounded-2xl border transition-all bg-snow border-cloud`}
            >
              {/* User Profile */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-obsidian text-snow font-medium text-xs flex items-center justify-center shrink-0">
                  VSB
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-medium truncate text-obsidian`}
                  >
                    {loggedInUsername}
                  </p>
                  <p className="text-[10px] font-medium truncate text-ember">
                    {currentUserRole === "ADMIN" ? "System Admin" : "Faculty Lead"}
                  </p>
                </div>
              </div>

              {/* Actions: Settings Icon + Logout Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Setting Icon Option */}
                <Tooltip
                  text={
                    isSettingsMenuOpen
                      ? "Close Settings"
                      : "Settings, Theme & Tools"
                  }
                  position="top"
                >
                  <button
                    onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                    aria-label="Settings and Preferences"
                    className={`p-2 rounded-btn border transition-all cursor-pointer relative group ${
                      isSettingsMenuOpen || activeTab === "SETTINGS"
                        ? "bg-obsidian text-snow border-obsidian"
                        : "bg-paper hover:bg-cloud text-steel border-cloud"
                    }`}
                  >
                    <Settings
                      className={`w-4 h-4 transition-transform duration-300 group-hover:rotate-45 ${
                        isSettingsMenuOpen
                          ? "rotate-90 text-white"
                          : activeTab === "SETTINGS"
                          ? "text-snow"
                          : "text-ember"
                      }`}
                    />
                    {activeTab === "SETTINGS" && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-ember rounded-full" />
                    )}
                  </button>
                </Tooltip>

                {/* Logout Button */}
                <Tooltip text="Logout Portal" position="top">
                  <button
                    onClick={onLogout}
                    className={`p-2 rounded-btn border transition-all shrink-0 cursor-pointer bg-paper hover:bg-red-50 hover:text-red-600 border-cloud text-fog`}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

