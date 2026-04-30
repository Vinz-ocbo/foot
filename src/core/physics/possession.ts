import type { BallState } from './ball.ts';
import type { PlayerState } from './player.ts';

export const POSSESSION_RADIUS_M = 0.9;
export const POSSESSION_MAX_BALL_SPEED_MS = 12;
export const POSSESSION_MAX_BALL_HEIGHT_M = 0.5;
const FRONT_CONE_HALF_ANGLE_RAD = Math.PI / 4; // demi-angle 45° → cône 90°
export const POSSESSION_FRONT_CONE_COS = Math.cos(FRONT_CONE_HALF_ANGLE_RAD);
export const POSSESSION_BALL_OFFSET_M = 0.5;
export const POSSESSION_LERP = 0.4;

export function canCaptureBall(player: PlayerState, ball: BallState): boolean {
  if (ball.z > POSSESSION_MAX_BALL_HEIGHT_M) return false;

  const dx = ball.pos.x - player.pos.x;
  const dy = ball.pos.y - player.pos.y;
  const distSq = dx * dx + dy * dy;
  if (distSq > POSSESSION_RADIUS_M * POSSESSION_RADIUS_M) return false;

  if (distSq > 1e-6) {
    const dist = Math.sqrt(distSq);
    const dot = (player.facing.x * dx + player.facing.y * dy) / dist;
    if (dot < POSSESSION_FRONT_CONE_COS) return false;
  }

  const ballSpeedSq = ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y;
  if (ballSpeedSq > POSSESSION_MAX_BALL_SPEED_MS * POSSESSION_MAX_BALL_SPEED_MS) return false;

  return true;
}

// Dribble : le ballon glisse vers une cible située devant le joueur,
// matche sa vitesse, et reste collé au sol.
export function applySoftAttach(player: PlayerState, ball: BallState): void {
  const targetX = player.pos.x + player.facing.x * POSSESSION_BALL_OFFSET_M;
  const targetY = player.pos.y + player.facing.y * POSSESSION_BALL_OFFSET_M;
  ball.pos.x += (targetX - ball.pos.x) * POSSESSION_LERP;
  ball.pos.y += (targetY - ball.pos.y) * POSSESSION_LERP;
  ball.vel.x = player.vel.x;
  ball.vel.y = player.vel.y;
  ball.z = 0;
  ball.vz = 0;
  ball.spin = 0;
}
