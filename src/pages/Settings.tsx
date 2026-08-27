/* Settings — appearance, motion, privacy, data (backup/import/clear),
 * storage info and app facts. All local, all instant. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Download,
  EyeOff,
  Feather,
  Image as ImageIcon,
  KeyRound,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Monitor,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Users,
  ZapOff,
} from "lucide-react";
import { Segmented, Toggle } from "../components/ui/Primitives";
import { CountUp } from "../components/Fx";
import { useAppStore } from "../store/appStore";
import { useContactsStore } from "../store/contactsStore";
import { useSettingsStore } from "../store/settingsStore";
import { useUiStore } from "../store/uiStore";
import { db } from "../services/db";
import { buildBackupZip, downloadBlob, parseBackupZip } from "../services/backup";
import { countImages, forgetAvatarUrl } from "../services/images";
import { formatBytes } from "../utils/format";

const settingsContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const settingsItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 26 } },
};

function SettingCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.section variants={settingsItem} className="glass p-5 sm:p-6">
      <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-faint">{title}</h2>
      <div className="mt-3 divide-y divide-line/70">{children}</div>
    </motion.section>
  );
}

function Row({ title, desc, control }: { title: string; desc?: string; control: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3.5 first:pt-1 last:pb-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-extrabold text-ink">{title}</p>
        {desc && <p className="mt-0.5 max-w-xs text-xs font-bold leading-relaxed text-muted">{desc}</p>}
      </div>
      {control}
    </div>
  );
}

export function SettingsPage() {
  const config = useAppStore((s) => s.config)!;
  const settings = useSettingsStore((s) => s.settings);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLayout = useSettingsStore((s) => s.setLayout);
  const setAnimation = useSettingsStore((s) => s.setAnimation);
  const setPrivacy = useSettingsStore((s) => s.setPrivacy);
  const contacts = useContactsStore((s) => s.contacts);
  const clearAll = useContactsStore((s) => s.clearAll);
  const mergeAll = useContactsStore((s) => s.mergeAll);
  const askConfirm = useUiStore((s) => s.askConfirm);
  const toast = useUiStore((s) => s.toast);

  const [usage, setUsage] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    countImages()
      .then((n) => alive && setImageCount(n))
      .catch(() => undefined);
    navigator.storage
      ?.estimate?.()
      .then((est) => alive && setUsage(est.usage ?? 0))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [contacts.length]);

  const themeOptions = [
    ...(config.features.darkMode ? [{ value: "dark" as const, label: "Dark", icon: <Moon size={13} /> }] : []),
    ...(config.features.lightMode ? [{ value: "light" as const, label: "Light", icon: <Sun size={13} /> }] : []),
    { value: "system" as const, label: "System", icon: <Monitor size={13} /> },
  ];
  const safeTheme = themeOptions.some((o) => o.value === settings.theme) ? settings.theme : "system";

  const exportBackup = async () => {
    setBusy("export");
    try {
      const blob = await buildBackupZip(config.app.name, config.app.version);
      downloadBlob(
        blob,
        `${config.app.name.toLowerCase().replace(/\s+/g, "-")}-backup-${new Date().toISOString().slice(0, 10)}.zip`
      );
      toast("success", "Backup exported as ZIP");
    } catch {
      toast("error", "Unable to export backup.");
    } finally {
      setBusy(null);
    }
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy("import");
    try {
      const parsed = await parseBackupZip(file);
      const ok = await askConfirm({
        title: "Import backup?",
        message: `Found ${parsed.contacts.length} contacts and ${parsed.images.length} photos. They will be merged into your vault — matching contacts are updated, nothing is deleted.`,
        confirmLabel: "Import",
      });
      if (ok) {
        if (parsed.images.length > 0) {
          // Drop stale object URLs so replaced blobs re-resolve correctly.
          for (const rec of parsed.images) forgetAvatarUrl(rec.id);
          await db.images.bulkPut(parsed.images);
        }
        await mergeAll(parsed.contacts);
        toast("success", `Imported ${parsed.contacts.length} contacts`);
      }
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Unable to import backup.");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onClear = async () => {
    const ok = await askConfirm({
      title: "Clear all data?",
      message: `This permanently deletes ${contacts.length} contacts and their photos from this device. This action cannot be undone.`,
      confirmLabel: "Clear everything",
      danger: true,
    });
    if (ok) {
      await clearAll();
      toast("info", "Vault cleared");
    }
  };

  return (
    <motion.div
      variants={settingsContainer}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-2xl flex-col gap-5"
    >
      <motion.header variants={settingsItem}>
        <h1 className="font-display ink-pop text-[28px] font-bold tracking-tight text-ink sm:text-4xl">
          <span className="marker px-2">Settings</span>
        </h1>
        <p className="ink-pop mt-1.5 text-sm font-extrabold text-muted">
          Preferences are saved locally and applied instantly.
        </p>
      </motion.header>

      <SettingCard title="Appearance">
        <Row
          title="Theme"
          desc="The nature-school sky in light or dark; system follows your OS."
          control={
            <Segmented label="Theme" className="w-56" value={safeTheme} onChange={setTheme} options={themeOptions} />
          }
        />
        <Row
          title="Layout"
          desc="How the contact directory is displayed."
          control={
            <Segmented
              label="Layout"
              className="w-32"
              value={settings.layout}
              onChange={setLayout}
              options={[
                { value: "grid", label: "", icon: <LayoutGrid size={14} /> },
                { value: "list", label: "", icon: <ListIcon size={14} /> },
              ]}
            />
          }
        />
      </SettingCard>

      <SettingCard title="Motion">
        <Row
          title="Animations"
          desc="Full enables card tilt and rich transitions. Reduced keeps gentle fades; Off disables motion. Your OS reduce-motion preference is always respected."
          control={
            <Segmented
              label="Animations"
              className="w-64"
              value={settings.animation}
              onChange={setAnimation}
              options={[
                { value: "full", label: "Full", icon: <Sparkles size={13} /> },
                { value: "reduced", label: "Reduced", icon: <Feather size={13} /> },
                { value: "off", label: "Off", icon: <ZapOff size={13} /> },
              ]}
            />
          }
        />
      </SettingCard>

      <SettingCard title="Privacy">
        <Row
          title="Privacy Mode"
          desc={
            config.features.privacyMode
              ? "Masks phone numbers, emails and bank accounts across the whole vault."
              : "Disabled by config.json (features.privacyMode)."
          }
          control={
            <div className="flex items-center gap-2.5">
              <EyeOff size={16} className={settings.privacy ? "text-accent-hi" : "text-faint"} />
              <Toggle
                checked={settings.privacy}
                onChange={setPrivacy}
                label="Toggle privacy mode"
                disabled={!config.features.privacyMode}
              />
            </div>
          }
        />
      </SettingCard>

      <SettingCard title="Data">
        {config.features.backup && (
          <Row
            title="Export backup"
            desc="Downloads a ZIP with contacts.json, settings.json and every photo."
            control={
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={exportBackup}
                disabled={busy !== null}
                className="btn-comic btn-accent px-4 py-2 text-[13px] disabled:opacity-60"
              >
                {busy === "export" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Export
              </motion.button>
            }
          />
        )}
        {config.features.import && (
          <Row
            title="Import backup"
            desc="Restores from an EYECORE LABS ZIP. Data is merged — nothing is overwritten silently."
            control={
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => fileRef.current?.click()}
                disabled={busy !== null}
                className="btn-comic btn-paper px-4 py-2 text-[13px] disabled:opacity-60"
              >
                {busy === "import" ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Import
              </motion.button>
            }
          />
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => onImportFile(e.target.files?.[0])}
        />
        <Row
          title="Clear all data"
          desc="Deletes every contact and photo from this device. Settings are kept."
          control={
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClear}
              className="btn-comic btn-danger px-4 py-2 text-[13px]"
            >
              <Trash2 size={14} />
              Clear
            </motion.button>
          }
        />
      </SettingCard>

      <SettingCard title="Storage">
        <div className="grid grid-cols-3 gap-3 py-3.5">
          {[
            { icon: <Database size={15} />, num: null as number | null, value: formatBytes(usage), label: "Used" },
            { icon: <Users size={15} />, num: contacts.length, value: "", label: "Contacts" },
            { icon: <ImageIcon size={15} />, num: imageCount, value: "", label: "Photos" },
          ].map((cell) => (
            <div key={cell.label} className="glass-plain flex flex-col items-center gap-1 px-2 py-4 text-center">
              <span className="text-accent-hi">{cell.icon}</span>
              <p className="font-display text-lg font-bold tabular-nums text-ink">
                {cell.num === null ? cell.value : <CountUp value={cell.num} />}
              </p>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-faint">{cell.label}</p>
            </div>
          ))}
        </div>
      </SettingCard>

      <SettingCard title="Application">
        <Row
          title={`${config.app.name} v${config.app.version}`}
          desc={config.app.description}
          control={
            <div className="flex flex-wrap justify-end gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-success/40 bg-success/10 px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-success">
                <ShieldCheck size={11} /> No tracking
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-accent/40 bg-accent-soft px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-accent-hi">
                <KeyRound size={11} /> Offline-ready
              </span>
            </div>
          }
        />
        <div className="py-3.5 last:pb-0">
          <p className="text-xs font-bold leading-relaxed text-muted">
            The owner profile, visibility rules, social links and feature switches come from{" "}
            <code className="rounded-[5px] border border-line bg-raised px-1.5 py-0.5 font-mono text-[11px] text-accent-hi">
              config/config.json
            </code>
            . Edit that file and reload — no code changes needed. Contacts you add or edit in the
            app are stored in IndexedDB and never touch that file.
          </p>
        </div>
      </SettingCard>
    </motion.div>
  );
}