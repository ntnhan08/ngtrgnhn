/* App chrome — a living cartoon nature-school scene behind everything.
 * No taskbars, no sidebars: the scene IS the interface. The backdrop lives
 * at z-0 and the content at z-1 (transparent), so nothing can ever cover
 * the sky; pointer parallax gives the whole painting gentle depth. */
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
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
        /* The scene under the profile/intro blur must stay perfectly still. */
        if (document.body.classList.contains("freeze-scene")) return;
        px.set((cx / window.innerWidth - 0.5) * -22);
        py.set((cx / window.innerHeight - 0.5) * -14);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, px, py]);

  return useMotionTemplate`translate3d(${x}px, ${y}px, 0)`;
}

/* ------------------------------ scene pieces ------------------------------ */

function Sun() {
  return (
    <div className="pointer-events-none absolute -right-16 -top-16 h-[300px] w-[300px] sm:h-[380px] sm:w-[380px]">
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

function Cloud({
  top,
  dur,
  delay,
  scale,
  opacity,
  extra,
}: {
  top: string;
  dur: number;
  delay: number;
  scale: number;
  opacity: number;
  extra?: boolean;
}) {
  return (
    <div
      className={`cloud-drift ${extra ? "fx-extra " : ""}pointer-events-none`}
      style={{ top, "--dur": `${dur}s`, "--delay": `${delay}s`, opacity } as CSSProperties}
      aria-hidden="true"
    >
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

function Bird({
  top,
  dur,
  delay,
  size,
  bob,
  mirrored,
  extra,
}: {
  top: string;
  dur: number;
  delay: number;
  size: number;
  bob: number;
  mirrored?: boolean;
  extra?: boolean;
}) {
  return (
    <div
      className={`bird-fly ${extra ? "fx-extra " : ""}pointer-events-none`}
      style={{ top, "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}
      aria-hidden="true"
    >
      <div className="bird-bob" style={{ "--bob": `${bob}s` } as CSSProperties}>
        <svg
          width={size}
          height={(size * 24) / 34}
          viewBox="0 0 34 24"
          style={mirrored ? { transform: "scaleX(-1)" } : undefined}
        >
          <path d="M3 13 Q9 6 16 8 L14 13 Z" fill="#37596f" />
          <ellipse cx="16" cy="14" rx="11" ry="7.5" fill="#5b84a6" stroke={INK} strokeWidth="2.4" />
          <path d="M27 12.5 L33.5 14.5 L27 16.5 Z" fill="#e8a33d" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="21.5" cy="11.5" r="2.2" fill="#ffffff" />
          <circle cx="22.2" cy="11.5" r="1" fill={INK} />
          <path className="bird-wing far" d="M9 12 Q13 3 21 7 Q14 9 11 14 Z" fill="#46688a" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          <path className="bird-wing" d="M12 13 Q17 5 24 9 Q17 11 14 15 Z" fill="#6d95b8" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function PaperPlane({ className, dur = 26, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div
      className={`plane-fly fx-extra pointer-events-none absolute ${className ?? ""}`}
      style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}
      aria-hidden="true"
    >
      <svg width="36" height="26" viewBox="0 0 36 26">
        <path d="M1 19 H8 M4 23 H10" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.35" />
        <path d="M14 14 L34 3 L19 24 L16.5 16 Z" fill="#fdfcf3" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M16.5 16 L34 3" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Balloon({ className }: { className?: string }) {
  return (
    <div className={`fx-extra pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="balloon-bob">
        <svg width="90" height="132" viewBox="0 0 90 132">
          <path
            d="M45 4 C75 4 86 30 78 52 C72 68 60 76 45 76 C30 76 18 68 12 52 C4 30 15 4 45 4 Z"
            fill="#e2694f"
            stroke={INK}
            strokeWidth="4"
          />
          <path d="M33 6 C28 26 28 56 34 74" fill="none" stroke="#ffd23f" strokeWidth="10" strokeLinecap="round" />
          <path d="M57 6 C62 26 62 56 56 74" fill="none" stroke="#fdf6e3" strokeWidth="10" strokeLinecap="round" />
          <path d="M38 76 L40 104 M52 76 L50 104" stroke={INK} strokeWidth="2.5" />
          <rect x="36" y="104" width="18" height="16" rx="3" fill="#b98a4f" stroke={INK} strokeWidth="3" />
        </svg>
      </div>
    </div>
  );
}

function Kite({ className }: { className?: string }) {
  return (
    <div className={`fx-extra pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="kite-bob">
        <svg width="70" height="112" viewBox="0 0 70 112">
          <path d="M35 4 L62 38 L35 72 L8 38 Z" fill="#8ecae6" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M35 4 L35 72 M8 38 L62 38" stroke={INK} strokeWidth="2.4" />
          <path d="M35 72 Q44 84 34 92 Q26 100 36 108" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <rect x="30" y="84" width="9" height="6" rx="2" fill="#e2694f" stroke={INK} strokeWidth="2" transform="rotate(24 34 87)" />
          <rect x="28" y="98" width="9" height="6" rx="2" fill="#ffd23f" stroke={INK} strokeWidth="2" transform="rotate(-18 32 101)" />
        </svg>
      </div>
    </div>
  );
}

function Butterfly({ className, color, dur, delay }: { className?: string; color: string; dur: number; delay: number }) {
  return (
    <div
      className={`butterfly-drift pointer-events-none absolute ${className ?? ""}`}
      style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}
      aria-hidden="true"
    >
      <svg width="34" height="28" viewBox="0 0 34 28">
        <path className="butterfly-wing l" d="M15 12 C6 2 0 8 4 15 C0 22 8 26 15 17 Z" fill={color} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path className="butterfly-wing r" d="M19 12 C28 2 34 8 30 15 C34 22 26 26 19 17 Z" fill={color} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <ellipse cx="17" cy="14" rx="2.4" ry="8" fill={INK} />
        <path d="M15.5 7 C14 4 13 3 11.5 2 M18.5 7 C20 4 21 3 22.5 2" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Bee({ className, dur = 9, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div
      className={`bee-fly fx-extra pointer-events-none absolute ${className ?? ""}`}
      style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}
      aria-hidden="true"
    >
      <svg width="30" height="24" viewBox="0 0 30 24">
        <ellipse className="bee-wing" cx="11" cy="6" rx="5" ry="3.4" fill="rgba(255,255,255,0.85)" stroke={INK} strokeWidth="1.6" />
        <ellipse className="bee-wing" cx="18" cy="6" rx="5" ry="3.4" fill="rgba(255,255,255,0.85)" stroke={INK} strokeWidth="1.6" />
        <ellipse cx="15" cy="15" rx="10" ry="7" fill="#ffd23f" stroke={INK} strokeWidth="2.6" />
        <path d="M11 8.6 C10.4 12 10.4 18 11 21.4 L13.4 21.7 C12.7 18 12.7 12 13.4 8.3 Z" fill={INK} />
        <path d="M17 8.3 C16.4 12 16.4 18 17 21.7 L19.4 21.4 C20 18 20 12 19.4 8.6 Z" fill={INK} />
        <path d="M25 14 L29 15 L25 16.5 Z" fill={INK} />
        <circle cx="8" cy="13" r="1.4" fill={INK} />
      </svg>
    </div>
  );
}

function Snail({ className }: { className?: string }) {
  return (
    <div className={`snail-crawl fx-extra pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
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

function Tree({ className, delay = 0, sway = 7 }: { className?: string; delay?: number; sway?: number }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="tree-sway" style={{ "--delay": `${delay}s`, "--sway": `${sway}s` } as CSSProperties}>
        <svg width="120" height="150" viewBox="0 0 120 150">
          <path d="M52 148 L56 96 L64 96 L68 148 Z" fill="#8a5a33" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <circle cx="34" cy="72" r="24" fill="#5fa46c" stroke={INK} strokeWidth="4" />
          <circle cx="86" cy="72" r="24" fill="#5fa46c" stroke={INK} strokeWidth="4" />
          <circle cx="60" cy="52" r="34" fill="#4f8f5f" stroke={INK} strokeWidth="4" />
          <circle cx="50" cy="42" r="9" fill="rgba(255,255,255,0.22)" />
          <circle cx="48" cy="60" r="5" fill="#e2694f" stroke={INK} strokeWidth="2" />
          <circle cx="72" cy="50" r="5" fill="#e2694f" stroke={INK} strokeWidth="2" />
          <circle cx="62" cy="76" r="5" fill="#e2694f" stroke={INK} strokeWidth="2" />
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

function Flower({ className, color, delay = 0 }: { className?: string; color: string; delay?: number }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden="true">
      <div className="flower-sway" style={{ "--delay": `${delay}s` } as CSSProperties}>
        <svg width="26" height="40" viewBox="0 0 26 40">
          <path d="M13 40 C13 30 13 24 13 18" stroke="#3f7d4f" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M13 30 C8 28 5 25 4 21 C9 22 12 25 13 30 Z" fill="#3f7d4f" />
          <circle cx="13" cy="7" r="5" fill={color} stroke={INK} strokeWidth="2" />
          <circle cx="6.5" cy="11" r="5" fill={color} stroke={INK} strokeWidth="2" />
          <circle cx="19.5" cy="11" r="5" fill={color} stroke={INK} strokeWidth="2" />
          <circle cx="8.5" cy="17.5" r="5" fill={color} stroke={INK} strokeWidth="2" />
          <circle cx="17.5" cy="17.5" r="5" fill={color} stroke={INK} strokeWidth="2" />
          <circle cx="13" cy="12.5" r="4.2" fill="#ffd23f" stroke={INK} strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

function Sparkle({ className, dur = 3, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`sparkle-twinkle pointer-events-none absolute ${className ?? ""}`}
      style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}
      aria-hidden="true"
    >
      <path
        d="M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z"
        fill="#ffffff"
        stroke="rgba(34,58,43,0.35)"
        strokeWidth="1"
      />
    </svg>
  );
}

function FallLeaf({
  left,
  dur,
  delay,
  size = 17,
  tone = "#6fae63",
  extra,
}: {
  left: string;
  dur: number;
  delay: number;
  size?: number;
  tone?: string;
  extra?: boolean;
}) {
  return (
    <span
      className={`leaf-fall-soft ${extra ? "fx-extra " : ""}`}
      style={{ left, "--dur": `${dur}s`, "--delay": `${delay}s`, "--spin": `${200 + dur * 6}deg` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="leaf-sway-soft" style={{ "--sway": `${3 + (dur % 3)}s`, "--amp": "16px" } as CSSProperties}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity="0.8">
          <path d="M12 2.6C7.6 6.4 5.2 11 12 21.4C18.8 11 16.4 6.4 12 2.6Z" fill={tone} stroke={INK} strokeWidth="1.6" />
          <path d="M12 5.5V18.5" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  );
}

function Puff({ className, dur = 18, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div
      className={`puff-drift fx-extra pointer-events-none absolute ${className ?? ""}`}
      style={{ "--dur": `${dur}s`, "--delay": `${delay}s` } as CSSProperties}
      aria-hidden="true"
    >
      <svg width="26" height="26" viewBox="0 0 26 26">
        <g stroke="rgba(34,58,43,0.5)" strokeWidth="1.2" strokeLinecap="round">
          <path d="M13 13 L13 2 M13 13 L21 5 M13 13 L24 13 M13 13 L21 21 M13 13 L13 24 M13 13 L5 21 M13 13 L2 13 M13 13 L5 5" />
        </g>
        <circle cx="13" cy="13" r="2.6" fill="#fdfcf3" stroke={INK} strokeWidth="1.4" />
        <circle cx="13" cy="2" r="1.6" fill="#fdfcf3" stroke="rgba(34,58,43,0.5)" strokeWidth="1" />
        <circle cx="24" cy="13" r="1.6" fill="#fdfcf3" stroke="rgba(34,58,43,0.5)" strokeWidth="1" />
        <circle cx="2" cy="13" r="1.6" fill="#fdfcf3" stroke="rgba(34,58,43,0.5)" strokeWidth="1" />
        <circle cx="21" cy="5" r="1.4" fill="#fdfcf3" stroke="rgba(34,58,43,0.5)" strokeWidth="1" />
        <circle cx="5" cy="21" r="1.4" fill="#fdfcf3" stroke="rgba(34,58,43,0.5)" strokeWidth="1" />
      </svg>
    </div>
  );
}

/* -------------------------------- backdrop -------------------------------- */

export function Backdrop() {
  const transform = useSceneParallax();
  return (
    <motion.div className="app-backdrop" style={{ transform }} aria-hidden="true">
      <Sun />
      <Rainbow className="left-[-46px] bottom-[7vh] w-[300px] opacity-70" />

      {/* drifting clouds at four depths */}
      <Cloud top="6%" dur={110} delay={-30} scale={1} opacity={0.95} />
      <Cloud top="22%" dur={150} delay={-95} scale={0.62} opacity={0.8} />
      <Cloud top="13%" dur={130} delay={-60} scale={0.85} opacity={0.88} />
      <Cloud top="36%" dur={170} delay={-120} scale={0.5} opacity={0.6} extra />

      {/* birds crossing the sky */}
      <Bird top="9%" dur={38} delay={-6} size={34} bob={2.8} />
      <Bird top="15%" dur={47} delay={-24} size={27} bob={3.4} mirrored />
      <Bird top="24%" dur={55} delay={-40} size={22} bob={3.9} />
      <Bird top="12%" dur={42} delay={-15} size={30} bob={3.1} extra />
      <Bird top="30%" dur={60} delay={-52} size={19} bob={4.3} mirrored extra />

      <PaperPlane className="top-[9vh] left-0" dur={26} delay={-8} />
      <Balloon className="left-[5vw] top-[13vh] w-[76px]" />
      <Kite className="right-[6vw] top-[11vh] w-[64px]" />

      <Butterfly className="left-[11vw] bottom-[16vh]" color="#e2694f" dur={7} delay={0} />
      <Butterfly className="right-[15vw] bottom-[22vh]" color="#ffd23f" dur={8.5} delay={-3} />
      <Bee className="left-[45vw] bottom-[7vh]" dur={10} delay={-2} />
      <Snail className="bottom-[1.6vh] left-0" />

      {/* trees, mushrooms and flowers along the meadow floor */}
      <Tree className="left-[2vw] bottom-[-8px] w-[128px]" delay={0} sway={7} />
      <Tree className="right-[3vw] bottom-[-10px] w-[150px]" delay={-2.4} sway={8.2} />
      <Tree className="left-[15vw] bottom-[-6px] w-[88px] opacity-95" delay={-4.1} sway={6.4} />
      <Mushroom className="left-[9.5vw] bottom-[1vh] w-[34px]" />
      <Mushroom className="right-[11vw] bottom-[0.8vh] w-[28px]" cap="#ffd23f" />
      <Flower className="left-[23vw] bottom-[1.4vh]" color="#fdfcf3" delay={-0.6} />
      <Flower className="left-[31vw] bottom-[0.8vh]" color="#ffd23f" delay={-1.8} />
      <Flower className="right-[27vw] bottom-[1.6vh]" color="#e2694f" delay={-1.1} />
      <Flower className="right-[21vw] bottom-[0.9vh]" color="#fdfcf3" delay={-2.6} />
      <Flower className="right-[35vw] bottom-[1vh]" color="#ffd23f" delay={-0.2} />

      {/* falling leaves near the screen edges (the centre stays clear) */}
      <FallLeaf left="4%" dur={26} delay={-4} tone="#6fae63" />
      <FallLeaf left="93%" dur={30} delay={-16} tone="#c9a24b" />
      <FallLeaf left="9%" dur={34} delay={-25} tone="#9db89a" size={14} extra />
      <FallLeaf left="88%" dur={28} delay={-9} tone="#e2a35f" size={15} extra />

      <Sparkle className="left-[29vw] top-[19vh] w-[20px]" dur={2.8} delay={-0.6} />
      <Sparkle className="right-[32vw] top-[29vh] w-[15px]" dur={3.6} delay={-1.8} />
      <Sparkle className="left-[12vw] top-[41vh] w-[17px]" dur={3.2} delay={-2.6} />
      <Sparkle className="right-[10vw] top-[47vh] w-[13px]" dur={2.5} delay={-1.1} />

      <Puff className="left-[20vw] bottom-[11vh]" dur={18} delay={-3} />
      <Puff className="left-[70vw] bottom-[9vh]" dur={22} delay={-12} />
    </motion.div>
  );
}

/* --------------------------------- shell ---------------------------------- */

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grain relative min-h-dvh">
      <Backdrop />
      {/* a soft sun-glow that springs behind the pointer on desktop */}
      <CursorGlow />
      {/* z-1 > backdrop z-0, and fully transparent — the sky shows through */}
      <main className="relative z-[1]">{children}</main>
    </div>
  );
}