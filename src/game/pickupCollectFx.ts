import * as Phaser from 'phaser';

export interface PickupFlyToHudConfig {
  scene: Phaser.Scene;
  worldX: number;
  worldY: number;
  textureKey: string;
  frame: string | number;
  targetX: number;
  targetY: number;
  depth?: number;
  onComplete(): void;
}

const FLY_DEPTH = 120;

/**
 * Plays a Candy Crush-style pop, arc, and swirl tween from a world pickup into HUD space.
 */
function resolveFlyArcY(startY: number, targetY: number): number {
  const topY = Math.min(startY, targetY);
  const bottomY = Math.max(startY, targetY);
  const span = bottomY - topY;
  const arcAlongPath = Phaser.Math.Linear(startY, targetY, 0.38);

  if (span < 48) {
    return Phaser.Math.Clamp(arcAlongPath - 10, topY, startY - 6);
  }

  return Phaser.Math.Clamp(arcAlongPath, topY + 8, bottomY - 16);
}

export function playPickupFlyToHud(config: PickupFlyToHudConfig): void {
  const camera = config.scene.cameras.main;
  const startX = config.worldX - camera.scrollX;
  const startY = config.worldY - camera.scrollY;
  const arcY = resolveFlyArcY(startY, config.targetY);
  const midX = Phaser.Math.Linear(startX, config.targetX, 0.45);

  const fly = config.scene.add
    .image(startX, startY, config.textureKey, config.frame)
    .setOrigin(0.5)
    .setScale(0.35)
    .setAlpha(0.95)
    .setDepth(config.depth ?? FLY_DEPTH)
    .setScrollFactor(0);

  const pop = config.scene.tweens.add({
    targets: fly,
    scale: { from: 0.35, to: 1.28 },
    y: startY - 12,
    duration: 160,
    ease: 'Back.easeOut'
  });

  pop.once('complete', () => {
    const arc = config.scene.tweens.add({
      targets: fly,
      x: midX,
      y: arcY,
      scale: 1.05,
      angle: 220,
      duration: 240,
      ease: 'Sine.easeOut'
    });

    arc.once('complete', () => {
      const land = config.scene.tweens.add({
        targets: fly,
        x: config.targetX,
        y: config.targetY,
        scale: 0.38,
        angle: '+=320',
        duration: 420,
        ease: 'Cubic.easeIn'
      });

      land.once('complete', () => {
        fly.destroy();
        config.onComplete();
      });
    });
  });
}

export interface ScrapCounterPunchConfig {
  scene: Phaser.Scene;
  badge: Phaser.GameObjects.Image;
  countText: Phaser.GameObjects.Text;
  flashDepth: number;
}

/**
 * Bobs the badge, flashes the panel, and pops the count text when scrap lands in the HUD.
 */
export function playScrapCounterCollectPunch(config: ScrapCounterPunchConfig): void {
  const { scene, badge, countText, flashDepth } = config;
  const baseScaleX = badge.scaleX;
  const baseScaleY = badge.scaleY;
  const baseY = badge.y;

  scene.tweens.add({
    targets: badge,
    scaleX: baseScaleX * 1.12,
    scaleY: baseScaleY * 1.12,
    y: baseY - 5,
    duration: 110,
    ease: 'Back.easeOut',
    yoyo: true
  });

  scene.tweens.add({
    targets: countText,
    scale: { from: 1, to: 1.38 },
    duration: 140,
    ease: 'Back.easeOut',
    yoyo: true,
    onYoyo: () => {
      countText.clearTint();
    },
    onStart: () => {
      countText.setTint(0xfff3b0);
    }
  });

  const flash = scene.add
    .rectangle(
      badge.x,
      badge.y,
      badge.displayWidth,
      badge.displayHeight,
      0xffffff,
      0.55
    )
    .setOrigin(0, 0)
    .setDepth(flashDepth)
    .setScrollFactor(0);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 220,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      flash.destroy();
    }
  });
}
