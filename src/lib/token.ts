/**
 * Token storage using Capacitor Preferences (native) with localStorage fallback (web).
 * Capacitor Preferences persists across app restarts and survives returning from UPI apps.
 */
import { Capacitor } from "@capacitor/core";

const TOKEN_KEY = "auth_token";

let useNative = false;
let PreferencesModule: any = null;

// Lazy-load Capacitor Preferences only on native platform
const getPreferences = async () => {
  if (!useNative) return null;
  if (!PreferencesModule) {
    const mod = await import("@capacitor/preferences");
    PreferencesModule = mod.Preferences;
  }
  return PreferencesModule;
};

export const initTokenStorage = async () => {
  useNative = Capacitor.isNativePlatform();
};

export const saveToken = async (token: string): Promise<void> => {
  // Always save to localStorage as fallback
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("token", token); // legacy key

  const Prefs = await getPreferences();
  if (Prefs) {
    await Prefs.set({ key: TOKEN_KEY, value: token });
  }
};

export const getToken = async (): Promise<string | null> => {
  const Prefs = await getPreferences();
  if (Prefs) {
    const { value } = await Prefs.get({ key: TOKEN_KEY });
    if (value) return value;
  }
  // Fallback to localStorage
  return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem("token");
};

export const getTokenSync = (): string | null => {
  // Synchronous fallback for axios interceptor
  return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem("token");
};

export const removeToken = async (): Promise<void> => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("token");
  const Prefs = await getPreferences();
  if (Prefs) {
    await Prefs.remove({ key: TOKEN_KEY });
  }
};
