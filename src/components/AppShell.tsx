/* App chrome — a living blocky Minecraft-style Overworld behind everything.
 * No taskbars, no sidebars: the scene IS the interface. The backdrop lives
 * at z-0, content at z-1, so nothing can ever cover it. Every sprite here is
 * hand-built from flat rects/polygons (no curves) for a true voxel-pixel
 * look, with a light top-bevel / dark bottom-bevel on most faces to fake
 * the game's blocky ambient-occlusion shading. */
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { CursorGlow } from "./Fx";
import { DayCritters, DayNightSky, Moon, NightCritters, Stars, useDayPhase } from "./Critters";

const INK = "#2b2014";
const PAPER = "#fdfcf3";
const GOLD = "#ffd93d";
const GOLD_DK = "#d9a017";
const GRASS = "#5d9c3f";
const GRASS_DK = "#3f6b25";
const DIRT = "#8b5a2b";
const DIRT_DK = "#6b4018";
const WOOD = "#9c6b3e";
const WOOD_DK = "#6b4423";
const LEAF = "#4f8f3f";
const LEAF_DK = "#396b2c";
const LEAF_LT = "#6fb452";
const DIAMOND = "#5ce1e6";
const DIAMOND_DK = "#2a9aa0";
const EMERALD = "#2ecc71";
const REDSTONE = "#e0432f";
const REDSTONE_DK = "#a82f1f";
const STONE = "#9c9c9c";
const STONE_DK = "#6e6e6e";
const STONE_LT = "#c6c6c6";
const SKY_BLUE = "#8ecae6";
const SKY_BLUE_DK = "#5fa8cf";

const finePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

/** Slow spring-smoothed pointer parallax for the whole painted scene. */
function useSceneParallax() {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, { stiffness: 40, damping: 18, mass: 0.8, restDelta: 0.05 });
  const y = useSpring(py, { stiffness: 40, damping: 18, mass: 0.8, restDelta: 0.05 });

  useEffect(() => {
    if (reduce || !finePointer()) return;
    let pending = false;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        /* Scene under the profile/intro blur must stay perfectly still. */
        if (document.body.classList.contains("freeze-scene")) return;
        px.set((cx / window.innerWidth - 0.5) * -22);
        py.set((cy / window.innerHeight - 0.5) * -14);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, px, py]);

  return { x, y };
}

/* --------------------------------- sun ------------------------------------ */

function Sun() {
  return (
    <div className="pointer-events-none absolute -right-16 -top-16 h-[300px] w-[300px] sm:h-[380px] sm:w-[380px]" aria-hidden="true">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <g className="sun-rays">
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x="92"
              y="2"
              width="16"
              height="32"
              fill={GOLD}
              stroke={INK}
              strokeWidth="3"
              transform={`rotate(${i * 45} 100 100)`}
            />
          ))}
        </g>
        <rect x="46" y="46" width="108" height="108" fill={GOLD} stroke={INK} strokeWidth="5" />
        <rect x="46" y="46" width="108" height="16" fill="#fff1a6" opacity="0.55" />
        <rect x="46" y="138" width="108" height="16" fill={GOLD_DK} opacity="0.4" />
        <rect x="70" y="82" width="14" height="14" fill={INK} />
        <rect x="116" y="82" width="14" height="14" fill={INK} />
        <rect x="76" y="120" width="10" height="8" fill={INK} />
        <rect x="86" y="126" width="28" height="8" fill={INK} />
        <rect x="114" y="120" width="10" height="8" fill={INK} />
      </svg>
    </div>
  );
}

/* --------------------------------- rainbow --------------------------------- */
/* A stepped "bridge" arch instead of a smooth arc — same 4-band composition
   as before, just voxelised into a staircase silhouette. */

function Rainbow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <g fill="none" strokeLinejoin="miter" strokeLinecap="square">
        <path d="M16,106 L16,86 L44,86 L44,58 L72,58 L72,26 L128,26 L128,58 L156,58 L156,86 L184,86 L184,106" stroke={REDSTONE} strokeWidth="11" />
        <path d="M34,106 L34,90 L56,90 L56,66 L78,66 L78,38 L122,38 L122,66 L144,66 L144,90 L166,90 L166,106" stroke={GOLD} strokeWidth="11" />
        <path d="M52,106 L52,94 L68,94 L68,74 L84,74 L84,50 L116,50 L116,74 L132,74 L132,94 L148,94 L148,106" stroke={EMERALD} strokeWidth="11" />
        <path d="M70,106 L70,98 L80,98 L80,82 L90,82 L90,62 L110,62 L110,82 L120,82 L120,98 L130,98 L130,106" stroke={DIAMOND} strokeWidth="11" />
      </g>
    </svg>
  );
}

/* --------------------------------- clouds ---------------------------------- */

function Cloud({
  top,
  dur,
  delay,
  scale,
  opacity,
}: {
  top: string;
  dur: number;
  delay: number;
  scale: number;
  opacity: number;
}) {
  return (
    <div className="cloud-drift" style={{ top, "--dur": `${dur}s`, "--delay": `${delay}s`, opacity } as CSSProperties} aria-hidden="true">
      <svg width={190 * scale} height={80 * scale} viewBox="0 0 190 80">
        <path
          d="M8,68 L8,44 L20,44 L20,24 L74,24 L74,44 L82,44 L82,12 L140,12 L140,44 L148,44 L148,28 L172,28 L172,44 L182,44 L182,68 Z"
          fill="#ffffff"
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="miter"
        />
      </svg>
    </div>
  );
}

/* --------------------------------- birds ----------------------------------- */

function Bird({
  top,
  dur,
  delay,
  scale,
  bob,
  flip = false,
}: {
  top: string;
  dur: number;
  delay: number;
  scale: number;
  bob: number;
  flip?: boolean;
}) {
  return (
    <div className="bird-fly" style={{ top, "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties} aria-hidden="true">
      <div className="bird-bob" style={{ "--bob": `${bob}s` } as CSSProperties}>
        <svg width={44 * scale} height={30 * scale} viewBox="0 0 44 30" style={flip ? { transform: "scaleX(-1)" } : undefined}>
          <rect x="3" y="15" width="9" height="6" fill={SKY_BLUE_DK} stroke={INK} strokeWidth="2" />
          <rect x="11" y="10" width="17" height="12" fill={PAPER} stroke={INK} strokeWidth="2.4" />
          <rect x="27" y="6" width="10" height="10" fill={PAPER} stroke={INK} strokeWidth="2.4" />
          <rect x="37" y="9.5" width="6" height="4" fill={GOLD_DK} stroke={INK} strokeWidth="1.4" />
          <rect x="31" y="9" width="2.6" height="2.6" fill={INK} />
          <rect className="bird-wing" x="12" y="3" width="15" height="9" fill={SKY_BLUE} stroke={INK} strokeWidth="2" />
          <rect className="bird-wing far" x="13" y="6" width="12" height="8" fill={SKY_BLUE_DK} stroke={INK} strokeWidth="1.6" />
        </svg>
      </div>
    </div>
  );
}

/* ----------------------------------- arrow ---------------------------------- */

function Arrow({ className, dur = 26, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div className={`plane-fly pointer-events-none absolute ${className ?? ""}`} style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties} aria-hidden="true">
      <svg width="40" height="16" viewBox="0 0 40 16">
        <rect x="4" y="6.5" width="26" height="3" fill={WOOD} stroke={INK} strokeWidth="1.2" />
        <polygon points="29,1 39,8 29,15" fill={STONE_LT} stroke={INK} strokeWidth="1.6" strokeLinejoin="miter" />
        <polygon points="4,2 11,8 4,8" fill={REDSTONE} stroke={INK} strokeWidth="1.2" strokeLinejoin="miter" />
        <polygon points="4,14 11,8 4,8" fill={REDSTONE_DK} stroke={INK} strokeWidth="1.2" strokeLinejoin="miter" />
      </svg>
    </div>
  );
}

/* -------------------------------- balloon ---------------------------------- */

function Balloon({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="balloon-bob">
        <svg width="64" height="100" viewBox="0 0 64 100">
          <rect x="16" y="4" width="32" height="14" fill={REDSTONE} stroke={INK} strokeWidth="3" />
          <rect x="10" y="18" width="44" height="16" fill={GOLD} stroke={INK} strokeWidth="3" />
          <rect x="6" y="34" width="52" height="16" fill={DIAMOND} stroke={INK} strokeWidth="3" />
          <rect x="10" y="50" width="44" height="14" fill={EMERALD} stroke={INK} strokeWidth="3" />
          <rect x="16" y="4" width="32" height="4" fill="#ffffff" opacity="0.3" />
          <path d="M22 70 L18 82 M42 70 L46 82" stroke={INK} strokeWidth="2.4" strokeLinecap="square" />
          <rect x="16" y="82" width="32" height="16" fill={WOOD} stroke={INK} strokeWidth="3" />
          <rect x="16" y="82" width="32" height="4" fill={WOOD_DK} />
        </svg>
      </div>
    </div>
  );
}

/* ----------------------------------- gem ------------------------------------ */
/* Replaces the kite — a floating faceted gem, bobbing on the same string. */

function Gem({ className, dur = 5, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="kite-bob" style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}>
        <svg width="52" height="66" viewBox="0 0 52 66">
          <polygon points="26,2 48,20 26,50 4,20" fill={DIAMOND} stroke={INK} strokeWidth="3" strokeLinejoin="miter" />
          <polygon points="26,2 34,20 26,50 18,20" fill={DIAMOND_DK} opacity="0.55" />
          <polygon points="26,2 48,20 34,20" fill="#eafeff" opacity="0.65" />
          <path d="M26 50 C22 56 30 58 27 64" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="square" />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------- butterflies ------------------------------- */

function Butterfly({ className, dur = 7, delay = 0, tone = REDSTONE }: { className?: string; dur?: number; delay?: number; tone?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="butterfly-drift" style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}>
        <svg width="28" height="24" viewBox="0 0 28 24">
          <g className="butterfly-wing">
            <rect x="2" y="2" width="11" height="9" fill={tone} stroke={INK} strokeWidth="1.8" />
            <rect x="4" y="12" width="8" height="7" fill={tone} stroke={INK} strokeWidth="1.8" opacity="0.85" />
          </g>
          <g className="butterfly-wing" style={{ transformOrigin: "14px 12px", transform: "scaleX(-1)", transformBox: "fill-box" }}>
            <rect x="2" y="2" width="11" height="9" fill={tone} stroke={INK} strokeWidth="1.8" />
            <rect x="4" y="12" width="8" height="7" fill={tone} stroke={INK} strokeWidth="1.8" opacity="0.85" />
          </g>
          <rect x="13" y="3" width="2" height="17" fill={INK} />
        </svg>
      </div>
    </div>
  );
}

/* ----------------------------------- bee ----------------------------------- */

function Bee({ className, dur = 9, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="bee-fly" style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}>
        <svg width="28" height="22" viewBox="0 0 28 22">
          <rect className="bee-wing" x="6" y="1" width="10" height="7" fill="#eaf6ff" stroke={INK} strokeWidth="1.4" opacity="0.9" />
          <rect className="bee-wing" x="15" y="1" width="8" height="6" fill="#eaf6ff" stroke={INK} strokeWidth="1.4" opacity="0.8" style={{ animationDelay: "0.06s" }} />
          <rect x="6" y="8" width="16" height="12" fill={GOLD} stroke={INK} strokeWidth="2.2" />
          <rect x="10" y="8" width="3" height="12" fill={INK} />
          <rect x="16" y="8" width="3" height="12" fill={INK} />
          <rect x="21.5" y="17" width="2.6" height="2.6" fill={INK} />
          <path d="M22 20 L26 22" stroke={INK} strokeWidth="1.8" strokeLinecap="square" />
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------------- snail ---------------------------------- */

function Snail({ className }: { className?: string }) {
  return (
    <div className={`snail-crawl pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <svg width="44" height="28" viewBox="0 0 44 28">
        <rect x="2" y="20" width="34" height="6" fill={GOLD} stroke={INK} strokeWidth="2.2" />
        <path d="M32 10 L38 4" stroke={INK} strokeWidth="2.2" strokeLinecap="square" />
        <rect x="36.5" y="1.5" width="3" height="3" fill={INK} />
        <rect x="12" y="6" width="18" height="18" fill={WOOD} stroke={INK} strokeWidth="2.4" />
        <rect x="16" y="10" width="10" height="4" fill={WOOD_DK} />
        <rect x="18" y="15" width="6" height="4" fill={WOOD_DK} />
      </svg>
    </div>
  );
}

/* ------------------------------- falling leaves ---------------------------- */

function FallLeaf({ left, dur, delay, size = 17, tone = LEAF }: { left: string; dur: number; delay: number; size?: number; tone?: string }) {
  return (
    <span className="leaf-fall-soft" style={{ left, "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties} aria-hidden="true">
      <span className="leaf-sway-soft" style={{ "--sway": `${3 + (dur % 3)}s`, "--amp": "16px" } as CSSProperties}>
        <svg width={size} height={size} viewBox="0 0 24 24" opacity="0.85">
          <rect x="4" y="4" width="16" height="16" fill={tone} stroke={INK} strokeWidth="2" />
          <rect x="4" y="4" width="16" height="5" fill="#ffffff" opacity="0.28" />
        </svg>
      </span>
    </span>
  );
}

/* ------------------------------- sparkles & blocks -------------------------- */

function Sparkle({ className, dur = 3, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute sparkle-twinkle ${className ?? ""}`}
      style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}
      aria-hidden="true"
    >
      <rect x="10" y="0" width="4" height="24" fill="#e6c9ff" />
      <rect x="0" y="10" width="24" height="4" fill="#e6c9ff" />
      <rect x="9" y="9" width="6" height="6" fill="#ffffff" />
    </svg>
  );
}

function FloatBlock({ className, dur = 18, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="puff-drift" style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}>
        <svg width="22" height="22" viewBox="0 0 22 22" opacity="0.9">
          <polygon points="11,1 20,6 11,11 2,6" fill={STONE_LT} stroke={INK} strokeWidth="1.2" strokeLinejoin="miter" />
          <polygon points="2,6 11,11 11,20 2,15" fill={STONE} stroke={INK} strokeWidth="1.2" strokeLinejoin="miter" />
          <polygon points="20,6 11,11 11,20 20,15" fill={STONE_DK} stroke={INK} strokeWidth="1.2" strokeLinejoin="miter" />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------ ground: trees ------------------------------ */

function AppleTree({ className, sway = 7, delay = 0, flip = false }: { className?: string; sway?: number; delay?: number; flip?: boolean }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="tree-sway" style={{ "--sway": `${sway}s`, "--delay": `${delay}s` } as CSSProperties}>
        <svg width="150" height="170" viewBox="0 0 150 170" style={flip ? { transform: "scaleX(-1)" } : undefined}>
          <rect x="63" y="96" width="24" height="72" fill={WOOD} stroke={INK} strokeWidth="4" />
          <rect x="63" y="96" width="8" height="72" fill={WOOD_DK} opacity="0.6" />
          <rect x="16" y="14" width="118" height="92" fill={LEAF} stroke={INK} strokeWidth="4.5" />
          <rect x="16" y="14" width="118" height="20" fill={LEAF_LT} opacity="0.55" />
          <rect x="16" y="86" width="118" height="20" fill={LEAF_DK} opacity="0.45" />
          <rect x="30" y="34" width="13" height="13" fill="#e2694f" stroke={INK} strokeWidth="2.2" />
          <rect x="70" y="26" width="13" height="13" fill="#e2694f" stroke={INK} strokeWidth="2.2" />
          <rect x="100" y="50" width="13" height="13" fill="#e2694f" stroke={INK} strokeWidth="2.2" />
          <rect x="46" y="66" width="13" height="13" fill="#e2694f" stroke={INK} strokeWidth="2.2" />
        </svg>
      </div>
    </div>
  );
}

function Mushroom({ className, cap = REDSTONE }: { className?: string; cap?: string }) {
  return (
    <svg viewBox="0 0 40 34" className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <rect x="15" y="15" width="10" height="17" fill="#fdf6e3" stroke={INK} strokeWidth="2.6" />
      <rect x="4" y="4" width="32" height="14" fill={cap} stroke={INK} strokeWidth="2.6" />
      <rect x="4" y="4" width="32" height="4" fill="#ffffff" opacity="0.25" />
      <rect x="10" y="9" width="4" height="4" fill="#fdf6e3" />
      <rect x="20" y="6" width="4" height="4" fill="#fdf6e3" />
      <rect x="27" y="10" width="4" height="4" fill="#fdf6e3" />
    </svg>
  );
}

function Flower({ className, delay = 0, petal = "#ffffff" }: { className?: string; delay?: number; petal?: string }) {
  return (
    <svg viewBox="0 0 24 34" className={`pointer-events-none absolute flower-sway ${className ?? ""}`} style={{ "--delay": `${delay}s` } as CSSProperties} aria-hidden="true">
      <rect x="10" y="16" width="4" height="16" fill={LEAF_DK} />
      <rect x="10" y="22" width="8" height="3" fill={LEAF} />
      <rect x="6" y="4" width="6" height="6" fill={petal} stroke={INK} strokeWidth="1.6" />
      <rect x="12" y="4" width="6" height="6" fill={petal} stroke={INK} strokeWidth="1.6" />
      <rect x="6" y="10" width="6" height="6" fill={petal} stroke={INK} strokeWidth="1.6" />
      <rect x="12" y="10" width="6" height="6" fill={petal} stroke={INK} strokeWidth="1.6" />
      <rect x="9" y="7" width="6" height="6" fill={GOLD} stroke={INK} strokeWidth="1.6" />
    </svg>
  );
}

function GrassStrip() {
  return (
    <svg viewBox="0 0 1440 110" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[13vh] min-h-[84px] w-full" aria-hidden="true">
      <rect x="0" y="34" width="1440" height="76" fill={DIRT} />
      <rect x="0" y="70" width="1440" height="40" fill={DIRT_DK} opacity="0.5" />
      <rect x="0" y="34" width="1440" height="18" fill={GRASS} />
      <rect x="0" y="34" width="1440" height="6" fill={GRASS_DK} opacity="0.45" />
      {Array.from({ length: 36 }, (_, i) => (
        <rect key={i} x={i * 40 + 6} y="30" width="10" height="8" fill={GRASS} />
      ))}
    </svg>
  );
}

/* --------------------------------- backdrop -------------------------------- */

export function Backdrop() {
  const parallax = useSceneParallax();
  const phase = useDayPhase();
  const daytime = phase === "dawn" || phase === "day";

  return (
    <motion.div className="app-backdrop pointer-events-none" style={{ x: parallax.x, y: parallax.y }} aria-hidden="true">
      <DayNightSky />
      {daytime ? <Sun /> : (
        <>
          <Stars />
          <Moon />
        </>
      )}

      {daytime && (
        <>
          <Rainbow className="left-[2vw] bottom-[10vh] w-[24vw] min-w-[210px] opacity-55" />

          <Cloud top="9%" dur={95} delay={-20} scale={1} opacity={0.95} />
          <Cloud top="24%" dur={140} delay={-80} scale={0.66} opacity={0.8} />
          <Cloud top="4%" dur={120} delay={-55} scale={0.85} opacity={0.85} />
          <Cloud top="58%" dur={160} delay={-110} scale={0.5} opacity={0.55} />

          <Bird top="14%" dur={38} delay={-6} scale={1} bob={3} />
          <Bird top="30%" dur={52} delay={-30} scale={0.7} bob={3.8} />
          <Bird top="20%" dur={44} delay={-18} scale={0.85} bob={3.2} flip />
          <Bird top="42%" dur={60} delay={-42} scale={0.55} bob={4.2} />
          <Bird top="8%" dur={48} delay={-24} scale={0.75} bob={2.8} flip />

          <Arrow className="top-[18vh] left-0" dur={26} delay={-8} />
          <Balloon className="left-[6vw] top-[16vh] fx-extra" />
          <Gem className="right-[8vw] top-[26vh] fx-extra" dur={5.4} delay={-1.6} />

          <Butterfly className="left-[16vw] bottom-[16vh]" dur={7} delay={-2} tone={REDSTONE} />
          <Butterfly className="right-[20vw] bottom-[13vh] fx-extra" dur={8.4} delay={-4.4} tone={GOLD} />
          <Bee className="left-[44vw] bottom-[6vh]" dur={10} delay={-2} />
          <Snail className="bottom-[1.5vh] left-0 fx-extra" />
        </>
      )}

      <Sparkle className="left-[30vw] top-[20vh] w-[20px]" dur={2.8} delay={-0.6} />
      <Sparkle className="right-[33vw] top-[30vh] w-[15px] fx-extra" dur={3.6} delay={-1.8} />
      <Sparkle className="left-[12vw] top-[42vh] w-[17px]" dur={3.2} delay={-2.6} />
      <Sparkle className="right-[10vw] top-[48vh] w-[13px] fx-extra" dur={2.5} delay={-1.1} />

      <FallLeaf left="4%" dur={26} delay={-4} size={18} tone={GRASS} />
      <FallLeaf left="11%" dur={30} delay={-16} size={13} tone={GOLD_DK} />
      <FallLeaf left="90%" dur={24} delay={-9} size={17} tone={LEAF} />
      <FallLeaf left="95%" dur={32} delay={-22} size={12} tone={LEAF_LT} />

      <FloatBlock className="left-[24vw] bottom-[9vh] fx-extra" dur={19} delay={-6} />
      <FloatBlock className="right-[28vw] bottom-[7vh] fx-extra" dur={23} delay={-14} />

      {/* the ground */}
      <GrassStrip />
      <AppleTree className="left-[3vw] bottom-[4vh]" sway={7} delay={-2} />
      <AppleTree className="right-[4vw] bottom-[3vh] hidden sm:block" sway={8.2} delay={-5} flip />
      <AppleTree className="left-[30vw] bottom-[2vh] hidden lg:block scale-75 origin-bottom" sway={9} delay={-3.4} />
      <Mushroom className="left-[16vw] bottom-[2.4vh] w-[42px]" cap={REDSTONE} />
      <Mushroom className="right-[18vw] bottom-[2vh] w-[34px] hidden sm:block" cap={GOLD} />
      <Flower className="left-[22vw] bottom-[2vh] w-[26px]" delay={-0.6} petal="#ffffff" />
      <Flower className="left-[48vw] bottom-[1.6vh] w-[22px]" delay={-1.8} petal="#f4978e" />
      <Flower className="right-[34vw] bottom-[2.2vh] w-[26px] hidden sm:block" delay={-2.6} petal="#ffffff" />
      <Flower className="right-[8vw] bottom-[1.8vh] w-[20px]" delay={-1.2} petal={GOLD} />
      <Flower className="left-[6vw] bottom-[1.7vh] w-[20px] hidden sm:block" delay={-3} petal="#f4978e" />

      {/* ground critters — the real-time day/night roster */}
      {daytime ? (
        <DayCritters className="pointer-events-none absolute inset-0" />
      ) : (
        <NightCritters className="pointer-events-none absolute inset-0" />
      )}
    </motion.div>
  );
}

/* --------------------------------- AppShell -------------------------------- */

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grain relative min-h-dvh">
      <Backdrop />
      {/* a soft gold glow that springs behind the pointer on desktop */}
      <CursorGlow />
      {/* z-1 > backdrop z-0, and fully transparent — the sky + sun show through */}
      <main className="relative z-[1]">{children}</main>
    </div>
  );
}
