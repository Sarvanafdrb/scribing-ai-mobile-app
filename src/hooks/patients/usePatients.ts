import { useQuery } from "@tanstack/react-query";
import { patientService } from "@/services/patient.service";
import { patientKeys } from "@/services/query-keys";

export const usePatients = (
  filters: {
    search?: string;
    isActive?: string;
    organizationId?: string;
    page?: number;
    limit?: number;
  },
  enabled = true,
) => {
  return useQuery({
    queryKey: patientKeys.list(filters),
    queryFn: () => patientService.getAll(filters),
    enabled,
    staleTime: 15 * 1000,
  });
};

export const usePatient = (patientId?: string) => {
  return useQuery({
    queryKey: patientKeys.detail(patientId || ""),
    queryFn: () => patientService.getById(patientId!),
    enabled: Boolean(patientId),
  });
};
