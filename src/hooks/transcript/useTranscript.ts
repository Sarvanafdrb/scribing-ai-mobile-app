import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { transcriptService } from "@/services/transcript.service";
import { transcriptKeys, sessionKeys } from "@/services/query-keys";
import { useSession } from "@/hooks/sessions/useSession";
import { PIPELINE_POLL_MS } from "@/constants/config";
import { isTranscriptAvailable } from "@/utils/session-status.utils";

export const useTranscript = (sessionId?: string) => {
  const { data: session } = useSession(sessionId);
  const queryClient = useQueryClient();

  const status = session?.status;
  const shouldPoll =
    status === "processing" ||
    status === "uploading" ||
    (status === "transcript_ready" && false);

  const query = useQuery({
    queryKey: transcriptKeys.detail(sessionId || ""),
    queryFn: () => transcriptService.get(sessionId!),
    enabled: Boolean(sessionId) && isTranscriptAvailable(status)
      ? true
      : Boolean(sessionId) &&
        (status === "processing" ||
          status === "uploading" ||
          status === "recording" ||
          isTranscriptAvailable(status)),
    staleTime: 5 * 1000,
    refetchInterval: (q) => {
      const metaStatus = q.state.data?.metadata?.status;
      if (
        status === "processing" ||
        status === "uploading" ||
        metaStatus === "processing" ||
        metaStatus === "pending"
      ) {
        return PIPELINE_POLL_MS;
      }
      return false;
    },
  });

  const prevStatus = useRef(status);
  useEffect(() => {
    if (
      prevStatus.current !== status &&
      isTranscriptAvailable(status) &&
      sessionId
    ) {
      queryClient.invalidateQueries({
        queryKey: transcriptKeys.detail(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(sessionId),
      });
    }
    prevStatus.current = status;
  }, [status, sessionId, queryClient]);

  const isProcessing =
    status === "processing" ||
    status === "uploading" ||
    query.data?.metadata?.status === "processing" ||
    query.data?.metadata?.status === "pending";

  return {
    ...query,
    transcript: query.data,
    isProcessing,
    shouldPoll,
  };
};
