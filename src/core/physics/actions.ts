import type { BallState } from './ball.ts';
import type { PlayerState } from './player.ts';

export const SHOOT_MIN_POWER_MS = 12;
export const SHOOT_MAX_POWER_MS = 28;
export const SHOOT_FULL_CHARGE_S = 0.5;
export const SHOOT_ELEVATION_CHARGE_THRESHOLD = 0.3;
export const SHOOT_MAX_ELEVATION_RAD = Math.PI / 9; // 20°
export const PASS_DEFAULT_POWER_MS = 10;
export const LOB_PASS_MIN_POWER_MS = 10;
export const LOB_PASS_MAX_POWER_MS = 22;
export const LOB_PASS_FULL_CHARGE_S = 0.6;
export const LOB_PASS_MIN_ELEVATION_RAD = Math.PI / 12; // 15°
export const LOB_PASS_MAX_ELEVATION_RAD = Math.PI / 4; // 45°

export function shoot(player: PlayerState, ball: BallState, chargeS: number): void {
  const t = Math.max(0, Math.min(1, chargeS / SHOOT_FULL_CHARGE_S));
  const power = SHOOT_MIN_POWER_MS + t * (SHOOT_MAX_POWER_MS - SHOOT_MIN_POWER_MS);

  let elevationRad = 0;
  if (t > SHOOT_ELEVATION_CHARGE_THRESHOLD) {
    const u = (t - SHOOT_ELEVATION_CHARGE_THRESHOLD) / (1 - SHOOT_ELEVATION_CHARGE_THRESHOLD);
    elevationRad = u * SHOOT_MAX_ELEVATION_RAD;
  }

  const horizontalPower = power * Math.cos(elevationRad);
  ball.vel.x = player.facing.x * horizontalPower;
  ball.vel.y = player.facing.y * horizontalPower;
  ball.vz = power * Math.sin(elevationRad);

  player.hasBall = false;
}

export function pass(player: PlayerState, ball: BallState, power = PASS_DEFAULT_POWER_MS): void {
  ball.vel.x = player.facing.x * power;
  ball.vel.y = player.facing.y * power;
  ball.vz = 0;

  player.hasBall = false;
}

export function lobPass(player: PlayerState, ball: BallState, chargeS: number): void {
  const t = Math.max(0, Math.min(1, chargeS / LOB_PASS_FULL_CHARGE_S));
  const power = LOB_PASS_MIN_POWER_MS + t * (LOB_PASS_MAX_POWER_MS - LOB_PASS_MIN_POWER_MS);
  const elevationRad =
    LOB_PASS_MIN_ELEVATION_RAD + t * (LOB_PASS_MAX_ELEVATION_RAD - LOB_PASS_MIN_ELEVATION_RAD);

  const horizontalPower = power * Math.cos(elevationRad);
  ball.vel.x = player.facing.x * horizontalPower;
  ball.vel.y = player.facing.y * horizontalPower;
  ball.vz = power * Math.sin(elevationRad);

  player.hasBall = false;
}
