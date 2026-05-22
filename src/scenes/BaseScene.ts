import * as Phaser from 'phaser';

import {
  AUDIO_KEYS,
  applyAudioSettings,
  playSfx,
  startMainMusic,
  stopMainMusic,
  type AudioKey
} from '../game/audio';
import { getAppContext } from '../game/context';
import type { AppContext } from '../game/context';
import { SCENE_KEYS, type SceneKey } from '../game/types';

export abstract class BaseScene extends Phaser.Scene {
  protected get app(): AppContext {
    return getAppContext();
  }

  protected markActiveScene(sceneKey: SceneKey): void {
    this.app.debugStore.patchState({ activeScene: sceneKey });
  }

  protected enableAudioSettingsSync(): void {
    applyAudioSettings(this, this.app.settingsStore.getState());
    const unsubscribe = this.app.settingsStore.subscribe((settings) => {
      applyAudioSettings(this, settings);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
  }

  protected syncAudioDebugPreview(): void {
    const request = this.app.debugStore.getState().audioPreview;
    const handledSerial = this.registry.get('audioPreviewSerial') as number | undefined;

    if (handledSerial === request.serial) {
      return;
    }

    this.registry.set('audioPreviewSerial', request.serial);

    if (request.kind === 'sfx') {
      this.playSfx(AUDIO_KEYS.playerJump);
      return;
    }

    if (request.kind === 'music') {
      this.stopMainMusic();
      this.startMainMusic();
      return;
    }

    this.stopMainMusic();
  }

  protected playSfx(key: AudioKey, config?: Phaser.Types.Sound.SoundConfig): void {
    playSfx(this, key, config, this.app.settingsStore.getState());
  }

  protected playConfirmSfx(): void {
    this.playSfx(AUDIO_KEYS.uiConfirm);
  }

  protected playDenySfx(): void {
    this.playSfx(AUDIO_KEYS.uiDeny);
  }

  protected startMainMusic(): void {
    startMainMusic(this, this.app.settingsStore.getState());
  }

  protected stopMainMusic(): void {
    stopMainMusic(this);
  }

  protected createHeading(title: string, subtitle: string): void {
    const { centerX } = this.cameras.main;

    this.add
      .text(centerX, 56, title, {
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: '34px'
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 92, subtitle, {
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: '16px'
      })
      .setOrigin(0.5);
  }

  protected createFooterHint(text: string): void {
    const { centerX, height } = this.cameras.main;

    this.add
      .text(centerX, height - 28, text, {
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: '14px'
      })
      .setOrigin(0.5);
  }

  protected goToMenu(): void {
    this.scene.start(SCENE_KEYS.MainMenu);
  }
}
