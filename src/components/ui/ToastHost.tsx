import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useToastStore } from "@/store/toast.store";
import { colors, radius, shadows, spacing, typography } from "@/theme";

const ICONS: Record<
  string,
  { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  success: {
    name: "checkmark-circle",
    color: "#047857",
    bg: "#D1FAE5",
  },
  error: {
    name: "alert-circle",
    color: colors.danger,
    bg: colors.dangerLight,
  },
  info: {
    name: "information-circle",
    color: colors.primary,
    bg: colors.primaryLight,
  },
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const visible = useToastStore((s) => s.visible);
  const title = useToastStore((s) => s.title);
  const message = useToastStore((s) => s.message);
  const variant = useToastStore((s) => s.variant);
  const hide = useToastStore((s) => s.hide);

  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-120, { duration: 180 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const icon = ICONS[variant] || ICONS.info;

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[styles.host, { top: insets.top + spacing.sm }, animatedStyle]}
    >
      <Pressable style={styles.card} onPress={hide}>
        <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.textWrap}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <Text style={styles.message}>{message}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    elevation: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: {
    ...typography.bodyMedium,
    color: colors.foreground,
    marginBottom: 2,
  },
  message: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
});
