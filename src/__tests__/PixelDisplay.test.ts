import { PixelDisplay } from '../index';

describe('PixelDisplay', () => {
  let display: PixelDisplay;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create new instance
    display = new PixelDisplay();
    
    // Get mocked canvas and context
    mockCanvas = document.getElementById('canvas') as HTMLCanvasElement;
    mockCtx = mockCanvas.getContext('2d')!;
  });

  describe('Initialization', () => {
    it('should initialize with correct dimensions', () => {
      expect(mockCanvas.width).toBe(64);
      expect(mockCanvas.height).toBe(32);
    });

    it('should initialize aliens in correct positions', () => {
      // @ts-ignore - accessing private property for testing
      const aliens = display.aliens;
      expect(aliens.length).toBe(10); // 2 rows of 5 aliens
      
      // Check first alien position
      expect(aliens[0].x).toBeGreaterThan(0);
      expect(aliens[0].y).toBe(2);
    });
  });

  describe('Spaceship Movement', () => {
    it('should move left when left arrow key is pressed', () => {
      // @ts-ignore - accessing private property for testing
      display.keys['ArrowLeft'] = true;
      // @ts-ignore - accessing private method for testing
      display.updateSpaceshipPosition();
      
      // @ts-ignore - accessing private property for testing
      expect(display.spaceshipX).toBe(31); // Started at 32, moved left by 1
    });

    it('should move right when right arrow key is pressed', () => {
      // @ts-ignore - accessing private property for testing
      display.keys['ArrowRight'] = true;
      // @ts-ignore - accessing private method for testing
      display.updateSpaceshipPosition();
      
      // @ts-ignore - accessing private property for testing
      expect(display.spaceshipX).toBe(33); // Started at 32, moved right by 1
    });

    it('should not move beyond screen boundaries', () => {
      // @ts-ignore - accessing private property for testing
      display.spaceshipX = 0;
      // @ts-ignore - accessing private property for testing
      display.keys['ArrowLeft'] = true;
      // @ts-ignore - accessing private method for testing
      display.updateSpaceshipPosition();
      
      // @ts-ignore - accessing private property for testing
      expect(display.spaceshipX).toBe(0);

      // @ts-ignore - accessing private property for testing
      display.spaceshipX = 59; // displayWidth - 5
      // @ts-ignore - accessing private property for testing
      display.keys['ArrowRight'] = true;
      // @ts-ignore - accessing private method for testing
      display.updateSpaceshipPosition();
      
      // @ts-ignore - accessing private property for testing
      expect(display.spaceshipX).toBe(59);
    });
  });

  describe('Shooting', () => {
    it('should create a bullet when space is pressed', () => {
      // @ts-ignore - accessing private property for testing
      display.keys[' '] = true;
      // @ts-ignore - accessing private method for testing
      display.shoot();
      
      // @ts-ignore - accessing private property for testing
      expect(display.playerBullets.length).toBe(1);
      // @ts-ignore - accessing private property for testing
      expect(display.playerBullets[0].x).toBe(34); // spaceshipX + 2
      // @ts-ignore - accessing private property for testing
      expect(display.playerBullets[0].y).toBe(26); // spaceshipY - 1
    });

    it('should respect shot cooldown', () => {
      const now = Date.now();
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(now);
      
      // Mock playShootSound
      // @ts-ignore - accessing private method for testing
      display.playShootSound = jest.fn();
      
      // @ts-ignore - accessing private property for testing
      display.lastShotTime = now;
      // @ts-ignore - accessing private property for testing
      display.shotCooldown = 200;
      
      // Try to shoot during cooldown
      // @ts-ignore - accessing private method for testing
      display.shoot();
      
      // @ts-ignore - accessing private property for testing
      expect(display.playerBullets.length).toBe(0);
      
      // Advance time beyond cooldown
      mockNow.mockReturnValue(now + 201);
      // @ts-ignore - accessing private method for testing
      display.shoot();
      
      // @ts-ignore - accessing private property for testing
      expect(display.playerBullets.length).toBe(1);
      
      mockNow.mockRestore();
    });
  });

  describe('Alien Movement', () => {
    it('should move aliens in the correct direction', () => {
      // @ts-ignore - accessing private property for testing
      const initialX = display.aliens[0].x;
      // @ts-ignore - accessing private property for testing
      display.frameCount = 4; // Make sure we're at a frame where aliens move
      // @ts-ignore - accessing private method for testing
      display.updateAliens();
      
      // @ts-ignore - accessing private property for testing
      expect(display.aliens[0].x).toBe(initialX + display.alienSpeed);
    });

    it('should change direction when hitting screen edge', () => {
      // @ts-ignore - accessing private property for testing
      display.aliens = [{
        x: 0,
        y: 4,
        direction: 1,
        lastShotTime: 0
      }];
      
      // @ts-ignore - accessing private property for testing
      display.frameCount = 4;
      // @ts-ignore - accessing private property for testing
      display.alienSpeed = 0.25;
      // @ts-ignore - accessing private property for testing
      display.alienMoveInterval = 4;
      
      // Mock Math.random to prevent random shooting
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0);
      
      // First update - should detect edge and change direction
      // @ts-ignore - accessing private method for testing
      display.updateAliens();
      
      // @ts-ignore - accessing private property for testing
      expect(display.aliens[0].direction).toBe(1); // Should move right when hitting left edge
      // @ts-ignore - accessing private property for testing
      expect(display.aliens[0].y).toBe(5); // Should move down when changing direction
      // @ts-ignore - accessing private property for testing
      expect(display.aliens[0].x).toBe(0.25); // Should move by alienSpeed in new direction
      
      mockRandom.mockRestore();
    });
  });

  describe('Collision Detection', () => {
    it('should detect collision between bullet and alien', () => {
      // Mock audio context methods
      const mockGainNode = {
        gain: {
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn()
        },
        connect: jest.fn()
      };
      
      // @ts-ignore - accessing private property for testing
      display.audioContext.createGain = jest.fn(() => mockGainNode);
      
      // @ts-ignore - accessing private property for testing
      display.playerBullets = [{ x: 10, y: 5 }];
      // @ts-ignore - accessing private property for testing
      display.aliens = [{ x: 8, y: 4, direction: 1, lastShotTime: 0 }];
      // @ts-ignore - accessing private method for testing
      display.checkCollisions();
      
      // @ts-ignore - accessing private property for testing
      expect(display.aliens.length).toBe(0);
      // @ts-ignore - accessing private property for testing
      expect(display.playerBullets.length).toBe(0);
    });

    it('should detect collision between alien bullet and spaceship', () => {
      // @ts-ignore - accessing private property for testing
      display.alienBullets = [{ x: 32, y: 27 }];
      // @ts-ignore - accessing private method for testing
      display.checkCollisions();
      
      // @ts-ignore - accessing private property for testing
      expect(display.lives).toBe(4); // Started with 5 lives
    });
  });

  describe('Game State', () => {
    it('should transition to boss level when cheat code is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'c' });
      window.dispatchEvent(event);
      
      // @ts-ignore - accessing private property for testing
      expect(display.level).toBe(4);
      // @ts-ignore - accessing private property for testing
      expect(display.aliens.length).toBe(0);
    });

    it('should restart game when space is pressed after game over', () => {
      // @ts-ignore - accessing private property for testing
      display.gameOver = true;
      const event = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(event);
      
      // @ts-ignore - accessing private property for testing
      expect(display.gameOver).toBe(false);
      // @ts-ignore - accessing private property for testing
      expect(display.lives).toBe(5);
    });
  });
}); 