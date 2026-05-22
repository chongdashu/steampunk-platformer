import type { CharacterPlaygroundSettings } from './types';

export const CHARACTER_PLAYGROUND_LIMITS = {
  walkSpeed: { min: 40, max: 260, step: 5 },
  runSpeed: { min: 80, max: 420, step: 5 },
  jumpSpeed: { min: 420, max: 980, step: 10 },
  gravity: { min: 800, max: 2600, step: 20 },
  characterScale: { min: 0.5, max: 1.2, step: 0.05 },
  turretHealth: { min: 1, max: 12, step: 1 },
  turretCooldownSeconds: { min: 0.25, max: 4, step: 0.05 },
  turretProjectileSpeed: { min: 80, max: 680, step: 10 },
  turretShootingRange: { min: 120, max: 900, step: 10 },
  turretProjectileDamage: { min: 1, max: 3, step: 1 },
  scavengerHealth: { min: 1, max: 12, step: 1 },
  scavengerPatrolSpeed: { min: 20, max: 220, step: 5 },
  scavengerChaseSpeed: { min: 40, max: 320, step: 5 },
  scavengerSightRange: { min: 80, max: 760, step: 10 },
  scavengerAttackRange: { min: 30, max: 220, step: 5 },
  scavengerAttackCooldownSeconds: { min: 0.25, max: 3, step: 0.05 },
  scavengerKnockback: { min: 80, max: 640, step: 10 }
} as const;

export const CHARACTER_PLAYGROUND_DEFAULT_CONFIG: CharacterPlaygroundSettings = {
  walkSpeed: 125,
  runSpeed: 245,
  jumpSpeed: 720,
  gravity: 1680,
  characterScale: 0.82,
  characterVariant: 'snap',
  useCharacterSprite: true,
  usePlatformSprites: true,
  showHitboxes: true,
  turretActive: true,
  turretHealth: 3,
  turretCooldownSeconds: 1.4,
  turretProjectileSpeed: 315,
  turretShootingRange: 620,
  turretProjectileDamage: 1,
  scavengerActive: true,
  scavengerHealth: 5,
  scavengerPatrolSpeed: 55,
  scavengerChaseSpeed: 115,
  scavengerSightRange: 420,
  scavengerAttackRange: 72,
  scavengerAttackCooldownSeconds: 1.05,
  scavengerKnockback: 480
};

export function normalizeCharacterPlaygroundConfig(
  config: Partial<CharacterPlaygroundSettings> | null | undefined
): CharacterPlaygroundSettings {
  return {
    walkSpeed: clampNumber(
      config?.walkSpeed,
      CHARACTER_PLAYGROUND_LIMITS.walkSpeed.min,
      CHARACTER_PLAYGROUND_LIMITS.walkSpeed.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.walkSpeed
    ),
    runSpeed: clampNumber(
      config?.runSpeed,
      CHARACTER_PLAYGROUND_LIMITS.runSpeed.min,
      CHARACTER_PLAYGROUND_LIMITS.runSpeed.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.runSpeed
    ),
    jumpSpeed: clampNumber(
      config?.jumpSpeed,
      CHARACTER_PLAYGROUND_LIMITS.jumpSpeed.min,
      CHARACTER_PLAYGROUND_LIMITS.jumpSpeed.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.jumpSpeed
    ),
    gravity: clampNumber(
      config?.gravity,
      CHARACTER_PLAYGROUND_LIMITS.gravity.min,
      CHARACTER_PLAYGROUND_LIMITS.gravity.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.gravity
    ),
    characterScale: clampNumber(
      config?.characterScale,
      CHARACTER_PLAYGROUND_LIMITS.characterScale.min,
      CHARACTER_PLAYGROUND_LIMITS.characterScale.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.characterScale
    ),
    characterVariant:
      config?.characterVariant === 'nosnap'
        ? 'nosnap'
        : CHARACTER_PLAYGROUND_DEFAULT_CONFIG.characterVariant,
    useCharacterSprite:
      typeof config?.useCharacterSprite === 'boolean'
        ? config.useCharacterSprite
        : CHARACTER_PLAYGROUND_DEFAULT_CONFIG.useCharacterSprite,
    usePlatformSprites:
      typeof config?.usePlatformSprites === 'boolean'
        ? config.usePlatformSprites
        : CHARACTER_PLAYGROUND_DEFAULT_CONFIG.usePlatformSprites,
    showHitboxes:
      typeof config?.showHitboxes === 'boolean'
        ? config.showHitboxes
        : CHARACTER_PLAYGROUND_DEFAULT_CONFIG.showHitboxes,
    turretActive:
      typeof config?.turretActive === 'boolean'
        ? config.turretActive
        : CHARACTER_PLAYGROUND_DEFAULT_CONFIG.turretActive,
    turretHealth: Math.round(
      clampNumber(
        config?.turretHealth,
        CHARACTER_PLAYGROUND_LIMITS.turretHealth.min,
        CHARACTER_PLAYGROUND_LIMITS.turretHealth.max,
        CHARACTER_PLAYGROUND_DEFAULT_CONFIG.turretHealth
      )
    ),
    turretCooldownSeconds: clampNumber(
      config?.turretCooldownSeconds,
      CHARACTER_PLAYGROUND_LIMITS.turretCooldownSeconds.min,
      CHARACTER_PLAYGROUND_LIMITS.turretCooldownSeconds.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.turretCooldownSeconds
    ),
    turretProjectileSpeed: clampNumber(
      config?.turretProjectileSpeed,
      CHARACTER_PLAYGROUND_LIMITS.turretProjectileSpeed.min,
      CHARACTER_PLAYGROUND_LIMITS.turretProjectileSpeed.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.turretProjectileSpeed
    ),
    turretShootingRange: clampNumber(
      config?.turretShootingRange,
      CHARACTER_PLAYGROUND_LIMITS.turretShootingRange.min,
      CHARACTER_PLAYGROUND_LIMITS.turretShootingRange.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.turretShootingRange
    ),
    turretProjectileDamage: Math.round(
      clampNumber(
        config?.turretProjectileDamage,
        CHARACTER_PLAYGROUND_LIMITS.turretProjectileDamage.min,
        CHARACTER_PLAYGROUND_LIMITS.turretProjectileDamage.max,
        CHARACTER_PLAYGROUND_DEFAULT_CONFIG.turretProjectileDamage
      )
    ),
    scavengerActive:
      typeof config?.scavengerActive === 'boolean'
        ? config.scavengerActive
        : CHARACTER_PLAYGROUND_DEFAULT_CONFIG.scavengerActive,
    scavengerHealth: Math.round(
      clampNumber(
        config?.scavengerHealth,
        CHARACTER_PLAYGROUND_LIMITS.scavengerHealth.min,
        CHARACTER_PLAYGROUND_LIMITS.scavengerHealth.max,
        CHARACTER_PLAYGROUND_DEFAULT_CONFIG.scavengerHealth
      )
    ),
    scavengerPatrolSpeed: clampNumber(
      config?.scavengerPatrolSpeed,
      CHARACTER_PLAYGROUND_LIMITS.scavengerPatrolSpeed.min,
      CHARACTER_PLAYGROUND_LIMITS.scavengerPatrolSpeed.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.scavengerPatrolSpeed
    ),
    scavengerChaseSpeed: clampNumber(
      config?.scavengerChaseSpeed,
      CHARACTER_PLAYGROUND_LIMITS.scavengerChaseSpeed.min,
      CHARACTER_PLAYGROUND_LIMITS.scavengerChaseSpeed.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.scavengerChaseSpeed
    ),
    scavengerSightRange: clampNumber(
      config?.scavengerSightRange,
      CHARACTER_PLAYGROUND_LIMITS.scavengerSightRange.min,
      CHARACTER_PLAYGROUND_LIMITS.scavengerSightRange.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.scavengerSightRange
    ),
    scavengerAttackRange: clampNumber(
      config?.scavengerAttackRange,
      CHARACTER_PLAYGROUND_LIMITS.scavengerAttackRange.min,
      CHARACTER_PLAYGROUND_LIMITS.scavengerAttackRange.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.scavengerAttackRange
    ),
    scavengerAttackCooldownSeconds: clampNumber(
      config?.scavengerAttackCooldownSeconds,
      CHARACTER_PLAYGROUND_LIMITS.scavengerAttackCooldownSeconds.min,
      CHARACTER_PLAYGROUND_LIMITS.scavengerAttackCooldownSeconds.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.scavengerAttackCooldownSeconds
    ),
    scavengerKnockback: clampNumber(
      config?.scavengerKnockback,
      CHARACTER_PLAYGROUND_LIMITS.scavengerKnockback.min,
      CHARACTER_PLAYGROUND_LIMITS.scavengerKnockback.max,
      CHARACTER_PLAYGROUND_DEFAULT_CONFIG.scavengerKnockback
    )
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
