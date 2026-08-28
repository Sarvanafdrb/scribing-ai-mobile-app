import React from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, shadows } from "@/theme";

interface FabProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function FloatingActionButton({
  icon = "add",
  onPress,
  style,
}: FabProps) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.fab,
        shadows.fab,
        { bottom: Math.max(insets.bottom, 16) + 64 },
        style,
      ]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={28} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
