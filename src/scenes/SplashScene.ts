import { GAME_TAGLINE, GAME_TITLE } from '../game/constants';
import { createMenuBackdrop } from '../game/menuBackdrop';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

export class SplashScene extends BaseScene {
  private hasAdvanced = false;

  constructor() {
    super(SCENE_KEYS.Splash);
  }

  create(): void {
    this.markActiveScene(SCENE_KEYS.Splash);

    const camera = this.cameras.main;
    camera.setBackgroundColor(0x020617);
    createMenuBackdrop(this, 'splash');

    const titleY = Math.round(camera.height * 0.24);

    this.add
      .text(camera.centerX, titleY, GAME_TITLE.toUpperCase(), {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '48px',
        stroke: '#0f172a',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(camera.centerX, titleY + 44, GAME_TAGLINE, {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '18px',
        stroke: '#0f172a',
        strokeThickness: 5
      })
      .setOrigin(0.5)
      .setDepth(10);

    const continueHint = this.add
      .text(camera.centerX, Math.round(camera.centerY + 24), 'Press Enter, Space, or click to continue', {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '16px',
        stroke: '#0f172a',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.tweens.add({
      targets: continueHint,
      alpha: { from: 1, to: 0.2 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const advanceToMenu = (): void => {
      if (this.hasAdvanced) {
        return;
      }

      this.hasAdvanced = true;
      this.scene.start(SCENE_KEYS.MainMenu);
    };

    this.input.once('pointerup', advanceToMenu);
    this.input.keyboard?.once('keydown-ENTER', advanceToMenu);
    this.input.keyboard?.once('keydown-SPACE', advanceToMenu);
  }
}
