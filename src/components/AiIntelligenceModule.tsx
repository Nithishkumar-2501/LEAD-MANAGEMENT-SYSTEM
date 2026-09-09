"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  Brain,
  Cpu,
  Target,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Sliders,
  Send,
  MessageSquare,
  FileCheck,
  Award,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  User,
  GraduationCap,
  Building,
  Flame,
  Zap,
  Snowflake,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Lead, Application, CampusLocation, VSB_DEPARTMENTS_COURSES } from "@/types/crm";
import {
  predictStudentConversion,
  calculateTneaCutoff,
  StudentPredictionInput,
} from "@/lib/ai/leadScoringEngine";
import { askVirtualCounselor, generateOutreachPitch } from "@/lib/ai/counselorKnowledge";
import modelData from "@/lib/ai/leadPredictorModel.json";

interface AiIntelligenceModuleProps {
  applicants: (Lead & { application: Application })[];
  selectedCampus: CampusLocation;
  onSelectApplicant?: (applicant: Lead & { application: Application }) => void;
}

export default function AiIntelligenceModule({
  applicants,
  selectedCampus,
  onSelectApplicant,
}: AiIntelligenceModuleProps) {
  const [activeTab, setActiveTab] = useState<"PREDICTOR" | "SIMULATOR" | "COUNSELOR" | "METRICS">(
    "PREDICTOR"
  );

  // Search & Filter for predictor
  const [searchFilter, setSearchFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "HOT" | "WARM" | "COLD">("ALL");

  // What-If Simulator state
  const [simMaths, setSimMaths] = useState<number>(85);
  const [simPhysics, setSimPhysics] = useState<number>(82);
  const [simChemistry, setSimChemistry] = useState<number>(78);
  const [simCommunity, setSimCommunity] = useState<string>("BC");
  const [simDistrict, setSimDistrict] = useState<string>("Karur");
  const [simBoard, setSimBoard] = useState<string>("State Board");
  const [simSource, setSimSource] = useState<string>("TNEA Counselling");
  const [simFollowups, setSimFollowups] = useState<number>(2);
  const [simCampus, setSimCampus] = useState<"KARUR" | "COIMBATORE">("KARUR");
  const [simCourse, setSimCourse] = useState<string>("B.E Computer Science and Engineering");

  // Virtual counselor state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { sender: "USER" | "AI"; text: string; source?: string; time: string }[]
  >([
    {
      sender: "AI",
      text: "Hello! I am NORA, your AI Admission Counselor for V.S.B. Engineering College (Karur VSB-612 & Coimbatore VSB-714). How can I assist you with TNEA cutoffs, seat bookings, fee structures, or placements today?",
      source: "NORA Knowledge Base",
      time: "Just now",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Pitch generator state
  const [pitchChannel, setPitchChannel] = useState<"WHATSAPP" | "EMAIL" | "CALL">("WHATSAPP");
  const [pitchStudentName, setPitchStudentName] = useState("Karthik R");
  const [pitchCutoff, setPitchCutoff] = useState<number>(172.5);
  const [pitchCourse, setPitchCourse] = useState("B.Tech Artificial Intelligence and Data Science");
  const [pitchResult, setPitchResult] = useState("");
  const [copiedPitch, setCopiedPitch] = useState(false);

  // Filtered applicants by campus
  const campusApplicants = useMemo(() => {
    return applicants.filter((a) => {
      if (selectedCampus !== "ALL" && a.campus !== selectedCampus) return false;
      return true;
    });
  }, [applicants, selectedCampus]);

  // Compute AI score for all leads
  const scoredApplicants = useMemo(() => {
    return campusApplicants.map((app) => {
      const pred = predictStudentConversion({
        tneaCutoff: app.tneaCutoff || (app.application ? app.application.marks12th * 2 : 160),
        community: app.community || "BC",
        district: app.district || "Karur",
        source: app.source || "TNEA Counselling",
        counselorFollowups: 2,
        courseInterest: app.courseInterest,
      });
      return {
        ...app,
        aiScore: pred.conversionProbability,
        priorityTier: pred.priorityTier,
        cutoff: pred.tneaCutoff,
        recommendedBranches: pred.recommendedBranches,
        action: pred.counselorActionRecommendation,
      };
    });
  }, [campusApplicants]);

  const filteredScoredApplicants = useMemo(() => {
    return scoredApplicants.filter((app) => {
      if (priorityFilter !== "ALL" && app.priorityTier !== priorityFilter) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          app.name.toLowerCase().includes(q) ||
          app.courseInterest.toLowerCase().includes(q) ||
          (app.district && app.district.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [scoredApplicants, priorityFilter, searchFilter]);

  // Summary counts
  const hotCount = scoredApplicants.filter((a) => a.priorityTier === "HOT").length;
  const warmCount = scoredApplicants.filter((a) => a.priorityTier === "WARM").length;
  const coldCount = scoredApplicants.filter((a) => a.priorityTier === "COLD").length;
  const avgProbability = scoredApplicants.length
    ? Math.round(
        scoredApplicants.reduce((acc, curr) => acc + curr.aiScore, 0) / scoredApplicants.length
      )
    : 72;

  // Simulator prediction
  const simulatorPrediction = useMemo(() => {
    const cutoff = calculateTneaCutoff(simMaths, simPhysics, simChemistry);
    return predictStudentConversion({
      mathsMarks: simMaths,
      physicsMarks: simPhysics,
      chemistryMarks: simChemistry,
      tneaCutoff: cutoff,
      community: simCommunity,
      district: simDistrict,
      board: simBoard,
      source: simSource,
      counselorFollowups: simFollowups,
      campusPreference: simCampus,
      courseInterest: simCourse,
    });
  }, [
    simMaths,
    simPhysics,
    simChemistry,
    simCommunity,
    simDistrict,
    simBoard,
    simSource,
    simFollowups,
    simCampus,
    simCourse,
  ]);

  // Handle Counselor Chat Send
  const handleSendChat = (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const userMsg = {
      sender: "USER" as const,
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      const resp = askVirtualCounselor(query, {
        cutoff: simMaths ? (simMaths + (simPhysics + simChemistry) / 2) : 168,
        community: simCommunity,
        course: simCourse,
        district: simDistrict,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI" as const,
          text: resp.answer,
          source: resp.source,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsTyping(false);
    }, 450);
  };

  // Handle Pitch Generation
  const handleGeneratePitch = () => {
    const pitch = generateOutreachPitch(pitchChannel, {
      name: pitchStudentName,
      cutoff: pitchCutoff,
      course: pitchCourse,
      campus: selectedCampus === "COIMBATORE" ? "COIMBATORE" : "KARUR",
    });
    setPitchResult(pitch);
    setCopiedPitch(false);
  };

  const handleCopyPitch = () => {
    if (pitchResult) {
      navigator.clipboard.writeText(pitchResult);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-8 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-black tracking-wide uppercase">
              <img src="/nora-logo.png" alt="NORA AI" className="w-4 h-4 rounded-full object-cover shrink-0" />
              NORA Machine Learning & Generative AI Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <img src="/nora-logo.png" alt="NORA AI" className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40 shadow-md" />
              NORA AI Intelligence Studio
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              Real-time student conversion probability, What-If admission simulator, automated
              marksheet OCR, and virtual admission counseling powered by NORA for V.S.B. Karur (VSB-612) &
              Coimbatore (VSB-714).
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 shrink-0 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-3.5 rounded-xl">
            <div className="p-3 bg-indigo-600/30 border border-indigo-400/30 rounded-lg text-indigo-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Model ROC-AUC
              </div>
              <div className="text-xl font-black text-emerald-400">0.924 (92.4%)</div>
              <div className="text-[11px] text-slate-400">NORA Ensemble v2.1</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab("PREDICTOR")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "PREDICTOR"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/50"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/40"
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            NORA Lead Predictor ({scoredApplicants.length})
          </button>

          <button
            onClick={() => setActiveTab("SIMULATOR")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "SIMULATOR"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/50"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/40"
            }`}
          >
            <Sliders className="w-4 h-4 text-sky-400" />
            What-If Admission Simulator
          </button>

          <button
            onClick={() => setActiveTab("COUNSELOR")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "COUNSELOR"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/50"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/40"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            AI Virtual Counselor & Outreach
          </button>

          <button
            onClick={() => setActiveTab("METRICS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "METRICS"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/50"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/40"
            }`}
          >
            <BarChart2 className="w-4 h-4 text-purple-400" />
            Model Architecture & Evaluation
          </button>
        </div>
      </div>

      {/* TAB 1: LEAD CONVERSION PREDICTOR */}
      {activeTab === "PREDICTOR" && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Avg Conversion Rate</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {avgProbability}%
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Across active TNEA inquiries</p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                <Target className="w-6 h-6" />
              </div>
            </div>

            <div
              onClick={() => setPriorityFilter("HOT")}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 border cursor-pointer transition-all ${
                priorityFilter === "HOT"
                  ? "border-rose-500 ring-2 ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-rose-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-500 uppercase flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" /> Hot Leads (≥72%)
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {hotCount}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">High probability of enrollment</p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
                  <Flame className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div
              onClick={() => setPriorityFilter("WARM")}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 border cursor-pointer transition-all ${
                priorityFilter === "WARM"
                  ? "border-amber-500 ring-2 ring-amber-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-amber-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Warm Leads (45-71%)
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {warmCount}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Need parent engagement/hostel pitch</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div
              onClick={() => setPriorityFilter("COLD")}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 border cursor-pointer transition-all ${
                priorityFilter === "COLD"
                  ? "border-sky-500 ring-2 ring-sky-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-sky-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-sky-500 uppercase flex items-center gap-1">
                    <Snowflake className="w-3.5 h-3.5 text-sky-500" /> Cold Leads (&lt;45%)
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {coldCount}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Borderline cutoffs / distant</p>
                </div>
                <div className="p-3 bg-sky-50 dark:bg-sky-950/50 text-sky-600 rounded-xl">
                  <Snowflake className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scored candidate, branch or district..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setPriorityFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  priorityFilter === "ALL"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                All ({scoredApplicants.length})
              </button>
              <button
                onClick={() => setPriorityFilter("HOT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  priorityFilter === "HOT"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                🔥 Hot Only ({hotCount})
              </button>
              <button
                onClick={() => setPriorityFilter("WARM")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  priorityFilter === "WARM"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                ⚡ Warm Only ({warmCount})
              </button>
              <button
                onClick={() => setPriorityFilter("COLD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  priorityFilter === "COLD"
                    ? "bg-sky-600 text-white"
                    : "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                }`}
              >
                ❄️ Cold Only ({coldCount})
              </button>
            </div>
          </div>

          {/* Scored Applicants Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5">Candidate Details</th>
                    <th className="px-4 py-3.5">Program & Campus</th>
                    <th className="px-4 py-3.5 text-center">TNEA Cutoff</th>
                    <th className="px-4 py-3.5 text-center">AI Conversion Probability</th>
                    <th className="px-4 py-3.5">Priority Tier</th>
                    <th className="px-4 py-3.5">AI Recommended Action</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {filteredScoredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No candidates match the selected priority filter.
                      </td>
                    </tr>
                  ) : (
                    filteredScoredApplicants.map((lead) => {
                      const tierColor =
                        lead.priorityTier === "HOT"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                          : lead.priorityTier === "WARM"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                          : "bg-sky-500/10 text-sky-600 border-sky-500/30";

                      const barColor =
                        lead.priorityTier === "HOT"
                          ? "bg-rose-500"
                          : lead.priorityTier === "WARM"
                          ? "bg-amber-500"
                          : "bg-sky-500";

                      return (
                        <tr
                          key={lead.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-extrabold text-slate-900 dark:text-white">
                              {lead.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {lead.phone} • {lead.district || "Karur"} ({lead.community || "BC"})
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                              {lead.courseInterest}
                            </div>
                            <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {lead.campus} Campus
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center font-black text-slate-900 dark:text-white">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {lead.cutoff}/200
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-black text-sm text-slate-900 dark:text-white">
                                {lead.aiScore}%
                              </span>
                              <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${barColor}`}
                                  style={{ width: `${lead.aiScore}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${tierColor}`}
                            >
                              {lead.priorityTier === "HOT" && <Flame className="w-3 h-3" />}
                              {lead.priorityTier === "WARM" && <Zap className="w-3 h-3" />}
                              {lead.priorityTier === "COLD" && <Snowflake className="w-3 h-3" />}
                              {lead.priorityTier}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {lead.action}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => onSelectApplicant && onSelectApplicant(lead)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-colors shadow-sm"
                            >
                              Open Dossier
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHAT-IF ADMISSION SIMULATOR */}
      {activeTab === "SIMULATOR" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-500" />
                Admission Parameter Simulator
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Adjust candidate parameters in real-time to compute the official TNEA Cutoff (out of
                200) and test the Random Forest admission conversion likelihood.
              </p>
            </div>

            {/* Marks Sliders */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Mathematics (100)</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                    {simMaths} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="100"
                  value={simMaths}
                  onChange={(e) => setSimMaths(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Physics (100)</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                    {simPhysics} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="100"
                  value={simPhysics}
                  onChange={(e) => setSimPhysics(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Chemistry (100)</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                    {simChemistry} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="100"
                  value={simChemistry}
                  onChange={(e) => setSimChemistry(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Community, Board, District */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Community</label>
                <select
                  value={simCommunity}
                  onChange={(e) => setSimCommunity(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="OC">OC (General)</option>
                  <option value="BC">BC (Backward)</option>
                  <option value="BCM">BCM (Muslim)</option>
                  <option value="MBC">MBC / DNC</option>
                  <option value="SC">SC</option>
                  <option value="SCA">SCA</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">School Board</label>
                <select
                  value={simBoard}
                  onChange={(e) => setSimBoard(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="State Board">TN State Board</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE / Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">District</label>
                <select
                  value={simDistrict}
                  onChange={(e) => setSimDistrict(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Karur">Karur (Local Tier-1)</option>
                  <option value="Coimbatore">Coimbatore (Tier-1)</option>
                  <option value="Tirupur">Tirupur (Tier-1)</option>
                  <option value="Erode">Erode (Tier-1)</option>
                  <option value="Namakkal">Namakkal (Tier-1)</option>
                  <option value="Dindigul">Dindigul (Tier-1)</option>
                  <option value="Salem">Salem (Tier-2)</option>
                  <option value="Tiruchirappalli">Trichy (Tier-2)</option>
                  <option value="Madurai">Madurai (Tier-2)</option>
                  <option value="Chennai">Chennai (Tier-3)</option>
                </select>
              </div>
            </div>

            {/* Source, Followups & Program */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Lead Source</label>
                <select
                  value={simSource}
                  onChange={(e) => setSimSource(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Walkin">Direct Walk-in (95%)</option>
                  <option value="TNEA Counselling">TNEA Counselling (90%)</option>
                  <option value="School Expo">School Career Expo (80%)</option>
                  <option value="WhatsApp Campaign">WhatsApp Outreach (75%)</option>
                  <option value="Google Ads">Google Search Ads (60%)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Counselor Follow-ups ({simFollowups})
                </label>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={simFollowups}
                  onChange={(e) => setSimFollowups(Number(e.target.value))}
                  className="w-full mt-3 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Target Program</label>
              <select
                value={simCourse}
                onChange={(e) => setSimCourse(e.target.value)}
                className="w-full mt-1 p-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              >
                {VSB_DEPARTMENTS_COURSES.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time AI Output Panel */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl border border-indigo-700/50 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  Real-time Simulation Output
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                    simulatorPrediction.priorityTier === "HOT"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : simulatorPrediction.priorityTier === "WARM"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-sky-500/20 text-sky-300 border-sky-500/40"
                  }`}
                >
                  {simulatorPrediction.priorityTier} PRIORITY
                </span>
              </div>

              {/* Big Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="text-xs text-indigo-200 font-bold uppercase">TNEA Cutoff Score</div>
                  <div className="text-3xl font-black text-white mt-1">
                    {simulatorPrediction.tneaCutoff}
                    <span className="text-sm font-semibold text-indigo-300"> / 200</span>
                  </div>
                  <div className="text-[11px] text-indigo-200 mt-1">
                    M: {simMaths} + (P: {simPhysics} + C: {simChemistry})/2
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="text-xs text-indigo-200 font-bold uppercase">Admission Likelihood</div>
                  <div className="text-3xl font-black text-emerald-400 mt-1">
                    {simulatorPrediction.conversionProbability}%
                  </div>
                  <div className="text-[11px] text-indigo-200 mt-1">
                    Model Confidence: 92.4% ROC-AUC
                  </div>
                </div>
              </div>

              {/* Counselor Action */}
              <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-200">
                <span className="font-extrabold text-white">Recommended Strategy: </span>
                {simulatorPrediction.counselorActionRecommendation}
              </div>
            </div>

            {/* Top Branch Recommendations */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Top Branch Allotment Matches at V.S.B.
              </h3>

              <div className="space-y-2">
                {simulatorPrediction.recommendedBranches.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {item.branch}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.reason}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-1 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {item.matchScore}% Match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI VIRTUAL COUNSELOR & OUTREACH */}
      {activeTab === "COUNSELOR" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat Window */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[560px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    NORA Virtual Admission Counselor Assistant
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    NORA Active • TNEA 2026 Counseling Trained
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === "USER" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "USER"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700 whitespace-pre-line"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 p-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] ml-1">AI Counselor is thinking...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto text-[11px]">
              <button
                onClick={() => handleSendChat("What is the cutoff required for B.E CSE in Karur campus?")}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 shrink-0"
              >
                🎓 Cutoff for CSE?
              </button>
              <button
                onClick={() => handleSendChat("What are the hostel facilities and fee structure?")}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 shrink-0"
              >
                🏠 Hostel & Fee Details?
              </button>
              <button
                onClick={() => handleSendChat("Tell me about the 2025 placement records and top companies.")}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 shrink-0"
              >
                💼 Placement Records?
              </button>
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Ask about admissions, cutoffs, Anna University norms, or fees..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleSendChat()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>

          {/* 1-Click Counselor Outreach Pitch Generator */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  1-Click Counselor Outreach Pitch Generator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate customized, high-converting WhatsApp pitches, email letters, or tele-calling
                  scripts for any candidate in seconds.
                </p>
              </div>

              {/* Channel Toggle */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPitchChannel("WHATSAPP")}
                  className={`py-2 rounded-lg text-xs font-black transition-all ${
                    pitchChannel === "WHATSAPP"
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setPitchChannel("EMAIL")}
                  className={`py-2 rounded-lg text-xs font-black transition-all ${
                    pitchChannel === "EMAIL"
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Email Letter
                </button>
                <button
                  onClick={() => setPitchChannel("CALL")}
                  className={`py-2 rounded-lg text-xs font-black transition-all ${
                    pitchChannel === "CALL"
                      ? "bg-purple-600 text-white shadow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Calling Script
                </button>
              </div>

              {/* Candidate Info Input */}
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    value={pitchStudentName}
                    onChange={(e) => setPitchStudentName(e.target.value)}
                    className="w-full mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      Cutoff Score
                    </label>
                    <input
                      type="number"
                      value={pitchCutoff}
                      onChange={(e) => setPitchCutoff(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      Interested Course
                    </label>
                    <input
                      type="text"
                      value={pitchCourse}
                      onChange={(e) => setPitchCourse(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold truncate"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGeneratePitch}
                  className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate {pitchChannel} Pitch
                </button>
              </div>

              {/* Generated Result Box */}
              {pitchResult && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">
                      Ready to Send
                    </span>
                    <button
                      onClick={handleCopyPitch}
                      className="text-xs font-bold flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                    >
                      {copiedPitch ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedPitch ? "Copied!" : "Copy Text"}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto leading-relaxed">
                    {pitchResult}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MODEL ARCHITECTURE & EVALUATION METRICS */}
      {activeTab === "METRICS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase">Model Accuracy</div>
              <div className="text-3xl font-black text-emerald-500 mt-1">
                {modelData.metrics.accuracy}%
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Tested on 1,000 holdout candidates</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase">ROC-AUC Score</div>
              <div className="text-3xl font-black text-indigo-500 mt-1">
                {modelData.metrics.roc_auc}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Area Under Receiver Operating Curve</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase">Precision & Recall</div>
              <div className="text-3xl font-black text-sky-500 mt-1">
                {modelData.metrics.precision}% / {modelData.metrics.recall}%
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Harmonic Mean F1-Score: {modelData.metrics.f1_score}%</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase">Training Dataset</div>
              <div className="text-3xl font-black text-purple-500 mt-1">
                {modelData.total_samples.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">TNEA Engineering Candidate Profiles</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Feature Importance Bars */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-500" />
                  Random Forest Feature Importance Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Relative weight contributed by each feature to the final admission prediction.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {modelData.feature_importances.map((feat) => (
                  <div key={feat.rank} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>
                        #{feat.rank}. {feat.feature}
                      </span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                        {(feat.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${feat.importance * 100 * 2.2}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confusion Matrix & Architecture */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  Evaluation Confusion Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-1">1,000 Test Set Predictions vs Actual Ground Truth</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                    True Positives (TP)
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {modelData.metrics.confusion_matrix.tp}
                  </div>
                  <div className="text-[10px] text-emerald-600/80">Correctly Predicted Admitted</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    False Positives (FP)
                  </div>
                  <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
                    {modelData.metrics.confusion_matrix.fp}
                  </div>
                  <div className="text-[10px] text-slate-400">Type I Error</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    False Negatives (FN)
                  </div>
                  <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
                    {modelData.metrics.confusion_matrix.fn}
                  </div>
                  <div className="text-[10px] text-slate-400">Type II Error</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                    True Negatives (TN)
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {modelData.metrics.confusion_matrix.tn}
                  </div>
                  <div className="text-[10px] text-emerald-600/80">Correctly Predicted Non-admitted</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white">
                  Python ML Pipeline Command:
                </div>
                <code className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 block bg-slate-200 dark:bg-slate-900 p-1.5 rounded">
                  python scripts/train_lead_predictor.py
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
