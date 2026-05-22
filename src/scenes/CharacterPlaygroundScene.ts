import * as Phaser from 'phaser';

import { AUDIO_KEYS } from '../game/audio';
import {
  BACKGROUND_SETS,
  type BackgroundLayerAsset
} from '../game/assets';
import { isWorldBoundsInCameraView } from '../game/cameraView';
import { clearAssetLabels, syncAssetLabels, type AssetLabelSpec } from '../game/debugLabels';
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
import { normalizeCharacterPlaygroundConfig } from '../game/characterPlayground';
import {
  DEFAULT_ENEMY_BOUNDS,
  DEFAULT_ENEMY_BOUNDS_BY_ENEMY,
  ENEMY_CENTER,
  ENEMY_FRAME,
  SCAVENGER_BOT_ENEMY_ID,
  TURRET_CENTER,
  TURRET_ENEMY_ID,
  getEnemyAnimation,
  normalizeEnemyBoundsByEnemy,
  normalizeEnemyBoundsMap,
  type EnemyAnimationBounds,
  type EnemyAnimationId,
  type EnemyBoundsMap
} from '../game/enemyAssets';
import {
  TURRET_CANNONBALL_EFFECT,
  TURRET_CANNONBALL_IMPACT_ANIMATION_KEY,
  TURRET_MUZZLE_SMOKE_EFFECT
} from '../game/effectAssets';
import {
  DEFAULT_PLAYGROUND_LEVEL,
  PLAYGROUND_LEVEL_URL,
  normalizeLevelData,
  type LevelData,
  type LevelEnemy,
  type LevelExit,
  type LevelPlatform
} from '../game/levelData';
import { createPlayerHealthHud, type PlayerHealthHud } from '../game/ui';
import {
  getPlatformingElementDefinition,
  loadCachedPlatformingMetadata,
  normalizePlatformingMetadata,
  type PlatformingElementDefinition,
  type PlatformingElementMetadataMap
} from '../game/platformingElements';
import { SCENE_KEYS, type BackgroundSetId, type DebugState } from '../game/types';
import { BaseScene } from './BaseScene';

interface PlaygroundLayer {
  asset: BackgroundLayerAsset;
  sprite: Phaser.GameObjects.TileSprite;
}

interface PlayerBody {
  x: number;
  y: number;
  velocityY: number;
  width: number;
  height: number;
  onGround: boolean;
}

interface Projectile {
  rect: Phaser.Geom.Rectangle;
  sprite: Phaser.GameObjects.Sprite;
  velocityX: number;
}

interface SolidPlatform {
  start: number;
  end: number;
  collisionY: number;
  collisionHeight: number;
  sprite: Phaser.GameObjects.Image;
}

interface PlaygroundExit {
  sprite: Phaser.GameObjects.Image;
  trigger: Phaser.Geom.Rectangle;
  definition: PlatformingElementDefinition;
}

type ScavengerState = 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'death';

const ATLAS_KEY = 'gameplay-platforming-v1';
const PROP_ATLAS_KEY = 'gameplay-props-pickups-v1';
const CHARACTER_BOUNDS_FILE = '/assets/config/character-bounds.json';
const ENEMY_BOUNDS_FILE = '/assets/config/enemy-bounds.json';
const SURFACE_Y = DEFAULT_PLAYGROUND_LEVEL.surfaceY;
const PLAYER_START_X = DEFAULT_PLAYGROUND_LEVEL.playerStart.x;
const TURRET_COLLISION_X = 760;
const TURRET_SCALE = 0.72;
const SCAVENGER_SCALE = 0.88;
const MAX_HEALTH = 3;
const DAMAGE_COOLDOWN_MS = 950;
const HURT_DURATION_MS = 520;
const TURRET_HURT_DURATION_MS = 320;
const SCAVENGER_HURT_DURATION_MS = 520;
const SCAVENGER_PATROL_MARGIN = 34;
const SCAVENGER_HIT_KNOCKBACK = 430;
const SCAVENGER_KNOCKBACK_DECAY = 1100;
const SCAVENGER_AIRBORNE_LEVEL_TOLERANCE = 220;
const SCAVENGER_AFTER_HIT_AGGRO_COOLDOWN_MS = 850;
const SCAVENGER_AFTER_ATTACK_AGGRO_COOLDOWN_MS = 520;
const SCAVENGER_STEP_INTERVAL_MS = 430;
const PROJECTILE_COLLISION_WIDTH = 34;
const PROJECTILE_COLLISION_HEIGHT = 28;
const PROJECTILE_SPRITE_SCALE = 0.82;
const IMPACT_DURATION_MS = 180;
const EXIT_ALIGN_SPEED = 140;
const EXIT_ASCEND_PIXELS = 54;
const EXIT_FADE_DURATION_MS = 950;
const EXIT_BAR_HEIGHT = 76;
const EXIT_CLEAR_TITLE_DELAY_MS = 360;
const EXIT_CLEAR_PROMPT_DELAY_MS = 720;
const EXIT_BARS_NAME = 'exit-cinematic-bars';

export class CharacterPlaygroundScene extends BaseScene {
  private level: LevelData = DEFAULT_PLAYGROUND_LEVEL;
  private layers: PlaygroundLayer[] = [];
  private activeSetId: BackgroundSetId | null = null;
  private floorSprites: Phaser.GameObjects.Image[] = [];
  private platformSprites: Phaser.GameObjects.Image[] = [];
  private platformPlaceholders: Phaser.GameObjects.Rectangle[] = [];
  private propSprites: Phaser.GameObjects.Image[] = [];
  private platforms: SolidPlatform[] = [];
  private player!: Phaser.GameObjects.Sprite;
  private playerPlaceholder!: Phaser.GameObjects.Rectangle;
  private turret!: Phaser.GameObjects.Sprite;
  private scavenger!: Phaser.GameObjects.Sprite;
  private exit!: PlaygroundExit;
  private turretProjectiles: Projectile[] = [];
  private transientEffects: Phaser.GameObjects.GameObject[] = [];
  private playerHealthHud!: PlayerHealthHud;
  private hudGraphics!: Phaser.GameObjects.Graphics;
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private assetLabels: Phaser.GameObjects.Text[] = [];
  private scavengerPlatform: SolidPlatform | null = null;
  private levelObjectsReady = false;
  private body: PlayerBody = {
    x: PLAYER_START_X,
    y: SURFACE_Y - 134,
    velocityY: 0,
    width: 52,
    height: 134,
    onGround: true
  };
  private characterBoundsByVariant: CharacterBoundsByVariant =
    normalizeCharacterBoundsByVariant(null);
  private characterFpsByVariant: CharacterAnimationFpsByVariant =
    cloneCharacterAnimationFpsByVariant(DEFAULT_CHARACTER_ANIMATION_FPS_BY_VARIANT);
  private characterHitFramesByVariant: CharacterHitFramesByVariant =
    normalizeCharacterHitFramesByVariant(null);
  private enemyBounds: EnemyBoundsMap = normalizeEnemyBoundsMap(DEFAULT_ENEMY_BOUNDS);
  private scavengerBounds: EnemyBoundsMap = normalizeEnemyBoundsMap(
    DEFAULT_ENEMY_BOUNDS_BY_ENEMY[SCAVENGER_BOT_ENEMY_ID],
    SCAVENGER_BOT_ENEMY_ID
  );
  private metadata: PlatformingElementMetadataMap = normalizePlatformingMetadata(null);
  private activeAnimationKey = '';
  private activeTurretAnimationKey = '';
  private activeScavengerAnimationKey = '';
  private activeCharacterScale = 1;
  private activeCharacterVariantId: CharacterVariantId = 'snap';
  private turretCollisionX = TURRET_COLLISION_X;
  private turretSurfaceY = SURFACE_Y;
  private exitData: LevelExit = DEFAULT_PLAYGROUND_LEVEL.exits[0];
  private facingRight = true;
  private health = MAX_HEALTH;
  private turretHealth = 3;
  private activeTurretMaxHealth = 3;
  private scavengerHealth = 5;
  private activeScavengerMaxHealth = 5;
  private scavengerX = 0;
  private scavengerDirection = -1;
  private scavengerState: ScavengerState = 'patrol';
  private scavengerHurtUntil = 0;
  private scavengerAttackUntil = 0;
  private scavengerNextAttackAt = 0;
  private scavengerNextStepAt = 0;
  private scavengerAggroCooldownUntil = 0;
  private scavengerTargetingPlayer = false;
  private scavengerAttackConnected = false;
  private scavengerKnockbackVelocityX = 0;
  private hurtUntil = 0;
  private attackUntil = 0;
  private playerAttackConnected = false;
  private turretHurtUntil = 0;
  private turretAttackUntil = 0;
  private turretNextShotAt = 0;
  private damageReadyAt = 0;
  private playerKnockbackVelocityX = 0;
  private isDead = false;
  private isTurretDead = false;
  private isScavengerDead = false;
  private exitCutscene:
    | {
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
    hurt: Phaser.Input.Keyboard.Key[];
    reset: Phaser.Input.Keyboard.Key[];
  } = {
    left: [],
    right: [],
    jump: [],
    run: [],
    attack: [],
    hurt: [],
    reset: []
  };

  constructor() {
    super(SCENE_KEYS.CharacterPlayground);
  }

  create(): void {
    this.enableAudioSettingsSync();
    this.markActiveScene(SCENE_KEYS.CharacterPlayground);
    this.cameras.main.setBackgroundColor(0x8adfd9);

    this.metadata = loadPlatformingMetadata(this.cache.json);
    void this.loadCharacterBounds();
    void this.loadEnemyBounds();
    this.createBackground(this.level.backgroundSet);
    this.createPlayer();
    this.createHud();
    this.createInput();
    this.syncPlatformPresentation();
    this.updatePlayerRender('idle');
    void this.initializePlaygroundLevel();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.layers.forEach((layer) => layer.sprite.destroy());
      this.floorSprites.forEach((sprite) => sprite.destroy());
      this.platformSprites.forEach((sprite) => sprite.destroy());
      this.platformPlaceholders.forEach((placeholder) => placeholder.destroy());
      this.propSprites.forEach((sprite) => sprite.destroy());
      this.exit?.sprite.destroy();
      this.turret?.destroy();
      this.scavenger?.destroy();
      this.turretProjectiles.forEach((projectile) => projectile.sprite.destroy());
      this.clearTransientEffects();
      this.destroyExitBars();
      this.destroyExitClearOverlay();
      this.destroyGameOverOverlay();
      this.playerHealthHud.destroy();
      clearAssetLabels(this.assetLabels);
      this.stopMainMusic();
    });
  }

  private async initializePlaygroundLevel(): Promise<void> {
    await this.loadPlaygroundLevel();
    this.rebuildLevelObjects();
    this.levelObjectsReady = true;
    this.respawnPlayer();
    this.updatePlayerRender('idle');
    this.startMainMusic();
  }

  private async loadPlaygroundLevel(): Promise<void> {
    try {
      const response = await fetch(PLAYGROUND_LEVEL_URL, { cache: 'no-store' });

      if (!response.ok) {
        return;
      }

      this.level = normalizeLevelData((await response.json()) as Partial<LevelData>);
    } catch {
      this.level = DEFAULT_PLAYGROUND_LEVEL;
    }
  }

  update(time: number, delta: number): void {
    this.syncBackground(this.app.debugStore.getState());
    this.syncAudioDebugPreview();
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );
    this.applyCharacterScale(
      settings.characterScale,
      normalizeCharacterVariantId(settings.characterVariant)
    );
    this.syncPlatformPresentation();

    if (!this.levelObjectsReady) {
      return;
    }

    if (!this.app.debugStore.getState().paused) {
      if (this.exitCutscene) {
        this.updateExitCutscene(time, delta / 1000);
      } else {
        this.updatePlayer(time, delta / 1000);
        this.updateTurret(time, delta / 1000);
        this.updateScavenger(time, delta / 1000);
      }
    }

    this.drawDebug();
    this.updateHud();
    this.updateAssetLabels();
  }

  private createBackground(setId: BackgroundSetId): void {
    const camera = this.cameras.main;
    const set = BACKGROUND_SETS[setId];

    this.layers.forEach((layer) => layer.sprite.destroy());
    this.layers = set.layers.map((asset, index) => {
      const sprite = this.add
        .tileSprite(0, 0, camera.width, camera.height, asset.key)
        .setOrigin(0)
        .setDepth(index - 20)
        .setTileScale(camera.height / (asset.height ?? 1080));

      sprite.tilePositionY = asset.tileOffsetY ?? 0;

      return { asset, sprite };
    });
    this.activeSetId = setId;
    this.syncBackground(this.app.debugStore.getState());
  }

  private syncBackground(debugState: DebugState): void {
    if (debugState.backgroundSet !== this.activeSetId) {
      this.createBackground(debugState.backgroundSet);
      return;
    }

    this.layers.forEach((layer) => {
      const isVisible =
        debugState.backgroundLayers[layer.asset.layerId] ?? layer.asset.defaultVisible;
      layer.sprite.setVisible(isVisible);
      layer.sprite.tilePositionY =
        debugState.backgroundLayerOffsets[layer.asset.setId]?.[layer.asset.layerId] ??
        layer.asset.tileOffsetY ??
        0;
    });
  }

  private createLevelObjects(): void {
    this.scavengerPlatform = null;
    this.activeTurretAnimationKey = '';
    this.activeScavengerAnimationKey = '';
    this.level.platforms.forEach((platform) => this.createLevelPlatform(platform));
    this.level.props.forEach((prop) => {
      this.propSprites.push(
        this.add
          .image(prop.x, prop.y, PROP_ATLAS_KEY, prop.frame)
          .setOrigin(0.5, 1)
          .setDepth(prop.depth)
      );
    });
    this.createExit(this.level.exits[0] ?? DEFAULT_PLAYGROUND_LEVEL.exits[0]);
    this.createTurret(this.getLevelEnemy(TURRET_ENEMY_ID));
    this.createScavenger(this.getLevelEnemy(SCAVENGER_BOT_ENEMY_ID));
  }

  private rebuildLevelObjects(): void {
    this.floorSprites.forEach((sprite) => sprite.destroy());
    this.platformSprites.forEach((sprite) => sprite.destroy());
    this.platformPlaceholders.forEach((placeholder) => placeholder.destroy());
    this.propSprites.forEach((sprite) => sprite.destroy());
    this.turret?.destroy();
    this.scavenger?.destroy();
    this.exit?.sprite.destroy();
    this.clearProjectiles();
    this.clearTransientEffects();
    this.floorSprites = [];
    this.platformSprites = [];
    this.platformPlaceholders = [];
    this.propSprites = [];
    this.platforms = [];
    this.levelObjectsReady = false;
    this.createBackground(this.level.backgroundSet);
    this.createLevelObjects();
    this.syncPlatformPresentation();
    this.levelObjectsReady = true;
  }

  private createLevelPlatform(platform: LevelPlatform): void {
    const definition = getPlatformingElementDefinition(platform.frame);
    const metadata = this.metadata[platform.frame];
    const x = platform.x - metadata.collision.x + definition.width / 2;
    const y = platform.y + definition.height - metadata.collision.y;
    const isFloor = Math.abs(platform.y - this.level.surfaceY) <= 8;
    const depth = isFloor ? 20 : 24;
    const sprite = this.add.image(x, y, ATLAS_KEY, platform.frame).setOrigin(0.5, 1).setDepth(depth);
    const placeholder = this.createPlatformPlaceholder(
      platform.x,
      platform.y,
      metadata.collision.width,
      metadata.collision.height,
      depth
    );
    const solid = {
      start: platform.x,
      end: platform.x + metadata.collision.width,
      collisionY: platform.y,
      collisionHeight: metadata.collision.height,
      sprite
    };

    if (isFloor) {
      this.floorSprites.push(sprite);
    } else {
      this.platformSprites.push(sprite);
    }

    this.platformPlaceholders.push(placeholder);
    this.platforms.push(solid);

    if (!isFloor && !this.scavengerPlatform) {
      this.scavengerPlatform = solid;
    }
  }

  private getLevelEnemy(type: typeof TURRET_ENEMY_ID | typeof SCAVENGER_BOT_ENEMY_ID): LevelEnemy | null {
    return this.level.enemies.find((enemy) => enemy.type === type) ?? null;
  }

  private createTurret(enemy: LevelEnemy | null = null): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );
    this.turretCollisionX = enemy?.x ?? TURRET_COLLISION_X;
    this.turretSurfaceY = enemy?.y ?? this.level.surfaceY;
    this.activeTurretMaxHealth = settings.turretHealth;
    this.turretHealth = settings.turretHealth;
    this.activeTurretAnimationKey = '';
    this.turret = this.add
      .sprite(0, 0, getEnemyAnimation('idle').key, 0)
      .setOrigin(0.5)
      .setScale(TURRET_SCALE)
      .setDepth(45);
    this.positionTurret();
    this.updateTurretRender(0);
  }

  private createExit(exit: LevelExit): void {
    this.exitData = exit;
    const definition = getPlatformingElementDefinition(exit.frame);
    const metadata = this.metadata[exit.frame];
    const visualLeft = exit.x - definition.width / 2;
    const visualTop = exit.y - definition.height;
    const sprite = this.add
      .image(exit.x, exit.y, definition.textureKey, definition.textureFrame)
      .setOrigin(0.5, 1)
      .setDepth(44);

    this.exit = {
      sprite,
      definition,
      trigger: new Phaser.Geom.Rectangle(
        visualLeft + metadata.collision.x,
        visualTop + metadata.collision.y,
        metadata.collision.width,
        metadata.collision.height
      )
    };
  }

  private createScavenger(enemy: LevelEnemy | null = null): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );
    const platform = this.findScavengerPlatform(enemy);
    this.scavengerPlatform = platform;
    this.activeScavengerMaxHealth = settings.scavengerHealth;
    this.scavengerHealth = settings.scavengerHealth;
    this.scavengerX = enemy?.x ?? platform.start + SCAVENGER_PATROL_MARGIN;
    this.scavengerDirection = 1;
    this.scavengerState = 'patrol';
    this.scavengerAggroCooldownUntil = 0;
    this.scavengerNextStepAt = 0;
    this.scavengerTargetingPlayer = false;
    this.activeScavengerAnimationKey = '';
    this.scavenger = this.add
      .sprite(0, 0, getEnemyAnimation('idle', SCAVENGER_BOT_ENEMY_ID).key, 0)
      .setOrigin(0.5)
      .setScale(SCAVENGER_SCALE)
      .setDepth(47);
    this.positionScavenger();
    this.updateScavengerRender(0, false);
  }

  private createPlatformPlaceholder(
    x: number,
    y: number,
    width: number,
    height: number,
    depth: number
  ): Phaser.GameObjects.Rectangle {
    return this.add
      .rectangle(x + width / 2, y + height / 2, width, height, 0x2f6f56, 0.86)
      .setStrokeStyle(2, 0xf8fafc, 0.72)
      .setDepth(depth + 1);
  }

  private createPlayer(): void {
    this.player = this.add
      .sprite(this.body.x, this.level.playerStart.y, getCharacterAnimation('idle').key, 0)
      .setOrigin(0.5)
      .setFlipX(true)
      .setDepth(55);
    this.playerPlaceholder = this.add
      .rectangle(this.body.x, this.body.y + this.body.height / 2, this.body.width, this.body.height, 0x5dade2, 0.88)
      .setStrokeStyle(3, 0xf8fafc, 0.9)
      .setDepth(56);
    this.respawnPlayer();
  }

  private createHud(): void {
    this.playerHealthHud = createPlayerHealthHud(this, {
      x: 24,
      y: 70,
      depth: 91,
      frameScale: 0.29,
      portraitSize: 88
    });
    this.hudGraphics = this.add.graphics().setDepth(90).setScrollFactor(0);
    this.debugGraphics = this.add.graphics().setDepth(88).setScrollFactor(0);
    this.add
      .text(24, 24, 'Character Playground', {
        backgroundColor: 'rgba(2, 6, 23, 0.52)',
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '20px',
        padding: { x: 12, y: 8 }
      })
      .setDepth(90)
      .setScrollFactor(0);
    this.createFooterHint('A/D: move • Shift: run • Space: jump • J/Z: attack • H: hurt • R: reset');
  }

  private createInput(): void {
    this.keys = {
      left: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.LEFT, Phaser.Input.Keyboard.KeyCodes.A]),
      right: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.RIGHT, Phaser.Input.Keyboard.KeyCodes.D]),
      jump: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.UP]),
      run: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.SHIFT]),
      attack: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.J, Phaser.Input.Keyboard.KeyCodes.Z]),
      hurt: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.H]),
      reset: this.bindKeys([Phaser.Input.Keyboard.KeyCodes.R])
    };

    const escape = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const backspace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
    escape?.on('down', () => {
      if (this.exitCutscene) {
        this.continueExitCutscene();
        return;
      }

      this.goToMenu();
    });
    backspace?.on('down', () => {
      if (this.exitCutscene) {
        this.continueExitCutscene();
        return;
      }

      this.goToMenu();
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
    this.syncTurretSettings();
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );
    this.applyCharacterScale(
      settings.characterScale,
      normalizeCharacterVariantId(settings.characterVariant)
    );

    if (this.isDead) {
      if (this.justDown(this.keys.reset)) {
        this.resetPlayground();
        return;
      }
      this.updateDeadPlayerPhysics(seconds, settings.gravity);
      this.updatePlayerRender('death');
      return;
    }

    if (this.justDown(this.keys.hurt)) {
      this.damagePlayer(time);
    }

    const moveLeft = this.isDown(this.keys.left);
    const moveRight = this.isDown(this.keys.right);
    const direction = Number(moveRight) - Number(moveLeft);
    const runHeld = this.isDown(this.keys.run);
    const speed = runHeld ? settings.runSpeed : settings.walkSpeed;
    const previousBottom = this.body.y + this.body.height;
    const wasOnGround = this.body.onGround;

    if (direction !== 0 && time >= this.hurtUntil) {
      this.facingRight = direction > 0;
    }

    const effectiveDirection = time >= this.hurtUntil ? direction : 0;
    this.body.x += effectiveDirection * speed * seconds + this.playerKnockbackVelocityX * seconds;
    this.decayPlayerKnockback(seconds);
    this.body.velocityY += settings.gravity * seconds;
    this.body.y += this.body.velocityY * seconds;
    this.body.onGround = false;

    this.resolvePlatformCollisions(previousBottom);
    if (!wasOnGround && this.body.onGround) {
      this.playSfx(AUDIO_KEYS.playerLand);
    }

    this.body.x = Phaser.Math.Clamp(
      this.body.x,
      this.body.width / 2 + 18,
      this.cameras.main.width - this.body.width / 2 - 18
    );

    if (this.checkExitReached(time)) {
      return;
    }

    if (this.body.onGround && this.justDown(this.keys.jump) && time >= this.hurtUntil) {
      this.body.velocityY = -settings.jumpSpeed;
      this.body.onGround = false;
      this.playSfx(AUDIO_KEYS.playerJump);
    }

    let attackStarted = false;
    if (this.justDown(this.keys.attack) && time >= this.hurtUntil && time >= this.attackUntil) {
      const variantId = normalizeCharacterVariantId(settings.characterVariant);
      const attack = getPlayerAttackAnimation(variantId);
      this.attackUntil = time + (attack.frames / this.getCharacterAnimationFps(attack.id, variantId)) * 1000;
      this.playerAttackConnected = false;
      this.activeAnimationKey = '';
      attackStarted = true;
      this.playSfx(AUDIO_KEYS.playerAttack);
    }

    const animationId = this.resolveAnimation(time, direction, runHeld);
    this.updatePlayerRender(animationId);

    if ((attackStarted || time < this.attackUntil) && this.canPlayerAttackHit()) {
      const hitTurret = this.tryDamageTurret(time);
      const hitScavenger = this.tryDamageScavenger(time);
      const didHit = hitTurret || hitScavenger;
      this.playerAttackConnected = this.playerAttackConnected || didHit;
    }
  }

  private checkExitReached(time: number): boolean {
    if (this.exitCutscene || this.isDead) {
      return false;
    }

    if (!Phaser.Geom.Intersects.RectangleToRectangle(this.getPlayerBodyRect(), this.exit.trigger)) {
      return false;
    }

    this.exitCutscene = {
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
    this.clearProjectiles();
    this.clearTransientEffects();
    this.ensureExitBars();
    this.stopMainMusic();
    this.playSfx(AUDIO_KEYS.exitChuteEnter);
    return true;
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

    const targetX = this.exit.trigger.centerX;
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
        phase: 'enter',
        startedAt: time
      };
      this.activeAnimationKey = '';
    }

    const animation = getCharacterAnimation('enter_chute', 'nosnap');
    const animationMs = (animation.frames / animation.fps) * 1000;
    const elapsed = time - this.exitCutscene.startedAt;
    this.exitFadeProgress = Phaser.Math.Clamp(elapsed / EXIT_FADE_DURATION_MS, 0, 1);
    this.updatePlayerRender('enter_chute');

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
      .text(0, 10, 'Exit chute reached', {
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
    const panelWidth = Math.min(540, camera.width - 72);
    const panel = this.add
      .rectangle(0, 0, panelWidth, 168, 0x160b16, 0.88)
      .setStrokeStyle(2, 0xef4444, 0.95);
    const accent = this.add.rectangle(0, -72, panelWidth - 42, 3, 0xfb7185, 0.95);
    const title = this.add
      .text(0, -36, 'GAME OVER', {
        align: 'center',
        color: '#fecdd3',
        fontFamily: 'monospace',
        fontSize: '32px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(0, 8, 'The playground loop ended', {
        align: 'center',
        color: '#cbd5e1',
        fontFamily: 'monospace',
        fontSize: '15px'
      })
      .setOrigin(0.5);
    const prompt = this.add
      .text(0, 52, 'R: retry  •  Esc: menu', {
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

    this.resetPlayground();
    return true;
  }

  private updateDeadPlayerPhysics(seconds: number, gravity: number): void {
    const previousBottom = this.body.y + this.body.height;

    this.body.x += this.playerKnockbackVelocityX * seconds;
    this.decayPlayerKnockback(seconds);
    this.body.velocityY += gravity * seconds;
    this.body.y += this.body.velocityY * seconds;
    this.body.onGround = false;
    this.resolvePlatformCollisions(previousBottom);
    this.body.x = Phaser.Math.Clamp(
      this.body.x,
      this.body.width / 2 + 18,
      this.cameras.main.width - this.body.width / 2 - 18
    );
  }

  private updateTurret(time: number, seconds: number): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );

    this.syncTurretSettings();
    this.turret.setVisible(settings.turretActive);

    if (!settings.turretActive) {
      this.clearProjectiles();
      this.clearTransientEffects();
      return;
    }

    this.positionTurret();

    if (!this.isTurretDead && this.isPlayerInTurretRange(settings.turretShootingRange)) {
      if (time >= this.turretNextShotAt) {
        this.fireTurretProjectile(time, settings.turretCooldownSeconds, settings.turretProjectileSpeed);
      }
    }

    this.updateProjectiles(time, seconds, settings.turretProjectileDamage);
    this.updateTurretRender(time);
  }

  private updateScavenger(time: number, seconds: number): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );

    this.syncScavengerSettings();
    this.scavenger.setVisible(settings.scavengerActive);

    if (!settings.scavengerActive) {
      return;
    }

    if (this.isScavengerDead) {
      this.scavengerState = 'death';
      this.applyScavengerKnockback(seconds);
      this.positionScavenger();
      this.updateScavengerRender(time, false);
      return;
    }

    if (time < this.scavengerHurtUntil) {
      this.scavengerState = 'hurt';
      this.applyScavengerKnockback(seconds);
      this.positionScavenger();
      this.updateScavengerRender(time, false);
      return;
    }

    if (time < this.scavengerAttackUntil) {
      this.scavengerState = 'attack';
      this.tryScavengerAttackHit(time, settings.scavengerKnockback);
      this.positionScavenger();
      this.updateScavengerRender(time, false);
      return;
    }

    const platform = this.getScavengerPlatform();
    const playerRect = this.getPlayerBodyRect();
    const enemyRect = this.getScavengerWorldRect('collision', 'walk');
    const playerDeltaX = playerRect.centerX - enemyRect.centerX;
    const isFacingPlayer = playerDeltaX === 0 || Math.sign(playerDeltaX) === this.scavengerDirection;
    const isPlayerOnSameLevel = this.isPlayerOnScavengerLevel(platform);
    const isPlayerInRange =
      Math.abs(playerDeltaX) <= settings.scavengerSightRange &&
      playerRect.centerX >= platform.start &&
      playerRect.centerX <= platform.end;
    const canTargetPlayer =
      !this.isDead &&
      time >= this.scavengerAggroCooldownUntil &&
      isPlayerOnSameLevel &&
      isPlayerInRange &&
      (this.scavengerTargetingPlayer || isFacingPlayer);

    this.scavengerTargetingPlayer = canTargetPlayer;

    if (canTargetPlayer && Math.abs(playerDeltaX) <= settings.scavengerAttackRange && time >= this.scavengerNextAttackAt) {
      this.scavengerDirection = playerDeltaX >= 0 ? 1 : -1;
      this.startScavengerAttack(time, settings.scavengerAttackCooldownSeconds);
      this.positionScavenger();
      this.updateScavengerRender(time, false);
      return;
    }

    const minX = platform.start + SCAVENGER_PATROL_MARGIN;
    const maxX = platform.end - SCAVENGER_PATROL_MARGIN;
    const speed = canTargetPlayer ? settings.scavengerChaseSpeed : settings.scavengerPatrolSpeed;

    if (canTargetPlayer) {
      this.scavengerDirection = playerDeltaX >= 0 ? 1 : -1;
      this.scavengerState = 'chase';
    } else {
      this.scavengerState = 'patrol';
    }

    const nextX = this.scavengerX + this.scavengerDirection * speed * seconds;

    if (nextX <= minX) {
      this.scavengerX = minX;
      this.scavengerDirection = canTargetPlayer && playerRect.centerX < enemyRect.centerX ? -1 : 1;
    } else if (nextX >= maxX) {
      this.scavengerX = maxX;
      this.scavengerDirection = canTargetPlayer && playerRect.centerX > enemyRect.centerX ? 1 : -1;
    } else {
      this.scavengerX = nextX;
    }

    if (speed > 0 && time >= this.scavengerNextStepAt) {
      this.scavengerNextStepAt = time + SCAVENGER_STEP_INTERVAL_MS;
      const stepRect = this.getScavengerWorldRect('collision', 'walk');
      if (isWorldBoundsInCameraView(this, stepRect.left, stepRect.right)) {
        this.playSfx(AUDIO_KEYS.scavengerStep);
      }
    }

    this.positionScavenger();
    this.updateScavengerRender(time, speed > 0);
  }

  private resolveAnimation(
    time: number,
    direction: number,
    runHeld: boolean
  ): CharacterAnimationId {
    if (this.health <= 0) {
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

  private syncTurretSettings(): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );

    if (settings.turretHealth !== this.activeTurretMaxHealth) {
      this.activeTurretMaxHealth = settings.turretHealth;
      this.turretHealth = settings.turretHealth;
      this.isTurretDead = false;
      this.turretHurtUntil = 0;
      this.turretAttackUntil = 0;
      this.activeTurretAnimationKey = '';
    }
  }

  private syncScavengerSettings(): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );

    if (settings.scavengerHealth !== this.activeScavengerMaxHealth) {
      this.activeScavengerMaxHealth = settings.scavengerHealth;
      this.scavengerHealth = settings.scavengerHealth;
      this.isScavengerDead = false;
      this.scavengerHurtUntil = 0;
    this.scavengerAttackUntil = 0;
    this.scavengerNextAttackAt = 0;
    this.scavengerAggroCooldownUntil = 0;
    this.scavengerTargetingPlayer = false;
    this.scavengerKnockbackVelocityX = 0;
    this.activeScavengerAnimationKey = '';
    }
  }

  private isPlayerInTurretRange(range: number): boolean {
    if (this.isDead) {
      return false;
    }

    const turretRect = this.getTurretWorldRect('collision');
    const playerCenterX = this.body.x;
    const playerCenterY = this.body.y + this.body.height / 2;
    const turretCenterX = turretRect.centerX;
    const turretCenterY = turretRect.centerY;
    const isFacingPlayer = playerCenterX < turretCenterX;
    const distance = Phaser.Math.Distance.Between(
      playerCenterX,
      playerCenterY,
      turretCenterX,
      turretCenterY
    );

    return isFacingPlayer && distance <= range;
  }

  private fireTurretProjectile(
    time: number,
    cooldownSeconds: number,
    projectileSpeed: number
  ): void {
    const attackBounds = this.getTurretWorldRect('attack');
    const attackAnimation = getEnemyAnimation('attack');
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
        .setDepth(54)
        .play(TURRET_CANNONBALL_EFFECT.animationKey),
      velocityX: -projectileSpeed
    };

    this.turretProjectiles.push(projectile);
    this.spawnMuzzleEffects(attackBounds.left, attackBounds.centerY);
    this.playSfx(AUDIO_KEYS.turretFire);
    this.turretNextShotAt = time + cooldownSeconds * 1000;
    this.turretAttackUntil = time + (attackAnimation.frames / attackAnimation.fps) * 1000;
    this.updateTurretRender(time);
  }

  private updateProjectiles(time: number, seconds: number, damage: number): void {
    const playerRect = this.getPlayerBodyRect();

    this.turretProjectiles = this.turretProjectiles.filter((projectile) => {
      projectile.rect.x += projectile.velocityX * seconds;
      projectile.sprite.setPosition(projectile.rect.centerX, projectile.rect.centerY);

      const didHitPlayer =
        !this.isDead &&
        time >= this.damageReadyAt &&
        Phaser.Geom.Intersects.RectangleToRectangle(projectile.rect, playerRect);

      if (didHitPlayer) {
        this.damagePlayer(time, damage);
        this.spawnProjectileImpact(projectile.rect.centerX, projectile.rect.centerY);
        this.playSfx(AUDIO_KEYS.projectileImpact);
        projectile.sprite.destroy();
        return false;
      }

      if (projectile.rect.right < -40) {
        projectile.sprite.destroy();
        return false;
      }

      return true;
    });
  }

  private clearProjectiles(): void {
    this.turretProjectiles.forEach((projectile) => projectile.sprite.destroy());
    this.turretProjectiles = [];
  }

  private clearTransientEffects(): void {
    this.transientEffects.forEach((effect) => {
      if (effect.scene) {
        effect.destroy();
      }
    });
    this.transientEffects = [];
  }

  private spawnMuzzleEffects(x: number, y: number): void {
    const smokeDuration =
      (TURRET_MUZZLE_SMOKE_EFFECT.frames / TURRET_MUZZLE_SMOKE_EFFECT.fps) * 1000 + 80;
    const smoke = this.add
      .sprite(x - 20, y - 2, TURRET_MUZZLE_SMOKE_EFFECT.key, 0)
      .setDepth(53)
      .setScale(0.72)
      .play(TURRET_MUZZLE_SMOKE_EFFECT.animationKey);
    this.trackTransientEffect(smoke, smokeDuration);

    for (let index = 0; index < 5; index += 1) {
      const particle = this.add
        .circle(x - 6, y + Phaser.Math.Between(-8, 8), Phaser.Math.Between(2, 4), 0xfacc15, 0.95)
        .setDepth(55);
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
      .setDepth(55)
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

  private tryDamageTurret(time: number): boolean {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );

    if (!settings.turretActive || this.isTurretDead) {
      return false;
    }

    const attackRect = this.getPlayerAnimationWorldRect(
      getPlayerAttackAnimation(this.activeCharacterVariantId).id,
      'attack'
    );
    const turretHurtRect = this.getTurretWorldRect('hurt');

    if (!Phaser.Geom.Intersects.RectangleToRectangle(attackRect, turretHurtRect)) {
      return false;
    }

    this.turretHealth = Math.max(0, this.turretHealth - 1);
    this.turretHurtUntil = time + TURRET_HURT_DURATION_MS;
    this.turretAttackUntil = 0;
    this.playSfx(AUDIO_KEYS.enemyHit);

    if (this.turretHealth <= 0) {
      this.isTurretDead = true;
      this.clearProjectiles();
    }

    return true;
  }

  private tryDamageScavenger(time: number): boolean {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );

    if (!settings.scavengerActive || this.isScavengerDead) {
      return false;
    }

    const attackRect = this.getPlayerAnimationWorldRect(
      getPlayerAttackAnimation(this.activeCharacterVariantId).id,
      'attack'
    );
    const scavengerHurtRect = this.getScavengerWorldRect('hurt');

    if (!Phaser.Geom.Intersects.RectangleToRectangle(attackRect, scavengerHurtRect)) {
      return false;
    }

    this.scavengerHealth = Math.max(0, this.scavengerHealth - 1);
    this.applyScavengerHitReaction();
    this.scavengerHurtUntil = time + SCAVENGER_HURT_DURATION_MS;
    this.scavengerAggroCooldownUntil = time + SCAVENGER_AFTER_HIT_AGGRO_COOLDOWN_MS;
    this.scavengerTargetingPlayer = false;
    this.scavengerAttackUntil = 0;
    this.scavengerAttackConnected = false;
    this.playSfx(AUDIO_KEYS.enemyHit);

    if (this.scavengerHealth <= 0) {
      this.isScavengerDead = true;
      this.scavengerState = 'death';
    }

    return true;
  }

  private startScavengerAttack(time: number, cooldownSeconds: number): void {
    const animation = getEnemyAnimation('attack', SCAVENGER_BOT_ENEMY_ID);
    this.scavengerState = 'attack';
    this.scavengerAttackUntil = time + (animation.frames / animation.fps) * 1000;
    this.scavengerNextAttackAt = time + cooldownSeconds * 1000;
    this.scavengerAttackConnected = false;
    this.activeScavengerAnimationKey = '';
    this.playSfx(AUDIO_KEYS.scavengerAttack);
  }

  private tryScavengerAttackHit(time: number, knockback: number): void {
    if (this.scavengerAttackConnected || this.isDead || time < this.damageReadyAt) {
      return;
    }

    const attackRect = this.getScavengerWorldRect('attack', 'attack');
    const playerRect = this.getPlayerBodyRect();

    if (!Phaser.Geom.Intersects.RectangleToRectangle(attackRect, playerRect)) {
      return;
    }

    const knockbackX = this.scavengerDirection > 0 ? knockback : -knockback;
    this.damagePlayer(time, 1, knockbackX, -240);
    this.scavengerAggroCooldownUntil = time + SCAVENGER_AFTER_ATTACK_AGGRO_COOLDOWN_MS;
    this.scavengerTargetingPlayer = false;
    this.scavengerAttackConnected = true;
  }

  private applyScavengerHitReaction(): void {
    const hitDirection = this.body.x <= this.scavengerX ? 1 : -1;

    this.scavengerDirection = -hitDirection;
    this.scavengerKnockbackVelocityX = hitDirection * SCAVENGER_HIT_KNOCKBACK;
    this.scavengerState = 'hurt';
    this.activeScavengerAnimationKey = '';
  }

  private applyScavengerKnockback(seconds: number): void {
    if (this.scavengerKnockbackVelocityX === 0) {
      return;
    }

    const platform = this.getScavengerPlatform();
    const minX = platform.start + SCAVENGER_PATROL_MARGIN;
    const maxX = platform.end - SCAVENGER_PATROL_MARGIN;

    this.scavengerX = Phaser.Math.Clamp(
      this.scavengerX + this.scavengerKnockbackVelocityX * seconds,
      minX,
      maxX
    );

    if (this.scavengerX === minX || this.scavengerX === maxX) {
      this.scavengerKnockbackVelocityX = 0;
      return;
    }

    const decay = SCAVENGER_KNOCKBACK_DECAY * seconds;

    if (Math.abs(this.scavengerKnockbackVelocityX) <= decay) {
      this.scavengerKnockbackVelocityX = 0;
      return;
    }

    this.scavengerKnockbackVelocityX -= Math.sign(this.scavengerKnockbackVelocityX) * decay;
  }

  private damagePlayer(time: number, amount = 1, knockbackX = 0, knockbackY = 0): void {
    if (this.isDead || time < this.damageReadyAt) {
      return;
    }

    const previousHealth = this.health;
    this.health = Math.max(0, this.health - amount);
    this.damageReadyAt = time + DAMAGE_COOLDOWN_MS;
    this.hurtUntil = time + HURT_DURATION_MS;
    this.attackUntil = 0;
    this.playerAttackConnected = false;
    this.playerKnockbackVelocityX = knockbackX;
    this.playSfx(AUDIO_KEYS.playerHurt);

    if (previousHealth > 1 && this.health === 1) {
      this.playSfx(AUDIO_KEYS.healthLow);
    }

    if (knockbackY !== 0) {
      this.body.velocityY = Math.min(this.body.velocityY, knockbackY);
      this.body.onGround = false;
    }

    if (this.health <= 0) {
      this.isDead = true;
      this.hurtUntil = 0;
      this.stopMainMusic();
      this.showGameOverOverlay();
      this.playSfx(AUDIO_KEYS.musicGameOver);
    }
  }

  private getPlayerBodyRect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.body.x - this.body.width / 2,
      this.body.y,
      this.body.width,
      this.body.height
    );
  }

  private getPlayerAnimationWorldRect(
    animationId: CharacterAnimationId,
    boundsKind: 'visual' | 'collision' | 'attack'
  ): Phaser.Geom.Rectangle {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );
    const variantId = normalizeCharacterVariantId(settings.characterVariant);
    const sourceBounds = this.characterBoundsByVariant[variantId][animationId][boundsKind];
    const bounds =
      this.facingRight && boundsKind !== 'collision'
        ? {
            ...sourceBounds,
            x: CHARACTER_FRAME.width - sourceBounds.x - sourceBounds.width
          }
        : sourceBounds;

    return new Phaser.Geom.Rectangle(
      this.player.x + (bounds.x - CHARACTER_CENTER.x) * settings.characterScale,
      this.player.y + (bounds.y - CHARACTER_CENTER.y) * settings.characterScale,
      bounds.width * settings.characterScale,
      bounds.height * settings.characterScale
    );
  }

  private positionTurret(): void {
    const collision = this.enemyBounds.idle.collision;
    const xOffset = (collision.x + collision.width / 2 - TURRET_CENTER.x) * TURRET_SCALE;
    const yOffset = (collision.y + collision.height - TURRET_CENTER.y) * TURRET_SCALE;

    this.turret.setPosition(this.turretCollisionX - xOffset, this.turretSurfaceY - yOffset);
  }

  private positionScavenger(): void {
    const platform = this.getScavengerPlatform();
    const animationId = this.resolveScavengerAnimationId(this.time.now);
    const collision = this.getScavengerDisplayBounds(animationId, 'collision');
    const xOffset = (collision.x + collision.width / 2 - ENEMY_CENTER.x) * SCAVENGER_SCALE;
    const yOffset = (collision.y + collision.height - ENEMY_CENTER.y) * SCAVENGER_SCALE;

    this.scavenger.setPosition(this.scavengerX - xOffset, platform.collisionY - yOffset);
  }

  private getTurretWorldRect(boundsKind: keyof EnemyAnimationBounds): Phaser.Geom.Rectangle {
    const animationId = this.resolveTurretAnimationId(this.time.now);
    const bounds = this.enemyBounds[animationId][boundsKind];

    return new Phaser.Geom.Rectangle(
      this.turret.x + (bounds.x - TURRET_CENTER.x) * TURRET_SCALE,
      this.turret.y + (bounds.y - TURRET_CENTER.y) * TURRET_SCALE,
      bounds.width * TURRET_SCALE,
      bounds.height * TURRET_SCALE
    );
  }

  private getScavengerWorldRect(
    boundsKind: keyof EnemyAnimationBounds,
    animationId = this.resolveScavengerAnimationId(this.time.now)
  ): Phaser.Geom.Rectangle {
    const bounds = this.getScavengerDisplayBounds(animationId, boundsKind);

    return new Phaser.Geom.Rectangle(
      this.scavenger.x + (bounds.x - ENEMY_CENTER.x) * SCAVENGER_SCALE,
      this.scavenger.y + (bounds.y - ENEMY_CENTER.y) * SCAVENGER_SCALE,
      bounds.width * SCAVENGER_SCALE,
      bounds.height * SCAVENGER_SCALE
    );
  }

  private getScavengerDisplayBounds(
    animationId: EnemyAnimationId,
    boundsKind: keyof EnemyAnimationBounds
  ): EnemyAnimationBounds['visual'] {
    const sourceBounds = this.scavengerBounds[animationId][boundsKind];

    if (this.scavengerDirection <= 0) {
      return sourceBounds;
    }

    return {
      ...sourceBounds,
      x: ENEMY_FRAME.width - sourceBounds.x - sourceBounds.width
    };
  }

  private getScavengerPlatform(): SolidPlatform {
    return (
      this.scavengerPlatform ??
      this.platforms.find((platform) => platform.collisionY < this.level.surfaceY) ??
      this.platforms[0]
    );
  }

  private findScavengerPlatform(enemy: LevelEnemy | null): SolidPlatform {
    const fallback =
      this.platforms.find((platform) => platform.collisionY < this.level.surfaceY) ??
      this.platforms[0];

    if (!enemy || this.platforms.length === 0) {
      return fallback;
    }

    const xMargin = SCAVENGER_PATROL_MARGIN;
    return this.platforms.reduce((best, platform) => {
      const bestScore = this.scorePlatformForEnemy(best, enemy, xMargin);
      const score = this.scorePlatformForEnemy(platform, enemy, xMargin);
      return score < bestScore ? platform : best;
    }, fallback);
  }

  private scorePlatformForEnemy(
    platform: SolidPlatform,
    enemy: LevelEnemy,
    xMargin: number
  ): number {
    const minX = platform.start - xMargin;
    const maxX = platform.end + xMargin;
    const xPenalty =
      enemy.x < minX ? minX - enemy.x : enemy.x > maxX ? enemy.x - maxX : 0;
    const yPenalty = Math.abs(platform.collisionY - enemy.y);

    return xPenalty * 4 + yPenalty;
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

  private isPlayerOnScavengerLevel(platform: SolidPlatform): boolean {
    const standingPlatform = this.getPlayerStandingPlatform();

    if (standingPlatform) {
      return standingPlatform === platform;
    }

    const bodyLeft = this.body.x - this.body.width / 2;
    const bodyRight = this.body.x + this.body.width / 2;
    const bodyBottom = this.body.y + this.body.height;

    return (
      bodyRight > platform.start + 8 &&
      bodyLeft < platform.end - 8 &&
      bodyBottom <= platform.collisionY + 8 &&
      bodyBottom >= platform.collisionY - SCAVENGER_AIRBORNE_LEVEL_TOLERANCE
    );
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

  private updatePlayerRender(animationId: CharacterAnimationId): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );
    const variantId =
      animationId === 'enter_chute'
        ? 'nosnap'
        : normalizeCharacterVariantId(settings.characterVariant);
    const animation = getCharacterAnimation(animationId, variantId);
    const timeScale = this.getCharacterAnimationTimeScale(animationId, variantId);

    this.player.setFlipX(animation.direction === 'w' && this.facingRight);
    this.player.setScale(settings.characterScale);
    this.player.setAlpha(this.exitCutscene?.phase === 'enter' ? 1 - this.exitFadeProgress : 1);
    this.player.setVisible(settings.useCharacterSprite || Boolean(this.exitCutscene));
    this.playerPlaceholder.setVisible(!settings.useCharacterSprite && !this.exitCutscene);

    if (this.activeAnimationKey !== animation.animationKey) {
      this.player.play({ key: animation.animationKey, timeScale }, true);
      this.activeAnimationKey = animation.animationKey;
    } else {
      this.player.anims.timeScale = timeScale;
    }

    const collision = this.getDisplayCollision(animationId, variantId);
    const collisionCenterOffset =
      (collision.x + collision.width / 2 - CHARACTER_CENTER.x) * settings.characterScale;
    const collisionBottomOffset =
      (collision.y + collision.height - CHARACTER_CENTER.y) * settings.characterScale;
    const bodyBottom = this.body.y + this.body.height;

    this.player.setPosition(
      this.body.x - collisionCenterOffset,
      bodyBottom - collisionBottomOffset - this.exitFadeProgress * EXIT_ASCEND_PIXELS
    );
    this.playerPlaceholder
      .setPosition(this.body.x, this.body.y + this.body.height / 2)
      .setSize(this.body.width, this.body.height)
      .setDisplaySize(this.body.width, this.body.height);
  }

  private updateTurretRender(time: number): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );
    const animation = getEnemyAnimation(this.resolveTurretAnimationId(time));

    this.turret.setVisible(settings.turretActive);
    this.turret.setScale(TURRET_SCALE);

    if (!settings.turretActive) {
      return;
    }

    if (this.activeTurretAnimationKey !== animation.animationKey) {
      this.turret.play(animation.animationKey, true);
      this.activeTurretAnimationKey = animation.animationKey;
    }
  }

  private updateScavengerRender(time: number, isMoving: boolean): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );
    const animationId = this.resolveScavengerAnimationId(time, isMoving);
    const animation = getEnemyAnimation(animationId, SCAVENGER_BOT_ENEMY_ID);

    this.scavenger.setVisible(settings.scavengerActive);
    this.scavenger.setScale(SCAVENGER_SCALE);
    this.scavenger.setFlipX(this.scavengerDirection > 0);

    if (!settings.scavengerActive) {
      return;
    }

    if (this.activeScavengerAnimationKey !== animation.animationKey) {
      this.scavenger.play(animation.animationKey, true);
      this.activeScavengerAnimationKey = animation.animationKey;
    }
  }

  private resolveTurretAnimationId(time: number): EnemyAnimationId {
    if (this.isTurretDead) {
      return 'death';
    }

    if (time < this.turretHurtUntil) {
      return 'hurt';
    }

    if (time < this.turretAttackUntil) {
      return 'attack';
    }

    return 'idle';
  }

  private resolveScavengerAnimationId(time: number, isMoving = false): EnemyAnimationId {
    if (this.isScavengerDead || this.scavengerState === 'death') {
      return 'death';
    }

    if (time < this.scavengerHurtUntil || this.scavengerState === 'hurt') {
      return 'hurt';
    }

    if (time < this.scavengerAttackUntil || this.scavengerState === 'attack') {
      return 'attack';
    }

    if (isMoving || this.scavengerState === 'patrol' || this.scavengerState === 'chase') {
      return 'walk';
    }

    return 'idle';
  }

  private getDisplayCollision(
    animationId: CharacterAnimationId,
    variantId = normalizeCharacterVariantId(
      this.app.debugStore.getState().characterPlayground.characterVariant
    )
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

  private updateHud(): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );

    this.hudGraphics.clear();
    this.playerHealthHud.update(this.health, MAX_HEALTH, this.time.now);

    if (settings.turretActive) {
      this.drawEnemyHealthBar(
        this.getTurretWorldRect('collision'),
        this.turretHealth,
        this.activeTurretMaxHealth,
        this.isTurretDead,
        0xfacc15
      );
    }

    if (settings.scavengerActive) {
      this.drawEnemyHealthBar(
        this.getScavengerWorldRect('collision'),
        this.scavengerHealth,
        this.activeScavengerMaxHealth,
        this.isScavengerDead,
        0xfb923c
      );
    }
  }

  private drawEnemyHealthBar(
    rect: Phaser.Geom.Rectangle,
    health: number,
    maxHealth: number,
    isDead: boolean,
    color: number
  ): void {
    const barWidth = 88;
    const barHeight = 8;
    const x = rect.centerX - barWidth / 2;
    const y = rect.top - 24;
    const ratio = maxHealth > 0 ? Phaser.Math.Clamp(health / maxHealth, 0, 1) : 0;

    this.hudGraphics.fillStyle(0x172033, 0.9);
    this.hudGraphics.fillRoundedRect(x, y, barWidth, barHeight, 2);
    this.hudGraphics.fillStyle(isDead ? 0xef4444 : color, 0.95);
    this.hudGraphics.fillRoundedRect(x, y, barWidth * ratio, barHeight, 2);
    this.hudGraphics.lineStyle(2, 0xf8fafc, 0.72);
    this.hudGraphics.strokeRoundedRect(x, y, barWidth, barHeight, 2);
  }

  private drawDebug(): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );

    this.debugGraphics.clear();

    if (!settings.showHitboxes) {
      return;
    }

    this.debugGraphics.lineStyle(2, 0x39ff7a, 0.9);
    this.debugGraphics.fillStyle(0x39ff7a, 0.08);
    this.platforms.forEach((platform) => {
      this.debugGraphics.strokeRect(
        platform.start,
        platform.collisionY,
        platform.end - platform.start,
        platform.collisionHeight
      );
    });

    this.debugGraphics.lineStyle(2, 0x38bdf8, 0.95);
    this.debugGraphics.strokeRect(
      this.body.x - this.body.width / 2,
      this.body.y,
      this.body.width,
      this.body.height
    );

    this.debugGraphics.lineStyle(2, 0xfacc15, 0.95);
    this.debugGraphics.strokeRect(
      this.exit.trigger.x,
      this.exit.trigger.y,
      this.exit.trigger.width,
      this.exit.trigger.height
    );

    if (settings.turretActive) {
      const turretCollision = this.getTurretWorldRect('collision');
      const turretHurt = this.getTurretWorldRect('hurt');
      const turretAttack = this.getTurretWorldRect('attack');

      this.debugGraphics.lineStyle(2, 0xfacc15, 0.9);
      this.debugGraphics.strokeCircle(
        turretCollision.centerX,
        turretCollision.centerY,
        settings.turretShootingRange
      );
      this.debugGraphics.strokeRect(
        turretCollision.x,
        turretCollision.y,
        turretCollision.width,
        turretCollision.height
      );

      this.debugGraphics.lineStyle(2, 0xef4444, 0.95);
      this.debugGraphics.strokeRect(
        turretHurt.x,
        turretHurt.y,
        turretHurt.width,
        turretHurt.height
      );

      this.debugGraphics.lineStyle(2, 0xffffff, 0.9);
      this.debugGraphics.strokeRect(
        turretAttack.x,
        turretAttack.y,
        turretAttack.width,
        turretAttack.height
      );

      this.debugGraphics.lineStyle(2, 0xfb923c, 0.95);
      this.turretProjectiles.forEach((projectile) => {
        this.debugGraphics.strokeRect(
          projectile.rect.x,
          projectile.rect.y,
          projectile.rect.width,
          projectile.rect.height
        );
      });
    }

    if (settings.scavengerActive) {
      const platform = this.getScavengerPlatform();
      const scavengerCollision = this.getScavengerWorldRect('collision');
      const scavengerHurt = this.getScavengerWorldRect('hurt');
      const scavengerAttack = this.getScavengerWorldRect('attack');

      this.debugGraphics.lineStyle(2, 0xfb923c, 0.9);
      this.debugGraphics.strokeRect(
        platform.start + SCAVENGER_PATROL_MARGIN,
        platform.collisionY - 6,
        platform.end - platform.start - SCAVENGER_PATROL_MARGIN * 2,
        12
      );
      this.debugGraphics.strokeCircle(
        scavengerCollision.centerX,
        scavengerCollision.centerY,
        settings.scavengerSightRange
      );
      this.debugGraphics.strokeRect(
        scavengerCollision.x,
        scavengerCollision.y,
        scavengerCollision.width,
        scavengerCollision.height
      );

      this.debugGraphics.lineStyle(2, 0xffffff, 0.95);
      this.debugGraphics.strokeRect(
        scavengerHurt.x,
        scavengerHurt.y,
        scavengerHurt.width,
        scavengerHurt.height
      );

      this.debugGraphics.lineStyle(2, 0xef4444, 0.95);
      this.debugGraphics.strokeRect(
        scavengerAttack.x,
        scavengerAttack.y,
        scavengerAttack.width,
        scavengerAttack.height
      );
    }
  }

  private updateAssetLabels(): void {
    if (!this.app.debugStore.getState().showAssetLabels) {
      this.assetLabels = syncAssetLabels(this, this.assetLabels, []);
      return;
    }

    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );
    const specs: AssetLabelSpec[] = [];

    [...this.floorSprites, ...this.platformSprites].forEach((sprite) => {
      const bounds = sprite.getBounds();
      specs.push({
        text: String(sprite.frame.name),
        x: bounds.centerX,
        y: bounds.top - 4,
        depth: 120
      });
    });

    this.propSprites.forEach((sprite) => {
      const bounds = sprite.getBounds();
      specs.push({
        text: String(sprite.frame.name),
        x: bounds.centerX,
        y: bounds.top - 4,
        depth: 120
      });
    });

    specs.push({
      text: settings.useCharacterSprite ? this.player.texture.key : 'template-player',
      x: this.body.x,
      y: this.body.y - 6,
      depth: 120
    });

    const exitBounds = this.exit.sprite.getBounds();
    specs.push({
      text: this.exitData.frame,
      x: exitBounds.centerX,
      y: exitBounds.top - 6,
      depth: 120
    });

    if (settings.turretActive) {
      const turretBounds = this.turret.getBounds();
      specs.push({
        text: this.turret.texture.key,
        x: turretBounds.centerX,
        y: turretBounds.top - 6,
        depth: 120
      });
    }

    if (settings.scavengerActive) {
      const scavengerBounds = this.scavenger.getBounds();
      specs.push({
        text: this.scavenger.texture.key,
        x: scavengerBounds.centerX,
        y: scavengerBounds.top - 6,
        depth: 120
      });
    }

    this.assetLabels = syncAssetLabels(this, this.assetLabels, specs);
  }

  private syncPlatformPresentation(): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );

    this.floorSprites.forEach((sprite) => sprite.setVisible(settings.usePlatformSprites));
    this.platformSprites.forEach((sprite) => sprite.setVisible(settings.usePlatformSprites));
    this.platformPlaceholders.forEach((placeholder) =>
      placeholder.setVisible(!settings.usePlatformSprites)
    );
  }

  private respawnPlayer(): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );
    const variantId = normalizeCharacterVariantId(settings.characterVariant);
    const collision = this.characterBoundsByVariant[variantId].run.collision;
    this.activeCharacterScale = settings.characterScale;
    this.activeCharacterVariantId = variantId;
    this.playerKnockbackVelocityX = 0;
    this.destroyGameOverOverlay();
    this.body = {
      x: this.level.playerStart.x,
      y: this.level.playerStart.y - collision.height * settings.characterScale,
      velocityY: 0,
      width: collision.width * settings.characterScale,
      height: collision.height * settings.characterScale,
      onGround: true
    };
    this.activeAnimationKey = '';
  }

  private applyCharacterScale(scale: number, variantId: CharacterVariantId): void {
    if (scale === this.activeCharacterScale && variantId === this.activeCharacterVariantId) {
      return;
    }

    const collision = this.characterBoundsByVariant[variantId].run.collision;
    const bodyBottom = this.body.y + this.body.height;
    this.body.width = collision.width * scale;
    this.body.height = collision.height * scale;
    this.body.y = bodyBottom - this.body.height;
    this.activeCharacterScale = scale;
    this.activeCharacterVariantId = variantId;
    this.activeAnimationKey = '';
  }

  private resetPlayground(): void {
    const settings = normalizeCharacterPlaygroundConfig(
      this.app.debugStore.getState().characterPlayground
    );

    this.health = MAX_HEALTH;
    this.hurtUntil = 0;
    this.attackUntil = 0;
    this.playerAttackConnected = false;
    this.damageReadyAt = 0;
    this.isDead = false;
    this.facingRight = true;
    this.exitCutscene = null;
    this.exitFadeProgress = 0;
    this.destroyExitBars();
    this.destroyExitClearOverlay();
    this.destroyGameOverOverlay();
    this.activeTurretMaxHealth = settings.turretHealth;
    this.turretHealth = settings.turretHealth;
    this.turretHurtUntil = 0;
    this.turretAttackUntil = 0;
    this.turretNextShotAt = 0;
    this.isTurretDead = false;
    this.activeTurretAnimationKey = '';
    this.activeScavengerMaxHealth = settings.scavengerHealth;
    this.scavengerHealth = settings.scavengerHealth;
    this.scavengerHurtUntil = 0;
    this.scavengerAttackUntil = 0;
    this.scavengerNextAttackAt = 0;
    this.scavengerNextStepAt = 0;
    this.scavengerAttackConnected = false;
    this.scavengerAggroCooldownUntil = 0;
    this.scavengerTargetingPlayer = false;
    this.scavengerKnockbackVelocityX = 0;
    this.isScavengerDead = false;
    this.scavengerDirection = 1;
    this.scavengerState = 'patrol';
    this.activeScavengerAnimationKey = '';
    const scavengerEnemy = this.getLevelEnemy(SCAVENGER_BOT_ENEMY_ID);
    this.scavengerPlatform = this.findScavengerPlatform(scavengerEnemy);
    this.scavengerX =
      scavengerEnemy?.x ?? this.getScavengerPlatform().start + SCAVENGER_PATROL_MARGIN;
    this.clearProjectiles();
    this.clearTransientEffects();
    this.positionTurret();
    this.positionScavenger();
    this.respawnPlayer();
    this.updateTurretRender(0);
    this.updateScavengerRender(0, false);
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
      const boundsByEnemy = normalizeEnemyBoundsByEnemy(parsed);
      this.enemyBounds = boundsByEnemy[TURRET_ENEMY_ID];
      this.scavengerBounds = boundsByEnemy[SCAVENGER_BOT_ENEMY_ID];
      if (this.levelObjectsReady) {
        this.positionTurret();
        this.positionScavenger();
        this.activeTurretAnimationKey = '';
        this.activeScavengerAnimationKey = '';
        this.updateTurretRender(0);
        this.updateScavengerRender(0, false);
      }
    } catch {
      this.enemyBounds = normalizeEnemyBoundsMap(DEFAULT_ENEMY_BOUNDS);
      this.scavengerBounds = normalizeEnemyBoundsMap(
        DEFAULT_ENEMY_BOUNDS_BY_ENEMY[SCAVENGER_BOT_ENEMY_ID],
        SCAVENGER_BOT_ENEMY_ID
      );
    }
  }

  private isDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((key) => key.isDown);
  }

  private justDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((key) => Phaser.Input.Keyboard.JustDown(key));
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
}

function loadPlatformingMetadata(cache: Phaser.Cache.BaseCache): PlatformingElementMetadataMap {
  return loadCachedPlatformingMetadata(cache);
}
