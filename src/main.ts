import { Application, Container, Graphics, Text } from 'pixi.js';
import { FixedTimestep } from './core/loop/fixed-timestep.ts';
import { type BallState, createBall, stepBall } from './core/physics/ball.ts';
import { BallView } from './render/ball.ts';
import { drawPitch, PITCH_FIFA_M } from './render/pitch.ts';

const SIM_HZ = 60;
const MAX_FRAME_MS = 250;
const CANVAS_W = 1280;
const CANVAS_H = 720;
const PITCH_MARGIN_M = 4;
const KICK_POWER_FACTOR = 1.2;
const KICK_MAX_POWER_MS = 30;
const CHIP_VZ_BASE_MS = 6;
const CHIP_VZ_GAIN = 0.2;

async function main(): Promise<void> {
  const app = new Application();
  await app.init({
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: 0x1f7a1f,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });

  const host = document.getElementById('stage');
  if (!host) {
    throw new Error('Missing #stage element in index.html');
  }
  host.appendChild(app.canvas);

  const ppm = Math.min(
    CANVAS_W / (PITCH_FIFA_M.width + PITCH_MARGIN_M * 2),
    CANVAS_H / (PITCH_FIFA_M.height + PITCH_MARGIN_M * 2),
  );
  const pitchWidthPx = PITCH_FIFA_M.width * ppm;
  const pitchHeightPx = PITCH_FIFA_M.height * ppm;

  const world = new Container();
  world.x = (CANVAS_W - pitchWidthPx) / 2;
  world.y = (CANVAS_H - pitchHeightPx) / 2;
  app.stage.addChild(world);

  const pitchGfx = new Graphics();
  drawPitch(pitchGfx, PITCH_FIFA_M, ppm);
  world.addChild(pitchGfx);

  const ball = createBall();
  ball.pos.x = PITCH_FIFA_M.width / 2;
  ball.pos.y = PITCH_FIFA_M.height / 2;
  const ballView = new BallView(ppm);
  world.addChild(ballView.container);

  const fpsText = new Text({
    text: 'FPS --',
    style: { fill: 0xffffff, fontSize: 14, fontFamily: 'monospace' },
  });
  fpsText.x = 10;
  fpsText.y = 10;
  app.stage.addChild(fpsText);

  const helpText = new Text({
    text: 'Clic gauche : tir au sol — Clic droit : lob',
    style: { fill: 0xffffff, fontSize: 12, fontFamily: 'monospace' },
  });
  helpText.x = 10;
  helpText.y = CANVAS_H - 22;
  helpText.alpha = 0.7;
  app.stage.addChild(helpText);

  app.canvas.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
  });
  app.canvas.addEventListener('pointerdown', (ev: PointerEvent) => {
    const rect = app.canvas.getBoundingClientRect();
    const sx = ev.clientX - rect.left;
    const sy = ev.clientY - rect.top;
    const wx = (sx - world.x) / ppm;
    const wy = (sy - world.y) / ppm;
    kickBallTowards(ball, wx, wy, ev.button === 2);
  });

  const ft = new FixedTimestep({ hz: SIM_HZ, maxFrameMs: MAX_FRAME_MS });
  ft.reset(performance.now());

  let fpsAccumMs = 0;
  let fpsFrames = 0;

  app.ticker.add(() => {
    const now = performance.now();
    const result = ft.tick(now);
    for (let i = 0; i < result.steps; i++) {
      stepBall(ball, ft.dt);
    }
    ballView.update(ball);

    fpsAccumMs += app.ticker.deltaMS;
    fpsFrames++;
    if (fpsAccumMs >= 500) {
      const fps = (fpsFrames / fpsAccumMs) * 1000;
      fpsText.text = `FPS ${fps.toFixed(0)}`;
      fpsAccumMs = 0;
      fpsFrames = 0;
    }
  });
}

function kickBallTowards(ball: BallState, targetX: number, targetY: number, chip: boolean): void {
  const dx = targetX - ball.pos.x;
  const dy = targetY - ball.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.01) return;
  const power = Math.min(KICK_MAX_POWER_MS, dist * KICK_POWER_FACTOR);
  ball.vel.x = (dx / dist) * power;
  ball.vel.y = (dy / dist) * power;
  ball.vz = chip ? CHIP_VZ_BASE_MS + power * CHIP_VZ_GAIN : 0;
}

main().catch((err: unknown) => {
  console.error('Bootstrap failed', err);
});
