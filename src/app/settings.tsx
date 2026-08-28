import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth.store";
import { useProfileMutations } from "@/hooks/auth/useProfileMutations";
import { lastNameSchema } from "@/lib/validation";
import { resolveMediaUrl } from "@/utils/media.utils";
import { colors, spacing, typography } from "@/theme";

/** Same profile schema as web ProfileForm. */
const profileSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: lastNameSchema,
  phone: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.trim() === "" || /^[0-9]{10,15}$/.test(value),
      "Phone must be 10 to 15 digits",
    ),
  qualification: z.string().trim().max(200).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { updateProfile, uploadProfilePicture, uploadSignature } =
    useProfileMutations();
  const [previewUrl, setPreviewUrl] = useState(
    resolveMediaUrl(user?.profilePicture) || "",
  );
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState(
    resolveMediaUrl(user?.signature) || "",
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      qualification: user?.qualification || "",
    },
  });

  useEffect(() => {
    if (!user) return;
    reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      qualification: user.qualification || "",
    });
    setPreviewUrl(resolveMediaUrl(user.profilePicture) || "");
    setSignaturePreviewUrl(resolveMediaUrl(user.signature) || "");
  }, [user, reset]);

  const pickImage = async (purpose: "profile" | "signature") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to upload images.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: purpose === "profile",
      aspect: purpose === "profile" ? [1, 1] : undefined,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    const fileName =
      asset.fileName ||
      (purpose === "profile" ? "profile.jpg" : "signature.png");

    if (purpose === "profile") {
      setPreviewUrl(asset.uri);
      await uploadProfilePicture.mutateAsync({ uri: asset.uri, fileName });
    } else {
      setSignaturePreviewUrl(asset.uri);
      await uploadSignature.mutateAsync({ uri: asset.uri, fileName });
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone?.trim() || undefined,
        qualification: data.qualification?.trim() || undefined,
      });
    } catch {
      // handled in mutation
    }
  };

  const isSaving =
    updateProfile.isPending ||
    uploadProfilePicture.isPending ||
    uploadSignature.isPending;

  if (!user) return null;

  return (
    <View style={styles.screen}>
      <GlassHeader
        title="Settings"
        showBack
        subtitle="Update your personal details"
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing["3xl"] },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <View style={styles.avatarRow}>
              <View>
                <Avatar
                  name={`${user.firstName} ${user.lastName}`}
                  uri={previewUrl || user.profilePicture}
                  size={80}
                />
                <Pressable
                  style={styles.cameraBtn}
                  onPress={() => pickImage("profile")}
                  disabled={uploadProfilePicture.isPending}
                >
                  <Ionicons name="camera" size={16} color={colors.white} />
                </Pressable>
              </View>
              <View style={styles.avatarMeta}>
                <Text style={styles.name}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.email}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.signatureBox}>
              <View style={styles.signatureHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Digital Signature</Text>
                  <Text style={styles.sectionHint}>
                    Appears on AI Notes prescriptions and PDFs.
                  </Text>
                </View>
                <Button
                  title="Upload"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  loading={uploadSignature.isPending}
                  onPress={() => pickImage("signature")}
                />
              </View>
              {signaturePreviewUrl ? (
                <Image
                  source={{ uri: signaturePreviewUrl }}
                  style={styles.signatureImage}
                  contentFit="contain"
                />
              ) : (
                <Text style={styles.sectionHint}>No signature uploaded yet.</Text>
              )}
            </View>

            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="First Name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.firstName?.message}
                  editable={!isSaving}
                />
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Last Name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lastName?.message}
                  editable={!isSaving}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              )}
            />

            <Controller
              control={control}
              name="qualification"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Qualification / Education"
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.qualification?.message}
                  placeholder="e.g. MBBS, MD"
                  editable={!isSaving}
                />
              )}
            />

            <Input
              label="Email Address"
              value={user.email}
              editable={false}
            />
            <Input
              label="Role"
              value={user.roleName || user.role?.name || "—"}
              editable={false}
            />
            <Input
              label="Organization"
              value={
                user.isSuperAdmin
                  ? "Super Admin"
                  : user.organizationName || user.organization?.name || "—"
              }
              editable={false}
            />

            <Button
              title="Save Changes"
              loading={updateProfile.isPending}
              disabled={isSaving}
              onPress={handleSubmit(onSubmit)}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  card: { gap: spacing.lg },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  cameraBtn: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarMeta: { flex: 1, gap: 2 },
  name: { ...typography.heading, color: colors.foreground, fontSize: 18 },
  email: { ...typography.caption, color: colors.muted },
  signatureBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: colors.borderLight,
    gap: spacing.md,
  },
  signatureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    color: colors.foreground,
    fontWeight: "700",
  },
  sectionHint: { ...typography.caption, color: colors.muted },
  signatureImage: {
    height: 72,
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 8,
  },
});
