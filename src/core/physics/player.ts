import type { Vec2 } from '../math/vec2.ts';
import { vec2 } from '../math/vec2.ts';

export interface PlayerInput {
  thrust: number; // [-1, 1] : avant / arrière
  rotate: number; // [-1, 1] : sens horaire / anti-horaire
  sprint: boolean;
}

export interface PlayerState {
  pos: Vec2;
  vel: Vec2;
  facing: Vec2;
  stamina: number;
  team: 0 | 1;
  hasBall: boolean;
}

export const PLAYER_RADIUS_M = 0.4;
export const PLAYER_RUN_SPEED_MS = 7;
export const PLAYER_SPRINT_SPEED_MS = 9;
export const PLAYER_ACCEL_MS2 = 18;
export const PLAYER_DECEL_MS2 = 22;
export const PLAYER_TURN_RATE_RAD_S = 6;
export const STAMINA_MAX = 100;
export const STAMINA_SPRINT_DRAIN_PER_S = 1.0;
export const STAMINA_RUN_RECOVER_PER_S = 0.2;
export const STAMINA_REST_RECOVER_PER_S = 0.4;
export const SPRINT_MIN_STAMINA = 10;

export function createPlayer(team: 0 | 1 = 0): PlayerState {
  return {
    pos: vec2(0, 0),
    vel: vec2(0, 0),
    facing: vec2(1, 0),
    stamina: STAMINA_MAX,
    team,
    hasBall: false,
  };
}

// Avance la cinématique du joueur d'un pas. Mute l'état en place.
// Modèle "tank" : le facing tourne via input.rotate, la translation se fait
// dans la direction du facing via input.thrust. La marche arrière est limitée.
export function stepPlayer(player: PlayerState, input: PlayerInput, dt: number): void {
  if (input.rotate !== 0) {
    const angle =
      Math.atan2(player.facing.y, player.facing.x) + input.rotate * PLAYER_TURN_RATE_RAD_S * dt;
    player.facing.x = Math.cos(angle);
    player.facing.y = Math.sin(angle);
  }

  const thrust = Math.max(0, Math.min(1, input.thrust));
  const sprintActive = input.sprint && player.stamina >= SPRINT_MIN_STAMINA && thrust > 0;
  const maxSpeed = sprintActive ? PLAYER_SPRINT_SPEED_MS : PLAYER_RUN_SPEED_MS;
  const targetVx = player.facing.x * thrust * maxSpeed;
  const targetVy = player.facing.y * thrust * maxSpeed;

  const dvx = targetVx - player.vel.x;
  const dvy = targetVy - player.vel.y;
  const dvSq = dvx * dvx + dvy * dvy;
  const moving = thrust !== 0;
  if (dvSq > 0) {
    const dvMag = Math.sqrt(dvSq);
    const rate = moving ? PLAYER_ACCEL_MS2 : PLAYER_DECEL_MS2;
    const step = rate * dt;
    if (step >= dvMag) {
      player.vel.x = targetVx;
      player.vel.y = targetVy;
    } else {
      player.vel.x += (dvx / dvMag) * step;
      player.vel.y += (dvy / dvMag) * step;
    }
  }

  player.pos.x += player.vel.x * dt;
  player.pos.y += player.vel.y * dt;

  if (sprintActive) {
    player.stamina = Math.max(0, player.stamina - STAMINA_SPRINT_DRAIN_PER_S * dt);
  } else if (moving) {
    player.stamina = Math.min(STAMINA_MAX, player.stamina + STAMINA_RUN_RECOVER_PER_S * dt);
  } else {
    player.stamina = Math.min(STAMINA_MAX, player.stamina + STAMINA_REST_RECOVER_PER_S * dt);
  }
}
