import { Application, Container, Graphics, Text } from 'pixi.js';
import { FixedTimestep } from './core/loop/fixed-timestep.ts';
import { drawPitch, PITCH_FIFA_M } from './render/pitch.ts';

const SIM_HZ = 60;
const MAX_FRAME_MS = 250;
const CANVAS_W = 1280;
const CANVAS_H = 720;
const PITCH_MARGIN_M = 4;

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

  const fpsText = new Text({
    text: 'FPS --',
    style: { fill: 0xffffff, fontSize: 14, fontFamily: 'monospace' },
  });
  fpsText.x = 10;
  fpsText.y = 10;
  app.stage.addChild(fpsText);

  const ft = new FixedTimestep({ hz: SIM_HZ, maxFrameMs: MAX_FRAME_MS });
  ft.reset(performance.now());

  let fpsAccumMs = 0;
  let fpsFrames = 0;

  app.ticker.add(() => {
    const now = performance.now();
    const result = ft.tick(now);
    for (let i = 0; i < result.steps; i++) {
      // simulate(world, ft.dt) — pas de simulation en J0
    }
    // render(world, result.alpha) — pas d'interpolation en J0

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

main().catch((err: unknown) => {
  console.error('Bootstrap failed', err);
});
