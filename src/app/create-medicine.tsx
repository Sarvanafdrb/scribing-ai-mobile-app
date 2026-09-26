import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Button } from "@/components/ui/Button";
import { MedicineFormFields } from "@/components/medicines/MedicineFormFields";
import { useMedicineMutations } from "@/hooks/medicines/useMedicineMutations";
import { useMedicineFormState } from "@/hooks/medicines/useMedicineFormState";
import { useTenantScope } from "@/hooks/useTenantScope";
import { validateMedicineForm } from "@/utils/medicineFormValidation.utils";
import {
  getApiErrorMessage,
  isMedicineDuplicateError,
} from "@/utils/apiError.utils";
import { showToast } from "@/store/toast.store";
import { colors, spacing } from "@/theme";

export default function CreateMedicineScreen() {
  const insets = useSafeAreaInsets();
  const { organizationId } = useTenantScope();
  const { createMedicine } = useMedicineMutations();
  const {
    fields,
    setFields,
    conditionDraft,
    setConditionDraft,
    genericNameTouchedRef,
    addCondition,
    removeCondition,
  } = useMedicineFormState();

  const handleSave = async () => {
    const result = validateMedicineForm(
      fields,
      conditionDraft,
      organizationId || "",
    );
    if (!result.ok) {
      Alert.alert(result.title, result.message);
      return;
    }

    try {
      await createMedicine.mutateAsync(result.payload);
      router.replace("/medicines" as never);
      showToast({
        title: "Saved",
        message: "Medicine added to your organization catalog.",
        variant: "success",
      });
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        "Failed to create medicine.",
      );
      if (isMedicineDuplicateError(message)) {
        showToast({
          title: "Already added",
          message,
          variant: "error",
          durationMs: 5000,
        });
        return;
      }
      Alert.alert("Could not save", message);
    }
  };

  const loading = createMedicine.isPending;

  return (
    <View style={styles.screen}>
      <GlassHeader title="Add medicine" showBack subtitle="Organization formulary" />
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
          <MedicineFormFields
            fields={fields}
            setFields={setFields}
            conditionDraft={conditionDraft}
            setConditionDraft={setConditionDraft}
            genericNameTouchedRef={genericNameTouchedRef}
            loading={loading}
            onAddCondition={addCondition}
            onRemoveCondition={removeCondition}
          />
          <Button
            title={loading ? "Saving…" : "Save medicine"}
            onPress={() => void handleSave()}
            disabled={loading}
            style={{ marginTop: spacing.lg }}
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
  },
});
