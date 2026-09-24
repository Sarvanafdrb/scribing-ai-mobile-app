import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryProvider } from "@/providers/QueryProvider";
import { colors } from "@/theme";
import "../../global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="access-not-assigned" />
            <Stack.Screen
              name="settings"
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="change-password"
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="create-patient"
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="consultation/[sessionId]"
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="patient/[patientId]"
              options={{ animation: "slide_from_right" }}
            />
          </Stack>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
