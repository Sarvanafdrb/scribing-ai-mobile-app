import type { SessionStatus } from "@/types/session.types";
import { router, type Href } from "expo-router";
import {
  isConsultationCompleted,
  isPipelineActive,
  isReviewReady,
  isTranscriptAvailable,
} from "@/utils/session-status.utils";

/** Avoid React Navigation "GO_BACK was not handled" when stack has no history. */
export const safeRouterBack = (fallback?: Href) => {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  if (fallback) {
    router.replace(fallback);
  }
};

export const APP_HOME_HREF = "/(tabs)" as Href;

/** Leave consultation flow and return to the main tab shell. */
export const exitConsultationToHome = () => {
  router.replace(APP_HOME_HREF);
};

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
