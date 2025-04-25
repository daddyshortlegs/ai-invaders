// Mock HTMLCanvasElement
class MockCanvas {
  width: number = 64;
  height: number = 32;
  getContext(): any {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
    };
  }
}

// Mock AudioContext
class MockAudioContext {
  currentTime: number = 0;
  createOscillator() {
    return {
      type: '',
      frequency: { setValueAtTime: jest.fn() },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    };
  }
}

// Mock window.AudioContext
Object.defineProperty(window, 'AudioContext', {
  value: MockAudioContext,
});

// Mock document.getElementById
document.getElementById = jest.fn(() => new MockCanvas() as any); 