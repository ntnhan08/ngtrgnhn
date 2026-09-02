import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Sprout } from "lucide-react";
import { AppShell, Backdrop } from "./components/AppShell";
import { Toasts } from "./components/Toasts";
import { ConfirmBody, Modal } from "./components/ui/Primitives";
import type { ConfirmState } from "./store/uiStoreTypes";
import { Home } from "./pages/Home";
/* Everything except the landing page is code-split. The static HTML intro
   covers the download time, and the warm-up effect prefetches these chunks
   while the intro plays — so navigation afterwards is instant. */
const Contacts = lazy(() => import("./pages/Contacts").then((m) => ({ default: m.Contacts })));
const ProfileView = lazy(() =>
  import("./components/ProfileView").then((m) => ({ default: m.ProfileView }))
);
const ContactForm = lazy(() =>
  import("./components/ContactForm").then((m) => ({ default: m.ContactForm }))
);
const SettingsPage = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.SettingsPage }))
);
import { useAppStore } from "./store/appStore";
import { useSettingsStore } from "./store/settingsStore";
import { useUiStore } from "./store/uiStore";
import { ConfettiBurst } from "./components/Fx";
import type { ConfigIssue } from "./types";

/* --------------------------- intro timing model ---------------------------
 * Mirrors the CSS timeline in index.html (the "eye" sequence):
 *   0.25s      the eye fades in, dead-centre of the sun circle
 *   0.60s      it blinks 3 times (0.45s each) → done at 1.95s
 *   2.05s      it flips (rotateY) and settles into the "O" slot → 2.75s
 *   2.85s      letters pop one by one: E Y E C [eye] R E · L A B S (0.10s apart)
 *   4.35s      the underline sweeps across (0.6s) → done at 4.95s
 *   line-end   + 2.0s exact hold → the overlay starts dissolving (≈6.95s)
 *   + 0.55s    dissolve duration → app fully visible at ≈7.5s
 * ------------------------------------------------------------------------ */
const INTRO_LINE_START = 4.35;
const INTRO_LINE_END = INTRO_LINE_START + 0.6; // 4.95s — underline finished
const INTRO_HOLD = 2.0; // the exact requested 2s pause after the underline

/** Renders the one-shot confetti burst whenever an action fires one. */
function BurstLayer() {
  const burst = useUiStore((s) => s.burst);
  const clearBurst = useUiStore((s) => s.clearBurst);
  if (!burst) return null;
  return (
    <ConfettiBurst key={burst.id} particles={burst.particles} x={burst.x} y={burst.y} onDone={clearBurst} />
  );
}

/* ------------------------------ error screens ----------------------------- */

function ConfigErrorScreen({ issues, onContinue }: { issues: ConfigIssue[]; onContinue: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="glass w-full max-w-lg p-7"
        role="alert"
      >
        <span className="chip-square h-12 w-12 bg-danger text-white">
          <AlertTriangle size={22} />
        </span>
        <h1 className="font-display mt-4 text-3xl font-bold text-ink">Configuration Error</h1>
        <p className="mt-2 text-sm font-bold leading-relaxed text-muted">
          <code className="rounded-[5px] border border-line bg-raised px-1.5 py-0.5 font-mono text-xs text-danger">
            config/config.json
          </code>{" "}
          contains invalid values. Fix the fields below and reload — the app has already merged
          safe defaults so nothing is broken.
        </p>
        <ul className="mt-4 flex max-h-56 flex-col gap-2 overflow-y-auto rounded-[8px] border-[2.5px] border-dashed border-line-strong bg-raised/70 p-4">
          {issues.map((issue, i) => (
            <li key={i} className="text-[13px] font-bold text-muted">
              <code className="font-mono text-xs font-bold text-danger">{issue.path}</code>{" "}
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={onContinue}
          className="btn-comic btn-accent mt-5 w-full px-5 py-3 text-sm uppercase"
        >
          Continue with safe defaults
        </motion.button>
      </motion.div>
    </div>
  );
}

function BootErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass w-full max-w-md p-7 text-center">
        <span className="chip-square mx-auto h-12 w-12 bg-danger text-white">
          <AlertTriangle size={22} />
        </span>
        <h1 className="font-display mt-4 text-2xl font-bold text-ink">Failed to open the field guide</h1>
        <p className="mt-2 text-sm font-bold text-muted">{message}</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-comic btn-accent mt-5 px-5 py-2.5 text-sm">
          <RefreshCw size={14} />
          Reload
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- app ----------------------------------- */

export default function App() {
  const ready = useAppStore((s) => s.ready);
  const config = useAppStore((s) => s.config);
  const issues = useAppStore((s) => s.issues);
  const bootError = useAppStore((s) => s.bootError);
  const init = useAppStore((s) => s.init);
  const dismissIssues = useAppStore((s) => s.dismissIssues);
  const animation = useSettingsStore((s) => s.settings.animation);
  const view = useUiStore((s) => s.view);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  // The whole intro (eye → letters → underline → 2s hold) is driven by CSS
  // in index.html, outside #root. React computes how much of that sequence
  // is still running and holds the overlay for the remainder — it can never
  // cut the choreography short.
  useEffect(() => {
    document.body.classList.add("freeze-scene");
    const introStartedAt = window.__pvIntroStart ?? Date.now();
    const targetEnd = introStartedAt + (INTRO_LINE_END + INTRO_HOLD) * 1000;
    const delay = Math.max(150, targetEnd - Date.now());
    const t = window.setTimeout(() => setIntroDone(true), delay);
    return () => window.clearTimeout(t);
  }, []);

  const appReady = ready && Boolean(config) && !bootError;

  // #static-intro lives OUTSIDE #root, so its CSS choreography plays from
  // start to finish untouched by React. When the exact hold ends, fade it
  // out (.si-exit), remove it, and unfreeze the living sky beneath.
  useEffect(() => {
    if (!introDone) return;
    document.body.classList.remove("freeze-scene");
    const el = document.getElementById("static-intro");
    if (!el) return;
    el.classList.add("si-exit");
    const t = window.setTimeout(() => el.remove(), 600);
    return () => window.clearTimeout(t);
  }, [introDone]);

  // Prefetch the code-split pages while the intro plays.
  useEffect(() => {
    if (!ready) return;
    const warm = () => {
      void import("./pages/Contacts");
      void import("./components/ProfileView");
      void import("./components/ContactForm");
      void import("./pages/Settings");
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
    };
    if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(warm, { timeout: 1500 });
    else window.setTimeout(warm, 500);
  }, [ready]);

  if (bootError) {
    return (
      <>
        <Backdrop />
        <BootErrorScreen message={bootError} />
      </>
    );
  }

  return (
    <>
      {/* The app renders UNDERNEATH the native HTML intro (#static-intro
          lives outside #root at z-60, opaque), so its first frames paint
          behind the still-playing CSS choreography — no flash, no hitch. */}
      {appReady &&
        (issues.length > 0 ? (
          <ConfigErrorScreen issues={issues} onContinue={dismissIssues} />
        ) : (
          <MotionConfig reducedMotion={animation === "full" ? "user" : "always"}>
            <AppShell>
              <div className="relative">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={view}
                    /* Dissolve crossfade: the outgoing page lifts out of flow
                       (absolute) and melts over the incoming one. Opacity
                       only — nothing repaints, stays at 60fps. */
                    style={{ transform: "translateZ(0)", backfaceVisibility: "hidden", willChange: "opacity" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, position: "absolute", top: 0, left: 0, right: 0 }}
                    transition={{ opacity: { duration: 0.34, ease: [0.22, 1, 0.36, 1] } }}
                  >
                    {view === "home" ? (
                      <Home />
                    ) : view === "contacts" ? (
                      <Suspense fallback={<PageLoader />}>
                        <Contacts />
                      </Suspense>
                    ) : (
                      <Suspense fallback={<PageLoader />}>
                        <SettingsPage />
                      </Suspense>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </AppShell>
            <Suspense fallback={null}>
              <ProfileView />
              <ContactForm />
            </Suspense>
            <ConfirmDialogLayer />
            <Toasts />
            <BurstLayer />
          </MotionConfig>
        ))}

      {/* painted scene behind everything until the app (with its own scene) mounts */}
      {(!appReady || issues.length > 0) && <Backdrop />}
    </>
  );
}

/** Tiny eager fallback while a code-split chunk loads. */
function PageLoader() {
  return (
    <div className="flex justify-center py-28">
      <motion.span
        animate={{ y: [0, -12, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex h-13 w-13 items-center justify-center rounded-[10px] border-[3px] border-inkline bg-sun p-3 text-ink"
        style={{ boxShadow: "4px 4px 0 var(--shadow-ink)" }}
      >
        <Sprout size={22} />
      </motion.span>
    </div>
  );
}

/** Keeps the last dialog content mounted so the Modal exit animation is never blank. */
function ConfirmDialogLayer() {
  const confirm = useUiStore((s) => s.confirm);
  const closeConfirm = useUiStore((s) => s.closeConfirm);
  const [last, setLast] = useState<ConfirmState | null>(null);
  const state = confirm ?? last;
  useEffect(() => {
    if (confirm) setLast(confirm);
  }, [confirm]);
  return (
    <Modal open={Boolean(confirm)} onClose={() => closeConfirm(false)} maxWidth="max-w-sm">
      {state && <ConfirmBody state={state} onResolve={closeConfirm} />}
    </Modal>
  );
}
