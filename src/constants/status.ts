import type { SessionStatus } from "@/types/session.types";
import { colors } from "@/theme";

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  created: "Ready",
  recording: "Recording",
  uploading: "Uploading",
  processing: "Processing",
  transcript_ready: "Transcript Ready",
  ai_notes_generated: "Notes Ready",
  ready_for_review: "Ready for Review",
  completed: "Completed",
  failed: "Failed",
};

export const SESSION_STATUS_COLORS: Record<
  SessionStatus,
  { bg: string; text: string }
> = {
  created: { bg: colors.primaryLight, text: colors.primary },
  recording: { bg: colors.dangerLight, text: colors.danger },
  uploading: { bg: colors.warningLight, text: colors.warning },
  processing: { bg: "#E0E7FF", text: "#4338CA" },
  transcript_ready: { bg: colors.secondaryLight, text: colors.secondary },
  ai_notes_generated: { bg: colors.successLight, text: colors.success },
  ready_for_review: { bg: colors.successLight, text: colors.success },
  completed: { bg: colors.borderLight, text: colors.muted },
  failed: { bg: colors.dangerLight, text: colors.danger },
};

export const PROCESSING_STEPS = [
  { key: "uploaded", label: "Recording Uploaded" },
  { key: "speech", label: "Speech to Text" },
  { key: "transcript", label: "Generating Transcript" },
  { key: "soap", label: "Generating SOAP" },
  { key: "prescription", label: "Generating Prescription" },
  { key: "completed", label: "Completed" },
] as const;
