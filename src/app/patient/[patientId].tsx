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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingScreen, ErrorState } from "@/components/ui/EmptyState";
import { usePatient } from "@/hooks/patients/usePatients";
import { useSessionMutations } from "@/hooks/sessions/useSessionMutations";
import { useTenantScope } from "@/hooks/useTenantScope";
import { useAuthStore } from "@/store/auth.store";
import {
  getPatientAge,
  getPatientFullName,
  getPatientId,
} from "@/utils/patient.utils";
import { colors, spacing, typography } from "@/theme";

export default function PatientProfileScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const insets = useSafeAreaInsets();
  const { organizationId } = useTenantScope();
  const user = useAuthStore((s) => s.user);
  const { createSession } = useSessionMutations();
  const { data: patient, isLoading, isError, refetch } = usePatient(patientId);
  const [starting, setStarting] = useState(false);

  if (isLoading) return <LoadingScreen message="Loading patient…" />;
  if (isError || !patient) {
    return <ErrorState onRetry={refetch} title="Patient not found" />;
  }

  const name = getPatientFullName(patient);
  const age = getPatientAge(patient);
  const id = getPatientId(patient);

  const startConsultation = async () => {
    const doctorId = String(user?.id || user?._id || "");
    if (!organizationId || !id || !doctorId) {
      Alert.alert("Unable to start", "Missing workspace or doctor context.");
      return;
    }
    try {
      setStarting(true);
      const session = await createSession.mutateAsync({
        organizationId,
        patientId: id,
        userId: doctorId,
        sessionType: "consultation",
        title: `Consultation · ${name}`,
      });
      const sessionId = String(session._id || session.id || "");
      router.push(`/consultation/${sessionId}/brief` as never);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Could not start consultation.";
      Alert.alert("Start failed", message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <GlassHeader title="Patient" showBack subtitle={name} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        <Card style={styles.card}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {[age !== null ? `${age} yrs` : null, patient.gender, patient.patientCode]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          {patient.phone ? (
            <Text style={styles.meta}>Phone: {patient.phone}</Text>
          ) : null}
        </Card>

        {patient.allergies?.length ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Allergies</Text>
            {patient.allergies.map((a) => (
              <Text key={a} style={styles.line}>
                • {a}
              </Text>
            ))}
          </Card>
        ) : null}

        <Button
          title="View visit history"
          variant="outline"
          onPress={() => router.push(`/patient/${id}/history` as never)}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Start consultation"
          loading={starting}
          onPress={startConsultation}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  card: { gap: spacing.sm },
  name: { ...typography.heading, color: colors.foreground },
  meta: { ...typography.caption, color: colors.muted },
  sectionTitle: { ...typography.bodyMedium, color: colors.foreground },
  line: { ...typography.body, color: colors.foreground },
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
