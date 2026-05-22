import * as Phaser from 'phaser';

import { clearAssetLabels, syncAssetLabels } from '../game/debugLabels';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_CENTER,
  CHARACTER_DISPLAY_NAME,
  CHARACTER_FRAME,
  DEFAULT_CHARACTER_ANIMATION_FPS_BY_VARIANT,
  DEFAULT_CHARACTER_BOUNDS_BY_VARIANT,
  DEFAULT_CHARACTER_HIT_FRAMES_BY_VARIANT,
  cloneCharacterAnimationFpsByVariant,
  cloneCharacterBoundsByVariant,
  cloneCharacterHitFramesByVariant,
  getCharacterAnimation,
  getCharacterAnimationsForVariant,
  getCharacterVariant,
  normalizeCharacterAnimationFpsByVariant,
  normalizeCharacterBoundsByVariant,
  normalizeCharacterHitFramesByVariant,
  normalizeCharacterVariantId,
  type CharacterAnimationFpsByVariant,
  type CharacterAnimationBounds,
  type CharacterAnimationId,
  type CharacterBoundsByVariant,
  type CharacterHitFramesByVariant,
  type CharacterVariantId
} from '../game/characterAssets';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

declare global {
  var __ROBIN_CHUTE_CHARACTER_GYM__:
    | {
        active: boolean;
        selectedAnimationId: string;
        selectedVariantId: string;
        boundsByVariant: CharacterBoundsByVariant;
        fpsByVariant: CharacterAnimationFpsByVariant;
        hitFramesByVariant: CharacterHitFramesByVariant;
        currentFrame: number;
        zoom: number;
      }
    | undefined;
}

const GRID_MINOR = 16;
const GRID_MAJOR = 64;

export class CharacterGymScene extends BaseScene {
  private character!: Phaser.GameObjects.Sprite;
  private graphics!: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text | null = null;
  private detailText: Phaser.GameObjects.Text | null = null;
  private assetLabels: Phaser.GameObjects.Text[] = [];
  private boundsByVariant: CharacterBoundsByVariant = cloneCharacterBoundsByVariant(
    DEFAULT_CHARACTER_BOUNDS_BY_VARIANT
  );
  private fpsByVariant: CharacterAnimationFpsByVariant = cloneCharacterAnimationFpsByVariant(
    DEFAULT_CHARACTER_ANIMATION_FPS_BY_VARIANT
  );
  private hitFramesByVariant: CharacterHitFramesByVariant = cloneCharacterHitFramesByVariant(
    DEFAULT_CHARACTER_HIT_FRAMES_BY_VARIANT
  );
  private selectedAnimationId: CharacterAnimationId = CHARACTER_ANIMATIONS[0].id;
  private selectedVariantId: CharacterVariantId = 'snap';
  private previewZoom = 1;

  constructor() {
    super(SCENE_KEYS.CharacterGym);
  }

  create(): void {
    this.markActiveScene(SCENE_KEYS.CharacterGym);
    this.cameras.main.setBackgroundColor(0x0b1020);

    this.createGrid();
    this.createTestOverlay();
    this.createInput();

    this.graphics = this.add.graphics().setDepth(90).setScrollFactor(0);
    const previewCenter = this.getPreviewCenter();
    this.character = this.add
      .sprite(previewCenter.x, previewCenter.y, CHARACTER_ANIMATIONS[0].key, 0)
      .setOrigin(0.5)
      .setDepth(55)
      .setScrollFactor(0);

    this.syncFromGlobal();
    this.playSelectedAnimation(true);
    this.updateGymMarker();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (globalThis.__ROBIN_CHUTE_CHARACTER_GYM__) {
        globalThis.__ROBIN_CHUTE_CHARACTER_GYM__.active = false;
      }
      clearAssetLabels(this.assetLabels);
    });
  }

  update(): void {
    this.syncFromGlobal();
    this.playSelectedAnimation(false);
    this.drawBounds();
    this.updateReadout();
    this.updateGymMarker();
    this.updateAssetLabels();
  }

  private createTestOverlay(): void {
    this.titleText = this.add
      .text(24, 24, 'Character Gym', {
        backgroundColor: 'rgba(2, 6, 23, 0.52)',
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '20px',
        padding: { x: 12, y: 8 }
      })
      .setDepth(80)
      .setScrollFactor(0);

    this.detailText = this.add
      .text(24, 70, 'animation preview loading', {
        backgroundColor: 'rgba(2, 6, 23, 0.42)',
        color: '#cbd5e1',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: { x: 12, y: 8 }
      })
      .setDepth(80)
      .setScrollFactor(0);

    this.createFooterHint('Esc / Backspace: menu');
  }

  private createInput(): void {
    const escape = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const backspace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);

    escape?.on('down', () => this.goToMenu());
    backspace?.on('down', () => this.goToMenu());
    this.input.on(Phaser.Input.Events.POINTER_WHEEL, (_pointer: Phaser.Input.Pointer, _objects: unknown[], _dx: number, dy: number) => {
      const direction = dy > 0 ? -1 : 1;
      this.previewZoom = Phaser.Math.Clamp(
        Math.round((this.previewZoom + direction * 0.1) * 100) / 100,
        0.75,
        4
      );
    });
  }

  private createGrid(): void {
    const camera = this.cameras.main;
    const grid = this.add.graphics().setDepth(0).setScrollFactor(0);
    const previewCenter = this.getPreviewCenter();

    grid.fillStyle(0x0b1020, 1);
    grid.fillRect(0, 0, camera.width, camera.height);

    for (let x = 0; x <= camera.width; x += GRID_MINOR) {
      const isMajor = x % GRID_MAJOR === 0;
      grid.lineStyle(1, isMajor ? 0x334155 : 0x1e293b, isMajor ? 0.55 : 0.32);
      grid.lineBetween(x, 0, x, camera.height);
    }

    for (let y = 0; y <= camera.height; y += GRID_MINOR) {
      const isMajor = y % GRID_MAJOR === 0;
      grid.lineStyle(1, isMajor ? 0x334155 : 0x1e293b, isMajor ? 0.55 : 0.32);
      grid.lineBetween(0, y, camera.width, y);
    }

    grid.lineStyle(2, 0xeab308, 0.8);
    grid.lineBetween(previewCenter.x, 0, previewCenter.x, camera.height);
    grid.lineBetween(0, previewCenter.y, camera.width, previewCenter.y);
  }

  private syncFromGlobal(): void {
    const gymState = globalThis.__ROBIN_CHUTE_CHARACTER_GYM__;
    const nextVariantId = normalizeCharacterVariantId(gymState?.selectedVariantId);
    const nextAnimationId = normalizeAnimationId(
      gymState?.selectedAnimationId,
      nextVariantId
    );

    this.boundsByVariant = normalizeCharacterBoundsByVariant(gymState?.boundsByVariant);
    this.fpsByVariant = normalizeCharacterAnimationFpsByVariant(gymState?.fpsByVariant);
    this.hitFramesByVariant = normalizeCharacterHitFramesByVariant(
      gymState?.hitFramesByVariant
    );
    this.previewZoom = Phaser.Math.Clamp(gymState?.zoom ?? this.previewZoom, 0.75, 4);

    if (
      nextAnimationId !== this.selectedAnimationId ||
      nextVariantId !== this.selectedVariantId
    ) {
      this.selectedAnimationId = nextAnimationId;
      this.selectedVariantId = nextVariantId;
      this.playSelectedAnimation(true);
    }
  }

  private playSelectedAnimation(forceRestart: boolean): void {
    const animation = getCharacterAnimation(this.selectedAnimationId, this.selectedVariantId);
    const playbackRate = this.app.debugStore.getState().characterGym.playbackRate;
    const persistedFps = this.fpsByVariant[this.selectedVariantId][this.selectedAnimationId];
    const timeScale = (persistedFps / animation.fps) * playbackRate;

    this.character.anims.timeScale = timeScale;
    this.character.setFlipX(animation.direction === 'w');

    if (forceRestart || this.character.anims.currentAnim?.key !== animation.animationKey) {
      this.character.play({ key: animation.animationKey, timeScale }, true);
      return;
    }

    if (!this.character.anims.isPlaying && !this.app.debugStore.getState().paused) {
      this.character.play(animation.animationKey, true);
    }
  }

  private drawBounds(): void {
    const state = this.app.debugStore.getState().characterGym;
    const activeBounds = this.boundsByVariant[this.selectedVariantId][this.selectedAnimationId];
    const activeFrames = this.hitFramesByVariant[this.selectedVariantId][this.selectedAnimationId];
    const currentFrame = this.getCurrentFrameIndex();
    const attackActive = activeFrames.attack[currentFrame] === true;
    const previewCenter = this.getPreviewCenter();
    const frameLeft = previewCenter.x - CHARACTER_CENTER.x * this.previewZoom;
    const frameTop = previewCenter.y - CHARACTER_CENTER.y * this.previewZoom;

    this.graphics.clear();
    this.graphics.lineStyle(1, 0xf8fafc, 0.45);
    this.graphics.strokeRect(
      frameLeft,
      frameTop,
      CHARACTER_FRAME.width * this.previewZoom,
      CHARACTER_FRAME.height * this.previewZoom
    );

    if (state.showVisualBounds) {
      this.drawRect(frameLeft, frameTop, activeBounds.visual, 0x38bdf8, 0.08, true);
    }

    if (state.showCollisionBounds) {
      this.drawRect(frameLeft, frameTop, activeBounds.collision, 0x39ff7a, 0.12, true);
    }

    if (state.showAttackBounds) {
      this.drawRect(frameLeft, frameTop, activeBounds.attack, 0xff4b3e, 0.12, attackActive);
    }
  }

  private drawRect(
    frameLeft: number,
    frameTop: number,
    rect: CharacterAnimationBounds['visual'],
    color: number,
    fillAlpha: number,
    isActive: boolean
  ): void {
    const displayRect = this.mirrorRectForRightFacing(rect);

    this.graphics.lineStyle(2, color, isActive ? 0.95 : 0.28);
    this.graphics.fillStyle(color, isActive ? fillAlpha : 0.025);
    this.graphics.strokeRect(
      frameLeft + displayRect.x * this.previewZoom,
      frameTop + displayRect.y * this.previewZoom,
      displayRect.width * this.previewZoom,
      displayRect.height * this.previewZoom
    );
    this.graphics.fillRect(
      frameLeft + displayRect.x * this.previewZoom,
      frameTop + displayRect.y * this.previewZoom,
      displayRect.width * this.previewZoom,
      displayRect.height * this.previewZoom
    );
  }

  private mirrorRectForRightFacing(rect: CharacterAnimationBounds['visual']) {
    const animation = getCharacterAnimation(this.selectedAnimationId, this.selectedVariantId);

    if (animation.direction !== 'w') {
      return rect;
    }

    return {
      ...rect,
      x: CHARACTER_FRAME.width - rect.x - rect.width
    };
  }

  private updateReadout(): void {
    const animation = getCharacterAnimation(this.selectedAnimationId, this.selectedVariantId);
    const variant = getCharacterVariant(this.selectedVariantId);

    this.titleText?.setText('Character Gym');
    this.detailText?.setText(
      `${CHARACTER_DISPLAY_NAME} ${variant.label} • ${animation.label} • frame ${
        this.getCurrentFrameIndex() + 1
      }/${animation.frames} • ${this.fpsByVariant[this.selectedVariantId][this.selectedAnimationId]}fps saved • ${
        this.app.debugStore.getState().characterGym.playbackRate
      }x • zoom ${this.previewZoom.toFixed(2)}x`
    );
  }

  private updateGymMarker(): void {
    this.character.setScale(this.previewZoom);
    globalThis.__ROBIN_CHUTE_CHARACTER_GYM__ = {
      active: true,
      selectedAnimationId: this.selectedAnimationId,
      selectedVariantId: this.selectedVariantId,
      boundsByVariant: this.boundsByVariant,
      fpsByVariant: this.fpsByVariant,
      hitFramesByVariant: this.hitFramesByVariant,
      currentFrame: this.getCurrentFrameIndex(),
      zoom: this.previewZoom
    };
  }

  private getCurrentFrameIndex(): number {
    const animation = getCharacterAnimation(this.selectedAnimationId, this.selectedVariantId);
    const currentIndex = this.character.anims.currentFrame?.index ?? 0;

    return Phaser.Math.Clamp(currentIndex, 0, animation.frames - 1);
  }

  private getPreviewCenter() {
    return {
      x: this.cameras.main.centerX,
      y: this.cameras.main.centerY
    };
  }

  private updateAssetLabels(): void {
    if (!this.app.debugStore.getState().showAssetLabels) {
      this.assetLabels = syncAssetLabels(this, this.assetLabels, []);
      return;
    }

    const animation = getCharacterAnimation(this.selectedAnimationId, this.selectedVariantId);
    const previewCenter = this.getPreviewCenter();

    this.assetLabels = syncAssetLabels(this, this.assetLabels, [
      {
        text: animation.key,
        x: previewCenter.x,
        y: previewCenter.y - CHARACTER_CENTER.y * this.previewZoom - 8,
        depth: 120,
        scrollFactor: 0
      }
    ]);
  }
}

function normalizeAnimationId(
  value: string | undefined,
  variantId: CharacterVariantId
): CharacterAnimationId {
  const animations = getCharacterAnimationsForVariant(variantId);

  return (
    animations.find((animation) => animation.id === value)?.id ??
    animations[0]?.id ??
    CHARACTER_ANIMATIONS[0].id
  );
}
