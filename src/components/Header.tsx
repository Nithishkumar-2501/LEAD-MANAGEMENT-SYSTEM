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
  ShieldCheck,
} from "lucide-react";
import { User, ActiveTab, CampusLocation, Lead, Application } from "@/types/crm";
import Tooltip from "@/components/Tooltip";
import VoiceSearchBar from "@/components/VoiceSearchBar";
import { isLeadAssignedToTeacher } from "@/lib/teacherAssignment";

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
  const visibleApplicants = currentUserRole === "TEACHER"
    ? (applicants || []).filter((item) => isLeadAssignedToTeacher(item, loggedInUsername, loggedInCampus))
    : (applicants || []);
  const searchResults =
    trimmedQuery.length > 0 && visibleApplicants
      ? visibleApplicants
          .filter((item) => {
            const name = (item.name || "").toLowerCase();
            const email = (item.email || "").toLowerCase();
            const phone = (item.phone || "").toLowerCase();
            const course = (item.courseInterest || "").toLowerCase();
            const campus = (item.campus || "").toLowerCase();
            const school = (item.school || "").toLowerCase();
            const district = (item.district || "").toLowerCase();
            const stage = (item.application?.stage || "").toLowerCase();
            const status = (item.status || "").toLowerCase();
            const leadId = (item.id || "").toLowerCase();

            return (
              name.includes(trimmedQuery) ||
              email.includes(trimmedQuery) ||
              phone.includes(trimmedQuery) ||
              course.includes(trimmedQuery) ||
              campus.includes(trimmedQuery) ||
              school.includes(trimmedQuery) ||
              district.includes(trimmedQuery) ||
              stage.includes(trimmedQuery) ||
              status.includes(trimmedQuery) ||
              leadId.includes(trimmedQuery)
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
    { id: "ADMIN_DASHBOARD" as ActiveTab, label: "Admin Dashboard", icon: ShieldCheck, roles: ["ADMIN"] },
    { id: "USER_DASHBOARD" as ActiveTab, label: "Lead Dashboard", icon: UserCheck, roles: ["TEACHER"] },
    { id: "CONTACTS" as ActiveTab, label: "Lead Manager", icon: UserCheck, roles: ["ADMIN", "TEACHER"] },
    { id: "TEACHERS" as ActiveTab, label: "Teacher Directory", icon: BookOpen, roles: ["ADMIN"] },
    { id: "CAMPUSES" as ActiveTab, label: "Campus & Courses", icon: Building2, roles: ["ADMIN", "TEACHER"] },
    { id: "PAYMENTS" as ActiveTab, label: "Fee Payments", icon: CreditCard, roles: ["ADMIN"] },
    { id: "SETTINGS" as ActiveTab, label: "Admin Settings", icon: Settings, roles: ["ADMIN"] },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(currentUserRole)
  );

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-6 py-2.5 flex flex-col gap-2 sm:gap-3 shadow-xs">
      {/* Top Bar: Brand, Campus Selector & Right Navigation Controls */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-4 min-w-0">
        {/* Left: Official College Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          {/* Official V.S.B. Engineering College Logo Emblem */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shadow-xs bg-white shrink-0 flex items-center justify-center p-0.5">
            <Image
              src="/vsb-logo.png"
              alt="V.S.B. Engineering College Official Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-xs sm:text-sm md:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="truncate text-slate-900 dark:text-white font-extrabold hidden sm:inline">V.S.B. ENGINEERING COLLEGE</span>
              <span className="truncate text-slate-900 dark:text-white font-extrabold sm:hidden">V.S.B. COLLEGE</span>
              <span className="hidden md:inline-flex items-center text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 px-2 py-0.5 rounded-md shrink-0">
                SPHEREX CRM
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="truncate">Karur & Coimbatore</span>
            </p>
          </div>
        </div>

        {/* Right: Controls (Campus Selector, Ask Nora AI, Search, Logout) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Teacher Profile ID Badge (Prominently displayed for logged in faculty) */}
          {currentUserRole === "TEACHER" && (
            <Tooltip text={`Faculty Account Active: Profile ID ${loggedInUsername || "Staff"}`}>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-semibold text-xs shadow-xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 hidden xs:inline">
                    ID:
                  </span>
                  <span className="font-mono text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[190px]">
                    {loggedInUsername}
                  </span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white uppercase tracking-wider hidden sm:inline">
                  Active
                </span>
              </div>
            </Tooltip>
          )}

          {/* Clean Segmented Campus Selector */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs shrink-0">
            {/* Karur Campus */}
            {loggedInCampus === "KARUR" ? (
              <Tooltip text="Active Session: V.S.B. Karur Campus">
                <button
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 text-white font-semibold shadow-xs transition-all cursor-default"
                  disabled
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Karur Campus</span>
                </button>
              </Tooltip>
            ) : (
              <Tooltip text="Access restricted to Karur Admin">
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-400 dark:text-slate-500 font-medium cursor-not-allowed opacity-60"
                  disabled
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Karur</span>
                </button>
              </Tooltip>
            )}

            {/* Coimbatore Campus */}
            {loggedInCampus === "COIMBATORE" ? (
              <Tooltip text="Active Session: V.S.B. Coimbatore Campus">
                <button
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 text-white font-semibold shadow-xs transition-all cursor-default"
                  disabled
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Coimbatore Campus</span>
                </button>
              </Tooltip>
            ) : (
              <Tooltip text="Access restricted to Coimbatore Admin">
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-400 dark:text-slate-500 font-medium cursor-not-allowed opacity-60"
                  disabled
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Coimbatore</span>
                </button>
              </Tooltip>
            )}
          </div>

          {/* Search bar — desktop */}
          <div className="relative hidden lg:block w-72 shrink-0">
            <VoiceSearchBar
              id="header-candidate-search"
              value={searchQuery}
              onChange={(val) => {
                onSearchChange(val);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search candidate applications..."
              onClear={() => {
                onSearchChange("");
                setShowSearchResults(false);
              }}
              onVoiceSearchEnd={(transcript) => {
                onSearchChange(transcript);
                setShowSearchResults(true);
              }}
            />

            {/* Dropdown Search Results Overlay */}
            {trimmedQuery.length > 0 && showSearchResults && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-sky-500/40 p-3 shadow-2xl z-50 backdrop-blur-2xl text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between px-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" /> Search Applications ({searchResults.length})
                  </span>
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
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
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/80 dark:bg-slate-900/90 dark:hover:bg-sky-950/70 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-500/40 transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-md">
                            {applicant.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="font-black text-slate-950 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors truncate">
                              {applicant.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                              <span>{applicant.phone}</span>
                              <span>•</span>
                              <span className="text-sky-600 dark:text-sky-400 font-semibold">{applicant.campus}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800">
                            {applicant.application?.stage || applicant.status || "INQUIRY"}
                          </span>
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 group-hover:underline font-bold flex items-center gap-0.5">
                            Open App →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 dark:text-slate-400 space-y-1">
                    <p className="font-semibold">No candidates found</p>
                    <p className="text-[10px]">Try searching by student name, phone, school, or course.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ask Nora AI Button */}
          <button
            type="button"
            onClick={() => onOpenNoraAi?.()}
            className="press-spring flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all duration-150 cursor-pointer shrink-0"
            title="Ask Nora AI to analyze the live student database"
          >
            <img
              src="/nora-logo.png"
              alt="NORA AI Logo"
              className="w-4 h-4 rounded-full object-cover shrink-0"
            />
            <span className="text-xs whitespace-nowrap">Ask Nora AI</span>
          </button>

          {/* Search Icon — mobile/tablet */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="press-spring lg:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            aria-label="Search"
            title="Search Candidate Applications"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          <Tooltip text="Logout of V.S.B. Portal">
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Menu / Hamburger Icon */}
          <button
            onClick={() => onToggleMobileSidebar ? onToggleMobileSidebar() : setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Toggle navigation sidebar"
            title="Menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Search Bar — expands below header when toggled */}
      {mobileSearchOpen && (
        <div className="lg:hidden relative py-2">
          <VoiceSearchBar
            id="mobile-candidate-search"
            value={searchQuery}
            onChange={(val) => {
              onSearchChange(val);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search candidate applications..."
            autoFocus
            onClear={() => {
              onSearchChange("");
              setShowSearchResults(false);
            }}
            onVoiceSearchEnd={(transcript) => {
              onSearchChange(transcript);
              setShowSearchResults(true);
            }}
          />

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
