/* Home — the owner's field-guide profile. No frame: identity and details sit
 * openly on the sky, lifted by a soft paper halo + ink halos so every fact
 * pops against the living backdrop. */
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowUpRight,
  Blocks,
  Briefcase,
  Cake,
  Check,
  Copy,
  Eye,
  EyeOff,
  GraduationCap,
  Landmark,
  Mail,
  MapPin,
  Phone,
  StickyNote,
} from "lucide-react";
import { Avatar } from "../components/Avatar";
import { BankInfo } from "../components/BankInfo";
import { Magnetic } from "../components/Fx";
import { SocialLinks } from "../components/icons/BrandIcons";
import { RelationshipBadge, Sensitive, Tip } from "../components/ui/Primitives";
import { OWNER_ID, ownerFromConfig } from "../services/configService";
import { useAppStore } from "../store/appStore";
import { useSettingsStore } from "../store/settingsStore";
import { useUiStore } from "../store/uiStore";
import { formatDate, maskEmail, maskPhone } from "../utils/format";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 240, damping: 26 },
  },
};

/** True from tablet-up — used to tighten the avatar/name stack on phones. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 640px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
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
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Tip label={copied ? "Copied!" : `Copy ${label.toLowerCase()}`}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        onClick={copy}
        aria-label={`Copy ${label}`}
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
          copied ? "bg-success/20 text-success" : "text-faint hover:bg-accent-soft hover:text-accent-hi"
        }`}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </motion.button>
    </Tip>
  );
}

function Row({
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
    <div className="flex items-start gap-3.5">
      <span className="chip-square mt-0.5 h-9 w-9 shrink-0 bg-sun text-ink">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="ink-pop font-display text-[10.5px] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
        <div className="flex items-start gap-1">
          <p className="ink-pop min-w-0 break-words text-[16px] font-extrabold leading-snug text-ink">{value}</p>
          {copyValue && <CopyChip value={copyValue} label={label} />}
        </div>
      </div>
    </div>
  );
}

export function Home() {
  const config = useAppStore((s) => s.config)!;
  const openProfile = useUiStore((s) => s.openProfile);
  const privacy = useSettingsStore((s) => s.settings.privacy);
  const setPrivacy = useSettingsStore((s) => s.setPrivacy);
  const isDesktop = useIsDesktop();

  const owner = ownerFromConfig(config);
  const v = config.visibility;

  const school = v.education.home ? owner.education.school.trim() : "";
  const major = v.major.home ? owner.education.major.trim() : "";
  const eduYear = v.education.home ? owner.education.year.trim() : "";
  const position = v.work.home && v.position.home ? owner.work.position.trim() : "";
  const company = v.work.home && v.company.home ? owner.work.company.trim() : "";
  const phone = v.phone.home ? owner.phone.trim() : "";
  const email = v.email.home ? owner.email.trim() : "";
  const birthday = v.birthday.home ? owner.birthday.trim() : "";
  const address = v.address.home ? owner.address.trim() : "";
  const notes = v.notes.home ? owner.notes.trim() : "";
  const showBank =
    v.bank.home &&
    ((v.bankName.home && owner.bank.bankName.trim()) ||
      (v.bankAccount.home && owner.bank.accountNumber.replace(/\D/g, "")));
  const eyebrow = position || major || "Personal profile";

  return (
    <>
      {/* floating privacy toggle */}
      {config.features.privacyMode && (
        <div className="fixed right-4 top-4 z-40">
          <Tip label={privacy ? "Privacy mode on" : "Privacy mode off"}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={() => setPrivacy(!privacy)}
              aria-pressed={privacy}
              aria-label="Toggle privacy mode"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-inkline transition-colors duration-200 ${
                privacy
                  ? "bg-accent text-onaccent shadow-[3px_4px_0_var(--shadow-ink)]"
                  : "bg-raised text-muted shadow-[3px_4px_0_var(--shadow-soft)] hover:text-ink"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={privacy ? "off" : "on"}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex"
                >
                  {privacy ? <EyeOff size={18} /> : <Eye size={18} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </Tip>
        </div>
      )}

      <div className="relative flex min-h-dvh items-center justify-center px-4 py-10 sm:py-16">
        {/* ambient paper glow so every fact pops off the sky */}
        <div className="profile-halo" aria-hidden="true" />

        <motion.div variants={container} initial="hidden" animate="show" className="relative w-full max-w-xl">
          {/* bobbing sticker avatar, magnetically following the pointer */}
          <motion.div variants={item} className="mx-auto flex h-36 w-36 items-center justify-center sm:h-56 sm:w-56">
            <Magnetic strength={0.3}>
              <div className="sticker-bob">
                <Avatar name={owner.fullName} avatarPath={owner.avatarPath} size={isDesktop ? 150 : 122} ring />
              </div>
            </Magnetic>
          </motion.div>

          {/* identity */}
          <motion.p
            variants={item}
            className="ink-pop font-heading mt-3.5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.26em] text-accent-hi sm:mt-8 sm:text-[12px]"
          >
            <Blocks size={14} />
            {eyebrow}
          </motion.p>
          <motion.h1
            variants={item}
            className="font-heading mt-1.5 text-center text-[38px] font-bold leading-[1.02] tracking-tight text-ink sm:mt-2 sm:text-[58px]"
            style={{ textShadow: "0.06em 0.07em 0 var(--sky), 0.12em 0.14em 0 var(--shadow-soft)" }}
          >
            {owner.fullName}
          </motion.h1>
          {v.relationship.home && (
            <motion.div variants={item} className="mt-2.5 flex justify-center sm:mt-4">
              <RelationshipBadge status={owner.relationship} />
            </motion.div>
          )}

          {/* open field-guide details — no frame */}
          <motion.div variants={item} className="mx-auto mt-7 flex max-w-sm flex-col gap-5 sm:mt-9">
            {school && (
              <Row
                icon={<GraduationCap size={17} />}
                label="Education"
                value={
                  <>
                    {school}
                    {eduYear && <span className="font-bold text-muted"> · {eduYear}</span>}
                  </>
                }
              />
            )}
            {major && <Row icon={<Blocks size={17} />} label="Major" value={major} />}
            {position && (
              <Row
                icon={<Briefcase size={17} />}
                label="Work"
                value={
                  <>
                    {position}
                    {company && <span className="font-bold text-muted"> · {company}</span>}
                  </>
                }
              />
            )}
            {phone && (
              <Row
                icon={<Phone size={17} />}
                label="Phone"
                value={<Sensitive value={phone} masked={maskPhone(phone)} />}
                copyValue={privacy ? undefined : phone}
              />
            )}
            {email && (
              <Row
                icon={<Mail size={17} />}
                label="Email"
                value={<Sensitive value={email} masked={maskEmail(email)} />}
                copyValue={privacy ? undefined : email}
              />
            )}
            {showBank && (
              <BankInfo
                bankName={owner.bank.bankName}
                accountNumber={owner.bank.accountNumber}
                privacy={privacy}
                showName={v.bankName.home}
                showAccount={v.bankAccount.home}
              />
            )}
            {birthday && <Row icon={<Cake size={17} />} label="Birthday" value={formatDate(birthday)} />}
            {address && <Row icon={<MapPin size={17} />} label="Address" value={address} />}
            {notes && (
              <Row
                icon={<StickyNote size={17} />}
                label="Notes"
                value={<span className="whitespace-pre-line">{notes}</span>}
              />
            )}
          </motion.div>

          {/* socials */}
          <motion.div variants={item} className="mt-6 flex justify-center sm:mt-9">
            <SocialLinks social={owner.social} size="md" />
          </motion.div>

          {/* the big comic call-to-action */}
          <motion.div variants={item} className="mt-7 flex justify-center sm:mt-10">
            <motion.button
              type="button"
              whileHover={{ rotate: -1.5, scale: 1.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => openProfile(OWNER_ID)}
              className="btn-comic btn-accent shine group px-7 py-3 text-base uppercase sm:px-9 sm:py-4 sm:text-lg"
            >
              View full profile
              <ArrowUpRight
                size={19}
                className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </motion.button>
          </motion.div>

          <motion.p
            variants={item}
            className="ink-pop font-display mt-6 text-center text-[12px] font-bold tracking-wide text-muted sm:mt-9"
          >
            Grown & kept on this device · {config.app.name}
          </motion.p>
        </motion.div>
      </div>
    </>
  );
}