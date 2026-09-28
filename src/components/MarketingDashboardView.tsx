"use client";

import { useState } from "react";
import { ActiveTab, CampusLocation } from "@/types/crm";
import {
  Megaphone,
  Share2,
  MessageSquare,
  Send,
  Mail,
  MessageCircle,
  Sparkles,
  Award,
  TrendingUp,
  DollarSign,
  Target,
  ArrowRight,
} from "lucide-react";
import { FaBookmark } from "react-icons/fa6";
import { colorVariants } from "@/components/ui/blog-card";
import { cn } from "@/lib/utils";

interface MarketingDashboardViewProps {
  loggedInCampus: CampusLocation;
  onTriggerToast?: (msg: string) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export default function MarketingDashboardView({
  loggedInCampus,
  onTriggerToast,
  onNavigateTab,
}: MarketingDashboardViewProps) {
  const [bookmarkedChannels, setBookmarkedChannels] = useState<string[]>([
    "WhatsApp Business Bot",
    "Google & Social Ads",
  ]);

  const toggleBookmark = (title: string) => {
    setBookmarkedChannels((prev) => {
      const exists = prev.includes(title);
      if (exists) {
        onTriggerToast?.(`Removed ${title} from saved campaigns`);
        return prev.filter((t) => t !== title);
      } else {
        onTriggerToast?.(`Saved ${title} to pinned campaigns`);
        return [...prev, title];
      }
    });
  };

  const channels = [
    {
      title: "Google & Social Ads",
      tab: "SOCIAL_ADS" as ActiveTab,
      count: 520,
      cpl: "₹140",
      roi: "+240%",
      icon: Megaphone,
      manager: "AdWords Engine",
      role: "PPC & Meta Ads",
      meta: "520 Inquiries",
    },
    {
      title: "Facebook Messenger",
      tab: "SOCIAL_FACEBOOK" as ActiveTab,
      count: 340,
      cpl: "₹115",
      roi: "+180%",
      icon: Share2,
      manager: "Meta AI Concierge",
      role: "Social DMs & Lead Gen",
      meta: "340 Inquiries",
    },
    {
      title: "WhatsApp Business Bot",
      tab: "SOCIAL_WHATSAPP" as ActiveTab,
      count: 410,
      cpl: "₹65",
      roi: "+390%",
      icon: MessageSquare,
      manager: "Meta Cloud WhatsApp",
      role: "Official Verified Bot",
      meta: "410 Inquiries",
    },
    {
      title: "X (Twitter) Rank Bot",
      tab: "SOCIAL_TWITTER" as ActiveTab,
      count: 180,
      cpl: "₹95",
      roi: "+150%",
      icon: Send,
      manager: "X Realtime Feed",
      role: "TNEA Ranks & Counseling",
      meta: "180 Inquiries",
    },
    {
      title: "E-mail Cutoff Campaigns",
      tab: "SOCIAL_EMAIL" as ActiveTab,
      count: 210,
      cpl: "₹35",
      roi: "+410%",
      icon: Mail,
      manager: "SendGrid Admission Hub",
      role: "Cutoff Newsletters",
      meta: "210 Inquiries",
    },
    {
      title: "SMS Gateway Alerts",
      tab: "SOCIAL_SMS" as ActiveTab,
      count: 140,
      cpl: "₹40",
      roi: "+290%",
      icon: MessageCircle,
      manager: "TRAI DLT Gateway",
      role: "Instant SMS Alerts",
      meta: "140 Inquiries",
    },
    {
      title: "Admission Drive Campaign",
      tab: "SOCIAL_CAMPAIGN" as ActiveTab,
      count: 390,
      cpl: "₹180",
      roi: "+310%",
      icon: Sparkles,
      manager: "On-Ground Outreach",
      role: "Direct Walk-in Expo",
      meta: "390 Inquiries",
    },
    {
      title: "School Project Expo Spot",
      tab: "SOCIAL_EXPO" as ActiveTab,
      count: 250,
      cpl: "₹85",
      roi: "+220%",
      icon: Award,
      manager: "School Outreach Wing",
      role: "+2 Science Exhibitions",
      meta: "250 Inquiries",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Omnichannel Marketing Campaign Dashboard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Real-time candidate lead acquisition across 8 digital & field campaign channels
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-xs font-black text-blue-700 dark:text-blue-300 shadow-2xs self-start sm:self-auto">
          Total Inquiries: 2,440 Candidates
        </div>
      </div>

      {/* 4 Summary Performance Stats matching Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Campaign Spend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Campaign Spend
            </p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹2,45,000</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </div>
        </div>

        {/* Average Cost-per-Lead */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Cost-per-Lead
            </p>
            <h4 className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">₹100 / Lead</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center justify-center font-bold shrink-0">
            <Target className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
        </div>

        {/* Conversion ROI */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Conversion ROI
            </p>
            <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">+315%</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Confirmed Admissions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Confirmed Admissions
            </p>
            <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">185 Students</h4>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* 8 Channel Cards matching Image 2 & Blog2 Color Variants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {channels.map((ch, index) => {
          const Icon = ch.icon;
          const isSaved = bookmarkedChannels.includes(ch.title);
          const colorClass = colorVariants[index % colorVariants.length];

          return (
            <article
              key={index}
              onClick={() => onNavigateTab && onNavigateTab(ch.tab)}
              className={cn(
                "group relative flex min-h-[340px] flex-col justify-between rounded-4xl p-6 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 cursor-pointer",
                colorClass
              )}
            >
              <div className="flex flex-1 flex-col">
                {/* Top Meta: Inquiries, ROI Pill, and Bookmark */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-black/15 dark:bg-white/15 text-slate-950 dark:text-white backdrop-blur-sm border border-black/10 dark:border-white/10">
                      {ch.meta}
                    </span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 border border-emerald-600/30">
                      {ch.roi}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(ch.title);
                    }}
                    className={cn(
                      "p-2 rounded-full transition-all cursor-pointer active:scale-90",
                      isSaved
                        ? "text-rose-600 dark:text-rose-400 bg-white/40 dark:bg-black/30 shadow-xs"
                        : "text-slate-700/60 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
                    )}
                    title={isSaved ? "Unpin channel" : "Pin channel"}
                  >
                    <FaBookmark className="size-4" />
                  </button>
                </div>

                {/* Middle: Channel Title, Arrow & CPL details */}
                <div className="flex flex-1 flex-col justify-center py-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-slate-950 dark:text-white text-2xl font-black leading-tight tracking-tight line-clamp-2">
                      {ch.title}
                    </h3>
                    <ArrowRight
                      className="text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white mt-1 size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1.5"
                      strokeWidth={2.5}
                    />
                  </div>

                  <div className="mt-4 p-3 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-white/40 dark:border-white/10 backdrop-blur-xs flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Acquisition CPL</span>
                    <span className="text-slate-950 dark:text-white font-black text-sm">{ch.cpl}</span>
                  </div>
                </div>

                {/* Bottom: Channel Manager & Glass Button */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-900 dark:text-white shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 leading-tight">
                      <span className="block text-slate-950 dark:text-white text-xs font-bold truncate">
                        {ch.manager}
                      </span>
                      <span className="block text-slate-700/80 dark:text-slate-300/80 text-[10.5px] font-medium truncate">
                        {ch.role}
                      </span>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center justify-center rounded-xl border border-white/40 dark:border-white/20 bg-white/40 dark:bg-black/30 backdrop-blur-md px-3.5 py-1.5 text-xs font-black text-slate-950 dark:text-white shadow-2xs group-hover:scale-105 active:scale-95 transition-transform shrink-0">
                    Open
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
