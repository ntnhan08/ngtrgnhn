/* UI layer state — navigation, profile overlay, dialogs, toasts, bursts. */
import { create } from "zustand";
import type { ConfirmOptions, ToastItem, ToastKind, ViewId } from "../types";
import { makeBurst } from "../components/Fx";
import type { BurstState, ConfirmState } from "./uiStoreTypes";

interface UiState {
  view: ViewId;
  profileId: string | null;
  formOpen: boolean;
  editingId: string | null;
  confirm: ConfirmState | null;
  toasts: ToastItem[];
  burst: BurstState | null;
  setView: (view: ViewId) => void;
  openProfile: (id: string) => void;
  closeProfile: () => void;
  openForm: (editingId?: string | null) => void;
  closeForm: () => void;
  askConfirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: (ok: boolean) => void;
  toast: (kind: ToastKind, message: string) => void;
  dismissToast: (id: number) => void;
  fireBurst: (x: number, y: number, count?: number) => void;
  clearBurst: () => void;
}

let toastSeq = 1;
let burstSeq = 1;

export const useUiStore = create<UiState>()((set, get) => ({
  view: "home",
  profileId: null,
  formOpen: false,
  editingId: null,
  confirm: null,
  toasts: [],
  burst: null,

  setView: (view) => set({ view }),

  openProfile: (id) => set({ profileId: id }),
  closeProfile: () => set({ profileId: null }),

  openForm: (editingId = null) => set({ formOpen: true, editingId }),
  closeForm: () => set({ formOpen: false, editingId: null }),

  askConfirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({ confirm: { ...options, resolve } });
    }),

  closeConfirm: (ok) => {
    const confirm = get().confirm;
    if (confirm) confirm.resolve(ok);
    set({ confirm: null });
  },

  toast: (kind, message) => {
    const id = toastSeq++;
    set({ toasts: [...get().toasts, { id, kind, message }] });
    window.setTimeout(() => get().dismissToast(id), 3200);
  },

  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  fireBurst: (x, y, count) =>
    set({ burst: { id: burstSeq++, x, y, particles: makeBurst(count ?? 18) } }),

  clearBurst: () => set({ burst: null }),
}));
