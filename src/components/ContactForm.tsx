/* Add / edit contact modal — every change lands in IndexedDB immediately.
 * Avatar uploads are downscaled to WebP ≤512px before storage. Saving shows
 * an animated checkmark, then a leaf confetti burst on new contacts. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Loader2, Save, Trash2, Upload, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { Toggle } from "./ui/Primitives";
import { Modal } from "./ui/Primitives";
import { BRAND_ICONS } from "./icons/BrandIcons";
import { useAppStore } from "../store/appStore";
import { useContactsStore, type NewContact } from "../store/contactsStore";
import { useUiStore } from "../store/uiStore";
import { processImageFile, storeImage, removeImage } from "../services/images";
import { RELATIONSHIP_META, RELATIONSHIP_ORDER, VN_BANKS } from "../utils/format";
import type { ContactRecord, RelationshipStatus, SocialNetworkId, SocialLink } from "../types";

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

function fromContact(c: ContactRecord): FormState {
  return {
    fullName: c.fullName,
    phone: c.phone,
    email: c.email,
    school: c.education.school,
    major: c.education.major,
    year: c.education.year,
    company: c.work.company,
    position: c.work.position,
    relationship: c.relationship,
    bankName: c.bank.bankName,
    accountNumber: c.bank.accountNumber,
    birthday: c.birthday,
    address: c.address,
    notes: c.notes,
    social: { ...c.social },
  };
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <label className="block">
      <span className={`font-display mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] ${error ? "text-danger" : "text-faint"}`}>
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-display mt-6 mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-accent-hi first:mt-0">
      <span className="h-[3px] w-5 rounded-full bg-accent" aria-hidden="true" />
      {children}
    </p>
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

  const editing = editingId ? contacts.find((c) => c.id === editingId) ?? null : null;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState<{ blob: Blob; mime: string; ext: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromContact(editing) : EMPTY_FORM);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarRemoved(false);
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
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(URL.createObjectURL(processed.blob));
      setAvatarRemoved(false);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Image format not supported.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarRemoved(true);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "fullName") setNameError(false);
  };

  const setSocial = (id: SocialNetworkId, patch: Partial<SocialLink>) =>
    setForm((f) => ({
      ...f,
      social: { ...f.social, [id]: { enabled: false, url: "", ...f.social[id], ...patch } },
    }));

  const save = async (e: React.MouseEvent) => {
    const name = form.fullName.trim();
    if (!name) {
      setNameError(true);
      toast("error", "A name is required to file this card.");
      return;
    }
    const burstX = e.clientX;
    const burstY = e.clientY;
    setSaving(true);
    try {
      let avatarId = editing?.avatarId ?? null;
      if (avatarRemoved && avatarId) {
        await removeImage(avatarId);
        avatarId = null;
      }
      if (avatarFile) {
        avatarId = await storeImage(avatarFile.blob, avatarFile.mime, avatarFile.ext);
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
        social: form.social,
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

  const displayName = form.fullName.trim() || "New contact";

  return (
    <Modal open={open} onClose={closeForm} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between border-b-2 border-line px-5 py-4 sm:px-6">
        <h2 className="font-display text-xl font-bold text-ink">
          {editing ? "Edit contact" : "New contact"}
        </h2>
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={closeForm}
          aria-label="Close form"
          className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border-2 border-inkline bg-raised text-muted transition-colors hover:text-danger"
          style={{ boxShadow: "2px 2px 0 var(--shadow-soft)" }}
        >
          <X size={17} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {/* avatar picker */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              name={displayName}
              avatarId={avatarRemoved ? null : editing?.avatarId}
              avatarPath={avatarPreview ?? undefined}
              size={76}
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={() => fileRef.current?.click()}
              aria-label="Upload photo"
              className="absolute -bottom-1.5 -right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-inkline bg-sun text-ink"
              style={{ boxShadow: "2px 2px 0 var(--shadow-soft)" }}
            >
              <Camera size={14} />
            </motion.button>
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-comic btn-paper px-4 py-1.5 text-xs">
              <Upload size={13} />
              {avatarPreview || (!avatarRemoved && editing?.avatarId) ? "Change photo" : "Upload photo"}
            </button>
            {(avatarPreview || (!avatarRemoved && editing?.avatarId)) && (
              <button type="button" onClick={removeAvatar} className="btn-comic btn-danger px-4 py-1.5 text-xs">
                <Trash2 size={13} />
                Remove
              </button>
            )}
            <p className="text-[11px] font-bold text-faint">JPG · PNG · WEBP · AVIF — stored on-device</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => onPickAvatar(e.target.files?.[0])}
          />
        </div>

        <SectionTitle>Identity</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Full name" error={nameError}>
              <input
                className={`field ${nameError ? "border-danger" : ""}`}
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="e.g. Trần Minh Khôi"
                autoFocus
              />
            </Field>
          </div>
          <Field label="Phone">
            <input className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0900 000 000" inputMode="tel" />
          </Field>
          <Field label="Email">
            <input className="field" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" inputMode="email" />
          </Field>
          <Field label="Relationship">
            <select className="field" value={form.relationship} onChange={(e) => set("relationship", e.target.value as RelationshipStatus)}>
              {RELATIONSHIP_ORDER.map((r) => (
                <option key={r} value={r}>
                  {RELATIONSHIP_META[r].dot} {RELATIONSHIP_META[r].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Birthday">
            <input className="field" type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
          </Field>
        </div>

        <SectionTitle>Education & work</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="School">
            <input className="field" value={form.school} onChange={(e) => set("school", e.target.value)} placeholder="e.g. PTIT" />
          </Field>
          <Field label="Major">
            <input className="field" value={form.major} onChange={(e) => set("major", e.target.value)} placeholder="e.g. Information Technology" />
          </Field>
          <Field label="Years">
            <input className="field" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2022 - 2026" />
          </Field>
          <Field label="Company">
            <input className="field" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. FPT Software" />
          </Field>
          <Field label="Position">
            <input className="field" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="e.g. Frontend Developer" />
          </Field>
        </div>

        <SectionTitle>Bank</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Bank">
            <input className="field" list="vn-banks" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="e.g. MB Bank" />
            <datalist id="vn-banks">
              {VN_BANKS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field label="Account number">
            <input className="field" value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} placeholder="0123 456 789" inputMode="numeric" />
          </Field>
        </div>

        <SectionTitle>Social networks</SectionTitle>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {(Object.keys(BRAND_ICONS) as SocialNetworkId[]).map((id) => {
            const def = BRAND_ICONS[id];
            const link = form.social[id];
            return (
              <div key={id} className="rounded-[7px] border-2 border-line bg-raised/70 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-[13px] font-bold text-ink">{def.label}</span>
                  <Toggle checked={link?.enabled ?? false} onChange={(v) => setSocial(id, { enabled: v })} label={`Toggle ${def.label}`} />
                </div>
                <input
                  className="field mt-2"
                  value={link?.url ?? ""}
                  onChange={(e) => setSocial(id, { url: e.target.value, enabled: link?.enabled ?? (e.target.value.trim() ? true : false) })}
                  placeholder={`https://…`}
                  disabled={!(link?.enabled ?? false)}
                />
              </div>
            );
          })}
        </div>

        <SectionTitle>More</SectionTitle>
        <div className="flex flex-col gap-4">
          <Field label="Address">
            <input className="field" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Cầu Giấy, Hà Nội" />
          </Field>
          <Field label="Notes">
            <textarea className="field min-h-[88px] resize-y" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything worth remembering…" />
          </Field>
        </div>
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
