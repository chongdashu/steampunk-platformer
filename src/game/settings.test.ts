import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';

describe('sanitizeSettings', () => {
  it('normalizes valid persisted settings', () => {
    expect(
      sanitizeSettings({
        sfxVolume: 0.4,
        musicVolume: 0.6,
        muted: true
      })
    ).toEqual({
      sfxVolume: 0.4,
      musicVolume: 0.6,
      muted: true
    });
  });

  it('maps legacy volume to both categories', () => {
    expect(
      sanitizeSettings({
        volume: 0.4,
        muted: true
      })
    ).toEqual({
      sfxVolume: 0.4,
      musicVolume: 0.4,
      muted: true
    });
  });

  it('falls back when persisted settings are invalid', () => {
    expect(
      sanitizeSettings({
        sfxVolume: 'loud'
      })
    ).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps out-of-range volumes', () => {
    expect(
      sanitizeSettings({
        sfxVolume: 99,
        musicVolume: -1
      })
    ).toEqual({
      sfxVolume: 1,
      musicVolume: 0,
      muted: false
    });
  });
});
