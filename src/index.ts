class PixelDisplay {
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
    private gameOver: boolean = false;
    private level: number = 1;
    private levelTransition: boolean = false;
    private levelTransitionTime: number = 0;
    private lives: number = 5;
    private bossHealth: number = 50;
    private bossX: number = 0;
    private bossY: number = 2;
    private bossDirection: number = 1;
    private bossSpeed: number = 0.5;
    private bossLastShotTime: number = 0;
    private bossShotCooldown: number = 1000;
    private audioContext: AudioContext;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;

    // Spaceship bitmap (5x5 pixels)
    private spaceship: number[][] = [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0]
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
        
        // Initialize audio context
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        this.initializeAliens();
        this.setupEventListeners();
        this.startAnimation();
    }

    private initializeAliens(): void {
        // Create a grid of 10 aliens (2 rows of 5)
        const rows = 2;
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

    private setupEventListeners(): void {
        window.addEventListener('keydown', (e) => {
            if (this.gameOver && e.key === ' ') {
                this.restartGame();
                return;
            }
            
            // Cheat code to jump to boss battle
            if (e.key.toLowerCase() === 'c') {
                this.level = 4;
                this.levelTransition = true;
                this.levelTransitionTime = Date.now();
                this.aliens = []; // Clear regular aliens
                this.bossHealth = 50; // Reset boss health
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

    private playShootSound(): void {
        // Create oscillator and gain node
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();
        
        // Configure oscillator
        this.oscillator.type = 'square';
        this.oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5 note
        
        // Configure gain
        this.gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        // Connect nodes
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        
        // Play sound
        this.oscillator.start();
        this.oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    private shoot(): void {
        // Create a new bullet at the center of the spaceship
        this.playerBullets.push({
            x: this.spaceshipX + 2, // Center of the spaceship
            y: this.spaceshipY - 1  // Just above the spaceship
        });
        this.lastShotTime = Date.now();
        
        // Play shooting sound
        this.playShootSound();
    }

    private startAnimation(): void {
        const animate = () => {
            if (!this.gameOver) {
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
        if (this.level === 4) {
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
            // Regular alien movement
            if (this.frameCount % this.alienMoveInterval === 0) {
                for (const alien of this.aliens) {
                    alien.x += this.alienSpeed * alien.direction;

                    if (alien.x <= 0 || alien.x >= this.displayWidth - 5) {
                        alien.direction *= -1;
                        alien.y += 1;
                    }

                    if (Math.random() < this.alienShotChance && 
                        Date.now() - alien.lastShotTime > this.alienShotCooldown) {
                        this.alienShoot(alien);
                        alien.lastShotTime = Date.now();
                    }
                }
            }
        }
    }

    private playAlienHitSound(): void {
        // Create oscillator and gain node
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Configure oscillator
        oscillator.type = 'sawtooth'; // Different waveform for a distinct sound
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4 note
        
        // Configure gain with a quick attack and decay
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Play sound
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    private playExplosionSound(): void {
        // Create multiple oscillators for a richer sound
        const oscillators: OscillatorNode[] = [];
        const gainNodes: GainNode[] = [];
        
        // Create three oscillators with different frequencies
        const frequencies = [110, 220, 440]; // A2, A3, A4
        const durations = [0.3, 0.2, 0.1]; // Different durations for each oscillator
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Configure oscillator
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, this.audioContext.currentTime + durations[index]);
            
            // Configure gain with a quick attack and longer decay
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + durations[index]);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Store references
            oscillators.push(oscillator);
            gainNodes.push(gainNode);
            
            // Play sound
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + durations[index]);
        });
    }

    private checkCollisions(): void {
        if (this.level === 4) {
            // Check player bullets hitting boss
            this.playerBullets = this.playerBullets.filter(bullet => {
                if (bullet.x >= this.bossX && bullet.x < this.bossX + 28 && // Adjusted for new size
                    bullet.y >= this.bossY && bullet.y < this.bossY + 20) { // Adjusted for new size
                    this.bossHealth--;
                    this.playAlienHitSound();
                    
                    if (this.bossHealth <= 0) {
                        this.levelTransition = true;
                        this.levelTransitionTime = Date.now();
                        this.level++;
                        this.alienSpeed = 0.25 * (1 + (this.level - 1) * 0.25);
                    }
                    
                    return false;
                }
                return true;
            });

            // Check boss bullets hitting spaceship
            this.alienBullets = this.alienBullets.filter(bullet => {
                if (bullet.x >= this.spaceshipX && bullet.x < this.spaceshipX + 5 &&
                    bullet.y >= this.spaceshipY && bullet.y < this.spaceshipY + 5) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver = true;
                        this.playExplosionSound();
                    }
                    return false;
                }
                return true;
            });
        } else {
            // Check player bullets hitting aliens
            this.playerBullets = this.playerBullets.filter(bullet => {
                for (let i = this.aliens.length - 1; i >= 0; i--) {
                    const alien = this.aliens[i];
                    if (bullet.x >= alien.x && bullet.x < alien.x + 5 &&
                        bullet.y >= alien.y && bullet.y < alien.y + 5) {
                        this.aliens.splice(i, 1);
                        this.playAlienHitSound();
                        
                        // Check if all aliens are destroyed
                        if (this.aliens.length === 0) {
                            this.levelTransition = true;
                            this.levelTransitionTime = Date.now();
                            this.level++;
                            // Increase alien speed by 25% each level
                            this.alienSpeed = 0.25 * (1 + (this.level - 1) * 0.25);
                        }
                        
                        return false;
                    }
                }
                return true;
            });

            // Check alien bullets hitting spaceship
            this.alienBullets = this.alienBullets.filter(bullet => {
                if (bullet.x >= this.spaceshipX && bullet.x < this.spaceshipX + 5 &&
                    bullet.y >= this.spaceshipY && bullet.y < this.spaceshipY + 5) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver = true;
                        this.playExplosionSound();
                    }
                    return false;
                }
                return true;
            });

            // Check if any alien has reached the bottom
            for (const alien of this.aliens) {
                if (alien.y >= this.spaceshipY) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver = true;
                        this.playExplosionSound();
                    }
                    break;
                }
            }
        }
    }

    private drawDisplay(): void {
        // Clear the display
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

        if (this.gameOver) {
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
            
            return;
        }

        if (this.levelTransition) {
            // Draw level transition message
            this.ctx.fillStyle = '#0F0';
            const levelText = `LEVEL ${this.level}`;
            this.ctx.font = '8px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(levelText, this.displayWidth / 2, this.displayHeight / 2);

            // After 2 seconds, start the next level
            if (Date.now() - this.levelTransitionTime > 2000) {
                this.levelTransition = false;
                this.initializeAliens();
            }
            return;
        }

        // Draw lives indicator
        this.ctx.fillStyle = '#0F0';
        for (let i = 0; i < this.lives; i++) {
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

        if (this.level === 4) {
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
            const currentHealthWidth = (this.bossHealth / 50) * healthBarWidth;
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
        // Reset game state
        this.gameOver = false;
        this.level = 1;
        this.levelTransition = false;
        this.lives = 5;
        this.spaceshipX = 32; // Center position
        this.playerBullets = [];
        this.alienBullets = [];
        this.lastShotTime = 0;
        this.alienSpeed = 0.25; // Reset to base speed
        
        // Reinitialize aliens
        this.aliens = [];
        this.initializeAliens();
        this.bossHealth = 50;
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