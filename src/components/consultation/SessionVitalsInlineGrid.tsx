import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSessionMutations } from "@/hooks/sessions/useSessionMutations";
import type { SessionVitals } from "@/types/session.types";
import { colors, spacing, typography } from "@/theme";

type VitalFieldKey = "temp" | "bp" | "hr" | "spo2" | "weight";

const parseBloodPressure = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split("/").map((part) => part.trim());
  if (parts.length !== 2) {
    throw new Error("Enter BP as systolic/diastolic (e.g. 120/80).");
  }
  const systolic = Number(parts[0]);
  const diastolic = Number(parts[1]);
  if (
    !Number.isInteger(systolic) ||
    !Number.isInteger(diastolic) ||
    systolic <= 0 ||
    diastolic <= 0
  ) {
    throw new Error("Enter valid BP numbers (e.g. 120/80).");
  }
  return { systolic, diastolic };
};

const parsePositiveNumber = (value: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
  return num;
};

const buildVitalsPatch = (
  field: VitalFieldKey,
  value: string,
): SessionVitals | null => {
  switch (field) {
    case "bp": {
      const bloodPressure = parseBloodPressure(value);
      if (!bloodPressure) return null;
      return { bloodPressure };
    }
    case "weight": {
      const weight = parsePositiveNumber(value, "Weight");
      if (weight === null) return null;
      return { weight };
    }
    case "hr": {
      const heartRate = parsePositiveNumber(value, "Heart rate");
      if (heartRate === null) return null;
      return { heartRate: Math.round(heartRate) };
    }
    case "spo2": {
      const spo2 = parsePositiveNumber(value, "SpO2");
      if (spo2 === null) return null;
      if (spo2 > 100) throw new Error("SpO2 cannot exceed 100.");
      return { spo2: Math.round(spo2) };
    }
    case "temp": {
      const temperature = parsePositiveNumber(value, "Temperature");
      if (temperature === null) return null;
      return { temperature };
    }
    default:
      return null;
  }
};

const tryBuildVitalsPatch = (
  field: VitalFieldKey,
  value: string,
): SessionVitals | null => {
  try {
    return buildVitalsPatch(field, value.trim());
  } catch {
    return null;
  }
};

const mergeVitals = (
  base: SessionVitals | undefined,
  patch: SessionVitals,
): SessionVitals => ({
  ...base,
  ...patch,
  bloodPressure: {
    ...base?.bloodPressure,
    ...patch.bloodPressure,
  },
});

const toVitalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const normalizeVitals = (
  vitals?: SessionVitals,
): SessionVitals | undefined => {
  if (!vitals) return undefined;

  const systolic = toVitalNumber(vitals.bloodPressure?.systolic);
  const diastolic = toVitalNumber(vitals.bloodPressure?.diastolic);
  const heartRate = toVitalNumber(vitals.heartRate);
  const temperature = toVitalNumber(vitals.temperature);
  const spo2 = toVitalNumber(vitals.spo2);
  const weight = toVitalNumber(vitals.weight);

  return {
    ...vitals,
    ...(temperature !== undefined ? { temperature } : {}),
    ...(heartRate !== undefined ? { heartRate: Math.round(heartRate) } : {}),
    ...(spo2 !== undefined ? { spo2: Math.round(spo2) } : {}),
    ...(weight !== undefined ? { weight } : {}),
    ...(systolic !== undefined && diastolic !== undefined
      ? { bloodPressure: { systolic, diastolic } }
      : {}),
  };
};

const hasTemperature = (vitals?: SessionVitals) =>
  toVitalNumber(vitals?.temperature) !== undefined;

const hasBloodPressure = (vitals?: SessionVitals) =>
  toVitalNumber(vitals?.bloodPressure?.systolic) !== undefined &&
  toVitalNumber(vitals?.bloodPressure?.diastolic) !== undefined;

const hasHeartRate = (vitals?: SessionVitals) =>
  toVitalNumber(vitals?.heartRate) !== undefined;

const hasSpo2 = (vitals?: SessionVitals) =>
  toVitalNumber(vitals?.spo2) !== undefined;

const hasWeight = (vitals?: SessionVitals) =>
  toVitalNumber(vitals?.weight) !== undefined;

interface SessionVitalsInlineGridProps {
  sessionId: string;
  vitals?: SessionVitals;
  editable?: boolean;
}

export function SessionVitalsInlineGrid({
  sessionId,
  vitals,
  editable = true,
}: SessionVitalsInlineGridProps) {
  const { updateSession } = useSessionMutations();
  const [optimisticVitals, setOptimisticVitals] = useState<SessionVitals>({});
  const [editingField, setEditingField] = useState<VitalFieldKey | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [fieldDrafts, setFieldDrafts] = useState<
    Partial<Record<VitalFieldKey, string>>
  >({});
  const inputRef = useRef<TextInput>(null);
  const draftRef = useRef("");
  const savingRef = useRef(false);

  const displayVitals = useMemo(
    () => normalizeVitals(mergeVitals(vitals, optimisticVitals)),
    [vitals, optimisticVitals],
  );

  const setDraft = (value: string) => {
    draftRef.current = value;
    setDraftValue(value);
  };

  const stopEditing = () => {
    setEditingField(null);
    draftRef.current = "";
    setDraftValue("");
  };

  const commitField = (
    field: VitalFieldKey,
    rawValue: string,
    options?: { showErrorAlert?: boolean },
  ) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      stopEditing();
      return;
    }

    const patch = tryBuildVitalsPatch(field, trimmed);
    if (!patch) {
      setFieldDrafts((prev) => ({ ...prev, [field]: trimmed }));
      stopEditing();
      if (options?.showErrorAlert) {
        try {
          buildVitalsPatch(field, trimmed);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Could not save vitals.";
          Alert.alert("Vitals", message);
        }
      }
      return;
    }

    void saveField(field, trimmed, patch);
  };

  const startEditing = (field: VitalFieldKey) => {
    if (!editable || savingRef.current) return;

    if (editingField && editingField !== field) {
      commitField(editingField, draftRef.current);
    }

    const existing = fieldDrafts[field] ?? "";
    draftRef.current = existing;
    setDraftValue(existing);
    setEditingField(field);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const saveField = async (
    field: VitalFieldKey,
    trimmed: string,
    patch: SessionVitals,
  ) => {
    if (!editable || savingRef.current) return;

    const previousOptimistic = optimisticVitals;
    setOptimisticVitals((prev) => mergeVitals(prev, patch));
    stopEditing();
    setFieldDrafts((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

    savingRef.current = true;
    try {
      await updateSession.mutateAsync({
        id: sessionId,
        data: { vitals: patch },
      });
    } catch (error) {
      setOptimisticVitals(previousOptimistic);
      const message =
        error instanceof Error ? error.message : "Could not save vitals.";
      Alert.alert("Vitals", message);
      setFieldDrafts((prev) => ({ ...prev, [field]: trimmed }));
    } finally {
      savingRef.current = false;
    }
  };

  const fields: {
    key: VitalFieldKey;
    label: string;
    hasValue: boolean;
    display: string;
    keyboard: "default" | "decimal-pad";
  }[] = [
    {
      key: "temp",
      label: "Temp",
      hasValue: hasTemperature(displayVitals),
      display: hasTemperature(displayVitals)
        ? `${displayVitals!.temperature}°F`
        : "—",
      keyboard: "decimal-pad",
    },
    {
      key: "bp",
      label: "BP",
      hasValue: hasBloodPressure(displayVitals),
      display: hasBloodPressure(displayVitals)
        ? `${toVitalNumber(displayVitals!.bloodPressure!.systolic)}/${toVitalNumber(displayVitals!.bloodPressure!.diastolic)}`
        : "—",
      keyboard: "default",
    },
    {
      key: "hr",
      label: "HR",
      hasValue: hasHeartRate(displayVitals),
      display: hasHeartRate(displayVitals)
        ? `${displayVitals!.heartRate} bpm`
        : "—",
      keyboard: "decimal-pad",
    },
    {
      key: "spo2",
      label: "SpO2",
      hasValue: hasSpo2(displayVitals),
      display: hasSpo2(displayVitals) ? `${displayVitals!.spo2}%` : "—",
      keyboard: "decimal-pad",
    },
    {
      key: "weight",
      label: "Weight",
      hasValue: hasWeight(displayVitals),
      display: hasWeight(displayVitals)
        ? `${displayVitals!.weight} kg`
        : "—",
      keyboard: "decimal-pad",
    },
  ];

  return (
    <View style={styles.grid}>
      {fields.map((field) => {
        const isEditing = editingField === field.key;

        return (
          <View key={field.key} style={styles.gridItem}>
            <Text style={styles.gridLabel}>{field.label}</Text>

            {field.hasValue ? (
              <Text style={styles.gridValue}>{field.display}</Text>
            ) : isEditing ? (
              <View style={styles.valueLine}>
                <TextInput
                  ref={inputRef}
                  value={draftValue}
                  onChangeText={setDraft}
                  keyboardType={field.keyboard}
                  style={styles.inlineInput}
                  scrollEnabled={false}
                  caretHidden={false}
                  cursorColor={colors.primary}
                  selectionColor={colors.primaryLight}
                  underlineColorAndroid="transparent"
                  blurOnSubmit={false}
                  onSubmitEditing={() =>
                    commitField(field.key, draftRef.current, {
                      showErrorAlert: true,
                    })
                  }
                  returnKeyType="done"
                />
              </View>
            ) : fieldDrafts[field.key] ? (
              <Pressable
                disabled={!editable || savingRef.current}
                onPress={() => startEditing(field.key)}
                hitSlop={6}
                style={styles.valueLine}
              >
                <Text style={styles.draftValue}>{fieldDrafts[field.key]}</Text>
              </Pressable>
            ) : (
              <Pressable
                disabled={!editable || savingRef.current}
                onPress={() => startEditing(field.key)}
                hitSlop={6}
                style={styles.valueLine}
              >
                <Text style={styles.placeholderDash}>—</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const valueLineHeight = typography.bodyMedium.lineHeight;

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridItem: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 68,
  },
  gridLabel: { ...typography.caption, color: colors.muted },
  gridValue: {
    ...typography.bodyMedium,
    color: colors.foreground,
    marginTop: 4,
    lineHeight: valueLineHeight,
  },
  valueLine: {
    marginTop: 4,
    minHeight: valueLineHeight,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    width: "100%",
  },
  placeholderDash: {
    ...typography.bodyMedium,
    color: colors.mutedLight,
    lineHeight: valueLineHeight,
  },
  draftValue: {
    ...typography.bodyMedium,
    color: colors.foreground,
    lineHeight: valueLineHeight,
  },
  inlineInput: {
    flex: 1,
    width: "100%",
    minHeight: valueLineHeight,
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    textAlign: "left",
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: valueLineHeight,
    color: colors.foreground,
    ...(Platform.OS === "android"
      ? { includeFontPadding: false, textAlignVertical: "center" }
      : null),
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          boxSizing: "border-box",
          WebkitTextFillColor: colors.foreground,
        } as object)
      : null),
  },
});
