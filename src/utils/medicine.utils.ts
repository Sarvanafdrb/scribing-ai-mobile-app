import type { Medicine } from "@/types/medicine.types";

export function getMedicineId(medicine: Medicine | string | undefined | null) {
  if (!medicine) return "";
  if (typeof medicine === "string") return medicine;
  return String(medicine._id || medicine.id || "");
}

export function formatMedicineCost(cost?: number | null) {
  const value = typeof cost === "number" && Number.isFinite(cost) ? cost : 0;
  return `₹${value.toFixed(2)}`;
}

export function formatMedicineSubtitle(medicine: Medicine) {
  return [
    medicine.genericName,
    medicine.strength,
    medicine.form,
    medicine.route,
  ]
    .filter(Boolean)
    .join(" · ");
}
