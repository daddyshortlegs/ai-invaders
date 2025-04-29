export interface IGameState {
  level: number;
  lives: number;
  score: number;
  gameOver: boolean;
  levelTransition: boolean;
  isBossLevel: boolean;
  bossHealth: number;
  update(): void;
  reset(): void;
  incrementLevel(): void;
  decrementLives(): void;
  addScore(points: number): void;
} 