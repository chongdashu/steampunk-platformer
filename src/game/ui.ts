import * as Phaser from 'phaser';

import { playPickupFlyToHud, playScrapCounterCollectPunch } from './pickupCollectFx';

export const PLAYER_HUD_PORTRAIT_KEY = 'player-hud-portrait';
export const PLAYER_HUD_HEALTH_FRAME_KEY = 'player-hud-health-frame';
export const SCRAP_COUNTER_BADGE_KEY = 'scrap-counter-badge';

/** Dark count-panel inset on `scrap-counter-badge.png` for runtime text overlay. */
export const SCRAP_COUNTER_TEXT_SLOT = {
  x: 12,
  y: 10,
  width: 258,
  height: 71
} as const;

export interface TextButton {
  group: Phaser.GameObjects.Container;
  setSelected(selected: boolean): void;
  destroy(): void;
}

interface TextButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onClick(): void;
  onHover?(): void;
}

export interface PlayerHealthHud {
  update(health: number, maxHealth: number, time: number): void;
  destroy(): void;
}

export interface ScrapCounterHud {
  setCount(collected: number, total: number): void;
  playPickupCollect(
    worldX: number,
    worldY: number,
    textureKey: string,
    frame: string | number
  ): void;
  destroy(): void;
}

interface PlayerHealthHudConfig {
  x: number;
  y: number;
  depth?: number;
  frameScale?: number;
  portraitSize?: number;
}

const HEALTH_FRAME_FILL_SLOT = {
  x: 138,
  y: 231,
  width: 763,
  height: 94
};

const DEFAULT_HEALTH_HUD_DEPTH = 94;
const DEFAULT_HEALTH_FRAME_SCALE = 0.31;
const DEFAULT_PORTRAIT_SIZE = 96;

function getPlayerHealthColor(ratio: number): number {
  if (ratio > 0.66) {
    return 0x39ff7a;
  }

  if (ratio > 0.33) {
    return 0xf59e0b;
  }

  return 0xef4444;
}

export function createPlayerHealthHud(
  scene: Phaser.Scene,
  config: PlayerHealthHudConfig
): PlayerHealthHud {
  const depth = config.depth ?? DEFAULT_HEALTH_HUD_DEPTH;
  const frameScale = config.frameScale ?? DEFAULT_HEALTH_FRAME_SCALE;
  const portraitSize = config.portraitSize ?? DEFAULT_PORTRAIT_SIZE;
  const frameX = config.x + portraitSize * 0.76;
  const frameY = config.y - 7;
  const slot = {
    x: frameX + HEALTH_FRAME_FILL_SLOT.x * frameScale,
    y: frameY + HEALTH_FRAME_FILL_SLOT.y * frameScale,
    width: HEALTH_FRAME_FILL_SLOT.width * frameScale,
    height: HEALTH_FRAME_FILL_SLOT.height * frameScale
  };

  const fillGraphics = scene.add.graphics().setDepth(depth).setScrollFactor(0);
  const portrait = scene.add
    .image(config.x, config.y + 16, PLAYER_HUD_PORTRAIT_KEY)
    .setOrigin(0, 0)
    .setDisplaySize(portraitSize, portraitSize)
    .setDepth(depth + 2)
    .setScrollFactor(0);
  const frame = scene.add
    .image(frameX, frameY, PLAYER_HUD_HEALTH_FRAME_KEY)
    .setOrigin(0, 0)
    .setScale(frameScale)
    .setDepth(depth + 3)
    .setScrollFactor(0);

  let lastHealth = Number.POSITIVE_INFINITY;
  let flashUntil = 0;

  const draw = (health: number, maxHealth: number, time: number): void => {
    const ratio = maxHealth > 0 ? Phaser.Math.Clamp(health / maxHealth, 0, 1) : 0;
    const fillWidth = Math.max(0, slot.width * ratio);
    const color = getPlayerHealthColor(ratio);
    const isLow = ratio > 0 && ratio <= 0.33;
    const lowPulse = isLow ? 0.62 + 0.38 * Math.sin(time / 85) : 1;

    if (health < lastHealth) {
      flashUntil = time + 280;
    }
    lastHealth = health;

    fillGraphics.clear();
    fillGraphics.fillStyle(0x07131b, 0.92);
    fillGraphics.fillRoundedRect(slot.x, slot.y, slot.width, slot.height, 5);

    if (fillWidth > 0) {
      fillGraphics.fillStyle(color, 0.92 * lowPulse);
      fillGraphics.fillRoundedRect(slot.x, slot.y, fillWidth, slot.height, 5);
      fillGraphics.fillStyle(0xfef3c7, 0.16 * lowPulse);
      fillGraphics.fillRoundedRect(slot.x, slot.y, fillWidth, slot.height * 0.34, 4);
    }

    if (time < flashUntil) {
      const flashAlpha = Phaser.Math.Clamp((flashUntil - time) / 280, 0, 1);
      fillGraphics.fillStyle(0xffffff, 0.45 * flashAlpha);
      fillGraphics.fillRoundedRect(slot.x, slot.y, slot.width, slot.height, 5);
      portrait.setTint(0xffd6d6);
    } else if (isLow && Math.sin(time / 95) > 0.2) {
      portrait.setTint(0xffb4a8);
    } else {
      portrait.clearTint();
    }
  };

  draw(1, 1, scene.time.now);

  return {
    update: draw,
    destroy: () => {
      fillGraphics.destroy();
      portrait.destroy();
      frame.destroy();
    }
  };
}

interface ScrapCounterHudConfig {
  x: number;
  y: number;
  depth?: number;
  badgeScale?: number;
  fontSize?: number;
}

const DEFAULT_SCRAP_COUNTER_DEPTH = 94;
const DEFAULT_SCRAP_COUNTER_SCALE = 1.1;

/**
 * Renders the scrap-collected badge with a dynamic count centered in the dark panel.
 */
export function createScrapCounterHud(
  scene: Phaser.Scene,
  config: ScrapCounterHudConfig
): ScrapCounterHud {
  const depth = config.depth ?? DEFAULT_SCRAP_COUNTER_DEPTH;
  const badgeScale = config.badgeScale ?? DEFAULT_SCRAP_COUNTER_SCALE;
  const fontSize = config.fontSize ?? Math.round(34 * badgeScale);
  const slot = SCRAP_COUNTER_TEXT_SLOT;
  const slotCenterX = config.x + (slot.x + slot.width / 2) * badgeScale;
  const slotCenterY = config.y + (slot.y + slot.height / 2) * badgeScale;
  const flyTargetX = config.x + 46 * badgeScale;
  const flyTargetY = config.y + 46 * badgeScale;

  let displayedCollected = 0;
  let totalPickups = 0;

  const badge = scene.add
    .image(config.x, config.y, SCRAP_COUNTER_BADGE_KEY)
    .setOrigin(0, 0)
    .setScale(badgeScale)
    .setDepth(depth + 1)
    .setScrollFactor(0);
  const countText = scene.add
    .text(slotCenterX, slotCenterY, '0/0', {
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold'
    })
    .setOrigin(0.5, 0.5)
    .setDepth(depth + 2)
    .setScrollFactor(0);

  const applyCount = (collected: number, total: number): void => {
    displayedCollected = collected;
    totalPickups = total;
    countText.setText(`${collected}/${total}`);
  };

  return {
    setCount: applyCount,
    playPickupCollect: (worldX, worldY, textureKey, frame) => {
      playPickupFlyToHud({
        scene,
        worldX,
        worldY,
        textureKey,
        frame,
        targetX: flyTargetX,
        targetY: flyTargetY,
        onComplete: () => {
          applyCount(displayedCollected + 1, totalPickups);
          playScrapCounterCollectPunch({
            scene,
            badge,
            countText,
            flashDepth: depth + 4
          });
        }
      });
    },
    destroy: () => {
      scene.tweens.killTweensOf(badge);
      scene.tweens.killTweensOf(countText);
      badge.destroy();
      countText.destroy();
    }
  };
}

export function createTextButton(scene: Phaser.Scene, config: TextButtonConfig): TextButton {
  const background = scene.add.image(config.x, config.y, 'ui-button');
  const label = scene.add.text(config.x, config.y, config.label, {
    color: '#e2e8f0',
    fontFamily: 'monospace',
    fontSize: '22px'
  });

  background.setDisplaySize(config.width, config.height);
  background.setInteractive({ useHandCursor: true });
  label.setOrigin(0.5);

  const group = scene.add.container(0, 0, [background, label]);

  const setSelected = (selected: boolean): void => {
    background.setTexture(selected ? 'ui-button-active' : 'ui-button');
    label.setColor(selected ? '#f8fafc' : '#e2e8f0');
  };

  background.on('pointerover', () => {
    config.onHover?.();
  });
  background.on('pointerdown', () => {
    config.onClick();
  });

  setSelected(false);

  return {
    group,
    setSelected,
    destroy: () => {
      group.destroy(true);
    }
  };
}
