"use client";

import { useState } from "react";
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
import { User, ActiveTab, CampusLocation } from "@/types/crm";
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
  theme?: "LIGHT" | "DARK";
  onThemeChange?: (newTheme: "LIGHT" | "DARK") => void;
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
  theme = "DARK",
  onThemeChange,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
    <header className="sticky top-0 z-30 w-full liquid-glass border-b border-white/20 px-3 sm:px-6 py-3 sm:py-3.5 flex flex-col gap-2.5 sm:gap-3.5 shadow-2xl">
      {/* Top Bar: Brand, Campus Selector & Admin Profile */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Hamburger (mobile) + Brand */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          {/* Hamburger for mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-full bg-slate-900/70 border border-white/20 text-sky-200 transition-all"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Official V.S.B. Engineering College Logo Emblem */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-lg shadow-amber-500/30 bg-white shrink-0 flex items-center justify-center p-0.5 transform hover:scale-105 transition-transform">
            <img
              src="/vsb-logo.png"
              alt="V.S.B. Engineering College Official Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm sm:text-base md:text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">V.S.B. ENGINEERING COLLEGE</span>
              <span className="hidden sm:inline text-[10px] font-bold text-sky-700 dark:text-sky-200 bg-sky-100 dark:bg-sky-500/20 border border-sky-300 dark:border-sky-400/40 px-3 py-0.5 rounded-full backdrop-blur-xl shrink-0">
                Bubble Glass OS 4.0
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-sky-700 dark:text-sky-200/80 flex items-center gap-1.5 font-bold truncate">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-500 dark:text-pink-400 shrink-0" />
              <span className="truncate">KARUR & COIMBATORE CAMPUSES</span>
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Two Campus Icon Selection Bar */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-300 dark:border-white/20 text-xs font-semibold backdrop-blur-2xl">
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
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-slate-500 cursor-not-allowed opacity-40 hover:opacity-70 transition-opacity"
                  disabled
                >
                  <Lock className="w-4 h-4 text-slate-500" />
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
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-slate-500 cursor-not-allowed opacity-40 hover:opacity-70 transition-opacity"
                  disabled
                >
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Coimbatore Campus</span>
                </button>
              </Tooltip>
            )}
          </div>

          {/* Search bar — desktop */}
          <div className="relative hidden lg:block w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search portal..."
              className="w-full bg-slate-900/70 border border-white/20 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 backdrop-blur-xl"
            />
          </div>

          {/* Search icon — mobile/tablet */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="lg:hidden p-2 sm:p-2.5 rounded-full bg-slate-900/70 border border-white/20 hover:border-white/40 text-sky-200 transition-all shadow-md"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Theme Toggle Button (Light Mode & Dark Mode) */}
          <Tooltip text={`Switch to ${theme === "DARK" ? "Light Mode ☀️" : "Dark Mode 🌙"}`}>
            <button
              onClick={() => onThemeChange?.(theme === "DARK" ? "LIGHT" : "DARK")}
              className="p-2 sm:p-2.5 rounded-full bg-slate-900/70 border border-white/20 hover:border-sky-400 text-amber-300 transition-all shadow-md flex items-center justify-center cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "DARK" ? (
                <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          </Tooltip>

          {/* Notifications button */}
          <div className="relative">
            <Tooltip text="System Notifications">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 sm:p-2.5 rounded-full bg-slate-900/70 border border-white/20 hover:border-white/40 text-sky-200 transition-all shadow-md"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>
            </Tooltip>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bubble-card p-4 z-50 border border-white/30 shadow-2xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Bubble Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Check className="w-3 h-3" /> Clear All
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl text-xs flex flex-col gap-1 ${
                        item.read
                          ? "bg-slate-900/40 text-slate-400"
                          : "bg-gradient-to-r from-indigo-500/20 to-pink-500/20 text-white border-l-3 border-sky-400"
                      }`}
                    >
                      <span>{item.text}</span>
                      <span className="text-[10px] text-slate-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-300 dark:border-white/15">
            <div className="flex items-center gap-2 sm:gap-2.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-300 dark:border-white/20 px-2 sm:px-3.5 py-1 rounded-full backdrop-blur-xl">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white font-black text-[10px] flex items-center justify-center shadow-md">
                VSB
              </div>
              <span className="hidden sm:inline text-xs font-bold text-slate-900 dark:text-slate-200">
                {loggedInCampus === "KARUR"
                  ? currentUserRole === "ADMIN" ? "adminkarur@123" : "teacherkarur@123"
                  : currentUserRole === "ADMIN" ? "admincovai@123" : "teachercovai@123"}{" "}
                <span className="text-[10px] text-sky-600 dark:text-sky-300 font-bold">({currentUserRole === "ADMIN" ? "Admin" : "Teacher"})</span>
              </span>
            </div>
            <Tooltip text="Logout of V.S.B. Portal">
              <button
                onClick={onLogout}
                className="p-2 sm:p-2.5 rounded-full bg-slate-900/70 border border-white/20 hover:bg-rose-950/80 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 transition-all shadow-md"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar — expands below header when toggled */}
      {mobileSearchOpen && (
        <div className="lg:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search portal..."
              autoFocus
              className="w-full bg-slate-900/70 border border-white/20 rounded-full pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50 backdrop-blur-xl"
            />
          </div>
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

      {/* Desktop Floating Bubble Navigation Dock */}
      <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar pb-0.5 border-t border-white/15 pt-3">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Tooltip key={item.id} text={`Open ${item.label}`}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-110 active:scale-95 shadow-md ${
                  isActive
                    ? "glossy-btn scale-[1.05] shadow-lg shadow-indigo-500/40 ring-2 ring-white/30"
                    : "bg-slate-900/80 border border-white/15 text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-sky-500/30 hover:to-indigo-500/30 hover:border-sky-400/60 hover:shadow-xl hover:shadow-sky-500/20"
                }`}
              >
                <Icon className="w-4 h-4 transition-transform group-hover:scale-125" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Mobile Bottom Navigation Dock — fixed icon-only nav for phones */}
      <div className="sm:hidden flex items-center justify-around gap-0.5 overflow-x-auto hide-scrollbar pb-0.5 border-t border-white/15 pt-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-300 min-w-[40px] ${
                isActive
                  ? "text-sky-400 bg-sky-500/10 border border-sky-400/30"
                  : "text-slate-400 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[48px]">
                {item.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
