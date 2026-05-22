import { preloadStarterAssets, registerStarterAnimations } from '../game/assets';
import { registerGeneratedAssets } from '../game/generatedAssets';
import {
  PLATFORMING_METADATA_ASSET_KEY,
  PLATFORMING_METADATA_FILE
} from '../game/platformingElements';
import { SCENE_KEYS } from '../game/types';
import { BaseScene } from './BaseScene';

export class BootScene extends BaseScene {
  constructor() {
    super(SCENE_KEYS.Boot);
  }

  preload(): void {
    preloadStarterAssets(this);
    this.load.json(PLATFORMING_METADATA_ASSET_KEY, PLATFORMING_METADATA_FILE);
  }

  create(): void {
    this.markActiveScene(SCENE_KEYS.Boot);
    registerGeneratedAssets(this);
    registerStarterAnimations(this);
    this.scene.start(SCENE_KEYS.Splash);
  }
}
