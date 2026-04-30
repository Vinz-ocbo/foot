import { describe, it, expect } from 'vitest';
import { FixedTimestep } from '../src/core/loop/fixed-timestep.ts';

const STEP_MS_60 = 1000 / 60;

describe('FixedTimestep', () => {
  it('zero steps when not enough time elapsed', () => {
    const ft = new FixedTimestep({ hz: 60, maxFrameMs: 250 });
    ft.reset(1000);
    const r = ft.tick(1005);
    expect(r.steps).toBe(0);
    expect(r.alpha).toBeCloseTo(5 / STEP_MS_60, 6);
  });

  it('one step at 60 Hz frame', () => {
    const ft = new FixedTimestep({ hz: 60, maxFrameMs: 250 });
    ft.reset(0);
    const r = ft.tick(STEP_MS_60);
    expect(r.steps).toBe(1);
    expect(r.alpha).toBeCloseTo(0, 6);
  });

  it('multiple steps when frame is heavy', () => {
    const ft = new FixedTimestep({ hz: 60, maxFrameMs: 250 });
    ft.reset(0);
    const r = ft.tick(STEP_MS_60 * 3 + 5);
    expect(r.steps).toBe(3);
    expect(r.alpha).toBeCloseTo(5 / STEP_MS_60, 6);
  });

  it('clamps spiral of death at maxFrameMs', () => {
    const ft = new FixedTimestep({ hz: 60, maxFrameMs: 250 });
    ft.reset(0);
    const r = ft.tick(10_000);
    // 250 ms / (1000/60) ≈ 15.0 mais le bruit FP peut donner 14 ou 15.
    expect(r.steps).toBeGreaterThanOrEqual(14);
    expect(r.steps).toBeLessThanOrEqual(15);
  });

  it('accumulates leftover across frames', () => {
    const ft = new FixedTimestep({ hz: 60, maxFrameMs: 250 });
    ft.reset(0);
    // tick() retourne un objet partagé (zéro-alloc). On lit avant de retick.
    const aSteps = ft.tick(10).steps;
    const bSteps = ft.tick(20).steps;
    expect(aSteps).toBe(0);
    expect(bSteps).toBe(1);
  });

  it('exposes deterministic dt', () => {
    const ft = new FixedTimestep({ hz: 60, maxFrameMs: 250 });
    expect(ft.dt).toBeCloseTo(1 / 60, 9);
  });

  it('handles non-monotonic now (defensive)', () => {
    const ft = new FixedTimestep({ hz: 60, maxFrameMs: 250 });
    ft.reset(1000);
    const r = ft.tick(900);
    expect(r.steps).toBe(0);
  });
});
