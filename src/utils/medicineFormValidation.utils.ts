import type { MedicineFormState } from "@/utils/medicineForm.utils";
import {
  buildMedicinePayload,
  collectConditions,
  parseMedicineCost,
} from "@/utils/medicineForm.utils";
import type { CreateMedicineData } from "@/types/medicine.types";

export type MedicineFormValidationResult =
  | { ok: true; payload: CreateMedicineData }
  | { ok: false; title: string; message: string };

export function validateMedicineForm(
  fields: MedicineFormState,
  conditionDraft: string,
  organizationId: string,
): MedicineFormValidationResult {
  if (!fields.name.trim()) {
    return { ok: false, title: "Required", message: "Medicine name is required." };
  }
  if (!organizationId) {
    return {
      ok: false,
      title: "Workspace",
      message: "Select a workspace before saving medicines.",
    };
  }

  const conditions = collectConditions(fields.conditions, conditionDraft);
  if (conditions.length === 0) {
    return {
      ok: false,
      title: "Required",
      message: "Add at least one applicable condition (e.g. Fever).",
    };
  }

  const parsedCost = parseMedicineCost(fields.cost);
  if (parsedCost === null) {
    return {
      ok: false,
      title: "Invalid cost",
      message: "Cost must be a valid non-negative number.",
    };
  }

  return {
    ok: true,
    payload: buildMedicinePayload(
      fields,
      organizationId,
      conditionDraft,
      parsedCost,
    ),
  };
}
