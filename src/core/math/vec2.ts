export interface Vec2 {
  x: number;
  y: number;
}

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });

export function vec2Set(out: Vec2, x: number, y: number): void {
  out.x = x;
  out.y = y;
}

export function vec2Copy(out: Vec2, a: Vec2): void {
  out.x = a.x;
  out.y = a.y;
}

export function vec2Add(out: Vec2, a: Vec2, b: Vec2): void {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
}

export function vec2Sub(out: Vec2, a: Vec2, b: Vec2): void {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
}

export function vec2Scale(out: Vec2, a: Vec2, s: number): void {
  out.x = a.x * s;
  out.y = a.y * s;
}

export function vec2ScaleAndAdd(out: Vec2, a: Vec2, b: Vec2, s: number): void {
  out.x = a.x + b.x * s;
  out.y = a.y + b.y * s;
}

export function vec2Dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function vec2LengthSq(a: Vec2): number {
  return a.x * a.x + a.y * a.y;
}

export function vec2Length(a: Vec2): number {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

export function vec2DistSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function vec2Dist(a: Vec2, b: Vec2): number {
  return Math.sqrt(vec2DistSq(a, b));
}

export function vec2Normalize(out: Vec2, a: Vec2): void {
  const len = vec2Length(a);
  if (len < 1e-9) {
    out.x = 0;
    out.y = 0;
    return;
  }
  out.x = a.x / len;
  out.y = a.y / len;
}

export function vec2Lerp(out: Vec2, a: Vec2, b: Vec2, t: number): void {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
}
