import React from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Input } from "@/components/ui/Input";
import {
  BLOOD_GROUPS,
  type PatientGender,
} from "@/types/patient.types";
import type { PatientFormValues } from "@/lib/patientForm.schema";
import {
  INDIAN_MOBILE_LENGTH,
  PATIENT_AGE_MAX,
  PATIENT_AGE_MIN,
  sanitizeIndianPhoneInput,
  sanitizePatientAgeInput,
} from "@/utils/patient.utils";
import { colors, radius, spacing, typography } from "@/theme";

const GENDERS: { value: PatientGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Unknown" },
];

interface PatientFormFieldsProps {
  control: Control<PatientFormValues>;
  errors: FieldErrors<PatientFormValues>;
  setValue: UseFormSetValue<PatientFormValues>;
  gender: PatientGender;
  bloodGroup?: string;
  loading?: boolean;
  onFocusAddress?: () => void;
  onFocusAllergies?: () => void;
}

export function PatientFormFields({
  control,
  errors,
  setValue,
  gender,
  bloodGroup,
  loading = false,
  onFocusAddress,
  onFocusAllergies,
}: PatientFormFieldsProps) {
  return (
    <View style={styles.wrap}>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="First name *"
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
            label="Last name *"
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
            disabled={loading}
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
            label="Phone *"
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={INDIAN_MOBILE_LENGTH}
            placeholder="Enter mobile number"
            value={value}
            onChangeText={(text) => onChange(sanitizeIndianPhoneInput(text))}
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
            inputMode="numeric"
            maxLength={3}
            placeholder={`${PATIENT_AGE_MIN}-${PATIENT_AGE_MAX}`}
            value={value}
            onChangeText={(text) => onChange(sanitizePatientAgeInput(text))}
            onBlur={onBlur}
            error={errors.age?.message}
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
            label="Address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onFocus={onFocusAddress}
            editable={!loading}
          />
        )}
      />

      <Text style={styles.label}>Blood group</Text>
      <View style={styles.chipRow}>
        {BLOOD_GROUPS.map((group) => (
          <Pressable
            key={group}
            disabled={loading}
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
            onFocus={onFocusAllergies}
            editable={!loading}
            placeholder="Penicillin, Dust"
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  label: {
    ...typography.label,
    color: colors.muted,
    marginBottom: -spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: { ...typography.caption, color: colors.foreground },
  chipTextSelected: { color: colors.primary, fontWeight: "600" },
});
