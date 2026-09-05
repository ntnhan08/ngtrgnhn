/* Real-time day/night cycle for the Home backdrop, plus the ground critters
 * that populate each half of the cycle.
 *
 * A note on the roster: the ask named specific Mojang characters (Steve,
 * Enderman, Creeper, Zombie, Skeleton). Those are specific, actively
 * trademarked character designs — not a generic "blocky/voxel" style like
 * the rest of this reskin — so instead of reproducing their likenesses this
 * builds original creatures that fill the same two roles (a wandering
 * explorer + farm animals by day, a small roster of spooky critters by
 * night), in the same voxel language as the rest of the scene. Same idea,
 * same headcount, original designs.
 *
 * Time comes from real Vietnam wall-clock time (Asia/Ho_Chi_Minh), not the
 * device's own timezone, and is re-checked once a minute:
 *   05:00–07:00  dawn   07:00–17:00  day
 *   17:00–19:00  dusk   19:00–05:00  night
 */
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

function vietnamHour(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 12);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}

function phaseFromHour(h: number): DayPhase {
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 17) return "day";
  if (h >= 17 && h < 19) return "dusk";
  return "night";
}

/** Real Vietnam-time day phase, rechecked every minute. */
export function useDayPhase(): DayPhase {
  const [phase, setPhase] = useState<DayPhase>(() => phaseFromHour(vietnamHour()));
  useEffect(() => {
    const tick = () => setPhase(phaseFromHour(vietnamHour()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return phase;
}

const INK = "#2b2014";

const SKY: Record<DayPhase, { top: string; mid: string; bottom: string; glow: string }> = {
  dawn: { top: "#3c3a63", mid: "#e08a6b", bottom: "#ffd39a", glow: "rgba(255,201,140,0.55)" },
  day: { top: "#cdeeff", mid: "#8fcae8", bottom: "#5fa8d8", glow: "rgba(255,217,61,0.45)" },
  dusk: { top: "#2a1830", mid: "#8a4f6e", bottom: "#e08a52", glow: "rgba(255,166,94,0.5)" },
  night: { top: "#05070f", mid: "#0d1226", bottom: "#171b33", glow: "rgba(120,140,255,0.18)" },
};

/** Crossfaded sky gradient — swapping `background` outright cannot animate
 *  smoothly across browsers, so two layers fade into each other instead. */
export function DayNightSky() {
  const phase = useDayPhase();
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <AnimatePresence>
        <motion.div
          key={phase}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 4, ease: "easeInOut" }}
          style={{
            background: `radial-gradient(760px 760px at calc(100% - 96px) 44px, ${SKY[phase].glow}, transparent 62%), linear-gradient(180deg, ${SKY[phase].top} 0%, ${SKY[phase].mid} 46%, ${SKY[phase].bottom} 100%)`,
          }}
        />
      </AnimatePresence>
    </div>
  );
}

export function Moon() {
  return (
    <div className="pointer-events-none absolute -right-16 -top-16 h-[300px] w-[300px] sm:h-[380px] sm:w-[380px]" aria-hidden="true">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <rect x="54" y="54" width="92" height="92" fill="#e9edf4" stroke={INK} strokeWidth="5" />
        <rect x="54" y="54" width="92" height="14" fill="#ffffff" opacity="0.5" />
        <rect x="70" y="70" width="16" height="16" fill="#c3c9d6" />
        <rect x="102" y="96" width="20" height="20" fill="#c3c9d6" />
        <rect x="118" y="64" width="12" height="12" fill="#c3c9d6" />
      </svg>
    </div>
  );
}

export function Stars() {
  const pts = [
    [8, 12], [22, 28], [40, 8], [58, 22], [15, 45], [70, 12], [83, 34], [30, 60], [92, 55], [50, 40],
  ];
  return (
    <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {pts.map(([x, y], i) => (
        <rect key={i} className="sparkle-twinkle" x={x} y={y} width="1.6" height="1.6" fill="#ffffff" style={{ "--dur": `${2.4 + (i % 4)}s`, "--delay": `${i * 0.3}s` } as CSSProperties} />
      ))}
    </svg>
  );
}

/* --------------------------- shared walk helpers --------------------------- */

/** `flip` mirrors the sprite AND reverses the walk so it visibly travels the
 *  way it's facing, instead of moonwalking. */
function walkStyle(dur: number, delay: number, flip?: boolean): CSSProperties {
  return {
    "--dur": `${dur}s`,
    "--delay": `${delay}s`,
    animationDirection: flip ? "reverse" : "normal",
  } as CSSProperties;
}

function Legs({ x, tone }: { x: number; tone: string }) {
  return (
    <>
      <rect className="leg-a" x={x} y="20" width="5" height="8" fill={tone} stroke={INK} strokeWidth="1.6" />
      <rect className="leg-b" x={x + 14} y="20" width="5" height="8" fill={tone} stroke={INK} strokeWidth="1.6" />
    </>
  );
}

/* ---------------------------------- day life -------------------------------- */

function Pig({ className, dur, delay, flip }: { className?: string; dur: number; delay: number; flip?: boolean }) {
  return (
    <div className={`walk-across pointer-events-none absolute bottom-[2.2vh] ${className ?? ""}`} style={walkStyle(dur, delay, flip)} aria-hidden="true">
      <svg width="46" height="30" viewBox="0 0 46 30" style={flip ? { transform: "scaleX(-1)" } : undefined}>
        <Legs x={4} tone="#d97ea0" />
        <Legs x={24} tone="#f4a6c1" />
        <rect x="6" y="6" width="30" height="16" fill="#f4a6c1" stroke={INK} strokeWidth="2.2" />
        <rect x="6" y="6" width="30" height="4" fill="#ffffff" opacity="0.3" />
        <rect x="30" y="0" width="13" height="12" fill="#f4a6c1" stroke={INK} strokeWidth="2.2" />
        <rect x="39" y="4" width="4" height="4" fill="#d97ea0" stroke={INK} strokeWidth="1.2" />
        <rect x="34" y="3" width="2" height="2" fill={INK} />
      </svg>
    </div>
  );
}

function Chicken({ className, dur, delay, flip }: { className?: string; dur: number; delay: number; flip?: boolean }) {
  return (
    <div className={`walk-across pointer-events-none absolute bottom-[2vh] ${className ?? ""}`} style={walkStyle(dur, delay, flip)} aria-hidden="true">
      <svg width="26" height="28" viewBox="0 0 28 28" style={flip ? { transform: "scaleX(-1)" } : undefined}>
        <Legs x={6} tone="#e8a33d" />
        <rect x="4" y="6" width="16" height="14" fill="#f7f2e2" stroke={INK} strokeWidth="2" />
        <rect x="15" y="0" width="10" height="10" fill="#f7f2e2" stroke={INK} strokeWidth="2" />
        <rect x="13" y="0" width="4" height="4" fill="#e0432f" />
        <rect x="23" y="3" width="4" height="3" fill="#e8a33d" stroke={INK} strokeWidth="1" />
        <rect x="19" y="3" width="2" height="2" fill={INK} />
      </svg>
    </div>
  );
}

function Cow({ className, dur, delay, flip }: { className?: string; dur: number; delay: number; flip?: boolean }) {
  return (
    <div className={`walk-across pointer-events-none absolute bottom-[2.2vh] ${className ?? ""}`} style={walkStyle(dur, delay, flip)} aria-hidden="true">
      <svg width="52" height="34" viewBox="0 0 52 34" style={flip ? { transform: "scaleX(-1)" } : undefined}>
        <Legs x={4} tone="#3a2e22" />
        <Legs x={28} tone="#f2ede0" />
        <rect x="6" y="6" width="34" height="18" fill="#f2ede0" stroke={INK} strokeWidth="2.4" />
        <rect x="12" y="6" width="10" height="9" fill="#3a2e22" />
        <rect x="26" y="14" width="9" height="8" fill="#3a2e22" />
        <rect x="34" y="0" width="14" height="13" fill="#f2ede0" stroke={INK} strokeWidth="2.4" />
        <rect x="46" y="4" width="4" height="4" fill="#e8a9a0" stroke={INK} strokeWidth="1.2" />
        <rect x="40" y="3" width="2.4" height="2.4" fill={INK} />
      </svg>
    </div>
  );
}

function Sheep({ className, dur, delay, flip }: { className?: string; dur: number; delay: number; flip?: boolean }) {
  return (
    <div className={`walk-across pointer-events-none absolute bottom-[2vh] ${className ?? ""}`} style={walkStyle(dur, delay, flip)} aria-hidden="true">
      <svg width="42" height="30" viewBox="0 0 42 30" style={flip ? { transform: "scaleX(-1)" } : undefined}>
        <Legs x={4} tone="#3a2e22" />
        <Legs x={20} tone="#3a2e22" />
        <rect x="4" y="8" width="28" height="14" fill="#f5f5f0" stroke={INK} strokeWidth="2.2" />
        <rect x="8" y="4" width="6" height="6" fill="#f5f5f0" stroke={INK} strokeWidth="1.4" />
        <rect x="18" y="4" width="6" height="6" fill="#f5f5f0" stroke={INK} strokeWidth="1.4" />
        <rect x="28" y="0" width="12" height="12" fill="#3a2e22" stroke={INK} strokeWidth="2.2" />
        <rect x="36" y="4" width="2.4" height="2.4" fill="#f5f5f0" />
      </svg>
    </div>
  );
}

/** A generic wandering explorer — not a likeness of any specific character:
 *  wide-brim hat, forest-green poncho, neutral block head. */
function Explorer({ className, dur, delay, flip }: { className?: string; dur: number; delay: number; flip?: boolean }) {
  return (
    <div className={`walk-across pointer-events-none absolute bottom-[2vh] ${className ?? ""}`} style={walkStyle(dur, delay, flip)} aria-hidden="true">
      <svg width="26" height="46" viewBox="0 0 26 46" style={flip ? { transform: "scaleX(-1)" } : undefined}>
        <Legs x={6} tone="#5c4326" />
        <rect x="5" y="16" width="16" height="20" fill="#4a7a3d" stroke={INK} strokeWidth="2.2" />
        <rect x="5" y="16" width="16" height="5" fill="#5f9a4d" opacity="0.6" />
        <rect x="7" y="2" width="12" height="12" fill="#d9a066" stroke={INK} strokeWidth="2.2" />
        <rect x="2" y="0" width="22" height="4" fill="#3a2a18" stroke={INK} strokeWidth="1.6" />
        <rect x="8" y="0" width="10" height="3" fill="#5c4326" />
        <rect x="10" y="7" width="2.4" height="2.4" fill={INK} />
        <rect x="15" y="7" width="2.4" height="2.4" fill={INK} />
      </svg>
    </div>
  );
}

export function DayCritters({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <Explorer className="left-0" dur={46} delay={-6} />
      <Pig className="left-0" dur={38} delay={-14} />
      <Chicken className="left-0" dur={30} delay={-4} flip />
      <Cow className="left-0 hidden sm:block" dur={52} delay={-22} />
      <Sheep className="left-0 hidden sm:block" dur={42} delay={-30} flip />
    </div>
  );
}

/* --------------------------------- night life ------------------------------- */

/** A drifting shade — floats rather than walks, deliberately round and
 *  cloak-like rather than tall-and-thin. */
function ShadowWisp({ className, dur, delay }: { className?: string; dur: number; delay: number }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="balloon-bob" style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}>
        <svg width="30" height="40" viewBox="0 0 30 40">
          <path d="M15 2 C24 2 27 14 27 24 L27 34 L21 30 L15 36 L9 30 L3 34 L3 24 C3 14 6 2 15 2 Z" fill="#1a1220" stroke={INK} strokeWidth="2" />
          <rect x="9" y="16" width="4" height="5" fill="#b980f0" />
          <rect x="17" y="16" width="4" height="5" fill="#b980f0" />
        </svg>
      </div>
    </div>
  );
}

/** A small round swamp critter — one big eye, stubby legs; round rather
 *  than the iconic four-legged rectangular silhouette it evokes. */
function SwampCrawler({ className, dur, delay, flip }: { className?: string; dur: number; delay: number; flip?: boolean }) {
  return (
    <div className={`walk-across pointer-events-none absolute bottom-[1.8vh] ${className ?? ""}`} style={walkStyle(dur, delay, flip)} aria-hidden="true">
      <svg width="30" height="28" viewBox="0 0 30 28" style={flip ? { transform: "scaleX(-1)" } : undefined}>
        <Legs x={8} tone="#3d6631" />
        <rect x="4" y="2" width="22" height="16" fill="#4a7a3d" stroke={INK} strokeWidth="2.2" />
        <rect x="4" y="2" width="22" height="4" fill="#6fae5b" opacity="0.5" />
        <rect x="10" y="7" width="10" height="6" fill="#0d1a0a" />
        <rect x="13" y="9" width="4" height="2.4" fill="#9df06b" />
      </svg>
    </div>
  );
}

/** A hunched pale creature — compact and quadruped, not an upright bow-armed
 *  humanoid. */
function BoneRattler({ className, dur, delay, flip }: { className?: string; dur: number; delay: number; flip?: boolean }) {
  return (
    <div className={`walk-across pointer-events-none absolute bottom-[1.8vh] ${className ?? ""}`} style={walkStyle(dur, delay, flip)} aria-hidden="true">
      <svg width="34" height="28" viewBox="0 0 40 28" style={flip ? { transform: "scaleX(-1)" } : undefined}>
        <Legs x={4} tone="#cfc7ae" />
        <Legs x={20} tone="#e4ddc8" />
        <rect x="4" y="4" width="24" height="12" fill="#e4ddc8" stroke={INK} strokeWidth="2.2" />
        <rect x="9" y="7" width="4" height="9" fill="#b6ad91" opacity="0.7" />
        <rect x="16" y="7" width="4" height="9" fill="#b6ad91" opacity="0.7" />
        <rect x="26" y="1" width="8" height="8" fill="#e4ddc8" stroke={INK} strokeWidth="2" />
        <rect x="29" y="4" width="2" height="2" fill={INK} />
      </svg>
    </div>
  );
}

/** A short, hunched, moss-covered lurker — compact and round-backed rather
 *  than an upright human silhouette. */
function MossLurker({ className, dur, delay, flip }: { className?: string; dur: number; delay: number; flip?: boolean }) {
  return (
    <div className={`walk-across pointer-events-none absolute bottom-[1.8vh] ${className ?? ""}`} style={walkStyle(dur, delay, flip)} aria-hidden="true">
      <svg width="24" height="28" viewBox="0 0 24 28" style={flip ? { transform: "scaleX(-1)" } : undefined}>
        <Legs x={4} tone="#37502a" />
        <rect x="2" y="8" width="18" height="14" fill="#4f6b3a" stroke={INK} strokeWidth="2.2" />
        <rect x="2" y="8" width="18" height="4" fill="#6d8f4f" opacity="0.55" />
        <rect x="4" y="0" width="12" height="10" fill="#4f6b3a" stroke={INK} strokeWidth="2.2" />
        <rect x="6" y="4" width="2.4" height="2.4" fill="#0d1a0a" />
        <rect x="11" y="4" width="2.4" height="2.4" fill="#0d1a0a" />
      </svg>
    </div>
  );
}

export function NightCritters({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <ShadowWisp className="left-[20vw] top-[22vh] fx-extra" dur={6.5} delay={-1.4} />
      <ShadowWisp className="right-[24vw] top-[34vh] fx-extra" dur={7.4} delay={-3} />
      <SwampCrawler className="left-0" dur={44} delay={-8} />
      <BoneRattler className="left-0 hidden sm:block" dur={36} delay={-18} flip />
      <MossLurker className="left-0" dur={50} delay={-26} />
    </div>
  );
}
