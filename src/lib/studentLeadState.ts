/**
 * Standardized Student Lead State Helper
 * 
 * Rules:
 * - HOT: If the student is admitted (status === "ADMITTED", stage === "FEE_PAID", or interest === "ADMITTED")
 * - WARM: If the student lead is ready to be admitted (status === "NEW" | "CONTACTED" | "IN_REVIEW", stages, or interest === "INTERESTED")
 * - COLD: If the student lead is not interested to be admitted (status === "REJECTED" | "NOT_INTERESTED" | "CLOSED" | "LOST", or interest === "NOT_INTERESTED")
 */

import { Lead, Application, LeadStatus, AppStage } from "@/types/crm";

export type StudentLeadStateType = "HOT" | "WARM" | "COLD";

export interface StudentLeadStateResult {
  state: StudentLeadStateType;
  label: "HOT" | "WARM" | "COLD";
  displayWithIcon: string;
  detailedLabel: string;
  subText: string;
  badgeClass: string;
  badgeStyleLight: string;
  dotColor: string;
  iconType: "flame" | "zap" | "snowflake";
}

export function getStudentLeadState(
  leadOrStatus?:
    | Lead
    | (Lead & { application?: Application | null })
    | {
        status?: string;
        stage?: string;
        studentInterestStatus?: string;
        priorityTier?: "HOT" | "WARM" | "COLD";
        application?: { stage?: string } | null;
      }
    | string
    | null
): StudentLeadStateResult {
  if (!leadOrStatus) {
    return {
      state: "WARM",
      label: "WARM",
      displayWithIcon: "⚡ WARM",
      detailedLabel: "⚡ WARM (Ready to Admit)",
      subText: "Ready to Admit",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/40",
      badgeStyleLight: "bg-amber-50 text-amber-700 border-amber-200",
      dotColor: "bg-amber-400",
      iconType: "zap",
    };
  }

  let statusStr = "";
  let stageStr = "";
  let interestStr = "";
  let explicitTier: string | undefined = undefined;

  if (typeof leadOrStatus === "string") {
    statusStr = leadOrStatus;
  } else {
    statusStr = leadOrStatus.status || "";
    stageStr = (leadOrStatus as any).stage || leadOrStatus.application?.stage || "";
    interestStr = (leadOrStatus as any).studentInterestStatus || "";
    explicitTier = leadOrStatus.priorityTier;
  }

  const sUpper = statusStr.toUpperCase().trim();
  const stgUpper = stageStr.toUpperCase().trim();
  const intUpper = interestStr.toUpperCase().trim();

  // 1. HOT (Admitted student)
  if (
    sUpper === "ADMITTED" ||
    stgUpper === "FEE_PAID" ||
    stgUpper.includes("ADMIT") ||
    intUpper === "ADMITTED" ||
    explicitTier === "HOT" && (sUpper === "ADMITTED" || stgUpper === "FEE_PAID")
  ) {
    return {
      state: "HOT",
      label: "HOT",
      displayWithIcon: "🔥 HOT",
      detailedLabel: "🔥 HOT (Admitted)",
      subText: "Admitted",
      badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      badgeStyleLight: "bg-rose-50 text-rose-700 border-rose-200",
      dotColor: "bg-rose-500",
      iconType: "flame",
    };
  }

  // 2. COLD (Not interested / Rejected student)
  if (
    sUpper === "REJECTED" ||
    sUpper === "NOT_INTERESTED" ||
    sUpper === "CLOSED" ||
    sUpper === "DROPPED" ||
    sUpper === "LOST" ||
    intUpper === "NOT_INTERESTED" ||
    intUpper === "NO_ANSWER" ||
    explicitTier === "COLD"
  ) {
    return {
      state: "COLD",
      label: "COLD",
      displayWithIcon: "❄️ COLD",
      detailedLabel: "❄️ COLD (Not Interested)",
      subText: "Not Interested",
      badgeClass: "bg-sky-500/20 text-sky-300 border-sky-400/40",
      badgeStyleLight: "bg-sky-50 text-sky-700 border-sky-200",
      dotColor: "bg-sky-400",
      iconType: "snowflake",
    };
  }

  // 3. WARM (Ready to be admitted: New, Contacted, In Review, Inquiry, Submitted, Docs Verified, Offer Issued)
  return {
    state: "WARM",
    label: "WARM",
    displayWithIcon: "⚡ WARM",
    detailedLabel: "⚡ WARM (Ready to Admit)",
    subText: "Ready to Admit",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    badgeStyleLight: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-400",
    iconType: "zap",
  };
}
