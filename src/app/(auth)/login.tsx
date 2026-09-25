import React, { useEffect, useState } from "react";
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
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/auth.store";
import {
  resolvePostLoginWorkspace,
  useWorkspaceSelection,
} from "@/hooks/useWorkspaceSelection";
import { authService } from "@/services/auth.service";
import { normalizeAuthUser, toPersistedAuthUser } from "@/types/auth.types";
import { getLoginErrorMessage } from "@/features/auth/getLoginErrorMessage";
import {
  loginSchema,
  type LoginFormData,
} from "@/features/auth/login.schema";
import { API_URL, APP_NAME } from "@/constants/config";
import { pingApiHealth } from "@/utils/pingApi";
import { colors, spacing, typography } from "@/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { selectWorkspace } = useWorkspaceSelection();
  const [loading, setLoading] = useState(false);
  const [apiPing, setApiPing] = useState<"idle" | "checking" | "ok" | "fail">(
    "idle",
  );
  const [pingDetail, setPingDetail] = useState("");

  useEffect(() => {
    if (!__DEV__) return;

    let cancelled = false;
    setApiPing("checking");

    void pingApiHealth().then((result) => {
      if (cancelled) return;
      setApiPing(result.ok ? "ok" : "fail");
      setPingDetail(
        result.ok ? result.detail : `${result.url} — ${result.detail}`,
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      const result = await authService.login({
        email: data.email,
        password: data.password,
      });

      if (!result.success) {
        throw new Error(result.message || "Login failed");
      }

      const { accessToken, refreshToken, user } = result.data;

      if (!accessToken || !user) {
        throw new Error("Invalid response from server");
      }

      setAuth(
        toPersistedAuthUser(normalizeAuthUser(user))!,
        accessToken,
        refreshToken,
      );

      const { redirectTo, workspace } = await resolvePostLoginWorkspace();
      if (workspace) {
        selectWorkspace(workspace);
      }
      router.replace(redirectTo as never);
    } catch (error: unknown) {
      Alert.alert("Login failed", getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing["3xl"],
            paddingBottom: insets.bottom + spacing["2xl"],
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[colors.primaryLight, colors.background]}
          style={styles.hero}
        >
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue to your healthcare workspace
          </Text>
        </LinearGradient>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                leftIcon="mail-outline"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                placeholder="name@organization.com"
                editable={!loading}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                leftIcon="lock-closed-outline"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                placeholder="Enter your password"
                editable={!loading}
              />
            )}
          />

          <View style={styles.row}>
            <Text style={styles.hint}>Organization access is managed by your admin.</Text>
            <Link href="/(auth)/forgot-password" asChild>
              <Pressable>
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>
            </Link>
          </View>

          <Button
            title="Sign In"
            loading={loading}
            onPress={handleSubmit(onSubmit)}
            size="lg"
          />

          {__DEV__ ? (
            <View style={styles.devBlock}>
              <Text style={styles.devApi} selectable>
                API: {API_URL}
              </Text>
              <Text
                style={[
                  styles.devPing,
                  apiPing === "ok" && styles.devPingOk,
                  apiPing === "fail" && styles.devPingFail,
                ]}
              >
                {apiPing === "idle" || apiPing === "checking"
                  ? "Testing API from app…"
                  : apiPing === "ok"
                    ? `App can reach API (${pingDetail})`
                    : `App cannot reach API — ${pingDetail}`}
              </Text>
              {apiPing === "fail" && API_URL.includes("localhost") ? (
                <Text style={styles.devHint}>
                  localhost on a phone points to the phone, not your PC. Stop
                  Expo, run npm start, reload the app.
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    borderRadius: 24,
    padding: spacing["2xl"],
    marginBottom: spacing["2xl"],
    alignItems: "flex-start",
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logoLetter: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "800",
  },
  brand: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  welcome: {
    ...typography.title,
    color: colors.foreground,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.lg,
  },
  row: {
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
  },
  forgot: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  devApi: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 11,
  },
  devBlock: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  devPing: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
  },
  devPingOk: {
    color: "#15803d",
  },
  devPingFail: {
    color: colors.danger,
  },
  devHint: {
    ...typography.caption,
    fontSize: 11,
    color: colors.danger,
  },
});
