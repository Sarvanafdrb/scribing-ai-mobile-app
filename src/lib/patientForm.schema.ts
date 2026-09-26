import { z } from "zod";
import {
  optionalPatientAgeSchema,
  requiredIndianMobileSchema,
} from "@/lib/validation";
import type { CreatePatientData, Patient, UpdatePatientData } from "@/types/patient.types";
import type { BloodGroup } from "@/types/patient.types";
import { calculateAgeFromDateOfBirth } from "@/utils/patient.utils";

export const patientFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  gender: z.enum(["male", "female", "other", "unknown"]),
  phoneNumber: requiredIndianMobileSchema,
  age: optionalPatientAgeSchema,
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Invalid email",
    ),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export function mapPatientToFormValues(patient: Patient): PatientFormValues {
  const ageFromDob = patient.dateOfBirth
    ? calculateAgeFromDateOfBirth(patient.dateOfBirth)
    : null;
  const age =
    patient.age ?? ageFromDob ?? undefined;

  return {
    firstName: patient.firstName || "",
    lastName: patient.lastName || "",
    gender: patient.gender || "unknown",
    phoneNumber: patient.phoneNumber || "",
    age: age !== null && age !== undefined ? String(age) : "",
    email: patient.email || "",
    address: patient.address || "",
    bloodGroup: patient.bloodGroup || "",
    allergies: (patient.allergies || []).filter(Boolean).join(", "),
  };
}

function parseAllergies(value?: string) {
  if (!value?.trim()) return undefined;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formValuesToCreatePayload(
  data: PatientFormValues,
  organizationId: string,
): CreatePatientData {
  const ageValue = data.age?.trim() ? Number(data.age) : undefined;
  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    gender: data.gender,
    phoneNumber: data.phoneNumber.trim(),
    age: Number.isFinite(ageValue) ? ageValue : undefined,
    email: data.email?.trim() || undefined,
    address: data.address?.trim() || undefined,
    bloodGroup: (data.bloodGroup as BloodGroup) || undefined,
    allergies: parseAllergies(data.allergies),
    organizationId,
  };
}

export function formValuesToUpdatePayload(
  data: PatientFormValues,
): UpdatePatientData {
  const ageValue = data.age?.trim() ? Number(data.age) : undefined;
  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    gender: data.gender,
    phoneNumber: data.phoneNumber.trim(),
    age: Number.isFinite(ageValue) ? ageValue : undefined,
    email: data.email?.trim() || undefined,
    address: data.address?.trim() || undefined,
    bloodGroup: (data.bloodGroup as BloodGroup) || "",
    allergies: parseAllergies(data.allergies),
  };
}
