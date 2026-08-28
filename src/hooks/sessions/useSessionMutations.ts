import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "@/services/session.service";
import { sessionKeys } from "@/services/query-keys";
import type { CreateSessionData } from "@/types/session.types";

export const useSessionMutations = () => {
  const queryClient = useQueryClient();

  const createSession = useMutation({
    mutationFn: (data: CreateSessionData) => sessionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey.includes("doctor-queue"),
      });
    },
  });

  return { createSession };
};
