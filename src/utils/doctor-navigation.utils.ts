import type { SessionStatus } from "@/types/session.types";
import { getConsultationRouteForStatus } from "@/utils/navigation.utils";

export const getConsultationBriefPath = (sessionId: string) =>
  `/consultation/${sessionId}/brief`;

export const getDoctorWorkspacePath = (
  sessionId: string,
  status?: SessionStatus | string,
) => {
  if (!status || status === "created") {
    return `/consultation/${sessionId}`;
  }
  return getConsultationRouteForStatus(sessionId, status as SessionStatus);
};
