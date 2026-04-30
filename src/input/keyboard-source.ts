import { createInputState, type InputSource, type InputState } from './input-source.ts';

const GAME_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyE',
  'KeyQ',
  'KeyR',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'Tab',
  'ShiftLeft',
  'ShiftRight',
]);

export class KeyboardSource implements InputSource {
  private readonly state: InputState = createInputState();
  private readonly keys = new Set<string>();
  private edgeShootReleased = false;
  private edgePassReleased = false;
  private edgeSwitchPressed = false;
  private edgeTacklePressed = false;
  private edgeTurnAroundPressed = false;
  private edgeResetPressed = false;
  // Toggle "↑↓ alternance" : flip uniquement quand on change d'arrow.
  private currentArrow: 'up' | 'down' = 'up';
  private readonly target: Window | HTMLElement;

  constructor(target: Window | HTMLElement = window) {
    this.target = target;
    this.target.addEventListener('keydown', this.onKeyDown as EventListener);
    this.target.addEventListener('keyup', this.onKeyUp as EventListener);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (this.keys.has(e.code)) return;
    this.keys.add(e.code);
    if (e.code === 'KeyQ') this.edgeTacklePressed = true;
    if (e.code === 'Tab') this.edgeSwitchPressed = true;
    if (e.code === 'KeyR') this.edgeResetPressed = true;
    if ((e.code === 'KeyW' || e.code === 'ArrowUp') && this.currentArrow === 'down') {
      this.edgeTurnAroundPressed = true;
      this.currentArrow = 'up';
    } else if ((e.code === 'KeyS' || e.code === 'ArrowDown') && this.currentArrow === 'up') {
      this.edgeTurnAroundPressed = true;
      this.currentArrow = 'down';
    }
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    if (!this.keys.has(e.code)) return;
    this.keys.delete(e.code);
    if (e.code === 'Space') this.edgeShootReleased = true;
    if (e.code === 'KeyE') this.edgePassReleased = true;
  };

  sample(): InputState {
    const upHeld = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    const downHeld = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    const thrust = upHeld || downHeld ? 1 : 0;
    let rotate = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) rotate -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) rotate += 1;

    this.state.thrust = thrust;
    this.state.rotate = rotate;
    this.state.sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    this.state.shootHeld = this.keys.has('Space');
    this.state.shootReleased = this.edgeShootReleased;
    this.state.passHeld = this.keys.has('KeyE');
    this.state.passReleased = this.edgePassReleased;
    this.state.switchPressed = this.edgeSwitchPressed;
    this.state.tacklePressed = this.edgeTacklePressed;
    this.state.turnAroundPressed = this.edgeTurnAroundPressed;
    this.state.resetPressed = this.edgeResetPressed;

    this.edgeShootReleased = false;
    this.edgePassReleased = false;
    this.edgeSwitchPressed = false;
    this.edgeTacklePressed = false;
    this.edgeTurnAroundPressed = false;
    this.edgeResetPressed = false;

    return this.state;
  }

  dispose(): void {
    this.target.removeEventListener('keydown', this.onKeyDown as EventListener);
    this.target.removeEventListener('keyup', this.onKeyUp as EventListener);
  }
}
