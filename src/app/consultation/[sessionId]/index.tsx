import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { LoadingScreen, ErrorState } from "@/components/ui/EmptyState";
import { AdmitPatientSheet } from "@/components/patients/AdmitPatientSheet";
import { useSession } from "@/hooks/sessions/useSession";
import { getPatientFromSession } from "@/hooks/doctor/useDoctorQueue";
import {
  getPatientAge,
  getPatientFullName,
  getPatientInitials,
} from "@/utils/patient.utils";
import {
  canStartRecording,
  isConsultationCompleted,
  isReviewReady,
  isTranscriptAvailable,
} from "@/utils/session-status.utils";
import { getConsultationRouteForStatus } from "@/utils/navigation.utils";
import { resolveMediaUrl } from "@/utils/media.utils";
import { SESSION_STATUS_COLORS, SESSION_STATUS_LABELS } from "@/constants/status";
import { formatDate } from "@/utils/date.utils";
import { getSessionDepartmentName } from "@/types/session.types";
import { colors, spacing, typography } from "@/theme";

export default function PatientDetailsScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { data: session, isLoading, isError, refetch } = useSession(sessionId);
  const [admitOpen, setAdmitOpen] = useState(false);

  if (isLoading) return <LoadingScreen message="Loading patient…" />;
  if (isError || !session) {
    return <ErrorState onRetry={refetch} title="Unable to load consultation" />;
  }

  const patient = getPatientFromSession(session);
  if (!patient) {
    return (
      <ErrorState
        title="Patient not found"
        message="This session has no patient data."
      />
    );
  }

  const name = getPatientFullName(patient);
  const age = getPatientAge(patient);
  const statusColors = SESSION_STATUS_COLORS[session.status];
  const canRecord = canStartRecording(session.status);

  const handleContinue = () => {
    if (session.status === "created" || session.status === "failed") {
      router.push(`/consultation/${sessionId}/recording`);
      return;
    }
    router.push(
      getConsultationRouteForStatus(sessionId!, session.status) as never,
    );
  };

  const continueLabel = () => {
    if (session.status === "created") return "Start Consultation";
    if (session.status === "recording") return "Resume Recording";
    if (session.status === "uploading" || session.status === "processing") {
      return "View Progress";
    }
    if (
      isTranscriptAvailable(session.status) &&
      !isReviewReady(session.status)
    ) {
      return "View Transcript";
    }
    if (
      isReviewReady(session.status) &&
      !isConsultationCompleted(session.status)
    ) {
      return "Review Notes";
    }
    if (isConsultationCompleted(session.status)) return "View Summary";
    return "Continue";
  };

  return (
    <View style={styles.screen}>
      <GlassHeader
        title="Patient Details"
        showBack
        subtitle={[
          session.sessionCode,
          getSessionDepartmentName(session),
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 160 },
        ]}
      >
        <Card style={styles.hero}>
          <View style={styles.heroRow}>
            <Avatar name={getPatientInitials(patient)} size={72} />
            <View style={styles.heroText}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.meta}>
                {[
                  age !== null ? `${age} yrs` : null,
                  patient.gender,
                  patient.bloodGroup,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              <Badge
                label={SESSION_STATUS_LABELS[session.status]}
                color={statusColors.text}
                backgroundColor={statusColors.bg}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        </Card>

        <InfoGrid
          items={[
            { label: "Patient ID", value: patient.patientCode },
            { label: "Phone", value: patient.phoneNumber || "—" },
            { label: "Blood Group", value: patient.bloodGroup || "—" },
            {
              label: "Department",
              value: getSessionDepartmentName(session) || "—",
            },
            {
              label: "Visit",
              value:
                session.visitType === "inpatient"
                  ? `IP${session.ward && session.bed ? ` · ${session.ward}/${session.bed}` : ""}`
                  : "OP",
            },
            {
              label: "Last Visit",
              value: session.lastVisit?.date
                ? formatDate(session.lastVisit.date)
                : "—",
            },
          ]}
        />

        {session.audioPlaybackUrl || session.audioUrl ? (
          <Section title="Recording">
            <AudioPlayer
              uri={resolveMediaUrl(
                session.audioPlaybackUrl || session.audioUrl,
              )}
            />
          </Section>
        ) : null}

        <Section title="Allergies">
          <View style={styles.chips}>
            {(patient.allergies || []).length === 0 ? (
              <Text style={styles.empty}>No known allergies</Text>
            ) : (
              patient.allergies!.map((item) => (
                <Chip key={item} label={item} selected />
              ))
            )}
          </View>
        </Section>

        <Section title="Medications">
          <View style={styles.chips}>
            {(patient.medications || []).length === 0 ? (
              <Text style={styles.empty}>No current medications listed</Text>
            ) : (
              patient.medications!.map((item) => (
                <Chip key={item} label={item} />
              ))
            )}
          </View>
        </Section>

        <Section title="Vitals">
          <InfoGrid
            items={[
              {
                label: "Temp",
                value: session.vitals?.temperature
                  ? `${session.vitals.temperature}°F`
                  : "—",
              },
              {
                label: "BP",
                value:
                  session.vitals?.bloodPressure?.systolic &&
                  session.vitals?.bloodPressure?.diastolic
                    ? `${session.vitals.bloodPressure.systolic}/${session.vitals.bloodPressure.diastolic}`
                    : "—",
              },
              {
                label: "HR",
                value: session.vitals?.heartRate
                  ? `${session.vitals.heartRate} bpm`
                  : "—",
              },
              {
                label: "SpO2",
                value: session.vitals?.spo2
                  ? `${session.vitals.spo2}%`
                  : "—",
              },
              {
                label: "Weight",
                value: session.vitals?.weight
                  ? `${session.vitals.weight} kg`
                  : "—",
              },
            ]}
          />
        </Section>

        <Section title="Previous History">
          {(session.previousHistory || []).length === 0 ? (
            <Text style={styles.empty}>No previous visits</Text>
          ) : (
            session.previousHistory!.slice(0, 3).map((item) => (
              <Card
                key={item.sessionId}
                style={styles.historyCard}
                elevated={false}
              >
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyDate}>
                  {formatDate(item.completedAt)}
                </Text>
                {item.aiNotes?.assessment ? (
                  <Text style={styles.historyBody} numberOfLines={2}>
                    {item.aiNotes.assessment}
                  </Text>
                ) : null}
              </Card>
            ))
          )}
        </Section>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        {session.visitType !== "inpatient" &&
        !isConsultationCompleted(session.status) ? (
          <Button
            title="Admit Patient"
            variant="outline"
            onPress={() => setAdmitOpen(true)}
          />
        ) : null}
        <Button
          title={continueLabel()}
          onPress={() => {
            if (!canRecord && session.status === "completed") {
              handleContinue();
              return;
            }
            if (session.status === "recording") {
              Alert.alert(
                "Recording in progress",
                "Continue to the recording screen?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Continue", onPress: handleContinue },
                ],
              );
              return;
            }
            handleContinue();
          }}
          size="lg"
        />
      </View>

      <AdmitPatientSheet
        visible={admitOpen}
        sessionId={sessionId!}
        onClose={() => setAdmitOpen(false)}
      />
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.label} style={styles.gridItem}>
          <Text style={styles.gridLabel}>{item.label}</Text>
          <Text style={styles.gridValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  hero: { marginBottom: spacing.xs },
  heroRow: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  heroText: { flex: 1 },
  name: { ...typography.heading, color: colors.foreground },
  meta: {
    ...typography.body,
    color: colors.muted,
    textTransform: "capitalize",
    marginTop: 2,
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.heading,
    color: colors.foreground,
    fontSize: 18,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  empty: { ...typography.body, color: colors.muted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridItem: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gridLabel: { ...typography.caption, color: colors.muted },
  gridValue: {
    ...typography.bodyMedium,
    color: colors.foreground,
    marginTop: 4,
  },
  historyCard: { marginBottom: spacing.sm },
  historyTitle: { ...typography.bodyMedium, color: colors.foreground },
  historyDate: { ...typography.caption, color: colors.muted, marginTop: 2 },
  historyBody: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
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
    gap: spacing.sm,
  },
});
