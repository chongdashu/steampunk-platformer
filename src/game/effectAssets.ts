import * as Phaser from 'phaser';

export interface EffectSpritesheetAsset {
  id: string;
  label: string;
  key: string;
  animationKey: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  columns: number;
  rows: number;
  fps: number;
  repeat: number;
  sourceRun: string;
}

export const TURRET_CANNONBALL_EFFECT: EffectSpritesheetAsset = {
  id: 'turret-cannonball-projectile',
  label: 'Turret cannonball projectile',
  key: 'turret-cannonball-projectile',
  animationKey: 'turret-cannonball-fly',
  url: '/assets/enemies/turret/effects/cannonball-projectile.png',
  frameWidth: 64,
  frameHeight: 64,
  frames: 6,
  columns: 6,
  rows: 1,
  fps: 10,
  repeat: -1,
  sourceRun: 'runs/20260518-132315-turret-projectile-effects'
};

export const TURRET_CANNONBALL_IMPACT_ANIMATION_KEY = 'turret-cannonball-impact';

export const TURRET_MUZZLE_SMOKE_EFFECT: EffectSpritesheetAsset = {
  id: 'turret-muzzle-smoke',
  label: 'Turret muzzle smoke',
  key: 'turret-muzzle-smoke',
  animationKey: 'turret-muzzle-smoke',
  url: '/assets/enemies/turret/effects/muzzle-smoke.png',
  frameWidth: 96,
  frameHeight: 96,
  frames: 7,
  columns: 7,
  rows: 1,
  fps: 14,
  repeat: 0,
  sourceRun: 'runs/20260518-132315-turret-projectile-effects'
};

export const EFFECT_SPRITESHEETS = [
  TURRET_CANNONBALL_EFFECT,
  TURRET_MUZZLE_SMOKE_EFFECT
] satisfies EffectSpritesheetAsset[];

export function registerEffectAnimations(scene: Phaser.Scene): void {
  if (!scene.anims.exists(TURRET_CANNONBALL_EFFECT.animationKey)) {
    scene.anims.create({
      key: TURRET_CANNONBALL_EFFECT.animationKey,
      frames: scene.anims.generateFrameNumbers(TURRET_CANNONBALL_EFFECT.key, {
        start: 0,
        end: 3
      }),
      frameRate: TURRET_CANNONBALL_EFFECT.fps,
      repeat: TURRET_CANNONBALL_EFFECT.repeat
    });
  }

  if (!scene.anims.exists(TURRET_CANNONBALL_IMPACT_ANIMATION_KEY)) {
    scene.anims.create({
      key: TURRET_CANNONBALL_IMPACT_ANIMATION_KEY,
      frames: scene.anims.generateFrameNumbers(TURRET_CANNONBALL_EFFECT.key, {
        start: 4,
        end: 5
      }),
      frameRate: 12,
      repeat: 0
    });
  }

  if (!scene.anims.exists(TURRET_MUZZLE_SMOKE_EFFECT.animationKey)) {
    scene.anims.create({
      key: TURRET_MUZZLE_SMOKE_EFFECT.animationKey,
      frames: scene.anims.generateFrameNumbers(TURRET_MUZZLE_SMOKE_EFFECT.key, {
        start: 0,
        end: TURRET_MUZZLE_SMOKE_EFFECT.frames - 1
      }),
      frameRate: TURRET_MUZZLE_SMOKE_EFFECT.fps,
      repeat: TURRET_MUZZLE_SMOKE_EFFECT.repeat
    });
  }
}
