import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, spacing, typography } from "@/theme";
import { Platform } from "react-native";

interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  transparent?: boolean;
}

export function GlassHeader({
  title,
  subtitle,
  showBack,
  onBack,
  right,
}: GlassHeaderProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.inner, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={onBack || (() => router.back())}
            style={styles.back}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={40} tint="light" style={styles.blur}>
        {content}
      </BlurView>
    );
  }

  return <View style={styles.android}>{content}</View>;
}

const styles = StyleSheet.create({
  blur: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  android: {
    backgroundColor: colors.glass,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.borderLight,
  },
  backPlaceholder: {
    width: 8,
  },
  titles: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    color: colors.foreground,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  right: {
    minWidth: 36,
    alignItems: "flex-end",
  },
});
