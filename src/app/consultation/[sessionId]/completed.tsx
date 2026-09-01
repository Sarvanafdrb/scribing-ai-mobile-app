import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SessionSmsPanel } from "@/components/consultation/SessionSmsPanel";
import { useSession } from "@/hooks/sessions/useSession";
import { getPatientFromSession } from "@/hooks/doctor/useDoctorQueue";
import { getPatientFullName } from "@/utils/patient.utils";
import { LoadingScreen } from "@/components/ui/EmptyState";
import { colors, spacing, typography } from "@/theme";

export default function CompletedScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { data: session, isLoading } = useSession(sessionId);

  if (isLoading) return <LoadingScreen />;

  const patient = session ? getPatientFromSession(session) : null;

  return (
    <View style={styles.screen}>
      <GlassHeader title="Completed" />
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + spacing["2xl"] },
        ]}
      >
        <Card style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>
          <Text style={styles.title}>Consultation saved</Text>
          <Text style={styles.subtitle}>
            {patient
              ? `${getPatientFullName(patient)}'s consultation has been completed.`
              : "The consultation has been completed successfully."}
          </Text>
          {sessionId && session ? (
            <SessionSmsPanel
              sessionId={sessionId}
              session={session}
              patient={patient}
            />
          ) : null}
          <Button
            title="Back to Home"
            onPress={() => router.replace("/(tabs)")}
          />
          <Button
            title="View Notes"
            variant="outline"
            onPress={() => router.replace(`/consultation/${sessionId}/preview`)}
          />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  card: { alignItems: "center", gap: spacing.md },
  iconWrap: { marginBottom: spacing.sm },
  title: { ...typography.heading, color: colors.foreground, textAlign: "center" },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
