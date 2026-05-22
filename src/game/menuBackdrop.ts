import * as Phaser from 'phaser';

import type { ImageAsset } from './assets';

export const MENU_SPLASH_TEXTURE_KEY = 'menu-splash';
export const MENU_BACKGROUND_TEXTURE_KEY = 'menu-background';

export type MenuBackdropMode = 'splash' | 'menu';

export interface MenuBackdrop {
  image: Phaser.GameObjects.Image;
  scrim: Phaser.GameObjects.Rectangle;
}

export const MENU_ASSETS = [
  {
    kind: 'image',
    key: MENU_SPLASH_TEXTURE_KEY,
    url: '/assets/ui/menu/splash-1376x768.png',
    width: 1088,
    height: 608,
    usage: 'Stylized title poster splash art seeded from player portrait and menu palette'
  },
  {
    kind: 'image',
    key: MENU_BACKGROUND_TEXTURE_KEY,
    url: '/assets/ui/menu/background-1376x768.png',
    width: 1376,
    height: 768,
    usage: 'Soft persistent menu backdrop for main menu, level select, and settings'
  }
] satisfies ImageAsset[];

const MENU_BACKDROP_DEPTH = -100;
const MENU_SCRIM_DEPTH = -99;

/**
 * Scale an image to cover the full viewport while preserving aspect ratio.
 */
function fitCoverImage(image: Phaser.GameObjects.Image, viewWidth: number, viewHeight: number): void {
  const scale = Math.max(viewWidth / image.width, viewHeight / image.height);
  image.setScale(scale);
}

/**
 * Mount splash or menu background art with a readability scrim for UI overlays.
 */
export function createMenuBackdrop(scene: Phaser.Scene, mode: MenuBackdropMode): MenuBackdrop {
  const camera = scene.cameras.main;
  const textureKey = mode === 'splash' ? MENU_SPLASH_TEXTURE_KEY : MENU_BACKGROUND_TEXTURE_KEY;
  const scrimAlpha = mode === 'splash' ? 0.1 : 0.56;

  const image = scene.add
    .image(camera.centerX, camera.centerY, textureKey)
    .setScrollFactor(0)
    .setDepth(MENU_BACKDROP_DEPTH);
  fitCoverImage(image, camera.width, camera.height);

  const scrim = scene.add
    .rectangle(camera.centerX, camera.centerY, camera.width, camera.height, 0x020617, scrimAlpha)
    .setScrollFactor(0)
    .setDepth(MENU_SCRIM_DEPTH);

  return { image, scrim };
}
