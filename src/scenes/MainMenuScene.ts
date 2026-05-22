import * as Phaser from 'phaser';

import { GAME_TAGLINE, GAME_TITLE } from '../game/constants';
import { createMenuBackdrop } from '../game/menuBackdrop';
import { createTextButton, type TextButton } from '../game/ui';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

interface MenuOption {
  label: string;
  action: () => void;
}

export class MainMenuScene extends BaseScene {
  private selectedIndex = 0;

  private buttons: TextButton[] = [];

  private options: MenuOption[] = [];

  constructor() {
    super(SCENE_KEYS.MainMenu);
  }

  create(): void {
    this.buttons = [];
    this.selectedIndex = 0;
    this.options = [];

    this.enableAudioSettingsSync();
    this.markActiveScene(SCENE_KEYS.MainMenu);
    this.cameras.main.setBackgroundColor(0x020617);
    createMenuBackdrop(this, 'menu');
    this.createHeading(GAME_TITLE, GAME_TAGLINE);
    this.renderMenu();

    const keyUp = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const keyDown = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    const keyEnter = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    keyUp?.on('down', () => this.moveSelection(-1));
    keyW?.on('down', () => this.moveSelection(-1));
    keyDown?.on('down', () => this.moveSelection(1));
    keyS?.on('down', () => this.moveSelection(1));
    keyEnter?.on('down', () => this.confirmOption(this.options[this.selectedIndex]));
    keySpace?.on('down', () => this.confirmOption(this.options[this.selectedIndex]));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearButtons();
      this.selectedIndex = 0;
      this.options = [];
    });

    this.createFooterHint('Arrow keys / WASD to navigate • Enter / Space to confirm');
  }

  private moveSelection(direction: number): void {
    const next = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.buttons.length);
    this.setSelection(next);
  }

  private setSelection(index: number): void {
    this.selectedIndex = index;
    this.buttons.forEach((button, buttonIndex) => {
      button.setSelected(buttonIndex === index);
    });
  }

  private renderMenu(): void {
    this.clearButtons();

    this.options = [
      { label: 'Play', action: () => this.scene.start(SCENE_KEYS.LevelSelect) },
      ...this.getDevelopmentOptions(),
      { label: 'Settings', action: () => this.scene.start(SCENE_KEYS.Settings) }
    ];

    const startY = 218;
    const spacing = 56;

    this.options.forEach((option, index) => {
      const button = createTextButton(this, {
        x: this.cameras.main.centerX,
        y: startY + index * spacing,
        width: 360,
        height: 68,
        label: option.label,
        onClick: () => this.confirmOption(option),
        onHover: () => this.setSelection(index)
      });

      this.buttons.push(button);
    });

    this.setSelection(0);
  }

  private getDevelopmentOptions(): MenuOption[] {
    if (import.meta.env.PROD) {
      return [];
    }

    return [
      {
        label: 'Character Playground',
        action: () => this.scene.start(SCENE_KEYS.CharacterPlayground)
      },
      { label: 'Character Gym', action: () => this.scene.start(SCENE_KEYS.CharacterGym) }
    ];
  }

  private clearButtons(): void {
    this.buttons.forEach((button) => {
      button.destroy();
    });
    this.buttons = [];
  }

  private confirmOption(option?: MenuOption): void {
    if (!option) {
      return;
    }

    this.playConfirmSfx();
    option.action();
  }
}
