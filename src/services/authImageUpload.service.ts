import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { FileSystemUploadType } from "expo-file-system/legacy";
import { API_URL } from "@/constants/config";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import {
  buildImageUploadFormData,
  inferImageMimeType,
  prepareImageUploadUri,
} from "@/utils/imageUpload.utils";

type AuthImageUploadOptions = {
  fileName?: string;
  mimeType?: string | null;
  defaultFileName: string;
};

const authUploadHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  const token = useAuthStore.getState().token;
  const workspaceId = useWorkspaceStore.getState().selectedWorkspace?.id;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (workspaceId) headers["X-Workspace-Id"] = workspaceId;
  return headers;
};

const parseUploadFailure = (status: number, body: string): never => {
  let message = `Upload failed (HTTP ${status})`;
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message) message = parsed.message;
  } catch {
    if (body.trim()) message = body.slice(0, 200);
  }
  const error = new Error(message) as Error & {
    response?: { status: number; data: { message?: string } };
  };
  error.response = { status, data: { message } };
  throw error;
};

/** Native multipart via expo-file-system (reliable on Oppo/Android); web uses FormData + api. */
export async function uploadAuthImageMultipart(
  apiPath: string,
  fieldName: string,
  uri: string,
  options: AuthImageUploadOptions,
): Promise<unknown> {
  if (Platform.OS === "web") {
    const formData = await buildImageUploadFormData(fieldName, uri, options);
    const response = await api.post(apiPath, formData, { timeout: 120_000 });
    return response.data;
  }

  const mimeType = inferImageMimeType(
    options.mimeType,
    options.fileName || options.defaultFileName,
  );

  let uploadUri = await prepareImageUploadUri(uri, mimeType);
  if (!uploadUri.startsWith("file://")) {
    uploadUri = uploadUri.startsWith("/")
      ? `file://${uploadUri}`
      : `file:///${uploadUri}`;
  }

  const url = `${API_URL.replace(/\/$/, "")}${apiPath.startsWith("/") ? apiPath : `/${apiPath}`}`;

  const result = await FileSystem.uploadAsync(url, uploadUri, {
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName,
    mimeType,
    headers: authUploadHeaders(),
  });

  if (result.status < 200 || result.status >= 300) {
    parseUploadFailure(result.status, result.body);
  }

  try {
    return JSON.parse(result.body);
  } catch {
    throw new Error("Invalid response from server after upload");
  }
}
