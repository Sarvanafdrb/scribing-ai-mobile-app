import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { appointmentService } from "@/services/appointment.service";
import { appointmentKeys, sessionKeys } from "@/services/query-keys";

export const useAppointmentMutations = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
  };

  const checkInAppointment = useMutation({
    mutationFn: (id: string) => appointmentService.checkIn(id),
    onSuccess: () => {
      invalidateAll();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      Alert.alert(
        "Check-in failed",
        error?.response?.data?.message || "Failed to check in appointment.",
      );
    },
  });

  return { checkInAppointment };
};
