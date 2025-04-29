import { PixelDisplay } from '../index';
import { AudioManager } from '../AudioManager';
import { GameState } from '../GameState';

jest.mock('../AudioManager');
jest.mock('../GameState');

describe('PixelDisplay', () => {
  let display: PixelDisplay;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;
  let mockAudioManager: jest.Mocked<AudioManager>;
  let mockGameState: jest.Mocked<GameState>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockAudioManager = new AudioManager() as jest.Mocked<AudioManager>;
    mockGameState = new GameState() as jest.Mocked<GameState>;
    
    // Create new instance
    display = new PixelDisplay();
    
    // Get mocked canvas and context
    mockCanvas = document.getElementById('canvas') as HTMLCanvasElement;
    mockCtx = mockCanvas.getContext('2d')!;

    // Set display width
    // @ts-ignore - accessing private property for testing
    display.displayWidth = 64;

    // Mock AudioManager methods
    mockAudioManager.playSound = jest.fn();
    mockAudioManager.stopSound = jest.fn();
    mockAudioManager.preloadSounds = jest.fn().mockResolvedValue(undefined);
    mockAudioManager.setVolume = jest.fn();

    // Mock GameState methods
    mockGameState.reset = jest.fn();
    mockGameState.update = jest.fn();
    mockGameState.incrementLevel = jest.fn();
    mockGameState.decrementLives = jest.fn();
    mockGameState.addScore = jest.fn();

    // @ts-ignore - accessing private property for testing
    display.audioManager = mockAudioManager;
    // @ts-ignore - accessing private property for testing
    display.gameState = mockGameState;
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
      // @ts-ignore - accessing private property for testing
      const spacingX = display.displayWidth / (5 + 1); // displayWidth / (cols + 1)
      expect(aliens[0].x).toBeCloseTo(spacingX, 0); // First alien starts at spacingX
      expect(aliens[0].y).toBe(2); // First row starts at y=2
      
      // Check second row first alien
      expect(aliens[5].x).toBeCloseTo(spacingX, 0); // Second row first alien starts at spacingX
      expect(aliens[5].y).toBe(8); // Second row starts at y=8 (2 + 6)
    });

    it('should preload sounds on initialization', async () => {
      // @ts-ignore - accessing private method for testing
      await display.setupEventListeners();
      
      expect(mockAudioManager.preloadSounds).toHaveBeenCalledWith([
        'shoot',
        'alien_hit',
        'explosion',
        'heartbeat',
        'crab',
        'victory'
      ]);
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
    it('should create a bullet and play sound when space is pressed', () => {
      const now = Date.now();
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockReturnValue(now);

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
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('shoot');
      
      mockNow.mockRestore();
    });

    it.skip('should respect shot cooldown', async () => {
      const now = 1000;
      const mockNow = jest.spyOn(Date, 'now');
      mockNow.mockImplementation(() => now);
      
      // Set up initial state
      // @ts-ignore - accessing private property for testing
      display.keys[' '] = true;
      // @ts-ignore - accessing private property for testing
      display.lastShotTime = now;
      // @ts-ignore - accessing private property for testing
      display.shotCooldown = 200;
      // @ts-ignore - accessing private property for testing
      display.playerBullets = [];
      // @ts-ignore - accessing private property for testing
      display.spaceshipX = 32;
      // @ts-ignore - accessing private property for testing
      display.spaceshipY = 27;
      // @ts-ignore - accessing private property for testing
      display.gameState = {
        level: 1,
        lives: 5,
        score: 0,
        gameOver: false,
        levelTransition: false,
        isBossLevel: false,
        bossHealth: 0,
        reset: jest.fn(),
        update: jest.fn(),
        incrementLevel: jest.fn(),
        decrementLives: jest.fn(),
        addScore: jest.fn()
      };
      // @ts-ignore - accessing private property for testing
      display.gameOver = false;
      // @ts-ignore - accessing private property for testing
      display.levelTransition = false;
      // @ts-ignore - accessing private property for testing
      display.gameWon = false;
      // @ts-ignore - accessing private property for testing
      display.audioManager = mockAudioManager;
      // @ts-ignore - accessing private property for testing
      display.aliens = [];
      // @ts-ignore - accessing private property for testing
      display.bossHealth = 0;
      // @ts-ignore - accessing private property for testing
      display.isBossLevel = false;
      // @ts-ignore - accessing private property for testing
      display.lastHeartbeatTime = now;
      // @ts-ignore - accessing private property for testing
      display.heartbeatCooldown = 1000000; // Set a very high cooldown to prevent heartbeat
      // @ts-ignore - accessing private property for testing
      display.levelTransitionTime = now - 3000; // Set to a time in the past to prevent level transition
      // @ts-ignore - accessing private property for testing
      display.gameState.levelTransition = false; // Ensure level transition is false
      
      // Set up event listeners
      // @ts-ignore - accessing private method for testing
      await display.setupEventListeners();
      
      // Try to shoot during cooldown
      // @ts-ignore - accessing private method for testing
      display.shoot();
      
      // @ts-ignore - accessing private property for testing
      expect(display.playerBullets.length).toBe(0);
      expect(mockAudioManager.playSound).not.toHaveBeenCalled();
      
      // Advance time beyond cooldown
      mockNow.mockImplementation(() => now + 201);
      // @ts-ignore - accessing private method for testing
      display.shoot();
      
      // @ts-ignore - accessing private property for testing
      expect(display.playerBullets.length).toBe(1);
      // @ts-ignore - accessing private property for testing
      expect(display.playerBullets[0].x).toBe(34); // spaceshipX + 2
      // @ts-ignore - accessing private property for testing
      expect(display.playerBullets[0].y).toBe(26); // spaceshipY - 1
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('shoot');
      
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

  describe('Sound Effects', () => {
    it('should play alien hit sound', () => {
      // @ts-ignore - accessing private method for testing
      display.playAlienHitSound();
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('alien_hit');
    });

    it('should play explosion sound', () => {
      // @ts-ignore - accessing private method for testing
      display.playExplosionSound();
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('explosion');
    });

    it('should play and stop heartbeat sound', () => {
      // @ts-ignore - accessing private method for testing
      display.playHeartbeatSound();
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('heartbeat');

      // @ts-ignore - accessing private method for testing
      display.stopHeartbeatSound();
      expect(mockAudioManager.stopSound).toHaveBeenCalledWith('heartbeat');
    });

    it('should play and stop crab sound', () => {
      // @ts-ignore - accessing private method for testing
      display.playCrabSound();
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('crab');

      // @ts-ignore - accessing private method for testing
      display.stopCrabSound();
      expect(mockAudioManager.stopSound).toHaveBeenCalledWith('crab');
    });

    it('should play and stop victory sound', () => {
      // @ts-ignore - accessing private method for testing
      display.playVictorySound();
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('victory');

      // @ts-ignore - accessing private method for testing
      display.stopVictorySound();
      expect(mockAudioManager.stopSound).toHaveBeenCalledWith('victory');
    });
  });

  describe('Game State', () => {
    it('should reset game state when restarting', () => {
      // @ts-ignore - accessing private method for testing
      display.restartGame();
      expect(mockGameState.reset).toHaveBeenCalled();
    });
  });
}); 