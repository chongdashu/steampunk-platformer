import { STORAGE_KEY } from './constants';
import { createStore, type Store } from './store';
import type { GameSettings } from './types';

export const DEFAULT_SETTINGS: GameSettings = {
  sfxVolume: 0.8,
  musicVolume: 0.8,
  muted: false
};

/**
 * Normalizes persisted audio settings, including legacy single-volume saves.
 */
export function sanitizeSettings(raw: unknown): GameSettings {
  const candidate = raw as Partial<GameSettings & { volume?: number }> | null;
  const legacyVolume =
    typeof candidate?.volume === 'number' && candidate.volume >= 0 && candidate.volume <= 1
      ? candidate.volume
      : undefined;

  return {
    sfxVolume: clampVolume(candidate?.sfxVolume ?? legacyVolume ?? DEFAULT_SETTINGS.sfxVolume),
    musicVolume: clampVolume(
      candidate?.musicVolume ?? legacyVolume ?? DEFAULT_SETTINGS.musicVolume
    ),
    muted: typeof candidate?.muted === 'boolean' ? candidate.muted : DEFAULT_SETTINGS.muted
  };
}

export function loadSettings(storage: Storage = window.localStorage): GameSettings {
  try {
    const raw = storage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings, storage: Storage = window.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
}

export function createSettingsStore(storage: Storage = window.localStorage): Store<GameSettings> {
  const store = createStore<GameSettings>(loadSettings(storage));

  store.subscribe((settings) => {
    saveSettings(settings, storage);
  });

  return store;
}

function clampVolume(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_SETTINGS.sfxVolume;
  }

  return Math.min(1, Math.max(0, value));
}
