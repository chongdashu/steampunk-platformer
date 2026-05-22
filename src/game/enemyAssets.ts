import * as Phaser from 'phaser';

import type { Rect } from './types';

export const TURRET_ENEMY_ID = 'pipe-spitting-turret';
export const TURRET_DISPLAY_NAME = 'Pipe Spitting Turret';
export const SCAVENGER_BOT_ENEMY_ID = 'scavenger-bot';
export const SCAVENGER_BOT_DISPLAY_NAME = 'Scavenger Bot';
export const ENEMY_FRAME = { width: 256, height: 256 };
export const ENEMY_CENTER = {
  x: ENEMY_FRAME.width / 2,
  y: ENEMY_FRAME.height / 2
};
export const TURRET_FRAME = ENEMY_FRAME;
export const TURRET_CENTER = ENEMY_CENTER;

export type EnemyId = typeof TURRET_ENEMY_ID | typeof SCAVENGER_BOT_ENEMY_ID;
export type EnemyAnimationId = 'idle' | 'walk' | 'attack' | 'hurt' | 'death';
export type EnemyBoundsKind = 'visual' | 'collision' | 'hurt' | 'attack';

export interface EnemyAnimationAsset {
  id: EnemyAnimationId;
  enemyId: EnemyId;
  enemyLabel: string;
  label: string;
  key: string;
  animationKey: string;
  url: string;
  previewGif: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps: number;
  columns: number;
  rows: number;
  repeat: number;
  source: string;
  pixelSnap: boolean;
}

export interface EnemyDefinition {
  id: EnemyId;
  displayName: string;
  folder: string;
  frame: typeof ENEMY_FRAME;
  animations: EnemyAnimationAsset[];
}

export type EnemyAnimationBounds = Record<EnemyBoundsKind, Rect>;
export type EnemyBoundsMap = Record<EnemyAnimationId, EnemyAnimationBounds>;
export type EnemyBoundsByEnemy = Record<EnemyId, EnemyBoundsMap>;
export type EnemyHitFrameKind = 'hurt' | 'attack';
export type EnemyAnimationHitFrames = Record<EnemyHitFrameKind, boolean[]>;
export type EnemyHitFramesMap = Record<EnemyAnimationId, EnemyAnimationHitFrames>;
export type EnemyHitFramesByEnemy = Record<EnemyId, EnemyHitFramesMap>;

type EnemyAnimationDefinition = Omit<
  EnemyAnimationAsset,
  'enemyId' | 'enemyLabel' | 'key' | 'animationKey' | 'url' | 'previewGif' | 'frameWidth' | 'frameHeight'
>;

const ENEMY_ANIMATION_IDS: EnemyAnimationId[] = ['idle', 'walk', 'attack', 'hurt', 'death'];

const TURRET_ANIMATION_DEFINITIONS: EnemyAnimationDefinition[] = [
  {
    id: 'idle',
    label: 'Idle',
    frames: 10,
    fps: 6,
    columns: 5,
    rows: 2,
    repeat: -1,
    source:
      'runs/20260518-101352-pipe-spitting-turret-idle-grok-i2v-2s/idle-w-locked-base-v2/post-selection/preserve-canvas-no-pixelsnap-green-clean-v3',
    pixelSnap: false
  },
  {
    id: 'attack',
    label: 'Attack',
    frames: 8,
    fps: 10,
    columns: 5,
    rows: 2,
    repeat: 0,
    source:
      'runs/20260518-100432-pipe-spitting-turret-grok-i2v-v4/attack-w/post-selection/preserve-canvas-no-pixelsnap-green-clean-v1',
    pixelSnap: false
  },
  {
    id: 'hurt',
    label: 'Hurt',
    frames: 6,
    fps: 8,
    columns: 5,
    rows: 2,
    repeat: 0,
    source:
      'runs/20260518-100432-pipe-spitting-turret-grok-i2v-v4/hurt-w/post-selection/preserve-canvas-no-pixelsnap-green-clean-v1',
    pixelSnap: false
  },
  {
    id: 'death',
    label: 'Death',
    frames: 10,
    fps: 8,
    columns: 5,
    rows: 2,
    repeat: 0,
    source:
      'runs/20260518-100432-pipe-spitting-turret-grok-i2v-v4/death-w/post-selection/anchor-bottom-194-v1',
    pixelSnap: false
  }
];

const SCAVENGER_ANIMATION_DEFINITIONS: EnemyAnimationDefinition[] = [
  {
    id: 'idle',
    label: 'Idle',
    frames: 10,
    fps: 6,
    columns: 5,
    rows: 2,
    repeat: -1,
    source:
      'runs/20260518-212924-scavenger-bot-w-anchor-v2/actions-v1/idle-w-grok-i2v/post-selection/fixed-canvas-no-pixelsnap-v1/export',
    pixelSnap: false
  },
  {
    id: 'walk',
    label: 'Walk',
    frames: 10,
    fps: 10,
    columns: 5,
    rows: 2,
    repeat: -1,
    source:
      'runs/20260518-212924-scavenger-bot-w-anchor-v2/actions-v6/walk-w-grok-2s-10f/post-selection/fixed-canvas-no-pixelsnap-v1/export',
    pixelSnap: false
  },
  {
    id: 'attack',
    label: 'Attack',
    frames: 8,
    fps: 10,
    columns: 5,
    rows: 2,
    repeat: 0,
    source:
      'runs/20260518-212924-scavenger-bot-w-anchor-v2/actions-v5/attack-w-grok-rerun/post-selection/fixed-canvas-no-pixelsnap-v1/export',
    pixelSnap: false
  },
  {
    id: 'hurt',
    label: 'Hurt',
    frames: 6,
    fps: 8,
    columns: 5,
    rows: 2,
    repeat: 0,
    source:
      'runs/20260518-212924-scavenger-bot-w-anchor-v2/actions-v2/hurt-w-grok-direct/post-selection/fixed-canvas-no-pixelsnap-v1/export',
    pixelSnap: false
  },
  {
    id: 'death',
    label: 'Death',
    frames: 10,
    fps: 8,
    columns: 5,
    rows: 2,
    repeat: 0,
    source:
      'runs/20260518-212924-scavenger-bot-w-anchor-v2/actions-v2/death-w-grok-direct/post-selection/fixed-canvas-no-pixelsnap-v1/export',
    pixelSnap: false
  }
];

const TURRET_DEFAULT_ENEMY_BOUNDS: EnemyBoundsMap = {
  idle: {
    visual: { x: 25, y: 51, width: 217, height: 144 },
    collision: { x: 70, y: 70, width: 115, height: 125 },
    hurt: { x: 70, y: 70, width: 115, height: 125 },
    attack: { x: 12, y: 86, width: 78, height: 54 }
  },
  walk: {
    visual: { x: 25, y: 51, width: 217, height: 144 },
    collision: { x: 70, y: 70, width: 115, height: 125 },
    hurt: { x: 70, y: 70, width: 115, height: 125 },
    attack: { x: 12, y: 86, width: 78, height: 54 }
  },
  attack: {
    visual: { x: 25, y: 51, width: 222, height: 144 },
    collision: { x: 70, y: 70, width: 115, height: 125 },
    hurt: { x: 70, y: 70, width: 115, height: 125 },
    attack: { x: 0, y: 82, width: 104, height: 60 }
  },
  hurt: {
    visual: { x: 16, y: 50, width: 210, height: 145 },
    collision: { x: 70, y: 70, width: 115, height: 125 },
    hurt: { x: 70, y: 70, width: 115, height: 125 },
    attack: { x: 12, y: 86, width: 78, height: 54 }
  },
  death: {
    visual: { x: 19, y: 51, width: 218, height: 144 },
    collision: { x: 66, y: 56, width: 126, height: 138 },
    hurt: { x: 66, y: 56, width: 126, height: 138 },
    attack: { x: 12, y: 62, width: 72, height: 48 }
  }
};

const SCAVENGER_DEFAULT_ENEMY_BOUNDS: EnemyBoundsMap = {
  idle: {
    visual: { x: 47, y: 48, width: 143, height: 160 },
    collision: { x: 76, y: 92, width: 84, height: 116 },
    hurt: { x: 58, y: 64, width: 124, height: 144 },
    attack: { x: 18, y: 132, width: 60, height: 50 }
  },
  walk: {
    visual: { x: 54, y: 50, width: 152, height: 158 },
    collision: { x: 80, y: 94, width: 84, height: 114 },
    hurt: { x: 62, y: 66, width: 132, height: 142 },
    attack: { x: 24, y: 132, width: 60, height: 50 }
  },
  attack: {
    visual: { x: 0, y: 39, width: 215, height: 193 },
    collision: { x: 78, y: 94, width: 88, height: 114 },
    hurt: { x: 54, y: 62, width: 138, height: 146 },
    attack: { x: 0, y: 116, width: 86, height: 70 }
  },
  hurt: {
    visual: { x: 46, y: 63, width: 166, height: 144 },
    collision: { x: 78, y: 96, width: 88, height: 111 },
    hurt: { x: 58, y: 72, width: 138, height: 135 },
    attack: { x: 22, y: 132, width: 60, height: 50 }
  },
  death: {
    visual: { x: 39, y: 37, width: 185, height: 190 },
    collision: { x: 78, y: 116, width: 104, height: 92 },
    hurt: { x: 58, y: 72, width: 144, height: 136 },
    attack: { x: 20, y: 136, width: 62, height: 48 }
  }
};

export const DEFAULT_ENEMY_BOUNDS_BY_ENEMY: EnemyBoundsByEnemy = {
  [TURRET_ENEMY_ID]: TURRET_DEFAULT_ENEMY_BOUNDS,
  [SCAVENGER_BOT_ENEMY_ID]: SCAVENGER_DEFAULT_ENEMY_BOUNDS
};

export const DEFAULT_ENEMY_BOUNDS = DEFAULT_ENEMY_BOUNDS_BY_ENEMY[TURRET_ENEMY_ID];

export const DEFAULT_ENEMY_HIT_FRAMES_BY_ENEMY: EnemyHitFramesByEnemy = {
  [TURRET_ENEMY_ID]: buildDefaultEnemyHitFrames(TURRET_ANIMATION_DEFINITIONS),
  [SCAVENGER_BOT_ENEMY_ID]: buildDefaultEnemyHitFrames(SCAVENGER_ANIMATION_DEFINITIONS)
};

export const ENEMY_DEFINITIONS: EnemyDefinition[] = [
  buildEnemyDefinition(
    TURRET_ENEMY_ID,
    TURRET_DISPLAY_NAME,
    'turret',
    TURRET_ANIMATION_DEFINITIONS
  ),
  buildEnemyDefinition(
    SCAVENGER_BOT_ENEMY_ID,
    SCAVENGER_BOT_DISPLAY_NAME,
    'scavenger-bot/i2v',
    SCAVENGER_ANIMATION_DEFINITIONS
  )
];

export const ENEMY_OPTIONS = ENEMY_DEFINITIONS.map((definition) => ({
  id: definition.id,
  label: definition.displayName
}));

export const ENEMY_ANIMATIONS = ENEMY_DEFINITIONS.flatMap((definition) => definition.animations);

export function registerEnemyAnimations(scene: Phaser.Scene): void {
  ENEMY_ANIMATIONS.forEach((asset) => {
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

export function getEnemyDefinition(enemyId: string | undefined): EnemyDefinition {
  return (
    ENEMY_DEFINITIONS.find((definition) => definition.id === enemyId) ??
    ENEMY_DEFINITIONS[0]
  );
}

export function getEnemyAnimations(enemyId: string | undefined): EnemyAnimationAsset[] {
  return getEnemyDefinition(enemyId).animations;
}

export function getEnemyAnimation(
  animationId: string | undefined,
  enemyId: string | undefined = TURRET_ENEMY_ID
): EnemyAnimationAsset {
  const animations = getEnemyAnimations(enemyId);

  return animations.find((animation) => animation.id === animationId) ?? animations[0];
}

export function normalizeEnemyId(value: string | undefined): EnemyId {
  return getEnemyDefinition(value).id;
}

export function normalizeEnemyAnimationId(
  value: string | undefined,
  enemyId: string | undefined = TURRET_ENEMY_ID
): EnemyAnimationId {
  return getEnemyAnimation(value, enemyId).id;
}

export function normalizeEnemyBoundsKind(value: string | undefined): EnemyBoundsKind {
  return value === 'visual' || value === 'collision' || value === 'hurt' || value === 'attack'
    ? value
    : 'collision';
}

export function normalizeEnemyBoundsMap(
  bounds: Partial<EnemyBoundsMap> | null | undefined,
  enemyId: string | undefined = TURRET_ENEMY_ID
): EnemyBoundsMap {
  const normalizedEnemyId = normalizeEnemyId(enemyId);
  const defaults = cloneEnemyBoundsMap(DEFAULT_ENEMY_BOUNDS_BY_ENEMY[normalizedEnemyId]);

  if (!bounds || typeof bounds !== 'object') {
    return defaults;
  }

  ENEMY_ANIMATION_IDS.forEach((animationId) => {
    defaults[animationId] = {
      visual: normalizeRect(bounds[animationId]?.visual, defaults[animationId].visual),
      collision: normalizeRect(bounds[animationId]?.collision, defaults[animationId].collision),
      hurt: normalizeRect(bounds[animationId]?.hurt, defaults[animationId].hurt),
      attack: normalizeRect(bounds[animationId]?.attack, defaults[animationId].attack)
    };
  });

  return defaults;
}

export function normalizeEnemyBoundsByEnemy(
  config: unknown
): EnemyBoundsByEnemy {
  const defaults = cloneEnemyBoundsByEnemy(DEFAULT_ENEMY_BOUNDS_BY_ENEMY);

  if (!config || typeof config !== 'object') {
    return defaults;
  }

  const candidate = config as {
    enemyId?: string;
    bounds?: Partial<EnemyBoundsMap>;
    enemies?: Partial<Record<EnemyId, { bounds?: Partial<EnemyBoundsMap> } | Partial<EnemyBoundsMap>>>;
    boundsByEnemy?: Partial<
      Record<EnemyId, { bounds?: Partial<EnemyBoundsMap> } | Partial<EnemyBoundsMap>>
    >;
  };
  const enemies = candidate.enemies ?? candidate.boundsByEnemy;

  if (enemies && typeof enemies === 'object') {
    ENEMY_OPTIONS.forEach((enemy) => {
      const enemyEntry = enemies[enemy.id];
      const enemyBounds: Partial<EnemyBoundsMap> | undefined =
        enemyEntry && 'bounds' in enemyEntry
          ? enemyEntry.bounds
          : (enemyEntry as Partial<EnemyBoundsMap> | undefined);

      defaults[enemy.id] = normalizeEnemyBoundsMap(enemyBounds, enemy.id);
    });

    return defaults;
  }

  const enemyId = normalizeEnemyId(candidate.enemyId);
  const bounds = candidate.bounds ?? (config as Partial<EnemyBoundsMap>);
  defaults[enemyId] = normalizeEnemyBoundsMap(bounds, enemyId);

  return defaults;
}

export function cloneEnemyBoundsByEnemy(boundsByEnemy: EnemyBoundsByEnemy): EnemyBoundsByEnemy {
  return {
    [TURRET_ENEMY_ID]: cloneEnemyBoundsMap(boundsByEnemy[TURRET_ENEMY_ID]),
    [SCAVENGER_BOT_ENEMY_ID]: cloneEnemyBoundsMap(boundsByEnemy[SCAVENGER_BOT_ENEMY_ID])
  };
}

export function cloneEnemyBoundsMap(bounds: EnemyBoundsMap): EnemyBoundsMap {
  return Object.fromEntries(
    ENEMY_ANIMATION_IDS.map((animationId) => [
      animationId,
      {
        visual: { ...bounds[animationId].visual },
        collision: { ...bounds[animationId].collision },
        hurt: { ...bounds[animationId].hurt },
        attack: { ...bounds[animationId].attack }
      }
    ])
  ) as EnemyBoundsMap;
}

export function normalizeEnemyHitFramesMap(
  hitFrames: Partial<EnemyHitFramesMap> | null | undefined,
  enemyId: string | undefined = TURRET_ENEMY_ID
): EnemyHitFramesMap {
  const normalizedEnemyId = normalizeEnemyId(enemyId);
  const definitions =
    normalizedEnemyId === SCAVENGER_BOT_ENEMY_ID
      ? SCAVENGER_ANIMATION_DEFINITIONS
      : TURRET_ANIMATION_DEFINITIONS;
  const defaults = cloneEnemyHitFramesMap(DEFAULT_ENEMY_HIT_FRAMES_BY_ENEMY[normalizedEnemyId]);

  if (!hitFrames || typeof hitFrames !== 'object') {
    return defaults;
  }

  definitions.forEach((animation) => {
    defaults[animation.id] = {
      hurt: normalizeFrameFlags(hitFrames[animation.id]?.hurt, animation.frames, defaults[animation.id].hurt),
      attack: normalizeFrameFlags(
        hitFrames[animation.id]?.attack,
        animation.frames,
        defaults[animation.id].attack
      )
    };
  });

  return defaults;
}

export function normalizeEnemyHitFramesByEnemy(config: unknown): EnemyHitFramesByEnemy {
  const defaults = cloneEnemyHitFramesByEnemy(DEFAULT_ENEMY_HIT_FRAMES_BY_ENEMY);

  if (!config || typeof config !== 'object') {
    return defaults;
  }

  const candidate = config as {
    enemyId?: string;
    hitFrames?: Partial<EnemyHitFramesMap>;
    enemies?: Partial<
      Record<EnemyId, { hitFrames?: Partial<EnemyHitFramesMap> } | Partial<EnemyHitFramesMap>>
    >;
    hitFramesByEnemy?: Partial<
      Record<EnemyId, { hitFrames?: Partial<EnemyHitFramesMap> } | Partial<EnemyHitFramesMap>>
    >;
  };
  const enemies = candidate.enemies ?? candidate.hitFramesByEnemy;

  if (enemies && typeof enemies === 'object') {
    ENEMY_OPTIONS.forEach((enemy) => {
      const enemyEntry = enemies[enemy.id];
      const enemyHitFrames: Partial<EnemyHitFramesMap> | undefined =
        enemyEntry && 'hitFrames' in enemyEntry
          ? enemyEntry.hitFrames
          : (enemyEntry as Partial<EnemyHitFramesMap> | undefined);

      defaults[enemy.id] = normalizeEnemyHitFramesMap(enemyHitFrames, enemy.id);
    });

    return defaults;
  }

  const enemyId = normalizeEnemyId(candidate.enemyId);
  defaults[enemyId] = normalizeEnemyHitFramesMap(candidate.hitFrames, enemyId);

  return defaults;
}

export function cloneEnemyHitFramesMap(hitFrames: EnemyHitFramesMap): EnemyHitFramesMap {
  return Object.fromEntries(
    ENEMY_ANIMATION_IDS.map((animationId) => [
      animationId,
      {
        hurt: [...hitFrames[animationId].hurt],
        attack: [...hitFrames[animationId].attack]
      }
    ])
  ) as EnemyHitFramesMap;
}

export function cloneEnemyHitFramesByEnemy(hitFrames: EnemyHitFramesByEnemy): EnemyHitFramesByEnemy {
  return {
    [TURRET_ENEMY_ID]: cloneEnemyHitFramesMap(hitFrames[TURRET_ENEMY_ID]),
    [SCAVENGER_BOT_ENEMY_ID]: cloneEnemyHitFramesMap(hitFrames[SCAVENGER_BOT_ENEMY_ID])
  };
}

function buildEnemyDefinition(
  id: EnemyId,
  displayName: string,
  folder: string,
  animations: EnemyAnimationDefinition[]
): EnemyDefinition {
  return {
    id,
    displayName,
    folder,
    frame: ENEMY_FRAME,
    animations: animations.map((animation) => ({
      ...animation,
      enemyId: id,
      enemyLabel: displayName,
      key: `${id}-${animation.id}`,
      animationKey: `${id}-${animation.id}`,
      url: `/assets/enemies/${folder}/${animation.id}.png`,
      previewGif: `/assets/enemies/${folder}/${animation.id}.gif`,
      frameWidth: ENEMY_FRAME.width,
      frameHeight: ENEMY_FRAME.height
    }))
  };
}

function buildDefaultEnemyHitFrames(
  animations: EnemyAnimationDefinition[]
): EnemyHitFramesMap {
  return Object.fromEntries(
    ENEMY_ANIMATION_IDS.map((animationId) => {
      const animation = animations.find((entry) => entry.id === animationId) ?? animations[0];
      const isAvailable = animation.id === animationId;

      return [
        animationId,
        {
          hurt: Array.from(
            { length: animation.frames },
            () => isAvailable && animation.id !== 'death'
          ),
          attack: Array.from({ length: animation.frames }, (_, frameIndex) =>
            animation.id === 'attack'
              ? frameIndex >= Math.floor(animation.frames * 0.35) &&
                frameIndex <= Math.ceil(animation.frames * 0.65)
              : false
          )
        }
      ];
    })
  ) as EnemyHitFramesMap;
}

function normalizeRect(rect: Rect | undefined, fallback: Rect): Rect {
  const x = clampNumber(rect?.x, 0, ENEMY_FRAME.width - 1, fallback.x);
  const y = clampNumber(rect?.y, 0, ENEMY_FRAME.height - 1, fallback.y);
  const width = clampNumber(rect?.width, 1, ENEMY_FRAME.width - x, fallback.width);
  const height = clampNumber(rect?.height, 1, ENEMY_FRAME.height - y, fallback.height);

  return { x, y, width, height };
}

function normalizeFrameFlags(
  value: boolean[] | undefined,
  frameCount: number,
  fallback: boolean[]
): boolean[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return Array.from({ length: frameCount }, (_, index) => value[index] === true);
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}
