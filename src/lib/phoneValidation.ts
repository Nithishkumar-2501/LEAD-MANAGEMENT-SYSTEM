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
  }
  return digits;
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
    return "Mobile number is required.";
  }

  const rawDigits = extractRaw10Digits(phone);

  if (rawDigits.length !== 10) {
    return `Mobile number must be exactly 10 digits. Provided: ${rawDigits.length} digits (${phone}).`;
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
      return `Mobile number (${rawDigits}) already belongs to lead "${duplicate.name}". Duplicate numbers are rejected.`;
    }
  }

  return null;
}
