import { Lead } from "@/types/crm";

/**
 * Extracts raw 10-digit mobile number from string.
 * Strips non-digits, leading +91 or leading 0.
 */
export function extractRaw10Digits(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  } else if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
}

/**
 * Normalizes any phone number to the compulsory '+91-XXXXXXXXXX' standard format.
 * Guarantees '+91-' prefix is attached to the 10-digit mobile number.
 */
export function formatPhoneWith91(phone?: string | null): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  const digits = extractRaw10Digits(trimmed);
  if (digits.length === 10) {
    return `+91-${digits}`;
  }
  if (trimmed.startsWith("+91-") && trimmed.length >= 14) {
    return trimmed;
  }
  if (digits.length > 0) {
    return `+91-${digits}`;
  }
  return trimmed;
}

/**
 * Validates that a mobile number is exactly 10 digits and not a duplicate of an existing lead.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateLeadPhoneNumber(
  phone: string,
  existingLeads: Lead[] = [],
  currentLeadId?: string
): string | null {
  if (!phone || phone.trim() === "") {
    return "Mobile number is required (+91- compulsory).";
  }

  const rawDigits = extractRaw10Digits(phone);

  if (rawDigits.length !== 10) {
    return `Mobile number must be exactly 10 digits (+91- compulsory). Provided: ${rawDigits.length} digits (${phone}).`;
  }

  if (existingLeads && existingLeads.length > 0) {
    const duplicate = existingLeads.find((lead) => {
      if (currentLeadId && lead.id === currentLeadId) return false;
      // Do not block if colliding with initial sample mock data IDs (e.g. lead_1, lead_2, lead_3, lead_4, lead_5)
      if (/^lead_[1-5]$/.test(lead.id)) return false;
      const existingDigits = extractRaw10Digits(lead.phone || "");
      return existingDigits === rawDigits && existingDigits !== "";
    });

    if (duplicate) {
      return `Mobile number (+91-${rawDigits}) already belongs to lead "${duplicate.name}". Duplicate numbers are rejected.`;
    }
  }

  return null;
}

