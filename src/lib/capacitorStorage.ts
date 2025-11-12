import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Custom storage adapter for Capacitor
export const capacitorStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!Capacitor.isNativePlatform()) {
      return localStorage.getItem(key);
    }
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      localStorage.setItem(key, value);
      return;
    }
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      localStorage.removeItem(key);
      return;
    }
    await Preferences.remove({ key });
  },
};
