import type { Patient } from "@/types/patient.types";

/** Indian mobile: 10 digits, starts with 6, 7, 8, or 9 */
export const INDIAN_MOBILE_LENGTH = 10;

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const sanitizeIndianPhoneInput = (value: string): string => {
  let digits = value.replace(/\D/g, "");

  if (digits.length > INDIAN_MOBILE_LENGTH) {
    if (digits.startsWith("91") && digits.length >= 12) {
      digits = digits.slice(2, 12);
    } else if (digits.startsWith("0") && digits.length >= 11) {
      digits = digits.slice(1, 11);
    } else {
      digits = digits.slice(0, INDIAN_MOBILE_LENGTH);
    }
  }

  if (digits.length >= 1 && !/[6-9]/.test(digits[0]!)) {
    digits = digits.slice(1);
  }

  return digits.slice(0, INDIAN_MOBILE_LENGTH);
};

export const normalizeIndianPhoneNumber = (phone: string): string =>
  sanitizeIndianPhoneInput(phone);

export const isValidIndianPhoneNumber = (phone: string): boolean =>
  INDIAN_MOBILE_REGEX.test(normalizeIndianPhoneNumber(phone));

export const PATIENT_AGE_MIN = 1;
export const PATIENT_AGE_MAX = 120;

/** Digits only; no 0 / 00 / 000; caps at 120 while typing. */
export const sanitizePatientAgeInput = (value: string): string => {
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";

  digits = digits.replace(/^0+/, "");
  if (!digits) return "";

  const parsed = Number(digits);
  if (!Number.isFinite(parsed)) return "";
  if (parsed > PATIENT_AGE_MAX) return String(PATIENT_AGE_MAX);

  return digits.slice(0, String(PATIENT_AGE_MAX).length);
};

export const isValidPatientAge = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!/^\d+$/.test(trimmed)) return false;
  const age = Number(trimmed);
  return age >= PATIENT_AGE_MIN && age <= PATIENT_AGE_MAX;
};

export const calculateAgeFromDateOfBirth = (
  dateOfBirth?: string | null,
): number | null => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

export const getPatientId = (patient: Patient | string | undefined | null) => {
  if (!patient) return "";
  if (typeof patient === "string") return patient;
  return patient.id || patient._id || "";
};

export const getPatientFullName = (
  patient: Patient | string | undefined | null,
) => {
  if (!patient || typeof patient === "string") return "—";
  return `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "—";
};

export const getPatientAge = (patient: Patient | undefined | null) => {
  if (!patient) return null;
  if (patient.dateOfBirth) {
    return calculateAgeFromDateOfBirth(patient.dateOfBirth) ?? patient.age ?? null;
  }
  return patient.age ?? null;
};

export const getPatientInitials = (
  patient: Patient | string | undefined | null,
) => {
  if (!patient || typeof patient === "string") return "?";
  const first = patient.firstName?.[0] || "";
  const last = patient.lastName?.[0] || "";
  return `${first}${last}`.toUpperCase() || "?";
};

export const formatPatientDateOfBirth = (dateOfBirth?: string | null) => {
  if (!dateOfBirth) return "—";
  try {
    return new Date(dateOfBirth).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export const getHomeMedications = (
  patient: Patient | null | undefined,
): string[] =>
  (patient?.medications || []).map((med) => med.trim()).filter(Boolean);
