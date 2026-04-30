import { Container, Graphics } from 'pixi.js';
import type { BallState } from '../core/physics/ball.ts';

const VISUAL_RADIUS_M = 0.5;
const HEIGHT_LIFT_FACTOR = 0.4;
const HEIGHT_SCALE_FACTOR = 0.04;
const SHADOW_SHRINK_FACTOR = 0.06;
const SHADOW_MIN_SCALE = 0.4;
const SHADOW_BASE_ALPHA = 0.45;

export class BallView {
  readonly container: Container;
  private readonly shadow: Graphics;
  private readonly ball: Graphics;
  private readonly ppm: number;

  constructor(ppm: number) {
    this.ppm = ppm;
    const radiusPx = VISUAL_RADIUS_M * ppm;

    this.container = new Container();

    this.shadow = new Graphics();
    this.shadow.circle(0, 0, radiusPx).fill({ color: 0x000000, alpha: SHADOW_BASE_ALPHA });
    this.container.addChild(this.shadow);

    this.ball = new Graphics();
    this.ball.circle(0, 0, radiusPx).fill(0xffffff);
    this.ball.circle(0, 0, radiusPx).stroke({ width: 1, color: 0x222222 });
    this.container.addChild(this.ball);
  }

  update(state: BallState): void {
    const px = state.pos.x * this.ppm;
    const py = state.pos.y * this.ppm;
    this.shadow.x = px;
    this.shadow.y = py;
    this.ball.x = px;
    this.ball.y = py - state.z * this.ppm * HEIGHT_LIFT_FACTOR;

    const lift = state.z;
    const ballScale = 1 + lift * HEIGHT_SCALE_FACTOR;
    this.ball.scale.set(ballScale, ballScale);

    const shadowScale = Math.max(SHADOW_MIN_SCALE, 1 - lift * SHADOW_SHRINK_FACTOR);
    this.shadow.scale.set(shadowScale, shadowScale);
    this.shadow.alpha = SHADOW_BASE_ALPHA * shadowScale;
  }
}
