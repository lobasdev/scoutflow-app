import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Custom storage adapter for Capacitor
// For web, use synchronous localStorage directly to ensure session persistence
// For native, use async Capacitor Preferences
export const capacitorStorage = Capacitor.isNativePlatform() 
  ? {
      getItem: async (key: string): Promise<string | null> => {
        const { value } = await Preferences.get({ key });
        return value;
      },
      setItem: async (key: string, value: string): Promise<void> => {
        await Preferences.set({ key, value });
      },
      removeItem: async (key: string): Promise<void> => {
        await Preferences.remove({ key });
      },
    }
  : localStorage; // Use native localStorage for web browsers
