"use client";

import { useState } from "react";
import { ActiveTab, CampusLocation } from "@/types/crm";
import { Megaphone, Share2, MessageSquare, Send, Mail, MessageCircle, Sparkles, Award, TrendingUp, DollarSign, Target, BarChart2 } from "lucide-react";

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
  const channels = [
    { title: "Google & Social Ads", tab: "SOCIAL_ADS" as ActiveTab, count: 520, cpl: "₹140", roi: "+240%", icon: Megaphone, color: "from-blue-500 to-indigo-600", border: "border-blue-500/30" },
    { title: "Facebook Messenger", tab: "SOCIAL_FACEBOOK" as ActiveTab, count: 340, cpl: "₹115", roi: "+180%", icon: Share2, color: "from-sky-500 to-blue-600", border: "border-sky-500/30" },
    { title: "WhatsApp Business Bot", tab: "SOCIAL_WHATSAPP" as ActiveTab, count: 410, cpl: "₹65", roi: "+390%", icon: MessageSquare, color: "from-emerald-500 to-teal-600", border: "border-emerald-500/30" },
    { title: "X (Twitter) Rank Bot", tab: "SOCIAL_TWITTER" as ActiveTab, count: 180, cpl: "₹95", roi: "+150%", icon: Send, color: "from-slate-600 to-slate-800", border: "border-slate-500/30" },
    { title: "E-mail Cutoff Campaigns", tab: "SOCIAL_EMAIL" as ActiveTab, count: 210, cpl: "₹35", roi: "+410%", icon: Mail, color: "from-rose-500 to-pink-600", border: "border-rose-500/30" },
    { title: "SMS Gateway Alerts", tab: "SOCIAL_SMS" as ActiveTab, count: 140, cpl: "₹40", roi: "+290%", icon: MessageCircle, color: "from-purple-500 to-indigo-600", border: "border-purple-500/30" },
    { title: "Admission Drive Campaign", tab: "SOCIAL_CAMPAIGN" as ActiveTab, count: 390, cpl: "₹180", roi: "+310%", icon: Sparkles, color: "from-amber-500 to-orange-600", border: "border-amber-500/30" },
    { title: "School Project Expo Spot", tab: "SOCIAL_EXPO" as ActiveTab, count: 250, cpl: "₹85", roi: "+220%", icon: Award, color: "from-teal-500 to-cyan-600", border: "border-teal-500/30" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-purple-950 dark:via-slate-900 dark:to-indigo-950 border border-slate-200 dark:border-purple-500/30 text-slate-900 dark:text-white shadow-md dark:shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-600/30 border border-purple-200 dark:border-purple-400/40 flex items-center justify-center text-purple-600 dark:text-purple-300 shadow-sm shrink-0">
            <Megaphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Omnichannel Marketing Campaign Dashboard</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Real-time candidate lead acquisition across 8 digital & field campaign channels</p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-400/40 text-xs font-black text-purple-800 dark:text-purple-300 shadow-sm">
          Total Marketing Inquiries: 2,440 Candidates
        </div>
      </div>

      {/* Campaign ROI Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bubble-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Total Campaign Spend</p>
            <h4 className="text-xl font-black text-white">₹2,45,000</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Average Cost-per-Lead</p>
            <h4 className="text-xl font-black text-sky-400">₹100 / Lead</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Conversion ROI</p>
            <h4 className="text-xl font-black text-emerald-400">+315%</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bubble-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase">Confirmed Admissions</p>
            <h4 className="text-xl font-black text-amber-300">185 Students</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 8 Channel Performance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((ch, idx) => {
          const Icon = ch.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab && onNavigateTab(ch.tab)}
              className={`p-4 rounded-2xl bg-slate-950/90 border ${ch.border} hover:border-purple-400/60 transition-all space-y-3 cursor-pointer group shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${ch.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {ch.roi}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-purple-300 transition-colors">
                  {ch.title}
                </h4>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                  <span>Inquiries: <strong className="text-white">{ch.count}</strong></span>
                  <span>CPL: <strong className="text-sky-300">{ch.cpl}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
