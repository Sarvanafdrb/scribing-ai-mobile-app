import { create } from "zustand";

export type ToastVariant = "info" | "success" | "error";

interface ToastPayload {
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastState {
  visible: boolean;
  title?: string;
  message: string;
  variant: ToastVariant;
  show: (payload: ToastPayload) => void;
  hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set, get) => ({
  visible: false,
  message: "",
  variant: "info",
  show: ({ title, message, variant = "info", durationMs = 4000 }) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: true, title, message, variant });
    hideTimer = setTimeout(() => {
      if (get().visible) set({ visible: false });
    }, durationMs);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    set({ visible: false });
  },
}));

export function showToast(payload: ToastPayload) {
  useToastStore.getState().show(payload);
}
