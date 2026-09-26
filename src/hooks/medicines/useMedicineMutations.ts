import { useMutation, useQueryClient } from "@tanstack/react-query";
import { medicineService } from "@/services/medicine.service";
import { medicineKeys } from "@/services/query-keys";
import type { CreateMedicineData, UpdateMedicineData } from "@/types/medicine.types";

export const useMedicineMutations = () => {
  const queryClient = useQueryClient();

  const invalidateMedicines = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: medicineKeys.all });
    if (id) {
      queryClient.invalidateQueries({ queryKey: medicineKeys.detail(id) });
    }
  };

  const createMedicine = useMutation({
    mutationFn: (data: CreateMedicineData) => medicineService.create(data),
    onSuccess: () => invalidateMedicines(),
  });

  const updateMedicine = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicineData }) =>
      medicineService.update(id, data),
    onSuccess: (_data, variables) => invalidateMedicines(variables.id),
  });

  return { createMedicine, updateMedicine };
};
