import { IGameState } from './interfaces/IGameState';

export class GameState implements IGameState {
  level: number = 1;
  lives: number = 5;
  score: number = 0;
  gameOver: boolean = false;
  levelTransition: boolean = false;
  isBossLevel: boolean = false;
  bossHealth: number = 0;

  update(): void {
    if (this.levelTransition) {
      this.levelTransition = false;
      this.incrementLevel();
    }
  }

  reset(): void {
    this.level = 1;
    this.lives = 5;
    this.score = 0;
    this.gameOver = false;
    this.levelTransition = false;
    this.isBossLevel = false;
    this.bossHealth = 0;
  }

  incrementLevel(): void {
    this.level++;
    if (this.level === 8) {
      this.isBossLevel = true;
      this.bossHealth = 50;
    } else {
      this.isBossLevel = false;
    }
  }

  decrementLives(): void {
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver = true;
    }
  }

  addScore(points: number): void {
    this.score += points;
  }
} 