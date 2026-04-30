export interface InputState {
  thrust: number;
  rotate: number;
  sprint: boolean;
  shootHeld: boolean;
  shootReleased: boolean;
  passHeld: boolean;
  passReleased: boolean;
  switchPressed: boolean;
  tacklePressed: boolean;
  turnAroundPressed: boolean;
  resetPressed: boolean;
}

export interface InputSource {
  // Retourne l'état d'input courant. Les edge events (released/pressed) sont
  // consommés à chaque appel : true au premier sample qui suit la transition,
  // false ensuite. Implémentations zéro-allocation : le même InputState peut
  // être renvoyé à chaque appel.
  sample(): InputState;
  dispose(): void;
}

export function createInputState(): InputState {
  return {
    thrust: 0,
    rotate: 0,
    sprint: false,
    shootHeld: false,
    shootReleased: false,
    passHeld: false,
    passReleased: false,
    switchPressed: false,
    tacklePressed: false,
    turnAroundPressed: false,
    resetPressed: false,
  };
}
