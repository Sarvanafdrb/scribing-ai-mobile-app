import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingScreen, ErrorState } from "@/components/ui/EmptyState";
import { useAiNotes } from "@/hooks/ai-notes/useAiNotes";
import type { AiNotes, AiNotesMedication } from "@/types/ai-notes.types";
import { colors, radius, spacing, typography } from "@/theme";

export default function AiNotesScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { aiNotes, isLoading, isError, refetch, generate, update, isGenerating } =
    useAiNotes(sessionId);
  const [draft, setDraft] = useState<AiNotes | null>(null);

  useEffect(() => {
    if (aiNotes) setDraft(aiNotes);
  }, [aiNotes]);

  if (isLoading || isGenerating) {
    return <LoadingScreen message="Generating AI notes…" />;
  }

  if (isError) return <ErrorState onRetry={refetch} />;

  if (!draft) {
    return (
      <View style={styles.screen}>
        <GlassHeader title="AI Notes" showBack />
        <View style={styles.center}>
          <Button
            title="Generate AI Notes"
            loading={generate.isPending}
            onPress={() => generate.mutate(false)}
          />
        </View>
      </View>
    );
  }

  const setField = (key: keyof AiNotes, value: string) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveAndPreview = async () => {
    try {
      await update.mutateAsync({
        summary: draft.summary,
        subjective: draft.subjective,
        objective: draft.objective,
        assessment: draft.assessment,
        plan: draft.plan,
        remarks: draft.remarks,
        medications: draft.medications,
      });
      router.push(`/consultation/${sessionId}/preview`);
    } catch {
      Alert.alert("Save failed", "Could not update AI notes.");
    }
  };

  return (
    <View style={styles.screen}>
      <GlassHeader title="AI Notes" showBack subtitle="Editable clinical notes" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        <NoteField
          label="Chief Complaint / HPI (SOAP Subjective)"
          value={draft.subjective || ""}
          onChangeText={(v) => setField("subjective", v)}
        />
        <NoteField
          label="Examination (SOAP Objective)"
          value={draft.objective || ""}
          onChangeText={(v) => setField("objective", v)}
        />
        <NoteField
          label="Assessment / Diagnosis"
          value={draft.assessment || ""}
          onChangeText={(v) => setField("assessment", v)}
        />
        <NoteField
          label="Treatment Plan"
          value={draft.plan || ""}
          onChangeText={(v) => setField("plan", v)}
        />
        <NoteField
          label="Advice / Follow-up"
          value={draft.remarks || ""}
          onChangeText={(v) => setField("remarks", v)}
        />

        <Text style={styles.sectionTitle}>Prescription</Text>
        {(draft.medications || []).length === 0 ? (
          <Text style={styles.empty}>No medications generated</Text>
        ) : (
          draft.medications!.map((med, index) => (
            <MedicationEditor
              key={`${med.medicine}-${index}`}
              medication={med}
              onChange={(next) => {
                const medications = [...(draft.medications || [])];
                medications[index] = next;
                setDraft({ ...draft, medications });
              }}
            />
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.footerRow}>
          <View style={styles.footerBtn}>
            <Button
              title="Regenerate"
              variant="outline"
              loading={generate.isPending}
              onPress={() => generate.mutate(true)}
            />
          </View>
          <View style={styles.footerBtn}>
            <Button
              title="Preview"
              loading={update.isPending}
              onPress={saveAndPreview}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function NoteField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <Card style={styles.fieldCard}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        style={styles.input}
        textAlignVertical="top"
      />
    </Card>
  );
}

function MedicationEditor({
  medication,
  onChange,
}: {
  medication: AiNotesMedication;
  onChange: (med: AiNotesMedication) => void;
}) {
  return (
    <Card style={styles.medCard} elevated={false}>
      <TextInput
        value={medication.medicine}
        onChangeText={(medicine) => onChange({ ...medication, medicine })}
        style={styles.medName}
        placeholder="Medicine"
        placeholderTextColor={colors.mutedLight}
      />
      <View style={styles.medRow}>
        {(["morning", "afternoon", "night", "days"] as const).map((key) => (
          <TextInput
            key={key}
            value={medication[key] || ""}
            onChangeText={(value) => onChange({ ...medication, [key]: value })}
            style={styles.medDose}
            placeholder={key}
            placeholderTextColor={colors.mutedLight}
          />
        ))}
      </View>
      <TextInput
        value={medication.instructions || ""}
        onChangeText={(instructions) =>
          onChange({ ...medication, instructions })
        }
        style={styles.medInstructions}
        placeholder="Instructions"
        placeholderTextColor={colors.mutedLight}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  center: { flex: 1, justifyContent: "center", padding: spacing.xl },
  sectionTitle: {
    ...typography.heading,
    color: colors.foreground,
    marginTop: spacing.md,
  },
  empty: { ...typography.body, color: colors.muted },
  fieldCard: { gap: spacing.sm },
  label: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  input: {
    ...typography.body,
    color: colors.foreground,
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  medCard: { gap: spacing.sm, marginBottom: spacing.sm },
  medName: {
    ...typography.bodyMedium,
    color: colors.foreground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
  },
  medRow: { flexDirection: "row", gap: spacing.sm },
  medDose: {
    flex: 1,
    ...typography.caption,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    textAlign: "center",
  },
  medInstructions: {
    ...typography.caption,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.glass,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerRow: { flexDirection: "row", gap: spacing.md },
  footerBtn: { flex: 1 },
});
