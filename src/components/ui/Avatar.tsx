import React from "react";
import { StyleSheet, Text, View, ViewStyle, StyleProp } from "react-native";
import { Image } from "expo-image";
import { colors, radius, typography } from "@/theme";
import { resolveMediaUrl } from "@/utils/media.utils";

interface AvatarProps {
  name?: string;
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

export function Avatar({
  name = "?",
  uri,
  size = 48,
  style,
  backgroundColor = colors.primaryLight,
}: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const mediaUri = resolveMediaUrl(uri);

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      {mediaUri ? (
        <Image
          source={{ uri: mediaUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>
          {initials || "?"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  initials: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: "700",
  },
});
