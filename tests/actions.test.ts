import { describe, it, expect } from 'vitest';
import { createBall } from '../src/core/physics/ball.ts';
import { createPlayer } from '../src/core/physics/player.ts';
import {
  LOB_PASS_FULL_CHARGE_S,
  LOB_PASS_MAX_ELEVATION_RAD,
  LOB_PASS_MAX_POWER_MS,
  LOB_PASS_MIN_ELEVATION_RAD,
  LOB_PASS_MIN_POWER_MS,
  lobPass,
  pass,
  PASS_DEFAULT_POWER_MS,
  shoot,
  SHOOT_FULL_CHARGE_S,
  SHOOT_MAX_ELEVATION_RAD,
  SHOOT_MAX_POWER_MS,
  SHOOT_MIN_POWER_MS,
} from '../src/core/physics/actions.ts';

describe('shoot', () => {
  it('utilise la puissance min à charge nulle, sans élévation', () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 1;
    p.hasBall = true;
    shoot(p, b, 0);
    expect(b.vel.x).toBeCloseTo(SHOOT_MIN_POWER_MS, 6);
    expect(b.vel.y).toBeCloseTo(0, 6);
    expect(b.vz).toBe(0);
    expect(p.hasBall).toBe(false);
  });

  it("utilise la puissance max à pleine charge avec l'élévation max", () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 1;
    p.hasBall = true;
    shoot(p, b, SHOOT_FULL_CHARGE_S);
    const expectedHorizontal = SHOOT_MAX_POWER_MS * Math.cos(SHOOT_MAX_ELEVATION_RAD);
    const expectedVz = SHOOT_MAX_POWER_MS * Math.sin(SHOOT_MAX_ELEVATION_RAD);
    expect(b.vel.x).toBeCloseTo(expectedHorizontal, 4);
    expect(b.vz).toBeCloseTo(expectedVz, 4);
  });

  it('garde le ballon au sol sous le seuil d’élévation', () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 1;
    shoot(p, b, SHOOT_FULL_CHARGE_S * 0.1);
    expect(b.vz).toBe(0);
  });

  it('utilise la direction de facing du joueur', () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 0;
    p.facing.y = -1;
    shoot(p, b, 0.5);
    expect(b.vel.x).toBeCloseTo(0, 6);
    expect(b.vel.y).toBeLessThan(0);
  });

  it('clamp le sur-charge à pleine charge', () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 1;
    shoot(p, b, 100);
    expect(b.vz).toBeCloseTo(SHOOT_MAX_POWER_MS * Math.sin(SHOOT_MAX_ELEVATION_RAD), 4);
  });

  it('libère la possession', () => {
    const p = createPlayer();
    const b = createBall();
    p.hasBall = true;
    shoot(p, b, 0);
    expect(p.hasBall).toBe(false);
  });
});

describe('pass', () => {
  it('tire le ballon dans le facing à puissance par défaut', () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 1;
    p.hasBall = true;
    pass(p, b);
    expect(b.vel.x).toBeCloseTo(PASS_DEFAULT_POWER_MS, 6);
    expect(b.vel.y).toBeCloseTo(0, 6);
    expect(b.vz).toBe(0);
    expect(p.hasBall).toBe(false);
  });

  it('respecte une puissance custom', () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 0;
    p.facing.y = 1;
    pass(p, b, 25);
    expect(b.vel.x).toBeCloseTo(0, 6);
    expect(b.vel.y).toBeCloseTo(25, 6);
  });
});

describe('lobPass', () => {
  it('utilise la puissance min et l’élévation min à charge nulle', () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 1;
    p.hasBall = true;
    lobPass(p, b, 0);
    const expectedHorizontal = LOB_PASS_MIN_POWER_MS * Math.cos(LOB_PASS_MIN_ELEVATION_RAD);
    const expectedVz = LOB_PASS_MIN_POWER_MS * Math.sin(LOB_PASS_MIN_ELEVATION_RAD);
    expect(b.vel.x).toBeCloseTo(expectedHorizontal, 4);
    expect(b.vz).toBeCloseTo(expectedVz, 4);
    expect(p.hasBall).toBe(false);
  });

  it('utilise la puissance max et l’élévation max à pleine charge', () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 1;
    lobPass(p, b, LOB_PASS_FULL_CHARGE_S);
    const expectedHorizontal = LOB_PASS_MAX_POWER_MS * Math.cos(LOB_PASS_MAX_ELEVATION_RAD);
    const expectedVz = LOB_PASS_MAX_POWER_MS * Math.sin(LOB_PASS_MAX_ELEVATION_RAD);
    expect(b.vel.x).toBeCloseTo(expectedHorizontal, 4);
    expect(b.vz).toBeCloseTo(expectedVz, 4);
  });

  it('a toujours une élévation positive (le lob lève toujours)', () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 1;
    lobPass(p, b, 0);
    expect(b.vz).toBeGreaterThan(0);
  });

  it('plafonne sous la puissance max du tir (lob plus mou)', () => {
    expect(LOB_PASS_MAX_POWER_MS).toBeLessThan(SHOOT_MAX_POWER_MS);
  });

  it('clamp le sur-charge à pleine charge', () => {
    const p = createPlayer();
    const b = createBall();
    p.facing.x = 1;
    lobPass(p, b, 100);
    expect(b.vz).toBeCloseTo(LOB_PASS_MAX_POWER_MS * Math.sin(LOB_PASS_MAX_ELEVATION_RAD), 4);
  });
});
