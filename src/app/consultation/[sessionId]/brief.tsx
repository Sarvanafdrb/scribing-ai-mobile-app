import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingScreen, ErrorState } from "@/components/ui/EmptyState";
import { useSession } from "@/hooks/sessions/useSession";
import {
  getPatientAge,
  getPatientFullName,
} from "@/utils/patient.utils";
import { getDoctorWorkspacePath } from "@/utils/doctor-navigation.utils";
import { colors, spacing, typography } from "@/theme";
import type { Patient } from "@/types/patient.types";

const splitBullets = (text?: string) =>
  (text || "")
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

export default function ConsultationBriefScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { data: session, isLoading, isError, refetch } = useSession(sessionId);

  if (isLoading) return <LoadingScreen message="Loading pre-visit brief…" />;
  if (isError || !session) {
    return <ErrorState onRetry={refetch} title="Unable to load brief" />;
  }

  const patient =
    typeof session.patientId === "object"
      ? (session.patientId as Patient)
      : null;
  const history = session.previousHistory || [];
  const latest = history[0];
  const whatChanged = [
    ...splitBullets(latest?.aiNotes?.assessment).slice(0, 2),
    latest?.aiNotes?.summary?.trim(),
    patient?.allergies?.length
      ? `Allergies: ${patient.allergies.slice(0, 3).join(", ")}`
      : null,
  ].filter(Boolean) as string[];
  const agenda =
    splitBullets(latest?.aiNotes?.plan).slice(0, 3).length > 0
      ? splitBullets(latest?.aiNotes?.plan).slice(0, 3)
      : [
          "Confirm chief complaint",
          "Review home medications and allergies",
          "Update vitals before consultation",
        ];

  const name = getPatientFullName(patient) || "Patient";
  const age = getPatientAge(patient);

  return (
    <View style={styles.screen}>
      <GlassHeader title="Pre-visit brief" showBack subtitle={name} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        <Card style={styles.card}>
          <Text style={styles.patientName}>{name}</Text>
          <Text style={styles.meta}>
            {[age !== null ? `${age} yrs` : null, patient?.patientCode]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <Text style={styles.hint}>
            Built from {history.length} past visit
            {history.length === 1 ? "" : "s"}
          </Text>
        </Card>

        <Section title="What changed" bullets={whatChanged} />
        <Section title="Suggested agenda" bullets={agenda} />
        {patient?.allergies?.length ? (
          <Section
            title="Allergies"
            bullets={patient.allergies.filter(Boolean)}
          />
        ) : null}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  card: { gap: spacing.sm },
  patientName: { ...typography.heading, color: colors.foreground },
  meta: { ...typography.caption, color: colors.muted },
  hint: { ...typography.caption, color: colors.muted, marginTop: 4 },
  sectionTitle: { ...typography.heading, color: colors.foreground, marginBottom: 4 },
  bullet: { ...typography.body, color: colors.foreground, lineHeight: 22 },
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
