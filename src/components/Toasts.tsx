/* Toast stack — local feedback for save/delete/import/copy actions. */
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useUiStore } from "../store/uiStore";
import { cn } from "../utils/format";
import type { ToastKind } from "../types";

const KIND_META: Record<ToastKind, { icon: typeof Info; klass: string }> = {
  success: { icon: CheckCircle2, klass: "text-success" },
  error: { icon: AlertTriangle, klass: "text-danger" },
  info: { icon: Info, klass: "text-accent-hi" },
};

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[95] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const meta = KIND_META[toast.kind];
          const Icon = meta.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="glass pointer-events-auto flex w-full items-center gap-3 px-4 py-3"
            >
              <Icon size={17} className={cn("shrink-0", meta.klass)} />
              <p className="min-w-0 flex-1 truncate text-[13px] font-extrabold text-ink">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-faint transition-colors hover:text-ink"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
