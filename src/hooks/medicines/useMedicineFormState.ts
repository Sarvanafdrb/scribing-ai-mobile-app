import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import type { Medicine } from "@/types/medicine.types";
import {
  emptyMedicineFormState,
  mapMedicineToFormState,
  type MedicineFormState,
} from "@/utils/medicineForm.utils";

export function useMedicineFormState(initialMedicine?: Medicine | null) {
  const genericNameTouchedRef = useRef(false);
  const [fields, setFields] = useState<MedicineFormState>(() =>
    initialMedicine
      ? mapMedicineToFormState(initialMedicine)
      : emptyMedicineFormState(),
  );
  const [conditionDraft, setConditionDraft] = useState("");

  const resetFromMedicine = useCallback((medicine: Medicine) => {
    const storedGeneric = (medicine.genericName || "").trim();
    genericNameTouchedRef.current = Boolean(storedGeneric);
    setFields(mapMedicineToFormState(medicine));
    setConditionDraft("");
  }, []);

  const addCondition = useCallback(() => {
    const next = conditionDraft.trim();
    if (!next) return;
    setFields((current) => {
      if (
        current.conditions.some(
          (c) => c.toLowerCase() === next.toLowerCase(),
        )
      ) {
        Alert.alert("Already added", "This condition is already in the list.");
        return current;
      }
      return {
        ...current,
        conditions: [...current.conditions, next],
      };
    });
    setConditionDraft("");
  }, [conditionDraft]);

  const removeCondition = useCallback((condition: string) => {
    setFields((current) => ({
      ...current,
      conditions: current.conditions.filter((item) => item !== condition),
    }));
  }, []);

  return {
    fields,
    setFields,
    conditionDraft,
    setConditionDraft,
    genericNameTouchedRef,
    addCondition,
    removeCondition,
    resetFromMedicine,
  };
}
