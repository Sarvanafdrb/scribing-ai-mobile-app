import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { Card } from "@/components/ui/Card";
import { useProfileMutations } from "@/hooks/auth/useProfileMutations";
import { useAuthStore } from "@/store/auth.store";
import { colors, spacing, typography } from "@/theme";

/** Same schema as web ChangePasswordForm. */
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((state) => state.logout);
  const { changePassword } = useProfileMutations();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setShowSuccess(true);
      reset();

      setTimeout(() => {
        logout();
        router.replace("/(auth)/login");
      }, 1500);
    } catch {
      // Error alert handled in mutation onError
    }
  };

  return (
    <View style={styles.screen}>
      <GlassHeader
        title="Change Password"
        showBack
        subtitle="Keep your workspace secure"
      />
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
          <Card style={styles.card}>
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Current Password"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.currentPassword?.message}
                  placeholder="Enter current password"
                  editable={!changePassword.isPending && !showSuccess}
                />
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New Password"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.newPassword?.message}
                  placeholder="At least 8 characters"
                  editable={!changePassword.isPending && !showSuccess}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  placeholder="Re-enter new password"
                  editable={!changePassword.isPending && !showSuccess}
                />
              )}
            />

            {showSuccess ? (
              <Text style={styles.success}>
                Password changed successfully. Redirecting to login…
              </Text>
            ) : null}

            <Button
              title="Update Password"
              loading={changePassword.isPending}
              disabled={showSuccess}
              onPress={handleSubmit(onSubmit)}
            />
          </Card>
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
    paddingTop: spacing.xl,
  },
  card: { gap: spacing.lg },
  success: {
    ...typography.body,
    color: colors.success,
  },
});
