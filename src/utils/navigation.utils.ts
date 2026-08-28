import type { SessionStatus } from "@/types/session.types";
import {
  isConsultationCompleted,
  isPipelineActive,
  isReviewReady,
  isTranscriptAvailable,
} from "@/utils/session-status.utils";

/**
 * Maps session status → mobile consultation route segment.
 * Mirrors the web consultation lifecycle.
 */
export const getConsultationRouteForStatus = (
  sessionId: string,
  status?: SessionStatus | string | null,
): string => {
  const base = `/consultation/${sessionId}`;

  if (!status || status === "created") return base;
  if (status === "recording") return `${base}/recording`;
  if (status === "uploading") return `${base}/uploading`;
  if (status === "processing") return `${base}/processing`;
  if (status === "failed") return `${base}/processing`;
  if (status === "transcript_ready") return `${base}/transcript`;
  if (isReviewReady(status) && !isConsultationCompleted(status)) {
    return `${base}/notes`;
  }
  if (isConsultationCompleted(status)) return `${base}/completed`;
  if (isTranscriptAvailable(status)) return `${base}/transcript`;
  if (isPipelineActive(status)) return `${base}/processing`;
  return base;
};
