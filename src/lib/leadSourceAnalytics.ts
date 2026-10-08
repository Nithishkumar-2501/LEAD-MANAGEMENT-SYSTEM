import { Lead } from "@/types/crm";

export interface LeadSourceChannelMeta {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  count: number;
  percentage: number;
  badgeText: string;
  colorHex: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  gradientBg: string;
  iconType: "EXPO" | "CSV" | "GOOGLE" | "META" | "WHATSAPP" | "SMS" | "EMAIL" | "COUNSELLING" | "WALKIN" | "CAMPAIGN" | "OTHER";
}

export interface AllLeadSourcesSummary {
  totalLeads: number;
  channels: LeadSourceChannelMeta[];
  primaryHighlights: {
    expoCount: number;
    csvCount: number;
    socialCount: number;
    counsellingCount: number;
    directCount: number;
  };
  dominantSource: LeadSourceChannelMeta;
}

/**
 * Classifies a lead into its distinct primary acquisition channel
 */
export function classifyLeadSourceKey(lead: Lead): string {
  const src = (lead.source || "").toLowerCase().trim();
  const id = (lead.id || "").toLowerCase().trim();

  // 1. Project Expo & School Outreach
  if (
    src.includes("expo") ||
    src.includes("science fair") ||
    src.includes("school outreach") ||
    src.includes("project fair") ||
    src.includes("innovation exhibit")
  ) {
    return "EXPO";
  }

  // 2. CSV File Uploads & Bulk Spreadsheet Imports
  if (
    src.includes("csv") ||
    src.includes("excel") ||
    src.includes("import") ||
    src.includes("sheet") ||
    id.startsWith("lead_csv_") ||
    src.startsWith("csv:")
  ) {
    return "CSV";
  }

  // 3. Google Ads (Search, Display & YouTube)
  if (
    src.includes("google") ||
    src.includes("adwords") ||
    src.includes("g-ad") ||
    src.includes("search ad") ||
    src === "ads" ||
    src === "ad" ||
    src.includes("newspaper ad")
  ) {
    return "GOOGLE";
  }

  // 4. Meta / Social Media (Facebook, Instagram, LinkedIn, X/Twitter)
  if (
    src.includes("facebook") ||
    src.includes("fb") ||
    src.includes("meta") ||
    src.includes("instagram") ||
    src.includes("insta") ||
    src.includes("twitter") ||
    src.includes("social")
  ) {
    return "META";
  }

  // 5. WhatsApp Business Inquiries
  if (src.includes("whatsapp") || src.includes("wa")) {
    return "WHATSAPP";
  }

  // 6. SMS Mobile Gateway
  if (src.includes("sms") || src.includes("text message") || src.includes("mobile blast")) {
    return "SMS";
  }

  // 7. E-mail Newsletter & Outreach Portal
  if (src.includes("email") || src.includes("e-mail") || src.includes("newsletter") || src === "mail") {
    return "EMAIL";
  }

  // 8. TNEA / State Government Counselling
  if (src.includes("tnea") || src.includes("counsel") || lead.appliedCounselling === true) {
    return "COUNSELLING";
  }

  // 9. Campus Walk-in & Direct Student Referral
  if (
    src.includes("walk") ||
    src.includes("referral") ||
    src.includes("visit") ||
    src.includes("alumni") ||
    src.includes("spot")
  ) {
    return "WALKIN";
  }

  // 10. Digital Marketing Campaigns & Web Forms
  if (
    src.includes("campaign") ||
    src.includes("portal") ||
    src.includes("website") ||
    src.includes("inquiry") ||
    src.includes("online")
  ) {
    return "CAMPAIGN";
  }

  // 11. Other Inbound Direct Sources
  return "OTHER";
}

/**
 * Calculates complete telemetry across all lead acquisition channels
 */
export function calculateAllSourcesTelemetry(leads: Lead[]): AllLeadSourcesSummary {
  const totalLeads = leads.length;

  const counts: Record<string, number> = {
    EXPO: 0,
    CSV: 0,
    GOOGLE: 0,
    META: 0,
    WHATSAPP: 0,
    SMS: 0,
    EMAIL: 0,
    COUNSELLING: 0,
    WALKIN: 0,
    CAMPAIGN: 0,
    OTHER: 0,
  };

  leads.forEach((l) => {
    const key = classifyLeadSourceKey(l);
    counts[key] = (counts[key] || 0) + 1;
  });

  const getPct = (c: number): number => {
    if (totalLeads === 0) return 0;
    return Number(((c / totalLeads) * 100).toFixed(1));
  };

  const channelConfigs: Omit<LeadSourceChannelMeta, "count" | "percentage">[] = [
    {
      key: "EXPO",
      label: "Project Expo & School Outreach",
      shortLabel: "Project Expo",
      description: "Science fairs, project exhibitions & school outreach events",
      badgeText: "Expo Innovation",
      colorHex: "#14b8a6", // teal-500
      textColor: "text-teal-400",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/30",
      gradientBg: "from-teal-500/20 to-emerald-500/20",
      iconType: "EXPO",
    },
    {
      key: "CSV",
      label: "CSV Spreadsheet File Uploads",
      shortLabel: "CSV Import",
      description: "Bulk data imported via .csv files and Excel sheets",
      badgeText: "Batch Ingested",
      colorHex: "#84cc16", // lime-500
      textColor: "text-lime-400",
      bgColor: "bg-lime-500/10",
      borderColor: "border-lime-500/30",
      gradientBg: "from-lime-500/20 to-green-500/20",
      iconType: "CSV",
    },
    {
      key: "GOOGLE",
      label: "Google Ads & Search Campaigns",
      shortLabel: "Google Ads",
      description: "High-intent search, display network & YouTube PPC ads",
      badgeText: "High Intent PPC",
      colorHex: "#38bdf8", // sky-400
      textColor: "text-sky-400",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/30",
      gradientBg: "from-sky-500/20 to-blue-500/20",
      iconType: "GOOGLE",
    },
    {
      key: "META",
      label: "Meta (Facebook & Instagram Feed)",
      shortLabel: "Social Ads",
      description: "Targeted social feeds, stories and lead generation forms",
      badgeText: "Social Feed ROI",
      colorHex: "#6366f1", // indigo-500
      textColor: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/30",
      gradientBg: "from-indigo-500/20 to-purple-500/20",
      iconType: "META",
    },
    {
      key: "WHATSAPP",
      label: "WhatsApp Business Inquiries",
      shortLabel: "WhatsApp",
      description: "Verified messaging broadcasts and student chats",
      badgeText: "Direct Chat",
      colorHex: "#22c55e", // green-500
      textColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      gradientBg: "from-emerald-500/20 to-teal-500/20",
      iconType: "WHATSAPP",
    },
    {
      key: "SMS",
      label: "SMS Gateway Mobile Alerts",
      shortLabel: "SMS Gateway",
      description: "Direct SMS broadcast reminders and cutoff alerts",
      badgeText: "Mobile Alerts",
      colorHex: "#f59e0b", // amber-500
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      gradientBg: "from-amber-500/20 to-yellow-500/20",
      iconType: "SMS",
    },
    {
      key: "EMAIL",
      label: "E-mail Outreach & Newsletters",
      shortLabel: "Email Portal",
      description: "Inbound admission newsletters and counseling mailers",
      badgeText: "Email Inbound",
      colorHex: "#a855f7", // purple-500
      textColor: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      gradientBg: "from-purple-500/20 to-fuchsia-500/20",
      iconType: "EMAIL",
    },
    {
      key: "COUNSELLING",
      label: "TNEA & State Counselling",
      shortLabel: "TNEA Quota",
      description: "Government merit quota, general and 7.5% counseling",
      badgeText: "Merit Rank Quota",
      colorHex: "#06b6d4", // cyan-500
      textColor: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      gradientBg: "from-cyan-500/20 to-sky-500/20",
      iconType: "COUNSELLING",
    },
    {
      key: "WALKIN",
      label: "Campus Walk-in & Alumni Referral",
      shortLabel: "Walk-in Desk",
      description: "In-person campus visits, spot admissions and referrals",
      badgeText: "On-Campus Spot",
      colorHex: "#f97316", // orange-500
      textColor: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      gradientBg: "from-orange-500/20 to-amber-500/20",
      iconType: "WALKIN",
    },
    {
      key: "CAMPAIGN",
      label: "Digital Campaigns & Web Portal",
      shortLabel: "Web Portal",
      description: "Official college website applications and landing pages",
      badgeText: "Official Portal",
      colorHex: "#8b5cf6", // violet-500
      textColor: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/30",
      gradientBg: "from-violet-500/20 to-indigo-500/20",
      iconType: "CAMPAIGN",
    },
    {
      key: "OTHER",
      label: "Direct Inbound Admissions",
      shortLabel: "Direct Inbound",
      description: "General admissions office inquiries and phone queries",
      badgeText: "Inbound Admissions",
      colorHex: "#94a3b8", // slate-400
      textColor: "text-slate-300",
      bgColor: "bg-slate-500/10",
      borderColor: "border-slate-500/30",
      gradientBg: "from-slate-500/20 to-slate-700/20",
      iconType: "OTHER",
    },
  ];

  const channels: LeadSourceChannelMeta[] = channelConfigs.map((cfg) => {
    const c = counts[cfg.key] || 0;
    return {
      ...cfg,
      count: c,
      percentage: getPct(c),
    };
  });

  const dominantSource = [...channels].sort((a, b) => b.count - a.count)[0] || channels[0];

  const socialCount =
    (counts.GOOGLE || 0) +
    (counts.META || 0) +
    (counts.WHATSAPP || 0) +
    (counts.SMS || 0) +
    (counts.EMAIL || 0) +
    (counts.CAMPAIGN || 0);

  return {
    totalLeads,
    channels,
    primaryHighlights: {
      expoCount: counts.EXPO || 0,
      csvCount: counts.CSV || 0,
      socialCount,
      counsellingCount: counts.COUNSELLING || 0,
      directCount: (counts.WALKIN || 0) + (counts.OTHER || 0),
    },
    dominantSource,
  };
}
