import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transcriptService } from "@/services/transcript.service";
import { transcriptKeys, sessionKeys } from "@/services/query-keys";
import type { UpdateTranscriptData } from "@/types/transcript.types";

export const useTranscriptMutations = (sessionId?: string) => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    if (!sessionId) return;
    await queryClient.invalidateQueries({
      queryKey: transcriptKeys.detail(sessionId),
    });
    await queryClient.invalidateQueries({
      queryKey: sessionKeys.detail(sessionId),
    });
  };

  const generate = useMutation({
    mutationFn: () => transcriptService.generate(sessionId!),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: (data: UpdateTranscriptData) =>
      transcriptService.update(sessionId!, data),
    onSuccess: invalidate,
  });

  return { generate, update, invalidate };
};
