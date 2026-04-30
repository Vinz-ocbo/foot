import { Application, Container, Graphics, Text } from 'pixi.js';
import { FixedTimestep } from './core/loop/fixed-timestep.ts';
import { type BallState, createBall, stepBall } from './core/physics/ball.ts';
import {
  LOB_PASS_FULL_CHARGE_S,
  lobPass,
  pass,
  shoot,
  SHOOT_FULL_CHARGE_S,
} from './core/physics/actions.ts';
import { applySoftAttach, canCaptureBall } from './core/physics/possession.ts';
import {
  createPlayer,
  type PlayerInput,
  type PlayerState,
  stepPlayer,
} from './core/physics/player.ts';
import { KeyboardSource } from './input/keyboard-source.ts';
import { BallView } from './render/ball.ts';
import { drawPitch, PITCH_FIFA_M } from './render/pitch.ts';
import { PlayerView } from './render/player.ts';

const SIM_HZ = 60;
const MAX_FRAME_MS = 250;
const CANVAS_W = 1280;
const CANVAS_H = 720;
const PITCH_MARGIN_M = 4;
const CHARGE_BAR_WIDTH_PX = 220;
const CHARGE_BAR_HEIGHT_PX = 8;
const CHARGE_BAR_BOTTOM_OFFSET_PX = 28;
const PASS_TAP_THRESHOLD_S = 0.08;
const SHOOT_BAR_COLOR = 0xff8800;
const LOB_BAR_COLOR = 0x44aaff;
const SPIN_INPUT_RATE_RAD_S2 = 30;
const MAX_SPIN_RAD_S = 8;
const BALL_FREE_SPEED_THRESHOLD_SQ = 1; // (1 m/s)²

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
  resetBall(ball);
  const ballView = new BallView(ppm);
  world.addChild(ballView.container);

  const player = createPlayer(0);
  resetPlayer(player);
  const playerView = new PlayerView(0, ppm);
  world.addChild(playerView.container);

  const fpsText = new Text({
    text: 'FPS --\nSTAMINA --',
    style: { fill: 0xffffff, fontSize: 14, fontFamily: 'monospace' },
  });
  fpsText.x = 10;
  fpsText.y = 10;
  app.stage.addChild(fpsText);

  const helpText = new Text({
    text: '↑↓/WS : avancer (alterner = demi-tour) · ←→/AD : pivoter · Shift : sprint · Espace : tir (charge) · E : passe (tap) ou lob (charge) · R : reset',
    style: { fill: 0xffffff, fontSize: 12, fontFamily: 'monospace' },
  });
  helpText.x = 10;
  helpText.y = CANVAS_H - 22;
  helpText.alpha = 0.75;
  app.stage.addChild(helpText);

  const chargeBarBg = new Graphics();
  chargeBarBg
    .rect(0, 0, CHARGE_BAR_WIDTH_PX, CHARGE_BAR_HEIGHT_PX)
    .fill({ color: 0x000000, alpha: 0.45 });
  chargeBarBg.x = (CANVAS_W - CHARGE_BAR_WIDTH_PX) / 2;
  chargeBarBg.y = CANVAS_H - CHARGE_BAR_BOTTOM_OFFSET_PX;
  app.stage.addChild(chargeBarBg);

  const chargeBarFill = new Graphics();
  chargeBarFill.rect(0, 0, CHARGE_BAR_WIDTH_PX, CHARGE_BAR_HEIGHT_PX).fill(0xffffff);
  chargeBarFill.x = chargeBarBg.x;
  chargeBarFill.y = chargeBarBg.y;
  chargeBarFill.scale.x = 0;
  chargeBarFill.tint = SHOOT_BAR_COLOR;
  app.stage.addChild(chargeBarFill);

  const keyboard = new KeyboardSource();
  const ft = new FixedTimestep({ hz: SIM_HZ, maxFrameMs: MAX_FRAME_MS });
  ft.reset(performance.now());

  let chargeAccumS = 0;
  let passChargeAccumS = 0;
  let fpsAccumMs = 0;
  // Sens du spin verrouillé pendant un vol : 0 = pas encore donné, ±1 = direction figée.
  let spinLockSign: -1 | 0 | 1 = 0;
  // Buffer pré-alloué pour passer un input modifié à stepPlayer sans allouer.
  const playerInputBuffer: PlayerInput = { thrust: 0, rotate: 0, sprint: false };
  let fpsFrames = 0;
  let lastFps = 0;

  app.ticker.add(() => {
    const now = performance.now();
    const result = ft.tick(now);
    const input = keyboard.sample();

    if (input.resetPressed) {
      resetPlayer(player);
      resetBall(ball);
      chargeAccumS = 0;
      passChargeAccumS = 0;
    }

    if (input.turnAroundPressed) {
      player.facing.x = -player.facing.x;
      player.facing.y = -player.facing.y;
      player.vel.x = 0;
      player.vel.y = 0;
    }

    if (input.shootReleased && player.hasBall) {
      shoot(player, ball, chargeAccumS);
    }
    if (input.passReleased && player.hasBall) {
      if (passChargeAccumS < PASS_TAP_THRESHOLD_S) {
        pass(player, ball);
      } else {
        lobPass(player, ball, passChargeAccumS);
      }
    }

    for (let i = 0; i < result.steps; i++) {
      if (input.shootHeld) {
        chargeAccumS = Math.min(SHOOT_FULL_CHARGE_S, chargeAccumS + ft.dt);
      } else {
        chargeAccumS = 0;
      }
      if (input.passHeld) {
        passChargeAccumS = Math.min(LOB_PASS_FULL_CHARGE_S, passChargeAccumS + ft.dt);
      } else {
        passChargeAccumS = 0;
      }

      // Pendant le vol du ballon (libre + en mouvement), input.rotate alimente
      // le spin et NE pilote PAS le facing du joueur — sinon on tourne en
      // essayant de courber.
      const ballSpeedSq = ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y;
      const ballInFlight = !player.hasBall && ballSpeedSq > BALL_FREE_SPEED_THRESHOLD_SQ;

      playerInputBuffer.thrust = input.thrust;
      playerInputBuffer.rotate = ballInFlight ? 0 : input.rotate;
      playerInputBuffer.sprint = input.sprint;
      stepPlayer(player, playerInputBuffer, ft.dt);

      if (player.hasBall) {
        applySoftAttach(player, ball);
      } else if (canCaptureBall(player, ball)) {
        player.hasBall = true;
        applySoftAttach(player, ball);
      }

      if (ballInFlight && !player.hasBall && input.rotate !== 0) {
        const inputSign = input.rotate > 0 ? 1 : -1;
        if (spinLockSign === 0) spinLockSign = inputSign;
        if (inputSign === spinLockSign) {
          const newSpin = ball.spin + input.rotate * SPIN_INPUT_RATE_RAD_S2 * ft.dt;
          ball.spin = Math.max(-MAX_SPIN_RAD_S, Math.min(MAX_SPIN_RAD_S, newSpin));
        }
      }
      if (!ballInFlight) {
        spinLockSign = 0;
      }

      stepBall(ball, ft.dt);
    }

    ballView.update(ball);
    playerView.update(player, true);
    if (chargeAccumS > 0) {
      chargeBarFill.tint = SHOOT_BAR_COLOR;
      chargeBarFill.scale.x = chargeAccumS / SHOOT_FULL_CHARGE_S;
    } else if (passChargeAccumS > 0) {
      chargeBarFill.tint = LOB_BAR_COLOR;
      chargeBarFill.scale.x = passChargeAccumS / LOB_PASS_FULL_CHARGE_S;
    } else {
      chargeBarFill.scale.x = 0;
    }

    fpsAccumMs += app.ticker.deltaMS;
    fpsFrames++;
    if (fpsAccumMs >= 500) {
      lastFps = (fpsFrames / fpsAccumMs) * 1000;
      fpsAccumMs = 0;
      fpsFrames = 0;
    }
    fpsText.text = `FPS ${lastFps.toFixed(0)}\nSTAMINA ${player.stamina.toFixed(0)}`;
  });
}

function resetPlayer(player: PlayerState): void {
  player.pos.x = PITCH_FIFA_M.width / 2 - 2;
  player.pos.y = PITCH_FIFA_M.height / 2;
  player.vel.x = 0;
  player.vel.y = 0;
  player.facing.x = 1;
  player.facing.y = 0;
  player.stamina = 100;
  player.hasBall = false;
}

function resetBall(ball: BallState): void {
  ball.pos.x = PITCH_FIFA_M.width / 2;
  ball.pos.y = PITCH_FIFA_M.height / 2;
  ball.vel.x = 0;
  ball.vel.y = 0;
  ball.z = 0;
  ball.vz = 0;
  ball.spin = 0;
}

main().catch((err: unknown) => {
  console.error('Bootstrap failed', err);
});
