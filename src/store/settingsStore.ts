/* Settings store — persisted to IndexedDB, applied to <html>/body live. */
import { create } from "zustand";
import { db, SETTINGS_ID } from "../services/db";
import type { AnimationMode, AppSettings, LayoutMode, ThemeMode } from "../types";

interface Defaults {
  theme: ThemeMode;
  layout: LayoutMode;
  animations: boolean;
}

function makeDefaults(d: Defaults): AppSettings {
  const now = Date.now();
  return {
    id: SETTINGS_ID,
    theme: d.theme,
    layout: d.layout,
    animation: d.animations ? "full" : "reduced",
    privacy: false,
    seeded: false,
    createdAt: now,
    updatedAt: now,
  };
}

function applyTheme(theme: ThemeMode) {
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#0a0e15" : "#cfe7f5");
}

function applyAnimation(mode: AnimationMode) {
  document.body.classList.toggle("anim-off", mode === "off");
}

interface SettingsState {
  settings: AppSettings;
  load: (defaults: Defaults) => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
  setLayout: (layout: LayoutMode) => void;
  setAnimation: (animation: AnimationMode) => void;
  setPrivacy: (privacy: boolean) => void;
  markSeeded: () => void;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: makeDefaults({ theme: "light", layout: "grid", animations: true }),

  load: async (defaults) => {
    let settings = await db.settings.get(SETTINGS_ID);
    if (!settings) {
      settings = makeDefaults(defaults);
      await db.settings.put(settings);
    }
    applyTheme(settings.theme);
    applyAnimation(settings.animation);
    set({ settings });

    // Keep the "system" theme honest when the OS preference changes.
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (get().settings.theme === "system") applyTheme("system");
    });
  },

  setTheme: (theme) => {
    const settings = { ...get().settings, theme, updatedAt: Date.now() };
    set({ settings });
    void db.settings.put(settings);
    applyTheme(theme);
  },

  setLayout: (layout) => {
    const settings = { ...get().settings, layout, updatedAt: Date.now() };
    set({ settings });
    void db.settings.put(settings);
  },

  setAnimation: (animation) => {
    const settings = { ...get().settings, animation, updatedAt: Date.now() };
    set({ settings });
    void db.settings.put(settings);
    applyAnimation(animation);
  },

  setPrivacy: (privacy) => {
    const settings = { ...get().settings, privacy, updatedAt: Date.now() };
    set({ settings });
    void db.settings.put(settings);
  },

  markSeeded: () => {
    const settings = { ...get().settings, seeded: true, updatedAt: Date.now() };
    set({ settings });
    void db.settings.put(settings);
  },
}));
