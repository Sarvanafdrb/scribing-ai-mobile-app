import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "@/services/session.service";
import { sessionKeys } from "@/services/query-keys";
import type { CreateSessionData, UpdateSessionData } from "@/types/session.types";

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

  const updateSession = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionData }) =>
      sessionService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(sessionKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey.includes("doctor-queue"),
      });
    },
  });

  return { createSession, updateSession };
};
