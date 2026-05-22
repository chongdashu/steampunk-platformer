import * as Phaser from 'phaser';

import type { GameSettings } from './types';

export const AUDIO_KEYS = {
  musicMain: 'music-main-scrapyard-loop',
  musicLevelClear: 'music-level-clear-sting',
  musicGameOver: 'music-game-over-sting',
  uiConfirm: 'sfx-ui-confirm',
  uiDeny: 'sfx-ui-deny',
  playerJump: 'sfx-player-jump',
  playerLand: 'sfx-player-land',
  playerAttack: 'sfx-player-attack',
  playerHurt: 'sfx-player-hurt',
  scrapPickup: 'sfx-scrap-pickup',
  turretFire: 'sfx-turret-fire',
  projectileImpact: 'sfx-projectile-impact',
  enemyHit: 'sfx-enemy-hit',
  scavengerAttack: 'sfx-scavenger-attack',
  scavengerStep: 'sfx-scavenger-step',
  exitChuteEnter: 'sfx-exit-chute-enter',
  healthLow: 'sfx-health-low'
} as const;

export type AudioKey = (typeof AUDIO_KEYS)[keyof typeof AUDIO_KEYS];

export interface GameAudioAsset {
  kind: 'audio';
  key: AudioKey;
  url: string;
  durationSeconds: number;
  volume: number;
  loop: boolean;
}

export const AUDIO_ASSETS = [
  audio(AUDIO_KEYS.musicMain, '/assets/music/main-scrapyard-loop.mp3', 45, 0.46, true),
  audio(AUDIO_KEYS.musicLevelClear, '/assets/music/level-clear-sting.mp3', 8, 0.62, false),
  audio(AUDIO_KEYS.musicGameOver, '/assets/music/game-over-sting.mp3', 6, 0.58, false),
  audio(AUDIO_KEYS.uiConfirm, '/assets/sfx/ui-confirm.mp3', 0.55, 0.5, false),
  audio(AUDIO_KEYS.uiDeny, '/assets/sfx/ui-deny.mp3', 0.5, 0.45, false),
  audio(AUDIO_KEYS.playerJump, '/assets/sfx/player-jump.mp3', 0.5, 0.55, false),
  audio(AUDIO_KEYS.playerLand, '/assets/sfx/player-land.mp3', 0.5, 0.48, false),
  audio(AUDIO_KEYS.playerAttack, '/assets/sfx/player-attack.mp3', 0.5, 0.58, false),
  audio(AUDIO_KEYS.playerHurt, '/assets/sfx/player-hurt.mp3', 0.65, 0.58, false),
  audio(AUDIO_KEYS.scrapPickup, '/assets/sfx/scrap-pickup.mp3', 0.6, 0.56, false),
  audio(AUDIO_KEYS.turretFire, '/assets/sfx/turret-fire.mp3', 0.7, 0.62, false),
  audio(AUDIO_KEYS.projectileImpact, '/assets/sfx/projectile-impact.mp3', 0.55, 0.6, false),
  audio(AUDIO_KEYS.enemyHit, '/assets/sfx/enemy-hit.mp3', 0.55, 0.58, false),
  audio(AUDIO_KEYS.scavengerAttack, '/assets/sfx/scavenger-attack.mp3', 0.65, 0.6, false),
  audio(AUDIO_KEYS.scavengerStep, '/assets/sfx/scavenger-step.mp3', 0.5, 0.34, false),
  audio(AUDIO_KEYS.exitChuteEnter, '/assets/sfx/exit-chute-enter.mp3', 1.6, 0.62, false),
  audio(AUDIO_KEYS.healthLow, '/assets/sfx/health-low.mp3', 0.8, 0.45, false)
] satisfies GameAudioAsset[];

const MUSIC_KEYS = new Set<AudioKey>([
  AUDIO_KEYS.musicMain,
  AUDIO_KEYS.musicLevelClear,
  AUDIO_KEYS.musicGameOver
]);

/**
 * Applies persisted audio settings to the active scene sound manager.
 */
export function applyAudioSettings(scene: Phaser.Scene, settings: GameSettings): void {
  scene.sound.setMute(settings.muted);

  for (const asset of AUDIO_ASSETS) {
    if (!MUSIC_KEYS.has(asset.key)) {
      continue;
    }

    const sound = scene.sound.get(asset.key);
    if (sound && 'volume' in sound) {
      sound.volume = getEffectiveVolume(asset.key, settings);
    }
  }
}

/**
 * Plays a one-shot sound effect using the current SFX volume settings.
 */
export function playSfx(
  scene: Phaser.Scene,
  key: AudioKey,
  config: Phaser.Types.Sound.SoundConfig = {},
  settings: GameSettings
): void {
  if (!scene.cache.audio.exists(key)) {
    return;
  }

  scene.sound.play(key, {
    volume: getEffectiveVolume(key, settings),
    ...config
  });
}

/**
 * Starts the main gameplay music loop using the current music volume settings.
 */
export function startMainMusic(scene: Phaser.Scene, settings: GameSettings): void {
  if (!scene.cache.audio.exists(AUDIO_KEYS.musicMain) || scene.sound.isPlaying(AUDIO_KEYS.musicMain)) {
    return;
  }

  scene.sound.play(AUDIO_KEYS.musicMain, {
    loop: true,
    volume: getEffectiveVolume(AUDIO_KEYS.musicMain, settings)
  });
}

/**
 * Stops the main gameplay music loop if it is playing.
 */
export function stopMainMusic(scene: Phaser.Scene): void {
  scene.sound.stopByKey(AUDIO_KEYS.musicMain);
}

function audio(
  key: AudioKey,
  url: string,
  durationSeconds: number,
  volume: number,
  loop: boolean
): GameAudioAsset {
  return {
    kind: 'audio',
    key,
    url,
    durationSeconds,
    volume,
    loop
  };
}

function getAssetVolume(key: AudioKey): number {
  return AUDIO_ASSETS.find((asset) => asset.key === key)?.volume ?? 1;
}

function getEffectiveVolume(key: AudioKey, settings: GameSettings): number {
  const assetVolume = getAssetVolume(key);
  const categoryVolume = MUSIC_KEYS.has(key) ? settings.musicVolume : settings.sfxVolume;

  return assetVolume * categoryVolume;
}
