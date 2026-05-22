import { createStore, type Store } from './store';
import { BASELINE_LEVEL_DEFAULT_CONFIG } from './baselineLevel';
import {
  DEFAULT_CHARACTER_VARIANT_ID,
  DEFAULT_PLAYER_ATTACK_ANIMATION_ID
} from './characterAssets';
import { CHARACTER_PLAYGROUND_DEFAULT_CONFIG } from './characterPlayground';
import { SCAVENGER_BOT_ENEMY_ID, getEnemyAnimations } from './enemyAssets';
import { LEVEL_EDITOR_DEFAULT_SETTINGS, PLAYABLE_LEVEL_IDS } from './levelData';
import { PLATFORMING_ELEMENT_DEFINITIONS } from './platformingElements';
import { SCENE_KEYS, type DebugState } from './types';

export const DEFAULT_DEBUG_STATE: DebugState = {
  activeScene: SCENE_KEYS.Boot,
  paused: false,
  showVisualBounds: false,
  showAssetLabels: false,
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
  },
  runnerGeneration: {
    difficulty: 0.15,
    terrain: 0.2,
    gaps: 0.1,
    verticality: 0.15,
    seed: 42,
    showPlatformHitboxes: true,
    showActorHitboxes: true,
    showPlanView: true
  },
  baselineLevel: { ...BASELINE_LEVEL_DEFAULT_CONFIG },
  platformingEditor: {
    selectedKind: 'all',
    selectedElementId: PLATFORMING_ELEMENT_DEFINITIONS[0].id,
    showVisualBounds: true,
    showCollisionBounds: true,
    savedAt: null
  },
  characterGym: {
    selectedAnimationId: DEFAULT_PLAYER_ATTACK_ANIMATION_ID,
    selectedVariantId: DEFAULT_CHARACTER_VARIANT_ID,
    selectedBoundsKind: 'collision',
    playbackRate: 1,
    showVisualBounds: true,
    showCollisionBounds: true,
    showAttackBounds: true,
    savedAt: null
  },
  enemyGym: {
    selectedEnemyId: SCAVENGER_BOT_ENEMY_ID,
    selectedAnimationId: getEnemyAnimations(SCAVENGER_BOT_ENEMY_ID)[0].id,
    selectedBoundsKind: 'collision',
    playbackRate: 1,
    showVisualBounds: true,
    showCollisionBounds: true,
    showHurtBounds: true,
    showAttackBounds: true,
    savedAt: null
  },
  characterPlayground: { ...CHARACTER_PLAYGROUND_DEFAULT_CONFIG },
  levelEditor: { ...LEVEL_EDITOR_DEFAULT_SETTINGS },
  levelProgress: {
    unlockedLevelIds: [PLAYABLE_LEVEL_IDS[0]]
  },
  audioPreview: {
    kind: 'sfx',
    serial: 0
  },
  pointer: { x: 0, y: 0 },
  input: {
    up: false,
    down: false,
    left: false,
    right: false,
    pointerDown: false
  }
};

export function createDebugStore(): Store<DebugState> {
  return createStore<DebugState>(DEFAULT_DEBUG_STATE);
}
