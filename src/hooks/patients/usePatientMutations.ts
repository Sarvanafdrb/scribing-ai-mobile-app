import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService } from "@/services/patient.service";
import { patientKeys, sessionKeys } from "@/services/query-keys";
import type {
  CreatePatientData,
  Patient,
  UpdatePatientData,
} from "@/types/patient.types";

const invalidateDoctorWorkspaceQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: sessionKeys.all });
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes("doctor-queue"),
  });
};

export const usePatientMutations = () => {
  const queryClient = useQueryClient();

  const createPatient = useMutation({
    mutationFn: (data: CreatePatientData) => patientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      invalidateDoctorWorkspaceQueries(queryClient);
    },
  });

  const updatePatient = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePatientData }) =>
      patientService.update(id, data),
    onSuccess: (_data: Patient, variables) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: patientKeys.detail(variables.id),
      });
      invalidateDoctorWorkspaceQueries(queryClient);
    },
  });

  return {
    createPatient,
    updatePatient,
  };
};
