import * as Phaser from 'phaser';

import { AUDIO_KEYS } from '../game/audio';
import {
  GAME_COMMON_DEFAULT_CONFIG,
  normalizeGameCommonConfig,
  type GameCommonConfig
} from '../game/gameConfig';
import { BACKGROUND_SETS, type BackgroundLayerAsset } from '../game/assets';
import { isWorldBoundsInCameraView } from '../game/cameraView';
import {
  CHARACTER_CENTER,
  CHARACTER_FRAME,
  DEFAULT_CHARACTER_ANIMATION_FPS_BY_VARIANT,
  DEFAULT_PLAYER_ATTACK_ANIMATION_ID,
  cloneCharacterAnimationFpsByVariant,
  getCharacterAnimation,
  getPlayerAttackAnimation,
  normalizeCharacterAnimationFpsByVariant,
  normalizeCharacterBoundsByVariant,
  normalizeCharacterHitFramesByVariant,
  normalizeCharacterVariantId,
  type CharacterAnimationBounds,
  type CharacterAnimationFpsByVariant,
  type CharacterAnimationId,
  type CharacterBoundsByVariant,
  type CharacterHitFramesByVariant,
  type CharacterVariantId
} from '../game/characterAssets';
import {
  DEFAULT_ENEMY_BOUNDS,
  DEFAULT_ENEMY_BOUNDS_BY_ENEMY,
  ENEMY_CENTER,
  SCAVENGER_BOT_ENEMY_ID,
  TURRET_CENTER,
  TURRET_ENEMY_ID,
  cloneEnemyBoundsByEnemy,
  getEnemyAnimation,
  normalizeEnemyBoundsByEnemy,
  normalizeEnemyBoundsMap,
  type EnemyAnimationBounds,
  type EnemyAnimationId,
  type EnemyBoundsByEnemy,
  type EnemyBoundsMap
} from '../game/enemyAssets';
import {
  TURRET_CANNONBALL_EFFECT,
  TURRET_CANNONBALL_IMPACT_ANIMATION_KEY,
  TURRET_MUZZLE_SMOKE_EFFECT
} from '../game/effectAssets';
import {
  DEFAULT_FIRST_LEVEL,
  FIRST_LEVEL_URL,
  getLevelUrl,
  normalizeLevelData,
  type LevelData,
  type LevelEnemy,
  type LevelExit,
  type LevelPickup,
  type LevelPlatform
} from '../game/levelData';
import { markLevelComplete } from '../game/levelProgress';
import {
  getPlatformingElementDefinition,
  loadCachedPlatformingMetadata,
  normalizePlatformingMetadata,
  type PlatformingElementMetadataMap
} from '../game/platformingElements';
import { clearAssetLabels, syncAssetLabels, type AssetLabelSpec } from '../game/debugLabels';
import {
  createPlayerHealthHud,
  createScrapCounterHud,
  type PlayerHealthHud,
  type ScrapCounterHud
} from '../game/ui';
import { SCENE_KEYS, type BackgroundSetId } from '../game/types';
import { BaseScene } from './BaseScene';

interface ParallaxLayer {
  asset: BackgroundLayerAsset;
  sprite: Phaser.GameObjects.TileSprite;
}

interface SolidPlatform {
  id: string;
  start: number;
  end: number;
  collisionY: number;
  collisionHeight: number;
  sprite: Phaser.GameObjects.Image;
}

interface PickupRuntime {
  data: LevelPickup;
  sprite: Phaser.GameObjects.Image;
  collected: boolean;
}

interface EnemyRuntime {
  data: LevelEnemy;
  sprite: Phaser.GameObjects.Sprite;
  health: number;
  maxHealth: number;
  isDead: boolean;
  hurtUntil: number;
  attackUntil: number;
  nextShotAt: number;
  nextStepAt: number;
  aggroCooldownUntil: number;
  direction: number;
  originX: number;
  targetingPlayer: boolean;
  attackConnected: boolean;
  knockbackVelocityX: number;
  activeAnimationKey: string;
}

interface ProjectileRuntime {
  rect: Phaser.Geom.Rectangle;
  sprite: Phaser.GameObjects.Sprite;
  velocityX: number;
}

interface ExitRuntime {
  data: LevelExit;
  sprite: Phaser.GameObjects.Image;
  trigger: Phaser.Geom.Rectangle;
}

interface PlayerBody {
  x: number;
  y: number;
  velocityY: number;
  width: number;
  height: number;
  onGround: boolean;
}

interface GameSceneData {
  levelId?: string;
  levelUrl?: string;
}

const PLATFORM_ATLAS_KEY = 'gameplay-platforming-v1';
const PROP_ATLAS_KEY = 'gameplay-props-pickups-v1';
const CHARACTER_BOUNDS_FILE = '/assets/config/character-bounds.json';
const ENEMY_BOUNDS_FILE = '/assets/config/enemy-bounds.json';
const TURRET_SCALE = 0.72;
const SCAVENGER_SCALE = 0.88;
const CAMERA_LEAD_X = 0.38;
const MAX_HEALTH = 3;
const DAMAGE_COOLDOWN_MS = 950;
const HURT_DURATION_MS = 520;
const ATTACK_PADDING_MS = 80;
const TURRET_HURT_DURATION_MS = 320;
const SCAVENGER_HURT_DURATION_MS = 520;
const SCAVENGER_PATROL_RADIUS = 180;
const SCAVENGER_EDGE_MARGIN = 34;
const SCAVENGER_SURFACE_JOIN_TOLERANCE = 18;
const SCAVENGER_AIRBORNE_LEVEL_TOLERANCE = 220;
const SCAVENGER_HIT_KNOCKBACK = 430;
const SCAVENGER_KNOCKBACK_DECAY = 1100;
const SCAVENGER_AFTER_HIT_AGGRO_COOLDOWN_MS = 850;
const SCAVENGER_AFTER_ATTACK_AGGRO_COOLDOWN_MS = 520;
const SCAVENGER_STEP_INTERVAL_MS = 430;
const PROJECTILE_COLLISION_WIDTH = 34;
const PROJECTILE_COLLISION_HEIGHT = 28;
const PROJECTILE_SPRITE_SCALE = 0.82;
const IMPACT_DURATION_MS = 180;
const EXIT_ALIGN_SPEED = 150;
const EXIT_ASCEND_PIXELS = 54;
const EXIT_FADE_DURATION_MS = 950;
const EXIT_BAR_HEIGHT = 86;
const EXIT_CLEAR_TITLE_DELAY_MS = 360;
const EXIT_CLEAR_PROMPT_DELAY_MS = 720;
const EXIT_BARS_NAME = 'exit-cinematic-bars';

export class GameScene extends BaseScene {
  private level: LevelData = DEFAULT_FIRST_LEVEL;
  private requestedLevelId = DEFAULT_FIRST_LEVEL.id;
  private requestedLevelUrl = FIRST_LEVEL_URL;
  private levelReady = false;
  private layers: ParallaxLayer[] = [];
  private activeBackgroundSetId: BackgroundSetId | null = null;
  private platforms: SolidPlatform[] = [];
  private pickups: PickupRuntime[] = [];
  private props: Phaser.GameObjects.Image[] = [];
  private exits: ExitRuntime[] = [];
  private enemies: EnemyRuntime[] = [];
  private projectiles: ProjectileRuntime[] = [];
  private transientEffects: Phaser.GameObjects.GameObject[] = [];
  private player!: Phaser.GameObjects.Sprite;
  private loadingText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private playerHealthHud!: PlayerHealthHud;
  private scrapCounterHud!: ScrapCounterHud;
  private hudGraphics!: Phaser.GameObjects.Graphics;
  private worldGraphics!: Phaser.GameObjects.Graphics;
  private assetLabels: Phaser.GameObjects.Text[] = [];
  private characterBoundsByVariant: CharacterBoundsByVariant =
    normalizeCharacterBoundsByVariant(null);
  private characterFpsByVariant: CharacterAnimationFpsByVariant =
    cloneCharacterAnimationFpsByVariant(DEFAULT_CHARACTER_ANIMATION_FPS_BY_VARIANT);
  private characterHitFramesByVariant: CharacterHitFramesByVariant =
    normalizeCharacterHitFramesByVariant(null);
  private enemyBounds: EnemyBoundsMap = normalizeEnemyBoundsMap(DEFAULT_ENEMY_BOUNDS);
  private enemyBoundsByEnemy: EnemyBoundsByEnemy = cloneEnemyBoundsByEnemy(
    DEFAULT_ENEMY_BOUNDS_BY_ENEMY
  );
  private metadata: PlatformingElementMetadataMap = normalizePlatformingMetadata(null);
  private body: PlayerBody = {
    x: DEFAULT_FIRST_LEVEL.playerStart.x,
    y: DEFAULT_FIRST_LEVEL.surfaceY - 144,
    velocityY: 0,
    width: 52 * GAME_COMMON_DEFAULT_CONFIG.characterScale,
    height: 200 * GAME_COMMON_DEFAULT_CONFIG.characterScale,
    onGround: true
  };
  private activeAnimationKey = '';
  private activeCharacterVariantId: CharacterVariantId = 'snap';
  private facingRight = true;
  private health = MAX_HEALTH;
  private score = 0;
  private hurtUntil = 0;
  private attackUntil = 0;
  private playerAttackConnected = false;
  private damageReadyAt = 0;
  private playerKnockbackVelocityX = 0;
  private isDead = false;
  private hasCompletedLevel = false;
  private completionSaved = false;
  private exitCutscene:
    | {
        exit: ExitRuntime;
        phase: 'align' | 'enter' | 'cleared';
        startedAt: number;
      }
    | null = null;
  private exitFadeProgress = 0;
  private exitTopBar: Phaser.GameObjects.Rectangle | null = null;
  private exitBottomBar: Phaser.GameObjects.Rectangle | null = null;
  private exitClearOverlay: Phaser.GameObjects.Container | null = null;
  private exitClearPrompt: Phaser.GameObjects.Text | null = null;
  private exitClearPromptTween: Phaser.Tweens.Tween | null = null;
  private gameOverOverlay: Phaser.GameObjects.Container | null = null;
  private gameOverPromptTween: Phaser.Tweens.Tween | null = null;
  private exitClearPromptVisible = false;
  private exitContinueReady = false;
  private keys: {
    left: Phaser.Input.Keyboard.Key[];
    right: Phaser.Input.Keyboard.Key[];
    jump: Phaser.Input.Keyboard.Key[];
    run: Phaser.Input.Keyboard.Key[];
    attack: Phaser.Input.Keyboard.Key[];
    reset: Phaser.Input.Keyboard.Key[];
  } = {
    left: [],
    right: [],
    jump: [],
    run: [],
    attack: [],
    reset: []
  };

  constructor() {
    super(SCENE_KEYS.Game);
  }

  init(data: GameSceneData = {}): void {
    this.levelReady = false;
    this.hasCompletedLevel = false;
    this.completionSaved = false;
    this.score = 0;
    this.health = this.isDead ? MAX_HEALTH : Math.min(MAX_HEALTH, this.health + 1);
    this.requestedLevelId =
      typeof data.levelId === 'string' && data.levelId.trim()
        ? data.levelId.trim()
        : DEFAULT_FIRST_LEVEL.id;
    this.requestedLevelUrl =
      typeof data.levelUrl === 'string' && data.levelUrl.trim()
        ? data.levelUrl.trim()
        : getLevelUrl(this.requestedLevelId);
  }

  create(): void {
    this.enableAudioSettingsSync();
    this.markActiveScene(SCENE_KEYS.Game);
    this.activeCharacterVariantId = normalizeCharacterVariantId(
      this.getCommonConfig().characterVariant
    );
    this.cameras.main.setBackgroundColor(0x8adfd9);

    this.metadata = loadPlatformingMetadata(this.cache.json);
    this.createInput();
    this.createPlayer();
    this.createHud();

    void this.loadCharacterBounds();
    void this.loadEnemyBounds();
    void this.loadLevel();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearLevelObjects();
      this.clearProjectiles();
      this.clearTransientEffects();
      this.layers.forEach((layer) => layer.sprite.destroy());
      this.destroyExitBars();
      this.destroyExitClearOverlay();
      this.destroyGameOverOverlay();
      this.playerHealthHud.destroy();
      this.scrapCounterHud.destroy();
      this.stopMainMusic();
      clearAssetLabels(this.assetLabels);
    });
  }

  update(time: number, delta: number): void {
    this.syncDebugSnapshot();
    this.syncAudioDebugPreview();
    const gameConfig = this.getCommonConfig();
    this.syncBackground(gameConfig);

    if (!this.levelReady) {
      this.updateAssetLabels();
      return;
    }

    if (!this.app.debugStore.getState().paused) {
      if (this.exitCutscene) {
        this.updateExitCutscene(time, delta / 1000);
      } else {
        this.updatePlayer(time, delta / 1000);
        this.updateEnemies(time, delta / 1000);
        this.updateProjectiles(time, delta / 1000);
        this.checkPickups();
        this.checkLevelCompletion(time);
      }
    }

    this.updateCamera();
    this.updateBackgroundScroll();
    this.drawHud();
    this.drawDebug();
    this.updateAssetLabels();
  }

  private async loadLevel(): Promise<void> {
    try {
      const response = await fetch(this.requestedLevelUrl, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Level request failed with ${response.status}`);
      }

      this.level = normalizeLevelData((await response.json()) as Partial<LevelData>);
      this.requestedLevelId = this.level.id;
      this.rebuildLevel();
      this.loadingText.destroy();
      this.scrapCounterHud.setCount(0, this.pickups.length);
      this.levelReady = true;
      this.respawnPlayer();
      this.startMainMusic();
    } catch (error) {
      this.loadingText.setText(
        `Could not load ${this.requestedLevelId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      );
    }
  }

  private rebuildLevel(): void {
    this.clearLevelObjects();
    this.clearProjectiles();
    this.clearTransientEffects();
    this.createBackground(this.getCommonConfig().backgroundSet);
    this.cameras.main.setBounds(0, 0, this.level.width, this.level.height);

    this.level.platforms.forEach((platform) => this.createPlatform(platform));
    this.level.props.forEach((prop) => {
      this.props.push(
        this.add
          .image(prop.x, prop.y, PROP_ATLAS_KEY, prop.frame)
          .setOrigin(0.5, 1)
          .setDepth(prop.depth)
      );
    });
    this.level.pickups.forEach((pickup) => {
      this.pickups.push({
        data: pickup,
        sprite: this.add
          .image(pickup.x, pickup.y, PROP_ATLAS_KEY, pickup.frame)
          .setOrigin(0.5)
          .setDepth(42),
        collected: false
      });
    });
    this.level.exits.forEach((exit) => this.createExit(exit));
    this.level.enemies.forEach((enemy) => this.createEnemy(enemy));
  }

  private clearLevelObjects(): void {
    this.assetLabels = syncAssetLabels(this, this.assetLabels, []);
    this.platforms.forEach((platform) => platform.sprite.destroy());
    this.pickups.forEach((pickup) => pickup.sprite.destroy());
    this.props.forEach((prop) => prop.destroy());
    this.exits.forEach((exit) => exit.sprite.destroy());
    this.enemies.forEach((enemy) => enemy.sprite.destroy());
    this.platforms = [];
    this.pickups = [];
    this.props = [];
    this.exits = [];
    this.enemies = [];
  }

  private createBackground(setId: BackgroundSetId): void {
    const camera = this.cameras.main;
    const set = BACKGROUND_SETS[setId];

    this.layers.forEach((layer) => layer.sprite.destroy());
    this.layers = set.layers.map((asset, index) => {
      const sprite = this.add
        .tileSprite(0, 0, camera.width, camera.height, asset.key)
        .setOrigin(0)
        .setDepth(index - 30)
        .setScrollFactor(0)
        .setTileScale(camera.height / (asset.height ?? 1080));

      sprite.tilePositionY = asset.tileOffsetY ?? 0;
      return { asset, sprite };
    });
    this.activeBackgroundSetId = setId;
    this.syncBackground(this.getCommonConfig());
  }

  private syncBackground(config: GameCommonConfig): void {
    if (!this.activeBackgroundSetId || config.backgroundSet !== this.activeBackgroundSetId) {
      this.createBackground(config.backgroundSet);
      return;
    }

    this.layers.forEach((layer) => {
      const visible = config.backgroundLayers[layer.asset.layerId] ?? layer.asset.defaultVisible;
      layer.sprite.setVisible(visible);
      layer.sprite.tilePositionY =
        config.backgroundLayerOffsets[layer.asset.setId]?.[layer.asset.layerId] ??
        layer.asset.tileOffsetY ??
        0;
    });
  }

  /**
   * Returns the normalized shared gameplay config used by main play.
   */
  private getCommonConfig(): GameCommonConfig {
    return normalizeGameCommonConfig(this.app.gameConfigStore.getState());
  }

  private getCharacterScale(): number {
    return this.getCommonConfig().characterScale;
  }

  private updateBackgroundScroll(): void {
    const scrollX = this.cameras.main.scrollX;

    this.layers.forEach((layer) => {
      layer.sprite.tilePositionX =
        scrollX * (layer.asset.parallaxScrollFactor?.x ?? 0);
    });
  }

  private createPlatform(platform: LevelPlatform): void {
    const definition = getPlatformingElementDefinition(platform.frame);
    const metadata = this.metadata[platform.frame];
    const imageX = platform.x - metadata.collision.x + definition.width / 2;
    const imageY = platform.y + definition.height - metadata.collision.y;
    const sprite = this.add
      .image(imageX, imageY, PLATFORM_ATLAS_KEY, platform.frame)
      .setOrigin(0.5, 1)
      .setDepth(25);

    this.platforms.push({
      id: platform.id,
      start: platform.x,
      end: platform.x + metadata.collision.width,
      collisionY: platform.y,
      collisionHeight: metadata.collision.height,
      sprite
    });
  }

  private createExit(exit: LevelExit): void {
    const definition = getPlatformingElementDefinition(exit.frame);
    const metadata = this.metadata[definition.id];
    const visualLeft = exit.x - definition.width / 2;
    const visualTop = exit.y - definition.height;
    const sprite = this.add
      .image(exit.x, exit.y, definition.textureKey, definition.textureFrame)
      .setOrigin(0.5, 1)
      .setDepth(46);

    this.exits.push({
      data: exit,
      sprite,
      trigger: new Phaser.Geom.Rectangle(
        visualLeft + metadata.collision.x,
        visualTop + metadata.collision.y,
        metadata.collision.width,
        metadata.collision.height
      )
    });
  }

  private createEnemy(enemy: LevelEnemy): void {
    const idleAnimation = getEnemyAnimation('idle', enemy.type);
    const runtime: EnemyRuntime = {
      data: enemy,
      sprite: this.add
        .sprite(0, 0, idleAnimation.key, 0)
        .setOrigin(0.5)
        .setScale(this.getEnemyScale(enemy))
        .setDepth(48),
      health: enemy.health,
      maxHealth: enemy.health,
      isDead: false,
      hurtUntil: 0,
      attackUntil: 0,
      nextShotAt: 0,
      nextStepAt: 0,
      aggroCooldownUntil: 0,
      direction: enemy.type === SCAVENGER_BOT_ENEMY_ID ? -1 : -1,
      originX: enemy.x,
      targetingPlayer: false,
      attackConnected: false,
      knockbackVelocityX: 0,
      activeAnimationKey: ''
    };

    this.enemies.push(runtime);
    this.positionEnemy(runtime);
    this.updateEnemyRender(runtime, 0);
  }

  private createPlayer(): void {
    this.player = this.add
      .sprite(this.body.x, this.body.y, getCharacterAnimation('idle').key, 0)
      .setOrigin(0.5)
      .setFlipX(true)
      .setScale(this.getCharacterScale())
      .setDepth(58);
  }

  private createHud(): void {
    const scrapBadgeScale = 1.1;
    const scrapBadgeWidth = 282 * scrapBadgeScale;
    const scrapBadgeX = this.scale.width - scrapBadgeWidth - 16;

    this.playerHealthHud = createPlayerHealthHud(this, {
      x: 20,
      y: 18,
      depth: 94,
      frameScale: 0.3,
      portraitSize: 92
    });
    this.scrapCounterHud = createScrapCounterHud(this, {
      x: scrapBadgeX,
      y: 18,
      depth: 94,
      badgeScale: scrapBadgeScale
    });
    this.hudGraphics = this.add.graphics().setDepth(92).setScrollFactor(0);
    this.worldGraphics = this.add.graphics().setDepth(91);
    this.loadingText = this.add
      .text(458, 24, 'Loading first level', {
        backgroundColor: 'rgba(2, 6, 23, 0.52)',
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '20px',
        padding: { x: 12, y: 8 }
      })
      .setDepth(92)
      .setScrollFactor(0);
    this.hudText = this.add
      .text(24, 126, '', {
        backgroundColor: 'rgba(2, 6, 23, 0.42)',
        color: '#cbd5e1',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: { x: 12, y: 8 }
      })
      .setDepth(92)
      .setScrollFactor(0);
    this.createFooterHint('A/D: move • Shift: run • Space: jump • J/Z: attack • R: reset');
  }

  private createInput(): void {
    this.keys = {
      left: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.LEFT, Phaser.Input.Keyboard.KeyCodes.A]),
      right: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.RIGHT, Phaser.Input.Keyboard.KeyCodes.D]),
      jump: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.W]),
      run: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.SHIFT]),
      attack: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.J, Phaser.Input.Keyboard.KeyCodes.Z]),
      reset: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.R])
    };

    const escape = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const backspace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
    escape?.on('down', () => {
      if (this.exitCutscene) {
        this.continueExitCutscene();
        return;
      }

      this.scene.start(this.gameOverOverlay ? SCENE_KEYS.LevelSelect : SCENE_KEYS.MainMenu);
    });
    backspace?.on('down', () => {
      if (this.exitCutscene) {
        this.continueExitCutscene();
        return;
      }

      this.scene.start(this.gameOverOverlay ? SCENE_KEYS.LevelSelect : SCENE_KEYS.MainMenu);
    });
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Escape' || event.code === 'Backspace') {
        return;
      }

      this.continueExitCutscene();
    });
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => this.continueExitCutscene());
  }

  private bindKeys(codes: number[]): Phaser.Input.Keyboard.Key[] {
    return codes
      .map((code) => this.input.keyboard?.addKey(code))
      .filter((key): key is Phaser.Input.Keyboard.Key => Boolean(key));
  }

  private updatePlayer(time: number, seconds: number): void {
    const config = this.getCommonConfig();

    if (this.justDown(this.keys.reset)) {
      this.resetLevel();
      return;
    }

    if (this.isDead) {
      this.updateDeadPlayerPhysics(seconds);
      this.updatePlayerRender('death');
      return;
    }

    const moveLeft = this.isDown(this.keys.left);
    const moveRight = this.isDown(this.keys.right);
    const direction = Number(moveRight) - Number(moveLeft);
    const runHeld = this.isDown(this.keys.run);
    const previousBottom = this.body.y + this.body.height;
    const wasOnGround = this.body.onGround;

    if (direction !== 0 && time >= this.hurtUntil) {
      this.facingRight = direction > 0;
    }

    const effectiveDirection = time >= this.hurtUntil ? direction : 0;
    this.body.x +=
      effectiveDirection * (runHeld ? config.runSpeed : config.walkSpeed) * seconds +
      this.playerKnockbackVelocityX * seconds;
    this.decayPlayerKnockback(seconds);
    this.body.velocityY += config.gravity * seconds;
    this.body.y += this.body.velocityY * seconds;
    this.body.onGround = false;
    this.resolvePlatformCollisions(previousBottom);
    if (!wasOnGround && this.body.onGround) {
      this.playSfx(AUDIO_KEYS.playerLand);
    }

    this.body.x = Phaser.Math.Clamp(
      this.body.x,
      this.body.width / 2,
      this.level.width - this.body.width / 2
    );

    if (this.body.onGround && this.justDown(this.keys.jump) && time >= this.hurtUntil) {
      this.body.velocityY = -config.jumpSpeed;
      this.body.onGround = false;
      this.playSfx(AUDIO_KEYS.playerJump);
    }

    const attackStarted =
      this.justDown(this.keys.attack) && time >= this.hurtUntil && time >= this.attackUntil;
    if (attackStarted) {
      const attack = getPlayerAttackAnimation(this.activeCharacterVariantId);
      this.attackUntil =
        time +
        (attack.frames / this.getCharacterAnimationFps(attack.id, this.activeCharacterVariantId)) *
          1000 +
        ATTACK_PADDING_MS;
      this.playerAttackConnected = false;
      this.playSfx(AUDIO_KEYS.playerAttack);
    }

    if (this.body.y > this.level.height + 240) {
      this.respawnPlayer();
      return;
    }

    const animationId = this.resolvePlayerAnimation(time, direction, runHeld);
    this.updatePlayerRender(animationId);

    if ((attackStarted || time < this.attackUntil) && this.canPlayerAttackHit()) {
      this.playerAttackConnected = this.tryDamageEnemies(time) || this.playerAttackConnected;
    }
  }

  private resolvePlatformCollisions(previousBottom: number): void {
    const nextBottom = this.body.y + this.body.height;
    const bodyLeft = this.body.x - this.body.width / 2;
    const bodyRight = this.body.x + this.body.width / 2;

    for (const platform of this.platforms) {
      if (
        bodyRight <= platform.start + 8 ||
        bodyLeft >= platform.end - 8 ||
        previousBottom > platform.collisionY + 8 ||
        nextBottom < platform.collisionY ||
        this.body.velocityY < 0
      ) {
        continue;
      }

      this.body.y = platform.collisionY - this.body.height;
      this.body.velocityY = 0;
      this.body.onGround = true;
      return;
    }
  }

  private updateEnemies(time: number, seconds: number): void {
    this.enemies.forEach((enemy) => {
      if (enemy.data.type === SCAVENGER_BOT_ENEMY_ID) {
        this.updateScavenger(enemy, time, seconds);
        this.positionEnemy(enemy);
      } else if (!enemy.isDead && this.isPlayerInEnemyRange(enemy)) {
        this.positionEnemy(enemy);
        if (time >= enemy.nextShotAt) {
          this.fireEnemyProjectile(enemy, time);
        }
      } else {
        this.positionEnemy(enemy);
      }

      this.updateEnemyRender(enemy, time);
    });
  }

  private updateScavenger(enemy: EnemyRuntime, time: number, seconds: number): void {
    const config = this.getCommonConfig();

    if (enemy.isDead || time < enemy.hurtUntil || time < enemy.attackUntil) {
      if (time < enemy.hurtUntil) {
        this.applyScavengerKnockback(enemy, seconds);
      }
      if (time < enemy.attackUntil) {
        this.tryScavengerAttackHit(enemy, time);
      }
      return;
    }

    const enemyPlatform = this.getPlatformForEnemy(enemy);
    const patrolRange = this.getScavengerPatrolRange(enemy, enemyPlatform);
    const chaseRange = this.getScavengerChaseRange(enemy, enemyPlatform);
    const enemyRect = this.getEnemyWorldRect(enemy, 'collision', 'walk');
    const playerRect = this.getPlayerBodyRect();
    const playerDeltaX = playerRect.centerX - enemyRect.centerX;
    const isFacingPlayer = playerDeltaX === 0 || Math.sign(playerDeltaX) === enemy.direction;
    const isPlayerOnSameLevel = this.isPlayerOnScavengerLevel(enemyPlatform, chaseRange);
    const isPlayerInRange =
      playerRect.centerX >= chaseRange.minX &&
      playerRect.centerX <= chaseRange.maxX &&
      Math.abs(playerDeltaX) <= config.scavengerSightRange;
    const canTargetPlayer =
      !this.isDead &&
      enemyPlatform !== null &&
      time >= enemy.aggroCooldownUntil &&
      isPlayerOnSameLevel &&
      isPlayerInRange &&
      (enemy.targetingPlayer || isFacingPlayer);

    enemy.targetingPlayer = canTargetPlayer;

    if (
      canTargetPlayer &&
      Math.abs(playerDeltaX) <= config.scavengerAttackRange &&
      time >= enemy.nextShotAt
    ) {
      enemy.direction = playerDeltaX >= 0 ? 1 : -1;
      const animation = getEnemyAnimation('attack', enemy.data.type);
      enemy.attackUntil = time + (animation.frames / animation.fps) * 1000;
      enemy.nextShotAt = time + config.scavengerAttackCooldownSeconds * 1000;
      enemy.attackConnected = false;
      enemy.activeAnimationKey = '';
      this.playSfx(AUDIO_KEYS.scavengerAttack);
      return;
    }

    const minX = canTargetPlayer ? chaseRange.minX : patrolRange.minX;
    const maxX = canTargetPlayer ? chaseRange.maxX : patrolRange.maxX;
    const speed = canTargetPlayer ? config.scavengerChaseSpeed : config.scavengerPatrolSpeed;

    if (canTargetPlayer) {
      enemy.direction = playerDeltaX >= 0 ? 1 : -1;
    }

    const nextX = enemy.data.x + enemy.direction * speed * seconds;

    if (nextX <= minX) {
      enemy.data.x = minX;
      enemy.direction = canTargetPlayer && playerRect.centerX < enemyRect.centerX ? -1 : 1;
    } else if (nextX >= maxX) {
      enemy.data.x = maxX;
      enemy.direction = canTargetPlayer && playerRect.centerX > enemyRect.centerX ? 1 : -1;
    } else {
      enemy.data.x = nextX;
    }

    if (speed > 0 && time >= enemy.nextStepAt) {
      enemy.nextStepAt = time + SCAVENGER_STEP_INTERVAL_MS;
      const stepRect = this.getEnemyWorldRect(enemy, 'collision', 'walk');
      if (isWorldBoundsInCameraView(this, stepRect.left, stepRect.right)) {
        this.playSfx(AUDIO_KEYS.scavengerStep);
      }
    }
  }

  private getPlatformForEnemy(enemy: EnemyRuntime): SolidPlatform | null {
    return (
      this.platforms.find(
        (platform) =>
          Math.abs(platform.collisionY - enemy.data.y) <= 8 &&
          enemy.originX >= platform.start - SCAVENGER_EDGE_MARGIN &&
          enemy.originX <= platform.end + SCAVENGER_EDGE_MARGIN
      ) ??
      this.platforms.find((platform) => Math.abs(platform.collisionY - enemy.data.y) <= 8) ??
      null
    );
  }

  private getPlayerStandingPlatform(): SolidPlatform | null {
    if (!this.body.onGround) {
      return null;
    }

    const bottom = this.body.y + this.body.height;
    const bodyLeft = this.body.x - this.body.width / 2;
    const bodyRight = this.body.x + this.body.width / 2;

    return (
      this.platforms.find(
        (platform) =>
          Math.abs(platform.collisionY - bottom) <= 8 &&
          bodyRight > platform.start + 8 &&
          bodyLeft < platform.end - 8
      ) ?? null
    );
  }

  private isPlayerOnScavengerLevel(
    enemyPlatform: SolidPlatform | null,
    chaseRange: { minX: number; maxX: number }
  ): boolean {
    if (!enemyPlatform) {
      return false;
    }

    const standingPlatform = this.getPlayerStandingPlatform();

    if (standingPlatform) {
      return Math.abs(standingPlatform.collisionY - enemyPlatform.collisionY) <= 8;
    }

    const bodyLeft = this.body.x - this.body.width / 2;
    const bodyRight = this.body.x + this.body.width / 2;
    const bodyBottom = this.body.y + this.body.height;

    return (
      bodyRight > chaseRange.minX + 8 &&
      bodyLeft < chaseRange.maxX - 8 &&
      bodyBottom <= enemyPlatform.collisionY + 8 &&
      bodyBottom >= enemyPlatform.collisionY - SCAVENGER_AIRBORNE_LEVEL_TOLERANCE
    );
  }

  private getScavengerPatrolRange(
    enemy: EnemyRuntime,
    platform: SolidPlatform | null
  ): { minX: number; maxX: number } {
    const platformRange = this.getScavengerChaseRange(enemy, platform);

    return {
      minX: Math.min(
        Math.max(enemy.originX - SCAVENGER_PATROL_RADIUS, platformRange.minX),
        platformRange.maxX
      ),
      maxX: Math.max(
        Math.min(enemy.originX + SCAVENGER_PATROL_RADIUS, platformRange.maxX),
        platformRange.minX
      )
    };
  }

  private getScavengerChaseRange(
    enemy: EnemyRuntime,
    platform: SolidPlatform | null
  ): { minX: number; maxX: number } {
    if (!platform) {
      return {
        minX: enemy.originX - SCAVENGER_PATROL_RADIUS,
        maxX: enemy.originX + SCAVENGER_PATROL_RADIUS
      };
    }

    const connectedSurface = this.getConnectedSurfaceRange(platform);

    if (connectedSurface.maxX - connectedSurface.minX < SCAVENGER_EDGE_MARGIN * 2) {
      const center = (connectedSurface.minX + connectedSurface.maxX) / 2;
      return { minX: center, maxX: center };
    }

    return {
      minX: connectedSurface.minX + SCAVENGER_EDGE_MARGIN,
      maxX: connectedSurface.maxX - SCAVENGER_EDGE_MARGIN
    };
  }

  private getConnectedSurfaceRange(platform: SolidPlatform): { minX: number; maxX: number } {
    const sameLevel = this.platforms
      .filter((candidate) => Math.abs(candidate.collisionY - platform.collisionY) <= 8)
      .sort((a, b) => a.start - b.start);

    let minX = platform.start;
    let maxX = platform.end;
    let expanded = true;

    while (expanded) {
      expanded = false;

      sameLevel.forEach((candidate) => {
        const connectsLeft =
          candidate.end >= minX - SCAVENGER_SURFACE_JOIN_TOLERANCE && candidate.start < minX;
        const connectsRight =
          candidate.start <= maxX + SCAVENGER_SURFACE_JOIN_TOLERANCE && candidate.end > maxX;

        if (connectsLeft || connectsRight) {
          minX = Math.min(minX, candidate.start);
          maxX = Math.max(maxX, candidate.end);
          expanded = true;
        }
      });
    }

    return { minX, maxX };
  }

  private isPlayerInEnemyRange(enemy: EnemyRuntime): boolean {
    if (this.isDead || enemy.isDead) {
      return false;
    }

    const enemyRect = this.getEnemyWorldRect(enemy, 'collision');
    const playerCenterX = this.body.x;
    const playerCenterY = this.body.y + this.body.height / 2;
    const isFacingPlayer = playerCenterX < enemyRect.centerX;
    const distance = Phaser.Math.Distance.Between(
      playerCenterX,
      playerCenterY,
      enemyRect.centerX,
      enemyRect.centerY
    );

    return isFacingPlayer && distance <= enemy.data.shootingRange;
  }

  private fireEnemyProjectile(enemy: EnemyRuntime, time: number): void {
    const attackBounds = this.getEnemyWorldRect(enemy, 'attack');
    const animation = getEnemyAnimation('attack', enemy.data.type);
    const projectileX = attackBounds.left - PROJECTILE_COLLISION_WIDTH / 2;
    const projectileY = attackBounds.centerY;
    const projectile = {
      rect: new Phaser.Geom.Rectangle(
        projectileX - PROJECTILE_COLLISION_WIDTH / 2,
        projectileY - PROJECTILE_COLLISION_HEIGHT / 2,
        PROJECTILE_COLLISION_WIDTH,
        PROJECTILE_COLLISION_HEIGHT
      ),
      sprite: this.add
        .sprite(projectileX, projectileY, TURRET_CANNONBALL_EFFECT.key, 0)
        .setScale(PROJECTILE_SPRITE_SCALE)
        .setDepth(56)
        .play(TURRET_CANNONBALL_EFFECT.animationKey),
      velocityX: -enemy.data.projectileSpeed
    };

    this.projectiles.push(projectile);
    this.spawnMuzzleEffects(attackBounds.left, attackBounds.centerY);
    this.playSfx(AUDIO_KEYS.turretFire);
    enemy.nextShotAt = time + enemy.data.cooldownSeconds * 1000;
    enemy.attackUntil = time + (animation.frames / animation.fps) * 1000;
  }

  private updateProjectiles(time: number, seconds: number): void {
    const playerRect = this.getPlayerBodyRect();

    this.projectiles = this.projectiles.filter((projectile) => {
      projectile.rect.x += projectile.velocityX * seconds;
      projectile.sprite.setPosition(projectile.rect.centerX, projectile.rect.centerY);

      const didHitPlayer =
        !this.isDead &&
        time >= this.damageReadyAt &&
        Phaser.Geom.Intersects.RectangleToRectangle(projectile.rect, playerRect);

      if (didHitPlayer) {
        this.damagePlayer(time);
        this.spawnProjectileImpact(projectile.rect.centerX, projectile.rect.centerY);
        this.playSfx(AUDIO_KEYS.projectileImpact);
        projectile.sprite.destroy();
        return false;
      }

      if (
        projectile.rect.right < this.cameras.main.scrollX - 80 ||
        projectile.rect.left > this.cameras.main.scrollX + this.cameras.main.width + 80
      ) {
        projectile.sprite.destroy();
        return false;
      }

      return true;
    });
  }

  private checkPickups(): void {
    const playerRect = this.getPlayerBodyRect();

    this.pickups.forEach((pickup) => {
      if (pickup.collected) {
        return;
      }

      if (!Phaser.Geom.Intersects.RectangleToRectangle(playerRect, pickup.sprite.getBounds())) {
        return;
      }

      pickup.collected = true;
      pickup.sprite.setVisible(false);
      this.score += pickup.data.value;
      this.playSfx(AUDIO_KEYS.scrapPickup);
      this.scrapCounterHud.playPickupCollect(
        pickup.sprite.x,
        pickup.sprite.y,
        PROP_ATLAS_KEY,
        pickup.data.frame
      );
    });
  }

  private getCollectedPickupCount(): number {
    return this.pickups.filter((pickup) => pickup.collected).length;
  }

  private saveLevelCompletion(): void {
    if (this.completionSaved) {
      return;
    }

    this.completionSaved = true;
    markLevelComplete(this.level.id, {
      collected: this.getCollectedPickupCount(),
      total: this.pickups.length
    });
  }

  private checkLevelCompletion(time: number): void {
    if (this.hasCompletedLevel) {
      return;
    }

    const playerRect = this.getPlayerBodyRect();
    const exit = this.exits.find((candidate) =>
      Phaser.Geom.Intersects.RectangleToRectangle(playerRect, candidate.trigger)
    );

    if (!exit && this.body.x < this.level.finish.x) {
      return;
    }

    this.startExitCutscene(exit ?? this.exits[0], time);
  }

  private startExitCutscene(exit: ExitRuntime | undefined, time: number): void {
    if (!exit) {
      this.hasCompletedLevel = true;
      return;
    }

    this.hasCompletedLevel = true;
    this.stopMainMusic();
    this.saveLevelCompletion();
    this.exitCutscene = {
      exit,
      phase: 'align',
      startedAt: time
    };
    this.exitFadeProgress = 0;
    this.exitContinueReady = false;
    this.exitClearPromptVisible = false;
    this.destroyExitClearOverlay();
    this.attackUntil = 0;
    this.hurtUntil = 0;
    this.body.velocityY = 0;
    this.ensureExitBars();
    this.playSfx(AUDIO_KEYS.exitChuteEnter);
  }

  private updateExitCutscene(time: number, seconds: number): void {
    if (!this.exitCutscene) {
      return;
    }

    this.ensureExitBars();
    this.updateExitBars(time - this.exitCutscene.startedAt);

    if (this.exitCutscene.phase === 'cleared') {
      this.updateExitClearPrompt(time - this.exitCutscene.startedAt);
      return;
    }

    const targetX = this.exitCutscene.exit.trigger.centerX;
    const deltaX = targetX - this.body.x;

    if (this.exitCutscene.phase === 'align' && Math.abs(deltaX) > 4) {
      const step = Math.sign(deltaX) * EXIT_ALIGN_SPEED * seconds;
      this.facingRight = deltaX > 0;
      this.body.x = Math.abs(step) >= Math.abs(deltaX) ? targetX : this.body.x + step;
      this.body.velocityY = 0;
      this.updatePlayerRender('walk');
      return;
    }

    if (this.exitCutscene.phase === 'align') {
      this.body.x = targetX;
      this.exitCutscene = {
        ...this.exitCutscene,
        phase: 'enter',
        startedAt: time
      };
      this.activeAnimationKey = '';
    }

    const animation = getCharacterAnimation('enter_chute', 'nosnap');
    const animationMs = (animation.frames / animation.fps) * 1000;
    const elapsed = time - this.exitCutscene.startedAt;
    this.exitFadeProgress = Phaser.Math.Clamp(elapsed / EXIT_FADE_DURATION_MS, 0, 1);
    this.updatePlayerRender('enter_chute', 'nosnap');

    if (elapsed >= Math.max(animationMs, EXIT_FADE_DURATION_MS)) {
      this.player.stop();
      this.player.setAlpha(0);
    }

    if (elapsed >= Math.max(animationMs, EXIT_FADE_DURATION_MS) + EXIT_CLEAR_TITLE_DELAY_MS) {
      this.exitCutscene = {
        ...this.exitCutscene,
        phase: 'cleared'
      };
      this.showExitClearOverlay();
      this.playSfx(AUDIO_KEYS.musicLevelClear);
      this.updateExitClearPrompt(elapsed);
    }
  }

  private ensureExitBars(): void {
    const camera = this.cameras.main;
    this.children
      .getAll('name', EXIT_BARS_NAME)
      .filter((bar) => bar !== this.exitTopBar && bar !== this.exitBottomBar)
      .forEach((bar) => bar.destroy());

    if (!this.exitTopBar) {
      this.exitTopBar = this.add
        .rectangle(0, 0, camera.width, 0, 0x000000, 1)
        .setName(EXIT_BARS_NAME)
        .setOrigin(0)
        .setDepth(120)
        .setScrollFactor(0);
    }

    if (!this.exitBottomBar) {
      this.exitBottomBar = this.add
        .rectangle(0, camera.height, camera.width, 0, 0x000000, 1)
        .setName(EXIT_BARS_NAME)
        .setOrigin(0, 1)
        .setDepth(120)
        .setScrollFactor(0);
    }
  }

  private updateExitBars(elapsedMs: number): void {
    const camera = this.cameras.main;
    const height = Phaser.Math.Clamp(elapsedMs / 420, 0, 1) * EXIT_BAR_HEIGHT;

    this.exitTopBar?.setSize(camera.width, height).setDisplaySize(camera.width, height);
    this.exitBottomBar
      ?.setPosition(0, camera.height)
      .setSize(camera.width, height)
      .setDisplaySize(camera.width, height);
  }

  private destroyExitBars(): void {
    this.exitTopBar?.destroy();
    this.exitBottomBar?.destroy();
    this.exitTopBar = null;
    this.exitBottomBar = null;
  }

  private showExitClearOverlay(): void {
    if (this.exitClearOverlay) {
      return;
    }

    const camera = this.cameras.main;
    const panelWidth = Math.min(560, camera.width - 72);
    const panel = this.add
      .rectangle(0, 0, panelWidth, 168, 0x08111f, 0.84)
      .setStrokeStyle(2, 0xfacc15, 0.95);
    const accent = this.add.rectangle(0, -72, panelWidth - 42, 3, 0x22c55e, 0.9);
    const title = this.add
      .text(0, -36, 'LEVEL CLEARED!', {
        align: 'center',
        color: '#fef3c7',
        fontFamily: 'monospace',
        fontSize: '34px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(0, 10, `Scrap collected: ${this.getCollectedPickupCount()}/${this.pickups.length}`, {
        align: 'center',
        color: '#cbd5e1',
        fontFamily: 'monospace',
        fontSize: '15px'
      })
      .setOrigin(0.5);
    this.exitClearPrompt = this.add
      .text(0, 52, 'Press any key to continue', {
        align: 'center',
        color: '#86efac',
        fontFamily: 'monospace',
        fontSize: '16px'
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.exitClearOverlay = this.add
      .container(camera.width / 2, camera.height / 2 - 4, [
        panel,
        accent,
        title,
        subtitle,
        this.exitClearPrompt
      ])
      .setDepth(145)
      .setScrollFactor(0)
      .setAlpha(0)
      .setScale(0.96);

    this.tweens.add({
      targets: this.exitClearOverlay,
      alpha: 1,
      scale: 1,
      duration: 260,
      ease: 'Cubic.easeOut'
    });
  }

  private updateExitClearPrompt(elapsedMs: number): void {
    const animation = getCharacterAnimation('enter_chute', 'nosnap');
    const animationMs = (animation.frames / animation.fps) * 1000;
    const promptAt =
      Math.max(animationMs, EXIT_FADE_DURATION_MS) +
      EXIT_CLEAR_TITLE_DELAY_MS +
      EXIT_CLEAR_PROMPT_DELAY_MS;

    if (this.exitClearPromptVisible || elapsedMs < promptAt || !this.exitClearPrompt) {
      return;
    }

    this.exitClearPromptVisible = true;
    this.exitContinueReady = true;
    this.exitClearPromptTween = this.tweens.add({
      targets: this.exitClearPrompt,
      alpha: { from: 0.35, to: 1 },
      duration: 720,
      ease: 'Sine.easeInOut',
      repeat: -1,
      yoyo: true
    });
  }

  private destroyExitClearOverlay(): void {
    this.exitClearPromptTween?.stop();
    this.exitClearPromptTween = null;
    this.exitClearOverlay?.destroy(true);
    this.exitClearOverlay = null;
    this.exitClearPrompt = null;
    this.exitClearPromptVisible = false;
    this.exitContinueReady = false;
  }

  private showGameOverOverlay(): void {
    if (this.gameOverOverlay) {
      return;
    }

    const camera = this.cameras.main;
    const panelWidth = Math.min(560, camera.width - 72);
    const panel = this.add
      .rectangle(0, 0, panelWidth, 176, 0x160b16, 0.88)
      .setStrokeStyle(2, 0xef4444, 0.95);
    const accent = this.add.rectangle(0, -76, panelWidth - 42, 3, 0xfb7185, 0.95);
    const title = this.add
      .text(0, -38, 'GAME OVER', {
        align: 'center',
        color: '#fecdd3',
        fontFamily: 'monospace',
        fontSize: '34px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(0, 8, `${this.level.title} claimed Robin`, {
        align: 'center',
        color: '#cbd5e1',
        fontFamily: 'monospace',
        fontSize: '15px'
      })
      .setOrigin(0.5);
    const prompt = this.add
      .text(0, 54, 'R: retry  •  Esc: level select', {
        align: 'center',
        color: '#fda4af',
        fontFamily: 'monospace',
        fontSize: '16px'
      })
      .setOrigin(0.5);

    this.gameOverOverlay = this.add
      .container(camera.width / 2, camera.height / 2 - 4, [panel, accent, title, subtitle, prompt])
      .setDepth(150)
      .setScrollFactor(0)
      .setAlpha(0)
      .setScale(0.96);

    this.tweens.add({
      targets: this.gameOverOverlay,
      alpha: 1,
      scale: 1,
      duration: 240,
      ease: 'Cubic.easeOut'
    });
    this.gameOverPromptTween = this.tweens.add({
      targets: prompt,
      alpha: { from: 0.42, to: 1 },
      duration: 720,
      ease: 'Sine.easeInOut',
      repeat: -1,
      yoyo: true
    });
  }

  private destroyGameOverOverlay(): void {
    this.gameOverPromptTween?.stop();
    this.gameOverPromptTween = null;
    this.gameOverOverlay?.destroy(true);
    this.gameOverOverlay = null;
  }

  private continueExitCutscene(): boolean {
    if (!this.exitContinueReady) {
      return false;
    }

    this.scene.start(SCENE_KEYS.LevelSelect);
    return true;
  }

  private canPlayerAttackHit(): boolean {
    if (this.playerAttackConnected) {
      return false;
    }

    const animation = getPlayerAttackAnimation(this.activeCharacterVariantId);
    const frameIndex = this.getPlayerAnimationFrameIndex(animation.frames);

    return this.characterHitFramesByVariant[this.activeCharacterVariantId][animation.id].attack[frameIndex] === true;
  }

  private getPlayerAnimationFrameIndex(frameCount: number): number {
    return Phaser.Math.Clamp(this.player.anims.currentFrame?.index ?? 0, 0, frameCount - 1);
  }

  private getCharacterAnimationFps(
    animationId: CharacterAnimationId,
    variantId = this.activeCharacterVariantId
  ): number {
    return this.characterFpsByVariant[variantId][animationId];
  }

  private getCharacterAnimationTimeScale(
    animationId: CharacterAnimationId,
    variantId = this.activeCharacterVariantId
  ): number {
    const animation = getCharacterAnimation(animationId, variantId);
    return this.getCharacterAnimationFps(animationId, variantId) / animation.fps;
  }

  private tryDamageEnemies(time: number): boolean {
    const attackRect = this.getPlayerAnimationWorldRect(
      getPlayerAttackAnimation(this.activeCharacterVariantId).id,
      'attack'
    );
    let didHit = false;

    this.enemies.forEach((enemy) => {
      if (enemy.isDead) {
        return;
      }

      const enemyHurtRect = this.getEnemyWorldRect(enemy, 'hurt');

      if (!Phaser.Geom.Intersects.RectangleToRectangle(attackRect, enemyHurtRect)) {
        return;
      }

      enemy.health = Math.max(0, enemy.health - 1);
      enemy.hurtUntil =
        enemy.data.type === SCAVENGER_BOT_ENEMY_ID
          ? time + SCAVENGER_HURT_DURATION_MS
          : time + TURRET_HURT_DURATION_MS;
      enemy.attackUntil = 0;
      enemy.attackConnected = false;
      enemy.activeAnimationKey = '';
      this.playSfx(AUDIO_KEYS.enemyHit);

      if (enemy.data.type === SCAVENGER_BOT_ENEMY_ID) {
        this.applyScavengerHitReaction(enemy, time);
      }

      if (enemy.health <= 0) {
        enemy.isDead = true;
      }

      didHit = true;
    });

    return didHit;
  }

  private tryScavengerAttackHit(enemy: EnemyRuntime, time: number): void {
    if (enemy.attackConnected || this.isDead || time < this.damageReadyAt) {
      return;
    }

    const attackRect = this.getEnemyWorldRect(enemy, 'attack', 'attack');
    const playerRect = this.getPlayerBodyRect();

    if (!Phaser.Geom.Intersects.RectangleToRectangle(attackRect, playerRect)) {
      return;
    }

    this.damagePlayer(time, enemy.direction * this.getCommonConfig().scavengerKnockback);
    this.body.velocityY = Math.min(this.body.velocityY, -240);
    enemy.targetingPlayer = false;
    enemy.aggroCooldownUntil = time + SCAVENGER_AFTER_ATTACK_AGGRO_COOLDOWN_MS;
    enemy.attackConnected = true;
  }

  private applyScavengerHitReaction(enemy: EnemyRuntime, time: number): void {
    const hitDirection = this.body.x <= enemy.data.x ? 1 : -1;

    enemy.direction = -hitDirection;
    enemy.knockbackVelocityX = hitDirection * SCAVENGER_HIT_KNOCKBACK;
    enemy.targetingPlayer = false;
    enemy.aggroCooldownUntil = time + SCAVENGER_AFTER_HIT_AGGRO_COOLDOWN_MS;
  }

  private applyScavengerKnockback(enemy: EnemyRuntime, seconds: number): void {
    if (enemy.knockbackVelocityX === 0) {
      return;
    }

    const platform = this.getPlatformForEnemy(enemy);
    const range = this.getScavengerChaseRange(enemy, platform);

    enemy.data.x = Phaser.Math.Clamp(
      enemy.data.x + enemy.knockbackVelocityX * seconds,
      range.minX,
      range.maxX
    );

    if (enemy.data.x === range.minX || enemy.data.x === range.maxX) {
      enemy.knockbackVelocityX = 0;
      return;
    }

    const decay = SCAVENGER_KNOCKBACK_DECAY * seconds;

    if (Math.abs(enemy.knockbackVelocityX) <= decay) {
      enemy.knockbackVelocityX = 0;
      return;
    }

    enemy.knockbackVelocityX -= Math.sign(enemy.knockbackVelocityX) * decay;
  }

  private damagePlayer(time: number, knockbackX = 0): void {
    if (this.isDead || time < this.damageReadyAt) {
      return;
    }

    const previousHealth = this.health;
    this.health = Math.max(0, this.health - 1);
    this.damageReadyAt = time + DAMAGE_COOLDOWN_MS;
    this.hurtUntil = time + HURT_DURATION_MS;
    this.attackUntil = 0;
    this.playerAttackConnected = false;
    this.playerKnockbackVelocityX = knockbackX;
    this.playSfx(AUDIO_KEYS.playerHurt);

    if (previousHealth > 1 && this.health === 1) {
      this.playSfx(AUDIO_KEYS.healthLow);
    }

    if (this.health <= 0) {
      this.isDead = true;
      this.hurtUntil = 0;
      this.stopMainMusic();
      this.showGameOverOverlay();
      this.playSfx(AUDIO_KEYS.musicGameOver);
    }
  }

  private updateDeadPlayerPhysics(seconds: number): void {
    const config = this.getCommonConfig();
    const previousBottom = this.body.y + this.body.height;

    this.body.x += this.playerKnockbackVelocityX * seconds;
    this.decayPlayerKnockback(seconds);
    this.body.velocityY += config.gravity * seconds;
    this.body.y += this.body.velocityY * seconds;
    this.body.onGround = false;
    this.resolvePlatformCollisions(previousBottom);
    this.body.x = Phaser.Math.Clamp(
      this.body.x,
      this.body.width / 2,
      this.level.width - this.body.width / 2
    );
  }

  private decayPlayerKnockback(seconds: number): void {
    if (this.playerKnockbackVelocityX === 0) {
      return;
    }

    const decay = 1500 * seconds;

    if (Math.abs(this.playerKnockbackVelocityX) <= decay) {
      this.playerKnockbackVelocityX = 0;
      return;
    }

    this.playerKnockbackVelocityX -= Math.sign(this.playerKnockbackVelocityX) * decay;
  }

  private resolvePlayerAnimation(
    time: number,
    direction: number,
    runHeld: boolean
  ): CharacterAnimationId {
    if (this.isDead) {
      return 'death';
    }

    if (time < this.hurtUntil) {
      return 'hurt';
    }

    if (time < this.attackUntil) {
      return DEFAULT_PLAYER_ATTACK_ANIMATION_ID;
    }

    if (!this.body.onGround) {
      return 'jump';
    }

    if (direction !== 0) {
      return runHeld ? 'run' : 'walk';
    }

    return 'idle';
  }

  private updatePlayerRender(
    animationId: CharacterAnimationId,
    variantOverride: CharacterVariantId = this.activeCharacterVariantId
  ): void {
    const animation = getCharacterAnimation(animationId, variantOverride);
    const timeScale = this.getCharacterAnimationTimeScale(animationId, variantOverride);

    this.player.setFlipX(animation.direction === 'w' && this.facingRight);
    this.player.setScale(this.getCharacterScale());
    this.player.setAlpha(this.exitCutscene?.phase === 'enter' ? 1 - this.exitFadeProgress : 1);

    if (this.activeAnimationKey !== animation.animationKey) {
      this.player.play({ key: animation.animationKey, timeScale }, true);
      this.activeAnimationKey = animation.animationKey;
    } else {
      this.player.anims.timeScale = timeScale;
    }

    const collision = this.getDisplayCollision(animationId, variantOverride);
    const collisionCenterOffset =
      (collision.x + collision.width / 2 - CHARACTER_CENTER.x) * this.getCharacterScale();
    const collisionBottomOffset =
      (collision.y + collision.height - CHARACTER_CENTER.y) * this.getCharacterScale();
    const bodyBottom = this.body.y + this.body.height;

    this.player.setPosition(
      this.body.x - collisionCenterOffset,
      bodyBottom - collisionBottomOffset - this.exitFadeProgress * EXIT_ASCEND_PIXELS
    );
  }

  private updateEnemyRender(enemy: EnemyRuntime, time: number): void {
    const animation = getEnemyAnimation(this.resolveEnemyAnimationId(enemy, time), enemy.data.type);

    enemy.sprite.setScale(this.getEnemyScale(enemy.data));
    enemy.sprite.setFlipX(enemy.data.type === SCAVENGER_BOT_ENEMY_ID && enemy.direction > 0);

    if (enemy.activeAnimationKey !== animation.animationKey) {
      enemy.sprite.play(animation.animationKey, true);
      enemy.activeAnimationKey = animation.animationKey;
    }
  }

  private resolveEnemyAnimationId(enemy: EnemyRuntime, time: number): EnemyAnimationId {
    if (enemy.isDead) {
      return 'death';
    }

    if (time < enemy.hurtUntil) {
      return 'hurt';
    }

    if (time < enemy.attackUntil) {
      return 'attack';
    }

    if (enemy.data.type === SCAVENGER_BOT_ENEMY_ID) {
      return 'walk';
    }

    return 'idle';
  }

  private getDisplayCollision(
    animationId: CharacterAnimationId,
    variantId: CharacterVariantId = this.activeCharacterVariantId
  ): CharacterAnimationBounds['collision'] {
    const collision = this.characterBoundsByVariant[variantId][animationId].collision;

    const animation = getCharacterAnimation(animationId, variantId);

    if (!this.facingRight || animation.direction !== 'w') {
      return collision;
    }

    return {
      ...collision,
      x: CHARACTER_FRAME.width - collision.x - collision.width
    };
  }

  private getPlayerAnimationWorldRect(
    animationId: CharacterAnimationId,
    boundsKind: 'visual' | 'collision' | 'attack'
  ): Phaser.Geom.Rectangle {
    const sourceBounds =
      this.characterBoundsByVariant[this.activeCharacterVariantId][animationId][boundsKind];
    const bounds =
      this.facingRight && boundsKind !== 'collision'
        ? {
            ...sourceBounds,
            x: CHARACTER_FRAME.width - sourceBounds.x - sourceBounds.width
          }
        : sourceBounds;

    return new Phaser.Geom.Rectangle(
      this.player.x + (bounds.x - CHARACTER_CENTER.x) * this.getCharacterScale(),
      this.player.y + (bounds.y - CHARACTER_CENTER.y) * this.getCharacterScale(),
      bounds.width * this.getCharacterScale(),
      bounds.height * this.getCharacterScale()
    );
  }

  private getPlayerBodyRect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.body.x - this.body.width / 2,
      this.body.y,
      this.body.width,
      this.body.height
    );
  }

  private positionEnemy(enemy: EnemyRuntime): void {
    const scale = this.getEnemyScale(enemy.data);
    const center = this.getEnemyCenter(enemy.data);
    const animationId = this.resolveEnemyAnimationId(enemy, this.time.now);
    const collision = this.getEnemyDisplayBounds(enemy, animationId, 'collision');
    const xOffset = (collision.x + collision.width / 2 - center.x) * scale;
    const yOffset = (collision.y + collision.height - center.y) * scale;

    enemy.sprite.setPosition(enemy.data.x - xOffset, enemy.data.y - yOffset);
  }

  private getEnemyWorldRect(
    enemy: EnemyRuntime,
    boundsKind: keyof EnemyAnimationBounds,
    animationOverride?: EnemyAnimationId
  ): Phaser.Geom.Rectangle {
    const animationId = animationOverride ?? this.resolveEnemyAnimationId(enemy, this.time.now);
    const scale = this.getEnemyScale(enemy.data);
    const center = this.getEnemyCenter(enemy.data);
    const bounds = this.getEnemyDisplayBounds(enemy, animationId, boundsKind);

    return new Phaser.Geom.Rectangle(
      enemy.sprite.x + (bounds.x - center.x) * scale,
      enemy.sprite.y + (bounds.y - center.y) * scale,
      bounds.width * scale,
      bounds.height * scale
    );
  }

  private getEnemyDisplayBounds(
    enemy: EnemyRuntime,
    animationId: EnemyAnimationId,
    boundsKind: keyof EnemyAnimationBounds
  ): EnemyAnimationBounds['visual'] {
    const bounds = this.getEnemyBounds(enemy.data)[animationId][boundsKind];

    if (enemy.data.type !== SCAVENGER_BOT_ENEMY_ID || enemy.direction <= 0) {
      return bounds;
    }

    return {
      ...bounds,
      x: ENEMY_CENTER.x * 2 - bounds.x - bounds.width
    };
  }

  private getEnemyBounds(enemy: LevelEnemy): EnemyBoundsMap {
    return this.enemyBoundsByEnemy[enemy.type] ?? this.enemyBounds;
  }

  private getEnemyScale(enemy: LevelEnemy): number {
    return enemy.type === SCAVENGER_BOT_ENEMY_ID ? SCAVENGER_SCALE : TURRET_SCALE;
  }

  private getEnemyCenter(enemy: LevelEnemy): typeof ENEMY_CENTER {
    return enemy.type === SCAVENGER_BOT_ENEMY_ID ? ENEMY_CENTER : TURRET_CENTER;
  }

  private spawnMuzzleEffects(x: number, y: number): void {
    const smokeDuration =
      (TURRET_MUZZLE_SMOKE_EFFECT.frames / TURRET_MUZZLE_SMOKE_EFFECT.fps) * 1000 + 80;
    const smoke = this.add
      .sprite(x - 20, y - 2, TURRET_MUZZLE_SMOKE_EFFECT.key, 0)
      .setDepth(55)
      .setScale(0.72)
      .play(TURRET_MUZZLE_SMOKE_EFFECT.animationKey);
    this.trackTransientEffect(smoke, smokeDuration);

    for (let index = 0; index < 5; index += 1) {
      const particle = this.add
        .circle(x - 6, y + Phaser.Math.Between(-8, 8), Phaser.Math.Between(2, 4), 0xfacc15, 0.95)
        .setDepth(57);
      this.transientEffects.push(particle);
      this.tweens.add({
        targets: particle,
        x: particle.x - Phaser.Math.Between(28, 62),
        y: particle.y + Phaser.Math.Between(-18, 18),
        alpha: 0,
        scale: 0.25,
        duration: Phaser.Math.Between(140, 240),
        ease: 'Sine.easeOut',
        onComplete: () => this.destroyTransientEffect(particle)
      });
    }
  }

  private spawnProjectileImpact(x: number, y: number): void {
    const impact = this.add
      .sprite(x, y, TURRET_CANNONBALL_EFFECT.key, 4)
      .setDepth(57)
      .setScale(PROJECTILE_SPRITE_SCALE)
      .play(TURRET_CANNONBALL_IMPACT_ANIMATION_KEY);
    this.trackTransientEffect(impact, IMPACT_DURATION_MS);
  }

  private trackTransientEffect<T extends Phaser.GameObjects.GameObject>(
    effect: T,
    durationMs: number
  ): T {
    this.transientEffects.push(effect);
    this.time.delayedCall(durationMs, () => this.destroyTransientEffect(effect));
    return effect;
  }

  private destroyTransientEffect(effect: Phaser.GameObjects.GameObject): void {
    if (effect.scene) {
      effect.destroy();
    }

    this.transientEffects = this.transientEffects.filter((tracked) => tracked !== effect);
  }

  private clearProjectiles(): void {
    this.projectiles.forEach((projectile) => projectile.sprite.destroy());
    this.projectiles = [];
  }

  private clearTransientEffects(): void {
    this.transientEffects.forEach((effect) => {
      if (effect.scene) {
        effect.destroy();
      }
    });
    this.transientEffects = [];
  }

  private updateCamera(): void {
    const camera = this.cameras.main;
    const targetScrollX = Phaser.Math.Clamp(
      this.body.x - camera.width * CAMERA_LEAD_X,
      0,
      Math.max(0, this.level.width - camera.width)
    );

    camera.setScroll(targetScrollX, 0);
  }

  private drawHud(): void {
    const currentSection =
      this.level.sections.find(
        (section) => this.body.x >= section.start && this.body.x < section.end
      ) ?? this.level.sections[this.level.sections.length - 1];

    this.hudGraphics.clear();
    this.worldGraphics.clear();
    this.playerHealthHud.update(this.health, MAX_HEALTH, this.time.now);

    this.hudText.setText(
      `${this.level.title} • ${currentSection?.label ?? 'Level'}${
        this.hasCompletedLevel ? ' • complete' : ''
      }`
    );

    this.enemies.forEach((enemy) => {
      const rect = this.getEnemyWorldRect(enemy, 'collision');
      const barWidth = 88;
      const barHeight = 8;
      const ratio = enemy.maxHealth > 0 ? Phaser.Math.Clamp(enemy.health / enemy.maxHealth, 0, 1) : 0;
      const x = rect.centerX - barWidth / 2;
      const y = rect.top - 24;

      this.worldGraphics.fillStyle(0x172033, 0.9);
      this.worldGraphics.fillRoundedRect(x, y, barWidth, barHeight, 2);
      this.worldGraphics.fillStyle(enemy.isDead ? 0xef4444 : 0xfacc15, 0.95);
      this.worldGraphics.fillRoundedRect(x, y, barWidth * ratio, barHeight, 2);
      this.worldGraphics.lineStyle(2, 0xf8fafc, 0.72);
      this.worldGraphics.strokeRoundedRect(x, y, barWidth, barHeight, 2);
    });
  }

  private updateAssetLabels(): void {
    if (!this.app.debugStore.getState().showAssetLabels || !this.levelReady) {
      this.assetLabels = syncAssetLabels(this, this.assetLabels, []);
      return;
    }

    const specs: AssetLabelSpec[] = [];

    this.platforms.forEach((platform) => {
      const bounds = platform.sprite.getBounds();
      specs.push({
        text: String(platform.sprite.frame.name),
        x: bounds.centerX,
        y: bounds.top - 4,
        depth: 120
      });
    });

    this.props.forEach((prop) => {
      const bounds = prop.getBounds();
      specs.push({
        text: String(prop.frame.name),
        x: bounds.centerX,
        y: bounds.top - 4,
        depth: 120
      });
    });

    this.pickups.forEach((pickup) => {
      if (pickup.collected) {
        return;
      }

      const bounds = pickup.sprite.getBounds();
      specs.push({
        text: pickup.data.frame,
        x: bounds.centerX,
        y: bounds.top - 4,
        depth: 120
      });
    });

    this.exits.forEach((exit) => {
      const bounds = exit.sprite.getBounds();
      specs.push({
        text: exit.data.frame,
        x: bounds.centerX,
        y: bounds.top - 6,
        depth: 120
      });
    });

    this.enemies.forEach((enemy) => {
      if (enemy.isDead) {
        return;
      }

      const bounds = enemy.sprite.getBounds();
      specs.push({
        text: enemy.data.type,
        x: bounds.centerX,
        y: bounds.top - 6,
        depth: 120
      });
    });

    specs.push({
      text: this.player.texture.key,
      x: this.body.x,
      y: this.body.y - 6,
      depth: 120
    });

    this.assetLabels = syncAssetLabels(this, this.assetLabels, specs);
  }

  private drawDebug(): void {
    const state = this.app.debugStore.getState();

    this.worldGraphics.lineStyle(2, 0xffd447, 0.55);
    this.worldGraphics.lineBetween(0, this.level.surfaceY, this.level.width, this.level.surfaceY);

    if (!state.showVisualBounds) {
      return;
    }

    this.worldGraphics.lineStyle(2, 0x39ff7a, 0.9);
    this.platforms.forEach((platform) => {
      this.worldGraphics.strokeRect(
        platform.start,
        platform.collisionY,
        platform.end - platform.start,
        platform.collisionHeight
      );
    });

    this.exits.forEach((exit) => {
      this.worldGraphics.lineStyle(2, 0xfacc15, 0.95);
      this.worldGraphics.strokeRect(
        exit.trigger.x,
        exit.trigger.y,
        exit.trigger.width,
        exit.trigger.height
      );
    });

    const playerRect = this.getPlayerBodyRect();
    this.worldGraphics.lineStyle(2, 0x38bdf8, 0.95);
    this.worldGraphics.strokeRect(playerRect.x, playerRect.y, playerRect.width, playerRect.height);

    const attackRect = this.getPlayerAnimationWorldRect(
      DEFAULT_PLAYER_ATTACK_ANIMATION_ID,
      'attack'
    );
    this.worldGraphics.lineStyle(2, 0xffffff, 0.85);
    this.worldGraphics.strokeRect(attackRect.x, attackRect.y, attackRect.width, attackRect.height);

    this.enemies.forEach((enemy) => {
      const collision = this.getEnemyWorldRect(enemy, 'collision');
      const hurt = this.getEnemyWorldRect(enemy, 'hurt');
      const attack = this.getEnemyWorldRect(enemy, 'attack');

      this.worldGraphics.lineStyle(2, 0xfacc15, 0.9);
      this.worldGraphics.strokeCircle(collision.centerX, collision.centerY, enemy.data.shootingRange);
      this.worldGraphics.strokeRect(collision.x, collision.y, collision.width, collision.height);
      this.worldGraphics.lineStyle(2, 0xef4444, 0.95);
      this.worldGraphics.strokeRect(hurt.x, hurt.y, hurt.width, hurt.height);
      this.worldGraphics.lineStyle(2, 0xffffff, 0.9);
      this.worldGraphics.strokeRect(attack.x, attack.y, attack.width, attack.height);
    });

    this.projectiles.forEach((projectile) => {
      this.worldGraphics.lineStyle(2, 0xfb923c, 0.95);
      this.worldGraphics.strokeRect(
        projectile.rect.x,
        projectile.rect.y,
        projectile.rect.width,
        projectile.rect.height
      );
    });
  }

  private respawnPlayer(): void {
    const variantId = normalizeCharacterVariantId(this.activeCharacterVariantId);
    const collision = this.characterBoundsByVariant[variantId].run.collision;
    this.activeCharacterVariantId = variantId;
    this.body = {
      x: this.level.playerStart.x,
      y: this.level.playerStart.y - collision.height * this.getCharacterScale(),
      velocityY: 0,
      width: collision.width * this.getCharacterScale(),
      height: collision.height * this.getCharacterScale(),
      onGround: true
    };
    this.facingRight = true;
    this.hurtUntil = 0;
    this.attackUntil = 0;
    this.playerAttackConnected = false;
    this.damageReadyAt = 0;
    this.playerKnockbackVelocityX = 0;
    this.isDead = false;
    this.exitCutscene = null;
    this.exitFadeProgress = 0;
    this.exitContinueReady = false;
    this.destroyGameOverOverlay();
    this.activeAnimationKey = '';
    this.updatePlayerRender('idle');
    this.updateCamera();
  }

  private resetLevel(): void {
    this.health = MAX_HEALTH;
    this.score = 0;
    this.hasCompletedLevel = false;
    this.completionSaved = false;
    this.exitCutscene = null;
    this.exitFadeProgress = 0;
    this.destroyExitBars();
    this.destroyExitClearOverlay();
    this.destroyGameOverOverlay();
    this.pickups.forEach((pickup) => {
      pickup.collected = false;
      pickup.sprite.setVisible(true);
    });
    this.scrapCounterHud.setCount(0, this.pickups.length);
    this.enemies.forEach((enemy) => {
      enemy.health = enemy.maxHealth;
      enemy.isDead = false;
      enemy.hurtUntil = 0;
      enemy.attackUntil = 0;
      enemy.nextShotAt = 0;
      enemy.nextStepAt = 0;
      enemy.aggroCooldownUntil = 0;
      enemy.targetingPlayer = false;
      enemy.attackConnected = false;
      enemy.knockbackVelocityX = 0;
      enemy.activeAnimationKey = '';
      this.updateEnemyRender(enemy, 0);
    });
    this.clearProjectiles();
    this.clearTransientEffects();
    this.respawnPlayer();
    this.startMainMusic();
  }

  private async loadCharacterBounds(): Promise<void> {
    try {
      const response = await fetch(CHARACTER_BOUNDS_FILE, { cache: 'no-store' });

      if (!response.ok) {
        return;
      }

      const parsed = (await response.json()) as {
        bounds?: Parameters<typeof normalizeCharacterBoundsByVariant>[1];
        fps?: Parameters<typeof normalizeCharacterAnimationFpsByVariant>[1];
        fpsByVariant?: Parameters<typeof normalizeCharacterAnimationFpsByVariant>[0];
        hitFrames?: Parameters<typeof normalizeCharacterHitFramesByVariant>[1];
        hitFramesByVariant?: Parameters<typeof normalizeCharacterHitFramesByVariant>[0];
        variants?: Parameters<typeof normalizeCharacterBoundsByVariant>[0];
      };
      this.characterBoundsByVariant = normalizeCharacterBoundsByVariant(
        parsed.variants,
        parsed.bounds
      );
      this.characterFpsByVariant = normalizeCharacterAnimationFpsByVariant(
        parsed.fpsByVariant,
        parsed.fps
      );
      this.characterHitFramesByVariant = normalizeCharacterHitFramesByVariant(
        parsed.hitFramesByVariant,
        parsed.hitFrames
      );
      this.respawnPlayer();
    } catch {
      this.characterBoundsByVariant = normalizeCharacterBoundsByVariant(null);
      this.characterFpsByVariant = cloneCharacterAnimationFpsByVariant(
        DEFAULT_CHARACTER_ANIMATION_FPS_BY_VARIANT
      );
      this.characterHitFramesByVariant = normalizeCharacterHitFramesByVariant(null);
    }
  }

  private async loadEnemyBounds(): Promise<void> {
    try {
      const response = await fetch(ENEMY_BOUNDS_FILE, { cache: 'no-store' });

      if (!response.ok) {
        return;
      }

      const parsed = await response.json();
      this.enemyBoundsByEnemy = normalizeEnemyBoundsByEnemy(parsed);
      this.enemyBounds = this.enemyBoundsByEnemy[TURRET_ENEMY_ID];
      this.enemies.forEach((enemy) => this.positionEnemy(enemy));
    } catch {
      this.enemyBoundsByEnemy = cloneEnemyBoundsByEnemy(DEFAULT_ENEMY_BOUNDS_BY_ENEMY);
      this.enemyBounds = normalizeEnemyBoundsMap(DEFAULT_ENEMY_BOUNDS);
    }
  }

  private syncDebugSnapshot(): void {
    const pointer = this.input.activePointer;
    const input = {
      up: this.isDown(this.keys.jump),
      down: false,
      left: this.isDown(this.keys.left),
      right: this.isDown(this.keys.right),
      pointerDown: pointer.isDown
    };
    const nextPointer = { x: pointer.worldX, y: pointer.worldY };
    const state = this.app.debugStore.getState();

    if (
      state.pointer.x === nextPointer.x &&
      state.pointer.y === nextPointer.y &&
      state.input.up === input.up &&
      state.input.down === input.down &&
      state.input.left === input.left &&
      state.input.right === input.right &&
      state.input.pointerDown === input.pointerDown
    ) {
      return;
    }

    this.app.debugStore.patchState({
      pointer: nextPointer,
      input
    });
  }

  private isDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((key) => key.isDown);
  }

  private justDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((key) => Phaser.Input.Keyboard.JustDown(key));
  }
}

function loadPlatformingMetadata(cache: Phaser.Cache.BaseCache): PlatformingElementMetadataMap {
  return loadCachedPlatformingMetadata(cache);
}
