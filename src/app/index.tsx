import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import { APP_NAME } from "@/constants/config";
import { colors, spacing, typography } from "@/theme";

export default function SplashScreen() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const workspaceHydrated = useWorkspaceStore((s) => s._hasHydrated);
  const token = useAuthStore((s) => s.token);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withTiming(1, { duration: 700 });
  }, [opacity, scale]);

  useEffect(() => {
    if (!hasHydrated || !workspaceHydrated) return;

    const timer = setTimeout(() => {
      if (token) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [hasHydrated, workspaceHydrated, token]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <LinearGradient
      colors={["#1D4ED8", "#2563EB", "#0F766E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>S</Text>
        </View>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>Clinical documentation, reimagined</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: spacing.md,
  },
  logoMark: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.white,
  },
  title: {
    ...typography.title,
    color: colors.white,
  },
  subtitle: {
    ...typography.body,
    color: "rgba(255,255,255,0.8)",
  },
});
