"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Sparkles,
  GraduationCap,
  UserCheck,
  BookOpen,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  MapPin,
  Menu,
  X,
  Lock,
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
  onOpenNoraAi?: (initialQuery?: string) => void;
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
  onOpenNoraAi,
}: HeaderProps) {
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
    <header className="sticky top-0 z-30 w-full liquid-glass border-b border-slate-200 dark:border-white/20 px-2.5 sm:px-6 py-2.5 flex flex-col gap-2 sm:gap-3.5 shadow-2xl">
      {/* Top Bar: Brand, Campus Selector & Right Navigation Controls */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-4 min-w-0">
        {/* Left: Official College Brand */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 shrink">
          {/* Official V.S.B. Engineering College Logo Emblem */}
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-amber-400 shadow-lg bg-white shrink-0 flex items-center justify-center p-0.5 transform hover:scale-105 transition-transform">
            <Image
              src="/vsb-logo.png"
              alt="V.S.B. Engineering College Official Logo"
              width={44}
              height={44}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-xs sm:text-base md:text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="truncate text-slate-900 dark:text-white font-black hidden sm:inline">V.S.B. ENGINEERING COLLEGE</span>
              <span className="truncate text-slate-900 dark:text-white font-black sm:hidden">V.S.B. COLLEGE</span>
              <span className="hidden md:inline-flex items-center text-[10px] font-black text-black dark:text-sky-200 bg-sky-200 dark:bg-sky-500/20 border border-sky-400 dark:border-sky-400/40 px-2.5 py-0.5 rounded-full shrink-0">
                SPHEREX CRM
              </span>
            </h1>
            <p className="text-[9px] sm:text-xs text-slate-600 dark:text-sky-200 flex items-center gap-1 font-extrabold truncate">
              <MapPin className="w-3 h-3 text-pink-600 dark:text-pink-400 shrink-0" />
              <span className="truncate">KARUR & COIMBATORE</span>
            </p>
          </div>
        </div>

        {/* Right: Controls (Ask Nora AI, Search Icon, Logout, and Menu on Right Side) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Two Campus Icon Selection Bar */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-300 dark:border-white/20 text-xs font-semibold backdrop-blur-2xl shrink-0">
            {/* Karur Campus Icon Button */}
            {loggedInCampus === "KARUR" ? (
              <Tooltip text="Active Session: V.S.B. Karur Campus">
                <button
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold shadow-lg shadow-sky-500/40 transform hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                  disabled
                >
                  <Building2 className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                  <span>Karur Campus</span>
                </button>
              </Tooltip>
            ) : (
              <Tooltip text="Access restricted to Karur Admin">
                <button
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-500 font-bold cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity"
                  disabled
                >
                  <Lock className="w-4 h-4 text-slate-700 dark:text-slate-500" />
                  <span>Karur Campus</span>
                </button>
              </Tooltip>
            )}

            {/* Coimbatore Campus Icon Button */}
            {loggedInCampus === "COIMBATORE" ? (
              <Tooltip text="Active Session: V.S.B. Coimbatore Campus">
                <button
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg shadow-pink-500/40 transform hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                  disabled
                >
                  <GraduationCap className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                  <span>Coimbatore Campus</span>
                </button>
              </Tooltip>
            ) : (
              <Tooltip text="Access restricted to Coimbatore Admin">
                <button
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-500 font-bold cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity"
                  disabled
                >
                  <Lock className="w-4 h-4 text-slate-700 dark:text-slate-500" />
                  <span>Coimbatore Campus</span>
                </button>
              </Tooltip>
            )}
          </div>

          {/* Search bar — desktop */}
          <div className="relative hidden lg:block w-64 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
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
              className="w-full bg-slate-100 dark:bg-slate-900/70 border border-slate-300 dark:border-white/20 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 backdrop-blur-xl font-bold"
            />

            {/* Dropdown Search Results Overlay */}
            {trimmedQuery.length > 0 && showSearchResults && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-sky-500/40 p-3 shadow-2xl z-50 backdrop-blur-2xl text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between px-2 pb-1.5 border-b border-slate-800">
                  <span className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Search Applications ({searchResults.length})
                  </span>
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
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
                        className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-sky-950/70 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-md">
                            {applicant.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                              {applicant.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                              <span>{applicant.phone}</span>
                              <span>•</span>
                              <span className="text-sky-400 font-semibold">{applicant.campus}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-950 text-sky-300 border border-sky-800">
                            {applicant.application?.stage || applicant.status || "INQUIRY"}
                          </span>
                          <span className="text-[10px] text-sky-400 group-hover:underline font-bold flex items-center gap-0.5">
                            Open App →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No candidate applications matching &quot;{searchQuery}&quot;.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ask Nora AI Pill Button matching Reference Design */}
          <button
            type="button"
            onClick={() => onOpenNoraAi?.()}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-400/40 shrink-0"
            title="Ask Nora AI to analyze the live student database"
          >
            <img
              src="/nora-logo.png"
              alt="NORA AI Logo"
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover ring-1 ring-white/60 shrink-0"
            />
            <span className="tracking-wide text-xs whitespace-nowrap">Ask Nora AI</span>
          </button>

          {/* Search Icon — mobile/tablet (Moved to the Right Side of Ask Nora AI) */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="lg:hidden p-2 sm:p-2 rounded-full bg-white dark:bg-slate-900/70 border border-slate-300 dark:border-white/20 hover:border-sky-400 text-slate-700 dark:text-sky-200 transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer"
            aria-label="Search"
            title="Search Candidate Applications"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          <Tooltip text="Logout of V.S.B. Portal">
            <button
              onClick={onLogout}
              className="p-2 sm:p-2 rounded-full bg-white dark:bg-slate-900/70 border border-slate-300 dark:border-white/20 hover:bg-rose-950/80 hover:border-rose-500/50 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Menu / Hamburger Icon — Moved to FAR RIGHT SIDE */}
          <button
            onClick={() => onToggleMobileSidebar ? onToggleMobileSidebar() : setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 sm:p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/20 text-slate-700 dark:text-sky-300 hover:text-sky-600 dark:hover:text-white transition-all shadow-md flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Toggle navigation sidebar"
            title="Menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Search Bar — expands below header when toggled */}
      {mobileSearchOpen && (
        <div className="lg:hidden relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400" />
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
              className="w-full bg-slate-900/70 border border-white/20 rounded-full pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 backdrop-blur-xl font-bold"
            />
          </div>

          {/* Mobile Dropdown Search Results Overlay */}
          {trimmedQuery.length > 0 && showSearchResults && (
            <div className="mt-2 w-full rounded-2xl bg-slate-950/95 border border-sky-500/40 p-3 shadow-2xl z-50 backdrop-blur-2xl text-xs space-y-2">
              <div className="flex items-center justify-between px-2 pb-1.5 border-b border-slate-800">
                <span className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Search Applications ({searchResults.length})
                </span>
                <button
                  onClick={() => setShowSearchResults(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
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
                      className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-sky-950/70 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-md">
                          {applicant.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                            {applicant.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                            <span>{applicant.phone}</span>
                            <span>•</span>
                            <span className="text-sky-400 font-semibold">{applicant.campus}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-950 text-sky-300 border border-sky-800">
                          {applicant.application?.stage || applicant.status || "INQUIRY"}
                        </span>
                        <span className="text-[10px] text-sky-400 font-bold flex items-center gap-0.5">
                          Open App →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-slate-400 text-xs">
                  No candidate applications matching &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Campus Selector — shown below top bar on small screens */}
      <div className="md:hidden overflow-x-auto hide-scrollbar -mx-1">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/20 text-[11px] font-semibold backdrop-blur-2xl w-max">
          {/* Karur Campus */}
          {loggedInCampus === "KARUR" ? (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold shadow-md whitespace-nowrap"
              disabled
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Karur Campus</span>
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 opacity-40 cursor-not-allowed whitespace-nowrap"
              disabled
            >
              <Lock className="w-3 h-3" />
              <span>Karur Campus</span>
            </button>
          )}

          {/* Coimbatore Campus */}
          {loggedInCampus === "COIMBATORE" ? (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-md whitespace-nowrap"
              disabled
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Coimbatore Campus</span>
            </button>
          ) : (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 opacity-40 cursor-not-allowed whitespace-nowrap"
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
        <div className="sm:hidden flex flex-col gap-1.5 pb-1 border-t border-white/15 pt-2 animate-in slide-in-from-top duration-200">
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
                    : "bg-slate-900/60 border border-white/10 text-slate-300 active:bg-white/10"
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
