"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  Megaphone,
  MessageSquare,
  Mail,
  Send,
  Sparkles,
  Award,
  MessageCircle,
  TrendingUp,
  Users,
  CheckCircle2,
  PhoneCall,
  Search,
  ExternalLink,
  Plus,
  Play,
  Calendar,
  Globe,
  Radio,
  Filter,
} from "lucide-react";
import { ActiveTab, CampusLocation } from "@/types/crm";
import SpecularButton from "@/components/SpecularButton";

interface SocialMediaPlatformModuleProps {
  activeTab: ActiveTab;
  loggedInCampus: CampusLocation;
  onTriggerToast: (msg: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export default function SocialMediaPlatformModule({
  activeTab,
  loggedInCampus,
  onTriggerToast,
  onNavigateTab,
}: SocialMediaPlatformModuleProps) {
  const [selectedSubTab, setSelectedSubTab] = useState<string>(
    activeTab === "SOCIAL_ADS"
      ? "ADS"
      : activeTab === "SOCIAL_FACEBOOK"
      ? "FACEBOOK"
      : activeTab === "SOCIAL_TWITTER"
      ? "TWITTER"
      : activeTab === "SOCIAL_WHATSAPP"
      ? "WHATSAPP"
      : activeTab === "SOCIAL_EMAIL"
      ? "EMAIL"
      : activeTab === "SOCIAL_SMS"
      ? "SMS"
      : activeTab === "SOCIAL_CAMPAIGN"
      ? "CAMPAIGN"
      : activeTab === "SOCIAL_EXPO"
      ? "EXPO"
      : "ALL"
  );

  // Sync selectedSubTab whenever activeTab prop changes (e.g. from Sidebar clicks)
  useEffect(() => {
    if (activeTab === "SOCIAL_ADS") setSelectedSubTab("ADS");
    else if (activeTab === "SOCIAL_FACEBOOK") setSelectedSubTab("FACEBOOK");
    else if (activeTab === "SOCIAL_TWITTER") setSelectedSubTab("TWITTER");
    else if (activeTab === "SOCIAL_WHATSAPP") setSelectedSubTab("WHATSAPP");
    else if (activeTab === "SOCIAL_EMAIL") setSelectedSubTab("EMAIL");
    else if (activeTab === "SOCIAL_SMS") setSelectedSubTab("SMS");
    else if (activeTab === "SOCIAL_CAMPAIGN") setSelectedSubTab("CAMPAIGN");
    else if (activeTab === "SOCIAL_EXPO") setSelectedSubTab("EXPO");
  }, [activeTab]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeChannelFilter, setActiveChannelFilter] = useState("ALL");

  // Mock Social Media Campaign & Lead Data
  const socialLeads = [
    // Google & Social Ads
    {
      id: "soc_1",
      name: "S. Kausalya",
      email: "kausalya.tnea2026@gmail.com",
      phone: "+91 94421 88990",
      platform: "Google Ads",
      icon: Megaphone,
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      campaign: "TNEA Engineering Cutoff Search Ad 2026",
      status: "Verified Lead",
      time: "10 mins ago",
      campus: "KARUR",
    },
    {
      id: "soc_1b",
      name: "A. Vignesh",
      email: "vignesh.gads@gmail.com",
      phone: "+91 98432 99001",
      platform: "Google Ads",
      icon: Megaphone,
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      campaign: "Google Display Network CSE Campaign",
      status: "Inquired",
      time: "18 mins ago",
      campus: "COIMBATORE",
    },
    {
      id: "soc_1c",
      name: "M. Harish",
      email: "harish.ytads@gmail.com",
      phone: "+91 97891 22334",
      platform: "Google Ads",
      icon: Megaphone,
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      campaign: "YouTube Placement Video Campaign",
      status: "Admitted",
      time: "32 mins ago",
      campus: "KARUR",
    },

    // Facebook
    {
      id: "soc_2",
      name: "R. Vigneshwar",
      email: "vignesh.mech26@gmail.com",
      phone: "+91 98422 11445",
      platform: "Facebook",
      icon: Share2,
      color: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      campaign: "VSB Campus Virtual Tour FB Lead Form",
      status: "Inquired",
      time: "25 mins ago",
      campus: "COIMBATORE",
    },
    {
      id: "soc_2b",
      name: "P. Swetha",
      email: "swetha.fb2026@gmail.com",
      phone: "+91 99431 88221",
      platform: "Facebook",
      icon: Share2,
      color: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      campaign: "Facebook Feed Cutoff Calculator Ad",
      status: "Verified Lead",
      time: "40 mins ago",
      campus: "KARUR",
    },

    // WhatsApp
    {
      id: "soc_3",
      name: "M. Soundarya",
      email: "soundarya.ece@gmail.com",
      phone: "+91 97860 33221",
      platform: "WhatsApp",
      icon: MessageSquare,
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      campaign: "Direct WhatsApp Admission Chatbot",
      status: "Contacted",
      time: "42 mins ago",
      campus: "KARUR",
    },
    {
      id: "soc_3b",
      name: "K. Dinesh",
      email: "dinesh.wa2026@gmail.com",
      phone: "+91 98941 77665",
      platform: "WhatsApp",
      icon: MessageSquare,
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      campaign: "WhatsApp Official Broadcast Alert",
      status: "Admitted",
      time: "55 mins ago",
      campus: "COIMBATORE",
    },

    // X (Twitter)
    {
      id: "soc_4",
      name: "K. Pravin Kumar",
      email: "pravin.cse2026@gmail.com",
      phone: "+91 99430 77889",
      platform: "X (Twitter)",
      icon: Send,
      color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      campaign: "VSB TNEA Rank Predictor Tweet",
      status: "Applied",
      time: "1 hour ago",
      campus: "KARUR",
    },
    {
      id: "soc_4b",
      name: "T. Ramya",
      email: "ramya.twitter@gmail.com",
      phone: "+91 97511 44332",
      platform: "X (Twitter)",
      icon: Send,
      color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      campaign: "Twitter Engineering Placement Trend",
      status: "Inquired",
      time: "1.5 hours ago",
      campus: "COIMBATORE",
    },

    // E-mail
    {
      id: "soc_5",
      name: "A. Deepa Lakshmi",
      email: "deepa.it2026@gmail.com",
      phone: "+91 94433 66554",
      platform: "E-mail",
      icon: Mail,
      color: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      campaign: "12th Result Cutoff Email Newsletter",
      status: "Verified Lead",
      time: "2 hours ago",
      campus: "COIMBATORE",
    },

    // SMS
    {
      id: "soc_6",
      name: "T. Karthikeyan",
      email: "karthik.ai2026@gmail.com",
      phone: "+91 97877 22110",
      platform: "SMS",
      icon: MessageCircle,
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      campaign: "SMS Cutoff Alert Broadcast",
      status: "Inquired",
      time: "3 hours ago",
      campus: "KARUR",
    },

    // Campaign Hub
    {
      id: "soc_7",
      name: "P. Nithya Shree",
      email: "nithya.bme2026@gmail.com",
      phone: "+91 98431 55443",
      platform: "Campaign",
      icon: Sparkles,
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      campaign: "Mega Engineering Admission Drive",
      status: "Admitted",
      time: "5 hours ago",
      campus: "COIMBATORE",
    },

    // Project Expo
    {
      id: "soc_8",
      name: "G. Naveen Raj",
      email: "naveen.expo2026@gmail.com",
      phone: "+91 99420 88112",
      platform: "Project Expo",
      icon: Award,
      color: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      campaign: "National Level School Project Expo 2026",
      status: "Spot Registered",
      time: "6 hours ago",
      campus: "KARUR",
    },
  ];

  const channels = [
    { id: "ALL", label: "All Social Media", icon: Share2, count: "1,840 Students" },
    { id: "ADS", label: "Google & Social Ads", icon: Megaphone, count: "520 Students" },
    { id: "FACEBOOK", label: "Facebook", icon: Share2, count: "340 Students" },
    { id: "TWITTER", label: "X (Twitter)", icon: Send, count: "180 Students" },
    { id: "WHATSAPP", label: "WhatsApp Business", icon: MessageSquare, count: "410 Students" },
    { id: "EMAIL", label: "E-mail Portal", icon: Mail, count: "210 Students" },
    { id: "SMS", label: "SMS Gateway", icon: MessageCircle, count: "140 Students" },
    { id: "CAMPAIGN", label: "Campaign Hub", icon: Sparkles, count: "390 Students" },
    { id: "EXPO", label: "Project Expo", icon: Award, count: "250 Students" },
  ];

  const filteredLeads = socialLeads.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.campaign.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChannel =
      selectedSubTab === "ALL" ||
      (selectedSubTab === "ADS" && item.platform === "Google Ads") ||
      (selectedSubTab === "FACEBOOK" && item.platform === "Facebook") ||
      (selectedSubTab === "TWITTER" && item.platform === "X (Twitter)") ||
      (selectedSubTab === "WHATSAPP" && item.platform === "WhatsApp") ||
      (selectedSubTab === "EMAIL" && item.platform === "E-mail") ||
      (selectedSubTab === "SMS" && item.platform === "SMS") ||
      (selectedSubTab === "CAMPAIGN" && item.platform === "Campaign") ||
      (selectedSubTab === "EXPO" && item.platform === "Project Expo");

    return matchesSearch && matchesChannel;
  });

  const handleLaunchCampaign = (channelName: string) => {
    onTriggerToast(`🚀 Omnichannel Campaign Launched on ${channelName}! Syncing student leads...`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Overview Stat Cards */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-500/30">
              <Share2 className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                <span>Social Media & Contact Platform</span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE MARKETING HUB
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Unified social media ad tracking, WhatsApp broadcasts, Email campaigns, SMS alerts & Project Expo leads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <SpecularButton
              size="sm"
              tint="#6366f1"
              tintOpacity={0.25}
              lineColor="#818cf8"
              baseColor="#4f46e5"
              onClick={() => handleLaunchCampaign("All Omnichannel Networks")}
            >
              <Play className="w-4 h-4" /> <span>Launch New Campaign</span>
            </SpecularButton>
          </div>
        </div>

        {/* Omnichannel Overview Stat Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social Leads Captured</p>
            <h4 className="text-xl font-black text-sky-400 mt-1">1,840 Candidates</h4>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +24.8% this week
            </p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Ad Campaigns</p>
            <h4 className="text-xl font-black text-indigo-400 mt-1">12 Live Campaigns</h4>
            <p className="text-[10px] text-indigo-300 font-semibold mt-1">Google, Meta, WhatsApp & Expo</p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Omnichannel Messages</p>
            <h4 className="text-xl font-black text-emerald-400 mt-1">24,500 Sent</h4>
            <p className="text-[10px] text-emerald-300 font-semibold mt-1">98.4% Delivery Rate</p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Conversion Rate</p>
            <h4 className="text-xl font-black text-amber-400 mt-1">68.5% Verified</h4>
            <p className="text-[10px] text-amber-300 font-semibold mt-1">TNEA Counselling Ready</p>
          </div>
        </div>
      </div>

      {/* Channels Selector Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {channels.map((ch) => {
          const Icon = ch.icon;
          const isSelected = selectedSubTab === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => {
                setSelectedSubTab(ch.id);
                onTriggerToast(`Viewing ${ch.label} Platform Details`);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-sky-400 shadow-lg shadow-sky-500/25 scale-[1.02]"
                  : "bg-slate-900/80 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{ch.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}>
                {ch.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table & Campaign Control Card */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex flex-wrap items-center gap-2">
              <span>Student Candidates Registered via {channels.find((c) => c.id === selectedSubTab)?.label || "Social Platforms"}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 font-black">
                {channels.find((c) => c.id === selectedSubTab)?.count || "1,840 Students"}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live tracking of student leads arriving from social media ads, messaging apps, and college expos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate, campaign, phone..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={() => handleLaunchCampaign(selectedSubTab)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> <span>Sync Live Leads</span>
            </button>
          </div>
        </div>

        {/* Social Leads Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Candidate Name</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Campaign Source</th>
                <th className="px-4 py-3">Mobile Contact</th>
                <th className="px-4 py-3">Lead Status</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const Icon = lead.icon;
                  return (
                    <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-100">
                        <div>
                          <p className="text-slate-100">{lead.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{lead.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${lead.color}`}>
                          <Icon className="w-3 h-3" />
                          {lead.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sky-300 font-medium">{lead.campaign}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{lead.phone}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{lead.time}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onTriggerToast(`📲 Connected with ${lead.name} via ${lead.platform} portal!`)}
                          className="px-2.5 py-1 rounded-lg bg-sky-950 text-sky-400 hover:text-sky-200 border border-sky-800 text-[11px] font-bold flex items-center gap-1 transition-all"
                        >
                          <PhoneCall className="w-3 h-3" /> Connect
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-medium">
                    No social media leads found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
