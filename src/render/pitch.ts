import type { Graphics } from 'pixi.js';

export interface PitchDimensionsM {
  width: number;
  height: number;
}

export const PITCH_FIFA_M: PitchDimensionsM = { width: 105, height: 68 };
const LINE_WIDTH = 2;
const LINE_COLOR = 0xffffff;
const CENTRE_CIRCLE_M = 9.15;
const PENALTY_AREA_W_M = 16.5;
const PENALTY_AREA_H_M = 40.32;
const GOAL_AREA_W_M = 5.5;
const GOAL_AREA_H_M = 18.32;
const PENALTY_SPOT_M = 11;
const SPOT_RADIUS_M = 0.3;

export function drawPitch(g: Graphics, dim: PitchDimensionsM, ppm: number): void {
  const w = dim.width * ppm;
  const h = dim.height * ppm;
  const stroke = { width: LINE_WIDTH, color: LINE_COLOR };

  g.rect(0, 0, w, h).stroke(stroke);
  g.moveTo(w / 2, 0)
    .lineTo(w / 2, h)
    .stroke(stroke);
  g.circle(w / 2, h / 2, CENTRE_CIRCLE_M * ppm).stroke(stroke);
  g.circle(w / 2, h / 2, SPOT_RADIUS_M * ppm).fill(LINE_COLOR);

  const paW = PENALTY_AREA_W_M * ppm;
  const paH = PENALTY_AREA_H_M * ppm;
  g.rect(0, (h - paH) / 2, paW, paH).stroke(stroke);
  g.rect(w - paW, (h - paH) / 2, paW, paH).stroke(stroke);

  const gaW = GOAL_AREA_W_M * ppm;
  const gaH = GOAL_AREA_H_M * ppm;
  g.rect(0, (h - gaH) / 2, gaW, gaH).stroke(stroke);
  g.rect(w - gaW, (h - gaH) / 2, gaW, gaH).stroke(stroke);

  g.circle(PENALTY_SPOT_M * ppm, h / 2, SPOT_RADIUS_M * ppm).fill(LINE_COLOR);
  g.circle(w - PENALTY_SPOT_M * ppm, h / 2, SPOT_RADIUS_M * ppm).fill(LINE_COLOR);
}
