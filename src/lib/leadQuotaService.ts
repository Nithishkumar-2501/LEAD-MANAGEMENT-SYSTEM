/**
 * Lead Quota & Annual Platform Renewal Billing Service
 *
 * Business Rules:
 * - Free Lead Limit: 1,00,000 leads included in standard enterprise license.
 * - When limit (1,00,000) is reached, admin cannot add any leads directly.
 * - To add any lead beyond 1,00,000, each lead costs ₹500 INR.
 * - The ₹500 per extra lead is automatically accumulated and added to the
 *   Annual Payment Renewal of the application (Web CRM + Native Mobile App).
 */

export const MAX_FREE_LEAD_LIMIT = 100000; // 1,00,000 Leads
export const PRICE_PER_EXTRA_LEAD = 500; // ₹500 per lead beyond 1,00,000
export const BASE_ANNUAL_RENEWAL_FEE = 150000; // ₹1,50,000 Base SaaS renewal (Web + Mobile App)

export interface OverageLedgerItem {
  id: string;
  date: string;
  leadName: string;
  leadPhone?: string;
  count: number;
  costPerLead: number;
  totalCost: number;
  source: string;
  approvedBy: string;
  billedToRenewal: boolean;
}

export interface AnnualRenewalBillingRecord {
  institutionName: string;
  planName: string;
  platformCoverage: string;
  baseRenewalFee: number;
  maxFreeLeads: number;
  pricePerExtraLead: number;
  extraLeadsCount: number;
  extraLeadsCost: number;
  totalRenewalFee: number;
  renewalDueDate: string;
  licenseStatus: "ACTIVE" | "PENDING_RENEWAL" | "OVERAGE_ACCUMULATED";
  lastUpdated: string;
  simulatedLimitEnabled: boolean; // For testing the 1,00,000 threshold directly in UI
  simulatedLeadCount: number; // e.g. 100,000 for instant testing
  overageLedger: OverageLedgerItem[];
}

const STORAGE_KEY = "vsb_annual_renewal_billing";

export const DEFAULT_ANNUAL_RENEWAL: AnnualRenewalBillingRecord = {
  institutionName: "V.S.B. Educational Trust (Karur & Coimbatore)",
  planName: "Enterprise Institution Tier (Web Portal + Native Mobile Apps)",
  platformCoverage: "Web Application + Android & iOS Mobile CRM",
  baseRenewalFee: BASE_ANNUAL_RENEWAL_FEE,
  maxFreeLeads: MAX_FREE_LEAD_LIMIT,
  pricePerExtraLead: PRICE_PER_EXTRA_LEAD,
  extraLeadsCount: 0,
  extraLeadsCost: 0,
  totalRenewalFee: BASE_ANNUAL_RENEWAL_FEE,
  renewalDueDate: "2027-04-30",
  licenseStatus: "ACTIVE",
  lastUpdated: new Date().toISOString(),
  simulatedLimitEnabled: false,
  simulatedLeadCount: 100000,
  overageLedger: [],
};

/**
 * Retrieves the stored Annual Renewal Billing data
 */
export function getAnnualRenewalData(): AnnualRenewalBillingRecord {
  if (typeof window === "undefined") {
    return DEFAULT_ANNUAL_RENEWAL;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAnnualRenewalData(DEFAULT_ANNUAL_RENEWAL);
      return DEFAULT_ANNUAL_RENEWAL;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ANNUAL_RENEWAL,
      ...parsed,
      totalRenewalFee: (parsed.baseRenewalFee || BASE_ANNUAL_RENEWAL_FEE) + (parsed.extraLeadsCost || 0),
    };
  } catch (err) {
    console.warn("Notice reading annual renewal billing data:", err);
    return DEFAULT_ANNUAL_RENEWAL;
  }
}

/**
 * Persists updated Annual Renewal Billing data
 */
export function saveAnnualRenewalData(data: AnnualRenewalBillingRecord): void {
  if (typeof window === "undefined") return;
  try {
    const sanitized = {
      ...data,
      totalRenewalFee: data.baseRenewalFee + data.extraLeadsCost,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    // Trigger storage event for cross-component reactive updates
    window.dispatchEvent(new Event("vsb_annual_renewal_updated"));
  } catch (err) {
    console.warn("Notice saving annual renewal billing data:", err);
  }
}

/**
 * Computes effective lead count (accounting for optional simulated test mode)
 */
export function getEffectiveLeadCount(actualLeadCount: number): number {
  const billing = getAnnualRenewalData();
  if (billing.simulatedLimitEnabled) {
    return Math.max(actualLeadCount, billing.simulatedLeadCount);
  }
  return actualLeadCount;
}

export interface QuotaEvaluation {
  currentTotalLeads: number;
  maxLimit: number;
  remainingFreeQuota: number;
  percentUsed: number;
  isLimitReached: boolean;
  incomingCount: number;
  freeLeadsAllowedInBatch: number;
  overageLeadsCount: number;
  overageTotalCost: number;
  requiresOverageAuthorization: boolean;
  simulatedModeActive: boolean;
  annualBilling: AnnualRenewalBillingRecord;
}

/**
 * Evaluates whether adding incoming leads is permitted or requires ₹500/lead overage authorization
 */
export function evaluateLeadQuota(actualLeadCount: number, incomingCount: number = 1): QuotaEvaluation {
  const billing = getAnnualRenewalData();
  const currentTotal = getEffectiveLeadCount(actualLeadCount);
  const maxLimit = billing.maxFreeLeads || MAX_FREE_LEAD_LIMIT;

  const isLimitReached = currentTotal >= maxLimit;
  const remainingFreeQuota = Math.max(0, maxLimit - currentTotal);
  const percentUsed = Math.min(100, Number(((currentTotal / maxLimit) * 100).toFixed(1)));

  let freeLeadsAllowedInBatch = 0;
  let overageLeadsCount = 0;

  if (currentTotal + incomingCount <= maxLimit) {
    freeLeadsAllowedInBatch = incomingCount;
    overageLeadsCount = 0;
  } else {
    freeLeadsAllowedInBatch = remainingFreeQuota;
    overageLeadsCount = (currentTotal + incomingCount) - maxLimit;
  }

  const overageTotalCost = overageLeadsCount * (billing.pricePerExtraLead || PRICE_PER_EXTRA_LEAD);
  const requiresOverageAuthorization = overageLeadsCount > 0;

  return {
    currentTotalLeads: currentTotal,
    maxLimit,
    remainingFreeQuota,
    percentUsed,
    isLimitReached,
    incomingCount,
    freeLeadsAllowedInBatch,
    overageLeadsCount,
    overageTotalCost,
    requiresOverageAuthorization,
    simulatedModeActive: billing.simulatedLimitEnabled,
    annualBilling: billing,
  };
}

/**
 * Records an authorized overage lead addition and increments the Annual Payment Renewal balance
 */
export function recordOverageLeadsToAnnualRenewal(params: {
  leadName: string;
  leadPhone?: string;
  count: number;
  source?: string;
  approvedBy?: string;
}): AnnualRenewalBillingRecord {
  const current = getAnnualRenewalData();
  const count = Math.max(1, params.count);
  const cost = count * current.pricePerExtraLead;

  const newLedgerItem: OverageLedgerItem = {
    id: `ovr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString(),
    leadName: params.leadName,
    leadPhone: params.leadPhone,
    count,
    costPerLead: current.pricePerExtraLead,
    totalCost: cost,
    source: params.source || "Web / Mobile Lead Entry",
    approvedBy: params.approvedBy || "System Admin",
    billedToRenewal: true,
  };

  const updated: AnnualRenewalBillingRecord = {
    ...current,
    extraLeadsCount: current.extraLeadsCount + count,
    extraLeadsCost: current.extraLeadsCost + cost,
    totalRenewalFee: current.baseRenewalFee + (current.extraLeadsCost + cost),
    licenseStatus: "OVERAGE_ACCUMULATED",
    overageLedger: [newLedgerItem, ...current.overageLedger],
    lastUpdated: new Date().toISOString(),
  };

  saveAnnualRenewalData(updated);
  return updated;
}

/**
 * Toggles or updates the test simulation mode for easily testing the 1,00,000 threshold
 */
export function setSimulatedQuotaMode(enabled: boolean, simulatedCount: number = 100000): AnnualRenewalBillingRecord {
  const current = getAnnualRenewalData();
  const updated: AnnualRenewalBillingRecord = {
    ...current,
    simulatedLimitEnabled: enabled,
    simulatedLeadCount: simulatedCount,
  };
  saveAnnualRenewalData(updated);
  return updated;
}

/**
 * Resets overage billing back to default base fee
 */
export function resetOverageLedger(): AnnualRenewalBillingRecord {
  const current = getAnnualRenewalData();
  const updated: AnnualRenewalBillingRecord = {
    ...current,
    extraLeadsCount: 0,
    extraLeadsCost: 0,
    totalRenewalFee: current.baseRenewalFee,
    licenseStatus: "ACTIVE",
    overageLedger: [],
  };
  saveAnnualRenewalData(updated);
  return updated;
}
