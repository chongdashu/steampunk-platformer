import * as Phaser from 'phaser';

import { GAME_PROFILES } from './profiles';
import type { GameProfile } from './types';
import { BootScene } from '../scenes/BootScene';
import { SplashScene } from '../scenes/SplashScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { LevelSelectScene } from '../scenes/LevelSelectScene';
import { GameScene } from '../scenes/GameScene';
import { CharacterPlaygroundScene } from '../scenes/CharacterPlaygroundScene';
import { CharacterGymScene } from '../scenes/CharacterGymScene';
import { SettingsScene } from '../scenes/SettingsScene';

export function createGame(parent: HTMLElement, profile: GameProfile): Phaser.Game {
  const config = GAME_PROFILES[profile];
  const releaseScenes = [
    BootScene,
    SplashScene,
    MainMenuScene,
    LevelSelectScene,
    GameScene,
    SettingsScene
  ];
  const developmentScenes = [
    ...releaseScenes,
    CharacterPlaygroundScene,
    CharacterGymScene
  ];

  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    width: config.width,
    height: config.height,
    backgroundColor: '#020617',
    transparent: true,
    roundPixels: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    },
    scene: import.meta.env.PROD ? releaseScenes : developmentScenes
  });
}
