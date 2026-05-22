import type { EnemyBoundsByEnemy, EnemyHitFramesByEnemy } from './game/enemyAssets';
import type { LevelData } from './game/levelData';
import type { PlatformingElementMetadataMap } from './game/platformingElements';

declare global {
  var __ROBIN_CHUTE_ENEMY_GYM__:
    | {
        active: boolean;
        selectedEnemyId: string;
        selectedAnimationId: string;
        boundsByEnemy: EnemyBoundsByEnemy;
        hitFramesByEnemy: EnemyHitFramesByEnemy;
        currentFrame: number;
        zoom: number;
      }
    | undefined;

  var __ROBIN_CHUTE_ELEMENT_EDITOR__:
    | {
        active: boolean;
        selectedElementId: string;
        metadata: PlatformingElementMetadataMap;
      }
    | undefined;

  var __ROBIN_CHUTE_LEVEL_EDITOR__:
    | {
        active: boolean;
        levelId: string | null;
        level: LevelData;
        selectedObjectId: string | null;
        selectedObjectPosition: { x: number; y: number } | null;
        objectCount: number;
      }
    | undefined;
}

export {};
