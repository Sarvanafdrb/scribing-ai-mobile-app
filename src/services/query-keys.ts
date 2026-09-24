export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...sessionKeys.lists(), filters] as const,
  stats: (organizationId?: string) =>
    [...sessionKeys.all, "stats", organizationId || "all"] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
};

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...patientKeys.lists(), filters] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
};

export const transcriptKeys = {
  all: ["transcripts"] as const,
  detail: (sessionId: string) => [...transcriptKeys.all, sessionId] as const,
};

export const aiNotesKeys = {
  all: ["ai-notes"] as const,
  details: () => [...aiNotesKeys.all, "detail"] as const,
  detail: (sessionId: string) => [...aiNotesKeys.details(), sessionId] as const,
};

export const workspaceKeys = {
  all: ["workspaces"] as const,
  list: () => [...workspaceKeys.all, "list"] as const,
};

export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...appointmentKeys.lists(), filters] as const,
};
