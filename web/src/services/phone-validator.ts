// Phone number validation - NO hallucination, regex + format only

export interface PhoneValidation {
  isValid: boolean;
  formatted?: string;
  country: string;
  reason?: string;
}

export function validateIraqiPhone(phone: string | undefined): PhoneValidation {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, country: "Iraq", reason: "empty" };
  }

  const cleaned = phone.replace(/\D/g, "");

  // Iraq: +964 (country code)
  // Formats: 9647XXXXXXXX, 0697XXXXXXXX, 00967XXXXXXXX, +9647XXXXXXXX

  // Remove +964 prefix if present
  let digits = cleaned;
  if (cleaned.startsWith("964")) {
    digits = cleaned.slice(3);
  } else if (cleaned.startsWith("00964")) {
    digits = cleaned.slice(5);
  }

  // Remove leading 0 if present (Iraqi format)
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Valid Iraqi numbers: 10-11 digits, starts with 7 or 9
  if (digits.length >= 10 && digits.length <= 11 && (digits[0] === "7" || digits[0] === "9")) {
    // Format as +964XXXXXXXXXX
    const formatted = `+964${digits.slice(-10)}`;
    return { isValid: true, formatted, country: "Iraq" };
  }

  return { isValid: false, country: "Iraq", reason: "invalid_format" };
}

export function getPhoneValidityScore(phone: string | undefined): number {
  if (!phone) return 0;
  const result = validateIraqiPhone(phone);
  return result.isValid ? 100 : 0;
}
