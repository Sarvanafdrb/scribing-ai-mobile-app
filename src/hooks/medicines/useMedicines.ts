import { useQuery } from "@tanstack/react-query";
import { medicineService } from "@/services/medicine.service";
import { medicineKeys } from "@/services/query-keys";

export const useMedicines = (
  filters: {
    organizationId?: string;
    search?: string;
    isActive?: string;
    page?: number;
    limit?: number;
  },
  enabled = true,
) => {
  return useQuery({
    queryKey: medicineKeys.list(filters),
    queryFn: () => medicineService.getAll(filters),
    enabled: enabled && Boolean(filters.organizationId),
    staleTime: 30 * 1000,
  });
};

export const useMedicine = (id?: string) =>
  useQuery({
    queryKey: medicineKeys.detail(id || ""),
    queryFn: () => medicineService.getById(id!),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
