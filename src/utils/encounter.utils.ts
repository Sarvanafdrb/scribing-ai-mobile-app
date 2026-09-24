import type { EncounterType } from "@/types/encounter.types";
import type { Session } from "@/types/session.types";

export const getEncounterType = (session?: Session | null): EncounterType => {
  if (session?.encounter?.encounterType) return session.encounter.encounterType;
  if (session?.visitType === "inpatient") return "IP";
  return "OP";
};

export const canStartNextRoundToday = (session?: Session | null): boolean => {
  if (getEncounterType(session) !== "IP") return false;
  if (session?.allRoundsCompletedToday) return false;
  if (typeof session?.hasNextRoundToday === "boolean") {
    return session.hasNextRoundToday;
  }
  const schedule = session?.todaySchedule || [];
  return schedule.some((r) => r.status === "pending");
};
