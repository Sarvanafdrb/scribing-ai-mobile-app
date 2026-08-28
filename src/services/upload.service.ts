import { recordingService } from "@/services/recording.service";
import { sessionService } from "@/services/session.service";
import type { Session } from "@/types/session.types";

/**
 * Same upload algorithm as the web DoctorRecordingPanel:
 * 1. Set status uploading
 * 2. Get upload URL
 * 3. S3 PUT or local multipart
 * 4. Complete recording
 */
export async function uploadRecording(
  sessionId: string,
  uri: string,
  duration: number,
  onProgress?: (progress: number) => void,
): Promise<Session> {
  onProgress?.(0.05);
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

  if (uploadConfig.mode === "s3" && uploadConfig.uploadUrl) {
    const fileResponse = await fetch(uri);
    const blob = await fileResponse.blob();
    onProgress?.(0.5);

    const response = await fetch(uploadConfig.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType },
      body: blob,
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed (${response.status})`);
    }

    onProgress?.(0.85);

    const session = await recordingService.complete(sessionId, {
      key: uploadConfig.key || undefined,
      audioUrl: uploadConfig.audioUrl || undefined,
      duration,
      contentType: mimeType,
    });

    onProgress?.(1);
    return session;
  }

  onProgress?.(0.55);
  const session = await recordingService.uploadFile(
    sessionId,
    uri,
    duration,
    fileName,
    mimeType,
  );
  onProgress?.(1);
  return session;
}
