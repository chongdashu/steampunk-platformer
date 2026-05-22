import * as Phaser from 'phaser';

import type { Rect } from './types';

export const CHARACTER_ID = 'robinchute-char';
export const CHARACTER_DISPLAY_NAME = 'Robin Chute';
export const CHARACTER_FRAME = { width: 256, height: 256 };
export const CHARACTER_CENTER = {
  x: CHARACTER_FRAME.width / 2,
  y: CHARACTER_FRAME.height / 2
};

export type CharacterVariantId = 'snap' | 'nosnap';

export interface CharacterVariant {
  id: CharacterVariantId;
  label: string;
  characterId: string;
  displayName: string;
  directory: string;
  source: string;
}

export type CharacterAnimationId =
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack'
  | 'attack_v2'
  | 'hurt'
  | 'jump'
  | 'death'
  | 'enter_chute';

/** Default player attack animation (nosnap Grok i2v fist punch). */
export const DEFAULT_PLAYER_ATTACK_ANIMATION_ID: CharacterAnimationId = 'attack_v2';

export interface CharacterAnimationAsset {
  id: CharacterAnimationId;
  variantId: CharacterVariantId;
  label: string;
  key: string;
  animationKey: string;
  url: string;
  previewGif: string;
  frames: number;
  fps: number;
  columns: number;
  rows: number;
  repeat: number;
  direction: 'w' | 'n';
  source: string;
}

export interface CharacterAnimationBounds {
  visual: Rect;
  collision: Rect;
  attack: Rect;
}

export type CharacterBoundsMap = Record<CharacterAnimationId, CharacterAnimationBounds>;
export type CharacterBoundsByVariant = Record<CharacterVariantId, CharacterBoundsMap>;
export type CharacterAnimationFpsMap = Record<CharacterAnimationId, number>;
export type CharacterAnimationFpsByVariant = Record<CharacterVariantId, CharacterAnimationFpsMap>;
export type CharacterHitFrameKind = 'attack';
export type CharacterAnimationHitFrames = Record<CharacterHitFrameKind, boolean[]>;
export type CharacterHitFramesMap = Record<CharacterAnimationId, CharacterAnimationHitFrames>;
export type CharacterHitFramesByVariant = Record<CharacterVariantId, CharacterHitFramesMap>;

interface CharacterAnimationDefinition {
  id: CharacterAnimationId;
  label: string;
  frames: number;
  fps: number;
  columns: number;
  rows: number;
  repeat: number;
  direction?: 'w' | 'n';
  sources: Partial<Record<CharacterVariantId, string>>;
}

export const DEFAULT_CHARACTER_VARIANT_ID: CharacterVariantId = 'snap';

export const CHARACTER_VARIANTS: CharacterVariant[] = [
  {
    id: 'snap',
    label: 'Snapped',
    characterId: CHARACTER_ID,
    displayName: CHARACTER_DISPLAY_NAME,
    directory: 'character',
    source: 'runs/robin-chute-v3-public-final-export-01'
  },
  {
    id: 'nosnap',
    label: 'No snap',
    characterId: `${CHARACTER_ID}-nosnap`,
    displayName: 'Robin Chute No-Snap',
    directory: 'character-nosnap',
    source: 'runs/20260514-080929-robin-chute-v3-nosnap-spritesheets'
  }
];

const CHARACTER_ANIMATION_DEFINITIONS: CharacterAnimationDefinition[] = [
  {
    id: 'idle',
    label: 'Idle',
    frames: 10,
    fps: 6,
    columns: 5,
    rows: 2,
    repeat: -1,
    sources: {
      snap: 'runs/robin-chute-v3-public-final-export-01/idle',
      nosnap: 'runs/20260514-080929-robin-chute-v3-nosnap-spritesheets/animations/idle'
    }
  },
  {
    id: 'walk',
    label: 'Walk',
    frames: 10,
    fps: 10,
    columns: 5,
    rows: 2,
    repeat: -1,
    sources: {
      snap: 'runs/robin-chute-v3-public-final-export-01/walk',
      nosnap: 'runs/20260514-080929-robin-chute-v3-nosnap-spritesheets/animations/walk'
    }
  },
  {
    id: 'run',
    label: 'Run',
    frames: 10,
    fps: 12,
    columns: 5,
    rows: 2,
    repeat: -1,
    sources: {
      snap: 'runs/robin-chute-v3-public-final-export-01/run',
      nosnap: 'runs/20260514-080929-robin-chute-v3-nosnap-spritesheets/animations/run'
    }
  },
  {
    id: 'attack',
    label: 'Attack (legacy)',
    frames: 4,
    fps: 10,
    columns: 4,
    rows: 1,
    repeat: 0,
    sources: {
      snap: 'runs/robin-chute-v3-public-final-export-01/attack',
      nosnap: 'runs/20260514-080929-robin-chute-v3-nosnap-spritesheets/animations/attack'
    }
  },
  {
    id: 'attack_v2',
    label: 'Attack v2',
    frames: 8,
    fps: 10,
    columns: 5,
    rows: 2,
    repeat: 0,
    sources: {
      snap: 'runs/20260520-player-attack-fist-grok-i2v-v9-fit-foreground-pixel-snap-fringe/export',
      nosnap: 'runs/20260520-player-attack-fist-grok-i2v-v6-preserve-canvas/export'
    }
  },
  {
    id: 'hurt',
    label: 'Hurt',
    frames: 6,
    fps: 8,
    columns: 5,
    rows: 2,
    repeat: 0,
    sources: {
      snap: 'runs/robin-chute-v3-stills-from-resnap-02-k16/hurt-w/export',
      nosnap: 'runs/20260514-080929-robin-chute-v3-nosnap-spritesheets/animations/hurt'
    }
  },
  {
    id: 'jump',
    label: 'Jump',
    frames: 6,
    fps: 8,
    columns: 5,
    rows: 2,
    repeat: 0,
    sources: {
      snap: 'runs/robin-chute-v3-stills-from-resnap-02-k16/jump-w/export',
      nosnap: 'runs/20260514-080929-robin-chute-v3-nosnap-spritesheets/animations/jump'
    }
  },
  {
    id: 'death',
    label: 'Death',
    frames: 5,
    fps: 8,
    columns: 5,
    rows: 1,
    repeat: 0,
    sources: {
      snap: 'runs/robin-chute-v3-public-curation-fixes-01/death-curated-frames-02-05-06-07-08/export',
      nosnap: 'runs/20260514-080929-robin-chute-v3-nosnap-spritesheets/animations/death'
    }
  },
  {
    id: 'enter_chute',
    label: 'Enter Chute',
    frames: 6,
    fps: 8,
    columns: 5,
    rows: 2,
    repeat: 0,
    direction: 'n',
    sources: {
      nosnap: 'runs/20260519-robin-enter-chute-grok-i2v-v1/post-cleanup/export'
    }
  }
];

export const CHARACTER_ANIMATION_IDS = CHARACTER_ANIMATION_DEFINITIONS.map(
  (animation) => animation.id
);

export const CHARACTER_ANIMATIONS = characterAnimationsForVariant(
  DEFAULT_CHARACTER_VARIANT_ID
);

export const CHARACTER_ANIMATION_VARIANTS = CHARACTER_VARIANTS.flatMap((variant) =>
  characterAnimationsForVariant(variant.id)
);

export const DEFAULT_CHARACTER_BOUNDS: CharacterBoundsMap = Object.fromEntries(
  CHARACTER_ANIMATION_DEFINITIONS.map((animation) => [
    animation.id,
    {
      visual: { x: 58, y: 34, width: 116, height: 188 },
      collision: { x: 96, y: 82, width: 52, height: 134 },
      attack:
        animation.id === 'attack_v2'
          ? { x: 0, y: 70, width: 150, height: 82 }
          : animation.id === 'attack'
            ? { x: 22, y: 78, width: 98, height: 72 }
            : { x: 70, y: 84, width: 76, height: 62 }
    }
  ])
) as CharacterBoundsMap;

export const DEFAULT_CHARACTER_BOUNDS_BY_VARIANT: CharacterBoundsByVariant =
  Object.fromEntries(
    CHARACTER_VARIANTS.map((variant) => [
      variant.id,
      cloneCharacterBoundsMap(DEFAULT_CHARACTER_BOUNDS)
    ])
  ) as CharacterBoundsByVariant;

export const DEFAULT_CHARACTER_HIT_FRAMES: CharacterHitFramesMap = Object.fromEntries(
  CHARACTER_ANIMATION_DEFINITIONS.map((animation) => [
    animation.id,
    {
      attack: Array.from({ length: animation.frames }, (_, frameIndex) => {
        if (animation.id === 'attack_v2') {
          return frameIndex >= 2 && frameIndex <= 5;
        }

        if (animation.id === 'attack') {
          return frameIndex >= 1 && frameIndex <= 2;
        }

        return false;
      })
    }
  ])
) as CharacterHitFramesMap;

export const DEFAULT_CHARACTER_HIT_FRAMES_BY_VARIANT: CharacterHitFramesByVariant =
  Object.fromEntries(
    CHARACTER_VARIANTS.map((variant) => [
      variant.id,
      cloneCharacterHitFramesMap(DEFAULT_CHARACTER_HIT_FRAMES)
    ])
  ) as CharacterHitFramesByVariant;

export const DEFAULT_CHARACTER_ANIMATION_FPS: CharacterAnimationFpsMap = Object.fromEntries(
  CHARACTER_ANIMATION_DEFINITIONS.map((animation) => [animation.id, animation.fps])
) as CharacterAnimationFpsMap;

export const DEFAULT_CHARACTER_ANIMATION_FPS_BY_VARIANT: CharacterAnimationFpsByVariant =
  Object.fromEntries(
    CHARACTER_VARIANTS.map((variant) => [
      variant.id,
      cloneCharacterAnimationFpsMap(DEFAULT_CHARACTER_ANIMATION_FPS)
    ])
  ) as CharacterAnimationFpsByVariant;

export function registerCharacterAnimations(scene: Phaser.Scene): void {
  CHARACTER_ANIMATION_VARIANTS.forEach((asset) => {
    if (scene.anims.exists(asset.animationKey)) {
      return;
    }

    scene.anims.create({
      key: asset.animationKey,
      frames: scene.anims.generateFrameNumbers(asset.key, {
        start: 0,
        end: asset.frames - 1
      }),
      frameRate: asset.fps,
      repeat: asset.repeat
    });
  });
}

export function getCharacterVariant(value: string | undefined): CharacterVariant {
  return (
    CHARACTER_VARIANTS.find((variant) => variant.id === value) ??
    CHARACTER_VARIANTS[0]
  );
}

export function normalizeCharacterVariantId(
  value: string | undefined
): CharacterVariantId {
  return getCharacterVariant(value).id;
}

export function getCharacterAnimation(
  animationId: CharacterAnimationId,
  variantId: CharacterVariantId = DEFAULT_CHARACTER_VARIANT_ID
): CharacterAnimationAsset {
  const variantAnimations = characterAnimationsForVariant(variantId);

  return (
    variantAnimations.find((animation) => animation.id === animationId) ??
    variantAnimations[0] ??
    CHARACTER_ANIMATIONS[0]
  );
}

/**
 * Resolve the active player attack animation for a variant, falling back to legacy attack on snap.
 */
export function getPlayerAttackAnimation(
  variantId: CharacterVariantId = DEFAULT_CHARACTER_VARIANT_ID
): CharacterAnimationAsset {
  const resolvedVariantId = normalizeCharacterVariantId(variantId);
  const preferred = getCharacterAnimation(DEFAULT_PLAYER_ATTACK_ANIMATION_ID, resolvedVariantId);

  if (preferred.id === DEFAULT_PLAYER_ATTACK_ANIMATION_ID) {
    return preferred;
  }

  return getCharacterAnimation('attack', resolvedVariantId);
}

export function getCharacterAnimationsForVariant(
  variantId: CharacterVariantId
): CharacterAnimationAsset[] {
  return characterAnimationsForVariant(variantId);
}

export function normalizeCharacterBoundsMap(
  bounds: Partial<CharacterBoundsMap> | null | undefined
): CharacterBoundsMap {
  const defaults = cloneCharacterBoundsMap(DEFAULT_CHARACTER_BOUNDS);

  if (!bounds || typeof bounds !== 'object') {
    return defaults;
  }

  CHARACTER_ANIMATION_IDS.forEach((animationId) => {
    defaults[animationId] = {
      visual: normalizeRect(bounds[animationId]?.visual, defaults[animationId].visual),
      collision: normalizeRect(bounds[animationId]?.collision, defaults[animationId].collision),
      attack: normalizeRect(bounds[animationId]?.attack, defaults[animationId].attack)
    };
  });

  return defaults;
}

export function normalizeCharacterBoundsByVariant(
  boundsByVariant: Partial<CharacterBoundsByVariant> | null | undefined,
  legacyBounds?: Partial<CharacterBoundsMap> | null
): CharacterBoundsByVariant {
  const defaults = cloneCharacterBoundsByVariant(DEFAULT_CHARACTER_BOUNDS_BY_VARIANT);
  const snapFallback = normalizeCharacterBoundsMap(legacyBounds);

  CHARACTER_VARIANTS.forEach((variant) => {
    defaults[variant.id] = normalizeCharacterBoundsMap(
      boundsByVariant?.[variant.id] ?? (variant.id === 'snap' ? snapFallback : legacyBounds)
    );
  });

  return defaults;
}

export function cloneCharacterBoundsMap(bounds: CharacterBoundsMap): CharacterBoundsMap {
  return Object.fromEntries(
    CHARACTER_ANIMATION_IDS.map((animationId) => [
      animationId,
      {
        visual: { ...bounds[animationId].visual },
        collision: { ...bounds[animationId].collision },
        attack: { ...bounds[animationId].attack }
      }
    ])
  ) as CharacterBoundsMap;
}

export function cloneCharacterBoundsByVariant(
  bounds: CharacterBoundsByVariant
): CharacterBoundsByVariant {
  return Object.fromEntries(
    CHARACTER_VARIANTS.map((variant) => [
      variant.id,
      cloneCharacterBoundsMap(bounds[variant.id])
    ])
  ) as CharacterBoundsByVariant;
}

export function normalizeCharacterHitFramesMap(
  hitFrames: Partial<CharacterHitFramesMap> | null | undefined
): CharacterHitFramesMap {
  const defaults = cloneCharacterHitFramesMap(DEFAULT_CHARACTER_HIT_FRAMES);

  if (!hitFrames || typeof hitFrames !== 'object') {
    return defaults;
  }

  CHARACTER_ANIMATION_DEFINITIONS.forEach((animation) => {
    defaults[animation.id] = {
      attack: normalizeFrameFlags(hitFrames[animation.id]?.attack, animation.frames)
    };
  });

  return defaults;
}

export function normalizeCharacterHitFramesByVariant(
  hitFramesByVariant: Partial<CharacterHitFramesByVariant> | null | undefined,
  legacyHitFrames?: Partial<CharacterHitFramesMap> | null
): CharacterHitFramesByVariant {
  const defaults = cloneCharacterHitFramesByVariant(DEFAULT_CHARACTER_HIT_FRAMES_BY_VARIANT);
  const snapFallback = normalizeCharacterHitFramesMap(legacyHitFrames);

  CHARACTER_VARIANTS.forEach((variant) => {
    defaults[variant.id] = normalizeCharacterHitFramesMap(
      hitFramesByVariant?.[variant.id] ?? (variant.id === 'snap' ? snapFallback : legacyHitFrames)
    );
  });

  return defaults;
}

export function cloneCharacterHitFramesMap(hitFrames: CharacterHitFramesMap): CharacterHitFramesMap {
  return Object.fromEntries(
    CHARACTER_ANIMATION_IDS.map((animationId) => [
      animationId,
      { attack: [...hitFrames[animationId].attack] }
    ])
  ) as CharacterHitFramesMap;
}

export function cloneCharacterHitFramesByVariant(
  hitFrames: CharacterHitFramesByVariant
): CharacterHitFramesByVariant {
  return Object.fromEntries(
    CHARACTER_VARIANTS.map((variant) => [
      variant.id,
      cloneCharacterHitFramesMap(hitFrames[variant.id])
    ])
  ) as CharacterHitFramesByVariant;
}

export function normalizeCharacterAnimationFpsMap(
  fpsMap: Partial<CharacterAnimationFpsMap> | null | undefined
): CharacterAnimationFpsMap {
  const defaults = cloneCharacterAnimationFpsMap(DEFAULT_CHARACTER_ANIMATION_FPS);

  if (!fpsMap || typeof fpsMap !== 'object') {
    return defaults;
  }

  CHARACTER_ANIMATION_DEFINITIONS.forEach((animation) => {
    defaults[animation.id] = normalizeAnimationFps(fpsMap[animation.id], animation.fps);
  });

  return defaults;
}

export function normalizeCharacterAnimationFpsByVariant(
  fpsByVariant: Partial<CharacterAnimationFpsByVariant> | null | undefined,
  legacyFps?: Partial<CharacterAnimationFpsMap> | null
): CharacterAnimationFpsByVariant {
  const defaults = cloneCharacterAnimationFpsByVariant(
    DEFAULT_CHARACTER_ANIMATION_FPS_BY_VARIANT
  );
  const snapFallback = normalizeCharacterAnimationFpsMap(legacyFps);

  CHARACTER_VARIANTS.forEach((variant) => {
    defaults[variant.id] = normalizeCharacterAnimationFpsMap(
      fpsByVariant?.[variant.id] ?? (variant.id === 'snap' ? snapFallback : legacyFps)
    );
  });

  return defaults;
}

export function cloneCharacterAnimationFpsMap(
  fpsMap: CharacterAnimationFpsMap
): CharacterAnimationFpsMap {
  return Object.fromEntries(
    CHARACTER_ANIMATION_IDS.map((animationId) => [animationId, fpsMap[animationId]])
  ) as CharacterAnimationFpsMap;
}

export function cloneCharacterAnimationFpsByVariant(
  fpsByVariant: CharacterAnimationFpsByVariant
): CharacterAnimationFpsByVariant {
  return Object.fromEntries(
    CHARACTER_VARIANTS.map((variant) => [
      variant.id,
      cloneCharacterAnimationFpsMap(fpsByVariant[variant.id])
    ])
  ) as CharacterAnimationFpsByVariant;
}

function characterAnimationsForVariant(
  variantId: CharacterVariantId
): CharacterAnimationAsset[] {
  const variant = getCharacterVariant(variantId);

  return CHARACTER_ANIMATION_DEFINITIONS.filter(
    (animation) => animation.sources[variantId]
  ).map((animation) => ({
    id: animation.id,
    variantId,
    label: animation.label,
    key: `${variant.characterId}-${animation.id}`,
    animationKey: `${variant.characterId}-${animation.id}`,
    url: `/assets/${variant.directory}/${animation.id}.png`,
    previewGif: `/assets/${variant.directory}/${animation.id}.gif`,
    frames: animation.frames,
    fps: animation.fps,
    columns:
      animation.id === 'attack_v2' ||
      (variantId === 'nosnap' && animation.id === 'attack')
        ? 5
        : animation.columns,
    rows: animation.rows,
    repeat: animation.repeat,
    direction: animation.direction ?? 'w',
    source: animation.sources[variantId] ?? ''
  }));
}

function normalizeRect(rect: Rect | undefined, fallback: Rect): Rect {
  const x = clampNumber(rect?.x, 0, CHARACTER_FRAME.width - 1, fallback.x);
  const y = clampNumber(rect?.y, 0, CHARACTER_FRAME.height - 1, fallback.y);
  const width = clampNumber(rect?.width, 1, CHARACTER_FRAME.width - x, fallback.width);
  const height = clampNumber(rect?.height, 1, CHARACTER_FRAME.height - y, fallback.height);

  return { x, y, width, height };
}

function normalizeFrameFlags(value: boolean[] | undefined, frameCount: number): boolean[] {
  const fallback = Array.from({ length: frameCount }, () => false);

  if (!Array.isArray(value)) {
    return fallback;
  }

  return fallback.map((_, index) => value[index] === true);
}

function normalizeAnimationFps(value: unknown, fallback: number): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(30, Math.max(1, numericValue));
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}
