import React, { useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingScreen, ErrorState } from "@/components/ui/EmptyState";
import { VoiceEditSheet } from "@/components/ai-notes/VoiceEditSheet";
import { VoiceEditReviewSheet } from "@/components/ai-notes/VoiceEditReviewSheet";
import { useSession } from "@/hooks/sessions/useSession";
import { useAiNotes } from "@/hooks/ai-notes/useAiNotes";
import { aiNotesKeys, sessionKeys } from "@/services/query-keys";
import { SessionSmsPanel } from "@/components/consultation/SessionSmsPanel";
import { SaveConsultationSheet } from "@/components/consultation/SaveConsultationSheet";
import { getPatientFromSession } from "@/hooks/doctor/useDoctorQueue";
import { getPatientFullName } from "@/utils/patient.utils";
import { isConsultationCompleted } from "@/utils/session-status.utils";
import { getSessionDepartmentName } from "@/types/session.types";
import {
  buildAiNotesExportContent,
  buildAiNotesExportHtml,
} from "@/utils/ai-notes-export.utils";
import {
  findClinicalCompletenessIssue,
  getApiErrorMessage,
} from "@/utils/prescriptionMedication.utils";
import type { VoiceEditPreviewResult } from "@/types/ai-notes.types";
import { colors, spacing, typography } from "@/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PreviewScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: session, isLoading: sessionLoading } = useSession(sessionId);
  const { aiNotes, isLoading, isError, refetch, update } = useAiNotes(sessionId);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [voiceEditOpen, setVoiceEditOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [voicePreview, setVoicePreview] =
    useState<VoiceEditPreviewResult | null>(null);
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({
    subjective: true,
    objective: true,
    assessment: true,
    plan: true,
    medications: true,
    remarks: true,
  });

  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const createPdf = async () => {
    if (!session || !aiNotes || !sessionId) return null;
    const content = buildAiNotesExportContent(aiNotes, session);
    const html = buildAiNotesExportHtml(content);
    const file = await Print.printToFileAsync({ html });
    return file.uri;
  };

  const handlePdf = async () => {
    try {
      setExporting(true);
      const uri = await createPdf();
      if (!uri) return;
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share consultation PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("PDF ready", "PDF was generated on this device.");
      }
    } catch {
      Alert.alert("PDF failed", "Unable to generate the consultation PDF.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    try {
      setExporting(true);
      if (!session || !aiNotes) return;
      const content = buildAiNotesExportContent(aiNotes, session);
      const html = buildAiNotesExportHtml(content);
      await Print.printAsync({ html });
    } catch {
      Alert.alert("Print failed", "Unable to open the print dialog.");
    } finally {
      setExporting(false);
    }
  };

  const saveConsultation = async () => {
    if (!sessionId || !aiNotes) return;
    const issue = findClinicalCompletenessIssue(aiNotes.medications || []);
    if (issue) {
      Alert.alert("Prescription incomplete", issue.message);
      return;
    }
    try {
      setSaving(true);
      await update.mutateAsync({
        summary: aiNotes.summary,
        subjective: aiNotes.subjective,
        objective: aiNotes.objective,
        assessment: aiNotes.assessment,
        plan: aiNotes.plan,
        remarks: aiNotes.remarks,
        medications: aiNotes.medications,
      });
      setSaveSheetOpen(true);
    } catch (error) {
      Alert.alert(
        "Save failed",
        getApiErrorMessage(error, "Could not save consultation notes."),
      );
    } finally {
      setSaving(false);
    }
  };

  const finishAfterDisposition = async () => {
    if (!sessionId) return;
    await queryClient.invalidateQueries({
      queryKey: sessionKeys.detail(sessionId),
    });
    await queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    await queryClient.invalidateQueries({
      queryKey: aiNotesKeys.detail(sessionId),
    });
    router.replace(`/consultation/${sessionId}/completed`);
  };

  if (isLoading || sessionLoading) {
    return <LoadingScreen message="Preparing preview…" />;
  }

  if (isError || !aiNotes || !session) {
    return <ErrorState onRetry={refetch} />;
  }

  const patient = getPatientFromSession(session);

  return (
    <View style={styles.screen}>
      <GlassHeader
        title="Preview"
        showBack
        subtitle={patient ? getPatientFullName(patient) : session.sessionCode}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 140 },
        ]}
      >
        <Card style={styles.reportHeader}>
          <Text style={styles.reportTitle}>Consultation Report</Text>
          <Text style={styles.reportMeta}>{session.title}</Text>
          <Text style={styles.reportMeta}>{session.sessionCode}</Text>
          {getSessionDepartmentName(session) ? (
            <Text style={styles.reportMeta}>
              Department: {getSessionDepartmentName(session)}
            </Text>
          ) : null}
        </Card>

        <Collapsible
          title="Chief Complaint / HPI"
          open={open.subjective}
          onToggle={() => toggle("subjective")}
          body={aiNotes.subjective}
        />
        <Collapsible
          title="Examination"
          open={open.objective}
          onToggle={() => toggle("objective")}
          body={aiNotes.objective}
        />
        <Collapsible
          title="Assessment / Diagnosis"
          open={open.assessment}
          onToggle={() => toggle("assessment")}
          body={aiNotes.assessment}
        />
        <Collapsible
          title="Treatment Plan"
          open={open.plan}
          onToggle={() => toggle("plan")}
          body={aiNotes.plan}
        />
        <Collapsible
          title="Advice / Follow-up"
          open={open.remarks}
          onToggle={() => toggle("remarks")}
          body={aiNotes.remarks}
        />

        <Card>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => toggle("medications")}
          >
            <Text style={styles.sectionTitle}>Prescription</Text>
            <Ionicons
              name={open.medications ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.muted}
            />
          </Pressable>
          {open.medications ? (
            (aiNotes.medications || []).length === 0 ? (
              <Text style={styles.body}>No medications</Text>
            ) : (
              aiNotes.medications!.map((med, index) => (
                <View key={`${med.medicine}-${index}`} style={styles.medRow}>
                  <Text style={styles.medName}>{med.medicine}</Text>
                  <Text style={styles.medDose}>
                    {[med.morning, med.afternoon, med.night]
                      .filter(Boolean)
                      .join(" · ")}
                    {med.days ? ` · ${med.days} days` : ""}
                  </Text>
                  {med.instructions ? (
                    <Text style={styles.medInstructions}>{med.instructions}</Text>
                  ) : null}
                </View>
              ))
            )
          ) : null}
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.secondaryActions}>
          <Button
            title="PDF"
            variant="outline"
            size="sm"
            fullWidth={false}
            loading={exporting}
            onPress={handlePdf}
          />
          <Button
            title="Print"
            variant="outline"
            size="sm"
            fullWidth={false}
            loading={exporting}
            onPress={handlePrint}
          />
          <Button
            title="Voice Edit"
            variant="outline"
            size="sm"
            fullWidth={false}
            onPress={() => setVoiceEditOpen(true)}
          />
        </View>
        {isConsultationCompleted(session.status) ? (
          <SessionSmsPanel
            sessionId={sessionId!}
            session={session}
            patient={patient}
          />
        ) : null}
        <Button
          title="Save Consultation"
          size="lg"
          loading={saving}
          onPress={saveConsultation}
        />
      </View>

      <VoiceEditSheet
        visible={voiceEditOpen}
        sessionId={sessionId!}
        onClose={() => setVoiceEditOpen(false)}
        onPreviewReady={(preview) => {
          setVoicePreview(preview);
          setReviewOpen(true);
        }}
      />
      <VoiceEditReviewSheet
        visible={reviewOpen}
        sessionId={sessionId!}
        preview={voicePreview}
        onClose={() => {
          setReviewOpen(false);
          setVoicePreview(null);
        }}
        onAccepted={async () => {
          await queryClient.invalidateQueries({
            queryKey: aiNotesKeys.detail(sessionId!),
          });
          await refetch();
        }}
      />
      <SaveConsultationSheet
        visible={saveSheetOpen}
        onClose={() => setSaveSheetOpen(false)}
        session={session}
        sessionId={sessionId!}
        onCompleted={finishAfterDisposition}
      />
    </View>
  );
}

function Collapsible({
  title,
  open,
  onToggle,
  body,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  body?: string;
}) {
  return (
    <Card>
      <Pressable style={styles.sectionHeader} onPress={onToggle}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.muted}
        />
      </Pressable>
      {open ? <Text style={styles.body}>{body || "—"}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  reportHeader: { gap: 4 },
  reportTitle: { ...typography.heading, color: colors.foreground },
  reportMeta: { ...typography.caption, color: colors.muted },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.bodyMedium,
    color: colors.foreground,
    fontWeight: "700",
  },
  body: { ...typography.body, color: colors.foreground, marginTop: spacing.sm },
  medRow: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  medName: { ...typography.bodyMedium, color: colors.foreground },
  medDose: { ...typography.caption, color: colors.muted, marginTop: 2 },
  medInstructions: {
    ...typography.caption,
    color: colors.secondary,
    marginTop: 2,
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
    gap: spacing.md,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
});
