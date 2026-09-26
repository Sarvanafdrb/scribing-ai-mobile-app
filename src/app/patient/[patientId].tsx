import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingScreen, ErrorState } from "@/components/ui/EmptyState";
import { PatientFormFields } from "@/components/patients/PatientFormFields";
import { usePatient } from "@/hooks/patients/usePatients";
import { usePatientMutations } from "@/hooks/patients/usePatientMutations";
import { useSessionMutations } from "@/hooks/sessions/useSessionMutations";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useTenantScope } from "@/hooks/useTenantScope";
import { useAuthStore } from "@/store/auth.store";
import {
  formValuesToUpdatePayload,
  mapPatientToFormValues,
  patientFormSchema,
  type PatientFormValues,
} from "@/lib/patientForm.schema";
import {
  formatPatientDateOfBirth,
  getHomeMedications,
  getPatientAge,
  getPatientFullName,
  getPatientId,
} from "@/utils/patient.utils";
import { getApiErrorMessage } from "@/utils/apiError.utils";
import { showToast } from "@/store/toast.store";
import { colors, spacing, typography } from "@/theme";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "—"}</Text>
    </View>
  );
}

export default function PatientProfileScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { organizationId } = useTenantScope();
  const user = useAuthStore((s) => s.user);
  const { canEditPatient } = useAccessControl();
  const { createSession } = useSessionMutations();
  const { updatePatient } = usePatientMutations();
  const { data: patient, isLoading, isError, refetch } = usePatient(patientId);

  const editable = canEditPatient();
  const [isEditing, setIsEditing] = useState(false);
  const [starting, setStarting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "male",
      phoneNumber: "",
      age: "",
      email: "",
      address: "",
      bloodGroup: "",
      allergies: "",
    },
  });

  const gender = watch("gender");
  const bloodGroup = watch("bloodGroup");

  useEffect(() => {
    if (patient && !isEditing) {
      reset(mapPatientToFormValues(patient));
    }
  }, [patient, isEditing, reset]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, []);

  if (isLoading) return <LoadingScreen message="Loading patient…" />;
  if (isError || !patient) {
    return <ErrorState onRetry={refetch} title="Patient not found" />;
  }

  const name = getPatientFullName(patient);
  const age = getPatientAge(patient);
  const id = getPatientId(patient);
  const saving = updatePatient.isPending;
  const homeMeds = getHomeMedications(patient);

  const startEditing = () => {
    reset(mapPatientToFormValues(patient));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    reset(mapPatientToFormValues(patient));
    setIsEditing(false);
  };

  const onSave = handleSubmit(async (data) => {
    if (!id) return;
    try {
      await updatePatient.mutateAsync({
        id,
        data: formValuesToUpdatePayload(data),
      });
      setIsEditing(false);
      showToast({
        title: "Updated",
        message: "Patient details saved.",
        variant: "success",
      });
    } catch (error: unknown) {
      Alert.alert(
        "Could not save",
        getApiErrorMessage(error, "Failed to update patient."),
      );
    }
  });

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
      Alert.alert(
        "Start failed",
        getApiErrorMessage(error, "Could not start consultation."),
      );
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <GlassHeader
        title={isEditing ? "Edit patient" : "Patient details"}
        showBack
        subtitle={isEditing ? watch("firstName") || name : name}
        right={
          editable && !isEditing ? (
            <Pressable onPress={startEditing} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          ) : editable && isEditing ? (
            <Pressable onPress={cancelEditing} hitSlop={8} disabled={saving}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </Pressable>
          ) : null
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                insets.bottom +
                (isEditing ? spacing["5xl"] : 120) +
                spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {!isEditing ? (
            <>
              <Card style={styles.hero}>
                <Text style={styles.patientName}>{name}</Text>
                <Text style={styles.meta}>
                  {[
                    age !== null ? `${age} yrs` : null,
                    patient.gender,
                    patient.patientCode,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </Card>

              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <DetailRow label="Phone" value={patient.phoneNumber} />
                <DetailRow label="Email" value={patient.email || ""} />
                <DetailRow label="Address" value={patient.address || ""} />
              </Card>

              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Clinical</Text>
                <DetailRow
                  label="Date of birth"
                  value={formatPatientDateOfBirth(patient.dateOfBirth)}
                />
                <DetailRow label="Blood group" value={patient.bloodGroup || ""} />
                <DetailRow
                  label="Allergies"
                  value={(patient.allergies || []).join(", ")}
                />
                <DetailRow
                  label="Home medications"
                  value={homeMeds.join(", ")}
                />
              </Card>

              {editable ? (
                <Text style={styles.editHint}>
                  Tap Edit to update this patient inline.
                </Text>
              ) : null}

              <Button
                title="View visit history"
                variant="outline"
                onPress={() => router.push(`/patient/${id}/history` as never)}
              />
            </>
          ) : (
            <Card style={styles.editCard}>
              <PatientFormFields
                control={control}
                errors={errors}
                setValue={setValue}
                gender={gender}
                bloodGroup={bloodGroup}
                loading={saving}
                onFocusAddress={scrollToBottom}
                onFocusAllergies={scrollToBottom}
              />
            </Card>
          )}
        </ScrollView>

        {isEditing ? (
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <Button
              title={saving ? "Saving…" : "Save changes"}
              onPress={() => void onSave()}
              disabled={saving}
            />
          </View>
        ) : (
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <Button
              title="Start consultation"
              loading={starting}
              onPress={startConsultation}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.md },
  editLink: { ...typography.bodyMedium, color: colors.primary },
  cancelLink: { ...typography.bodyMedium, color: colors.muted },
  hero: { gap: spacing.sm },
  patientName: { ...typography.title, color: colors.foreground, fontSize: 22 },
  meta: { ...typography.body, color: colors.muted, textTransform: "capitalize" },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.heading, color: colors.foreground },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: { ...typography.caption, color: colors.muted, flex: 1 },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.foreground,
    flex: 1.2,
    textAlign: "right",
  },
  editHint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "center",
  },
  editCard: { paddingVertical: spacing.sm },
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
