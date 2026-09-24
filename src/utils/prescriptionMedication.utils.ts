import type { AiNotesMedication } from "@/types/ai-notes.types";

export const PRESCRIPTION_DAYS_MAX = 365;

export const hasMedicationDosageFrequency = (
  med: Pick<AiNotesMedication, "morning" | "afternoon" | "night">,
): boolean =>
  Boolean(
    med.morning?.trim() || med.afternoon?.trim() || med.night?.trim(),
  );

export type MedicationDaysValidation =
  | { valid: true; value: number }
  | { valid: false; reason: "missing" | "invalid" | "too_large" };

export const validateMedicationDaysValue = (
  days: string | undefined,
): MedicationDaysValidation => {
  const trimmed = days?.trim() || "";
  if (!trimmed) {
    return { valid: false, reason: "missing" };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, reason: "invalid" };
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { valid: false, reason: "invalid" };
  }
  if (parsed > PRESCRIPTION_DAYS_MAX) {
    return { valid: false, reason: "too_large" };
  }
  return { valid: true, value: parsed };
};

const clinicalMessage = (
  row: number,
  daysResult: Extract<MedicationDaysValidation, { valid: false }>,
): string => {
  if (daysResult.reason === "missing") {
    return `Medication ${row} requires the number of days.`;
  }
  if (daysResult.reason === "too_large") {
    return `Medication ${row} days cannot exceed ${PRESCRIPTION_DAYS_MAX}.`;
  }
  return `Medication ${row} days must be a positive whole number.`;
};

/** Matches API `assertPrescriptionClinicalCompleteness` for editable rows. */
export const findClinicalCompletenessIssue = (
  medications: AiNotesMedication[],
): { index: number; message: string } | null => {
  for (let index = 0; index < medications.length; index += 1) {
    const row = index + 1;
    const medication = medications[index];
    if (!medication.medicine?.trim()) continue;

    if (!hasMedicationDosageFrequency(medication)) {
      return {
        index,
        message: `Medication ${row} needs at least one dosage/frequency.`,
      };
    }

    const daysResult = validateMedicationDaysValue(medication.days);
    if (!daysResult.valid) {
      return {
        index,
        message: clinicalMessage(row, daysResult),
      };
    }
  }

  return null;
};

export const inferDefaultDaysFromPlan = (plan?: string): string | undefined => {
  const match = plan?.match(/(\d+)\s*days?/i);
  return match?.[1];
};

export const normalizeMedicationsForEditing = (
  medications: AiNotesMedication[] | undefined,
  plan?: string,
): AiNotesMedication[] | undefined => {
  if (!medications?.length) return medications;
  const defaultDays = inferDefaultDaysFromPlan(plan);
  return medications.map((med) => {
    if (med.days?.trim()) return med;
    if (!defaultDays) return med;
    return { ...med, days: defaultDays };
  });
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { message?: string } } })
      .response?.data;
    if (data?.message) return data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
