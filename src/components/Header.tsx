"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Bell,
  Check,
  Sparkles,
  GraduationCap,
  UserCheck,
  BookOpen,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  MapPin,
  Contact,
  Menu,
  X,
  Lock,
  Sun,
  Moon,
} from "lucide-react";
import { User, ActiveTab, CampusLocation, Lead, Application } from "@/types/crm";
import Tooltip from "@/components/Tooltip";

interface HeaderProps {
  user: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedCampus: CampusLocation;
  onCampusChange: (campus: CampusLocation) => void;
  onLogout: () => void;
  loggedInCampus: "KARUR" | "COIMBATORE";
  currentUserRole: "ADMIN" | "TEACHER";
  loggedInUsername?: string;
  theme?: "LIGHT" | "DARK";
  onThemeChange?: (newTheme: "LIGHT" | "DARK") => void;
  onToggleMobileSidebar?: () => void;
  onOpenAddLeadModal?: () => void;
  applicants?: (Lead & { application: Application })[];
  onSelectApplicant?: (applicant: Lead & { application: Application }) => void;
}

export default function Header({
  user,
  searchQuery,
  onSearchChange,
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
  onToggleMobileSidebar,
  onOpenAddLeadModal,
  applicants = [],
  onSelectApplicant,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(true);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults =
    trimmedQuery.length > 0 && applicants
      ? applicants
          .filter((item) => {
            return (
              item.name.toLowerCase().includes(trimmedQuery) ||
              item.email.toLowerCase().includes(trimmedQuery) ||
              item.phone.toLowerCase().includes(trimmedQuery) ||
              (item.courseInterest && item.courseInterest.toLowerCase().includes(trimmedQuery)) ||
              (item.campus && item.campus.toLowerCase().includes(trimmedQuery)) ||
              (item.school && item.school.toLowerCase().includes(trimmedQuery)) ||
              (item.district && item.district.toLowerCase().includes(trimmedQuery)) ||
              (item.application?.stage && item.application.stage.toLowerCase().includes(trimmedQuery)) ||
              (item.status && item.status.toLowerCase().includes(trimmedQuery))
            );
          })
          .slice(0, 6)
      : [];

  const handleResultClick = (applicant: Lead & { application: Application }) => {
    if (onSelectApplicant) {
      onSelectApplicant(applicant);
    }
    setShowSearchResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      handleResultClick(searchResults[0]);
    }
  };
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New TNEA Application registered for VSB Karur CSE", time: "5m ago", read: false },
    { id: 2, text: "Fee payment of ₹95,000 verified for VSB Coimbatore", time: "45m ago", read: false },
    { id: 3, text: "New faculty member Dr. K. Arulmurugan assigned", time: "2h ago", read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const navItems = [
    { id: "ADMISSIONS" as ActiveTab, label: "Admissions CRM", icon: GraduationCap },
    { id: "CONTACTS" as ActiveTab, label: "Lead Manager", icon: UserCheck },
    { id: "TEACHERS" as ActiveTab, label: "Teacher Directory", icon: BookOpen },
    { id: "CAMPUSES" as ActiveTab, label: "Campus & Courses", icon: Building2 },
    { id: "PAYMENTS" as ActiveTab, label: "Fee Payments", icon: CreditCard },
    { id: "SETTINGS" as ActiveTab, label: "Admin Settings", icon: Settings },
  ];

  const filteredNavItems = currentUserRole === "TEACHER"
    ? navItems.filter((item) => item.id !== "PAYMENTS" && item.id !== "SETTINGS")
    : navItems;

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-snow border-b border-cloud px-3 sm:px-6 py-3 flex flex-col gap-2.5 sm:gap-3.5">
      {/* Top Bar: Brand, Campus Selector & Admin Profile */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Hamburger (mobile) + Brand */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          {/* Hamburger button to open mobile left sidebar */}
          <button
            onClick={() => onToggleMobileSidebar ? onToggleMobileSidebar() : setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-btn bg-paper border border-cloud text-steel hover:text-obsidian transition-all flex items-center justify-center cursor-pointer"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Official V.S.B. Engineering College Logo Emblem */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-cloud bg-snow shrink-0 flex items-center justify-center p-0.5 transform hover:scale-105 transition-transform">
            <Image
              src="/vsb-logo.png"
              alt="V.S.B. Engineering College Official Logo"
              width={48}
              height={48}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm sm:text-base md:text-lg text-obsidian tracking-tight flex items-center gap-2 truncate">
              <span className="truncate text-obsidian">V.S.B. ENGINEERING COLLEGE</span>
              <span className="hidden sm:inline-flex items-center text-[10px] font-medium text-snow bg-ember px-3 py-0.5 rounded-badge shrink-0">
                SPHEREX CRM
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-fog flex items-center gap-1.5 font-medium truncate">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-ember shrink-0" />
              <span className="truncate">KARUR & COIMBATORE CAMPUSES</span>
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Two Campus Icon Selection Bar */}
          <div className="hidden md:flex items-center gap-1.5 bg-paper p-1.5 rounded-2xl border border-cloud text-xs font-medium">
            {/* Karur Campus Icon Button */}
            {loggedInCampus === "KARUR" ? (
              <Tooltip text="Active Session: V.S.B. Karur Campus">
                <button
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-btn bg-obsidian text-snow font-medium transition-all cursor-pointer"
                  disabled
                >
                  <Building2 className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                  <span>Karur Campus</span>
                </button>
              </Tooltip>
            ) : (
              <Tooltip text="Access restricted to Karur Admin">
                <button
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-btn text-ash font-medium cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity"
                  disabled
                >
                  <Lock className="w-4 h-4 text-ash" />
                  <span>Karur Campus</span>
                </button>
              </Tooltip>
            )}

            {/* Coimbatore Campus Icon Button */}
            {loggedInCampus === "COIMBATORE" ? (
              <Tooltip text="Active Session: V.S.B. Coimbatore Campus">
                <button
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-btn bg-obsidian text-snow font-medium transition-all cursor-pointer"
                  disabled
                >
                  <GraduationCap className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                  <span>Coimbatore Campus</span>
                </button>
              </Tooltip>
            ) : (
              <Tooltip text="Access restricted to Coimbatore Admin">
                <button
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-btn text-ash font-medium cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity"
                  disabled
                >
                  <Lock className="w-4 h-4 text-ash" />
                  <span>Coimbatore Campus</span>
                </button>
              </Tooltip>
            )}
          </div>

          {/* Search bar — desktop */}
          <div className="relative hidden lg:block w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fog" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search candidate applications..."
              className="w-full bg-snow border border-cloud rounded-pill pl-9 pr-3.5 py-1.5 text-xs text-graphite placeholder-ash focus:outline-none focus:border-mist font-medium"
            />

            {/* Dropdown Search Results Overlay */}
            {trimmedQuery.length > 0 && showSearchResults && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-card bg-snow border border-cloud p-3 shadow-md-a z-50 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between px-2 pb-1.5 border-b border-cloud">
                  <span className="text-[11px] font-semibold text-obsidian uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-ember" /> Search Applications ({searchResults.length})
                  </span>
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="p-1 rounded text-fog hover:text-obsidian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 hide-scrollbar">
                    {searchResults.map((applicant) => (
                      <div
                        key={applicant.id}
                        onClick={() => handleResultClick(applicant)}
                        className="p-2.5 rounded-btn bg-snow hover:bg-paper border border-cloud hover:border-mist transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-obsidian flex items-center justify-center text-snow font-semibold text-xs shrink-0">
                            {applicant.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="font-medium text-obsidian group-hover:text-ember transition-colors truncate">
                              {applicant.name}
                            </div>
                            <div className="text-[11px] text-fog truncate flex items-center gap-1.5">
                              <span>{applicant.phone}</span>
                              <span>•</span>
                              <span className="text-ember font-medium">{applicant.campus}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <span className="px-2 py-0.5 rounded-badge text-[10px] font-medium bg-paper text-iron border border-cloud">
                            {applicant.application?.stage || applicant.status || "INQUIRY"}
                          </span>
                          <span className="text-[10px] text-ember group-hover:underline font-medium flex items-center gap-0.5">
                            Open App →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-fog text-xs">
                    No candidate applications matching &quot;{searchQuery}&quot;.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search icon — mobile/tablet */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="lg:hidden p-2 sm:p-2.5 rounded-full bg-paper border border-cloud hover:border-mist text-steel transition-all"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Theme Toggle Button (Light Mode & Dark Mode) */}
          <Tooltip text={`Switch to ${theme === "DARK" ? "Light Mode ☀️" : "Dark Mode 🌙"}`}>
            <button
              onClick={() => onThemeChange?.(theme === "DARK" ? "LIGHT" : "DARK")}
              className="p-2 sm:p-2.5 rounded-full bg-paper border border-cloud hover:border-mist text-iron transition-all flex items-center justify-center cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "DARK" ? (
                <Sun className="w-4 h-4 text-ember" />
              ) : (
                <Moon className="w-4 h-4 text-iron" />
              )}
            </button>
          </Tooltip>

          {/* Notifications button */}
          <div className="relative">
            <Tooltip text="System Notifications">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 sm:p-2.5 rounded-full bg-paper border border-cloud hover:border-mist text-steel transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-ember text-snow text-[10px] font-medium flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </Tooltip>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bubble-card p-4 z-50">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-cloud">
                  <h4 className="text-xs font-semibold text-obsidian uppercase tracking-wider">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-ember hover:underline flex items-center gap-1 font-medium"
                    >
                      <Check className="w-3 h-3" /> Clear All
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-btn text-xs flex flex-col gap-1 ${
                        item.read
                          ? "bg-paper text-fog"
                          : "bg-paper text-graphite border-l-2 border-ember"
                      }`}
                    >
                      <span>{item.text}</span>
                      <span className="text-[10px] text-ash">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-cloud">
            <div className="flex items-center gap-2 sm:gap-2.5 bg-snow border border-cloud px-2 sm:px-3.5 py-1 rounded-pill">
              <div className="w-6 h-6 rounded-full bg-obsidian text-snow font-medium text-[10px] flex items-center justify-center">
                {currentUserRole === "ADMIN" ? "ADM" : (loggedInUsername ? loggedInUsername.slice(0, 2).toUpperCase() : "TCH")}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-graphite">
                {loggedInUsername || (loggedInCampus === "KARUR" ? "adminkarur@123" : "admincovai@123")}{" "}
                <span className="text-[10px] text-fog font-medium">({currentUserRole === "ADMIN" ? "Admin" : "Teacher"})</span>
              </span>
            </div>
            <Tooltip text="Logout of V.S.B. Portal">
              <button
                onClick={onLogout}
                className="p-2 sm:p-2.5 rounded-full bg-paper border border-cloud hover:bg-red-50 hover:border-red-200 text-fog hover:text-red-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar — expands below header when toggled */}
      {mobileSearchOpen && (
        <div className="lg:hidden relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fog" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search candidate applications..."
              autoFocus
              className="w-full bg-snow border border-cloud rounded-pill pl-9 pr-3.5 py-2 text-xs text-graphite placeholder-ash focus:outline-none focus:border-mist font-medium"
            />
          </div>

          {/* Mobile Dropdown Search Results Overlay */}
          {trimmedQuery.length > 0 && showSearchResults && (
            <div className="mt-2 w-full rounded-card bg-snow border border-cloud p-3 shadow-md-a z-50 text-xs space-y-2">
              <div className="flex items-center justify-between px-2 pb-1.5 border-b border-cloud">
                <span className="text-[11px] font-semibold text-obsidian uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-ember" /> Search Applications ({searchResults.length})
                </span>
                <button
                  onClick={() => setShowSearchResults(false)}
                  className="p-1 rounded text-fog hover:text-obsidian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 hide-scrollbar">
                  {searchResults.map((applicant) => (
                    <div
                      key={applicant.id}
                      onClick={() => handleResultClick(applicant)}
                      className="p-2.5 rounded-btn bg-snow hover:bg-paper border border-cloud hover:border-mist transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-obsidian flex items-center justify-center text-snow font-semibold text-xs shrink-0">
                          {applicant.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-medium text-obsidian group-hover:text-ember transition-colors truncate">
                            {applicant.name}
                          </div>
                          <div className="text-[11px] text-fog truncate flex items-center gap-1.5">
                            <span>{applicant.phone}</span>
                            <span>•</span>
                            <span className="text-ember font-medium">{applicant.campus}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <span className="px-2 py-0.5 rounded-badge text-[10px] font-medium bg-paper text-iron border border-cloud">
                          {applicant.application?.stage || applicant.status || "INQUIRY"}
                        </span>
                        <span className="text-[10px] text-ember font-medium flex items-center gap-0.5">
                          Open App →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-fog text-xs">
                  No candidate applications matching &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Campus Selector — shown below top bar on small screens */}
      <div className="md:hidden overflow-x-auto hide-scrollbar -mx-1">
        <div className="flex items-center gap-1.5 bg-paper p-1.5 rounded-2xl border border-cloud text-[11px] font-medium w-max">
          {/* Karur Campus */}
          {loggedInCampus === "KARUR" ? (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-obsidian text-snow font-medium whitespace-nowrap"
              disabled
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Karur Campus</span>
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-ash opacity-40 cursor-not-allowed whitespace-nowrap"
              disabled
            >
              <Lock className="w-3 h-3" />
              <span>Karur Campus</span>
            </button>
          )}

          {/* Coimbatore Campus */}
          {loggedInCampus === "COIMBATORE" ? (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-obsidian text-snow font-medium whitespace-nowrap"
              disabled
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Coimbatore Campus</span>
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-ash opacity-40 cursor-not-allowed whitespace-nowrap"
              disabled
            >
              <Lock className="w-3 h-3" />
              <span>Coimbatore Campus</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Full Navigation Menu — slide-down panel */}
      {mobileMenuOpen && (
        <div className="sm:hidden flex flex-col gap-1.5 pb-1 border-t border-cloud pt-2 animate-in slide-in-from-top duration-200">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "glossy-btn"
                    : "bg-paper border border-cloud text-iron hover:bg-cloud/50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

    </header>
  );
}
