import { describe, it, expect } from 'vitest';
import {
  type BallState,
  BOUNCE_HORIZONTAL_DAMPING,
  BOUNCE_SETTLE_VZ_THRESHOLD_MS,
  createBall,
  GRAVITY_MS2,
  RESTITUTION,
  ROLL_FRICTION_COEF,
  stepBall,
} from '../src/core/physics/ball.ts';

const DT = 1 / 60;

function stepN(ball: BallState, n: number): void {
  for (let i = 0; i < n; i++) stepBall(ball, DT);
}

describe('ball physics — friction', () => {
  it('décélère linéairement à μ·g pendant la phase de roulement', () => {
    const ball = createBall();
    ball.vel.x = 10;
    stepN(ball, 60);
    const expected = 10 - ROLL_FRICTION_COEF * GRAVITY_MS2 * 1;
    expect(ball.vel.x).toBeCloseTo(expected, 6);
    expect(ball.vel.y).toBe(0);
  });

  it("s'arrête en temps fini puis reste arrêté", () => {
    const ball = createBall();
    ball.vel.x = 1;
    stepN(ball, 60);
    expect(ball.vel.x).toBe(0);
    stepN(ball, 60);
    expect(ball.vel.x).toBe(0);
    expect(ball.vel.y).toBe(0);
  });

  it('ne change rien quand le ballon est totalement au repos', () => {
    const ball = createBall();
    stepN(ball, 600);
    expect(ball.pos.x).toBe(0);
    expect(ball.pos.y).toBe(0);
    expect(ball.vel.x).toBe(0);
    expect(ball.vel.y).toBe(0);
    expect(ball.z).toBe(0);
    expect(ball.vz).toBe(0);
  });

  it('intègre la position depuis la vitesse horizontale', () => {
    const ball = createBall();
    ball.vel.x = 10;
    stepN(ball, 30);
    expect(ball.pos.x).toBeGreaterThan(0);
    expect(ball.vel.x).toBeLessThan(10);
  });
});

describe('ball physics — vol vertical', () => {
  it('atteint un apex puis redescend', () => {
    const ball = createBall();
    ball.vz = 10;
    let zMax = 0;
    for (let i = 0; i < 200; i++) {
      stepBall(ball, DT);
      if (ball.z > zMax) zMax = ball.z;
    }
    const analytic = (10 * 10) / (2 * GRAVITY_MS2);
    // Semi-implicit Euler avec dt=1/60 sous-estime l'apex de ~0.08 m.
    expect(zMax).toBeGreaterThan(analytic - 0.15);
    expect(zMax).toBeLessThan(analytic + 0.05);
  });

  it('revient au sol à un temps proche du temps analytique', () => {
    const ball = createBall();
    ball.vz = 10;
    let landingStep = 0;
    for (let i = 1; i < 500; i++) {
      const prevZ = ball.z;
      stepBall(ball, DT);
      if (prevZ > 0 && ball.z === 0) {
        landingStep = i;
        break;
      }
    }
    const expected = (2 * 10) / GRAVITY_MS2 / DT;
    expect(landingStep).toBeGreaterThan(expected - 5);
    expect(landingStep).toBeLessThan(expected + 5);
  });
});

describe('ball physics — effet (Magnus)', () => {
  it('le spin courbe la trajectoire perpendiculairement à la vitesse', () => {
    const b = createBall();
    b.vel.x = 20;
    b.spin = 10;
    for (let i = 0; i < 30; i++) stepBall(b, DT);
    expect(Math.abs(b.vel.y)).toBeGreaterThan(0.5);
  });

  it('spin positif et négatif courbent dans des sens opposés', () => {
    const a = createBall();
    a.vel.x = 20;
    a.spin = 5;
    const b = createBall();
    b.vel.x = 20;
    b.spin = -5;
    for (let i = 0; i < 30; i++) {
      stepBall(a, DT);
      stepBall(b, DT);
    }
    expect(Math.sign(a.vel.y)).not.toBe(Math.sign(b.vel.y));
  });

  it('le spin décroît à demi-vie SPIN_HALF_LIFE_S', () => {
    const b = createBall();
    b.spin = 10;
    for (let i = 0; i < 60; i++) stepBall(b, DT);
    expect(Math.abs(b.spin)).toBeCloseTo(5, 0);
  });

  it('spin nul ne courbe pas la trajectoire', () => {
    const b = createBall();
    b.vel.x = 20;
    b.spin = 0;
    for (let i = 0; i < 30; i++) stepBall(b, DT);
    expect(b.vel.y).toBe(0);
  });

  it('le spin minuscule est snap à zéro', () => {
    const b = createBall();
    b.spin = 0.005;
    stepBall(b, DT);
    expect(b.spin).toBe(0);
  });
});

describe('ball physics — rebond', () => {
  it('post-rebond |vz| / impact |vz| = RESTITUTION', () => {
    const ball = createBall();
    ball.z = 5;
    for (let i = 0; i < 500; i++) {
      const prevZ = ball.z;
      const prevVz = ball.vz;
      stepBall(ball, DT);
      if (prevZ > 0 && ball.z === 0 && ball.vz > 0) {
        // À l'entrée du step, vz -= g·dt avant l'intégration.
        const predictedImpactVz = prevVz - GRAVITY_MS2 * DT;
        const ratio = ball.vz / Math.abs(predictedImpactVz);
        expect(ratio).toBeCloseTo(RESTITUTION, 6);
        return;
      }
    }
    throw new Error('Ballon n’a jamais rebondi');
  });

  it('amortit la vitesse horizontale lors du rebond', () => {
    const ball = createBall();
    ball.z = 0.5;
    ball.vz = 5;
    ball.vel.x = 10;
    for (let i = 0; i < 200; i++) {
      const prevZ = ball.z;
      stepBall(ball, DT);
      if (prevZ > 0 && ball.z === 0) {
        expect(ball.vel.x).toBeCloseTo(10 * BOUNCE_HORIZONTAL_DAMPING, 6);
        expect(ball.vel.x).toBeGreaterThan(0);
        return;
      }
    }
    throw new Error('Ballon n’a jamais rebondi');
  });

  it('se stabilise après quelques rebonds depuis une petite chute', () => {
    const ball = createBall();
    ball.z = 1;
    stepN(ball, 1200);
    expect(ball.vz).toBe(0);
    expect(ball.z).toBe(0);
  });

  it('snap à zéro si vz post-rebond est sous le seuil de repos', () => {
    const ball = createBall();
    // Vitesse de chute juste suffisante pour que le post-rebond soit < seuil.
    // post-rebond = e * |vz_impact|. On veut e * |vz_impact| < SEUIL.
    const targetImpactSpeed = (BOUNCE_SETTLE_VZ_THRESHOLD_MS / RESTITUTION) * 0.5;
    ball.vz = -targetImpactSpeed;
    stepBall(ball, DT);
    expect(ball.vz).toBe(0);
    expect(ball.z).toBe(0);
  });
});
