/* ---------------------------------------------------------------------------
 * App bootstrap store.
 *
 *   config.json  →  load default configuration (validated + merged)
 *        ↓
 *   IndexedDB    →  load settings & contacts
 *        ↓
 *   merge/seed   →  render application
 *
 * Editing a contact in the UI writes to IndexedDB only — config.json is
 * never modified by the application.
 * ------------------------------------------------------------------------- */
import { create } from "zustand";
import { loadConfig } from "../services/configService";
import { useSettingsStore } from "./settingsStore";
import { useContactsStore } from "./contactsStore";
import type { AppConfig, ConfigIssue, ContactRecord, SocialLink, SocialNetworkId } from "../types";

interface AppState {
  config: AppConfig | null;
  issues: ConfigIssue[];
  source: "file" | "defaults" | null;
  ready: boolean;
  bootError: string | null;
  init: () => Promise<void>;
  dismissIssues: () => void;
}

const DAY = 24 * 60 * 60 * 1000;

function sample(
  partial: Partial<ContactRecord> & { fullName: string },
  ageInDays: number
): ContactRecord {
  const created = Date.now() - ageInDays * DAY;
  return {
    id: `seed-${partial.fullName}-${ageInDays}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    fullName: partial.fullName,
    avatarId: null,
    phone: partial.phone ?? "",
    email: partial.email ?? "",
    education: partial.education ?? { school: "", major: "", year: "" },
    work: partial.work ?? { company: "", position: "" },
    relationship: partial.relationship ?? "unknown",
    bank: partial.bank ?? { bankName: "", accountNumber: "" },
    birthday: partial.birthday ?? "",
    address: partial.address ?? "",
    notes: partial.notes ?? "",
    social: (partial.social ?? {}) as Partial<Record<SocialNetworkId, SocialLink>>,
    createdAt: created,
    updatedAt: created + Math.floor(ageInDays / 3) * DAY,
  };
}

/** First-launch demo dataset so the vault feels alive immediately. */
const SAMPLE_CONTACTS: ContactRecord[] = [
  sample(
    {
      fullName: "Trần Minh Khôi",
      phone: "0912 345 678",
      email: "khoi.tran@gmail.com",
      education: { school: "PTIT", major: "Information Technology", year: "2022 - 2026" },
      work: { company: "FPT Software", position: "Frontend Developer" },
      relationship: "dating",
      bank: { bankName: "MB Bank", accountNumber: "0912345678" },
      birthday: "2004-03-14",
      social: {
        facebook: { enabled: true, url: "https://facebook.com/khoi.tran" },
        instagram: { enabled: true, url: "https://instagram.com/khoitran.dev" },
        github: { enabled: true, url: "https://github.com/khoitran" },
      },
      notes: "Met at the PTIT open source club. Likes mechanical keyboards.",
    },
    2
  ),
  sample(
    {
      fullName: "Nguyễn Lan Hương",
      phone: "0909 876 543",
      email: "huong.nguyen@gmail.com",
      education: { school: "Hanoi University of Science", major: "Graphic Design", year: "2021 - 2025" },
      work: { company: "Studio Đỏ", position: "Visual Designer" },
      relationship: "single",
      bank: { bankName: "Vietcombank", accountNumber: "1019876543" },
      social: {
        instagram: { enabled: true, url: "https://instagram.com/huong.draws" },
        tiktok: { enabled: true, url: "https://tiktok.com/@huongdraws" },
      },
    },
    6
  ),
  sample(
    {
      fullName: "Phạm Quốc Bảo",
      phone: "0933 111 222",
      email: "bao.pham@outlook.com",
      education: { school: "Bách Khoa Hà Nội", major: "Computer Science", year: "2018 - 2023" },
      work: { company: "Viettel", position: "Backend Engineer" },
      relationship: "married",
      bank: { bankName: "Techcombank", accountNumber: "190311122233" },
      birthday: "2000-11-02",
      address: "Cầu Giấy, Hà Nội",
      social: {
        linkedin: { enabled: true, url: "https://linkedin.com/in/baopham" },
        github: { enabled: true, url: "https://github.com/baopham99" },
      },
    },
    12
  ),
  sample(
    {
      fullName: "Lê Thu Trang",
      phone: "0977 555 666",
      email: "trang.le@gmail.com",
      education: { school: "FPT University", major: "Digital Marketing", year: "2023 - 2027" },
      relationship: "dating",
      social: {
        facebook: { enabled: true, url: "https://facebook.com/thutrang.le" },
        tiktok: { enabled: true, url: "https://tiktok.com/@tranglee" },
        threads: { enabled: true, url: "https://threads.net/@tranglee" },
      },
    },
    20
  ),
  sample(
    {
      fullName: "Đặng Văn Sơn",
      phone: "0988 222 333",
      work: { company: "Grab", position: "Product Manager" },
      relationship: "complicated",
      bank: { bankName: "VPBank", accountNumber: "158222333" },
      notes: "College roommate. Coffee every other Saturday.",
      social: { facebook: { enabled: true, url: "https://facebook.com/dvson" } },
    },
    31
  ),
  sample(
    {
      fullName: "Hoàng Yến Nhi",
      phone: "0901 999 000",
      email: "nhi.hoang@gmail.com",
      education: { school: "RMIT Vietnam", major: "Business Administration", year: "2024 - 2027" },
      relationship: "single",
      birthday: "2006-07-21",
      social: {
        instagram: { enabled: true, url: "https://instagram.com/yennhi.h" },
        snapchat: { enabled: true, url: "https://snapchat.com/add/yennhi" },
      },
    },
    45
  ),
  sample(
    {
      fullName: "Vũ Đức Mạnh",
      phone: "0915 444 777",
      email: "manh.vu@gmail.com",
      work: { company: "Shopee", position: "Data Analyst" },
      relationship: "married",
      bank: { bankName: "BIDV", accountNumber: "212444777" },
      address: "Quận 7, TP. Hồ Chí Minh",
      social: {
        linkedin: { enabled: true, url: "https://linkedin.com/in/manhvu" },
        telegram: { enabled: true, url: "https://t.me/manhvu" },
      },
    },
    60
  ),
  sample(
    {
      fullName: "Bùi Anh Tuấn",
      phone: "0966 888 999",
      relationship: "unknown",
      notes: "Friend of a friend — met at the Đà Lạt trip.",
    },
    90
  ),
];

let bootStarted = false;

export const useAppStore = create<AppState>()((set) => ({
  config: null,
  issues: [],
  source: null,
  ready: false,
  bootError: null,

  init: async () => {
    if (bootStarted) return;
    bootStarted = true;
    try {
      const { config, issues, source } = await loadConfig();
      set({ config, issues, source });
      document.title = `${config.app.name} — ${config.app.description}`;
      if (!config.appearance.glassEffect) document.body.classList.add("no-glass");

      await useSettingsStore.getState().load({
        theme: config.appearance.defaultTheme,
        layout: config.appearance.defaultLayout,
        animations: config.appearance.animations,
      });

      await useContactsStore.getState().load();

      if (!useSettingsStore.getState().settings.seeded) {
        await useContactsStore.getState().mergeAll(SAMPLE_CONTACTS);
        useSettingsStore.getState().markSeeded();
      }

      set({ ready: true });
    } catch {
      set({
        ready: true,
        bootError: "Something went wrong while unlocking the vault. Please reload the page.",
      });
    }
  },

  dismissIssues: () => set({ issues: [] }),
}));
