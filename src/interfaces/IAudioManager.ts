export interface IAudioManager {
  playSound(soundName: string): void;
  stopSound(soundName: string): void;
  setVolume(volume: number): void;
  preloadSounds(soundNames: string[]): Promise<void>;
} 