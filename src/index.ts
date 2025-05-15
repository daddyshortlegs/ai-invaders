import { AudioManager } from './AudioManager';
import { GameState } from './GameState';

export class PixelDisplay {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private displayWidth: number = 64;
    private displayHeight: number = 32;
    private pixelSize: number = 1;
    private spaceshipX: number = 32; // Start in the middle
    private spaceshipY: number = 27; // Fixed at the bottom (displayHeight - 5)
    private keys: { [key: string]: boolean } = {};
    private playerBullets: { x: number, y: number }[] = [];
    private alienBullets: { x: number, y: number }[] = [];
    private lastShotTime: number = 0;
    private shotCooldown: number = 200; // milliseconds between shots
    private aliens: { x: number, y: number, direction: number, lastShotTime: number }[] = [];
    private frameCount: number = 0;
    private alienSpeed: number = 0.25; // Reduced from 0.5 to 0.25 to halve movement speed
    private alienMoveInterval: number = 4; // Only move aliens every 4 frames
    private alienShotCooldown: number = 2000; // Increased from 1000ms to 2000ms to halve shooting speed
    private alienShotChance: number = 0.05; // Reduced from 0.1 to 0.05 (5% chance)
    private gameState: GameState;
    private audioManager: AudioManager;
    private levelTransitionTime: number = 0;
    private bossX: number = 0;
    private bossY: number = 2;
    private bossDirection: number = 1;
    private bossSpeed: number = 0.5;
    private bossLastShotTime: number = 0;
    private bossShotCooldown: number = 1000;
    private gameOver: boolean = false;
    private level: number = 1;
    private levelTransition: boolean = false;
    private lives: number = 5;
    private bossHealth: number = 50;
    private gameWon: boolean = false;
    private lastHeartbeatTime: number = 0;
    private heartbeatCooldown: number = 1000; // milliseconds between heartbeats

    // Spaceship bitmap (5x5 pixels)
    private spaceship: number[][] = [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1]
    ];

    // Alien bitmap (5x5 pixels)
    private alien: number[][] = [
        [0, 1, 0, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 0, 1, 0]
    ];

    // Boss crab bitmap (28x20 pixels)
    private bossCrab: number[][] = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0]
    ];

    constructor() {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.canvas.width = this.displayWidth;
        this.canvas.height = this.displayHeight;
        
        this.gameState = new GameState();
        this.audioManager = new AudioManager();
        
        this.initializeAliens();
        // Wait for setupEventListeners to complete before starting animation
        this.setupEventListeners().then(() => {
            this.startAnimation();
        });
    }

    private initializeAliens(): void {
        // Clear existing aliens
        this.aliens = [];
        
        // Create a grid of aliens (2 rows for levels 1-3, 3 rows for level 4+)
        const rows = this.gameState.level >= 4 ? 3 : 2;
        const cols = 5;
        const spacingX = this.displayWidth / (cols + 1); // Evenly space aliens horizontally
        const startY = 2; // Start a bit below the top
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.aliens.push({
                    x: spacingX * (col + 1),
                    y: startY + (row * 6), // 6 pixels between rows (5 for alien height + 1 for spacing)
                    direction: 1, // Start moving right
                    lastShotTime: 0
                });
            }
        }
    }

    private async setupEventListeners(): Promise<void> {
        // Preload sounds
        await this.audioManager.preloadSounds([
            'shoot',
            'alien_hit',
            'explosion',
            'heartbeat',
            'crab',
            'victory'
        ]);

        window.addEventListener('keydown', (e) => {
            if (this.gameState.gameOver && e.key === ' ') {
                this.restartGame();
                return;
            }
            
            // Cheat code to jump to boss battle
            if (e.key.toLowerCase() === 'c') {
                this.gameState.level = 8;
                this.gameState.levelTransition = true;
                this.gameState.isBossLevel = true;
                this.aliens = []; // Clear regular aliens
                this.gameState.bossHealth = 50; // Reset boss health
                this.bossX = 0; // Reset boss position
                this.bossY = 2;
                this.bossDirection = 1;
                this.bossLastShotTime = 0;
                return;
            }
            
            this.keys[e.key] = true;
            if (e.key === ' ' && Date.now() - this.lastShotTime > this.shotCooldown) {
                this.shoot();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    private shoot(): void {
        if (Date.now() - this.lastShotTime <= this.shotCooldown) {
            return;
        }
        
        this.playerBullets.push({
            x: this.spaceshipX + 2,
            y: this.spaceshipY - 1
        });
        this.lastShotTime = Date.now();
        
        this.audioManager.playSound('shoot');
    }

    private startAnimation(): void {
        const animate = () => {
            if (!this.gameState.gameOver) {
                this.updateSpaceshipPosition();
                this.updateBullets();
                this.updateAliens();
                this.checkCollisions();
            }
            this.drawDisplay();
            this.frameCount++;
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    private updateSpaceshipPosition(): void {
        // Only allow horizontal movement
        if (this.keys['ArrowLeft'] && this.spaceshipX > 0) {
            this.spaceshipX -= 1;
        }
        if (this.keys['ArrowRight'] && this.spaceshipX < this.displayWidth - 5) {
            this.spaceshipX += 1;
        }
    }

    private updateBullets(): void {
        // Update player bullets
        this.playerBullets = this.playerBullets.filter(bullet => {
            bullet.y -= 2;
            return bullet.y > 0;
        });

        // Update alien bullets
        this.alienBullets = this.alienBullets.filter(bullet => {
            bullet.y += 0.25; // Reduced from 0.5 to 0.25 to halve speed
            return bullet.y < this.displayHeight;
        });
    }

    private updateAliens(): void {
        if (this.gameState.level === 8) {
            // Update boss movement
            this.bossX += this.bossSpeed * this.bossDirection;
            if (this.bossX <= 0 || this.bossX >= this.displayWidth - 28) { // Adjusted for new size
                this.bossDirection *= -1;
            }

            // Boss shooting
            if (Date.now() - this.bossLastShotTime > this.bossShotCooldown) {
                this.alienBullets.push({
                    x: this.bossX + 14, // Center of the boss (28/2)
                    y: this.bossY + 20  // Bottom of the boss
                });
                this.bossLastShotTime = Date.now();
            }
        } else {
            // Check if it's time to move aliens
            if (this.frameCount % this.alienMoveInterval === 0) {
                // Update alien positions first
                for (const alien of this.aliens) {
                    // Check if current position is at edge
                    if (alien.x <= 0) {
                        alien.direction = 1; // Change to right when hitting left edge
                        alien.y += 1;
                    } else if (alien.x >= this.displayWidth - 5) {
                        alien.direction = -1; // Change to left when hitting right edge
                        alien.y += 1;
                    }
                    
                    // Move the alien in its current direction
                    alien.x += this.alienSpeed * alien.direction;

                    // Check for collision with spaceship
                    if (alien.y + 5 >= this.spaceshipY && // Alien bottom edge reaches spaceship top
                        alien.x + 5 > this.spaceshipX && // Alien right edge is right of spaceship left
                        alien.x < this.spaceshipX + 5) { // Alien left edge is left of spaceship right
                        this.gameState.gameOver = true;
                        this.playExplosionSound();
                        return;
                    }
                }

                // Random alien shooting
                if (Math.random() < 0.01) { // 1% chance per frame
                    const randomAlien = this.aliens[Math.floor(Math.random() * this.aliens.length)];
                    this.alienBullets.push({
                        x: randomAlien.x + 2,
                        y: randomAlien.y + 2
                    });
                }
            }
        }
    }

    private playAlienHitSound(): void {
        this.audioManager.playSound('alien_hit');
    }

    private playExplosionSound(): void {
        this.audioManager.playSound('explosion');
    }

    private playHeartbeatSound(): void {
        try {
            this.audioManager.playSound('heartbeat');
        } catch (error) {
            console.warn('Error playing heartbeat sound:', error);
        }
    }

    private stopHeartbeatSound(): void {
        this.audioManager.stopSound('heartbeat');
    }

    private playCrabSound(): void {
        this.audioManager.playSound('crab');
    }

    private stopCrabSound(): void {
        this.audioManager.stopSound('crab');
    }

    private playVictorySound(): void {
        this.audioManager.playSound('victory');
    }

    private stopVictorySound(): void {
        this.audioManager.stopSound('victory');
    }

    private checkCollisions(): void {
        if (this.gameState.isBossLevel) {
            // Check player bullets hitting boss
            this.playerBullets = this.playerBullets.filter(bullet => {
                if (bullet.x >= this.bossX && bullet.x < this.bossX + 28 && // Adjusted for new size
                    bullet.y >= this.bossY && bullet.y < this.bossY + 20) { // Adjusted for new size
                    this.gameState.bossHealth--;
                    this.playAlienHitSound();
                    
                    if (this.gameState.bossHealth <= 0) {
                        this.gameState.gameOver = true;
                        this.stopCrabSound();
                        this.stopHeartbeatSound();
                        this.playExplosionSound();
                        this.playVictorySound();
                    }
                    
                    return false; // Remove the bullet
                }
                return true;
            });

            // Check boss bullets hitting spaceship
            this.alienBullets = this.alienBullets.filter(bullet => {
                if (bullet.x >= this.spaceshipX && bullet.x < this.spaceshipX + 5 &&
                    bullet.y >= this.spaceshipY && bullet.y < this.spaceshipY + 5) {
                    this.gameState.decrementLives();
                    if (this.gameState.lives <= 0) {
                        this.gameState.gameOver = true;
                        this.stopHeartbeatSound();
                        this.playExplosionSound();
                    }
                    return false; // Remove the bullet
                }
                return true;
            });
        } else {
            // Check player bullets hitting aliens
            for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
                const bullet = this.playerBullets[bi];
                for (let ai = this.aliens.length - 1; ai >= 0; ai--) {
                    const alien = this.aliens[ai];
                    if (bullet.x >= alien.x && bullet.x < alien.x + 5 &&
                        bullet.y >= alien.y && bullet.y < alien.y + 5) {
                        // Remove the alien and bullet
                        this.aliens.splice(ai, 1);
                        this.playerBullets.splice(bi, 1);
                        this.playAlienHitSound();
                        this.gameState.addScore(10);
                        break; // Break since this bullet has been removed
                    }
                }
            }

            // Check if all aliens are destroyed
            if (this.aliens.length === 0) {
                this.stopHeartbeatSound();
                this.gameState.levelTransition = true;
                this.levelTransitionTime = Date.now();
                this.gameState.incrementLevel();
                // Increase alien speed by 25% each level
                this.alienSpeed = 0.25 * (1 + (this.gameState.level - 1) * 0.25);
                // Clear all bullets and reset game state when transitioning to next level
                this.playerBullets = [];
                this.alienBullets = [];
                // Initialize new aliens for the next level
                if (this.gameState.level < 8) {
                    this.initializeAliens();
                }
            } else if (!this.gameState.levelTransition && Date.now() - this.lastHeartbeatTime > this.heartbeatCooldown) {
                this.playHeartbeatSound();
                this.lastHeartbeatTime = Date.now();
            }

            // Check alien bullets hitting spaceship
            this.alienBullets = this.alienBullets.filter(bullet => {
                if (bullet.x >= this.spaceshipX && bullet.x < this.spaceshipX + 5 &&
                    bullet.y >= this.spaceshipY && bullet.y < this.spaceshipY + 5) {
                    this.gameState.decrementLives();
                    if (this.gameState.lives <= 0) {
                        this.gameState.gameOver = true;
                        this.playExplosionSound();
                    }
                    return false; // Remove the bullet
                }
                return true;
            });
        }
    }

    private drawDisplay(): void {
        // Clear the display
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

        if (this.gameState.gameOver) {
            if (this.gameState.isBossLevel && this.gameState.bossHealth <= 0) {
                // Draw pixelated YOU WIN text
                this.ctx.fillStyle = '#0F0';
                
                // Define each letter as a 5x7 grid
                const Y = [
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [0,1,0,1,0],
                    [0,0,1,0,0],
                    [0,0,1,0,0],
                    [0,0,1,0,0],
                    [0,0,1,0,0]
                ];
                
                const O = [
                    [0,1,1,1,0],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [0,1,1,1,0]
                ];
                
                const U = [
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [0,1,1,1,0]
                ];
                
                const W = [
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,1,0,1],
                    [1,0,1,0,1],
                    [1,1,0,1,1],
                    [1,0,0,0,1]
                ];
                
                const I = [
                    [1,1,1,1,1],
                    [0,0,1,0,0],
                    [0,0,1,0,0],
                    [0,0,1,0,0],
                    [0,0,1,0,0],
                    [0,0,1,0,0],
                    [1,1,1,1,1]
                ];
                
                const N = [
                    [1,0,0,0,1],
                    [1,1,0,0,1],
                    [1,0,1,0,1],
                    [1,0,0,1,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1]
                ];

                // Draw "YOU WIN"
                const drawLetter = (letter: number[][], x: number, y: number) => {
                    for (let row = 0; row < 7; row++) {
                        for (let col = 0; col < 5; col++) {
                            if (letter[row][col] === 1) {
                                this.ctx.fillRect(x + col, y + row, 1, 1);
                            }
                        }
                    }
                };

                const startX = (this.displayWidth - 30) / 2;
                const startY = (this.displayHeight - 7) / 2;

                // Draw YOU
                drawLetter(Y, startX, startY);
                drawLetter(O, startX + 6, startY);
                drawLetter(U, startX + 12, startY);

                // Draw WIN
                drawLetter(W, startX, startY + 9);
                drawLetter(I, startX + 6, startY + 9);
                drawLetter(N, startX + 12, startY + 9);

                // Draw "Press SPACE to restart" message
                const restartMessage = "Press SPACE to restart";
                this.ctx.font = '8px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(restartMessage, this.displayWidth / 2, startY + 20);
            } else {
                // Draw pixelated GAME OVER text
                this.ctx.fillStyle = '#0F0';
                
                // Define each letter as a 5x7 grid
                const G = [
                    [1,1,1,1,1],
                    [1,0,0,0,0],
                    [1,0,0,0,0],
                    [1,0,1,1,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,1,1,1,1]
                ];
                
                const A = [
                    [0,1,1,1,0],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,1,1,1,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1]
                ];
                
                const M = [
                    [1,0,0,0,1],
                    [1,1,0,1,1],
                    [1,0,1,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1]
                ];
                
                const E = [
                    [1,1,1,1,1],
                    [1,0,0,0,0],
                    [1,0,0,0,0],
                    [1,1,1,1,0],
                    [1,0,0,0,0],
                    [1,0,0,0,0],
                    [1,1,1,1,1]
                ];
                
                const O = [
                    [0,1,1,1,0],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [0,1,1,1,0]
                ];
                
                const V = [
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [0,1,0,1,0],
                    [0,1,0,1,0],
                    [0,0,1,0,0]
                ];
                
                const R = [
                    [1,1,1,1,0],
                    [1,0,0,0,1],
                    [1,0,0,0,1],
                    [1,1,1,1,0],
                    [1,0,1,0,0],
                    [1,0,0,1,0],
                    [1,0,0,0,1]
                ];

                // Draw "GAME"
                const drawLetter = (letter: number[][], x: number, y: number) => {
                    for (let row = 0; row < 7; row++) {
                        for (let col = 0; col < 5; col++) {
                            if (letter[row][col] === 1) {
                                this.ctx.fillRect(x + col, y + row, 1, 1);
                            }
                        }
                    }
                };

                const startX = (this.displayWidth - 30) / 2;
                const startY = (this.displayHeight - 7) / 2;

                // Draw GAME
                drawLetter(G, startX, startY);
                drawLetter(A, startX + 6, startY);
                drawLetter(M, startX + 12, startY);
                drawLetter(E, startX + 18, startY);

                // Draw OVER
                drawLetter(O, startX, startY + 9);
                drawLetter(V, startX + 6, startY + 9);
                drawLetter(E, startX + 12, startY + 9);
                drawLetter(R, startX + 18, startY + 9);

                // Draw "Press SPACE to restart" message
                const restartMessage = "Press SPACE to restart";
                this.ctx.font = '8px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(restartMessage, this.displayWidth / 2, startY + 20);
            }
            return;
        }

        if (this.gameState.levelTransition) {
            // Draw level transition message
            this.ctx.fillStyle = '#0F0';
            const levelText = `LEVEL ${this.gameState.level}`;
            this.ctx.font = '8px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(levelText, this.displayWidth / 2, this.displayHeight / 2);

            // After 2 seconds, start the next level
            if (Date.now() - this.levelTransitionTime > 2000) {
                this.gameState.levelTransition = false;
                this.initializeAliens();
                // Start heartbeat after level transition ends
                if (!this.gameState.isBossLevel) {
                    this.playHeartbeatSound();
                }
                // Reset spaceship position to center
                this.spaceshipX = 32;
            }
            return;
        }

        // Draw lives indicator
        this.ctx.fillStyle = '#0F0';
        for (let i = 0; i < this.gameState.lives; i++) {
            // Draw a small spaceship for each life
            this.ctx.fillRect(2 + (i * 6), 2, 1, 1);
            this.ctx.fillRect(2 + (i * 6), 3, 3, 1);
            this.ctx.fillRect(2 + (i * 6), 4, 5, 1);
            this.ctx.fillRect(2 + (i * 6), 5, 3, 1);
            this.ctx.fillRect(2 + (i * 6), 6, 1, 1);
        }

        // Draw player bullets
        this.ctx.fillStyle = '#0F0';
        for (const bullet of this.playerBullets) {
            this.ctx.fillRect(bullet.x, bullet.y, 1, 1);
        }

        // Draw alien bullets
        this.ctx.fillStyle = '#0F0';
        for (const bullet of this.alienBullets) {
            this.ctx.fillRect(bullet.x, bullet.y, 1, 1);
        }

        if (this.gameState.isBossLevel) {
            // Draw boss health bar
            this.ctx.fillStyle = '#0F0';
            const healthBarWidth = 30;
            const healthBarHeight = 2;
            const healthBarX = (this.displayWidth - healthBarWidth) / 2;
            const healthBarY = 1;
            
            // Draw background of health bar
            this.ctx.fillStyle = '#030';
            this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            
            // Draw current health
            this.ctx.fillStyle = '#0F0';
            const currentHealthWidth = (this.gameState.bossHealth / 50) * healthBarWidth;
            this.ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);

            // Draw boss crab
            this.ctx.fillStyle = '#0F0';
            for (let y = 0; y < this.bossCrab.length; y++) {
                for (let x = 0; x < this.bossCrab[0].length; x++) {
                    if (this.bossCrab[y][x] === 1) {
                        this.ctx.fillRect(
                            this.bossX + x,
                            this.bossY + y,
                            this.pixelSize,
                            this.pixelSize
                        );
                    }
                }
            }

            // Play crab sound when boss first appears
            if (!this.gameState.levelTransition && this.gameState.bossHealth === 50) {
                this.playCrabSound();
            }
        } else {
            // Draw regular aliens
            this.ctx.fillStyle = '#0F0';
            for (const alien of this.aliens) {
                for (let y = 0; y < this.alien.length; y++) {
                    for (let x = 0; x < this.alien[0].length; x++) {
                        if (this.alien[y][x] === 1) {
                            this.ctx.fillRect(
                                alien.x + x,
                                alien.y + y,
                                this.pixelSize,
                                this.pixelSize
                            );
                        }
                    }
                }
            }
        }

        // Draw the spaceship
        this.ctx.fillStyle = '#0F0';
        for (let y = 0; y < this.spaceship.length; y++) {
            for (let x = 0; x < this.spaceship[0].length; x++) {
                if (this.spaceship[y][x] === 1) {
                    this.ctx.fillRect(
                        this.spaceshipX + x,
                        this.spaceshipY + y,
                        this.pixelSize,
                        this.pixelSize
                    );
                }
            }
        }
    }

    private alienShoot(alien: { x: number, y: number }): void {
        this.alienBullets.push({
            x: alien.x + 2, // Center of the alien
            y: alien.y + 5  // Bottom of the alien
        });
    }

    private restartGame(): void {
        this.gameState.reset();
        this.aliens = [];
        this.playerBullets = [];
        this.alienBullets = [];
        this.initializeAliens();
        this.spaceshipX = 32;
        this.spaceshipY = 27;
        this.bossX = 0;
        this.bossY = 2;
        this.bossDirection = 1;
        this.bossLastShotTime = 0;
    }
}

// Initialize the display when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PixelDisplay();
}); 