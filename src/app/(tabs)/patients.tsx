import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePatients } from "@/hooks/patients/usePatients";
import { useSessionMutations } from "@/hooks/sessions/useSessionMutations";
import { useTenantScope } from "@/hooks/useTenantScope";
import { useAuthStore } from "@/store/auth.store";
import { SearchInput } from "@/components/ui/SearchInput";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { PatientCard } from "@/components/patients/PatientCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { getPatientFullName, getPatientId } from "@/utils/patient.utils";
import type { Patient } from "@/types/patient.types";
import { colors, spacing, typography } from "@/theme";

export default function PatientsScreen() {
  const insets = useSafeAreaInsets();
  const { organizationId } = useTenantScope();
  const user = useAuthStore((s) => s.user);
  const { createSession } = useSessionMutations();
  const [search, setSearch] = useState("");
  const [startingId, setStartingId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      organizationId,
      search: search.trim() || undefined,
      isActive: "true",
      page: 1,
      limit: 50,
    }),
    [organizationId, search],
  );

  const { data, isLoading, isError, refetch, isRefetching } = usePatients(
    filters,
    Boolean(organizationId),
  );

  const startConsultation = async (patient: Patient) => {
    const patientId = getPatientId(patient);
    const doctorId = String(user?.id || user?._id || "");
    if (!organizationId || !patientId || !doctorId) {
      Alert.alert("Unable to start", "Missing workspace or doctor context.");
      return;
    }

    try {
      setStartingId(patientId);
      const session = await createSession.mutateAsync({
        organizationId,
        patientId,
        userId: doctorId,
        sessionType: "consultation",
        title: `Consultation · ${getPatientFullName(patient)}`,
      });
      const sessionId = String(session._id || session.id || "");
      if (!sessionId) throw new Error("Missing session id");
      router.push(`/consultation/${sessionId}` as never);
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { message?: string } };
          }
        )?.response?.data?.message || "Could not start consultation.";
      Alert.alert("Start failed", message);
    } finally {
      setStartingId(null);
    }
  };

  const onPatientPress = (patient: Patient) => {
    Alert.alert(getPatientFullName(patient), "What would you like to do?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start Consultation",
        onPress: () => startConsultation(patient),
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search patients…"
        />
      </View>

      {isLoading ? (
        <View style={styles.listPad}>
          <SkeletonCard />
          <View style={{ height: 12 }} />
          <SkeletonCard />
        </View>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={data?.patients || []}
          keyExtractor={(item) => item.id || item._id || item.patientCode}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No patients found"
              description="Create a patient to start a consultation."
            />
          }
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              subtitle={
                startingId === getPatientId(item)
                  ? "Starting consultation…"
                  : undefined
              }
              onPress={() => onPatientPress(item)}
            />
          )}
        />
      )}

      <FloatingActionButton
        icon="person-add"
        onPress={() => router.push("/create-patient" as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.foreground, fontSize: 28 },
  listPad: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    flexGrow: 1,
  },
});
