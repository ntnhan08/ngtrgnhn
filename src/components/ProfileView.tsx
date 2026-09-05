/* Full profile overlay — opens over a strong blur + frozen scene so all
 * attention lands on the person. Comic panels with corner tags. Only
 * visibility-enabled fields render; scrolling stays at 60fps. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Cake,
  Check,
  Copy,
  GraduationCap,
  Landmark,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Share2,
  StickyNote,
  Trash2,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { BankInfo } from "./BankInfo";
import { SocialLinks } from "./icons/BrandIcons";
import { RelationshipBadge, Sensitive } from "./ui/Primitives";
import { useAppStore } from "../store/appStore";
import { useContactsStore } from "../store/contactsStore";
import { useSettingsStore } from "../store/settingsStore";
import { useUiStore } from "../store/uiStore";
import { OWNER_ID, ownerFromConfig } from "../services/configService";
import { formatDate, maskEmail, maskPhone, timeAgo } from "../utils/format";

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85, rotate: -8 }}
      aria-label={`Copy ${label}`}
      onClick={async () => {
        await copyText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-[6px] border-2 border-inkline transition-colors duration-150 ${
        copied ? "bg-success text-onaccent" : "bg-raised text-muted hover:bg-sun hover:text-ink"
      }`}
      style={{ boxShadow: "2px 2px 0 var(--shadow-soft)" }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </motion.button>
  );
}

function Panel({
  title,
  icon,
  children,
  index,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  index: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22, rotate: index % 2 ? 0.6 : -0.6 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="glass relative px-5 pb-5 pt-6 sm:px-6"
    >
      <span className="font-display absolute -top-3.5 left-4 inline-flex items-center gap-1.5 rounded-[5px] border-[2.5px] border-inkline bg-sun px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
        {icon}
        {title}
      </span>
      <div className="mt-1.5">{children}</div>
    </motion.section>
  );
}

function InfoRow({
  icon,
  label,
  value,
  copyValue,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  copyValue?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="chip-square mt-0.5 h-8 w-8 shrink-0 bg-sun text-ink">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-faint">{label}</p>
        <div className="flex items-start gap-1.5">
          <p className="min-w-0 break-words text-[15px] font-extrabold leading-snug text-ink">{value}</p>
          {copyValue && <CopyButton value={copyValue} label={label} />}
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ id }: { id: string }) {
  const closeProfile = useUiStore((s) => s.closeProfile);
  const openForm = useUiStore((s) => s.openForm);
  const askConfirm = useUiStore((s) => s.askConfirm);
  const toast = useUiStore((s) => s.toast);
  const config = useAppStore((s) => s.config)!;
  const contacts = useContactsStore((s) => s.contacts);
  const remove = useContactsStore((s) => s.remove);
  const privacy = useSettingsStore((s) => s.settings.privacy);

  const isOwner = id === OWNER_ID;
  const contact = isOwner ? ownerFromConfig(config) : contacts.find((c) => c.id === id) ?? null;

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const barScaleX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), {
    stiffness: 170,
    damping: 30,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProfile();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    /* Freeze the living scene so the blur samples one static frame — this is
       what keeps scrolling at a steady 60fps. */
    document.body.classList.add("freeze-scene");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.classList.remove("freeze-scene");
    };
  }, [closeProfile]);

  if (!contact) {
    return (
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center"
        style={{ backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", background: "var(--overlay)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button type="button" onClick={closeProfile} className="btn-comic btn-paper px-5 py-2.5 text-sm">
          <ArrowLeft size={15} />
          Back to vault
        </button>
      </motion.div>
    );
  }

  const v = config.visibility;
  const phone = contact.phone.trim();
  const email = contact.email.trim();
  const school = contact.education.school.trim();
  const major = contact.education.major.trim();
  const year = contact.education.year.trim();
  const position = contact.work.position.trim();
  const company = contact.work.company.trim();
  const birthday = contact.birthday.trim();
  const address = contact.address.trim();
  const notes = contact.notes.trim();

  const showContact = (v.phone.full && phone) || (v.email.full && email);
  const showEducation = (v.education.full && school) || (v.major.full && major);
  const showWork = (v.work.full && v.position.full && position) || (v.work.full && v.company.full && company);
  const showBank =
    v.bank.full &&
    ((v.bankName.full && contact.bank.bankName.trim()) ||
      (v.bankAccount.full && contact.bank.accountNumber.replace(/\D/g, "")));
  const socialCount = Object.values(contact.social).filter((s) => s && s.enabled && s.url.trim()).length;
  const showDetails = (v.birthday.full && birthday) || (v.address.full && address) || (v.notes.full && notes);

  const handleDelete = async () => {
    const ok = await askConfirm({
      title: `Delete ${contact.fullName}?`,
      message: "This action cannot be undone. The contact and their photo will be permanently removed from your vault.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) {
      await remove(contact.id);
      toast("info", `${contact.fullName} removed from vault`);
      closeProfile();
    }
  };

  let panelIndex = 0;

  return (
    <motion.div
      className="fixed inset-0 z-[70]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Profile of ${contact.fullName}`}
    >
      {/* everything behind melts into a blur */}
      <div
        className="absolute inset-0 bg-overlay"
        style={{
          backdropFilter: "blur(14px) saturate(0.9)",
          WebkitBackdropFilter: "blur(14px) saturate(0.9)",
          transform: "translateZ(0)",
        }}
        onClick={closeProfile}
        aria-hidden="true"
      />

      <motion.div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        style={{ transform: "translateZ(0)", backfaceVisibility: "hidden", willChange: "opacity, transform" }}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
      >
        {/* header */}
        <div className="sticky top-0 z-10">
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={closeProfile}
              aria-label="Back"
              className="btn-comic btn-paper h-10 px-3.5 text-[13px]"
            >
              <ArrowLeft size={15} />
              Back
            </motion.button>
            <div className="flex-1" />
            {!isOwner ? (
              <>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => openForm(contact.id)}
                  className="btn-comic btn-sun h-10 px-4 text-[13px]"
                >
                  <Pencil size={13} />
                  Edit
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={handleDelete}
                  aria-label={`Delete ${contact.fullName}`}
                  className="btn-comic btn-paper h-10 w-10 text-danger hover:bg-danger hover:text-white"
                >
                  <Trash2 size={15} />
                </motion.button>
              </>
            ) : (
              <span className="font-display inline-flex h-10 items-center gap-1.5 rounded-[7px] border-[3px] border-inkline bg-accent px-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-onaccent">
                Owner
              </span>
            )}
          </div>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pb-24 pt-6 sm:px-6">
          {/* identity */}
          <motion.header
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="flex flex-col items-center pt-2 text-center"
          >
            <motion.div whileHover={{ rotate: 0, scale: 1.04 }} className="rotate-[-3deg]" transition={{ type: "spring", stiffness: 300, damping: 18 }}>
              <Avatar name={contact.fullName} avatarId={contact.avatarId} avatarPath={contact.avatarPath} size={124} ring />
            </motion.div>
            <h1 className="font-heading mt-5 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              <span className="marker px-2">{contact.fullName}</span>
            </h1>
            {v.relationship.full && (
              <div className="mt-3.5">
                <RelationshipBadge status={contact.relationship} />
              </div>
            )}
          </motion.header>

          {showContact && (
            <Panel title="Contact" icon={<Phone size={12} />} index={panelIndex++}>
              <div className="flex flex-col gap-4">
                {v.phone.full && phone && (
                  <InfoRow
                    icon={<Phone size={15} />}
                    label="Phone"
                    value={<Sensitive value={phone} masked={maskPhone(phone)} reveal={config.reveal.phone && !privacy} />}
                    copyValue={privacy ? undefined : phone}
                  />
                )}
                {v.email.full && email && (
                  <InfoRow
                    icon={<Mail size={15} />}
                    label="Email"
                    value={<Sensitive value={email} masked={maskEmail(email)} reveal={!privacy} />}
                    copyValue={privacy ? undefined : email}
                  />
                )}
              </div>
            </Panel>
          )}

          {showEducation && (
            <Panel title="Education" icon={<GraduationCap size={12} />} index={panelIndex++}>
              <div className="flex flex-col gap-4">
                {v.education.full && school && <InfoRow icon={<GraduationCap size={15} />} label="School" value={school} />}
                {v.major.full && major && <InfoRow icon={<StickyNote size={15} />} label="Major" value={major} />}
                {v.education.full && year && <InfoRow icon={<Cake size={15} />} label="Years" value={year} />}
              </div>
            </Panel>
          )}

          {showWork && (
            <Panel title="Work" icon={<Briefcase size={12} />} index={panelIndex++}>
              <div className="flex flex-col gap-4">
                {v.work.full && v.position.full && position && <InfoRow icon={<Briefcase size={15} />} label="Position" value={position} />}
                {v.work.full && v.company.full && company && <InfoRow icon={<Landmark size={15} />} label="Company" value={company} />}
              </div>
            </Panel>
          )}

          {showBank && (
            <Panel title="Bank" icon={<Landmark size={12} />} index={panelIndex++}>
              <BankInfo
                bankName={contact.bank.bankName}
                accountNumber={contact.bank.accountNumber}
                privacy={privacy}
                reveal={config.reveal.bankAccount}
                showName={v.bankName.full}
                showAccount={v.bankAccount.full}
              />
            </Panel>
          )}

          {socialCount > 0 && (
            <Panel title="Social" icon={<Share2 size={12} />} index={panelIndex++}>
              <SocialLinks social={contact.social} size="md" />
            </Panel>
          )}

          {showDetails && (
            <Panel title="Details" icon={<StickyNote size={12} />} index={panelIndex++}>
              <div className="flex flex-col gap-4">
                {v.birthday.full && birthday && <InfoRow icon={<Cake size={15} />} label="Birthday" value={formatDate(birthday)} />}
                {v.address.full && address && <InfoRow icon={<MapPin size={15} />} label="Address" value={address} />}
                {v.notes.full && notes && (
                  <div className="rounded-[7px] border-2 border-dashed border-line-strong bg-raised/70 p-3.5">
                    <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Notes</p>
                    <p className="mt-1 whitespace-pre-line text-[14px] font-bold leading-relaxed text-ink">{notes}</p>
                  </div>
                )}
              </div>
            </Panel>
          )}

          {!isOwner && (
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="font-display text-center text-[11.5px] font-bold tracking-wide text-muted"
            >
              added {timeAgo(contact.createdAt)} · updated {timeAgo(contact.updatedAt)}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* sun-yellow reading progress pinned to the top edge */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 origin-left bg-sun"
        style={{ scaleX: barScaleX, boxShadow: "0 1px 6px rgba(255,210,63,0.7)" }}
        aria-hidden="true"
      />
    </motion.div>
  );
}

export function ProfileView() {
  const profileId = useUiStore((s) => s.profileId);
  return <AnimatePresence>{profileId && <ProfilePage key={profileId} id={profileId} />}</AnimatePresence>;
}