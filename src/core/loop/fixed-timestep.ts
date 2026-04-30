export interface FixedTimestepConfig {
  hz: number;
  maxFrameMs: number;
}

export interface TickResult {
  steps: number;
  alpha: number;
}

export class FixedTimestep {
  private accumulator = 0;
  private last = 0;
  private readonly stepMs: number;
  private readonly out: TickResult = { steps: 0, alpha: 0 };

  constructor(private readonly cfg: FixedTimestepConfig) {
    this.stepMs = 1000 / cfg.hz;
  }

  reset(now: number): void {
    this.last = now;
    this.accumulator = 0;
  }

  // Retourne un TickResult partagé (zéro-alloc). Lire les champs avant le prochain tick.
  tick(now: number): TickResult {
    let frameMs = now - this.last;
    this.last = now;
    if (frameMs > this.cfg.maxFrameMs) frameMs = this.cfg.maxFrameMs;
    if (frameMs < 0) frameMs = 0;
    this.accumulator += frameMs;
    let steps = 0;
    while (this.accumulator >= this.stepMs) {
      this.accumulator -= this.stepMs;
      steps++;
    }
    this.out.steps = steps;
    this.out.alpha = this.accumulator / this.stepMs;
    return this.out;
  }

  get dt(): number {
    return this.stepMs / 1000;
  }
}
