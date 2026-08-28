import { api } from "@/services/api";
import {
  CompleteRecordingData,
  PlaybackUrlResponse,
  UploadUrlResponse,
} from "@/types/recording.types";
import { Session } from "@/types/session.types";
import { getUploadsBaseUrl } from "@/utils/media.utils";

export { getUploadsBaseUrl };

export const resolveAudioUrl = (audioUrl: string): string => {
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    return audioUrl;
  }

  const base = getUploadsBaseUrl();
  const normalizedPath = audioUrl.startsWith("/") ? audioUrl : `/${audioUrl}`;
  return `${base}${normalizedPath}`;
};

export const recordingService = {
  start: async (sessionId: string): Promise<Session> => {
    const response = await api.post(`/sessions/${sessionId}/recording/start`);
    return response.data.data;
  },

  getUploadUrl: async (
    sessionId: string,
    fileName: string,
    contentType: string,
  ): Promise<UploadUrlResponse> => {
    const response = await api.post(
      `/sessions/${sessionId}/recording/upload-url`,
      { fileName, contentType },
    );
    return response.data.data;
  },

  complete: async (
    sessionId: string,
    data: CompleteRecordingData,
  ): Promise<Session> => {
    const response = await api.post(
      `/sessions/${sessionId}/recording/complete`,
      data,
    );
    return response.data.data;
  },

  uploadFile: async (
    sessionId: string,
    uri: string,
    duration: number,
    fileName = "recording.m4a",
    mimeType = "audio/m4a",
  ): Promise<Session> => {
    const formData = new FormData();
    formData.append("audio", {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
    formData.append("duration", String(Math.round(duration)));

    const response = await api.post(
      `/sessions/${sessionId}/recording/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  },

  getPlaybackUrl: async (sessionId: string): Promise<PlaybackUrlResponse> => {
    const response = await api.get(
      `/sessions/${sessionId}/recording/playback-url`,
    );
    return response.data.data;
  },
};
