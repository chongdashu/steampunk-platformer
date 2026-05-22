import * as Phaser from 'phaser';

import { BACKGROUND_SETS } from '../game/assets';
import {
  BASELINE_LEVEL_DEFAULT_CONFIG,
  BASELINE_LEVEL_LIMITS,
  normalizeBaselineLevelConfig
} from '../game/baselineLevel';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_VARIANTS,
  DEFAULT_CHARACTER_ANIMATION_FPS_BY_VARIANT,
  DEFAULT_CHARACTER_BOUNDS,
  DEFAULT_CHARACTER_BOUNDS_BY_VARIANT,
  DEFAULT_CHARACTER_HIT_FRAMES_BY_VARIANT,
  cloneCharacterAnimationFpsByVariant,
  cloneCharacterBoundsByVariant,
  cloneCharacterHitFramesByVariant,
  getCharacterAnimation,
  getCharacterAnimationsForVariant,
  normalizeCharacterAnimationFpsByVariant,
  normalizeCharacterBoundsMap,
  normalizeCharacterBoundsByVariant,
  normalizeCharacterHitFramesByVariant,
  normalizeCharacterVariantId,
  type CharacterAnimationId,
  type CharacterAnimationFpsByVariant,
  type CharacterAnimationFpsMap,
  type CharacterBoundsByVariant,
  type CharacterBoundsMap,
  type CharacterHitFramesByVariant,
  type CharacterHitFramesMap
} from '../game/characterAssets';
import {
  CHARACTER_PLAYGROUND_DEFAULT_CONFIG,
  CHARACTER_PLAYGROUND_LIMITS,
  normalizeCharacterPlaygroundConfig
} from '../game/characterPlayground';
import {
  DEFAULT_ENEMY_BOUNDS_BY_ENEMY,
  DEFAULT_ENEMY_HIT_FRAMES_BY_ENEMY,
  ENEMY_OPTIONS,
  SCAVENGER_BOT_ENEMY_ID,
  TURRET_ENEMY_ID,
  cloneEnemyBoundsByEnemy,
  cloneEnemyHitFramesByEnemy,
  getEnemyAnimation,
  getEnemyAnimations,
  normalizeEnemyAnimationId,
  normalizeEnemyBoundsByEnemy,
  normalizeEnemyBoundsKind,
  normalizeEnemyHitFramesByEnemy,
  normalizeEnemyHitFramesMap,
  normalizeEnemyBoundsMap,
  normalizeEnemyId,
  type EnemyAnimationId,
  type EnemyBoundsByEnemy,
  type EnemyBoundsKind,
  type EnemyBoundsMap,
  type EnemyHitFramesByEnemy,
  type EnemyHitFramesMap,
  type EnemyId
} from '../game/enemyAssets';
import { setAppContext, type AppContext } from '../game/context';
import { GAME_TAGLINE, GAME_TITLE } from '../game/constants';
import { createDebugStore } from '../game/debug';
import { createGame } from '../game/createGame';
import {
  DEFAULT_LEVEL_CATALOG,
  LEVEL_EXIT_FRAMES,
  LEVELS_INDEX_URL,
  LEVELS_SAVE_ENDPOINT,
  LEVEL_PICKUP_FRAMES,
  LEVEL_PROP_FRAMES,
  PLAYABLE_LEVEL_IDS,
  buildLevelExport,
  getLevelUrl,
  normalizeLevelCatalog,
  normalizeLevelEditorSettings,
  type LevelCatalog
} from '../game/levelData';
import {
  LEVEL_PROGRESS_CHANGED_EVENT,
  loadLevelProgress,
  setUnlockedLevelIds
} from '../game/levelProgress';
import {
  PLATFORMING_EDITOR_STORAGE_KEY,
  PLATFORMING_ELEMENT_CATEGORIES,
  PLATFORMING_ELEMENT_DEFINITIONS,
  PLATFORMING_METADATA_FILE,
  createDefaultPlatformingMetadata,
  getPlatformingElementDefinitionsByKind,
  getPlatformingElementDefinition,
  normalizePlatformingElementKind,
  normalizePlatformingMetadata,
  normalizePlatformingMetadataConfig,
  type PlatformingElementMetadataMap
} from '../game/platformingElements';
import {
  buildGameConfigExport,
  createGameConfigStore,
  extractGameCommonConfig,
  normalizeGameCommonConfig,
  type GameCommonConfig
} from '../game/gameConfig';
import { GAME_PROFILES, resolveStartupProfile } from '../game/profiles';
import { createSettingsStore } from '../game/settings';
import {
  SCENE_KEYS,
  type BackgroundLayerId,
  type BackgroundLayerOffsets,
  type BackgroundSetId,
  type AudioPreviewKind,
  type BaselineLevelSettings,
  type CharacterPlaygroundSettings,
  type DebugState,
  type GameProfile,
  type LevelEditorSettings,
  type Rect
} from '../game/types';

const BACKGROUND_LAYER_OFFSETS_FILE = '/assets/config/background-layer-offsets.json';
const BACKGROUND_LAYER_OFFSETS_SAVE_ENDPOINT = '/__debug/background-layer-offsets';
const BASELINE_LEVEL_CONFIG_FILE = '/assets/config/baseline-level.json';
const BASELINE_LEVEL_SAVE_ENDPOINT = '/__debug/baseline-level-config';
const CHARACTER_BOUNDS_FILE = '/assets/config/character-bounds.json';
const CHARACTER_BOUNDS_SAVE_ENDPOINT = '/__debug/character-bounds';
const CHARACTER_PLAYGROUND_CONFIG_FILE = '/assets/config/character-playground.json';
const CHARACTER_PLAYGROUND_SAVE_ENDPOINT = '/__debug/character-playground-config';
const GAME_CONFIG_FILE = '/assets/config/game-config.json';
const GAME_CONFIG_SAVE_ENDPOINT = '/__debug/game-config';
const ENEMY_BOUNDS_FILE = '/assets/config/enemy-bounds.json';
const ENEMY_BOUNDS_SAVE_ENDPOINT = '/__debug/enemy-bounds';
const PLATFORMING_METADATA_SAVE_ENDPOINT = '/__debug/platforming-elements';

export function createApp(root: HTMLElement): void {
  const searchParams = new URLSearchParams(window.location.search);
  const isGameShellForced = searchParams.get('shell') === 'game';
  const isLocalDevHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const isDebugShell = !isGameShellForced && import.meta.env.DEV && isLocalDevHost;

  root.innerHTML = `
    <div class="app-shell${isDebugShell ? '' : ' app-shell--game-only'}" data-profile="landscape">
      ${isDebugShell ? `
        <header class="app-shell__header">
          <div class="app-shell__brand">
            <p class="eyebrow">PHASER 4 ▸ VITE ▸ TYPESCRIPT</p>
            <h1>${GAME_TITLE.toUpperCase()}</h1>
            <p class="subtitle">${GAME_TAGLINE}</p>
          </div>
          <div class="app-shell__header-action">
            <button id="play-toggle" class="shell-button" data-variant="primary" type="button">Play</button>
          </div>
          <div class="app-shell__status">
            <button id="profile-toggle" class="status-chip" type="button" title="Toggle layout">Landscape</button>
            <span id="scene-badge" class="status-chip" data-tone="muted">BootScene</span>
          </div>
        </header>
      ` : ''}
      <div class="app-shell__workspace">
        <section class="game-host">
          ${isDebugShell ? `
            <div class="game-host__bezel-label">
              <span>${GAME_TITLE.toUpperCase()} ▸ GAME</span>
              <span class="dots"><i></i><i></i><i></i></span>
            </div>
          ` : ''}
          <div id="game-root" class="game-root"></div>
        </section>
        ${isDebugShell ? `
          <aside id="debug-panel" class="debug-panel">
            <div class="debug-panel__header">
              <h2 class="debug-panel__title">Debug Console</h2>
              <button id="debug-collapse" class="shell-button" type="button">Collapse</button>
            </div>
            <div class="debug-panel__body">
              <div id="debug-controls" class="debug-panel__controls"></div>
            </div>
          </aside>
        ` : ''}
      </div>
      ${isDebugShell ? `
        <div id="play-toast" class="play-toast" role="status" aria-live="polite">
          Press ESC to leave play mode
        </div>
      ` : ''}
    </div>
  `;

  const appShell = root.querySelector<HTMLElement>('.app-shell');
  const gameRoot = root.querySelector<HTMLElement>('#game-root');
  const debugPanel = root.querySelector<HTMLElement>('#debug-panel');
  const debugControls = root.querySelector<HTMLElement>('#debug-controls');
  const collapseButton = root.querySelector<HTMLButtonElement>('#debug-collapse');
  const playToggle = root.querySelector<HTMLButtonElement>('#play-toggle');
  const playToast = root.querySelector<HTMLElement>('#play-toast');
  const profileToggle = root.querySelector<HTMLButtonElement>('#profile-toggle');
  const sceneBadge = root.querySelector<HTMLElement>('#scene-badge');

  if (!appShell || !gameRoot) {
    throw new Error('App shell failed to mount');
  }

  if (
    isDebugShell &&
    (!debugPanel ||
      !debugControls ||
      !collapseButton ||
      !playToggle ||
      !playToast ||
      !profileToggle ||
      !sceneBadge)
  ) {
    throw new Error('Debug shell failed to mount');
  }

  const settingsStore = createSettingsStore();
  const debugStore = createDebugStore();
  const gameConfigStore = createGameConfigStore();
  debugStore.patchState({
    levelProgress: {
      unlockedLevelIds: loadLevelProgress().unlockedLevelIds
    }
  });
  let platformingMetadata = loadPlatformingMetadata();
  let characterBoundsByVariant = cloneCharacterBoundsByVariant(DEFAULT_CHARACTER_BOUNDS_BY_VARIANT);
  let characterFpsByVariant = cloneCharacterAnimationFpsByVariant(
    DEFAULT_CHARACTER_ANIMATION_FPS_BY_VARIANT
  );
  let characterHitFramesByVariant = cloneCharacterHitFramesByVariant(
    DEFAULT_CHARACTER_HIT_FRAMES_BY_VARIANT
  );
  let enemyBoundsByEnemy = cloneEnemyBoundsByEnemy(DEFAULT_ENEMY_BOUNDS_BY_ENEMY);
  let enemyHitFramesByEnemy = cloneEnemyHitFramesByEnemy(DEFAULT_ENEMY_HIT_FRAMES_BY_ENEMY);
  let backgroundOffsetSaveStatus = 'Loaded defaults';
  let baselineLevelSaveStatus = 'Loaded defaults';
  let characterPlaygroundSaveStatus = 'Loaded defaults';
  let gameConfigSaveStatus = 'Loaded defaults';
  let levelEditorSaveStatus = 'Loaded first-level.json';
  let levelCatalog: LevelCatalog = DEFAULT_LEVEL_CATALOG;
  let levelCatalogSignature = '';
  let characterBoundsSaveStatus = 'Loaded defaults';
  let enemyBoundsSaveStatus = 'Loaded defaults';
  let currentProfile = resolveStartupProfile(window.location.search);
  let game: Phaser.Game | null = null;
  let playToastTimeout: number | null = null;

  const context: AppContext = {
    debugStore,
    settingsStore,
    gameConfigStore,
    getProfile: () => currentProfile
  };

  setAppContext(context);
  window.addEventListener(LEVEL_PROGRESS_CHANGED_EVENT, () => {
    debugStore.patchState({
      levelProgress: {
        unlockedLevelIds: loadLevelProgress().unlockedLevelIds
      }
    });
  });
  void loadBackgroundLayerOffsets(debugStore).then((loaded) => {
    backgroundOffsetSaveStatus = loaded ? 'Loaded layer-offsets.json' : 'Loaded defaults';
    debugStore.patchState({});
  });
  void loadBaselineLevelConfig(debugStore).then((loaded) => {
    baselineLevelSaveStatus = loaded ? 'Loaded baseline-level.json' : 'Loaded defaults';
    debugStore.patchState({});
  });
  void loadPlatformingMetadataConfig().then((loadedMetadata) => {
    if (loadedMetadata) {
      platformingMetadata = loadedMetadata;
      window.localStorage.setItem(
        PLATFORMING_EDITOR_STORAGE_KEY,
        buildPlatformingExport(platformingMetadata)
      );
      debugStore.patchState({});
    }
  });
  void loadGameConfig(gameConfigStore).then((loaded) => {
    gameConfigSaveStatus = loaded ? 'Loaded game-config.json' : 'Loaded defaults';
    debugStore.patchState({});
  });
  void loadCharacterPlaygroundConfig(debugStore).then((loaded) => {
    characterPlaygroundSaveStatus = loaded
      ? 'Loaded character-playground.json'
      : 'Loaded defaults';
    debugStore.patchState({});
  });
  void loadCharacterBounds().then((loadedConfig) => {
    if (loadedConfig) {
      characterBoundsByVariant = loadedConfig.boundsByVariant;
      characterFpsByVariant = loadedConfig.fpsByVariant;
      characterHitFramesByVariant = loadedConfig.hitFramesByVariant;
      characterBoundsSaveStatus = 'Loaded bounds.json';
    } else {
      characterBoundsSaveStatus = 'Loaded defaults';
    }

    globalThis.__ROBIN_CHUTE_CHARACTER_GYM__ = {
      active: debugStore.getState().activeScene === SCENE_KEYS.CharacterGym,
      selectedAnimationId: debugStore.getState().characterGym.selectedAnimationId,
      selectedVariantId: normalizeCharacterVariantId(
        debugStore.getState().characterGym.selectedVariantId
      ),
      boundsByVariant: characterBoundsByVariant,
      fpsByVariant: characterFpsByVariant,
      hitFramesByVariant: characterHitFramesByVariant,
      currentFrame: 0,
      zoom: 1
    };
    debugStore.patchState({});
  });
  void loadEnemyBounds().then((loadedConfig) => {
    if (loadedConfig) {
      enemyBoundsByEnemy = loadedConfig.boundsByEnemy;
      enemyHitFramesByEnemy = loadedConfig.hitFramesByEnemy;
      enemyBoundsSaveStatus = 'Loaded enemy-bounds.json';
    } else {
      enemyBoundsSaveStatus = 'Loaded defaults';
    }

    const selectedEnemyId = normalizeEnemyId(debugStore.getState().enemyGym.selectedEnemyId);
    globalThis.__ROBIN_CHUTE_ENEMY_GYM__ = {
      active: debugStore.getState().activeScene === SCENE_KEYS.EnemyGym,
      selectedEnemyId,
      selectedAnimationId: debugStore.getState().enemyGym.selectedAnimationId,
      boundsByEnemy: enemyBoundsByEnemy,
      hitFramesByEnemy: enemyHitFramesByEnemy,
      currentFrame: 0,
      zoom: 1
    };
    debugStore.patchState({});
  });

  const showPlayToast = (): void => {
    if (!playToast) {
      return;
    }

    playToast.classList.add('is-visible');

    if (playToastTimeout !== null) {
      window.clearTimeout(playToastTimeout);
    }

    playToastTimeout = window.setTimeout(() => {
      playToast.classList.remove('is-visible');
      playToastTimeout = null;
    }, 2200);
  };

  const enterPlayMode = (): void => {
    if (!isDebugShell || !playToggle) {
      return;
    }

    if (appShell.classList.contains('is-play-mode')) {
      return;
    }

    appShell.classList.add('is-play-mode');
    playToggle.textContent = 'Playing';
    showPlayToast();
  };

  const exitPlayMode = (): void => {
    if (!isDebugShell || !playToggle || !playToast) {
      return;
    }

    if (!appShell.classList.contains('is-play-mode')) {
      return;
    }

    appShell.classList.remove('is-play-mode');
    playToggle.textContent = 'Play';
    playToast.classList.remove('is-visible');

    if (playToastTimeout !== null) {
      window.clearTimeout(playToastTimeout);
      playToastTimeout = null;
    }
  };

  const remountGame = (profile: GameProfile): void => {
    currentProfile = profile;
    const profileConfig = GAME_PROFILES[profile];

    if (profileToggle) {
      profileToggle.textContent = profileConfig.label;
    }

    appShell.dataset.profile = profile;

    game?.destroy(true, false);
    gameRoot.innerHTML = '';
    debugStore.patchState({
      activeScene: SCENE_KEYS.Boot,
      paused: false
    });
    game = createGame(gameRoot, profile);
  };

  if (isDebugShell) {
    if (
      !debugPanel ||
      !debugControls ||
      !collapseButton ||
      !playToggle ||
      !profileToggle ||
      !sceneBadge
    ) {
      throw new Error('Debug shell controls failed to mount');
    }

    debugControls.innerHTML = `
      <div class="panel-group">
        <p class="panel-group__title">Runtime</p>
        <div class="panel-group__row">
          <button id="pause-toggle" class="shell-button" data-variant="primary" type="button">Pause</button>
        </div>
        <label class="toggle-row"><input id="show-asset-labels" type="checkbox" /> Asset labels</label>
        <div id="game-debug-controls" hidden>
          <label class="toggle-row"><input id="show-visual-bounds" type="checkbox" /> Visual bounds</label>
        </div>
      </div>

      <div id="audio-controls" class="panel-group" hidden>
        <p class="panel-group__title">Audio</p>
        <div class="audio-volume-sliders">
          <div class="audio-slider-row">
            <button
              id="audio-zero-sfx"
              class="shell-button audio-zero-button"
              type="button"
              title="Set SFX to zero"
            >
              0
            </button>
            <label class="range-row audio-slider-row__range">
              <span>SFX</span>
              <input id="audio-sfx-volume" type="range" min="0" max="1" step="0.05" />
              <strong id="audio-sfx-readout">80%</strong>
            </label>
          </div>
          <div class="audio-slider-row">
            <button
              id="audio-zero-music"
              class="shell-button audio-zero-button"
              type="button"
              title="Set music to zero"
            >
              0
            </button>
            <label class="range-row audio-slider-row__range">
              <span>Music</span>
              <input id="audio-music-volume" type="range" min="0" max="1" step="0.05" />
              <strong id="audio-music-readout">80%</strong>
            </label>
          </div>
        </div>
        <label class="toggle-row"><input id="audio-muted" type="checkbox" /> Mute all</label>
        <div class="panel-group__row">
          <button id="audio-test-sfx" class="shell-button" type="button">Test SFX</button>
          <button id="audio-test-music" class="shell-button" type="button">Test music</button>
          <button id="audio-stop-music" class="shell-button" type="button">Stop music</button>
        </div>
      </div>

      <div id="level-progress-controls" class="panel-group" hidden>
        <p class="panel-group__title">Level Progress</p>
        <div id="level-progress-toggles" class="layer-toggle-list"></div>
      </div>

      <div id="background-controls" class="panel-group" hidden>
        <p class="panel-group__title">Background</p>
        <label class="stack-row">
          <span class="stack-row__label">Set</span>
          <select id="background-set-select" data-testid="background-set-select">
            ${Object.values(BACKGROUND_SETS)
              .map((set) => `<option value="${set.id}">${set.label}</option>`)
              .join('')}
          </select>
        </label>
        <div id="background-layer-toggles" class="layer-toggle-list"></div>
        <div class="panel-group__row">
          <button id="background-save-offsets" class="shell-button" data-variant="primary" type="button">
            Save offsets
          </button>
          <button id="background-reset-offsets" class="shell-button" type="button">
            Reset
          </button>
        </div>
        <p id="background-save-status" class="panel-note">Loaded defaults</p>
      </div>

      <div id="runner-controls" class="panel-group" hidden>
        <p class="panel-group__title">Runner Generator</p>
        <label class="range-row">
          <span>Difficulty</span>
          <input id="runner-difficulty" type="range" min="0" max="0.8" step="0.05" />
          <strong id="runner-difficulty-readout">0.15</strong>
        </label>
        <label class="range-row">
          <span>Terrain</span>
          <input id="runner-terrain" type="range" min="0" max="1" step="0.05" />
          <strong id="runner-terrain-readout">0.20</strong>
        </label>
        <label class="range-row">
          <span>Gaps</span>
          <input id="runner-gaps" type="range" min="0" max="1" step="0.05" />
          <strong id="runner-gaps-readout">0.10</strong>
        </label>
        <label class="range-row">
          <span>Vertical</span>
          <input id="runner-verticality" type="range" min="0" max="1" step="0.05" />
          <strong id="runner-verticality-readout">0.15</strong>
        </label>
        <label class="number-row">
          <span>Seed</span>
          <input id="runner-seed" type="number" min="1" step="1" />
        </label>
        <label class="toggle-row"><input id="runner-platform-hitboxes" type="checkbox" /> Platform hitboxes</label>
        <label class="toggle-row"><input id="runner-actor-hitboxes" type="checkbox" /> Actor hitboxes</label>
        <label class="toggle-row"><input id="runner-plan-view" type="checkbox" /> Plan view</label>
      </div>

      <div id="baseline-level-controls" class="panel-group" hidden>
        <p class="panel-group__title">Baseline Level</p>
        <label class="number-row">
          <span>Gap count</span>
          <input
            id="baseline-gap-count"
            type="number"
            min="${BASELINE_LEVEL_LIMITS.gapCount.min}"
            max="${BASELINE_LEVEL_LIMITS.gapCount.max}"
            step="${BASELINE_LEVEL_LIMITS.gapCount.step}"
          />
        </label>
        <label class="number-row">
          <span>Gap width</span>
          <input
            id="baseline-gap-width"
            type="number"
            min="${BASELINE_LEVEL_LIMITS.gapWidth.min}"
            max="${BASELINE_LEVEL_LIMITS.gapWidth.max}"
            step="${BASELINE_LEVEL_LIMITS.gapWidth.step}"
          />
        </label>
        <label class="toggle-row"><input id="baseline-ai-enabled" type="checkbox" /> AI jump assist</label>
        <label class="toggle-row"><input id="baseline-character-sprite" type="checkbox" /> Character sprite</label>
        <label class="stack-row">
          <span class="stack-row__label">Character</span>
          <select id="baseline-character-variant">
            ${CHARACTER_VARIANTS.map(
              (variant) => `<option value="${variant.id}">${variant.label}</option>`
            ).join('')}
          </select>
        </label>
        <label class="toggle-row"><input id="baseline-hitboxes" type="checkbox" /> Hitboxes</label>
        <div class="panel-group__row">
          <button id="baseline-save-config" class="shell-button" data-variant="primary" type="button">
            Save config
          </button>
          <button id="baseline-reset-config" class="shell-button" type="button">Reset</button>
        </div>
        <p id="baseline-save-status" class="panel-note">Loaded defaults</p>
      </div>

      <div id="character-playground-controls" class="panel-group" hidden>
        <p class="panel-group__title">Character Playground</p>
        <label class="range-row">
          <span>Walk</span>
          <input
            id="playground-walk-speed"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.walkSpeed.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.walkSpeed.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.walkSpeed.step}"
          />
          <strong id="playground-walk-readout">125</strong>
        </label>
        <label class="range-row">
          <span>Run</span>
          <input
            id="playground-run-speed"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.runSpeed.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.runSpeed.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.runSpeed.step}"
          />
          <strong id="playground-run-readout">245</strong>
        </label>
        <label class="range-row">
          <span>Jump</span>
          <input
            id="playground-jump-speed"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.jumpSpeed.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.jumpSpeed.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.jumpSpeed.step}"
          />
          <strong id="playground-jump-readout">720</strong>
        </label>
        <label class="range-row">
          <span>Gravity</span>
          <input
            id="playground-gravity"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.gravity.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.gravity.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.gravity.step}"
          />
          <strong id="playground-gravity-readout">1680</strong>
        </label>
        <label class="range-row">
          <span>Scale</span>
          <input
            id="playground-character-scale"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.characterScale.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.characterScale.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.characterScale.step}"
          />
          <strong id="playground-scale-readout">0.82x</strong>
        </label>
        <label class="stack-row">
          <span class="stack-row__label">Character</span>
          <select id="playground-character-variant">
            ${CHARACTER_VARIANTS.map(
              (variant) => `<option value="${variant.id}">${variant.label}</option>`
            ).join('')}
          </select>
        </label>
        <label class="toggle-row"><input id="playground-character-sprite" type="checkbox" /> Character sprite</label>
        <label class="toggle-row"><input id="playground-platform-sprites" type="checkbox" /> Platform sprites</label>
        <label class="toggle-row"><input id="playground-hitboxes" type="checkbox" /> Hitboxes</label>
        <label class="toggle-row"><input id="playground-turret-active" type="checkbox" /> Turret active</label>
        <label class="range-row">
          <span>Turret HP</span>
          <input
            id="playground-turret-health"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.turretHealth.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.turretHealth.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.turretHealth.step}"
          />
          <strong id="playground-turret-health-readout">3</strong>
        </label>
        <label class="range-row">
          <span>Cooldown</span>
          <input
            id="playground-turret-cooldown"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.turretCooldownSeconds.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.turretCooldownSeconds.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.turretCooldownSeconds.step}"
          />
          <strong id="playground-turret-cooldown-readout">1.40s</strong>
        </label>
        <label class="range-row">
          <span>Shot speed</span>
          <input
            id="playground-turret-projectile-speed"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.turretProjectileSpeed.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.turretProjectileSpeed.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.turretProjectileSpeed.step}"
          />
          <strong id="playground-turret-projectile-speed-readout">315</strong>
        </label>
        <label class="range-row">
          <span>Range</span>
          <input
            id="playground-turret-range"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.turretShootingRange.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.turretShootingRange.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.turretShootingRange.step}"
          />
          <strong id="playground-turret-range-readout">620</strong>
        </label>
        <label class="range-row">
          <span>Damage</span>
          <input
            id="playground-turret-damage"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.turretProjectileDamage.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.turretProjectileDamage.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.turretProjectileDamage.step}"
          />
          <strong id="playground-turret-damage-readout">1</strong>
        </label>
        <label class="toggle-row"><input id="playground-scavenger-active" type="checkbox" /> Scavenger active</label>
        <label class="range-row">
          <span>Bot HP</span>
          <input
            id="playground-scavenger-health"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.scavengerHealth.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.scavengerHealth.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.scavengerHealth.step}"
          />
          <strong id="playground-scavenger-health-readout">5</strong>
        </label>
        <label class="range-row">
          <span>Patrol</span>
          <input
            id="playground-scavenger-patrol-speed"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.scavengerPatrolSpeed.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.scavengerPatrolSpeed.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.scavengerPatrolSpeed.step}"
          />
          <strong id="playground-scavenger-patrol-readout">55</strong>
        </label>
        <label class="range-row">
          <span>Chase</span>
          <input
            id="playground-scavenger-chase-speed"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.scavengerChaseSpeed.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.scavengerChaseSpeed.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.scavengerChaseSpeed.step}"
          />
          <strong id="playground-scavenger-chase-readout">115</strong>
        </label>
        <label class="range-row">
          <span>Sight</span>
          <input
            id="playground-scavenger-sight-range"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.scavengerSightRange.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.scavengerSightRange.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.scavengerSightRange.step}"
          />
          <strong id="playground-scavenger-sight-readout">420</strong>
        </label>
        <label class="range-row">
          <span>Melee</span>
          <input
            id="playground-scavenger-attack-range"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.scavengerAttackRange.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.scavengerAttackRange.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.scavengerAttackRange.step}"
          />
          <strong id="playground-scavenger-attack-readout">72</strong>
        </label>
        <label class="range-row">
          <span>Bot cd</span>
          <input
            id="playground-scavenger-cooldown"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.scavengerAttackCooldownSeconds.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.scavengerAttackCooldownSeconds.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.scavengerAttackCooldownSeconds.step}"
          />
          <strong id="playground-scavenger-cooldown-readout">1.05s</strong>
        </label>
        <label class="range-row">
          <span>Kickback</span>
          <input
            id="playground-scavenger-knockback"
            type="range"
            min="${CHARACTER_PLAYGROUND_LIMITS.scavengerKnockback.min}"
            max="${CHARACTER_PLAYGROUND_LIMITS.scavengerKnockback.max}"
            step="${CHARACTER_PLAYGROUND_LIMITS.scavengerKnockback.step}"
          />
          <strong id="playground-scavenger-knockback-readout">360</strong>
        </label>
        <div class="panel-group__row">
          <button id="playground-save-config" class="shell-button" data-variant="primary" type="button">
            Save playground
          </button>
          <button id="playground-save-game-config" class="shell-button" type="button">
            Save game config
          </button>
          <button id="playground-reset-config" class="shell-button" type="button">Reset</button>
        </div>
        <p id="playground-save-status" class="panel-note">Loaded defaults</p>
        <p id="game-config-save-status" class="panel-note">Loaded defaults</p>
      </div>

      <div id="character-gym-controls" class="panel-group" hidden>
        <p class="panel-group__title">Character Gym</p>
        <label class="stack-row">
          <span class="stack-row__label">Variant</span>
          <select id="character-variant-select" data-testid="character-variant-select">
            ${CHARACTER_VARIANTS.map(
              (variant) => `<option value="${variant.id}">${variant.label}</option>`
            ).join('')}
          </select>
        </label>
        <label class="stack-row">
          <span class="stack-row__label">Animation</span>
          <select id="character-animation-select" data-testid="character-animation-select">
            ${CHARACTER_ANIMATIONS.map(
              (animation) => `<option value="${animation.id}">${animation.label}</option>`
            ).join('')}
          </select>
        </label>
        <label class="toggle-row"><input id="character-show-visual" type="checkbox" /> Visual bounds</label>
        <label class="toggle-row"><input id="character-show-collision" type="checkbox" /> Collision bounds</label>
        <label class="toggle-row"><input id="character-show-attack" type="checkbox" /> Attack bounds</label>
        <label class="range-row">
          <span>Playback</span>
          <input id="character-playback-rate" type="range" min="0.25" max="2" step="0.05" />
          <strong id="character-playback-readout">1.00x</strong>
        </label>
        <label class="number-row">
          <span>FPS</span>
          <input id="character-animation-fps" type="number" min="1" max="30" step="0.5" />
        </label>
        <div class="frame-control">
          <div class="frame-control__header">
            <span>Frame</span>
            <strong id="character-frame-readout">1/1</strong>
          </div>
          <p class="panel-note">Attack frames</p>
          <div id="character-attack-frame-strip" class="frame-strip" aria-label="Character attack active frames"></div>
        </div>
        <label class="stack-row">
          <span class="stack-row__label">Bounds</span>
          <select id="character-bounds-kind">
            <option value="visual">Visual</option>
            <option value="collision">Collision</option>
            <option value="attack">Attack</option>
          </select>
        </label>
        <div class="editor-grid">
          <label class="number-row"><span>X</span><input id="character-bounds-x" type="number" min="0" max="255" step="1" /></label>
          <label class="number-row"><span>Y</span><input id="character-bounds-y" type="number" min="0" max="255" step="1" /></label>
          <label class="number-row"><span>W</span><input id="character-bounds-width" type="number" min="1" max="256" step="1" /></label>
          <label class="number-row"><span>H</span><input id="character-bounds-height" type="number" min="1" max="256" step="1" /></label>
        </div>
        <div class="panel-group__row">
          <button id="character-save-bounds" class="shell-button" data-variant="primary" type="button">Save</button>
          <button id="character-reset-bounds" class="shell-button" type="button">Reset</button>
          <button id="character-apply-bounds-kind-all" class="shell-button" type="button">Apply selected</button>
          <button id="character-apply-bounds-all" class="shell-button" type="button">Apply all bounds</button>
        </div>
        <p id="character-save-status" class="panel-note">Loaded defaults</p>
      </div>

      <div id="enemy-gym-controls" class="panel-group" hidden>
        <p class="panel-group__title">Enemy Gym</p>
        <label class="stack-row">
          <span class="stack-row__label">Enemy</span>
          <select id="enemy-select" data-testid="enemy-select">
            ${ENEMY_OPTIONS.map((enemy) => `<option value="${enemy.id}">${enemy.label}</option>`).join('')}
          </select>
        </label>
        <label class="stack-row">
          <span class="stack-row__label">Animation</span>
          <select id="enemy-animation-select" data-testid="enemy-animation-select">
            ${getEnemyAnimations(ENEMY_OPTIONS[0].id).map(
              (animation) => `<option value="${animation.id}">${animation.label}</option>`
            ).join('')}
          </select>
        </label>
        <label class="toggle-row"><input id="enemy-show-visual" type="checkbox" /> Visual bounds</label>
        <label class="toggle-row"><input id="enemy-show-collision" type="checkbox" /> Collision bounds</label>
        <label class="toggle-row"><input id="enemy-show-hurt" type="checkbox" /> Hurt bounds</label>
        <label class="toggle-row"><input id="enemy-show-attack" type="checkbox" /> Attack bounds</label>
        <label class="range-row">
          <span>Playback</span>
          <input id="enemy-playback-rate" type="range" min="0.25" max="2" step="0.05" />
          <strong id="enemy-playback-readout">1.00x</strong>
        </label>
        <div class="frame-control">
          <div class="frame-control__header">
            <span>Frame</span>
            <strong id="enemy-frame-readout">1/1</strong>
          </div>
          <p class="panel-note">Hurt frames</p>
          <div id="enemy-hurt-frame-strip" class="frame-strip" aria-label="Enemy hurt active frames"></div>
          <p class="panel-note">Attack frames</p>
          <div id="enemy-attack-frame-strip" class="frame-strip" aria-label="Enemy attack active frames"></div>
        </div>
        <label class="stack-row">
          <span class="stack-row__label">Bounds</span>
          <select id="enemy-bounds-kind">
            <option value="visual">Visual</option>
            <option value="collision">Collision</option>
            <option value="hurt">Hurt</option>
            <option value="attack">Attack</option>
          </select>
        </label>
        <div class="editor-grid">
          <label class="number-row"><span>X</span><input id="enemy-bounds-x" type="number" min="0" max="255" step="1" /></label>
          <label class="number-row"><span>Y</span><input id="enemy-bounds-y" type="number" min="0" max="255" step="1" /></label>
          <label class="number-row"><span>W</span><input id="enemy-bounds-width" type="number" min="1" max="256" step="1" /></label>
          <label class="number-row"><span>H</span><input id="enemy-bounds-height" type="number" min="1" max="256" step="1" /></label>
        </div>
        <div class="panel-group__row">
          <button id="enemy-save-bounds" class="shell-button" data-variant="primary" type="button">Save</button>
          <button id="enemy-reset-bounds" class="shell-button" type="button">Reset</button>
          <button id="enemy-apply-bounds-kind-all" class="shell-button" type="button">Apply selected</button>
          <button id="enemy-apply-bounds-all" class="shell-button" type="button">Apply all bounds</button>
        </div>
        <p id="enemy-save-status" class="panel-note">Loaded defaults</p>
      </div>

      <div id="element-editor-controls" class="panel-group" hidden>
        <p class="panel-group__title">Element Editor</p>
        <label class="stack-row">
          <span class="stack-row__label">Kind</span>
          <select id="element-kind-select" data-testid="element-kind-select">
            <option value="all">All</option>
            ${PLATFORMING_ELEMENT_CATEGORIES.map(
              (category) => `<option value="${category}">${formatLabel(category)}</option>`
            ).join('')}
          </select>
        </label>
        <label class="stack-row">
          <span class="stack-row__label">Element</span>
          <select id="element-select" data-testid="element-select">
            ${PLATFORMING_ELEMENT_DEFINITIONS.map(
              (definition) => `<option value="${definition.id}">${definition.label}</option>`
            ).join('')}
          </select>
        </label>
        <label class="toggle-row"><input id="element-included" type="checkbox" /> Include in generation</label>
        <label class="toggle-row"><input id="element-show-visual" type="checkbox" /> Visual bounds</label>
        <label class="toggle-row"><input id="element-show-collision" type="checkbox" /> Collision bounds</label>
        <div class="editor-grid">
          <label class="number-row"><span>X</span><input id="element-collision-x" type="number" step="1" /></label>
          <label class="number-row"><span>Y</span><input id="element-collision-y" type="number" step="1" /></label>
          <label class="number-row"><span>W</span><input id="element-collision-width" type="number" min="1" step="1" /></label>
          <label class="number-row"><span>H</span><input id="element-collision-height" type="number" min="1" step="1" /></label>
        </div>
        <div class="panel-group__row">
          <button id="element-save" class="shell-button" data-variant="primary" type="button">Save</button>
          <button id="element-reset" class="shell-button" type="button">Reset</button>
          <button id="element-export" class="shell-button" type="button">Export</button>
        </div>
        <textarea id="element-export-json" class="editor-export" readonly spellcheck="false"></textarea>
        <p id="element-save-status" class="panel-note">Not saved this session</p>
      </div>

      <div id="level-editor-controls" class="panel-group" hidden>
        <p class="panel-group__title">Level Editor</p>
        <label class="stack-row">
          <span class="stack-row__label">Level</span>
          <select id="level-editor-level"></select>
        </label>
        <div class="panel-group__row">
          <button id="level-editor-new-level" class="shell-button" type="button">New level</button>
          <button id="level-editor-save-as" class="shell-button" type="button">Save as</button>
        </div>
        <label class="range-row">
          <span>Scroll</span>
          <input id="level-editor-scroll" type="range" min="0" max="4800" step="20" />
          <strong id="level-editor-scroll-readout">0</strong>
        </label>
        <label class="stack-row">
          <span class="stack-row__label">Kind</span>
          <select id="level-editor-kind">
            <option value="platform">Platform</option>
            <option value="pickup">Pickup</option>
            <option value="prop">Prop</option>
            <option value="enemy">Enemy</option>
            <option value="exit">Exit</option>
          </select>
        </label>
        <label id="level-editor-platform-row" class="stack-row">
          <span class="stack-row__label">Platform</span>
          <select id="level-editor-platform-frame">
            ${PLATFORMING_ELEMENT_DEFINITIONS.filter((definition) => definition.category !== 'exit').map(
              (definition) => `<option value="${definition.id}">${definition.label}</option>`
            ).join('')}
          </select>
        </label>
        <label id="level-editor-pickup-row" class="stack-row">
          <span class="stack-row__label">Pickup</span>
          <select id="level-editor-pickup-frame">
            ${LEVEL_PICKUP_FRAMES.map((frame) => `<option value="${frame}">${frame}</option>`).join('')}
          </select>
        </label>
        <label id="level-editor-prop-row" class="stack-row">
          <span class="stack-row__label">Prop</span>
          <select id="level-editor-prop-frame">
            ${LEVEL_PROP_FRAMES.map((frame) => `<option value="${frame}">${frame}</option>`).join('')}
          </select>
        </label>
        <label id="level-editor-exit-row" class="stack-row">
          <span class="stack-row__label">Exit</span>
          <select id="level-editor-exit-frame">
            ${LEVEL_EXIT_FRAMES.map((frame) => `<option value="${frame}">${frame}</option>`).join('')}
          </select>
        </label>
        <label class="toggle-row"><input id="level-editor-hitboxes" type="checkbox" /> Hitboxes</label>
        <div class="panel-group__row">
          <button id="level-editor-add" class="shell-button" data-variant="primary" type="button">Add</button>
          <button id="level-editor-delete" class="shell-button" type="button">Delete</button>
          <button id="level-editor-save" class="shell-button" type="button">Save</button>
        </div>
        <div class="level-transform" aria-label="Selected object transform">
          <label>
            <span>X</span>
            <input id="level-editor-position-x" type="number" step="1" />
          </label>
          <label>
            <span>Y</span>
            <input id="level-editor-position-y" type="number" step="1" />
          </label>
        </div>
        <p class="panel-note">Drag the canvas gizmo axes, or enter exact X/Y values here.</p>
        <p id="level-editor-selection" class="panel-note">No selection</p>
        <p id="level-editor-save-status" class="panel-note">Loaded first-level.json</p>
      </div>

      <div class="metrics">
        <div class="metrics__row"><span>Scene</span><strong id="scene-readout">-</strong></div>
        <div class="metrics__row"><span>Pointer</span><strong id="pointer-readout">0, 0</strong></div>
        <div class="metrics__row"><span>Input</span><strong id="input-readout">idle</strong></div>
      </div>
    `;

    const pauseToggle = debugControls.querySelector<HTMLButtonElement>('#pause-toggle');
    const gameDebugControls = debugControls.querySelector<HTMLElement>('#game-debug-controls');
    const levelProgressControls =
      debugControls.querySelector<HTMLElement>('#level-progress-controls');
    const levelProgressToggles =
      debugControls.querySelector<HTMLElement>('#level-progress-toggles');
    const showAssetLabels =
      debugControls.querySelector<HTMLInputElement>('#show-asset-labels');
    const showVisualBounds = debugControls.querySelector<HTMLInputElement>('#show-visual-bounds');
    const audioControls = debugControls.querySelector<HTMLElement>('#audio-controls');
    const audioZeroSfx = debugControls.querySelector<HTMLButtonElement>('#audio-zero-sfx');
    const audioZeroMusic = debugControls.querySelector<HTMLButtonElement>('#audio-zero-music');
    const audioSfxVolume = debugControls.querySelector<HTMLInputElement>('#audio-sfx-volume');
    const audioSfxReadout = debugControls.querySelector<HTMLElement>('#audio-sfx-readout');
    const audioMusicVolume = debugControls.querySelector<HTMLInputElement>('#audio-music-volume');
    const audioMusicReadout = debugControls.querySelector<HTMLElement>('#audio-music-readout');
    const audioMuted = debugControls.querySelector<HTMLInputElement>('#audio-muted');
    const audioTestSfx = debugControls.querySelector<HTMLButtonElement>('#audio-test-sfx');
    const audioTestMusic = debugControls.querySelector<HTMLButtonElement>('#audio-test-music');
    const audioStopMusic = debugControls.querySelector<HTMLButtonElement>('#audio-stop-music');
    const backgroundControls = debugControls.querySelector<HTMLElement>('#background-controls');
    const backgroundSetSelect =
      debugControls.querySelector<HTMLSelectElement>('#background-set-select');
    const backgroundLayerToggles = debugControls.querySelector<HTMLElement>(
      '#background-layer-toggles'
    );
    const backgroundSaveOffsets =
      debugControls.querySelector<HTMLButtonElement>('#background-save-offsets');
    const backgroundResetOffsets =
      debugControls.querySelector<HTMLButtonElement>('#background-reset-offsets');
    const backgroundSaveStatus =
      debugControls.querySelector<HTMLElement>('#background-save-status');
    const runnerControls = debugControls.querySelector<HTMLElement>('#runner-controls');
    const runnerDifficulty = debugControls.querySelector<HTMLInputElement>('#runner-difficulty');
    const runnerTerrain = debugControls.querySelector<HTMLInputElement>('#runner-terrain');
    const runnerGaps = debugControls.querySelector<HTMLInputElement>('#runner-gaps');
    const runnerVerticality = debugControls.querySelector<HTMLInputElement>('#runner-verticality');
    const runnerSeed = debugControls.querySelector<HTMLInputElement>('#runner-seed');
    const runnerPlatformHitboxes = debugControls.querySelector<HTMLInputElement>(
      '#runner-platform-hitboxes'
    );
    const runnerActorHitboxes = debugControls.querySelector<HTMLInputElement>(
      '#runner-actor-hitboxes'
    );
    const runnerPlanView = debugControls.querySelector<HTMLInputElement>('#runner-plan-view');
    const runnerDifficultyReadout = debugControls.querySelector<HTMLElement>(
      '#runner-difficulty-readout'
    );
    const runnerTerrainReadout = debugControls.querySelector<HTMLElement>('#runner-terrain-readout');
    const runnerGapsReadout = debugControls.querySelector<HTMLElement>('#runner-gaps-readout');
    const runnerVerticalityReadout = debugControls.querySelector<HTMLElement>(
      '#runner-verticality-readout'
    );
    const baselineLevelControls =
      debugControls.querySelector<HTMLElement>('#baseline-level-controls');
    const baselineGapCount = debugControls.querySelector<HTMLInputElement>('#baseline-gap-count');
    const baselineGapWidth = debugControls.querySelector<HTMLInputElement>('#baseline-gap-width');
    const baselineAiEnabled =
      debugControls.querySelector<HTMLInputElement>('#baseline-ai-enabled');
    const baselineCharacterSprite =
      debugControls.querySelector<HTMLInputElement>('#baseline-character-sprite');
    const baselineCharacterVariant =
      debugControls.querySelector<HTMLSelectElement>('#baseline-character-variant');
    const baselineHitboxes = debugControls.querySelector<HTMLInputElement>('#baseline-hitboxes');
    const baselineSaveConfig =
      debugControls.querySelector<HTMLButtonElement>('#baseline-save-config');
    const baselineResetConfig =
      debugControls.querySelector<HTMLButtonElement>('#baseline-reset-config');
    const baselineSaveStatus =
      debugControls.querySelector<HTMLElement>('#baseline-save-status');
    const characterGymControls =
      debugControls.querySelector<HTMLElement>('#character-gym-controls');
    const characterPlaygroundControls =
      debugControls.querySelector<HTMLElement>('#character-playground-controls');
    const playgroundWalkSpeed =
      debugControls.querySelector<HTMLInputElement>('#playground-walk-speed');
    const playgroundWalkReadout =
      debugControls.querySelector<HTMLElement>('#playground-walk-readout');
    const playgroundRunSpeed =
      debugControls.querySelector<HTMLInputElement>('#playground-run-speed');
    const playgroundRunReadout =
      debugControls.querySelector<HTMLElement>('#playground-run-readout');
    const playgroundJumpSpeed =
      debugControls.querySelector<HTMLInputElement>('#playground-jump-speed');
    const playgroundJumpReadout =
      debugControls.querySelector<HTMLElement>('#playground-jump-readout');
    const playgroundGravity =
      debugControls.querySelector<HTMLInputElement>('#playground-gravity');
    const playgroundGravityReadout =
      debugControls.querySelector<HTMLElement>('#playground-gravity-readout');
    const playgroundCharacterScale =
      debugControls.querySelector<HTMLInputElement>('#playground-character-scale');
    const playgroundScaleReadout =
      debugControls.querySelector<HTMLElement>('#playground-scale-readout');
    const playgroundCharacterSprite =
      debugControls.querySelector<HTMLInputElement>('#playground-character-sprite');
    const playgroundCharacterVariant =
      debugControls.querySelector<HTMLSelectElement>('#playground-character-variant');
    const playgroundPlatformSprites =
      debugControls.querySelector<HTMLInputElement>('#playground-platform-sprites');
    const playgroundHitboxes =
      debugControls.querySelector<HTMLInputElement>('#playground-hitboxes');
    const playgroundTurretActive =
      debugControls.querySelector<HTMLInputElement>('#playground-turret-active');
    const playgroundTurretHealth =
      debugControls.querySelector<HTMLInputElement>('#playground-turret-health');
    const playgroundTurretHealthReadout =
      debugControls.querySelector<HTMLElement>('#playground-turret-health-readout');
    const playgroundTurretCooldown =
      debugControls.querySelector<HTMLInputElement>('#playground-turret-cooldown');
    const playgroundTurretCooldownReadout =
      debugControls.querySelector<HTMLElement>('#playground-turret-cooldown-readout');
    const playgroundTurretProjectileSpeed = debugControls.querySelector<HTMLInputElement>(
      '#playground-turret-projectile-speed'
    );
    const playgroundTurretProjectileSpeedReadout = debugControls.querySelector<HTMLElement>(
      '#playground-turret-projectile-speed-readout'
    );
    const playgroundTurretRange =
      debugControls.querySelector<HTMLInputElement>('#playground-turret-range');
    const playgroundTurretRangeReadout =
      debugControls.querySelector<HTMLElement>('#playground-turret-range-readout');
    const playgroundTurretDamage =
      debugControls.querySelector<HTMLInputElement>('#playground-turret-damage');
    const playgroundTurretDamageReadout =
      debugControls.querySelector<HTMLElement>('#playground-turret-damage-readout');
    const playgroundScavengerActive =
      debugControls.querySelector<HTMLInputElement>('#playground-scavenger-active');
    const playgroundScavengerHealth =
      debugControls.querySelector<HTMLInputElement>('#playground-scavenger-health');
    const playgroundScavengerHealthReadout =
      debugControls.querySelector<HTMLElement>('#playground-scavenger-health-readout');
    const playgroundScavengerPatrolSpeed = debugControls.querySelector<HTMLInputElement>(
      '#playground-scavenger-patrol-speed'
    );
    const playgroundScavengerPatrolReadout = debugControls.querySelector<HTMLElement>(
      '#playground-scavenger-patrol-readout'
    );
    const playgroundScavengerChaseSpeed = debugControls.querySelector<HTMLInputElement>(
      '#playground-scavenger-chase-speed'
    );
    const playgroundScavengerChaseReadout = debugControls.querySelector<HTMLElement>(
      '#playground-scavenger-chase-readout'
    );
    const playgroundScavengerSightRange = debugControls.querySelector<HTMLInputElement>(
      '#playground-scavenger-sight-range'
    );
    const playgroundScavengerSightReadout = debugControls.querySelector<HTMLElement>(
      '#playground-scavenger-sight-readout'
    );
    const playgroundScavengerAttackRange = debugControls.querySelector<HTMLInputElement>(
      '#playground-scavenger-attack-range'
    );
    const playgroundScavengerAttackReadout = debugControls.querySelector<HTMLElement>(
      '#playground-scavenger-attack-readout'
    );
    const playgroundScavengerCooldown =
      debugControls.querySelector<HTMLInputElement>('#playground-scavenger-cooldown');
    const playgroundScavengerCooldownReadout = debugControls.querySelector<HTMLElement>(
      '#playground-scavenger-cooldown-readout'
    );
    const playgroundScavengerKnockback =
      debugControls.querySelector<HTMLInputElement>('#playground-scavenger-knockback');
    const playgroundScavengerKnockbackReadout = debugControls.querySelector<HTMLElement>(
      '#playground-scavenger-knockback-readout'
    );
    const playgroundSaveConfig =
      debugControls.querySelector<HTMLButtonElement>('#playground-save-config');
    const playgroundSaveGameConfig =
      debugControls.querySelector<HTMLButtonElement>('#playground-save-game-config');
    const playgroundResetConfig =
      debugControls.querySelector<HTMLButtonElement>('#playground-reset-config');
    const playgroundSaveStatus =
      debugControls.querySelector<HTMLElement>('#playground-save-status');
    const gameConfigSaveStatusElement =
      debugControls.querySelector<HTMLElement>('#game-config-save-status');
    const characterAnimationSelect =
      debugControls.querySelector<HTMLSelectElement>('#character-animation-select');
    const characterVariantSelect =
      debugControls.querySelector<HTMLSelectElement>('#character-variant-select');
    const characterBoundsKind =
      debugControls.querySelector<HTMLSelectElement>('#character-bounds-kind');
    const characterShowVisual =
      debugControls.querySelector<HTMLInputElement>('#character-show-visual');
    const characterShowCollision =
      debugControls.querySelector<HTMLInputElement>('#character-show-collision');
    const characterShowAttack =
      debugControls.querySelector<HTMLInputElement>('#character-show-attack');
    const characterPlaybackRate =
      debugControls.querySelector<HTMLInputElement>('#character-playback-rate');
    const characterPlaybackReadout =
      debugControls.querySelector<HTMLElement>('#character-playback-readout');
    const characterAnimationFps =
      debugControls.querySelector<HTMLInputElement>('#character-animation-fps');
    const characterFrameReadout =
      debugControls.querySelector<HTMLElement>('#character-frame-readout');
    const characterAttackFrameStrip = debugControls.querySelector<HTMLElement>(
      '#character-attack-frame-strip'
    );
    const characterBoundsX =
      debugControls.querySelector<HTMLInputElement>('#character-bounds-x');
    const characterBoundsY =
      debugControls.querySelector<HTMLInputElement>('#character-bounds-y');
    const characterBoundsWidth =
      debugControls.querySelector<HTMLInputElement>('#character-bounds-width');
    const characterBoundsHeight =
      debugControls.querySelector<HTMLInputElement>('#character-bounds-height');
    const characterSaveBounds =
      debugControls.querySelector<HTMLButtonElement>('#character-save-bounds');
    const characterResetBounds =
      debugControls.querySelector<HTMLButtonElement>('#character-reset-bounds');
    const characterApplyBoundsKindAll =
      debugControls.querySelector<HTMLButtonElement>('#character-apply-bounds-kind-all');
    const characterApplyBoundsAll =
      debugControls.querySelector<HTMLButtonElement>('#character-apply-bounds-all');
    const characterSaveStatus =
      debugControls.querySelector<HTMLElement>('#character-save-status');
    const enemyGymControls = debugControls.querySelector<HTMLElement>('#enemy-gym-controls');
    const enemySelect = debugControls.querySelector<HTMLSelectElement>('#enemy-select');
    const enemyAnimationSelect =
      debugControls.querySelector<HTMLSelectElement>('#enemy-animation-select');
    const enemyBoundsKind = debugControls.querySelector<HTMLSelectElement>('#enemy-bounds-kind');
    const enemyShowVisual = debugControls.querySelector<HTMLInputElement>('#enemy-show-visual');
    const enemyShowCollision =
      debugControls.querySelector<HTMLInputElement>('#enemy-show-collision');
    const enemyShowHurt = debugControls.querySelector<HTMLInputElement>('#enemy-show-hurt');
    const enemyShowAttack = debugControls.querySelector<HTMLInputElement>('#enemy-show-attack');
    const enemyPlaybackRate = debugControls.querySelector<HTMLInputElement>('#enemy-playback-rate');
    const enemyPlaybackReadout =
      debugControls.querySelector<HTMLElement>('#enemy-playback-readout');
    const enemyFrameReadout = debugControls.querySelector<HTMLElement>('#enemy-frame-readout');
    const enemyHurtFrameStrip =
      debugControls.querySelector<HTMLElement>('#enemy-hurt-frame-strip');
    const enemyAttackFrameStrip = debugControls.querySelector<HTMLElement>(
      '#enemy-attack-frame-strip'
    );
    const enemyBoundsX = debugControls.querySelector<HTMLInputElement>('#enemy-bounds-x');
    const enemyBoundsY = debugControls.querySelector<HTMLInputElement>('#enemy-bounds-y');
    const enemyBoundsWidth =
      debugControls.querySelector<HTMLInputElement>('#enemy-bounds-width');
    const enemyBoundsHeight =
      debugControls.querySelector<HTMLInputElement>('#enemy-bounds-height');
    const enemySaveBounds = debugControls.querySelector<HTMLButtonElement>('#enemy-save-bounds');
    const enemyResetBounds = debugControls.querySelector<HTMLButtonElement>('#enemy-reset-bounds');
    const enemyApplyBoundsKindAll = debugControls.querySelector<HTMLButtonElement>(
      '#enemy-apply-bounds-kind-all'
    );
    const enemyApplyBoundsAll =
      debugControls.querySelector<HTMLButtonElement>('#enemy-apply-bounds-all');
    const enemySaveStatus = debugControls.querySelector<HTMLElement>('#enemy-save-status');
    const elementEditorControls =
      debugControls.querySelector<HTMLElement>('#element-editor-controls');
    const elementKindSelect =
      debugControls.querySelector<HTMLSelectElement>('#element-kind-select');
    const elementSelect = debugControls.querySelector<HTMLSelectElement>('#element-select');
    const elementIncluded = debugControls.querySelector<HTMLInputElement>('#element-included');
    const elementShowVisual = debugControls.querySelector<HTMLInputElement>('#element-show-visual');
    const elementShowCollision =
      debugControls.querySelector<HTMLInputElement>('#element-show-collision');
    const elementCollisionX =
      debugControls.querySelector<HTMLInputElement>('#element-collision-x');
    const elementCollisionY =
      debugControls.querySelector<HTMLInputElement>('#element-collision-y');
    const elementCollisionWidth =
      debugControls.querySelector<HTMLInputElement>('#element-collision-width');
    const elementCollisionHeight =
      debugControls.querySelector<HTMLInputElement>('#element-collision-height');
    const elementSave = debugControls.querySelector<HTMLButtonElement>('#element-save');
    const elementReset = debugControls.querySelector<HTMLButtonElement>('#element-reset');
    const elementExport = debugControls.querySelector<HTMLButtonElement>('#element-export');
    const elementExportJson =
      debugControls.querySelector<HTMLTextAreaElement>('#element-export-json');
    const elementSaveStatus =
      debugControls.querySelector<HTMLElement>('#element-save-status');
    const levelEditorControls =
      debugControls.querySelector<HTMLElement>('#level-editor-controls');
    const levelEditorScroll =
      debugControls.querySelector<HTMLInputElement>('#level-editor-scroll');
    const levelEditorLevel =
      debugControls.querySelector<HTMLSelectElement>('#level-editor-level');
    const levelEditorNewLevel =
      debugControls.querySelector<HTMLButtonElement>('#level-editor-new-level');
    const levelEditorSaveAs =
      debugControls.querySelector<HTMLButtonElement>('#level-editor-save-as');
    const levelEditorScrollReadout =
      debugControls.querySelector<HTMLElement>('#level-editor-scroll-readout');
    const levelEditorKind =
      debugControls.querySelector<HTMLSelectElement>('#level-editor-kind');
    const levelEditorPlatformRow =
      debugControls.querySelector<HTMLElement>('#level-editor-platform-row');
    const levelEditorPlatformFrame =
      debugControls.querySelector<HTMLSelectElement>('#level-editor-platform-frame');
    const levelEditorPickupRow =
      debugControls.querySelector<HTMLElement>('#level-editor-pickup-row');
    const levelEditorPickupFrame =
      debugControls.querySelector<HTMLSelectElement>('#level-editor-pickup-frame');
    const levelEditorPropRow =
      debugControls.querySelector<HTMLElement>('#level-editor-prop-row');
    const levelEditorPropFrame =
      debugControls.querySelector<HTMLSelectElement>('#level-editor-prop-frame');
    const levelEditorExitRow =
      debugControls.querySelector<HTMLElement>('#level-editor-exit-row');
    const levelEditorExitFrame =
      debugControls.querySelector<HTMLSelectElement>('#level-editor-exit-frame');
    const levelEditorHitboxes =
      debugControls.querySelector<HTMLInputElement>('#level-editor-hitboxes');
    const levelEditorAdd =
      debugControls.querySelector<HTMLButtonElement>('#level-editor-add');
    const levelEditorDelete =
      debugControls.querySelector<HTMLButtonElement>('#level-editor-delete');
    const levelEditorSave =
      debugControls.querySelector<HTMLButtonElement>('#level-editor-save');
    const levelEditorPositionX =
      debugControls.querySelector<HTMLInputElement>('#level-editor-position-x');
    const levelEditorPositionY =
      debugControls.querySelector<HTMLInputElement>('#level-editor-position-y');
    const levelEditorSelection =
      debugControls.querySelector<HTMLElement>('#level-editor-selection');
    const levelEditorSaveStatusElement =
      debugControls.querySelector<HTMLElement>('#level-editor-save-status');
    const sceneReadout = debugControls.querySelector<HTMLElement>('#scene-readout');
    const pointerReadout = debugControls.querySelector<HTMLElement>('#pointer-readout');
    const inputReadout = debugControls.querySelector<HTMLElement>('#input-readout');

    if (
      !pauseToggle ||
      !gameDebugControls ||
      !levelProgressControls ||
      !levelProgressToggles ||
      !showAssetLabels ||
      !showVisualBounds ||
      !audioControls ||
      !audioZeroSfx ||
      !audioZeroMusic ||
      !audioSfxVolume ||
      !audioSfxReadout ||
      !audioMusicVolume ||
      !audioMusicReadout ||
      !audioMuted ||
      !audioTestSfx ||
      !audioTestMusic ||
      !audioStopMusic ||
      !backgroundControls ||
      !backgroundSetSelect ||
      !backgroundLayerToggles ||
      !backgroundSaveOffsets ||
      !backgroundResetOffsets ||
      !backgroundSaveStatus ||
      !runnerControls ||
      !runnerDifficulty ||
      !runnerTerrain ||
      !runnerGaps ||
      !runnerVerticality ||
      !runnerSeed ||
      !runnerPlatformHitboxes ||
      !runnerActorHitboxes ||
      !runnerPlanView ||
      !runnerDifficultyReadout ||
      !runnerTerrainReadout ||
      !runnerGapsReadout ||
      !runnerVerticalityReadout ||
      !baselineLevelControls ||
      !baselineGapCount ||
      !baselineGapWidth ||
      !baselineAiEnabled ||
      !baselineCharacterSprite ||
      !baselineCharacterVariant ||
      !baselineHitboxes ||
      !baselineSaveConfig ||
      !baselineResetConfig ||
      !baselineSaveStatus ||
      !characterPlaygroundControls ||
      !playgroundWalkSpeed ||
      !playgroundWalkReadout ||
      !playgroundRunSpeed ||
      !playgroundRunReadout ||
      !playgroundJumpSpeed ||
      !playgroundJumpReadout ||
      !playgroundGravity ||
      !playgroundGravityReadout ||
      !playgroundCharacterScale ||
      !playgroundScaleReadout ||
      !playgroundCharacterSprite ||
      !playgroundCharacterVariant ||
      !playgroundPlatformSprites ||
      !playgroundHitboxes ||
      !playgroundTurretActive ||
      !playgroundTurretHealth ||
      !playgroundTurretHealthReadout ||
      !playgroundTurretCooldown ||
      !playgroundTurretCooldownReadout ||
      !playgroundTurretProjectileSpeed ||
      !playgroundTurretProjectileSpeedReadout ||
      !playgroundTurretRange ||
      !playgroundTurretRangeReadout ||
      !playgroundTurretDamage ||
      !playgroundTurretDamageReadout ||
      !playgroundScavengerActive ||
      !playgroundScavengerHealth ||
      !playgroundScavengerHealthReadout ||
      !playgroundScavengerPatrolSpeed ||
      !playgroundScavengerPatrolReadout ||
      !playgroundScavengerChaseSpeed ||
      !playgroundScavengerChaseReadout ||
      !playgroundScavengerSightRange ||
      !playgroundScavengerSightReadout ||
      !playgroundScavengerAttackRange ||
      !playgroundScavengerAttackReadout ||
      !playgroundScavengerCooldown ||
      !playgroundScavengerCooldownReadout ||
      !playgroundScavengerKnockback ||
      !playgroundScavengerKnockbackReadout ||
      !playgroundSaveConfig ||
      !playgroundSaveGameConfig ||
      !playgroundResetConfig ||
      !playgroundSaveStatus ||
      !gameConfigSaveStatusElement ||
      !characterGymControls ||
      !characterAnimationSelect ||
      !characterVariantSelect ||
      !characterBoundsKind ||
      !characterShowVisual ||
      !characterShowCollision ||
      !characterShowAttack ||
      !characterPlaybackRate ||
      !characterPlaybackReadout ||
      !characterAnimationFps ||
      !characterFrameReadout ||
      !characterAttackFrameStrip ||
      !characterBoundsX ||
      !characterBoundsY ||
      !characterBoundsWidth ||
      !characterBoundsHeight ||
      !characterSaveBounds ||
      !characterResetBounds ||
      !characterApplyBoundsKindAll ||
      !characterApplyBoundsAll ||
      !characterSaveStatus ||
      !enemyGymControls ||
      !enemySelect ||
      !enemyAnimationSelect ||
      !enemyBoundsKind ||
      !enemyShowVisual ||
      !enemyShowCollision ||
      !enemyShowHurt ||
      !enemyShowAttack ||
      !enemyPlaybackRate ||
      !enemyPlaybackReadout ||
      !enemyFrameReadout ||
      !enemyHurtFrameStrip ||
      !enemyAttackFrameStrip ||
      !enemyBoundsX ||
      !enemyBoundsY ||
      !enemyBoundsWidth ||
      !enemyBoundsHeight ||
      !enemySaveBounds ||
      !enemyResetBounds ||
      !enemyApplyBoundsKindAll ||
      !enemyApplyBoundsAll ||
      !enemySaveStatus ||
      !elementEditorControls ||
      !elementKindSelect ||
      !elementSelect ||
      !elementIncluded ||
      !elementShowVisual ||
      !elementShowCollision ||
      !elementCollisionX ||
      !elementCollisionY ||
      !elementCollisionWidth ||
      !elementCollisionHeight ||
      !elementSave ||
      !elementReset ||
      !elementExport ||
      !elementExportJson ||
      !elementSaveStatus ||
      !levelEditorControls ||
      !levelEditorLevel ||
      !levelEditorNewLevel ||
      !levelEditorSaveAs ||
      !levelEditorScroll ||
      !levelEditorScrollReadout ||
      !levelEditorKind ||
      !levelEditorPlatformRow ||
      !levelEditorPlatformFrame ||
      !levelEditorPickupRow ||
      !levelEditorPickupFrame ||
      !levelEditorPropRow ||
      !levelEditorPropFrame ||
      !levelEditorExitRow ||
      !levelEditorExitFrame ||
      !levelEditorHitboxes ||
      !levelEditorAdd ||
      !levelEditorDelete ||
      !levelEditorSave ||
      !levelEditorPositionX ||
      !levelEditorPositionY ||
      !levelEditorSelection ||
      !levelEditorSaveStatusElement ||
      !sceneReadout ||
      !pointerReadout ||
      !inputReadout
    ) {
      throw new Error('Debug panel controls failed to mount');
    }

    let backgroundControlsSignature = '';
    let elementOptionsSignature = '';
    let enemyAnimationOptionsSignature = '';
    let levelProgressSignature = '';
    let audioPreviewSerial = 0;

    const requestAudioPreview = (kind: AudioPreviewKind): void => {
      audioPreviewSerial += 1;
      debugStore.patchState({
        audioPreview: {
          kind,
          serial: audioPreviewSerial
        }
      });
    };

    const renderGameDebugControls = (state = debugStore.getState()): void => {
      const isGameScene = state.activeScene === SCENE_KEYS.Game;
      gameDebugControls.hidden = !isGameScene;
    };

    const renderAudioControls = (state = debugStore.getState()): void => {
      const isVisible =
        state.activeScene === SCENE_KEYS.Game ||
        state.activeScene === SCENE_KEYS.CharacterPlayground;
      const settings = settingsStore.getState();

      audioControls.hidden = !isVisible;
      audioSfxVolume.value = String(settings.sfxVolume);
      audioMusicVolume.value = String(settings.musicVolume);
      audioMuted.checked = settings.muted;
      audioSfxReadout.textContent = `${Math.round(settings.sfxVolume * 100)}%`;
      audioMusicReadout.textContent = `${Math.round(settings.musicVolume * 100)}%`;
    };

    const renderLevelProgressControls = (state = debugStore.getState()): void => {
      const isVisible =
        state.activeScene === SCENE_KEYS.LevelSelect || state.activeScene === SCENE_KEYS.Game;
      const signature = JSON.stringify({
        catalog: levelCatalog.levels,
        unlocked: state.levelProgress.unlockedLevelIds
      });

      levelProgressControls.hidden = !isVisible;

      if (signature === levelProgressSignature) {
        return;
      }

      levelProgressSignature = signature;
      levelProgressToggles.innerHTML = PLAYABLE_LEVEL_IDS.map((levelId) => {
        const level = levelCatalog.levels.find((entry) => entry.id === levelId);
        const checked = state.levelProgress.unlockedLevelIds.includes(levelId) ? ' checked' : '';
        const disabled = levelId === PLAYABLE_LEVEL_IDS[0] ? ' disabled' : '';
        return `
          <label class="toggle-row">
            <input data-level-unlock="${levelId}" type="checkbox"${checked}${disabled} />
            ${level?.title ?? levelId}
          </label>
        `;
      }).join('');

      levelProgressToggles
        .querySelectorAll<HTMLInputElement>('input[data-level-unlock]')
        .forEach((checkbox) => {
          checkbox.addEventListener('change', () => {
            const nextUnlocked = PLAYABLE_LEVEL_IDS.filter((id) => {
              if (id === PLAYABLE_LEVEL_IDS[0]) {
                return true;
              }

              return Boolean(
                levelProgressToggles.querySelector<HTMLInputElement>(
                  `input[data-level-unlock="${id}"]`
                )?.checked
              );
            });
            const progress = setUnlockedLevelIds(nextUnlocked);
            debugStore.patchState({
              levelProgress: {
                unlockedLevelIds: progress.unlockedLevelIds
              }
            });
          });
        });
    };

    const renderRunnerControls = (state = debugStore.getState()): void => {
      const isRunnerScene = state.activeScene === SCENE_KEYS.EndlessRunner;
      runnerControls.hidden = !isRunnerScene;

      runnerDifficulty.value = String(state.runnerGeneration.difficulty);
      runnerTerrain.value = String(state.runnerGeneration.terrain);
      runnerGaps.value = String(state.runnerGeneration.gaps);
      runnerVerticality.value = String(state.runnerGeneration.verticality);
      runnerSeed.value = String(state.runnerGeneration.seed);
      runnerPlatformHitboxes.checked = state.runnerGeneration.showPlatformHitboxes;
      runnerActorHitboxes.checked = state.runnerGeneration.showActorHitboxes;
      runnerPlanView.checked = state.runnerGeneration.showPlanView;

      runnerDifficultyReadout.textContent = state.runnerGeneration.difficulty.toFixed(2);
      runnerTerrainReadout.textContent = state.runnerGeneration.terrain.toFixed(2);
      runnerGapsReadout.textContent = state.runnerGeneration.gaps.toFixed(2);
      runnerVerticalityReadout.textContent = state.runnerGeneration.verticality.toFixed(2);
    };

    const renderBaselineLevelControls = (state = debugStore.getState()): void => {
      const isBaselineScene = state.activeScene === SCENE_KEYS.BaselineLevel;
      const config = normalizeBaselineLevelConfig(state.baselineLevel);

      baselineLevelControls.hidden = !isBaselineScene;
      baselineGapCount.value = String(config.gapCount);
      baselineGapWidth.value = String(config.gapWidth);
      baselineAiEnabled.checked = config.aiEnabled;
      baselineCharacterSprite.checked = config.useCharacterSprite;
      baselineCharacterVariant.value = normalizeCharacterVariantId(config.characterVariant);
      baselineHitboxes.checked = config.showHitboxes;
      baselineSaveStatus.textContent = baselineLevelSaveStatus;
    };

    const renderCharacterPlaygroundControls = (state = debugStore.getState()): void => {
      const isPlaygroundScene = state.activeScene === SCENE_KEYS.CharacterPlayground;
      const settings = normalizeCharacterPlaygroundConfig(state.characterPlayground);

      characterPlaygroundControls.hidden = !isPlaygroundScene;
      playgroundWalkSpeed.value = String(settings.walkSpeed);
      playgroundRunSpeed.value = String(settings.runSpeed);
      playgroundJumpSpeed.value = String(settings.jumpSpeed);
      playgroundGravity.value = String(settings.gravity);
      playgroundCharacterScale.value = String(settings.characterScale);
      playgroundCharacterVariant.value = normalizeCharacterVariantId(settings.characterVariant);
      playgroundCharacterSprite.checked = settings.useCharacterSprite;
      playgroundPlatformSprites.checked = settings.usePlatformSprites;
      playgroundHitboxes.checked = settings.showHitboxes;
      playgroundTurretActive.checked = settings.turretActive;
      playgroundTurretHealth.value = String(settings.turretHealth);
      playgroundTurretCooldown.value = String(settings.turretCooldownSeconds);
      playgroundTurretProjectileSpeed.value = String(settings.turretProjectileSpeed);
      playgroundTurretRange.value = String(settings.turretShootingRange);
      playgroundTurretDamage.value = String(settings.turretProjectileDamage);
      playgroundScavengerActive.checked = settings.scavengerActive;
      playgroundScavengerHealth.value = String(settings.scavengerHealth);
      playgroundScavengerPatrolSpeed.value = String(settings.scavengerPatrolSpeed);
      playgroundScavengerChaseSpeed.value = String(settings.scavengerChaseSpeed);
      playgroundScavengerSightRange.value = String(settings.scavengerSightRange);
      playgroundScavengerAttackRange.value = String(settings.scavengerAttackRange);
      playgroundScavengerCooldown.value = String(settings.scavengerAttackCooldownSeconds);
      playgroundScavengerKnockback.value = String(settings.scavengerKnockback);
      playgroundWalkReadout.textContent = String(settings.walkSpeed);
      playgroundRunReadout.textContent = String(settings.runSpeed);
      playgroundJumpReadout.textContent = String(settings.jumpSpeed);
      playgroundGravityReadout.textContent = String(settings.gravity);
      playgroundScaleReadout.textContent = `${settings.characterScale.toFixed(2)}x`;
      playgroundTurretHealthReadout.textContent = String(settings.turretHealth);
      playgroundTurretCooldownReadout.textContent =
        `${settings.turretCooldownSeconds.toFixed(2)}s`;
      playgroundTurretProjectileSpeedReadout.textContent = String(
        settings.turretProjectileSpeed
      );
      playgroundTurretRangeReadout.textContent = String(settings.turretShootingRange);
      playgroundTurretDamageReadout.textContent = String(settings.turretProjectileDamage);
      playgroundScavengerHealthReadout.textContent = String(settings.scavengerHealth);
      playgroundScavengerPatrolReadout.textContent = String(settings.scavengerPatrolSpeed);
      playgroundScavengerChaseReadout.textContent = String(settings.scavengerChaseSpeed);
      playgroundScavengerSightReadout.textContent = String(settings.scavengerSightRange);
      playgroundScavengerAttackReadout.textContent = String(settings.scavengerAttackRange);
      playgroundScavengerCooldownReadout.textContent =
        `${settings.scavengerAttackCooldownSeconds.toFixed(2)}s`;
      playgroundScavengerKnockbackReadout.textContent = String(settings.scavengerKnockback);
      playgroundSaveStatus.textContent = characterPlaygroundSaveStatus;
      gameConfigSaveStatusElement.textContent = gameConfigSaveStatus;
    };

    const syncCharacterGymGlobal = (state = debugStore.getState()): void => {
      const variantId = normalizeCharacterVariantId(state.characterGym.selectedVariantId);
      const animationId = normalizeCharacterAnimationId(
        state.characterGym.selectedAnimationId,
        variantId
      );
      const currentMarker = globalThis.__ROBIN_CHUTE_CHARACTER_GYM__;

      globalThis.__ROBIN_CHUTE_CHARACTER_GYM__ = {
        active: state.activeScene === SCENE_KEYS.CharacterGym,
        selectedAnimationId: animationId,
        selectedVariantId: variantId,
        boundsByVariant: characterBoundsByVariant,
        fpsByVariant: characterFpsByVariant,
        hitFramesByVariant: characterHitFramesByVariant,
        currentFrame: currentMarker?.currentFrame ?? 0,
        zoom: currentMarker?.zoom ?? 1
      };
    };

    const renderCharacterGymControls = (state = debugStore.getState()): void => {
      const isCharacterGymScene = state.activeScene === SCENE_KEYS.CharacterGym;
      const variantId = normalizeCharacterVariantId(state.characterGym.selectedVariantId);
      const animationId = normalizeCharacterAnimationId(
        state.characterGym.selectedAnimationId,
        variantId
      );
      const boundsKind = state.characterGym.selectedBoundsKind;
      const activeBounds = characterBoundsByVariant[variantId][animationId][boundsKind];
      const animation = getCharacterAnimation(animationId, variantId);
      const currentFrame = clampInteger(
        globalThis.__ROBIN_CHUTE_CHARACTER_GYM__?.currentFrame ?? 0,
        0,
        animation.frames - 1
      );

      characterGymControls.hidden = !isCharacterGymScene;
      characterVariantSelect.value = variantId;
      characterAnimationSelect.innerHTML = getCharacterAnimationsForVariant(variantId)
        .map(
          (availableAnimation) =>
            `<option value="${availableAnimation.id}">${availableAnimation.label}</option>`
        )
        .join('');
      characterAnimationSelect.value = animationId;
      characterBoundsKind.value = boundsKind;
      characterShowVisual.checked = state.characterGym.showVisualBounds;
      characterShowCollision.checked = state.characterGym.showCollisionBounds;
      characterShowAttack.checked = state.characterGym.showAttackBounds;
      characterPlaybackRate.value = String(state.characterGym.playbackRate);
      characterPlaybackReadout.textContent = `${state.characterGym.playbackRate.toFixed(2)}x`;
      characterAnimationFps.value = String(characterFpsByVariant[variantId][animationId]);
      characterFrameReadout.textContent = `${currentFrame + 1}/${animation.frames}`;
      characterAttackFrameStrip.innerHTML = renderFrameStripButtons(
        characterHitFramesByVariant[variantId][animationId].attack,
        currentFrame,
        'attack'
      );
      characterBoundsX.value = String(activeBounds.x);
      characterBoundsY.value = String(activeBounds.y);
      characterBoundsWidth.value = String(activeBounds.width);
      characterBoundsHeight.value = String(activeBounds.height);
      characterSaveStatus.textContent = characterBoundsSaveStatus;
      syncCharacterGymGlobal(state);
    };

    const syncEnemyGymGlobal = (state = debugStore.getState()): void => {
      const enemyId = normalizeEnemyId(state.enemyGym.selectedEnemyId);
      const currentMarker = globalThis.__ROBIN_CHUTE_ENEMY_GYM__;

      globalThis.__ROBIN_CHUTE_ENEMY_GYM__ = {
        active: state.activeScene === SCENE_KEYS.EnemyGym,
        selectedEnemyId: enemyId,
        selectedAnimationId: normalizeEnemyAnimationId(state.enemyGym.selectedAnimationId, enemyId),
        boundsByEnemy: enemyBoundsByEnemy,
        hitFramesByEnemy: enemyHitFramesByEnemy,
        currentFrame: currentMarker?.currentFrame ?? 0,
        zoom: currentMarker?.zoom ?? 1
      };
    };

    const renderEnemyGymControls = (state = debugStore.getState()): void => {
      const isEnemyGymScene = state.activeScene === SCENE_KEYS.EnemyGym;
      const enemyId = normalizeEnemyId(state.enemyGym.selectedEnemyId);
      const animations = getEnemyAnimations(enemyId);
      const nextOptionsSignature = `${enemyId}:${animations.map((animation) => animation.id).join('|')}`;
      const animationId = normalizeEnemyAnimationId(state.enemyGym.selectedAnimationId, enemyId);
      const boundsKind = normalizeEnemyBoundsKind(state.enemyGym.selectedBoundsKind);
      const activeBounds = enemyBoundsByEnemy[enemyId][animationId][boundsKind];
      const animation = getEnemyAnimation(animationId, enemyId);
      const currentFrame = clampInteger(
        globalThis.__ROBIN_CHUTE_ENEMY_GYM__?.currentFrame ?? 0,
        0,
        animation.frames - 1
      );

      if (nextOptionsSignature !== enemyAnimationOptionsSignature) {
        enemyAnimationOptionsSignature = nextOptionsSignature;
        enemyAnimationSelect.innerHTML = animations
          .map((animation) => `<option value="${animation.id}">${animation.label}</option>`)
          .join('');
      }

      if (
        enemyId !== state.enemyGym.selectedEnemyId ||
        animationId !== state.enemyGym.selectedAnimationId ||
        boundsKind !== state.enemyGym.selectedBoundsKind
      ) {
        debugStore.patchState({
          enemyGym: {
            ...state.enemyGym,
            selectedEnemyId: enemyId,
            selectedAnimationId: animationId,
            selectedBoundsKind: boundsKind
          }
        });
        return;
      }

      enemyGymControls.hidden = !isEnemyGymScene;
      enemySelect.value = enemyId;
      enemyAnimationSelect.value = animationId;
      enemyBoundsKind.value = boundsKind;
      enemyShowVisual.checked = state.enemyGym.showVisualBounds;
      enemyShowCollision.checked = state.enemyGym.showCollisionBounds;
      enemyShowHurt.checked = state.enemyGym.showHurtBounds;
      enemyShowAttack.checked = state.enemyGym.showAttackBounds;
      enemyPlaybackRate.value = String(state.enemyGym.playbackRate);
      enemyPlaybackReadout.textContent = `${state.enemyGym.playbackRate.toFixed(2)}x`;
      enemyFrameReadout.textContent = `${currentFrame + 1}/${animation.frames}`;
      enemyHurtFrameStrip.innerHTML = renderFrameStripButtons(
        enemyHitFramesByEnemy[enemyId][animationId].hurt,
        currentFrame,
        'hurt'
      );
      enemyAttackFrameStrip.innerHTML = renderFrameStripButtons(
        enemyHitFramesByEnemy[enemyId][animationId].attack,
        currentFrame,
        'attack'
      );
      enemyBoundsX.value = String(activeBounds.x);
      enemyBoundsY.value = String(activeBounds.y);
      enemyBoundsWidth.value = String(activeBounds.width);
      enemyBoundsHeight.value = String(activeBounds.height);
      enemySaveStatus.textContent = enemyBoundsSaveStatus;
      syncEnemyGymGlobal(state);
    };

    const syncGymFrameReadouts = (): void => {
      const state = debugStore.getState();

      if (state.activeScene === SCENE_KEYS.CharacterGym) {
        const variantId = normalizeCharacterVariantId(state.characterGym.selectedVariantId);
        const animationId = normalizeCharacterAnimationId(
          state.characterGym.selectedAnimationId,
          variantId
        );
        const animation = getCharacterAnimation(animationId, variantId);
        const currentFrame = clampInteger(
          globalThis.__ROBIN_CHUTE_CHARACTER_GYM__?.currentFrame ?? 0,
          0,
          animation.frames - 1
        );

        characterFrameReadout.textContent = `${currentFrame + 1}/${animation.frames}`;
        updateFrameStripCurrent(characterAttackFrameStrip, currentFrame);
      }

      if (state.activeScene === SCENE_KEYS.EnemyGym) {
        const enemyId = normalizeEnemyId(state.enemyGym.selectedEnemyId);
        const animationId = normalizeEnemyAnimationId(state.enemyGym.selectedAnimationId, enemyId);
        const animation = getEnemyAnimation(animationId, enemyId);
        const currentFrame = clampInteger(
          globalThis.__ROBIN_CHUTE_ENEMY_GYM__?.currentFrame ?? 0,
          0,
          animation.frames - 1
        );

        enemyFrameReadout.textContent = `${currentFrame + 1}/${animation.frames}`;
        updateFrameStripCurrent(enemyHurtFrameStrip, currentFrame);
        updateFrameStripCurrent(enemyAttackFrameStrip, currentFrame);
      }

      window.requestAnimationFrame(syncGymFrameReadouts);
    };
    window.requestAnimationFrame(syncGymFrameReadouts);

    const syncElementEditorGlobal = (state = debugStore.getState()): void => {
      globalThis.__ROBIN_CHUTE_ELEMENT_EDITOR__ = {
        active: state.activeScene === SCENE_KEYS.PlatformingEditor,
        selectedElementId: state.platformingEditor.selectedElementId,
        metadata: platformingMetadata
      };
    };

    const renderElementEditorControls = (state = debugStore.getState()): void => {
      const editorState = state.platformingEditor;
      const selectedKind = normalizePlatformingElementKind(editorState.selectedKind);
      const definitions = getPlatformingElementDefinitionsByKind(selectedKind);
      const definition =
        definitions.find((entry) => entry.id === editorState.selectedElementId) ??
        definitions[0] ??
        getPlatformingElementDefinition(editorState.selectedElementId);
      const metadata = platformingMetadata[definition.id];
      const isEditorScene = state.activeScene === SCENE_KEYS.PlatformingEditor;
      const nextOptionsSignature = `${selectedKind}:${definitions
        .map((entry) => entry.id)
        .join('|')}`;

      if (nextOptionsSignature !== elementOptionsSignature) {
        elementOptionsSignature = nextOptionsSignature;
        elementSelect.innerHTML = definitions
          .map((entry) => `<option value="${entry.id}">${entry.label}</option>`)
          .join('');
      }

      if (
        selectedKind !== editorState.selectedKind ||
        definition.id !== editorState.selectedElementId
      ) {
        debugStore.patchState({
          platformingEditor: {
            ...editorState,
            selectedKind,
            selectedElementId: definition.id
          }
        });
        return;
      }

      elementEditorControls.hidden = !isEditorScene;
      elementKindSelect.value = selectedKind;
      elementSelect.value = definition.id;
      elementIncluded.checked = metadata.includedInGeneration;
      elementShowVisual.checked = editorState.showVisualBounds;
      elementShowCollision.checked = editorState.showCollisionBounds;
      elementCollisionX.value = String(metadata.collision.x);
      elementCollisionY.value = String(metadata.collision.y);
      elementCollisionWidth.value = String(metadata.collision.width);
      elementCollisionHeight.value = String(metadata.collision.height);
      elementCollisionX.max = String(definition.width - 1);
      elementCollisionY.max = String(definition.height - 1);
      elementCollisionWidth.max = String(definition.width);
      elementCollisionHeight.max = String(definition.height);
      elementExportJson.value = buildPlatformingExport(platformingMetadata);
      elementSaveStatus.textContent = editorState.savedAt
        ? `Saved ${editorState.savedAt}`
        : 'Not saved this session';
      syncElementEditorGlobal(state);
    };

    const renderLevelEditorControls = (state = debugStore.getState()): void => {
      const isLevelEditorScene = state.activeScene === SCENE_KEYS.LevelEditor;
      const settings = normalizeLevelEditorSettings(state.levelEditor);
      const levelMarker = globalThis.__ROBIN_CHUTE_LEVEL_EDITOR__;
      const maxScroll = Math.max(
        0,
        (levelMarker?.level.width ?? 5600) - GAME_PROFILES[currentProfile].width
      );
      const scrollX = Math.min(settings.scrollX, maxScroll);
      const nextCatalogSignature = JSON.stringify(levelCatalog.levels);

      if (nextCatalogSignature !== levelCatalogSignature) {
        levelCatalogSignature = nextCatalogSignature;
        levelEditorLevel.innerHTML = levelCatalog.levels
          .map((level) => `<option value="${level.id}">${level.title}</option>`)
          .join('');
      }

      levelEditorControls.hidden = !isLevelEditorScene;
      levelEditorLevel.value = settings.selectedLevelId;
      levelEditorScroll.max = String(maxScroll);
      levelEditorScroll.value = String(scrollX);
      levelEditorScrollReadout.textContent = String(Math.round(scrollX));
      levelEditorKind.value = settings.selectedKind;
      levelEditorPlatformFrame.value = settings.selectedPlatformFrame;
      levelEditorPickupFrame.value = settings.selectedPickupFrame;
      levelEditorPropFrame.value = settings.selectedPropFrame;
      levelEditorExitFrame.value = settings.selectedExitFrame;
      levelEditorHitboxes.checked = settings.showHitboxes;
      levelEditorPlatformRow.hidden = settings.selectedKind !== 'platform';
      levelEditorPickupRow.hidden = settings.selectedKind !== 'pickup';
      levelEditorPropRow.hidden = settings.selectedKind !== 'prop';
      levelEditorExitRow.hidden = settings.selectedKind !== 'exit';
      levelEditorDelete.disabled = !settings.selectedObjectId;
      levelEditorPositionX.disabled = !settings.selectedObjectId;
      levelEditorPositionY.disabled = !settings.selectedObjectId;
      if (document.activeElement !== levelEditorPositionX) {
        levelEditorPositionX.value = levelMarker?.selectedObjectPosition
          ? String(levelMarker.selectedObjectPosition.x)
          : '';
      }
      if (document.activeElement !== levelEditorPositionY) {
        levelEditorPositionY.value = levelMarker?.selectedObjectPosition
          ? String(levelMarker.selectedObjectPosition.y)
          : '';
      }
      levelEditorSelection.textContent = settings.selectedObjectId
        ? `Selected ${settings.selectedKind}: ${settings.selectedObjectId}${
            levelMarker?.selectedObjectPosition
              ? ` @ ${levelMarker.selectedObjectPosition.x}, ${levelMarker.selectedObjectPosition.y}`
              : ''
          }`
        : `Objects ${levelMarker?.objectCount ?? 0} • no selection`;
      levelEditorSaveStatusElement.textContent = levelEditorSaveStatus;
    };

    const renderBackgroundControls = (state = debugStore.getState()): void => {
      const isBackgroundScene =
        state.activeScene === SCENE_KEYS.BackgroundTest ||
        state.activeScene === SCENE_KEYS.EndlessRunner ||
        state.activeScene === SCENE_KEYS.BaselineLevel ||
        state.activeScene === SCENE_KEYS.CharacterPlayground ||
        state.activeScene === SCENE_KEYS.PlatformingEditor ||
        state.activeScene === SCENE_KEYS.LevelEditor;
      backgroundControls.hidden = !isBackgroundScene;
      backgroundSetSelect.value = state.backgroundSet;
      backgroundSaveStatus.textContent = backgroundOffsetSaveStatus;

      const activeLayers = BACKGROUND_SETS[state.backgroundSet].layers;
      const signature = [
        state.activeScene,
        state.backgroundSet,
        ...activeLayers.map((layer) => `${layer.layerId}:${state.backgroundLayers[layer.layerId]}`)
      ].join('|');

      if (signature === backgroundControlsSignature) {
        syncBackgroundOffsetInputs(state, backgroundLayerToggles);
        return;
      }

      backgroundControlsSignature = signature;
      backgroundLayerToggles.innerHTML = activeLayers
        .map((layer) => {
          const isChecked = state.backgroundLayers[layer.layerId] ? ' checked' : '';
          const offset =
            state.backgroundLayerOffsets[state.backgroundSet]?.[layer.layerId] ??
            layer.tileOffsetY ??
            0;

          return `
            <div class="layer-control">
              <label class="toggle-row">
                <input
                  type="checkbox"
                  data-layer-id="${layer.layerId}"
                  data-testid="background-layer-${layer.layerId}"
                  ${isChecked}
                />
                ${layer.label}
              </label>
              <label class="number-row layer-control__offset">
                <span>Y</span>
                <input
                  type="number"
                  step="10"
                  data-offset-layer-id="${layer.layerId}"
                  data-testid="background-offset-${layer.layerId}"
                  value="${offset}"
                />
              </label>
            </div>
          `;
        })
        .join('');

      backgroundLayerToggles
        .querySelectorAll<HTMLInputElement>('input[data-layer-id]')
        .forEach((input) => {
          input.addEventListener('change', () => {
            const layerId = input.dataset.layerId as BackgroundLayerId;
            debugStore.patchState({
              backgroundLayers: {
                ...debugStore.getState().backgroundLayers,
                [layerId]: input.checked
              }
            });
          });
        });

      backgroundLayerToggles
        .querySelectorAll<HTMLInputElement>('input[data-offset-layer-id]')
        .forEach((input) => {
          input.addEventListener('input', () => {
            const layerId = input.dataset.offsetLayerId as BackgroundLayerId;
            const state = debugStore.getState();
            const currentSetOffsets = state.backgroundLayerOffsets[state.backgroundSet] ?? {};

            debugStore.patchState({
              backgroundLayerOffsets: {
                ...state.backgroundLayerOffsets,
                [state.backgroundSet]: {
                  ...currentSetOffsets,
                  [layerId]: Number(input.value) || 0
                }
              }
            });
          });
        });
    };

  pauseToggle.addEventListener('click', () => {
    debugStore.patchState({ paused: !debugStore.getState().paused });
  });

  showVisualBounds.addEventListener('change', () => {
    debugStore.patchState({ showVisualBounds: showVisualBounds.checked });
  });
  showAssetLabels.addEventListener('change', () => {
    debugStore.patchState({ showAssetLabels: showAssetLabels.checked });
  });
  audioSfxVolume.addEventListener('input', () => {
    settingsStore.patchState({ sfxVolume: Number(audioSfxVolume.value) });
  });
  audioMusicVolume.addEventListener('input', () => {
    settingsStore.patchState({ musicVolume: Number(audioMusicVolume.value) });
  });
  audioZeroSfx.addEventListener('click', () => {
    settingsStore.patchState({ sfxVolume: 0 });
  });
  audioZeroMusic.addEventListener('click', () => {
    settingsStore.patchState({ musicVolume: 0 });
    requestAudioPreview('stopMusic');
  });
  audioMuted.addEventListener('change', () => {
    settingsStore.patchState({ muted: audioMuted.checked });
  });
  audioTestSfx.addEventListener('click', () => {
    requestAudioPreview('sfx');
  });
  audioTestMusic.addEventListener('click', () => {
    requestAudioPreview('music');
  });
  audioStopMusic.addEventListener('click', () => {
    requestAudioPreview('stopMusic');
  });
  backgroundSetSelect.addEventListener('change', () => {
    const nextSetId = backgroundSetSelect.value as BackgroundSetId;

    if (nextSetId in BACKGROUND_SETS) {
      debugStore.patchState({ backgroundSet: nextSetId });
    }
  });
  backgroundSaveOffsets.addEventListener('click', async () => {
    backgroundOffsetSaveStatus = 'Saving offsets...';
    renderBackgroundControls();

    const payload = buildBackgroundLayerOffsetsExport(debugStore.getState().backgroundLayerOffsets);

    try {
      const response = await fetch(BACKGROUND_LAYER_OFFSETS_SAVE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Save failed with ${response.status}`);
      }

      backgroundOffsetSaveStatus = 'Saved public/assets/config/background-layer-offsets.json';
    } catch {
      downloadJsonFile('background-layer-offsets.json', payload);
      backgroundOffsetSaveStatus = 'Downloaded offsets JSON';
    }

    renderBackgroundControls();
  });
  backgroundResetOffsets.addEventListener('click', () => {
    const state = debugStore.getState();
    const defaultOffsets = getDefaultBackgroundOffsetsForSet(state.backgroundSet);

    backgroundOffsetSaveStatus = `Reset ${BACKGROUND_SETS[state.backgroundSet].label} offsets`;
    debugStore.patchState({
      backgroundLayerOffsets: {
        ...state.backgroundLayerOffsets,
        [state.backgroundSet]: defaultOffsets
      }
    });
  });

  const updateRunnerGeneration = (): void => {
    const current = debugStore.getState().runnerGeneration;
    debugStore.patchState({
      runnerGeneration: {
        ...current,
        difficulty: Number(runnerDifficulty.value),
        terrain: Number(runnerTerrain.value),
        gaps: Number(runnerGaps.value),
        verticality: Number(runnerVerticality.value),
        seed: Math.max(1, Math.round(Number(runnerSeed.value) || current.seed)),
        showPlatformHitboxes: runnerPlatformHitboxes.checked,
        showActorHitboxes: runnerActorHitboxes.checked,
        showPlanView: runnerPlanView.checked
      }
    });
  };
  runnerDifficulty.addEventListener('input', updateRunnerGeneration);
  runnerTerrain.addEventListener('input', updateRunnerGeneration);
  runnerGaps.addEventListener('input', updateRunnerGeneration);
  runnerVerticality.addEventListener('input', updateRunnerGeneration);
  runnerSeed.addEventListener('input', updateRunnerGeneration);
  runnerPlatformHitboxes.addEventListener('change', updateRunnerGeneration);
  runnerActorHitboxes.addEventListener('change', updateRunnerGeneration);
  runnerPlanView.addEventListener('change', updateRunnerGeneration);
  const updateBaselineLevel = (): void => {
    debugStore.patchState({
      baselineLevel: normalizeBaselineLevelConfig({
        gapCount: Number(baselineGapCount.value),
        gapWidth: Number(baselineGapWidth.value),
        aiEnabled: baselineAiEnabled.checked,
        useCharacterSprite: baselineCharacterSprite.checked,
        characterVariant: baselineCharacterVariant.value,
        showHitboxes: baselineHitboxes.checked
      })
    });
  };
  baselineGapCount.addEventListener('input', updateBaselineLevel);
  baselineGapWidth.addEventListener('input', updateBaselineLevel);
  baselineAiEnabled.addEventListener('change', updateBaselineLevel);
  baselineCharacterSprite.addEventListener('change', updateBaselineLevel);
  baselineCharacterVariant.addEventListener('change', updateBaselineLevel);
  baselineHitboxes.addEventListener('change', updateBaselineLevel);
  const updateCharacterPlayground = (): void => {
    debugStore.patchState({
      characterPlayground: normalizeCharacterPlaygroundConfig({
        walkSpeed: Number(playgroundWalkSpeed.value),
        runSpeed: Number(playgroundRunSpeed.value),
        jumpSpeed: Number(playgroundJumpSpeed.value),
        gravity: Number(playgroundGravity.value),
        characterScale: Number(playgroundCharacterScale.value),
        characterVariant: playgroundCharacterVariant.value,
        useCharacterSprite: playgroundCharacterSprite.checked,
        usePlatformSprites: playgroundPlatformSprites.checked,
        showHitboxes: playgroundHitboxes.checked,
        turretActive: playgroundTurretActive.checked,
        turretHealth: Number(playgroundTurretHealth.value),
        turretCooldownSeconds: Number(playgroundTurretCooldown.value),
        turretProjectileSpeed: Number(playgroundTurretProjectileSpeed.value),
        turretShootingRange: Number(playgroundTurretRange.value),
        turretProjectileDamage: Number(playgroundTurretDamage.value),
        scavengerActive: playgroundScavengerActive.checked,
        scavengerHealth: Number(playgroundScavengerHealth.value),
        scavengerPatrolSpeed: Number(playgroundScavengerPatrolSpeed.value),
        scavengerChaseSpeed: Number(playgroundScavengerChaseSpeed.value),
        scavengerSightRange: Number(playgroundScavengerSightRange.value),
        scavengerAttackRange: Number(playgroundScavengerAttackRange.value),
        scavengerAttackCooldownSeconds: Number(playgroundScavengerCooldown.value),
        scavengerKnockback: Number(playgroundScavengerKnockback.value)
      })
    });
  };
  playgroundWalkSpeed.addEventListener('input', updateCharacterPlayground);
  playgroundRunSpeed.addEventListener('input', updateCharacterPlayground);
  playgroundJumpSpeed.addEventListener('input', updateCharacterPlayground);
  playgroundGravity.addEventListener('input', updateCharacterPlayground);
  playgroundCharacterScale.addEventListener('input', updateCharacterPlayground);
  playgroundCharacterVariant.addEventListener('change', updateCharacterPlayground);
  playgroundCharacterSprite.addEventListener('change', updateCharacterPlayground);
  playgroundPlatformSprites.addEventListener('change', updateCharacterPlayground);
  playgroundHitboxes.addEventListener('change', updateCharacterPlayground);
  playgroundTurretActive.addEventListener('change', updateCharacterPlayground);
  playgroundTurretHealth.addEventListener('input', updateCharacterPlayground);
  playgroundTurretCooldown.addEventListener('input', updateCharacterPlayground);
  playgroundTurretProjectileSpeed.addEventListener('input', updateCharacterPlayground);
  playgroundTurretRange.addEventListener('input', updateCharacterPlayground);
  playgroundTurretDamage.addEventListener('input', updateCharacterPlayground);
  playgroundScavengerActive.addEventListener('change', updateCharacterPlayground);
  playgroundScavengerHealth.addEventListener('input', updateCharacterPlayground);
  playgroundScavengerPatrolSpeed.addEventListener('input', updateCharacterPlayground);
  playgroundScavengerChaseSpeed.addEventListener('input', updateCharacterPlayground);
  playgroundScavengerSightRange.addEventListener('input', updateCharacterPlayground);
  playgroundScavengerAttackRange.addEventListener('input', updateCharacterPlayground);
  playgroundScavengerCooldown.addEventListener('input', updateCharacterPlayground);
  playgroundScavengerKnockback.addEventListener('input', updateCharacterPlayground);
  playgroundSaveConfig.addEventListener('click', async () => {
    characterPlaygroundSaveStatus = 'Saving playground...';
    renderCharacterPlaygroundControls();

    const payload = buildCharacterPlaygroundConfigExport(
      debugStore.getState().characterPlayground
    );

    try {
      const response = await fetch(CHARACTER_PLAYGROUND_SAVE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Save failed with ${response.status}`);
      }

      characterPlaygroundSaveStatus = 'Saved public/assets/config/character-playground.json';
    } catch {
      downloadJsonFile('character-playground.json', payload);
      characterPlaygroundSaveStatus = 'Downloaded playground JSON';
    }

    renderCharacterPlaygroundControls();
  });
  playgroundSaveGameConfig.addEventListener('click', async () => {
    gameConfigSaveStatus = 'Saving game config...';
    renderCharacterPlaygroundControls();

    const config = extractGameCommonConfig(debugStore.getState());
    gameConfigStore.setState(config);
    const payload = buildGameConfigExport(config);

    try {
      const response = await fetch(GAME_CONFIG_SAVE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Save failed with ${response.status}`);
      }

      gameConfigSaveStatus = 'Saved public/assets/config/game-config.json';
    } catch {
      downloadJsonFile('game-config.json', payload);
      gameConfigSaveStatus = 'Downloaded game-config JSON';
    }

    renderCharacterPlaygroundControls();
  });
  playgroundResetConfig.addEventListener('click', () => {
    characterPlaygroundSaveStatus = 'Reset playground defaults';
    debugStore.patchState({
      characterPlayground: { ...CHARACTER_PLAYGROUND_DEFAULT_CONFIG }
    });
  });
  baselineSaveConfig.addEventListener('click', async () => {
    baselineLevelSaveStatus = 'Saving config...';
    renderBaselineLevelControls();

    const payload = buildBaselineLevelConfigExport(debugStore.getState().baselineLevel);

    try {
      const response = await fetch(BASELINE_LEVEL_SAVE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Save failed with ${response.status}`);
      }

      baselineLevelSaveStatus = 'Saved public/assets/config/baseline-level.json';
    } catch {
      downloadJsonFile('baseline-level.json', payload);
      baselineLevelSaveStatus = 'Downloaded baseline JSON';
    }

    renderBaselineLevelControls();
  });
  baselineResetConfig.addEventListener('click', () => {
    baselineLevelSaveStatus = 'Reset baseline defaults';
    debugStore.patchState({ baselineLevel: { ...BASELINE_LEVEL_DEFAULT_CONFIG } });
  });
  const patchCharacterGymState = (): void => {
    const current = debugStore.getState().characterGym;

    debugStore.patchState({
      characterGym: {
        ...current,
        selectedAnimationId: normalizeCharacterAnimationId(
          characterAnimationSelect.value,
          normalizeCharacterVariantId(characterVariantSelect.value)
        ),
        selectedVariantId: normalizeCharacterVariantId(characterVariantSelect.value),
        selectedBoundsKind: characterBoundsKind.value as 'visual' | 'collision' | 'attack',
        playbackRate: normalizePlaybackRate(Number(characterPlaybackRate.value)),
        showVisualBounds: characterShowVisual.checked,
        showCollisionBounds: characterShowCollision.checked,
        showAttackBounds: characterShowAttack.checked
      }
    });
  };
  const readCharacterBoundsInputs = (): Rect => ({
    x: Number(characterBoundsX.value) || 0,
    y: Number(characterBoundsY.value) || 0,
    width: Number(characterBoundsWidth.value) || 1,
    height: Number(characterBoundsHeight.value) || 1
  });
  const updateSelectedCharacterBounds = (): void => {
    const state = debugStore.getState().characterGym;
    const variantId = normalizeCharacterVariantId(state.selectedVariantId);
    const animationId = normalizeCharacterAnimationId(state.selectedAnimationId, variantId);
    const boundsKind = state.selectedBoundsKind;
    const previousBounds = characterBoundsByVariant[variantId][animationId][boundsKind];
    const nextBounds = preserveBoundsCenterOnResize(
      previousBounds,
      readCharacterBoundsInputs(),
      document.activeElement,
      characterBoundsWidth,
      characterBoundsHeight
    );

    characterBoundsByVariant = normalizeCharacterBoundsByVariant({
      ...characterBoundsByVariant,
      [variantId]: normalizeCharacterBoundsMap({
        ...characterBoundsByVariant[variantId],
        [animationId]: {
          ...characterBoundsByVariant[variantId][animationId],
          [boundsKind]: nextBounds
        }
      })
    });
    syncCharacterGymGlobal();
    renderCharacterGymControls();
  };
  const updateSelectedCharacterFps = (): void => {
    const state = debugStore.getState().characterGym;
    const variantId = normalizeCharacterVariantId(state.selectedVariantId);
    const animationId = normalizeCharacterAnimationId(state.selectedAnimationId, variantId);
    const nextFps = normalizeAnimationFps(Number(characterAnimationFps.value), getCharacterAnimation(animationId, variantId).fps);

    characterFpsByVariant = normalizeCharacterAnimationFpsByVariant({
      ...characterFpsByVariant,
      [variantId]: {
        ...characterFpsByVariant[variantId],
        [animationId]: nextFps
      }
    });
    characterBoundsSaveStatus = `Updated ${variantId} ${animationId} FPS; save to persist`;
    syncCharacterGymGlobal();
    renderCharacterGymControls();
  };
  const toggleSelectedCharacterHitFrame = (frameIndex: number): void => {
    const state = debugStore.getState().characterGym;
    const variantId = normalizeCharacterVariantId(state.selectedVariantId);
    const animationId = normalizeCharacterAnimationId(state.selectedAnimationId, variantId);
    const animation = getCharacterAnimation(animationId, variantId);

    if (frameIndex < 0 || frameIndex >= animation.frames) {
      return;
    }

    const currentFrames = characterHitFramesByVariant[variantId][animationId].attack;
    const nextFrames = [...currentFrames];
    nextFrames[frameIndex] = !nextFrames[frameIndex];
    characterHitFramesByVariant = normalizeCharacterHitFramesByVariant({
      ...characterHitFramesByVariant,
      [variantId]: {
        ...characterHitFramesByVariant[variantId],
        [animationId]: {
          attack: nextFrames
        }
      } as Partial<CharacterHitFramesMap>
    });
    characterBoundsSaveStatus = `Updated ${variantId} ${animationId} attack frames; save to persist`;
    syncCharacterGymGlobal();
    renderCharacterGymControls();
  };
  characterAnimationSelect.addEventListener('change', patchCharacterGymState);
  characterVariantSelect.addEventListener('change', patchCharacterGymState);
  characterBoundsKind.addEventListener('change', patchCharacterGymState);
  characterShowVisual.addEventListener('change', patchCharacterGymState);
  characterShowCollision.addEventListener('change', patchCharacterGymState);
  characterShowAttack.addEventListener('change', patchCharacterGymState);
  characterPlaybackRate.addEventListener('input', patchCharacterGymState);
  characterAnimationFps.addEventListener('input', updateSelectedCharacterFps);
  characterBoundsX.addEventListener('input', updateSelectedCharacterBounds);
  characterBoundsY.addEventListener('input', updateSelectedCharacterBounds);
  characterBoundsWidth.addEventListener('input', updateSelectedCharacterBounds);
  characterBoundsHeight.addEventListener('input', updateSelectedCharacterBounds);
  characterAttackFrameStrip.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      'button[data-frame-index]'
    );

    if (!button) {
      return;
    }

    toggleSelectedCharacterHitFrame(Number(button.dataset.frameIndex));
  });
  characterSaveBounds.addEventListener('click', async () => {
    characterBoundsSaveStatus = 'Saving bounds...';
    renderCharacterGymControls();

    const payload = buildCharacterBoundsExport(
      characterBoundsByVariant,
      characterFpsByVariant,
      characterHitFramesByVariant
    );

    try {
      const response = await fetch(CHARACTER_BOUNDS_SAVE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Save failed with ${response.status}`);
      }

      characterBoundsSaveStatus = 'Saved public/assets/config/character-bounds.json';
    } catch {
      downloadJsonFile('character-bounds.json', payload);
      characterBoundsSaveStatus = 'Downloaded character bounds JSON';
    }

    renderCharacterGymControls();
  });
  characterResetBounds.addEventListener('click', () => {
    const state = debugStore.getState().characterGym;
    const variantId = normalizeCharacterVariantId(state.selectedVariantId);
    const animationId = normalizeCharacterAnimationId(state.selectedAnimationId, variantId);

    characterBoundsByVariant = normalizeCharacterBoundsByVariant({
      ...characterBoundsByVariant,
      [variantId]: normalizeCharacterBoundsMap({
        ...characterBoundsByVariant[variantId],
        [animationId]: DEFAULT_CHARACTER_BOUNDS[animationId]
      })
    });
    characterBoundsSaveStatus = `Reset ${variantId} ${animationId} bounds`;
    syncCharacterGymGlobal();
    renderCharacterGymControls();
  });
  characterApplyBoundsKindAll.addEventListener('click', () => {
    const state = debugStore.getState().characterGym;
    const variantId = normalizeCharacterVariantId(state.selectedVariantId);
    const boundsKind = state.selectedBoundsKind;
    const activeBounds = readCharacterBoundsInputs();

    characterBoundsByVariant = normalizeCharacterBoundsByVariant({
      ...characterBoundsByVariant,
      [variantId]: normalizeCharacterBoundsMap(
        Object.fromEntries(
          getCharacterAnimationsForVariant(variantId).map((animation) => [
            animation.id,
            {
              ...characterBoundsByVariant[variantId][animation.id],
              [boundsKind]: { ...activeBounds }
            }
          ])
        ) as Partial<CharacterBoundsMap>
      )
    });
    characterBoundsSaveStatus = `Applied ${variantId} ${boundsKind} bounds to all animations; save to persist`;
    syncCharacterGymGlobal();
    renderCharacterGymControls();
  });
  characterApplyBoundsAll.addEventListener('click', () => {
    const state = debugStore.getState().characterGym;
    const variantId = normalizeCharacterVariantId(state.selectedVariantId);
    const animationId = normalizeCharacterAnimationId(state.selectedAnimationId, variantId);
    const sourceBounds = {
      ...characterBoundsByVariant[variantId][animationId],
      [state.selectedBoundsKind]: readCharacterBoundsInputs()
    };

    characterBoundsByVariant = normalizeCharacterBoundsByVariant({
      ...characterBoundsByVariant,
      [variantId]: normalizeCharacterBoundsMap(
        Object.fromEntries(
          getCharacterAnimationsForVariant(variantId).map((animation) => [
            animation.id,
            {
              visual: { ...sourceBounds.visual },
              collision: { ...sourceBounds.collision },
              attack: { ...sourceBounds.attack }
            }
          ])
        ) as Partial<CharacterBoundsMap>
      )
    });
    characterBoundsSaveStatus = `Applied all ${variantId} ${animationId} bounds to all animations; save to persist`;
    syncCharacterGymGlobal();
    renderCharacterGymControls();
  });
  const readEnemyGymSelection = (): {
    enemyId: EnemyId;
    animationId: EnemyAnimationId;
    boundsKind: EnemyBoundsKind;
  } => {
    const current = debugStore.getState().enemyGym;
    const enemyId = normalizeEnemyId(enemySelect.value || current.selectedEnemyId);

    return {
      enemyId,
      animationId: normalizeEnemyAnimationId(
        enemyAnimationSelect.value || current.selectedAnimationId,
        enemyId
      ),
      boundsKind: normalizeEnemyBoundsKind(enemyBoundsKind.value || current.selectedBoundsKind)
    };
  };

  const patchEnemyGymSelectionState = (selection = readEnemyGymSelection()): boolean => {
    const current = debugStore.getState().enemyGym;

    if (
      current.selectedEnemyId === selection.enemyId &&
      current.selectedAnimationId === selection.animationId &&
      current.selectedBoundsKind === selection.boundsKind
    ) {
      return false;
    }

    debugStore.patchState({
      enemyGym: {
        ...current,
        selectedEnemyId: selection.enemyId,
        selectedAnimationId: selection.animationId,
        selectedBoundsKind: selection.boundsKind,
        playbackRate: normalizePlaybackRate(Number(enemyPlaybackRate.value)),
        showVisualBounds: enemyShowVisual.checked,
        showCollisionBounds: enemyShowCollision.checked,
        showHurtBounds: enemyShowHurt.checked,
        showAttackBounds: enemyShowAttack.checked
      }
    });

    return true;
  };

  const patchEnemyGymState = (): void => {
    const current = debugStore.getState().enemyGym;
    const selection = readEnemyGymSelection();

    debugStore.patchState({
      enemyGym: {
        ...current,
        selectedEnemyId: selection.enemyId,
        selectedAnimationId: selection.animationId,
        selectedBoundsKind: selection.boundsKind,
        playbackRate: normalizePlaybackRate(Number(enemyPlaybackRate.value)),
        showVisualBounds: enemyShowVisual.checked,
        showCollisionBounds: enemyShowCollision.checked,
        showHurtBounds: enemyShowHurt.checked,
        showAttackBounds: enemyShowAttack.checked
      }
    });
  };
  const readEnemyBoundsInputs = (): Rect => ({
    x: Number(enemyBoundsX.value) || 0,
    y: Number(enemyBoundsY.value) || 0,
    width: Number(enemyBoundsWidth.value) || 1,
    height: Number(enemyBoundsHeight.value) || 1
  });
  const updateSelectedEnemyBounds = (): void => {
    const { enemyId, animationId, boundsKind } = readEnemyGymSelection();
    const previousBounds = enemyBoundsByEnemy[enemyId][animationId][boundsKind];
    const nextBounds = preserveBoundsCenterOnResize(
      previousBounds,
      readEnemyBoundsInputs(),
      document.activeElement,
      enemyBoundsWidth,
      enemyBoundsHeight
    );

    enemyBoundsByEnemy = {
      ...enemyBoundsByEnemy,
      [enemyId]: normalizeEnemyBoundsMap({
        ...enemyBoundsByEnemy[enemyId],
        [animationId]: {
          ...enemyBoundsByEnemy[enemyId][animationId],
          [boundsKind]: nextBounds
        }
      }, enemyId)
    };
    enemyBoundsSaveStatus = `Updated ${enemyId} ${animationId} ${boundsKind}; save to persist`;

    if (!patchEnemyGymSelectionState({ enemyId, animationId, boundsKind })) {
      syncEnemyGymGlobal();
      renderEnemyGymControls();
    }
  };
  const toggleSelectedEnemyHitFrame = (kind: 'hurt' | 'attack', frameIndex: number): void => {
    const { enemyId, animationId } = readEnemyGymSelection();
    const animation = getEnemyAnimation(animationId, enemyId);

    if (frameIndex < 0 || frameIndex >= animation.frames) {
      return;
    }

    const currentFrames = enemyHitFramesByEnemy[enemyId][animationId][kind];
    const nextFrames = [...currentFrames];
    nextFrames[frameIndex] = !nextFrames[frameIndex];
    enemyHitFramesByEnemy = {
      ...enemyHitFramesByEnemy,
      [enemyId]: normalizeEnemyHitFramesMap(
        {
          ...enemyHitFramesByEnemy[enemyId],
          [animationId]: {
            ...enemyHitFramesByEnemy[enemyId][animationId],
            [kind]: nextFrames
          }
        },
        enemyId
      )
    };
    enemyBoundsSaveStatus = `Updated ${enemyId} ${animationId} ${kind} frames; save to persist`;
    syncEnemyGymGlobal();
    renderEnemyGymControls();
  };
  enemySelect.addEventListener('change', patchEnemyGymState);
  enemyAnimationSelect.addEventListener('change', patchEnemyGymState);
  enemyBoundsKind.addEventListener('change', patchEnemyGymState);
  enemyShowVisual.addEventListener('change', patchEnemyGymState);
  enemyShowCollision.addEventListener('change', patchEnemyGymState);
  enemyShowHurt.addEventListener('change', patchEnemyGymState);
  enemyShowAttack.addEventListener('change', patchEnemyGymState);
  enemyPlaybackRate.addEventListener('input', patchEnemyGymState);
  enemyBoundsX.addEventListener('input', updateSelectedEnemyBounds);
  enemyBoundsY.addEventListener('input', updateSelectedEnemyBounds);
  enemyBoundsWidth.addEventListener('input', updateSelectedEnemyBounds);
  enemyBoundsHeight.addEventListener('input', updateSelectedEnemyBounds);
  enemyHurtFrameStrip.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      'button[data-frame-index]'
    );

    if (!button) {
      return;
    }

    toggleSelectedEnemyHitFrame('hurt', Number(button.dataset.frameIndex));
  });
  enemyAttackFrameStrip.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      'button[data-frame-index]'
    );

    if (!button) {
      return;
    }

    toggleSelectedEnemyHitFrame('attack', Number(button.dataset.frameIndex));
  });
  enemySaveBounds.addEventListener('click', async () => {
    enemyBoundsSaveStatus = 'Saving bounds...';
    renderEnemyGymControls();

    const payload = buildEnemyBoundsExport(enemyBoundsByEnemy, enemyHitFramesByEnemy);

    try {
      const response = await fetch(ENEMY_BOUNDS_SAVE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Save failed with ${response.status}`);
      }

      enemyBoundsSaveStatus = 'Saved public/assets/config/enemy-bounds.json';
    } catch {
      downloadJsonFile('enemy-bounds.json', payload);
      enemyBoundsSaveStatus = 'Downloaded enemy bounds JSON';
    }

    renderEnemyGymControls();
  });
  enemyResetBounds.addEventListener('click', () => {
    const { enemyId, animationId } = readEnemyGymSelection();

    enemyBoundsByEnemy = {
      ...enemyBoundsByEnemy,
      [enemyId]: normalizeEnemyBoundsMap({
        ...enemyBoundsByEnemy[enemyId],
        [animationId]: DEFAULT_ENEMY_BOUNDS_BY_ENEMY[enemyId][animationId]
      }, enemyId)
    };
    enemyBoundsSaveStatus = `Reset ${enemyId} ${animationId} bounds`;
    if (!patchEnemyGymSelectionState({ ...readEnemyGymSelection(), enemyId, animationId })) {
      syncEnemyGymGlobal();
      renderEnemyGymControls();
    }
  });
  enemyApplyBoundsKindAll.addEventListener('click', () => {
    const { enemyId, boundsKind } = readEnemyGymSelection();
    const activeBounds = readEnemyBoundsInputs();

    enemyBoundsByEnemy = {
      ...enemyBoundsByEnemy,
      [enemyId]: normalizeEnemyBoundsMap(
        Object.fromEntries(
          getEnemyAnimations(enemyId).map((animation) => [
            animation.id,
            {
              ...enemyBoundsByEnemy[enemyId][animation.id],
              [boundsKind]: { ...activeBounds }
            }
          ])
        ) as Partial<EnemyBoundsMap>,
        enemyId
      )
    };
    enemyBoundsSaveStatus = `Applied ${enemyId} ${boundsKind} bounds to all animations; save to persist`;
    if (!patchEnemyGymSelectionState({ ...readEnemyGymSelection(), enemyId, boundsKind })) {
      syncEnemyGymGlobal();
      renderEnemyGymControls();
    }
  });
  enemyApplyBoundsAll.addEventListener('click', () => {
    const { enemyId, animationId, boundsKind } = readEnemyGymSelection();
    const sourceBounds = {
      ...enemyBoundsByEnemy[enemyId][animationId],
      [boundsKind]: readEnemyBoundsInputs()
    };

    enemyBoundsByEnemy = {
      ...enemyBoundsByEnemy,
      [enemyId]: normalizeEnemyBoundsMap(
        Object.fromEntries(
          getEnemyAnimations(enemyId).map((animation) => [
            animation.id,
            {
              visual: { ...sourceBounds.visual },
              collision: { ...sourceBounds.collision },
              hurt: { ...sourceBounds.hurt },
              attack: { ...sourceBounds.attack }
            }
          ])
        ) as Partial<EnemyBoundsMap>,
        enemyId
      )
    };
    enemyBoundsSaveStatus = `Applied all ${enemyId} ${animationId} bounds to all animations; save to persist`;
    if (!patchEnemyGymSelectionState({ enemyId, animationId, boundsKind })) {
      syncEnemyGymGlobal();
      renderEnemyGymControls();
    }
  });
  const updateSelectedElement = (): void => {
    const current = debugStore.getState().platformingEditor;
    const selectedElementId = elementSelect.value;
    debugStore.patchState({
      platformingEditor: {
        ...current,
        selectedElementId
      }
    });
  };
  const updateSelectedElementKind = (): void => {
    const current = debugStore.getState().platformingEditor;
    const selectedKind = normalizePlatformingElementKind(elementKindSelect.value);
    const definitions = getPlatformingElementDefinitionsByKind(selectedKind);
    const selectedElementId = definitions.some(
      (definition) => definition.id === current.selectedElementId
    )
      ? current.selectedElementId
      : definitions[0]?.id ?? current.selectedElementId;

    debugStore.patchState({
      platformingEditor: {
        ...current,
        selectedKind,
        selectedElementId
      }
    });
  };
  const updateSelectedElementMetadata = (): void => {
    const current = debugStore.getState().platformingEditor;
    const definition = getPlatformingElementDefinition(current.selectedElementId);
    const x = Number(elementCollisionX.value) || 0;
    const y = Number(elementCollisionY.value) || 0;
    const width = Number(elementCollisionWidth.value) || definition.defaultCollision.width;
    const height = Number(elementCollisionHeight.value) || definition.defaultCollision.height;

    platformingMetadata = normalizePlatformingMetadata({
      ...platformingMetadata,
      [definition.id]: {
        id: definition.id,
        includedInGeneration: elementIncluded.checked,
        collision: {
          x,
          y,
          width,
          height
        }
      }
    });
    syncElementEditorGlobal();
    renderElementEditorControls();
  };
  const updateElementEditorToggles = (): void => {
    const current = debugStore.getState().platformingEditor;

    debugStore.patchState({
      platformingEditor: {
        ...current,
        showVisualBounds: elementShowVisual.checked,
        showCollisionBounds: elementShowCollision.checked
      }
    });
  };
  elementKindSelect.addEventListener('change', updateSelectedElementKind);
  elementSelect.addEventListener('change', updateSelectedElement);
  elementIncluded.addEventListener('change', updateSelectedElementMetadata);
  elementCollisionX.addEventListener('input', updateSelectedElementMetadata);
  elementCollisionY.addEventListener('input', updateSelectedElementMetadata);
  elementCollisionWidth.addEventListener('input', updateSelectedElementMetadata);
  elementCollisionHeight.addEventListener('input', updateSelectedElementMetadata);
  elementShowVisual.addEventListener('change', updateElementEditorToggles);
  elementShowCollision.addEventListener('change', updateElementEditorToggles);
  elementReset.addEventListener('click', () => {
    const current = debugStore.getState().platformingEditor;
    const defaults = createDefaultPlatformingMetadata();

    platformingMetadata = normalizePlatformingMetadata({
      ...platformingMetadata,
      [current.selectedElementId]: defaults[current.selectedElementId]
    });
    syncElementEditorGlobal();
    renderElementEditorControls();
  });
  elementSave.addEventListener('click', async () => {
    const savedAt = new Date().toISOString();
    const payload = buildPlatformingExport(platformingMetadata);
    window.localStorage.setItem(PLATFORMING_EDITOR_STORAGE_KEY, payload);

    try {
      const response = await fetch(PLATFORMING_METADATA_SAVE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });

      if (!response.ok) {
        throw new Error(`Save failed with ${response.status}`);
      }
    } catch {
      downloadJsonFile('platforming-elements.json', JSON.parse(payload) as object);
    }

    debugStore.patchState({
      platformingEditor: {
        ...debugStore.getState().platformingEditor,
        savedAt
      }
    });
  });
  elementExport.addEventListener('click', () => {
    const blob = new Blob([buildPlatformingExport(platformingMetadata)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'platforming-elements-metadata.json';
    link.click();
    URL.revokeObjectURL(url);
  });

  const updateLevelEditor = (): void => {
    const current = debugStore.getState().levelEditor;
    debugStore.patchState({
      levelEditor: normalizeLevelEditorSettings({
        ...current,
        selectedLevelId: levelEditorLevel.value,
        scrollX: Number(levelEditorScroll.value),
        selectedKind: levelEditorKind.value as LevelEditorSettings['selectedKind'],
        selectedPlatformFrame: levelEditorPlatformFrame.value,
        selectedPickupFrame: levelEditorPickupFrame.value,
        selectedPropFrame: levelEditorPropFrame.value,
        selectedExitFrame: levelEditorExitFrame.value,
        showHitboxes: levelEditorHitboxes.checked
      })
    });
  };
  levelEditorLevel.addEventListener('change', updateLevelEditor);
  levelEditorScroll.addEventListener('input', updateLevelEditor);
  levelEditorKind.addEventListener('change', updateLevelEditor);
  levelEditorPlatformFrame.addEventListener('change', updateLevelEditor);
  levelEditorPickupFrame.addEventListener('change', updateLevelEditor);
  levelEditorPropFrame.addEventListener('change', updateLevelEditor);
  levelEditorExitFrame.addEventListener('change', updateLevelEditor);
  levelEditorHitboxes.addEventListener('change', updateLevelEditor);
  levelEditorAdd.addEventListener('click', () => {
    const current = debugStore.getState().levelEditor;
    debugStore.patchState({
      levelEditor: normalizeLevelEditorSettings({
        ...current,
        command: 'add',
        commandSerial: current.commandSerial + 1
      })
    });
  });
  levelEditorDelete.addEventListener('click', () => {
    const current = debugStore.getState().levelEditor;
    debugStore.patchState({
      levelEditor: normalizeLevelEditorSettings({
        ...current,
        command: 'delete',
        commandSerial: current.commandSerial + 1
      })
    });
  });
  const moveSelectedLevelObjectBy = (deltaX: number, deltaY: number): void => {
    const current = debugStore.getState().levelEditor;

    debugStore.patchState({
      levelEditor: normalizeLevelEditorSettings({
        ...current,
        command: 'move',
        moveDeltaX: deltaX,
        moveDeltaY: deltaY,
        commandSerial: current.commandSerial + 1
      })
    });
  };
  const setSelectedLevelObjectPosition = (): void => {
    const marker = globalThis.__ROBIN_CHUTE_LEVEL_EDITOR__;
    const position = marker?.selectedObjectPosition;

    if (!position) {
      return;
    }

    const nextX = Number(levelEditorPositionX.value);
    const nextY = Number(levelEditorPositionY.value);

    if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) {
      return;
    }

    moveSelectedLevelObjectBy(Math.round(nextX) - position.x, Math.round(nextY) - position.y);
  };
  levelEditorPositionX.addEventListener('change', setSelectedLevelObjectPosition);
  levelEditorPositionY.addEventListener('change', setSelectedLevelObjectPosition);
  const upsertLevelCatalogEntry = (id: string, title: string): void => {
    const entry = {
      id,
      title,
      path: `levels/${id}.json`,
      url: getLevelUrl(id)
    };
    levelCatalog = normalizeLevelCatalog({
      version: 1,
      levels: [
        ...levelCatalog.levels.filter((level) => level.id !== id),
        entry
      ].sort((a, b) => a.title.localeCompare(b.title))
    });
  };
  const saveLevel = async (levelId: string, title: string): Promise<boolean> => {
    const levelMarker = globalThis.__ROBIN_CHUTE_LEVEL_EDITOR__;

    if (!levelMarker?.level) {
      levelEditorSaveStatus = 'No level editor scene data available';
      renderLevelEditorControls();
      return false;
    }

    upsertLevelCatalogEntry(levelId, title);
    const payload = {
      level: buildLevelExport({
        ...levelMarker.level,
        id: levelId,
        title
      }),
      catalog: levelCatalog
    };

    try {
      const response = await fetch(LEVELS_SAVE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Save failed with ${response.status}`);
      }

      levelEditorSaveStatus = `Saved public/assets/levels/${levelId}.json`;
      return true;
    } catch {
      downloadJsonFile(`${levelId}.json`, payload.level);
      levelEditorSaveStatus = `Downloaded ${levelId}.json`;
      return false;
    } finally {
      renderLevelEditorControls();
    }
  };
  levelEditorNewLevel.addEventListener('click', () => {
    const rawId = window.prompt('New level id, e.g. forest-test-02');
    const id = normalizeLevelEditorSettings({ selectedLevelId: rawId ?? undefined }).selectedLevelId;

    if (!rawId || !id) {
      return;
    }

    const title = window.prompt('Level title', id) ?? id;
    upsertLevelCatalogEntry(id, title);
    const current = debugStore.getState().levelEditor;
    debugStore.patchState({
      levelEditor: normalizeLevelEditorSettings({
        ...current,
        selectedLevelId: id,
        selectedObjectId: null,
        scrollX: 0
      })
    });
    levelEditorSaveStatus = `Created unsaved level ${id}`;
    renderLevelEditorControls();
  });
  levelEditorSaveAs.addEventListener('click', async () => {
    const current = debugStore.getState().levelEditor;
    const rawId = window.prompt('Save as level id', `${current.selectedLevelId}-copy`);
    const id = normalizeLevelEditorSettings({ selectedLevelId: rawId ?? undefined }).selectedLevelId;

    if (!rawId || !id) {
      return;
    }

    const title = window.prompt('Level title', id) ?? id;
    levelEditorSaveStatus = `Saving ${id}.json...`;
    renderLevelEditorControls();

    if (await saveLevel(id, title)) {
      debugStore.patchState({
        levelEditor: normalizeLevelEditorSettings({
          ...current,
          selectedLevelId: id,
          selectedObjectId: null
        })
      });
    }
  });
  levelEditorSave.addEventListener('click', async () => {
    const levelMarker = globalThis.__ROBIN_CHUTE_LEVEL_EDITOR__;

    if (!levelMarker?.level) {
      levelEditorSaveStatus = 'No level editor scene data available';
      renderLevelEditorControls();
      return;
    }

    const current = debugStore.getState().levelEditor;
    const catalogEntry = levelCatalog.levels.find((level) => level.id === current.selectedLevelId);
    const title = catalogEntry?.title || levelMarker.level.title || current.selectedLevelId;
    levelEditorSaveStatus = `Saving ${current.selectedLevelId}.json...`;
    renderLevelEditorControls();

    await saveLevel(current.selectedLevelId, title);
  });

  collapseButton.addEventListener('click', () => {
    debugPanel.classList.toggle('is-collapsed');
    collapseButton.textContent = debugPanel.classList.contains('is-collapsed') ? 'Expand' : 'Collapse';
  });

  playToggle.addEventListener('click', () => {
    if (appShell.classList.contains('is-play-mode')) {
      exitPlayMode();
    } else {
      enterPlayMode();
    }
  });

  profileToggle.addEventListener('click', () => {
    const next: GameProfile = currentProfile === 'landscape' ? 'portrait' : 'landscape';
    remountGame(next);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      exitPlayMode();
    }
  });

  debugStore.subscribe((state) => {
    sceneBadge.textContent = state.activeScene;
    sceneReadout.textContent = state.activeScene;
    showVisualBounds.checked = state.showVisualBounds;
    showAssetLabels.checked = state.showAssetLabels;
    pauseToggle.textContent = state.paused ? 'Resume' : 'Pause';
    pointerReadout.textContent = `${Math.round(state.pointer.x)}, ${Math.round(state.pointer.y)}`;
    renderGameDebugControls(state);
    renderAudioControls(state);
    renderLevelProgressControls(state);
    renderRunnerControls(state);
    renderBaselineLevelControls(state);
    renderCharacterPlaygroundControls(state);
    renderCharacterGymControls(state);
    renderEnemyGymControls(state);
    renderElementEditorControls(state);
    renderLevelEditorControls(state);
    renderBackgroundControls(state);

    const activeInputs = [
      state.input.up ? 'up' : '',
      state.input.down ? 'down' : '',
      state.input.left ? 'left' : '',
      state.input.right ? 'right' : '',
      state.input.pointerDown ? 'pointer' : ''
    ].filter(Boolean);

    inputReadout.textContent = activeInputs.length > 0 ? activeInputs.join(' + ') : 'idle';
  });
  settingsStore.subscribe(() => {
    renderAudioControls(debugStore.getState());
  });
  renderGameDebugControls();
  renderAudioControls();
  renderLevelProgressControls();
  renderRunnerControls();
  renderBaselineLevelControls();
  renderCharacterPlaygroundControls();
  renderCharacterGymControls();
  renderEnemyGymControls();
  renderElementEditorControls();
  renderLevelEditorControls();
  renderBackgroundControls();
  void loadLevelCatalog().then((catalog) => {
    levelCatalog = catalog;
    levelProgressSignature = '';
    renderLevelProgressControls();
    renderLevelEditorControls();
  });
  }

  remountGame(currentProfile);
}

function loadPlatformingMetadata(): PlatformingElementMetadataMap {
  try {
    const raw = window.localStorage.getItem(PLATFORMING_EDITOR_STORAGE_KEY);

    if (!raw) {
      return createDefaultPlatformingMetadata();
    }

    const parsed = JSON.parse(raw) as { elements?: PlatformingElementMetadataMap };
    const elements = parsed.elements ?? (parsed as PlatformingElementMetadataMap);
    return normalizePlatformingMetadata(elements);
  } catch {
    return createDefaultPlatformingMetadata();
  }
}

async function loadPlatformingMetadataConfig(): Promise<PlatformingElementMetadataMap | null> {
  try {
    const response = await fetch(PLATFORMING_METADATA_FILE, { cache: 'no-store' });

    if (!response.ok) {
      return null;
    }

    return normalizePlatformingMetadataConfig(await response.json());
  } catch {
    return null;
  }
}

async function loadLevelCatalog(): Promise<LevelCatalog> {
  try {
    const response = await fetch(LEVELS_INDEX_URL, { cache: 'no-store' });

    if (!response.ok) {
      return DEFAULT_LEVEL_CATALOG;
    }

    return normalizeLevelCatalog(await response.json());
  } catch {
    return DEFAULT_LEVEL_CATALOG;
  }
}

function buildPlatformingExport(metadata: PlatformingElementMetadataMap): string {
  return JSON.stringify(
    {
      version: 1,
      atlas: 'gameplay-platforming-v1',
      savedAt: new Date().toISOString(),
      elements: metadata
    },
    null,
    2
  );
}

async function loadBackgroundLayerOffsets(debugStore: ReturnType<typeof createDebugStore>): Promise<boolean> {
  try {
    const response = await fetch(BACKGROUND_LAYER_OFFSETS_FILE, { cache: 'no-store' });

    if (!response.ok) {
      return false;
    }

    const parsed = (await response.json()) as {
      backgroundLayerOffsets?: Partial<BackgroundLayerOffsets>;
    };
    const backgroundLayerOffsets = normalizeBackgroundLayerOffsets(parsed.backgroundLayerOffsets);

    if (!backgroundLayerOffsets) {
      return false;
    }

    debugStore.patchState({ backgroundLayerOffsets });
    return true;
  } catch {
    return false;
  }
}

async function loadBaselineLevelConfig(debugStore: ReturnType<typeof createDebugStore>): Promise<boolean> {
  try {
    const response = await fetch(BASELINE_LEVEL_CONFIG_FILE, { cache: 'no-store' });

    if (!response.ok) {
      return false;
    }

    const parsed = (await response.json()) as {
      baselineLevel?: Partial<BaselineLevelSettings>;
    };

    debugStore.patchState({
      baselineLevel: normalizeBaselineLevelConfig(parsed.baselineLevel)
    });
    return true;
  } catch {
    return false;
  }
}

async function loadGameConfig(
  gameConfigStore: ReturnType<typeof createGameConfigStore>
): Promise<boolean> {
  try {
    const response = await fetch(GAME_CONFIG_FILE, { cache: 'no-store' });

    if (!response.ok) {
      return false;
    }

    const parsed = (await response.json()) as {
      gameConfig?: Partial<GameCommonConfig>;
    };

    gameConfigStore.setState(normalizeGameCommonConfig(parsed.gameConfig));
    return true;
  } catch {
    return false;
  }
}

async function loadCharacterPlaygroundConfig(
  debugStore: ReturnType<typeof createDebugStore>
): Promise<boolean> {
  try {
    const response = await fetch(CHARACTER_PLAYGROUND_CONFIG_FILE, { cache: 'no-store' });

    if (!response.ok) {
      return false;
    }

    const parsed = (await response.json()) as {
      characterPlayground?: Partial<CharacterPlaygroundSettings>;
    };

    debugStore.patchState({
      characterPlayground: normalizeCharacterPlaygroundConfig(parsed.characterPlayground)
    });
    return true;
  } catch {
    return false;
  }
}

async function loadCharacterBounds(): Promise<{
  boundsByVariant: CharacterBoundsByVariant;
  fpsByVariant: CharacterAnimationFpsByVariant;
  hitFramesByVariant: CharacterHitFramesByVariant;
} | null> {
  try {
    const response = await fetch(CHARACTER_BOUNDS_FILE, { cache: 'no-store' });

    if (!response.ok) {
      return null;
    }

    const parsed = (await response.json()) as {
      bounds?: Partial<CharacterBoundsMap>;
      variants?: Partial<CharacterBoundsByVariant>;
      fps?: Partial<CharacterAnimationFpsMap>;
      fpsByVariant?: Partial<CharacterAnimationFpsByVariant>;
      hitFrames?: Partial<CharacterHitFramesMap>;
      hitFramesByVariant?: Partial<CharacterHitFramesByVariant>;
    };

    return {
      boundsByVariant: normalizeCharacterBoundsByVariant(parsed.variants, parsed.bounds),
      fpsByVariant: normalizeCharacterAnimationFpsByVariant(parsed.fpsByVariant, parsed.fps),
      hitFramesByVariant: normalizeCharacterHitFramesByVariant(
        parsed.hitFramesByVariant,
        parsed.hitFrames
      )
    };
  } catch {
    return null;
  }
}

async function loadEnemyBounds(): Promise<{
  boundsByEnemy: EnemyBoundsByEnemy;
  hitFramesByEnemy: EnemyHitFramesByEnemy;
} | null> {
  try {
    const response = await fetch(ENEMY_BOUNDS_FILE, { cache: 'no-store' });

    if (!response.ok) {
      return null;
    }

    const parsed = await response.json();

    return {
      boundsByEnemy: normalizeEnemyBoundsByEnemy(parsed),
      hitFramesByEnemy: normalizeEnemyHitFramesByEnemy(parsed)
    };
  } catch {
    return null;
  }
}

function buildBackgroundLayerOffsetsExport(backgroundLayerOffsets: BackgroundLayerOffsets): {
  version: number;
  savedAt: string;
  backgroundLayerOffsets: BackgroundLayerOffsets;
} {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    backgroundLayerOffsets
  };
}

function buildBaselineLevelConfigExport(baselineLevel: BaselineLevelSettings): {
  version: number;
  savedAt: string;
  baselineLevel: BaselineLevelSettings;
} {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    baselineLevel: normalizeBaselineLevelConfig(baselineLevel)
  };
}

function buildCharacterPlaygroundConfigExport(
  characterPlayground: CharacterPlaygroundSettings
): {
  version: number;
  savedAt: string;
  characterPlayground: CharacterPlaygroundSettings;
} {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    characterPlayground: normalizeCharacterPlaygroundConfig(characterPlayground)
  };
}

function buildCharacterBoundsExport(
  boundsByVariant: CharacterBoundsByVariant,
  fpsByVariant: CharacterAnimationFpsByVariant,
  hitFramesByVariant: CharacterHitFramesByVariant
): {
  version: number;
  savedAt: string;
  characterId: string;
  bounds: CharacterBoundsMap;
  variants: CharacterBoundsByVariant;
  fps: CharacterAnimationFpsMap;
  fpsByVariant: CharacterAnimationFpsByVariant;
  hitFrames: CharacterHitFramesMap;
  hitFramesByVariant: CharacterHitFramesByVariant;
} {
  const variants = normalizeCharacterBoundsByVariant(boundsByVariant);
  const normalizedFps = normalizeCharacterAnimationFpsByVariant(fpsByVariant);
  const normalizedHitFrames = normalizeCharacterHitFramesByVariant(hitFramesByVariant);

  return {
    version: 3,
    savedAt: new Date().toISOString(),
    characterId: 'robinchute-char',
    bounds: variants.snap,
    variants,
    fps: normalizedFps.snap,
    fpsByVariant: normalizedFps,
    hitFrames: normalizedHitFrames.snap,
    hitFramesByVariant: normalizedHitFrames
  };
}

function buildEnemyBoundsExport(
  boundsByEnemy: EnemyBoundsByEnemy,
  hitFramesByEnemy: EnemyHitFramesByEnemy
): {
  version: number;
  savedAt: string;
  enemyId: string;
  bounds: EnemyBoundsMap;
  hitFrames: EnemyHitFramesMap;
  enemies: Record<EnemyId, { bounds: EnemyBoundsMap; hitFrames: EnemyHitFramesMap }>;
} {
  const normalizedBounds = normalizeEnemyBoundsByEnemy({ enemies: boundsByEnemy });
  const normalizedHitFrames = normalizeEnemyHitFramesByEnemy({
    enemies: hitFramesByEnemy
  });

  return {
    version: 2,
    savedAt: new Date().toISOString(),
    enemyId: TURRET_ENEMY_ID,
    bounds: normalizedBounds[TURRET_ENEMY_ID],
    hitFrames: normalizedHitFrames[TURRET_ENEMY_ID],
    enemies: {
      [TURRET_ENEMY_ID]: {
        bounds: normalizedBounds[TURRET_ENEMY_ID],
        hitFrames: normalizedHitFrames[TURRET_ENEMY_ID]
      },
      [SCAVENGER_BOT_ENEMY_ID]: {
        bounds: normalizedBounds[SCAVENGER_BOT_ENEMY_ID],
        hitFrames: normalizedHitFrames[SCAVENGER_BOT_ENEMY_ID]
      }
    }
  };
}

function normalizeCharacterAnimationId(
  value: string,
  variantId = 'snap'
): CharacterAnimationId {
  const animations = getCharacterAnimationsForVariant(normalizeCharacterVariantId(variantId));

  // Do not remap attack -> attack_v2 here. Character Gym must be able to preview
  // legacy attack explicitly. Gameplay scenes use getPlayerAttackAnimation() instead.
  return (
    animations.find((animation) => animation.id === value)?.id ??
    animations[0]?.id ??
    CHARACTER_ANIMATIONS[0].id
  );
}

function normalizePlaybackRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(2, Math.max(0.25, Math.round(value * 100) / 100));
}

function normalizeAnimationFps(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(30, Math.max(1, Math.round(value * 10) / 10));
}

function renderFrameStripButtons(
  frames: boolean[],
  currentFrame: number,
  frameKind: 'hurt' | 'attack'
): string {
  return frames
    .map((isActive, index) => {
      const activeClass = isActive ? ' is-active' : '';
      const currentClass = index === currentFrame ? ' is-current' : '';
      const title = `${formatLabel(frameKind)} frame ${index + 1}: ${
        isActive ? 'active' : 'inactive'
      }`;

      return `
        <button
          type="button"
          class="frame-toggle${activeClass}${currentClass}"
          data-frame-kind="${frameKind}"
          data-frame-index="${index}"
          aria-pressed="${isActive ? 'true' : 'false'}"
          title="${title}"
        >${index + 1}</button>
      `;
    })
    .join('');
}

function updateFrameStripCurrent(root: HTMLElement, currentFrame: number): void {
  root.querySelectorAll<HTMLButtonElement>('button[data-frame-index]').forEach((button) => {
    button.classList.toggle('is-current', Number(button.dataset.frameIndex) === currentFrame);
  });
}

function preserveBoundsCenterOnResize(
  previous: Rect,
  next: Rect,
  activeElement: Element | null,
  widthInput: HTMLInputElement,
  heightInput: HTMLInputElement
): Rect {
  const adjusted = { ...next };

  if (activeElement === widthInput) {
    const centerX = previous.x + previous.width / 2;
    adjusted.x = Math.round(centerX - adjusted.width / 2);
  }

  if (activeElement === heightInput) {
    const centerY = previous.y + previous.height / 2;
    adjusted.y = Math.round(centerY - adjusted.height / 2);
  }

  return clampRectToFrame(adjusted);
}

function clampRectToFrame(rect: Rect): Rect {
  const x = clampInteger(rect.x, 0, 255);
  const y = clampInteger(rect.y, 0, 255);
  const width = clampInteger(rect.width, 1, 256 - x);
  const height = clampInteger(rect.height, 1, 256 - y);

  return { x, y, width, height };
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeBackgroundLayerOffsets(
  offsets: Partial<BackgroundLayerOffsets> | undefined
): BackgroundLayerOffsets | null {
  if (!offsets || typeof offsets !== 'object') {
    return null;
  }

  return {
    v1: {
      far: normalizeOffset(offsets.v1?.far),
      mid: normalizeOffset(offsets.v1?.mid),
      near: normalizeOffset(offsets.v1?.near)
    },
    v2: {
      sky: normalizeOffset(offsets.v2?.sky),
      far: normalizeOffset(offsets.v2?.far),
      mid: normalizeOffset(offsets.v2?.mid)
    }
  };
}

function normalizeOffset(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
}

function formatLabel(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function getDefaultBackgroundOffsetsForSet(
  setId: BackgroundSetId
): Partial<Record<BackgroundLayerId, number>> {
  return Object.fromEntries(
    BACKGROUND_SETS[setId].layers.map((layer) => [layer.layerId, layer.tileOffsetY ?? 0])
  ) as Partial<Record<BackgroundLayerId, number>>;
}

function syncBackgroundOffsetInputs(state: DebugState, root: HTMLElement): void {
  root.querySelectorAll<HTMLInputElement>('input[data-offset-layer-id]').forEach((input) => {
    if (document.activeElement === input) {
      return;
    }

    const layerId = input.dataset.offsetLayerId as BackgroundLayerId;
    const nextValue = String(state.backgroundLayerOffsets[state.backgroundSet]?.[layerId] ?? 0);

    if (input.value !== nextValue) {
      input.value = nextValue;
    }
  });
}

function downloadJsonFile(filename: string, payload: object): void {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
