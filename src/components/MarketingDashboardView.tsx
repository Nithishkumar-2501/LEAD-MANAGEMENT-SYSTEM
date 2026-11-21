"use client";

import { useState, useEffect, useMemo } from "react";
import { ActiveTab, CampusLocation, Lead, Application } from "@/types/crm";
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
import {
  subscribeToFirebaseStudents,
  fetchStudentsFromRTDB,
  isLeadDeleted,
} from "@/lib/firebaseSync";
import {
  getMarketingChannelKey,
  MarketingChannelKey,
} from "@/lib/leadSourceAnalytics";

interface MarketingDashboardViewProps {
  loggedInCampus: CampusLocation;
  onTriggerToast?: (msg: string) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  applicants?: (Lead & { application?: Application | null })[];
}

export default function MarketingDashboardView({
  loggedInCampus,
  onTriggerToast,
  onNavigateTab,
  applicants,
}: MarketingDashboardViewProps) {
  const [bookmarkedChannels, setBookmarkedChannels] = useState<string[]>([
    "WhatsApp Business Bot",
    "Google & Social Ads",
  ]);

  const [liveStudents, setLiveStudents] = useState<(Lead & { application?: Application | null })[]>(
    applicants && applicants.length > 0 ? applicants : []
  );

  // Synchronize when applicants prop updates from parent dashboard
  useEffect(() => {
    if (applicants && applicants.length > 0) {
      setLiveStudents(applicants.filter((item) => item && item.id && !isLeadDeleted(item.id)));
    }
  }, [applicants]);

  // Subscribe to Firebase Live DB updates if parent applicants prop is not yet loaded
  useEffect(() => {
    if (applicants && applicants.length > 0) return;
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeToFirebaseStudents((students) => {
        if (students && students.length > 0) {
          setLiveStudents(students.filter((item) => item && item.id && !isLeadDeleted(item.id)));
        }
      });
    } catch (e) {
      console.warn("Firebase realtime sync notice:", e);
    }

    fetchStudentsFromRTDB()
      .then((rtdbList) => {
        if (rtdbList && rtdbList.length > 0) {
          setLiveStudents(rtdbList.filter((item) => item && item.id && !isLeadDeleted(item.id)));
        }
      })
      .catch(() => {});

    return () => {
      if (unsub) unsub();
    };
  }, [applicants]);

  // Dynamic calculations based strictly on selected campus and live database
  const campusLeads = useMemo(() => {
    const list = applicants && applicants.length > 0 ? applicants : liveStudents;
    return (list || []).filter((item) => {
      if (!item || !item.id || isLeadDeleted(item.id)) return false;
      if (loggedInCampus && loggedInCampus !== "ALL") {
        return !item.campus || item.campus === "ALL" || item.campus === loggedInCampus;
      }
      return true;
    });
  }, [applicants, liveStudents, loggedInCampus]);

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

  // Group campus leads dynamically into 8 campaign channels
  const channelCounts = useMemo(() => {
    const counts: Record<MarketingChannelKey, number> = {
      ADS: 0,
      FACEBOOK: 0,
      WHATSAPP: 0,
      TWITTER: 0,
      EMAIL: 0,
      SMS: 0,
      CAMPAIGN: 0,
      EXPO: 0,
    };

    campusLeads.forEach((lead) => {
      const key = getMarketingChannelKey(lead.source);
      if (counts[key] !== undefined) {
        counts[key]++;
      }
    });

    return counts;
  }, [campusLeads]);

  const channels = [
    {
      key: "ADS" as MarketingChannelKey,
      title: "Google & Social Ads",
      tab: "SOCIAL_ADS" as ActiveTab,
      count: channelCounts.ADS,
      cpl: "₹140",
      cplNum: 140,
      roi: "+240%",
      icon: Megaphone,
      manager: "AdWords Engine",
      role: "PPC & Meta Ads",
      meta: `${channelCounts.ADS.toLocaleString("en-IN")} ${channelCounts.ADS === 1 ? "Inquiry" : "Inquiries"}`,
    },
    {
      key: "FACEBOOK" as MarketingChannelKey,
      title: "Facebook Messenger",
      tab: "SOCIAL_FACEBOOK" as ActiveTab,
      count: channelCounts.FACEBOOK,
      cpl: "₹115",
      cplNum: 115,
      roi: "+180%",
      icon: Share2,
      manager: "Meta AI Concierge",
      role: "Social DMs & Lead Gen",
      meta: `${channelCounts.FACEBOOK.toLocaleString("en-IN")} ${channelCounts.FACEBOOK === 1 ? "Inquiry" : "Inquiries"}`,
    },
    {
      key: "WHATSAPP" as MarketingChannelKey,
      title: "WhatsApp Business Bot",
      tab: "SOCIAL_WHATSAPP" as ActiveTab,
      count: channelCounts.WHATSAPP,
      cpl: "₹65",
      cplNum: 65,
      roi: "+390%",
      icon: MessageSquare,
      manager: "Meta Cloud WhatsApp",
      role: "Official Verified Bot",
      meta: `${channelCounts.WHATSAPP.toLocaleString("en-IN")} ${channelCounts.WHATSAPP === 1 ? "Inquiry" : "Inquiries"}`,
    },
    {
      key: "TWITTER" as MarketingChannelKey,
      title: "X (Twitter) Rank Bot",
      tab: "SOCIAL_TWITTER" as ActiveTab,
      count: channelCounts.TWITTER,
      cpl: "₹95",
      cplNum: 95,
      roi: "+150%",
      icon: Send,
      manager: "X Realtime Feed",
      role: "TNEA Ranks & Counseling",
      meta: `${channelCounts.TWITTER.toLocaleString("en-IN")} ${channelCounts.TWITTER === 1 ? "Inquiry" : "Inquiries"}`,
    },
    {
      key: "EMAIL" as MarketingChannelKey,
      title: "E-mail Cutoff Campaigns",
      tab: "SOCIAL_EMAIL" as ActiveTab,
      count: channelCounts.EMAIL,
      cpl: "₹35",
      cplNum: 35,
      roi: "+410%",
      icon: Mail,
      manager: "SendGrid Admission Hub",
      role: "Cutoff Newsletters",
      meta: `${channelCounts.EMAIL.toLocaleString("en-IN")} ${channelCounts.EMAIL === 1 ? "Inquiry" : "Inquiries"}`,
    },
    {
      key: "SMS" as MarketingChannelKey,
      title: "SMS Gateway Alerts",
      tab: "SOCIAL_SMS" as ActiveTab,
      count: channelCounts.SMS,
      cpl: "₹40",
      cplNum: 40,
      roi: "+290%",
      icon: MessageCircle,
      manager: "TRAI DLT Gateway",
      role: "Instant SMS Alerts",
      meta: `${channelCounts.SMS.toLocaleString("en-IN")} ${channelCounts.SMS === 1 ? "Inquiry" : "Inquiries"}`,
    },
    {
      key: "CAMPAIGN" as MarketingChannelKey,
      title: "Admission Drive Outreach",
      tab: "SOCIAL_CAMPAIGN" as ActiveTab,
      count: channelCounts.CAMPAIGN,
      cpl: "₹180",
      cplNum: 180,
      roi: "+310%",
      icon: Sparkles,
      manager: "On-Ground Outreach",
      role: "Direct Walk-in Expo",
      meta: `${channelCounts.CAMPAIGN.toLocaleString("en-IN")} ${channelCounts.CAMPAIGN === 1 ? "Inquiry" : "Inquiries"}`,
    },
    {
      key: "EXPO" as MarketingChannelKey,
      title: "School Project Expo Spot",
      tab: "SOCIAL_EXPO" as ActiveTab,
      count: channelCounts.EXPO,
      cpl: "₹85",
      cplNum: 85,
      roi: "+220%",
      icon: Award,
      manager: "School Outreach Wing",
      role: "+2 Science Exhibitions",
      meta: `${channelCounts.EXPO.toLocaleString("en-IN")} ${channelCounts.EXPO === 1 ? "Inquiry" : "Inquiries"}`,
    },
  ];

  const totalInquiries = campusLeads.length;
  const confirmedAdmissions = campusLeads.filter((a) => a.status === "ADMITTED").length;

  const totalSpend = channels.reduce((sum, ch) => {
    return sum + ch.count * ch.cplNum;
  }, 0);

  const avgCpl = totalInquiries > 0 ? Math.round(totalSpend / totalInquiries) : 0;

  // Real-time conversion ROI calculated against total campaign investment (₹95,000 revenue per admitted student)
  const conversionRoiDisplay = useMemo(() => {
    if (totalSpend === 0) return "+0%";
    const totalRevenue = confirmedAdmissions * 95000;
    if (totalRevenue === 0) return "0%";
    const roi = Math.round(((totalRevenue - totalSpend) / totalSpend) * 100);
    return roi >= 0 ? `+${roi.toLocaleString("en-IN")}%` : `${roi.toLocaleString("en-IN")}%`;
  }, [confirmedAdmissions, totalSpend]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[26px] sm:text-[28px] lg:text-[30px] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Omnichannel Marketing Campaign Dashboard
            </h2>
            <p className="text-[14px] sm:text-[15px] text-slate-600 dark:text-slate-400 font-medium mt-1">
              Real-time candidate lead acquisition across 8 digital & field campaign channels
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-[12.5px] sm:text-[13px] font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{loggedInCampus === "ALL" ? "All Campuses" : `${loggedInCampus} Campus`}</span>
            <span className="text-emerald-500/60 dark:text-emerald-400/60">•</span>
            <span>Live DB</span>
          </div>

          <div className="px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-[13px] sm:text-[14px] font-bold text-blue-700 dark:text-blue-300 shadow-2xs">
            Total Inquiries: {totalInquiries.toLocaleString("en-IN")} {totalInquiries === 1 ? "Candidate" : "Candidates"}
          </div>
        </div>
      </div>

      {/* 4 Summary Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Campaign Spend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
          <div>
            <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Campaign Spend
            </p>
            <h4 className="text-[28px] sm:text-[30px] lg:text-[32px] font-black text-slate-900 dark:text-white mt-1 leading-tight">
              ₹{totalSpend.toLocaleString("en-IN")}
            </h4>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </div>
        </div>

        {/* Average Cost-per-Lead */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
          <div>
            <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Cost-per-Lead
            </p>
            <h4 className="text-[28px] sm:text-[30px] lg:text-[32px] font-black text-sky-600 dark:text-sky-400 mt-1 leading-tight">
              ₹{avgCpl.toLocaleString("en-IN")} / Lead
            </h4>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center justify-center font-bold shrink-0">
            <Target className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
        </div>

        {/* Conversion ROI */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
          <div>
            <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Conversion ROI
            </p>
            <h4 className="text-[28px] sm:text-[30px] lg:text-[32px] font-black text-emerald-600 dark:text-emerald-400 mt-1 leading-tight">
              {conversionRoiDisplay}
            </h4>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Confirmed Admissions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-xs hover:shadow-sm transition-all">
          <div>
            <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Confirmed Admissions
            </p>
            <h4 className="text-[28px] sm:text-[30px] lg:text-[32px] font-black text-amber-600 dark:text-amber-400 mt-1 leading-tight">
              {confirmedAdmissions.toLocaleString("en-IN")} {confirmedAdmissions === 1 ? "Student" : "Students"}
            </h4>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold shrink-0">
            <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* 8 Channel Cards matching Blog2 Color Variants */}
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
                "group relative flex min-h-[350px] flex-col justify-between rounded-4xl p-6 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 cursor-pointer",
                colorClass
              )}
            >
              <div className="flex flex-1 flex-col">
                {/* Top Meta: Inquiries, ROI Pill, and Bookmark */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] sm:text-[13px] font-bold px-3 py-1 rounded-lg bg-black/15 dark:bg-white/15 text-slate-950 dark:text-white backdrop-blur-sm border border-black/10 dark:border-white/10">
                      {ch.meta}
                    </span>
                    <span className="text-[12px] sm:text-[12.5px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 border border-emerald-600/30">
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
                    <h3 className="text-slate-950 dark:text-white text-[21px] sm:text-[22px] lg:text-[24px] font-black leading-snug tracking-tight line-clamp-2">
                      {ch.title}
                    </h3>
                    <ArrowRight
                      className="text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white mt-1 size-5.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1.5"
                      strokeWidth={2.5}
                    />
                  </div>

                  <div className="mt-4 p-3 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-white/40 dark:border-white/10 backdrop-blur-xs flex items-center justify-between">
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-[13px] sm:text-[13.5px]">Acquisition CPL</span>
                    <span className="text-slate-950 dark:text-white font-black text-[14px] sm:text-[15px]">{ch.cpl}</span>
                  </div>
                </div>

                {/* Bottom: Channel Manager & Glass Button */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-900 dark:text-white shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 leading-tight">
                      <span className="block text-slate-950 dark:text-white text-[13px] sm:text-[14px] font-bold truncate">
                        {ch.manager}
                      </span>
                      <span className="block text-slate-800/90 dark:text-slate-300/90 text-[12px] sm:text-[12.5px] font-medium truncate">
                        {ch.role}
                      </span>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center justify-center rounded-xl border border-white/40 dark:border-white/20 bg-white/40 dark:bg-black/30 backdrop-blur-md px-4 py-2 text-[14px] font-bold text-slate-950 dark:text-white shadow-2xs group-hover:scale-105 active:scale-95 transition-transform shrink-0">
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
