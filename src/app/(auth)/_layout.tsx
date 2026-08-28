import React, { useEffect } from "react";
import { Stack, router, usePathname } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { isDoctorUser } from "@/types/auth.types";
import { colors } from "@/theme";

const PUBLIC_AUTH_PATHS = ["/login", "/forgot-password", "/reset-password"];

export default function AuthLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const isAuthenticated = !!token;
  const isPublicAuthPage = PUBLIC_AUTH_PATHS.some((path) =>
    pathname.includes(path),
  );

  useEffect(() => {
    if (!isAuthenticated || !isPublicAuthPage) return;
    // Same bounce rule as web auth layout
    router.replace(isDoctorUser(user) ? "/(tabs)" : "/(tabs)");
  }, [isAuthenticated, isPublicAuthPage, user]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade",
      }}
    />
  );
}
