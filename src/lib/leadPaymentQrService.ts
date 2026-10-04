/**
 * SPHEREX CRM - Student Lead QR Payment & Creator Revenue Service
 * 
 * Flow:
 * 1. Admin or Teacher fills candidate details.
 * 2. Before submitting to Firebase, opens the Payment QR Code modal.
 * 3. Shows the Creator's custom uploaded QR code or generated UPI QR code.
 * 4. User scans and pays the fee (default: ₹500/lead).
 * 5. Lead is saved and synchronized with Firebase Firestore & Realtime Database.
 * 6. The payment is recorded and calculated in the Creator Control page (spherexnithish#).
 * 7. The Owner/Creator can upload/change their payment QR code image at any time.
 */

export interface CreatorQrSettings {
  qrCodeImageUrl: string; // Uploaded Base64 image or hosted URL
  upiId: string; // e.g. "spherexnithish@okaxis"
  payeeName: string; // "Nithish Kumar (SPHEREX Creator)"
  leadPriceAmount: number; // ₹500 default
  isPaymentRequired: boolean; // Enforce QR payment on lead creation
  merchantNote: string;
  lastUpdated: string;
}

export interface LeadQrPaymentRecord {
  id: string;
  leadId?: string;
  leadName: string;
  leadPhone: string;
  courseInterest: string;
  campus: string;
  amount: number;
  utrRef: string;
  submittedBy: string; // Admin or Teacher ID
  timestamp: string;
  status: "VERIFIED" | "COMPLETED";
}

const SETTINGS_KEY = "spherex_creator_qr_settings";
const PAYMENTS_KEY = "spherex_lead_qr_payments_ledger";
export const QR_SETTINGS_EVENT = "spherex_qr_settings_updated";
export const QR_PAYMENT_EVENT = "spherex_qr_payment_recorded";

// Default Creator UPI QR URL
const DEFAULT_UPI_ID = "spherexnithish@okaxis";
const DEFAULT_PAYEE = "Nithish Kumar (SPHEREX Creator)";
const DEFAULT_FEE = 500;

function buildDefaultQrUrl(upi: string, name: string, amount: number): string {
  const upiPayload = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent("SPHEREX Student Lead Registration")}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiPayload)}&margin=12&format=png`;
}

export const DEFAULT_CREATOR_QR_SETTINGS: CreatorQrSettings = {
  qrCodeImageUrl: buildDefaultQrUrl(DEFAULT_UPI_ID, DEFAULT_PAYEE, DEFAULT_FEE),
  upiId: DEFAULT_UPI_ID,
  payeeName: DEFAULT_PAYEE,
  leadPriceAmount: DEFAULT_FEE,
  isPaymentRequired: true,
  merchantNote: "SPHEREX Student Admission Lead Registration Fee",
  lastUpdated: new Date().toISOString(),
};

/**
 * Get Creator QR Settings from localStorage
 */
export function getCreatorQrSettings(): CreatorQrSettings {
  if (typeof window === "undefined") return DEFAULT_CREATOR_QR_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_CREATOR_QR_SETTINGS));
      return DEFAULT_CREATOR_QR_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CREATOR_QR_SETTINGS,
      ...parsed,
      leadPriceAmount: Number(parsed.leadPriceAmount) || DEFAULT_FEE,
      isPaymentRequired: parsed.isPaymentRequired !== undefined ? Boolean(parsed.isPaymentRequired) : true,
    };
  } catch (err) {
    console.warn("Failed to load Creator QR settings:", err);
    return DEFAULT_CREATOR_QR_SETTINGS;
  }
}

/**
 * Save Creator QR Settings & notify active listeners
 */
export function saveCreatorQrSettings(settings: Partial<CreatorQrSettings>): CreatorQrSettings {
  const current = getCreatorQrSettings();
  const updated: CreatorQrSettings = {
    ...current,
    ...settings,
    lastUpdated: new Date().toISOString(),
  };

  // If upiId or leadPriceAmount changed and no custom uploaded image is provided, regenerate default QR URL
  if (
    (!settings.qrCodeImageUrl || settings.qrCodeImageUrl.includes("api.qrserver.com")) &&
    (settings.upiId || settings.leadPriceAmount || settings.payeeName)
  ) {
    updated.qrCodeImageUrl = buildDefaultQrUrl(
      updated.upiId,
      updated.payeeName,
      updated.leadPriceAmount
    );
  }

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(QR_SETTINGS_EVENT, { detail: updated }));
    }
  } catch (err) {
    console.warn("Failed to save Creator QR settings:", err);
  }

  return updated;
}

/**
 * Get all recorded QR lead payments
 */
export function getAllLeadQrPayments(): LeadQrPaymentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to load Lead QR payments ledger:", err);
    return [];
  }
}

/**
 * Record a new Lead QR payment into the Creator's ledger
 */
export function recordLeadQrPayment(payment: Omit<LeadQrPaymentRecord, "id" | "timestamp" | "status">): LeadQrPaymentRecord {
  const all = getAllLeadQrPayments();
  const record: LeadQrPaymentRecord = {
    ...payment,
    id: `qr_pay_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    status: "VERIFIED",
  };

  const updated = [record, ...all];
  try {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(updated));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(QR_PAYMENT_EVENT, { detail: record }));
    }
  } catch (err) {
    console.warn("Failed to record Lead QR payment:", err);
  }

  return record;
}

/**
 * Calculate total QR lead revenue summary
 */
export function calculateLeadQrRevenueMetrics(): {
  totalRevenue: number;
  totalTransactionsCount: number;
  karurRevenue: number;
  coimbatoreRevenue: number;
  recentPayments: LeadQrPaymentRecord[];
} {
  const payments = getAllLeadQrPayments();
  let totalRevenue = 0;
  let karurRevenue = 0;
  let coimbatoreRevenue = 0;

  payments.forEach((p) => {
    totalRevenue += p.amount || 0;
    if (p.campus === "KARUR") {
      karurRevenue += p.amount || 0;
    } else if (p.campus === "COIMBATORE") {
      coimbatoreRevenue += p.amount || 0;
    }
  });

  return {
    totalRevenue,
    totalTransactionsCount: payments.length,
    karurRevenue,
    coimbatoreRevenue,
    recentPayments: payments.slice(0, 50),
  };
}
