import * as Phaser from 'phaser';

import type { Rect } from './types';

export type PlatformingElementCategory =
  | 'ground'
  | 'platform'
  | 'bridge'
  | 'chute'
  | 'exit'
  | 'block'
  | 'prop'
  | 'hazard'
  | 'support';

export type PlatformingElementKindFilter = 'all' | PlatformingElementCategory;

export interface PlatformingElementDefinition {
  id: string;
  label: string;
  category: PlatformingElementCategory;
  width: number;
  height: number;
  defaultIncluded: boolean;
  defaultCollision: Rect;
  textureKey: string;
  textureFrame?: string;
}

export interface PlatformingElementMetadata {
  id: string;
  includedInGeneration: boolean;
  collision: Rect;
}

export type PlatformingElementMetadataMap = Record<string, PlatformingElementMetadata>;

export const PLATFORMING_EDITOR_STORAGE_KEY = 'robin-chute.platforming-elements.v1';
export const PLATFORMING_METADATA_ASSET_KEY = 'platforming-elements-config';
export const PLATFORMING_METADATA_FILE = '/assets/config/platforming-elements.json';
export const PLATFORMING_ATLAS_KEY = 'gameplay-platforming-v1';
export const EXIT_CHUTE_TEXTURE_KEY = 'exit-chute';

export const PLATFORMING_ELEMENT_CATEGORIES: PlatformingElementCategory[] = [
  'ground',
  'platform',
  'bridge',
  'chute',
  'exit',
  'block',
  'prop',
  'hazard',
  'support'
];

export const PLATFORMING_ELEMENT_DEFINITIONS: PlatformingElementDefinition[] = [
  frame('ground_long_mossy_wall', 'Ground long mossy wall', 'ground', 452, 132, true, 8, 48),
  frame('ground_medium_mossy', 'Ground medium mossy', 'ground', 303, 98, true, 8, 42),
  frame('ground_short_mossy', 'Ground short mossy', 'ground', 214, 87, true, 8, 38),
  frame('ground_left_end_cap', 'Ground left end cap', 'ground', 135, 110, true, 8, 42),
  frame('ground_right_end_cap', 'Ground right end cap', 'ground', 129, 110, true, 8, 42),
  frame('ground_broken_stack', 'Ground broken stack', 'ground', 221, 100, true, 10, 40),
  frame('platform_small_ledge', 'Platform small ledge', 'platform', 177, 89, true, 8, 34),
  frame('platform_medium_ledge', 'Platform medium ledge', 'platform', 310, 95, true, 8, 36),
  frame('platform_long_ledge', 'Platform long ledge', 'platform', 568, 91, true, 8, 36),
  frame('platform_hanging_rope', 'Platform hanging rope', 'platform', 259, 166, true, 8, 34),
  frame('platform_braced_under', 'Platform braced under', 'platform', 273, 122, true, 10, 38),
  frame('bridge_rope_planks', 'Bridge rope planks', 'bridge', 336, 142, true, 12, 34),
  frame('bridge_truss', 'Bridge truss', 'bridge', 312, 108, true, 10, 34),
  frame('chute_slide_straight', 'Chute slide straight', 'chute', 470, 125, false, 18, 34),
  frame('chute_slide_curved', 'Chute slide curved', 'chute', 325, 150, false, 20, 34),
  frame('chute_mouth_connector', 'Chute mouth connector', 'chute', 314, 142, false, 18, 38),
  frame(
    'exit_chute',
    'Exit chute',
    'exit',
    228,
    420,
    false,
    74,
    270,
    39,
    150,
    EXIT_CHUTE_TEXTURE_KEY,
    undefined
  ),
  frame('ramp_mossy_up', 'Ramp mossy up', 'platform', 254, 147, false, 18, 38),
  frame('ramp_mossy_down', 'Ramp mossy down', 'platform', 248, 143, false, 18, 38),
  frame('wall_block_large', 'Wall block large', 'block', 289, 187, false, 8, 58),
  frame('wall_block_medium', 'Wall block medium', 'block', 249, 156, false, 8, 52),
  frame('scrap_wall_block', 'Scrap wall block', 'block', 243, 148, false, 10, 48),
  frame('step_block', 'Step block', 'block', 179, 152, true, 8, 46),
  frame('pipe_column_tall', 'Pipe column tall', 'prop', 108, 274, false, 12, 44),
  frame('pipe_column_short', 'Pipe column short', 'prop', 109, 178, false, 12, 42),
  frame('pipe_elbow_floor', 'Pipe elbow floor', 'prop', 158, 133, false, 16, 38),
  frame('pipe_elbow_wall', 'Pipe elbow wall', 'prop', 141, 156, false, 16, 38),
  frame('support_arch_left', 'Support arch left', 'support', 183, 196, false, 10, 40),
  frame('support_arch_right', 'Support arch right', 'support', 181, 195, false, 10, 40),
  frame('broken_scrap_hazard', 'Broken scrap hazard', 'hazard', 280, 139, false, 24, 32)
];

export function createDefaultPlatformingMetadata(): PlatformingElementMetadataMap {
  return Object.fromEntries(
    PLATFORMING_ELEMENT_DEFINITIONS.map((definition) => [
      definition.id,
      {
        id: definition.id,
        includedInGeneration: definition.defaultIncluded,
        collision: { ...definition.defaultCollision }
      }
    ])
  );
}

export function getPlatformingElementDefinition(id: string): PlatformingElementDefinition {
  return (
    PLATFORMING_ELEMENT_DEFINITIONS.find((definition) => definition.id === id) ??
    PLATFORMING_ELEMENT_DEFINITIONS[0]
  );
}

export function getPlatformingElementDefinitionsByKind(
  kind: PlatformingElementKindFilter
): PlatformingElementDefinition[] {
  if (kind === 'all') {
    return PLATFORMING_ELEMENT_DEFINITIONS;
  }

  return PLATFORMING_ELEMENT_DEFINITIONS.filter((definition) => definition.category === kind);
}

export function normalizePlatformingElementKind(
  kind: string | undefined
): PlatformingElementKindFilter {
  return kind === 'all' || PLATFORMING_ELEMENT_CATEGORIES.includes(kind as PlatformingElementCategory)
    ? (kind as PlatformingElementKindFilter)
    : 'all';
}

export function normalizePlatformingMetadata(
  metadata: Partial<PlatformingElementMetadataMap> | null | undefined
): PlatformingElementMetadataMap {
  const defaults = createDefaultPlatformingMetadata();

  if (!metadata) {
    return defaults;
  }

  for (const definition of PLATFORMING_ELEMENT_DEFINITIONS) {
    const entry = metadata[definition.id];

    if (!entry) {
      continue;
    }

    defaults[definition.id] = {
      id: definition.id,
      includedInGeneration: Boolean(entry.includedInGeneration),
      collision: normalizeCollision(entry.collision, definition)
    };
  }

  return defaults;
}

export function normalizePlatformingMetadataConfig(config: unknown): PlatformingElementMetadataMap {
  if (!config || typeof config !== 'object') {
    return normalizePlatformingMetadata(null);
  }

  const candidate = config as {
    elements?: Partial<PlatformingElementMetadataMap>;
  };

  return normalizePlatformingMetadata(
    candidate.elements ?? (config as Partial<PlatformingElementMetadataMap>)
  );
}

export function loadCachedPlatformingMetadata(
  cache?: Phaser.Cache.BaseCache
): PlatformingElementMetadataMap {
  return normalizePlatformingMetadataConfig(cache?.get(PLATFORMING_METADATA_ASSET_KEY));
}

function frame(
  id: string,
  label: string,
  category: PlatformingElementDefinition['category'],
  width: number,
  height: number,
  included: boolean,
  collisionY: number,
  collisionHeight: number,
  collisionX = 0,
  collisionWidth = width,
  textureKey = PLATFORMING_ATLAS_KEY,
  textureFrame: string | undefined = id
): PlatformingElementDefinition {
  return {
    id,
    label,
    category,
    width,
    height,
    defaultIncluded: included,
    defaultCollision: {
      x: collisionX,
      y: collisionY,
      width: collisionWidth,
      height: collisionHeight
    },
    textureKey,
    textureFrame
  };
}

function normalizeCollision(
  collision: Rect | undefined,
  definition: PlatformingElementDefinition
): Rect {
  const fallback = definition.defaultCollision;
  const x = clampNumber(collision?.x, 0, definition.width - 1, fallback.x);
  const y = clampNumber(collision?.y, 0, definition.height - 1, fallback.y);
  const width = clampNumber(collision?.width, 1, definition.width - x, fallback.width);
  const height = clampNumber(collision?.height, 1, definition.height - y, fallback.height);

  return { x, y, width, height };
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}
