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

/** Parse common Indian prescription patterns like 1-0-1 or 1/0/1 from free text. */
export const parseManScheduleFromText = (
  text?: string,
): Pick<AiNotesMedication, "morning" | "afternoon" | "night"> | null => {
  const trimmed = text?.trim();
  if (!trimmed) return null;

  const dash = trimmed.match(/\b(\d+)\s*[-–]\s*(\d+)\s*[-–]\s*(\d+)\b/);
  if (dash) {
    return { morning: dash[1], afternoon: dash[2], night: dash[3] };
  }

  const slash = trimmed.match(/\b(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\b/);
  if (slash) {
    return { morning: slash[1], afternoon: slash[2], night: slash[3] };
  }

  return null;
};

export const inferDefaultDaysFromPlan = (
  plan?: string,
  instructions?: string,
): string | undefined => {
  const fromPlan = plan?.match(/(\d+)\s*days?/i)?.[1];
  if (fromPlan) return fromPlan;
  return instructions?.match(/(?:for\s+)?(\d+)\s*days?/i)?.[1];
};

const coerceDaysString = (days: unknown): string | undefined => {
  if (days == null) return undefined;
  if (typeof days === "number" && Number.isFinite(days) && days > 0) {
    return String(Math.trunc(days));
  }
  const trimmed = String(days).trim();
  return trimmed || undefined;
};

export const normalizeMedicationsForEditing = (
  medications: AiNotesMedication[] | undefined,
  plan?: string,
): AiNotesMedication[] | undefined => {
  if (!medications?.length) return medications;

  return medications.map((med) => {
    let next: AiNotesMedication = { ...med };
    const coercedDays = coerceDaysString(next.days);
    if (coercedDays) {
      next = { ...next, days: coercedDays };
    }

    if (!hasMedicationDosageFrequency(next)) {
      const schedule =
        parseManScheduleFromText(next.instructions) ||
        parseManScheduleFromText(plan);
      if (schedule) {
        next = { ...next, ...schedule };
      }
    }

    if (!next.days?.trim()) {
      const defaultDays = inferDefaultDaysFromPlan(plan, next.instructions);
      if (defaultDays) {
        next = { ...next, days: defaultDays };
      }
    }

    return next;
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
