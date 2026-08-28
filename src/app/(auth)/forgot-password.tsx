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
import { authService } from "@/services/auth.service";
import { strictEmailSchema } from "@/lib/validation";
import { colors, spacing, typography } from "@/theme";

const forgotSchema = z.object({
  email: strictEmailSchema,
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
      Alert.alert(
        "Check your email",
        "If an account exists for that email, password reset instructions were sent.",
      );
    } catch {
      Alert.alert(
        "Request failed",
        "Unable to send reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <GlassHeader title="Forgot password" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing["2xl"] },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter your work email and we will send reset instructions if an
            account exists.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                leftIcon="mail-outline"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                placeholder="name@organization.com"
                editable={!loading}
              />
            )}
          />

          <Button
            title={sent ? "Resend email" : "Send reset link"}
            loading={loading}
            onPress={handleSubmit(onSubmit)}
          />
          <Button
            title="Back to Sign In"
            variant="outline"
            onPress={() => router.replace("/(auth)/login")}
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
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  title: { ...typography.heading, color: colors.foreground },
  subtitle: { ...typography.body, color: colors.muted },
});
