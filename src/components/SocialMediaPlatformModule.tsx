"use client";

import { useState, useEffect, useRef } from "react";
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
  Pause,
  Calendar,
  Globe,
  Radio,
  Filter,
  Upload,
  Image as ImageIcon,
  Edit3,
  Trash2,
  X,
  Eye,
  Layers,
  DollarSign,
  Target,
  Tag,
  Check,
  Building2,
  Flame,
} from "lucide-react";
import { ActiveTab, CampusLocation } from "@/types/crm";
import SpecularButton from "@/components/SpecularButton";

export interface CollegeCampaign {
  id: string;
  title: string;
  platform: "Google Ads" | "Facebook" | "Instagram" | "WhatsApp" | "SMS" | "E-mail" | "Project Expo";
  department: string;
  targetLeads: number;
  currentLeads: number;
  status: "ACTIVE" | "PAUSED" | "DRAFT" | "COMPLETED";
  imageUrl: string;
  imageCaption?: string;
  budget: string;
  startDate: string;
  adCopy: string;
  campus: "KARUR" | "COIMBATORE" | "ALL";
  clicksCount: number;
  impressions: number;
}

// Preset Curated High-Definition College Visuals
const COLLEGE_IMAGE_PRESETS = [
  {
    id: "preset-campus-main",
    title: "VSB Academic Campus & Main Block",
    url: "/login-hero.jpg",
    category: "Campus Architecture",
  },
  {
    id: "preset-ai-lab",
    title: "AI, Robotics & Supercomputing Center",
    url: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1000&q=80",
    category: "Laboratories & Tech",
  },
  {
    id: "preset-expo",
    title: "National Project Expo & Innovation Arena",
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
    category: "Student Events & Expo",
  },
  {
    id: "preset-auditorium",
    title: "Tech Convention Center & Auditorium",
    url: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1000&q=80",
    category: "Campus Life",
  },
  {
    id: "preset-counseling",
    title: "Admission 2026 Student Orientation",
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80",
    category: "Counseling & Admissions",
  },
  {
    id: "preset-library",
    title: "Central Digital Library & Research Wing",
    url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1000&q=80",
    category: "Academic Infrastructure",
  },
];

const INITIAL_CAMPAIGNS: CollegeCampaign[] = [
  {
    id: "camp-1",
    title: "TNEA 2026 Engineering Admissions Open Drive",
    platform: "Google Ads",
    department: "All Engineering Branches",
    targetLeads: 500,
    currentLeads: 384,
    status: "ACTIVE",
    imageUrl: "/login-hero.jpg",
    imageCaption: "VSB Engineering College Main Academic Campus",
    budget: "₹35,000",
    startDate: "2026-08-01",
    adCopy: "Admissions open for 2026-27 at VSB Engineering College! 100% Placement Record, NAAC A+ Accredited, Top MNC Recruiters. Direct Counseling Assistance available.",
    campus: "ALL",
    clicksCount: 3420,
    impressions: 48900,
  },
  {
    id: "camp-2",
    title: "B.Tech Artificial Intelligence & Data Science Special Drive",
    platform: "Facebook",
    department: "AI & DS / Cyber Security",
    targetLeads: 300,
    currentLeads: 215,
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1000&q=80",
    imageCaption: "AI & Robotics Advanced Innovation Lab",
    budget: "₹20,000",
    startDate: "2026-08-15",
    adCopy: "Study next-gen AI, Machine Learning, Deep Learning & Robotics with industry-partnered centers of excellence at VSB. Apply now with your 12th cutoff!",
    campus: "KARUR",
    clicksCount: 2180,
    impressions: 31200,
  },
  {
    id: "camp-3",
    title: "National Level School Project Expo & Hackathon 2026",
    platform: "Project Expo",
    department: "School Outreach & Innovation",
    targetLeads: 450,
    currentLeads: 388,
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
    imageCaption: "National Level Student TechFest Arena",
    budget: "₹50,000",
    startDate: "2026-09-01",
    adCopy: "Grand School Project Expo 2026 at VSB Campus! Cash prizes worth ₹2 Lakhs, free bus transportation, campus visit & direct mentoring from senior professors.",
    campus: "COIMBATORE",
    clicksCount: 1940,
    impressions: 26500,
  },
  {
    id: "camp-4",
    title: "Direct WhatsApp Admission Assistance & Cutoff Verification",
    platform: "WhatsApp",
    department: "CSE & Information Technology",
    targetLeads: 600,
    currentLeads: 520,
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80",
    imageCaption: "Counseling & Student Orientation Center",
    budget: "₹15,000",
    startDate: "2026-08-20",
    adCopy: "Check your TNEA 2026 cutoff eligibility instantly via WhatsApp and connect directly with senior faculty counselors.",
    campus: "ALL",
    clicksCount: 4120,
    impressions: 59300,
  },
];

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

  // Sync selectedSubTab whenever activeTab prop changes
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
  const [campaigns, setCampaigns] = useState<CollegeCampaign[]>(INITIAL_CAMPAIGNS);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CollegeCampaign | null>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  // Load persisted campaigns from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vsb_college_campaigns_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCampaigns(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load stored campaigns:", e);
    }
  }, []);

  // Save campaigns helper
  const persistCampaigns = (newList: CollegeCampaign[]) => {
    setCampaigns(newList);
    try {
      localStorage.setItem("vsb_college_campaigns_v1", JSON.stringify(newList));
    } catch (e) {
      console.warn("Could not save campaigns to localStorage:", e);
    }
  };

  // Mock Social Media Leads
  const socialLeads = [
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
    { id: "CAMPAIGN", label: "Campaign Hub", icon: Sparkles, count: `${campaigns.length} Campaigns` },
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
      (selectedSubTab === "CAMPAIGN" && (item.platform === "Campaign" || item.platform === "Google Ads")) ||
      (selectedSubTab === "EXPO" && item.platform === "Project Expo");

    return matchesSearch && matchesChannel;
  });

  // Open modal in create mode
  const handleOpenNewCampaignModal = (channelName?: string) => {
    setEditingCampaign(null);
    setIsCampaignModalOpen(true);
  };

  // Open modal in edit mode
  const handleEditCampaign = (camp: CollegeCampaign) => {
    setEditingCampaign(camp);
    setIsCampaignModalOpen(true);
  };

  // Toggle active/paused status
  const handleToggleCampaignStatus = (id: string) => {
    const updated = campaigns.map((c) => {
      if (c.id === id) {
        const nextStatus = c.status === "ACTIVE" ? ("PAUSED" as const) : ("ACTIVE" as const);
        onTriggerToast(`Campaign "${c.title}" is now ${nextStatus}`);
        return { ...c, status: nextStatus };
      }
      return c;
    });
    persistCampaigns(updated);
  };

  // Delete campaign
  const handleDeleteCampaign = (id: string, title: string) => {
    const updated = campaigns.filter((c) => c.id !== id);
    persistCampaigns(updated);
    onTriggerToast(`🗑️ Campaign "${title}" removed.`);
  };

  // Save created or edited campaign
  const handleSaveCampaign = (savedData: CollegeCampaign) => {
    const exists = campaigns.some((c) => c.id === savedData.id);
    let updated: CollegeCampaign[];
    if (exists) {
      updated = campaigns.map((c) => (c.id === savedData.id ? savedData : c));
      onTriggerToast(`✅ Campaign "${savedData.title}" updated successfully!`);
    } else {
      updated = [savedData, ...campaigns];
      onTriggerToast(`🚀 College Campaign "${savedData.title}" launched live!`);
    }
    persistCampaigns(updated);
    setIsCampaignModalOpen(false);
    setEditingCampaign(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Overview Stat Cards */}
      <div className="rounded-2xl p-5 border border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md">
              <Share2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Social Media & Contact Platform</span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                  LIVE MARKETING HUB
                </span>
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Unified social media ad tracking, WhatsApp broadcasts, Email campaigns, SMS alerts & Project Expo leads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* The Launch New Campaign Button Requested by User */}
            <SpecularButton
              size="sm"
              tint="#ffffff"
              tintOpacity={0.95}
              lineColor="#6366f1"
              baseColor="#c7d2fe"
              textColor="#000000"
              onClick={() => handleOpenNewCampaignModal()}
              className="text-black font-black shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play className="w-4 h-4 text-black fill-black" />
              <span className="text-black font-black">Launch New Campaign</span>
            </SpecularButton>

          </div>
        </div>

        {/* Omnichannel Overview Stat Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-200">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Social Leads Captured</p>
            <h4 className="text-xl font-black text-sky-600 mt-1">1,840 Candidates</h4>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +24.8% this week
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Ad Campaigns</p>
            <h4 className="text-xl font-black text-indigo-600 mt-1">{campaigns.filter(c => c.status === "ACTIVE").length} Live Campaigns</h4>
            <p className="text-[10px] text-indigo-600 font-semibold mt-1">Google, Meta, WhatsApp & Expo</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Omnichannel Messages</p>
            <h4 className="text-xl font-black text-emerald-600 mt-1">24,500 Sent</h4>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">98.4% Delivery Rate</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead Conversion Rate</p>
            <h4 className="text-xl font-black text-amber-600 mt-1">68.5% Verified</h4>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">TNEA Counselling Ready</p>
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-sky-400 shadow-md scale-[1.02]"
                  : "bg-white text-slate-700 hover:text-slate-950 border-slate-200 hover:border-slate-300 shadow-xs"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{ch.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                {ch.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* College Marketing Campaigns Showcase with Uploaded Images */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Building2 className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-slate-900">
                College Marketing Campaigns & Creative Media Assets
              </h3>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                {campaigns.length} Active / Managed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upload custom college posters, campus banners, and manage live promotional campaigns across social networks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenNewCampaignModal()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Launch / Edit College Ad</span>
            </button>
          </div>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {campaigns.map((camp) => {
            const pct = Math.min(100, Math.round((camp.currentLeads / camp.targetLeads) * 100));
            return (
              <div
                key={camp.id}
                className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 p-4 transition-all duration-200 hover:shadow-md hover:border-indigo-300 flex flex-col justify-between space-y-3.5 group"
              >
                {/* Visual Banner Preview with Action Badges */}
                <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-900 aspect-[16/9] max-h-48 group/img">
                  {camp.imageUrl ? (
                    <img
                      src={camp.imageUrl}
                      alt={camp.title}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                      <span className="text-xs font-bold">No College Image Selected</span>
                    </div>
                  )}

                  {/* Top Status and Platform Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-black/75 backdrop-blur-md text-white border border-white/20 shadow-md flex items-center gap-1">
                      <Globe className="w-3 h-3 text-sky-400" />
                      {camp.platform}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black backdrop-blur-md border shadow-md flex items-center gap-1.5 ${
                        camp.status === "ACTIVE"
                          ? "bg-emerald-600/90 text-white border-emerald-400"
                          : "bg-amber-600/90 text-white border-amber-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          camp.status === "ACTIVE" ? "bg-white animate-pulse" : "bg-white/60"
                        }`}
                      />
                      {camp.status}
                    </span>
                  </div>

                  {/* Bottom Image Hover Overlay with View Lightbox */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setActivePreviewImage(camp.imageUrl)}
                      className="px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transform active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" /> View Image
                    </button>
                    <button
                      onClick={() => handleEditCampaign(camp)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transform active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit / Replace
                    </button>
                  </div>

                  {camp.imageCaption && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4">
                      <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                        📸 {camp.imageCaption}
                      </p>
                    </div>
                  )}
                </div>

                {/* Campaign Details Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {camp.department}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      Budget: <strong className="text-slate-950">{camp.budget}</strong>
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-950 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {camp.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {camp.adCopy}
                  </p>
                </div>

                {/* Performance Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1 text-slate-800">
                      <Target className="w-3.5 h-3.5 text-sky-600" />
                      <span>{camp.currentLeads} / {camp.targetLeads} Leads</span>
                    </span>
                    <span className="text-indigo-600 font-extrabold">{pct}% Target Met</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                    <span>{camp.clicksCount.toLocaleString()} Clicks</span>
                    <span>•</span>
                    <span>{camp.impressions.toLocaleString()} Impressions</span>
                    <span>•</span>
                    <span className="capitalize">{camp.campus} Campus</span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleCampaignStatus(camp.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                        camp.status === "ACTIVE"
                          ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      {camp.status === "ACTIVE" ? (
                        <>
                          <Pause className="w-3 h-3" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" /> Activate
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteCampaign(camp.id, camp.title)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleEditCampaign(camp)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Edit Campaign & Image</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
              onClick={() => handleOpenNewCampaignModal(selectedSubTab)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> <span>Add Campaign</span>
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
                          className="px-2.5 py-1 rounded-lg bg-sky-950 text-sky-400 hover:text-sky-200 border border-sky-800 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
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

      {/* INTERACTIVE CAMPAIGN LAUNCHER & COLLEGE IMAGE UPLOADER MODAL */}
      {isCampaignModalOpen && (
        <CampaignEditorModal
          campaign={editingCampaign}
          onClose={() => {
            setIsCampaignModalOpen(false);
            setEditingCampaign(null);
          }}
          onSave={handleSaveCampaign}
        />
      )}

      {/* FULL-SCREEN COLLEGE BANNER PREVIEW LIGHTBOX */}
      {activePreviewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setActivePreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-white/20 shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-white">
              <span className="font-extrabold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" /> College Campaign Visual Preview
              </span>
              <button
                onClick={() => setActivePreviewImage(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center">
              <img
                src={activePreviewImage}
                alt="College Campaign Banner"
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Interactive Campaign & Image Editor Modal
// ==========================================
interface CampaignEditorModalProps {
  campaign: CollegeCampaign | null;
  onClose: () => void;
  onSave: (campaign: CollegeCampaign) => void;
}

function CampaignEditorModal({ campaign, onClose, onSave }: CampaignEditorModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [title, setTitle] = useState(campaign?.title || "VSB Engineering College 2026 Admissions Open");
  const [platform, setPlatform] = useState<CollegeCampaign["platform"]>(campaign?.platform || "Google Ads");
  const [department, setDepartment] = useState(campaign?.department || "B.Tech Computer Science & AI-DS");
  const [targetLeads, setTargetLeads] = useState(campaign?.targetLeads || 400);
  const [budget, setBudget] = useState(campaign?.budget || "₹25,000");
  const [startDate, setStartDate] = useState(campaign?.startDate || new Date().toISOString().split("T")[0]);
  const [campus, setCampus] = useState<CollegeCampaign["campus"]>(campaign?.campus || "ALL");
  const [adCopy, setAdCopy] = useState(
    campaign?.adCopy ||
      "Admissions open for 2026-27 at VSB Engineering College! 100% Placement Record, NAAC A+ Grade, 100+ Top MNC Recruiters. Direct Counseling Assistance available."
  );
  const [imageUrl, setImageUrl] = useState(campaign?.imageUrl || "/login-hero.jpg");
  const [imageCaption, setImageCaption] = useState(campaign?.imageCaption || "VSB Engineering College Main Academic Campus");
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [activeImageSourceTab, setActiveImageSourceTab] = useState<"UPLOAD" | "PRESETS" | "URL">("UPLOAD");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Optimized file reader for uploaded college photos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WEBP, or SVG).");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        setIsUploading(false);
        return;
      }

      // Optimize image on canvas to maintain performance and avoid localStorage storage limits
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.86);

          setImageUrl(dataUrl);
          setImageCaption(file.name.replace(/\.[^/.]+$/, ""));
        } catch (e) {
          // Fallback to raw base64
          setImageUrl(result);
          setImageCaption(file.name.replace(/\.[^/.]+$/, ""));
        } finally {
          setIsUploading(false);
        }
      };
      img.onerror = () => {
        setImageUrl(result);
        setIsUploading(false);
      };
      img.src = result;
    };

    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setImageUrl(urlInput.trim());
    setImageCaption("College Web Visual Banner");
    setUrlInput("");
  };

  const handleSelectPreset = (preset: (typeof COLLEGE_IMAGE_PRESETS)[0]) => {
    setImageUrl(preset.url);
    setImageCaption(preset.title);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a campaign name.");
      return;
    }
    if (!imageUrl) {
      setErrorMessage("Please select or upload an image about the college.");
      return;
    }

    const savedCampaign: CollegeCampaign = {
      id: campaign?.id || `camp-${Date.now()}`,
      title: title.trim(),
      platform,
      department,
      targetLeads: Number(targetLeads) || 300,
      currentLeads: campaign?.currentLeads || 0,
      status: campaign?.status || "ACTIVE",
      imageUrl,
      imageCaption: imageCaption.trim() || "College Campus Banner",
      budget: budget.trim() || "₹20,000",
      startDate,
      adCopy: adCopy.trim(),
      campus,
      clicksCount: campaign?.clicksCount || 0,
      impressions: campaign?.impressions || 0,
    };

    onSave(savedCampaign);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-300 shadow-2xl overflow-hidden text-slate-950 flex flex-col max-h-[95vh] my-auto">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              {campaign ? <Edit3 className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">
                {campaign ? "Edit College Campaign & Ad Creative" : "Launch New College Campaign"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Upload or edit college campus images, target audience & social media ad specs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 font-bold flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: College Image Upload & Selection */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>College Ad Creative / Campus Banner Image</span>
                <span className="text-rose-600 font-bold">*</span>
              </label>

              {/* Source Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveImageSourceTab("UPLOAD")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    activeImageSourceTab === "UPLOAD"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageSourceTab("PRESETS")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    activeImageSourceTab === "PRESETS"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  Campus Presets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageSourceTab("URL")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    activeImageSourceTab === "URL"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  Image Link
                </button>
              </div>
            </div>

            {/* TAB CONTENT: Upload from Device */}
            {activeImageSourceTab === "UPLOAD" && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/40 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-xs">
                      Click to Browse or Drag & Drop College Image
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Supports JPG, PNG, WEBP, SVG • Instant preview & automatic resolution optimization
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-black text-[11px] shadow-xs">
                    {isUploading ? "Processing Image..." : "Choose Image from Device"}
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Pick from College Presets */}
            {activeImageSourceTab === "PRESETS" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {COLLEGE_IMAGE_PRESETS.map((preset) => {
                  const isChosen = imageUrl === preset.url;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`group relative rounded-xl overflow-hidden border text-left p-1.5 transition-all cursor-pointer ${
                        isChosen
                          ? "ring-2 ring-indigo-600 border-indigo-500 bg-indigo-50/80"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-900">
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isChosen && (
                          <div className="absolute top-1 right-1 p-1 rounded-full bg-indigo-600 text-white shadow-md">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <p className="font-extrabold text-slate-900 text-[10px] mt-1.5 truncate">
                        {preset.title}
                      </p>
                      <span className="text-[9px] text-slate-500 font-semibold">{preset.category}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT: Paste Image URL */}
            {activeImageSourceTab === "URL" && (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/college-poster.jpg"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 shrink-0 cursor-pointer"
                >
                  Load Image
                </button>
              </div>
            )}

            {/* Active Image Live Preview Card */}
            {imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-950 aspect-[16/8] max-h-56 mt-2 group/preview">
                <img
                  src={imageUrl}
                  alt={imageCaption || "Campaign Preview"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white font-black text-[10px] border border-white/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Image Ready</span>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/75 backdrop-blur-md p-2 rounded-xl text-white">
                  <div className="min-w-0 flex-1 mr-2">
                    <input
                      type="text"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="Image caption / description..."
                      className="w-full bg-transparent border-0 text-white text-xs font-bold focus:outline-none placeholder-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setImageCaption("");
                    }}
                    className="p-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shrink-0 cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Campaign Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Campaign Title */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                <span>Campaign Name / Title</span>
                <span className="text-rose-600 font-bold">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. VSB Engineering 2026 B.Tech Admissions Drive"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Platform Selection */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 text-xs">
                Target Marketing Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Google Ads">Google Ads (Search, Display & YouTube)</option>
                <option value="Facebook">Meta (Facebook & Instagram Feed)</option>
                <option value="WhatsApp">WhatsApp Business Broadcast</option>
                <option value="SMS">SMS Gateway Direct Alert</option>
                <option value="E-mail">E-mail Newsletter Portal</option>
                <option value="Project Expo">Project Expo & School Outreach</option>
              </select>
            </div>

            {/* Target Department */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 text-xs">
                Target Academic Branch / Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Engineering Branches">All Engineering Branches (General)</option>
                <option value="B.Tech Computer Science & AI-DS">B.Tech Computer Science & AI-DS</option>
                <option value="AI & Robotics / Cyber Security">AI & Robotics / Cyber Security</option>
                <option value="Electronics & Communication (ECE)">Electronics & Communication (ECE)</option>
                <option value="Mechanical & Mechatronics">Mechanical & Mechatronics</option>
                <option value="Electrical & Electronics (EEE)">Electrical & Electronics (EEE)</option>
                <option value="Bio-Medical & Civil Engg">Bio-Medical & Civil Engg</option>
                <option value="School Outreach & Innovation">School Outreach & Project Expo</option>
              </select>
            </div>

            {/* Target Leads Goal */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 text-xs">
                Target Candidate Leads Goal
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={targetLeads}
                onChange={(e) => setTargetLeads(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Budget */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 text-xs">
                Campaign Budget (INR)
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. ₹25,000 or ₹1,500/day"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Campus Selection */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 text-xs">
                Target Campus Location
              </label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Both Karur & Coimbatore Campuses</option>
                <option value="KARUR">Karur Main Campus</option>
                <option value="COIMBATORE">Coimbatore Campus</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 text-xs">
                Campaign Launch Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Ad Copy / Message Text */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-extrabold text-slate-800 text-xs">
                Promotional Ad Copy / Caption Text
              </label>
              <textarea
                rows={3}
                value={adCopy}
                onChange={(e) => setAdCopy(e.target.value)}
                placeholder="Enter compelling college highlights, cutoff criteria, placement track record..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{campaign ? "Save Campaign & Image Changes" : "🚀 Launch College Campaign"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
