import type { Vec2 } from '../math/vec2.ts';
import { vec2 } from '../math/vec2.ts';

export interface BallState {
  pos: Vec2;
  vel: Vec2;
  z: number;
  vz: number;
  spin: number;
}

export const GRAVITY_MS2 = 9.81;
export const ROLL_FRICTION_COEF = 0.4;
export const RESTITUTION = 0.6;
export const BOUNCE_HORIZONTAL_DAMPING = 0.7;
export const STOP_VEL_THRESHOLD_MS = 0.05;
export const BOUNCE_SETTLE_VZ_THRESHOLD_MS = 0.5;
export const BALL_RADIUS_M = 0.11;
export const MAGNUS_COEF = 0.05;
export const SPIN_HALF_LIFE_S = 1.0;
export const SPIN_NEGLIGIBLE_THRESHOLD_RAD_S = 0.01;

export function createBall(): BallState {
  return {
    pos: vec2(0, 0),
    vel: vec2(0, 0),
    z: 0,
    vz: 0,
    spin: 0,
  };
}

// Avance la simulation du ballon d'un pas dt. Mute l'état en place.
// Semi-implicit Euler : on met à jour vz avant d'intégrer z avec le nouveau vz.
export function stepBall(ball: BallState, dt: number): void {
  ball.vz -= GRAVITY_MS2 * dt;

  // Magnus : a_lat = k · spin · v_perp. Toujours appliqué (vol et roulement).
  if (ball.spin !== 0) {
    const ax = -MAGNUS_COEF * ball.spin * ball.vel.y;
    const ay = MAGNUS_COEF * ball.spin * ball.vel.x;
    ball.vel.x += ax * dt;
    ball.vel.y += ay * dt;
  }

  ball.pos.x += ball.vel.x * dt;
  ball.pos.y += ball.vel.y * dt;
  ball.z += ball.vz * dt;

  if (ball.z < 0) {
    ball.z = 0;
    if (ball.vz < 0) {
      const reboundVz = -RESTITUTION * ball.vz;
      // Sous le seuil : pas un vrai rebond — ne pas amortir l'horizontal,
      // sinon la gravité par-frame d'un ballon au repos tuerait sa vitesse de roulement.
      if (reboundVz < BOUNCE_SETTLE_VZ_THRESHOLD_MS) {
        ball.vz = 0;
      } else {
        ball.vz = reboundVz;
        ball.vel.x *= BOUNCE_HORIZONTAL_DAMPING;
        ball.vel.y *= BOUNCE_HORIZONTAL_DAMPING;
      }
    } else {
      ball.vz = 0;
    }
  }

  if (ball.z === 0 && ball.vz === 0) {
    const speedSq = ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y;
    if (speedSq > 0) {
      const speed = Math.sqrt(speedSq);
      if (speed < STOP_VEL_THRESHOLD_MS) {
        ball.vel.x = 0;
        ball.vel.y = 0;
      } else {
        const decel = ROLL_FRICTION_COEF * GRAVITY_MS2 * dt;
        if (decel >= speed) {
          ball.vel.x = 0;
          ball.vel.y = 0;
        } else {
          const factor = 1 - decel / speed;
          ball.vel.x *= factor;
          ball.vel.y *= factor;
        }
      }
    }
  }

  // Décroissance exponentielle du spin (demi-vie SPIN_HALF_LIFE_S).
  if (ball.spin !== 0) {
    ball.spin *= Math.pow(0.5, dt / SPIN_HALF_LIFE_S);
    if (Math.abs(ball.spin) < SPIN_NEGLIGIBLE_THRESHOLD_RAD_S) ball.spin = 0;
  }
}
