import { IAudioManager } from './interfaces/IAudioManager';

export class AudioManager implements IAudioManager {
  private sounds: Map<string, HTMLAudioElement>;
  private fallbackSounds: Map<string, () => void>;
  private volume: number;
  private audioContext: AudioContext | null;

  constructor() {
    this.sounds = new Map();
    this.fallbackSounds = new Map();
    this.volume = 1.0;
    this.audioContext = null;
  }

  private createFallbackSound(soundName: string): () => void {
    return () => {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Different sounds for different effects
      switch (soundName) {
        case 'shoot':
          oscillator.type = 'sawtooth';
          // Start with a high frequency and quickly drop to a low frequency
          const startTime = this.audioContext.currentTime;
          oscillator.frequency.setValueAtTime(880, startTime);
          oscillator.frequency.exponentialRampToValueAtTime(110, startTime + 0.2);
          // Start loud and quickly fade out
          gainNode.gain.setValueAtTime(0.3, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
          break;
        case 'alien_hit':
          oscillator.type = 'sawtooth';
          // Start with a low frequency and sweep even lower
          const hitTime = this.audioContext.currentTime;
          oscillator.frequency.setValueAtTime(220, hitTime);
          oscillator.frequency.exponentialRampToValueAtTime(55, hitTime + 0.2);
          // Start loud and have a more dramatic fade out
          gainNode.gain.setValueAtTime(0.3, hitTime);
          gainNode.gain.linearRampToValueAtTime(0.2, hitTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.2);
          break;
        case 'explosion':
          oscillator.type = 'sawtooth';
          // Start with a low frequency and sweep even lower for a crash effect
          const crashTime = this.audioContext.currentTime;
          oscillator.frequency.setValueAtTime(110, crashTime);
          oscillator.frequency.exponentialRampToValueAtTime(20, crashTime + 0.2);
          // Start loud and quickly fade out
          gainNode.gain.setValueAtTime(0.3, crashTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, crashTime + 0.2);
          break;
        case 'heartbeat':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(110, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
          // Create a more complex heartbeat sound with two beats
          const now = this.audioContext.currentTime;
          // First beat
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
          // Second beat (slightly quieter)
          gainNode.gain.setValueAtTime(0, now + 0.15);
          gainNode.gain.linearRampToValueAtTime(0.15, now + 0.2);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
          break;
        case 'crab':
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(55, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
          break;
        case 'victory':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
          break;
        default:
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      }
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);
    };
  }

  public async preloadSounds(soundNames: string[]): Promise<void> {
    // Always create fallback sounds for all sound names
    soundNames.forEach(soundName => {
      this.fallbackSounds.set(soundName, this.createFallbackSound(soundName));
    });

    const promises = soundNames.map(async (soundName) => {
      const audio = new Audio();
      try {
        audio.src = `assets/sounds/${soundName}.mp3`;
        audio.volume = this.volume;
        this.sounds.set(soundName, audio);
        return new Promise<void>((resolve) => {
          audio.addEventListener('canplaythrough', () => resolve());
          audio.addEventListener('error', () => {
            console.warn(`Could not load sound ${soundName}, using fallback`);
            this.sounds.delete(soundName); // Remove the failed audio element
            resolve();
          });
        });
      } catch (error) {
        console.warn(`Error loading sound ${soundName}:`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  public playSound(soundName: string): void {
    // Always try to use the fallback sound first
    const fallback = this.fallbackSounds.get(soundName);
    if (fallback) {
      fallback();
      return;
    }

    // If no fallback exists, try to use the audio element
    const audio = this.sounds.get(soundName);
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.error(`Error playing sound ${soundName}:`, error);
        });
      } catch (error) {
        console.error(`Error playing sound ${soundName}:`, error);
      }
    }
  }

  public stopSound(soundName: string): void {
    const audio = this.sounds.get(soundName);
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {
        console.error(`Error stopping sound ${soundName}:`, error);
      }
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(audio => {
      audio.volume = this.volume;
    });
  }
} 