import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { normalizeAuthUser } from "@/types/auth.types";

const extractUser = (response: unknown) => {
  const data = response as {
    data?: { user?: unknown } | unknown;
    user?: unknown;
  };
  return data?.data && typeof data.data === "object" && "user" in (data.data as object)
    ? (data.data as { user: unknown }).user
    : (data?.data as unknown) || data?.user || data;
};

export const useProfileMutations = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const updateProfile = useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      phone?: string;
      qualification?: string;
    }) => authService.updateProfile(data),
    onSuccess: (response) => {
      const userData = extractUser(response);
      setUser(normalizeAuthUser(userData as Parameters<typeof normalizeAuthUser>[0]));
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      Alert.alert("Success", "Profile updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update profile";
      Alert.alert("Update failed", message);
    },
  });

  const uploadProfilePicture = useMutation({
    mutationFn: ({ uri, fileName }: { uri: string; fileName?: string }) =>
      authService.uploadProfilePicture(uri, fileName),
    onSuccess: (response) => {
      const userData = extractUser(response);
      setUser(normalizeAuthUser(userData as Parameters<typeof normalizeAuthUser>[0]));
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      Alert.alert("Success", "Profile picture updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to upload profile picture";
      Alert.alert("Upload failed", message);
    },
  });

  const uploadSignature = useMutation({
    mutationFn: ({ uri, fileName }: { uri: string; fileName?: string }) =>
      authService.uploadSignature(uri, fileName),
    onSuccess: (response) => {
      const userData = extractUser(response);
      setUser(normalizeAuthUser(userData as Parameters<typeof normalizeAuthUser>[0]));
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      Alert.alert("Success", "Signature updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to upload signature";
      Alert.alert("Upload failed", message);
    },
  });

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
    onSuccess: () => {
      Alert.alert(
        "Password changed",
        "Password changed successfully. Please log in again.",
      );
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to change password";
      Alert.alert("Change failed", message);
    },
  });

  return {
    updateProfile,
    uploadProfilePicture,
    uploadSignature,
    changePassword,
  };
};
