import { CHARACTER_PLAYGROUND_LIMITS, normalizeCharacterPlaygroundConfig } from './characterPlayground';
import { createStore, type Store } from './store';
import type {
  BackgroundLayerOffsets,
  BackgroundLayerVisibility,
  BackgroundSetId,
  CharacterPlaygroundSettings,
  DebugState
} from './types';

export interface GameCommonConfig {
  walkSpeed: number;
  runSpeed: number;
  jumpSpeed: number;
  gravity: number;
  characterScale: number;
  characterVariant: string;
  turretHealth: number;
  turretCooldownSeconds: number;
  turretProjectileSpeed: number;
  turretShootingRange: number;
  turretProjectileDamage: number;
  scavengerHealth: number;
  scavengerPatrolSpeed: number;
  scavengerChaseSpeed: number;
  scavengerSightRange: number;
  scavengerAttackRange: number;
  scavengerAttackCooldownSeconds: number;
  scavengerKnockback: number;
  backgroundSet: BackgroundSetId;
  backgroundLayers: BackgroundLayerVisibility;
  backgroundLayerOffsets: BackgroundLayerOffsets;
}

export const GAME_COMMON_DEFAULT_CONFIG: GameCommonConfig = {
  walkSpeed: 180,
  runSpeed: 300,
  jumpSpeed: 720,
  gravity: 1680,
  characterScale: 0.72,
  characterVariant: 'snap',
  turretHealth: 3,
  turretCooldownSeconds: 1.4,
  turretProjectileSpeed: 315,
  turretShootingRange: 620,
  turretProjectileDamage: 1,
  scavengerHealth: 5,
  scavengerPatrolSpeed: 55,
  scavengerChaseSpeed: 115,
  scavengerSightRange: 420,
  scavengerAttackRange: 72,
  scavengerAttackCooldownSeconds: 1.05,
  scavengerKnockback: 480,
  backgroundSet: 'v2',
  backgroundLayers: {
    sky: true,
    far: true,
    mid: true,
    near: true
  },
  backgroundLayerOffsets: {
    v1: {
      far: 0,
      mid: 0,
      near: 0
    },
    v2: {
      sky: 0,
      far: 0,
      mid: 120
    }
  }
};

/**
 * Creates the persisted gameplay config store used by main play.
 */
export function createGameConfigStore(): Store<GameCommonConfig> {
  return createStore<GameCommonConfig>({ ...GAME_COMMON_DEFAULT_CONFIG });
}

/**
 * Normalizes persisted gameplay config values and clamps numeric fields.
 */
export function normalizeGameCommonConfig(
  config: Partial<GameCommonConfig> | null | undefined
): GameCommonConfig {
  const playground = normalizeCharacterPlaygroundConfig(config ?? undefined);

  return {
    walkSpeed: playground.walkSpeed,
    runSpeed: playground.runSpeed,
    jumpSpeed: playground.jumpSpeed,
    gravity: playground.gravity,
    characterScale: playground.characterScale,
    characterVariant: playground.characterVariant,
    turretHealth: playground.turretHealth,
    turretCooldownSeconds: playground.turretCooldownSeconds,
    turretProjectileSpeed: playground.turretProjectileSpeed,
    turretShootingRange: playground.turretShootingRange,
    turretProjectileDamage: playground.turretProjectileDamage,
    scavengerHealth: playground.scavengerHealth,
    scavengerPatrolSpeed: playground.scavengerPatrolSpeed,
    scavengerChaseSpeed: playground.scavengerChaseSpeed,
    scavengerSightRange: playground.scavengerSightRange,
    scavengerAttackRange: playground.scavengerAttackRange,
    scavengerAttackCooldownSeconds: playground.scavengerAttackCooldownSeconds,
    scavengerKnockback: playground.scavengerKnockback,
    backgroundSet: config?.backgroundSet === 'v1' ? 'v1' : GAME_COMMON_DEFAULT_CONFIG.backgroundSet,
    backgroundLayers: normalizeBackgroundLayers(config?.backgroundLayers),
    backgroundLayerOffsets: normalizeBackgroundLayerOffsets(config?.backgroundLayerOffsets)
  };
}

/**
 * Builds the shared gameplay config from the current debug playground state.
 */
export function extractGameCommonConfig(debugState: DebugState): GameCommonConfig {
  const playground = normalizeCharacterPlaygroundConfig(debugState.characterPlayground);

  return normalizeGameCommonConfig({
    walkSpeed: playground.walkSpeed,
    runSpeed: playground.runSpeed,
    jumpSpeed: playground.jumpSpeed,
    gravity: playground.gravity,
    characterScale: playground.characterScale,
    characterVariant: playground.characterVariant,
    turretHealth: playground.turretHealth,
    turretCooldownSeconds: playground.turretCooldownSeconds,
    turretProjectileSpeed: playground.turretProjectileSpeed,
    turretShootingRange: playground.turretShootingRange,
    turretProjectileDamage: playground.turretProjectileDamage,
    scavengerHealth: playground.scavengerHealth,
    scavengerPatrolSpeed: playground.scavengerPatrolSpeed,
    scavengerChaseSpeed: playground.scavengerChaseSpeed,
    scavengerSightRange: playground.scavengerSightRange,
    scavengerAttackRange: playground.scavengerAttackRange,
    scavengerAttackCooldownSeconds: playground.scavengerAttackCooldownSeconds,
    scavengerKnockback: playground.scavengerKnockback,
    backgroundSet: debugState.backgroundSet,
    backgroundLayers: debugState.backgroundLayers,
    backgroundLayerOffsets: debugState.backgroundLayerOffsets
  });
}

/**
 * Applies shared gameplay config values onto playground debug settings.
 */
export function applyGameCommonConfigToPlayground(
  config: Partial<GameCommonConfig>,
  playground: CharacterPlaygroundSettings
): CharacterPlaygroundSettings {
  const normalized = normalizeGameCommonConfig(config);

  return normalizeCharacterPlaygroundConfig({
    ...playground,
    walkSpeed: normalized.walkSpeed,
    runSpeed: normalized.runSpeed,
    jumpSpeed: normalized.jumpSpeed,
    gravity: normalized.gravity,
    characterScale: normalized.characterScale,
    characterVariant: normalized.characterVariant,
    turretHealth: normalized.turretHealth,
    turretCooldownSeconds: normalized.turretCooldownSeconds,
    turretProjectileSpeed: normalized.turretProjectileSpeed,
    turretShootingRange: normalized.turretShootingRange,
    turretProjectileDamage: normalized.turretProjectileDamage,
    scavengerHealth: normalized.scavengerHealth,
    scavengerPatrolSpeed: normalized.scavengerPatrolSpeed,
    scavengerChaseSpeed: normalized.scavengerChaseSpeed,
    scavengerSightRange: normalized.scavengerSightRange,
    scavengerAttackRange: normalized.scavengerAttackRange,
    scavengerAttackCooldownSeconds: normalized.scavengerAttackCooldownSeconds,
    scavengerKnockback: normalized.scavengerKnockback
  });
}

/**
 * Builds the JSON payload written to public/assets/config/game-config.json.
 */
export function buildGameConfigExport(gameConfig: GameCommonConfig): {
  version: number;
  savedAt: string;
  gameConfig: GameCommonConfig;
} {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    gameConfig: normalizeGameCommonConfig(gameConfig)
  };
}

function normalizeBackgroundLayers(
  layers: Partial<BackgroundLayerVisibility> | null | undefined
): BackgroundLayerVisibility {
  return {
    sky:
      typeof layers?.sky === 'boolean'
        ? layers.sky
        : GAME_COMMON_DEFAULT_CONFIG.backgroundLayers.sky,
    far:
      typeof layers?.far === 'boolean'
        ? layers.far
        : GAME_COMMON_DEFAULT_CONFIG.backgroundLayers.far,
    mid:
      typeof layers?.mid === 'boolean'
        ? layers.mid
        : GAME_COMMON_DEFAULT_CONFIG.backgroundLayers.mid,
    near:
      typeof layers?.near === 'boolean'
        ? layers.near
        : GAME_COMMON_DEFAULT_CONFIG.backgroundLayers.near
  };
}

function normalizeBackgroundLayerOffsets(
  offsets: Partial<BackgroundLayerOffsets> | null | undefined
): BackgroundLayerOffsets {
  const defaults = GAME_COMMON_DEFAULT_CONFIG.backgroundLayerOffsets;

  return {
    v1: {
      far: clampNumber(
        offsets?.v1?.far,
        -400,
        400,
        defaults.v1.far ?? 0
      ),
      mid: clampNumber(
        offsets?.v1?.mid,
        -400,
        400,
        defaults.v1.mid ?? 0
      ),
      near: clampNumber(
        offsets?.v1?.near,
        -400,
        400,
        defaults.v1.near ?? 0
      )
    },
    v2: {
      sky: clampNumber(
        offsets?.v2?.sky,
        -400,
        400,
        defaults.v2.sky ?? 0
      ),
      far: clampNumber(
        offsets?.v2?.far,
        -400,
        400,
        defaults.v2.far ?? 0
      ),
      mid: clampNumber(
        offsets?.v2?.mid,
        -400,
        400,
        defaults.v2.mid ?? 0
      )
    }
  };
}

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export { CHARACTER_PLAYGROUND_LIMITS };
