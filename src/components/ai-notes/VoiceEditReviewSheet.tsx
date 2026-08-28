import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { aiNotesService } from "@/services/ai-notes.service";
import type { VoiceEditPreviewResult } from "@/types/ai-notes.types";
import { colors, spacing, typography } from "@/theme";

interface VoiceEditReviewSheetProps {
  visible: boolean;
  sessionId: string;
  preview: VoiceEditPreviewResult | null;
  onClose: () => void;
  onAccepted: () => void;
}

export function VoiceEditReviewSheet({
  visible,
  sessionId,
  preview,
  onClose,
  onAccepted,
}: VoiceEditReviewSheetProps) {
  const [accepting, setAccepting] = useState(false);

  if (!preview) return null;

  const handleAccept = async () => {
    try {
      setAccepting(true);
      await aiNotesService.acceptVoiceEdit(sessionId, {
        proposedNotes: {
          summary: preview.proposedNotes.summary,
          subjective: preview.proposedNotes.subjective,
          objective: preview.proposedNotes.objective,
          assessment: preview.proposedNotes.assessment,
          plan: preview.proposedNotes.plan,
          remarks: preview.proposedNotes.remarks,
          medications: preview.proposedNotes.medications,
        },
        instructionText: preview.instructionText,
        changedSections: preview.changedSections,
        changeSummary: preview.changeSummary,
        vitalsUpdates: preview.vitalsUpdates,
      });
      onAccepted();
      onClose();
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { message?: string } };
          }
        )?.response?.data?.message || "Could not apply voice edit.";
      Alert.alert("Accept failed", message);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <BottomSheet visible={visible} title="Review Voice Edit" onClose={onClose}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instructionLabel}>Heard</Text>
        <Text style={styles.instruction}>{preview.instructionText}</Text>
        {preview.changeSummary ? (
          <Text style={styles.summary}>{preview.changeSummary}</Text>
        ) : null}

        {(preview.changes || []).length === 0 ? (
          <Text style={styles.empty}>No section changes detected.</Text>
        ) : (
          preview.changes.map((change) => (
            <Card key={`${change.section}-${change.label}`} style={styles.card}>
              <Text style={styles.section}>{change.label || change.section}</Text>
              <Text style={styles.beforeLabel}>Before</Text>
              <Text style={styles.before}>{change.before || "—"}</Text>
              <Text style={styles.afterLabel}>After</Text>
              <Text style={styles.after}>{change.after || "—"}</Text>
            </Card>
          ))
        )}

        <Button
          title="Accept Changes"
          loading={accepting}
          onPress={handleAccept}
        />
        <Button title="Discard" variant="outline" onPress={onClose} />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  instructionLabel: { ...typography.caption, color: colors.muted },
  instruction: { ...typography.bodyMedium, color: colors.foreground },
  summary: { ...typography.caption, color: colors.secondary },
  empty: { ...typography.body, color: colors.muted },
  card: { gap: spacing.xs },
  section: {
    ...typography.bodyMedium,
    color: colors.foreground,
    fontWeight: "700",
  },
  beforeLabel: { ...typography.caption, color: colors.muted, marginTop: 4 },
  before: { ...typography.caption, color: colors.muted },
  afterLabel: { ...typography.caption, color: colors.primary, marginTop: 6 },
  after: { ...typography.body, color: colors.foreground },
});
