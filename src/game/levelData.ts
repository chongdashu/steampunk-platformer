import type { BackgroundSetId, LevelEditorSettings } from './types';
import { SCAVENGER_BOT_ENEMY_ID, TURRET_ENEMY_ID, type EnemyId } from './enemyAssets';

export type LevelObjectKind = 'platform' | 'pickup' | 'prop' | 'enemy' | 'exit';

export const LEVEL_PICKUP_FRAMES = ['pickup_gear_small'] as const;

export const LEVEL_PROP_FRAMES = [
  'prop_crate',
  'prop_barrel',
  'prop_coal_crate',
  'prop_scrap_sack',
  'prop_scrap_pile',
  'prop_vent_grate',
  'prop_valve_wheel_stand',
  'prop_pressure_gauge_cluster',
  'prop_mossy_hut_large',
  'prop_scrap_shack',
  'prop_steam_pipe_stack',
  'prop_brass_tank_tall',
  'prop_lantern_post',
  'prop_fence_segment',
  'prop_fern_clump',
  'prop_mushroom_cluster',
  'prop_berry_bush'
] as const;

export const LEVEL_EXIT_FRAMES = ['exit_chute'] as const;

export interface LevelSection {
  id: string;
  label: string;
  start: number;
  end: number;
  intent: string;
}

export interface LevelPlatform {
  id: string;
  frame: string;
  x: number;
  y: number;
}

export interface LevelPickup {
  id: string;
  frame: string;
  x: number;
  y: number;
  value: number;
}

export interface LevelProp {
  id: string;
  frame: string;
  x: number;
  y: number;
  depth: number;
}

export interface LevelEnemy {
  id: string;
  type: EnemyId;
  x: number;
  y: number;
  health: number;
  cooldownSeconds: number;
  projectileSpeed: number;
  shootingRange: number;
  projectileDamage: number;
}

export interface LevelExit {
  id: string;
  frame: string;
  x: number;
  y: number;
}

export interface LevelData {
  version: number;
  id: string;
  title: string;
  width: number;
  height: number;
  backgroundSet: BackgroundSetId;
  surfaceY: number;
  playerStart: { x: number; y: number };
  sections: LevelSection[];
  platforms: LevelPlatform[];
  pickups: LevelPickup[];
  props: LevelProp[];
  enemies: LevelEnemy[];
  exits: LevelExit[];
  finish: { x: number; y: number };
}

export const FIRST_LEVEL_URL = '/assets/levels/first-level.json';
export const PLAYGROUND_LEVEL_URL = '/assets/levels/playground-level.json';
export const LEVELS_INDEX_URL = '/assets/levels/index.json';
export const LEVELS_SAVE_ENDPOINT = '/__debug/levels';

export const PLAYABLE_LEVEL_IDS = [
  'first-level',
  'level-2-turret-run',
  'level-3-scrap-patrol',
  'level-4-pressure-yard',
  'level-5-breaker-gauntlet'
] as const;

export type PlayableLevelId = (typeof PLAYABLE_LEVEL_IDS)[number];

export interface LevelCatalogEntry {
  id: string;
  title: string;
  path: string;
  url: string;
}

export interface LevelCatalog {
  version: number;
  levels: LevelCatalogEntry[];
}

export const DEFAULT_FIRST_LEVEL: LevelData = {
  version: 1,
  id: 'first-level',
  title: 'First Chute Run',
  width: 5600,
  height: 720,
  backgroundSet: 'v2',
  surfaceY: 548,
  playerStart: { x: 180, y: 548 },
  sections: [],
  platforms: [],
  pickups: [],
  props: [],
  enemies: [],
  exits: [
    {
      id: 'exit-1',
      frame: 'exit_chute',
      x: 5400,
      y: 548
    }
  ],
  finish: { x: 5400, y: 548 }
};

export const DEFAULT_PLAYGROUND_LEVEL: LevelData = {
  version: 1,
  id: 'playground-level',
  title: 'Character Playground Loop',
  width: 1280,
  height: 720,
  backgroundSet: 'v2',
  surfaceY: 548,
  playerStart: { x: 180, y: 548 },
  sections: [
    {
      id: 'playground-loop',
      label: 'Playground Loop',
      start: 0,
      end: 1280,
      intent: 'single-screen movement, combat, platform, and exit interaction test'
    }
  ],
  platforms: [
    { id: 'pg-floor-00', frame: 'ground_long_mossy_wall', x: -120, y: 548 },
    { id: 'pg-floor-01', frame: 'ground_medium_mossy', x: 302, y: 548 },
    { id: 'pg-floor-02', frame: 'ground_short_mossy', x: 575, y: 548 },
    { id: 'pg-floor-03', frame: 'ground_long_mossy_wall', x: 759, y: 548 },
    { id: 'pg-floor-04', frame: 'ground_medium_mossy', x: 1181, y: 548 },
    { id: 'pg-platform-00', frame: 'platform_medium_ledge', x: 275, y: 410 },
    { id: 'pg-platform-01', frame: 'platform_long_ledge', x: 585, y: 325 },
    { id: 'pg-platform-02', frame: 'platform_small_ledge', x: 980, y: 430 }
  ],
  pickups: [],
  props: [],
  enemies: [
    {
      id: 'pg-scavenger-01',
      type: SCAVENGER_BOT_ENEMY_ID,
      x: 619,
      y: 325,
      health: 5,
      cooldownSeconds: 1.05,
      projectileSpeed: 315,
      shootingRange: 420,
      projectileDamage: 1
    },
    {
      id: 'pg-turret-01',
      type: TURRET_ENEMY_ID,
      x: 760,
      y: 548,
      health: 3,
      cooldownSeconds: 1.4,
      projectileSpeed: 315,
      shootingRange: 620,
      projectileDamage: 1
    }
  ],
  exits: [
    {
      id: 'pg-exit-01',
      frame: 'exit_chute',
      x: 1150,
      y: 548
    }
  ],
  finish: { x: 1150, y: 548 }
};

export const DEFAULT_LEVEL_CATALOG: LevelCatalog = {
  version: 1,
  levels: [
    ...PLAYABLE_LEVEL_IDS.map((id) => ({
      id,
      title: formatTitleFromId(id),
      path: `levels/${id}.json`,
      url: getLevelUrl(id)
    })),
    {
      id: DEFAULT_PLAYGROUND_LEVEL.id,
      title: DEFAULT_PLAYGROUND_LEVEL.title,
      path: `levels/${DEFAULT_PLAYGROUND_LEVEL.id}.json`,
      url: PLAYGROUND_LEVEL_URL
    }
  ]
};

export const LEVEL_EDITOR_DEFAULT_SETTINGS: LevelEditorSettings = {
  selectedLevelId: DEFAULT_FIRST_LEVEL.id,
  scrollX: 0,
  selectedKind: 'platform',
  selectedPlatformFrame: 'ground_long_mossy_wall',
  selectedPickupFrame: LEVEL_PICKUP_FRAMES[0],
  selectedPropFrame: LEVEL_PROP_FRAMES[0],
  selectedExitFrame: LEVEL_EXIT_FRAMES[0],
  showHitboxes: true,
  selectedObjectId: null,
  command: 'none',
  moveDeltaX: 0,
  moveDeltaY: 0,
  commandSerial: 0
};

export function normalizeLevelEditorSettings(
  settings: Partial<LevelEditorSettings> | null | undefined
): LevelEditorSettings {
  return {
    scrollX: clampNumber(settings?.scrollX, 0, 20000, LEVEL_EDITOR_DEFAULT_SETTINGS.scrollX),
    selectedLevelId: normalizeLevelId(settings?.selectedLevelId),
    selectedKind: normalizeObjectKind(settings?.selectedKind),
    selectedPlatformFrame: normalizeFrame(
      settings?.selectedPlatformFrame,
      LEVEL_EDITOR_DEFAULT_SETTINGS.selectedPlatformFrame
    ),
    selectedPickupFrame: normalizeOption(
      settings?.selectedPickupFrame,
      LEVEL_PICKUP_FRAMES,
      LEVEL_EDITOR_DEFAULT_SETTINGS.selectedPickupFrame
    ),
    selectedPropFrame: normalizeOption(
      settings?.selectedPropFrame,
      LEVEL_PROP_FRAMES,
      LEVEL_EDITOR_DEFAULT_SETTINGS.selectedPropFrame
    ),
    selectedExitFrame: normalizeOption(
      settings?.selectedExitFrame,
      LEVEL_EXIT_FRAMES,
      LEVEL_EDITOR_DEFAULT_SETTINGS.selectedExitFrame
    ),
    showHitboxes:
      typeof settings?.showHitboxes === 'boolean'
        ? settings.showHitboxes
        : LEVEL_EDITOR_DEFAULT_SETTINGS.showHitboxes,
    selectedObjectId:
      typeof settings?.selectedObjectId === 'string' && settings.selectedObjectId.trim()
        ? settings.selectedObjectId
        : null,
    command:
      settings?.command === 'add' || settings?.command === 'delete' || settings?.command === 'move'
        ? settings.command
        : 'none',
    moveDeltaX: clampNumber(settings?.moveDeltaX, -1000, 1000, 0),
    moveDeltaY: clampNumber(settings?.moveDeltaY, -1000, 1000, 0),
    commandSerial: clampNumber(
      settings?.commandSerial,
      0,
      Number.MAX_SAFE_INTEGER,
      LEVEL_EDITOR_DEFAULT_SETTINGS.commandSerial
    )
  };
}

export function normalizeLevelCatalog(value: unknown): LevelCatalog {
  if (!value || typeof value !== 'object' || !Array.isArray((value as LevelCatalog).levels)) {
    return DEFAULT_LEVEL_CATALOG;
  }

  const levels = (value as LevelCatalog).levels
    .map((entry) => normalizeLevelCatalogEntry(entry))
    .filter(Boolean) as LevelCatalogEntry[];

  return {
    version: 1,
    levels: levels.length > 0 ? levels : DEFAULT_LEVEL_CATALOG.levels
  };
}

export function createBlankLevel(id: string, title = formatTitleFromId(id)): LevelData {
  return normalizeLevelData({
    ...DEFAULT_PLAYGROUND_LEVEL,
    id: normalizeLevelId(id),
    title,
    platforms: [],
    pickups: [],
    props: [],
    enemies: [],
    exits: [],
    finish: DEFAULT_PLAYGROUND_LEVEL.finish
  });
}

export function getLevelUrl(levelId: string): string {
  return `/assets/levels/${normalizeLevelId(levelId)}.json`;
}

export function normalizeLevelData(
  value: Partial<LevelData> | { level?: Partial<LevelData> } | null | undefined
): LevelData {
  const level = (
    value && typeof value === 'object' && 'level' in value && value.level
      ? value.level
      : value ?? {}
  ) as Partial<LevelData>;

  const exits = Array.isArray(level.exits)
    ? level.exits.map((exit, index) => normalizeExit(exit, index))
    : level.finish
      ? [
          {
            id: 'exit-1',
            frame: LEVEL_EXIT_FRAMES[0],
            ...normalizePoint(level.finish, DEFAULT_FIRST_LEVEL.finish)
          }
        ]
      : DEFAULT_FIRST_LEVEL.exits;
  const finish = exits[0]
    ? { x: exits[0].x, y: exits[0].y }
    : normalizePoint(level.finish, DEFAULT_FIRST_LEVEL.finish);

  return {
    version: 1,
    id: typeof level.id === 'string' && level.id.trim() ? level.id : DEFAULT_FIRST_LEVEL.id,
    title:
      typeof level.title === 'string' && level.title.trim()
        ? level.title
        : DEFAULT_FIRST_LEVEL.title,
    width: clampNumber(level.width, 1280, 12000, DEFAULT_FIRST_LEVEL.width),
    height: clampNumber(level.height, 720, 2160, DEFAULT_FIRST_LEVEL.height),
    backgroundSet: level.backgroundSet === 'v1' ? 'v1' : 'v2',
    surfaceY: clampNumber(level.surfaceY, 240, 900, DEFAULT_FIRST_LEVEL.surfaceY),
    playerStart: normalizePoint(level.playerStart, DEFAULT_FIRST_LEVEL.playerStart),
    sections: Array.isArray(level.sections)
      ? level.sections.map(normalizeSection).filter(Boolean)
      : DEFAULT_FIRST_LEVEL.sections,
    platforms: Array.isArray(level.platforms)
      ? level.platforms.map((platform, index) => normalizePlatform(platform, index))
      : DEFAULT_FIRST_LEVEL.platforms,
    pickups: Array.isArray(level.pickups)
      ? level.pickups.map((pickup, index) => normalizePickup(pickup, index))
      : DEFAULT_FIRST_LEVEL.pickups,
    props: Array.isArray(level.props)
      ? level.props.map((prop, index) => normalizeProp(prop, index))
      : DEFAULT_FIRST_LEVEL.props,
    enemies: Array.isArray(level.enemies)
      ? level.enemies.map((enemy, index) => normalizeEnemy(enemy, index))
      : DEFAULT_FIRST_LEVEL.enemies,
    exits,
    finish
  };
}

export function buildLevelExport(level: LevelData): LevelData & { savedAt: string } {
  return {
    ...normalizeLevelData(level),
    savedAt: new Date().toISOString()
  };
}

function normalizeSection(section: Partial<LevelSection>): LevelSection {
  return {
    id: normalizeId(section.id, 'section'),
    label: typeof section.label === 'string' ? section.label : 'Section',
    start: clampNumber(section.start, 0, 12000, 0),
    end: clampNumber(section.end, 0, 12000, 0),
    intent: typeof section.intent === 'string' ? section.intent : ''
  };
}

function normalizePlatform(platform: Partial<LevelPlatform>, index: number): LevelPlatform {
  return {
    id: normalizeId(platform.id, `platform-${index + 1}`),
    frame: normalizeFrame(platform.frame, 'ground_long_mossy_wall'),
    x: clampNumber(platform.x, -1000, 20000, 0),
    y: clampNumber(platform.y, 0, 2000, DEFAULT_FIRST_LEVEL.surfaceY)
  };
}

function normalizePickup(pickup: Partial<LevelPickup>, index: number): LevelPickup {
  return {
    id: normalizeId(pickup.id, `pickup-${index + 1}`),
    frame: normalizeFrame(pickup.frame, 'pickup_gear_small'),
    x: clampNumber(pickup.x, -1000, 20000, 0),
    y: clampNumber(pickup.y, 0, 2000, 460),
    value: clampNumber(pickup.value, 1, 99, 1)
  };
}

function normalizeProp(prop: Partial<LevelProp>, index: number): LevelProp {
  return {
    id: normalizeId(prop.id, `prop-${index + 1}`),
    frame: normalizeFrame(prop.frame, 'prop_crate'),
    x: clampNumber(prop.x, -1000, 20000, 0),
    y: clampNumber(prop.y, 0, 2000, DEFAULT_FIRST_LEVEL.surfaceY),
    depth: clampNumber(prop.depth, -10, 80, 20)
  };
}

function normalizeEnemy(enemy: Partial<LevelEnemy>, index: number): LevelEnemy {
  const type = enemy.type === SCAVENGER_BOT_ENEMY_ID ? SCAVENGER_BOT_ENEMY_ID : TURRET_ENEMY_ID;

  return {
    id: normalizeId(enemy.id, `enemy-${index + 1}`),
    type,
    x: clampNumber(enemy.x, -1000, 20000, 0),
    y: clampNumber(enemy.y, 0, 2000, DEFAULT_FIRST_LEVEL.surfaceY),
    health: clampNumber(enemy.health, 1, 20, type === SCAVENGER_BOT_ENEMY_ID ? 5 : 3),
    cooldownSeconds: clampNumber(enemy.cooldownSeconds, 0.25, 8, 1.4),
    projectileSpeed: clampNumber(enemy.projectileSpeed, 80, 900, 315),
    shootingRange: clampNumber(enemy.shootingRange, 120, 1200, 620),
    projectileDamage: clampNumber(enemy.projectileDamage, 1, 5, 1)
  };
}

function normalizeExit(exit: Partial<LevelExit>, index: number): LevelExit {
  return {
    id: normalizeId(exit.id, `exit-${index + 1}`),
    frame: normalizeOption(exit.frame, LEVEL_EXIT_FRAMES, LEVEL_EXIT_FRAMES[0]),
    x: clampNumber(exit.x, -1000, 20000, DEFAULT_FIRST_LEVEL.finish.x),
    y: clampNumber(exit.y, 0, 2000, DEFAULT_FIRST_LEVEL.surfaceY)
  };
}

function normalizePoint(
  point: { x?: number; y?: number } | undefined,
  fallback: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: clampNumber(point?.x, -1000, 20000, fallback.x),
    y: clampNumber(point?.y, 0, 2000, fallback.y)
  };
}

function normalizeId(value: string | undefined, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function normalizeLevelId(value: string | undefined): string {
  const normalized = (value ?? DEFAULT_FIRST_LEVEL.id)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || DEFAULT_FIRST_LEVEL.id;
}

function normalizeLevelCatalogEntry(entry: Partial<LevelCatalogEntry>): LevelCatalogEntry | null {
  const id = normalizeLevelId(entry.id);
  const title = typeof entry.title === 'string' && entry.title.trim()
    ? entry.title.trim()
    : formatTitleFromId(id);

  return {
    id,
    title,
    path: `levels/${id}.json`,
    url: getLevelUrl(id)
  };
}

function formatTitleFromId(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

function normalizeFrame(value: string | undefined, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function normalizeObjectKind(value: string | undefined): LevelObjectKind {
  return value === 'platform' ||
    value === 'pickup' ||
    value === 'prop' ||
    value === 'enemy' ||
    value === 'exit'
    ? value
    : LEVEL_EDITOR_DEFAULT_SETTINGS.selectedKind;
}

function normalizeOption(
  value: string | undefined,
  options: readonly string[],
  fallback: string
): string {
  return options.includes(value ?? '') ? (value as string) : fallback;
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

  return Math.min(max, Math.max(min, Math.round(value)));
}
