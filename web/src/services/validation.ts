// Iraqi phone number normalization
// Ported from 18-AGENTS/utils_phone.py

export const MOBILE_PREFIXES = ["077", "078", "079", "075", "076", "074", "073"];

export const LANDLINE_PREFIXES: Record<string, string> = {
  "01": "Baghdad",
  "02": "Basra",
  "03": "Mosul",
  "04": "Kirkuk",
  "05": "Erbil",
  "06": "Sulaymaniyah",
  "07": "Duhok",
  "08": "Najaf",
  "09": "Karbala",
  "10": "Diyala",
  "11": "Anbar",
  "12": "Wasit",
  "13": "Salahaddin",
  "14": "Babil",
  "15": "Muthanna",
  "16": "Qadisiyyah",
  "17": "Maysan",
  "18": "Dhi Qar",
};

export function normalizePhone(
  phone: string,
  _city: string = "",
  _governorate: string = ""
): string | null {
  if (!phone || typeof phone !== "string") return null;

  // Strip everything except digits and +
  let cleaned = phone.trim().replace(/[^\d+]/g, "");

  if (!cleaned || cleaned.length < 7) return null;

  // Remove leading + for uniform processing, we'll add it back
  const hadPlus = cleaned.startsWith("+");
  if (hadPlus) cleaned = cleaned.slice(1);

  // Now cleaned is digits only
  if (!/^\d+$/.test(cleaned)) return null;

  // 00964XXXXXXXXXX → strip 00
  if (cleaned.startsWith("00964")) {
    cleaned = cleaned.slice(2); // → 964XXXXXXXXXX
  }

  // 964XXXXXXXXXX → 10 digits after 964
  if (cleaned.startsWith("964")) {
    const rest = cleaned.slice(3);
    if (rest.length === 10) {
      return `+964${rest}`;
    }
    // Some numbers have extra leading 0: 9640XXXXXXXXXX
    if (rest.startsWith("0") && rest.length === 11) {
      return `+964${rest.slice(1)}`;
    }
    // Shorter landline: 964 + 8-9 digits
    if (rest.length >= 8 && rest.length <= 10) {
      return `+964${rest.padStart(10, "0")}`;
    }
  }

  // 0XXXXXXXXXX (local 11-digit format)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return `+964${cleaned.slice(1)}`;
  }

  // 0XXXXXXXXX (local 10-digit landline)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+964${cleaned.slice(1)}`;
  }

  // 7XXXXXXXXX (10 digits, mobile without leading 0)
  if (cleaned.startsWith("7") && cleaned.length === 10) {
    return `+964${cleaned}`;
  }

  // 75XXXXXXXX, 77XXXXXXXX, etc (10 digits mobile)
  if (/^7[34567890]\d{8}$/.test(cleaned)) {
    return `+964${cleaned}`;
  }

  // 9 digits — likely missing leading 0
  if (cleaned.length === 9 && /^[7456789]/.test(cleaned)) {
    return `+964${cleaned}`;
  }

  // 10 digits not starting with 0 or 9 — could be local with area code
  if (cleaned.length === 10 && /^\d/.test(cleaned)) {
    return `+964${cleaned}`;
  }

  // 8 digits — likely a landline without area prefix
  if (cleaned.length === 8 && /^[2-9]/.test(cleaned)) {
    return `+964${cleaned}`;
  }

  return null;
}

export function validatePhone(phone: string): boolean {
  if (!phone) return false;

  // Must start with +964 and be 14 characters total
  if (!phone.startsWith("+964")) return false;
  if (phone.length !== 14) return false;

  const digits = phone.slice(1);
  return /^\d+$/.test(digits);
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// URL validation
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Text cleaning utilities
export function cleanText(text: string): string {
  if (!text || typeof text !== "string") return "";

  return text
    .trim()
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    // Remove special characters that might cause issues
    .replace(/[<>\"]/g, "")
    // Normalize Arabic characters
    .replace(/[\u064A]/g, "\u0649") // Alef maksura
    .replace(/[\u0643]/g, "\u06A9"); // Persian kaf
}
