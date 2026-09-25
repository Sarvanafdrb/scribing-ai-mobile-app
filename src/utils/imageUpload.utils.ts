import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export function inferImageMimeType(
  mimeType?: string | null,
  fileName?: string,
): string {
  if (mimeType?.startsWith("image/")) return mimeType;
  const lower = (fileName || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}

export function inferImageFileName(
  fileName: string | undefined,
  mimeType: string,
  fallback: string,
): string {
  if (fileName?.includes(".")) return fileName;
  const ext = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : "jpg";
  const base = (fileName || fallback).replace(/\.[^.]+$/, "") || fallback;
  return `${base}.${ext}`;
}

/** Oppo/Android gallery often returns content:// URIs; copy to cache for reliable multipart upload. */
export async function prepareImageUploadUri(
  uri: string,
  mimeType: string,
): Promise<string> {
  if (Platform.OS !== "android") return uri;
  if (uri.startsWith("file://")) return uri;

  const ext = mimeType.includes("png") ? "png" : "jpg";
  const dest = `${FileSystem.cacheDirectory}upload-${Date.now()}.${ext}`;
  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Could not read photo from gallery";
    throw new Error(`Photo prepare failed: ${detail}`);
  }
  return dest;
}

export async function buildImageUploadFormData(
  fieldName: string,
  uri: string,
  options: {
    fileName?: string;
    mimeType?: string | null;
    defaultFileName: string;
  },
): Promise<FormData> {
  const mimeType = inferImageMimeType(
    options.mimeType,
    options.fileName || options.defaultFileName,
  );
  const name = inferImageFileName(
    options.fileName,
    mimeType,
    options.defaultFileName,
  );
  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Could not read image (${response.status})`);
    }
    const blob = await response.blob();
    const type = blob.type?.startsWith("image/") ? blob.type : mimeType;
    const file =
      typeof File !== "undefined"
        ? new File([blob], name, { type })
        : blob;
    formData.append(fieldName, file as Blob, name);
    return formData;
  }

  const uploadUri = await prepareImageUploadUri(uri, mimeType);
  formData.append(fieldName, {
    uri: uploadUri,
    name,
    type: mimeType,
  } as unknown as Blob);

  return formData;
}
