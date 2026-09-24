import { Platform } from "react-native";
import { recordingService } from "@/services/recording.service";
import { sessionService } from "@/services/session.service";
import type { Session } from "@/types/session.types";
import type { UploadUrlResponse } from "@/types/recording.types";

const UPLOAD_TIMEOUT_MS = 8 * 60 * 1000;

const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);

/**
 * Upload flow (matches web `recording-segment-upload.ts`):
 * 1. Set status uploading
 * 2. Presigned S3 PUT when possible
 * 3. On CORS / network failure → multipart upload through API (server → S3)
 * 4. Complete recording
 */
export async function uploadRecording(
  sessionId: string,
  uri: string,
  duration: number,
  onProgress?: (progress: number) => void,
): Promise<Session> {
  return withTimeout(
    uploadRecordingInternal(sessionId, uri, duration, onProgress),
    UPLOAD_TIMEOUT_MS,
    "Upload timed out. Check your connection and try again.",
  );
}

async function uploadRecordingInternal(
  sessionId: string,
  uri: string,
  duration: number,
  onProgress?: (progress: number) => void,
): Promise<Session> {
  onProgress?.(0.02);
  await sessionService.updateStatus(sessionId, "uploading");
  onProgress?.(0.15);

  const fileName = `recording-${sessionId}-${Date.now()}.m4a`;
  const mimeType = "audio/m4a";

  const uploadConfig = await recordingService.getUploadUrl(
    sessionId,
    fileName,
    mimeType,
  );
  onProgress?.(0.3);

  const canTryDirectS3 =
    uploadConfig.mode === "s3" &&
    uploadConfig.uploadUrl &&
    Platform.OS !== "web";

  if (canTryDirectS3) {
    try {
      const session = await uploadViaPresignedPut({
        sessionId,
        uri,
        duration,
        mimeType,
        uploadConfig,
        onProgress,
      });
      onProgress?.(1);
      return session;
    } catch (error) {
      console.warn(
        "[upload] Direct S3 upload failed; falling back to API upload",
        error,
      );
    }
  } else if (
    uploadConfig.mode === "s3" &&
    uploadConfig.uploadUrl &&
    Platform.OS === "web"
  ) {
    console.warn(
      "[upload] Skipping direct S3 on web (bucket CORS); using API upload",
    );
  }

  onProgress?.(0.55);
  const session = await recordingService.uploadFile(
    sessionId,
    uri,
    duration,
    fileName,
    mimeType,
    onProgress,
  );
  onProgress?.(1);
  return session;
}

async function uploadViaPresignedPut(params: {
  sessionId: string;
  uri: string;
  duration: number;
  mimeType: string;
  uploadConfig: UploadUrlResponse;
  onProgress?: (progress: number) => void;
}): Promise<Session> {
  const { sessionId, uri, duration, mimeType, uploadConfig, onProgress } =
    params;

  const fileResponse = await fetch(uri);
  if (!fileResponse.ok) {
    throw new Error(`Could not read recording file (${fileResponse.status})`);
  }
  const blob = await fileResponse.blob();
  onProgress?.(0.5);

  const response = await fetch(uploadConfig.uploadUrl!, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: blob,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed (${response.status})`);
  }

  onProgress?.(0.85);

  return recordingService.complete(sessionId, {
    key: uploadConfig.key || undefined,
    audioUrl: uploadConfig.audioUrl || undefined,
    duration,
    contentType: mimeType,
  });
}
