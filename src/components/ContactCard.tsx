/* Contact cards — floating directly on the sky (no card background), with
 * ink-pop text halos so every detail stays readable over the living scene.
 * Grid card (with optional subtle 3D tilt) and list row. */
import { memo, type KeyboardEvent, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, type Variants } from "framer-motion";
import { ArrowUpRight, Briefcase, ChevronRight, GraduationCap } from "lucide-react";
import { Avatar } from "./Avatar";
import { SocialLinks } from "./icons/BrandIcons";
import { RelationshipBadge } from "./ui/Primitives";
import { useAppStore } from "../store/appStore";
import { useSettingsStore } from "../store/settingsStore";
import { useUiStore } from "../store/uiStore";
import type { ContactRecord } from "../types";

export const gridContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

export const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 28 },
  },
};

const finePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useTilt(enabled: boolean) {
  const rXSource = useMotionValue(0);
  const rYSource = useMotionValue(0);
  const rotateX = useSpring(rXSource, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(rYSource, { stiffness: 200, damping: 20 });

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rYSource.set(px * 6); // ≈ ±3°
    rXSource.set(-py * 6);
  };
  const onMouseLeave = () => {
    rXSource.set(0);
    rYSource.set(0);
  };
  return { rotateX, rotateY, onMouseMove, onMouseLeave };
}

export const ContactCard = memo(function ContactCard({
  contact,
  tiltEnabled,
}: {
  contact: ContactRecord;
  tiltEnabled: boolean;
}) {
  const config = useAppStore((s) => s.config)!;
  const openProfile = useUiStore((s) => s.openProfile);
  const tiltOn = tiltEnabled && finePointer() && !prefersReducedMotion();
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(tiltOn);

  const v = config.visibility;
  const school = v.education.home ? contact.education.school.trim() : "";
  const position = v.work.home && v.position.home ? contact.work.position.trim() : "";
  const company = v.work.home && v.company.home ? contact.work.company.trim() : "";
  const workLine = [position, company].filter(Boolean).join(" · ");

  const open = () => openProfile(contact.id);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  return (
    <motion.article
      layout
      variants={gridItemVariants}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.22 } }}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: "preserve-3d" }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`View profile of ${contact.fullName}`}
        onClick={open}
        onKeyDown={onKeyDown}
        className="group flex h-full cursor-pointer flex-col items-center rounded-[16px] px-6 pb-5 pt-8 text-center outline-none focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-accent"
      >
        <Avatar name={contact.fullName} avatarId={contact.avatarId} size={88} ring />

        <h3 className="font-display ink-pop mt-4 line-clamp-1 text-[18px] font-bold tracking-tight text-ink">
          {contact.fullName}
        </h3>
        {v.relationship.home && (
          <div className="mt-2">
            <RelationshipBadge status={contact.relationship} size="sm" />
          </div>
        )}

        {(school || workLine) && (
          <div className="mt-3.5 flex w-full flex-col gap-1.5">
            {school && (
              <p className="ink-pop flex items-center justify-center gap-1.5 text-[13px] font-extrabold text-muted">
                <GraduationCap size={13} className="shrink-0 text-accent-hi" />
                <span className="line-clamp-1">{school}</span>
              </p>
            )}
            {workLine && (
              <p className="ink-pop flex items-center justify-center gap-1.5 text-[13px] font-extrabold text-muted">
                <Briefcase size={13} className="shrink-0 text-accent-hi" />
                <span className="line-clamp-1">{workLine}</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-4 min-h-0">
          <SocialLinks social={contact.social} size="sm" className="justify-center" />
        </div>

        <div className="mt-auto w-full pt-5">
          <span className="btn-comic btn-paper pointer-events-none w-full px-4 py-2 text-[13px] uppercase group-hover:bg-sun">
            View Profile
            <ArrowUpRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>
    </motion.article>
  );
});

export const ContactRow = memo(function ContactRow({ contact }: { contact: ContactRecord }) {
  const config = useAppStore((s) => s.config)!;
  const openProfile = useUiStore((s) => s.openProfile);
  const v = config.visibility;

  const school = v.education.home ? contact.education.school.trim() : "";
  const position = v.work.home && v.position.home ? contact.work.position.trim() : "";
  const company = v.work.home && v.company.home ? contact.work.company.trim() : "";
  const meta = [school, position, company].filter(Boolean).join(" · ");

  const open = () => openProfile(contact.id);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  return (
    <motion.div
      layout
      variants={gridItemVariants}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.22 } }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`View profile of ${contact.fullName}`}
        onClick={open}
        onKeyDown={onKeyDown}
        className="group flex cursor-pointer items-center gap-3.5 rounded-[14px] px-4 py-3 outline-none focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-accent sm:px-5"
      >
        <Avatar name={contact.fullName} avatarId={contact.avatarId} size={46} />
        <div className="min-w-0 flex-1">
          <p className="ink-pop font-display truncate text-[15px] font-bold text-ink">{contact.fullName}</p>
          <p className="ink-pop truncate text-xs font-extrabold text-muted">{meta || "No details yet"}</p>
        </div>
        {v.relationship.home && (
          <div className="hidden sm:block">
            <RelationshipBadge status={contact.relationship} size="sm" />
          </div>
        )}
        <SocialLinks social={contact.social} size="sm" className="hidden max-w-24 lg:flex" />
        <ChevronRight
          size={16}
          className="ink-pop shrink-0 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent-hi"
        />
      </div>
    </motion.div>
  );
});

export function useTiltGate(): boolean {
  const animation = useSettingsStore((s) => s.settings.animation);
  const cardTilt = useAppStore((s) => s.config?.appearance.cardTilt ?? false);
  return cardTilt && animation === "full";
}