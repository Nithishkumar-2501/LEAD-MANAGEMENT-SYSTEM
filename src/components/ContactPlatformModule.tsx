"use client";

import { useState } from "react";
import {
  Share2,
  Megaphone,
  Facebook,
  Twitter,
  MessageSquare,
  Mail,
  Smartphone,
  Sparkles,
  Rocket,
  Send,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Eye,
  MousePointer,
  DollarSign,
  Users,
  Copy,
  ExternalLink,
  Plus,
  Play,
  Check,
} from "lucide-react";
import { CampusLocation } from "@/types/crm";
import SpecularButton from "@/components/SpecularButton";

export type SocialSubChannel =
  | "ALL"
  | "ADS"
  | "FACEBOOK"
  | "TWITTER"
  | "WHATSAPP"
  | "EMAIL"
  | "SMS"
  | "CAMPAIGN"
  | "EXPO";

interface ContactPlatformModuleProps {
  loggedInCampus: CampusLocation;
  onTriggerToast: (msg: string) => void;
  activeChannel?: SocialSubChannel;
  onSelectChannel?: (channel: SocialSubChannel) => void;
}

export default function ContactPlatformModule({
  loggedInCampus,
  onTriggerToast,
  activeChannel = "ALL",
  onSelectChannel,
}: ContactPlatformModuleProps) {
  const [selectedChannel, setSelectedChannel] = useState<SocialSubChannel>(activeChannel);

  // Broadcast & Message State
  const [broadcastTarget, setBroadcastTarget] = useState("ALL_LEADS");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Social Media Channels Config
  const channels = [
    { id: "ALL" as SocialSubChannel, label: "All Channels", icon: Share2, color: "from-sky-500 to-indigo-600" },
    { id: "ADS" as SocialSubChannel, label: "Ads & Paid Media", icon: Megaphone, color: "from-amber-500 to-red-600" },
    { id: "FACEBOOK" as SocialSubChannel, label: "Facebook", icon: Facebook, color: "from-blue-600 to-indigo-700" },
    { id: "TWITTER" as SocialSubChannel, label: "X (Twitter)", icon: Twitter, color: "from-slate-700 to-slate-900" },
    { id: "WHATSAPP" as SocialSubChannel, label: "WhatsApp", icon: MessageSquare, color: "from-emerald-500 to-teal-600" },
    { id: "EMAIL" as SocialSubChannel, label: "E-Mail Direct", icon: Mail, color: "from-rose-500 to-pink-600" },
    { id: "SMS" as SocialSubChannel, label: "SMS Broadcast", icon: Smartphone, color: "from-purple-500 to-indigo-600" },
    { id: "CAMPAIGN" as SocialSubChannel, label: "Campaigns", icon: Sparkles, color: "from-amber-400 to-orange-600" },
    { id: "EXPO" as SocialSubChannel, label: "Project Expo", icon: Rocket, color: "from-indigo-500 to-cyan-500" },
  ];

  const handleChannelSwitch = (ch: SocialSubChannel) => {
    setSelectedChannel(ch);
    if (onSelectChannel) onSelectChannel(ch);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    setIsSending(true);

    setTimeout(() => {
      setIsSending(false);
      onTriggerToast(
        `🚀 Broadcast sent via ${selectedChannel === "ALL" ? "Multi-Channel" : selectedChannel} to ${broadcastTarget}!`
      );
      setBroadcastMsg("");
      setBroadcastSubject("");
    }, 800);
  };

  // Mock Channel Campaign Feeds & Data
  const adCampaigns = [
    { name: "VSB TNEA Admissions 2026 - Google Search", budget: "₹45,000", leads: 342, cpl: "₹131.50", status: "ACTIVE" },
    { name: "VSB Karur B.E. Computer Science Meta Ads", budget: "₹30,000", leads: 289, cpl: "₹103.80", status: "ACTIVE" },
    { name: "VSB Coimbatore Engineering Direct Retargeting", budget: "₹25,000", leads: 194, cpl: "₹128.80", status: "PAUSED" },
  ];

  const facebookLeads = [
    { candidate: "K. Vigneshwaran", course: "B.E. Computer Science", date: "Aug 20, 2026", status: "Verified Form" },
    { candidate: "R. Priyadharshini", course: "B.Tech AI & Data Science", date: "Aug 20, 2026", status: "Verified Form" },
    { candidate: "S. Kanthaswamy", course: "B.E. Mechanical", date: "Aug 19, 2026", status: "In Followup" },
  ];

  const twitterPosts = [
    { tweet: "🎓 V.S.B. Engineering College Admissions 2026 TNEA General Counselling portal is live!", impressions: "14.2K", retweets: 188, likes: 640 },
    { tweet: "🚀 100% Placement Record achieved for CSE & IT departments at VSB Karur & Coimbatore Campuses!", impressions: "28.5K", retweets: 412, likes: 1250 },
  ];

  const whatsappTemplates = [
    { title: "TNEA Counselling Cutoff Alert", body: "Hello {Student_Name}, your TNEA Cutoff mark 188.5 qualifies for B.E. CSE at V.S.B. Karur Campus!" },
    { title: "Fee Payment & Scholarship Confirmation", body: "Dear Candidate, 7.5% Govt School Quota seat confirmation is ready at V.S.B. Campus." },
  ];

  const expoProjects = [
    { project: "AI-Powered Smart Solar Grid Controller", department: "B.Tech AI & DS", team: "Innovation Squad 1", score: "98/100", leadsGenerated: 45 },
    { project: "Autonomous Electric Drone Delivery System", department: "B.E. Robotics & ECE", team: "AeroTech Karur", score: "96/100", leadsGenerated: 38 },
  ];

  return (
    <div className="space-y-6">
      {/* Module Overview Header Bar */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Share2 className="w-6 h-6" />
            </div>
            Contact & Social Media Platform
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-channel candidate outreach, social ad campaigns, WhatsApp broadcasts, direct email, SMS, and Project Expo leads.
          </p>
        </div>

        {/* Global Channel Performance Stats */}
        <div className="flex items-center gap-4 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
          <div className="text-center px-3 border-r border-slate-800">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Reach</p>
            <p className="text-base font-black text-sky-400">148.5K</p>
          </div>
          <div className="text-center px-3 border-r border-slate-800">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Social Leads</p>
            <p className="text-base font-black text-emerald-400">1,284</p>
          </div>
          <div className="text-center px-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Conv. Rate</p>
            <p className="text-base font-black text-amber-400">18.4%</p>
          </div>
        </div>
      </div>

      {/* Social Media Channel Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {channels.map((ch) => {
          const Icon = ch.icon;
          const isSelected = selectedChannel === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => handleChannelSwitch(ch.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? `bg-gradient-to-r ${ch.color} text-white shadow-lg shadow-indigo-600/30 scale-105 border border-white/20`
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{ch.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN CONTENT AREA BY CHANNEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Channel Content & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* ADS & PAID MEDIA CHANNEL */}
          {(selectedChannel === "ALL" || selectedChannel === "ADS") && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-400" />
                  Ads & Paid Media Campaigns (Google & Meta)
                </h3>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
                  3 Campaigns Running
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-semibold">Total Ad Spend</p>
                  <p className="text-xl font-black text-slate-100 mt-1">₹1,00,000</p>
                </div>
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-semibold">Leads Acquired</p>
                  <p className="text-xl font-black text-sky-400 mt-1">825 Candidates</p>
                </div>
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-semibold">Average CPL</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">₹121.20</p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Campaign Name</th>
                      <th className="px-4 py-2.5">Budget</th>
                      <th className="px-4 py-2.5">Leads</th>
                      <th className="px-4 py-2.5">CPL</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                    {adCampaigns.map((ad, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="px-4 py-2.5 font-bold text-slate-100">{ad.name}</td>
                        <td className="px-4 py-2.5 font-mono">{ad.budget}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-400">{ad.leads}</td>
                        <td className="px-4 py-2.5 font-mono">{ad.cpl}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ad.status === "ACTIVE"
                                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                                : "bg-amber-950 text-amber-400 border-amber-800"
                            }`}
                          >
                            {ad.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FACEBOOK CHANNEL */}
          {(selectedChannel === "ALL" || selectedChannel === "FACEBOOK") && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-500" />
                  Facebook Page & Meta Instant Lead Forms
                </h3>
                <button
                  onClick={() => onTriggerToast("Synced latest Meta Lead Forms for V.S.B. Page!")}
                  className="text-xs text-sky-400 font-bold hover:underline flex items-center gap-1"
                >
                  🔄 Sync Meta Leads
                </button>
              </div>

              <div className="space-y-2">
                {facebookLeads.map((fb, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center">
                        FB
                      </div>
                      <div>
                        <p className="font-bold text-slate-100">{fb.candidate}</p>
                        <p className="text-[11px] text-slate-400">{fb.course}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-sky-400 block">{fb.status}</span>
                      <span className="text-[10px] text-slate-500">{fb.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* X (TWITTER) CHANNEL */}
          {(selectedChannel === "ALL" || selectedChannel === "TWITTER") && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Twitter className="w-5 h-5 text-slate-200" />
                  X (Twitter) Official Broadcast Feed
                </h3>
                <span className="text-xs font-semibold text-slate-400">@VSB_Engineering</span>
              </div>

              <div className="space-y-3">
                {twitterPosts.map((tw, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                    <p className="text-slate-200 font-medium">{tw.tweet}</p>
                    <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                      <span>👀 {tw.impressions} Views</span>
                      <span>🔄 {tw.retweets} Retweets</span>
                      <span>❤️ {tw.likes} Likes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECT EXPO CHANNEL */}
          {(selectedChannel === "ALL" || selectedChannel === "EXPO") && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-cyan-400" />
                  V.S.B. Science & Tech Project Expo Leads
                </h3>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-3 py-1 rounded-full">
                  Expo 2026 Live
                </span>
              </div>

              <div className="space-y-2.5">
                {expoProjects.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{ex.project}</h4>
                      <p className="text-slate-400">{ex.department} • {ex.team}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-cyan-400 block">{ex.score} Score</span>
                      <span className="text-[11px] text-slate-400">{ex.leadsGenerated} Candidate Inquiry Leads</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Live Multi-Channel Broadcast & Direct Message Hub */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Send className="w-5 h-5 text-emerald-400" />
              Live Candidate Outreach Sender
            </h3>

            <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Channel</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => handleChannelSwitch(e.target.value as SocialSubChannel)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold text-indigo-300"
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Audience Quota</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="ALL_LEADS">All Registered Leads (1,248 Candidates)</option>
                  <option value="TNEA_CUTOFF">High Cutoff Candidates (&gt;180 Marks)</option>
                  <option value="KARUR_CAMPUS">V.S.B. Karur Campus Applicants</option>
                  <option value="COIMBATORE_CAMPUS">V.S.B. Coimbatore Campus Applicants</option>
                </select>
              </div>

              {(selectedChannel === "EMAIL" || selectedChannel === "ALL") && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder="e.g. V.S.B. Engineering College TNEA Cutoff Seat Allotment"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Broadcast Message Content</label>
                <textarea
                  rows={4}
                  required
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Type official candidate message or social media update..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <SpecularButton
                size="sm"
                tint="#10b981"
                tintOpacity={0.9}
                lineColor="#34d399"
                baseColor="#059669"
                type="submit"
                disabled={isSending}
                className="w-full justify-center"
              >
                <Send className="w-4 h-4 text-emerald-100" />
                <span>{isSending ? "Dispatching..." : `Send via ${selectedChannel}`}</span>
              </SpecularButton>
            </form>
          </div>

          {/* Quick Outreach Templates Card */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Pre-Approved WhatsApp & SMS Templates
            </h4>

            <div className="space-y-2 text-xs">
              {whatsappTemplates.map((tmpl, idx) => (
                <div
                  key={idx}
                  onClick={() => setBroadcastMsg(tmpl.body)}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer group"
                >
                  <p className="font-bold text-sky-300 group-hover:text-sky-200">{tmpl.title}</p>
                  <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">{tmpl.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
