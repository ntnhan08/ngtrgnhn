/* App chrome — a living cartoon nature-school scene behind everything.
 * No taskbars, no sidebars: the scene IS the interface. The backdrop lives
 * at z-0, content at z-1, so nothing can ever cover it. */
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { CursorGlow } from "./Fx";

const INK = "#223a2b";
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
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x="96"
              y="6"
              width="8"
              height="34"
              rx="3"
              fill="#ffd23f"
              stroke={INK}
              strokeWidth="3"
              transform={`rotate(${i * 30} 100 100)`}
            />
          ))}
        </g>
        <circle cx="100" cy="100" r="52" fill="#ffd23f" stroke={INK} strokeWidth="5" />
        <circle cx="84" cy="92" r="5" fill={INK} />
        <circle cx="116" cy="92" r="5" fill={INK} />
        <path d="M82 112 Q100 126 118 112" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* --------------------------------- rainbow --------------------------------- */

function Rainbow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 110" className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <path d="M16 106 A84 84 0 0 1 184 106" fill="none" stroke="#e2694f" strokeWidth="12" strokeLinecap="round" />
      <path d="M34 106 A66 66 0 0 1 166 106" fill="none" stroke="#ffd23f" strokeWidth="12" strokeLinecap="round" />
      <path d="M52 106 A48 48 0 0 1 148 106" fill="none" stroke="#3d9b5f" strokeWidth="12" strokeLinecap="round" />
      <path d="M70 106 A30 30 0 0 1 130 106" fill="none" stroke="#8ecae6" strokeWidth="12" strokeLinecap="round" />
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
          d="M38 62 C16 62 10 44 24 36 C22 18 44 8 58 18 C66 2 96 2 104 16 C122 4 148 14 146 32 C166 32 174 50 158 60 C150 66 138 62 130 62 Z"
          fill="#ffffff"
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
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
          <ellipse cx="20" cy="17" rx="10" ry="6.5" fill="#fdfcf3" stroke={INK} strokeWidth="2.4" />
          <circle cx="31" cy="13" r="5.5" fill="#fdfcf3" stroke={INK} strokeWidth="2.4" />
          <path d="M36 12.5 L42 14 L36 16 Z" fill="#e0a52e" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="32.5" cy="11.5" r="1.2" fill={INK} />
          <path d="M9 17 L2 15 M9 19 L2 21" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <path className="bird-wing" d="M14 14 Q20 2 29 8 Q22 12 18 15 Z" fill="#8ecae6" stroke={INK} strokeWidth="2" />
          <path className="bird-wing far" d="M15 15 Q19 6 26 9 Q21 12 18 15 Z" fill="#5fa8cf" stroke={INK} strokeWidth="1.6" />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------- paper plane ------------------------------- */

function PaperPlane({ className, dur = 26, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div className={`plane-fly pointer-events-none absolute ${className ?? ""}`} style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties} aria-hidden="true">
      <svg width="36" height="26" viewBox="0 0 36 26">
        <path d="M1 19 H8 M4 23 H10" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.35" />
        <path d="M14 14 L34 3 L19 24 L16.5 16 Z" fill="#fdfcf3" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M16.5 16 L34 3" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* -------------------------------- balloon ---------------------------------- */

function Balloon({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="balloon-bob">
        <svg width="72" height="104" viewBox="0 0 72 104">
          <path d="M36 4 C14 4 4 24 6 40 C8 58 24 70 30 74 L42 74 C48 70 64 58 66 40 C68 24 58 4 36 4 Z" fill="#e2694f" stroke={INK} strokeWidth="3" />
          <path d="M24 6 C14 14 12 30 14 42 C16 56 24 66 29 72 L24 72 C16 62 8 50 8 36 C8 22 14 10 24 6 Z" fill="#ffd23f" stroke={INK} strokeWidth="2" />
          <path d="M48 6 C58 14 60 30 58 42 C56 56 48 66 43 72 L48 72 C56 62 64 50 64 36 C64 22 58 10 48 6 Z" fill="#8ecae6" stroke={INK} strokeWidth="2" />
          <path d="M30 74 L28 84 M42 74 L44 84" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <rect x="26" y="84" width="20" height="14" rx="3" fill="#c98d4f" stroke={INK} strokeWidth="2.6" />
          <path d="M26 89 H46" stroke={INK} strokeWidth="1.4" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------------- kite ----------------------------------- */

function Kite({ className, dur = 5, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="kite-bob" style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}>
        <svg width="56" height="96" viewBox="0 0 56 96">
          <path d="M28 2 L52 30 L28 62 L4 30 Z" fill="#3d9b5f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M28 2 L28 62 M4 30 L52 30" stroke={INK} strokeWidth="1.6" opacity="0.6" />
          <path d="M28 62 C24 72 34 76 30 84 C27 90 20 88 18 94" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M26 70 l6 3 l-6 3 Z M30 82 l6 3 l-6 3 Z" fill="#e2694f" stroke={INK} strokeWidth="1.4" />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------- butterflies ------------------------------- */

function Butterfly({ className, dur = 7, delay = 0, tone = "#e2694f" }: { className?: string; dur?: number; delay?: number; tone?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="butterfly-drift" style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}>
        <svg width="30" height="26" viewBox="0 0 30 26">
          <g className="butterfly-wing">
            <path d="M15 13 C8 2 1 4 2 10 C3 15 9 15 15 13 Z" fill={tone} stroke={INK} strokeWidth="1.8" />
            <path d="M15 13 C8 16 2 22 6 24 C10 26 14 20 15 13 Z" fill={tone} stroke={INK} strokeWidth="1.8" opacity="0.8" />
          </g>
          <g className="butterfly-wing" style={{ transformOrigin: "15px 13px", transform: "scaleX(-1)", transformBox: "fill-box" }}>
            <path d="M15 13 C8 2 1 4 2 10 C3 15 9 15 15 13 Z" fill={tone} stroke={INK} strokeWidth="1.8" />
            <path d="M15 13 C8 16 2 22 6 24 C10 26 14 20 15 13 Z" fill={tone} stroke={INK} strokeWidth="1.8" opacity="0.8" />
          </g>
          <ellipse cx="15" cy="14" rx="1.6" ry="6" fill={INK} />
          <path d="M14 8 C13 6 12 5 11 4 M16 8 C17 6 18 5 19 4" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
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
        <svg width="30" height="24" viewBox="0 0 30 24">
          <ellipse className="bee-wing" cx="12" cy="6" rx="6" ry="4" fill="#eaf6ff" stroke={INK} strokeWidth="1.4" opacity="0.9" />
          <ellipse className="bee-wing" cx="19" cy="5" rx="5" ry="3.4" fill="#eaf6ff" stroke={INK} strokeWidth="1.4" opacity="0.8" style={{ animationDelay: "0.06s" }} />
          <ellipse cx="15" cy="14" rx="9" ry="7" fill="#ffd23f" stroke={INK} strokeWidth="2.2" />
          <path d="M11 8 C10 12 10 17 11 20 M16 7.4 C15.4 12 15.4 16.5 16 20.8 M21 9 C20.5 12 20.5 16 21 19" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="24.5" cy="13" r="1.3" fill={INK} />
          <path d="M24 20 L27 22" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------------- snail ---------------------------------- */

function Snail({ className }: { className?: string }) {
  return (
    <div className={`snail-crawl pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <svg width="46" height="30" viewBox="0 0 46 30">
        <path d="M3 26 C2 20 8 17 14 18 L34 21 C40 22 43 25 42 27 Z" fill="#f0c987" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M34 21 C36 15 38 11 40 8" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="40.5" cy="6.5" r="2" fill={INK} />
        <circle cx="21" cy="14" r="9.5" fill="#c98d4f" stroke={INK} strokeWidth="2.6" />
        <path d="M15.5 14 a5.5 5.5 0 1 1 8 5" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ------------------------------- falling leaves ---------------------------- */

function FallLeaf({ left, dur, delay, size = 17, tone = "#6fae63" }: { left: string; dur: number; delay: number; size?: number; tone?: string }) {
  return (
    <span className="leaf-fall-soft" style={{ left, "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties} aria-hidden="true">
      <span className="leaf-sway-soft" style={{ "--sway": `${3 + (dur % 3)}s`, "--amp": "16px" } as CSSProperties}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity="0.8">
          <path d="M12 2.6C7.6 6.4 5.2 11 12 21.4C18.8 11 16.4 6.4 12 2.6Z" fill={tone} stroke={INK} strokeWidth="1.6" />
          <path d="M12 5.5V18.5" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  );
}

/* ------------------------------- sparkles & puffs -------------------------- */

function Sparkle({ className, dur = 3, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute sparkle-twinkle ${className ?? ""}`}
      style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}
      aria-hidden="true"
    >
      <path d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z" fill="#fffdf2" stroke="#e8d48a" strokeWidth="1" />
    </svg>
  );
}

function Puff({ className, dur = 18, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="puff-drift" style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}>
        <svg width="26" height="26" viewBox="0 0 26 26" opacity="0.85">
          <circle cx="13" cy="13" r="3" fill="#fdfcf3" stroke={INK} strokeWidth="1.4" />
          <path d="M13 10 V4 M13 16 V22 M10 13 H4 M16 13 H22 M11 11 L6.5 6.5 M15 11 L19.5 6.5 M11 15 L6.5 19.5 M15 15 L19.5 19.5" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="13" cy="3.4" r="1.4" fill="#fdfcf3" stroke={INK} strokeWidth="1" />
          <circle cx="13" cy="22.6" r="1.4" fill="#fdfcf3" stroke={INK} strokeWidth="1" />
          <circle cx="3.4" cy="13" r="1.4" fill="#fdfcf3" stroke={INK} strokeWidth="1" />
          <circle cx="22.6" cy="13" r="1.4" fill="#fdfcf3" stroke={INK} strokeWidth="1" />
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
          <path d="M66 168 C68 140 64 122 60 106 L90 106 C86 122 82 140 84 168 Z" fill="#8a5a3b" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M66 130 C56 126 50 120 46 112" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
          <circle cx="75" cy="62" r="52" fill="#4f8f4f" stroke={INK} strokeWidth="4.5" />
          <circle cx="36" cy="84" r="30" fill="#5fa35c" stroke={INK} strokeWidth="4" />
          <circle cx="114" cy="84" r="30" fill="#5fa35c" stroke={INK} strokeWidth="4" />
          <circle cx="60" cy="40" r="10" fill="#7cbf72" opacity="0.9" />
          <circle cx="96" cy="52" r="7" fill="#7cbf72" opacity="0.8" />
          <circle cx="52" cy="76" r="8" fill="#e2694f" stroke={INK} strokeWidth="2.6" />
          <circle cx="92" cy="70" r="8" fill="#e2694f" stroke={INK} strokeWidth="2.6" />
          <circle cx="72" cy="96" r="8" fill="#e2694f" stroke={INK} strokeWidth="2.6" />
        </svg>
      </div>
    </div>
  );
}

function Mushroom({ className, cap = "#e2694f" }: { className?: string; cap?: string }) {
  return (
    <svg viewBox="0 0 40 34" className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <path d="M14 32 C14 24 14 20 15.5 15 H24.5 C26 20 26 24 26 32 Z" fill="#fdf6e3" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M4 17 C4 8 11 2 20 2 C29 2 36 8 36 17 C30 19.5 10 19.5 4 17 Z" fill={cap} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="13" cy="10" r="2.4" fill="#fdf6e3" />
      <circle cx="24" cy="7" r="2" fill="#fdf6e3" />
      <circle cx="29" cy="12.5" r="1.7" fill="#fdf6e3" />
    </svg>
  );
}

function Flower({ className, delay = 0, petal = "#ffffff" }: { className?: string; delay?: number; petal?: string }) {
  return (
    <svg viewBox="0 0 24 34" className={`pointer-events-none absolute flower-sway ${className ?? ""}`} style={{ "--delay": `${delay}s` } as CSSProperties} aria-hidden="true">
      <path d="M12 32 V16" stroke="#3f7d4f" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 24 C8 23 6 20 5 17 C9 17 11 19 12 22" fill="#4f8f4f" stroke="#3f7d4f" strokeWidth="1.4" />
      <circle cx="12" cy="8" r="3.2" fill={petal} stroke={INK} strokeWidth="1.8" />
      <circle cx="6.8" cy="11" r="3.2" fill={petal} stroke={INK} strokeWidth="1.8" />
      <circle cx="17.2" cy="11" r="3.2" fill={petal} stroke={INK} strokeWidth="1.8" />
      <circle cx="8.8" cy="16" r="3.2" fill={petal} stroke={INK} strokeWidth="1.8" />
      <circle cx="15.2" cy="16" r="3.2" fill={petal} stroke={INK} strokeWidth="1.8" />
      <circle cx="12" cy="12.4" r="3" fill="#ffd23f" stroke={INK} strokeWidth="1.8" />
    </svg>
  );
}

function GrassStrip() {
  return (
    <svg viewBox="0 0 1440 110" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[13vh] min-h-[84px] w-full" aria-hidden="true">
      <path d="M0 54 C180 30 360 44 540 40 C760 36 920 52 1120 44 C1280 38 1380 46 1440 40 L1440 110 L0 110 Z" fill="#6fae63" />
      <path d="M0 54 C180 30 360 44 540 40 C760 36 920 52 1120 44 C1280 38 1380 46 1440 40" fill="none" stroke={INK} strokeWidth="5" opacity="0.55" />
      <path d="M0 82 C240 62 480 76 720 70 C960 64 1200 80 1440 68 L1440 110 L0 110 Z" fill="#5f9e55" />
    </svg>
  );
}

/* --------------------------------- backdrop -------------------------------- */

export function Backdrop() {
  const parallax = useSceneParallax();
  return (
    <motion.div className="app-backdrop pointer-events-none" style={{ x: parallax.x, y: parallax.y }} aria-hidden="true">
      <Sun />
      <Rainbow className="left-[2vw] bottom-[10vh] w-[24vw] min-w-[210px] opacity-55" />

      {/* drifting sky life */}
      <Cloud top="9%" dur={95} delay={-20} scale={1} opacity={0.95} />
      <Cloud top="24%" dur={140} delay={-80} scale={0.66} opacity={0.8} />
      <Cloud top="4%" dur={120} delay={-55} scale={0.85} opacity={0.85} />
      <Cloud top="58%" dur={160} delay={-110} scale={0.5} opacity={0.55} />

      <Bird top="14%" dur={38} delay={-6} scale={1} bob={3} />
      <Bird top="30%" dur={52} delay={-30} scale={0.7} bob={3.8} />
      <Bird top="20%" dur={44} delay={-18} scale={0.85} bob={3.2} flip />
      <Bird top="42%" dur={60} delay={-42} scale={0.55} bob={4.2} />
      <Bird top="8%" dur={48} delay={-24} scale={0.75} bob={2.8} flip />

      <PaperPlane className="top-[18vh] left-0" dur={26} delay={-8} />
      <Balloon className="left-[6vw] top-[16vh] fx-extra" />
      <Kite className="right-[8vw] top-[26vh] fx-extra" dur={5.4} delay={-1.6} />

      <Butterfly className="left-[16vw] bottom-[16vh]" dur={7} delay={-2} tone="#e2694f" />
      <Butterfly className="right-[20vw] bottom-[13vh] fx-extra" dur={8.4} delay={-4.4} tone="#ffd23f" />
      <Bee className="left-[44vw] bottom-[6vh]" dur={10} delay={-2} />
      <Snail className="bottom-[1.5vh] left-0 fx-extra" />

      <Sparkle className="left-[30vw] top-[20vh] w-[20px]" dur={2.8} delay={-0.6} />
      <Sparkle className="right-[33vw] top-[30vh] w-[15px] fx-extra" dur={3.6} delay={-1.8} />
      <Sparkle className="left-[12vw] top-[42vh] w-[17px]" dur={3.2} delay={-2.6} />
      <Sparkle className="right-[10vw] top-[48vh] w-[13px] fx-extra" dur={2.5} delay={-1.1} />

      <FallLeaf left="4%" dur={26} delay={-4} size={18} tone="#6fae63" />
      <FallLeaf left="11%" dur={30} delay={-16} size={13} tone="#c9a24b" />
      <FallLeaf left="90%" dur={24} delay={-9} size={17} tone="#86a878" />
      <FallLeaf left="95%" dur={32} delay={-22} size={12} tone="#9db89a" />

      <Puff className="left-[24vw] bottom-[9vh] fx-extra" dur={19} delay={-6} />
      <Puff className="right-[28vw] bottom-[7vh] fx-extra" dur={23} delay={-14} />

      {/* the meadow */}
      <GrassStrip />
      <AppleTree className="left-[3vw] bottom-[4vh]" sway={7} delay={-2} />
      <AppleTree className="right-[4vw] bottom-[3vh] hidden sm:block" sway={8.2} delay={-5} flip />
      <AppleTree className="left-[30vw] bottom-[2vh] hidden lg:block scale-75 origin-bottom" sway={9} delay={-3.4} />
      <Mushroom className="left-[16vw] bottom-[2.4vh] w-[42px]" cap="#e2694f" />
      <Mushroom className="right-[18vw] bottom-[2vh] w-[34px] hidden sm:block" cap="#ffd23f" />
      <Flower className="left-[22vw] bottom-[2vh] w-[26px]" delay={-0.6} petal="#ffffff" />
      <Flower className="left-[48vw] bottom-[1.6vh] w-[22px]" delay={-1.8} petal="#f4978e" />
      <Flower className="right-[34vw] bottom-[2.2vh] w-[26px] hidden sm:block" delay={-2.6} petal="#ffffff" />
      <Flower className="right-[8vw] bottom-[1.8vh] w-[20px]" delay={-1.2} petal="#ffd23f" />
      <Flower className="left-[6vw] bottom-[1.7vh] w-[20px] hidden sm:block" delay={-3} petal="#f4978e" />
    </motion.div>
  );
}

/* --------------------------------- AppShell -------------------------------- */

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grain relative min-h-dvh">
      <Backdrop />
      {/* a soft sun-glow that springs behind the pointer on desktop */}
      <CursorGlow />
      {/* z-1 > backdrop z-0, and fully transparent — the sky + sun show through */}
      <main className="relative z-[1]">{children}</main>
    </div>
  );
}
