/* ---------------------------------------------------------------------------
 * Shared domain types.
 * DATA (IndexedDB via Dexie) · CONFIGURATION (public/config/config.json) ·
 * PRESENTATION (React) are kept strictly separate — these types are the
 * contracts between the layers.
 * ------------------------------------------------------------------------- */

export type RelationshipStatus = "single" | "dating" | "married" | "complicated" | "unknown";

export type SocialNetworkId =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "github"
  | "linkedin"
  | "zalo"
  | "x"
  | "discord"
  | "telegram"
  | "threads"
  | "snapchat";

export interface SocialLink {
  enabled: boolean;
  url: string;
}

export type VisibilityKey =
  | "phone"
  | "email"
  | "education"
  | "major"
  | "work"
  | "company"
  | "position"
  | "relationship"
  | "bank"
  | "bankName"
  | "bankAccount"
  | "birthday"
  | "address"
  | "notes";

export interface VisibilityScope {
  /** Shown on the compact card — owner's Home screen and contact cards. */
  home: boolean;
  /** Shown on the expanded "View full profile" page. */
  full: boolean;
}
export type VisibilityMap = Record<VisibilityKey, VisibilityScope>;

/** Per-field control over whether a masked number sequence (phone, bank
 *  account) may ever render in full digits. This is the *owner's* policy,
 *  set once in config.json — independent of the viewer's own privacy-mode
 *  toggle, which can still force masking even when a field allows reveal,
 *  but can never un-mask a field the owner has set to false here. */
export interface RevealMap {
  phone: boolean;
  bankAccount: boolean;
}

export type ThemeMode = "dark" | "light" | "system";
export type LayoutMode = "grid" | "list";
export type AnimationMode = "full" | "reduced" | "off";

export interface AppConfig {
  app: { name: string; version: string; description: string };
  profile: {
    avatar: string;
    fullName: string;
    phone: string;
    email: string;
    education: { school: string; major: string; year: string };
    work: { company: string; position: string };
    relationship: { status: RelationshipStatus };
    bank: { bankName: string; accountNumber: string };
    address: string;
    birthday: string;
    notes: string;
  };
  visibility: VisibilityMap;
  reveal: RevealMap;
  social: Record<SocialNetworkId, SocialLink>;
  features: {
    search: boolean;
    filter: boolean;
    sorting: boolean;
    backup: boolean;
    import: boolean;
    privacyMode: boolean;
    darkMode: boolean;
    lightMode: boolean;
    timeline: boolean;
  };
  appearance: {
    defaultTheme: ThemeMode;
    defaultLayout: LayoutMode;
    animations: boolean;
    cardTilt: boolean;
    glassEffect: boolean;
  };
}

/** One person stored in IndexedDB. */
export interface ContactRecord {
  id: string;
  fullName: string;
  /** Reference to an image blob in the `images` table (owned by the app). */
  avatarId: string | null;
  /** Optional static path (used only by the owner profile from config.json). */
  avatarPath?: string;
  phone: string;
  email: string;
  education: { school: string; major: string; year: string };
  work: { company: string; position: string };
  relationship: RelationshipStatus;
  bank: { bankName: string; accountNumber: string };
  birthday: string;
  address: string;
  notes: string;
  social: Partial<Record<SocialNetworkId, SocialLink>>;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  id: string;
  theme: ThemeMode;
  layout: LayoutMode;
  animation: AnimationMode;
  privacy: boolean;
  /** True once the demo dataset has been seeded on first launch. */
  seeded: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ImageRecord {
  id: string;
  blob: Blob;
  mime: string;
  ext: string;
  createdAt: number;
}

export interface ContactFilters {
  relationships: RelationshipStatus[];
  hasEducation: boolean;
  hasWork: boolean;
  hasBank: boolean;
  hasSocial: boolean;
}

export type SortKey =
  | "name-asc"
  | "name-desc"
  | "recent"
  | "updated"
  | "school"
  | "company"
  | "relationship";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ConfigIssue {
  path: string;
  message: string;
}

export type ViewId = "home" | "contacts" | "settings";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
} 