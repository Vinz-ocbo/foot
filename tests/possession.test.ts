import { describe, it, expect } from 'vitest';
import { createBall } from '../src/core/physics/ball.ts';
import { createPlayer } from '../src/core/physics/player.ts';
import {
  applySoftAttach,
  canCaptureBall,
  POSSESSION_BALL_OFFSET_M,
  POSSESSION_LERP,
} from '../src/core/physics/possession.ts';

function setup() {
  const p = createPlayer();
  p.pos.x = 0;
  p.pos.y = 0;
  p.facing.x = 1;
  p.facing.y = 0;
  const b = createBall();
  return { p, b };
}

describe('possession — capture', () => {
  it('capture si ballon devant, proche, lent, au sol', () => {
    const { p, b } = setup();
    b.pos.x = 0.4;
    b.pos.y = 0.1;
    expect(canCaptureBall(p, b)).toBe(true);
  });

  it('rejette si ballon trop loin', () => {
    const { p, b } = setup();
    b.pos.x = 1.0;
    expect(canCaptureBall(p, b)).toBe(false);
  });

  it('rejette si ballon dans le dos', () => {
    const { p, b } = setup();
    b.pos.x = -0.4;
    b.pos.y = 0;
    expect(canCaptureBall(p, b)).toBe(false);
  });

  it('rejette si ballon hors du cône frontal (trop sur le côté)', () => {
    const { p, b } = setup();
    b.pos.x = 0.1;
    b.pos.y = 0.5; // angle ~78° du facing → hors cône 90°
    expect(canCaptureBall(p, b)).toBe(false);
  });

  it('rejette si ballon trop rapide (au-delà du seuil de contrôle)', () => {
    const { p, b } = setup();
    b.pos.x = 0.4;
    b.vel.x = 15;
    expect(canCaptureBall(p, b)).toBe(false);
  });

  it('rejette si ballon en l’air', () => {
    const { p, b } = setup();
    b.pos.x = 0.4;
    b.z = 1;
    expect(canCaptureBall(p, b)).toBe(false);
  });

  it('accepte un ballon immobile même quand le joueur fonce dessus', () => {
    const { p, b } = setup();
    p.vel.x = 7; // course pleine vitesse
    b.pos.x = 0.4; // ballon devant, immobile
    expect(canCaptureBall(p, b)).toBe(true);
  });

  it('accepte un ballon qui roule modérément', () => {
    const { p, b } = setup();
    b.pos.x = 0.4;
    b.vel.x = 6; // sous le seuil 12 m/s
    expect(canCaptureBall(p, b)).toBe(true);
  });
});

describe('possession — soft attach', () => {
  it('lerp le ballon vers la cible devant le joueur', () => {
    const { p, b } = setup();
    b.pos.x = 0;
    b.pos.y = 0;
    applySoftAttach(p, b);
    expect(b.pos.x).toBeCloseTo(POSSESSION_BALL_OFFSET_M * POSSESSION_LERP, 6);
    expect(b.pos.y).toBe(0);
  });

  it('matche la vitesse du joueur', () => {
    const { p, b } = setup();
    p.vel.x = 5;
    p.vel.y = -2;
    applySoftAttach(p, b);
    expect(b.vel.x).toBe(5);
    expect(b.vel.y).toBe(-2);
  });

  it('remet le spin du ballon à zéro (le porteur a le contrôle)', () => {
    const { p, b } = setup();
    b.spin = 8;
    applySoftAttach(p, b);
    expect(b.spin).toBe(0);
  });

  it('colle le ballon au sol (z=0, vz=0)', () => {
    const { p, b } = setup();
    b.z = 2;
    b.vz = 5;
    applySoftAttach(p, b);
    expect(b.z).toBe(0);
    expect(b.vz).toBe(0);
  });

  it('converge vers la cible après plusieurs lerps', () => {
    const { p, b } = setup();
    for (let i = 0; i < 30; i++) applySoftAttach(p, b);
    expect(b.pos.x).toBeCloseTo(POSSESSION_BALL_OFFSET_M, 4);
  });
});
