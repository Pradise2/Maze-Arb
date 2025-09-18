// hooks/useSound.ts - Sound Effects Hook
import { useCallback, useRef } from 'react';

interface SoundHook {
  playSound: (soundType: string, volume?: number) => void;
  stopAllSounds: () => void;
  setMasterVolume: (volume: number) => void;
}

export const useSound = (soundEnabled: boolean = true): SoundHook => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterVolumeRef = useRef(0.5);

  const createAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, volume: number = 0.1) => {
    if (!soundEnabled) return;
    
    const audioContext = createAudioContext();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'square';

    gainNode.gain.value = volume * masterVolumeRef.current;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [soundEnabled, createAudioContext]);

  const playSound = useCallback((soundType: string, volume: number = 0.1) => {
    switch (soundType) {
      case 'move':
        playTone(200, 0.1, volume * 0.3);
        break;
      case 'collect':
        playTone(523, 0.2, volume);
        setTimeout(() => playTone(659, 0.2, volume), 100);
        break;
      case 'win':
        playTone(523, 0.3, volume);
        setTimeout(() => playTone(659, 0.3, volume), 150);
        setTimeout(() => playTone(784, 0.5, volume), 300);
        break;
      case 'lose':
        playTone(196, 0.5, volume);
        setTimeout(() => playTone(147, 0.5, volume), 200);
        break;
      case 'pause':
        playTone(400, 0.2, volume * 0.5);
        break;
      default:
        playTone(440, 0.2, volume);
    }
  }, [playTone]);

  const stopAllSounds = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    masterVolumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  return {
    playSound,
    stopAllSounds,
    setMasterVolume
  };
};
