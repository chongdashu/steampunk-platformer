import type { PlatformingElementKindFilter } from './platformingElements';

export const SCENE_KEYS = {
  Boot: 'BootScene',
  Splash: 'SplashScene',
  MainMenu: 'MainMenuScene',
  LevelSelect: 'LevelSelectScene',
  Game: 'GameScene',
  BackgroundTest: 'BackgroundTestScene',
  EndlessRunner: 'EndlessRunnerScene',
  BaselineLevel: 'BaselineLevelScene',
  CharacterPlayground: 'CharacterPlaygroundScene',
  CharacterGym: 'CharacterGymScene',
  EnemyGym: 'EnemyGymScene',
  PlatformingEditor: 'PlatformingElementEditorScene',
  LevelEditor: 'LevelEditorScene',
  Settings: 'SettingsScene'
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];

export type GameProfile = 'landscape' | 'portrait';

export type BackgroundSetId = 'v1' | 'v2';

export type BackgroundLayerId = 'sky' | 'far' | 'mid' | 'near';

export type BackgroundLayerVisibility = Record<BackgroundLayerId, boolean>;

export type BackgroundLayerOffsets = Record<
  BackgroundSetId,
  Partial<Record<BackgroundLayerId, number>>
>;

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point, Size {}

export interface GameProfileConfig {
  id: GameProfile;
  label: string;
  width: number;
  height: number;
}

export interface GameSettings {
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
}

export type AudioPreviewKind = 'sfx' | 'music' | 'stopMusic';

export interface AudioPreviewRequest {
  kind: AudioPreviewKind;
  serial: number;
}

export interface RunnerGenerationSettings {
  difficulty: number;
  terrain: number;
  gaps: number;
  verticality: number;
  seed: number;
  showPlatformHitboxes: boolean;
  showActorHitboxes: boolean;
  showPlanView: boolean;
}

export interface BaselineLevelSettings {
  gapCount: number;
  gapWidth: number;
  aiEnabled: boolean;
  showHitboxes: boolean;
  useCharacterSprite: boolean;
  characterVariant: string;
}

export interface PlatformingElementEditorSettings {
  selectedKind: PlatformingElementKindFilter;
  selectedElementId: string;
  showVisualBounds: boolean;
  showCollisionBounds: boolean;
  savedAt: string | null;
}

export interface CharacterGymSettings {
  selectedAnimationId: string;
  selectedVariantId: string;
  selectedBoundsKind: 'visual' | 'collision' | 'attack';
  playbackRate: number;
  showVisualBounds: boolean;
  showCollisionBounds: boolean;
  showAttackBounds: boolean;
  savedAt: string | null;
}

export interface EnemyGymSettings {
  selectedEnemyId: string;
  selectedAnimationId: string;
  selectedBoundsKind: 'visual' | 'collision' | 'hurt' | 'attack';
  playbackRate: number;
  showVisualBounds: boolean;
  showCollisionBounds: boolean;
  showHurtBounds: boolean;
  showAttackBounds: boolean;
  savedAt: string | null;
}

export interface CharacterPlaygroundSettings {
  walkSpeed: number;
  runSpeed: number;
  jumpSpeed: number;
  gravity: number;
  characterScale: number;
  characterVariant: string;
  useCharacterSprite: boolean;
  usePlatformSprites: boolean;
  showHitboxes: boolean;
  turretActive: boolean;
  turretHealth: number;
  turretCooldownSeconds: number;
  turretProjectileSpeed: number;
  turretShootingRange: number;
  turretProjectileDamage: number;
  scavengerActive: boolean;
  scavengerHealth: number;
  scavengerPatrolSpeed: number;
  scavengerChaseSpeed: number;
  scavengerSightRange: number;
  scavengerAttackRange: number;
  scavengerAttackCooldownSeconds: number;
  scavengerKnockback: number;
}

export interface LevelEditorSettings {
  selectedLevelId: string;
  scrollX: number;
  selectedKind: 'platform' | 'pickup' | 'prop' | 'enemy' | 'exit';
  selectedPlatformFrame: string;
  selectedPickupFrame: string;
  selectedPropFrame: string;
  selectedExitFrame: string;
  showHitboxes: boolean;
  selectedObjectId: string | null;
  command: 'none' | 'add' | 'delete' | 'move';
  moveDeltaX: number;
  moveDeltaY: number;
  commandSerial: number;
}

export interface LevelProgressDebugSettings {
  unlockedLevelIds: string[];
}

export interface InputSnapshot {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pointerDown: boolean;
}

export interface PointerSnapshot {
  x: number;
  y: number;
}

export interface DebugState {
  activeScene: SceneKey;
  paused: boolean;
  showVisualBounds: boolean;
  showAssetLabels: boolean;
  backgroundSet: BackgroundSetId;
  backgroundLayers: BackgroundLayerVisibility;
  backgroundLayerOffsets: BackgroundLayerOffsets;
  runnerGeneration: RunnerGenerationSettings;
  baselineLevel: BaselineLevelSettings;
  platformingEditor: PlatformingElementEditorSettings;
  characterGym: CharacterGymSettings;
  enemyGym: EnemyGymSettings;
  characterPlayground: CharacterPlaygroundSettings;
  levelEditor: LevelEditorSettings;
  levelProgress: LevelProgressDebugSettings;
  audioPreview: AudioPreviewRequest;
  pointer: PointerSnapshot;
  input: InputSnapshot;
}
