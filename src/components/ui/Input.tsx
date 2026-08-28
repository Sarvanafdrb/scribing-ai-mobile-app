import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  isPassword,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(Boolean(isPassword));

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.container,
          focused && styles.focused,
          !!error && styles.errorBorder,
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={20}
            color={focused ? colors.primary : colors.muted}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          {...props}
          secureTextEntry={secure}
          style={[styles.input, style]}
          placeholderTextColor={colors.mutedLight}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
        {isPassword ? (
          <Pressable onPress={() => setSecure((v) => !v)} hitSlop={8}>
            <Ionicons
              name={secure ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: {
    ...typography.caption,
    color: colors.foreground,
    fontWeight: "600",
    marginBottom: 2,
  },
  container: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  focused: {
    borderColor: colors.primary,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  leftIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.foreground,
    paddingVertical: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
  },
});
