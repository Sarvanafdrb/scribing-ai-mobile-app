import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingScreen, ErrorState } from "@/components/ui/EmptyState";
import { SessionVitalsInlineGrid } from "@/components/consultation/SessionVitalsInlineGrid";
import { useSession } from "@/hooks/sessions/useSession";
import {
  formatPatientDateOfBirth,
  getHomeMedications,
  getPatientAge,
  getPatientFullName,
  getPatientInitials,
} from "@/utils/patient.utils";
import { getDoctorWorkspacePath } from "@/utils/doctor-navigation.utils";
import { colors, spacing, typography } from "@/theme";
import type { Patient } from "@/types/patient.types";
import type { PreviousHistoryItem } from "@/types/session.types";

const splitBullets = (text?: string) =>
  (text || "")
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

const formatVisitDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const buildWhatChanged = (
  history: PreviousHistoryItem[],
  patient: Patient | null,
) => {
  const bullets: string[] = [];
  const latest = history[0];

  if (latest?.aiNotes?.assessment?.trim()) {
    bullets.push(...splitBullets(latest.aiNotes.assessment).slice(0, 2));
  }
  if (latest?.aiNotes?.summary?.trim()) {
    bullets.push(latest.aiNotes.summary.trim());
  }
  if (patient?.allergies?.length) {
    bullets.push(
      `Allergies documented: ${patient.allergies.slice(0, 3).join(", ")}`,
    );
  }
  if (history.length > 0) {
    bullets.push(
      `${history.length} prior completed visit${history.length === 1 ? "" : "s"} on record`,
    );
  }
  if (!bullets.length) {
    bullets.push("No prior visit summary available for this patient yet.");
  }

  return bullets.slice(0, 4);
};

const buildSuggestedAgenda = (history: PreviousHistoryItem[]) => {
  const planItems = splitBullets(history[0]?.aiNotes?.plan);
  if (planItems.length) return planItems.slice(0, 3);
  return [
    "Confirm chief complaint",
    "Review home medications and allergies",
    "Update vitals before consultation",
  ];
};

const buildActiveProblems = (history: PreviousHistoryItem[]) => {
  const assessment = history[0]?.aiNotes?.assessment;
  const items = splitBullets(assessment);
  if (items.length) return items.slice(0, 4);
  return ["No active problems documented from prior visits."];
};

export default function ConsultationBriefScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { data: session, isLoading, isError, refetch } = useSession(sessionId);

  const patient = useMemo(() => {
    if (!session) return null;
    return typeof session.patientId === "object"
      ? (session.patientId as Patient)
      : null;
  }, [session]);

  const history = session?.previousHistory || [];
  const whatChanged = useMemo(
    () => buildWhatChanged(history, patient),
    [history, patient],
  );
  const agenda = useMemo(() => buildSuggestedAgenda(history), [history]);
  const activeProblems = useMemo(
    () => buildActiveProblems(history),
    [history],
  );
  const medications = useMemo(() => getHomeMedications(patient), [patient]);
  const allergies = patient?.allergies?.filter(Boolean) || [];

  if (isLoading) return <LoadingScreen message="Loading pre-visit brief…" />;
  if (isError || !session || !patient) {
    return <ErrorState onRetry={refetch} title="Unable to load brief" />;
  }

  const name = getPatientFullName(patient) || "Patient";
  const age = getPatientAge(patient);
  const metaParts = [
    age !== null ? `${age} yrs` : null,
    patient.gender && patient.gender !== "unknown"
      ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
      : null,
    patient.patientCode,
  ].filter(Boolean);

  return (
    <View style={styles.screen}>
      <GlassHeader title="Pre-visit brief" showBack subtitle={name} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getPatientInitials(patient)}
              </Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.patientName}>{name}</Text>
              <Text style={styles.meta}>{metaParts.join(" · ")}</Text>
            </View>
          </View>
          <Text style={styles.hint}>
            Built from {history.length} past visit
            {history.length === 1 ? "" : "s"}
          </Text>
        </Card>

        <Section title="What changed since last visit" bullets={whatChanged} />
        <AgendaSection items={agenda} />

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Demographics</Text>
          <InfoRow label="Phone" value={patient.phoneNumber || "—"} />
          <InfoRow
            label="Date of birth"
            value={formatPatientDateOfBirth(patient.dateOfBirth)}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={18} color="#d97706" />
            <Text style={styles.sectionTitle}>Allergies</Text>
          </View>
          {allergies.length ? (
            allergies.map((allergy) => (
              <View key={allergy} style={styles.allergyChip}>
                <Text style={styles.allergyText}>{allergy}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyHint}>No allergies recorded.</Text>
          )}
        </Card>

        <Section title="Active problems" bullets={activeProblems} />

        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visit history</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {history.length} visit{history.length === 1 ? "" : "s"}
              </Text>
            </View>
          </View>
          {history.length === 0 ? (
            <Text style={styles.emptyHint}>No completed visit history yet.</Text>
          ) : (
            history.map((visit) => (
              <View key={visit.sessionId} style={styles.visitRow}>
                <View style={styles.visitMain}>
                  <Text style={styles.visitDate}>
                    {formatVisitDate(visit.completedAt)}
                  </Text>
                  <Text style={styles.visitTitle}>
                    {visit.title || "Consultation"}
                  </Text>
                  {visit.aiNotes?.summary ? (
                    <Text style={styles.visitSummary} numberOfLines={2}>
                      {visit.aiNotes.summary}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.signedBadge}>Signed</Text>
              </View>
            ))
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Home medications</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {medications.length} active
              </Text>
            </View>
          </View>
          {medications.length ? (
            medications.map((med) => (
              <Text key={med} style={styles.medLine}>
                Rx {med}
              </Text>
            ))
          ) : (
            <Text style={styles.emptyHint}>No home medications recorded.</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: spacing.sm }]}>
            Today&apos;s vitals
          </Text>
          <SessionVitalsInlineGrid
            sessionId={sessionId!}
            vitals={session.vitals}
            editable
          />
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Enter workspace"
          onPress={() =>
            router.push(
              getDoctorWorkspacePath(sessionId!, session.status) as never,
            )
          }
        />
      </View>
    </View>
  );
}

function Section({
  title,
  bullets,
}: {
  title: string;
  bullets: string[];
}) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {bullets.map((line) => (
        <Text key={line} style={styles.bullet}>
          • {line}
        </Text>
      ))}
    </Card>
  );
}

function AgendaSection({ items }: { items: string[] }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Suggested agenda</Text>
      <View style={styles.agendaWrap}>
        {items.map((item) => (
          <View key={item} style={styles.agendaChip}>
            <Text style={styles.agendaChipText}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  card: { gap: spacing.sm },
  heroCard: { gap: spacing.sm },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...typography.bodyMedium, color: colors.primary },
  heroText: { flex: 1 },
  patientName: { ...typography.heading, color: colors.foreground },
  meta: { ...typography.caption, color: colors.muted },
  hint: { ...typography.caption, color: colors.muted, marginTop: 4 },
  sectionTitle: { ...typography.heading, color: colors.foreground, marginBottom: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: 4,
  },
  bullet: { ...typography.body, color: colors.foreground, lineHeight: 22 },
  agendaWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  agendaChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  agendaChipText: { ...typography.caption, color: colors.primary },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 4,
  },
  infoLabel: { ...typography.caption, color: colors.muted },
  infoValue: { ...typography.bodyMedium, color: colors.foreground, flexShrink: 1 },
  allergyChip: {
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: 4,
  },
  allergyText: { ...typography.body, color: colors.danger },
  emptyHint: { ...typography.body, color: colors.muted },
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countBadgeText: { ...typography.caption, color: colors.primary },
  visitRow: {
    flexDirection: "row",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  visitMain: { flex: 1, minWidth: 0 },
  visitDate: { ...typography.bodyMedium, color: colors.foreground },
  visitTitle: { ...typography.caption, color: colors.muted },
  visitSummary: { ...typography.caption, color: colors.muted, marginTop: 4 },
  signedBadge: {
    ...typography.caption,
    color: "#047857",
    alignSelf: "flex-start",
  },
  medLine: { ...typography.body, color: colors.foreground, lineHeight: 22 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
