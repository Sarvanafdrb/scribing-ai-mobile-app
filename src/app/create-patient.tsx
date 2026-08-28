import React, { useState } from "react";
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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { usePatientMutations } from "@/hooks/patients/usePatientMutations";
import { useSessionMutations } from "@/hooks/sessions/useSessionMutations";
import { useTenantScope } from "@/hooks/useTenantScope";
import { useAuthStore } from "@/store/auth.store";
import { BLOOD_GROUPS, type PatientGender } from "@/types/patient.types";
import { getPatientId } from "@/utils/patient.utils";
import { colors, radius, spacing, typography } from "@/theme";

const createPatientSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  gender: z.enum(["male", "female", "other", "unknown"]),
  phoneNumber: z
    .string()
    .trim()
    .min(8, "Enter a valid phone number")
    .max(20),
  age: z.string().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Invalid email",
    ),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
});

type CreatePatientForm = z.infer<typeof createPatientSchema>;

const GENDERS: { value: PatientGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Unknown" },
];

export default function CreatePatientScreen() {
  const insets = useSafeAreaInsets();
  const { organizationId } = useTenantScope();
  const user = useAuthStore((s) => s.user);
  const { createPatient } = usePatientMutations();
  const { createSession } = useSessionMutations();
  const [startConsult, setStartConsult] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreatePatientForm>({
    resolver: zodResolver(createPatientSchema),
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
  const loading = createPatient.isPending || createSession.isPending;

  const onSubmit = async (data: CreatePatientForm) => {
    if (!organizationId) {
      Alert.alert("No workspace", "Select a workspace before creating patients.");
      return;
    }

    try {
      const ageValue = data.age?.trim() ? Number(data.age) : undefined;
      const patient = await createPatient.mutateAsync({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gender: data.gender,
        phoneNumber: data.phoneNumber.trim(),
        age: Number.isFinite(ageValue) ? ageValue : undefined,
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
        bloodGroup: (data.bloodGroup as (typeof BLOOD_GROUPS)[number]) || undefined,
        allergies: data.allergies
          ? data.allergies
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        organizationId,
      });

      const patientId = getPatientId(patient);
      const doctorId = String(user?.id || user?._id || "");

      if (startConsult && patientId && doctorId) {
        const session = await createSession.mutateAsync({
          organizationId,
          patientId,
          userId: doctorId,
          sessionType: "consultation",
          title: `Consultation · ${data.firstName} ${data.lastName}`.trim(),
        });
        const sessionId = String(session._id || session.id || "");
        if (sessionId) {
          router.replace(`/consultation/${sessionId}` as never);
          return;
        }
      }

      Alert.alert("Patient created", "The patient was added successfully.");
      router.back();
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { message?: string } };
          }
        )?.response?.data?.message || "Unable to create patient.";
      Alert.alert("Create failed", message);
    }
  };

  return (
    <View style={styles.screen}>
      <GlassHeader title="New Patient" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing["3xl"] },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Register a patient. Patient code is generated automatically.
          </Text>

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="First name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.firstName?.message}
                editable={!loading}
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Last name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.lastName?.message}
                editable={!loading}
              />
            )}
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.chip,
                  gender === option.value && styles.chipSelected,
                ]}
                onPress={() => setValue("gender", option.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    gender === option.value && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Phone"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phoneNumber?.message}
                editable={!loading}
              />
            )}
          />
          <Controller
            control={control}
            name="age"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Age (optional)"
                keyboardType="number-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!loading}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email (optional)"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                editable={!loading}
              />
            )}
          />
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Address (optional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!loading}
              />
            )}
          />

          <Text style={styles.label}>Blood group (optional)</Text>
          <View style={styles.chipRow}>
            {BLOOD_GROUPS.map((group) => (
              <Pressable
                key={group}
                style={[
                  styles.chip,
                  bloodGroup === group && styles.chipSelected,
                ]}
                onPress={() =>
                  setValue("bloodGroup", bloodGroup === group ? "" : group)
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    bloodGroup === group && styles.chipTextSelected,
                  ]}
                >
                  {group}
                </Text>
              </Pressable>
            ))}
          </View>

          <Controller
            control={control}
            name="allergies"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Allergies (comma separated)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!loading}
                placeholder="Penicillin, Dust"
              />
            )}
          />

          <Pressable
            style={styles.toggleRow}
            onPress={() => setStartConsult((prev) => !prev)}
          >
            <View
              style={[styles.checkbox, startConsult && styles.checkboxOn]}
            />
            <Text style={styles.toggleText}>
              Start consultation after creating
            </Text>
          </Pressable>

          <Button
            title="Create Patient"
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.sm },
  label: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: "600",
    marginBottom: -4,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: { ...typography.caption, color: colors.foreground },
  chipTextSelected: { color: colors.primary, fontWeight: "700" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: { ...typography.body, color: colors.foreground, flex: 1 },
});
