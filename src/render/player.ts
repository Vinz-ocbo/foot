import { Container, Graphics } from 'pixi.js';
import type { PlayerState } from '../core/physics/player.ts';
import { PLAYER_RADIUS_M } from '../core/physics/player.ts';

const TEAM_COLORS: Record<0 | 1, number> = {
  0: 0x2255cc,
  1: 0xcc2222,
};
const FACING_INDICATOR_LENGTH_M = 0.7;
const CONTROL_MARKER_RADIUS_M = 0.7;

export class PlayerView {
  readonly container: Container;
  private readonly facingIndicator: Graphics;
  private readonly controlMarker: Graphics;
  private readonly ppm: number;

  constructor(team: 0 | 1, ppm: number) {
    this.ppm = ppm;
    const radiusPx = PLAYER_RADIUS_M * ppm;

    this.container = new Container();

    this.controlMarker = new Graphics();
    this.controlMarker
      .circle(0, 0, CONTROL_MARKER_RADIUS_M * ppm)
      .stroke({ width: 2, color: 0xffff00, alpha: 0.85 });
    this.container.addChild(this.controlMarker);

    const body = new Graphics();
    body.circle(0, 0, radiusPx).fill(TEAM_COLORS[team]);
    body.circle(0, 0, radiusPx).stroke({ width: 1, color: 0x000000 });
    this.container.addChild(body);

    this.facingIndicator = new Graphics();
    this.facingIndicator
      .moveTo(0, 0)
      .lineTo(FACING_INDICATOR_LENGTH_M * ppm, 0)
      .stroke({ width: 2, color: 0xffffff });
    this.container.addChild(this.facingIndicator);
  }

  update(state: PlayerState, isControlled: boolean): void {
    this.container.x = state.pos.x * this.ppm;
    this.container.y = state.pos.y * this.ppm;
    this.facingIndicator.rotation = Math.atan2(state.facing.y, state.facing.x);
    this.controlMarker.visible = isControlled;
  }
}
