import * as Phaser from 'phaser';

import { GAME_TITLE } from '../game/constants';
import { createMenuBackdrop } from '../game/menuBackdrop';
import { createTextButton, type TextButton } from '../game/ui';
import { DEFAULT_SETTINGS } from '../game/settings';
import { resetLevelProgress } from '../game/levelProgress';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

export class SettingsScene extends BaseScene {
  private sfxVolumeValue!: Phaser.GameObjects.Text;

  private musicVolumeValue!: Phaser.GameObjects.Text;

  private muteValue!: Phaser.GameObjects.Text;

  private sfxDownButton!: TextButton;

  private sfxUpButton!: TextButton;

  private musicDownButton!: TextButton;

  private musicUpButton!: TextButton;

  private muteButton!: TextButton;

  private resetButton!: TextButton;

  private clearProgressButton!: TextButton;

  private backButton!: TextButton;

  private selectedRow = 0;

  constructor() {
    super(SCENE_KEYS.Settings);
  }

  create(): void {
    this.enableAudioSettingsSync();
    this.markActiveScene(SCENE_KEYS.Settings);
    this.cameras.main.setBackgroundColor(0x020617);
    createMenuBackdrop(this, 'menu');
    this.createHeading('Settings', `${GAME_TITLE} audio preferences`);

    const centerX = this.cameras.main.centerX;
    const camera = this.cameras.main;
    const panel = this.add.image(centerX, camera.centerY, 'ui-panel');
    panel.setDisplaySize(540, 560);

    const valueStyle = {
      color: '#cbd5e1',
      fontFamily: 'monospace',
      fontSize: '24px'
    };

    this.sfxVolumeValue = this.add.text(centerX, 210, '', valueStyle).setOrigin(0.5);
    this.musicVolumeValue = this.add.text(centerX, 250, '', valueStyle).setOrigin(0.5);
    this.muteValue = this.add.text(centerX, 290, '', valueStyle).setOrigin(0.5);

    const buttonY = [335, 400, 465, 530, 595, 660];
    const wideButtonWidth = 320;
    const halfButtonWidth = 150;
    const buttonHeight = 58;

    this.sfxDownButton = createTextButton(this, {
      x: centerX - 85,
      y: buttonY[0],
      width: halfButtonWidth,
      height: buttonHeight,
      label: 'SFX -',
      onClick: () => this.changeSfxVolume(-0.1),
      onHover: () => this.setSelection(0)
    });

    this.sfxUpButton = createTextButton(this, {
      x: centerX + 85,
      y: buttonY[0],
      width: halfButtonWidth,
      height: buttonHeight,
      label: 'SFX +',
      onClick: () => this.changeSfxVolume(0.1),
      onHover: () => this.setSelection(0)
    });

    this.musicDownButton = createTextButton(this, {
      x: centerX - 85,
      y: buttonY[1],
      width: halfButtonWidth,
      height: buttonHeight,
      label: 'Music -',
      onClick: () => this.changeMusicVolume(-0.1),
      onHover: () => this.setSelection(1)
    });

    this.musicUpButton = createTextButton(this, {
      x: centerX + 85,
      y: buttonY[1],
      width: halfButtonWidth,
      height: buttonHeight,
      label: 'Music +',
      onClick: () => this.changeMusicVolume(0.1),
      onHover: () => this.setSelection(1)
    });

    this.muteButton = createTextButton(this, {
      x: centerX,
      y: buttonY[2],
      width: wideButtonWidth,
      height: buttonHeight,
      label: 'Toggle mute',
      onClick: () => this.toggleMute(),
      onHover: () => this.setSelection(2)
    });

    this.resetButton = createTextButton(this, {
      x: centerX,
      y: buttonY[3],
      width: wideButtonWidth,
      height: buttonHeight,
      label: 'Reset defaults',
      onClick: () => {
        this.app.settingsStore.setState(DEFAULT_SETTINGS);
        this.playConfirmSfx();
      },
      onHover: () => this.setSelection(3)
    });

    this.clearProgressButton = createTextButton(this, {
      x: centerX,
      y: buttonY[4],
      width: wideButtonWidth,
      height: buttonHeight,
      label: 'Clear progress',
      onClick: () => {
        resetLevelProgress();
        this.playConfirmSfx();
      },
      onHover: () => this.setSelection(4)
    });

    this.backButton = createTextButton(this, {
      x: centerX,
      y: buttonY[5],
      width: wideButtonWidth,
      height: buttonHeight,
      label: 'Back to menu',
      onClick: () => {
        this.playConfirmSfx();
        this.goToMenu();
      },
      onHover: () => this.setSelection(5)
    });

    this.setSelection(0);

    this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-W', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-S', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-LEFT', () => this.handleLeft());
    this.input.keyboard?.on('keydown-RIGHT', () => this.handleRight());
    this.input.keyboard?.on('keydown-ESC', () => this.goToMenu());
    this.input.keyboard?.on('keydown-ENTER', () => this.activateSelection());
    this.input.keyboard?.on('keydown-SPACE', () => this.activateSelection());

    const unsubscribe = this.app.settingsStore.subscribe((settings) => {
      this.sfxVolumeValue.setText(`SFX: ${Math.round(settings.sfxVolume * 100)}%`);
      this.musicVolumeValue.setText(`Music: ${Math.round(settings.musicVolume * 100)}%`);
      this.muteValue.setText(`Mute: ${settings.muted ? 'On' : 'Off'}`);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);

    this.createFooterHint('Up/Down select • Left/Right adjust • Enter/Space select • Esc back');
  }

  private changeSfxVolume(delta: number): void {
    const current = this.app.settingsStore.getState();
    const nextVolume = Math.max(0, Math.min(1, current.sfxVolume + delta));

    this.app.settingsStore.patchState({ sfxVolume: Number(nextVolume.toFixed(2)) });
    this.playConfirmSfx();
  }

  private changeMusicVolume(delta: number): void {
    const current = this.app.settingsStore.getState();
    const nextVolume = Math.max(0, Math.min(1, current.musicVolume + delta));

    this.app.settingsStore.patchState({ musicVolume: Number(nextVolume.toFixed(2)) });
    this.playConfirmSfx();
  }

  private toggleMute(): void {
    const settings = this.app.settingsStore.getState();
    this.app.settingsStore.patchState({ muted: !settings.muted });
    this.playConfirmSfx();
  }

  private moveSelection(direction: number): void {
    const nextIndex = Phaser.Math.Wrap(this.selectedRow + direction, 0, 6);
    this.setSelection(nextIndex);
  }

  private setSelection(index: number): void {
    this.selectedRow = index;
    this.sfxDownButton.setSelected(index === 0);
    this.sfxUpButton.setSelected(index === 0);
    this.musicDownButton.setSelected(index === 1);
    this.musicUpButton.setSelected(index === 1);
    this.muteButton.setSelected(index === 2);
    this.resetButton.setSelected(index === 3);
    this.clearProgressButton.setSelected(index === 4);
    this.backButton.setSelected(index === 5);
  }

  private activateSelection(): void {
    if (this.selectedRow === 2) {
      this.toggleMute();
      return;
    }

    if (this.selectedRow === 3) {
      this.app.settingsStore.setState(DEFAULT_SETTINGS);
      this.playConfirmSfx();
      return;
    }

    if (this.selectedRow === 4) {
      resetLevelProgress();
      this.playConfirmSfx();
      return;
    }

    if (this.selectedRow === 5) {
      this.playConfirmSfx();
      this.goToMenu();
    }
  }

  private handleLeft(): void {
    if (this.selectedRow === 0) {
      this.changeSfxVolume(-0.1);
      return;
    }

    if (this.selectedRow === 1) {
      this.changeMusicVolume(-0.1);
      return;
    }

    if (this.selectedRow === 2) {
      this.toggleMute();
    }
  }

  private handleRight(): void {
    if (this.selectedRow === 0) {
      this.changeSfxVolume(0.1);
      return;
    }

    if (this.selectedRow === 1) {
      this.changeMusicVolume(0.1);
      return;
    }

    if (this.selectedRow === 2) {
      this.toggleMute();
    }
  }
}
