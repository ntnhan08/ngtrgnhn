/* Add/edit contact modal — every field the vault knows about, avatar
 * processing (WebP ≤512px), per-network social editor, validation and a
 * hand-drawn "Saved ✓" check morph plus confetti when a contact is added.
 * All writes go straight to IndexedDB; nothing touches the network. */
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Loader2, Save, Trash2, X } from "lucide-react";
import { Modal, Toggle } from "./ui/Primitives";
import { BrandIcon } from "./icons/BrandIcons";
import { useAppStore } from "../store/appStore";
import { useContactsStore, type NewContact } from "../store/contactsStore";
import { useUiStore } from "../store/uiStore";
import { processImageFile, removeImage, resolveAvatarUrl, storeImage } from "../services/images";
import { cn, RELATIONSHIP_META, RELATIONSHIP_ORDER, VN_BANKS } from "../utils/format";
import type { RelationshipStatus, SocialLink, SocialNetworkId } from "../types";

const SOCIAL_IDS: SocialNetworkId[] = [
  "facebook", "instagram", "tiktok", "youtube", "github", "linkedin",
  "zalo", "x", "discord", "telegram", "threads", "snapchat",
];

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  school: string;
  major: string;
  year: string;
  company: string;
  position: string;
  relationship: RelationshipStatus;
  bankName: string;
  accountNumber: string;
  birthday: string;
  address: string;
  notes: string;
  social: Partial<Record<SocialNetworkId, SocialLink>>;
}

const EMPTY_FORM: FormState = {
  fullName: "",
  phone: "",
  email: "",
  school: "",
  major: "",
  year: "",
  company: "",
  position: "",
  relationship: "unknown",
  bankName: "",
  accountNumber: "",
  birthday: "",
  address: "",
  notes: "",
  social: {},
};

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="font-display mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ContactForm() {
  const open = useUiStore((s) => s.formOpen);
  const editingId = useUiStore((s) => s.editingId);
  const closeForm = useUiStore((s) => s.closeForm);
  const toast = useUiStore((s) => s.toast);
  const fireBurst = useUiStore((s) => s.fireBurst);
  const contacts = useContactsStore((s) => s.contacts);
  const add = useContactsStore((s) => s.add);
  const update = useContactsStore((s) => s.update);
  const config = useAppStore((s) => s.config)!;

  const editing = editingId ? contacts.find((c) => c.id === editingId) ?? null : null;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState<{ blob: Blob; mime: string; ext: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* hydrate whenever the modal opens */
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        fullName: editing.fullName,
        phone: editing.phone,
        email: editing.email,
        school: editing.education.school,
        major: editing.education.major,
        year: editing.education.year,
        company: editing.work.company,
        position: editing.work.position,
        relationship: editing.relationship,
        bankName: editing.bank.bankName,
        accountNumber: editing.bank.accountNumber,
        birthday: editing.birthday,
        address: editing.address,
        notes: editing.notes,
        social: { ...editing.social },
      });
      setAvatarFile(null);
      setAvatarRemoved(false);
      if (editing.avatarId) {
        void resolveAvatarUrl(editing.avatarId).then(setAvatarUrl);
      } else {
        setAvatarUrl(null);
      }
    } else {
      setForm(EMPTY_FORM);
      setAvatarFile(null);
      setAvatarUrl(null);
      setAvatarRemoved(false);
    }
    setNameError(false);
    setSaving(false);
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const onPickAvatar = async (file: File | undefined) => {
    if (!file) return;
    try {
      const processed = await processImageFile(file);
      setAvatarFile(processed);
      setAvatarRemoved(false);
      setAvatarUrl(URL.createObjectURL(processed.blob));
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Image format not supported.");
    }
  };

  const save = async (e: ReactMouseEvent) => {
    const name = form.fullName.trim();
    if (!name) {
      setNameError(true);
      return;
    }
    const burstX = e.clientX;
    const burstY = e.clientY;
    setSaving(true);
    try {
      /* avatar: keep → reuse id, replace → store new blob, remove → null */
      let avatarId = editing?.avatarId ?? null;
      if (avatarFile) {
        if (avatarId) await removeImage(avatarId).catch(() => undefined);
        avatarId = await storeImage(avatarFile.blob, avatarFile.mime, avatarFile.ext);
      } else if (avatarRemoved && avatarId) {
        await removeImage(avatarId).catch(() => undefined);
        avatarId = null;
      }

      const social: FormState["social"] = {};
      for (const id of SOCIAL_IDS) {
        const s = form.social[id];
        if (s && (s.enabled || s.url.trim())) social[id] = { enabled: s.enabled, url: s.url.trim() };
      }

      const  NewContact = {
        fullName: name,
        avatarId,
        phone: form.phone.trim(),
        email: form.email.trim(),
        education: { school: form.school.trim(), major: form.major.trim(), year: form.year.trim() },
        work: { company: form.company.trim(), position: form.position.trim() },
        relationship: form.relationship,
        bank: { bankName: form.bankName.trim(), accountNumber: form.accountNumber.trim() },
        birthday: form.birthday,
        address: form.address.trim(),
        notes: form.notes.trim(),
        social,
      };

      if (editing) {
        await update(editing.id, data);
        toast("success", "Saved");
      } else {
        await add(data);
        toast("success", `${name} added to your vault`);
        fireBurst(burstX, burstY, 22);
      }
      setSaving(false);
      setSaved(true);
      closeTimer.current = window.setTimeout(() => {
        setSaved(false);
        closeForm();
      }, 650);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Unable to save contact.");
      setSaving(false);
    }
  };

  const socialRow = (id: SocialNetworkId) => {
    const link = form.social[id] ?? { enabled: false, url: "" };
    return (
      <div key={id} className="flex items-center gap-2.5 rounded-[7px] border-2 border-line bg-raised/70 px-3 py-2">
        <span className="text-muted" style={{ color: link.enabled ? undefined : undefined }}>
          <BrandIcon id={id} size={16} />
        </span>
        <span className="font-display w-20 shrink-0 text-xs font-bold capitalize text-ink">{id === "x" ? "X" : id}</span>
        <input
          type="url"
          value={link.url}
          onChange={(e) => set("social", { ...form.social, [id]: { ...link, url: e.target.value } })}
          placeholder="https://…"
          aria-label={`${id} URL`}
          className="field min-w-0 flex-1 px-3 py-1.5 text-xs"
        />
        <Toggle
          checked={link.enabled}
          onChange={(v) => set("social", { ...form.social, [id]: { ...link, enabled: v } })}
          label={`Enable ${id}`}
        />
      </div>
    );
  };

  return (
    <Modal open={open} onClose={closeForm} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between border-b-2 border-line px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg font-bold text-ink">
          {editing ? `Edit ${editing.fullName}` : "New contact"}
        </h2>
        <button
          type="button"
          onClick={closeForm}
          aria-label="Close"
          className="rounded-[7px] border-2 border-line bg-raised p-1.5 text-muted transition-colors hover:border-inkline hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {/* avatar picker */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Choose avatar photo"
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[12px] border-[3px] border-inkline bg-raised shadow-[3px_4px_0_var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-faint">
                <Camera size={20} />
                <span className="font-display text-[9px] font-bold uppercase tracking-wider">Photo</span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => onPickAvatar(e.target.files?.[0])}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-extrabold text-ink">Avatar</p>
            <p className="text-xs font-bold text-muted">JPG, PNG, WEBP or AVIF — auto-compressed to 512px WebP.</p>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => {
                  setAvatarRemoved(true);
                  setAvatarFile(null);
                  setAvatarUrl(null);
                }}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-danger hover:underline"
              >
                <Trash2 size={12} />
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* identity + contact */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name *" className="sm:col-span-2">
            <motion.div animate={nameError ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
              <input
                className={cn("field", nameError && "border-danger")}
                value={form.fullName}
                onChange={(e) => {
                  set("fullName", e.target.value);
                  if (nameError) setNameError(false);
                }}
                placeholder="e.g. Trần Minh Khôi"
                autoFocus
              />
            </motion.div>
            {nameError && <p className="mt-1 text-xs font-bold text-danger">A name is required.</p>}
          </Field>
          <Field label="Phone">
            <input className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0900 000 000" />
          </Field>
          <Field label="Email">
            <input className="field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" />
          </Field>
        </div>

        {/* education + work */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="School">
            <input className="field" value={form.school} onChange={(e) => set("school", e.target.value)} placeholder="PTIT" />
          </Field>
          <Field label="Major">
            <input className="field" value={form.major} onChange={(e) => set("major", e.target.value)} placeholder="Information Technology" />
          </Field>
          <Field label="Years">
            <input className="field" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2022 - 2026" />
          </Field>
          <Field label="Relationship">
            <select
              className="field"
              value={form.relationship}
              onChange={(e) => set("relationship", e.target.value as RelationshipStatus)}
            >
              {RELATIONSHIP_ORDER.map((r) => (
                <option key={r} value={r}>
                  {RELATIONSHIP_META[r].dot} {RELATIONSHIP_META[r].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Company">
            <input className="field" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="FPT Software" />
          </Field>
          <Field label="Position">
            <input className="field" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Frontend Developer" />
          </Field>
        </div>

        {/* bank */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Bank">
            <input className="field" list="vn-banks" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="MB Bank" />
            <datalist id="vn-banks">
              {VN_BANKS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field label="Account number">
            <input className="field" value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} placeholder="0123 456 789" />
          </Field>
          <Field label="Birthday">
            <input className="field" type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
          </Field>
          <Field label="Address">
            <input className="field" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Cầu Giấy, Hà Nội" />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <textarea
              className="field min-h-20 resize-y"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything worth remembering…"
            />
          </Field>
        </div>

        {/* social networks */}
        <p className="font-display mt-5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-faint">
          Social networks
        </p>
        <div className="mt-2 flex flex-col gap-2">{SOCIAL_IDS.map(socialRow)}</div>
        <p className="mt-2 text-[11px] font-bold text-faint">
          Icons only — URLs are never displayed, anywhere in the app. {config.app.name} keeps them private.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t-2 border-line px-5 py-4 sm:px-6">
        <button type="button" onClick={closeForm} className="btn-comic btn-paper px-5 py-2.5 text-sm">
          Cancel
        </button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={save}
          disabled={saving || saved}
          className={`btn-comic px-5 py-2.5 text-sm uppercase disabled:opacity-80 ${saved ? "bg-success text-onaccent" : "btn-accent"}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {saved ? (
              <motion.svg
                key="check"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.6 }}
              >
                <motion.path
                  d="M2.5 8.5 L6.5 12.5 L13.5 3.5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                />
              </motion.svg>
            ) : saving ? (
              <Loader2 key="spin" size={15} className="animate-spin" />
            ) : (
              <Save key="save" size={15} />
            )}
          </AnimatePresence>
          {saved ? "Saved!" : saving ? "Saving…" : editing ? "Save changes" : "Add to vault"}
        </motion.button>
      </div>
    </Modal>
  );
}