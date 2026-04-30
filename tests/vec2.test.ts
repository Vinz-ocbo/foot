import { describe, it, expect } from 'vitest';
import {
  vec2,
  vec2Add,
  vec2Dist,
  vec2Length,
  vec2Lerp,
  vec2Normalize,
  vec2Scale,
  vec2ScaleAndAdd,
  vec2Sub,
} from '../src/core/math/vec2.ts';

describe('vec2', () => {
  it('add', () => {
    const out = vec2(0, 0);
    vec2Add(out, vec2(1, 2), vec2(3, 4));
    expect(out).toEqual({ x: 4, y: 6 });
  });

  it('sub', () => {
    const out = vec2(0, 0);
    vec2Sub(out, vec2(5, 7), vec2(2, 3));
    expect(out).toEqual({ x: 3, y: 4 });
  });

  it('scale', () => {
    const out = vec2(0, 0);
    vec2Scale(out, vec2(2, -3), 4);
    expect(out).toEqual({ x: 8, y: -12 });
  });

  it('scaleAndAdd', () => {
    const out = vec2(0, 0);
    vec2ScaleAndAdd(out, vec2(1, 1), vec2(2, 3), 5);
    expect(out).toEqual({ x: 11, y: 16 });
  });

  it('length and dist', () => {
    expect(vec2Length(vec2(3, 4))).toBe(5);
    expect(vec2Dist(vec2(1, 1), vec2(4, 5))).toBe(5);
  });

  it('normalize unit', () => {
    const out = vec2(0, 0);
    vec2Normalize(out, vec2(3, 4));
    expect(out.x).toBeCloseTo(0.6, 9);
    expect(out.y).toBeCloseTo(0.8, 9);
  });

  it('normalize zero stays zero', () => {
    const out = vec2(0, 0);
    vec2Normalize(out, vec2(0, 0));
    expect(out).toEqual({ x: 0, y: 0 });
  });

  it('lerp midpoint', () => {
    const out = vec2(0, 0);
    vec2Lerp(out, vec2(0, 0), vec2(10, 20), 0.5);
    expect(out).toEqual({ x: 5, y: 10 });
  });

  it('mutates only the out target — no allocation', () => {
    const a = vec2(1, 2);
    const b = vec2(3, 4);
    const out = vec2(0, 0);
    vec2Add(out, a, b);
    expect(a).toEqual({ x: 1, y: 2 });
    expect(b).toEqual({ x: 3, y: 4 });
  });
});
