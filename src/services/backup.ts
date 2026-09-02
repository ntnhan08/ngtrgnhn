/* ---------------------------------------------------------------------------
 * Backup layer — full local export/import as ZIP via JSZip.
 *
 *   backup.zip
 *   ├── contacts.json      (metadata + contact array)
 *   ├── settings.json      (preferences snapshot)
 *   └── images/            (binary blobs + manifest.json)
 *
 * Everything runs on-device; nothing ever leaves the browser.
 * ------------------------------------------------------------------------- */
import JSZip from "jszip";
import { db } from "./db";
import { uid } from "../utils/format";
import type {
  AppSettings,
  ContactRecord,
  ImageRecord,
  RelationshipStatus,
  SocialNetworkId,
  SocialLink,
} from "../types";

const RELATIONSHIPS: RelationshipStatus[] = ["single", "dating", "married", "complicated", "unknown"];
const SOCIAL_IDS: SocialNetworkId[] = [
  "facebook", "instagram", "tiktok", "youtube", "github", "linkedin",
  "zalo", "x", "discord", "telegram", "threads", "snapchat",
];

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

/** Coerces arbitrary JSON into a safe, complete ContactRecord. */
export function normalizeContact(raw: unknown): ContactRecord {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const edu = (typeof r.education === "object" && r.education !== null ? r.education : {}) as Record<string, unknown>;
  const work = (typeof r.work === "object" && r.work !== null ? r.work : {}) as Record<string, unknown>;
  const bank = (typeof r.bank === "object" && r.bank !== null ? r.bank : {}) as Record<string, unknown>;
  const socialRaw = (typeof r.social === "object" && r.social !== null ? r.social : {}) as Record<string, unknown>;

  const social: Partial<Record<SocialNetworkId, SocialLink>> = {};
  for (const id of SOCIAL_IDS) {
    const s = socialRaw[id] as Record<string, unknown> | undefined;
    if (s && typeof s === "object") social[id] = { enabled: s.enabled === true, url: str(s.url) };
  }

  return {
    id: str(r.id) || uid(),
    fullName: str(r.fullName, "Unnamed"),
    avatarId: typeof r.avatarId === "string" ? r.avatarId : null,
    phone: str(r.phone),
    email: str(r.email),
    education: { school: str(edu.school), major: str(edu.major), year: str(edu.year) },
    work: { company: str(work.company), position: str(work.position) },
    relationship: RELATIONSHIPS.includes(r.relationship as RelationshipStatus)
      ? (r.relationship as RelationshipStatus)
      : "unknown",
    bank: { bankName: str(bank.bankName), accountNumber: str(bank.accountNumber) },
    birthday: str(r.birthday),
    address: str(r.address),
    notes: str(r.notes),
    social,
    createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : Date.now(),
  };
}

export async function buildBackupZip(appName: string, version: string): Promise<Blob> {
  const [contacts, images, settings] = await Promise.all([
    db.contacts.toArray(),
    db.images.toArray(),
    db.settings.get("app"),
  ]);

  const zip = new JSZip();
  zip.file(
    "contacts.json",
    JSON.stringify(
      {
        app: { name: appName, version, format: "eyecore/1", exportedAt: new Date().toISOString() },
        contacts,
      },
      null,
      2
    )
  );
  if (settings) zip.file("settings.json", JSON.stringify({ settings }, null, 2));

  const folder = zip.folder("images");
  const manifest: Array<{ id: string; mime: string }> = [];
  for (const rec of images) {
    folder?.file(`${rec.id}.${rec.ext}`, rec.blob);
    manifest.push({ id: rec.id, mime: rec.mime });
  }
  folder?.file("manifest.json", JSON.stringify({ images: manifest }, null, 2));

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export interface ParsedBackup {
  contacts: ContactRecord[];
  settings: AppSettings | null;
  images: ImageRecord[];
}

export async function parseBackupZip(file: Blob): Promise<ParsedBackup> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("Backup file is corrupted or not a ZIP archive.");
  }

  const contactsFile = zip.file("contacts.json");
  if (!contactsFile) throw new Error("Invalid backup: contacts.json is missing.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(await contactsFile.async("text"));
  } catch {
    throw new Error("Invalid backup: contacts.json is not valid JSON.");
  }
  const arr = (parsed as { contacts?: unknown } | null)?.contacts;
  if (!Array.isArray(arr)) throw new Error("Invalid backup: contacts.json has no contacts array.");
  const contacts = arr.map(normalizeContact);

  let settings: AppSettings | null = null;
  const settingsFile = zip.file("settings.json");
  if (settingsFile) {
    try {
      const s = JSON.parse(await settingsFile.async("text")) as { settings?: AppSettings };
      if (s && typeof s.settings === "object" && s.settings !== null) settings = s.settings;
    } catch {
      /* settings snapshot is optional */
    }
  }

  const images: ImageRecord[] = [];
  const mimeById: Record<string, string> = {};
  const manifestFile = zip.file("images/manifest.json");
  if (manifestFile) {
    try {
      const m = JSON.parse(await manifestFile.async("text")) as {
        images?: Array<{ id: string; mime: string }>;
      };
      for (const entry of m.images ?? []) mimeById[entry.id] = entry.mime;
    } catch {
      /* manifest is optional */
    }
  }
  const folder = zip.folder("images");
  if (folder) {
    const jobs: Array<Promise<void>> = [];
    folder.forEach((relativePath, entry) => {
      if (entry.dir || relativePath.includes("/") || relativePath === "manifest.json") return;
      jobs.push(
        (async () => {
          const dot = relativePath.lastIndexOf(".");
          const id = dot > 0 ? relativePath.slice(0, dot) : relativePath;
          const ext = dot > 0 ? relativePath.slice(dot + 1) : "bin";
          const blob = await entry.async("blob");
          images.push({
            id,
            blob,
            mime: mimeById[id] ?? `image/${ext === "jpg" ? "jpeg" : ext}`,
            ext,
            createdAt: Date.now(),
          });
        })()
      );
    });
    await Promise.all(jobs);
  }

  return { contacts, settings, images };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
