/* ---------------------------------------------------------------------------
 * Configuration layer.
 *
 *   config.json (DEFAULT CONFIGURATION SOURCE, user-editable)
 *        ↓ load + validate + merge over safe defaults
 *   AppConfig (runtime, type-safe)
 *
 * The app never writes back to config.json. Runtime data lives in IndexedDB.
 * ------------------------------------------------------------------------- */
import type {
  AppConfig,
  ConfigIssue,
  ContactRecord,
  RelationshipStatus,
  SocialNetworkId,
  SocialLink,
  VisibilityKey,
} from "../types";

export const OWNER_ID = "owner";

export const DEFAULT_CONFIG: AppConfig = {
  app: { name: "EYECORE LABS", version: "1.0.0", description: "Personal Contact Vault" },
  profile: {
    avatar: "",
    fullName: "",
    phone: "",
    email: "",
    education: { school: "", major: "", year: "" },
    work: { company: "", position: "" },
    relationship: { status: "unknown" },
    bank: { bankName: "", accountNumber: "" },
    address: "",
    birthday: "",
    notes: "",
  },
  visibility: {
    phone: { home: true, full: true },
    email: { home: true, full: true },
    education: { home: true, full: true },
    major: { home: true, full: true },
    work: { home: true, full: true },
    company: { home: true, full: true },
    position: { home: true, full: true },
    relationship: { home: true, full: true },
    bank: { home: false, full: true },
    bankName: { home: false, full: true },
    bankAccount: { home: false, full: true },
    birthday: { home: false, full: true },
    address: { home: false, full: true },
    notes: { home: false, full: true },
  },
  reveal: { phone: false, bankAccount: false },
  social: {
    facebook: { enabled: false, url: "" }, instagram: { enabled: false, url: "" },
    tiktok: { enabled: false, url: "" }, youtube: { enabled: false, url: "" },
    github: { enabled: false, url: "" }, linkedin: { enabled: false, url: "" },
    zalo: { enabled: false, url: "" }, x: { enabled: false, url: "" },
    discord: { enabled: false, url: "" }, telegram: { enabled: false, url: "" },
    threads: { enabled: false, url: "" }, snapchat: { enabled: false, url: "" },
  },
  features: {
    search: true, filter: true, sorting: true, backup: true, import: true,
    privacyMode: true, darkMode: true, lightMode: true, timeline: true,
  },
  appearance: {
    defaultTheme: "light", defaultLayout: "grid", animations: true,
    cardTilt: true, glassEffect: true,
  },
};

const RELATIONSHIPS: RelationshipStatus[] = ["single", "dating", "married", "complicated", "unknown"];
const SOCIAL_IDS: SocialNetworkId[] = [
  "facebook", "instagram", "tiktok", "youtube", "github", "linkedin",
  "zalo", "x", "discord", "telegram", "threads", "snapchat",
];
const VISIBILITY_KEYS: VisibilityKey[] = [
  "phone", "email", "education", "major", "work", "company", "position",
  "relationship", "bank", "bankName", "bankAccount", "birthday", "address", "notes",
];

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isStr = (v: unknown): v is string => typeof v === "string";

/** Type-checked deep merge: wrong-typed values are ignored (and reported by
 *  validateConfig), so the runtime config is always safe to consume. */
function deepMerge<T>(base: T, patch: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(patch) ? patch : base) as T;
  if (isObject(base)) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    if (isObject(patch)) {
      for (const key of Object.keys(base)) {
        if (key in patch) out[key] = deepMerge((base as Record<string, unknown>)[key], patch[key]);
      }
    }
    return out as T;
  }
  if (typeof base === "boolean") return (isBool(patch) ? patch : base) as T;
  if (typeof base === "number") return (typeof patch === "number" ? patch : base) as T;
  if (typeof base === "string") return (isStr(patch) ? patch : base) as T;
  return base;
}

/** Reports user-fixable problems in the raw file (only fields actually present). */
export function validateConfig(raw: unknown): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  if (!isObject(raw)) {
    issues.push({ path: "config.json", message: "must be a JSON object." });
    return issues;
  }
  const expect = (path: string, value: unknown, ok: (v: unknown) => boolean, what: string) => {
    if (value !== undefined && !ok(value)) issues.push({ path, message: `must be ${what}.` });
  };

  const profile = raw.profile;
  if (profile !== undefined) {
    if (!isObject(profile)) issues.push({ path: "profile", message: "must be an object." });
    else {
      expect("profile.fullName", profile.fullName, isStr, "a string");
      expect("profile.phone", profile.phone, isStr, "a string");
      expect("profile.email", profile.email, isStr, "a string");
      if (profile.relationship !== undefined) {
        if (!isObject(profile.relationship))
          issues.push({ path: "profile.relationship", message: "must be an object." });
        else
          expect(
            "profile.relationship.status",
            profile.relationship.status,
            (v) => isStr(v) && RELATIONSHIPS.includes(v as RelationshipStatus),
            `one of: ${RELATIONSHIPS.join(", ")}`
          );
      }
    }
  }

  const visibility = raw.visibility;
  if (visibility !== undefined) {
    if (!isObject(visibility)) issues.push({ path: "visibility", message: "must be an object." });
    else
      for (const key of VISIBILITY_KEYS) {
        const entry = visibility[key];
        if (entry === undefined) continue;
        if (!isObject(entry)) {
          issues.push({ path: `visibility.${key}`, message: 'must be an object like { "home": true, "full": true }.' });
        } else {
          expect(`visibility.${key}.home`, entry.home, isBool, "true or false");
          expect(`visibility.${key}.full`, entry.full, isBool, "true or false");
        }
      }
  }

  const reveal = raw.reveal;
  if (reveal !== undefined) {
    if (!isObject(reveal)) issues.push({ path: "reveal", message: "must be an object." });
    else {
      expect("reveal.phone", reveal.phone, isBool, "true or false");
      expect("reveal.bankAccount", reveal.bankAccount, isBool, "true or false");
    }
  }

  const social = raw.social;
  if (social !== undefined) {
    if (!isObject(social)) issues.push({ path: "social", message: "must be an object." });
    else
      for (const id of SOCIAL_IDS) {
        const entry = social[id];
        if (entry === undefined) continue;
        if (!isObject(entry)) issues.push({ path: `social.${id}`, message: "must be an object." });
        else {
          expect(`social.${id}.enabled`, entry.enabled, isBool, "true or false");
          expect(`social.${id}.url`, entry.url, isStr, "a string");
        }
      }
  }

  const appearance = raw.appearance;
  if (appearance !== undefined) {
    if (!isObject(appearance)) issues.push({ path: "appearance", message: "must be an object." });
    else {
      expect(
        "appearance.defaultTheme",
        appearance.defaultTheme,
        (v) => isStr(v) && ["dark", "light", "system"].includes(v),
        `"dark", "light" or "system"`
      );
      expect(
        "appearance.defaultLayout",
        appearance.defaultLayout,
        (v) => isStr(v) && ["grid", "list"].includes(v),
        `"grid" or "list"`
      );
    }
  }

  return issues;
}

export interface ConfigLoadResult {
  config: AppConfig;
  issues: ConfigIssue[];
  source: "file" | "defaults";
}

/** Loads config.json (same-origin; the service worker caches it, so this
 *  works offline). Falls back to bundled defaults so the app always boots. */
export async function loadConfig(): Promise<ConfigLoadResult> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}config/config.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`config.json responded with ${res.status}`);
    const raw: unknown = await res.json();
    const config = deepMerge(structuredClone(DEFAULT_CONFIG), raw);
    return { config, issues: validateConfig(raw), source: "file" };
  } catch {
    return { config: structuredClone(DEFAULT_CONFIG), issues: [], source: "defaults" };
  }
}

/** Adapts the owner profile from config.json into a display-only ContactRecord. */
export function ownerFromConfig(cfg: AppConfig): ContactRecord {
  const p = cfg.profile;
  return {
    id: OWNER_ID,
    fullName: p.fullName || "Vault Owner",
    avatarId: null,
    avatarPath: p.avatar || undefined,
    phone: p.phone,
    email: p.email,
    education: { ...p.education },
    work: { ...p.work },
    relationship: p.relationship.status,
    bank: { ...p.bank },
    birthday: p.birthday,
    address: p.address,
    notes: p.notes,
    social: Object.fromEntries(
      (Object.keys(cfg.social) as SocialNetworkId[]).map((k) => [k, { ...cfg.social[k] }])
    ) as Record<SocialNetworkId, SocialLink>,
    createdAt: 0,
    updatedAt: 0,
  };
}