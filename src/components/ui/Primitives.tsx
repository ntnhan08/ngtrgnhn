/* Shared UI primitives — blocky Minecraft-item styling.
 * Tooltip, Toggle, Segmented, Modal (swipe-to-dismiss), ConfirmBody,
 * EmptyState, Sensitive (privacy-animated text), RelationshipBadge. */
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn, RELATIONSHIP_META } from "../../utils/format";
import type { RelationshipStatus } from "../../types";
import type { ConfirmState } from "../../store/uiStoreTypes";

/* --------------------------------- Tooltip -------------------------------- */

export function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="tip inline-flex" data-tip={label}>
      {children}
    </span>
  );
}

/* --------------------------------- Toggle --------------------------------- */

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[26px] w-[46px] shrink-0 rounded-full border-[2.5px] border-inkline transition-colors duration-200",
        checked ? "bg-accent" : "bg-raised",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      <motion.span
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "absolute top-[2px] left-0 h-[17px] w-[17px] rounded-full border-2 border-inkline",
          checked ? "bg-onaccent" : "bg-sun"
        )}
      />
    </button>
  );
}

/* -------------------------------- Segmented ------------------------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const layoutId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex gap-1 rounded-[10px] border-[2.5px] border-inkline bg-raised/70 p-1", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-[7px] px-3 py-1.5 font-display text-xs font-bold transition-colors duration-200",
              active ? "text-ink" : "text-muted hover:text-ink"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[7px] border-2 border-inkline bg-sun shadow-[2px_2px_0_var(--shadow-soft)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => panelRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-overlay"
            style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            /* dissolve with a hint of scale — no slide; opacity-only so the
               exit never repaints what is behind */
            style={{
              boxShadow: "10px 10px 0 var(--shadow-ink)",
              touchAction: "pan-x",
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
              willChange: "opacity, transform",
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 130 || info.velocity.y > 500) onClose();
            }}
            className={cn(
              "glass relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[14px] sm:rounded-[14px] outline-none",
              maxWidth
            )}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
          >
            {/* grab handle — visible swipe-to-dismiss affordance on touch */}
            <div className="flex justify-center pt-2 sm:hidden" aria-hidden="true">
              <span className="h-1.5 w-10 rounded-full bg-line-strong" />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ------------------------------ ConfirmDialog ------------------------------ */

/** Dialog body only — the host (App) keeps it mounted inside a Modal so the
 *  exit animation plays while the last content is still visible. */
export function ConfirmBody({
  state,
  onResolve,
}: {
  state: ConfirmState;
  onResolve: (ok: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ x: 0 }}
      animate={{ x: state.danger ? [0, -7, 7, -4, 4, 0] : 0 }}
      transition={{ duration: 0.42, delay: 0.12 }}
      className="p-6"
    >
      <span className={cn("chip-square h-12 w-12", state.danger ? "bg-danger text-white" : "bg-sun text-ink")}>
        <AlertTriangle size={22} />
      </span>
      <h2 className="font-display mt-4 text-xl font-bold text-ink">{state.title}</h2>
      <p className="mt-2 text-sm font-bold leading-relaxed text-muted">{state.message}</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => onResolve(false)}
          className="btn-comic btn-paper flex-1 px-4 py-2.5 text-sm"
        >
          {state.cancelLabel ?? "Cancel"}
        </button>
        <button
          type="button"
          onClick={() => onResolve(true)}
          className={cn(
            "btn-comic flex-1 px-4 py-2.5 text-sm uppercase",
            state.danger ? "bg-danger text-white" : "btn-accent"
          )}
        >
          {state.confirmLabel ?? "Confirm"}
        </button>
      </div>
    </motion.div>
  );
}

/* -------------------------------- EmptyState ------------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="glass mx-auto flex max-w-md flex-col items-center px-8 py-12 text-center"
    >
      <span className="chip-square mb-5 h-16 w-16 bg-sun text-ink">{icon}</span>
      <h3 className="font-display ink-pop text-2xl font-bold text-ink">{title}</h3>
      <p className="ink-pop mt-2 text-sm font-bold leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

/* ------------------------------ Sensitive text ----------------------------- */

/** Animates smoothly between a real value and its privacy mask. */
export function Sensitive({
  value,
  masked,
  className,
}: {
  value: string;
  masked: string;
  className?: string;
}) {
  const isMasked = value !== masked;
  return (
    <span className={cn("relative inline-block", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isMasked ? "masked" : "plain"}
          initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="inline-block"
        >
          {isMasked ? masked : value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ----------------------------- RelationshipBadge --------------------------- */

export function RelationshipBadge({
  status,
  size = "md",
}: {
  status: RelationshipStatus;
  size?: "sm" | "md";
}) {
  const meta = RELATIONSHIP_META[status];
  return (
    <span
      className={cn(
        "pop-chip font-display inline-flex items-center gap-1.5 rounded-full border-2 font-bold tracking-wide",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        meta.chip
      )}
    >
      <span aria-hidden="true" className={cn("text-[9px] leading-none", meta.text)}>
        {meta.dot}
      </span>
      {meta.label}
    </span>
  );
}
