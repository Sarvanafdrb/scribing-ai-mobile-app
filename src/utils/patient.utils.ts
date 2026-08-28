import type { Patient } from "@/types/patient.types";

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
