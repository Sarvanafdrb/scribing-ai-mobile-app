import React from "react";
import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function ConsultationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="brief" />
      <Stack.Screen name="recording" />
      <Stack.Screen name="uploading" options={{ gestureEnabled: false }} />
      <Stack.Screen name="processing" options={{ gestureEnabled: false }} />
      <Stack.Screen name="transcript" />
      <Stack.Screen name="notes" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="completed" />
    </Stack>
  );
}
