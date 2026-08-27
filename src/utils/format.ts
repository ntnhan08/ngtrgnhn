import type { RelationshipStatus } from "../types";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Diacritic-insensitive text (handles Vietnamese dấu). */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/* ------------------------------ privacy masks ----------------------------- */

export function maskPhone(phone: string): string {
  return phone.replace(/\d/g, "•");
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "••••";
  return `${email.slice(0, 1)}•••${email.slice(at)}`;
}

/** Privacy mode: everything except the last four digits. */
export function maskAccountPrivacy(account: string): string {
  const digits = account.replace(/\D/g, "");
  if (digits.length <= 4) return account.replace(/\d/g, "•");
  return `${"•".repeat(Math.min(8, digits.length - 4))}${digits.slice(-4)}`;
}

/** Default resting mask on the bank card: •••• •••• 6789 */
export function maskAccountTail(account: string): string {
  const digits = account.replace(/\D/g, "");
  if (digits.length <= 4) return account.replace(/\d/g, "•");
  return `•••• •••• ${digits.slice(-4)}`;
}

export function groupAccount(account: string): string {
  const digits = account.replace(/\D/g, "");
  return (digits.match(/.{1,4}/g) || []).join(" ");
}

/* --------------------------------- misc ---------------------------------- */

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/* ------------------------------ relationships ----------------------------- */

export const RELATIONSHIP_ORDER: RelationshipStatus[] = [
  "single",
  "dating",
  "married",
  "complicated",
  "unknown",
];

export const RELATIONSHIP_META: Record<
  RelationshipStatus,
  { label: string; dot: string; text: string; chip: string }
> = {
  single: {
    label: "Single",
    dot: "○",
    text: "text-zinc-600",
    chip: "bg-zinc-500/15 text-zinc-700 border-zinc-600/40",
  },
  dating: {
    label: "Dating",
    dot: "●",
    text: "text-rose-600",
    chip: "bg-rose-500/15 text-rose-700 border-rose-600/40",
  },
  married: {
    label: "Married",
    dot: "●",
    text: "text-emerald-600",
    chip: "bg-emerald-500/15 text-emerald-700 border-emerald-600/40",
  },
  complicated: {
    label: "Complicated",
    dot: "●",
    text: "text-amber-600",
    chip: "bg-amber-500/15 text-amber-700 border-amber-600/40",
  },
  unknown: {
    label: "Unknown",
    dot: "○",
    text: "text-muted",
    chip: "bg-raised text-muted border-line-strong",
  },
};

/* ---------------------------------- banks --------------------------------- */

export const VN_BANKS: string[] = [
  "MB Bank", "Vietcombank", "BIDV", "VietinBank", "Techcombank", "ACB",
  "VPBank", "TPBank", "Agribank", "Sacombank", "SHB", "VIB", "MSB", "OCB",
  "Eximbank", "HDBank", "SCB", "SeABank", "NCB", "ABBank", "VietBank",
  "Woori Bank", "Shinhan Bank", "Standard Chartered", "HSBC", "UOB",
];

/* ---------------------------- monogram avatars ---------------------------- */

const AVATAR_PALETTES: Array<{ from: string; to: string }> = [
  { from: "#7fbf8e", to: "#3d7a52" },
  { from: "#ffd76a", to: "#d99a26" },
  { from: "#8ecae6", to: "#3f7fb5" },
  { from: "#f4978e", to: "#c05a4e" },
  { from: "#b5c99a", to: "#6f8f4f" },
  { from: "#cdb4db", to: "#8a63a8" },
  { from: "#f9c6b3", to: "#d9825f" },
  { from: "#a3d5c9", to: "#4f8f7d" },
];

export function avatarPalette(seed: string): { from: string; to: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}
