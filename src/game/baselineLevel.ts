export interface BaselineLevelConfig {
  gapCount: number;
  gapWidth: number;
  aiEnabled: boolean;
  showHitboxes: boolean;
  useCharacterSprite: boolean;
  characterVariant: string;
}

export const BASELINE_LEVEL_LIMITS = {
  gapCount: { min: 0, max: 8, step: 1 },
  gapWidth: { min: 80, max: 280, step: 10 }
} as const;

export const BASELINE_LEVEL_DEFAULT_CONFIG: BaselineLevelConfig = {
  gapCount: 3,
  gapWidth: 170,
  aiEnabled: true,
  showHitboxes: true,
  useCharacterSprite: true,
  characterVariant: 'snap'
};

export function normalizeBaselineLevelConfig(
  config: Partial<BaselineLevelConfig> | null | undefined
): BaselineLevelConfig {
  return {
    gapCount: clampInteger(
      config?.gapCount,
      BASELINE_LEVEL_LIMITS.gapCount.min,
      BASELINE_LEVEL_LIMITS.gapCount.max,
      BASELINE_LEVEL_DEFAULT_CONFIG.gapCount
    ),
    gapWidth: clampInteger(
      config?.gapWidth,
      BASELINE_LEVEL_LIMITS.gapWidth.min,
      BASELINE_LEVEL_LIMITS.gapWidth.max,
      BASELINE_LEVEL_DEFAULT_CONFIG.gapWidth
    ),
    aiEnabled:
      typeof config?.aiEnabled === 'boolean'
        ? config.aiEnabled
        : BASELINE_LEVEL_DEFAULT_CONFIG.aiEnabled,
    showHitboxes:
      typeof config?.showHitboxes === 'boolean'
        ? config.showHitboxes
        : BASELINE_LEVEL_DEFAULT_CONFIG.showHitboxes,
    useCharacterSprite:
      typeof config?.useCharacterSprite === 'boolean'
        ? config.useCharacterSprite
        : BASELINE_LEVEL_DEFAULT_CONFIG.useCharacterSprite,
    characterVariant:
      config?.characterVariant === 'nosnap'
        ? 'nosnap'
        : BASELINE_LEVEL_DEFAULT_CONFIG.characterVariant
  };
}

function clampInteger(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}
