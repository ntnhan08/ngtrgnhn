/* Living micro-effects: cursor glow, confetti burst, count-up, magnetic
 * tilt. All transform/opacity only — cheap for the compositor, 60fps. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

const finePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

/* ------------------------------- CursorGlow ------------------------------- */

/** A soft sun-glow that springs behind the pointer on desktop. */
export function CursorGlow() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(-600);
  const my = useMotionValue(-600);
  const x = useSpring(mx, { stiffness: 90, damping: 20, mass: 0.5, restDelta: 0.5 });
  const y = useSpring(my, { stiffness: 90, damping: 20, mass: 0.5, restDelta: 0.5 });
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0)`;

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
        if (document.body.classList.contains("freeze-scene")) return;
        mx.set(cx);
        my.set(cy);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, mx, my]);

  if (reduce || !finePointer()) return null;
  return <motion.div className="cursor-glow" style={{ transform }} aria-hidden="true" />;
}

/* ------------------------------ ConfettiBurst ------------------------------ */

export interface BurstParticle {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  kind: "cube" | "gem";
  color: string;
  delay: number;
}

const BURST_COLORS = ["#5d9c3f", "#ffd93d", "#5ce1e6", "#e0432f", "#2ecc71"];

export function makeBurst(count: number): BurstParticle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 110;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 40,
      rotate: (Math.random() - 0.5) * 540,
      scale: 0.7 + Math.random() * 0.8,
      kind: Math.random() > 0.45 ? "cube" : "gem",
      color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
      delay: Math.random() * 0.06,
    };
  });
}

function ParticleShape({ p }: { p: BurstParticle }) {
  if (p.kind === "cube") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" fill={p.color} stroke="#2b2014" strokeWidth="1.6" />
        <rect x="4" y="4" width="16" height="5" fill="#ffffff" opacity="0.35" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <polygon points="12,1.5 22.5,9 18,22.5 6,22.5 1.5,9" fill={p.color} stroke="#2b2014" strokeWidth="1.4" strokeLinejoin="miter" />
    </svg>
  );
}

export function ConfettiBurst({
  particles,
  x,
  y,
  onDone,
}: {
  particles: BurstParticle[];
  x: number;
  y: number;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1200);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[96]" aria-hidden="true">
      <AnimatePresence>
        {particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute"
            style={{ left: x, top: y }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
            animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: p.scale }}
            transition={{ duration: 0.95, delay: p.delay, ease: [0.16, 0.84, 0.44, 1] }}
          >
            <ParticleShape p={p} />
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------- CountUp --------------------------------- */

/** Animates a number up from 0 when it first scrolls into view. */
export function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return <span ref={ref}>{display}</span>;
}

/* -------------------------------- Magnetic --------------------------------- */

/** Children lean gently toward the pointer (desktop, full motion only). */
export function Magnetic({
  children,
  strength = 0.25,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 220, damping: 18 });
  const y = useSpring(0, { stiffness: 220, damping: 18 });

  if (reduce || !finePointer()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ x, y }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) * strength);
        y.set((e.clientY - rect.top - rect.height / 2) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
