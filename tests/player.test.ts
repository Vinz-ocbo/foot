import { describe, it, expect } from 'vitest';
import {
  createPlayer,
  PLAYER_RUN_SPEED_MS,
  PLAYER_SPRINT_SPEED_MS,
  PLAYER_TURN_RATE_RAD_S,
  type PlayerInput,
  SPRINT_MIN_STAMINA,
  STAMINA_MAX,
  STAMINA_REST_RECOVER_PER_S,
  STAMINA_RUN_RECOVER_PER_S,
  STAMINA_SPRINT_DRAIN_PER_S,
  stepPlayer,
} from '../src/core/physics/player.ts';

const DT = 1 / 60;

const REST: PlayerInput = { thrust: 0, rotate: 0, sprint: false };
const FORWARD: PlayerInput = { thrust: 1, rotate: 0, sprint: false };
const FORWARD_SPRINT: PlayerInput = { thrust: 1, rotate: 0, sprint: true };
const ROTATE_RIGHT: PlayerInput = { thrust: 0, rotate: 1, sprint: false };
const ROTATE_LEFT: PlayerInput = { thrust: 0, rotate: -1, sprint: false };

function stepN(p: ReturnType<typeof createPlayer>, n: number, input: PlayerInput): void {
  for (let i = 0; i < n; i++) stepPlayer(p, input, DT);
}

describe('player movement (tank)', () => {
  it('atteint la vitesse de course max en avant', () => {
    const p = createPlayer();
    stepN(p, 60, FORWARD);
    expect(p.vel.x).toBeCloseTo(PLAYER_RUN_SPEED_MS, 4);
    expect(p.vel.y).toBeCloseTo(0, 6);
  });

  it('atteint la vitesse de sprint quand thrust > 0 et stamina suffisante', () => {
    const p = createPlayer();
    stepN(p, 60, FORWARD_SPRINT);
    expect(p.vel.x).toBeCloseTo(PLAYER_SPRINT_SPEED_MS, 4);
  });

  it('thrust négatif est clampé à zéro (pas de marche arrière)', () => {
    const p = createPlayer();
    const NEGATIVE: PlayerInput = { thrust: -1, rotate: 0, sprint: false };
    stepN(p, 60, NEGATIVE);
    expect(p.vel.x).toBe(0);
    expect(p.vel.y).toBe(0);
  });

  it('décélère à zéro quand input relâché', () => {
    const p = createPlayer();
    stepN(p, 60, FORWARD);
    stepN(p, 60, REST);
    expect(p.vel.x).toBe(0);
    expect(p.vel.y).toBe(0);
  });

  it('ne dépasse pas la vitesse max (pas d’overshoot)', () => {
    const p = createPlayer();
    stepN(p, 200, FORWARD);
    const speed = Math.sqrt(p.vel.x * p.vel.x + p.vel.y * p.vel.y);
    expect(speed).toBeLessThanOrEqual(PLAYER_RUN_SPEED_MS + 1e-9);
  });

  it('rotate à droite tourne le facing à TURN_RATE rad/s', () => {
    const p = createPlayer();
    stepN(p, 60, ROTATE_RIGHT);
    const expectedAngle = PLAYER_TURN_RATE_RAD_S; // 1 s × TURN_RATE rad/s
    expect(p.facing.x).toBeCloseTo(Math.cos(expectedAngle), 3);
    expect(p.facing.y).toBeCloseTo(Math.sin(expectedAngle), 3);
  });

  it('rotate à gauche tourne dans l’autre sens', () => {
    const p = createPlayer();
    stepN(p, 60, ROTATE_LEFT);
    const expectedAngle = -PLAYER_TURN_RATE_RAD_S;
    expect(p.facing.x).toBeCloseTo(Math.cos(expectedAngle), 3);
    expect(p.facing.y).toBeCloseTo(Math.sin(expectedAngle), 3);
  });

  it('thrust déplace dans la direction du facing', () => {
    const p = createPlayer();
    p.facing.x = 0;
    p.facing.y = -1;
    stepN(p, 60, FORWARD);
    expect(p.vel.x).toBeCloseTo(0, 4);
    expect(p.vel.y).toBeCloseTo(-PLAYER_RUN_SPEED_MS, 4);
  });

  it('ne change pas le facing quand rotate est zéro', () => {
    const p = createPlayer();
    stepN(p, 60, FORWARD);
    expect(p.facing.x).toBeCloseTo(1, 6);
    expect(p.facing.y).toBeCloseTo(0, 6);
  });

  it('peut combiner rotate et thrust (trajectoire courbée)', () => {
    const p = createPlayer();
    const ROTATE_AND_THRUST: PlayerInput = { thrust: 1, rotate: 1, sprint: false };
    stepN(p, 60, ROTATE_AND_THRUST);
    expect(p.vel.x).not.toBe(0);
    expect(p.vel.y).not.toBe(0);
  });

  it('atteint un angle quelconque par rotation continue', () => {
    const p = createPlayer();
    // 30 frames * (1/60) * TURN_RATE = TURN_RATE/2 rad
    stepN(p, 30, ROTATE_RIGHT);
    const angle = Math.atan2(p.facing.y, p.facing.x);
    expect(angle).toBeCloseTo(PLAYER_TURN_RATE_RAD_S / 2, 3);
  });
});

describe('player stamina', () => {
  it('décline pendant le sprint en avant', () => {
    const p = createPlayer();
    stepN(p, 60, FORWARD_SPRINT);
    expect(p.stamina).toBeCloseTo(STAMINA_MAX - STAMINA_SPRINT_DRAIN_PER_S, 4);
  });

  it("récupère plus vite à l'arrêt qu'en course", () => {
    const p1 = createPlayer();
    const p2 = createPlayer();
    p1.stamina = 50;
    p2.stamina = 50;
    stepN(p1, 60, REST);
    stepN(p2, 60, FORWARD);
    expect(p1.stamina).toBeCloseTo(50 + STAMINA_REST_RECOVER_PER_S, 4);
    expect(p2.stamina).toBeCloseTo(50 + STAMINA_RUN_RECOVER_PER_S, 4);
    expect(p1.stamina).toBeGreaterThan(p2.stamina);
  });

  it('rotation pure récupère comme à l’arrêt (pas de drain)', () => {
    const p = createPlayer();
    p.stamina = 50;
    stepN(p, 60, ROTATE_RIGHT);
    expect(p.stamina).toBeCloseTo(50 + STAMINA_REST_RECOVER_PER_S, 4);
  });

  it('refuse le sprint sous SPRINT_MIN_STAMINA', () => {
    const p = createPlayer();
    p.stamina = SPRINT_MIN_STAMINA - 1;
    stepN(p, 60, FORWARD_SPRINT);
    expect(p.vel.x).toBeCloseTo(PLAYER_RUN_SPEED_MS, 4);
  });

  it('ne dépasse pas STAMINA_MAX', () => {
    const p = createPlayer();
    p.stamina = STAMINA_MAX - 0.05;
    stepN(p, 600, REST);
    expect(p.stamina).toBe(STAMINA_MAX);
  });

  it('ne descend pas sous zéro', () => {
    const p = createPlayer();
    p.stamina = 0.5;
    stepN(p, 60, FORWARD_SPRINT);
    expect(p.stamina).toBeGreaterThanOrEqual(0);
  });
});
