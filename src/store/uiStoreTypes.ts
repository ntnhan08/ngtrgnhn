import type { ConfirmOptions } from "../types";

/** Confirm dialog state exposed to presentational components. */
export interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

export interface BurstState {
  id: number;
  x: number;
  y: number;
  particles: import("../components/Fx").BurstParticle[];
}
