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
} from "lucide-react";
import { User, ActiveTab, CampusLocation } from "@/types/crm";

interface HeaderProps {
  user: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedCampus: CampusLocation;
  onCampusChange: (campus: CampusLocation) => void;
  onLogout: () => void;
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
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
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
    { id: "CONTACTS" as ActiveTab, label: "Contact Directory", icon: Contact },
    { id: "STUDENTS" as ActiveTab, label: "Student Applications", icon: UserCheck },
    { id: "TEACHERS" as ActiveTab, label: "Teacher Directory", icon: BookOpen },
    { id: "CAMPUSES" as ActiveTab, label: "Campus & Courses", icon: Building2 },
    { id: "PAYMENTS" as ActiveTab, label: "Fee Payments", icon: CreditCard },
    { id: "SETTINGS" as ActiveTab, label: "Admin Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 w-full liquid-glass border-b border-white/20 px-6 py-3.5 flex flex-col gap-3.5 shadow-2xl">
      {/* Top Bar: Brand, Campus Selector & Admin Profile */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 ring-2 ring-white/30 animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base md:text-lg text-white tracking-tight flex items-center gap-2">
              V.S.B. ENGINEERING COLLEGE
              <span className="text-[10px] font-bold text-sky-200 bg-sky-500/20 border border-sky-400/40 px-3 py-0.5 rounded-full backdrop-blur-xl">
                Bubble Glass OS 4.0
              </span>
            </h1>
            <p className="text-xs text-sky-200/80 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-pink-400" /> KARUR & COIMBATORE CAMPUSES
            </p>
          </div>
        </div>

        {/* Campus Location Segmented Bubble Selector & Search */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Floating Bubble Campus Pills */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-full border border-white/20 text-xs font-semibold backdrop-blur-2xl">
            <button
              onClick={() => onCampusChange("ALL")}
              className={`px-3.5 py-1 rounded-full transition-all duration-300 ${
                selectedCampus === "ALL"
                  ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold shadow-lg shadow-sky-500/40 scale-[1.03]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              All Campuses
            </button>
            <button
              onClick={() => onCampusChange("KARUR")}
              className={`px-3.5 py-1 rounded-full transition-all duration-300 ${
                selectedCampus === "KARUR"
                  ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold shadow-lg shadow-sky-500/40 scale-[1.03]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Karur Campus
            </button>
            <button
              onClick={() => onCampusChange("COIMBATORE")}
              className={`px-3.5 py-1 rounded-full transition-all duration-300 ${
                selectedCampus === "COIMBATORE"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg shadow-pink-500/40 scale-[1.03]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Coimbatore Campus
            </button>
          </div>

          {/* Search bar */}
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

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-full bg-slate-900/70 border border-white/20 hover:border-white/40 text-sky-200 transition-all shadow-md"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bubble-card p-4 z-50 border border-white/30 shadow-2xl">
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
          <div className="flex items-center gap-2 pl-2 border-l border-white/15">
            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-white/20 px-3.5 py-1 rounded-full backdrop-blur-xl">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white font-black text-[10px] flex items-center justify-center shadow-md">
                VSB
              </div>
              <span className="text-xs font-bold text-slate-200">admin@vsb</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2.5 rounded-full bg-slate-900/70 border border-white/20 hover:bg-rose-950/80 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 transition-all shadow-md"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bubble Navigation Dock */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none border-t border-white/15 pt-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all duration-300 ${
                isActive
                  ? "glossy-btn scale-[1.03]"
                  : "bg-slate-900/60 border border-white/15 text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
